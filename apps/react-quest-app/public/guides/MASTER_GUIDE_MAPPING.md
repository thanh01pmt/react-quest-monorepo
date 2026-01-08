# Master Guide Mapping (Hệ thống 12 Bài học)

Hệ thống hướng dẫn được chia thành 12 bài học (`lesson1.md` đến `lesson12.md`) bám sát lộ trình 12 thử thách luyện tập.

## 1. Cơ chế Tự động Điều hướng (Routing)

Ứng dụng sẽ tự động chọn bài học dựa trên **Category** (Phần đầu tiên của ID) và **Challenge Type** (Phần thứ ba của ID).

`[CATEGORY].[TOPIC_CODE].[CHALLENGE_TYPE].[ID]`

### Bảng Phân bổ Bài học

| Bài học | Chủ đề (Category) | Loại thử thách (Challenge Type) | Tệp Hướng dẫn |
| :--- | :--- | :--- | :--- |
| **Lesson 1** | `COMMANDS` | `SIMPLE_APPLY` | `lesson1.md` |
| **Lesson 2** | `COMMANDS` | `COMPLEX_APPLY` | `lesson2.md` |
| **Lesson 3** | `COMMANDS` | `DEBUG_FIX_LOGIC`, `DEBUG_FIX_SEQUENCE` | `lesson3.md` |
| **Lesson 4** | `FUNCTIONS` | `SIMPLE_APPLY`, `COMPLEX_APPLY` | `lesson4.md` |
| **Lesson 5** | `FUNCTIONS` | `DEBUG_*, REFACTOR` | `lesson5.md` |
| **Lesson 6** | `FOR_LOOPS` | `SIMPLE_APPLY`, `COMPLEX_APPLY` | `lesson6.md` |
| **Lesson 7** | `FOR_LOOPS` | `DEBUG_*, REFACTOR` | `lesson7.md` |
| **Lesson 8** | `VARIABLES`, `OPERATOR` | `SIMPLE_APPLY`, `COMPLEX_APPLY` | `lesson8.md` |
| **Lesson 9** | `VARIABLES`, `OPERATOR` | `DEBUG_*, REFACTOR` | `lesson9.md` |
| **Lesson 10** | `WHILE_LOOPS`, `CONDITIONALS` | `SIMPLE_APPLY`, `COMPLEX_APPLY` | `lesson10.md` |
| **Lesson 11** | `WHILE_LOOPS`, `CONDITIONALS` | `DEBUG_*, REFACTOR` | `lesson11.md` |
| **Lesson 12** | `ALGORITHMS` | (Tất cả các loại) | `lesson12.md` |

---

## 2. Quy chuẩn Nội dung (Content Standards)

Mỗi file `lessonX.md` cần tập trung duy nhất vào kỹ năng của bài học đó:
- **SIMPLE/COMPLEX**: Tập trung vào cách lắp ghép lệnh từ đầu.
- **DEBUG**: Tập trung vào các mẹo gỡ lỗi, kiểm tra luồng chương trình.
- **REFACTOR**: Tập trung vào cách rút gọn code, sử dụng cấu trúc mới để thay thế code cũ.

---

## 4. Challenge Inventory (Chi tiết thử thách)

Sử dụng bảng này để tra cứu Map ID và mô tả khi soạn thảo nội dung bài học.

### COMMANDS (Bài học 1 - 3)

| Bài | Loại | Map ID (Question Code) | Map Type | Mục tiêu | Mô tả lỗi (nếu có) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | SIMPLE | `COMMANDS_G3.CODING_COMMANDS_BASIC-MOVEMENT.SIMPLE_APPLY.C1-var1` | `straight_line` | Về đích | |
| **1** | SIMPLE | `COMMANDS_G4.CODING_COMMANDS_BASIC-MOVEMENT.SIMPLE_APPLY.C6-var1` | `l_shape` | Về đích | |
| **1** | SIMPLE | `COMMANDS_G10.CODING_COMMANDS_BASIC-MOVEMENT.SIMPLE_APPLY.C6-var1` | `star_shape` | Về đích | |
| **1** | SIMPLE | `COMMANDS_G4.CODING_COMMANDS_BASIC-MOVEMENT.SIMPLE_APPLY.C11-var1` | `u_shape` | Về đích | |
| **1** | SIMPLE | `COMMANDS_G312.CODING_COMMANDS_OBJECT-INTERACTION.SIMPLE_APPLY.C24-var1` | `s_shape` | 1 Crystal | |
| **2** | COMPLEX | `COMMANDS_G312.CODING_COMMANDS_OBJECT-INTERACTION.SIMPLE_APPLY.C56-var1` | `u_shape` | 1 Switch | |
| **2** | COMPLEX | `COMMANDS_G312.CODING_COMMANDS_MULTI-OBJECTIVE.COMPLEX_APPLY.C94-var1` | `plus_shape` | 1 Switch, 1 Crystal | |
| **2** | COMPLEX | `COMMANDS_G312.CODING_COMMANDS_3D-MOVEMENT.COMPLEX_APPLY.C165-var1` | `spiral_3d` | 2 Switch, 2 Crystal | |
| **2** | COMPLEX | `COMMANDS_G312.CODING_COMMANDS_MAZE-SOLVING-BASIC.COMPLEX_APPLY.C137-var1` | `complex_maze` | 1 Switch, 1 Crystal | |
| **3** | DEBUG | `COMMANDS_G312.CODING_COMMANDS_LOGIC-DEBUGGING.DEBUG_FIX_LOGIC.C198-var1` | `l_shape` | 2 Switch, 2 Crystal | **Missing Block**: Thiếu lệnh trong main. |
| **3** | DEBUG | `COMMANDS_G312.CODING_COMMANDS_LOGIC-DEBUGGING.DEBUG_FIX_LOGIC.C231-var1` | `t_shape` | 2 Switch, 2 Crystal | **Extra Block**: Thừa lệnh ngẫu nhiên. |
| **3** | DEBUG | `COMMANDS_G312.CODING_COMMANDS_LOGIC-DEBUGGING.DEBUG_FIX_LOGIC.C268-var1` | `spiral_path` | 2 Switch, 2 Crystal | **Incorrect Param**: Sai rẽ trái/phải hoặc nhặt/gạt. |
| **3** | SEQUENCE| `COMMANDS_G312.CODING_COMMANDS_LOGIC-DEBUGGING.DEBUG_FIX_SEQUENCE.C167-var1` | `l_shape` | 2 Switch, 2 Crystal | **Sequence Error**: Sai thứ tự lệnh. |
