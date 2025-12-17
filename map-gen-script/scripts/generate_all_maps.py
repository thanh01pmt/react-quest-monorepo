# scripts/generate_all_maps.py

# --- MÔ TẢ TÍNH NĂNG ---
# Đây là script trung tâm của pipeline, chịu trách nhiệm sinh ra các file game level cuối cùng.
# Chức năng chính bao gồm:
# 1. Đọc các file curriculum JSON đã được tạo ở bước trước.
# 2. Lặp qua từng yêu cầu (challenge) trong curriculum.
# 3. Gọi `MapGeneratorService` để tạo cấu trúc map vật lý (topology).
# 4. Gọi `gameSolver` để tìm lời giải tối ưu cho map.
# 5. Tổng hợp lời giải (dưới dạng Blockly XML và cấu trúc dictionary) và cấu hình map.
# 6. Áp dụng các logic nghiệp vụ phức tạp như:
#    - Tạo phiên bản lỗi cho các bài tập gỡ lỗi (FixBug).
#    - Đổi tên hàm do solver tạo ra thành tên có ý nghĩa sư phạm.
#    - Tính toán số dòng code logic (LLOC) cho lời giải.
# 7. Lưu file game level hoàn chỉnh dưới dạng JSON vào thư mục `data/3_generated_levels`.
# 8. Tạo báo cáo tổng kết về các map đã sinh (thành công/thất bại).
#
# --- CÁCH CHẠY ---
# Script này thường được gọi tự động bởi `main.py`. Để chạy độc lập cho mục đích thử nghiệm:
#
# python3 scripts/generate_all_maps.py
#

import json
import os
import copy # Import module copy
import sys
import io # New import for capturing stdout
import pandas as pd # [THÊM MỚI] Thư viện để xuất file Excel
import random
from datetime import datetime # [THÊM MỚI] Thư viện để tạo dấu thời gian

# [THÊM MỚI] Cấu hình logging để hiển thị các thông báo INFO
import logging
logging.basicConfig(level=logging.INFO, format='%(message)s')

# Custom handler to capture logs
class StringIOHandler(logging.StreamHandler):
    def __init__(self, stream):
        super().__init__(stream)
        # Use the same format as the original basicConfig to capture messages as they would appear
        self.setFormatter(logging.Formatter('%(message)s'))


# --- Thiết lập đường dẫn để import từ thư mục src ---
# Lấy đường dẫn đến thư mục gốc của dự án (đi lên 2 cấp từ file hiện tại)
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# Thêm thư mục gốc của dự án vào sys.path để Python có thể tìm thấy các module
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)
# ----------------------------------------------------

# Bây giờ chúng ta có thể import từ src một cách an toàn
from src.map_generator.service import MapGeneratorService # [FIX] Đảm bảo import đúng service
from scripts.gameSolver import solve_map_and_get_solution
# [FIX] Luôn sử dụng import tuyệt đối từ 'src' để đảm bảo script chạy ổn định từ mọi điểm vào (main.py, v.v.)
from src.map_generator.utils.theme_selector import get_new_theme_for_map
from src.bug_generator.service import create_bug # [THAY ĐỔI] Import hàm điều phối mới
# --- [MỚI] Tích hợp tính năng tính toán số dòng code ---
# Import các hàm cần thiết trực tiếp từ calculate_lines.py
from scripts.calculate_lines import (
    calculate_logical_lines_py,
    translate_structured_solution_to_js,
    calculate_optimal_lines_from_structured, # noqa
    format_dict_to_string_list
)
# ---------------------------------------------------------
import re
import xml.etree.ElementTree as ET

# ANSI escape codes for colors
COLOR_RESET = "\033[0m"
COLOR_RED = "\033[91m"
COLOR_GREEN = "\033[92m"
COLOR_YELLOW = "\033[93m"
COLOR_BLUE = "\033[94m"
COLOR_MAGENTA = "\033[95m"
COLOR_CYAN = "\033[96m"

def print_success(message, prefix=""):
    print(f"{prefix}{COLOR_GREEN}✅ {message}{COLOR_RESET}")

def print_warning(message, prefix=""):
    print(f"{prefix}{COLOR_YELLOW}⚠️ {message}{COLOR_RESET}")

def print_error(message, prefix=""):
    print(f"{prefix}{COLOR_RED}❌ {message}{COLOR_RESET}")

def print_info(message, prefix=""):
    print(f"{prefix}{COLOR_CYAN}ℹ️ {message}{COLOR_RESET}")

def print_debug(message, prefix=""):
    print(f"{prefix}{COLOR_BLUE}🐛 {message}{COLOR_RESET}")
# [MỚI] Dictionary để ánh xạ tên topic VI sang EN
# Trong tương lai, nên đưa thông tin này vào file curriculum_source.xlsx
TOPIC_TRANSLATIONS = {
    "Giới thiệu": "Introduction",
    "Vòng lặp": "Loops",
    "Hàm": "Functions",
    "Biến & Toán học": "Variables & Math",
    "Gỡ lỗi": "Debugging",
    "Gỡ lỗi Nâng cao": "Advanced Debugging",
    "Hàm Nâng Cao": "Advanced Functions"
}

def _apply_procedure_renaming(program: dict, name_mapping: dict) -> dict:
    """Helper để áp dụng việc đổi tên vào toàn bộ cấu trúc chương trình."""
    # [REWRITTEN] Logic được viết lại để xây dựng lại dictionary, an toàn hơn thay thế chuỗi.
    if not name_mapping:
        return program

    new_program = {"main": [], "procedures": {}}

    # 1. Đổi tên trong khối 'procedures'
    for old_name, body in program.get("procedures", {}).items():
        new_name = name_mapping.get(old_name, old_name)
        new_program["procedures"][new_name] = body

    # 2. Đổi tên trong các lời gọi hàm 'CALL' ở 'main'
    def rename_calls_recursively(block_list):
        for block in block_list:
            if block.get("type") == "CALL":
                old_call_name = block.get("name")
                block["name"] = name_mapping.get(old_call_name, old_call_name)
            if "body" in block:
                rename_calls_recursively(block["body"])
    
    new_program["main"] = copy.deepcopy(program.get("main", []))
    rename_calls_recursively(new_program["main"])

    return new_program

def _rename_procedures_pedagogically(program: dict, map_request: dict) -> dict:
    """
    [NEW & CENTRALIZED] Đổi tên các hàm do Solver tạo ra (PROCEDURE_1, PROCEDURE_2)
    thành các tên có ý nghĩa sư phạm (plowOneRow, moveToNextRow) từ curriculum.
    [REWRITTEN] Logic được viết lại để thu thập tên hàm từ nhiều nguồn.
    """
    # 1. Thu thập tên hàm từ tất cả các nguồn có thể có.
    suggested_names = []
    
    # Nguồn 1: Từ solution_config (danh sách các hàm cho lời giải đúng)
    solution_config_names = map_request.get("solution_config", {}).get("function_names", [])
    if solution_config_names:
        suggested_names.extend(solution_config_names)

    # Nguồn 2: Từ bug_config (tên hàm mục tiêu của bug)
    bug_config = map_request.get("generation_config", {}).get("params", {}).get("bug_config", {})
    if bug_config and isinstance(bug_config, dict):
        bug_function_name = bug_config.get("options", {}).get("function_name")
        if bug_function_name and bug_function_name not in suggested_names:
            suggested_names.append(bug_function_name)

    # Nếu không tìm thấy tên nào hoặc không có hàm nào được tạo, thoát.
    if not suggested_names or not program.get("procedures"):
        return program
        
    print_info("Bắt đầu quy trình đổi tên hàm theo mục đích sư phạm...", prefix="    ")
    
    new_program = copy.deepcopy(program)
    old_proc_names = sorted(list(new_program["procedures"].keys()))
    
    name_mapping = {}
    used_new_names = set()
    # Heuristic: Giả định thứ tự các hàm được solver tìm thấy tương ứng với thứ tự tên gợi ý.
    # Đây là một giả định đơn giản nhưng hiệu quả cho nhiều trường hợp.
    # Một phiên bản phức tạp hơn có thể phân tích nội dung hàm.
    # Heuristic: Giả định thứ tự các hàm được solver tìm thấy tương ứng với thứ tự tên gợi ý.
    # Đây là một giả định đơn giản nhưng hiệu quả cho nhiều trường hợp.
    for i, old_name in enumerate(old_proc_names):
        if i < len(suggested_names):
            new_name = suggested_names[i]
            if new_name not in used_new_names:
                name_mapping[old_name] = new_name
                used_new_names.add(new_name)
                print(f"      -> Ánh xạ: '{old_name}' -> '{new_name}'")
                print_info(f"Ánh xạ: '{old_name}' -> '{new_name}'", prefix="      -> ")
    
    if not name_mapping:
        print_warning("Không có ánh xạ nào được thực hiện.", prefix="      -> ")
        return program

    return _apply_procedure_renaming(new_program, name_mapping)

