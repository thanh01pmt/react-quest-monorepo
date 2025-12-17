# ==============================================================================
# PHẦN 1: THIẾT LẬP MÔI TRƯỜNG VÀ ĐƯỜNG DẪN
# --- MÔ TẢ TÍNH NĂNG ---
# Script này là một công cụ tiện ích, thực hiện quy trình ngược lại so với
# `generate_curriculum.py`. Nó đọc tất cả các file curriculum JSON trong thư mục
# `data/curriculum`, trích xuất thông tin của từng challenge và tổng hợp lại
# thành một file Excel duy nhất (`curriculum_reversed.xlsx`).
#
# Mục đích chính là để dễ dàng xem, rà soát và chỉnh sửa toàn bộ curriculum
# trên một giao diện bảng tính quen thuộc.
#
# --- CÁCH CHẠY ---
# Mở terminal, di chuyển vào thư mục gốc của dự án (GenMap) và chạy lệnh:
#
# python3 scripts/json_to_excel_curriculum.py
#
#
# ==============================================================================
import sys
import os
import pandas as pd
import json

# Lấy đường dẫn tuyệt đối của thư mục chứa script này
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
# Lấy đường dẫn thư mục gốc của dự án
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)

# Thêm thư mục gốc của dự án vào sys.path để import các module khác
if PROJECT_ROOT not in sys.path:
    sys.path.append(PROJECT_ROOT)

# ==============================================================================
# PHẦN 2: CÁC HÀM TIỆN ÍCH
# ==============================================================================

def format_params(params_dict):
    """
    Chuyển đổi dictionary params thành chuỗi string theo định dạng 'key:value; key2:value2'.
    """
    if not isinstance(params_dict, dict):
        return ""
    
    items = []
    for key, value in params_dict.items():
        # Nếu value là dict (ví dụ asset_theme), chuyển nó thành chuỗi JSON không có dấu cách
        if isinstance(value, dict):
            # Dùng json.dumps để xử lý đúng các ký tự đặc biệt và dấu ngoặc
            value_str = json.dumps(value, ensure_ascii=False, separators=(',', ':'))
        else:
            value_str = str(value)
        items.append(f"{key}:{value_str}")
        
    return "; ".join(items)

def format_item_goals(goals_dict):
    """
    Chuyển đổi dictionary itemGoals thành chuỗi string theo định dạng 'crystal:1; switch:1'.
    """
    if not isinstance(goals_dict, dict):
        return ""
    return "; ".join([f"{key}:{value}" for key, value in goals_dict.items()])

# ==============================================================================
# PHẦN 3: CHƯƠNG TRÌNH CHÍNH
# ==============================================================================
def main():
    """
    Hàm chính để đọc các file curriculum JSON và xuất ra file Excel.
    """
    print("======================================================")
    print("=== BẮT ĐẦU QUY TRÌNH XUẤT CURRICULUM RA EXCEL ===")
    print("======================================================")

    # --- Định nghĩa đường dẫn ---
    curriculum_dir = os.path.join(PROJECT_ROOT, 'data', 'curriculum')
    output_excel_path = os.path.join(PROJECT_ROOT, 'data', 'curriculum_reversed.xlsx')

    # --- Các cột tiêu chuẩn cho file Excel ---
    excel_columns = [
        'Grade', 'topic_codes', 'topic_name', 'subject_codes', 'challenge_type',
        'category_codes', 'difficulty_code', 'bloom_level_codes', 'learning_objective_codes',
        'knowledge_dimension_codes', 'context_codes', 'id', 'question_codes', 'level',
        'title_vi', 'description_vi', 'title_en', 'description_en', 'gen_map_type',
        'gen_logic_type', 'gen_num_variants', 'gen_params', 'blockly_toolbox_preset',
        'solution_item_goals'
    ]

    all_rows = []

    # --- Quét và xử lý từng file JSON trong thư mục curriculum ---
    try:
        json_files = [f for f in os.listdir(curriculum_dir) if f.startswith('CURRICULUM.') and f.endswith('.json')]
        print(f"🔍 Tìm thấy {len(json_files)} file curriculum JSON để xử lý.")

        for filename in json_files:
            filepath = os.path.join(curriculum_dir, filename)
            print(f"  -> Đang xử lý file: {filename}...")
            with open(filepath, 'r', encoding='utf-8') as f:
                category_data = json.load(f)

            category_code = category_data.get('category_code', '')

            # [CẬP NHẬT] Lặp qua các topic và challenges
            for topic in category_data.get('topics', []):
                topic_codes = topic.get('topic_codes', '')
                topic_name = topic.get('topic_name', '')

                for challenge in topic.get('challenges', []):
                    gen_config = challenge.get('generation_config', {})
                    params = gen_config.get('params', {})
                    solution_config = challenge.get('solution_config', {})
                    translations = challenge.get('translations', {})
                    vi_trans = translations.get('vi', {})
                    en_trans = translations.get('en', {})

                    row_data = {
                        'Grade': challenge.get('grade'),
                        'topic_codes': topic_codes,
                        'topic_name': topic_name,
                        'category_codes': category_code, # Thêm category_code
                        'id': challenge.get('id'),
                        'level': challenge.get('level'),
                        'title_vi': vi_trans.get(challenge.get('titleKey')),
                        'description_vi': vi_trans.get(challenge.get('descriptionKey')),
                        'title_en': en_trans.get(challenge.get('titleKey')),
                        'description_en': en_trans.get(challenge.get('descriptionKey')),
                        'gen_map_type': gen_config.get('map_type'),
                        'gen_logic_type': gen_config.get('logic_type'),
                        'gen_num_variants': gen_config.get('num_variants'),
                        'gen_params': format_params(params),
                        'blockly_toolbox_preset': challenge.get('blockly_config', {}).get('toolbox_preset'),
                        'solution_item_goals': format_item_goals(solution_config.get('itemGoals'))
                    }
                    all_rows.append(row_data)

        # --- Tạo DataFrame và xuất ra Excel ---
        if all_rows:
            df = pd.DataFrame(all_rows)
            # Sắp xếp lại các cột theo đúng thứ tự chuẩn và điền các cột còn thiếu
            df = df.reindex(columns=excel_columns)
            
            df.to_excel(output_excel_path, index=False)
            print(f"\n✅ Hoàn tất! Đã tạo thành công file '{output_excel_path}' với {len(df)} challenges.")
        else:
            print("⚠️ Không tìm thấy challenge nào để xử lý.")

    except Exception as e:
        print(f"❌ Đã xảy ra lỗi nghiêm trọng: {e}")

if __name__ == "__main__":
    main()