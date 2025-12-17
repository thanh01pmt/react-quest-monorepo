# File: master_mapping_rules.py
# Version: 4.0 (Comprehensive for All 9 Topics)
# Description: Bộ não của hệ thống, chứa tất cả quy tắc để suy luận
# kỹ năng cốt lõi từ dữ liệu curriculum.

# ==============================================================================
# DANH MỤC MÃ KỸ NĂNG (GLOSSARY OF SKILL CODES)
# ==============================================================================
# Đây là danh sách tham chiếu tất cả các skill có thể có trong hệ thống.
ALL_SKILL_CODES = {
    # T1: Commands & Sequencing
    "CMD_EXECUTION_MOVE", "CMD_EXECUTION_TURN", "CMD_EXECUTION_JUMP",
    "CMD_EXECUTION_COLLECT", "CMD_EXECUTION_TOGGLE",
    "CMD_MOVE_FORWARD", "CMD_TURN", "CMD_JUMP",
    "INTERACT_COLLECT", "INTERACT_TOGGLE",
    "SEQ_PLANNING_SIMPLE", "SEQ_PLANNING_COMPLEX",
    "SPATIAL_ORIENTATION", "SPATIAL_TURN_LEFT", "SPATIAL_TURN_RIGHT",

    # T2: Functions (No Params)
    "FUNC_INTRO_DEFINE", "FUNC_INTRO_CALL",
    "FUNC_DEFINE_SIMPLE", "FUNC_CALL", "FUNC_REUSE", "FUNC_DECOMPOSE",
    "PATT_RECOGNITION", # Nhận diện mẫu để đóng gói vào hàm

    # T3: For Loops
    "LOOP_INTRO_FOR",
    "LOOP_FOR_BASIC", # Lặp lệnh đơn
    "LOOP_FOR_PATTERN", # Lặp một mẫu phức tạp (thường là một hàm)

    # T4: Variables & Math
    "VAR_INTRO",
    "VAR_DECLARE", "VAR_ASSIGN", "VAR_MODIFY", "VAR_READ",
    "MATH_INTRO",
    "MATH_BASIC_ARITHMETIC", # +, -
    "MATH_COUNTING", # Đếm vật phẩm

    # T5: Conditionals
    "COND_INTRO_IF",
    "COND_IF", "COND_IF_ELSE",
    "SENSE_PATH", "SENSE_ITEM", "SENSE_SWITCH", # Kỹ năng cảm biến
    "LOGIC_COMPARE", # so sánh <, >, ==

    # T6: Logical Operators
    "LOGIC_INTRO_OPS",
    "LOGIC_OP_AND", "LOGIC_OP_OR", "LOGIC_OP_NOT",

    # T7: While Loops
    "LOOP_INTRO_WHILE",
    "LOOP_WHILE", "LOOP_UNTIL_GOAL", # Dành cho block "repeat until goal"

    # T8: Algorithms
    "ALGO_MAZE_SOLVING", "ALGO_OPTIMIZATION", "ALGO_ANY",

    # T9: Parameters
    "FUNC_INTRO_PARAMS",
    "FUNC_WITH_PARAMS_DEFINE", "FUNC_WITH_PARAMS_CALL",

    # Debugging Skills (Áp dụng cho mọi topic)
    #"DEBUG_ANY", "DEBUG_LOGIC", 
    "DEBUG_SEQ_ORDER",
    "DEBUG_CMD_MISSING", "DEBUG_CMD_EXTRA", "DEBUG_CMD_INCORRECT"
}

