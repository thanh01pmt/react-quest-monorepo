# Phân tích chi tiết `extract_map_info.py`

## 🎯 Chức năng chính

Script này **quét và trích xuất thông tin** từ các file game map JSON đã hoàn thiện, sau đó tổng hợp thành file Excel để quản lý như một "ngân hàng câu hỏi".

---

## 📥 Input Files

| Thư mục nguồn | Mô tả |
|--------------|-------|
| `data/3_generated_levels/solvable/` | Quét đệ quy tất cả file `.json` trong thư mục này và các thư mục con |

---

## 📤 Output Files

| File | Đường dẫn | Mô tả |
|------|-----------|-------|
| **Question Bank** | `data/0_source/question_bank.xlsx` | File chính - được **cập nhật/ghi tiếp** với dữ liệu mới, loại bỏ trùng lặp |
| **Báo cáo riêng** | `data/5_reports/map_data_export_{timestamp}.xlsx` | File báo cáo cho từng lần quét (mới tạo mỗi lần chạy) |

---

## 📊 Dữ liệu được trích xuất

Script trích xuất **17 trường thông tin** từ mỗi file JSON:

| Trường | Nguồn trong JSON | Mô tả |
|--------|------------------|-------|
| `id` | `id` (loại bỏ `-var*`) | Base ID của câu hỏi |
| `question_codes` | `id` | ID đầy đủ bao gồm cả variant |
| `topic` | `topic` | Chủ đề |
| `grade` | `grade` | Khối lớp |
| `challenge_type` | `challenge_type` | Loại thử thách |
| `difficulty_code` | `difficulty_code` | Mã độ khó |
| `gen_map_type` | `gen_map_type` | Loại topology |
| `gen_logic_type` | `gen_logic_type` | Loại placer logic |
| `core_skill_codes` | `core_skill_codes` | Danh sách kỹ năng (dạng chuỗi) |
| `toolboxPresetKey` | `blocklyConfig.toolboxPresetKey` | Bộ công cụ Blockly |
| `difficulty_intrinsic` | `difficulty_intrinsic` | Độ khó nội tại |
| `level` | `level` | Level trong game |
| `rawActionsCount` | `solution.rawActionsCount` | Số hành động thô |
| `optimalBlocks` | `solution.optimalBlocks` | Số khối tối ưu |
| `optimalLines` | `solution.optimalLines` | Số dòng code tối ưu |
| `crystalCount` | `solution.itemGoals.crystal` | Số crystal cần thu |
| `switchCount` | `solution.itemGoals.switch` | Số switch cần bật |
| `obstacleCount` | `gameConfig.obstacles.length` | Số chướng ngại vật |

---

## 🚀 Cách sử dụng

```bash
# Di chuyển vào thư mục dự án
cd /path/to/GenMap

# Chạy script
python3 scripts/extract_map_info.py
```

**Không cần tham số** - Script tự động quét thư mục và xuất file.

---

## 🔄 Logic xử lý đặc biệt

1. **Lọc trùng lặp trong lần quét**: Dùng `Set` để theo dõi các `question_codes` đã xử lý
2. **Merge với dữ liệu cũ**: Nếu `question_bank.xlsx` đã tồn tại, script sẽ:
   - Đọc file cũ
   - Concat với dữ liệu mới
   - Drop duplicates (giữ bản ghi **cuối cùng** - tức dữ liệu mới nhất)
   - Sort theo `id` và `question_codes`
3. **Tạo reports**: Mỗi lần chạy tạo một file báo cáo riêng với timestamp

---

## ⚠️ Lưu ý quan trọng

- Script quét thư mục `data/3_generated_levels/solvable/`, **không phải** `data/final_game_levels/` như mô tả trong header comment (có vẻ code đã được cập nhật nhưng comment chưa được sync).
- File `question_bank.xlsx` được đặt trong `data/0_source/` - cùng thư mục với source files để dễ dàng import vào hệ thống khác.
