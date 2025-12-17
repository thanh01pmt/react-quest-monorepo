# scripts/assign_difficulty.py
# -*- coding: utf-8 -*-
"""
--- MÔ TẢ TÍNH NĂNG ---
Script này có chức năng gán độ khó cho từng thử thách trong file curriculum đã qua xử lý.
Nó áp dụng một hệ thống hai tầng độ khó:
1. Độ khó Nội tại (Intrinsic Difficulty): Dựa trên các đặc tính của map như cấu trúc, logic, số lượng vật phẩm...
2. Độ khó Cảm nhận (Perceived Difficulty): Dựa trên ngữ cảnh mà học sinh làm bài (ví dụ: bài luyện tập đầu tiên sẽ khó hơn bài ôn tập).

Script này là một phần của pipeline chính và được gọi sau khi `process_curriculum.py` chạy xong.

--- CÁCH CHẠY ---
Script này thường được gọi tự động bởi `main.py`. Để chạy độc lập cho mục đích thử nghiệm:

cd /path/to/your/GenMap/project
python3 scripts/assign_difficulty.py

(Lưu ý: Cần có file `..._processed.xlsx` trong thư mục `data/1_processed` để script có thể chạy)
"""

import pandas as pd
import os
import json
from datetime import datetime
from typing import Dict, Any

# ==============================================================================
# CẤU HÌNH ĐƯỜNG DẪN
# ==============================================================================
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(PROJECT_ROOT, 'data')
PROCESSED_DATA_DIR = os.path.join(DATA_DIR, '1_processed')
# Tên file input và output sẽ được tạo động trong hàm main

# ==============================================================================
# 1. ĐỊNH NGHĨA CẤU TRÚC MAP – TÍNH "QUY MÔ" CỦA BẢN ĐỒ
#    (Dùng để đo độ phức tạp hình học – rất quan trọng cho độ khó)
# ==============================================================================
# ==============================================================================
# MAP_STRUCTURE_DEFINITIONS – PHIÊN BẢN HOÀN CHỈNH 100% (19/11/2025)
# ==============================================================================
MAP_STRUCTURE_DEFINITIONS = {
    # ========== CƠ BẢN ==========
    "straight_line":        {"scale_metric": lambda p: int(p.get("path_length", 5))},
    "simple_path":          {"scale_metric": lambda p: int(p.get("path_length", 5)) + int(p.get("turn_count", 0)) * 2},
    "staircase":            {"scale_metric": lambda p: int(p.get("step_count", 5)) * int(p.get("step_height", 1))},
    "l_shape":              {"scale_metric": lambda p: int(p.get("leg1_length", 5)) + int(p.get("leg2_length", 5))},
    "u_shape":              {"scale_metric": lambda p: int(p.get("side_legs_length", 5)) * 2 + int(p.get("base_leg_length", 5))},
    "s_shape":              {"scale_metric": lambda p: sum(int(p.get(k, 5)) for k in ["leg1_length", "leg2_length", "leg3_length"] if k in p)},
    "z_shape":              {"scale_metric": lambda p: sum(int(p.get(k, 5)) for k in ["leg1_length", "leg2_length", "leg3_length"] if k in p)},
    "square_shape":         {"scale_metric": lambda p: int(p.get("side_length", 6)) * 4},
    "h_shape":              {"scale_metric": lambda p: int(p.get("horizontal_leg_length", 8)) + int(p.get("vertical_leg_height", 5)) * 2},
    "t_shape":              {"scale_metric": lambda p: int(p.get("stem_length", 6)) + int(p.get("crossbar_length", 8))},
    "plus_shape":           {"scale_metric": lambda p: int(p.get("arm_length", 5)) * 4 + int(p.get("center_size", 1))},
    "arrow_shape":          {"scale_metric": lambda p: int(p.get("shaft_length", 6)) + int(p.get("head_width", 3)) * 2},
    "ef_shape":             {"scale_metric": lambda p: int(p.get("backbone_length", 8)) + int(p.get("prong_count", 3)) * int(p.get("prong_length", 3))},
    "triangle":             {"scale_metric": lambda p: int(p.get("side_length", 8)) * 3},
    "zigzag":               {"scale_metric": lambda p: int(p.get("segment_count", 6)) * int(p.get("segment_length", 4))},

    # ========== LƯỚI & PHỨC TẠP ==========
    "plowing_field":        {"scale_metric": lambda p: int(p.get("rows", 5)) * int(p.get("cols", 5))},
    "grid":                 {"scale_metric": lambda p: int(p.get("grid_size", 6))**2},
    "grid_with_holes":      {"scale_metric": lambda p: int(p.get("grid_size", 6))**2 + int(p.get("hole_count", 3)) * 2},
    "complex_maze_2d":      {"scale_metric": lambda p: int(p.get("width", 10)) * int(p.get("height", 10))},

    # ========== 3D & ĐẢO ==========
    "spiral_path":          {"scale_metric": lambda p: int(p.get("turns", 5)) * 5},
    "spiral_3d":            {"scale_metric": lambda p: int(p.get("turns", 5)) * 8 + int(p.get("layers", 3)) * 5},
    "staircase_3d":         {"scale_metric": lambda p: int(p.get("layers", 4)) * int(p.get("steps_per_layer", 6))},
    "symmetrical_islands":  {"scale_metric": lambda p: int(p.get("island_count", 4)) * 8},
    "hub_with_stepped_islands": {"scale_metric": lambda p: int(p.get("hub_size", 4)) * 6 + int(p.get("island_count", 5)) * 5},
    "interspersed_path":    {"scale_metric": lambda p: int(p.get("main_path_length", 6)) + int(p.get("num_branches", 3)) * int(p.get("branch_length", 4))},

    # ========== MẶC ĐỊNH ==========
    "default":              {"scale_metric": lambda p: 10}  # trung bình
}

