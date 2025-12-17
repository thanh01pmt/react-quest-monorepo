# scripts/generate_variants.py

# --- MÔ TẢ TÍNH NĂNG ---
# Script này có chức năng sinh ra các file curriculum "biến thể" từ các file curriculum gốc.
# Quy trình hoạt động như sau:
# 1. Đọc một file curriculum gốc (ví dụ: CURRICULUM.COMMANDS_G34.json).
# 2. Với mỗi challenge (map) trong file gốc, nó sử dụng một loạt các "chiến lược"
#    để tạo ra các phiên bản map mới nhưng vẫn giữ được bản chất của bài toán.
#    Các chiến lược bao gồm:
#    - Thay đổi kích thước (Dimension): Tăng/giảm chiều dài, chiều rộng...
#    - Thay đổi cấu trúc (Topology): Đổi hướng rẽ, hướng bắt đầu...
#    - Thay đổi vị trí đối tượng (Placement): Thêm/bớt/di chuyển vật cản, vật phẩm...
# 3. Mỗi tập hợp các challenge đã biến đổi sẽ được lưu thành một file curriculum mới
#    trong thư mục `data/curriculum_variants`, với hậu tố `-varX` (ví dụ: ...-var2.json, ...-var3.json).
#
# Các file curriculum biến thể này sau đó sẽ được `main_variants.py` hoặc `generate_all_maps.py`
# sử dụng để sinh ra các file game level cuối cùng.
#
# --- CÁCH CHẠY ---
# python3 scripts/generate_variants.py

import json
import os
import copy
import argparse
import re
import random
from collections import Counter
from datetime import datetime # [THÊM MỚI] Thư viện để tạo dấu thời gian cho file log
from itertools import combinations
import sys

# --- [BIG UPDATE] Thiết lập đường dẫn để import MapGeneratorService ---
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)
from src.map_generator.service import MapGeneratorService

# --- SECTION 1: GAME WORLD DEFINITIONS (Dữ liệu từ GameWorld Model) ---
GAME_WORLD_DATA = {
    "WALKABLE_GROUNDS": [
        'wall.brick01', 'wall.brick02', 'wall.brick03', 'wall.brick04', 'wall.brick05', 'wall.brick06',
        'ground.checker', 'ground.earth', 'ground.earthChecker', 'ground.mud', 'ground.normal', 'ground.snow',
        'stone.stone01', 'stone.stone02', 'stone.stone03', 'stone.stone04', 'stone.stone05', 'stone.stone06', 'stone.stone07', 'ice.ice01'
    ],
    "JUMPABLE_OBSTACLES": [
        'wall.brick01', 'wall.brick02', 'wall.brick03', 'wall.brick04', 'wall.brick05', 'wall.brick06',
        'ground.checker', 'ground.earth', 'ground.earthChecker', 'ground.mud', 'ground.normal', 'ground.snow',
        'stone.stone01', 'stone.stone02', 'stone.stone03', 'stone.stone04', 'stone.stone05', 'stone.stone06', 'stone.stone07', 'ice.ice01'
    ],
    "UNJUMPABLE_OBSTACLES": [
        'wall.stone01', 'lava.lava01', 'water.water01'
    ],
    "DEADLY_OBSTACLES": [
        'lava.lava01'
    ]
}

