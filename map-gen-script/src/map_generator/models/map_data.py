# src/map_generator/models/map_data.py

import json
import os
import logging # [FIX] Import module logging
from typing import List, Tuple, Dict, Any

# Định nghĩa các kiểu dữ liệu tùy chỉnh
Coord = Tuple[int, int, int]
Item = Dict[str, Any]
Obstacle = Dict[str, Any]
logger = logging.getLogger(__name__) # [FIX] Khởi tạo logger

class MapData:
    """
    Lớp chứa toàn bộ dữ liệu cấu thành một map game hoàn chỉnh.
    Nó hoạt động như "bản thiết kế cuối cùng" trước khi được "phiên dịch"
    sang định dạng mà game engine có thể hiểu.
    """
    def __init__(self,
                 grid_size: Tuple[int, int, int],
                 start_pos: Coord,
                 target_pos: Coord,
                 items: List[Item] = None,
                 obstacles: List[Obstacle] = None,
                 # [QUAN TRỌNG] placement_coords giờ là nguồn dữ liệu chính cho nền đất
                 placement_coords: List[Coord] = None, 
                 params: Dict[str, Any] = None,
                 map_type: str = 'unknown',
                 logic_type: str = 'unknown',
                 # path_coords không còn quá cần thiết ở đây, nhưng giữ lại để debug
                 path_coords: List[Coord] = None,
                 # [MỚI] Thêm thuộc tính để lưu trữ thông tin nhánh phụ
                 branch_coords: List[List[Coord]] = None):
        
        self.grid_size = grid_size
        self.start_pos = start_pos
        self.target_pos = target_pos
        self.map_type = map_type
        self.logic_type = logic_type
        
        # Xử lý an toàn cho các tham số mặc định
        self.items = items or []
        self.obstacles = obstacles or []
        self.placement_coords = placement_coords or []
        self.path_coords = path_coords or [] # Giữ lại để debug
        self.params = params or {}
        self.branch_coords = branch_coords or [] # Khởi tạo thuộc tính mới

    def to_game_engine_dict(self) -> Dict[str, Any]:
        """
        [NÂNG CẤP] Chuyển đổi dữ liệu map sang định dạng "game engine".
        Logic được đơn giản hóa: chỉ "phiên dịch" những gì đã được cung cấp.
        """
        # --- Hàm tiện ích ---
        def coord_to_obj(coord: Coord, y_offset: int = 0) -> Dict[str, int]:
            return {"x": coord[0], "y": coord[1] + y_offset, "z": coord[2]}

        # --- Đọc theme từ params ---
        asset_theme = self.params.get('asset_theme', {})
        ground_model = asset_theme.get('ground', 'ground.normal')
        obstacle_model = asset_theme.get('obstacle', 'wall.brick01')

        game_blocks = []

        # --- Bước 1: Tạo Nền đất (Ground) ---
        # [TỐI ƯU HÓA] Logic giờ đây cực kỳ đơn giản. Topology đã xác định tất cả
        # các ô cần nền đất và đặt chúng vào `placement_coords`.
        logger.info(f"    -> MapData: Tạo nền đất cho {len(self.placement_coords)} ô từ placement_coords.")
        for pos in self.placement_coords:
            # Xử lý trường hợp một "ô" trong placement_coords là một dict tùy chỉnh
            if isinstance(pos, dict) and 'pos' in pos:
                coord = pos['pos']
                model = pos.get('modelKey', ground_model)
                game_blocks.append({"modelKey": model, "position": coord_to_obj(coord)})
            else: # Nếu là tuple tọa độ thông thường
                game_blocks.append({"modelKey": ground_model, "position": coord_to_obj(pos)})

        # --- Bước 2: Tạo Chướng ngại vật (Obstacles) ---
        for obs in self.obstacles:
            # Áp dụng y_offset=1 cho vật cản trên bề mặt (mặc định)
            # Giữ nguyên y_offset=0 cho vật cản là một phần của cấu trúc (ví dụ: bậc thang)
            y_offset = 1 if obs.get('is_surface_obstacle', True) else 0
            position = coord_to_obj(obs['pos'], y_offset=y_offset)
            
            model_key = obs.get('modelKey', obstacle_model)
            game_blocks.append({"modelKey": model_key, "position": position})

        # --- Bước 3: Đặt các Đối tượng Tương tác (Items) ---
        collectibles = []
        interactibles = []

        for i, item in enumerate(self.items):
            item_pos = coord_to_obj(item['pos'], y_offset=1) # Item luôn ở y+1 so với nền
            item_type = item.get('type')
            
            if item_type in ['crystal', 'gem', 'key']:
                collectibles.append({"id": f"c{i+1}", "type": item_type, "position": item_pos})
            elif item_type == 'switch':
                interactibles.append({
                    "id": f"s{i+1}", "type": item_type, "position": item_pos,
                    "initialState": item.get("initial_state", "off")
                })
        
        # --- Bước 4: Xác định Hướng bắt đầu của Người chơi ---
        start_direction = self.params.get('start_direction')
        if start_direction is None:
            dx = self.target_pos[0] - self.start_pos[0]
            dz = self.target_pos[2] - self.start_pos[2]
            if abs(dx) > abs(dz): start_direction = 1 if dx > 0 else 3
            elif abs(dz) > abs(dx): start_direction = 2 if dz > 0 else 0
            else: start_direction = 1 # Mặc định
        elif start_direction == "random":
            start_direction = random.randint(0, 3)

        # --- [MỚI] Bước 5: Thêm thông tin blockly_config ---
        # Lấy toolbox_preset từ params và đưa vào cấu trúc JSON
        blockly_config = {}
        if 'toolbox_preset' in self.params:
            blockly_config['toolbox_preset'] = self.params['toolbox_preset']

        # --- Bước 5: Hoàn thiện cấu trúc JSON ---
        return {
            "gameConfig": {
                "type": "maze",
                "renderer": "3d",
                "blocks": game_blocks,
                "players": [{
                    "id": "player1",
                    "start": {**coord_to_obj(self.start_pos, y_offset=1), "direction": start_direction}
                }],
                "collectibles": collectibles,
                "interactibles": interactibles,
                "finish": coord_to_obj(self.target_pos, y_offset=1),
                "blocklyConfig": blockly_config # Thêm thông tin toolbox vào đây
            }
        }

    def save_to_game_engine_json(self, filepath: str):
        """Lưu dữ liệu map vào một file JSON theo định dạng của game engine."""
        directory = os.path.dirname(filepath)
        os.makedirs(directory, exist_ok=True)
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(self.to_game_engine_dict(), f, indent=4, ensure_ascii=False)
            print(f"✅ Map (game format) đã được lưu thành công tại: {filepath}")
        except IOError as e:
            print(f"❌ Lỗi ghi file tại '{filepath}': {e}")

    # =========================================================================
    # [NEW Part 3.3] MAP HINTS FOR SOLVER
    # =========================================================================
    
    def get_solver_hints(self) -> Dict[str, Any]:
        """
        [NEW Part 3.3] Generate hints for solver based on map generation process.
        
        Returns:
            Dict with hints:
            - expected_path_length: int - Length of intended path
            - expected_turns: int - Number of direction changes
            - jump_locations: List[Coord] - Positions requiring jump
            - loop_patterns: List[Dict] - Detected repeating patterns
            - item_count: int - Number of collectibles
        """
        return {
            'expected_path_length': len(self.path_coords) if self.path_coords else 0,
            'expected_turns': self._count_direction_changes(),
            'jump_locations': self._identify_height_changes(),
            'loop_patterns': self._detect_repeating_sections(),
            'item_count': len(self.items),
            'has_switches': any(item.get('type') == 'switch' for item in self.items),
            'map_type': self.map_type,
            'logic_type': self.logic_type,
        }
    
    def _count_direction_changes(self) -> int:
        """
        [NEW Part 3.3] Count number of turns/direction changes in path.
        
        Returns:
            Number of direction changes
        """
        if not self.path_coords or len(self.path_coords) < 3:
            return 0
        
        turns = 0
        for i in range(1, len(self.path_coords) - 1):
            prev = self.path_coords[i - 1]
            curr = self.path_coords[i]
            next_pos = self.path_coords[i + 1]
            
            # Get direction vectors
            dx1, dz1 = curr[0] - prev[0], curr[2] - prev[2]
            dx2, dz2 = next_pos[0] - curr[0], next_pos[2] - curr[2]
            
            # Direction changed if vectors differ
            if (dx1, dz1) != (dx2, dz2):
                turns += 1
        
        return turns
    
    def _identify_height_changes(self) -> List[Coord]:
        """
        [NEW Part 3.3] Identify positions where player needs to jump (y changes).
        
        Returns:
            List of positions requiring height change
        """
        if not self.path_coords or len(self.path_coords) < 2:
            return []
        
        jump_locations = []
        for i in range(len(self.path_coords) - 1):
            curr = self.path_coords[i]
            next_pos = self.path_coords[i + 1]
            
            # Y coordinate changes means jump needed
            if curr[1] != next_pos[1]:
                jump_locations.append(curr)
        
        return jump_locations
    
    def _detect_repeating_sections(self) -> List[Dict[str, Any]]:
        """
        [NEW Part 3.3] Detect repeating patterns in path that suggest loops.
        
        Returns:
            List of pattern dicts with start_index, length, repetitions
        """
        if not self.path_coords or len(self.path_coords) < 6:
            return []
        
        patterns = []
        
        # Convert to relative movements for pattern detection
        movements = []
        for i in range(len(self.path_coords) - 1):
            curr = self.path_coords[i]
            next_pos = self.path_coords[i + 1]
            dx = next_pos[0] - curr[0]
            dy = next_pos[1] - curr[1]
            dz = next_pos[2] - curr[2]
            movements.append((dx, dy, dz))
        
        # Look for repeating sequences
        for seq_len in range(2, min(8, len(movements) // 2 + 1)):
            for start in range(len(movements) - seq_len):
                seq = tuple(movements[start:start + seq_len])
                reps = 1
                
                # Count how many times sequence repeats
                pos = start + seq_len
                while pos + seq_len <= len(movements):
                    next_seq = tuple(movements[pos:pos + seq_len])
                    if next_seq == seq:
                        reps += 1
                        pos += seq_len
                    else:
                        break
                
                if reps >= 2:
                    patterns.append({
                        'start_index': start,
                        'length': seq_len,
                        'repetitions': reps,
                    })
        
        # Remove overlapping patterns, keep longest
        if patterns:
            patterns.sort(key=lambda p: p['repetitions'] * p['length'], reverse=True)
            patterns = patterns[:3]  # Keep top 3
        
        return patterns