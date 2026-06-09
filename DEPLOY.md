# Deploy AE Motion Snippet Lab

แนะนำใช้ Render Free ถ้าต้องการระบบ User/Admin เพราะเว็บนี้มี `server.py` เป็น backend

## ก่อนอัปขึ้น GitHub

ห้ามอัปไฟล์เหล่านี้:

- `motion_lab.sqlite3`
- `.env`
- ไฟล์รหัสผ่านส่วนตัว

โปรเจกต์มี `.gitignore` กันไว้แล้ว

## ตั้งค่า Render Free

1. อัปโปรเจกต์นี้ขึ้น GitHub repo
2. เข้า https://render.com
3. เลือก New + > Blueprint หรือ New + > Web Service
4. เลือก GitHub repo ของโปรเจกต์นี้
5. ถ้าใช้ Blueprint ให้ Render อ่าน `render.yaml`
6. ตั้ง Environment Variable:
   - `ADMIN_USERNAME` = `admin`
   - `ADMIN_DISPLAY_NAME` = `Admin`
   - `ADMIN_PASSWORD` = รหัสใหม่ของคุณ
7. Deploy

## ข้อควรรู้

Render Free อาจ sleep เมื่อไม่มีคนเข้า และ SQLite บน free service ไม่เหมาะกับข้อมูลถาวรระยะยาว
ถ้าต้องเก็บ user/favorites จริงจัง ควรย้าย database ไป Supabase หรือ Neon Postgres ภายหลัง

## Static only

ถ้าไม่ต้องใช้ User/Admin กลาง สามารถอัปเฉพาะไฟล์ static ไป GitHub Pages, Cloudflare Pages หรือ Netlify ได้:

- `index.html`
- `styles.css`
- `script.js`
- `v2.html`
- `v2.css`
- `v2.js`

แบบ static ระบบ favorite จะเก็บเฉพาะ browser ของแต่ละคน
