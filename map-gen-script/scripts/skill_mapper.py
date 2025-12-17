# File: skill_mapper.py
# Version: 3.0 (Upgraded for Complex/Nested Params)
# Description: Cỗ máy thực thi việc gán thẻ kỹ năng (core_skills).
#              Nó đọc các quy tắc từ 'master_mapping_rules.py' và áp dụng lên dữ liệu.
#              Đã được nâng cấp để xử lý các tham số gen_params có cấu trúc phức tạp.

import pandas as pd
import re
import json
from .master_mapping_rules import MASTER_MAPPING_RULES

def _parse_gen_params(param_string: str) -> dict:
    """
    [NÂNG CẤP] Chuyển đổi chuỗi gen_params thành dictionary.
    Có khả năng xử lý các giá trị là chuỗi JSON-like (ví dụ: bug_config).
    """
    if not isinstance(param_string, str) or not param_string:
        return {}
    params = {}
    # Tách các cặp key-value dựa trên dấu chấm phẩy
    for pair in param_string.strip().split(';'):
        if ':' in pair:
            try:
                key, value = pair.split(':', 1)
                key = key.strip()
                value = value.strip()
                # Cố gắng chuyển đổi giá trị nếu nó trông giống JSON/dict
                if value.startswith('{') and value.endswith('}'):
                    try:
                        # Thay thế dấu nháy đơn bằng nháy kép để hợp lệ với JSON
                        # và xử lý các khoảng trắng không đồng nhất
                        cleaned_value = re.sub(r"'\s*:\s*'", '":"', value.replace("'", '"'))
                        params[key] = json.loads(cleaned_value)
                    except (json.JSONDecodeError, TypeError):
                        params[key] = value # Nếu thất bại, giữ nguyên dạng chuỗi
                # [ĐỀ XUẤT CẢI TIẾN] Cố gắng chuyển đổi các giá trị trông giống số thành số thực sự.
                elif value.isdigit():
                    params[key] = int(value)
                elif value.replace('.', '', 1).isdigit():
                    params[key] = float(value)
                else:
                    params[key] = value
            except ValueError:
                continue
    return params

def generate_core_skills(row: pd.Series) -> list:
    """
    [NÂNG CẤP] Hàm chính để suy luận và gán thẻ core_skills cho một challenge.
    Đã thêm logic đặc biệt để xử lý bug_type:multiple_errors.
    """
    collected_skills = set()

    # 1. Quét vùng Text
    text_fields = ['title_vi', 'title_en', 'description_vi', 'description_en']
    combined_text = ' '.join(str(row.get(f, '')) for f in text_fields).lower()
    if combined_text:
        for pattern, skills in MASTER_MAPPING_RULES['by_text_keywords'].items():
            if re.search(pattern, combined_text):
                if isinstance(skills, list):
                    collected_skills.update(skills)
                else:
                    collected_skills.add(skills)

    # 2. Quét các trường dữ liệu cấu trúc
    challenge_type = str(row.get('challenge_type', ''))
    if challenge_type in MASTER_MAPPING_RULES['by_challenge_type']:
        collected_skills.add(MASTER_MAPPING_RULES['by_challenge_type'][challenge_type])

    toolbox = str(row.get('blockly_toolbox_preset', '')).lower()
    if toolbox:
        for keyword, skill in MASTER_MAPPING_RULES['by_toolbox_preset'].items():
            if keyword in toolbox:
                collected_skills.add(skill)

    map_type = str(row.get('gen_map_type', ''))
    if map_type in MASTER_MAPPING_RULES['by_map_type']:
        collected_skills.update(MASTER_MAPPING_RULES['by_map_type'][map_type])

    goals = str(row.get('solution_item_goals', '')).lower()
    if goals:
        for keyword, skill in MASTER_MAPPING_RULES['by_solution_goals'].items():
            if keyword in goals:
                collected_skills.add(skill)
            
    # 3. Quét chi tiết gen_params
    params = _parse_gen_params(row.get('gen_params'))
    if params:
        # Xử lý trường hợp đặc biệt: Gỡ lỗi đa lỗi
        if params.get('bug_type') == 'multiple_errors':
            bug_config = params.get('bug_config', {})
            if isinstance(bug_config, dict) and 'errors' in bug_config:
                bug_type_rules = MASTER_MAPPING_RULES['by_map_params']['bug_type']
                for error in bug_config.get('errors', []):
                    error_type = error.get('type')
                    if error_type in bug_type_rules:
                        collected_skills.add(bug_type_rules[error_type])

        # Xử lý các params khác theo logic chung
        for param_key, param_value in params.items():
            if param_key == 'bug_config': # Bỏ qua vì đã xử lý riêng
                continue

            if param_key in MASTER_MAPPING_RULES['by_map_params']:
                rules_for_key = MASTER_MAPPING_RULES['by_map_params'][param_key]
                
                # Xử lý quy tắc key-value đơn giản
                if isinstance(param_value, str) and param_value in rules_for_key:
                    collected_skills.add(rules_for_key[param_value])
                # Xử lý các quy tắc phức tạp hơn
                else:
                    for rule_key, skill in rules_for_key.items():
                        if rule_key.startswith(">"): # Quy tắc ngưỡng
                            try:
                                if int(param_value) > int(rule_key[1:]):
                                    collected_skills.add(skill)
                            except (ValueError, TypeError):
                                continue
                        elif isinstance(param_value, str) and rule_key in param_value: # Quy tắc chứa
                            collected_skills.add(skill)

    return sorted(list(collected_skills))

# ==============================================================================
# PHẦN CHẠY THỬ NGHIỆM (ĐÃ NÂNG CẤP ĐỂ KIỂM TRA TÍNH NĂNG MỚI)
# ==============================================================================
if __name__ == "__main__":
    print("--- CHẠY THỬ NGHIỆM SKILL_MAPPER.PY ---")
    
    # Dữ liệu mẫu bao gồm cả trường hợp gỡ lỗi đa lỗi
    sample_data = {
        'title_vi': [
            "Bước đi đầu tiên", 
            "Sửa lỗi Kép: Đâm tường và Vội vàng"
        ],
        'challenge_type': [
            "SIMPLE_APPLY",
            "DEBUG_FIX_LOGIC"
        ],
        'blockly_toolbox_preset': [
            "commands_l1_move",
            "commands_l4_collect"
        ],
        'gen_map_type': [
            "straight_line",
            "straight_line"
        ],
        'gen_params': [
            "path_length:3",
            "bug_type:multiple_errors; bug_config:{'errors':[{'type':'incorrect_block','from':'jump','to':'moveForward'},{'type':'sequence_error','blocks':['jump','collectItem']}]}"
        ],
        'solution_item_goals': [
            "",
            "crystal:1"
        ],
        'title_en': ["First Step", "Debug Double: Wrong Command & Sequence"],
        'description_vi': ["", ""],
        'description_en': ["", ""]
    }
    df_test = pd.DataFrame(sample_data)
    
    # Áp dụng hàm generate_core_skills
    df_test['inferred_skills'] = df_test.apply(generate_core_skills, axis=1)

    print("\n[Kết quả gán thẻ kỹ năng cho dữ liệu mẫu:]")
    for index, row in df_test.iterrows():
        print(f"\nCâu hỏi: {row['title_vi']}")
        print(f"  -> gen_params: {row['gen_params']}")
        print(f"  -> Kỹ năng được gán: {row['inferred_skills']}")

    print("\n--- KIỂM TRA KẾT THÚC ---")