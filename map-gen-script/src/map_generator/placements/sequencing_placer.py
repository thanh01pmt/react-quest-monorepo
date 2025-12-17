# src/map_generator/placements/sequencing_placer.py

from .base_placer import BasePlacer
from src.map_generator.models.path_info import PathInfo
from src.utils.randomizer import shuffle_list
import random

class SequencingPlacer(BasePlacer):
    """
    (Nâng cấp) Đặt các đối tượng cho thử thách tuần tự.
    
    [NEW] Hỗ trợ 3 modes:
    - 'explicit': Dùng items_to_place y chang (backward compatible)
    - 'auto': Tự tính số lượng dựa trên map size, difficulty
    - 'ratio': Lấp một tỷ lệ của available slots
    """

    def place_items(self, path_info: PathInfo, params: dict) -> dict:
        print("    LOG: Placing items with 'sequencing' logic (SMART QUANTITY)...")

        # [SỬA LỖI] Loại bỏ vị trí bắt đầu và kết thúc khỏi danh sách các ô có thể đặt.
        possible_coords = [p for p in path_info.path_coords if p != path_info.start_pos and p != path_info.target_pos]
        available_slots = shuffle_list(possible_coords)
        
        # [NEW] Sử dụng smart quantity resolution
        # Nếu quantity_mode = 'auto' hoặc 'ratio', sẽ tự tính số lượng
        # Nếu không, giữ nguyên behavior cũ (explicit list)
        items_to_place = self._resolve_item_quantities(params, len(available_slots))
        
        # [CẢI TIẾN] Đọc số lượng vật cản từ `obstacle_count`
        # [NEW] Nếu obstacle_count không có, tính dựa trên difficulty
        obstacle_count = params.get('obstacle_count', 0)
        
        # [NEW] Auto obstacle count nếu quantity_mode = 'auto' và chưa có obstacle_count
        if params.get('quantity_mode') == 'auto' and obstacle_count == 0:
            difficulty = params.get('difficulty', 'medium')
            difficulty_obstacle_base = {'easy': 0, 'medium': 1, 'hard': 2, 'expert': 3}
            obstacle_count = difficulty_obstacle_base.get(difficulty, 1)

        # Kiểm tra để đảm bảo có đủ chỗ cho cả vật phẩm và vật cản
        total_objects = len(items_to_place) + obstacle_count
        if len(available_slots) < total_objects:
            print(f"   ⚠️ Cảnh báo: Đường đi không đủ dài để đặt {total_objects} đối tượng.")
            # Cắt bớt danh sách nếu không đủ chỗ
            while len(available_slots) < len(items_to_place) + obstacle_count:
                if obstacle_count > 0:
                    obstacle_count -= 1
                elif items_to_place:
                    items_to_place.pop()

        items = []
        obstacles = []
        
        # Đặt chướng ngại vật trước
        for _ in range(obstacle_count):
            if available_slots:
                pos = available_slots.pop()
                obstacles.append({"type": "obstacle", "pos": pos})
        
        # Đặt vật phẩm vào các vị trí còn lại
        for item_type in items_to_place:
            if available_slots:
                pos = available_slots.pop()
                if item_type == "switch":
                    initial_state = "off"
                    items.append({"type": item_type, "pos": pos, "initial_state": initial_state})
                else:
                    items.append({"type": item_type, "pos": pos})

        # [NEW] Log kết quả để debug
        print(f"    LOG: Placed {len(items)} items, {len(obstacles)} obstacles (mode={params.get('quantity_mode', 'explicit')})")

        return {
            "start_pos": path_info.start_pos,
            "target_pos": path_info.target_pos,
            "items": items,
            "obstacles": obstacles
        }