# --- SECTION 2: TOOLBOX DEFINITIONS (Bộ năng lực) ---
TOOLBOX_DATA = {
    "commands_l1_move": ["maze_moveForward"],
    "commands_l2_turn": ["maze_moveForward", "maze_turn"],
    "commands_l3_jump": ["maze_moveForward", "maze_turn", "maze_jump"],
    "commands_l4_collect": ["maze_moveForward", "maze_turn", "maze_jump", "maze_collect"],
    "commands_l5_switch": ["maze_moveForward", "maze_turn", "maze_jump", "maze_toggle_switch"],
    "commands_l6_comprehensive": ["maze_moveForward", "maze_turn", "maze_jump", "maze_collect", "maze_toggle_switch"],
    "functions_l1_movement_only": ["maze_moveForward", "maze_turn", "maze_jump", "PROCEDURE"],
    "functions_l2_collect_gem": ["maze_moveForward", "maze_turn", "maze_jump", "maze_collect", "PROCEDURE"],
    "functions_l3_toggle_switch": ["maze_moveForward", "maze_turn", "maze_jump", "maze_toggle_switch", "PROCEDURE"],
    "functions_l4_comprehensive": ["maze_moveForward", "maze_turn", "maze_jump", "maze_collect", "maze_toggle_switch", "PROCEDURE"],
    "loops_l1_basic_movement": ["maze_moveForward", "maze_turn", "maze_jump", "maze_repeat", "math_number"],
    "loops_l2_with_actions": ["maze_moveForward", "maze_turn", "maze_jump", "maze_collect", "maze_toggle_switch", "maze_repeat", "math_number"],
    "loops_l3_functions_integration": ["maze_moveForward", "maze_turn", "maze_jump", "maze_collect", "maze_toggle_switch", "maze_repeat", "math_number", "PROCEDURE"],
    "variables_l1_basic_assignment": ["maze_moveForward", "maze_turn", "maze_jump", "maze_repeat", "math_number", "VARIABLE"],
    "variables_l2_calculation": ["maze_moveForward", "maze_turn", "maze_jump", "maze_collect", "maze_toggle_switch", "maze_repeat", "math_number", "math_arithmetic", "VARIABLE"],
    "variables_l3_game_data": ["maze_moveForward", "maze_turn", "maze_repeat", "math_number", "maze_item_count", "VARIABLE"],
    "variables_comprehensive": ["maze_moveForward", "maze_turn", "maze_jump", "maze_collect", "maze_toggle_switch", "maze_repeat", "math_number", "math_arithmetic", "maze_item_count", "VARIABLE", "PROCEDURE"],
    "mixed_basic_patterns": ["maze_moveForward", "maze_turn", "maze_jump", "maze_collect", "maze_toggle_switch", "maze_repeat", "math_number", "PROCEDURE"],
    "mixed_basic_full_integration": ["maze_moveForward", "maze_turn", "maze_jump", "maze_collect", "maze_toggle_switch", "maze_repeat", "math_number", "math_arithmetic", "maze_item_count", "VARIABLE", "PROCEDURE"],
    "conditionals_l1_movement_sensing": ["maze_moveForward", "maze_turn", "maze_jump", "controls_if", "maze_is_path", "maze_at_finish", "maze_repeat"],
    "conditionals_l2_interaction_sensing": ["maze_moveForward", "maze_turn", "maze_jump", "maze_collect", "maze_toggle_switch", "controls_if", "maze_is_path", "maze_is_item_present", "maze_is_switch_state", "maze_at_finish", "maze_repeat"],
    "conditionals_l3_variable_comparison": ["maze_moveForward", "maze_turn", "maze_jump", "maze_collect", "maze_toggle_switch", "controls_if", "logic_compare", "logic_boolean", "maze_is_path", "maze_is_item_present", "maze_is_switch_state", "maze_at_finish", "math_number", "VARIABLE", "maze_repeat"],
    "logic_ops_l1_negation": ["maze_moveForward", "maze_turn", "maze_jump", "controls_if", "logic_negate", "maze_is_path", "maze_at_finish", "maze_repeat"],
    "logic_ops_l2_and_or": ["maze_moveForward", "maze_turn", "maze_jump", "maze_collect", "maze_toggle_switch", "controls_if", "logic_operation", "logic_negate", "maze_is_path", "maze_is_item_present", "maze_is_switch_state", "maze_at_finish", "maze_repeat"],
    "logic_ops_full_complex": ["maze_moveForward", "maze_turn", "maze_jump", "maze_collect", "maze_toggle_switch", "controls_if", "logic_operation", "logic_negate", "logic_boolean", "logic_compare", "maze_is_path", "maze_is_item_present", "maze_is_switch_state", "maze_at_finish", "math_number", "VARIABLE", "maze_repeat", "PROCEDURE"],
    "while_l1_until_goal": ["maze_moveForward", "maze_turn", "maze_forever", "controls_if", "maze_is_path"],
    "while_l2_conditional_custom": ["maze_moveForward", "maze_turn", "maze_forever", "controls_whileUntil", "controls_if", "maze_is_path", "maze_is_item_present", "maze_at_finish", "maze_collect", "maze_toggle_switch"],
    "while_l3_full_logic": ["maze_moveForward", "maze_turn", "maze_jump", "maze_forever", "controls_whileUntil", "maze_repeat", "controls_if", "logic_operation", "logic_negate", "logic_compare", "maze_is_path", "maze_is_item_present", "maze_is_switch_state", "maze_at_finish", "maze_collect", "maze_toggle_switch", "VARIABLE", "math_number"],
    "algorithms_navigation_rules": ["maze_moveForward", "maze_turn", "maze_jump", "maze_collect", "maze_toggle_switch", "maze_forever", "controls_whileUntil", "maze_repeat", "controls_if", "logic_operation", "logic_negate", "maze_is_path", "maze_is_item_present", "maze_is_switch_state", "maze_at_finish", "PROCEDURE"],
    "algorithms_full_solver": ["maze_moveForward", "maze_turn", "maze_jump", "maze_collect", "maze_toggle_switch", "maze_forever", "controls_whileUntil", "maze_repeat", "controls_if", "logic_operation", "logic_negate", "logic_compare", "logic_boolean", "maze_is_path", "maze_is_item_present", "maze_is_switch_state", "maze_at_finish", "math_number", "math_arithmetic", "maze_item_count", "VARIABLE", "PROCEDURE"],
    "parameters_l1_basic_math": ["maze_moveForward", "maze_turn", "maze_jump", "maze_collect", "maze_toggle_switch", "math_number", "math_arithmetic", "PROCEDURE"],
    "parameters_full_generalization": ["maze_moveForward", "maze_turn", "maze_jump", "maze_collect", "maze_toggle_switch", "maze_forever", "controls_whileUntil", "maze_repeat", "controls_if", "logic_operation", "logic_negate", "logic_compare", "maze_is_path", "maze_is_item_present", "maze_is_switch_state", "maze_at_finish", "math_number", "math_arithmetic", "maze_item_count", "VARIABLE", "PROCEDURE"],
    "full_toolbox_no_jump": ["maze_moveForward", "maze_turn", "maze_forever", "controls_whileUntil", "maze_repeat", "math_number", "controls_if", "logic_compare", "logic_operation", "logic_negate", "logic_boolean", "maze_is_path", "maze_is_item_present", "maze_is_switch_state", "maze_at_finish", "maze_collect", "maze_toggle_switch", "maze_item_count", "math_arithmetic", "VARIABLE", "PROCEDURE"],
    "full_toolbox": ["maze_moveForward", "maze_jump", "maze_turn", "maze_forever", "controls_whileUntil", "maze_repeat", "math_number", "controls_if", "logic_compare", "logic_operation", "logic_negate", "logic_boolean", "maze_is_path", "maze_is_item_present", "maze_is_switch_state", "maze_at_finish", "maze_collect", "maze_toggle_switch", "maze_item_count", "math_arithmetic", "VARIABLE", "PROCEDURE"]
}

