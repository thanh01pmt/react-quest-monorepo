# Bảng Phân Bổ Thử Thách Luyện Tập

Tài liệu này dùng để tham chiếu khi tạo Map JSON và viết Hướng dẫn.
Hệ thống sẽ dựa vào **Subject** và **Challenge Type** để định tuyến bài học (Guide) phù hợp.

## Danh sách Thử thách

| STT | Tên Thử Thách | Subject (Môn học) | Challenge Type (Loại) | Gợi ý Topic Code (JSON) | File Hướng Dẫn Tương Ứng (Dự kiến) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | COMMANDS 1 | COMMANDS | SIMPLE_APPLY | `CODING_COMMANDS_BASIC-MOVEMENT` | `topic1_commands.md` |
| 2 | COMMANDS 2 | COMMANDS | COMPLEX_APPLY | `CODING_COMMANDS_COMPLEX-MOVEMENT` | `topic1_commands.md` |
| 3 | COMMANDS 3 | COMMANDS | DEBUG_FIX_LOGIC | `CODING_COMMANDS_LOGIC-DEBUGGING` | `topic1_commands.md` |
| 3 | COMMANDS 4 | COMMANDS | DEBUG_FIX_SEQUENCE | `CODING_COMMANDS_SEQUENCE-DEBUGGING` | `topic1_commands.md` |
| 4 | FUNCTIONS 1 | FUNCTIONS | SIMPLE_APPLY | `CODING_FUNCTIONS_DEFINITION-AND-CALL` | `topic6_functions.md` |
| 4 | FUNCTIONS 2 | FUNCTIONS | COMPLEX_APPLY | `CODING_FUNCTIONS_DECOMPOSITION` | `topic6_functions.md` |
| 5 | FUNCTIONS 3 | FUNCTIONS | DEBUG_FIX_LOGIC | `CODING_FUNCTIONS_DEFINITION-DEBUGGING` | `topic6_functions.md` |
| 5 | FUNCTIONS 4 | FUNCTIONS | DEBUG_FIX_SEQUENCE | `CODING_FUNCTIONS_CALL-DEBUGGING` | `topic6_functions.md` |
| 5 | FUNCTIONS 5 | FUNCTIONS | REFACTOR | `CODING_FUNCTIONS_REFACTORING` | `topic6_functions.md` |
| 6 | FOR_LOOPS 1 | FOR_LOOPS | SIMPLE_APPLY | `CODING_FOR-LOOPS_SIMPLE-ITERATION` | `topic3_loops_basic.md` |
| 6 | FOR_LOOPS 2 | FOR_LOOPS | COMPLEX_APPLY | `CODING_FOR-LOOPS_COMBINED-ITERATION` | `topic3_loops_basic.md` |
| 7 | FOR_LOOPS 3 | FOR_LOOPS | DEBUG_FIX_LOGIC | `CODING_FOR-LOOPS_LOGIC-DEBUGGING` | `topic3_loops_basic.md` |
| 7 | FOR_LOOPS 4 | FOR_LOOPS | DEBUG_FIX_SEQUENCE | `CODING_FOR-LOOPS_NESTED-DEBUGGING` | `topic3_loops_basic.md` |
| 7 | FOR_LOOPS 5 | FOR_LOOPS | REFACTOR | `CODING_FOR-LOOPS_REFACTORING` | `topic3_loops_basic.md` |
| 8 | VARIABLES + OPERATOR 1 | VARIABLES + OPERATOR | SIMPLE_APPLY | `CODING_VARIABLES_DECLARATION-AND-ASSIGNMENT` | `topic2_variables.md` |
| 8 | VARIABLES + OPERATOR 2 | VARIABLES + OPERATOR | COMPLEX_APPLY | `CODING_VARIABLES_EXPRESSIONS` | `topic2_variables.md` |
| 9 | VARIABLES + OPERATOR 3 | VARIABLES + OPERATOR | DEBUG_FIX_LOGIC | `CODING_VARIABLES_LOGIC-DEBUGGING` | `topic2_variables.md` |
| 9 | VARIABLES + OPERATOR 4 | VARIABLES + OPERATOR | DEBUG_FIX_SEQUENCE | `CODING_VARIABLES_MANIPULATION-DEBUGGING` | `topic2_variables.md` |
| 9 | VARIABLES + OPERATOR 5 | VARIABLES + OPERATOR | REFACTOR | `CODING_VARIABLES_CONFIGURATION` | `topic2_variables.md` |
| 10 | WHILE_LOOPS + CONDITIONALS 1 | WHILE_LOOPS + CONDITIONALS | SIMPLE_APPLY | `CODING_WHILE-LOOPS_INDEFINITE-ITERATION` | `topic5_while_loops.md` |
| 10 | WHILE_LOOPS + CONDITIONALS 2 | WHILE_LOOPS + CONDITIONALS | COMPLEX_APPLY | `CODING_WHILE-LOOPS_COMPLEX-CONDITIONS` | `topic5_while_loops.md` |
| 11 | WHILE_LOOPS + CONDITIONALS 3 | WHILE_LOOPS + CONDITIONALS | DEBUG_FIX_LOGIC | `CODING_WHILE-LOOPS_LOGIC-DEBUGGING` | `topic5_while_loops.md` |
| 11 | WHILE_LOOPS + CONDITIONALS 4 | WHILE_LOOPS + CONDITIONALS | DEBUG_FIX_SEQUENCE | `CODING_CONDITIONALS_FLOW-DEBUGGING` | `topic5_while_loops.md` |
| 11 | WHILE_LOOPS + CONDITIONALS 5 | WHILE_LOOPS + CONDITIONALS | REFACTOR | `CODING_WHILE-LOOPS_FOR-VS-WHILE` | `topic5_while_loops.md` |
| 12 | ALGORITHMS 1 | ALGORITHMS | SIMPLE_APPLY | `CODING_ALGORITHMS_IMPLEMENTATION` | `topic8_algorithms.md` |
| 12 | ALGORITHMS 2 | ALGORITHMS | COMPLEX_APPLY | `CODING_ALGORITHMS_MAZE-SOLVING` | `topic8_algorithms.md` |
| 12 | ALGORITHMS 3 | ALGORITHMS | DEBUG_FIX_LOGIC | `CODING_ALGORITHMS_DEBUGGING` | `topic8_algorithms.md` |
| 12 | ALGORITHMS 4 | ALGORITHMS | DEBUG_FIX_SEQUENCE | `CODING_ALGORITHMS_ANALYSIS-AND-COMPARISON` | `topic8_algorithms.md` |
| 12 | ALGORITHMS 5 | ALGORITHMS | REFACTOR | `CODING_ALGORITHMS_OPTIMIZATION` | `topic8_algorithms.md` |

