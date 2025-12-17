# src/map_generator/placements/triangle_placer.py

import random
from .base_placer import BasePlacer
from src.map_generator.models.path_info import PathInfo
from typing import Dict, Any

class TrianglePlacer(BasePlacer):
    """
    Đặt các vật phẩm cho các map có dạng tam giác.
    [REFACTORED] Uses _exclude_ends and _base_layout helpers.
    """

    def place_items(self, path_info: PathInfo, params: dict) -> Dict[str, Any]:
        print("    LOG: Placing items with 'triangle' logic...")

        coords_for_items = self._exclude_ends(path_info.placement_coords, path_info)
        items_to_place = self._resolve_item_quantities(params, len(coords_for_items))
        
        random.shuffle(coords_for_items)
        items = []
        for i, item_type in enumerate(items_to_place):
            if i < len(coords_for_items):
                items.append({"type": item_type, "pos": coords_for_items[i]})

        return self._base_layout(path_info, items, path_info.obstacles or [])