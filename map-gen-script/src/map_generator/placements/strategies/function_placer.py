# src/map_generator/placements/function_placer.py
from .base_placer import BasePlacer
from src.map_generator.models.path_info import PathInfo
import logging
from typing import Dict, Any

from .strategies.branch_placer_strategy import branch_placer_strategy
from .strategies.segment_placer_strategy import segment_placer_strategy
from .strategies.island_placer_strategy import island_placer_strategy
from .strategies.parameter_shape_strategy import parameter_shape_strategy
from .strategies.complex_structure_strategy import complex_structure_strategy

logger = logging.getLogger(__name__)

class FunctionPlacer(BasePlacer):
    STRATEGY_MAP = {
        'branch': (branch_placer_strategy, {'h_shape', 'ef_shape', 'interspersed_path', 'plus_shape'}),
        'segment': (segment_placer_strategy, {'square_shape', 'staircase', 'star_shape', 'zigzag', 'triangle'}),
        'island': (island_placer_strategy, {'symmetrical_islands', 'plus_shape_islands', 'hub_with_stepped_islands'}),
        'parameter_shape': (parameter_shape_strategy, {'grid'}),
        'complex_structure': (complex_structure_strategy, {'complex_maze_2d', 'swift_playground_maze'}),
    }

    def place_items(self, path_info: PathInfo, params: dict) -> Dict[str, Any]:
        map_type = params.get('map_type')
        
        for strategy_name, (strategy_module, supported_maps) in self.STRATEGY_MAP.items():
            if map_type in supported_maps:
                logger.info(f"-> FunctionPlacer: Kích hoạt '{strategy_name.capitalize()} Placer Strategy' cho map '{map_type}'")
                return strategy_module.place_items(path_info, params)

        logger.warning(f"-> FunctionPlacer: Không có chiến lược chuyên biệt cho '{map_type}'. "
                       f"Sử dụng CommandObstaclePlacer làm giải pháp dự phòng.")
        
        from .command_obstacle_placer import CommandObstaclePlacer
        fallback_placer = CommandObstaclePlacer()
        return fallback_placer.place_items(path_info, params)