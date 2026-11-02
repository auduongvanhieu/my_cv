# MyCV – Trình tạo CV online

Ứng dụng tạo CV kiểu ITviec / TopCV: nhập thông tin ở panel bên trái, xem trước khổ A4 trực tiếp bên phải, chọn mẫu và xuất PDF. Toàn bộ dữ liệu lưu trong trình duyệt (localStorage), không cần backend.

Domain: https://mycv.coffeesos.online

## Tính năng

- Quản lý nhiều CV: tạo mới, tạo từ CV mẫu, nhân bản, đổi tên, xoá.
- Các mục: Thông tin cá nhân (kèm ảnh), Giới thiệu, Học vấn, Kỹ năng (nhóm + mức độ + số năm), Kinh nghiệm, Dự án, Chứng chỉ, Ngoại ngữ, Hoạt động, Giải thưởng, Sở thích, Người tham chiếu, và mục tuỳ chỉnh.
- Kéo thả sắp xếp thứ tự mục, ẩn/hiện từng mục, đổi tiêu đề mục.
- 5 mẫu CV: ITviec (hai cột cổ điển), Modern, Classic, Minimal, Creative.
- Tuỳ chỉnh màu chủ đạo, phông chữ, cỡ chữ, giãn dòng, lề trang, khung ảnh, kiểu hiển thị kỹ năng.
- Ngôn ngữ giao diện và ngôn ngữ tiêu đề trong CV: Tiếng Việt / English.
- Xuất PDF qua hộp thoại in của trình duyệt (khổ A4, giữ màu nền), xuất / nhập JSON để sao lưu.
- Tự động lưu.

## Phát triển

```bash
export PATH="$HOME/sdk/node/bin:$PATH"   # Node 26 cài trong thư mục người dùng
npm install
npm run dev        # http://127.0.0.1:5173
npm run build      # xuất ra dist/
```

Cấu trúc chính:

- `src/types.ts` – kiểu dữ liệu CV.
- `src/store.ts` – zustand + persist (localStorage), mọi thao tác chỉnh sửa.
- `src/data/sample.ts` – CV mẫu (Nguyen Van Hieu).
- `src/components/` – Dashboard, Editor, ContentPanel (form + kéo thả), DesignPanel, Preview.
- `src/templates/` – 5 mẫu CV, dùng chung `shared.tsx` cho phần thân các mục.
- `src/i18n.ts` – chuỗi giao diện và tiêu đề mục (vi/en).

## Deploy

Mô hình giống các site khác trên server: nginx đọc tĩnh từ `/var/www/<domain>`, cấu hình trong `/etc/nginx/conf.d/`, TLS bằng certbot.

1. DNS (Cloudflare): bản ghi `A  mycv  ->  14.225.218.131` (proxied) đã được tạo ngày 02/11/2026 qua API (token trong `/root/session_manager_workspaces/.env`).
2. Lần đầu, chạy với quyền root:

   ```bash
   sudo bash /root/session_manager_workspaces/my-cv/deploy/install.sh
   ```

   Script sẽ copy `dist/` vào `/var/www/mycv.coffeesos.online` (chown cho user `sm`), cài `deploy/nginx/mycv.coffeesos.online.conf`, reload nginx và xin chứng chỉ Let's Encrypt.
3. Các lần sau (không cần sudo):

   ```bash
   bash deploy/deploy.sh
   ```
