# scripts/generate_curriculum.py

# --- MÔ TẢ TÍNH NĂNG ---
# Script này đóng vai trò chuyển đổi dữ liệu từ file Excel curriculum (đã được xử lý
# và gán độ khó) thành các file curriculum có cấu trúc JSON.
#
# Mỗi file Excel nguồn sẽ được chuyển đổi thành một file JSON duy nhất, chứa toàn bộ
# thông tin về các chủ đề (topics) và thử thách (challenges). Cấu trúc JSON này
# là đầu vào cho bước tiếp theo: `generate_all_maps.py`.
#
# Script này là một phần của pipeline chính và được gọi sau khi `assign_difficulty.py` chạy xong.
#
# --- CÁCH CHẠY ---
# Script này thường được gọi tự động bởi `main.py`. Để chạy độc lập cho mục đích thử nghiệm:
#
# python3 scripts/generate_curriculum.py
#

import pandas as pd
import json
import os
from collections import defaultdict

# --- Cấu hình đường dẫn ---
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


# [MỚI] Hàm đệ quy để chuyển đổi tất cả các set thành list
def convert_sets_to_lists_recursively(obj):
    """
    Chuyển đổi tất cả các đối tượng set thành list trong một cấu trúc dữ liệu (dict, list, set).
    """
    if isinstance(obj, set):
        return list(obj)
    elif isinstance(obj, dict):
        return {k: convert_sets_to_lists_recursively(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_sets_to_lists_recursively(elem) for elem in obj]
    else:
        return obj

# --- [NÂNG CẤP] Hàm parse_params được cải tiến để xử lý JSON objects và arrays ---
def parse_params(param_string):
    """
    Chuyển đổi chuỗi 'key1:value1;key2:{"k":"v"};key3:[1,2]' thành dictionary.
    Hỗ trợ các giá trị dạng: chuỗi, số nguyên, JSON object, và JSON array.
    """
    if not isinstance(param_string, str) or not param_string.strip():
        return {}
    params = {}
    # Phân tách các cặp key-value bằng dấu chấm phẩy
    for part in param_string.split(';'):
        if ':' in part:
            key, value = part.split(':', 1)
            key = key.strip()
            value = value.strip()
            
            try:
                # Ưu tiên 1: Thử parse như một JSON chuẩn (sau khi thay thế nháy đơn)
                if (value.startswith('{') and value.endswith('}')) or (value.startswith('[') and value.endswith(']')):
                    try:
                        # Thay thế nháy đơn bằng nháy kép để JSON hợp lệ hơn
                        valid_json_string = value.replace("'", '"')
                        params[key] = json.loads(valid_json_string)
                        continue # Nếu thành công, chuyển sang cặp key-value tiếp theo
                    except json.JSONDecodeError:
                        # Nếu json.loads thất bại, thử eval như một phương án cuối
                        # cho các cấu trúc phức tạp nhưng không phải JSON chuẩn
                        evaluated_value = eval(value)
                        # [SỬA LỖI] Áp dụng chuyển đổi đệ quy để xử lý các set lồng nhau
                        params[key] = convert_sets_to_lists_recursively(evaluated_value)
                        continue

                # Ưu tiên 2: Thử chuyển đổi thành số (float hoặc int)
                try:
                    if '.' in value:
                        params[key] = float(value)
                    else:
                        params[key] = int(value)
                except ValueError:
                    # Ưu tiên 3: Giữ nguyên là chuỗi nếu không thể chuyển đổi
                    params[key] = value
            except Exception:
                params[key] = value
    return params


def main(run_id: str, source_file_base_name: str):
    """Đọc file Excel và sinh ra các file curriculum JSON."""
    print("=============================================")
    print("=== SCRIPT CHUYỂN ĐỔI EXCEL SANG CURRICULUM JSON ===")
    print("=============================================")
    print(f"RUN_ID: {run_id}")
    print(f"Source file base: {source_file_base_name}")

    # --- Cấu hình đường dẫn động ---
    input_file = os.path.join(PROJECT_ROOT, 'data', '1_processed', f'{run_id}_{source_file_base_name}_with_difficulty.xlsx')
    output_dir = os.path.join(PROJECT_ROOT, 'data', '2_generated_curriculum', run_id)

    print("=============================================")
    print("=== BẮT ĐẦU QUY TRÌNH SINH CURRICULUM ===")
    print("=============================================")

    try:
        # Sử dụng .fillna('') để xử lý các ô trống, tránh lỗi
        df = pd.read_excel(input_file).fillna('')
        print(f"✅ Đọc thành công file nguồn: {input_file}")
    except FileNotFoundError:
        print(f"❌ Lỗi: Không tìm thấy file nguồn '{input_file}'.")
        return
    except Exception as e:
        print(f"❌ Lỗi khi đọc file Excel '{input_file}': {e}")
        return

    # [CẬP NHẬT] Nhóm các thử thách theo hai cấp: category_codes -> topic_codes
    challenges_by_category = defaultdict(lambda: defaultdict(lambda: {'topic_name': '', 'challenges': []}))

    # [CẬP NHẬT] Lặp qua từng dòng trong file Excel để tạo cấu trúc curriculum
    for index, row in df.iterrows():
        if pd.isna(row['topic_codes']) or row['topic_codes'] == '': continue

        # [SỬA LỖI & CẢI TIẾN] Logic tạo ID được làm mạnh mẽ hơn.
        # Ưu tiên lấy ID từ cột 'id'. Nếu trống, tự động tạo một ID có ý nghĩa
        # dựa trên các thông tin khác để đảm bảo tính duy nhất và dễ nhận biết.
        new_id = row.get('id')
        if not new_id or pd.isna(new_id):
            category_code = row.get('category_codes', 'CAT')
            topic_code = row.get('topic_codes', 'TOPIC')
            challenge_type = row.get('challenge_type', 'APPLY')
            level = int(row.get('level', index))
            # Tạo ID dự phòng có cấu trúc, ví dụ: COMMANDS_G34.BASIC-MOVEMENT.SIMPLE_APPLY.C2
            new_id = f"{category_code}.{topic_code}.{challenge_type}.C{level}"
            print(f"   ⚠️ Cảnh báo: ID bị thiếu ở dòng {index+2} trong Excel. Đã tự động tạo ID: '{new_id}'")

        # Tạo cấu trúc cho một map_request
        map_request = {
            "id": new_id, # Sử dụng ID mới được sinh tự động
            "level": int(row['level']),
            "grade": row.get('Grade', 'G00'), # [MỚI] Đọc cột Grade, mặc định là G00 nếu không có
            "titleKey": f"Challenge.{new_id}.Title",
            "descriptionKey": f"Challenge.{new_id}.Description",
            # [CẬP NHẬT] Thêm các trường đã được xử lý từ các bước trước
            "challenge_type": row.get('challenge_type', 'N/A'),
            "difficulty_code": row.get('difficulty_code', 'N/A'),
            "core_skills": [s.strip() for s in row.get('core_skill_codes', '').split(',') if s.strip()],
            "difficulty_intrinsic": row.get('difficulty_intrinsic', 'Medium'),
            "difficulty_perceived_score": row.get('difficulty_perceived_score', 5),
            "difficulty_perceived_label": row.get('difficulty_perceived_label', 'Medium'),
            # [FIX] Bổ sung đầy đủ các trường metadata còn thiếu từ Excel
            "subject_codes": row.get('subject_codes', ''),
            "category_codes": row.get('category_codes', ''),
            "topic_codes": row.get('topic_codes', ''),
            "bloom_level_codes": row.get('bloom_level_codes', ''),
            "exam_type_code": row.get('exam_type_code', ''),
            "course_codes": row.get('course_codes') or 'CODING',
            "context_codes": row.get('context_codes', ''),
            "knowledge_dimension_codes": row.get('knowledge_dimension_codes', ''),
            "learning_objective_codes": row.get('learning_objective_codes', ''),

            "translations": {}, # Khởi tạo translations rỗng để điền sau
            "generation_config": {
                "map_type": row['gen_map_type'],
                "logic_type": row['gen_logic_type'],
                # [CẢI TIẾN] Cung cấp giá trị mặc định là 1 nếu ô trống
                "num_variants": int(row.get('gen_num_variants')) if row.get('gen_num_variants') else 1, # type: ignore
                "params": parse_params(row.get('gen_params', '')) # Sử dụng hàm parse_params đã nâng cấp
            },
            "blockly_config": {
                "toolbox_preset": row['blockly_toolbox_preset'],
            },
            "solution_config": {
                # [CẢI TIẾN] Cung cấp giá trị mặc định nếu cột không tồn tại
                "type": row.get('solution_type', 'reach_target'),
                "itemGoals": parse_params(row.get('solution_item_goals', ''))
            }
        }
        
        # --- [NÂNG CẤP] Tự động điền các bản dịch từ file Excel ---
        # Điền bản dịch Tiếng Việt
        if 'title_vi' in df.columns and row['title_vi']:
            map_request['translations']['vi'] = { # type: ignore
                f"Challenge.{new_id}.Title": row['title_vi'],
                f"Challenge.{new_id}.Description": row['description_vi']
            }
        
        # Điền bản dịch Tiếng Anh nếu có
        if 'title_en' in df.columns and row['title_en']:
            map_request['translations']['en'] = { # type: ignore
                f"Challenge.{new_id}.Title": row['title_en'],
                f"Challenge.{new_id}.Description": row['description_en']
            }

        # [CẢI TIẾN] Chỉ thêm các khối blockly khởi đầu nếu chúng thực sự được định nghĩa
        if row.get('blockly_start_block_type'):
             map_request["blockly_config"]["start_block_type"] = row.get('blockly_start_block_type')
        if row.get('blockly_start_blocks'):
             map_request["blockly_config"]["start_blocks"] = row.get('blockly_start_blocks')

        # Thêm map_request vào đúng nhóm category và topic
        category_code = row['category_codes']
        topic_codes = row['topic_codes']
        challenges_by_category[category_code][topic_codes]['topic_name'] = row['topic_name']
        challenges_by_category[category_code][topic_codes]['challenges'].append(map_request)

    # [CẬP NHẬT] Ghi ra một file JSON duy nhất cho toàn bộ tệp Excel nguồn này
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        print(f"📁 Đã tạo thư mục output cho RUN_ID: {output_dir}")

    all_categories_list = []
    for category_code, topics_data in challenges_by_category.items():
        topics_list = []
        for topic_codes, data in topics_data.items():
            data['challenges'].sort(key=lambda x: x['level'])
            topics_list.append({
                "topic_codes": topic_codes,
                "topic_name": data['topic_name'],
                "challenges": data['challenges']
            })
        topics_list.sort(key=lambda x: x['topic_codes'])
        all_categories_list.append({
            "category_code": category_code,
            "topics": topics_list
        })
    all_categories_list.sort(key=lambda x: x['category_code'])
    final_json = {"curriculum_source": source_file_base_name, "categories": all_categories_list}

    filename = f"{source_file_base_name}.json"
    output_path = os.path.join(output_dir, filename)

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(final_json, f, indent=2, ensure_ascii=False)
    print(f"✅ Đã tạo/cập nhật file curriculum tổng hợp: {filename}")

    print("\n=============================================")
    print("=== HOÀN THÀNH SINH CURRICULUM ===")
    print("=============================================")

if __name__ == "__main__":
    from datetime import datetime
    import glob
    source_dir_for_test = os.path.join(PROJECT_ROOT, 'data', '0_source')
    test_files = glob.glob(os.path.join(source_dir_for_test, "curriculum_source_*.xlsx"))
    if test_files:
        test_base_name = os.path.splitext(os.path.basename(test_files[0]))[0]
        run_id_prefix = test_base_name.replace("curriculum_source_", "")
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_test")
        test_run_id = f"{run_id_prefix}_{timestamp}"
        # main(test_run_id, test_base_name)
        print("Bỏ qua test độc lập cho generate_curriculum.py vì nó phụ thuộc vào các bước trước.")
    else:
        print("Không tìm thấy file curriculum_source_*.xlsx nào trong 'data/0_source' để chạy test.")