def actions_to_xml(actions: list) -> str:
    """Chuyển đổi danh sách hành động thành chuỗi XML lồng nhau cho Blockly."""
    if not actions:
        return ""
    
    action = actions[0]
    # Đệ quy tạo chuỗi cho các khối còn lại
    next_block_xml = actions_to_xml(actions[1:])
    next_tag = f"<next>{next_block_xml}</next>" if next_block_xml else ""

    if action == 'turnLeft' or action == 'turnRight':
        direction = 'turnLeft' if action == 'turnLeft' else 'turnRight'
        return f'<block type="maze_turn"><field name="DIR">{direction}</field>{next_tag}</block>'
    
    # Các action khác như moveForward, jump, collect, toggleSwitch
    action_name = action.replace("maze_", "")
    return f'<block type="maze_{action_name}">{next_tag}</block>'

def _create_xml_from_structured_solution(program_dict: dict, raw_actions: list = None) -> str:
    """
    [REWRITTEN] Chuyển đổi dictionary lời giải thành chuỗi XML Blockly một cách an toàn.
    Sử dụng ElementTree để xây dựng cây XML thay vì xử lý chuỗi.
    [IMPROVED] Nhận thêm `raw_actions` để xác định hướng rẽ chính xác.
    """
    # [MỚI] Tạo một iterator cho các hành động rẽ từ raw_actions
    # để có thể lấy tuần tự khi cần.
    if raw_actions is None:
        raw_actions = []
    turn_actions_iterator = iter([a for a in raw_actions if a in ['turnLeft', 'turnRight']])

    def build_blocks_recursively(block_list: list) -> list[ET.Element]:
        """Hàm đệ quy để xây dựng một danh sách các đối tượng ET.Element từ dict."""
        elements = []
        for block_data in block_list:
            block_type = block_data.get("type")
            block_element = None # Khởi tạo là None
            
            if block_type == "CALL":
                # [SỬA] Xử lý khối gọi hàm
                block_element = ET.Element('block', {'type': 'procedures_callnoreturn'})
                ET.SubElement(block_element, 'mutation', {'name': block_data.get("name")})
            elif block_type == "maze_repeat":
                block_element = ET.Element('block', {'type': 'maze_repeat'})
                value_el = ET.SubElement(block_element, 'value', {'name': 'TIMES'})
                shadow_el = ET.SubElement(value_el, 'shadow', {'type': 'math_number'})
                field_el = ET.SubElement(shadow_el, 'field', {'name': 'NUM'})
                field_el.text = str(block_data.get("times", 1))
                
                statement_el = ET.SubElement(block_element, 'statement', {'name': 'DO'})
                inner_blocks = build_blocks_recursively(block_data.get("body", []))
                if inner_blocks:
                    # Nối các khối bên trong statement lại với nhau
                    for i in range(len(inner_blocks) - 1):
                        ET.SubElement(inner_blocks[i], 'next').append(inner_blocks[i+1])
                    statement_el.append(inner_blocks[0])
            elif block_type == "variables_set":
                block_element = ET.Element('block', {'type': 'variables_set'})
                field_var = ET.SubElement(block_element, 'field', {'name': 'VAR'})
                field_var.text = block_data.get("variable", "item")
                
                value_el = ET.SubElement(block_element, 'value', {'name': 'VALUE'})
                # [FIX] Xử lý giá trị có thể là một khối khác (variables_get, math_arithmetic)
                value_content = block_data.get("value", 0)
                if isinstance(value_content, dict): # Nếu giá trị là một khối lồng nhau
                    nested_value_blocks = build_blocks_recursively([value_content])
                    if nested_value_blocks:
                        value_el.append(nested_value_blocks[0])
                else: # Nếu giá trị là một số đơn giản
                    shadow_el = ET.SubElement(value_el, 'shadow', {'type': 'math_number'})
                    field_num = ET.SubElement(shadow_el, 'field', {'name': 'NUM'})
                    field_num.text = str(value_content)
            elif block_type == "maze_repeat_variable":
                block_element = ET.Element('block', {'type': 'maze_repeat'})
                value_el = ET.SubElement(block_element, 'value', {'name': 'TIMES'})
                # Thay vì shadow, chúng ta tạo một khối variables_get
                var_get_el = ET.SubElement(value_el, 'block', {'type': 'variables_get'})
                field_var = ET.SubElement(var_get_el, 'field', {'name': 'VAR'})
                field_var.text = block_data.get("variable", "item")
                statement_el = ET.SubElement(block_element, 'statement', {'name': 'DO'})
                inner_blocks = build_blocks_recursively(block_data.get("body", []))
                if inner_blocks:
                    statement_el.append(inner_blocks[0])
            elif block_type == "maze_repeat_expression":
                block_element = ET.Element('block', {'type': 'maze_repeat'})
                value_el = ET.SubElement(block_element, 'value', {'name': 'TIMES'})
                # Tạo khối biểu thức toán học
                expr_data = block_data.get("expression", {})
                math_block = ET.SubElement(value_el, 'block', {'type': expr_data.get("type", "math_arithmetic")})
                ET.SubElement(math_block, 'field', {'name': 'OP'}).text = expr_data.get("op", "ADD")
                # Input A
                val_a = ET.SubElement(math_block, 'value', {'name': 'A'})
                var_a_block = ET.SubElement(val_a, 'block', {'type': 'variables_get'})
                ET.SubElement(var_a_block, 'field', {'name': 'VAR'}).text = expr_data.get("var_a", "a")
                # Input B
                val_b = ET.SubElement(math_block, 'value', {'name': 'B'})
                var_b_block = ET.SubElement(val_b, 'block', {'type': 'variables_get'})
                ET.SubElement(var_b_block, 'field', {'name': 'VAR'}).text = expr_data.get("var_b", "b")

                statement_el = ET.SubElement(block_element, 'statement', {'name': 'DO'})
                inner_blocks = build_blocks_recursively(block_data.get("body", []))
                if inner_blocks:
                    statement_el.append(inner_blocks[0])
            elif block_type == "variables_get":
                # [SỬA LỖI] Xử lý tường minh khối variables_get
                block_element = ET.Element('block', {'type': 'variables_get'})
                field_var = ET.SubElement(block_element, 'field', {'name': 'VAR'})
                field_var.text = block_data.get("variable", "item")
            elif block_type == "math_arithmetic":
                # [SỬA LỖI] Xử lý tường minh khối math_arithmetic
                block_element = ET.Element('block', {'type': 'math_arithmetic'})
                ET.SubElement(block_element, 'field', {'name': 'OP'}).text = block_data.get("op", "ADD")
                # Input A
                val_a_el = ET.SubElement(block_element, 'value', {'name': 'A'})
                var_a_block = ET.SubElement(val_a_el, 'block', {'type': 'variables_get'})
                ET.SubElement(var_a_block, 'field', {'name': 'VAR'}).text = block_data.get("var_a", "a")
                # Input B
                val_b_el = ET.SubElement(block_element, 'value', {'name': 'B'})
                var_b_block = ET.SubElement(val_b_el, 'block', {'type': 'variables_get'})
                ET.SubElement(var_b_block, 'field', {'name': 'VAR'}).text = block_data.get("var_b", "b")
            else:
                # [SỬA] Xử lý các khối đơn giản khác
                action = block_type.replace("maze_", "") if block_type.startswith("maze_") else block_type
                # Blockly không có khối maze_collect, chỉ có maze_collect
                if action == "collect":
                    block_element = ET.Element('block', {'type': 'maze_collect'})
                elif action == "toggleSwitch":
                    block_element = ET.Element('block', {'type': 'maze_toggle_switch'})
                else:
                    block_element = ET.Element('block', {'type': f'maze_{action}'})

                if action == "turn":
                    # [FIX] Lấy hướng rẽ từ iterator, nếu hết thì dùng giá trị mặc định.
                    # Điều này đảm bảo XML sinh ra khớp với lời giải.
                    direction = next(turn_actions_iterator, "turnRight")
                    # Ghi đè lại nếu trong dict có sẵn thông tin direction (cho trường hợp bug)
                    direction = block_data.get("direction", direction)
                    field_el = ET.SubElement(block_element, 'field', {'name': 'DIR'})
                    field_el.text = direction
            
            if block_element is not None:
                elements.append(block_element)
        return elements
    
    # --- [SỬA LỖI] Logic mới để xử lý cả hàm và chương trình chính ---
    # Sẽ trả về một dictionary chứa các khối định nghĩa và khối main riêng biệt.
    final_xml_components = {"procedures": [], "main": None}
    
    # 1. Xử lý các khối định nghĩa hàm (procedures)
    for proc_name, proc_body in program_dict.get("procedures", {}).items():
        # [SỬA] Thêm deletable="false" và bỏ x, y
        proc_def_block = ET.Element('block', {'type': 'procedures_defnoreturn', 'deletable': 'false'})
        
        field_el = ET.SubElement(proc_def_block, 'field', {'name': 'NAME'})
        field_el.text = proc_name
        
        statement_el = ET.SubElement(proc_def_block, 'statement', {'name': 'STACK'})
        inner_blocks = build_blocks_recursively(proc_body)
        if inner_blocks:
            for i in range(len(inner_blocks) - 1):
                ET.SubElement(inner_blocks[i], 'next').append(inner_blocks[i+1])
            statement_el.append(inner_blocks[0])
        
        final_xml_components["procedures"].append(ET.tostring(proc_def_block, encoding='unicode'))

    # 2. Xử lý chương trình chính (main)
    main_blocks = build_blocks_recursively(program_dict.get("main", []))
    if main_blocks:
        for i in range(len(main_blocks) - 1):
            ET.SubElement(main_blocks[i], 'next').append(main_blocks[i+1])
        final_xml_components["main"] = ET.tostring(main_blocks[0], encoding='unicode')

    # [FIX] Nối tất cả các thành phần XML lại với nhau một cách chính xác.
    # Các khối định nghĩa hàm phải được đặt ở cấp cao nhất, bên ngoài khối maze_start.
    proc_defs_xml = "".join(final_xml_components["procedures"])
    main_code_xml = final_xml_components["main"] or ""

    # Bọc code chính trong khối maze_start
    # [FIX] Khối maze_start không nên có deletable="false" hoặc movable="false" ở đây,
    # vì nó sẽ được bọc trong thẻ <xml> và các thuộc tính đó áp dụng cho khối gốc.
    # Thay vào đó, ta sẽ thêm các thuộc tính này vào khối định nghĩa hàm.
    main_start_block = ET.Element('block', {'type': 'maze_start', 'deletable': 'false', 'movable': 'false'})
    main_statement = ET.SubElement(main_start_block, 'statement', {'name': 'DO'})
    if main_code_xml:
        # Phải parse lại chuỗi XML của main để append nó vào statement
        main_statement.append(ET.fromstring(main_code_xml))

    return proc_defs_xml + ET.tostring(main_start_block, encoding='unicode')

