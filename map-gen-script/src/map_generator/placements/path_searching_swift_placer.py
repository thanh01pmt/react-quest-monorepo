# src/map_generator/placements/path_searching_swift_placer.py

import random
import logging
from typing import List, Tuple, Dict, Any, Optional, Iterator

from .base_placer import BasePlacer
from src.map_generator.models.path_info import PathInfo, Coord

logger = logging.getLogger(__name__)

class PathSearchingSwiftPlacer(BasePlacer):
    """
    Placer chuyên dụng cho swift_playground_maze khi cần tìm đường thẳng.
    [REFACTORED] Uses _exclude_ends and _base_layout helpers.
    """

    def _is_segment_straight(self, segment: List[Coord]) -> bool:
        if len(segment) < 2: return True
        first_x, _, first_z = segment[0]
        all_x_same = all(coord[0] == first_x for coord in segment)
        all_z_same = all(coord[2] == first_z for coord in segment)
        return all_x_same or all_z_same

    def _find_best_straight_segment(self, path_coords: List[Coord], requested_length: int) -> Optional[List[Coord]]:
        if not path_coords: return None

        if requested_length > 0 and requested_length <= len(path_coords):
            for i in range(len(path_coords) - requested_length + 1):
                segment = path_coords[i : i + requested_length]
                if self._is_segment_straight(segment):
                    return segment

        start_length = min(requested_length - 1, len(path_coords))
        for length in range(start_length, 1, -1):
            for i in range(len(path_coords) - length + 1):
                segment = path_coords[i : i + length]
                if self._is_segment_straight(segment):
                    return segment
        return None

    def place_items(self, path_info: PathInfo, params: dict, grid_size: Coord = (25, 25, 25)) -> Dict[str, Any]:
        logger.info("-> PathSearchingSwiftPlacer: Kích hoạt logic tìm đường thẳng.")

        requested_length = int(params.get('path_length', 5))
        found_segment = self._find_best_straight_segment(path_info.path_coords, requested_length)

        if not found_segment:
            logger.error("PathSearchingSwiftPlacer: Không tìm thấy đoạn thẳng. Trả về layout trống.")
            return self._base_layout(path_info, [], [])

        path_info.start_pos = found_segment[0]
        path_info.target_pos = found_segment[-1]
        path_info.path_coords = found_segment

        available_coords = found_segment[1:-1]
        items_to_place = self._resolve_item_quantities(params, len(available_coords))
        
        random.shuffle(available_coords)
        items = []
        for i, item_type in enumerate(items_to_place):
            if i < len(available_coords):
                items.append({"type": item_type, "pos": available_coords[i]})
                
        # Handle obstacles
        obstacle_count = int(params.get('obstacle_count', 0))
        item_positions = {tuple(item['pos']) for item in items}
        remaining_coords = [c for c in available_coords if tuple(c) not in item_positions]
        obstacles = path_info.obstacles.copy() if path_info.obstacles else []
        for i in range(min(obstacle_count, len(remaining_coords))):
            obstacles.append({'pos': remaining_coords[i], 'is_surface_obstacle': True})

        return self._base_layout(path_info, items, obstacles)