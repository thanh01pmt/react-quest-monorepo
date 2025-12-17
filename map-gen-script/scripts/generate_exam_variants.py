# scripts/generate_exam_variants.py

# --- MÔ TẢ TÍNH NĂNG ---
# Script này có chức năng tạo ra nhiều bộ đề thi (variants) từ một file "blueprint" (ma trận đề)
# và một ngân hàng câu hỏi (question_bank.xlsx).
#
# Chức năng chính:
# 1. Đọc file blueprint để biết cấu trúc của một đề thi (ví dụ: cần 5 câu dễ, 3 câu trung bình về vòng lặp).
# 2. Đọc ngân hàng câu hỏi đã được trích xuất (chứa thông tin về độ khó, chủ đề của từng câu).
# 3. Với mỗi câu trong blueprint, tìm các biến thể (ví dụ: ...-var1, ...-var2) trong ngân hàng câu hỏi.
# 4. Phân bổ các câu hỏi vào các bộ đề khác nhau để tạo ra các đề có độ khó tương đương.
# 5. Nếu thiếu biến thể, script sẽ tự động tìm một câu hỏi thay thế có độ khó và chủ đề tương tự.
# 6. Xuất kết quả ra các file Excel, mỗi file tương ứng với một blueprint đầu vào.
#
# --- CÁCH CHẠY ---
# Mở terminal, di chuyển vào thư mục gốc của dự án (GenMap) và chạy lệnh:
#
# python3 scripts/generate_exam_variants.py
#

import pandas as pd
import os
import glob
import copy
import re

def _extract_variant_number(question_code):
    """Helper to extract the numeric part of a variant, e.g., '...-var10' -> 10."""
    if not isinstance(question_code, str):
        return 0
    match = re.search(r'-var(\d+)$', question_code)
    if match:
        return int(match.group(1))
    return 0 # Return 0 for base questions or non-standard formats

def balance_exam_variants(output_data, df_questions):
    """
    [NEW] Balances the difficulty of exam variants by swapping questions.
    This function implements a greedy algorithm to minimize the total difficulty
    difference between the hardest and easiest exam variants.
    """
    print("  -> Bắt đầu thuật toán cân bằng độ khó các bộ đề...")
    df_output = pd.DataFrame(output_data)
    
    # Create a lookup for question details
    question_details_lookup = df_questions.set_index('question_codes').to_dict('index')

    # Group questions by variant
    variants = df_output.groupby('Variants Number').apply(lambda x: x.to_dict('records')).tolist()
    
    # Calculate initial total rawactionscount for each variant
    for variant in variants:
        total_difficulty = sum(question_details_lookup.get(q['Quest ID'], {}).get('rawactionscount', 0) for q in variant)
        # Store total difficulty in the first question of the variant for tracking
        if variant:
            variant[0]['total_difficulty'] = total_difficulty

    # Iteratively balance the variants
    for _ in range(len(variants) * 2): # Iterate a few times to allow swaps to propagate
        variants.sort(key=lambda v: v[0].get('total_difficulty', 0), reverse=True)
        
        hardest_variant = variants[0]
        easiest_variant = variants[-1]

        if hardest_variant[0]['Variants Number'] == easiest_variant[0]['Variants Number']:
            break # All variants have been balanced

        best_swap = None
        max_reduction = 0

        # Find the best pair of questions to swap between the hardest and easiest variants
        for i, q_hard in enumerate(hardest_variant):
            for j, q_easy in enumerate(easiest_variant):
                if q_hard['ID'] == q_easy['ID']: # Can only swap questions with the same base ID
                    diff_hard = question_details_lookup.get(q_hard['Quest ID'], {}).get('rawactionscount', 0)
                    diff_easy = question_details_lookup.get(q_easy['Quest ID'], {}).get('rawactionscount', 0)
                    reduction = diff_hard - diff_easy
                    if reduction > max_reduction:
                        max_reduction = reduction
                        best_swap = (i, j)

        if best_swap:
            i, j = best_swap
            # Perform the swap
            hardest_variant[i]['Quest ID'], easiest_variant[j]['Quest ID'] = easiest_variant[j]['Quest ID'], hardest_variant[i]['Quest ID']
            
            # Recalculate difficulties
            hardest_variant[0]['total_difficulty'] -= max_reduction
            easiest_variant[0]['total_difficulty'] += max_reduction
            print(f"    -> Cân bằng: Hoán đổi câu hỏi '{hardest_variant[i]['ID']}' giữa bộ đề {hardest_variant[0]['Variants Number']} và {easiest_variant[0]['Variants Number']}. Giảm chênh lệch: {max_reduction}")

    # Flatten the list of variants back into the output format
    balanced_output_data = []
    for variant in variants:
        for question in variant:
            # Re-fetch details for the swapped questions
            details = question_details_lookup.get(question['Quest ID'], {})
            question_copy = question.copy()
            question_copy.pop('total_difficulty', None) # Remove temporary key
            question_copy['optimal_blocks'] = details.get('optimalblocks', 0)
            question_copy['rawActionsCount'] = details.get('rawactionscount', 0)
            balanced_output_data.append(question_copy)
            
    return balanced_output_data

