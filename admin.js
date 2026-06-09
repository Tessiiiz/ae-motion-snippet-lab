const adminState = {
  user: null,
  summary: null,
  view: "overview",
  feedbackStatus: "all",
  feedbackQuery: "",
  userRole: "all",
  userQuery: "",
  loading: false
};

const adminEls = {
  accountBox: document.querySelector("#adminAccountBox"),
  appPanel: document.querySelector("#adminAppPanel"),
  authPanel: document.querySelector("#adminAuthPanel"),
  loginForm: document.querySelector("#adminLoginForm"),
  loginStatus: document.querySelector("#adminLoginStatus"),
  loginUsername: document.querySelector("#adminLoginUsername"),
  loginPassword: document.querySelector("#adminLoginPassword"),
  refreshButton: document.querySelector("#adminRefreshButton"),
  toast: document.querySelector("#adminCenterToast"),
  views: {
    overview: document.querySelector("#adminViewOverview"),
    users: document.querySelector("#adminViewUsers"),
    feedback: document.querySelector("#adminViewFeedback"),
    insights: document.querySelector("#adminViewInsights")
  }
};

async function adminApi(path, options = {}) {
  const response = await fetch(path, {
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatAdminDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" });
}

function humanizePresetId(id) {
  if (!id) return "-";
  return String(id)
    .replaceAll("-", " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function showAdminToast(message) {
  adminEls.toast.textContent = message;
  adminEls.toast.classList.add("is-visible");
  window.clearTimeout(showAdminToast.timer);
  showAdminToast.timer = window.setTimeout(() => {
    adminEls.toast.classList.remove("is-visible");
  }, 1800);
}

function users() {
  return adminState.summary?.users || [];
}

function feedbackItems() {
  return adminState.summary?.feedback || [];
}

function isAdmin() {
  return adminState.user?.role === "admin";
}

function feedbackCounts() {
  const total = adminState.summary?.feedbackCount || feedbackItems().length;
  const open = adminState.summary?.openFeedbackCount || 0;
  return {
    total,
    open,
    closed: Math.max(total - open, 0)
  };
}

function filteredUsers() {
  const query = adminState.userQuery.trim().toLowerCase();
  return users().filter((user) => {
    const inRole = adminState.userRole === "all" || user.role === adminState.userRole;
    const haystack = `${user.username} ${user.displayName || ""}`.toLowerCase();
    return inRole && (!query || haystack.includes(query));
  });
}

function filteredFeedback() {
  const query = adminState.feedbackQuery.trim().toLowerCase();
  return feedbackItems().filter((item) => {
    const inStatus = adminState.feedbackStatus === "all" || item.status === adminState.feedbackStatus;
    const haystack = [
      item.title,
      item.detail,
      item.reporterName,
      item.username,
      item.page,
      item.presetId
    ].join(" ").toLowerCase();
    return inStatus && (!query || haystack.includes(query));
  });
}

function renderAccount() {
  if (!adminState.user) {
    adminEls.accountBox.innerHTML = `
      <strong>ยังไม่ได้เข้าสู่ระบบ</strong>
      <span>Login ด้วยบัญชี admin เพื่อเปิดหลังบ้านเต็ม</span>`;
    return;
  }

  adminEls.accountBox.innerHTML = `
    <strong>${escapeHTML(adminState.user.displayName || adminState.user.username)}</strong>
    <span>@${escapeHTML(adminState.user.username)} · ${escapeHTML(adminState.user.role)}</span>
    <button type="button" data-admin-logout>Logout</button>`;
}

function renderShell() {
  document.querySelectorAll("[data-admin-view]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.adminView === adminState.view);
  });

  Object.entries(adminEls.views).forEach(([name, panel]) => {
    panel.classList.toggle("is-active", name === adminState.view);
  });

  renderAccount();
  adminEls.authPanel.hidden = isAdmin();
  adminEls.appPanel.hidden = !isAdmin();
  adminEls.refreshButton.disabled = !isAdmin();

  if (!isAdmin()) return;
  renderOverview();
  renderUsers();
  renderFeedback();
  renderInsights();
}

function renderOverview() {
  const counts = feedbackCounts();
  const adminCount = adminState.summary?.adminCount || users().filter((user) => user.role === "admin").length;
  const newestUsers = users().slice(0, 5);
  const latestPending = feedbackItems().filter((item) => item.status === "open").slice(0, 5);
  const topFavorite = (adminState.summary?.topFavorites || [])[0];

  adminEls.views.overview.innerHTML = `
    <div class="admin-page-grid admin-page-grid-metrics">
      <div class="admin-kpi">
        <span>Total users</span>
        <strong>${users().length}</strong>
        <small>${adminCount} admin</small>
      </div>
      <div class="admin-kpi">
        <span>Feedback pending</span>
        <strong>${counts.open}</strong>
        <small>${counts.closed} managed</small>
      </div>
      <div class="admin-kpi">
        <span>Saved favorites</span>
        <strong>${adminState.summary?.favoriteCount || 0}</strong>
        <small>${topFavorite ? humanizePresetId(topFavorite.presetId) : "No favorite yet"}</small>
      </div>
      <div class="admin-kpi">
        <span>Feedback total</span>
        <strong>${counts.total}</strong>
        <small>Showing latest ${feedbackItems().length}</small>
      </div>
    </div>

    <div class="admin-page-grid admin-page-grid-two">
      <section class="admin-page-card">
        <div class="admin-card-head">
          <div>
            <span class="eyebrow">Work queue</span>
            <h2>Pending feedback</h2>
          </div>
          <button type="button" data-admin-view="feedback">Open board</button>
        </div>
        <div class="admin-queue-list">
          ${latestPending.length ? latestPending.map(renderCompactFeedback).join("") : `<div class="admin-empty">ไม่มี feedback ค้างจัดการ</div>`}
        </div>
      </section>

      <section class="admin-page-card">
        <div class="admin-card-head">
          <div>
            <span class="eyebrow">People</span>
            <h2>Newest users</h2>
          </div>
          <button type="button" data-admin-view="users">Manage</button>
        </div>
        <div class="admin-queue-list">
          ${newestUsers.length ? newestUsers.map((user) => `
            <div class="admin-compact-row">
              <div>
                <strong>${escapeHTML(user.displayName || user.username)}</strong>
                <span>@${escapeHTML(user.username)} · ${escapeHTML(user.role)}</span>
              </div>
              <small>${formatAdminDate(user.createdAt)}</small>
            </div>`).join("") : `<div class="admin-empty">ยังไม่มี user</div>`}
        </div>
      </section>
    </div>`;
}

function renderCompactFeedback(item) {
  return `
    <div class="admin-compact-row">
      <div>
        <strong>${escapeHTML(item.title)}</strong>
        <span>${escapeHTML(item.reporterName || "Anonymous")} · #${item.id}</span>
      </div>
      <button type="button" data-admin-feedback-status="${item.id}" data-status="closed">Done</button>
    </div>`;
}

function renderUsers() {
  const rows = filteredUsers();
  const roleOptions = [
    ["all", "All roles"],
    ["admin", "Admin"],
    ["user", "User"]
  ];

  adminEls.views.users.innerHTML = `
    <section class="admin-page-card">
      <div class="admin-card-head">
        <div>
          <span class="eyebrow">Accounts</span>
          <h2>User Management</h2>
        </div>
        <span>${rows.length} / ${users().length} users</span>
      </div>

      <div class="admin-toolbar">
        <input id="adminUserSearch" type="search" placeholder="Search username or display name" value="${escapeHTML(adminState.userQuery)}" />
        <select id="adminUserRoleFilter">
          ${roleOptions.map(([value, label]) => `<option value="${value}"${adminState.userRole === value ? " selected" : ""}>${label}</option>`).join("")}
        </select>
      </div>

      <div class="admin-table-shell">
        <table class="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Favorites</th>
              <th>Recent</th>
              <th>Feedback</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${rows.length ? rows.map(renderUserRow).join("") : `<tr><td colspan="7"><div class="admin-empty">ไม่เจอ user ตาม filter นี้</div></td></tr>`}
          </tbody>
        </table>
      </div>
    </section>`;
}

function renderUserRow(user) {
  const isSelf = adminState.user && user.id === adminState.user.id;
  const nextRole = user.role === "admin" ? "user" : "admin";
  return `
    <tr>
      <td>
        <div class="admin-user-cell">
          <strong>${escapeHTML(user.displayName || user.username)}</strong>
          <span>@${escapeHTML(user.username)}</span>
        </div>
      </td>
      <td><span class="admin-role-badge${user.role === "admin" ? " is-admin" : ""}">${escapeHTML(user.role)}</span></td>
      <td>${user.favoriteCount ?? (user.favorites || []).length}</td>
      <td>${user.recentCount ?? (user.recent || []).length}</td>
      <td>${user.feedbackCount || 0}</td>
      <td>${formatAdminDate(user.createdAt)}</td>
      <td>
        <div class="admin-row-actions">
          ${isSelf ? `<span class="admin-current-chip">Current admin</span>` : `
            <button type="button" data-admin-user-role="${user.id}" data-role="${nextRole}">${nextRole === "admin" ? "Make admin" : "Make user"}</button>
            <button class="danger" type="button" data-admin-user-delete="${user.id}" data-user-label="${escapeHTML(user.displayName || user.username)}">Delete</button>
          `}
        </div>
      </td>
    </tr>`;
}

function renderFeedback() {
  const rows = filteredFeedback();
  const counts = feedbackCounts();
  const statusOptions = [
    ["all", `All (${counts.total})`],
    ["open", `Pending (${counts.open})`],
    ["closed", `Managed (${counts.closed})`]
  ];

  adminEls.views.feedback.innerHTML = `
    <section class="admin-page-card">
      <div class="admin-card-head">
        <div>
          <span class="eyebrow">Inbox</span>
          <h2>Feedback Board</h2>
        </div>
        <div class="admin-card-actions">
          <button type="button" data-admin-bulk-feedback="closed">Mark visible done</button>
          <button type="button" data-admin-bulk-feedback="open">Reopen visible</button>
        </div>
      </div>

      <div class="admin-toolbar">
        <input id="adminFeedbackSearch" type="search" placeholder="Search feedback, reporter, page, preset" value="${escapeHTML(adminState.feedbackQuery)}" />
        <select id="adminFeedbackStatusFilter">
          ${statusOptions.map(([value, label]) => `<option value="${value}"${adminState.feedbackStatus === value ? " selected" : ""}>${label}</option>`).join("")}
        </select>
      </div>

      <div class="admin-feedback-board">
        ${rows.length ? rows.map(renderFeedbackCard).join("") : `<div class="admin-empty">ไม่เจอ feedback ตาม filter นี้</div>`}
      </div>
    </section>`;
}

function renderFeedbackCard(item) {
  const isClosed = item.status === "closed";
  return `
    <article class="admin-feedback-card${isClosed ? " is-closed" : ""}">
      <div class="admin-feedback-main">
        <button class="admin-feedback-check${isClosed ? " is-done" : ""}" type="button" data-admin-feedback-status="${item.id}" data-status="${isClosed ? "open" : "closed"}" aria-label="${isClosed ? "Mark as pending" : "Mark as done"}">${isClosed ? "✓" : ""}</button>
        <div>
          <div class="admin-feedback-title">
            <strong>${escapeHTML(item.title)}</strong>
            <span>${isClosed ? "จัดการแล้ว" : "ยังไม่จัดการ"}</span>
          </div>
          <p>${escapeHTML(item.detail)}</p>
          <div class="admin-feedback-meta">
            <span>#${item.id}</span>
            <span>${escapeHTML(item.reporterName || "Anonymous")}${item.username ? ` · @${escapeHTML(item.username)}` : ""}</span>
            <span>${formatAdminDate(item.createdAt)}</span>
            <span>${escapeHTML(item.page || "/")}</span>
            ${item.presetId ? `<span>${humanizePresetId(item.presetId)}</span>` : ""}
          </div>
        </div>
      </div>
      <div class="admin-row-actions">
        <button type="button" data-admin-feedback-status="${item.id}" data-status="${isClosed ? "open" : "closed"}">${isClosed ? "Reopen" : "Done"}</button>
        <button class="danger" type="button" data-admin-feedback-delete="${item.id}">Delete</button>
      </div>
    </article>`;
}

function renderInsights() {
  const topFavorites = adminState.summary?.topFavorites || [];
  const maxFavorite = Math.max(1, ...topFavorites.map((item) => item.count));
  const roleStats = users().reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {});
  const counts = feedbackCounts();

  adminEls.views.insights.innerHTML = `
    <div class="admin-page-grid admin-page-grid-two">
      <section class="admin-page-card">
        <div class="admin-card-head">
          <div>
            <span class="eyebrow">Preset demand</span>
            <h2>Top Favorites</h2>
          </div>
        </div>
        <div class="admin-insight-list">
          ${topFavorites.length ? topFavorites.map((item) => `
            <div class="admin-insight-row">
              <div>
                <strong>${humanizePresetId(item.presetId)}</strong>
                <span>${item.count} saves</span>
              </div>
              <div class="admin-bar"><span style="width: ${(item.count / maxFavorite) * 100}%"></span></div>
            </div>`).join("") : `<div class="admin-empty">ยังไม่มี favorite data</div>`}
        </div>
      </section>

      <section class="admin-page-card">
        <div class="admin-card-head">
          <div>
            <span class="eyebrow">Health</span>
            <h2>System Snapshot</h2>
          </div>
        </div>
        <div class="admin-snapshot-list">
          <div><span>Admin accounts</span><strong>${roleStats.admin || 0}</strong></div>
          <div><span>Member accounts</span><strong>${roleStats.user || 0}</strong></div>
          <div><span>Pending feedback</span><strong>${counts.open}</strong></div>
          <div><span>Managed feedback</span><strong>${counts.closed}</strong></div>
        </div>
      </section>
    </div>`;
}

function renderAll() {
  renderShell();
}

async function loadAdminSession() {
  try {
    const session = await adminApi("/api/session");
    adminState.user = session.user || null;
    adminState.summary = session.admin || null;
  } catch (error) {
    adminState.user = null;
    adminState.summary = null;
    adminEls.loginStatus.textContent = "ต้องรันผ่าน server.py ก่อน";
  }
  renderAll();
}

async function refreshAdminSummary() {
  if (!isAdmin()) return;
  adminState.loading = true;
  adminEls.refreshButton.disabled = true;
  try {
    adminState.summary = await adminApi("/api/admin/summary");
    renderAll();
    showAdminToast("Dashboard refreshed");
  } catch (error) {
    showAdminToast(error.message);
  } finally {
    adminState.loading = false;
    adminEls.refreshButton.disabled = false;
  }
}

async function setFeedbackStatus(id, status, notify = true) {
  adminState.summary = await adminApi(`/api/admin/feedback/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify({ status })
  });
  renderAll();
  if (notify) showAdminToast(status === "closed" ? "Feedback marked done" : "Feedback reopened");
}

async function deleteFeedback(id) {
  if (!window.confirm(`Delete feedback #${id}?`)) return;
  adminState.summary = await adminApi(`/api/admin/feedback/${encodeURIComponent(id)}`, {
    method: "DELETE"
  });
  renderAll();
  showAdminToast("Feedback deleted");
}

async function setUserRole(id, role) {
  adminState.summary = await adminApi(`/api/admin/users/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify({ role })
  });
  renderAll();
  showAdminToast(role === "admin" ? "User promoted to admin" : "User changed to member");
}

async function deleteUser(id, label) {
  if (!window.confirm(`Delete ${label}? Sessions, favorites, and recent items will be removed.`)) return;
  adminState.summary = await adminApi(`/api/admin/users/${encodeURIComponent(id)}`, {
    method: "DELETE"
  });
  renderAll();
  showAdminToast("User deleted");
}

async function bulkSetVisibleFeedback(status) {
  const targets = filteredFeedback().filter((item) => item.status !== status);
  if (!targets.length) {
    showAdminToast("Nothing to update");
    return;
  }
  for (const item of targets) {
    adminState.summary = await adminApi(`/api/admin/feedback/${encodeURIComponent(item.id)}`, {
      method: "PUT",
      body: JSON.stringify({ status })
    });
  }
  renderAll();
  showAdminToast(`${targets.length} feedback updated`);
}

adminEls.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  adminEls.loginStatus.textContent = "";
  try {
    const session = await adminApi("/api/login", {
      method: "POST",
      body: JSON.stringify({
        username: adminEls.loginUsername.value.trim(),
        password: adminEls.loginPassword.value
      })
    });
    if (session.user?.role !== "admin") {
      adminEls.loginStatus.textContent = "บัญชีนี้ไม่ใช่ admin";
      return;
    }
    adminState.user = session.user;
    adminState.summary = session.admin || null;
    adminEls.loginPassword.value = "";
    renderAll();
    showAdminToast("Welcome admin");
  } catch (error) {
    adminEls.loginStatus.textContent = error.message;
  }
});

adminEls.refreshButton.addEventListener("click", refreshAdminSummary);

document.addEventListener("click", async (event) => {
  const viewButton = event.target.closest("[data-admin-view]");
  if (viewButton) {
    adminState.view = viewButton.dataset.adminView;
    renderAll();
    return;
  }

  const feedbackStatusButton = event.target.closest("[data-admin-feedback-status]");
  if (feedbackStatusButton) {
    try {
      await setFeedbackStatus(feedbackStatusButton.dataset.adminFeedbackStatus, feedbackStatusButton.dataset.status);
    } catch (error) {
      showAdminToast(error.message);
    }
    return;
  }

  const feedbackDeleteButton = event.target.closest("[data-admin-feedback-delete]");
  if (feedbackDeleteButton) {
    try {
      await deleteFeedback(feedbackDeleteButton.dataset.adminFeedbackDelete);
    } catch (error) {
      showAdminToast(error.message);
    }
    return;
  }

  const bulkButton = event.target.closest("[data-admin-bulk-feedback]");
  if (bulkButton) {
    try {
      await bulkSetVisibleFeedback(bulkButton.dataset.adminBulkFeedback);
    } catch (error) {
      showAdminToast(error.message);
    }
    return;
  }

  const userRoleButton = event.target.closest("[data-admin-user-role]");
  if (userRoleButton) {
    try {
      await setUserRole(userRoleButton.dataset.adminUserRole, userRoleButton.dataset.role);
    } catch (error) {
      showAdminToast(error.message);
    }
    return;
  }

  const userDeleteButton = event.target.closest("[data-admin-user-delete]");
  if (userDeleteButton) {
    try {
      await deleteUser(userDeleteButton.dataset.adminUserDelete, userDeleteButton.dataset.userLabel || "this user");
    } catch (error) {
      showAdminToast(error.message);
    }
    return;
  }

  const logoutButton = event.target.closest("[data-admin-logout]");
  if (logoutButton) {
    try {
      await adminApi("/api/logout", { method: "POST" });
    } catch {
      // Keep logout best-effort; local UI reset is the important part here.
    }
    adminState.user = null;
    adminState.summary = null;
    renderAll();
  }
});

document.addEventListener("input", (event) => {
  if (event.target.id === "adminUserSearch") {
    adminState.userQuery = event.target.value;
    renderUsers();
  }
  if (event.target.id === "adminFeedbackSearch") {
    adminState.feedbackQuery = event.target.value;
    renderFeedback();
  }
});

document.addEventListener("change", (event) => {
  if (event.target.id === "adminUserRoleFilter") {
    adminState.userRole = event.target.value;
    renderUsers();
  }
  if (event.target.id === "adminFeedbackStatusFilter") {
    adminState.feedbackStatus = event.target.value;
    renderFeedback();
  }
});

loadAdminSession();
