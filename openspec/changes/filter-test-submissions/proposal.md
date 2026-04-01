# Change: Thêm Cờ Thi Thử (is_test) và Loại Trừ Khỏi Bảng Xếp Hạng

## Why
Giáo viên/Admin đang không thể "Thi thử" một vòng thi nếu nó có status là `draft` hoặc chưa tới thời gian bắt đầu. Thêm nữa, bất kỳ lần thi thử nào của Admin cũng đều bị ghi nhận thành bản nháp hoặc điểm thật, gây nhiễu bảng xếp hạng (Leaderboard) thực tế đối với thí sinh.

## What Changes
- [**MODIFIED**] Thêm column `is_test` (BOOLEAN, default false) vào table `board_participants` để phân biệt kết quả thi thử.
- [**MODIFIED**] Cập nhật hàm RPC `resolve_participant_session` để bỏ qua các ràng buộc về draft status (trạng thái chờ của contest và round) khi session có `is_test = true`.
- [**MODIFIED**] Viết lại các Database Views của Leaderboard (`board_leaderboard`, `round_leaderboard`, `contest_leaderboard`) để filter out (loại trừ) những `board_participants` có `is_test = true`.
- [**MODIFIED**] Nút "Thi thử" trên giao diện quản trị `BoardManager.tsx` sẽ chèn test session với `is_test = true` và truy cập thẳng được phòng thi ảo mà không bị check thời gian.

## Impact
- Specs: `contest-management`
- Code: Thêm cờ `is_test` trên `board_participants`. Cập nhật `resolve_participant_session` SQL. Sửa CSS/UI ở `EntrancePage.tsx`. Chỉnh link URL preview sang `contest_id` thay vì `bp.id`.
