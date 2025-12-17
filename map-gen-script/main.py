# main.py

# --- MÔ TẢ TÍNH NĂNG ---
# Đây là script điều phối chính (orchestrator) của toàn bộ pipeline sinh map.
# Nó cung cấp một menu tương tác để người dùng có thể chọn file curriculum nguồn
# và chạy tuần tự các bước sau:
# 1. Process Curriculum: Gán thẻ kỹ năng (core_skills).
# 2. Assign Difficulty: Gán độ khó nội tại và độ khó cảm nhận.
# 3. Generate Curriculum: Chuyển đổi từ Excel sang cấu trúc JSON.
# 4. Generate All Maps: Sinh ra các file game level cuối cùng.
# 5. Generate Question Import: Tổng hợp các map đã sinh thành file import.
#
# Script cũng ghi lại log các file đã xử lý để tránh chạy lại.
#
# --- CÁCH CHẠY ---
# Chạy pipeline cho các file mới trong 'data/0_source':
# python3 main.py
#
# Chạy pipeline cho một file cụ thể (chế độ không tương tác):
# python3 main.py /path/to/your/curriculum_source_file.xlsx

# Import hàm main từ các script nghiệp vụ.
# Đổi tên để tránh nhầm lẫn với hàm 'main' của chính file này.
from scripts.generate_curriculum import main as generate_curriculum_main
from scripts.generate_all_maps import main as generate_all_maps_main
from scripts.assign_difficulty import main as assign_difficulty_main
from scripts.process_curriculum import main as process_curriculum_main
from scripts.generate_question_import import main as generate_question_import_main
from datetime import datetime
import os
import sys # [THÊM MỚI] Import sys để đọc tham số dòng lệnh
import json
import glob


