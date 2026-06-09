from __future__ import annotations

import base64
import hashlib
import json
import mimetypes
import os
import secrets
import sqlite3
import sys
from datetime import datetime, timezone
from http import HTTPStatus
from http.cookies import SimpleCookie
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse


ROOT = Path(__file__).resolve().parent
DB_PATH = ROOT / "motion_lab.sqlite3"
COOKIE_NAME = "ae_motion_session"
SESSION_MAX_AGE = 60 * 60 * 24 * 30
ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin").strip().lower() or "admin"
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "")
ADMIN_DISPLAY_NAME = os.environ.get("ADMIN_DISPLAY_NAME", "Admin").strip() or "Admin"


def now_iso() -> str:
  return datetime.now(timezone.utc).isoformat(timespec="seconds")


def db() -> sqlite3.Connection:
  conn = sqlite3.connect(DB_PATH)
  conn.row_factory = sqlite3.Row
  return conn


def hash_password(password: str, salt: bytes | None = None) -> tuple[str, str]:
  if salt is None:
    salt = os.urandom(16)
  digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 120_000)
  return (
    base64.b64encode(salt).decode("ascii"),
    base64.b64encode(digest).decode("ascii"),
  )


def verify_password(password: str, salt_text: str, hash_text: str) -> bool:
  salt = base64.b64decode(salt_text.encode("ascii"))
  _, candidate = hash_password(password, salt)
  return secrets.compare_digest(candidate, hash_text)


def init_db() -> None:
  with db() as conn:
    conn.executescript(
      """
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        display_name TEXT NOT NULL,
        password_salt TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS favorites (
        user_id INTEGER NOT NULL,
        preset_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        PRIMARY KEY (user_id, preset_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS recent (
        user_id INTEGER NOT NULL,
        preset_id TEXT NOT NULL,
        copied_at TEXT NOT NULL,
        PRIMARY KEY (user_id, preset_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        reporter_name TEXT NOT NULL,
        username TEXT,
        title TEXT NOT NULL,
        detail TEXT NOT NULL,
        page TEXT NOT NULL,
        preset_id TEXT,
        status TEXT NOT NULL DEFAULT 'open',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      );
      """
    )

    existing_admin = conn.execute(
      "SELECT id, password_salt, password_hash FROM users WHERE username = ?", (ADMIN_USERNAME,)
    ).fetchone()
    if ADMIN_PASSWORD:
      salt, password_hash = hash_password(ADMIN_PASSWORD)
      if existing_admin is None:
        conn.execute(
          """
          INSERT INTO users (username, display_name, password_salt, password_hash, role, created_at)
          VALUES (?, ?, ?, ?, 'admin', ?)
          """,
          (ADMIN_USERNAME, ADMIN_DISPLAY_NAME, salt, password_hash, now_iso()),
        )
      else:
        conn.execute(
          """
          UPDATE users
          SET password_salt = ?, password_hash = ?, role = 'admin', display_name = ?
          WHERE username = ?
          """,
          (salt, password_hash, ADMIN_DISPLAY_NAME, ADMIN_USERNAME),
        )
    elif existing_admin is not None:
      salt, password_hash = hash_password(secrets.token_urlsafe(24))
      conn.execute(
        """
        UPDATE users
        SET password_salt = ?, password_hash = ?
        WHERE username = ?
        """,
        (salt, password_hash, ADMIN_USERNAME),
      )


def row_to_user(row: sqlite3.Row | None) -> dict | None:
  if row is None:
    return None
  return {
    "id": row["id"],
    "username": row["username"],
    "displayName": row["display_name"],
    "role": row["role"],
    "createdAt": row["created_at"],
  }


def create_session(user_id: int) -> str:
  token = secrets.token_urlsafe(32)
  with db() as conn:
    conn.execute(
      "INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)",
      (token, user_id, now_iso()),
    )
  return token


def get_user_by_session(token: str | None) -> dict | None:
  if not token:
    return None
  with db() as conn:
    row = conn.execute(
      """
      SELECT users.* FROM sessions
      JOIN users ON users.id = sessions.user_id
      WHERE sessions.token = ?
      """,
      (token,),
    ).fetchone()
  return row_to_user(row)


def favorites_for_user(user_id: int) -> list[str]:
  with db() as conn:
    rows = conn.execute(
      "SELECT preset_id FROM favorites WHERE user_id = ? ORDER BY created_at DESC",
      (user_id,),
    ).fetchall()
  return [row["preset_id"] for row in rows]