## Từ điển Topic Code (Chi tiết)

Sau đây là danh sách chi tiết ý nghĩa của các Topic Code để bạn lựa chọn chính xác:

### 1. Commands (Lệnh cơ bản)
| Code | Tên | Mô tả |
| :--- | :--- | :--- |
| `CODING_COMMANDS_BASIC-MOVEMENT` | Di chuyển Tuần tự Cơ bản | `moveForward`, `turn` trên đường thẳng hoặc chữ L. |
| `CODING_COMMANDS_COMPLEX-MOVEMENT` | Di chuyển Tuần tự Phức tạp | `moveForward`, `turn` trên zigzag, hình sao, dọn dẹp khu vực. |
| `CODING_COMMANDS_OBJECT-INTERACTION` | Tương tác với Đối tượng | Sử dụng `collectItem`, `toggleSwitch`. |
| `CODING_COMMANDS_MULTI-OBJECTIVE` | Lập kế hoạch Đa mục tiêu | Lộ trình kết hợp di chuyển và tương tác nhiều đối tượng. |
| `CODING_COMMANDS_OBSTACLE-JUMPING` | Vượt Chướng ngại vật (Jump) | Sử dụng lệnh `jump` (lên, bằng, xuống). |
| `CODING_COMMANDS_3D-MOVEMENT` | Di chuyển trong Không gian 3D | Di chuyển qua các tầng độ cao khác nhau. |
| `CODING_COMMANDS_LOGIC-DEBUGGING` | Gỡ lỗi Logic | Sửa lệnh sai (ví dụ: trái thành phải). |
| `CODING_COMMANDS_SEQUENCE-DEBUGGING` | Gỡ lỗi Thứ tự | Sắp xếp lại chuỗi lệnh bị đảo lộn. |
| `CODING_COMMANDS_JS-SYNTAX` | Gỡ lỗi Cú pháp Javascript | Sửa lỗi cú pháp cơ bản JS (ngoặc, chấm phẩy). |
| `CODING_COMMANDS_MAZE-SOLVING-BASIC` | Giải Mê cung Cơ bản | Bài tổng hợp tìm đường ra mê cung đơn giản. |

