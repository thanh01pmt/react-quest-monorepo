# scripts/generate_exam_import_from_variants.py

# --- MÔ TẢ TÍNH NĂNG ---
# Script này có chức năng tạo ra một file JSON để import hàng loạt các "kỳ thi" (exams)
# vào hệ thống. Nó hoạt động dựa trên các file Excel chứa các bộ đề (variants) đã được
# tạo ra bởi `generate_exam_variants.py`.
#
# Chức năng chính:
# 1. Quét thư mục `data/4_generated_variants` để tìm các file Excel chứa bộ đề.
# 2. Cho phép người dùng chọn file để xử lý và nhập các thông tin chung cho kỳ thi
#    (tên, mô tả, thời gian làm bài, v.v.).
# 3. Với mỗi file Excel, script sẽ đọc và nhóm các câu hỏi theo từng bộ đề (ví dụ: Đề 1, Đề 2...).
# 4. Tạo một đối tượng JSON cho mỗi bộ đề, chứa danh sách mã câu hỏi và các cài đặt của kỳ thi.
# 5. Tổng hợp tất cả các đối tượng exam thành một file JSON duy nhất, sẵn sàng để import.
#
# --- CÁCH CHẠY ---
# python3 scripts/generate_exam_import_from_variants.py
import pandas as pd
import os
import glob
import json
import uuid
from datetime import datetime, timezone
import re

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def get_user_input(prompt, default=None):
    """Hàm tiện ích để lấy input từ người dùng với giá trị mặc định."""
    prompt_with_default = f"{prompt} (mặc định: {default}): " if default else f"{prompt}: "
    user_input = input(prompt_with_default).strip()
    return user_input if user_input else default

def get_choice_from_options(prompt: str, options: list, default_index: int = 0) -> str:
    """
    [HÀM MỚI] Hiển thị một menu các lựa chọn và trả về lựa chọn của người dùng.
    """
    print(f"\n{prompt}")
    for i, option in enumerate(options):
        default_marker = " (mặc định)" if i == default_index else ""
        print(f"  [{i+1}] {option}{default_marker}")
    
    while True:
        choice_str = input(">> Vui lòng nhập lựa chọn của bạn: ").strip()
        if not choice_str and 0 <= default_index < len(options):
            return options[default_index]
        try:
            choice_idx = int(choice_str) - 1
            if 0 <= choice_idx < len(options):
                return options[choice_idx]
        except ValueError:
            pass # Bỏ qua lỗi và yêu cầu nhập lại
        print(f"❌ Lựa chọn không hợp lệ. Vui lòng nhập một số từ 1 đến {len(options)}.")

def create_exam_from_variant_file(variant_path: str, common_settings: dict) -> list:
    """
    Tạo danh sách các đối tượng exam từ một file variant Excel duy nhất.
    """
    variant_filename = os.path.basename(variant_path)
    print("\n" + "="*70)
    print(f"🚀 BẮT ĐẦU XỬ LÝ FILE: {variant_filename}")
    print("="*70)

    try:
        df = pd.read_excel(variant_path)
    except Exception as e:
        print(f"❌ Lỗi khi đọc file Excel '{variant_filename}': {e}")
        return []

    # --- Trích xuất thông tin chung từ tên file ---
    # Ví dụ: variants_practice-commands01.xlsx -> practice-commands01
    base_name_match = re.search(r'variants_(.+)\.xlsx', variant_filename)
    if not base_name_match:
        print(f"⚠️  Tên file '{variant_filename}' không đúng định dạng. Bỏ qua.")
        return []
    base_name = base_name_match.group(1)

    # --- Nhóm các câu hỏi theo từng bộ đề (Variants Number) ---
    exams_data = []
    # [SỬA LỖI] Nhóm theo cả 'Variants Number' và 'Grade' để tạo đề cho từng khối
    grouped = df.groupby(['Variants Number', 'Grade'])

    for (variant_number, grade), group in grouped:
        print(f"  -> Đang xử lý bộ đề số: {variant_number} cho khối {grade}")

        # Sắp xếp câu hỏi theo thứ tự 'Quest number'
        group = group.sort_values(by='Quest number')
        question_codes = group['Quest ID'].tolist()

        # --- Tạo các trường dữ liệu cho exam ---
        exam_id = f"exam-{grade.lower()}-d{variant_number}-{uuid.uuid4().hex[:12]}"
        exam_code = f"{common_settings['exam_type_code']}_{base_name.upper()}_{grade}_D{variant_number}"
        exam_name = f"{common_settings['base_name']} ({grade} - Đề {variant_number})"
        exam_blueprint_code = f"BP_{base_name.upper()}"

        exam_obj = {
            "idx": 0, # Sẽ được cập nhật lại ở cuối
            "id": exam_id,
            "code": exam_code,
            "name": exam_name,
            "description": common_settings['description'],
            "question_codes": json.dumps(question_codes, ensure_ascii=False),
            "settings": json.dumps(common_settings['settings_dict'], ensure_ascii=False),
            "last_modified": datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
            "organization_code": "DEFAULT_ORG",
            "exam_blueprint_code": exam_blueprint_code,
            "exam_type_code": common_settings['exam_type_code'],
            "created_by": "TEKY ACADEMY"
        }
        exams_data.append(exam_obj)
        print(f"    ✅ Đã tạo dữ liệu cho: {exam_code}")

    return exams_data

