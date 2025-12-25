Sau khi rà soát kỹ lưỡng logic từ `GeometricDecomposer` (Tier 1) đến `PedagogicalPlacer` (Tier 4), tôi nhận thấy hệ thống này được thiết kế bài bản nhưng vẫn tồn tại một số **lỗ hổng logic (logical flaws)** và **điểm mù (blind spots)** có thể gây ra lỗi trong các trường hợp bản đồ không chuẩn hoặc phức tạp.

Dưới đây là phân tích chi tiết các lỗi và rủi ro tiềm ẩn:

### 1. Lỗi nghiêm trọng: Xử lý đường chéo (Diagonal Paths) ở Tier 1
Trong file `GeometricDecomposer.ts`, hàm `traceAllSegments` chịu trách nhiệm tìm các đường đi (Path) không thuộc về Area.

*   **Logic hiện tại:**
    Hàm sử dụng `getCardinalDirections()` trả về 3 hướng trục chính: `(1,0,0)`, `(0,1,0)`, `(0,0,1)`.
    ```typescript
    // GeometricDecomposer.ts
    private getCardinalDirections(): Vector3[] {
      return [
        { x: 1, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
        { x: 0, y: 0, z: 1 },
      ];
    }
    ```
*   **Vấn đề:** Hệ thống **bỏ qua hoàn toàn các đường đi chéo** (ví dụ: cầu thang zic-zac từng block một `(0,0)->(1,1)->(2,2)`).
*   **Hệ quả:**
    *   Một đường chéo liền mạch sẽ bị hệ thống hiểu là các block rời rạc (`isolated`) hoặc các đoạn thẳng siêu ngắn (độ dài 1 block).
    *   Tier 2 và 3 sẽ không thể gộp chúng thành một `Segment` dài -> Logic đặt vật phẩm cho vòng lặp (Loop) sẽ thất bại vì không nhận diện được độ dài thực của đường đi.

### 2. Lỗ hổng trong Logic Gộp (Merging Logic) ở Tier 3
Trong file `SegmentFilter.ts`, class chịu trách nhiệm làm sạch dữ liệu.

*   **Logic hiện tại:**
    ```typescript
    // SegmentFilter.ts
    private mergeAdjacentSegments(segments: PathSegment[]): PathSegment[] {
      // Simplified: just return as-is for now
      // TODO: Implement actual merging logic
      return segments;
    }
    ```
*   **Vấn đề:** Hàm này đang **trả về nguyên vẹn (`return segments`)** mà chưa thực hiện logic gộp.
*   **Hệ quả:**
    *   Nếu bản đồ được sinh ra theo từng chunk (mảng nhỏ) hoặc người dùng vẽ một đường thẳng nhưng chia làm 2 lần vẽ, hệ thống sẽ coi đó là **2 đoạn thẳng riêng biệt** thay vì 1 đoạn dài.
    *   **Ví dụ:** Một đường thẳng dài 10 block bị cắt đôi thành 2 đoạn 5 block. Tier 4 sẽ ưu tiên dạy `Sequential` (Tuần tự) thay vì `Loop` (Vòng lặp) vì nó không thấy đoạn nào đủ dài để lặp.

### 3. Rủi ro nhận diện "Area" vs "Thick Path" (Vùng vs Đường dày)
Trong `GeometricDecomposer.ts`, thuật toán Erosion được dùng để tìm Area.

*   **Logic hiện tại:**
    Dùng lõi 3x3 (neighbors = 4) để xác định Area. Nếu không tìm thấy lõi, nó fallback về tìm Junction.
*   **Điểm mù:** Các vùng có chiều rộng nhỏ (Width = 2 block).
    *   Một đường đi rộng 2 block (double path) sẽ không có "lõi" (block nào cũng có ít nhất 1 mặt tiếp xúc không khí).
    *   Hàm fallback `findAreasFallback` dựa vào Junction. Nếu đường rộng 2 block này thẳng tuột (không có ngã ba), nó **không được nhận diện là Area, cũng không được trace là Segment chuẩn** (do logic trace segment thường đi theo tim đường 1 block).