### 2. Functions (Hàm)
| Code | Tên | Mô tả |
| :--- | :--- | :--- |
| `CODING_FUNCTIONS_REFACTORING` | Tái cấu trúc Code bằng Hàm | Gom nhóm code lặp lại thành hàm. |
| `CODING_FUNCTIONS_DEFINITION-AND-CALL` | Định nghĩa và Gọi hàm | Tự tạo hàm đơn giản và gọi nó. |
| `CODING_FUNCTIONS_DECOMPOSITION` | Phân rã Vấn đề bằng Hàm | Chia bài toán lớn thành các hàm con (drawColumn, crossBridge). |
| `CODING_FUNCTIONS_NESTING` | Xây dựng Hàm lồng nhau | Hàm gọi hàm (drawSquare gọi drawSide). |
| `CODING_FUNCTIONS_3D-APPLICATION` | Ứng dụng Hàm trong 3D | Hàm leo tầng, hàm xử lý 3D. |
| `CODING_FUNCTIONS_SYNTHESIS-PROJECT` | Dự án Tổng hợp bằng Hàm | Hệ thống nhiều hàm tương tác giải quyết bài toán lớn. |
| `CODING_FUNCTIONS_DEFINITION-DEBUGGING` | Gỡ lỗi Định nghĩa Hàm | Lỗi nằm bên trong thân hàm. |
| `CODING_FUNCTIONS_CALL-DEBUGGING` | Gỡ lỗi Lời gọi Hàm | Lỗi ở cách gọi hàm (sai thứ tự, sai vị trí). |
| `CODING_FUNCTIONS_SCOPE-DEBUGGING` | Gỡ lỗi Phạm vi Biến | Lỗi scope biến khi dùng với hàm. |

### 3. For Loops (Vòng lặp For)
| Code | Tên | Mô tả |
| :--- | :--- | :--- |
| `CODING_FOR-LOOPS_REFACTORING` | Tái cấu trúc bằng Vòng lặp For | Dùng vòng lặp để rút gọn code lặp. |
| `CODING_FOR-LOOPS_SIMPLE-ITERATION` | Lặp lại Hành động Đơn giản | Lặp lại hành động cơ bản (đi thẳng, vẽ hình vuông). |
| `CODING_FOR-LOOPS_COMBINED-ITERATION` | Lặp lại Kết hợp với Hàm | Gọi hàm bên trong vòng lặp. |
| `CODING_FOR-LOOPS_NESTED-ITERATION` | Vòng lặp lồng nhau | Xử lý lưới 2 chiều (hàng, cột). |
| `CODING_FOR-LOOPS_GEOMETRIC-DRAWING` | Vẽ Hình học | Vẽ sao, xoắn ốc bằng vòng lặp. |
| `CODING_FOR-LOOPS_3D-APPLICATION` | Ứng dụng Vòng lặp trong 3D | Leo cầu thang, tháp xoắn ốc. |
| `CODING_FOR-LOOPS_LOGIC-DEBUGGING` | Gỡ lỗi Logic Vòng lặp | Lỗi off-by-one, sai hành động trong lặp. |
| `CODING_FOR-LOOPS_NESTED-DEBUGGING` | Gỡ lỗi Vòng lặp lồng nhau | Lỗi tráo đổi vòng lặp, quay đầu sai. |
| `CODING_FOR-LOOPS_SYNTAX-DEBUGGING` | Gỡ lỗi Cú pháp Vòng lặp | Lỗi cú pháp for đặc thù JS. |

