#scripts/refine_and_solve.py

# --- MÔ TẢ TÍNH NĂNG ---
# Script này là một công cụ tiện ích dành cho việc "tinh chỉnh và giải lại" một
# file game level đã được tạo ra. Quy trình hoạt động như sau:
# 1. Người dùng chỉnh sửa thủ công một file game level (ví dụ: ...-var1.json)
#    và lưu nó vào thư mục `data/base_maps/EDITING-MAPS-LIST` với tiền tố `BASEMAP.`.
# 2. Script này sẽ quét thư mục đó, đọc file đã chỉnh sửa.
# 3. Nó chạy lại thuật toán giải (solver) trên map đã chỉnh sửa để đảm bảo nó
#    vẫn giải được và cập nhật lại các chỉ số quan trọng như `optimalBlocks`,
#    `rawActions`, `optimalLines`, và `startBlocks` (đặc biệt cho các bài FixBug).
# 4. File game level hoàn chỉnh sau khi được giải lại sẽ được lưu vào
#    `data/final_game_levels`.
# 5. File `BASEMAP...` gốc sẽ được di chuyển vào `data/base_maps` để lưu trữ.
#
# --- CÁCH CHẠY ---
# Đặt các file `BASEMAP.<ID>.json` đã chỉnh sửa vào thư mục `EDITING-MAPS-LIST`.
# Sau đó chạy lệnh:
# python3 scripts/refine_and_solve.py

import json
import os
import copy
import sys
import re
import argparse

# [THÊM MỚI] Cấu hình logging để hiển thị các thông báo INFO
import logging
logging.basicConfig(level=logging.INFO, format='%(message)s')
from datetime import datetime # [THÊM MỚI] Thư viện để tạo dấu thời gian cho file log

# --- Thiết lập đường dẫn để import từ thư mục src ---
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# Thêm thư mục gốc của dự án vào sys.path
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)
# ----------------------------------------------------


from scripts.gameSolver import solve_map_and_get_solution
# Import các thành phần cần thiết từ các script khác
from scripts.generate_all_maps import (
    _create_xml_from_structured_solution,
    actions_to_xml,
    TOPIC_TRANSLATIONS
)
# [UPDATE] Import hàm đổi tên từ module trung tâm
from scripts.generate_all_maps import _rename_procedures_pedagogically, _apply_procedure_renaming
from src.bug_generator.service import create_bug
from scripts.calculate_lines import calculate_optimal_lines_from_structured

# [THÊM MỚI] Khởi tạo các danh sách để lưu trữ log
success_logs = []
warning_logs = []
error_logs = []

def log_message(message, level="INFO"):
    """
    Hàm ghi log tập trung, vừa in ra màn hình vừa lưu vào danh sách.
    """
    print(message) # In ra console để người dùng thấy tiến trình
    
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "level": level,
        "message": message
    }
    
    if level == "SUCCESS":
        success_logs.append(log_entry)
    elif level == "WARNING":
        warning_logs.append(log_entry)
    elif level == "ERROR":
        error_logs.append(log_entry)

def find_map_request_by_id(curriculum_dir: str, target_id: str) -> tuple[dict | None, str | None]:
    """
    Quét tất cả các file curriculum để tìm map_request có ID khớp.
    [CẬP NHẬT] Trả về một tuple: (challenge_dict, topic_name_vi).
    """
    try:
        # [CẬP NHẬT] Trích xuất ID gốc bằng cách loại bỏ hậu tố biến thể.
        base_id = re.sub(r'-var\d+$', '', target_id) # Ví dụ: "...C1-var10" -> "...C1"

        topic_files = [f for f in os.listdir(curriculum_dir) if f.endswith('.json')]
        for topic_filename in topic_files:
            topic_filepath = os.path.join(curriculum_dir, topic_filename)
            with open(topic_filepath, 'r', encoding='utf-8') as f:
                category_data = json.load(f) # File giờ chứa category
            
            # [CẬP NHẬT] Lặp qua cấu trúc mới
            for topic in category_data.get("topics", []):
                # Lấy topic_name ở cấp độ này
                topic_name = topic.get("topic_name", "N/A")
                for challenge in topic.get("challenges", []):
                    if challenge.get("id") == base_id:
                        return challenge, topic_name # Trả về cả challenge và topic_name
    except Exception as e:
        log_message(f"❌ Lỗi khi tìm kiếm map request: {e}", "ERROR")
    return None, None


