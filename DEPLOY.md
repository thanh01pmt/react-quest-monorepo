# 🚀 Hướng dẫn Triển khai Hệ thống Tin Học Trẻ (Contest Backend)

Tài liệu này hướng dẫn cách triển khai, vận hành và mở rộng các thành phần Backend của hệ thống Tin Học Trẻ sử dụng Docker.

---

## 🏗️ Tổng quan Kiến trúc (Architecture)

Hệ thống được thiết kế theo mô hình **Worker-Queue** để đảm bảo tính ổn định và khả năng mở rộng khi có số lượng thí sinh lớn nộp bài cùng lúc.

1.  **API Server (`tin-hoc-tre-api`)**: Nhận bài nộp, quản lý đề bài, bảng xếp hạng và cung cấp API cho Frontend.
2.  **Redis (Message Broker)**: Đóng vai trò là hàng đợi (Queue), lưu trữ các "job" chấm bài tạm thời.
3.  **Judge Worker (`tin-hoc-tre-judge`)**: Lấy bài từ hàng đợi, thực hiện chấm điểm (Sandbox) và trả kết quả về Database.

---

## 🐳 Chi tiết 2 Loại Docker Containers

### 1. Backend API Container (`tin-hoc-tre-api`)
*   **Chức năng**: Cổng giao tiếp chính của hệ thống.
*   **Công nghệ**: Node.js, Express.
*   **Kết nối**: Supabase (Database/Auth), Redis (Queue), Piston (Optional).
*   **Triển khai**: Thường chạy 1-2 instance đứng sau Load Balancer.

### 2. Judge Worker Container (`tin-hoc-tre-judge`)
*   **Chức năng**: Xử lý chấm điểm bài làm của thí sinh một cách độc lập.
*   **Công nghệ**: Node.js + Sandbox (chạy mã nguồn thí sinh).
*   **Đặc điểm**: Tốn CPU và Memory nhất. Có thể chạy song song nhiều instance để tăng tốc độ chấm.
*   **Triển khai**: Có thể scale linh hoạt từ 1 đến N instances tùy theo tải của kỳ thi.

---

## 🛠️ Quy trình Triển khai (Deployment)

### Bước 1: Chuẩn bị môi trường
Đảm bảo máy chủ đã cài đặt:
*   Docker & Docker Compose
*   Git

### Bước 2: Cấu hình Biến môi trường
1.  Sao chép file mẫu: `cp .env.example .env`
2.  Chỉnh sửa file `.env` và điền đầy đủ thông tin (Supabase URL, Key, Database URL...).

### Bước 3: Sử dụng Deploy Script
Tôi đã chuẩn bị script `scripts/deploy.sh` để đơn giản hóa mọi thao tác:

```bash
# Cấp quyền thực thi (nếu chưa có)
chmod +x scripts/deploy.sh

# Khởi động toàn bộ hệ thống
./scripts/deploy.sh start

# Xem trạng thái các container
./scripts/deploy.sh status

# Xem log của Judge để theo dõi quá trình chấm bài
./scripts/deploy.sh logs judge
```

---

## 📈 Cơ chế Hoạt động & Scaling

### Cách Hệ thống Chấm bài
1.  **Thí sinh nộp bài**: Client gọi API `/api/submit`. API lưu mã nguồn vào Database và đẩy một `jobID` vào **Redis**.
2.  **Hàng đợi xử lý**: **Judge Worker** đang chờ sẽ lấy `jobID` từ Redis.
3.  **Chấm điểm**: Worker tải mã nguồn, chạy các Testcase trong môi trường an toàn và tính điểm.
4.  **Cập nhật**: Kết quả (Pass/Fail, Time, Memory) được cập nhật trực tiếp vào Supabase và bảng xếp hạng.

### Cách Scale Hệ thống
Khi số lượng thí sinh tăng đột biến (ví dụ: vòng Chung kết), bạn chỉ cần tăng số lượng Judge Workers mà không làm gián đoạn API:

```bash
# Tăng lên 5 workers chấm bài song song
./scripts/deploy.sh scale 5
```

> [!TIP]
> Bạn có thể chạy Docker API trên một server và Docker Judge trên các server khác mạnh hơn về CPU để tối ưu chi phí và hiệu suất.

---

## 📝 Bảo trì & Cập nhật

Mỗi khi bạn có code mới (ví dụ: cập nhật đề bài hoặc logic chấm):

```bash
# Tự động pull code, rebuild và khởi động lại (không downtime)
./scripts/deploy.sh update
```

## ⚠️ Lưu ý Quan trọng
*   **Security**: Luôn ẩn file `.env` và không commit lên Git.
*   **Supabase**: Đảm bảo Supabase của bạn đã được cấu hình đủ các bảng `submissions`, `problems`, `violations`.
*   **Network**: Docker API cần mở port `3000` (hoặc port bạn cấu hình) để Frontend có thể gọi tới.
