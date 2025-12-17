# scripts/extract_map_info.py
#
# --- MÔ TẢ TÍNH NĂNG ---
# Script này có chức năng quét qua tất cả các file map game đã hoàn thiện
# trong thư mục 'data/final_game_levels', trích xuất các thông tin quan trọng
# về lời giải và cấu trúc của map (ví dụ: optimalBlocks, số lượng vật phẩm,
# số vật cản, v.v.).
#
# Sau khi trích xuất, script sẽ tổng hợp tất cả dữ liệu này vào một file Excel
# duy nhất, được đặt tên theo dấu thời gian (ví dụ: map_data_export_20251213_143055.xlsx)
# và lưu vào thư mục 'data/'.
#
# --- CÁCH CHẠY ---
# Mở terminal, di chuyển vào thư mục gốc của dự án (GenMap) và chạy lệnh:
#
# python3 scripts/extract_map_info.py
#


import json
import os
import re
import pandas as pd
from datetime import datetime

# --- Thiết lập đường dẫn gốc của dự án ---
# Lấy đường dẫn đến thư mục gốc của dự án (đi lên 2 cấp từ file hiện tại)
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def detect_required_concepts(data: dict) -> list:
    """
    Xác định các kiến thức lập trình cần áp dụng cho màn chơi.
    
    Args:
        data: Dictionary chứa dữ liệu JSON của màn chơi
        
    Returns:
        Danh sách các concept được sắp xếp theo thứ tự
    """
    concepts = set()
    
    # 1. COMMANDS luôn có (mọi map đều cần di chuyển cơ bản)
    concepts.add("COMMANDS")
    
    # 2. Kiểm tra FUNCTIONS từ structuredSolution
    solution = data.get('solution', {})
    structured = solution.get('structuredSolution', {})
    if structured.get('procedures') and len(structured.get('procedures', {})) > 0:
        concepts.add("FUNCTIONS")
    
    # 3. Kiểm tra từ toolboxPresetKey
    preset = data.get('blocklyConfig', {}).get('toolboxPresetKey', '').lower()
    
    preset_to_concept = {
        'loops': 'FOR_LOOPS',
        'while': 'WHILE_LOOPS',
        'variables': 'VARIABLES',
        'conditionals': 'CONDITIONALS',
        'logic_ops': 'LOGIC_OPERATORS',
        'parameters': 'FUNCTIONS_WITH_PARAMS',
        'algorithms_navigation': 'ALGO_MAZE_SOLVING',
        'algorithms_full': 'ALGO_OPTIMIZATION',
    }
    
    for keyword, concept in preset_to_concept.items():
        if keyword in preset:
            concepts.add(concept)
    
    # 4. Nếu có FUNCTIONS_WITH_PARAMS thì cũng có FUNCTIONS
    if 'FUNCTIONS_WITH_PARAMS' in concepts:
        concepts.add('FUNCTIONS')
    
    # 5. Kiểm tra thêm từ core_skill_codes (nếu có)
    core_skills = data.get('core_skill_codes', [])
    if isinstance(core_skills, list):
        skill_to_concept = {
            'FUNC_': 'FUNCTIONS',
            'LOOP_FOR': 'FOR_LOOPS',
            'LOOP_WHILE': 'WHILE_LOOPS',
            'VAR_': 'VARIABLES',
            'COND_': 'CONDITIONALS',
            'LOGIC_OP': 'LOGIC_OPERATORS',
            # Thuật toán chi tiết
            'ALGO_MAZE_SOLVING': 'ALGO_MAZE_SOLVING',
            'ALGO_OPTIMIZATION': 'ALGO_OPTIMIZATION',
            'ALGO_SPIRAL_TRAVERSAL': 'ALGO_SPIRAL_TRAVERSAL',
        }
        for skill in core_skills:
            for prefix, concept in skill_to_concept.items():
                if prefix in skill:
                    concepts.add(concept)
    
    # 5b. Kiểm tra gen_map_type để phát hiện thuật toán
    gen_map_type = data.get('gen_map_type', '').lower()
    map_type_to_algo = {
        'complex_maze': 'ALGO_MAZE_SOLVING',
        'swift_playground_maze': 'ALGO_MAZE_SOLVING',
        'spiral': 'ALGO_SPIRAL_TRAVERSAL',
        'plowing_field': 'ALGO_OPTIMIZATION',
        'grid': 'ALGO_OPTIMIZATION',
    }
    for map_keyword, algo in map_type_to_algo.items():
        if map_keyword in gen_map_type:
            concepts.add(algo)
    
    # 6. [MỚI] Phân tích sâu structuredSolution.main để tăng độ chính xác
    def analyze_blocks(blocks):
        """Phân tích đệ quy các blocks trong solution"""
        for block in blocks:
            if not isinstance(block, dict):
                continue
            block_type = block.get('type', '').lower()
            
            # Phát hiện FOR_LOOPS
            if 'repeat' in block_type or 'maze_repeat' in block_type:
                concepts.add('FOR_LOOPS')
            
            # Phát hiện WHILE_LOOPS
            if 'while' in block_type or 'until' in block_type or 'forever' in block_type:
                concepts.add('WHILE_LOOPS')
            
            # Phát hiện CONDITIONALS
            if 'if' in block_type or 'controls_if' in block_type:
                concepts.add('CONDITIONALS')
            
            # Phát hiện VARIABLES
            if 'variable' in block_type or 'variables_set' in block_type or 'variables_get' in block_type:
                concepts.add('VARIABLES')
            
            # Phát hiện LOGIC_OPERATORS
            if 'logic_operation' in block_type or 'logic_negate' in block_type:
                concepts.add('LOGIC_OPERATORS')
            
            # Phân tích các blocks con (nếu có nested structure)
            if 'DO' in block:
                nested = block.get('DO', [])
                if isinstance(nested, list):
                    analyze_blocks(nested)
    
    # Phân tích main blocks
    analyze_blocks(structured.get('main', []))
    
    # Phân tích các procedures
    for proc_name, proc_blocks in structured.get('procedures', {}).items():
        if isinstance(proc_blocks, list):
            analyze_blocks(proc_blocks)
    
    return sorted(list(concepts))

