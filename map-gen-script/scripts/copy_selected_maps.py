# scripts/copy_selected_maps.py

# --- MÔ TẢ TÍNH NĂNG ---
# Script này là một công cụ tiện ích dùng để sao chép một danh sách các file map game
# cụ thể từ thư mục nguồn ('data/final_game_levels') sang một thư mục đích
# ('data/selected_maps_for_review').
#
# Mục đích chính là để dễ dàng thu thập các map cần xem xét hoặc kiểm tra lại
# mà không cần tìm kiếm thủ công. Danh sách các map cần sao chép được định nghĩa
# sẵn trong biến `map_ids_to_copy`.
#
# --- CÁCH CHẠY ---
# Mở terminal, di chuyển vào thư mục gốc của dự án (GenMap) và chạy lệnh:
#
# python3 scripts/copy_selected_maps.py

import os
import shutil

# --- Thiết lập đường dẫn gốc của dự án ---
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def main():
    """
    Hàm chính để sao chép các file map JSON được chọn vào một thư mục mới.
    """
    print("======================================================")
    print("=== BẮT ĐẦU SAO CHÉP CÁC MAP JSON ĐƯỢC CHỌN ===")
    print("======================================================")

    # --- Danh sách các ID map cần sao chép ---
    map_ids_to_copy = [
        "COMMANDS_G312.CODING_COMMANDS_3D-MOVEMENT.COMPLEX_APPLY.C165-var1",
        "COMMANDS_G312.CODING_COMMANDS_MULTI-OBJECTIVE.COMPLEX_APPLY.C39-var2",
        "COMMANDS_G312.CODING_COMMANDS_MULTI-OBJECTIVE.COMPLEX_APPLY.C30-var2",
        "COMMANDS_G312.CODING_COMMANDS_MULTI-OBJECTIVE.COMPLEX_APPLY.C37-var1",
        "COMMANDS_G312.CODING_COMMANDS_MULTI-OBJECTIVE.COMPLEX_APPLY.C40-var4",
        "COMMANDS_G312.CODING_COMMANDS_MULTI-OBJECTIVE.COMPLEX_APPLY.C53-var1",
        "COMMANDS_G312.CODING_COMMANDS_MULTI-OBJECTIVE.COMPLEX_APPLY.C69-var1",
        "COMMANDS_G312.CODING_COMMANDS_MULTI-OBJECTIVE.COMPLEX_APPLY.C110-var3",
        "COMMANDS_G312.CODING_COMMANDS_MULTI-OBJECTIVE.COMPLEX_APPLY.C120-var1",
        "COMMANDS_G312.CODING_COMMANDS_MULTI-OBJECTIVE.COMPLEX_APPLY.C129-var5",
        "COMMANDS_G312.CODING_COMMANDS_MULTI-OBJECTIVE.COMPLEX_APPLY.C132-var5",
        "COMMANDS_G312.CODING_COMMANDS_MULTI-OBJECTIVE.COMPLEX_APPLY.C133-var2",
    ]

    source_dir = os.path.join(PROJECT_ROOT, 'data', 'final_game_levels')
    dest_dir = os.path.join(PROJECT_ROOT, 'data', 'selected_maps_for_review')

    # --- Tạo thư mục đích nếu chưa tồn tại ---
    os.makedirs(dest_dir, exist_ok=True)
    print(f"ℹ️  Thư mục đích: '{dest_dir}'")

    copied_count = 0
    for map_id in map_ids_to_copy:
        filename = f"{map_id}.json"
        source_path = os.path.join(source_dir, filename)
        dest_path = os.path.join(dest_dir, filename)

        if os.path.exists(source_path):
            shutil.copy2(source_path, dest_path)
            print(f"✅ Đã sao chép: '{filename}'")
            copied_count += 1
        else:
            print(f"❌ Không tìm thấy: '{filename}' trong thư mục nguồn.")

    print("\n======================================================")
    print(f"🎉 Hoàn tất! Đã sao chép {copied_count}/{len(map_ids_to_copy)} file.")
    print(f"🎉 Các file đã được lưu tại: {dest_dir}")
    print("======================================================")

if __name__ == "__main__":
    main()