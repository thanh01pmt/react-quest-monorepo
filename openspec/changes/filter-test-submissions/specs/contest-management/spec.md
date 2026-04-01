## MODIFIED Requirements
### Requirement: Quản trị viên thi thử vòng thi (Exam Preview)
Hệ thống SHALL cho phép Quản trị viên (Admin/Teacher) tự làm bài thi thử (Preview) ngay trên giao diện mà không ảnh hưởng tới kết quả thực tế của kỳ thi.

#### Scenario: Admin bypass Draft and Timing status
- **WHEN** Quản trị viên kích hoạt chức năng "Thi thử" trên một Board đang trong trạng thái `draft` hoặc chưa tới giờ bắt đầu.
- **THEN** Hệ thống khởi tạo một object `test_participant` và đánh dấu `is_test = true` cho bài thi này trong bảng `board_participants`, sinh ra token và link `/contest/:contest_id`.
- **AND** Hệ thống cho phép session này bỏ qua các màn hình chờ (`Lobby` lobby wait) để thi trực tiếp.

#### Scenario: Filter is_test from Leaderboard
- **WHEN** Quản trị viên xem Bảng xếp hạng trực tiếp (Live Monitor) hoặc thí sinh xem Bảng xếp hạng.
- **THEN** Hệ thống không hiển thị kết quả của các bản ghi `board_participants` có cờ `is_test = true` trong các view tính điểm (`board_leaderboard`, `round_leaderboard`, `contest_leaderboard`).
