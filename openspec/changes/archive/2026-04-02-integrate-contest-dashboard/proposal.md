# Change: Integrate Contest Dashboard & Scratch-run

## Why
Nâng cấp hệ thống Tin Học Trẻ sang kiến trúc Supabase-centric, tích hợp Dashboard quản lý chuyên sâu và công cụ chấm bài Scratch (.sb3) tự động để đảm bảo tính chuyên nghiệp và khả năng mở rộng.

## What Changes
- [NEW] Tích hợp Supabase Auth & Postgres Schema cho toàn hệ thống.
- [NEW] Sử dụng `scratch-run` CLI để thực thi và chấm bài `.sb3` headlessly.
- [MODIFY] Cập nhật API (Node.js) để xác thực qua JWT của Supabase.
- [MODIFY] Thư viện `tin-hoc-tre-shared` đồng nhất Schema với `contest-dashboard`.
- [MODIFY] Judge Worker hỗ trợ chấm bài thuật toán và Scratch từ cùng một Queue.

## Impact
- Specs: `openspec/specs/api/spec.md`, `openspec/specs/judge/spec.md`, `openspec/specs/dashboard/spec.md`
- Code: `packages/tin-hoc-tre-shared/src/db.js`, `apps/tin-hoc-tre-api`, `apps/tin-hoc-tre-judge`
