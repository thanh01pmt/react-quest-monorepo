## ADDED Requirements
### Requirement: Xem trước câu hỏi và nộp nháp
Giao diện quản trị Đề thi (Exam Editor) SHALL cung cấp chức năng cho phép Admin xem trước hoặc làm thử từng câu hỏi độc lập. Trạng thái và kết quả nộp bài của lần làm thử SHALL NOT được ghi nhận vào cơ sở dữ liệu hệ thống.

#### Scenario: Admin xem trước câu hỏi thành công
- **WHEN** Admin click chọn nút "Xem trước" (Preview) tại một câu hỏi bất kỳ trong Exam Editor
- **THEN** Hệ thống hiển thị giao diện làm bài (PlayApp) cho câu hỏi tương ứng, sử dụng khối dữ liệu `gameConfig` do Admin vừa soạn thảo
- **AND** Mọi thao tác submit code hoặc answer đều chỉ chấm điểm cục bộ (hoặc chấm điểm không lưu giữ) để hiển thị kết quả đúng/sai.

### Requirement: Luồng thi thử (Full Exam Preview)
Hệ thống SHALL tính toán, theo dõi và phục vụ một luồng thi đầy đủ cho Admin khi chọn chức năng "Thi thử" ở cấp Đề thi hoặc Vòng thi. Kết quả từ luồng thi thử này SHALL NOT xuất hiện trên Bảng xếp hạng chính thức.

#### Scenario: Admin tham gia thi thử thành công
- **WHEN** Admin nhấn nút "Thi thử" trên thẻ cấu hình Đề thi hoặc Vòng thi
- **THEN** Hệ thống bỏ qua các giới hạn nghiêm ngặt về thời gian mở vòng thi đối với tài khoản Admin này
- **AND** Hệ thống khởi tạo một object `test_participant` (hoặc đánh dấu `is_test = true` cho session này)
- **AND** Admin đi qua các màn hình phòng chờ, làm bài, và xem điểm bình thường như vai trò học sinh
- **AND** Khi vào màn hình "Giám sát Live", dữ liệu của Admin này không hiển thị trong danh sách tranh tài.