def refine_single_map(map_id: str):
    """
    Hàm chính để xử lý một base_map đã được chỉnh sửa.
    """
    log_message(f"\n{'='*20} BẮT ĐẦU TINH CHỈNH MAP: {map_id} {'='*20}")

    # --- Bước 1: Xác định các đường dẫn ---
    curriculum_dir = os.path.join(PROJECT_ROOT, 'data', 'curriculum')
    toolbox_filepath = os.path.join(PROJECT_ROOT, 'data', 'toolbox_presets.json')
    editing_maps_dir = os.path.join(PROJECT_ROOT, 'data', 'base_maps', 'EDITING-MAPS-LIST')
    final_output_dir = os.path.join(PROJECT_ROOT, 'data', 'final_game_levels')
    base_maps_dir = os.path.join(PROJECT_ROOT, 'data', 'base_maps') # [THÊM MỚI] Thư mục đích để di chuyển file

    # [CẢI TIẾN] Tìm kiếm file linh hoạt hơn.
    # [FIX] Tìm kiếm file chính xác theo tên đầy đủ để tránh nhầm lẫn giữa -var1 và -var10.
    base_map_filename = f"BASEMAP.{map_id}.json"
    base_map_filepath = os.path.join(editing_maps_dir, base_map_filename)

    # --- Bước 2: Đọc file base_map và tìm map_request gốc ---
    if not os.path.exists(base_map_filepath):
        log_message(f"❌ Lỗi: Không tìm thấy file base map '{base_map_filename}' trong thư mục EDITING-MAPS-LIST.", "ERROR")
        return False

    # [CẬP NHẬT] Lấy ID đầy đủ từ tên file để đảm bảo các bước sau hoạt động chính xác.
    # map_id đã được truyền vào hàm, không cần lấy lại từ tên file.
    log_message(f"✅ Đã tìm thấy file base map: {base_map_filename}")

    try:
        with open(base_map_filepath, 'r', encoding='utf-8') as f:
            game_config = json.load(f)
    except json.JSONDecodeError:
        print(f"❌ Lỗi: File base map '{base_map_filename}' không phải là JSON hợp lệ.")
        return False

    # [CẬP NHẬT] Nhận cả map_request và topic_name_vi từ hàm tìm kiếm
    map_request, topic_name_vi = find_map_request_by_id(curriculum_dir, map_id)
    if not map_request:
        print(f"❌ Lỗi: Không tìm thấy map_request gốc cho ID '{map_id}' trong curriculum.")
        return False
    print(f"✅ Đã tìm thấy map_request gốc có ID: {map_request.get('id')}")
    print(f"✅ Đã tìm thấy tên topic tương ứng: {topic_name_vi}")

    # --- Bước 3: Tải các cấu hình cần thiết (Toolbox, Topic Name) ---
    try:
        with open(toolbox_filepath, 'r', encoding='utf-8') as f:
            toolbox_presets = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        print(f"   ⚠️ Cảnh báo: Không tìm thấy hoặc file toolbox_presets.json không hợp lệ.")
        toolbox_presets = {}

    # --- Bước 4: Chạy lại Solver với gameConfig đã chỉnh sửa ---
    print("  -> Đang chạy lại Solver trên map đã chỉnh sửa...")
    
    # Lấy các cấu hình cần thiết từ map_request gốc
    generation_config = map_request.get('generation_config', {})
    logic_type = generation_config.get('logic_type')
    solution_config = map_request.get('solution_config', {})
    solution_config['logic_type'] = logic_type

    # Lấy cấu hình toolbox
    blockly_config_req = map_request.get('blockly_config', {})
    toolbox_preset_name = blockly_config_req.get('toolbox_preset')
    base_toolbox = copy.deepcopy(toolbox_presets.get(toolbox_preset_name, {"kind": "categoryToolbox", "contents": []}))
    events_category = {
      "kind": "category", "name": "%{BKY_GAMES_CATEVENTS}", "categorystyle": "events_category",
      "contents": [ { "kind": "block", "type": "maze_start" } ]
    }
    if 'contents' not in base_toolbox: base_toolbox['contents'] = []
    base_toolbox['contents'].insert(0, events_category)
    toolbox_data = base_toolbox

    # [FIX] Luôn tính toán lại itemGoals dựa trên gameConfig MỚI đã được chỉnh sửa.
    # Điều này đảm bảo số lượng vật phẩm yêu cầu luôn khớp với map thực tế.
    requested_item_goals = copy.deepcopy(map_request.get('solution_config', {}).get('itemGoals', {}))
    final_item_goals = {}
    # Lặp qua các loại vật phẩm được định nghĩa trong curriculum gốc để biết cần đếm những gì.
    for item_type in requested_item_goals.keys():
        actual_count = 0
        if 'interactibles' in game_config['gameConfig']:
            actual_count += sum(1 for item in game_config['gameConfig']['interactibles'] if item.get('type') == item_type)
        if 'collectibles' in game_config['gameConfig']:
            actual_count += sum(1 for item in game_config['gameConfig']['collectibles'] if item.get('type') == item_type)
        final_item_goals[item_type] = actual_count
        log_message(f"    LOG: Đã tính toán lại itemGoals cho '{item_type}': {actual_count} vật phẩm được tìm thấy trong base_map.")
    solution_config['itemGoals'] = final_item_goals

    # Tạo level tạm thời để đưa cho Solver
    temp_level_for_solver = { # [THAY ĐỔI] Đã có sẵn
        "gameConfig": game_config['gameConfig'],
        "blocklyConfig": {"toolbox": toolbox_data},
        "solution": solution_config,
        "generation_config": generation_config
    }
    
    solution_result = solve_map_and_get_solution(temp_level_for_solver)

    if not solution_result:
        log_message("❌ Lỗi: Solver không tìm thấy lời giải cho map đã chỉnh sửa. Không thể tạo file game.", "ERROR")
        return False
    
    log_message(f"✅ Solver đã tìm thấy lời giải mới với {solution_result['block_count']} khối lệnh.")

    # [NEW] Bước 4.5: Đổi tên các hàm được tạo tự động thành tên có ý nghĩa sư phạm
    original_program_dict = solution_result.get("program_solution_dict", {})
    # [REFACTORED] Gọi hàm đổi tên tập trung, truyền vào toàn bộ map_request
    pedagogical_program_dict = _rename_procedures_pedagogically(
        original_program_dict, map_request
    )
    solution_result['program_solution_dict'] = pedagogical_program_dict

    # --- Bước 5: Tạo lại Start Blocks (đặc biệt quan trọng cho các bài FixBug) ---
    log_message("  -> Đang tạo lại Start Blocks...")
    
    final_inner_blocks = ''
    buggy_program_dict = None
    original_program_dict = solution_result.get("program_solution_dict", {})
    
    start_blocks_type = generation_config.get("params", {}).get("start_blocks_type", "empty")

    if start_blocks_type == "buggy_solution":
        bug_type = generation_config.get("params", {}).get("bug_type")
        bug_config = generation_config.get("params", {}).get("bug_config", {}) or {}
        program_to_be_bugged = copy.deepcopy(original_program_dict)

        if bug_type in {'optimization_logic', 'optimization_no_variable'}:
            raw_actions = solution_result.get("raw_actions", [])
            inner_xml = actions_to_xml(raw_actions)
            final_inner_blocks = f'<block type="maze_start" deletable="false" movable="false"><statement name="DO">{inner_xml}</statement></block>'
        else:
            buggy_program_dict = create_bug(bug_type, program_to_be_bugged, bug_config)
            if isinstance(buggy_program_dict, dict):
                raw_actions_for_bug = solution_result.get("raw_actions", []) if bug_type in ['incorrect_block', 'incorrect_parameter'] else None
                final_inner_blocks = _create_xml_from_structured_solution(buggy_program_dict, raw_actions_for_bug) # [THAY ĐỔI] Đã có sẵn
                log_message("    LOG: Đã tạo thành công phiên bản lỗi của lời giải.")
            else:
                log_message(f"   - ⚠️ Cảnh báo: Không thể tạo lỗi cho bug_type '{bug_type}'. Sẽ dùng start block rỗng.", "WARNING")
                final_inner_blocks = ''
    
    elif start_blocks_type in ["raw_solution", "unrefactored_solution", "long_solution"]:
        raw_actions = solution_result.get("raw_actions", [])
        inner_xml = actions_to_xml(raw_actions)
        final_inner_blocks = f'<block type="maze_start" deletable="false" movable="false"><statement name="DO">{inner_xml}</statement></block>'
    
    elif start_blocks_type == "optimized_solution":
        final_inner_blocks = _create_xml_from_structured_solution(original_program_dict, solution_result.get("raw_actions", []))

    # Tạo thẻ <xml> bao ngoài
    if final_inner_blocks and not final_inner_blocks.strip().startswith('<xml>'):
        final_start_blocks = f"<xml>{final_inner_blocks}</xml>"
    elif final_inner_blocks:
        final_start_blocks = final_inner_blocks
    else:
        final_start_blocks = "<xml><block type=\"maze_start\" deletable=\"false\" movable=\"false\"><statement name=\"DO\"></statement></block></xml>"

    # --- Bước 6: Tổng hợp và lưu file JSON cuối cùng ---
    log_message("  -> Đang tổng hợp file game cuối cùng...")

    optimal_lloc = calculate_optimal_lines_from_structured(solution_result.get('structuredSolution', {}))

    # [CẬP NHẬT] Lấy topic_code từ ID để tạo topic_key
    topic_code_from_id = map_request.get('id', '').split('.')[1]
    topic_key = f"topic-title-{topic_code_from_id.lower()}"
    topic_name_en = TOPIC_TRANSLATIONS.get(topic_name_vi, topic_name_vi)
    final_translations = copy.deepcopy(map_request.get('translations', {}))
    if 'vi' in final_translations: final_translations['vi'][topic_key] = topic_name_vi
    if 'en' in final_translations: final_translations['en'][topic_key] = topic_name_en

    final_json_content = {
        "id": map_id,
        "gameType": "maze",
        "topic": topic_key,
        "level": map_request.get('level', 1),
        "titleKey": map_request.get('titleKey'),
        "questTitleKey": map_request.get('descriptionKey'),
        "descriptionKey": map_request.get('descriptionKey'),
        "translations": final_translations,
        "supportedEditors": ["blockly", "monaco"],
        "blocklyConfig": {
            "toolbox_preset": toolbox_preset_name,
            "toolbox": toolbox_data,
            "maxBlocks": (solution_result['block_count'] + 5),
            "startBlocks": final_start_blocks
        },
        "gameConfig": game_config['gameConfig'],
        "solution": {
            "type": "reach_target",
            "itemGoals": final_item_goals,
            "optimalBlocks": solution_result['block_count'],
            "optimalLines": optimal_lloc,
            "rawActions": solution_result.get('raw_actions', []),
            "structuredSolution": solution_result.get('program_solution_dict', {}),
        },
        "sounds": { "win": "/assets/maze/win.mp3", "fail": "/assets/maze/fail_pegman.mp3" }
    }

    if buggy_program_dict:
        final_json_content["solution"]["structuredSolution_fixbug_version"] = buggy_program_dict
    else:
        final_json_content["solution"]["structuredSolution_fixbug_version"] = solution_result.get('program_solution_dict', {})

    # Lưu file
    filename = f"{map_id}.json"
    output_filepath = os.path.join(final_output_dir, filename)
    try:
        with open(output_filepath, 'w', encoding='utf-8') as f:
            json.dump(final_json_content, f, indent=2, ensure_ascii=False)
        log_message(f"✅ Hoàn tất! File game đã được lưu tại: {output_filepath}", "SUCCESS")

        # [THÊM MỚI] Di chuyển file base map đã xử lý thành công
        destination_filepath = os.path.join(base_maps_dir, base_map_filename)
        try:
            os.rename(base_map_filepath, destination_filepath)
            log_message(f"🚚 Đã di chuyển '{base_map_filename}' về thư mục 'base_maps'.")
        except OSError as e:
            log_message(f"   - ❌ Lỗi khi di chuyển file: {e}", "ERROR")

        return True
    except Exception as e:
        print(f"❌ Lỗi khi lưu file game cuối cùng: {e}")
        return False


