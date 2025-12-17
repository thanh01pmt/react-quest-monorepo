# src/map_generator/placements/island_tour_placer.py

import random
from .base_placer import BasePlacer
from src.map_generator.models.path_info import PathInfo
from typing import Dict, Any

class IslandTourPlacer(BasePlacer):
    """
    Placer chuyên dụng cho các map có nhiều đảo và bậc thang.
    [REFACTORED] Uses _exclude_ends and _base_layout helpers.
    """

    def place_items(self, path_info: PathInfo, params: dict) -> Dict[str, Any]:
        print("    LOG: Placing items with 'island_tour' logic...")

        obstacles = path_info.obstacles.copy() if path_info.obstacles else []

        # Xác định các "hòn đảo" - các khu vực bằng phẳng
        stair_coords = {tuple(obs['pos']) for obs in obstacles}
        all_coords = self._exclude_ends(path_info.placement_coords, path_info)
        island_coords = [p for p in all_coords if p not in stair_coords]

        items_to_place = self._resolve_item_quantities(params, len(island_coords))
        
        random.shuffle(island_coords)
        items = []
        for i, item_type in enumerate(items_to_place):
            if i < len(island_coords):
                items.append({"type": item_type, "pos": island_coords[i]})

        return self._base_layout(path_info, items, obstacles)