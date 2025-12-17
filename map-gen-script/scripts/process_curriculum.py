# scripts/process_curriculum.py

# ==============================================================================
# PHẦN 1: THIẾT LẬP MÔI TRƯỜNG VÀ ĐƯỜNG DẪN
# Đặt ngay lên đầu file để đảm bảo Python có thể tìm thấy các module.
# ==============================================================================
import sys
import os

# Lấy đường dẫn tuyệt đối của thư mục chứa script này (ví dụ: /.../GenMap/scripts)
# __file__ là một biến đặc biệt trong Python, chứa đường dẫn đến file hiện tại.
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# Lấy đường dẫn thư mục gốc của dự án bằng cách đi lên một cấp từ SCRIPT_DIR
# (ví dụ: /.../GenMap)
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)

# Thêm thư mục gốc của dự án vào sys.path.
# Đây là bước quan trọng nhất để Python có thể hiểu các lệnh import
# dạng "from scripts.mappings import ...", vì nó sẽ bắt đầu tìm từ PROJECT_ROOT.
if PROJECT_ROOT not in sys.path:
    sys.path.append(PROJECT_ROOT)

# ==============================================================================
# PHẦN 2: IMPORT CÁC THƯ VIỆN VÀ MODULE CẦN THIẾT
# ==============================================================================
import pandas as pd
import json
import glob

# [THAY ĐỔI] Import hàm generate_core_skills từ file skill_mapper mới
from scripts.skill_mapper import generate_core_skills

# Định nghĩa đường dẫn đến các file input và output
DATA_DIR = os.path.join(PROJECT_ROOT, 'data')
PROCESSED_DATA_DIR = os.path.join(DATA_DIR, '1_processed')
GENERATED_CURRICULUM_DIR = os.path.join(DATA_DIR, '2_generated_curriculum')

# Tên file sẽ được tạo động trong hàm main()
# production_json_file không còn cần thiết trong script này nữa


