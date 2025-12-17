# src/map_generator/placements/swift_playground_placer.py

import random
import logging
from .base_placer import BasePlacer
from src.map_generator.models.path_info import PathInfo
from typing import Dict, Any

logger = logging.getLogger(__name__)

class SwiftPlaygroundPlacer(BasePlacer):
    """
    Đặt vật phẩm chiến lược trên các "sàn" của mê cung nhiều tầng.
    [REFACTORED] Uses _exclude_ends and _base_layout helpers.
    """

    def place_items(self, path_info: PathInfo, params: dict) -> Dict[str, Any]:
        logger.info("    LOG: Placing items with 'swift_playground_placer' logic...")
        
        obstacles = path_info.obstacles.copy() if path_info.obstacles else []
        stair_coords = {tuple(obs['pos']) for obs in obstacles}

        all_coords = self._exclude_ends(path_info.placement_coords, path_info)
        possible_coords = [p for p in all_coords if p not in stair_coords]
        
        items_to_place = self._resolve_item_quantities(params, len(possible_coords))
        
        random.shuffle(possible_coords)
        items = []
        for i, item_type in enumerate(items_to_place):
            if i < len(possible_coords):
                if item_type == "switch":
                    items.append({"type": "switch", "pos": possible_coords[i], "initial_state": "off"})
                else:
                    items.append({"type": item_type, "pos": possible_coords[i]})

        return self._base_layout(path_info, items, obstacles)