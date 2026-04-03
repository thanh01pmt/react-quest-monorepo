# Change: Bổ sung chấm điểm cấu trúc Scratch (Structural Judging)

## Why

Hiện tại hệ thống chỉ chấm điểm dựa trên kết quả đầu ra (black-box). Tuy nhiên, đề thi Tin học trẻ thường yêu cầu cấu trúc cụ thể (số lượng nhân vật, sử dụng khối lệnh nhất định, biến số...). Việc bổ sung "structural judging" giúp tự động hóa khâu chấm điểm này.

## What Changes

- **Bổ sung** thư viện `scratch-analysis` và `sb-util` vào worker judge.
- **Tạo mới** `ScratchAnalyzer` để kiểm tra các quy tắc tĩnh (static analysis).
- **Cập nhật** `worker.js` để tích hợp chấm điểm cấu trúc trước khi chạy testcase.
- **Sửa lỗi** vòng lặp polling vô tận ở frontend khi bài nộp bị chấm lỗi hoặc không có test results.

## Impact

- Specs: `specs/contest-judge/spec.md`
- Code: `apps/tin-hoc-tre-judge/src/scratch-analyzer.js`, `apps/tin-hoc-tre-judge/src/worker.js`, `apps/react-quest-app/src/contexts/ContestContext.tsx`
