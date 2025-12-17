# src/map_generator/placements/strategies/base_strategy.py
"""
Lớp cơ sở cho tất cả các chiến lược đặt item của FunctionPlacer.
Cung cấp các hàm hỗ trợ chung để tránh lặp lại code.
"""
from src.map_generator.models.path_info import PathInfo
from collections import Counter
import random
from typing import List, Tuple, Dict, Set

Coord = Tuple[int, int, int]

class BaseFunctionStrategy:
    def place(self, path_info: PathInfo, params: dict) -> Tuple[List[Dict], List[Dict]]:
        """
        Hàm chính mà FunctionPlacer sẽ gọi.
        Các lớp con BẮT BUỘC phải override hàm này.
        """
        raise NotImplementedError("Các lớp con phải triển khai phương thức place()")

    # =======================================================
    # CÁC HÀM HỖ TRỢ CHUNG
    # =======================================================
    def _get_challenge_type(self, params: dict) -> str:
        return params.get('challenge_type', 'SIMPLE_APPLY')

    def _get_item_counts(self, params: dict) -> Counter:
        raw_items = params.get('items_to_place', [])
        if isinstance(raw_items, str):
            raw_items = [x.strip() for x in raw_items.split(',') if x.strip()]
        
        goal_counts = self._parse_goals(params.get('solution_item_goals', ''))
        
        counts = Counter(goal_counts)
        for item in raw_items:
            if item in ['crystal', 'gem', 'key', 'switch', 'obstacle']:
                counts[item] += 1
        return counts

    def _parse_goals(self, s: str) -> dict:
        g = {}
        if not s: return g
        for p in str(s).split(';'):
            if ':' in p:
                k, v_str = p.split(':', 1)
                try: g[k.strip()] = int(v_str.strip())
                except: g[k.strip()] = v_str.strip()
        return g

    def _place_obstacles(self, path_info: PathInfo, coords: List[Coord], used_coords: Set[Coord], count: int) -> List[Dict]:
        obstacles = list(path_info.obstacles)
        available_coords = [c for c in coords if c not in used_coords and c != path_info.start_pos and c != path_info.target_pos]
        
        num_to_place = min(count, len(available_coords))
        positions_to_place = random.sample(available_coords, num_to_place)
        
        for pos in positions_to_place:
            obstacles.append({"type": "obstacle", "pos": pos, "is_surface_obstacle": True})
            used_coords.add(pos)
        return obstacles