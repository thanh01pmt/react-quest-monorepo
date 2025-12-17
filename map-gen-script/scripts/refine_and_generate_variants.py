# scripts/refine_and_generate_variants.py

# --- MÔ TẢ TÍNH NĂNG ---
# Script này là một công cụ mạnh mẽ dành cho việc "tinh chỉnh và tạo biến thể".
# Quy trình hoạt động như sau:
# 1. Người dùng chỉnh sửa thủ công một file game level (ví dụ: ...-var1.json)
#    và lưu nó vào thư mục `data/base_maps/EDITING-MAPS-LIST` với tiền tố `BASEMAP.`.
# 2. Script này sẽ quét thư mục đó, đọc file đã chỉnh sửa.
# 3. Nó chạy lại thuật toán giải (solver) trên map đã chỉnh sửa để đảm bảo nó
#    vẫn giải được và cập nhật lại các chỉ số (optimalBlocks, rawActions...).
# 4. Sau đó, nó sử dụng map đã chỉnh sửa này làm "template" để tự động sinh ra
#    các biến thể mới (ví dụ: ...-var2, ...-var3) bằng cách áp dụng các phép
#    biến đổi như xoay map, thay đổi theme, thay đổi vật phẩm...
# 5. Tất cả các file game level cuối cùng (cả file đã chỉnh sửa và các biến thể mới)
#    sẽ được lưu vào `data/final_game_levels`.
#
# --- CÁCH CHẠY ---
# Đặt các file `BASEMAP.<ID>.json` đã chỉnh sửa vào thư mục `EDITING-MAPS-LIST`.
# Sau đó chạy lệnh:
# python3 scripts/refine_and_generate_variants.py

import json
import os
import copy
import sys
import re
import argparse
import random

# [THÊM MỚI] Cấu hình logging để hiển thị các thông báo INFO
import logging
logging.basicConfig(level=logging.INFO, format='%(message)s')
from datetime import datetime

# --- Thiết lập đường dẫn để import từ thư mục src ---
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

# Import các thành phần cần thiết
from scripts.generate_all_maps import _create_xml_from_structured_solution, actions_to_xml, TOPIC_TRANSLATIONS, _rename_procedures_pedagogically
from scripts.gameSolver import solve_map_and_get_solution
from src.bug_generator.service import create_bug
from scripts.calculate_lines import calculate_optimal_lines_from_structured


