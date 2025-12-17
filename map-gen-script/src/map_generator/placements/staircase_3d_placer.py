# src/map_generator/placements/staircase_3d_placer.py

import random
from .base_placer import BasePlacer
from src.map_generator.models.path_info import PathInfo
from typing import Dict, Any

class Staircase3DPlacer(BasePlacer):
    """
    Đặt vật phẩm lên mỗi bậc của cầu thang 3D.
    [REFACTORED] Uses _exclude_ends and _base_layout helpers.
    """
    
    def place_items(self, path_info: PathInfo, params: dict) -> Dict[str, Any]:
        print("    LOG: Placing items with 'staircase_3d' logic...")

        coords_to_place_on = self._exclude_ends(path_info.path_coords, path_info)
        items_to_place = self._resolve_item_quantities(params, len(coords_to_place_on))
        
        random.shuffle(coords_to_place_on)
        items = []
        for i, item_type in enumerate(items_to_place):
            if i < len(coords_to_place_on):
                items.append({"type": item_type, "pos": coords_to_place_on[i]})

        return self._base_layout(path_info, items, path_info.obstacles or [])