def get_map_ids_from_editing_dir():
    """
    Quét thư mục EDITING-MAPS-LIST, trả về danh sách ID và lưu vào file txt.
    """
    editing_maps_dir = os.path.join(PROJECT_ROOT, 'data', 'base_maps', 'EDITING-MAPS-LIST')
    output_txt_path = os.path.join(PROJECT_ROOT, 'data', 'editing_maps_list.txt')
    map_ids = []

    log_message(f"🔍 Đang quét thư mục: '{editing_maps_dir}'...")
    try:
        if not os.path.exists(editing_maps_dir):
            os.makedirs(editing_maps_dir)
            log_message(f"📁 Thư mục '{editing_maps_dir}' không tồn tại, đã tự động tạo mới.")
            return []

        all_files = os.listdir(editing_maps_dir)
        basemap_files = sorted([f for f in all_files if f.startswith('BASEMAP.') and f.endswith('.json')])
        map_ids = [f.replace('BASEMAP.', '').replace('.json', '') for f in basemap_files]

        with open(output_txt_path, 'w', encoding='utf-8') as f: # [THAY ĐỔI] Đã có sẵn
            for map_id in map_ids:
                f.write(f"{map_id}\n")
        
        if map_ids:
            log_message(f"✅ Đã tìm thấy {len(map_ids)} map và lưu danh sách vào '{output_txt_path}'.")
        else:
            log_message("ℹ️ Không tìm thấy file base map nào trong thư mục EDITING-MAPS-LIST.", "INFO")

    except Exception as e:
        log_message(f"❌ Lỗi khi quét thư mục hoặc ghi file: {e}", "ERROR")
    
    return map_ids


