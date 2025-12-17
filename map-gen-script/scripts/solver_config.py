# scripts/solver_config.py
"""
SOLVER CONFIGURATION - Centralized configuration for gameSolver.py

Tất cả các magic numbers và thresholds được tập trung ở đây để dễ dàng
điều chỉnh và maintain. Các script khác import config này để sử dụng.

Cách sử dụng:
    from scripts.solver_config import SOLVER_CONFIG
    
    goal_weight = SOLVER_CONFIG['heuristic']['goal_weight']
    if SOLVER_CONFIG['tsp']['enabled']:
        ...
"""

SOLVER_CONFIG = {
    # =========================================================================
    # HEURISTIC PARAMETERS - Các tham số cho hàm heuristic A*
    # =========================================================================
    'heuristic': {
        'type': 'max',              # 'max' (current) hoặc 'mst' (Minimum Spanning Tree)
        'goal_weight': 5,           # Penalty cho mỗi mục tiêu chưa hoàn thành
        'turn_cost': 0.1,           # Chi phí cho hành động quay (ưu tiên đi thẳng)
        'jump_cost': 1.5,           # [UPDATED] Chi phí cho jump (cao hơn moveForward để ưu tiên ít jump)
        'move_cost': 1.0,           # Chi phí cho hành động di chuyển
        'collect_cost': 0.0,        # Chi phí cho hành động thu thập (miễn phí)
        'toggle_cost': 0.0,         # Chi phí cho hành động bật switch (miễn phí)
        'height_penalty': 0.5,      # [NEW] Extra penalty cho mỗi block height difference
    },
    
    # =========================================================================
    # SEARCH LIMITS - Giới hạn tìm kiếm để tránh infinite loops
    # =========================================================================
    'search': {
        'max_iterations': 50000,    # Số lần lặp tối đa của A*
        'timeout_seconds': 30,      # Thời gian chờ tối đa (giây)
    },
    
    # =========================================================================
    # TSP META-SOLVER - Cấu hình cho thuật toán giải bài toán nhiều mục tiêu
    # =========================================================================
    'tsp': {
        'enabled': False,           # Feature flag - hiện tại đang tắt
        'brute_force_threshold': 7, # Ngưỡng số mục tiêu để dùng brute-force (< 8! = 40320)
        'use_nearest_neighbor': True,  # Dùng heuristic hàng xóm gần nhất khi vượt ngưỡng
    },
    
    # =========================================================================
    # CODE SYNTHESIS - Cấu hình cho việc tổng hợp code từ raw actions
    # =========================================================================
    'synthesis': {
        'min_sequence_length': 2,   # Độ dài tối thiểu để phát hiện pattern
        'max_sequence_length': 10,  # Độ dài tối đa cho pattern
        'procedure_threshold': 3,   # Số lần lặp tối thiểu để tạo procedure
    },
    
    # =========================================================================
    # PLOWING FIELD DETECTION - Cấu hình phát hiện pattern "cánh đồng"
    # =========================================================================
    'plowing_detection': {
        'min_grid_size': 3,         # Kích thước grid tối thiểu (rows hoặc cols)
        'max_missing_ratio': 0.2,   # Tỷ lệ ô thiếu tối đa cho phép (20%)
    },
    
    # =========================================================================
    # INTEGRATION - Cấu hình tích hợp các best practices
    # =========================================================================
    'integration': {
        'validate_before_solve': True,   # Chạy MapValidator trước khi solve
        'collect_metrics': True,         # Thu thập metrics trong quá trình solve
        'metrics_in_output': True,       # Bao gồm metrics trong JSON output
    },
}

# =========================================================================
# HELPER FUNCTIONS - Các hàm tiện ích để truy cập config
# =========================================================================

def get_heuristic_param(key: str, default=None):
    """Lấy tham số heuristic theo key."""
    return SOLVER_CONFIG['heuristic'].get(key, default)

def is_tsp_enabled() -> bool:
    """Kiểm tra xem TSP meta-solver có được bật không."""
    return SOLVER_CONFIG['tsp']['enabled']

def get_tsp_threshold() -> int:
    """Lấy ngưỡng số mục tiêu để quyết định dùng brute-force hay heuristic."""
    return SOLVER_CONFIG['tsp']['brute_force_threshold']
