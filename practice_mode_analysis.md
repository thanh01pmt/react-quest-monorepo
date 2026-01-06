# Phân Tích Hệ Thống Tạo Màn Chơi Chế Độ Luyện Tập (Practice Mode)

Tài liệu này phân tích chi tiết cách thức chế độ Practice Mode tận dụng nền tảng `Quest Map Builder` để tạo ra các màn chơi tự động, đồng thời giải thích nguyên nhân và giải pháp cho các vấn đề bạn đã gặp phải (Sự thiếu đa dạng & Lỗi vị trí đích).

## 1. Kiến trúc Hệ thống

Quy trình tạo màn chơi trong Practice Mode đi qua 3 tầng xử lý chính:

### Tầng 1: Template Engine (Lõi Academic Map Generator)
Đây là "động cơ" giống hệt Engine dùng trong Map Builder.
- **Input:** Code mẫu (Template Code) + Tham số (Parameters).
- **Process:** Chạy giả lập (Trace) các lệnh di chuyển trong code để "vẽ" ra đường đi.
- **Output:** Dữ liệu thô (`SolutionDrivenResult`) gồm: block đất, vị trí vật phẩm, vị trí player, đường đi (`path_coords`).

### Tầng 2: Practice Generator (Bộ tạo ngẫu nhiên)
Lớp này bọc bên ngoài để tạo sự ngẫu nhiên cho bài tập.
- **Quản lý danh sách Template:** Chứa các template cơ bản (`sequential`, `loop`, `if_else`...).
- **Randomize Tham số:** Thay vì user nhập tay như trong Builder, hệ thống tự động random các biến số (ví dụ: số lượng pha lê từ 2-6, độ dài đường đi 3-8) dựa trên độ khó (`DifficultyLevel`).
- **Chọn Template:** Dựa trên cấu hình Topic (ví dụ: chỉ chọn topic "Vòng lặp"), nó sẽ lọc ra các template phù hợp.

### Tầng 3: Quest Mapper (`ExerciseToQuestMapper`)
Chuyển đổi dữ liệu thô thành `Quest` object để `QuestPlayer` có thể chơi được.
- **Map Data:** Chuyển đổi tọa độ block/item sang format của Game Engine.
- **Failsafe:** Kiểm tra và sửa lỗi dữ liệu (ví dụ: thêm block đất còn thiếu).

---

## 2. Phân Tích Vấn Đề Hiện Tại

### Vấn đề 1: Thiếu sự đa dạng (Uniformity Issue)
**Hiện tượng:** "Chỉ có 1 map được tạo bởi 1 pattern duy nhất".

**Nguyên nhân:**
Hệ thống hiện tại đang sử dụng danh sách `BUNDLED_TEMPLATES` (trong `PracticeContent.tsx`) rất hạn chế. Chỉ có **5 template** được định nghĩa sẵn:
1. `crystal-trail-basic` (Sequential)
2. `staircase-climb` (Loop)
3. `zigzag-path` (Loop)
4. `crystal-or-switch` (Conditional)
5. `collect-procedure` (Function)

Khi bạn chọn chế độ "Challenge Me", hệ thống random các chủ đề. Tuy nhiên, nếu nó chọn chủ đề `Function`, chỉ có **duy nhất 1 template** (`Generate Procedure`) để sử dụng. Dù tham số (số lần lặp) có thay đổi, hình dáng cơ bản (shape) của bản đồ vẫn giữ nguyên do logic tạo map là `Solution-Driven` (map sinh ra từ code). Code giống nhau -> Map có cấu trúc giống nhau.

**Giải pháp đề xuất:**
Cần bổ sung thêm nhiều Template khác nhau cho cùng một concept. Ví dụ với `Loop`, ngoài `zigzag` và `staircase`, cần thêm `spiral`, `rectangle`, `random-walk`.

### Vấn đề 2: Lỗi điểm kết thúc (Finish Position Issue)
**Hiện tượng:** "Điểm kết thúc không nằm trên path_coords".

**Phân tích kỹ thuật:**
Map được tạo ra từ dấu vết di chuyển (`trace`).
- Nếu code kết thúc bằng `turnRight()`, vị trí Player không thay đổi.
- Tuy nhiên, logic tạo đất (`buildGroundBlocks`) trước đây chỉ dựa vào danh sách các tọa độ ĐÃ di chuyển qua.
- Đôi khi tọa độ đích (`endPosition`) được xác định logic bởi Engine nhưng lại chưa được "ghi vào" danh sách block cần xây, dẫn đến việc đích bị treo lơ lửng hoặc thiếu block đất.

**Giải pháp đã áp dụng:**
1. **Fix tại gốc (`SolutionBuilder.ts`):** Đã thêm logic kiểm tra: Nếu `endPosition` chưa có trong danh sách block đất, bắt buộc thêm vào.
2. **Fix tại ngọn (`ExerciseToQuestMapper.ts`):** Đã thêm cơ chế **Failsafe**. Trước khi trả về Quest cho người chơi, hệ thống kiểm tra ngay lập tức xem dưới chân điểm đích (`finish`) có block đất không. Nếu không, nó tự động chèn thêm một block đất vào vị trí đó.

Điều này đảm bảo 100% đích luôn nằm trên một block đất hợp lệ, giúp Player có thể di chuyển đến đó.

---

## 3. Tổng kết & Hướng đi tiếp theo

Hệ thống Practice Mode đã tận dụng tốt sức mạnh của công cụ tạo bản đồ tự động (Builder), nhưng đang bị giới hạn bởi **số lượng nội dung mẫu (Template Content)**.

**Kế hoạch nâng cấp:**
1. **Mở rộng thư viện Template:** Viết thêm khoảng 10-15 template mới phủ đều các concept để tăng sự đa dạng hình học.
2. **Advanced Randomization:** Thay vì chỉ random tham số số học (`N=3` vs `N=5`), có thể random cả cấu trúc code (ví dụ: template hỗ trợ biến thể `turnLeft` hoặc `turnRight` ngẫu nhiên).

Hệ thống hiện tại đã ổn định về mặt kỹ thuật (Logic sinh map, validate đường đi), vấn đề còn lại chủ yếu là bổ sung Content (Template).
