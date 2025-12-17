# scripts/update_final_maps_metrics.py

# --- MÔ TẢ TÍNH NĂNG ---
# Script này là một công cụ bảo trì, dùng để cập nhật hàng loạt các chỉ số
# (metrics) của các file game level đã hoàn thiện.
#
# Chức năng chính:
# 1. Quét các file JSON trong thư mục `data/final_game_levels/final_game_levels_edited`.
# 2. Với mỗi file, nó chạy lại thuật toán giải (solver) để có được lời giải mới nhất.
# 3. Cập nhật các trường `optimalBlocks`, `rawActions`, và `optimalLines` trong
#    file JSON với kết quả từ solver.
# 4. Di chuyển file đã được cập nhật ra khỏi thư mục `..._edited` và đưa về
#    thư mục cha `final_game_levels`.
#
# Mục đích: Đảm bảo các chỉ số về lời giải trong ngân hàng câu hỏi luôn chính xác
# sau khi có những thay đổi trong thuật toán của solver.
#
# --- CÁCH CHẠY ---
# python3 scripts/update_final_maps_metrics.py

import json
import os
import copy
import sys
from datetime import datetime

# --- Thiết lập đường dẫn để import từ thư mục src ---
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)
# ----------------------------------------------------

from scripts.gameSolver import solve_map_and_get_solution
from scripts.calculate_lines import calculate_optimal_lines_from_structured
from scripts.refine_and_solve import find_map_request_by_id # Tái sử dụng hàm tìm kiếm

# --- Cấu hình logging ---
def log_message(message, level="INFO"):
    """Ghi log ra console với màu sắc để dễ phân biệt."""
    colors = {
        "INFO": "\033[94m",    # Blue
        "SUCCESS": "\033[92m", # Green
        "WARNING": "\033[93m", # Yellow
        "ERROR": "\033[91m",   # Red
        "ENDC": "\033[0m",     # Reset color
    }
    color = colors.get(level, colors["ENDC"])
    print(f"{color}[{level}] {datetime.now().strftime('%H:%M:%S')} - {message}{colors['ENDC']}")

def update_single_map_metrics(map_filepath: str) -> bool:
    """
    Chạy lại solver cho một file map cuối cùng và cập nhật các chỉ số lời giải.
    Chỉ cập nhật: rawActions, optimalBlocks, optimalLines.
    """
    map_id = os.path.basename(map_filepath).replace('.json', '')
    log_message(f"\n{'='*15} BẮT ĐẦU CẬP NHẬT MAP: {map_id} {'='*15}", "INFO")

    # --- Bước 1: Đọc file map hiện có ---
    try:
        with open(map_filepath, 'r', encoding='utf-8') as f:
            final_map_data = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        log_message(f"Lỗi khi đọc file '{map_filepath}': {e}", "ERROR")
        return False

    log_message(f"Đã đọc thành công file: {map_filepath}")

    # --- Bước 2: Chuẩn bị dữ liệu để chạy lại Solver ---
    # Lấy logic_type từ curriculum gốc, vì nó không có trong file final map
    curriculum_dir = os.path.join(PROJECT_ROOT, 'data', 'curriculum')
    map_request, _ = find_map_request_by_id(curriculum_dir, map_id)
    if not map_request:
        log_message(f"Không tìm thấy map_request gốc cho ID '{map_id}'. Bỏ qua...", "ERROR")
        return False
    
    generation_config = map_request.get('generation_config', {})
    logic_type = generation_config.get('logic_type')

    # Tạo một đối tượng `solution_config` tạm thời cho solver
    solution_config_for_solver = {
        'itemGoals': final_map_data.get('solution', {}).get('itemGoals', {}),
        'logic_type': logic_type
    }

    # Tạo level tạm thời để đưa cho Solver
    temp_level_for_solver = {
        "gameConfig": final_map_data.get('gameConfig'),
        "blocklyConfig": final_map_data.get('blocklyConfig'),
        "solution": solution_config_for_solver,
        "generation_config": generation_config # Cần cho một số logic của solver
    }

    # --- Bước 3: Chạy Solver ---
    log_message("Đang chạy lại Solver để lấy chỉ số mới...")
    solution_result = solve_map_and_get_solution(temp_level_for_solver)

    if not solution_result or 'block_count' not in solution_result:
        log_message("Solver không tìm thấy lời giải. Không thể cập nhật file.", "ERROR")
        return False

    log_message(f"Solver đã tìm thấy lời giải mới với {solution_result['block_count']} khối lệnh.", "SUCCESS")

    # --- Bước 4: Tính toán các giá trị mới ---
    new_optimal_blocks = solution_result['block_count']
    new_raw_actions = solution_result.get('raw_actions', [])
    new_optimal_lines = calculate_optimal_lines_from_structured(solution_result.get('structuredSolution', {}))

    log_message(f"Các chỉ số mới: optimalBlocks={new_optimal_blocks}, optimalLines={new_optimal_lines}, len(rawActions)={len(new_raw_actions)}")

    # --- Bước 5: Cập nhật và lưu file JSON ---
    log_message("Đang cập nhật file map...")
    
    # Cập nhật các trường trong dictionary đã load
    final_map_data['solution']['optimalBlocks'] = new_optimal_blocks
    final_map_data['solution']['rawActions'] = new_raw_actions
    final_map_data['solution']['optimalLines'] = new_optimal_lines

    try:
        with open(map_filepath, 'w', encoding='utf-8') as f:
            json.dump(final_map_data, f, indent=2, ensure_ascii=False)
        log_message(f"Cập nhật thành công nội dung cho file: {os.path.basename(map_filepath)}", "SUCCESS")

        # [MỚI] Di chuyển file đã xử lý ra thư mục mẹ
        destination_dir = os.path.dirname(os.path.dirname(map_filepath))
        destination_filepath = os.path.join(destination_dir, os.path.basename(map_filepath))
        try:
            os.rename(map_filepath, destination_filepath)
            log_message(f"🚚 Đã di chuyển file '{os.path.basename(map_filepath)}' đến '{destination_dir}'.", "SUCCESS")
        except OSError as e:
            log_message(f"Lỗi khi di chuyển file: {e}", "ERROR")
            return False # Coi như thất bại nếu không di chuyển được
        return True
    except Exception as e:
        log_message(f"Lỗi khi ghi file '{map_filepath}': {e}", "ERROR")
        return False