def extract_info_from_json(filepath):
    """
    Trích xuất thông tin cần thiết từ một file JSON map.
    Bao gồm xử lý lỗi nếu thiếu key.
    """
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)

        question_codes = data.get('id', 'N/A')
        # Trích xuất base_id bằng cách loại bỏ hậu tố "-var..."
        base_id = re.sub(r'-var\d+$', '', question_codes)

        # Sử dụng .get() để truy cập an toàn, cung cấp giá trị mặc định nếu key không tồn tại
        solution = data.get('solution', {})
        game_config = data.get('gameConfig', {})
        # Lấy itemGoals từ solution, nhưng nếu không có thì lấy từ gameConfig (cấu trúc cũ hơn)
        item_goals = solution.get('itemGoals', game_config.get('itemGoals', {}))

        obstacles_count = len(game_config.get('obstacles', []))

        # [CẬP NHẬT] Trích xuất thêm các trường thông tin theo yêu cầu
        core_skill_codes_list = data.get('core_skill_codes', [])
        core_skill_codes_str = ', '.join(core_skill_codes_list) if isinstance(core_skill_codes_list, list) else ''

        # [MỚI] Xác định required_concepts
        required_concepts = detect_required_concepts(data)

        info = {
            'id': base_id,
            'question_codes': question_codes,
            'topic': data.get('topic', 'N/A'),
            'grade': data.get('grade', 'N/A'),
            'challenge_type': data.get('challenge_type', 'N/A'),
            'difficulty_code': data.get('difficulty_code', 'N/A'),
            'gen_map_type': data.get('gen_map_type', 'N/A'),
            'gen_logic_type': data.get('gen_logic_type', 'N/A'),
            'core_skill_codes': core_skill_codes_str,
            'toolboxPresetKey': data.get('blocklyConfig', {}).get('toolboxPresetKey', 'N/A'),
            'difficulty_intrinsic': data.get('difficulty_intrinsic', 'N/A'),
            'level': data.get('level', 0),
            'rawActionsCount': solution.get('rawActionsCount', len(solution.get('rawActions', []))),
            'optimalBlocks': solution.get('optimalBlocks', 0),
            'optimalLines': solution.get('optimalLines', 0),
            'crystalCount': item_goals.get('crystal', 0),
            'switchCount': item_goals.get('switch', 0),
            'obstacleCount': obstacles_count,
            # [MỚI] Thêm cột required_concepts
            'required_concepts': ', '.join(required_concepts),
        }
        return info
    except json.JSONDecodeError:
        print(f"Lỗi: File '{os.path.basename(filepath)}' không phải là JSON hợp lệ. Bỏ qua.")
        return None
    except Exception as e:
        print(f"Lỗi không xác định khi xử lý file {os.path.basename(filepath)}: {e}")
        return None

