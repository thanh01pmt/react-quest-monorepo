# QUY TRÌNH XÂY DỰNG NỘI DUNG HƯỚNG DẪN (LESSON GUIDE)

Tài liệu này quy chuẩn hóa các bước để tạo ra một bài học (Lesson) chất lượng cao, đảm bảo tính sư phạm và kỹ thuật cho học sinh từ lớp 3 đến lớp 8.

---

## GIAI ĐOẠN 1: NGHIÊN CỨU & THU THẬP DỮ LIỆU

### 1. Xác định Mục tiêu
- Tra cứu `MASTER_GUIDE_MAPPING.md` để biết Lesson này thuộc chủ đề (Subject) nào và loại thử thách (Challenge Type) gì.
- Liệt kê danh sách các Map ID (Question Code) sẽ được sử dụng làm ví dụ minh họa.

### 2. Phân tích Kỹ thuật Map (File JSON)
Mở file JSON của từng map thực tế để trích xuất:
- **Mục tiêu**: Xem `solution.itemGoals` (nhặt bao nhiêu pha lê, gạt bao nhiêu cần gạt).
- **Địa hình**: Xem `gameConfig.gen_map_type` (đường thẳng, chữ L, xoắn ốc 3D...).
- **Lời giải mẫu**: Xem `solution.structuredSolution` để lấy mã XML dùng cho thẻ `<blocklyxml>`.
- **Số khối tối ưu**: Xem `solution.optimalBlocks`.

---

## GIAI ĐOẠN 2: CẤU TRÚC NỘI DUNG SƯ PHẠM

Nội dung phải tuân thủ các quy tắc định dạng nghiêm ngặt sau:

### 1. QUY TẮC ĐỊNH DẠNG (STYLE GUIDE)
- **Tiêu đề (Headers)**: Phải viết HOA TOÀN BỘ (ví dụ: `# BÀI 1: KHÁM PHÁ...`, `## I. LÀM QUEN...`).
- **Ghi chú/Mẹo**: Sử dụng trích dẫn `> **Mẹo**: ...` hoặc `> **Bí kíp**: ...`.
- **Văn bản bình thường**: Viết hoa chữ cái đầu mỗi câu (Sentence case).
- **Ngôn ngữ**: Sử dụng 100% tiếng Việt.
- **Tên lệnh & Nhóm lệnh**: Phải tra cứu và sử dụng chính xác tên tiếng Việt trong file `vi.json` và `blocks.ts`. 
    - *Ví dụ*: Không viết "moveForward" mà viết "đi tới"; không viết "Toolbox" mà viết "hộp công cụ".
    - *Hành động*: "thu thập" (collect), "bật công tắc" (toggle_switch), "nhảy tới" (jump).

### 2. Cấu trúc bài học tiêu chuẩn
- **Tiêu đề**: Tên bài học rõ ràng (VIẾT HOA TOÀN BỘ).
- **Dẫn nhập**: Giới thiệu mục tiêu bài học (Telescope goal).
- **Kiến thức mới**: Giải thích khái niệm (Biến, Vòng lặp, Hàm...) kèm theo ví dụ thực tiễn.
- **Hướng dẫn Công cụ**: Giải thích cách dùng khối mới trong **Hộp công cụ**.
- **Ví dụ Demo (Cực kỳ quan trọng)**: Trình bày bản đồ thực tế kèm theo mã lệnh mẫu và diễn giải tư duy.

---

## GIAI ĐOẠN 3: LẬP KẾ HOẠCH TÀI NGUYÊN HÌNH ẢNH

Mỗi phần kiến thức cần có minh họa trực quan.

### 1. Chèn Placeholder Ảnh
Sử dụng cú pháp: `![Mô tả ảnh](ten_file.png)`

### 2. Ghi chú Tài nguyên (Asset Notes)
Dưới mỗi ảnh, cung cấp:
- **Ghi chú chụp ảnh (Screenshot Notes)**: Chỉ rõ bộ phận giao diện nào cần chụp, trạng thái nào.
- **AI Prompt**: Sử dụng phong cách: "A 3D character in a stone maze, modern clean style, [hành động cụ thể]".

---

## GIAI ĐOẠN 4: TÍCH HỢP KỸ THUẬT (INTERACTIVE CODE)

Sử dụng thẻ `<blocklyxml>` để học sinh có thể chạy thử code ngay trong bài học.

### 1. Cú pháp thẻ & Hiển thị
Cung cấp `mapid` để hệ thống hiển thị nút **▶ Run Code** và tự động scale khung hình.

```html
<blocklyxml mapid="ID_THỰC_TẾ">
<xml xmlns="https://developers.google.com/blockly/xml">
  <!-- Nội dung XML blocks -->
</xml>
</blocklyxml>
```

### 2. Quy tắc Hiển thị Tự động (Dynamic Sizing)
Hệ thống sẽ tự động tính toán chiều cao khung chứa (Container Height):
- **1 khối lệnh**: 140px (Gọn gàng).
- **Chương trình dài**: Tự động dãn nở tối đa 1000px.
- **Tùy chỉnh**: Nếu muốn cố định chiều cao, thêm thuộc tính: `<blocklyxml height="400px">`.

### 3. Diễn giải Code
Luôn đi kèm một đoạn văn ngắn giải thích luồng thực thi: "Bước 1 làm gì... Bước 2 làm gì... Tại sao dùng khối lệnh này...".
Học sinh nên được khuyến khích sử dụng chế độ **Gỡ lỗi (🐌)** để quan sát hành động.

---

## GIAI ĐOẠN 5: KIỂM TRA & HOÀN THIỆN

- Đảm bảo có **dòng trống** trước và sau thẻ `<blocklyxml>` để tránh lỗi vỡ định dạng Markdown.
- Kiểm tra Routing trong `App.tsx` đảm bảo map ID đó sẽ mở đúng bài hướng dẫn này.
- Kiểm tra tính đúng đắn của code mẫu (khối lệnh có sáng lên khi chạy không).

---
*Tài liệu này là Single Source of Truth cho mọi hoạt động xây dựng học liệu trên hệ thống.*
