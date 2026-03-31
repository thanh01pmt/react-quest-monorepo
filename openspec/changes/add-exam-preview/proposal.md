# Change: Thêm tính năng Xem trước (Preview) Đề thi và Câu hỏi

## Why
Giáo viên/Admin cần có khả năng xem trước một câu hỏi riêng lẻ và thi thử toàn bộ đề thi dưới góc nhìn của học sinh. Việc này giúp họ kiểm tra tính chính xác của nội dung đề bài, các bộ test case, và các thiết lập thời gian trước khi công bố kỳ thi chính thức.

## What Changes
Nội dung thay đổi được chia làm 2 giai đoạn:
- **Phase 1 (Single Question Preview):** Thêm nút "Xem trước" ở mỗi câu hỏi trong giao diện cấu hình đề thi (Exam Editor). Nút này mở một giao diện làm bài (PlayApp) stateless, cho phép làm thử và chấm điểm ngay trên client mà không lưu kết quả lên server.
- **Phase 2 (Full Exam Preview):** Thêm tính năng "Thi thử" cho toàn bộ Đề thi/Vòng thi. Quản trị viên sẽ trải qua luồng thi giống hệt thí sinh thực tế (phòng chờ, đếm ngược, nộp bài). Kết quả thi thử sẽ được đánh dấu để không hiển thị trên Bảng xếp hạng (Leaderboard) chính thức.

## Impact
- Specs: `contest-management`
- Code: Thêm tính năng preview vào `apps/contest-dashboard`, tái sử dụng thư viện/component từ `apps/quest-player`. Cập nhật Database Schema (có thể thêm cờ `is_test` ở cấp độ submission hoặc participant) và các câu query thống kê Leaderboard.