def recent_for_user(user_id: int) -> list[str]:
  with db() as conn:
    rows = conn.execute(
      "SELECT preset_id FROM recent WHERE user_id = ? ORDER BY copied_at DESC LIMIT 20",
      (user_id,),
    ).fetchall()
  return [row["preset_id"] for row in rows]


def admin_summary() -> dict:
  with db() as conn:
    users = conn.execute(
      "SELECT id, username, display_name, role, created_at FROM users ORDER BY created_at DESC"
    ).fetchall()
    favorite_count = conn.execute("SELECT COUNT(*) AS count FROM favorites").fetchone()["count"]
    top_rows = conn.execute(
      """
      SELECT preset_id, COUNT(*) AS count
      FROM favorites
      GROUP BY preset_id
      ORDER BY count DESC, preset_id ASC
      LIMIT 10
      """
    ).fetchall()
    feedback_count = conn.execute(
      "SELECT COUNT(*) AS count FROM feedback"
    ).fetchone()["count"]
    open_feedback_count = conn.execute(
      "SELECT COUNT(*) AS count FROM feedback WHERE status = 'open'"
    ).fetchone()["count"]
    feedback_rows = conn.execute(
      """
      SELECT id, reporter_name, username, title, detail, page, preset_id, status, created_at, updated_at
      FROM feedback
      ORDER BY
        CASE status WHEN 'open' THEN 0 ELSE 1 END,
        created_at DESC
      LIMIT 30
      """
    ).fetchall()

    result_users = []
    for user in users:
      fav_rows = conn.execute(
        """
        SELECT preset_id, created_at
        FROM favorites
        WHERE user_id = ?
        ORDER BY created_at DESC
        """,
        (user["id"],),
      ).fetchall()
      recent_rows = conn.execute(
        """
        SELECT preset_id, copied_at
        FROM recent
        WHERE user_id = ?
        ORDER BY copied_at DESC
        LIMIT 10
        """,
        (user["id"],),
      ).fetchall()
      result_users.append(
        {
          "id": user["id"],
          "username": user["username"],
          "displayName": user["display_name"],
          "role": user["role"],
          "createdAt": user["created_at"],
          "favorites": [
            {"presetId": row["preset_id"], "createdAt": row["created_at"]}
            for row in fav_rows
          ],
          "recent": [
            {"presetId": row["preset_id"], "copiedAt": row["copied_at"]}
            for row in recent_rows
          ],
        }
      )

  return {
    "users": result_users,
    "favoriteCount": favorite_count,
    "topFavorites": [
      {"presetId": row["preset_id"], "count": row["count"]} for row in top_rows
    ],
    "feedbackCount": feedback_count,
    "openFeedbackCount": open_feedback_count,
    "feedback": [
      {
        "id": row["id"],
        "reporterName": row["reporter_name"],
        "username": row["username"],
        "title": row["title"],
        "detail": row["detail"],
        "page": row["page"],
        "presetId": row["preset_id"],
        "status": row["status"],
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"],
      }
      for row in feedback_rows
    ],
  }


def session_payload(user: dict | None) -> dict:
  if not user:
    return {"user": None, "favorites": [], "recent": []}

  payload = {
    "user": user,
    "favorites": favorites_for_user(user["id"]),
    "recent": recent_for_user(user["id"]),
  }
  if user["role"] == "admin":
    payload["admin"] = admin_summary()
  return payload


