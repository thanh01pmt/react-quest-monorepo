# scripts/generate_question_import.py

# --- MÔ TẢ TÍNH NĂNG ---
# Script này có chức năng tổng hợp tất cả các file game level JSON đã được tạo
# (trong thư mục `data/3_generated_levels/solvable`) thành một file JSON duy nhất.
#
# File JSON tổng hợp này có định dạng chuẩn để import hàng loạt câu hỏi (questions)
# vào hệ thống platform thi cử hoặc học tập. Nó kết hợp nội dung của từng file game
# với các metadata (dữ liệu mô tả) từ file curriculum Excel tương ứng.
#
# Script có hai chế độ chạy:
# 1. Chạy theo pipeline (với `run_id`): Chỉ xử lý các file của một lần chạy cụ thể.
# 2. Chạy độc lập: Quét tất cả các file trong thư mục `solvable` và cho phép người dùng
#    chọn `run_id` để xử lý.
#
# --- CÁCH CHẠY ---
# python3 scripts/generate_question_import.py
#
import pandas as pd
import json
import os
import uuid
import re
from datetime import datetime, timezone

# --- Cấu hình đường dẫn ---
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def parse_codes(code_string):
    """Chuyển đổi một chuỗi 'CODE1, CODE2' thành một list ['CODE1', 'CODE2']."""
    if not isinstance(code_string, str) or not code_string.strip():
        return []
    return [code.strip() for code in code_string.split(',')]

def find_file_recursively(directory, filename):
    """Tìm kiếm một file trong một thư mục và các thư mục con của nó."""
    for root, dirs, files in os.walk(directory):
        if filename in files:
            return os.path.join(root, filename)
    return None
