# scripts/check_duplicates_and_report.py

# --- MÔ TẢ TÍNH NĂNG ---
# Script này thực hiện việc dọn dẹp và báo cáo các file game trong thư mục 'data/final_game_levels'.
# Chức năng chính bao gồm:
# 1. Quét tất cả các file .json trong thư mục.
# 2. Tính toán mã hash (SHA256) của nội dung mỗi file để xác định các file trùng lặp.
# 3. Tự động xóa các file có nội dung trùng lặp. Có một logic đặc biệt để ưu tiên giữ lại
#    các file có chữ " copy" trong tên (thường là các file được chỉnh sửa thủ công và sao chép).
# 4. Đổi tên các file " copy" đã được giữ lại về tên gốc.
# 5. Tạo một file báo cáo Excel liệt kê tất cả các file duy nhất còn lại.
#
# --- CÁCH CHẠY ---
# Mở terminal, di chuyển vào thư mục gốc của dự án (GenMap) và chạy lệnh:
#
# python3 scripts/check_duplicates_and_report.py
#

import os
import hashlib
import pandas as pd
from datetime import datetime

# --- Cấu hình đường dẫn ---
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TARGET_DIR = os.path.join(PROJECT_ROOT, 'data', 'final_game_levels')
OUTPUT_DIR = os.path.join(PROJECT_ROOT, 'data')

def calculate_file_hash(filepath):
    """
    Tính toán hash SHA256 cho một file để xác định nội dung có trùng lặp không.
    """
    sha256_hash = hashlib.sha256()
    try:
        with open(filepath, "rb") as f:
            # Đọc và cập nhật hash theo từng chunk để không tốn bộ nhớ
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()
    except IOError as e:
        print(f"  - ❌ Lỗi: Không thể đọc file '{os.path.basename(filepath)}': {e}")
        return None

def main():
    """
    Hàm chính để quét thư mục, tìm và xóa file trùng lặp, sau đó tạo báo cáo Excel.
    """
    print("=====================================================================")
    print("=== SCRIPT KIỂM TRA VÀ LOẠI BỎ FILE TRÙNG LẶP ===")
    print("=====================================================================")
    print(f"🔍 Bắt đầu quét thư mục: '{TARGET_DIR}'")

    if not os.path.isdir(TARGET_DIR):
        print(f"❌ Lỗi: Không tìm thấy thư mục '{TARGET_DIR}'. Dừng chương trình.")
        return

    hashes = {}
    duplicates_to_delete = []
    unique_files = []

    # --- Bước 1: Quét và xác định file gốc/trùng lặp ---
    # Lấy danh sách các file JSON trong thư mục, không bao gồm thư mục con
    files_in_dir = [f for f in os.listdir(TARGET_DIR) if f.endswith('.json') and os.path.isfile(os.path.join(TARGET_DIR, f))]

    print(f"ℹ️  Tìm thấy tổng cộng {len(files_in_dir)} file .json để kiểm tra.")

    for filename in files_in_dir:
        filepath = os.path.join(TARGET_DIR, filename)
        file_hash = calculate_file_hash(filepath)

        if file_hash is None:
            continue

        # [CẬP NHẬT] Logic xử lý file trùng lặp ưu tiên file " copy"
        if file_hash in hashes:
            original_filepath = hashes[file_hash]
            original_filename = os.path.basename(original_filepath)
            current_is_copy = ' copy' in filename
            original_is_copy = ' copy' in original_filename

            print(f"  - ⚠️  Phát hiện trùng lặp: '{filename}' giống với '{original_filename}'")

            # Ưu tiên giữ lại file có " copy" trong tên
            if current_is_copy and not original_is_copy:
                # File hiện tại là bản copy, file gốc không phải.
                # Xóa file gốc và thay thế nó trong `hashes` bằng file copy này.
                print(f"    -> Ưu tiên giữ file '{filename}'. Đánh dấu file gốc '{original_filename}' để xóa.")
                if original_filepath not in duplicates_to_delete:
                    duplicates_to_delete.append(original_filepath)
                
                # Cập nhật file "gốc" trong hashes là file copy này
                hashes[file_hash] = filepath
                # Cập nhật lại danh sách file duy nhất
                if original_filename in unique_files:
                    unique_files.remove(original_filename)
                unique_files.append(filename)

            else:
                # Các trường hợp khác (cả 2 đều là copy, hoặc file hiện tại không phải copy)
                # -> Xóa file hiện tại.
                duplicates_to_delete.append(filepath)
        else:
            # Đây là file gốc đầu tiên gặp
            hashes[file_hash] = filepath
            unique_files.append(filename)
    if duplicates_to_delete:
        print(f"\n🗑️  Bắt đầu xóa {len(duplicates_to_delete)} file trùng lặp...")
        for filepath in duplicates_to_delete:
            try:
                os.remove(filepath)
                print(f"  - ✅ Đã xóa: '{os.path.basename(filepath)}'")
            except OSError as e:
                print(f"  - ❌ Lỗi khi xóa file '{os.path.basename(filepath)}': {e}")
    else:
        print("\n✅ Không tìm thấy file nào có nội dung trùng lặp.")

    # --- Bước 2: Đổi tên các file " copy" đã được giữ lại ---
    files_to_rename = [f for f in unique_files if ' copy' in f]
    if files_to_rename:
        print(f"\n✏️  Bắt đầu đổi tên {len(files_to_rename)} file ' copy'...")
        final_unique_files = []
        for filename in unique_files:
            if ' copy' in filename:
                original_filepath = os.path.join(TARGET_DIR, filename)
                new_filename = filename.replace(' copy', '')
                new_filepath = os.path.join(TARGET_DIR, new_filename)
                try:
                    os.rename(original_filepath, new_filepath)
                    print(f"  - ✅ Đã đổi tên: '{filename}' -> '{new_filename}'")
                    final_unique_files.append(new_filename)
                except OSError as e:
                    print(f"  - ❌ Lỗi khi đổi tên file '{filename}': {e}")
                    final_unique_files.append(filename) # Giữ lại tên cũ nếu lỗi
            else:
                final_unique_files.append(filename)
        unique_files = final_unique_files

    # --- Bước 3: Tạo báo cáo Excel ---
    if unique_files:
        print("\n📊 Đang tạo báo cáo Excel...")

        # Lấy tên file không có đuôi mở rộng
        unique_filenames_no_ext = [os.path.splitext(f)[0] for f in sorted(unique_files)]
        total_unique_count = len(unique_filenames_no_ext)

        # Tạo DataFrame
        df_data = {'File Name': unique_filenames_no_ext}
        df = pd.DataFrame(df_data)

        # Thêm cột tổng số lượng
        df['Total Unique Files'] = ''
        df.loc[0, 'Total Unique Files'] = total_unique_count

        # Xuất ra file Excel
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_filename = f"unique_files_report_{timestamp}.xlsx"
        output_path = os.path.join(OUTPUT_DIR, output_filename)
        df.to_excel(output_path, index=False)
        print(f"\n🎉 Hoàn tất! Đã lưu báo cáo tại: {output_path}")
    else:
        print("\nℹ️  Không có file duy nhất nào để tạo báo cáo.")

    print("\n=====================================================================")

if __name__ == "__main__":
    main()