def main():
    """
    Hàm chính để chạy script với menu tương tác.
    """
    all_map_ids = get_map_ids_from_editing_dir()
    
    if not all_map_ids:
        log_message("\nKhông có map nào để xử lý. Dừng chương trình.", "WARNING")
        return

    log_message("\n--- DANH SÁCH MAP CẦN HIỆU CHỈNH ---")
    for i, map_id in enumerate(all_map_ids):
        log_message(f"  [{i+1}] {map_id}")
    log_message("------------------------------------")

    map_ids_to_process = []

    while True:
        print("\nVui lòng chọn một tùy chọn:")
        print("  1. Chạy lại map với ID (nhập ID)")
        print("  2. Chọn map cần chạy từ danh sách (nhập số thứ tự)")
        print("  3. Chạy lại tất cả các map trong danh sách")
        
        choice = input("Nhập lựa chọn của bạn (1, 2, hoặc 3): ").strip()

        if choice == '1': # [THAY ĐỔI] Đã có sẵn
            map_id_input = input("Nhập Map ID cần chạy: ").strip()
            if map_id_input:
                map_ids_to_process = [map_id_input]
                break
            else:
                log_message("❌ ID không được để trống.", "ERROR")
        
        elif choice == '2':
            indices_input = input("Nhập số thứ tự các map, cách nhau bởi dấu phẩy (ví dụ: 1, 3, 5): ").strip()
            try:
                indices = [int(i.strip()) - 1 for i in indices_input.split(',')]
                selected_ids = []
                valid = True
                for idx in indices:
                    if 0 <= idx < len(all_map_ids):
                        selected_ids.append(all_map_ids[idx])
                    else:
                        log_message(f"❌ Số thứ tự không hợp lệ: {idx + 1}", "ERROR")
                        valid = False
                if valid and selected_ids:
                    map_ids_to_process = selected_ids
                    break
                elif not selected_ids:
                     log_message("❌ Bạn chưa chọn map nào.", "ERROR")
            except ValueError:
                log_message("❌ Định dạng không hợp lệ. Vui lòng nhập các số, cách nhau bởi dấu phẩy.", "ERROR")

        elif choice == '3':
            map_ids_to_process = all_map_ids
            log_message("🚀 Sẽ chạy lại tất cả các map...")
            break
        
        else:
            log_message("❌ Lựa chọn không hợp lệ. Vui lòng chọn 1, 2, hoặc 3.", "ERROR")

    log_message(f"🚀 Sẽ xử lý {len(map_ids_to_process)} map.")
    
    success_count = 0
    fail_count = 0

    for map_id in map_ids_to_process:
        if refine_single_map(map_id):
            success_count += 1
        else:
            fail_count += 1

    log_message("\n================== TỔNG KẾT ==================")
    log_message(f"✅ Thành công: {success_count} map", "SUCCESS")
    log_message(f"❌ Thất bại:   {fail_count} map", "ERROR")
    log_message("==============================================")


if __name__ == "__main__":
    main()