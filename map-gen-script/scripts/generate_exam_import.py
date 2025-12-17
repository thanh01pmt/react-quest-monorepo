# scripts/generate_exam_import.py
# Version 3.0: Implemented 2-step filtering with required_skills and prioritized_skills.

# --- MÔ TẢ TÍNH NĂNG ---
# Script này có chức năng tạo ra một file JSON để import hàng loạt các "kỳ thi" (exams)
# vào hệ thống. Nó hoạt động dựa trên các quy tắc được định nghĩa trong file
# `data/ExamBlueprints.xlsx` và ngân hàng câu hỏi đã được tổng hợp.
#
# Chức năng chính:
# 1. Đọc file `ExamBlueprints.xlsx` để biết cấu trúc của các kỳ thi cần tạo.
# 2. Đọc ngân hàng câu hỏi từ `data/questions/questions-import.json`.
# 3. Với mỗi blueprint, nó sẽ lọc và chọn các câu hỏi từ ngân hàng dựa trên
#    các quy tắc (ví dụ: lấy 5 câu dễ về vòng lặp, 3 câu khó về hàm).
# 4. Tạo ra các biến thể đề thi (variants) nếu được yêu cầu trong blueprint.
# 5. Tổng hợp tất cả các bộ đề thành một file JSON duy nhất, sẵn sàng để import.
#
# --- CÁCH CHẠY ---
# python3 scripts/generate_exam_import.py
#
# Chạy với log chi tiết (hiển thị ID câu hỏi sau mỗi bước lọc):
# python3 scripts/generate_exam_import.py --verbose

import pandas as pd
import json
import os
import uuid
import random
from datetime import datetime, timezone
import re
import argparse # [THÊM MỚI] Thư viện để xử lý tham số dòng lệnh
import numpy as np
import traceback

# --- Cấu hình đường dẫn ---
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BLUEPRINTS_FILE = os.path.join(PROJECT_ROOT, 'data', 'ExamBlueprints.xlsx')
QUESTIONS_IMPORT_FILE = os.path.join(PROJECT_ROOT, 'data', 'questions', 'questions-import.json')
OUTPUT_DIR = os.path.join(PROJECT_ROOT, 'data', 'exams')
OUTPUT_JSON_FILE = os.path.join(OUTPUT_DIR, 'exam-import.json')

def extract_question_info(code_str):
    if not isinstance(code_str, str): return str(code_str), 1
    match = re.search(r'-var(\d+)$', code_str)
    if match: return code_str[:match.start()], int(match.group(1))
    return code_str, 1

def ensure_list_column(df, col_name):
    if col_name not in df.columns:
        df[col_name] = np.empty((len(df), 0)).tolist()
    else:
        df[col_name] = df[col_name].apply(lambda x: x if isinstance(x, list) else [])
    return df

