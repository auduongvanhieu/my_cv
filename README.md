# MyCV – Trình tạo CV online

Ứng dụng tạo CV kiểu ITviec / TopCV: nhập thông tin ở panel bên trái, xem trước khổ A4 trực tiếp bên phải, chọn mẫu và xuất PDF. Dùng được ngay không cần đăng nhập (dữ liệu lưu trong trình duyệt); đăng nhập Google để lưu CV vào tài khoản và dùng trên mọi thiết bị; tải CV cũ lên để AI (Claude) bóc tách và điền sẵn form.

Domain: https://mycv.coffeesos.online

## Tính năng

- Đăng nhập bằng Google (Google Identity Services); CV của tài khoản được lưu trên server (SQLite) và đồng bộ tự động. Không đăng nhập vẫn dùng được, CV lưu trong trình duyệt và được đưa lên tài khoản khi đăng nhập.
- Tải CV cũ lên (PDF, DOCX, PNG/JPG, TXT): Claude đọc file và điền sẵn toàn bộ form (structured outputs). Yêu cầu đăng nhập, giới hạn 20 lần/ngày/tài khoản.
- Quản lý nhiều CV: tạo mới, nhân bản, đổi tên, xoá.
- Các mục: Thông tin cá nhân (kèm ảnh), Giới thiệu, Học vấn, Kỹ năng (nhóm + mức độ + số năm), Kinh nghiệm, Dự án, Chứng chỉ, Ngoại ngữ, Hoạt động, Giải thưởng, Sở thích, Người tham chiếu, và mục tuỳ chỉnh.
- Kéo thả sắp xếp thứ tự mục, ẩn/hiện từng mục, đổi tiêu đề mục.
- 5 mẫu CV: ITviec (hai cột cổ điển), Modern, Classic, Minimal, Creative.
- Tuỳ chỉnh màu chủ đạo, phông chữ, cỡ chữ, giãn dòng, lề trang, khung ảnh, kiểu hiển thị kỹ năng.
- Ngôn ngữ giao diện và ngôn ngữ tiêu đề trong CV: Tiếng Việt / English.
- Xuất PDF qua hộp thoại in của trình duyệt (khổ A4, giữ màu nền), xuất / nhập JSON để sao lưu.
- Tự động lưu.

## Kiến trúc

- `src/` – SPA React + Vite + Tailwind, build tĩnh ra `dist/`.
- `server/` – API Go (một binary, SQLite thuần Go), chạy bằng systemd `mycv-server` tại `127.0.0.1:7801`, nginx proxy dưới `/api/`.
  - `POST /api/auth/google` – nhận ID token của Google Identity Services, xác thực qua Google, tạo session cookie (HttpOnly, 30 ngày).
  - `GET/PUT/DELETE /api/resumes` – CV của người dùng, lưu nguyên JSON.
  - `POST /api/parse-cv` – multipart `file`, gọi Claude (`claude-opus-5-5`, structured outputs) trả JSON theo schema của form.

## Phát triển

```bash
export PATH="$HOME/sdk/go/bin:$HOME/sdk/node/bin:$PATH"   # SDK cài trong thư mục người dùng
npm install
npm run dev        # http://127.0.0.1:5173, proxy /api -> 127.0.0.1:7801
npm run build      # xuất ra dist/

cd server
MYCV_DB=./dev.db MYCV_INSECURE_COOKIE=1 MYCV_GOOGLE_CLIENT_ID=... ANTHROPIC_API_KEY=... go run .
go test ./...
```

Cấu trúc chính:

- `src/types.ts` – kiểu dữ liệu CV.
- `src/store.ts` – zustand + persist (localStorage), mọi thao tác chỉnh sửa.
- `src/api.ts`, `src/auth.ts`, `src/sync.ts` – gọi API, đăng nhập Google, đồng bộ CV lên tài khoản (debounce 800ms).
- `src/components/` – Dashboard, Editor, ContentPanel (form + kéo thả), DesignPanel, Preview.
- `src/templates/` – 5 mẫu CV, dùng chung `shared.tsx` cho phần thân các mục.
- `src/i18n.ts` – chuỗi giao diện và tiêu đề mục (vi/en).

## Deploy

Mô hình giống các site khác trên server: nginx đọc tĩnh từ `/var/www/<domain>`, cấu hình trong `/etc/nginx/conf.d/`, TLS bằng certbot, API chạy bằng systemd.

1. DNS (Cloudflare): bản ghi `A  mycv  ->  14.225.218.131` (proxied) đã được tạo ngày 02/11/2026 qua API (token trong `/root/session_manager_workspaces/.env`).
2. Cấu hình bí mật nằm ở `/etc/mycv/mycv.env` (mẫu: `deploy/mycv.env.example`):
   - `MYCV_GOOGLE_CLIENT_ID`: OAuth 2.0 Client ID loại *Web application* tạo tại Google Cloud Console → APIs & Services → Credentials, với *Authorized JavaScript origins* = `https://mycv.coffeesos.online`.
   - `ANTHROPIC_API_KEY`: API key từ https://platform.claude.com/ để bật tính năng AI bóc tách CV.
3. Cài đặt / cập nhật service (cần root, chạy lại được nhiều lần):

   ```bash
   bash deploy/deploy.sh   # build dist/ và server/bin/mycv-server
   GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com ANTHROPIC_API_KEY=sk-ant-... \
     sudo -E bash deploy/install.sh
   ```

   Script copy `dist/` vào `/var/www/mycv.coffeesos.online` (chown cho user `sm`), tạo `/var/lib/mycv` + `/etc/mycv/mycv.env`, cài và khởi động `mycv-server.service`, thêm sudoers cho phép `sm` restart service không cần mật khẩu, cài nginx config và chứng chỉ Let's Encrypt.
4. Các lần sau (không cần mật khẩu):

   ```bash
   bash deploy/deploy.sh
   ```

   Đổi giá trị trong `/etc/mycv/mycv.env` thì chạy `sudo systemctl restart mycv-server`.
