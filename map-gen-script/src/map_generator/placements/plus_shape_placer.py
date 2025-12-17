# src/map_generator/placements/plus_shape_placer.py

import random
from .base_placer import BasePlacer
from src.map_generator.models.path_info import PathInfo
from typing import Dict, Any

class PlusShapePlacer(BasePlacer):
    """
    Đặt các vật phẩm cho các map có dạng dấu cộng.
    [REFACTORED] Uses _exclude_ends and _base_layout helpers.
    """

    def place_items(self, path_info: PathInfo, params: dict) -> Dict[str, Any]:
        print("    LOG: Placing items with 'plus_shape' logic...")

        possible_coords = self._exclude_ends(path_info.placement_coords, path_info)
        items_to_place = self._resolve_item_quantities(params, len(possible_coords))
        
        random.shuffle(possible_coords)
        items = []
        for i, item_type in enumerate(items_to_place):
            if i < len(possible_coords):
                items.append({"type": item_type, "pos": possible_coords[i]})

        return self._base_layout(path_info, items, path_info.obstacles or [])