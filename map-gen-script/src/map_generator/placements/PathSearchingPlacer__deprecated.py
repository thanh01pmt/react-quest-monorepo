# src/map_generator/placements/path_searching_placer_corrected.py

import random
import logging
from typing import List, Tuple, Dict, Any, Optional, Iterator
from collections import Counter
from itertools import combinations

from .base_placer import BasePlacer
from src.map_generator.models.path_info import PathInfo

logger = logging.getLogger(__name__)
Coord = Tuple[int, int, int]

class PathSearchingPlacer(BasePlacer):
    # ... (Các hàm _is_segment_straight và _find_best_straight_segment giữ nguyên như cũ) ...
    def _is_segment_straight(self, segment: List[Coord]) -> bool:
        if len(segment) < 2: return True
        first_x, _, first_z = segment[0]
        all_x_same = all(coord[0] == first_x for coord in segment)
        all_z_same = all(coord[2] == first_z for coord in segment)
        return all_x_same or all_z_same

    def _find_best_straight_segment(self, path_coords: List[Coord], requested_length: int) -> Optional[List[Coord]]:
        if not path_coords:
            logger.warning("  -> PathSearchingPlacer: Không có path_coords để tìm kiếm.")
            return None

        logger.info(f"  -> PathSearchingPlacer: Bắt đầu tìm đoạn thẳng. Yêu cầu: {requested_length} ô. Đường đi có: {len(path_coords)} ô.")

        # Thử tìm với độ dài yêu cầu trước tiên
        if requested_length > 0 and requested_length <= len(path_coords):
            for i in range(len(path_coords) - requested_length + 1):
                segment = path_coords[i : i + requested_length]
                if self._is_segment_straight(segment):
                    logger.info(f"    -> LOG: Đã tìm thấy đoạn thẳng dài {requested_length} ô, đáp ứng đúng yêu cầu.")
                    return segment

        # Nếu không tìm thấy, hoặc yêu cầu quá dài, bắt đầu giảm dần độ dài
        start_length = min(requested_length - 1, len(path_coords))

        if start_length < 2:
            logger.warning(f"  -> PathSearchingPlacer: Không tìm thấy đoạn thẳng nào có độ dài >= 2.")
            return None

        logger.info(f"    -> LOG: Không tìm thấy đoạn dài {requested_length} ô. Bắt đầu giảm độ dài tìm kiếm từ {start_length} ô.")

        for length in range(start_length, 1, -1):
            for i in range(len(path_coords) - length + 1):
                segment = path_coords[i : i + length]
                if self._is_segment_straight(segment):
                    logger.info(f"    -> LOG: Đã tìm thấy đoạn thẳng phù hợp dài {length} ô.")
                    return segment

        logger.error("  -> PathSearchingPlacer: Không tìm thấy bất kỳ đoạn thẳng nào phù hợp (độ dài >= 2).")
        return None

    def place_item_variants(self, path_info: PathInfo, params: dict, max_variants: int) -> Iterator[Dict[str, Any]]:
        """
        [KIẾN TRÚC MỚI] Tạo ra các biến thể về vị trí đối tượng trên một cấu trúc map cho trước.
        """
        # --- Logic cốt lõi được chuyển từ generate_variants.py ---
        
        # 1. Phân tích và tìm vị trí hợp lệ
        valid_obstacle_coords = self._get_valid_obstacle_placements_from_path(path_info)
        
        # 2. Tạo các biến thể đặt Obstacle
        count = 0
        
        # Biến thể không có obstacle
        if count < max_variants:
            yield self._place_items_for_variant(path_info, params, obstacle_positions=[])
            count += 1

        # Các biến thể có obstacle
        can_jump = 'maze_jump' in params.get('available_blocks', []) # Phân tích năng lực từ params
        if can_jump and valid_obstacle_coords:
            max_obstacles_to_add = min(len(valid_obstacle_coords), 2)
            for num_obs in range(1, max_obstacles_to_add + 1):
                for positions in combinations(valid_obstacle_coords, num_obs):
                    if count >= max_variants: return
                    
                    yield self._place_items_for_variant(path_info, params, obstacle_positions=list(positions))
                    count += 1

    def _get_valid_obstacle_placements_from_path(self, path_info: PathInfo) -> List[Coord]:
        """
        Hàm helper để tìm vị trí đặt obstacle hợp lệ, tránh bước nhảy y+2.
        """
        path_coords = path_info.path_coords
        if len(path_coords) < 3: return []

        path_map = {(c[0], c[2]): c[1] for c in path_coords}
        valid_placements = []

        for i in range(1, len(path_coords) - 1):
            current_pos = path_coords[i]
            prev_pos = path_coords[i-1]
            next_pos = path_coords[i+1]

            current_y = current_pos[1]
            prev_y = path_map.get((prev_pos[0], prev_pos[2]), current_y)
            next_y = path_map.get((next_pos[0], next_pos[2]), current_y)

            obstacle_height = current_y + 1
            is_jump_from_prev_valid = abs(obstacle_height - prev_y) <= 1
            is_jump_to_next_valid = abs(next_y - obstacle_height) <= 1
            
            if is_jump_from_prev_valid and is_jump_to_next_valid:
                valid_placements.append(current_pos)
        
        return valid_placements

    def _place_items_for_variant(self, path_info: PathInfo, params: dict, obstacle_positions: List[Coord]) -> Dict[str, Any]:
        """Hàm helper để tạo một layout cụ thể với các vị trí obstacle đã cho."""
        variant_params = params.copy()
        variant_params['obstacle_positions'] = obstacle_positions
        return self.place_items(path_info, variant_params, (16,16,16)) # Gọi hàm place_items cũ

    def place_items(self, path_info: PathInfo, params: dict, grid_size: Coord) -> Dict[str, Any]:
        logger.info("-> PathSearchingPlacer: Kích hoạt logic tìm kiếm đường thẳng.")

        # ==================================================================
        # 1. TÌM KIẾM ĐOẠN THẲNG
        # ==================================================================
        requested_length = int(params.get('path_length', 0)) # Mặc định là 0 nếu không có
        found_segment = self._find_best_straight_segment(path_info.path_coords, requested_length)

        if not found_segment:
            logger.warning("PathSearchingPlacer: Không tìm thấy đoạn thẳng, sẽ sử dụng toàn bộ đường đi.")
            found_segment = path_info.path_coords

        # [BIG UPDATE] Gọi hàm xử lý các vị trí tường minh từ BasePlacer
        explicit_items, explicit_obstacles, used_coords = self._handle_explicit_placements(params, path_info)

        # ==================================================================
        # 2. XÁC ĐỊNH SỐ LƯỢNG ITEMS VÀ OBSTACLES
        # ==================================================================
        item_counts = self._get_item_counts(params)
        obstacle_count = int(params.get('obstacle_count', item_counts.get('obstacle', 0)))
        # [FIX] Tính toán lại số lượng vật cản ngẫu nhiên cần đặt.
        # Lấy tổng số yêu cầu trừ đi số lượng đã được đặt một cách tường minh.
        num_random_obstacles = obstacle_count - len(explicit_obstacles)
        # Chỉ lấy các item không có vị trí tường minh để đặt ngẫu nhiên
        random_items_to_place = [item for item in params.get('items_to_place', []) if isinstance(item, str)]
        items_to_place_types = [item for item, count in Counter(random_items_to_place).items() for _ in range(count)]
        num_items = len(items_to_place_types)
        
        # ==================================================================
        # 3. ĐẶT CÁC ĐỐI TƯỢNG LÊN ĐOẠN THẲNG ĐÃ TÌM THẤY
        # ==================================================================
        new_start_pos = found_segment[0]
        new_target_pos = found_segment[-1]
        
        # Lấy các vị trí có thể đặt, loại trừ các vị trí đã bị chiếm bởi các đối tượng tường minh
        available_coords = [c for c in found_segment[1:-1] if c not in used_coords]
        random.shuffle(available_coords)
        items = list(explicit_items) # Bắt đầu với các item tường minh
        # [FIX] Bắt đầu với các vật cản từ Topology và các vật cản tường minh.
        # Điều này đảm bảo các vật cản cấu trúc (tường, bậc thang) không bị mất.
        obstacles = list(path_info.obstacles) + list(explicit_obstacles)
        
        for i in range(min(num_items, len(available_coords))):
            pos = available_coords.pop(0)
            items.append({"type": items_to_place_types[i], "pos": pos})

        for i in range(min(num_random_obstacles, len(available_coords))):
            pos = available_coords.pop(0)            
            obstacles.append({'pos': pos, 'is_surface_obstacle': True})

        logger.info(f"  -> Tổng cộng đã đặt {len(items)} items và {len(obstacles)} obstacles.")

        # ==================================================================
        # 4. **[LOGIC SỬA ĐỔI QUAN TRỌNG]**
        #    CẬP NHẬT PATH_INFO ĐỂ TƯƠNG THÍCH VỚI MAPDATA
        # ==================================================================
        
        # [FIX] Không thay đổi placement_coords.
        # `placement_coords` gốc từ Topology (toàn bộ cấu trúc) sẽ được giữ lại
        # để MapData render toàn bộ nền.

        # Cập nhật các vị trí quan trọng và đường đi cho Solver
        path_info.start_pos = new_start_pos
        path_info.target_pos = new_target_pos
        path_info.path_coords = found_segment

        # Trả về layout. `obstacles` giờ đã chứa tất cả các loại vật cản.
        return self._base_layout(path_info, items, obstacles)