### 4. Variables (Biến)
| Code | Tên | Mô tả |
| :--- | :--- | :--- |
| `CODING_VARIABLES_DECLARATION-AND-ASSIGNMENT` | Khai báo và Gán giá trị | Tạo biến, gán giá trị, kiểu dữ liệu. |
| `CODING_VARIABLES_STATE-TRACKING` | Theo dõi Trạng thái | Bộ đếm (Counter), Cờ (Flag). |
| `CODING_VARIABLES_EXPRESSIONS` | Sử dụng Biến trong Biểu thức | Tính toán cộng trừ nhân chia biến. |
| `CODING_VARIABLES_CONFIGURATION` | Cấu hình Chương trình | Dùng biến làm tham số vòng lặp. |
| `CODING_VARIABLES_DATA-RETRIEVAL` | Lấy Dữ liệu từ Môi trường | Lưu cảm biến vào biến. |
| `CODING_VARIABLES_MANIPULATION-DEBUGGING` | Gỡ lỗi Thao tác Biến | Gán sai, tính sai. |
| `CODING_VARIABLES_LOGIC-DEBUGGING` | Gỡ lỗi Logic Biến | Cập nhật sai thời điểm, reset sai. |
| `CODING_VARIABLES_SCOPE-DEBUGGING` | Gỡ lỗi Phạm vi Biến | Global vs Local, var vs let. |

### 5. Conditionals & Logical Operators (Điều kiện & Logic)
| Code | Tên | Mô tả |
| :--- | :--- | :--- |
| `CODING_CONDITIONALS_SIMPLE-IF` | Rẽ nhánh Đơn (if) | Nếu... thì... |
| `CODING_CONDITIONALS_IF-ELSE` | Rẽ nhánh Kép (if-else) | Nếu... thì..., ngược lại... |
| `CODING_CONDITIONALS_MULTI-BRANCH` | Rẽ nhánh Đa chiều (if-else if) | Xử lý nhiều trường hợp loại trừ. |
| `CODING_CONDITIONALS_NESTED-LOGIC` | Logic Điều kiện lồng nhau | If lồng if. |
| `CODING_CONDITIONALS_IN-LOOPS` | Điều kiện trong Vòng lặp | Thích ứng môi trường trong mỗi bước lặp. |
| `CODING_CONDITIONALS_STATEFUL-DECISIONS` | Ra Quyết định dựa trên Trạng thái | If check biến (hasKey). |
| `CODING_CONDITIONALS_ADVANCED-SYNTAX` | Cú pháp Điều kiện Nâng cao | Truthy/falsy, toán tử 3 ngôi. |
| `CODING_CONDITIONALS_CONDITION-DEBUGGING` | Gỡ lỗi Mệnh đề Điều kiện | Sai mệnh đề so sánh. |
| `CODING_CONDITIONALS_STRUCTURE-DEBUGGING` | Gỡ lỗi Cấu trúc Rẽ nhánh | Tráo đổi if/else, thiếu else. |
| `CODING_CONDITIONALS_FLOW-DEBUGGING` | Gỡ lỗi Luồng Điều kiện | Đặt khối điều kiện sai vị trí (ngoài vòng lặp). |
| `CODING_LOGICAL-OPERATORS_NOT` | Toán tử Not | Đảo ngược điều kiện. |
| `CODING_LOGICAL-OPERATORS_AND` | Toán tử And | Cả hai cùng đúng. |
| `CODING_LOGICAL-OPERATORS_OR` | Toán tử Or | Một trong hai đúng. |
| `CODING_LOGICAL-OPERATORS_COMBINED-EXPRESSIONS` | Biểu thức Logic Phức hợp | Kết hợp And, Or, Not. |
| `CODING_LOGICAL-OPERATORS_REFACTORING` | Tái cấu trúc bằng Logic | Gom if lồng nhau thành biểu thức Logic. |
| `CODING_LOGICAL-OPERATORS_IN-LOOPS` | Logic trong Vòng lặp | Điều kiện dừng phức tạp. |
| `CODING_LOGICAL-OPERATORS_DEBUGGING` | Gỡ lỗi Biểu thức Logic | Dùng sai toán tử, sai thứ tự. |