class GameConfigVariantGenerator:
    """
    Lớp chịu trách nhiệm tạo biến thể trực tiếp từ một đối tượng gameConfig.
    Đây là cách tiếp cận mới, lấy base_map đã chỉnh sửa làm "template".
    """

    # [CẬP NHẬT THEO YÊU CẦU] Sử dụng thư viện theme mới, đa dạng hơn
    COMPREHENSIVE_THEMES = [
        # Classic & Neutral
        {"ground": "ground.checker", "obstacle": "wall.brick02", "tags": ["classic"]},
        {"ground": "ground.earth", "obstacle": "wall.brick04", "tags": ["natural"]},
        {"ground": "ground.normal", "obstacle": "wall.brick01", "tags": ["classic"]},
        {"ground": "ground.earthChecker", "obstacle": "wall.brick03", "tags": ["natural"]},
    
        # Stone & Rock
        {"ground": "stone.stone01", "obstacle": "wall.brick03", "tags": ["stone"]},
        {"ground": "stone.stone02", "obstacle": "wall.brick05", "tags": ["stone"]},
        {"ground": "stone.stone03", "obstacle": "wall.brick06", "tags": ["stone"]},
        {"ground": "stone.stone04", "obstacle": "wall.stone01", "tags": ["stone", "dark"]},
        {"ground": "stone.stone05", "obstacle": "wall.brick01", "tags": ["stone"]},
        {"ground": "stone.stone06", "obstacle": "wall.brick02", "tags": ["stone", "light"]},
    
        # Special Environments
        {"ground": "ground.mud", "obstacle": "wall.brick03", "tags": ["natural", "dark"]},
        {"ground": "ground.snow", "obstacle": "wall.brick06", "tags": ["winter"]},
    
        # --- [BỔ SUNG] Các bộ theme kết hợp mới ---
        {"ground": "ground.snow", "obstacle": "ice.ice01", "tags": ["winter", "ice"]},
        {"ground": "stone.stone01", "obstacle": "wall.stone01", "tags": ["stone", "monochrome"]},
        {"ground": "ground.earth", "obstacle": "wall.brick01", "tags": ["natural", "classic"]},
        {"ground": "stone.stone05", "obstacle": "wall.brick04", "tags": ["stone", "warm"]},
        {"ground": "ground.checker", "obstacle": "wall.brick05", "tags": ["classic", "dark"]},
        {"ground": "ice.ice01", "obstacle": "wall.brick01", "tags": ["winter", "mixed"]},
        {"ground": "ground.mud", "obstacle": "wall.brick02", "tags": ["natural", "contrast"]},
        {"ground": "stone.stone04", "obstacle": "wall.brick06", "tags": ["stone", "dark", "contrast"]},
        {"ground": "ground.normal", "obstacle": "wall.brick03", "tags": ["classic", "warm"]},
        {"ground": "stone.stone02", "obstacle": "wall.stone01", "tags": ["stone", "dark"]},
    
        # Prohibited themes (sẽ được lọc ra dựa trên ngữ cảnh)
        {
            "ground": "ice.ice01", "obstacle": "wall.brick05", "tags": ["winter", "ice", "prohibited"],
            "prohibited_if_item": "crystal" # Cấm nếu map có crystal
        },
        {
            "ground": "stone.stone07", "obstacle": "wall.brick04", "tags": ["stone", "dark", "prohibited"],
            "prohibited_if_item": "switch" # Cấm nếu map có switch
        }
    ]

    def __init__(self, base_game_config: dict):
        self.original_config = copy.deepcopy(base_game_config)
        self.used_themes = set() # [MỚI] Theo dõi các theme đã sử dụng

    def _transform_asset_theme(self, config: dict) -> dict:
        """Thay đổi theme của map để tạo sự mới mẻ về mặt hình ảnh."""
        # [NÂNG CẤP] Lọc theme dựa trên itemGoals
        item_goals = self.original_config.get("solution", {}).get("itemGoals", {})
        
        # Xác định các item có trong map
        has_crystal = "crystal" in item_goals and item_goals["crystal"] > 0
        has_switch = "switch" in item_goals and item_goals["switch"] > 0

        # Lọc ra các theme bị cấm
        allowed_themes = []
        for theme in self.COMPREHENSIVE_THEMES:
            prohibited_item = theme.get("prohibited_if_item")
            if prohibited_item == "crystal" and has_crystal:
                continue
            if prohibited_item == "switch" and has_switch:
                continue
            allowed_themes.append(theme)

        # [CẬP NHẬT] Lọc ra các theme chưa được sử dụng
        possible_themes = [
            t for t in allowed_themes 
            if (t.get("ground"), t.get("obstacle")) not in self.used_themes
        ]
        # Nếu tất cả các theme đã được sử dụng, cho phép sử dụng lại
        if not possible_themes:
            possible_themes = allowed_themes

        new_theme = random.choice(possible_themes)
        self.used_themes.add((new_theme["ground"], new_theme["obstacle"])) # Đánh dấu theme này đã được sử dụng

        new_ground = new_theme["ground"]
        new_obstacle = new_theme["obstacle"]

        for block in config.get("gameConfig", {}).get("blocks", []):
            # Thay đổi tất cả các loại ground/stone/ice...
            if any(key in block.get("modelKey", "") for key in ["ground", "stone", "ice"]):
                block["modelKey"] = new_ground
        
        for obstacle in config.get("gameConfig", {}).get("obstacles", []):
            # Thay đổi tất cả các loại wall/brick...
            if any(key in obstacle.get("modelKey", "") for key in ["wall", "brick"]):
                 obstacle["modelKey"] = new_obstacle

        print(f"       - Đã áp dụng theme mới: ground='{new_ground}', obstacle='{new_obstacle}'")
        return config

    def _transform_rotation(self, config: dict, angle: int) -> dict:
        """Xoay toàn bộ map một góc 90, 180, hoặc 270 độ quanh gốc tọa độ (0, y, 0)."""
        if angle not in [90, 180, 270]:
            return config

        print(f"       - Đang xoay map một góc {angle} độ...")
        
        def rotate_pos(pos):
            x, z = pos['x'], pos['z']
            if angle == 90: return {'x': -z, 'y': pos['y'], 'z': x}
            elif angle == 180: return {'x': -x, 'y': pos['y'], 'z': -z}
            elif angle == 270: return {'x': z, 'y': pos['y'], 'z': -x}
            return pos

        def rotate_dir(direction):
            """Hàm xoay hướng, chấp nhận cả chuỗi (north) và số nguyên (0)."""
            dir_map = {'north': 0, 'east': 1, 'south': 2, 'west': 3}
            rev_dir_map = {0: 'north', 1: 'east', 2: 'south', 3: 'west'}
            
            current_dir_val = 0
            if isinstance(direction, str):
                current_dir_val = dir_map.get(direction.lower(), 0)
            elif isinstance(direction, int):
                current_dir_val = direction % 4

            angle_offset = angle // 90
            new_dir_val = (current_dir_val + angle_offset) % 4
            
            return rev_dir_map[new_dir_val]

        for component_list_key in ['blocks', 'obstacles', 'collectibles', 'interactibles']:
            for item in config.get("gameConfig", {}).get(component_list_key, []):
                if 'position' in item:
                    item['position'] = rotate_pos(item['position'])

        player = config['gameConfig']['players'][0]
        player['start'] = rotate_pos(player['start'])
        player['start']['direction'] = rotate_dir(player['start']['direction'])
        config['gameConfig']['finish'] = rotate_pos(config['gameConfig']['finish'])

        return config

    def _transform_player_direction(self, config: dict) -> dict:
        """Thay đổi hướng bắt đầu của người chơi."""
        player = config['gameConfig']['players'][0]
        current_dir = player['start'].get('direction', 0)
        
        # Chuyển đổi 'north', 'east'... thành số nếu cần
        dir_map = {'north': 0, 'east': 1, 'south': 2, 'west': 3}
        if isinstance(current_dir, str):
            current_dir = dir_map.get(current_dir.lower(), 0)

        possible_dirs = [d for d in [0, 1, 2, 3] if d != current_dir]
        new_dir = random.choice(possible_dirs)
        player['start']['direction'] = new_dir
        print(f"       - Đã thay đổi hướng bắt đầu của người chơi: {current_dir} -> {new_dir}")
        return config

    def _transform_items(self, config: dict) -> dict:
        """Tăng hoặc giảm số lượng vật phẩm (collectibles/interactibles)."""
        game_conf = config.get("gameConfig", {})
        collectibles = game_conf.get("collectibles", [])
        interactibles = game_conf.get("interactibles", [])

        # Ưu tiên xóa nếu có nhiều hơn 1 item
        if len(collectibles) > 1:
            item_to_remove = random.choice(collectibles)
            collectibles.remove(item_to_remove)
            print(f"       - Đã xóa 1 collectible: '{item_to_remove.get('type')}'")
            return config
        elif len(interactibles) > 1:
            item_to_remove = random.choice(interactibles)
            interactibles.remove(item_to_remove)
            print(f"       - Đã xóa 1 interactible: '{item_to_remove.get('type')}'")
            return config

        # Nếu không thể xóa, thử thêm (nếu có chỗ trống)
        all_blocks = game_conf.get("blocks", [])
        if not all_blocks: return config

        occupied_positions = set()
        # Lấy vị trí (x, z) của các khối đã bị chiếm dụng
        for item_list in [collectibles, interactibles, game_conf.get("obstacles", [])]:
            for item in item_list:
                pos = item.get("position")
                if pos:
                    occupied_positions.add((pos['x'], pos['z']))
        
        player_start_pos = game_conf.get("players", [{}])[0].get("start")
        if player_start_pos:
            occupied_positions.add((player_start_pos['x'], player_start_pos['z']))

        finish_pos = game_conf.get("finish")
        if finish_pos:
            occupied_positions.add((finish_pos['x'], finish_pos['z']))

        available_blocks = [b for b in all_blocks if (b.get("position", {}).get('x'), b.get("position", {}).get('z')) not in occupied_positions]
        if not available_blocks: return config

        # Thêm một crystal mới
        new_item_pos = random.choice(available_blocks).get("position")
        new_item = {
            "id": f"c{len(collectibles) + 1}",
            "type": "crystal",
            "position": {"x": new_item_pos["x"], "y": new_item_pos["y"] + 1, "z": new_item_pos["z"]}
        }
        collectibles.append(new_item)
        print(f"       - Đã thêm 1 collectible: 'crystal'")
        return config

    def _transform_obstacles(self, config: dict) -> dict:
        """Tăng hoặc giảm số lượng chướng ngại vật."""
        game_conf = config.get("gameConfig", {})
        obstacles = game_conf.get("obstacles", [])

        # Ưu tiên xóa nếu có nhiều hơn 1 chướng ngại vật
        if len(obstacles) > 1:
            item_to_remove = random.choice(obstacles)
            obstacles.remove(item_to_remove)
            print(f"       - Đã xóa 1 chướng ngại vật.")
            return config

        # Nếu không thể xóa, thử thêm (nếu có chỗ trống)
        all_blocks = game_conf.get("blocks", [])
        if not all_blocks: return config

        occupied_positions = set()
        # Lấy vị trí (x, z) của các khối đã bị chiếm dụng
        for item_list in [game_conf.get("collectibles", []), game_conf.get("interactibles", []), obstacles]:
            for item in item_list:
                pos = item.get("position")
                if pos:
                    occupied_positions.add((pos['x'], pos['z']))
        
        player_start_pos = game_conf.get("players", [{}])[0].get("start")
        if player_start_pos:
            occupied_positions.add((player_start_pos['x'], player_start_pos['z']))

        # Tìm các khối nền trống, không phải là điểm bắt đầu hoặc kết thúc
        finish_pos = game_conf.get("finish")
        if finish_pos:
            occupied_positions.add((finish_pos['x'], finish_pos['z']))
        available_blocks = [
            b for b in all_blocks
            if (b.get("position", {}).get('x'), b.get("position", {}).get('z')) not in occupied_positions
        ]
        if not available_blocks: return config

        # Thêm một chướng ngại vật mới
        new_item_pos = random.choice(available_blocks).get("position")
        new_obstacle = {
            "id": f"o{len(obstacles) + 1}",
            "type": "obstacle",
            "modelKey": "wall.brick01", # Model mặc định
            "position": {"x": new_item_pos["x"], "y": new_item_pos["y"] + 1, "z": new_item_pos["z"]}
        }
        obstacles.append(new_obstacle)
        print(f"       - Đã thêm 1 chướng ngại vật.")
        return config

    def generate_variant(self, variant_num: int) -> dict:
        """Tạo một gameConfig biến thể mới."""
        variant_config = copy.deepcopy(self.original_config)
        print(f"    -> Đang tạo biến thể 'var{variant_num}'...")

        # Bước 1: Luôn luôn thay đổi theme
        variant_config = self._transform_asset_theme(variant_config)

        # Bước 2: Áp dụng các biến đổi khác theo thứ tự ưu tiên
        transformation_priority = [
            self._transform_player_direction, # Ưu tiên 1: Đổi hướng bắt đầu
            self._transform_items,            # Ưu tiên 2: Thay đổi vật phẩm
            self._transform_obstacles,        # Ưu tiên 3: Thay đổi chướng ngại vật
        ]

        # Áp dụng xoay vòng các phép biến đổi dựa trên số thứ tự của biến thể
        transform_index = (variant_num - 2) % len(transformation_priority)
        chosen_transform = transformation_priority[transform_index]

        # [NÂNG CẤP] Kiểm tra điều kiện trước khi áp dụng xoay map
        if chosen_transform == self._transform_rotation: # Logic này có thể được mở rộng sau
             variant_config = self._transform_rotation(variant_config, random.choice([90, 180, 270]))
        else:
            variant_config = chosen_transform(variant_config)

        return variant_config

    def get_max_possible_variants(self) -> int:
        """
        Trả về số lượng các phép biến đổi có thể có, trừ đi phép đổi theme (luôn được áp dụng).
        Hiện tại có 3 phép biến đổi chính ngoài theme: đổi hướng, đổi item, xoay map.
        """
        return 3 # Gồm: _transform_player_direction, _transform_items, _transform_obstacles


