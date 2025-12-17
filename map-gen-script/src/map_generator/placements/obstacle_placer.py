# src/map_generator/placements/obstacle_placer.py

import random
from .base_placer import BasePlacer
from src.map_generator.models.path_info import PathInfo
from .item_quantity import calculate_item_quantities, DIFFICULTY_MULTIPLIER  # [NEW] Smart quantity

class ObstaclePlacer(BasePlacer):
    """
    Placer chuyên để đặt các chướng ngại vật (tường) lên đường đi,
    yêu cầu người chơi phải sử dụng lệnh 'jump'.
    
    [NEW] Hỗ trợ smart quantity:
    - Auto obstacle_count dựa trên difficulty
    - Auto items dựa trên available slots
    """

    def place_items(self, path_info: PathInfo, params: dict) -> dict:
        """
        Đặt các vật phẩm, công tắc và chướng ngại vật.
        
        [NEW] Hỗ trợ smart quantity khi quantity_mode = 'auto'
        """
        print("    LOG: Placing items and obstacles with 'obstacle' logic (SMART QUANTITY)...")

        items = []
        # Kế thừa danh sách chướng ngại vật từ Topology
        obstacles = path_info.obstacles.copy()

        # Lấy coords cho obstacles (ưu tiên placement_coords)
        coords_for_obstacles = path_info.placement_coords if path_info.placement_coords else path_info.path_coords
        possible_coords = [p for p in coords_for_obstacles if p != path_info.start_pos and p != path_info.target_pos]
        random.shuffle(possible_coords)

        quantity_mode = params.get('quantity_mode', 'explicit')
        difficulty = params.get('difficulty', 'medium')
        
        # ===========================================================
        # 1. ĐẶT CHƯỚNG NGẠI VẬT
        # ===========================================================
        obstacle_chance = params.get('obstacle_chance')
        
        if obstacle_chance is not None:
            # Đặt vật cản dựa trên xác suất
            coords_after_obstacles = []
            for pos in possible_coords:
                if random.random() < obstacle_chance:
                    obstacles.append({"type": "obstacle", "pos": pos})
                else:
                    coords_after_obstacles.append(pos)
            possible_coords = coords_after_obstacles
        else:
            # [NEW] Auto obstacle_count nếu quantity_mode = 'auto'
            num_obstacles = params.get('obstacle_count')
            
            if num_obstacles is None and quantity_mode == 'auto':
                # Tính obstacle count dựa trên difficulty và available slots
                base_obstacle_ratio = 0.15  # 15% slots sẽ có obstacles
                diff_mult = DIFFICULTY_MULTIPLIER.get(difficulty, 0.75)
                num_obstacles = max(1, int(len(possible_coords) * base_obstacle_ratio * diff_mult))
                print(f"    Smart obstacle count: {num_obstacles} (difficulty={difficulty})")
            elif num_obstacles is None:
                num_obstacles = 0
            
            for _ in range(min(num_obstacles, len(possible_coords))):
                pos = possible_coords.pop(0)
                obstacles.append({"type": "obstacle", "pos": pos})

        # ===========================================================
        # 2. ĐẶT VẬT PHẨM
        # ===========================================================
        items_to_place_raw = params.get('items_to_place', [])
        
        # [NEW] Sử dụng smart quantity resolution
        if quantity_mode in ('auto', 'ratio'):
            items_to_place = self._resolve_item_quantities(params, len(possible_coords))
        else:
            # Explicit mode - giữ nguyên behavior cũ
            if isinstance(items_to_place_raw, str):
                items_to_place = [items_to_place_raw]
            else:
                items_to_place = list(items_to_place_raw) if items_to_place_raw else []
        
        for item_type in items_to_place:
            if not possible_coords:
                print(f"    ⚠️ Cảnh báo: Không còn vị trí trống để đặt '{item_type}'.")
                break
            pos = possible_coords.pop(0)
            
            if item_type == "switch":
                items.append({"type": item_type, "pos": pos, "initial_state": "off"})
            else:
                items.append({"type": item_type, "pos": pos})

        print(f"    LOG: Placed {len(items)} items, {len(obstacles)} obstacles (mode={quantity_mode})")

        return {
            "start_pos": path_info.start_pos,
            "target_pos": path_info.target_pos,
            "items": items,
            "obstacles": obstacles
        }