# ==============================================================================
# PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN EXECUTION)
# ==============================================================================
def main(run_id: str, source_file_path: str, source_file_base_name: str):
    print("=============================================")
    print("=== BẮT ĐẦU QUY TRÌNH GẮN THẺ KỸ NĂNG ===")
    print("=============================================")

    try:
        # [CẬP NHẬT] Bước 1: Đọc trực tiếp từ file Excel được cung cấp.
        if os.path.exists(source_file_path):
            print(f"Đang đọc dữ liệu từ file Excel nguồn: '{os.path.basename(source_file_path)}'...")
            df_source = pd.read_excel(source_file_path).fillna('')
        else:
            # Logic dự phòng này có thể không cần thiết nữa khi main.py đã kiểm tra,
            # nhưng giữ lại để script có thể chạy độc lập an toàn.
            print(f"❌ Lỗi: Không tìm thấy file Excel nguồn được chỉ định '{source_file_path}'.")
            return

            if not os.path.isdir(GENERATED_CURRICULUM_DIR):
                print(f"❌ Lỗi: Thư mục '{GENERATED_CURRICULUM_DIR}' không tồn tại. Không có nguồn dữ liệu nào để xử lý.")
                return

            all_challenges = []
            json_files = [f for f in os.listdir(GENERATED_CURRICULUM_DIR) if f.endswith('.json')]
            if not json_files:
                print(f"❌ Lỗi: Không tìm thấy file JSON nào trong thư mục '{GENERATED_CURRICULUM_DIR}'.")
                return

            for filename in json_files:
                filepath = os.path.join(curriculum_dir, filename)
                with open(filepath, 'r', encoding='utf-8') as f:
                    category_data = json.load(f)
                for topic in category_data.get('topics', []):
                    topic_name = topic.get('topic_name')
                    # [SỬA LỖI] Lấy category_code từ cấp cao nhất của file JSON
                    category_code = category_data.get('category_code')
                    for challenge in topic.get('challenges', []):
                        # "Làm phẳng" cấu trúc JSON để giống với cấu trúc của file Excel
                        flat_challenge = challenge.copy()
                        flat_challenge['topic_codes'] = topic.get('topic_codes')
                        # Thêm các trường khác nếu cần để tương thích với hàm generate_skill_tags
                        # Ví dụ: trích xuất gen_map_type, item_goals...
                        flat_challenge['gen_map_type'] = challenge.get('generation_config', {}).get('map_type')
                        flat_challenge['gen_logic_type'] = challenge.get('generation_config', {}).get('logic_type') # [SỬA LỖI] Thêm dòng này
                        flat_challenge['blockly_toolbox_preset'] = challenge.get('blockly_config', {}).get('toolbox_preset') # [SỬA LỖI] Thêm dòng này
                        flat_challenge['topic_name'] = topic_name # Giữ nguyên
                        flat_challenge['category_codes'] = category_code # [SỬA LỖI] Đổi tên cột thành 'category_codes' (số nhiều)
                        all_challenges.append(flat_challenge)
            
            df_source = pd.DataFrame(all_challenges).fillna('')
            print(f"✅ Đã đọc thành công dữ liệu từ {len(json_files)} file JSON.")

        # [THAY ĐỔI] Bước 2: Áp dụng logic gán thẻ mới cho toàn bộ DataFrame
        # Không cần nhóm theo topic nữa vì logic đã được tập trung.
        print("\nBắt đầu xử lý và gán thẻ kỹ năng cho toàn bộ curriculum...")
        
        # Áp dụng hàm generate_core_skills từ skill_mapper.py cho từng dòng
        # và chuyển kết quả (list) thành chuỗi string, nối bằng ", "
        df_source['core_skill_codes'] = df_source.apply(
            lambda row: ", ".join(generate_core_skills(row)),
            axis=1
        )

        print("✅ Đã gán thẻ kỹ năng thành công.")

        # [THAY ĐỔI] Bước 3: Ghi kết quả
        # DataFrame cuối cùng chính là df_source đã được cập nhật
        if not df_source.empty:
            final_df = df_source

            # Đảm bảo thư mục processed tồn tại và tạo tên file output với RUN_ID
            if not os.path.exists(PROCESSED_DATA_DIR):
                os.makedirs(PROCESSED_DATA_DIR)
            
            processed_excel_file = os.path.join(PROCESSED_DATA_DIR, f"{run_id}_{source_file_base_name}_processed.xlsx")

            # Ghi kết quả ra file Excel mới
            print(f"Đang ghi kết quả ra file Excel đã xử lý '{processed_excel_file}'...")
            final_df.to_excel(processed_excel_file, index=False)
            
            print("\n=============================================")
            print("=== HOÀN TẤT ===")
            print(f"Đã tạo thành công file: '{os.path.basename(processed_excel_file)}' với RUN_ID: {run_id}")
            print("=============================================")
        else:
            print("Không có dữ liệu nào để xử lý.")

    except FileNotFoundError:
        print(f"❌ LỖI: Không tìm thấy file '{source_file_path}' và cũng không thể xử lý từ các nguồn khác.")
    except Exception as e:
        print(f"Đã xảy ra lỗi không xác định: {e}")

if __name__ == "__main__":
    # Giữ lại khối này để script vẫn có thể chạy độc lập
    # Tìm một file curriculum_source...xlsx bất kỳ để test
    test_run_id = datetime.now().strftime("%Y%m%d_%H%M%S_test")
    source_dir_for_test = os.path.join(PROJECT_ROOT, 'data', '0_source')
    test_files = glob.glob(os.path.join(source_dir_for_test, "curriculum_source_*.xlsx")) # type: ignore
    if test_files:
        test_file_path = test_files[0]
        test_base_name = os.path.splitext(os.path.basename(test_file_path))[0]
        print("--- CHẠY TEST ĐỘC LẬP ---")
        print(f"Sử dụng file: {os.path.basename(test_file_path)}")
        main(test_run_id, test_file_path, test_base_name)
        print("--- KẾT THÚC TEST ---")
    else:
        print("Không tìm thấy file curriculum_source_*.xlsx nào trong 'data/0_source' để chạy test.")