def main(run_id: str, source_file_base_name: str, curriculum_source_dir=None):
    """
    Hàm chính để chạy toàn bộ quy trình sinh map.
    Nó đọc file curriculum, sau đó gọi MapGeneratorService để tạo các file map tương ứng.
    :param run_id: Mã định danh duy nhất cho lần chạy pipeline này.
    :param source_file_base_name: Tên gốc của file curriculum excel nguồn.
    :param curriculum_source_dir: (Tùy chọn) Đường dẫn đến thư mục chứa các file curriculum JSON. # type: ignore
                                  Nếu không được cung cấp, sẽ mặc định là 'data/curriculum'.
    """
    print("=============================================")
    print("=== SCRIPT SINH MAP TỰ ĐỘNG TỪ CURRICULUM JSON ===")
    print("=============================================")
    print(f"RUN_ID: {run_id}")

    # [CẢI TIẾN] Sử dụng đường dẫn được cung cấp hoặc mặc định
    # Nếu không có curriculum_source_dir, xây dựng đường dẫn dựa trên run_id.
    curriculum_dir = curriculum_source_dir if curriculum_source_dir else os.path.join(PROJECT_ROOT, 'data', '2_generated_curriculum', run_id)

    toolbox_filepath = os.path.join(PROJECT_ROOT, 'data', '_core', 'toolbox_presets.json')
    # base_maps không còn cần thiết khi đã có cấu trúc mới
    final_output_dir = os.path.join(PROJECT_ROOT, 'data', '3_generated_levels', 'solvable', run_id)
    unsolvable_final_maps_dir = os.path.join(PROJECT_ROOT, 'data', '3_generated_levels', 'unsolvable', run_id)
    reports_dir = os.path.join(PROJECT_ROOT, 'data', '5_reports') # Báo cáo vẫn có RUN_ID trong tên file
    
    # Không cần các thư mục base_map nữa
    # base_maps_output_dir = os.path.join(PROJECT_ROOT, 'data', 'base_maps')
    # unsolvable_base_maps_dir = os.path.join(PROJECT_ROOT, 'data', 'base_maps_unsolvable')
    
    # --- Bước 1: [CẢI TIẾN] Lấy danh sách các file curriculum topic ---
    try:
        # Lọc ra tất cả các file có đuôi .json trong thư mục curriculum
        topic_files = sorted([f for f in os.listdir(curriculum_dir) if f.endswith('.json')])
        if not topic_files:
            print_error(f"Không tìm thấy file curriculum nào trong '{curriculum_dir}'. Dừng chương trình.")
            return
        print_success(f"Tìm thấy {len(topic_files)} file curriculum trong thư mục: {curriculum_dir}")
    except FileNotFoundError:
        print_error(f"Không tìm thấy thư mục curriculum tại '{curriculum_dir}'. Dừng chương trình.")
        return

    # --- Đọc file cấu hình toolbox ---
    try:
        with open(toolbox_filepath, 'r', encoding='utf-8') as f:
            toolbox_presets = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print_warning(f"   Không tìm thấy hoặc file toolbox_presets.json không hợp lệ ({e}). Sẽ sử dụng toolbox rỗng.")
        toolbox_presets = {}

    # --- Đảm bảo thư mục đầu ra tồn tại trước khi ghi file ---
    if not os.path.exists(final_output_dir):
        os.makedirs(final_output_dir)
        print_success(f"Đã tạo thư mục cho game level giải được: {final_output_dir}")
    if not os.path.exists(unsolvable_final_maps_dir):
        os.makedirs(unsolvable_final_maps_dir)
        print_success(f"Đã tạo thư mục cho game level không giải được: {unsolvable_final_maps_dir}")
    if not os.path.exists(reports_dir):
        os.makedirs(reports_dir)
        print_success(f"Đã tạo thư mục cho báo cáo: {reports_dir}")

    # --- Khởi tạo service sinh map ---
    map_generator = MapGeneratorService()
    
    total_maps_generated = 0
    total_maps_failed = 0
    
    # [THÊM MỚI] Danh sách để theo dõi các map không tìm thấy lời giải
    unsolvable_maps_log = []

    # --- Lặp qua từng topic và từng yêu cầu map ---
    for curriculum_filename in topic_files:
        curriculum_filepath = os.path.join(curriculum_dir, curriculum_filename)
        try:
            with open(curriculum_filepath, 'r', encoding='utf-8') as f:
                curriculum_data = json.load(f)
            print_info(f"\n>> Đang xử lý file curriculum: '{curriculum_filename}'")
        except json.JSONDecodeError:
            print_error(f"   File '{curriculum_filename}' không phải là file JSON hợp lệ. Bỏ qua file này.")
            # Giả định lỗi cho tất cả map trong file (ước lượng)
            # total_maps_failed += sum(len(t.get('challenges', [])) for c in curriculum_data.get('categories', []) for t in c.get('topics', []))
            continue
        except Exception as e:
            print_error(f"   Lỗi không xác định khi đọc file '{curriculum_filename}': {e}. Bỏ qua file này.")
            continue
        for category_data in curriculum_data.get('categories', []):
            category_code = category_data.get('category_code', 'UNKNOWN_CATEGORY')
            for topic in category_data.get('topics', []):
                # [SỬA LỖI] Đọc đúng key 'topic_codes' (số nhiều) thay vì 'topic_code' (số ít)
                # để khớp với cấu trúc file curriculum JSON được sinh ra.
                topic_code = topic.get('topic_codes', 'UNKNOWN_TOPIC')
                topic_name_vi = topic.get('topic_name', 'N/A')
                print(f"\n  >> Đang xử lý Topic: {topic_name_vi} ({topic_code})")

                for request_index, map_request in enumerate(topic.get('challenges', [])):
                    # Lấy thông tin từ cấu trúc mới
                    generation_config = map_request.get('generation_config', {})
                    map_type = generation_config.get('map_type')
                    logic_type = generation_config.get('logic_type')
                num_variants = generation_config.get('num_variants', 1)

                if not map_type or not logic_type:
                    print_warning(f"     Bỏ qua yêu cầu #{request_index + 1} trong topic {topic_code} vì thiếu 'map_type' hoặc 'logic_type'.")
                    continue

                # [BIG UPDATE] Phân luồng xử lý:
                # - Nếu num_variants > 1, sử dụng quy trình sinh biến thể mới.
                # - Nếu num_variants = 1, sử dụng quy trình sinh map đơn lẻ như cũ.
                challenge_id_part = map_request.get('id', f'unknown_req_{request_index+1}')
                base_params = generation_config.get('params', {})
                
                # [FIX] Inject solution_item_goals into params so Placers can use it for smart quantity
                # Extract from solution_config which handles the structured data
                sol_config = map_request.get('solution_config', {})
                item_goals = sol_config.get('itemGoals', {})
                
                if item_goals:
                    # Convert dict {'crystal': 'all'} back to string "crystal:all" for compatibility
                    goal_strings = [f"{k}:{v}" for k, v in item_goals.items()]
                    base_params['solution_item_goals'] = ",".join(goal_strings)
                
                # [NÂNG CẤP] Khởi tạo bộ theo dõi theme cho mỗi challenge
                
                # [NÂNG CẤP] Khởi tạo bộ theo dõi theme cho mỗi challenge
                used_themes_for_challenge = set()

                if num_variants > 1:
                    # [NÂNG CẤP] Tạo một bản sao của params để không làm thay đổi base_params gốc
                    # khi các biến thể được tạo ra.
                    params_for_generation = copy.deepcopy(base_params)
                    params_for_generation['map_type'] = map_type
                    print_info(f"    -> Kích hoạt quy trình sinh {num_variants} BIẾN THỂ cho '{challenge_id_part}'...")
                    map_iterator = map_generator.generate_map_variants(
                        map_type=map_type,
                        logic_type=logic_type,
                        params=params_for_generation,
                        max_variants=num_variants
                    )
                else:
                    print_info(f"    -> Kích hoạt quy trình sinh map ĐƠN LẺ cho '{challenge_id_part}'...")
                    # [NÂNG CẤP] Áp dụng theme ngay cả cho map đơn lẻ (var1)
                    params_for_generation = copy.deepcopy(base_params)
                    params_for_generation['map_type'] = map_type
                    new_theme = get_new_theme_for_map(map_type, used_themes_for_challenge)
                    params_for_generation['asset_theme'] = new_theme
                    used_themes_for_challenge.add((new_theme.get("ground"), new_theme.get("obstacle")))
                    # Bọc map đơn lẻ trong một list để vòng lặp bên dưới hoạt động nhất quán
                    single_map = map_generator.generate_map(
                        map_type=map_type,
                        logic_type=logic_type,
                        params=params_for_generation
                    )
                    map_iterator = [single_map] if single_map else []

                # --- Vòng lặp xử lý chung cho cả map đơn lẻ và biến thể ---
                for variant_index, generated_map in enumerate(map_iterator):
                    log_prefix = f"    [{challenge_id_part}-var{variant_index + 1}]"

                    try:
                        # [REFACTOR] Bọc toàn bộ logic xử lý biến thể trong try...finally
                        # để đảm bảo log được thu thập đầy đủ và stdout được khôi phục.
                        log_stream = io.StringIO()
                        log_handler = StringIOHandler(log_stream)
                        root_logger = logging.getLogger()
                        old_stdout = sys.stdout
                        
                        # Chuyển hướng stdout và logging
                        sys.stdout = log_stream
                        # Xóa các handler cũ và thêm handler mới
                        for handler in root_logger.handlers[:]:
                            root_logger.removeHandler(handler)
                        root_logger.addHandler(log_handler)
                        root_logger.setLevel(logging.INFO)

                        # [NÂNG CẤP] Lấy params từ map đã sinh ra (chứa theme mới)
                        params_from_map = generated_map.params
                        if 'asset_theme' not in params_from_map:
                            new_theme = get_new_theme_for_map(map_type, used_themes_for_challenge)
                            params_from_map['asset_theme'] = new_theme
                            used_themes_for_challenge.add((new_theme.get("ground"), new_theme.get("obstacle")))
                            print_info(f"{log_prefix} Đã áp dụng theme mới: {new_theme['ground']} / {new_theme['obstacle']}", prefix="      ->")

                        game_config = generated_map.to_game_engine_dict()

                        # [FIX] Bổ sung các khối nền từ placement_coords vào game_config.
                        # Đây là bước quan trọng để đảm bảo toàn bộ cấu trúc map được render.
                        if generated_map.placement_coords:
                            # Lấy danh sách các khối đã có để tránh trùng lặp
                            existing_blocks = game_config['gameConfig'].get('blocks', [])
                            # Tạo một set các vị trí đã có khối để kiểm tra nhanh hơn
                            existing_positions = {f"{b['position']['x']}-{b['position']['y']}-{b['position']['z']}" for b in existing_blocks}
                            for coord in generated_map.placement_coords:
                                pos_key = f"{coord[0]}-{coord[1]}-{coord[2]}"
                                if pos_key not in existing_positions:
                                    existing_blocks.append({"modelKey": "ground.normal", "position": {"x": coord[0], "y": coord[1], "z": coord[2]}})

                        # [CẢI TIẾN] Đọc theme từ params để sử dụng cho vật cản
                        asset_theme = params_from_map.get('asset_theme', {})
                        default_obstacle_model = asset_theme.get('obstacle', 'wall.brick01')
                        stair_model = asset_theme.get('stair', 'ground.checker')

                        # [SỬA] Danh sách các modelKey của tường chắn không được thay đổi bởi theme.
                        UNJUMPABLE_WALL_MODELS = {'wall.stone01', 'lava.lava01', 'water.water01'}
                        
                        # [CHUẨN HÓA] Gán danh sách obstacles từ Topology vào gameConfig.
                        # Topology giờ đây chịu trách nhiệm hoàn toàn cho việc định nghĩa vật cản (bao gồm cả bậc thang).
                        if generated_map.obstacles:
                            final_obstacles = []
                            for i, obs in enumerate(generated_map.obstacles):
                                existing_model = obs.get('modelKey')
                                # Nếu modelKey đã có và là loại tường không thể nhảy, giữ nguyên.
                                if existing_model in UNJUMPABLE_WALL_MODELS:
                                    model_to_use = existing_model
                                else: # Nếu không, sử dụng model từ theme hoặc model mặc định.
                                    model_to_use = existing_model or default_obstacle_model
                                
                                final_obstacles.append({"id": f"o{i+1}", "type": "obstacle", "modelKey": model_to_use, "position": {"x": obs['pos'][0], "y": obs['pos'][1], "z": obs['pos'][2]}})
                            game_config['gameConfig']['obstacles'] = final_obstacles

                        # [REFACTOR] Logic tạo ID cuối cùng được đơn giản hóa
                        # Hậu tố biến thể luôn được xác định bởi `variant_index`
                        variant_suffix_from_curriculum_match = re.search(r'(-var\d+)\.json$', curriculum_filename, re.IGNORECASE)
                        if variant_suffix_from_curriculum_match:
                            # Nếu file curriculum là biến thể, ID map sẽ kế thừa hậu tố đó
                            final_id_part = f"{challenge_id_part}{variant_suffix_from_curriculum_match.group(1)}"
                        else:
                            # Nếu không, thêm hậu tố dựa trên vòng lặp
                            final_id_part = f"{challenge_id_part}-var{variant_index + 1}"

                        # [CẬP NHẬT LẦN CUỐI] ID cuối cùng chính là final_id_part
                        base_map_id = final_id_part
                        
                        # [THAY ĐỔI] Mặc định lưu vào thư mục solvable, sẽ thay đổi sau nếu không có lời giải
                        current_final_map_dir = final_output_dir # Chỉ cần 1 biến thư mục đích
                        blockly_config_req = map_request.get('blockly_config', {})
                        toolbox_preset_name = blockly_config_req.get('toolbox_preset')
                        
                        # Lấy toolbox từ preset và tạo một bản sao để không làm thay đổi bản gốc
                        # (SỬA LỖI) Sử dụng deepcopy để tạo một bản sao hoàn toàn độc lập
                        base_toolbox = copy.deepcopy(toolbox_presets.get(toolbox_preset_name, {"kind": "categoryToolbox", "contents": []}))

                        # (CẢI TIẾN) Tự động thêm khối "Events" (when Run) vào đầu mỗi toolbox
                        events_category = {
                          "kind": "category",
                          "name": "%{BKY_GAMES_CATEVENTS}",
                          "categorystyle": "events_category",
                          "contents": [ { "kind": "block", "type": "maze_start" } ]
                        }
                        
                        # Đảm bảo 'contents' là một danh sách và chèn khối Events vào đầu
                        if 'contents' not in base_toolbox: base_toolbox['contents'] = []
                        base_toolbox['contents'].insert(0, events_category)
                        toolbox_data = base_toolbox

                        # [CẢI TIẾN] Chuẩn bị dữ liệu translations và topic key
                        topic_key = topic_code
                        topic_name_en = TOPIC_TRANSLATIONS.get(topic_name_vi, topic_name_vi)
                        final_translations = copy.deepcopy(map_request.get('translations', {}))

                        # [HIỆU CHỈNH THEO YÊU CẦU] Trích xuất mã biến thể từ ID
                        variant_match = re.search(r'-(var\d+)$', base_map_id)
                        variant_prefix = ""
                        if variant_match:
                            variant_prefix = f"[{variant_match.group(1)}] " # Tạo tiền tố dạng "[var1] "

                        if 'vi' in final_translations:
                            final_translations['vi'][topic_key] = topic_name_vi # Bỏ tiền tố khỏi topic
                            # Thêm tiền tố vào title
                            final_translations['vi'][map_request['titleKey']] = f"{variant_prefix}{final_translations['vi'][map_request['titleKey']]}"
                        if 'en' in final_translations:
                            final_translations['en'][topic_key] = topic_name_en # Bỏ tiền tố khỏi topic
                            # Thêm tiền tố vào title
                            final_translations['en'][map_request['titleKey']] = f"{variant_prefix}{final_translations['en'][map_request['titleKey']]}"


                        
                        # --- [CẢI TIẾN] Logic xử lý lời giải ---
                        # [FIX] Sử dụng deepcopy để không mutate map_request gốc
                        # Điều này rất quan trọng vì các variants kế tiếp cần itemGoals='all' nguyên bản
                        solution_config = copy.deepcopy(map_request.get('solution_config', {}))
                        solution_config['logic_type'] = logic_type
                        

                        # [SỬA LỖI QUAN TRỌNG] Tính toán itemGoals TRƯỚC KHI gọi solver.
                        # Điều này đảm bảo solver nhận được giá trị số, không phải chuỗi "all".
                        # Phải tạo một bản sao sâu (deepcopy) để không làm thay đổi cấu trúc gốc
                        # Điều này đảm bảo biến `final_item_goals` luôn tồn tại để có thể ghi log lỗi.
                        requested_item_goals = copy.deepcopy(map_request.get('solution_config', {}).get('itemGoals', {}))
                        final_item_goals = {}
                        # [NÂNG CẤP] Logic mới để tự động tính toán itemGoals="all"
                        # Duyệt qua các mục tiêu được yêu cầu trong curriculum
                        for item_type, required_count in requested_item_goals.items():
                            # Nếu yêu cầu là "all", chúng ta cần đếm số lượng thực tế
                            if isinstance(required_count, str) and required_count.lower() == "all":
                                actual_count = 0
                                # Đếm trong 'interactibles' (ví dụ: switch)
                                if 'interactibles' in game_config['gameConfig']:
                                    actual_count += sum(1 for item in game_config['gameConfig']['interactibles'] if item.get('type') == item_type)
                                # Đếm trong 'collectibles' (ví dụ: crystal)
                                if 'collectibles' in game_config['gameConfig']:
                                    actual_count += sum(1 for item in game_config['gameConfig']['collectibles'] if item.get('type') == item_type)
                                
                                final_item_goals[item_type] = actual_count # type: ignore
                                print_info(f"{log_prefix} Đã tính toán itemGoals cho '{item_type}': 'all' -> {actual_count} (thực tế).")
                            else:
                                # Nếu không phải "all", giữ nguyên giá trị yêu cầu
                                final_item_goals[item_type] = required_count
                        solution_config['itemGoals'] = final_item_goals

                        # [SỬA LỖI] Các logic_type này không thể giải bằng A* truyền thống.
                        # Chúng ta sẽ bỏ qua bước giải và tạo lời giải "giả lập" trực tiếp.
                        logic_types_to_skip_solving = [
                            'advanced_algorithm', 
                            'config_driven_execution',
                            'math_expression_loop',
                            'math_puzzle'
                        ]

                        solution_result = None
                        if logic_type not in logic_types_to_skip_solving:
                            # --- Bước 6: Gọi gameSolver để tìm lời giải (chỉ cho các map giải được bằng A*) --- # type: ignore
                            # [SỬA LỖI] Đảm bảo truyền đầy đủ thông tin, đặc biệt là gameConfig cho solver.
                            temp_level_for_solver = {
                                "gameConfig": game_config['gameConfig'],
                                "blocklyConfig": {"toolbox": toolbox_data},
                                "solution": solution_config,
                                "generation_config": generation_config # [THÊM] Truyền generation_config cho solver
                            }
                            solution_result = solve_map_and_get_solution(temp_level_for_solver) # type: ignore
                        else: # type: ignore
                            print(f"{log_prefix} LOG: Bỏ qua bước giải A* cho logic_type '{logic_type}'. Sẽ tạo lời giải giả lập.")
                            # Tạo một đối tượng world để hàm synthesize_program có thể đọc
                            from scripts.gameSolver import GameWorld, synthesize_program, count_blocks, format_program_dict_for_json
                            world = GameWorld({
                                "gameConfig": game_config['gameConfig'], # type: ignore
                                "blocklyConfig": {"toolbox": toolbox_data},
                                "solution": solution_config,
                                "generation_config": generation_config # [THÊM] Truyền generation_config cho solver
                            })
                            # Gọi trực tiếp hàm synthesize_program với một danh sách hành động trống
                            # vì lời giải sẽ được tạo dựa trên logic_type, không phải hành động.
                            program_dict = synthesize_program([], world)

                            # [REFACTORED] Gọi hàm đổi tên sư phạm
                            program_dict = _rename_procedures_pedagogically(
                                program_dict, map_request
                            )
                            solution_result = {
                                "block_count": count_blocks(program_dict),
                                "program_solution_dict": program_dict,
                                "raw_actions": [], # Không có hành động thô
                                "structuredSolution": program_dict
                            }

                        # [REFACTORED] Đổi tên hàm sư phạm cho lời giải từ Solver
                        if solution_result:
                            original_program_dict = solution_result.get("program_solution_dict", {})
                            pedagogical_program_dict = _rename_procedures_pedagogically(original_program_dict, map_request)
                            solution_result['program_solution_dict'] = pedagogical_program_dict
                        
                        # --- [MỚI] Bước 6.5: Tính toán Optimal Lines of Code cho JavaScript ---
                        # [FIX] Lấy log đã thu thập TRƯỚC KHI khôi phục stdout
                        # và TRƯỚC KHI ghi vào báo cáo.
                        sys.stdout = old_stdout # Khôi phục stdout để in ra console nếu cần
                        if log_handler in root_logger.handlers:
                            root_logger.removeHandler(log_handler)
                        captured_logs = log_stream.getvalue()
                        # [THÊM MỚI] Kiểm tra nếu không có lời giải và ghi log
                        if not solution_result:
                            # [NÂNG CẤP] Thu thập thông tin chi tiết cho báo cáo lỗi
                            error_details = (
                                f"Solver không tìm thấy lời giải. "
                                f"MapType: {map_type}, LogicType: {logic_type}, "
                                f"Toolbox: {toolbox_preset_name}, "
                                f"Params: {params_from_map}"
                            )
                            # [FIX] In lỗi ra console thật trước khi ghi log
                            # Khôi phục tạm thời để in
                            sys.stdout = old_stdout
                            root_logger.removeHandler(log_handler)
                            # [THAY ĐỔI] Chuyển hướng lưu file sang thư mục unsolvable
                            current_final_map_dir = unsolvable_final_maps_dir # Đổi thư mục đích
                            print_error(f"{log_prefix} {error_details} -> Sẽ lưu vào thư mục 'unsolvable'.")
                            print_error(f"{log_prefix} {error_details}")
                            # Chuyển hướng lại để tiếp tục ghi log
                            sys.stdout = log_stream
                            root_logger.addHandler(log_handler)
                            
                            unsolvable_maps_log.append({
                                "id": base_map_id,
                                "solution_found": "Không",
                                "topology": map_type,
                                "placer": logic_type,
                                "optimalBlocks": 99,
                                "itemGoals_crystal": final_item_goals.get('crystal', 0),
                                "itemGoals_switch": final_item_goals.get('switch', 0),
                                "obstacles_placed": len(game_config['gameConfig'].get('obstacles', [])),
                                "toolbox_preset": toolbox_preset_name,
                                "variant_number": variant_index + 1,
                                "detailed_log": error_details, # Sẽ được cập nhật trong khối finally
                            })
                            # [THÊM MỚI] Bổ sung các thông tin từ map_request
                            raw_actions_count = len(solution_result.get('raw_actions', [])) if solution_result else 0
                            unsolvable_maps_log[-1].update({
                                "subject_codes": map_request.get('subject_codes', 'N/A'),
                                "topic_codes": topic_code,
                                "bloom_level_codes": map_request.get('bloom_level_codes', 'N/A'),
                                "solution_item_goals": map_request.get('solution_item_goals', 'N/A'),
                                "raw_actions_count": raw_actions_count,
                            })
                            unsolvable_maps_log[-1].update({
                                "challenge_type": map_request.get('challenge_type', 'N/A'),
                                "difficulty_code": map_request.get('difficulty_code', 'N/A'),
                                "core_skill_codes": ", ".join(map_request.get('core_skills', [])),
                                # [THÊM MỚI] Thêm thông tin Asset Theme
                                "asset_theme_ground": params_from_map.get('asset_theme', {}).get('ground', 'N/A'),
                                "asset_theme_obstacle": params_from_map.get('asset_theme', {}).get('obstacle', 'N/A')
                            })
                            # Gán optimalBlocks = 99 theo yêu cầu để dễ nhận biết
                            optimal_blocks_value = 99
                        else:
                            # [REFACTORED] Đổi tên hàm sư phạm cho lời giải từ Solver
                            original_program_dict = solution_result.get("program_solution_dict", {})
                            pedagogical_program_dict = _rename_procedures_pedagogically(original_program_dict, map_request)
                            solution_result['program_solution_dict'] = pedagogical_program_dict

                            # [THÊM MỚI] Ghi log cả các map giải thành công
                            unsolvable_maps_log.append({
                                "id": base_map_id,
                                "solution_found": "Có",
                                "topology": map_type,
                                "placer": logic_type,
                                "optimalBlocks": solution_result.get('block_count', 0),
                                "itemGoals_crystal": final_item_goals.get('crystal', 0),
                                "itemGoals_switch": final_item_goals.get('switch', 0),
                                "obstacles_placed": len(game_config['gameConfig'].get('obstacles', [])),
                                "toolbox_preset": toolbox_preset_name,
                                "variant_number": variant_index + 1,
                                "detailed_log": "Lời giải được tìm thấy thành công.", # Sẽ được cập nhật trong khối finally
                            })
                            # [THÊM MỚI] Bổ sung các thông tin từ map_request
                            raw_actions_count = len(solution_result.get('raw_actions', [])) if solution_result else 0
                            unsolvable_maps_log[-1].update({
                                "subject_codes": map_request.get('subject_codes', 'N/A'),
                                "topic_codes": topic_code,
                                "bloom_level_codes": map_request.get('bloom_level_codes', 'N/A'),
                                "solution_item_goals": map_request.get('solution_item_goals', 'N/A'),
                                "raw_actions_count": raw_actions_count,
                            })
                            unsolvable_maps_log[-1].update({
                                "challenge_type": map_request.get('challenge_type', 'N/A'),
                                "difficulty_code": map_request.get('difficulty_code', 'N/A'),
                                "core_skill_codes": ", ".join(map_request.get('core_skills', [])),
                                # [THÊM MỚI] Thêm thông tin Asset Theme
                                "asset_theme_ground": params_from_map.get('asset_theme', {}).get('ground', 'N/A'),
                                "asset_theme_obstacle": params_from_map.get('asset_theme', {}).get('obstacle', 'N/A')
                            })
                            optimal_blocks_value = solution_result.get('block_count', 0)

                        optimal_lloc = 0
                        if solution_result and solution_result.get('structuredSolution'):
                            optimal_lloc = calculate_optimal_lines_from_structured(solution_result.get('structuredSolution', {})) # type: ignore

                        # --- Logic mới để sinh startBlocks động cho các thử thách FixBug ---
                        # [SỬA LỖI] Khởi tạo các biến ở phạm vi rộng hơn để tránh lỗi
                        final_inner_blocks = ''
                        # [MỚI] Khởi tạo các biến cho phiên bản lỗi
                        buggy_program_dict = None
                        structured_solution_fixbug = None

                        start_blocks_type = generation_config.get("params", {}).get("start_blocks_type", "empty")

                        # [CẢI TIẾN LỚN] Logic sinh startBlocks # type: ignore
                        original_program_dict = solution_result.get("program_solution_dict", {}) if solution_result else {} # type: ignore
                        if start_blocks_type == "buggy_solution" and solution_result:
                            print(f"{log_prefix} LOG: Bắt đầu quy trình tạo lỗi cho 'buggy_solution'.")
                            bug_type = generation_config.get("params", {}).get("bug_type")
                            bug_config = generation_config.get("params", {}).get("bug_config", {}) or {}

                            # [REWRITTEN] Logic tạo lỗi theo kiến trúc mới
                            # Bước 1: Tạo bản sao của lời giải đúng để chỉnh sửa
                            program_to_be_bugged = copy.deepcopy(original_program_dict) # Sử dụng original_program_dict đã lấy ở trên # type: ignore

                            # Bước 2: Gọi service để tạo lỗi trực tiếp trên dictionary
                            # Giả định `create_bug` giờ đây nhận và trả về dict
                            # Nếu bug_type là 'optimization_logic', startBlocks là lời giải chưa tối ưu
                            if bug_type in {'optimization_logic', 'optimization_no_variable'}: # type: ignore
                                print(f"      LOG: Tạo bug tối ưu hóa, sử dụng lời giải thô làm startBlocks.")
                                raw_actions = solution_result.get("raw_actions", [])
                                inner_xml = actions_to_xml(raw_actions) # type: ignore
                                final_inner_blocks = f'<block type="maze_start" deletable="false" movable="false"><statement name="DO">{inner_xml}</statement></block>' # noqa
                                # Trong trường hợp này, không có structuredSolution_fixbug_version
                            else:
                                buggy_program_dict = create_bug(bug_type, program_to_be_bugged, bug_config)

                                # Bước 3: Từ `buggy_program_dict`, tạo ra các output cần thiết
                                # [FIX] Kiểm tra xem create_bug có trả về dict hợp lệ không.
                                # Một số hàm bug cũ có thể trả về string (XML) khi thất bại.
                                if isinstance(buggy_program_dict, dict):
                                    # [FIX] Tạo XML cho startBlocks.
                                    # Đối với lỗi incorrect_block, raw_actions của lời giải gốc vẫn có thể
                                    # được dùng để xác định hướng rẽ cho các khối 'turn' không bị thay đổi.
                                    raw_actions_for_bug = solution_result.get("raw_actions", []) if bug_type in ['incorrect_block', 'incorrect_parameter'] else None
                                    final_inner_blocks = _create_xml_from_structured_solution(buggy_program_dict, raw_actions_for_bug) # type: ignore
                                    # Tạo phiên bản text của lời giải lỗi
                                    structured_solution_fixbug = buggy_program_dict # type: ignore
                                    print_success(f"{log_prefix} Đã tạo thành công phiên bản lỗi của lời giải.")
                                else:
                                    print_warning(f"{log_prefix} Hàm tạo lỗi cho bug_type '{bug_type}' không thể áp dụng. "
                                                  f"Lỗi có thể do không tìm thấy cấu trúc phù hợp trong lời giải gốc. "
                                                  f"Sẽ sử dụng lời giải đúng làm startBlocks để tiếp tục.")
                                    final_inner_blocks = _create_xml_from_structured_solution(original_program_dict) # type: ignore
                                    # Không tạo structured_solution_fixbug trong trường hợp này.
                                    # final_inner_blocks = '' # Để trống nếu không tạo được lỗi
                        
                        elif start_blocks_type in ["raw_solution", "unrefactored_solution", "long_solution"] and solution_result: # type: ignore
                            # Cung cấp lời giải tuần tự (chưa tối ưu)
                            raw_actions = solution_result.get("raw_actions", []) # noqa
                            # [SỬA LỖI] Bọc các khối tuần tự trong một khối maze_start
                            inner_xml = actions_to_xml(raw_actions)
                            final_inner_blocks = f'<block type="maze_start" deletable="false" movable="false"><statement name="DO">{inner_xml}</statement></block>' # type: ignore
                        
                        elif start_blocks_type == "optimized_solution" and solution_result: # type: ignore
                            # Cung cấp lời giải đã tối ưu
                            final_inner_blocks = _create_xml_from_structured_solution(original_program_dict, solution_result.get("raw_actions", [])) # type: ignore
                        elif 'start_blocks' in blockly_config_req and blockly_config_req['start_blocks']:
                            raw_start_blocks = blockly_config_req['start_blocks'] # type: ignore
                            # [CẢI TIẾN] Sử dụng XML parser để trích xuất nội dung một cách an toàn
                            try:
                                root = ET.fromstring(raw_start_blocks)
                                final_inner_blocks = "".join(ET.tostring(child, encoding='unicode') for child in root) # type: ignore
                            except ET.ParseError:
                                print(f"{log_prefix} ⚠️ Cảnh báo: Lỗi cú pháp XML trong 'start_blocks' được định nghĩa sẵn. Sử dụng chuỗi thô.")
                                final_inner_blocks = raw_start_blocks.replace('<xml>', '').replace('</xml>', '')
                        
                        if final_inner_blocks:
                            # [SỬA LỖI] Đảm bảo thẻ <xml> luôn được thêm vào, ngay cả khi final_inner_blocks đã chứa nó
                            if not final_inner_blocks.strip().startswith('<xml>'):
                                 final_start_blocks = f"<xml>{final_inner_blocks}</xml>" # type: ignore
                            else:
                                 final_start_blocks = final_inner_blocks # Đã có thẻ <xml>
                        else:
                            # Mặc định: tạo một khối maze_start rỗng
                            final_start_blocks = "<xml><block type=\"maze_start\" deletable=\"false\" movable=\"false\"><statement name=\"DO\"></statement></block></xml>"

                        # --- Bước 7: Tổng hợp file JSON cuối cùng ---
                        # [CHUẨN HÓA TÊN] Sử dụng lại ID đã được tạo cho base_map.
                        new_id = base_map_id

                        final_json_content = {
                            "id": new_id, # Sử dụng ID đã được chuẩn hóa
                            "gameType": "maze",
                            "topic": topic_code, # [SỬA] Sử dụng topic_codes trực tiếp từ curriculum
                            "grade": map_request.get('grade', 'N/A'), # [THÊM MỚI]
                            "challenge_type": map_request.get('challenge_type', 'N/A'), # [THÊM MỚI]
                            "difficulty_code": map_request.get('difficulty_code', 'N/A'), # [THÊM MỚI]
                            "gen_map_type": generation_config.get('map_type'), # [THÊM MỚI]
                            "gen_logic_type": generation_config.get('logic_type'), # [THÊM MỚI]
                            "core_skill_codes": map_request.get('core_skills', []), # [THÊM MỚI]
                            # [THÊM MỚI THEO YÊU CẦU] Tích hợp các trường metadata từ curriculum
                            "subject_codes": [s.strip() for s in map_request.get('subject_codes', '').split(',') if s.strip()],
                            "category_codes": [s.strip() for s in map_request.get('category_codes', '').split(',') if s.strip()],
                            "topic_codes": [s.strip() for s in map_request.get('topic_codes', '').split(',') if s.strip()],
                            "bloom_level_codes": [s.strip() for s in map_request.get('bloom_level_codes', '').split(',') if s.strip()],
                            "exam_type_code": [s.strip() for s in map_request.get('exam_type_code', '').split(',') if s.strip()],
                            "course_codes": [s.strip() for s in (map_request.get('course_codes') or 'CODING').split(',') if s.strip()],
                            "context_codes": [s.strip() for s in map_request.get('context_codes', '').split(',') if s.strip()],
                            "knowledge_dimension_codes": [s.strip() for s in map_request.get('knowledge_dimension_codes', '').split(',') if s.strip()],
                            "learning_objective_codes": [s.strip() for s in map_request.get('learning_objective_codes', '').split(',') if s.strip()],
                            "difficulty_perceived_score": map_request.get('difficulty_perceived_score', 5),
                            "difficulty_perceived_label": map_request.get('difficulty_perceived_label', 'Medium'),
                            "difficulty_intrinsic": map_request.get('difficulty_intrinsic', 'N/A'), # [THÊM MỚI]
                            "level": map_request.get('level', 1), # [THÊM MỚI] Thêm thông tin level từ curriculum
                            "titleKey": map_request.get('titleKey'),
                            "questTitleKey": map_request.get('descriptionKey'),
                            "descriptionKey": map_request.get('descriptionKey'),
                            "translations": final_translations, # [MỚI] Sử dụng translations đã bổ sung
                            "supportedEditors": ["blockly", "monaco"],
                            "blocklyConfig": {
                                "toolbox": toolbox_data,
                                "maxBlocks": (solution_result['block_count'] + 5) if solution_result else 99,
                                "startBlocks": final_start_blocks,
                                "toolboxPresetKey": toolbox_preset_name
                            },
                            "gameConfig": game_config['gameConfig'],
                            "solution": {
                                #"type": map_request.get('solution_config', {}).get('type', 'reach_target'),
                                "type": "reach_target",
                                "itemGoals": final_item_goals, # type: ignore
                                "itemGoals": final_item_goals,
                                "optimalBlocks": optimal_blocks_value, # [THAY ĐỔI] Sử dụng giá trị đã được kiểm tra
                                "optimalLines": optimal_lloc,
                                "rawActions": solution_result.get('raw_actions', []) if solution_result else [], # type: ignore
                                "rawActionsCount": len(solution_result.get('raw_actions', [])) if solution_result else 0,
                                "structuredSolution": solution_result.get('program_solution_dict', {}) if solution_result else {}, # Lời giải đúng # type: ignore
                            },
                            "sounds": { "win": "/assets/maze/win.mp3", "fail": "/assets/maze/fail_pegman.mp3" }
                        }

                        # [MỚI] Thêm trường structuredSolution_fixbug_version nếu có
                        # [SỬA LỖI] Gán đúng phiên bản lỗi vào đúng trường. # type: ignore
                        # Nếu có phiên bản lỗi, gán nó. Nếu không, gán lại phiên bản đúng để đảm bảo trường luôn tồn tại.
                        
                        if buggy_program_dict:
                            final_json_content["solution"]["structuredSolution_fixbug_version"] = buggy_program_dict
                        elif solution_result: # Nếu không tạo được lỗi, dùng lại lời giải đúng
                            final_json_content["solution"]["structuredSolution_fixbug_version"] = solution_result.get('program_solution_dict', {})

                        # --- Bước 8: Lưu file JSON cuối cùng ---
                        filename = f"{new_id}.json"
                        output_filepath = os.path.join(current_final_map_dir, filename)
                        with open(output_filepath, 'w', encoding='utf-8') as f:
                            json.dump(final_json_content, f, indent=2, ensure_ascii=False)
                        print(f"{log_prefix} ✅ Đã tạo: {filename}")

                        total_maps_generated += 1
                        
                    except Exception as e:
                        # [FIX] Khôi phục stdout để in lỗi ra console thật
                        sys.stdout = old_stdout
                        root_logger.removeHandler(log_handler)
                        print(f"{log_prefix} ❌ Lỗi không xác định khi sinh map: {e}")
                        # In traceback để gỡ lỗi chi tiết
                        import traceback
                        traceback.print_exc()
                        # Chuyển hướng lại để ghi log
                        sys.stdout = log_stream
                        root_logger.addHandler(log_handler)
                        total_maps_failed += 1
                        
                        # Update the detailed_log with captured output
                        error_details = (
                            f"Lỗi không xác định trong quá trình sinh map: {e}. "
                            f"Solver không tìm thấy lời giải. "
                            f"MapType: {map_type}, LogicType: {logic_type}, "
                            f"Toolbox: {toolbox_preset_name}, "
                            f"Params: {params_from_map}"
                        )
                        unsolvable_maps_log.append({
                            "id": base_map_id,
                            "solution_found": "Không",
                            "topology": map_type,
                            "placer": logic_type,
                            "optimalBlocks": 99,
                            "itemGoals_crystal": final_item_goals.get('crystal', 0),
                            "itemGoals_switch": final_item_goals.get('switch', 0),
                            "obstacles_placed": len(game_config['gameConfig'].get('obstacles', [])),
                            "toolbox_preset": toolbox_preset_name,
                            "variant_number": variant_index + 1,
                            "detailed_log": error_details + "\n" + captured_logs, # Append captured logs
                            "challenge_type": map_request.get('challenge_type', 'N/A'),
                            "difficulty_code": map_request.get('difficulty_code', 'N/A'),
                            "subject_codes": map_request.get('subject_codes', 'N/A'),
                            "topic_codes": topic_code,
                            "bloom_level_codes": map_request.get('bloom_level_codes', 'N/A'),
                            "solution_item_goals": map_request.get('solution_item_goals', 'N/A'),
                            "raw_actions_count": 0, # Lỗi không xác định, không có lời giải
                            "core_skill_codes": ", ".join(map_request.get('core_skills', [])),
                            "asset_theme_ground": params_from_map.get('asset_theme', {}).get('ground', 'N/A'),
                            "asset_theme_obstacle": params_from_map.get('asset_theme', {}).get('obstacle', 'N/A')
                        })
                        optimal_blocks_value = 99
                        continue # Continue with next variant
                    finally:
                        # Ensure stdout is always restored and handler removed
                        # [REFACTOR] Logic khôi phục và lấy log được chuyển vào đây
                        if sys.stdout != old_stdout:
                            sys.stdout = old_stdout
                        if log_handler in root_logger.handlers:
                            root_logger.removeHandler(log_handler)
                        
                        # Lấy toàn bộ log đã thu thập và cập nhật vào bản ghi cuối cùng
                        captured_logs = log_stream.getvalue()
                        if unsolvable_maps_log:
                            unsolvable_maps_log[-1]['detailed_log'] += "\n--- Log chi tiết ---\n" + captured_logs

    # --- Bước 6: In báo cáo tổng kết ---
    print("\n=============================================")
    print("=== KẾT THÚC QUY TRÌNH SINH MAP ===")

    # [CẬP NHẬT] Luôn xuất báo cáo ra file Excel, ngay cả khi không có lỗi
    # Tên file báo cáo giờ sẽ chứa tên file nguồn và RUN_ID
    report_filename = f"report_{source_file_base_name}_{run_id}.xlsx"
    report_path = os.path.join(reports_dir, report_filename) # Lưu vào thư mục reports
    num_unsolvable = sum(1 for log in unsolvable_maps_log if log['solution_found'] == 'Không')
    num_solvable = len(unsolvable_maps_log) - num_unsolvable

    print(f"📊 Báo cáo: Đã tạo thành công {total_maps_generated} file game, thất bại {total_maps_failed} file.")
    print_info(f"   - Trong đó: {num_solvable} map tìm thấy lời giải, {num_unsolvable} map không tìm thấy lời giải.")
    print(f"📂 Các file game giải được đã lưu tại: {final_output_dir}")
    print(f"📂 Các file game KHÔNG giải được đã lưu tại: {unsolvable_final_maps_dir}")

    if unsolvable_maps_log:
        if num_unsolvable > 0:
            print_warning(f"\n⚠️  Phát hiện {num_unsolvable} map không có lời giải. Đang xuất báo cáo tổng hợp ra file Excel...")
        else:
            print_info("\n✅ Tất cả các map đều có lời giải. Đang xuất báo cáo tổng hợp ra file Excel...")

        try:
            df_report = pd.DataFrame(unsolvable_maps_log)

            # [CẬP NHẬT] Đổi tên cột 'id' hiện tại thành 'question_codes'
            df_report.rename(columns={'id': 'question_codes'}, inplace=True)

            # [CẬP NHẬT] Tạo cột 'id' mới bằng cách loại bỏ hậu tố '-var' từ 'question_codes'
            df_report['id'] = df_report['question_codes'].apply(lambda x: re.sub(r'-var\d+$', '', x))

            # [LOGIC MỚI] Tính toán 'variantCount' bằng cách đếm số lượng biến thể cho mỗi ID gốc.
            # 1. Đếm số lần xuất hiện của mỗi 'id' gốc.
            variant_counts = df_report['id'].value_counts()
            # 2. Ánh xạ (map) số đếm này trở lại DataFrame để tạo cột 'variantCount'.
            df_report['variantCount'] = df_report['id'].map(variant_counts)

            # [CẬP NHẬT] Đổi tên các cột còn lại và chọn các cột cần giữ
            df_report.rename(columns={
                'solution_found': 'solver?',
                'topology': 'gen_map_type',
                'placer': 'gen_logic_type',
                'optimalBlocks': 'Optimal Blocks',
                'itemGoals_crystal': 'crystalCount',
                'itemGoals_switch': 'switchCount',
                'obstacles_placed': 'obstacleCount',
                'toolbox_preset': 'toolboxPresetKey',
                'topic_codes': 'topic',
                'raw_actions_count': 'rawActionsCount',
            }, inplace=True)

            # [CẬP NHẬT] Định nghĩa lại thứ tự và danh sách các cột cuối cùng sẽ xuất ra file Excel
            final_columns = ['id', 'question_codes', 'solver?', 'gen_map_type', 'gen_logic_type', 'Optimal Blocks', 'crystalCount', 'switchCount', 'obstacleCount', 'toolboxPresetKey', 'variantCount', 'topic', 'rawActionsCount']
            df_report = df_report[final_columns]

            df_report.to_excel(report_path, index=False)
            print_success(f"Đã xuất báo cáo thành công tại: {report_path}")
        except Exception as e:
            print_error(f"Không thể xuất file báo cáo Excel: {e}")
    else:
        print_info("\nℹ️ Không có map nào được xử lý, không tạo file báo cáo.")

    print("=============================================")

if __name__ == "__main__":
    # Điểm khởi chạy của script
    # [Cập nhật] Tạo run_id test với định dạng mới
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_test")
    # Giả sử một tên file nguồn để tạo run_id
    fake_source_name = "test_curriculum"
    test_run_id = f"{fake_source_name}_{timestamp}"
    main(test_run_id, "curriculum_source_test")