def main(verbose=False): # [THAY ĐỔI] Thêm tham số verbose
    print("==========================================")
    print("=== BẮT ĐẦU QUY TRÌNH TẠO EXAM IMPORT ===")
    print("==========================================")

    try:
        # 1. LOAD DATA & NORMALIZE
        print(f"Loading Question Bank from: {QUESTIONS_IMPORT_FILE}")
        with open(QUESTIONS_IMPORT_FILE, 'r', encoding='utf-8') as f:
            questions_data = json.load(f)
        df_questions = pd.DataFrame(questions_data)
        df_questions.columns = df_questions.columns.str.strip()
        df_questions = df_questions.loc[:, ~df_questions.columns.duplicated()]

        LIST_FIELDS = ['core_skill_codes', 'exam_type_code', 'subject_codes', 'category_codes', 'topic_codes', 'bloom_level_codes', 'course_codes', 'context_codes', 'knowledge_dimension_codes', 'learning_objective_codes', 'grade_level_codes']
        STRING_FIELDS = ['question_type_code', 'difficulty_code', 'organization_code']

        print("-> Đang chuẩn hóa dữ liệu...")
        for col in LIST_FIELDS: ensure_list_column(df_questions, col)
        for col in STRING_FIELDS:
            if col not in df_questions.columns: df_questions[col] = ''
            else: df_questions[col] = df_questions[col].fillna('').astype(str)

        print("-> Đang tạo Base ID...")
        if 'code' not in df_questions.columns: raise ValueError("File JSON thiếu cột 'code'!")
        codes = df_questions['code'].astype(str).tolist()
        extracted = [extract_question_info(c) for c in codes]
        df_questions['base_id'] = [x[0] for x in extracted]
        df_questions['variant_num'] = [x[1] for x in extracted]

        print(f"✅ Đã xử lý {len(df_questions)} câu hỏi.")

        # 2. LOAD BLUEPRINTS
        print(f"Loading Blueprints from: {BLUEPRINTS_FILE}")
        df_blueprints = pd.read_excel(BLUEPRINTS_FILE, sheet_name='Blueprints').fillna('').astype(str)
        df_rules = pd.read_excel(BLUEPRINTS_FILE, sheet_name='Blueprint_Rules').fillna('').astype(str)
        df_rules.columns = [c.strip() for c in df_rules.columns]
        df_blueprints.columns = [c.strip() for c in df_blueprints.columns]

    except Exception as e:
        print(f"❌ Lỗi khởi tạo: {e}"); traceback.print_exc(); return

    all_generated_exams = []
    
    # 3. XỬ LÝ BLUEPRINTS
    for index, blueprint in df_blueprints.iterrows():
        blueprint_code = blueprint.get('exam_blueprint_code', '').strip()
        if not blueprint_code: continue
        print(f"\n--- Xử lý Blueprint: {blueprint_code} ---")
        
        try: variant_count = int(float(blueprint.get('num_variants', '1')))
        except: variant_count = 1
        
        grade_map = {'PRIMARY': ['G34'], 'SECONDARY': ['G58'], 'HIGH': ['G912']}
        grade_code = blueprint.get('grade_code', 'PRIMARY')
        target_grades = grade_map.get(grade_code, ['G34'])

        mask = df_questions['grade_level_codes'].apply(lambda x: any(g in target_grades for g in x))
        question_pool = df_questions[mask].copy()

        if question_pool.empty: print("⚠️ Cảnh báo: Không có câu hỏi nào khớp Grade."); continue

        rules_for_blueprint = df_rules[df_rules['exam_blueprint_code'] == blueprint_code]
        master_exam_questions = [] 
        used_base_ids_across_all_variants = set()

        # 4. TẠO VARIANTS
        for v in range(1, variant_count + 1):
            print(f"  -> Đang tạo biến thể _V{v}...")
            current_variant_codes = []
            current_variant_base_ids = set()
            
            if v == 1:
                # === TẠO ĐỀ GỐC (V1) ===
                for r_index, rule in rules_for_blueprint.iterrows():
                    pool = question_pool.copy()
                    print(f"     [Rule #{rule.get('rule_id', r_index+1)}] Bắt đầu với {len(pool)} câu hỏi.")

                    # --- Lọc theo các trường thông thường ---
                    rule_col_map = {'challenge_type': 'question_type_code', 'difficulty_code': 'difficulty_code', 'topic_codes': 'topic_codes', 'category_codes': 'category_codes', 'bloom_level_codes': 'bloom_level_codes', 'exam_type_code': 'exam_type_code'}
                    for rule_col, json_col in rule_col_map.items():
                        rule_val_str = rule.get(rule_col, '').strip()
                        if not rule_val_str or json_col not in pool.columns: continue
                        rule_values = {val.strip() for val in rule_val_str.split(',') if val.strip()}
                        pre_count = len(pool)
                        mask = pool[json_col].apply(lambda x: any(val in rule_values for val in x) if isinstance(x, list) else x in rule_values)
                        pool = pool[mask]
                        print(f"       -> Lọc theo '{rule_col}' ({rule_values}): {pre_count} -> {len(pool)} câu.")
                        # [THAY ĐỔI] Chỉ in ra danh sách ID câu hỏi nếu chế độ verbose được bật VÀ đang lọc theo 'exam_type_code'
                        if verbose and rule_col == 'exam_type_code' and not pool.empty:
                            print(f"         [IDs: {pool['code'].tolist()}]")

                    # --- LỌC 2 BƯỚC VỚI REQUIRED & PRIORITIZED SKILLS ---
                    required_skills_str = rule.get('required_skills', '').strip()
                    prioritized_skills_str = rule.get('prioritized_skills', '').strip()

                    # Bước 1: Lọc cứng với required_skills (AND logic)
                    if not pool.empty and required_skills_str:
                        required_skills = {skill.strip() for skill in required_skills_str.split(',') if skill.strip()}
                        pre_count = len(pool)
                        # Đảm bảo cột core_skill_codes tồn tại trước khi lọc
                        if 'core_skill_codes' in pool.columns:
                            # [SỬA LỖI THEO YÊU CẦU MỚI] Khôi phục logic AND (issubset).
                            # Một câu hỏi phải chứa TẤT CẢ các kỹ năng trong required_skills.
                            mask = pool['core_skill_codes'].apply(lambda q_skills: required_skills.issubset(set(q_skills)) if isinstance(q_skills, list) else False)
                            pool = pool[mask]
                            print(f"       -> Lọc theo 'required_skills' ({required_skills}): {pre_count} -> {len(pool)} câu.")
                            if verbose and not pool.empty:
                                print(f"         [IDs: {pool['code'].tolist()}]")
                        else:
                            print("       -> ⚠️ Cảnh báo: Cột 'core_skill_codes' không tồn tại để lọc.")
                            pool = pool.iloc[0:0] # Làm rỗng pool vì không thể đáp ứng yêu cầu
                    
                    # Lọc câu hỏi đã dùng trong các rule trước
                    if not pool.empty:
                        available_questions = pool[~pool['base_id'].isin(used_base_ids_across_all_variants)]
                    else:
                        available_questions = pd.DataFrame(columns=pool.columns)
                    
                    selected = pd.DataFrame()
                    try: count = int(float(rule.get('count', 0)))
                    except: count = 0

                    if not available_questions.empty and count > 0:
                        # [LOGIC MỚI] Sắp xếp ưu tiên dựa trên required_skills
                        # Ưu tiên các câu hỏi có bộ kỹ năng gần nhất với yêu cầu.
                        if required_skills_str:
                            required_skills = {skill.strip() for skill in required_skills_str.split(',') if skill.strip()}
                            # Tính "độ chênh lệch kỹ năng": số kỹ năng thừa so với yêu cầu
                            available_questions['skill_diff'] = available_questions['core_skill_codes'].apply(
                                lambda q_skills: len(set(q_skills)) - len(required_skills)
                            )
                            # Sắp xếp theo độ chênh lệch tăng dần (ít thừa hơn được ưu tiên)
                            available_questions = available_questions.sort_values(by='skill_diff', ascending=True)

                        # Bước 2: Chấm điểm và chọn với prioritized_skills (chỉ khi pool không rỗng)
                        if prioritized_skills_str and 'core_skill_codes' in available_questions.columns:
                            prioritized_skills = {skill.strip() for skill in prioritized_skills_str.split(',') if skill.strip()}
                            print(f"       -> Ưu tiên theo 'prioritized_skills' ({prioritized_skills})")

                            available_questions['match_score'] = available_questions['core_skill_codes'].apply(
                                lambda q_skills: len(prioritized_skills.intersection(set(q_skills))) if isinstance(q_skills, list) else 0
                            )
                            
                            max_score = available_questions['match_score'].max()
                            if max_score > 0:
                                best_matches = available_questions[available_questions['match_score'] == max_score]
                                if len(best_matches) >= count:
                                    selected = best_matches.sample(n=count, random_state=1) # Thêm random_state để kết quả nhất quán
                                else: # Lấy hết best_matches và lấy thêm từ phần còn lại
                                    selected = best_matches
                                    remaining_count = count - len(selected)
                                    other_matches = available_questions[available_questions['match_score'] < max_score]
                                    if len(other_matches) >= remaining_count:
                                        selected = pd.concat([selected, other_matches.sample(n=remaining_count, random_state=1)])
                            else: # Không có câu nào khớp, chọn ngẫu nhiên
                                selected = available_questions.sample(n=min(count, len(available_questions)))
                        else: # Không có skill ưu tiên, chọn ngẫu nhiên
                            selected = available_questions.sample(n=min(count, len(available_questions)))
                    
                    if selected.empty and count > 0 and not available_questions.empty:
                       print(f"     ⚠️ Rule #{rule.get('rule_id', r_index+1)}: Thiếu câu (Cần {count}, có {len(available_questions)}). Lấy hết.")
                       selected = available_questions.head(count)
                    
                    if selected.empty and count > 0:
                       print(f"     ❌ Rule #{rule.get('rule_id', r_index+1)}: Không tìm thấy câu hỏi nào phù hợp.")

                    if not selected.empty:
                        master_exam_questions.extend(selected.to_dict('records'))
                        current_variant_codes.extend(selected['code'].tolist())
                        new_base_ids = set(selected['base_id'])
                        current_variant_base_ids.update(new_base_ids)
                        used_base_ids_across_all_variants.update(new_base_ids)

            else:
                # === TẠO VARIANTS (V2+) ===
                for master_q in master_exam_questions:
                    master_base_id = master_q['base_id']
                    parallel = question_pool[(question_pool['base_id'] == master_base_id) & (question_pool['variant_num'] == v)]
                    if not parallel.empty:
                        current_variant_codes.append(parallel.iloc[0]['code'])
                    else: # Tìm câu thay thế
                        sub_pool = question_pool[
                            (question_pool['difficulty_code'] == master_q['difficulty_code']) &
                            (question_pool['question_type_code'] == master_q['question_type_code']) &
                            (~question_pool['base_id'].isin(used_base_ids_across_all_variants)) &
                            (~question_pool['base_id'].isin(current_variant_base_ids))]
                        if master_q['category_codes']:
                            sub_pool = sub_pool[sub_pool['category_codes'].apply(lambda x: any(c in x for c in master_q['category_codes']) if isinstance(x, list) else False)]
                        if not sub_pool.empty:
                            sub_item = sub_pool.sample(n=1).iloc[0]
                            current_variant_codes.append(sub_item['code'])
                            used_base_ids_across_all_variants.add(sub_item['base_id'])
                            current_variant_base_ids.add(sub_item['base_id'])
                        else: current_variant_codes.append(master_q['code'])

            # 5. EXPORT ITEM
            exam_data = {
                "idx": 1,
                "id": str(uuid.uuid4()),
                "code": f"{blueprint_code.replace('BP_', '')}_V{v}",
                "name": str(blueprint.get('name', 'Exam')).replace('Ma trận', 'Đề') + f" (Mã {v})",
                "description": blueprint.get('description', ''),
                "question_codes": json.dumps(current_variant_codes),
                "settings": json.dumps({
                    "language": "vi", "shuffleQuestions": str(blueprint.get('shuffle_questions', 'false')).lower() == 'true',
                    "timeLimitMinutes": int(float(blueprint.get('time_limit_minutes', 0) or 0)),
                    "passingScorePercent": int(float(blueprint.get('passing_score_percent', 70) or 70))
                }),
                "last_modified": datetime.now(timezone.utc).isoformat(),
                "organization_code": "DEFAULT_ORG", "exam_blueprint_code": blueprint_code,
                "exam_type_code": blueprint.get('exam_type_code', 'PRACTICE'), "created_by": "TEKY ACADEMY"
            }
            all_generated_exams.append(exam_data)
            print(f"  ✅ Hoàn tất: {exam_data['code']} ({len(current_variant_codes)} câu)")

    # 6. GHI FILE
    if not os.path.exists(OUTPUT_DIR): os.makedirs(OUTPUT_DIR)
    with open(OUTPUT_JSON_FILE, 'w', encoding='utf-8') as f:
        json.dump(all_generated_exams, f, indent=2, ensure_ascii=False)
    print(f"\n🎉 Xuất thành công {len(all_generated_exams)} đề thi ra '{OUTPUT_JSON_FILE}'.")

if __name__ == "__main__":
    # [THÊM MỚI] Xử lý tham số dòng lệnh
    parser = argparse.ArgumentParser(description="Tạo file import đề thi từ Blueprints.")
    parser.add_argument(
        '-v', '--verbose',
        action='store_true',
        help="In ra log chi tiết với danh sách ID câu hỏi sau mỗi bước lọc."
    )
    args = parser.parse_args()
    main(verbose=args.verbose)