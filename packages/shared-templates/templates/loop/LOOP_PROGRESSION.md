# Lộ trình Phát triển Kỹ năng Vòng lặp (Theo Chương trình GDPT)

Tài liệu này ánh xạ lộ trình dạy lập trình Vòng lặp (Loop) tiêu chuẩn (từ THCS/THPT) sang thiết kế màn chơi Maze 3D, với độ khó tăng dần từ nhận biết đến vận dụng cao.

## Triết lý Thiết kế

1.  **Đa dạng hóa Pattern**: Không cứng nhắc sử dụng Micro-pattern cố định; ưu tiên sự ngẫu nhiên của địa hình để tạo thử thách tự nhiên cho vòng lặp.
2.  **Logic "If" & Ngẫu nhiên**: Với các bài tập điều kiện (`if`, `while`), vị trí vật phẩm hoặc chướng ngại vật **phải được sinh ngẫu nhiên** mỗi lần chơi, buộc học sinh viết code logic (`if isPath`, `if hasGem`) thay vì hard-code đường đi.

---

## Bảng Đối chiếu Tổng quan

| Cấp độ | Checkpoint GDPT | Concept Lập trình | Cơ chế Game (Maze Design) | Ghi chú Kỹ thuật |
|:---:|---|---|---|---|
| **Làm quen** | 1. For cơ bản | Lặp số lần cố định | Đi thẳng quãng đường dài, lặp lại hành động đơn giản. | `repeat N` |
| | 2. For bước nhảy | Bước nhảy (Stride) | Nhảy cóc (Jump) hoặc đi bộ qua các hòn đảo cách quãng. | Random khoảng cách đảo |
| | 3. For + Biến chạy | Sử dụng biến `i` | Mô hình bậc thang tăng dần (đi 1, đi 2, đi 3...). | Hình nón / Cầu thang xoắn |
| | 4. While cơ bản | Điều kiện dừng đơn giản | Đi mãi cho đến khi gặp ngõ cụt hoặc đích. | Random độ dài đường đi |
| **Củng cố** | 5. While + Logic | Check điều kiện đầu vào | Check đường trước khi đi (`if path`). Giải mê cung đơn giản. | **Random path direction** |
| | 6. While + Tích lũy | Loop đến khi đủ lượng | Thu thập đủ N vật phẩm thì cửa mở. | **Random vị trí items** |
| | 7. Nested (Cơ bản) | Lặp lồng nhau (Grid) | Đi tuần tra khu vực hình chữ nhật (Nông trại, Sàn nhà). | Grid diện tích thay đổi |
| | 8. Nested (Biến đổi) | Loop lồng phụ thuộc `i` | Xây/Đi kim tự tháp, tam giác (Hàng sau dài hơn hàng trước). | Tam giác kích thước ngẫu nhiên |
| **Nâng cao** | 9. While + For | Kết hợp 2 loại loop | Đi đường chính (While) + Rẽ vào n ngõ cụt khám phá (For). | Trục chính ngẫu nhiên |
| | 10. Nested 3 tầng | 3D Loops | Xử lý tòa nhà nhiều tầng (Hàng x Cột x Tầng). | Tòa nhà cao tầng |
| | 11. Loop + Flag/Break | Thoát sớm (Break) | Tìm vật phẩm trong hàng, thấy thì dừng và chuyển hàng khác. | **Item ẩn ở vị trí ngẫu nhiên** |
| **Ứng dụng** | 12. Smart Agent | Giải thuật tìm đường | Mê cung ngẫu nhiên phức tạp (Wall follower). | Maze Generation Algorithm |

---

## Chi tiết Thiết kế Màn chơi (Theo Giai đoạn)

### Giai đoạn 1: Làm quen (Foundation)

#### 1. Hành lang vô tận (The Infinite Corridor)
*   **Concept**: `for i in range(10)`
*   **Mô tả**: Một con đường thẳng tắp rất dài để người chơi cảm thấy mệt mỏi nếu kéo thả thủ công.
*   **Kỹ thuật**: Sinh map đường thẳng độ dài cố định nhưng dài (ví dụ 10-15 ô).

#### 2. Quần đảo Nhảy cóc (Island Hopping)
*   **Concept**: `for i in range(0, 10, 2)` (Bước nhảy)
*   **Mô tả**: Các hòn đảo cách nhau 1 ô nước. Nhân vật phải nhảy (`jump`) hoặc đi cầu.
*   **Kỹ thuật**: Dùng `postProcess` để xóa các ô đất ở vị trí lẻ, tạo cảm giác đứt quãng.