def generate_variants_for_blueprint(blueprint_path: str, df_questions: pd.DataFrame):
    """
    [HÀM MỚI] Tạo các biến thể đề thi cho một file blueprint cụ thể.
    :param blueprint_path: Đường dẫn đến file blueprint Excel.
    :param df_questions: DataFrame chứa toàn bộ ngân hàng câu hỏi.
    """
    blueprint_filename = os.path.basename(blueprint_path)
    print("\n" + "="*70)
    print(f"🚀 BẮT ĐẦU XỬ LÝ BLUEPRINT: {blueprint_filename}")
    print("="*70)

    # --- 1. Tải dữ liệu blueprint ---
    try:
        print(f"-> Đang đọc file blueprint: {blueprint_filename}")
        df_blueprints = pd.read_excel(blueprint_path)
        # [FIX] Chuẩn hóa tên cột để tránh lỗi KeyError
        df_blueprints.columns = df_blueprints.columns.str.strip().str.lower()
        print(f"✅ Tải dữ liệu blueprint thành công. Có {len(df_blueprints)} quy tắc trong file.")

    except FileNotFoundError as e:
        print(f"❌ Lỗi: Không tìm thấy file. Vui lòng kiểm tra lại đường dẫn: {e.filename}")
        return
    except Exception as e:
        print(f"❌ Lỗi không xác định khi tải dữ liệu: {e}")
        return

    # [UPDATE] Cột 'id' trong question_bank.xlsx đã là base_id, không cần tạo lại.
    # Đổi tên cột 'id' thành 'base_id' để logic bên dưới nhất quán.
    df_questions.rename(columns={'id': 'base_id'}, inplace=True)

    # [NEW] Chuẩn hóa cột 'grade' trong question_bank thành 'grade_code' để khớp với blueprint
    if 'grade' in df_questions.columns and 'grade_code' not in df_questions.columns:
        df_questions.rename(columns={'grade': 'grade_code'}, inplace=True)
    elif 'grade_code' not in df_questions.columns:
        print("❌ Lỗi: File 'question_bank.xlsx' phải chứa cột 'grade' hoặc 'grade_code'.")
        return
    # [REWRITTEN] Sắp xếp lại logic để đảm bảo thứ tự biến thể nhất quán.
    # [BIG UPDATE] Thay đổi logic sắp xếp để ưu tiên độ khó tăng dần.
    # 1. Sắp xếp các câu hỏi theo ID gốc (base_id).
    # 2. Trong mỗi nhóm ID gốc, sắp xếp các biến thể theo 'rawactionscount' tăng dần.
    # Điều này đảm bảo biến thể cho đề V1 luôn dễ hơn hoặc bằng V2, V3...
    df_questions_sorted = df_questions.sort_values(by=['base_id', 'rawactionscount']).reset_index(drop=True)
    
    # Nhóm tất cả các biến thể theo base_id
    variants_by_base_id = df_questions_sorted.groupby('base_id')['question_codes'].apply(list).to_dict()
    print("✅ Chuẩn hóa dữ liệu hoàn tất.")

    # --- 3. Xây dựng các biến thể đề thi ---
    print("-> Đang xây dựng các bộ đề thi...")
    output_data = []    
    # [REWRITTEN] Nhóm các quy tắc theo khối lớp (grade_code) để xử lý đồng bộ
    for grade_code, group in df_blueprints.groupby('grade_code'):
        print(f"  -> Đang xử lý cho khối lớp: {grade_code}")

        # Xác định số lượng biến thể lớn nhất cần tạo cho khối lớp này
        max_variants_for_grade = int(group['num_variants'].max())

        # [REWRITTEN] Cấu trúc mới để quản lý câu hỏi cho từng biến thể
        # Key: base_id từ blueprint, Value: list các quest_id đã chọn cho các variant
        questions_for_variants = {rule_id: [] for rule_id in group['id']}

        # Theo dõi các base_id đã được dùng trong blueprint để không chọn làm câu thay thế
        used_base_ids_in_grade = set(group['id'])

        # Lặp để tạo từng bộ đề (Variant 1, Variant 2, ...)
        for i in range(max_variants_for_grade):
            variant_number = i + 1
            print(f"    -> Đang tạo bộ đề số: {variant_number}")

            # [NEW] Theo dõi các quest_id đã được sử dụng CHỈ TRONG BỘ ĐỀ HIỆN TẠI
            # để tránh trùng lặp trong cùng một đề.
            used_quest_ids_in_current_variant = set()

            # Lặp qua từng câu hỏi (rule) trong khối lớp
            for index, rule in group.iterrows():
                base_id = rule['id']
                num_variants_needed_for_this_q = int(rule.get('num_variants', 1))

                # Nếu bộ đề hiện tại vượt quá số biến thể yêu cầu cho câu hỏi này, bỏ qua
                if variant_number > num_variants_needed_for_this_q:
                    continue

                available_variants = variants_by_base_id.get(base_id, [])
                selected_quest_id = None

                # [REWRITTEN] Logic chọn câu hỏi và xử lý thay thế
                if i < len(available_variants):
                    # Trường hợp lý tưởng: có đủ biến thể, chọn theo thứ tự
                    selected_quest_id = available_variants[i]
                    questions_for_variants[base_id].append(selected_quest_id)
                else:
                    # Trường hợp thiếu biến thể: Tìm câu hỏi thay thế
                    print(f"      ⚠️ Cảnh báo cho ID {base_id}: Cần {num_variants_needed_for_this_q} biến thể nhưng chỉ có {len(available_variants)}. Tìm câu hỏi thay thế...")
                    
                    # Lấy thông tin của câu hỏi gốc để tìm câu tương đương
                    # Lấy thông tin từ biến thể cuối cùng có sẵn
                    last_available_variant_id = available_variants[-1]
                    original_question_info = df_questions[df_questions['question_codes'] == last_available_variant_id].iloc[0]
                    target_raw_actions = original_question_info.get('rawactionscount', 0)
                    # [ĐỀ XUẤT] Cho phép sai số 10% khi tìm câu thay thế
                    action_tolerance = target_raw_actions * 0.1
                    min_actions = target_raw_actions - action_tolerance # type: ignore
                    max_actions = target_raw_actions + action_tolerance

                    # [REWRITTEN] Logic tìm câu hỏi thay thế được làm chặt chẽ hơn
                    # - Không được có base_id nằm trong blueprint gốc
                    # - Không được có quest_id đã dùng trong bộ đề HIỆN TẠI
                    # - Không được có quest_id đã được chọn cho vị trí này ở các bộ đề TRƯỚC
                    previously_selected_for_this_slot = set(questions_for_variants[base_id])
                    replacement_pool = df_questions[
                        (df_questions['grade_code'] == grade_code) &
                        (df_questions['rawactionscount'].between(min_actions, max_actions)) &
                        (~df_questions['base_id'].isin(used_base_ids_in_grade)) &
                        (~df_questions['question_codes'].isin(used_quest_ids_in_current_variant | previously_selected_for_this_slot))
                    ]

                    if not replacement_pool.empty:
                        # Lấy một câu hỏi thay thế ngẫu nhiên
                        replacement_question = replacement_pool.sample(n=1).iloc[0]
                        selected_quest_id = replacement_question['question_codes']
                        # Đánh dấu base_id của câu hỏi thay thế là đã sử dụng để không chọn lại nó cho câu hỏi khác
                        # [CRITICAL FIX] Thêm base_id của câu hỏi thay thế vào bộ nhớ toàn cục của khối lớp.
                        used_base_ids_in_grade.add(replacement_question['base_id'])
                        print(f"        -> Đã tìm thấy câu thay thế: '{selected_quest_id}'")
                    else:
                        print(f"        -> ❌ Không tìm thấy câu hỏi nào phù hợp để thay thế. Bỏ qua câu hỏi này cho bộ đề số {variant_number}.")

                if not selected_quest_id:
                    continue

                # Lấy thông tin chi tiết của câu hỏi được chọn để thêm vào output
                question_details = df_questions[df_questions['question_codes'] == selected_quest_id].iloc[0]
                
                output_data.append({
                    'Grade': grade_code,
                    'Variants Number': variant_number,
                    'Quest number': index % len(group) + 1,
                    'ID': base_id, # Giữ lại tên cột ID trong output cho ngắn gọn
                    'Quest ID': selected_quest_id,
                    'optimal_blocks': question_details['optimalblocks'],
                    'rawActionsCount': question_details['rawactionscount']
                })
                # Đánh dấu quest_id này đã được sử dụng trong bộ đề hiện tại
                used_quest_ids_in_current_variant.add(selected_quest_id)

    # --- [NEW] 3.5. Cân bằng độ khó giữa các biến thể ---
    if output_data:
        output_data = balance_exam_variants(output_data, df_questions)

    if not output_data:
        print("❌ Không có dữ liệu nào được tạo. Vui lòng kiểm tra lại file input.")
        return

    # --- 4. Xuất ra file Excel ---
    print("-> Đang xuất kết quả ra file Excel...")
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    output_dir = os.path.join(project_root, 'data', '4_generated_variants')

    # [CẬP NHẬT] Tạo tên file output động
    output_basename = blueprint_filename.replace('exam_blueprints_', 'variants_')
    output_path = os.path.join(output_dir, output_basename)

    df_output = pd.DataFrame(output_data)

    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    try:
        df_output.to_excel(output_path, index=False)
        print(f"🎉 Hoàn tất! Đã xuất thành công {len(df_output)} dòng dữ liệu ra file: {output_basename}")
    except Exception as e:
        print(f"❌ Lỗi khi ghi file Excel: {e}")

