## Phase 1: Xem trước một câu hỏi (Single Question Preview)
- [ ] 1.1 Tìm hiểu và thiết kế cách thức load `PlayApp` component (từ module `quest-player`) vào bên trong ứng dụng `contest-dashboard`.
- [ ] 1.2 Cập nhật Component màn hình soạn thảo đề thi (Exam Editor) để thêm nút "Xem trước" (Preview) cạnh từng câu hỏi.
- [ ] 1.3 Truyền `gameConfig` của câu hỏi hiện hành (bao gồm đề bài, test cases, code ban đầu) vào `PlayApp` ở chế độ stateless.
- [ ] 1.4 Đảm bảo chế độ Xem trước chỉ tiến hành chấm điểm ở máy khách (client), và người dùng có thể dễ dàng tắt Preview để quay lại màn hình soạn thảo.

## Phase 2: Thi thử toàn bộ đề thi (Full Exam Preview)
- [ ] 2.1 Cập nhật cấu trúc database (tạo cờ `is_test` trên bảng `board_participants` hoặc tạo luồng riêng) để phân loại dữ liệu thử nghiệm của Admin.
- [ ] 2.2 Thêm nút chức năng "Thi thử" (Test Contest) tại các màn hình quản trị Cụm thi / Vòng thi.
- [ ] 2.3 Chỉnh sửa luồng vào thi để bỏ qua các quy tắc ràng buộc chặt chẽ đối với Admin (ví dụ: cho phép vào thi kể cả khi chưa đến giờ, tạo participant test tức thời).
- [ ] 2.4 Viết lại các hàm truy vấn Bảng xếp hạng (Leaderboard) để loại trừ kết quả từ các participant thử nghiệm (`is_test = true`).