CONSTANTS = {
    "DIMENSION_LIMITS": {"min": 3, "max": 12},
    "MAX_OBSTACLES": 5
}

class VariantGenerator:
    # [BIG UPDATE] Khởi tạo với MapGeneratorService
    def __init__(self, map_request, map_generator_service: MapGeneratorService):
        self.original_request = copy.deepcopy(map_request)
        self.config = self.original_request.get("generation_config", {})
        self.params = self.config.get("params", {})
        self.map_type = self.config.get("map_type", "")
        self.logic_type = self.config.get("logic_type", "")
        self.map_generator = map_generator_service
        
        self.challenge_type = self.params.get("challenge_type", "SIMPLE_APPLY")
        self.toolbox_preset = self.original_request.get("blockly_config", {}).get("toolbox_preset", "")
        self.bug_type = self.params.get("bug_type", "")
        self.bug_config = self.params.get("bug_config", {})
        
        # --- CAPABILITY ANALYSIS ---
        self.available_blocks = TOOLBOX_DATA.get(self.toolbox_preset, [])
        self.cap_turn = "maze_turn" in self.available_blocks
        self.cap_jump = "maze_jump" in self.available_blocks
        self.cap_collect = "maze_collect" in self.available_blocks
        self.cap_switch = "maze_toggle_switch" in self.available_blocks
        self.cap_loop = any(b in self.available_blocks for b in ["maze_repeat", "controls_whileUntil", "maze_forever"])
        self.cap_math = any(b in self.available_blocks for b in ["maze_item_count", "math_number", "variables_get"])

    # ==========================================
    # [BIG UPDATE] CORE LOGIC: PLACEMENT ANALYSIS
    # ==========================================
    def _get_valid_obstacle_placements(self, generated_map):
        """
        Phân tích bản đồ đã sinh để tìm các vị trí hợp lệ đặt vật cản,
        đảm bảo không tạo ra bước nhảy "y+2".
        """
        path_coords = generated_map.path_coords
        if not path_coords or len(path_coords) < 3:
            return []

        # Tạo một dictionary để tra cứu nhanh y-coordinate từ (x, z)
        path_map = {(coord[0], coord[2]): coord[1] for coord in path_coords}
        
        # Loại bỏ các vị trí đã bị chiếm dụng bởi item, start, finish
        occupied_xz = set()
        occupied_xz.add((generated_map.start_pos[0], generated_map.start_pos[2]))
        occupied_xz.add((generated_map.target_pos[0], generated_map.target_pos[2]))
        for item in generated_map.items:
            occupied_xz.add((item['pos'][0], item['pos'][2]))

        valid_placements = []
        # Chỉ xem xét các vị trí không phải là điểm đầu và cuối
        for i in range(1, len(path_coords) - 1):
            current_pos = path_coords[i]
            
            # Bỏ qua nếu vị trí đã bị chiếm
            if (current_pos[0], current_pos[2]) in occupied_xz:
                continue

            prev_pos = path_coords[i-1]
            next_pos = path_coords[i+1]

            current_y = current_pos[1]
            prev_y = path_map.get((prev_pos[0], prev_pos[2]), current_y)
            next_y = path_map.get((next_pos[0], next_pos[2]), current_y)

            # Giả định vật cản sẽ được đặt ở y+1 so với khối nền
            obstacle_height = current_y + 1

            # Kiểm tra xem bước nhảy có quá cao không (chênh lệch > 1)
            is_jump_from_prev_valid = abs(obstacle_height - prev_y) <= 1
            is_jump_to_next_valid = abs(next_y - obstacle_height) <= 1
            
            if is_jump_from_prev_valid and is_jump_to_next_valid:
                valid_placements.append(current_pos)

        return valid_placements

    def _get_valid_item_placements(self, generated_map):
        """
        Tìm các vị trí hợp lệ để đặt vật phẩm (crystal, switch).
        Vị trí hợp lệ là trên đường đi, không phải start/finish và chưa có gì.
        """
        path_coords = generated_map.path_coords
        if not path_coords or len(path_coords) < 3:
            return []

        # Loại bỏ các vị trí đã bị chiếm dụng
        occupied_xz = set()
        occupied_xz.add((generated_map.start_pos[0], generated_map.start_pos[2]))
        occupied_xz.add((generated_map.target_pos[0], generated_map.target_pos[2]))
        for item in generated_map.items:
            occupied_xz.add((item['pos'][0], item['pos'][2]))
        for obs in generated_map.obstacles:
            occupied_xz.add((obs['pos'][0], obs['pos'][2]))

        valid_placements = []
        for i in range(1, len(path_coords) - 1):
            pos = path_coords[i]
            if (pos[0], pos[2]) not in occupied_xz:
                valid_placements.append(pos)
        
        return valid_placements

    # ==========================================
    # STRATEGY 1: DIMENSION (Kích thước)
    # ==========================================
    def _strat_dimension(self):
        """
        [BIG UPDATE] Chiến lược này giờ đây là vòng lặp ngoài cùng.
        Nó tạo ra các biến thể về kích thước, và với MỖI biến thể kích thước,
        nó sẽ gọi các chiến lược đặt đối tượng (placement).
        """
        keys_map = {
            "straight_line": ["path_length"],
            "l_shape": ["leg1_length", "leg2_length"],
            "u_shape": ["side_legs_length", "base_leg_length"],
            "z_shape": ["leg1_length", "leg2_length", "leg3_length"],
            "staircase": ["num_steps"],
            "symmetrical_islands": ["num_islands"],
            "spiral_path": ["num_turns"],
            "complex_maze_2d": ["maze_width", "maze_depth"]
        }
        target_keys = keys_map.get(self.map_type, [])
        if not target_keys:
             target_keys = [k for k in self.params if any(x in k for x in ["length", "size", "step", "width", "depth"])]

        for key in target_keys:
            if key not in self.params: continue
            val = self.params[key]
            if not isinstance(val, int): continue

            # [CẢI TIẾN] Thiết lập giới hạn kích thước mới, không phụ thuộc vào năng lực của người chơi.
            # Giới hạn dưới là 2 (để có điểm start và finish).
            # Giới hạn trên là 16 để phù hợp với kích thước map tối đa (16x16x16).
            min_val = 2
            max_val = 16

            search_range = range(min_val, max_val + 1)

            for new_val in search_range:
                if new_val == val: continue
                new_params = copy.deepcopy(self.params)
                new_params[key] = new_val
                yield (new_params, None)

    # ==========================================
    # STRATEGY 2: TOPOLOGY (Cấu trúc & Hướng)
    # ==========================================
    def _strat_topology(self):
        if self.cap_turn and "turn_direction" in self.params:
            new_dir = "right" if self.params["turn_direction"] == "left" else "left"
            new_params = copy.deepcopy(self.params)
            new_params["turn_direction"] = new_dir
            yield (new_params, None)
        # [VÔ HIỆU HÓA] Tạm thời tắt tính năng thay đổi hướng bắt đầu của người chơi
        # để giữ nguyên hướng từ base map theo yêu cầu.
    
    # ==========================================
    # [BIG UPDATE] STRATEGY 3: PLACEMENT (Vị trí đối tượng)
    # ==========================================
    def _strat_placement(self, base_params):
        """
        Chiến lược cốt lõi mới:
        1. Sinh map vật lý từ `base_params`.
        2. Phân tích map để tìm vị trí hợp lệ.
        3. Tạo các biến thể bằng cách đặt obstacles/items vào các vị trí đó.
        """
        # [BIG UPDATE] Phân nhánh logic dựa trên Placer chuyên biệt
        # Các placer này có quy tắc đặt đối tượng phức tạp, không nên can thiệp bằng tọa độ.
        specialized_placers = {
            'for_loop_logic', 
            'function_logic', 
            'variable_logic', 
            'conditional_logic', 
            'algorithm_logic',
            'path_searching_swift' # Placer này cũng có logic riêng cần được tôn trọng
        }

        if self.logic_type in specialized_placers:
            # Chế độ an toàn: Chỉ sửa đổi tham số cấp cao, để Placer tự quyết định vị trí.
            log_message(f"  - ℹ️  Phát hiện Placer chuyên biệt ('{self.logic_type}'). Chuyển sang chế độ tạo biến thể an toàn.", "INFO")
            # Sử dụng lại logic của _strat_gameplay cũ, vốn chỉ tăng số lượng.
            # Dùng `yield from` để trả về tất cả các biến thể mà nó tạo ra.
            yield from self._strat_gameplay_safe_mode(base_params)
            return # Kết thúc sớm, không chạy logic đặt theo tọa độ bên dưới.

        # --- Logic đặt theo tọa độ mạnh mẽ (chỉ dành cho các Placer đơn giản) ---
        log_message(f"  - ✅ Sử dụng chiến lược đặt đối tượng theo tọa độ cho Placer '{self.logic_type}'.", "INFO")
        try:
            # 1. Sinh map vật lý
            generated_map = self.map_generator.generate_map(
                map_type=self.map_type,
                logic_type=self.logic_type,
                params=base_params
            )
        except Exception as e:
            log_message(f"  - ❌ Lỗi khi sinh map vật lý để phân tích: {e}", "ERROR")
            return # Dừng chiến lược này nếu không sinh được map

        # 2. Phân tích và tìm vị trí hợp lệ
        valid_obstacle_coords = self._get_valid_obstacle_placements(generated_map)
        valid_item_coords = self._get_valid_item_placements(generated_map)

        # 3. Tạo biến thể bằng cách đặt OBSTACLES
        if self.cap_jump and valid_obstacle_coords:
            # Thử đặt 1, 2, ... vật cản
            max_obstacles_to_add = min(len(valid_obstacle_coords), 2) # Giới hạn ở 2 để tránh bùng nổ tổ hợp
            for count in range(1, max_obstacles_to_add + 1):
                # Lặp qua tất cả các tổ hợp vị trí
                for positions in combinations(valid_obstacle_coords, count):
                    new_params = copy.deepcopy(base_params)
                    # Sử dụng `obstacle_positions` để chỉ định chính xác vị trí
                    if 'obstacle_positions' not in new_params:
                        new_params['obstacle_positions'] = []
                    new_params['obstacle_positions'].extend([list(p) for p in positions])
                    # Cập nhật `obstacle_count` để logic cũ (nếu có) vẫn hiểu
                    new_params['obstacle_count'] = len(new_params['obstacle_positions'])
                    yield (new_params, None)

        # 4. Tạo biến thể bằng cách đặt ITEMS (crystal, switch)
        if valid_item_coords:
            items_to_try = []
            if self.cap_collect: items_to_try.append("crystal")
            if self.cap_switch: items_to_try.append("switch")

            if items_to_try:
                # Thử đặt 1, 2, ... vật phẩm
                max_items_to_add = min(len(valid_item_coords), 2)
                for count in range(1, max_items_to_add + 1):
                    for positions in combinations(valid_item_coords, count):
                        # Với mỗi tổ hợp vị trí, thử đặt các loại item khác nhau
                        for item_type in items_to_try:
                            new_params = copy.deepcopy(base_params)
                            if 'items_to_place' not in new_params or not isinstance(new_params['items_to_place'], list):
                                new_params['items_to_place'] = []
                            
                            # Tạo danh sách các item mới để thêm vào
                            new_items = [{"type": item_type, "position": list(p)} for p in positions]
                            
                            # Thêm vào `items_to_place`
                            new_params['items_to_place'].extend(new_items)
                            
                            # Cập nhật solution_config nếu cần
                            overrides = {}
                            orig_goals = self.original_request.get("solution_config", {}).get("itemGoals", {})
                            if item_type in orig_goals and isinstance(orig_goals[item_type], int):
                                overrides["itemGoals"] = copy.deepcopy(orig_goals)
                                overrides["itemGoals"][item_type] += count

                            yield (new_params, overrides)

    # ==========================================
    # STRATEGY 3: GAMEPLAY (Vật phẩm)
    # [RENAME & REFACTOR]
    # ==========================================
    def _strat_gameplay_safe_mode(self, base_params):
        """
        [CHẾ ĐỘ AN TOÀN] Chỉ tăng số lượng, không chỉ định vị trí.
        Dành cho các Placer chuyên biệt.
        """
        # Logic Obstacle: Chỉ thêm nếu có Jump
        if self.cap_jump and "obstacle_count" in base_params:
            if base_params["obstacle_count"] < CONSTANTS["MAX_OBSTACLES"]:
                new_params = copy.deepcopy(base_params)
                new_params["obstacle_count"] += 1
                yield (new_params, None)

        # Logic Item
        if "items_to_place" in self.params:
            current_items = self.params["items_to_place"]
            
            # [SỬA LỖI] Đảm bảo current_items luôn là một danh sách.
            # Một số file curriculum cũ có thể định nghĩa nó là một chuỗi rỗng.
            if not isinstance(current_items, list):
                current_items = []

            item_counts = Counter(current_items) # Bây giờ item_counts sẽ luôn hoạt động
            
            if self.cap_math: # Logic cho Math
                available_types = list(set(current_items)) if current_items else ["crystal", "switch"]
                for item_type in available_types:
                    if len(current_items) <= 10:
                        new_params = copy.deepcopy(self.params)
                        new_params["items_to_place"].extend([item_type, item_type])
                        overrides = {}
                        orig_goals = self.original_request.get("solution_config", {}).get("itemGoals", {})
                        if item_type in orig_goals and isinstance(orig_goals[item_type], int):
                             overrides["itemGoals"] = copy.deepcopy(orig_goals)
                             overrides["itemGoals"][item_type] += 2
                        yield (new_params, overrides)
            else: # Logic thường
                if self.cap_collect and item_counts.get("crystal", 0) < 5:
                     new_params = copy.deepcopy(self.params)
                     new_params["items_to_place"].append("crystal")
                     overrides = {}
                     orig_goals = self.original_request.get("solution_config", {}).get("itemGoals", {})
                     if "crystal" in orig_goals and isinstance(orig_goals["crystal"], int):
                          overrides["itemGoals"] = copy.deepcopy(orig_goals)
                          overrides["itemGoals"]["crystal"] += 1
                     yield (new_params, overrides)

                if self.cap_switch and item_counts.get("switch", 0) < 5:
                     new_params = copy.deepcopy(self.params)
                     new_params["items_to_place"].append("switch")
                     overrides = {}
                     orig_goals = self.original_request.get("solution_config", {}).get("itemGoals", {})
                     if "switch" in orig_goals and isinstance(orig_goals["switch"], int):
                          overrides["itemGoals"] = copy.deepcopy(orig_goals)
                          overrides["itemGoals"]["switch"] += 1
                     yield (new_params, overrides)

    # ==========================================
    # STRATEGY 4: THEME (Giao diện - ĐÃ CẬP NHẬT LOGIC GAMEWORLD)
    # ==========================================
    # [VÔ HIỆU HÓA] Chiến lược này không còn cần thiết vì việc thay đổi theme
    # đã được tích hợp vào mọi phép biến đổi khác.
    # def _strat_theme(self):
    #     ...

    # ==========================================
    # MAIN DISPATCHER
    # ==========================================
    def generate_ordered_variants(self):
        """
        [BIG UPDATE] Quy trình điều phối mới:
        1. Tạo biến thể kích thước (_strat_dimension).
        2. Với MỖI biến thể kích thước, tạo các biến thể vị trí (_strat_placement).
        3. Tạo các biến thể cấu trúc (_strat_topology).
        4. Luôn áp dụng theme mới cho mỗi biến thể cuối cùng.
        """
        generated_hashes = {json.dumps(self.params, sort_keys=True)} # type: ignore
        
        # --- Vòng 1: Kích thước & Vị trí ---
        for size_params, _ in self._strat_dimension():
            # Với mỗi kích thước mới, tạo các biến thể vị trí
            for placement_params, placement_overrides in self._strat_placement(size_params):
                params_hash = json.dumps(placement_params, sort_keys=True)
                if params_hash in generated_hashes: continue
                generated_hashes.add(params_hash)

                variant_request = self._create_final_request(placement_params, placement_overrides)
                yield variant_request

        # --- Vòng 2: Cấu trúc (Topology) & Gameplay cũ ---
        # Chạy các chiến lược cũ trên params GỐC
        for strat_func in [self._strat_topology, self._strat_gameplay_safe_mode]:
            for new_params, solution_overrides in strat_func(self.params): # type: ignore
                params_hash = json.dumps(new_params, sort_keys=True)
                if params_hash in generated_hashes: continue
                generated_hashes.add(params_hash)
                
                # [CẬP NHẬT] Không cần áp dụng theme ở đây nữa, service sẽ làm.
                variant_request = self._create_final_request(new_params, solution_overrides)
                yield variant_request

    def _create_final_request(self, params, overrides):
        """
        Helper để tạo đối tượng request cuối cùng.
        [CẬP NHẬT] Không còn chịu trách nhiệm gán theme.
        """
        variant_request = copy.deepcopy(self.original_request)
        
        # Gán params đã biến đổi
        variant_request["generation_config"]["params"] = params
        
        # Ghi đè các cấu hình lời giải nếu có
        if overrides:
            if "solution_config" not in variant_request: variant_request["solution_config"] = {}
            variant_request["solution_config"].update(overrides)
        
        return variant_request

