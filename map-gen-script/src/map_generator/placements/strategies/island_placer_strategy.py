# src/map_generator/placements/strategies/island_placer_strategy.py
"""
ISLAND PLACER STRATEGY (Nâng cấp)

- Chuyên gia xử lý các map có cấu trúc "đảo" (symmetrical_islands, stepped_island_clusters...).
- [NÂNG CẤP] Kế thừa trực tiếp từ BasePlacer.
- [NÂNG CẤP] Đọc cấu trúc 'islands' từ `path_info.metadata`.
- [NÂNG CẤP] Xử lý đầy đủ các challenge_type: APPLY, REFACTOR, DEBUG.
"""

import random
from typing import List, Tuple, Dict, Set, Any, Iterator
from src.map_generator.models.path_info import PathInfo
# Import BasePlacer từ thư mục cha
import logging
from ..base_placer import BasePlacer

logger = logging.getLogger(__name__)

class IslandPlacerStrategy(BasePlacer):
    def place_item_variants(self, path_info: PathInfo, params: dict, max_variants: int) -> Iterator[Dict[str, Any]]:
        """
        [KIẾN TRÚC MỚI] Tạo ra các biến thể layout.
        Hiện tại, nó chỉ tạo ra một biến thể duy nhất bằng cách gọi place_items.
        """
        # Logic tạo nhiều biến thể có thể được thêm vào đây sau.
        yield self.place_items(path_info, params)

    def place_items(self, path_info: PathInfo, params: dict) -> Dict[str, Any]:
        self.path_info = path_info # Cần thiết để các hàm từ BasePlacer hoạt động
        challenge_type = params.get('challenge_type', 'SIMPLE_APPLY')
        
        items = []
        used_coords = set()

        # 1. Lấy thông tin cấu trúc từ metadata
        islands = path_info.metadata.get("islands", [])
        if not islands:
            logger.warning(f"Cảnh báo: Island Placer không tìm thấy 'islands' cho map '{params.get('map_type')}'.")
            return self._base_layout(path_info, [], path_info.obstacles)

        # 2. Đặt item dựa trên challenge_type
        logger.info(f"-> IslandPlacer: Áp dụng kịch bản '{challenge_type}'")
        
        if challenge_type == 'REFACTOR' or challenge_type == 'DEBUG_FIX_LOGIC':
            # REFACTOR: Đặt 1 item trên mỗi đảo để buộc người chơi phải ghé thăm tất cả.
            # DEBUG: Đặt 1 item trên mỗi đảo TRỪ MỘT đảo, tạo ra lỗi "bỏ sót nhiệm vụ".
            num_islands_to_place = len(islands)
            if challenge_type == 'DEBUG_FIX_LOGIC':
                num_islands_to_place -= 1
                logger.info(f"  -> DEBUG: Bỏ qua 1 đảo để tạo lỗi logic.")

            # Đảm bảo không có lỗi nếu chỉ có 1 đảo
            num_islands_to_place = max(1, num_islands_to_place)

            for i in range(num_islands_to_place):
                self._place_item_on_island(items, used_coords, islands[i], params, i)

        else: # Mặc định là SIMPLE_APPLY / COMPLEX_APPLY
            # Đặt item trên tất cả các đảo theo quy tắc trong params.
            for i, island_coords in enumerate(islands):
                self._place_item_on_island(items, used_coords, island_coords, params, i)
        
        # 3. Đặt các obstacles phụ (nếu có) bằng hàm từ BasePlacer
        item_counts = self._get_item_counts(params)
        obstacle_count = item_counts.get('obstacle', 0)
        # Lấy tất cả tọa độ có thể đi được từ tất cả các đảo
        all_coords = [coord for island in islands for coord in island]
        obstacles = self._place_obstacles(path_info, all_coords, used_coords, obstacle_count)

        # 4. Đóng gói và trả về layout hoàn chỉnh bằng hàm từ BasePlacer
        return self._base_layout(path_info, items, obstacles)

    def _place_item_on_island(self, items: List[Dict], used_coords: Set[Tuple], island_coords: List[Tuple], params: dict, island_index: int):
        """
        Hàm hỗ trợ đặt item trên một hòn đảo duy nhất.
        """
        # Đọc các quy tắc đặt item từ params
        item_types = params.get('items_to_place', ['crystal'])
        items_per_island = params.get('items_per_island', 1)
        placement_strategy = params.get('placement_strategy', 'random') 

        for _ in range(items_per_island):
            available_in_island = [c for c in island_coords if c not in used_coords]
            if not available_in_island:
                break

            pos_to_place = None
            if placement_strategy == 'highest_point':
                pos_to_place = max(available_in_island, key=lambda coord: coord[1])
            elif placement_strategy == 'end':
                pos_to_place = available_in_island[-1]
            elif placement_strategy == 'start':
                pos_to_place = available_in_island[0]
            elif placement_strategy == 'middle':
                pos_to_place = available_in_island[len(available_in_island) // 2]
            else: # Mặc định là ngẫu nhiên
                pos_to_place = random.choice(available_in_island)

            if pos_to_place:
                # Chọn loại item xoay vòng dựa trên chỉ số của đảo
                item_type = item_types[island_index % len(item_types)]
                if item_type == "switch":
                    items.append({"type": item_type, "pos": pos_to_place, "initial_state": "off"})
                else:
                    items.append({"type": item_type, "pos": pos_to_place})
                used_coords.add(pos_to_place)

# Tạo một instance để FunctionPlacer có thể import và sử dụng
island_placer_strategy = IslandPlacerStrategy()