def run():
    """
    Hàm điều phối chính: hiển thị menu, cho phép người dùng chọn file blueprint
    và sau đó gọi hàm xử lý cho từng file.
    """
    print("=====================================================================")
    print("=== SCRIPT TẠO BIẾN THỂ ĐỀ THI TỪ BLUEPRINT ===")
    print("=====================================================================")

    # --- 1. Cấu hình đường dẫn và Tải dữ liệu chung ---
    try:
        project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        source_dir = os.path.join(project_root, 'data', '0_source')
        data_questions_path = os.path.join(source_dir, 'question_bank.xlsx')

        print(f"-> Đang đọc ngân hàng câu hỏi: {data_questions_path}")
        df_questions = pd.read_excel(data_questions_path)
        df_questions.columns = df_questions.columns.str.strip().str.lower()
        print(f"✅ Tải ngân hàng câu hỏi thành công. Có {len(df_questions)} câu hỏi.")

        # Kiểm tra các cột cần thiết trong ngân hàng câu hỏi
        required_cols = ['question_codes', 'rawactionscount', 'id', 'optimalblocks']
        if not all(col in df_questions.columns for col in required_cols):
            missing = [col for col in required_cols if col not in df_questions.columns]
            print(f"❌ Lỗi: File 'question_bank.xlsx' thiếu các cột cần thiết: {', '.join(missing)}")
            return

    except FileNotFoundError as e:
        print(f"❌ Lỗi: Không tìm thấy file. Vui lòng kiểm tra lại đường dẫn: {e.filename}")
        return
    except Exception as e:
        print(f"❌ Lỗi không xác định khi tải dữ liệu: {e}")
        return

    # --- 2. Lựa chọn file blueprint để chạy ---
    all_blueprint_files = sorted(glob.glob(os.path.join(source_dir, "exam_blueprints_*.xlsx")))
    
    if not all_blueprint_files:
        print(f"⚠️ Không tìm thấy file blueprint nào (exam_blueprints_*.xlsx) trong thư mục '{source_dir}'.")
        return

    selected_files = []
    while True:
        print("\n" + "="*20 + " LỰA CHỌN BLUEPRINT " + "="*20)
        print("1. Chọn một hoặc nhiều file blueprint để xử lý")
        print("2. Xử lý TẤT CẢ các file blueprint")
        print("0. Thoát")
        print("="*61)
        
        choice = input(">> Vui lòng nhập lựa chọn của bạn: ").strip()
        if choice == '1':
            print("\n--- Danh sách file blueprint có sẵn ---")
            for i, f_path in enumerate(all_blueprint_files):
                print(f"  [{i+1}] {os.path.basename(f_path)}")
            
            selections = input(">> Chọn file theo số (cách nhau bởi dấu phẩy, ví dụ: 1,3): ").strip()
            try:
                indices = [int(i.strip()) - 1 for i in selections.split(',')]
                valid_selections = [all_blueprint_files[idx] for idx in indices if 0 <= idx < len(all_blueprint_files)]
                if valid_selections:
                    selected_files = valid_selections
                    break
                else:
                    print("❌ Lỗi: Lựa chọn không hợp lệ.")
            except (ValueError, IndexError):
                print("❌ Lỗi: Vui lòng chỉ nhập các số hợp lệ từ danh sách.")
        elif choice == '2':
            selected_files = all_blueprint_files
            break
        elif choice == '0':
            print("👋 Tạm biệt!")
            return
        else:
            print("❌ Lựa chọn không hợp lệ. Vui lòng chọn lại.")

    # --- 3. Chạy quy trình cho từng file đã chọn ---
    for blueprint_file_path in selected_files:
        generate_variants_for_blueprint(blueprint_file_path, df_questions.copy())

# Điểm bắt đầu thực thi script
if __name__ == "__main__":
    run()