def main(run_id: str = None, source_file_base_name: str = None):
    """
    Hàm chính để đọc các file game level đã tạo và file Excel,
    sau đó tổng hợp chúng thành một file JSON duy nhất để import.
    - Nếu có run_id: Chạy cho một lần pipeline cụ thể.
    - Nếu không có run_id: Chạy độc lập, quét tất cả các file đã tạo.
    """
    # --- Cấu hình đường dẫn động ---
    output_dir = os.path.join(PROJECT_ROOT, 'data', '6_import_files', 'questions')
    is_standalone_run = run_id is None
    game_level_filepaths = []

    if is_standalone_run:
        # Chế độ chạy độc lập
        print("======================================================")
        print("=== CHẠY ĐỘC LẬP: TỔNG HỢP TẤT CẢ QUESTION IMPORT ===")
        print("======================================================")
        
        solvable_dir = os.path.join(PROJECT_ROOT, 'data', '3_generated_levels', 'solvable')
        try:
            all_run_id_dirs = sorted([d for d in os.listdir(solvable_dir) if os.path.isdir(os.path.join(solvable_dir, d))])
        except FileNotFoundError:
            print(f"❌ Lỗi: Không tìm thấy thư mục '{solvable_dir}'.")
            return

        if not all_run_id_dirs:
            print(f"ℹ️  Không có thư mục `run_id` nào trong '{solvable_dir}' để xử lý.")
            return

        print("\n" + "="*20 + " LỰA CHỌN THƯ MỤC `RUN_ID` " + "="*20)
        print("1. Chọn một hoặc nhiều thư mục `run_id` để xử lý")
        print("2. Xử lý TẤT CẢ các thư mục `run_id`")
        print("0. Thoát")
        print("="*67)
        
        selected_dirs = []
        while True:
            choice = input(">> Vui lòng nhập lựa chọn của bạn: ").strip()
            if choice == '1':
                print("\n--- Danh sách thư mục `run_id` có sẵn ---")
                for i, dir_name in enumerate(all_run_id_dirs):
                    print(f"  [{i+1}] {dir_name}")
                selections = input(">> Chọn thư mục theo số (cách nhau bởi dấu phẩy, ví dụ: 1,3): ").strip()
                try:
                    indices = [int(i.strip()) - 1 for i in selections.split(',')]
                    valid_selections = [all_run_id_dirs[idx] for idx in indices if 0 <= idx < len(all_run_id_dirs)]
                    if valid_selections:
                        selected_dirs = valid_selections
                        break
                    else:
                        print("❌ Lỗi: Lựa chọn không hợp lệ.")
                except (ValueError, IndexError):
                    print("❌ Lỗi: Vui lòng chỉ nhập các số hợp lệ từ danh sách.")
            elif choice == '2':
                selected_dirs = all_run_id_dirs
                break
            elif choice == '0':
                print("👋 Tạm biệt!")
                return
            else:
                print("❌ Lựa chọn không hợp lệ. Vui lòng chọn lại.")

        # --- Cấu hình đường dẫn và tên file output dựa trên lựa chọn ---
        input_excel_file = None  # Không có file Excel cụ thể
        final_levels_dir = os.path.join(PROJECT_ROOT, 'data', '3_generated_levels', 'solvable')
        output_filename_base = f"questions-import_standalone_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    else:
        # Chế độ chạy theo pipeline
        print("======================================================")
        print("=== BẮT ĐẦU QUY TRÌNH TỔNG HỢP QUESTION IMPORT ===")
        print("======================================================")
        print(f"RUN_ID: {run_id}")
        input_excel_file = os.path.join(PROJECT_ROOT, 'data', '1_processed', f'{run_id}_{source_file_base_name}_with_difficulty.xlsx')
        final_levels_dir = os.path.join(PROJECT_ROOT, 'data', '3_generated_levels', 'solvable', run_id)
        output_filename_base = f"questions-import_{source_file_base_name}_{run_id}" # type: ignore

        # [REWRITTEN] Quét file trong thư mục của run_id hiện tại
        if os.path.exists(final_levels_dir):
            game_level_filepaths = [os.path.join(final_levels_dir, f) for f in os.listdir(final_levels_dir) if f.endswith('.json')]

    if is_standalone_run:
        # --- Tạo tên file output động ---
        if len(selected_dirs) == len(all_run_id_dirs):
            run_id_part = "all-runs"
        else:
            run_id_part = "-".join(selected_dirs)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        output_filename_base = f"questions-import_standalone_{run_id_part}_{timestamp}"


    # --- Đọc Metadata ---
    df = None
    metadata_lookup = {}
    use_excel_source = True

    try:
        # Đọc file Excel nguồn, điền các ô trống bằng chuỗi rỗng
        df = pd.read_excel(input_excel_file).fillna('')
        print(f"✅ Đọc thành công file metadata: {os.path.basename(input_excel_file)}")
        # [REWRITTEN] Chuyển đổi DataFrame thành một dictionary để tra cứu nhanh bằng ID gốc
        # Key: ID gốc (ví dụ: "T01.C01.Move.Apply.1"), Value: Dữ liệu của dòng đó (row)
        metadata_lookup = {row['id']: row for index, row in df.iterrows() if row.get('id')}
        print(f"✅ Đã tạo lookup table từ Excel với {len(metadata_lookup)} bản ghi metadata.")
    except FileNotFoundError:
        use_excel_source = False
        print(f"⚠️  Cảnh báo: Không tìm thấy file Excel '{os.path.basename(input_excel_file)}'.")
        print("   -> Chuyển sang chế độ trích xuất metadata trực tiếp từ file JSON map game.")
    except (ValueError, TypeError): # Xảy ra khi input_excel_file là None
        use_excel_source = False
        print("ℹ️  Chạy ở chế độ độc lập, không sử dụng file Excel.")
        print("   -> Metadata sẽ được trích xuất trực tiếp từ file JSON map game.")

    if is_standalone_run:
        # [REWRITTEN] Quét các thư mục đã chọn trong chế độ độc lập
        print(f"\n🔍 Bắt đầu quét {len(selected_dirs)} thư mục đã chọn...")
        for dir_name in selected_dirs:
            dir_path = os.path.join(solvable_dir, dir_name)
            print(f"   - Đang quét: '{dir_name}'")
            for file in os.listdir(dir_path):
                if file.endswith('.json'):
                    game_level_filepaths.append(os.path.join(dir_path, file))

    if not game_level_filepaths:
        print(f"❌ Lỗi: Không tìm thấy file game level nào trong '{final_levels_dir}'. Dừng chương trình.")
        return

    all_questions_for_import = []
    for game_level_filepath in sorted(game_level_filepaths): # Sắp xếp để có thứ tự nhất quán
        game_level_filename = os.path.basename(game_level_filepath)
        
        try:
            # Đọc nội dung của file JSON map game
            with open(game_level_filepath, 'r', encoding='utf-8') as f:
                question_config_content = json.load(f)

            variant_id = question_config_content.get('id', game_level_filename.replace('.json', ''))
            metadata_source = {}

            if use_excel_source:
                # [CẬP NHẬT LẦN CUỐI] Trích xuất ID gốc bằng cách loại bỏ hậu tố biến thể
                # Ví dụ: "G34.CODING_COMMANDS_BASIC-MOVEMENT.SIMPLE_APPLY.C1-var1" -> "G34.CODING_COMMANDS_BASIC-MOVEMENT.SIMPLE_APPLY.C1"
                base_id = re.sub(r'-var\d+$', '', variant_id)
                if base_id == variant_id: # Nếu không có gì thay đổi, tức là không có hậu tố -var
                    print(f"   - ⚠️ Cảnh báo: Không thể trích xuất ID gốc từ tên file '{game_level_filename}'. Bỏ qua.")
                    continue

                # Tìm metadata tương ứng trong lookup table
                row = metadata_lookup.get(base_id) 
                if row is None:
                    print(f"   - ⚠️ Cảnh báo: Không tìm thấy metadata trong Excel cho ID gốc '{base_id}' (từ file '{game_level_filename}'). Bỏ qua.")
                    continue
                metadata_source = row
            else:
                # Chế độ không dùng Excel: Lấy metadata trực tiếp từ file JSON map
                metadata_source = question_config_content
                # Chuẩn hóa một số trường để khớp với logic bên dưới
                metadata_source['challenge_type'] = question_config_content.get('challenge_type')
                metadata_source['Grade'] = question_config_content.get('grade')
                # Lấy description từ translations
                description_key = question_config_content.get('descriptionKey')
                description_vi = question_config_content.get('translations', {}).get('vi', {}).get(description_key, '')
                metadata_source['description_vi'] = description_vi
                # Chuyển đổi các trường list thành chuỗi để hàm parse_codes hoạt động
                for key in ['core_skill_codes', 'exam_type_code', 'subject_codes', 'category_codes', 'topic_codes', 'bloom_level_codes', 'course_codes', 'context_codes', 'knowledge_dimension_codes', 'learning_objective_codes']:
                    if key in metadata_source and isinstance(metadata_source[key], list):
                        metadata_source[key] = ", ".join(metadata_source[key])

            # Xây dựng đối tượng question hoàn chỉnh
            question_data = {
                "idx": 0,
                "id": str(uuid.uuid4()),  # Tạo UUID mới, duy nhất
                "code": variant_id,
                "text": metadata_source.get('description_vi', ''),
                "last_modified": datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
                "question_type_code": metadata_source.get('challenge_type', 'COMPLEX_APPLY'),
                "question_config": question_config_content,
                "difficulty_code": metadata_source.get('difficulty_code', 'MEDIUM'),
                "core_skill_codes": parse_codes(metadata_source.get('core_skill_codes', '')), # [THÊM MỚI]
                "exam_type_code": parse_codes(metadata_source.get('exam_type_code', '')), # [SỬA LỖI] Đổi tên cột thành 'exam_type_code' để khớp với Excel
                "organization_code": "DEFAULT_ORG",
                "subject_codes": parse_codes(metadata_source.get('subject_codes', '')),
                "category_codes": parse_codes(metadata_source.get('category_codes', '')), # Đảm bảo đọc đúng cột 'category_codes'
                # [SỬA LỖI] Giữ nguyên topic_codes gốc từ Excel, không lược bỏ tiền tố.
                # Điều này đảm bảo tính nhất quán với file Blueprint.
                "topic_codes": parse_codes(metadata_source.get('topic_codes', '')),
                "bloom_level_codes": parse_codes(metadata_source.get('bloom_level_codes', '')),
                "course_codes": parse_codes(metadata_source.get('course_codes') or 'CODING'),
                "context_codes": parse_codes(metadata_source.get('context_codes', '')),
                "knowledge_dimension_codes": parse_codes(metadata_source.get('knowledge_dimension_codes', '')),
                "learning_objective_codes": parse_codes(metadata_source.get('learning_objective_codes', '')),
                "grade_level_codes": parse_codes(metadata_source.get('Grade', ''))
            }

            all_questions_for_import.append(question_data)
            print(f"   ✅ Đã xử lý và tổng hợp question cho: {variant_id}")

        except json.JSONDecodeError:
            print(f"   - ❌ Lỗi: File map '{game_level_filename}' không phải là JSON hợp lệ. Bỏ qua.")
        except Exception as e:
            print(f"   - ❌ Lỗi không xác định khi xử lý file '{game_level_filename}': {e}")

    # Sắp xếp lại danh sách câu hỏi theo 'code' để kết quả nhất quán
    all_questions_for_import.sort(key=lambda q: q['code'])

    # Gán lại chỉ số 'idx' sau khi đã có danh sách cuối cùng
    for question in all_questions_for_import:
        question['idx'] = 0

    # Ghi kết quả cuối cùng ra file
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        print(f"📁 Đã tạo thư mục output: {output_dir}")

    try:
        output_filename = f"{output_filename_base}.json"
        output_json_file = os.path.join(output_dir, output_filename)

        with open(output_json_file, 'w', encoding='utf-8') as f:
            json.dump(all_questions_for_import, f, indent=2, ensure_ascii=False)
        
        print(f"\n🎉 Hoàn tất! Đã tạo thành công file '{output_filename}' với {len(all_questions_for_import)} questions tại thư mục '{output_dir}'.")
    except Exception as e:
        print(f"\n❌ Lỗi nghiêm trọng khi ghi file JSON cuối cùng: {e}")

    print("\n=============================================")
    print("=== KẾT THÚC QUY TRÌNH TỔNG HỢP ===")
    print("=============================================")

if __name__ == "__main__":
    # Tạo một RUN_ID giả để test
    # Khi chạy file này trực tiếp, các tham số run_id và source_file_base_name
    # sẽ là None, kích hoạt chế độ chạy độc lập.
    main()