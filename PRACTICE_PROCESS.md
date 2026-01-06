# Quy trình Tạo Map cho Practice Mode (Hiện tại)

Tài liệu này mô tả chi tiết luồng dữ liệu và quy trình kỹ thuật để tạo ra một màn chơi trong chế độ Luyện tập (Practice Mode) của React Quest.

## Tổng quan Kiến trúc

```mermaid
graph TD
    A[Markdown Templates] -->|Build Script| B[Bundled Templates (JSON)]
    B -->|Import| C[PracticeContent (Client)]
    C -->|Register| D[TemplateRegistry]
    
    U[User: Challenge Me] -->|Config| E[PracticeGenerator]
    D --> E
    
    E -->|Select & Randomize| F[GeneratedExercise]
    F -->|Map| G[ExerciseToQuestMapper]
    
    G -->|Resolve Code| H[SolutionDrivenGenerator]
    H -->|Build Blocks| I[Quest Object]
    I -->|Render| J[QuestPlayer]
```

## 1. Quản lý Template (`@repo/shared-templates`)

### Nguồn (Source)
Các mẫu bài tập được lưu dưới dạng file Markdown (`.md`) tại thư mục:
`packages/shared-templates/templates/`

Cấu trúc một file template (`crystal-trail.md`):
```markdown
---
id: crystal-trail
category: sequential
difficulty: 1
---
## Parameters
var _COUNT_ = 3;

## Solution Code
for (let i = 0; i < _COUNT_; i++) { ... }
```

### Build Process (Pre-processing)
Để tối ưu hiệu năng và tránh lỗi Browser (do thiếu Node Buffer), chúng ta sử dụng một script build:
- **Script**: `packages/shared-templates/scripts/generate-templates.js`
- **Hoạt động**:
    1. Quét toàn bộ thư mục templates.
    2. Parse Frontmatter và tách Code blocks bằng Regex/Gray-matter (tại môi trường Node).
    3. Đóng gói thành file `src/bundled-templates.ts` chứa mảng JSON object.
- **Kết quả**: `PracticeContent` có thể import trực tiếp dữ liệu sạch mà không cần parse tại runtime.

## 2. Khởi tạo Phiên (Practice Session)

Khi người dùng chọn chế độ (ví dụ: "Challenge Me"):
1. `PracticePage` tạo ra `PracticeConfig`.
2. Random chọn chủ đề (Topics) và độ khó.
3. Lưu config vào `sessionStorage`.

## 3. Sinh Bài Tập (`PracticeGenerator`)

Class `PracticeGenerator` chịu trách nhiệm tạo logic bài tập (chưa phải map 3D):
1. **Lọc Template**: Dựa trên Config (Category, Difficulty) để lấy danh sách template phù hợp từ Registry.
2. **ngẫu nhiên hóa (Randomization)**:
    - Với mỗi template, generator sẽ random giá trị cho các tham số (ví dụ: `_COUNT_` từ 3 đến 5).
    - Sử dụng `SeededRandom` để đảm bảo tính tất định (kết quả giống nhau nếu cùng seed).
3. **Output**: Tạo ra đối tượng `GeneratedExercise` chứa:
    - `templateId`: ID của template gốc.
    - `parameters`: Key-value các tham số đã random (VD: `{ _COUNT_: 4 }`).

## 4. Chuyển đổi thành Map (`ExerciseToQuestMapper`)

Đây là bước quan trọng nhất để biến logic thành map 3D.
File: `apps/react-quest-app/src/services/ExerciseToQuestMapper.ts`

### Bước 4.1: Resolve Code
- Lấy `solutionCode` gốc từ Registry dựa trên `templateId`.
- Gọi hàm `applyParameters(code, parameters)` (từ `parameters.ts`) để thực hiện **Thay thế toàn cục (Global Regex Replace)**.
- Ví dụ: Biến code `for (i < _COUNT_)` thành `for (i < 4)`.

### Bước 4.2: Giả lập (Simulation)
- Gọi `generateFromCode()` của `@repo/academic-map-generator`.
- **TemplateInterpreter**: Chạy đoạn code đã resolve (ảo). Ghi nhận các hành động `moveForward`, `turnRight`... thành một vết (trace).
- **SolutionBuilder**: Dựa trên vết di chuyển, "xây" các block đất (ground) và đặt vật phẩm (crystal) tại các vị trí tương ứng.

### Bước 4.3: Đóng gói Quest
- Chuyển output của generator (GameConfig) thành object `Quest` chuẩn của React Quest.
- **Failsafe**: Kiểm tra vị trí đích (Finish). Nếu Generator không tạo block đất dưới chân đích (do lỗi logic cũ), Mapper sẽ tự động chèn thêm một block đất để đảm bảo map chơi được.

## 5. Hiển thị (`PracticeContent`)

- Object `Quest` cuối cùng được truyền vào component `<QuestPlayer />`.
- Player dựng cảnh 3D và cho phép người dùng kéo thả block để giải bài toán.

---
**Cải tiến mới nhất (vừa cập nhật):**
- Đã chuyển từ Hardcode template sang file Markdown rời.
- Đã fix lỗi `Buffer is not defined` bằng cách pre-parse template.
- Đã fix lỗi "Map giống hệt" bằng cách đảm bảo `ExerciseToQuestMapper` sử dụng tham số random thực tế thay vì tham số mặc định.
