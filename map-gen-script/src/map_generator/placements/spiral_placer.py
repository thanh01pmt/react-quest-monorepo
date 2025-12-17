# src/map_generator/placements/spiral_placer.py

import random
import copy
from .base_placer import BasePlacer
from src.map_generator.models.path_info import PathInfo
from typing import Iterator, Dict, Any

class SpiralPlacer(BasePlacer):
    """
    Đặt các vật phẩm cho map xoắn ốc 2D.
    [REFACTORED] Uses _exclude_ends and _base_layout helpers.
    """

    def place_item_variants(self, path_info: PathInfo, params: dict, max_variants: int) -> Iterator[Dict[str, Any]]:
        """Override để set path_mode trước khi place."""
        variant_params = copy.deepcopy(params)
        variant_params['path_mode'] = 'full_path'
        yield self.place_items(path_info, variant_params)

    def place_items(self, path_info: PathInfo, params: dict) -> Dict[str, Any]:
        print("    LOG: Placing items with 'spiral_placer' logic...")

        possible_coords = self._exclude_ends(path_info.path_coords, path_info)
        items_to_place = self._resolve_item_quantities(params, len(possible_coords))
        
        random.shuffle(possible_coords)
        items = []
        for i, item_type in enumerate(items_to_place):
            if i < len(possible_coords):
                items.append({"type": item_type, "pos": possible_coords[i]})

        return self._base_layout(path_info, items, [])