def find_map_request_by_id(curriculum_dir: str, target_id: str) -> tuple[dict | None, str | None]:
    """Quét curriculum để tìm map_request gốc và tên topic."""
    base_id = re.sub(r'-var\d+$', '', target_id)
    for topic_filename in os.listdir(curriculum_dir):
        if not topic_filename.endswith('.json'): continue
        filepath = os.path.join(curriculum_dir, topic_filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            category_data = json.load(f)
        for topic in category_data.get("topics", []):
            for challenge in topic.get("challenges", []):
                if challenge.get("id") == base_id:
                    return challenge, topic.get("topic_name", "N/A")
    return None, None


def process_and_save_final_level(map_id: str, game_config: dict, map_request: dict, topic_name_vi: str, final_output_dir: str, toolbox_presets: dict):
    """Hàm tái sử dụng logic từ refine_and_solve để giải và lưu một level."""
    print(f"  -> Đang xử lý và lưu file cho ID: {map_id}")

    generation_config = map_request.get('generation_config', {})
    solution_config = map_request.get('solution_config', {})
    solution_config['logic_type'] = generation_config.get('logic_type')

    blockly_config_req = map_request.get('blockly_config', {})
    toolbox_preset_name = blockly_config_req.get('toolbox_preset')
    base_toolbox = copy.deepcopy(toolbox_presets.get(toolbox_preset_name, {}))
    
    events_category = {"kind": "category", "name": "%{BKY_GAMES_CATEVENTS}", "categorystyle": "events_category", "contents": [{"kind": "block", "type": "maze_start"}]}
    if 'contents' not in base_toolbox: base_toolbox['contents'] = []
    base_toolbox['contents'].insert(0, events_category)
    toolbox_data = base_toolbox

    requested_item_goals = copy.deepcopy(map_request.get('solution_config', {}).get('itemGoals', {}))
    final_item_goals = {}
    for item_type in requested_item_goals.keys():
        actual_count = 0
        if 'interactibles' in game_config['gameConfig']:
            actual_count += sum(1 for item in game_config['gameConfig']['interactibles'] if item.get('type') == item_type)
        if 'collectibles' in game_config['gameConfig']:
            actual_count += sum(1 for item in game_config['gameConfig']['collectibles'] if item.get('type') == item_type)
        final_item_goals[item_type] = actual_count
    solution_config['itemGoals'] = final_item_goals

    temp_level_for_solver = {
        "gameConfig": game_config['gameConfig'],
        "blocklyConfig": {"toolbox": toolbox_data},
        "solution": solution_config,
        "generation_config": generation_config
    }
    solution_result = solve_map_and_get_solution(temp_level_for_solver)
    if not solution_result:
        print(f"   - ❌ Lỗi: Solver không tìm thấy lời giải cho {map_id}. Bỏ qua.")
        return False

    pedagogical_program_dict = _rename_procedures_pedagogically(solution_result.get("program_solution_dict", {}), map_request)
    solution_result['program_solution_dict'] = pedagogical_program_dict

    final_inner_blocks, buggy_program_dict = '', None
    start_blocks_type = generation_config.get("params", {}).get("start_blocks_type", "empty")
    if start_blocks_type == "buggy_solution":
        bug_type = generation_config.get("params", {}).get("bug_type")
        bug_config = generation_config.get("params", {}).get("bug_config", {}) or {}
        buggy_program_dict = create_bug(bug_type, copy.deepcopy(pedagogical_program_dict), bug_config)
        if isinstance(buggy_program_dict, dict):
            final_inner_blocks = _create_xml_from_structured_solution(buggy_program_dict, solution_result.get("raw_actions", []))

    final_start_blocks = f"<xml>{final_inner_blocks}</xml>" if final_inner_blocks else "<xml><block type=\"maze_start\" deletable=\"false\" movable=\"false\"><statement name=\"DO\"></statement></block></xml>"

    topic_code_from_id = map_request.get('id', '').split('.')[1]
    topic_key = f"topic-title-{topic_code_from_id.lower()}"
    topic_name_en = TOPIC_TRANSLATIONS.get(topic_name_vi, topic_name_vi)
    final_translations = copy.deepcopy(map_request.get('translations', {}))
    if 'vi' in final_translations: final_translations['vi'][topic_key] = topic_name_vi
    if 'en' in final_translations: final_translations['en'][topic_key] = topic_name_en

    final_json_content = {
        "id": map_id, "gameType": "maze", "topic": topic_key, "level": map_request.get('level', 1),
        "titleKey": map_request.get('titleKey'), "questTitleKey": map_request.get('descriptionKey'),
        "descriptionKey": map_request.get('descriptionKey'), "translations": final_translations,
        "supportedEditors": ["blockly", "monaco"],
        "blocklyConfig": {"toolbox_preset": toolbox_preset_name, "toolbox": toolbox_data, "maxBlocks": (solution_result['block_count'] + 5), "startBlocks": final_start_blocks},
        "gameConfig": game_config['gameConfig'],
        "solution": {
            "type": "reach_target", "itemGoals": final_item_goals,
            "optimalBlocks": solution_result['block_count'],
            "optimalLines": calculate_optimal_lines_from_structured(solution_result.get('structuredSolution', {})),
            "rawActions": solution_result.get('raw_actions', []),
            "structuredSolution": solution_result.get('program_solution_dict', {}),
            "structuredSolution_fixbug_version": buggy_program_dict or solution_result.get('program_solution_dict', {})
        },
        "sounds": { "win": "/assets/maze/win.mp3", "fail": "/assets/maze/fail_pegman.mp3" }
    }

    filename = f"{map_id}.json"
    output_filepath = os.path.join(final_output_dir, filename)
    try:
        with open(output_filepath, 'w', encoding='utf-8') as f:
            json.dump(final_json_content, f, indent=2, ensure_ascii=False)
        print(f"    ✅ Đã tạo/cập nhật file game: {filename}")
        return True
    except Exception as e:
        print(f"   - ❌ Lỗi khi lưu file game {filename}: {e}")
        return False


def get_map_ids_from_editing_dir():
    """
    Quét thư mục EDITING-MAPS-LIST và trả về danh sách các ID map.
    """
    editing_maps_dir = os.path.join(PROJECT_ROOT, 'data', 'base_maps', 'EDITING-MAPS-LIST')
    map_ids = []

    print(f"🔍 Đang quét thư mục: '{editing_maps_dir}'...")
    try:
        if not os.path.exists(editing_maps_dir):
            os.makedirs(editing_maps_dir)
            print(f"📁 Thư mục '{editing_maps_dir}' không tồn tại, đã tự động tạo mới.")
            return []

        all_files = os.listdir(editing_maps_dir)
        basemap_files = sorted([f for f in all_files if f.startswith('BASEMAP.') and f.endswith('.json')])
        map_ids = [f.replace('BASEMAP.', '').replace('.json', '') for f in basemap_files]

        if map_ids:
            print(f"✅ Đã tìm thấy {len(map_ids)} map cần xử lý.")
        else:
            print("ℹ️ Không tìm thấy file base map nào trong thư mục EDITING-MAPS-LIST.")

    except Exception as e:
        print(f"❌ Lỗi khi quét thư mục: {e}")
    
    return map_ids


def process_single_map_and_variants(map_id: str, num_variants: int):
    """
    Hàm xử lý logic cho một map đơn lẻ: tinh chỉnh map gốc và tạo các biến thể.
    """
    print(f"\n{'='*20} BẮT ĐẦU XỬ LÝ MAP: {map_id} {'='*20}")
    print(f"Số biến thể mới cần tạo: {num_variants}")

    curriculum_dir = os.path.join(PROJECT_ROOT, 'data', 'curriculum')
    toolbox_filepath = os.path.join(PROJECT_ROOT, 'data', 'toolbox_presets.json')
    editing_maps_dir = os.path.join(PROJECT_ROOT, 'data', 'base_maps', 'EDITING-MAPS-LIST')
    final_output_dir = os.path.join(PROJECT_ROOT, 'data', 'final_game_levels')
    base_maps_dir = os.path.join(PROJECT_ROOT, 'data', 'base_maps')

    base_map_filename = f"BASEMAP.{map_id}.json"
    base_map_filepath = os.path.join(editing_maps_dir, base_map_filename)

    if not os.path.exists(base_map_filepath):
        print(f"❌ Lỗi: Không tìm thấy file base map '{base_map_filename}' trong thư mục EDITING-MAPS-LIST.")
        return False

    try:
        with open(base_map_filepath, 'r', encoding='utf-8') as f:
            adjusted_game_config = json.load(f)
        with open(toolbox_filepath, 'r', encoding='utf-8') as f:
            toolbox_presets = json.load(f)
    except Exception as e:
        print(f"❌ Lỗi khi đọc file cấu hình: {e}")
        return False

    map_request, topic_name_vi = find_map_request_by_id(curriculum_dir, map_id)
    if not map_request:
        print(f"❌ Lỗi: Không tìm thấy map_request gốc cho ID '{map_id}' trong curriculum.")
        return False

    print("\n--- Bước 1: Xử lý lại map đã hiệu chỉnh ---")
    success = process_and_save_final_level(map_id, adjusted_game_config, map_request, topic_name_vi, final_output_dir, toolbox_presets)

    if success:
        destination_filepath = os.path.join(base_maps_dir, base_map_filename)
        try:
            os.rename(base_map_filepath, destination_filepath)
            print(f"🚚 Đã di chuyển '{base_map_filename}' về thư mục 'base_maps'.")
        except OSError as e:
            print(f"   - ❌ Lỗi khi di chuyển file: {e}")

    print("\n--- Bước 2: Tạo các biến thể mới từ map đã hiệu chỉnh ---")
    config_generator = GameConfigVariantGenerator(adjusted_game_config)
    
    base_id_part = re.sub(r'-var\d+$', '', map_id)
    try:
        current_variant_num_match = re.search(r'-var(\d+)$', map_id)
        start_variant_num = int(current_variant_num_match.group(1)) + 1 if current_variant_num_match else 2
    except (IndexError, ValueError):
        start_variant_num = 2

    # [SỬA LỖI] Xử lý trường hợp num_variants = -1 (tạo tối đa)
    num_to_generate = num_variants
    if num_variants == -1:
        num_to_generate = config_generator.get_max_possible_variants()

    for i in range(num_to_generate):
        variant_num = start_variant_num + i
        new_map_id = f"{base_id_part}-var{variant_num}"
        
        variant_game_config = config_generator.generate_variant(variant_num)
        
        # [YÊU CẦU MỚI] Lưu lại base map cho biến thể vừa tạo
        new_basemap_filename = f"BASEMAP.{new_map_id}.json"
        new_basemap_filepath = os.path.join(base_maps_dir, new_basemap_filename)
        try:
            with open(new_basemap_filepath, 'w', encoding='utf-8') as f:
                json.dump(variant_game_config, f, indent=2, ensure_ascii=False)
            print(f"    💾 Đã tạo base map cho biến thể: {new_basemap_filename}")
        except Exception as e:
            print(f"   - ❌ Lỗi khi lưu base map cho biến thể {new_map_id}: {e}")

        process_and_save_final_level(new_map_id, variant_game_config, map_request, topic_name_vi, final_output_dir, toolbox_presets)
    return True


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
    parser = argparse.ArgumentParser(
        description="Tạo các biến thể từ một base_map đã được hiệu chỉnh thủ công.",
        formatter_class=argparse.RawTextHelpFormatter
    )
    parser.add_argument(
        'map_id',
        metavar='MAP_ID',
        type=str,
        nargs='?',  # Make the argument optional
        help="ID của base_map ĐÃ HIỆU CHỈNH (ví dụ: ...-var1).")
    parser.add_argument('--num_variants', type=int, default=2, help="Số lượng biến thể MỚI cần tạo (ví dụ: 2 sẽ tạo ra var2, var3).")
    args = parser.parse_args()
    
    all_map_ids = get_map_ids_from_editing_dir()
    
    if not all_map_ids:
        log_message("\nKhông có map nào để xử lý. Dừng chương trình.", "WARNING")
        return
    
    if args.map_id:
        return

    log_message("\n--- DANH SÁCH MAP CẦN TẠO BIẾN THỂ ---")
    for i, map_id in enumerate(all_map_ids):
        log_message(f"  [{i+1}] {map_id}")
    log_message("-----------------------------------------")

    map_ids_to_process = []

    while True:
        print("\nVui lòng chọn một tùy chọn:")
        print("  1. Chạy map với ID (nhập ID)")
        print("  2. Chọn map cần chạy từ danh sách (nhập số thứ tự)")
        print("  3. Chạy tất cả các map trong danh sách")
        
        choice = input("Nhập lựa chọn của bạn (1, 2, hoặc 3): ").strip()

        if choice == '1':
            map_id_input = input("Nhập Map ID cần chạy (ví dụ: COMMANDS_G34.CODING_COMMANDS_3D-MOVEMENT.COMPLEX_APPLY.C30-var1): ").strip()
            if map_id_input:
                if map_id_input.isdigit():
                    log_message(f"❌ Bạn đã nhập số '{map_id_input}'. Nếu bạn muốn chọn map từ danh sách theo số thứ tự, vui lòng chọn tùy chọn '2'.", "ERROR")
                    continue # Yêu cầu người dùng nhập lại lựa chọn
                map_ids_to_process = [map_id_input]
                break
            else:
                log_message("❌ ID không được để trống.", "ERROR")
        
        elif choice == '2':
            indices_input = input("Nhập số thứ tự các map, cách nhau bởi dấu phẩy (ví dụ: 1, 3, 5): ").strip()
            try:
                indices = [int(i.strip()) - 1 for i in indices_input.split(',')]
                selected_ids = []
                valid = True
                for idx in indices:
                    if 0 <= idx < len(all_map_ids):
                        selected_ids.append(all_map_ids[idx])
                    else:
                        log_message(f"❌ Số thứ tự không hợp lệ: {idx + 1}", "ERROR")
                        valid = False
                if valid and selected_ids:
                    map_ids_to_process = selected_ids
                    break
                elif not selected_ids:
                     log_message("❌ Bạn chưa chọn map nào.", "ERROR")
            except ValueError:
                log_message("❌ Định dạng không hợp lệ. Vui lòng nhập các số, cách nhau bởi dấu phẩy.", "ERROR")

        elif choice == '3':
            map_ids_to_process = all_map_ids
            log_message("🚀 Sẽ chạy lại tất cả các map...")
            break
        
        else:
            log_message("❌ Lựa chọn không hợp lệ. Vui lòng chọn 1, 2, hoặc 3.", "ERROR")

    # Hỏi số lượng biến thể cần tạo
    num_variants_to_generate = args.num_variants
    while True:
        print("\nVui lòng chọn số lượng biến thể MỚI cần tạo cho mỗi map:")
        print("  1. Nhập vào số lượng biến thể muốn tạo.")
        print("  2. Tạo tối đa số lượng biến thể có thể có.")
        choice = input("Nhập lựa chọn của bạn (1 hoặc 2): ").strip()

        if choice == '1':
            while True:
                try:
                    num_input = input(f"Nhập số lượng biến thể (mặc định là {args.num_variants}): ").strip()
                    num_variants_to_generate = int(num_input) if num_input else args.num_variants
                    if num_variants_to_generate < 0:
                        log_message("❌ Số lượng biến thể phải là một số không âm.", "ERROR")
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

    if num_variants_to_generate != -1:
        log_message(f"\n🚀 Sẽ xử lý {len(map_ids_to_process)} map, mỗi map tạo ra {num_variants_to_generate} biến thể mới.")
    else:
        log_message(f"\n🚀 Sẽ xử lý {len(map_ids_to_process)} map, mỗi map sẽ được tạo tối đa số biến thể.")
    
    success_count = 0
    fail_count = 0

    for map_id in map_ids_to_process:
        if process_single_map_and_variants(map_id, num_variants_to_generate):
            success_count += 1
        else:
            fail_count += 1

    log_message("\n================== TỔNG KẾT ==================")
    log_message(f"✅ Thành công: {success_count} map", "SUCCESS")
    log_message(f"❌ Thất bại:   {fail_count} map", "ERROR")
    log_message("==============================================")

    # [THÊM MỚI] Ghi file log tổng kết
    def write_log_file():
        timestamp = datetime.now().strftime("%Y%m%d_%H%M")
        log_filename = f"refine_and_generate_variants_log_{timestamp}.json"
        
        # Thư mục log: 'GenMapLog', nằm bên ngoài thư mục dự án 'GenMap'
        genmap_log_dir = os.path.join(os.path.dirname(PROJECT_ROOT), 'GenMapLog')
        log_filepath = os.path.join(genmap_log_dir, log_filename)

        if not os.path.exists(genmap_log_dir):
            os.makedirs(genmap_log_dir)

        log_data = {
            "timestamp": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            "summary": {
                "total_maps_processed": success_count + fail_count,
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

if __name__ == "__main__":
    main()