MASTER_MAPPING_RULES = {
    # ==========================================================================
    # QUÉT VÙNG TEXT (title_vi/en, description_vi/en)
    # ==========================================================================
    "by_text_keywords": {
        # T1 - Keywords giới thiệu lệnh
        r"bước đi đầu tiên|first step": "CMD_EXECUTION_MOVE",
        r"nhảy đầu tiên|first jump": "CMD_EXECUTION_JUMP",
        r"rẽ trái đầu tiên|take the first left|rẽ phải đầu tiên|take the first right": "CMD_EXECUTION_TURN",
        r"làm quen.*rẽ|first turn": "CMD_EXECUTION_TURN",
        r"thu thập pha lê đầu tiên|collect the first crystal": "CMD_EXECUTION_COLLECT",
        r"bật công tắc đầu tiên|first toggle|turn on the first switch": "CMD_EXECUTION_TOGGLE",

        # T2 - Keywords giới thiệu hàm
        r"tạo hàm|create function": "FUNC_INTRO_DEFINE",
        r"gọi hàm|call function": "FUNC_INTRO_CALL",
        r"tái sử dụng|reuse": "FUNC_REUSE",

        # T3, T7 - Keywords giới thiệu vòng lặp
        r"lần lặp đầu tiên|first loop": "LOOP_INTRO_FOR",
        r"lặp lại cho đến khi|repeat until": "LOOP_INTRO_WHILE",

        # T4, T5, T6, T9 - Keywords giới thiệu khái niệm mới
        r"biến số|variable": "VAR_INTRO",
        r"phép toán|math operation": "MATH_INTRO",
        r"nếu...thì|if...then|điều kiện|condition": "COND_INTRO_IF",
        r"và/hoặc/không|and/or/not": "LOGIC_INTRO_OPS",
        r"tham số|parameter": "FUNC_INTRO_PARAMS",

        # Keywords chung
        r"rẽ trái|turn left": "SPATIAL_TURN_LEFT",
        r"rẽ phải|turn right": "SPATIAL_TURN_RIGHT",
        r"rẽ|turn": "CMD_TURN",
        r"nhảy|jump": "CMD_JUMP",
        r"thu thập|collect|crystal": "INTERACT_COLLECT",
        r"bật|toggle|switch": "INTERACT_TOGGLE",
        r"lặp lại|repeat": "LOOP_FOR_BASIC",
        r"trong khi|while": "LOOP_WHILE",
        r"so sánh|compare": "LOGIC_COMPARE",
        r"mê cung|maze": "ALGO_MAZE_SOLVING"
    },

    # ==========================================================================
    # QUÉT CHALLENGE_TYPE
    # ==========================================================================
    "by_challenge_type": {
        "SIMPLE_APPLY": "SEQ_PLANNING_SIMPLE",
        "COMPLEX_APPLY": "SEQ_PLANNING_COMPLEX",
        "DEBUG_FIX_SEQUENCE": "DEBUG_SEQ_ORDER",
        #"DEBUG_FIX_LOGIC": "DEBUG_LOGIC"
    },

    # ==========================================================================
    # QUÉT BLOCKLY_TOOLBOX_PRESET
    # ==========================================================================
    "by_toolbox_preset": {
        # Keywords trong tên preset ngụ ý kỹ năng
        "jump": "CMD_JUMP",
        "collect": "INTERACT_COLLECT",
        "switch": "INTERACT_TOGGLE",
        "functions": "FUNC_DEFINE_SIMPLE",
        "loops_l1": "LOOP_INTRO_FOR",
        "loops": "LOOP_FOR_BASIC",
        "variables": "VAR_ANY",
        "conditionals_l1": "COND_INTRO_IF",
        "conditionals": "COND_IF",
        "logic_ops": "LOGIC_OPS",
        "while_l1": "LOOP_INTRO_WHILE",
        "while": "LOOP_WHILE",
        "parameters": "FUNC_WITH_PARAMS_DEFINE"
    },

    # ==========================================================================
    # QUÉT GEN_MAP_TYPE (Đầy đủ)
    # ==========================================================================
    "by_map_type": {
        "simple_path": ["CMD_MOVE_FORWARD"], "straight_line": ["CMD_MOVE_FORWARD"],
        "staircase": ["CMD_MOVE_FORWARD", "CMD_JUMP", "PATT_STAIRCASE"],
        "square_shape": ["CMD_MOVE_FORWARD", "CMD_TURN", "SPATIAL_ORIENTATION", "PATT_RECOGNITION", "LOOP_FOR_PATTERN"],
        "l_shape": ["CMD_MOVE_FORWARD", "CMD_TURN", "SPATIAL_ORIENTATION"],
        "u_shape": ["CMD_MOVE_FORWARD", "CMD_TURN", "SPATIAL_ORIENTATION", "SEQ_PLANNING_COMPLEX"],
        "s_shape": ["CMD_MOVE_FORWARD", "CMD_TURN", "SPATIAL_ORIENTATION", "SEQ_PLANNING_COMPLEX"],
        "z_shape": ["CMD_MOVE_FORWARD", "CMD_TURN", "SPATIAL_ORIENTATION", "SEQ_PLANNING_COMPLEX"],
        "h_shape": ["CMD_MOVE_FORWARD", "CMD_TURN", "SPATIAL_ORIENTATION", "SEQ_PLANNING_COMPLEX"],
        "t_shape": ["CMD_MOVE_FORWARD", "CMD_TURN", "SPATIAL_ORIENTATION"], "v_shape": ["CMD_MOVE_FORWARD", "CMD_TURN", "SPATIAL_ORIENTATION"],
        "ef_shape": ["CMD_MOVE_FORWARD", "CMD_TURN", "SPATIAL_ORIENTATION", "SEQ_PLANNING_COMPLEX"],
        "plus_shape": ["CMD_MOVE_FORWARD", "CMD_TURN", "SPATIAL_ORIENTATION", "PATT_RECOGNITION"],
        "arrow_shape": ["CMD_MOVE_FORWARD", "CMD_TURN", "SPATIAL_ORIENTATION"],
        "star_shape": ["CMD_MOVE_FORWARD", "CMD_TURN", "SPATIAL_ORIENTATION", "PATT_RECOGNITION", "LOOP_FOR_PATTERN"],
        "triangle": ["CMD_MOVE_FORWARD", "CMD_TURN", "SPATIAL_ORIENTATION", "PATT_RECOGNITION"],
        "zigzag": ["CMD_MOVE_FORWARD", "CMD_TURN", "SPATIAL_ORIENTATION", "PATT_STAIRCASE"],
        "plowing_field": ["CMD_MOVE_FORWARD", "CMD_TURN", "NAV_GRID_TRAVERSAL", "LOOP_WHILE", "COND_IF"],
        "grid": ["CMD_MOVE_FORWARD", "CMD_TURN", "NAV_GRID_TRAVERSAL", "LOOP_WHILE", "COND_IF"],
        "grid_with_holes": ["NAV_GRID_TRAVERSAL", "CMD_TURN", "COND_IF"],
        "interspersed_path": ["CMD_MOVE_FORWARD", "CMD_TURN", "COND_IF", "SPATIAL_ORIENTATION"],
        "complex_maze_2d": ["CMD_MOVE_FORWARD", "CMD_TURN", "ALGO_MAZE_SOLVING"],
        "symmetrical_islands": ["CMD_MOVE_FORWARD", "SPATIAL_REASONING_3D", "PATT_RECOGNITION"],
        "spiral_path": ["CMD_MOVE_FORWARD", "CMD_TURN", "ALGO_SPIRAL_TRAVERSAL", "VAR_MODIFY"],
        "hub_with_stepped_islands": ["CMD_MOVE_FORWARD", "CMD_JUMP", "SPATIAL_REASONING_3D", "NAV_COMPLEX"],
        "swift_playground_maze": ["CMD_MOVE_FORWARD", "CMD_JUMP", "ALGO_MAZE_SOLVING"],
        "stepped_island_clusters": ["CMD_MOVE_FORWARD", "CMD_JUMP", "SPATIAL_REASONING_3D"],
        "plus_shape_islands": ["CMD_MOVE_FORWARD", "PATT_RECOGNITION"],
        "staircase_3d": ["CMD_JUMP", "SPATIAL_REASONING_3D", "PATT_STAIRCASE"],
        "spiral_3d": ["CMD_JUMP", "CMD_MOVE_FORWARD", "SPATIAL_REASONING_3D", "ALGO_SPIRAL_TRAVERSAL", "VAR_MODIFY"]
    },

    # ==========================================================================
    # QUÉT GEN_PARAMS
    # ==========================================================================
    "by_map_params": {
        "turn_direction": { "left": "SPATIAL_TURN_LEFT", "right": "SPATIAL_TURN_RIGHT" },
        "obstacle_count": { ">0": "CMD_JUMP" },
        "items_to_place": { "crystal": "INTERACT_COLLECT", "switch": "INTERACT_TOGGLE" },
        "path_length": { ">8": "SEQ_PLANNING_COMPLEX" },
        # --- QUY TẮC MỚI: DÀNH CHO VIỆC PHÂN LOẠI LỖI DEBUGGING ---
        "bug_type": {
            "missing_block": "DEBUG_CMD_MISSING",
            "extra_block": "DEBUG_CMD_EXTRA",
            "incorrect_block": "DEBUG_CMD_INCORRECT",
            "sequence_error": "DEBUG_SEQ_ORDER"
        }
    },

    # ==========================================================================
    # QUÉT SOLUTION_ITEM_GOALS
    # ==========================================================================
    "by_solution_goals": {
        "crystal": "INTERACT_COLLECT",
        "switch": "INTERACT_TOGGLE"
    }
}