# [THÊM MỚI] Khởi tạo các danh sách để lưu trữ log
success_logs = []
warning_logs = []
error_logs = []

def log_message(message, level="INFO"):
    """
    Hàm ghi log tập trung, vừa in ra màn hình vừa lưu vào danh sách.
    """
    print(message) # In ra console để người dùng thấy tiến trình
    
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "level": level,
        "message": message
    }
    
    if level == "SUCCESS":
        success_logs.append(log_entry)
    elif level == "WARNING":
        warning_logs.append(log_entry)
    elif level == "ERROR":
        error_logs.append(log_entry)

def main():
    """
    Hàm chính để chạy quy trình sinh biến thể cho toàn bộ curriculum.
    Quy trình mới:
    1. Duyệt qua từng file curriculum gốc trong `data/curriculum`.
    2. Với mỗi challenge trong file gốc, sinh ra một số lượng biến thể (theo --num_new_variants_per_map).
    3. Mỗi biến thể sẽ tạo ra một file curriculum hoàn toàn mới trong `data/curriculum_variants` (ví dụ: CURRICULUM.COMMANDS_G34-VAR2.json).
    4. ID của challenge bên trong các file biến thể được giữ nguyên.
    """
    parser = argparse.ArgumentParser(description="Tạo các file curriculum biến thể từ curriculum gốc.")
    parser.add_argument('--num_variants', type=int, default=None, help="Số lượng biến thể MỚI cần tạo cho mỗi map gốc. Nếu không cung cấp, sẽ hiển thị menu lựa chọn.")
    args = parser.parse_args()
    
    log_message("======================================================")
    log_message("=== BẮT ĐẦU QUY TRÌNH SINH BIẾN THỂ MAP ===")
    log_message("======================================================")

    num_variants_to_generate = args.num_variants

    if num_variants_to_generate is None:
        while True:
            print("\nVui lòng chọn một tùy chọn:")
            print("  1. Nhập vào số lượng biến thể muốn tạo cho mỗi map gốc.")
            print("  2. Tạo tối đa số lượng biến thể có thể có.")
            choice = input("Nhập lựa chọn của bạn (1 hoặc 2): ").strip()

            if choice == '1':
                while True:
                    try:
                        num_input = input("Nhập số lượng biến thể MỚI cần tạo (ví dụ: 2 sẽ tạo ra var2, var3): ").strip()
                        num_variants_to_generate = int(num_input)
                        if num_variants_to_generate < 0:
                            log_message("❌ Số lượng biến thể phải là một số dương.", "ERROR")
                            continue
                        break
                    except ValueError:
                        log_message("❌ Vui lòng nhập một số nguyên hợp lệ.", "ERROR")
                break
            elif choice == '2':
                num_variants_to_generate = -1  # Sử dụng -1 làm cờ để chỉ định tạo tối đa
                log_message("🚀 Sẽ tạo tối đa số lượng biến thể có thể có cho mỗi map.")
                break
            else:
                log_message("❌ Lựa chọn không hợp lệ. Vui lòng chọn 1 hoặc 2.", "ERROR")
    # --- Xác định đường dẫn ---
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    source_curriculum_dir = os.path.join(project_root, 'data', 'curriculum')
    output_dir = os.path.join(project_root, 'data', 'curriculum_variants')
    
    if not os.path.exists(source_curriculum_dir):
        log_message(f"❌ Lỗi: Không tìm thấy thư mục curriculum nguồn tại: '{source_curriculum_dir}'", "ERROR")
        return
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        log_message(f"✅ Đã tạo thư mục output cho các biến thể: '{output_dir}'")

    # [BIG UPDATE] Khởi tạo MapGeneratorService một lần duy nhất
    map_generator_service = MapGeneratorService()
    
    # --- Quét tất cả các file curriculum gốc ---
    source_files = [f for f in os.listdir(source_curriculum_dir) if f.endswith('.json')]
    if not source_files:
        log_message(f"⚠️ Cảnh báo: Không tìm thấy file curriculum JSON nào trong '{source_curriculum_dir}'.", "WARNING")
        return
    
    log_message(f"🔍 Tìm thấy {len(source_files)} file curriculum gốc để xử lý...", "INFO")
    
    total_variants_generated = 0
    
    for filename in source_files:
        filepath = os.path.join(source_curriculum_dir, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            original_curriculum = json.load(f)
        
        log_message(f"\n--- Đang xử lý file: {filename} ---", "INFO")
        
        # --- Bước 2: Tạo các file biến thể mới (VAR2, VAR3, ...) ---
        # Tạo một "khung" curriculum cho các biến thể.
        # Mỗi biến thể sẽ chỉ chứa MỘT challenge đã được biến đổi.
        variant_base_structure = copy.deepcopy(original_curriculum)
        is_new_structure = 'topics' in variant_base_structure
        
        # Lấy danh sách tất cả các challenge gốc
        original_challenges = []
        if is_new_structure:
            for topic in original_curriculum.get('topics', []):
                original_challenges.extend(topic.get('challenges', []))
        else:
            original_challenges.extend(original_curriculum.get('suggested_maps', []))
        
        base_name, _ = os.path.splitext(filename)

        # Xác định số lượng biến thể tối đa có thể tạo từ challenge đầu tiên để giới hạn vòng lặp
        max_possible_variants = 0
        if original_challenges:
            temp_generator = VariantGenerator(original_challenges[0], map_generator_service)
            max_possible_variants = len(list(temp_generator.generate_ordered_variants()))

        # Nếu người dùng chọn tạo tối đa, sử dụng số lượng đó. Nếu không, dùng số người dùng nhập.
        loop_count = max_possible_variants if num_variants_to_generate == -1 else num_variants_to_generate

        # Tạo các file biến thể
        # Số biến thể cần tạo là loop_count
        # Chúng ta sẽ tạo các file VAR2, VAR3, ...
        for i in range(loop_count):
            variant_num = i + 2  # Bắt đầu từ var2
            new_variant_curriculum = copy.deepcopy(variant_base_structure)
            new_challenges_list = []
            
            # Với mỗi challenge gốc, tạo ra một biến thể tương ứng
            for original_challenge in original_challenges:
                generator = VariantGenerator(original_challenge, map_generator_service)
                
                # Lấy ra biến thể thứ `i` từ generator
                try:
                    # `generate_ordered_variants` là một generator, cần chuyển thành list để lấy theo index
                    all_possible_variants = list(generator.generate_ordered_variants())
                    if i < len(all_possible_variants):
                        variant_req = all_possible_variants[i]
                        
                        # [QUAN TRỌNG] Giữ nguyên ID gốc, không thêm hậu tố -VAR
                        variant_req['id'] = original_challenge['id']
                        variant_req['titleKey'] = original_challenge['titleKey']
                        variant_req['descriptionKey'] = original_challenge['descriptionKey']
                        
                        new_challenges_list.append(variant_req)
                    else:
                        # Nếu không đủ biến thể để tạo, có thể dùng lại challenge gốc
                        log_message(f"  ⚠️  Không đủ biến thể cho map '{original_challenge['id']}'. Bỏ qua map này cho var{variant_num}.", "WARNING")
                        # Không làm gì cả, bỏ qua việc thêm map này vào danh sách
                except Exception as e:
                    log_message(f"  ❌ Lỗi khi tạo biến thể cho map '{original_challenge['id']}': {e}. Bỏ qua map này.", "ERROR")
                    # Không làm gì cả, bỏ qua việc thêm map này vào danh sách
            
            # Đặt danh sách challenge đã biến đổi vào cấu trúc curriculum mới
            if is_new_structure:
                # Phân phối lại các challenge vào đúng topic của chúng
                challenge_idx = 0
                for topic in new_variant_curriculum.get('topics', []):
                    num_challenges_in_topic = len(topic.get('challenges', []))
                    topic['challenges'] = new_challenges_list[challenge_idx : challenge_idx + num_challenges_in_topic]
                    challenge_idx += num_challenges_in_topic
            else:
                new_variant_curriculum['suggested_maps'] = new_challenges_list
            
            # Lưu file curriculum biến thể mới
            output_filename = f"{base_name}-var{variant_num}.json"
            output_filepath = os.path.join(output_dir, output_filename)
            with open(output_filepath, 'w', encoding='utf-8') as f:
                json.dump(new_variant_curriculum, f, indent=2, ensure_ascii=False)
            
            log_message(f"  ✅ Đã tạo file biến thể: {output_filename}", "SUCCESS")
            total_variants_generated += 1
            
    # --- [CẬP NHẬT] Ghi file log tổng kết sang định dạng JSON và lưu vào GenMapLog ---
    def write_log_file():
        timestamp = datetime.now().strftime("%Y%m%d_%H%M")
        log_filename = f"generate_variants_log_{timestamp}.json"
        
        # Thư mục log mới: 'GenMapLog', nằm bên ngoài thư mục dự án 'GenMap'
        genmap_log_dir = os.path.join(os.path.dirname(project_root), 'GenMapLog')
        log_filepath = os.path.join(genmap_log_dir, log_filename)

        if not os.path.exists(genmap_log_dir):
            os.makedirs(genmap_log_dir)

        log_data = {
            "timestamp": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            "summary": {
                "total_variants_generated": total_variants_generated,
                "success_count": len(success_logs),
                "warning_count": len(warning_logs),
                "error_count": len(error_logs)
            },
            "success": success_logs,
            "warnings": warning_logs,
            "errors": error_logs
        }
        
        with open(log_filepath, 'w', encoding='utf-8') as f:
            json.dump(log_data, f, indent=2, ensure_ascii=False)
        
        log_message(f"\n📝 Đã ghi log chi tiết dạng JSON vào file: {log_filepath}")

    write_log_file()
    log_message(f"\n=== HOÀN TẤT: Đã tạo tổng cộng {total_variants_generated} file curriculum biến thể mới. ===")

if __name__ == "__main__":
    main()