### 6. While Loops (Vòng lặp While)
| Code | Tên | Mô tả |
| :--- | :--- | :--- |
| `CODING_WHILE-LOOPS_INDEFINITE-ITERATION` | Lặp lại Bất định | Lặp khi không biết trước số lần. |
| `CODING_WHILE-LOOPS_FOR-VS-WHILE` | For vs While | Lựa chọn cấu trúc lặp phù hợp. |
| `CODING_WHILE-LOOPS_STATE-CONTROLLED` | Vòng lặp Điều khiển bằng Trạng thái | While check biến. |
| `CODING_WHILE-LOOPS_COMPLEX-CONDITIONS` | Vòng lặp với Điều kiện Phức hợp | While với And/Or. |
| `CODING_WHILE-LOOPS_ALGORITHM-FOUNDATION` | Nền tảng Thuật toán | Vòng lặp chứa quyết định If. |
| `CODING_WHILE-LOOPS_INFINITE-LOOP-DEBUGGING` | Gỡ lỗi Vòng lặp Vô tận | Sửa lỗi treo chương trình. |
| `CODING_WHILE-LOOPS_LOGIC-DEBUGGING` | Gỡ lỗi Logic trong While | Sửa hành động sai trong lặp. |
| `CODING_WHILE-LOOPS_3D-APPLICATION` | Ứng dụng While trong 3D | Leo tháp cho đến khi tới đỉnh. |

### 7. Algorithms (Thuật toán)
| Code | Tên | Mô tả |
| :--- | :--- | :--- |
| `CODING_ALGORITHMS_PLANNING` | Lập kế hoạch và Phân rã | Viết giả mã, chia nhỏ bài toán. |
| `CODING_ALGORITHMS_IMPLEMENTATION` | Hiện thực hóa Thuật toán | Chuyển quy tắc thành code. |
| `CODING_ALGORITHMS_MAZE-SOLVING` | Thiết kế Thuật toán Giải Mê cung | Bám tường, tìm đường. |
| `CODING_ALGORITHMS_GRID-PROCESSING` | Thiết kế Thuật toán Xử lý Lưới | Dọn dẹp, tìm kiếm trên grid. |
| `CODING_ALGORITHMS_3D-APPLICATION` | Ứng dụng Thuật toán trong 3D | Bám tường 3D. |
| `CODING_ALGORITHMS_ANALYSIS-AND-COMPARISON` | Phân tích và So sánh | So sánh hiệu quả thuật toán. |
| `CODING_ALGORITHMS_OPTIMIZATION` | Tối ưu hóa Thuật toán | Xử lý edge cases, giảm bước đi. |
| `CODING_ALGORITHMS_DEBUGGING` | Gỡ lỗi Thuật toán | Sai ưu tiên logic, lỗi biên. |

### 8. Parameters (Tham số)
| Code | Tên | Mô tả |
| :--- | :--- | :--- |
| `CODING_PARAMETERS_REFACTORING` | Tái cấu trúc bằng Tham số | Gom hàm giống nhau bằng tham số. |
| `CODING_PARAMETERS_SINGLE-PARAM-FUNCTIONS` | Hàm có Một Tham số | Ví dụ: move(steps). |
| `CODING_PARAMETERS_MULTI-PARAM-FUNCTIONS` | Hàm có Nhiều Tham số | Ví dụ: drawRect(w, h). |
| `CODING_PARAMETERS_3D-APPLICATION` | Ứng dụng Tham số trong 3D | Cấu trúc 3D linh hoạt. |
| `CODING_PARAMETERS_ALGORITHM-PARAMETRIZATION` | Tham số hóa Thuật toán | Thuật toán chạy trên nhiều map size. |
| `CODING_PARAMETERS_DEBUGGING` | Gỡ lỗi Hàm có Tham số | Truyền sai giá trị, sai thứ tự. |