# ==============================================================================
# 2. HỆ SỐ NGỮ CẢNH – ĐỘ KHÓ CẢM NHẬN (Perceived Difficulty)
#    Đây là "bí kíp" để độ khó giảm dần khi học sinh đã quen kiến thức
# ==============================================================================
CONTEXT_MULTIPLIER = {
    "PRACTICE_TOPIC_1_4": 1.5,   # Topic đầu → khó hơn vì lần đầu học
    "PRACTICE_TOPIC_5_9": 1.0,   # Bình thường
    "REVIEW_MID_CHECKPOINT": 0.8,
    "REVIEW_END_CHECKPOINT": 0.65,
    "REVIEW_FULL_MASTERY":   0.6,
    "TRIAL_SCHOOL":          0.55,
    "TRIAL_NATIONAL":        0.5,
    "OFFICIAL_SCHOOL":       0.75,
    "OFFICIAL_NATIONAL":     1.0,   # Chung kết → khó thực sự
}

# Điểm số nội tại (intrinsic) – dùng để tính điểm cảm nhận
INTRINSIC_SCORE = {"Easy": 3, "Medium": 6, "Hard": 8, "Expert": 10}

# Chuyển điểm 1-10 → nhãn đẹp
LABEL_MAP = {
    1: "Very Easy", 2: "Very Easy", 3: "Easy", 4: "Easy",
    5: "Medium",    6: "Medium",    7: "Hard",  8: "Hard",
    9: "Very Hard", 10: "Legendary"
}

# ==============================================================================
# HÀM HỖ TRỢ
# ==============================================================================
def get_params_as_dict(params_str: Any) -> Dict[str, Any]:
    """Chuyển chuỗi gen_params thành dict (an toàn với NaN/empty)"""
    if not isinstance(params_str, str) or params_str.strip() == "":
        return {}
    params = {}
    try:
        for part in params_str.split(';'):
            if ':' in part:
                k, v = part.split(':', 1)
                params[k.strip()] = v.strip()
    except Exception:
        pass
    return params