*   **Hệ quả:** Các block thuộc đường rộng 2 block có thể bị bỏ sót hoàn toàn khỏi danh sách `selectableElements`.

### 4. Logic phát hiện Topology (Tier 4) quá cứng nhắc (Brittle Heuristics)
Trong `PedagogicalPlacer.ts`, hàm `detectTopology` dùng các con số cố định (Magic Numbers).

*   **Logic hiện tại:**
    ```typescript
    if (parallelCount >= 4) return 'grid';
    if (longest.length >= 15 && junctionCount === 0) return 'spiral';
    ```
*   **Vấn đề:**
    *   Một bản đồ Grid nhỏ (3x3) có thể chỉ có 2-3 cặp song song -> Không nhận ra Grid.
    *   Một đường xoắn ốc ngắn (dài 14 block) -> Không nhận ra Spiral.
*   **Hệ quả:** Hệ thống sẽ fallback về `unknown` hoặc `linear`, dẫn đến việc đề xuất các concept học thuật không tối ưu (ví dụ: đáng lẽ dạy Nested Loop cho Grid thì lại dạy Sequential).

### 5. Lỗi xác định "Mũi tên" (Arrow Logic) trong Prioritizer
Trong `CoordinatePrioritizer.ts`, logic tìm mũi tên của Topology `arrow`:

*   **Logic hiện tại:**
    ```typescript
    const tip = findFurthestFromCenter(mainSeg.points, center);
    ```
    Nó giả định điểm xa tâm nhất (Center của bounding box toàn map) chính là đầu mũi tên.
*   **Vấn đề:**
    *   Nếu mũi tên hướng **vào trong** (ví dụ: người chơi đi từ ngoài vào tâm), thì "đuôi" mũi tên mới là điểm xa tâm nhất.
    *   Nếu hình dạng mũi tên không cân đối (cánh quá dài lệch về một bên), tâm (Center) bị lệch, dẫn đến tính toán `FurthestFromCenter` sai.
*   **Hệ quả:** Vật phẩm Goal (đích đến) có thể bị đặt nhầm ở đuôi mũi tên thay vì đầu mũi tên.

### 6. Sự phụ thuộc vào Metadata (Composite Bypass)
Hệ thống mới thêm logic `analyzeComposite` để đọc metadata từ quá trình sinh map (Generation phase).

*   **Rủi ro:** Đây là con dao hai lưỡi.
    *   Nếu map được sinh từ `TopologyPanel` (có metadata chuẩn), nó hoạt động tốt.
    *   Nếu map được **Import từ bên ngoài** hoặc người dùng **xóa bớt block thủ công** làm sai lệch metadata, hệ thống vẫn tin vào metadata cũ thay vì phân tích lại hình học thực tế.
    *   **Ví dụ:** Metadata bảo đây là "Hình vuông" (Island), nhưng người dùng đã đục thủng nó thành hình chữ U. Analyzer vẫn xử lý nó như hình vuông -> Đặt vật phẩm vào chỗ không khí (nơi đã bị đục).

### Tổng kết & Khuyến nghị

Codebase này có cấu trúc rất tốt (Clean Architecture), nhưng phần **thuật toán hình học (Algorithm)** cần được tinh chỉnh để xử lý các edge-case:

1.  **Fix gấp Tier 1:** Cập nhật `getCardinalDirections` để bao gồm cả các vector chéo (diagonals) hoặc áp dụng thuật toán `JPS` (Jump Point Search) để trace đường đi.
2.  **Implement Tier 3:** Phải viết code cho hàm `mergeAdjacentSegments`. Kiểm tra tính thẳng hàng (Collinear) của 2 segment liền kề để gộp chúng.
3.  **Cải tiến Tier 4:** Chuyển từ "Hard Rules" (>= 15 blocks) sang "Fuzzy Logic" (tỷ lệ độ dài, mật độ kết nối) để nhận diện Topology chính xác hơn.
4.  **Re-validate Metadata:** Trước khi dùng Composite Metadata, hãy kiểm tra nhanh xem các block trong metadata có thực sự tồn tại ở vị trí đó không.