def run():
    """
    Hàm điều phối chính: quét file, lấy thông tin từ người dùng và tạo file import.
    """
    print("=====================================================================")
    print("=== SCRIPT TẠO FILE EXAM IMPORT TỪ CÁC BỘ ĐỀ (VARIANTS) ===")
    print("=====================================================================")

    variants_dir = os.path.join(PROJECT_ROOT, 'data', '4_generated_variants')
    output_dir = os.path.join(PROJECT_ROOT, 'data', '6_import_files', 'exams')

    if not os.path.isdir(variants_dir):
        print(f"❌ Lỗi: Không tìm thấy thư mục input '{variants_dir}'.")
        return

    # --- 1. Lựa chọn file variant để chạy ---
    all_variant_files = sorted(glob.glob(os.path.join(variants_dir, "variants_*.xlsx")))

    if not all_variant_files:
        print(f"⚠️ Không tìm thấy file variant nào (variants_*.xlsx) trong thư mục '{variants_dir}'.")
        return

    selected_files = []
    while True:
        print("\n" + "="*20 + " LỰA CHỌN FILE VARIANT " + "="*20)
        print("1. Chọn một hoặc nhiều file để xử lý")
        print("2. Xử lý TẤT CẢ các file")
        print("0. Thoát")
        print("="*61)

        choice = input(">> Vui lòng nhập lựa chọn của bạn: ").strip()
        if choice == '1':
            print("\n--- Danh sách file variant có sẵn ---")
            for i, f_path in enumerate(all_variant_files):
                print(f"  [{i+1}] {os.path.basename(f_path)}")

            selections = input(">> Chọn file theo số (cách nhau bởi dấu phẩy, ví dụ: 1,3): ").strip()
            try:
                indices = [int(i.strip()) - 1 for i in selections.split(',')]
                valid_selections = [all_variant_files[idx] for idx in indices if 0 <= idx < len(all_variant_files)]
                if valid_selections:
                    selected_files = valid_selections
                    break
                else:
                    print("❌ Lỗi: Lựa chọn không hợp lệ.")
            except (ValueError, IndexError):
                print("❌ Lỗi: Vui lòng chỉ nhập các số hợp lệ từ danh sách.")
        elif choice == '2':
            selected_files = all_variant_files
            break
        elif choice == '0':
            print("👋 Tạm biệt!")
            return
        else:
            print("❌ Lựa chọn không hợp lệ. Vui lòng chọn lại.")

    # --- 2. Yêu cầu người dùng nhập thông tin chung ---
    print("\n" + "="*20 + " NHẬP THÔNG TIN KỲ THI " + "="*20)
    common_settings = {}
    common_settings['base_name'] = get_user_input("Nhập tên chung cho kỳ thi (ví dụ: Luyện tập Commands 01)")
    common_settings['description'] = get_user_input("Nhập mô tả cho kỳ thi")
    
    # [CẢI TIẾN] Sử dụng menu lựa chọn cho Loại kỳ thi
    exam_type_options = ['CHALLENGE', 'EXAM_PREP', 'FREE_EXPERIENCE', 'TRIAL', 'SCHOOL', 'NATIONAL']
    common_settings['exam_type_code'] = get_choice_from_options("Chọn loại kỳ thi", exam_type_options, default_index=0)
    
    print("\n--- Cài đặt chi tiết cho kỳ thi ---")
    
    # [CẢI TIẾN] Sử dụng menu lựa chọn cho các cài đặt boolean và tùy chọn
    shuffle_choice = get_choice_from_options("Xáo trộn câu hỏi?", ["True", "False"], default_index=0)
    show_answers_options = ["immediately", "after_submission", "never"]
    show_answers_choice = get_choice_from_options("Hiển thị đáp án đúng?", show_answers_options, default_index=0)

    settings_dict = {
        "language": get_user_input("Ngôn ngữ", "Vietnamese"),
        "shuffleQuestions": shuffle_choice == "True",
        "timeLimitMinutes": int(get_user_input("Thời gian làm bài (phút)", "45")),
        "showCorrectAnswers": show_answers_choice,
        "passingScorePercent": int(get_user_input("Điểm qua môn (%)", "80"))
    }
    common_settings['settings_dict'] = settings_dict

    if not all([common_settings['base_name'], common_settings['description'], common_settings['exam_type_code']]):
        print("\n❌ Lỗi: Tên, mô tả và loại kỳ thi không được để trống. Vui lòng chạy lại.")
        return

    # --- 3. Xử lý từng file và tạo dữ liệu exam ---
    all_exams_for_import = []
    for file_path in selected_files:
        exams_from_file = create_exam_from_variant_file(file_path, common_settings)
        all_exams_for_import.extend(exams_from_file)

    if not all_exams_for_import:
        print("\nℹ️ Không có dữ liệu exam nào được tạo. Kết thúc chương trình.")
        return

    # --- 4. Sắp xếp và ghi file JSON cuối cùng ---
    # Sắp xếp theo code để có thứ tự nhất quán
    all_exams_for_import.sort(key=lambda x: x['code'])

    # Gán lại chỉ số 'idx'
    for i, exam in enumerate(all_exams_for_import):
        exam['idx'] = i + 1

    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        print(f"\n📁 Đã tạo thư mục output: {output_dir}")

    try:
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        output_filename = f"exam-import_{timestamp}.json"
        output_json_file = os.path.join(output_dir, output_filename)

        with open(output_json_file, 'w', encoding='utf-8') as f:
            json.dump(all_exams_for_import, f, indent=2, ensure_ascii=False)

        print("\n" + "="*70)
        print(f"🎉 Hoàn tất! Đã tạo thành công file '{output_filename}' với {len(all_exams_for_import)} bộ đề.")
        print(f"   -> File được lưu tại: {output_dir}")
        print("="*70)

    except Exception as e:
        print(f"\n❌ Lỗi nghiêm trọng khi ghi file JSON cuối cùng: {e}")

if __name__ == "__main__":
    run()