def get_final_maps():
    """Quét thư mục final_game_levels và trả về danh sách các file map."""
    final_maps_dir = os.path.join(PROJECT_ROOT, 'data', 'final_game_levels', 'final_game_levels_edited')
    map_files = []
    log_message(f"🔍 Đang quét thư mục: '{final_maps_dir}'...")
    try:
        if not os.path.exists(final_maps_dir):
            log_message(f"Thư mục '{final_maps_dir}' không tồn tại.", "ERROR")
            return []

        all_files = sorted([f for f in os.listdir(final_maps_dir) if f.endswith('.json')])
        map_files = [os.path.join(final_maps_dir, f) for f in all_files]
        
        if map_files:
            log_message(f"Đã tìm thấy {len(map_files)} file map.")
        else:
            log_message("Không tìm thấy file map nào trong thư mục.", "INFO")

    except Exception as e:
        log_message(f"Lỗi khi quét thư mục: {e}", "ERROR")
    
    return map_files

def main():
    """Hàm chính để chạy script với menu tương tác."""
    all_map_files = get_final_maps()
    
    if not all_map_files:
        log_message("Không có map nào để xử lý. Dừng chương trình.", "WARNING")
        return

    log_message("\n--- DANH SÁCH MAP TRONG 'final_game_levels_edited' ---")
    for i, map_path in enumerate(all_map_files):
        print(f"  [{i+1}] {os.path.basename(map_path)}")
    log_message("---------------------------------------------")

    maps_to_process = []

    while True:
        print("\nVui lòng chọn một tùy chọn:")
        print("  1. Cập nhật map theo tên file (ví dụ: 'L1.C1.M1.json')")
        print("  2. Cập nhật map theo số thứ tự từ danh sách (ví dụ: 1, 3, 5)")
        print("  3. Cập nhật tất cả các map trong danh sách")
        
        choice = input("Nhập lựa chọn của bạn (1, 2, hoặc 3): ").strip()

        if choice == '1':
            filename_input = input("Nhập tên file map cần cập nhật: ").strip()
            if filename_input:
                target_path = os.path.join(PROJECT_ROOT, 'data', 'final_game_levels', 'final_game_levels_edited', filename_input)
                if os.path.exists(target_path):
                    maps_to_process = [target_path]
                    break
                else:
                    log_message(f"Không tìm thấy file '{filename_input}'", "ERROR")
            else:
                log_message("Tên file không được để trống.", "ERROR")
        
        elif choice == '2':
            indices_input = input("Nhập số thứ tự các map, cách nhau bởi dấu phẩy: ").strip()
            try:
                indices = [int(i.strip()) - 1 for i in indices_input.split(',')]
                selected_files = []
                valid = True
                for idx in indices:
                    if 0 <= idx < len(all_map_files):
                        selected_files.append(all_map_files[idx])
                    else:
                        log_message(f"Số thứ tự không hợp lệ: {idx + 1}", "ERROR")
                        valid = False
                if valid and selected_files:
                    maps_to_process = selected_files
                    break
                elif not selected_files:
                     log_message("Bạn chưa chọn map nào.", "ERROR")
            except ValueError:
                log_message("Định dạng không hợp lệ. Vui lòng nhập các số.", "ERROR")

        elif choice == '3':
            maps_to_process = all_map_files
            log_message("Sẽ cập nhật tất cả các map...")
            break
        
        else:
            log_message("Lựa chọn không hợp lệ. Vui lòng chọn 1, 2, hoặc 3.", "ERROR")

    log_message(f"Sẽ xử lý {len(maps_to_process)} map.")
    
    success_count = 0
    fail_count = 0

    for map_path in maps_to_process:
        if update_single_map_metrics(map_path):
            success_count += 1
        else:
            fail_count += 1

    log_message("\n================== TỔNG KẾT ==================", "INFO")
    log_message(f"Thành công: {success_count} map", "SUCCESS")
    log_message(f"Thất bại:   {fail_count} map", "ERROR")
    log_message("==============================================", "INFO")

if __name__ == "__main__":
    main()