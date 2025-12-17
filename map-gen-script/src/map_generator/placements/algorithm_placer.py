# src/map_generator/placements/algorithm_placer.py
"""
ALGORITHM PLACER - PHIÊN BẢN NÂNG CẤP TOÀN DIỆN

- "Chuyên gia" về việc tạo ra các thử thách thuật toán phức tạp cho Topic 8.
- Kế thừa BasePlacer và sử dụng các hàm hỗ trợ chung.
- [NEW] Hỗ trợ smart item quantity.
- Hoạt động như một "Bộ điều phối", đọc `map_type` và `challenge_type`
  để tạo ra các kịch bản đa dạng: tìm kiếm, quét, tối ưu hóa lộ trình.
"""

from .base_placer import BasePlacer
from src.map_generator.models.path_info import PathInfo
from .item_quantity import calculate_item_quantities, DIFFICULTY_MULTIPLIER
import random
from typing import List, Tuple, Dict, Set, Any, Iterator
import logging

logger = logging.getLogger(__name__)
Coord = Tuple[int, int, int]

class AlgorithmPlacer(BasePlacer):
    def place_item_variants(self, path_info: PathInfo, params: dict, max_variants: int) -> Iterator[Dict[str, Any]]:
        """
        [KIẾN TRÚC MỚI] Tạo ra các biến thể layout.
        Hiện tại, nó chỉ tạo ra một biến thể duy nhất bằng cách gọi place_items.
        """
        yield self.place_items(path_info, params)

    def place_items(self, path_info: PathInfo, params: dict, **kwargs) -> Dict[str, Any]:
        """
        Phương thức chính để đặt vật phẩm.
        Dựa vào `logic_type` và `map_type` để chọn thuật toán phù hợp.
        """
        self.path_info = path_info
        map_type = params.get('map_type')
        logic_type = params.get('logic_type')

        logger.info(f"-> AlgorithmPlacer: Kích hoạt cho map '{map_type}' (Logic: {logic_type})")

        if map_type in ['complex_maze_2d', 'swift_playground_maze']:
            return self._place_for_search_algorithm(params)
        
        elif map_type == 'plowing_field' or logic_type == 'scan_algorithm':
            # [SYSTEMIC FIX] Sử dụng LinearPlacerStrategy (đã được update trong _place_randomly_on_path)
            return self._place_randomly_on_path(params)

        elif map_type in ['plus_shape_islands', 'symmetrical_islands', 'hub_with_stepped_islands']:
            return self._place_for_tour_algorithm(params)

        else:
            logger.warning(f"  -> Không có logic thuật toán chuyên biệt cho '{map_type}'. Dùng kịch bản mặc định.")
            # Fallback to linear if it looks like a sequence, or command obstacle otherwise
            return self._place_randomly_on_path(params)


    # ==================================================================
    # KỊCH BẢN 1: THUẬT TOÁN TÌM KIẾM (MAZE SOLVING)
    # ==================================================================
    def _place_for_search_algorithm(self, params: dict) -> Dict[str, Any]:
        """
        Đặt item ở những vị trí khó trong mê cung để thử thách thuật toán tìm kiếm.
        [NEW] Hỗ trợ smart quantity mode.
        """
        items = []
        used_coords = set()
        
        path_coords = self._get_coords(self.path_info)
        valid_coords = self._exclude_ends(path_coords, self.path_info)
        
        # [NEW] Smart quantity support
        quantity_mode = params.get('quantity_mode', 'explicit')
        if quantity_mode in ('auto', 'ratio'):
            items_to_place = self._resolve_item_quantities(params, len(valid_coords))
        else:
            item_counts = self._get_item_counts(params)
            items_to_place = [item for item, count in item_counts.items() if item != 'obstacle' for _ in range(count)]
        
        # Tìm các vị trí chiến lược: ngõ cụt
        dead_ends = self._find_dead_ends(path_coords)
        random.shuffle(dead_ends)
        
        placement_coords = dead_ends
        
        # Nếu không đủ, lấy thêm vị trí ngẫu nhiên
        if len(placement_coords) < len(items_to_place):
            other_coords = list(set(path_coords) - set(placement_coords) - {self.path_info.start_pos, self.path_info.target_pos})
            random.shuffle(other_coords)
            needed_more = len(items_to_place) - len(placement_coords)
            placement_coords.extend(other_coords[:needed_more])
        
        # Đặt item
        for i in range(min(len(items_to_place), len(placement_coords))):
            pos = placement_coords[i]
            item_type = items_to_place[i]
            items.append({"type": item_type, "pos": pos})
            used_coords.add(pos)
            logger.info(f"      -> Đã đặt '{item_type}' tại vị trí chiến lược {pos}")

        obstacles = self._place_obstacles(self.path_info, path_coords, used_coords, item_counts.get('obstacle', 0))
        return self._base_layout(self.path_info, items, obstacles)

    # ==================================================================
    # KỊCH BẢN 2 & 3: ỦY QUYỀN CHO PLACER CHUYÊN DỤNG
    # ==================================================================
    # [REMOVED] Hàm _place_for_scan_algorithm đã bị loại bỏ.
    # Logic của nó đã được thay thế bằng _place_randomly_on_path và bộ điều phối đã được cập nhật.
    # Điều này tránh được lỗi treo do ủy quyền sai cho ForLoopPlacer.
    
    def _place_for_tour_algorithm(self, params: dict) -> Dict[str, Any]:
        """Tạo kịch bản cho thuật toán tối ưu lộ trình bằng cách ủy quyền cho FunctionPlacer."""
        from .function_placer import FunctionPlacer
        logger.info("  -> Ủy quyền cho FunctionPlacer (và strategy con của nó) để xử lý map đảo.")
        
        # FunctionPlacer sẽ tự chọn strategy con phù hợp.
        temp_placer = FunctionPlacer()
        return temp_placer.place_items(self.path_info, params)

    def _place_randomly_on_path(self, params: dict) -> Dict[str, Any]:
        """
        [SYSTEMIC FIX] Đặt vật phẩm theo quy luật tuyến tính (Linear Algorithm).
        Thường dùng cho Scanning Algorithm (duyệt mảng/lưới).
        """
        from .strategies.linear_placer_strategy import linear_placer_strategy
        
        # Scanning Algorithm thường yêu cầu duyệt hết hoặc duyệt cách đều
        # Mặc định là 'fill_all' nếu không có chỉ định khác (để simulate Plowing Field harvest)
        if 'placement_pattern' not in params:
             # Nếu user không chỉ định, ta assume là Fill All cho Plowing Field
             # Tuy nhiên, nếu params có item_count nhỏ, LinearPlacer sẽ tự tính interval.
             # Tốt nhất là để 'interval' và để LinearPlacer tự quyết định dựa trên count.
             params['placement_pattern'] = 'interval'
        
        logger.info("  -> AlgorithmPlacer: Delegating 'scanning/random' to LinearPlacerStrategy.")
        return linear_placer_strategy.place_items(self.path_info, params)

    # ==================================================================
    # HÀM HỖ TRỢ
    # ==================================================================
    def _find_dead_ends(self, path_coords: List[Coord]) -> List[Coord]:
        """Tìm tất cả các ô là ngõ cụt (chỉ có 1 hàng xóm) trong một tập hợp các tọa độ đường đi."""
        path_coords_set = set(path_coords)
        dead_ends = []
        
        # Bỏ qua các ô không phải là đường đi chính để tránh lỗi
        valid_path_coords = [c for c in path_coords if c in path_coords_set]

        for coord in valid_path_coords:
            if coord == self.path_info.start_pos or coord == self.path_info.target_pos:
                continue
            
            x, y, z = coord
            neighbor_count = 0
            # Chỉ kiểm tra hàng xóm trên mặt phẳng XZ
            for dx, dz in [(0, 1), (0, -1), (1, 0), (-1, 0)]:
                if (x + dx, y, z + dz) in path_coords_set:
                    neighbor_count += 1
            
            if neighbor_count == 1:
                dead_ends.append(coord)
                
        return dead_ends