def main():
    """
    Hàm chính để quét thư mục, trích xuất dữ liệu và xuất ra file Excel.
    """
    print("=====================================================================")
    print("=== SCRIPT CẬP NHẬT NGÂN HÀNG CÂU HỎI (question_bank.xlsx) ===")
    print("=====================================================================")
    print("Chức năng: Quét thư mục 'data/3_generated_levels/solvable', đọc file .json,")
    print("           trích xuất thông tin và thực hiện 2 việc:")
    print("           1. Cập nhật/ghi tiếp vào file 'data/0_source/question_bank.xlsx'.")
    print("           2. Tạo một file báo cáo riêng cho lần quét này trong 'data/5_reports'.")
    print("\nCách chạy:")
    print("cd /path/to/your/GenMap/project")
    print("python3 scripts/extract_map_info.py")
    print("---------------------------------------------------------------------\n")

    final_maps_dir = os.path.join(PROJECT_ROOT, 'data', '3_generated_levels', 'solvable')
    source_data_dir = os.path.join(PROJECT_ROOT, 'data', '0_source')
    reports_dir = os.path.join(PROJECT_ROOT, 'data', '5_reports') # [THÊM MỚI] Đường dẫn thư mục reports
    output_path = os.path.join(source_data_dir, 'question_bank.xlsx')
    
    if not os.path.isdir(final_maps_dir):
        print(f"Lỗi: Không tìm thấy thư mục nguồn '{final_maps_dir}'.")
        return

    all_maps_data = [] # Danh sách để lưu trữ dữ liệu map đã trích xuất
    processed_map_ids = set() # Set để theo dõi các ID đã xử lý, nhằm mục đích lọc trùng
    print(f"Đang quét các file trong và các thư mục con của: {final_maps_dir}")

    # [CẬP NHẬT] Sử dụng os.walk để quét đệ quy tất cả các thư mục con
    for root, dirs, files in os.walk(final_maps_dir):
        for filename in files:
            if filename.endswith('.json'):
                filepath = os.path.join(root, filename)
                map_info = extract_info_from_json(filepath) # Trích xuất thông tin từ file
                if map_info:
                    # [MỚI] Thêm cơ chế lọc trùng dựa trên 'question_codes'
                    map_id = map_info.get('question_codes')
                    if map_id and map_id not in processed_map_ids:
                        all_maps_data.append(map_info)
                        processed_map_ids.add(map_id)
                    elif map_id in processed_map_ids:
                        print(f"  -> Bỏ qua file trùng lặp: '{filename}' (ID: {map_id})")

    if not all_maps_data:
        print("Không tìm thấy file JSON nào để xử lý.")
        return

    # --- [CẬP NHẬT] Logic đọc, hợp nhất và ghi file ---
    new_data_df = pd.DataFrame(all_maps_data)

    # --- [THÊM MỚI] Logic để tạo file báo cáo riêng lẻ trong data/5_reports ---
    # Việc này được thực hiện trước khi hợp nhất dữ liệu
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    report_filename = f"map_data_export_{timestamp}.xlsx"
    
    # Đảm bảo thư mục reports tồn tại
    if not os.path.exists(reports_dir):
        os.makedirs(reports_dir)
    report_output_path = os.path.join(reports_dir, report_filename)
    
    new_data_df.to_excel(report_output_path, index=False)
    print(f"\n✅ Đã tạo file báo cáo riêng cho lần quét này tại: {report_output_path}")
    # --------------------------------------------------------------------
    
    # Bước 1: Đọc file question_bank.xlsx hiện có (nếu có)
    if os.path.exists(output_path):
        print(f"\nĐang đọc file ngân hàng câu hỏi hiện có: '{os.path.basename(output_path)}'...")
        try:
            existing_df = pd.read_excel(output_path)
            print(f"-> Tìm thấy {len(existing_df)} câu hỏi đã tồn tại.")
            # Hợp nhất dữ liệu cũ và mới
            combined_df = pd.concat([existing_df, new_data_df], ignore_index=True)
        except Exception as e:
            print(f"  - ⚠️ Lỗi khi đọc file Excel hiện có: {e}. Sẽ tạo file mới với dữ liệu vừa quét.")
            combined_df = new_data_df
    else:
        print(f"\nFile '{os.path.basename(output_path)}' chưa tồn tại. Sẽ tạo file mới.")
        combined_df = new_data_df

    # Bước 2: Loại bỏ các dòng trùng lặp dựa trên 'question_codes', giữ lại bản ghi cuối cùng
    # Điều này đảm bảo các câu hỏi được cập nhật nếu chúng được sinh lại.
    final_df = combined_df.drop_duplicates(subset=['question_codes'], keep='last')
    final_df = final_df.sort_values(by=['id', 'question_codes']).reset_index(drop=True)

    # Bước 3: Ghi lại toàn bộ dữ liệu đã được hợp nhất và làm sạch
    final_df.to_excel(output_path, index=False)
    print(f"\n✅ Hoàn tất! Đã cập nhật/tạo file ngân hàng câu hỏi tại: {output_path}")
    print(f"-> Tổng số câu hỏi trong file: {len(final_df)}")

    print("\n=====================================================================")

if __name__ == "__main__":
    main()