# ==============================================================================
# HÀM CHÍNH: GÁN ĐỘ KHÓ NỘI TẠI (Intrinsic)
# ==============================================================================
def assign_intrinsic_difficulty(row) -> str:
    """Gán độ khó thực sự của bài (Easy/Medium/Hard/Expert)"""
    challenge_type = str(row.get("challenge_type", "") or "").upper()
    map_type = str(row.get("gen_map_type", "") or "").lower()
    params = get_params_as_dict(row.get("gen_params"))
    logic_type = str(row.get("gen_logic_type", "") or "").lower()
    toolbox = str(row.get("blockly_toolbox_preset", "") or "").lower()
    goals = str(row.get("solution_item_goals", "")).lower()

    # Tính quy mô bản đồ
    map_def = MAP_STRUCTURE_DEFINITIONS.get(map_type, MAP_STRUCTURE_DEFINITIONS["default"])
    scale = map_def["scale_metric"](params)

    # Đếm vật cản & mục tiêu
    obstacle_cnt = int(params.get("obstacle_count", 0))
    item_cnt = goals.count("crystal") + goals.count("switch")

    is_debug = "DEBUG" in challenge_type
    is_refactor = "REFACTOR" in challenge_type
    is_complex_apply = "COMPLEX_APPLY" in challenge_type
    is_simple_apply = challenge_type == "SIMPLE_APPLY"

    # === EXPERT ===
    if (is_refactor or
        map_type in ["complex_maze_2d", "spiral_3d", "hub_with_stepped_islands"] or
        scale >= 35 or
        (is_debug and scale >= 20) or
        (item_cnt >= 6 and scale >= 15)):
        return "Expert"

    # === HARD === (phải thỏa ≥2 điều kiện)
    hard_points = 0
    if map_type in ["plowing_field", "symmetrical_islands", "star_shape", "ef_shape", "zigzag", "plus_shape", "interspersed_path"]:
        hard_points += 1
    if scale >= 20: hard_points += 1
    if obstacle_cnt >= 3: hard_points += 1
    if item_cnt >= 4: hard_points += 1
    if is_complex_apply and scale >= 12: hard_points += 1
    if is_debug and scale >= 12: hard_points += 1
    if logic_type in ["nested_for_loop", "variable_loop", "algorithm_design", "math_complex"]:
        hard_points += 1
    if hard_points >= 2 or is_refactor:
        return "Hard"

    # === EASY === (phải thỏa ĐỦ tất cả)
    if (is_simple_apply and
        map_type in ["straight_line", "simple_path", "l_shape", "u_shape"] and
        scale <= 8 and
        obstacle_cnt == 0 and
        item_cnt <= 1 and
        "movement_only" in toolbox and
        not is_debug):
        return "Easy"

    # === MEDIUM (còn lại) ===
    return "Medium"

# ==============================================================================
# HÀM TÍNH ĐỘ KHÓ CẢM NHẬN (Perceived) THEO NGỮ CẢNH
# ==============================================================================
def get_perceived_difficulty(row, intrinsic: str) -> tuple[int, str]:
    """Tính độ khó học sinh thực sự cảm nhận dựa trên ngữ cảnh (topic/exam_type)"""
    # Xác định ngữ cảnh hiện tại
    topic_codes = str(row.get("topic_codes", "") or "") # Giữ nguyên để xác định topic
    exam_type = str(row.get("exam_type_code", "") or "").upper() # [SỬA LỖI & CHUẨN HÓA] Sử dụng cột 'exam_type_code' đã được đổi tên

    if "REVIEW_FULL" in exam_type or "REVIEW_FULL" in topic_codes:
        context = "REVIEW_FULL_MASTERY"
    elif "REVIEW_END" in exam_type or "REVIEW_END" in topic_codes:
        context = "REVIEW_END_CHECKPOINT"
    elif "REVIEW_MID" in exam_type or "REVIEW_MID" in topic_codes:
        context = "REVIEW_MID_CHECKPOINT"
    elif "TRIAL_NATIONAL" in exam_type:
        context = "TRIAL_NATIONAL"
    elif "TRIAL_SCHOOL" in exam_type:
        context = "TRIAL_SCHOOL"
    elif "OFFICIAL_NATIONAL" in exam_type:
        context = "OFFICIAL_NATIONAL"
    elif "OFFICIAL_SCHOOL" in exam_type:
        context = "OFFICIAL_SCHOOL"
    elif any(x in topic_codes for x in ["TOPIC1", "TOPIC2", "TOPIC3", "TOPIC4"]):
        context = "PRACTICE_TOPIC_1_4"
    else:
        context = "PRACTICE_TOPIC_5_9"

    score = INTRINSIC_SCORE[intrinsic]
    multiplier = CONTEXT_MULTIPLIER.get(context, 1.0)
    perceived_score = max(1, min(10, round(score * multiplier)))
    label = LABEL_MAP.get(perceived_score, "Medium")
    return perceived_score, label

