## 1. Cơ sở dữ liệu
- [ ] 1.1 Tạo migration thêm cột `is_test` (BOOLEAN, default false) vào table `board_participants`.
- [ ] 1.2 Tạo migration update hàm RPC `resolve_participant_session` để pass qua block "draft" nếu user hiện tại là `is_test`. Trả về cờ `is_test` trong query payload.
- [ ] 1.3 Tạo migration cập nhật các view leaderboard bao gồm: `board_leaderboard`, `round_leaderboard`, `contest_leaderboard` để lọc bỏ (WHERE `bp.is_test = false` hoặc `bp.is_test IS NOT true`).

## 2. Giao diện (Frontend)
- [ ] 2.1 Cập nhật model Typescript `ContestParticipant` trong `src/types/contest.ts` với `isTest?: boolean`.
- [ ] 2.2 Sửa hàm `resolveSupabaseContestSession` ở thư mục contexts để lấy `isTest` ra khỏi RPC Result.
- [ ] 2.3 Tại `apps/react-quest-app/src/pages/EntrancePage/index.tsx`, kiểm tra nếu user là `isTest = true` thì bypass thẳng thời gian chờ để "Bắt đầu thi".
- [ ] 2.4 Cập nhật `BoardManager.tsx` trong module Dashboard: insert `is_test: true` khi Admin thao tác "Thi thử".
- [ ] 2.5 Cũng tại `BoardManager.tsx`: sửa bug url string interpolation lúc redirect thi (thay `${bp!.id}` bằng tham số `contestId`).
