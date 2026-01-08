# 🚀 AI AGENT STARTUP DASHBOARD

> **USER INSTRUCTION**: Hãy đưa file này vào context đầu tiên mỗi khi bắt đầu phiên làm việc mới.
> **AI INSTRUCTION**: Khi đọc file này, hãy thực hiện "Startup Sequence" bên dưới để nạp context.

## 1. 🔄 Startup Sequence (Context Loading)
AI Agent cần đọc và ghi nhớ nội dung của các file sau theo thứ tự ưu tiên:

1.  **Bối cảnh dự án**: `project-context.md` (Hiểu về React Quest, Guide Builder, Flow học tập).
2.  **Luồng công việc**: `.antigravity/workflow_master.json` (Hiểu role PM, Dev, Architect, QA).
3.  **Quy trình**: `.ai_workflow/PROCESS.md` & `.ai_workflow/ROLES.md`.
4.  **Nhiệm vụ hiện tại**: `task.md` (Danh sách việc cần làm ngay lập tức).
5.  **Lịch sử**: `.ai_workflow/daily_log/2026-01-05.md` (Log gần nhất).

---

## 2. 📊 Live Project Status (Dashboard)
*Cập nhật lần cuối: 2026-01-07 17:00 PM*

| Hạng mục | Trạng thái | Chi tiết |
| :--- | :--- | :--- |
| **Phase** | 🟡 In Progress | Hoàn thiện Content & QA |
| **Focus App** | `apps/guide-builder` | Hoàn thiện XML Editor & Preview Mode |
| **Focus App** | `apps/react-quest-app` | **DONE** Tích hợp nút "Test Map" & Quiz |
| **Content** | � Attention | Cần nhập liệu 2 topic cuối |

### 🎯 Mục tiêu phiên làm việc hiện tại
1.  [x] Hoàn thiện tính năng "Test Map" trên Player.
2.  [ ] Nhập liệu 2 topic nội dung cuối (Functions, Algorithms).
3.  [ ] Kiểm tra luồng dữ liệu: Builder (XML) -> Player (Render Block).
4.  [ ] QA toàn bộ luồng trên Mobile/Tablet.

---

## 3. 🛠 Active Task List (Sync with `task.md`)

> **Lưu ý**: Đây là bản tóm tắt. Chi tiết kỹ thuật xem tại `task.md`.

- [x] Setup quy trình & Audit dự án.
- [x] Implement `guide-builder` cơ bản.
- [x] Implement `XmlBlockEditor` (Localization, Auto-inject).
- [x] **Refactor**: Tối ưu hóa `BlockRenderer` trên Player.
- [x] **Feature**: Nút "Test Map" load dữ liệu vào GameStore.
- [ ] **Content**: Nhập liệu 2 bài cuối (Functions, Algorithms).
- [ ] **QA**: Test toàn bộ luồng trên iPad simulation.

---

## 4. 🤖 AI Auto-Update Protocol

**QUAN TRỌNG**: Sau mỗi lần thực hiện xong một yêu cầu (Task Completion), AI Agent PHẢI:

1.  Cập nhật file `task.md` (đánh dấu `[x]`).
2.  Cập nhật file `daily_log/YYYY-MM-DD.md`.
3.  **Cập nhật file này (`AI_STARTUP.md`)**:
    *   Cập nhật phần "Live Project Status".
    *   Cập nhật phần "Active Task List".
    *   Sử dụng định dạng `diff` để User có thể apply ngay lập tức.

**Ví dụ lệnh cho AI**:
*"Tôi đã hoàn thành tính năng Preview. Hãy cập nhật task.md và AI_STARTUP.md."*

---
**End of Dashboard**