# ==============================================================================
# CHƯƠNG TRÌNH CHÍNH
# ==============================================================================
def main(run_id: str, source_file_base_name: str):
    """
    Hàm chính, điều phối việc đọc file curriculum đã xử lý,
    gán độ khó và lưu kết quả ra một file Excel mới.
    """
    print("=====================================================================")
    print("=== SCRIPT GÁN ĐỘ KHÓ NỘI TẠI & CẢM NHẬN CHO CHALLENGES ===")
    print("=====================================================================")
    print("Bắt đầu gán độ khó cho curriculum...")

    # Xây dựng đường dẫn file input và output dựa trên RUN_ID
    input_file = os.path.join(PROCESSED_DATA_DIR, f"{run_id}_{source_file_base_name}_processed.xlsx")
    output_file = os.path.join(PROCESSED_DATA_DIR, f"{run_id}_{source_file_base_name}_with_difficulty.xlsx")

    if not os.path.exists(input_file):
        print(f"❌ Lỗi: Không tìm thấy file input '{input_file}'.")
        print("   Hãy đảm bảo script 'process_curriculum.py' đã chạy thành công với cùng RUN_ID.")
        exit(1)

    df = pd.read_excel(input_file).fillna("")
    print(f"✅ Đọc thành công file: {os.path.basename(input_file)}")
    # Gán độ khó nội tại
    df["difficulty_intrinsic"] = df.apply(assign_intrinsic_difficulty, axis=1)

    # Gán độ khó cảm nhận (perceived)
    perceived = df.apply(lambda row: get_perceived_difficulty(row, row["difficulty_intrinsic"]), axis=1)
    df["difficulty_perceived_score"] = perceived.apply(lambda x: x[0])
    df["difficulty_perceived_label"] = perceived.apply(lambda x: x[1])

    # [FIX] Đảm bảo tất cả các cột metadata cần thiết đều tồn tại trước khi ghi file.
    # Nếu cột không có, tạo cột rỗng để các script sau không bị lỗi.
    required_cols = [
        'subject_codes', 'category_codes', 'topic_codes', 'bloom_level_codes',
        'exam_type_code', 'course_codes', 'context_codes', 'knowledge_dimension_codes',
        'learning_objective_codes', 'Grade'
    ]
    for col in required_cols:
        if col not in df.columns:
            df[col] = ""
            print(f"   - ⚠️  Cảnh báo: Cột '{col}' không tồn tại, đã tạo cột rỗng.")

    # Ghi file kết quả
    df.to_excel(output_file, index=False)
    print(f"\nHOÀN TẤT! File đã được lưu tại:\n{output_file}")
    print("\nCác cột mới được thêm:")
    print("   • difficulty_intrinsic        : Easy/Medium/Hard/Expert (độ khó thực)")
    print("   • difficulty_perceived_score  : 1-10")
    print("   • difficulty_perceived_label  : Very Easy → Legendary (độ khó học sinh cảm nhận)")

    # In thống kê nhanh
    print("\nThống kê độ khó nội tại:")
    print(df["difficulty_intrinsic"].value_counts().sort_index())
    print("\nThống kê độ khó cảm nhận:")
    print(df["difficulty_perceived_label"].value_counts().sort_index())

if __name__ == "__main__":
    # Tạo một RUN_ID giả để test
    import glob
    # Để test, chúng ta cần tạo một file input giả
    source_dir_for_test = os.path.join(PROJECT_ROOT, 'data', '0_source')
    test_files = glob.glob(os.path.join(source_dir_for_test, "curriculum_source_*.xlsx"))
    if test_files:
        test_base_name = os.path.splitext(os.path.basename(test_files[0]))[0]
        run_id_prefix = test_base_name.replace("curriculum_source_", "")
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_test")
        test_run_id = f"{run_id_prefix}_{timestamp}"
        # Giả định file processed đã tồn tại để test
        # main(test_run_id, test_base_name)
        print("Bỏ qua test độc lập cho assign_difficulty.py vì nó phụ thuộc vào output của process_curriculum.py")