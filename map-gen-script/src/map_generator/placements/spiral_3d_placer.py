# src/map_generator/placements/spiral_3d_placer.py

import random
from .base_placer import BasePlacer
from src.map_generator.models.path_info import PathInfo
from typing import Dict, Any

class Spiral3DPlacer(BasePlacer):
    """
    Đặt vật phẩm cho map xoắn ốc 3D.
    [REFACTORED] Uses _exclude_ends and _base_layout helpers.
    """
    
    def place_items(self, path_info: PathInfo, params: dict) -> Dict[str, Any]:
        print("    LOG: Placing items with 'spiral_3d' logic...")

        possible_coords = self._exclude_ends(path_info.path_coords, path_info)
        items_to_place = self._resolve_item_quantities(params, len(possible_coords))
        
        # Distribute evenly along path
        items = []
        num_items = len(items_to_place)
        if num_items > 0 and len(possible_coords) >= num_items:
            step = len(possible_coords) // (num_items + 1)
            if step == 0:
                step = 1
            
            for i, item_type in enumerate(items_to_place):
                index = min((i + 1) * step, len(possible_coords) - 1)
                items.append({"type": item_type, "pos": possible_coords[index]})
        else:
            # Fallback: place randomly
            random.shuffle(possible_coords)
            for i, item_type in enumerate(items_to_place):
                if i < len(possible_coords):
                    items.append({"type": item_type, "pos": possible_coords[i]})

        return self._base_layout(path_info, items, path_info.obstacles or [])