#### 3. Cầu thang Vô cực (Stairway to Heaven)
*   **Concept**: `move(i)` (Sử dụng biến đếm)
*   **Mô tả**: Bậc thang với độ dài cạnh tăng dần (Bậc 1 dài 1 ô, Bậc 2 dài 2 ô...).
*   **Kỹ thuật**: Sinh path theo hình xoắn ốc mở rộng dần.

#### 4. Đường hầm Tối (The Dark Tunnel)
*   **Concept**: `while not_finished`
*   **Mô tả**: Đường đi độ dài ngẫu nhiên mỗi lần nhấn "Chạy". Người chơi không thể đếm ô.
*   **Kỹ thuật**: Random độ dài `LEN` trong khoảng [5, 15] mỗi lần generate.

---

### Giai đoạn 2: Củng cố & Tích lũy (Development)

#### 5. Khu rừng Mê cung (The Dense Forest)
*   **Concept**: `while isPath(ahead)`
*   **Mô tả**: Đường đi khúc khuỷu ngẫu nhiên. Người chơi phải dùng cảm biến `if path ahead` để quyết định đi tiếp hay rẽ.
*   **Kỹ thuật**: 
    *   Sinh đường đi ngẫu nhiên hoàn toàn (Random Walk).
    *   `Post-process`: Đặt cây dày đặc ở các ô không phải đường đi để chặn thị giác.

#### 6. Người Sưu tầm (The Collector)
*   **Concept**: `while crystals < TARGET`
*   **Mô tả**: Nhân vật ở trong một phòng đầy item. Vị trí item thay đổi mỗi lần chơi.
*   **Kỹ thuật**: 
    *   Sinh một phòng trống.
    *   **Logic Random**: Rải N item ngẫu nhiên trong phòng mỗi khi generate map.

#### 7. Nông trại Gà (The Chicken Farm)
*   **Concept**: `Nested Loop` (Hình chữ nhật)
*   **Mô tả**: Một mảnh đất `Items[Rows][Cols]`. Cần đi hết hàng, quay đầu, đi hàng tiếp theo.
*   **Kỹ thuật**: Sinh Grid chữ nhật kích thước ngẫu nhiên (dễ: 3x3, khó: 5x5).

#### 8. Kim Tự Tháp (The Pyramid)
*   **Concept**: `Nested Loop` phụ thuộc (Tam giác)
*   **Mô tả**: Xây dựng hoặc đi trên cấu trúc kim tự tháp.
*   **Kỹ thuật**: Sinh path zic-zac nhưng độ dài cạnh thay đổi theo tầng (`len = row_index`).

---

### Giai đoạn 3: Nâng cao Tư duy (Advanced Logic)

#### 9. Trục Xương cá (Fishbone Path)
*   **Concept**: `While (main) + For (sub)`
*   **Mô tả**: Một đường trục chính dài vô tận (While). Tại mỗi đốt xương, có một ngõ cụt dài cố định chứa kho báu (For).
*   **Kỹ thuật**: Trục chính sinh ngẫu nhiên. Nhánh phụ sinh cố định chiều dài `L`.

#### 10. Chung cư Cao tầng (Sky Scraper)
*   **Concept**: `3D Nested Loop`
*   **Mô tả**: Tương tự "Nông trại" nhưng sau khi dọn xong 1 sàn, phải tìm cầu thang lên tầng trên và lặp lại quy trình.
*   **Kỹ thuật**: Sử dụng `postProcess` kiểu `building` để chồng các layer map lên nhau.

#### 11. Cuộc tìm kiếm (Search & Break)
*   **Concept**: `Loop + Break`
*   **Mô tả**: Có 5 hành lang. Chỉ 1 hành lang có chìa khóa (vị trí ngẫu nhiên).
*   **Kỹ thuật**: 
    *   Sinh 5 nhánh path giống hệt nhau.
    *   **Logic Random**: Đặt chìa khóa vào cuối 1 nhánh bất kỳ. Các nhánh còn lại để trống hoặc có bẫy.
    *   Yêu cầu dùng `break` khi tìm thấy để tối ưu bước đi (tính điểm).

---

### Giai đoạn 4: Ứng dụng & Giải thuật (Mastery)

#### 12. Smart Explorer (Wall Follower AI)
*   **Concept**: `While True + Complex Logic`
*   **Mô tả**: Mê cung hoàn chỉnh không biết trước cấu trúc.
*   **Kỹ thuật**: Sử dụng thuật toán sinh mê cung chuẩn (Prim/Kruskal).
*   **Yêu cầu**: Code giải thuật bám tường hoặc tìm đường tổng quát.
