# Hướng Dẫn Tạo Map Luyện Tập Mới

Để hệ thống tự động load đúng Map vào đúng bài học, bạn hãy làm theo quy trình chuẩn sau:

## 1. Tạo File Map (JSON)
Chúng ta sẽ lưu các map dùng cho luyện tập vào thư mục:
`apps/react-quest-app/quests/practice/`

### Quy ước đặt tên
Để dễ quản lý, hãy đặt tên file theo cấu trúc:
`TOPIC_NAME.LESSON_ID.json`

Ví dụ: 
- `FUNCTIONS.BASIC_1.json`
- `LOOPS.FOR_LOOP_DEMO.json`

### Cấu trúc File
Bạn có thể copy file mẫu từ `quests/demo/` hoặc dùng Tool Map Builder. Quan trọng nhất là trường `id` bên trong file JSON phải **DUY NHẤT** và **KHỚP** với tên file (để dễ tìm).

```json
{
  "id": "FUNCTIONS.BASIC_1",
  "gameType": "maze",
  ... (các cấu hình khác)
}
```

## 2. Gắn Map vào Bài Học (Markdown)
Mở file hướng dẫn tương ứng trong `public/guides/` (ví dụ `lesson3.md`).

Chèn thẻ XML đặc biệt sau vào chỗ bạn muốn người dùng dừng lại để thực hành:

```xml
<blocklyxml mapid="FUNCTIONS.BASIC_1" height="300px">
<xml xmlns="https://developers.google.com/blockly/xml">
   ... (Mã XML trích xuất từ file JSON) ...
</xml>
</blocklyxml>
```

**Lưu ý quan trọng:**
- `mapid`: Phải khớp 100% với `id` trong file JSON. Thuộc tính này cực kỳ quan trọng vì nó sẽ kích hoạt nút **▶ Run Code** trên giao diện, cho phép học sinh nộp bài giải ngay từ bài học.
- `height` (Tùy chọn): Hệ thống tự dãn khung theo số khối lệnh. Chỉ dùng `height` nếu bạn muốn khống chế kích thước cố định (ví dụ: `200px`, `400px`).
- **Khoảng trắng**: Hãy để 1 dòng trống phía trên và phía dưới thẻ `<blocklyxml>` để đảm bảo Markdown hiển thị đẹp nhất.
- **xmlns**: Luôn bao gồm thuộc tính `xmlns="https://developers.google.com/blockly/xml"` trong thẻ `<xml>` để tránh lỗi render.

## 3. Kiểm tra
1. Chạy `pnpm run dev`.
2. Mở bài học trên trình duyệt.
3. Bấm nút **▶ Run Code** tại vị trí bạn vừa chèn. Nếu nút không hiện, hãy kiểm tra lại xem bạn đã điền đúng `mapid` chưa.
4. Kiểm tra xem Game Player có load đúng map và code mẫu không.

---

### Mẹo: Lấy code XML ở đâu?
1. Bạn có thể mở Map Builder hoặc trang Player hiện tại.
2. Kéo thả các khối lệnh mong muốn (đặc biệt là khối `maze_start`).
3. Dùng công cụ Developer Tools hoặc xem file JSON `startBlocks` để copy mã XML.
4. Nhớ định dạng lại XML (Pretty print) cho dễ đọc trong file Markdown.

### Gợi ý về Hình ảnh (Visuals)
Khi viết nội dung hướng dẫn, hãy dùng ảnh screenshot thực tế của map đó để học sinh dễ hình dung vị trí tương quan. Sử dụng phong cách 3D, hiện đại và sạch sẽ cho các ảnh minh họa khái niệm.