def main():
    """
    Hàm chính của chương trình, đóng vai trò là điểm khởi chạy.
    Nó điều phối một chuỗi các tác vụ:
    1. Sinh file curriculum từ file Excel.
    2. Sinh các file game level cuối cùng từ curriculum.
    3. Tổng hợp file question-import.json.
    4. Cập nhật lại file Excel nguồn với dữ liệu đã sinh.
    """
    project_root = os.path.dirname(os.path.abspath(__file__))
    log_file_path = os.path.join(project_root, 'data', 'pipeline_log.json') # type: ignore
    source_dir = os.path.join(project_root, 'data', '0_source')

    unprocessed_files = [] # Khởi tạo danh sách file cần xử lý

    # --- [CẢI TIẾN] Logic linh hoạt để lấy danh sách file cần xử lý ---
    # Ưu tiên 1: Lấy đường dẫn từ tham số dòng lệnh (chế độ không tương tác)
    if len(sys.argv) > 1:
        input_path = sys.argv[1]
        if os.path.isdir(input_path):
            unprocessed_files = glob.glob(os.path.join(input_path, "curriculum_source_*.xlsx"))
            print(f"Chế độ không tương tác: Đang xử lý các file từ thư mục được chỉ định: {input_path}")
        elif os.path.isfile(input_path) and input_path.endswith('.xlsx'):
            unprocessed_files = [input_path]
            print(f"Chế độ không tương tác: Đang xử lý file được chỉ định: {os.path.basename(input_path)}")
        else:
            print(f"❌ Lỗi: Đường dẫn '{input_path}' không phải là file .xlsx hoặc thư mục hợp lệ.")
            return
    else:
        # Ưu tiên 2: Chế độ tương tác với menu lựa chọn
        while True:
            print("\n" + "="*25 + " MENU LỰA CHỌN " + "="*25)
            print("1. Chạy một file cụ thể (nhập đường dẫn)")
            print("2. Chọn file từ danh sách trong 'data/0_source'")
            print("3. Chạy tất cả các file MỚI trong 'data/0_source' (dựa vào log)")
            print("4. Chạy TẤT CẢ file trong 'data/0_source' (bỏ qua log)")
            print("0. Thoát")
            print("="*67)
            choice = input(">> Vui lòng nhập lựa chọn của bạn: ").strip()

            if choice == '1':
                path = input(">> Nhập đường dẫn đến file .xlsx: ").strip()
                if os.path.isfile(path) and path.endswith('.xlsx'):
                    unprocessed_files = [path]
                    break
                else:
                    print(f"❌ Lỗi: Đường dẫn '{path}' không hợp lệ hoặc không phải file .xlsx.")
            
            elif choice == '2':
                all_source_files = sorted(glob.glob(os.path.join(source_dir, "curriculum_source_*.xlsx")))
                if not all_source_files:
                    print("⚠️ Không tìm thấy file nào trong 'data/0_source'.")
                    continue
                print("\n--- Danh sách file trong 'data/0_source' ---")
                for i, f_path in enumerate(all_source_files):
                    print(f"  [{i+1}] {os.path.basename(f_path)}")
                
                selections = input(">> Chọn file theo số (có thể chọn nhiều, cách nhau bởi dấu phẩy, ví dụ: 1,3): ").strip()
                try:
                    indices = [int(i.strip()) - 1 for i in selections.split(',')]
                    selected_files = []
                    valid = True
                    for idx in indices:
                        if 0 <= idx < len(all_source_files):
                            selected_files.append(all_source_files[idx])
                        else:
                            print(f"❌ Lỗi: Số thứ tự '{idx+1}' không hợp lệ.")
                            valid = False
                    if valid and selected_files:
                        # [FIX] Đọc log để lọc ra các file đã được xử lý
                        processed_files_basenames = set()
                        if os.path.exists(log_file_path):
                            with open(log_file_path, 'r', encoding='utf-8') as f:
                                try:
                                    logs = json.load(f)
                                    processed_files_basenames = {log['source_file'] for log in logs}
                                except json.JSONDecodeError:
                                    print(f"⚠️ Cảnh báo: File log '{log_file_path}' bị lỗi hoặc trống.")
                        
                        final_files_to_process = []
                        for f_path in selected_files:
                            f_basename = os.path.basename(f_path)
                            if f_basename in processed_files_basenames:
                                print(f"ℹ️  Bỏ qua file '{f_basename}' vì đã được xử lý trước đó (có trong log).")
                            else:
                                final_files_to_process.append(f_path)
                        
                        unprocessed_files = final_files_to_process
                        break # Thoát khỏi vòng lặp while sau khi đã có danh sách file
                except ValueError:
                    print("❌ Lỗi: Vui lòng chỉ nhập số.")

            elif choice == '3':
                processed_files = set()
                if os.path.exists(log_file_path):
                    with open(log_file_path, 'r', encoding='utf-8') as f:
                        try:
                            logs = json.load(f)
                            processed_files = {log['source_file'] for log in logs}
                        except json.JSONDecodeError:
                            print(f"⚠️ Cảnh báo: File log '{log_file_path}' bị lỗi hoặc trống.")
                all_source_files = glob.glob(os.path.join(source_dir, "curriculum_source_*.xlsx"))
                unprocessed_files = [f for f in all_source_files if os.path.basename(f) not in processed_files]
                break

            elif choice == '4':
                unprocessed_files = glob.glob(os.path.join(source_dir, "curriculum_source_*.xlsx"))
                print("ℹ️  Sẽ chạy lại tất cả các file, bỏ qua log đã xử lý.")
                break

            elif choice == '0':
                print("👋 Tạm biệt!")
                return
            
            else:
                print("❌ Lựa chọn không hợp lệ. Vui lòng chọn từ 0 đến 4.")

    if not unprocessed_files:
        print("✅ Không có file curriculum nguồn mới nào để xử lý. Pipeline kết thúc.")
        return

    print("\n" + "="*70)
    print(f"🔍 Sẵn sàng xử lý {len(unprocessed_files)} file sau:")
    for f_path in unprocessed_files:
        print(f"  - {os.path.basename(f_path)}")
    print("="*70)

    # --- [MỚI] Vòng lặp xử lý từng file ---
    for source_file_path in unprocessed_files:
        source_filename = os.path.basename(source_file_path)
        # [MỚI] Trích xuất tên file gốc không có phần mở rộng, ví dụ: "curriculum_source_commands_l6_comprehensive_01"
        source_file_base_name = os.path.splitext(source_filename)[0]
        # [CẢI TIẾN] Tạo tiền tố cho run_id bằng cách loại bỏ "curriculum_source_"
        run_id_prefix = source_file_base_name.replace("curriculum_source_", "")

        try:
            # [CẢI TIẾN] Tạo một RUN_ID duy nhất với tiền tố từ tên file
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            run_id = f"{run_id_prefix}_{timestamp}"

            print("\n" + "="*70)
            print(f"🚀 BẮT ĐẦU XỬ LÝ FILE: {source_filename}")
            print(f"=== RUN_ID: {run_id} | BASE_NAME: {source_file_base_name} ===")
            print("="*70)
            
            # [CẬP NHẬT] Truyền source_file_path vào process_curriculum_main
            process_curriculum_main(run_id, source_file_path, source_file_base_name)
            
            print("\n" + "-"*50 + "\n")
            assign_difficulty_main(run_id, source_file_base_name)

            print("\n" + "-"*50 + "\n")
            generate_curriculum_main(run_id, source_file_base_name)
            
            print("\n" + "-"*50 + "\n")
            generate_all_maps_main(run_id, source_file_base_name)

            print("\n" + "-"*50 + "\n")
            generate_question_import_main(run_id, source_file_base_name)

            # --- [MỚI] Ghi log sau khi hoàn tất thành công ---
            new_log_entry = {
                "source_file": source_filename,
                "run_id": run_id,
                "processed_at": datetime.now().isoformat()
            }
            
            existing_logs = []
            if os.path.exists(log_file_path):
                with open(log_file_path, 'r', encoding='utf-8') as f:
                    try:
                        existing_logs = json.load(f)
                    except json.JSONDecodeError:
                        pass # Bỏ qua nếu file trống hoặc lỗi
            
            existing_logs.append(new_log_entry)

            with open(log_file_path, 'w', encoding='utf-8') as f:
                json.dump(existing_logs, f, indent=2, ensure_ascii=False)

            print("\n" + "="*70)
            print(f"✅ HOÀN TẤT xử lý file: {source_filename}")
            print(f"✅ Đã ghi log thành công vào '{os.path.basename(log_file_path)}'")
            print("="*70)

        except Exception as e:
            import traceback
            print("\n" + "!"*70)
            print(f"❌ GẶP LỖI NGHIÊM TRỌNG khi xử lý file: {source_filename}")
            print(f"   Lỗi: {e}")
            print(traceback.format_exc())
            print(f"   File này sẽ KHÔNG được ghi vào log và sẽ được thử lại trong lần chạy tiếp theo.")
            print("!"*70)
            continue # Chuyển sang file tiếp theo


if __name__ == "__main__":
    # Dòng này đảm bảo rằng hàm main() chỉ được chạy khi file này
    # được thực thi trực tiếp, không phải khi nó được import bởi một file khác.
    main()