# src/map_generator/placements/strategies/complex_structure_strategy.py
"""
COMPLEX STRUCTURE STRATEGY

- Chuyên gia xử lý các thử thách Hàm/Thuật toán trên các map phức tạp,
  phi tuyến tính (complex_maze_2d, swift_playground_maze...).
- Phân tích cấu trúc map để tìm ra các "điểm chiến lược" (ngõ cụt, cuối platform)
  và đặt item vào đó.
"""

import random
import logging
from typing import List, Tuple, Dict, Set, Any, Iterator
from src.map_generator.models.path_info import PathInfo
from ..base_placer import BasePlacer

logger = logging.getLogger(__name__)

class ComplexStructureStrategy(BasePlacer):
    def place_item_variants(self, path_info: PathInfo, params: dict, max_variants: int) -> Iterator[Dict[str, Any]]:
        """
        [KIẾN TRÚC MỚI] Tạo ra các biến thể layout.
        Hiện tại, nó chỉ tạo ra một biến thể duy nhất bằng cách gọi place_items.
        """
        # Logic tạo nhiều biến thể có thể được thêm vào đây sau.
        yield self.place_items(path_info, params)

    def place_items(self, path_info: PathInfo, params: dict, **kwargs) -> Dict[str, Any]:
        self.path_info = path_info
    def place_items(self, path_info: PathInfo, params: dict, **kwargs) -> Dict[str, Any]:
        self.path_info = path_info
        items = []
        used_coords = set()

        # 1. Tìm các vị trí chiến lược (Placement Coords) TRƯỚC
        # Lấy các cấu trúc con từ metadata (ví dụ: các platforms của swift_playground_maze)
        sub_structures = path_info.metadata.get("platforms", [self._get_coords(path_info)])
        logger.info(f"-> ComplexStructureStrategy: Phân tích {len(sub_structures)} cấu trúc con.")

        placement_coords = []
        # Tìm các "điểm cuối" hoặc "ngõ cụt" trong mỗi cấu trúc con
        for structure_coords in sub_structures:
            # Logic tìm ngõ cụt đơn giản
            dead_ends = self._find_dead_ends(structure_coords)
            if dead_ends:
                # Chọn một ngõ cụt ngẫu nhiên từ mỗi cấu trúc
                placement_coords.append(random.choice(dead_ends))
            elif structure_coords:
                # Nếu không có ngõ cụt, lấy điểm cuối cùng của cấu trúc
                placement_coords.append(structure_coords[-1])

        random.shuffle(placement_coords)
        available_slots = len(placement_coords)

        # 2. Tính toán số lượng và loại item dựa trên available_slots (Smart Quantity)
        # Sử dụng _resolve_item_quantities thay vì tự parse manual để hỗ trợ 'all', 'ratio'
        items_to_place_types = self._resolve_item_quantities(params, available_slots)
        
        # [Systemic Fix] Nếu items_to_place_types rỗng nhưng có item_count legacy
        if not items_to_place_types and params.get('item_count'):
            count = int(params.get('item_count'))
            item_type = params.get('item_type', 'crystal')
            items_to_place_types = [item_type] * count

        # Đặt item vào các vị trí chiến lược đã tìm thấy
        for i in range(min(len(items_to_place_types), len(placement_coords))):
            pos = placement_coords[i]
            if pos not in used_coords:
                item_type = items_to_place_types[i]
                items.append({"type": item_type, "pos": pos})
                used_coords.add(pos)
                logger.info(f"      -> Đã đặt '{item_type}' tại điểm chiến lược {pos}")

        # Đặt các obstacles phụ (thường không cần cho map maze)
        all_coords = [coord for struct in sub_structures for coord in struct]
        item_counts = self._get_item_counts(params)
        obstacles = self._place_obstacles(path_info, all_coords, used_coords, item_counts.get('obstacle', 0))

        return self._base_layout(path_info, items, obstacles)

    def _find_dead_ends(self, structure_coords: List[Tuple[int, int, int]]) -> List[Tuple[int, int, int]]:
        """Tìm các ô ngõ cụt (chỉ có 1 hàng xóm) trong một cấu trúc."""
        coords_set = set(structure_coords)
        dead_ends = []
        
        for coord in structure_coords:
            if coord == self.path_info.start_pos or coord == self.path_info.target_pos:
                continue
            
            x, y, z = coord
            neighbor_count = 0
            # Kiểm tra hàng xóm 3D (x, y, z)
            for dx, dy, dz in [(0,0,1), (0,0,-1), (1,0,0), (-1,0,0), (0,1,0), (0,-1,0)]:
                if (x + dx, y + dy, z + dz) in coords_set:
                    neighbor_count += 1
            
            if neighbor_count == 1:
                dead_ends.append(coord)
                
        return dead_ends

# Tạo một instance để FunctionPlacer có thể import và sử dụng
complex_structure_strategy = ComplexStructureStrategy()