class MotionLabHandler(SimpleHTTPRequestHandler):
  server_version = "MotionSnippetLab/1.0"

  def log_message(self, format: str, *args) -> None:
    sys.stderr.write("%s - %s\n" % (self.address_string(), format % args))

  def do_GET(self) -> None:
    parsed = urlparse(self.path)
    if parsed.path == "/api/session":
      self.send_json(session_payload(self.current_user()))
      return

    if parsed.path == "/api/admin/summary":
      user = self.require_user()
      if user is None:
        return
      if user["role"] != "admin":
        self.send_json({"error": "Admin only"}, HTTPStatus.FORBIDDEN)
        return
      self.send_json(admin_summary())
      return

    self.serve_static(parsed.path)

  def do_POST(self) -> None:
    parsed = urlparse(self.path)
    if parsed.path == "/api/login":
      self.handle_login()
      return
    if parsed.path == "/api/register":
      self.handle_register()
      return
    if parsed.path == "/api/logout":
      self.handle_logout()
      return
    if parsed.path == "/api/recent":
      self.handle_recent()
      return
    if parsed.path == "/api/feedback":
      self.handle_feedback()
      return
    self.send_json({"error": "Not found"}, HTTPStatus.NOT_FOUND)

  def do_PUT(self) -> None:
    parsed = urlparse(self.path)
    admin_feedback_prefix = "/api/admin/feedback/"
    if parsed.path.startswith(admin_feedback_prefix):
      feedback_id = unquote(parsed.path[len(admin_feedback_prefix):])
      self.handle_admin_feedback(feedback_id)
      return

    prefix = "/api/favorites/"
    if parsed.path.startswith(prefix):
      preset_id = unquote(parsed.path[len(prefix):])
      self.handle_favorite(preset_id)
      return
    self.send_json({"error": "Not found"}, HTTPStatus.NOT_FOUND)

  def read_json(self) -> dict:
    length = int(self.headers.get("Content-Length", "0"))
    if length <= 0:
      return {}
    raw = self.rfile.read(length).decode("utf-8")
    return json.loads(raw or "{}")

  def send_json(self, payload: dict, status: int = HTTPStatus.OK, cookie: str | None = None) -> None:
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    self.send_response(status)
    self.send_header("Content-Type", "application/json; charset=utf-8")
    self.send_header("Content-Length", str(len(body)))
    self.send_header("Cache-Control", "no-store")
    if cookie:
      self.send_header("Set-Cookie", cookie)
    self.end_headers()
    self.wfile.write(body)

  def send_error_json(self, message: str, status: int = HTTPStatus.BAD_REQUEST) -> None:
    self.send_json({"error": message}, status)

  def cookie_token(self) -> str | None:
    cookie_header = self.headers.get("Cookie")
    if not cookie_header:
      return None
    cookies = SimpleCookie(cookie_header)
    morsel = cookies.get(COOKIE_NAME)
    return morsel.value if morsel else None

  def current_user(self) -> dict | None:
    return get_user_by_session(self.cookie_token())

  def require_user(self) -> dict | None:
    user = self.current_user()
    if user is None:
      self.send_json({"error": "Login required"}, HTTPStatus.UNAUTHORIZED)
      return None
    return user

  def session_cookie(self, token: str) -> str:
    return f"{COOKIE_NAME}={token}; Max-Age={SESSION_MAX_AGE}; Path=/; HttpOnly; SameSite=Lax"

  def clear_cookie(self) -> str:
    return f"{COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax"

  def require_admin(self) -> dict | None:
    user = self.require_user()
    if user is None:
      return None
    if user["role"] != "admin":
      self.send_json({"error": "Admin only"}, HTTPStatus.FORBIDDEN)
      return None
    return user

  def handle_login(self) -> None:
    data = self.read_json()
    username = str(data.get("username", "")).strip().lower()
    password = str(data.get("password", ""))

    if not username or not password:
      self.send_error_json("Username and password required")
      return

    with db() as conn:
      row = conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()

    if row is None or not verify_password(password, row["password_salt"], row["password_hash"]):
      self.send_error_json("Invalid username or password", HTTPStatus.UNAUTHORIZED)
      return

    token = create_session(row["id"])
    self.send_json(session_payload(row_to_user(row)), cookie=self.session_cookie(token))

  def handle_register(self) -> None:
    data = self.read_json()
    username = str(data.get("username", "")).strip().lower()
    password = str(data.get("password", ""))
    display_name = str(data.get("displayName", "")).strip() or username

    if len(username) < 3 or not username.replace("_", "").replace("-", "").isalnum():
      self.send_error_json("Username ต้องยาวอย่างน้อย 3 ตัว และใช้ a-z, 0-9, _ หรือ -")
      return
    if len(password) < 4:
      self.send_error_json("Password ต้องยาวอย่างน้อย 4 ตัว")
      return

    salt, password_hash = hash_password(password)
    try:
      with db() as conn:
        cursor = conn.execute(
          """
          INSERT INTO users (username, display_name, password_salt, password_hash, role, created_at)
          VALUES (?, ?, ?, ?, 'user', ?)
          """,
          (username, display_name, salt, password_hash, now_iso()),
        )
        user_id = cursor.lastrowid
        row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    except sqlite3.IntegrityError:
      self.send_error_json("Username นี้มีแล้ว")
      return

    token = create_session(user_id)
    self.send_json(session_payload(row_to_user(row)), cookie=self.session_cookie(token))

  def handle_logout(self) -> None:
    token = self.cookie_token()
    if token:
      with db() as conn:
        conn.execute("DELETE FROM sessions WHERE token = ?", (token,))
    self.send_json({"ok": True}, cookie=self.clear_cookie())

  def handle_favorite(self, preset_id: str) -> None:
    user = self.require_user()
    if user is None:
      return

    data = self.read_json()
    favorite = bool(data.get("favorite", True))

    with db() as conn:
      if favorite:
        conn.execute(
          """
          INSERT OR IGNORE INTO favorites (user_id, preset_id, created_at)
          VALUES (?, ?, ?)
          """,
          (user["id"], preset_id, now_iso()),
        )
      else:
        conn.execute(
          "DELETE FROM favorites WHERE user_id = ? AND preset_id = ?",
          (user["id"], preset_id),
        )

    self.send_json(session_payload(user))

  def handle_recent(self) -> None:
    user = self.require_user()
    if user is None:
      return

    data = self.read_json()
    preset_id = str(data.get("presetId", "")).strip()
    if not preset_id:
      self.send_error_json("presetId required")
      return

    with db() as conn:
      conn.execute(
        """
        INSERT INTO recent (user_id, preset_id, copied_at)
        VALUES (?, ?, ?)
        ON CONFLICT(user_id, preset_id)
        DO UPDATE SET copied_at = excluded.copied_at
        """,
        (user["id"], preset_id, now_iso()),
      )
      conn.execute(
        """
        DELETE FROM recent
        WHERE user_id = ?
          AND preset_id NOT IN (
            SELECT preset_id FROM recent
            WHERE user_id = ?
            ORDER BY copied_at DESC
            LIMIT 20
          )
        """,
        (user["id"], user["id"]),
      )

    self.send_json(session_payload(user))

  def handle_feedback(self) -> None:
    data = self.read_json()
    user = self.current_user()
    reporter_name = str(data.get("name", "")).strip()
    title = str(data.get("title", "")).strip()
    detail = str(data.get("detail", "")).strip()
    page = str(data.get("page", "")).strip() or "/"
    preset_id = str(data.get("presetId", "")).strip() or None

    if user:
      reporter_name = reporter_name or user["displayName"] or user["username"]
    reporter_name = reporter_name or "Anonymous"

    if len(title) < 3:
      self.send_error_json("Feedback title required")
      return
    if len(detail) < 8:
      self.send_error_json("Feedback detail required")
      return

    now = now_iso()
    with db() as conn:
      cursor = conn.execute(
        """
        INSERT INTO feedback (user_id, reporter_name, username, title, detail, page, preset_id, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'open', ?, ?)
        """,
        (
          user["id"] if user else None,
          reporter_name[:120],
          user["username"] if user else None,
          title[:180],
          detail[:3000],
          page[:500],
          preset_id[:160] if preset_id else None,
          now,
          now,
        ),
      )

    self.send_json({"ok": True, "id": cursor.lastrowid, "message": "Feedback sent"})

  def handle_admin_feedback(self, feedback_id: str) -> None:
    user = self.require_admin()
    if user is None:
      return

    try:
      item_id = int(feedback_id)
    except ValueError:
      self.send_error_json("Invalid feedback id")
      return

    data = self.read_json()
    status = str(data.get("status", "closed")).strip().lower()
    if status not in {"open", "closed"}:
      self.send_error_json("Invalid feedback status")
      return

    with db() as conn:
      cursor = conn.execute(
        """
        UPDATE feedback
        SET status = ?, updated_at = ?
        WHERE id = ?
        """,
        (status, now_iso(), item_id),
      )
      if cursor.rowcount == 0:
        self.send_error_json("Feedback not found", HTTPStatus.NOT_FOUND)
        return

    self.send_json(admin_summary())

  def serve_static(self, request_path: str) -> None:
    clean_path = unquote(request_path.split("?", 1)[0])
    if clean_path == "/":
      clean_path = "/index.html"

    target = (ROOT / clean_path.lstrip("/")).resolve()
    if not str(target).startswith(str(ROOT)) or not target.is_file():
      self.send_error(HTTPStatus.NOT_FOUND)
      return

    content_type = mimetypes.guess_type(str(target))[0] or "application/octet-stream"
    data = target.read_bytes()
    self.send_response(HTTPStatus.OK)
    self.send_header("Content-Type", content_type)
    self.send_header("Content-Length", str(len(data)))
    self.end_headers()
    self.wfile.write(data)


def main() -> None:
  init_db()
  port = int(os.environ.get("PORT", "8788"))
  host = os.environ.get("HOST", "0.0.0.0")
  server = ThreadingHTTPServer((host, port), MotionLabHandler)
  print(f"Motion Snippet Lab running on http://{host}:{port}/")
  if ADMIN_PASSWORD:
    print(f"Admin account ready: {ADMIN_USERNAME}")
  else:
    print("Admin password is not configured. Set ADMIN_PASSWORD before deploying online.")
  server.serve_forever()


if __name__ == "__main__":
  main()
