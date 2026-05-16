# Website Cát Phú

Website giới thiệu dịch vụ xây nhà trọn gói Cát Phú, có trang admin để quản lý nội dung từ file JSON.

## Chạy website

```bash
cd /Users/tanthanh381/Documents/cat-phu-website
python3 server.py
```

Hoặc chạy server nền bằng script:

```bash
cd /Users/tanthanh381/Documents/cat-phu-website
./start-cat-phu.command
```

Dừng server nền:

```bash
./stop-cat-phu.command
```

Mở:

- Website: http://127.0.0.1:5500/
- Admin: http://127.0.0.1:5500/admin

## GitHub Pages

Thư mục `docs/` là bản website tĩnh dùng để deploy lên GitHub Pages. Khi bật GitHub Pages, chọn:

- Branch: `main`
- Folder: `/docs`

Lưu ý: GitHub Pages chỉ chạy website tĩnh. Trang admin cần server Python local để lưu nội dung vào JSON.

## Đăng nhập admin

Mật khẩu mặc định:

```text
catphu2026
```

Nếu trình duyệt báo hết phiên hoặc không lưu được nội dung sau khi server khởi động lại, tải lại trang admin rồi đăng nhập lại bằng mật khẩu trên.

Đổi mật khẩu khi chạy server:

```bash
CAT_PHU_ADMIN_PASSWORD="mat-khau-moi" python3 server.py
```

Phiên admin dùng cookie `HttpOnly`, `SameSite=Strict` và tự hết hạn sau 8 giờ.

## Kiểm thử QC / bảo mật

```bash
cd /Users/tanthanh381/Documents/cat-phu-website
PYTHONPYCACHEPREFIX=/private/tmp/catphu-pycache python3 tests/security_checks.py
```

Bộ test kiểm tra đăng nhập, cookie bảo mật, header bảo mật, chặn truy cập trái phép, validate form tư vấn, giới hạn body và lockout khi thử sai mật khẩu nhiều lần.

## Dữ liệu

- Nội dung website: `data/site.json`
- Khách gửi form tư vấn: `data/leads.json`
- Logo: `public/assets/logo-cat-phu.svg`

Trang admin có thể chỉnh sửa hero, dịch vụ, dự án, bảng giá, quy trình, cam kết, bài viết, footer, thông tin liên hệ và xem danh sách khách gửi tư vấn.

## Ghi chú fanpage

Fanpage được gắn tại: https://www.facebook.com/home.qa.98

Do Facebook thường chặn truy cập nội dung bài viết/hình ảnh nếu không có quyền hoặc API token, khu vực "Bài viết" đã được dựng sẵn để bạn thêm hoặc thay nội dung fanpage trong admin.
