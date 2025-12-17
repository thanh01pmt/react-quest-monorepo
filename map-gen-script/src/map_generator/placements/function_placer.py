# src/map_generator/placements/function_placer.py
"""
FUNCTION PLACER - PHIÊN BẢN HOÀN CHỈNH (KIẾN TRÚC BỘ ĐIỀU PHỐI 5 SAO)

- Kế thừa BasePlacer để đảm bảo tính nhất quán.
- Hoạt động như một "Bộ điều phối", không trực tiếp đặt item.
- Phân loại `map_type` và ủy quyền hoàn toàn cho 5 module Strategy chuyên biệt.
- Các Strategy con đều kế thừa BasePlacer và tự chịu trách nhiệm trả về layout hoàn chỉnh.
"""

from .base_placer import BasePlacer
from src.map_generator.models.path_info import PathInfo
from typing import Dict, Any, Iterator

# Import CÁC INSTANCE của tất cả 5 chiến lược con.
from .strategies.branch_placer_strategy import branch_placer_strategy
from .strategies.segment_placer_strategy import segment_placer_strategy
from .strategies.island_placer_strategy import island_placer_strategy
from .strategies.parameter_shape_strategy import parameter_shape_strategy
from .strategies.complex_structure_strategy import complex_structure_strategy
from .strategies.linear_placer_strategy import linear_placer_strategy # [NEW]

import logging
logger = logging.getLogger(__name__)

class FunctionPlacer(BasePlacer):
    """
    Hoạt động như một "Bộ điều phối" (Dispatcher).
    Nó chọn một "Chuyên gia" (Strategy) phù hợp dựa trên `map_type`
    và ủy quyền toàn bộ công việc cho nó.
    """

    # [NÂNG CẤP] Bản đồ chiến lược giờ đây bao gồm tất cả 5 chuyên gia.
    # [FIX] Thêm staircase_3d và spiral_3d để tránh fallback
    STRATEGY_MAP = {
        'linear': (linear_placer_strategy,
                   {'straight_line', 'spiral_path', 'spiral_3d', 'simple_path'}), # [FIX] Thêm spiral_3d

        'branch': (branch_placer_strategy, 
                   {'h_shape', 'ef_shape', 'interspersed_path', 'plus_shape'}),
        
        'segment': (segment_placer_strategy, 
                    {'square_shape', 'staircase', 'staircase_3d', 'star_shape', 'zigzag', 'triangle', 
                     'u_shape', 'l_shape', 's_shape'}), # [FIX] Thêm staircase_3d
        
        'island': (island_placer_strategy, 
                   {'symmetrical_islands', 'plus_shape_islands'}),
        
        'parameter_shape': (parameter_shape_strategy, 
                            {'grid'}), # [REDUCED] Chỉ còn Grid cho bài vẽ hình random
        
        'complex_structure': (complex_structure_strategy, 
                              {'complex_maze_2d', 'swift_playground_maze', 'hub_with_stepped_islands'}),
    }

    def place_item_variants(self, path_info: PathInfo, params: dict, max_variants: int) -> Iterator[Dict[str, Any]]:
        """
        [KIẾN TRÚC MỚI] Tìm và ủy quyền cho chiến lược con phù hợp để sinh biến thể.
        """
        map_type = params.get('map_type')
        
        # [NEW] Inject logic_type vào params để sub-strategies có thể detect
        params_with_logic = {**params, 'logic_type': 'function_logic'}
        
        for strategy_name, (strategy_module, supported_maps) in self.STRATEGY_MAP.items():
            if map_type in supported_maps:
                logger.info(f"-> FunctionPlacer: Ủy quyền tạo biến thể cho '{strategy_name.capitalize()} Placer Strategy'")
                yield from strategy_module.place_item_variants(path_info, params_with_logic, max_variants)
                return

        logger.warning(f"-> FunctionPlacer: Không có chiến lược chuyên biệt cho '{map_type}'. Dùng Placer dự phòng.")
        from .command_obstacle_placer import CommandObstaclePlacer
        yield from CommandObstaclePlacer().place_item_variants(path_info, params_with_logic, max_variants)

    def place_items(self, path_info: PathInfo, params: dict, **kwargs) -> Dict[str, Any]:
        """
        Phương thức chính. Tìm và ủy quyền cho chiến lược con phù hợp.
        """
        map_type = params.get('map_type')
        
        # Duyệt qua bản đồ chiến lược để tìm module phù hợp
        for strategy_name, (strategy_module, supported_maps) in self.STRATEGY_MAP.items():
            if map_type in supported_maps:
                logger.info(f"-> FunctionPlacer: Kích hoạt '{strategy_name.capitalize()} Placer Strategy' cho map '{map_type}'")
                
                # Ủy quyền hoàn toàn. `strategy_module` là một Placer đầy đủ,
                # nó sẽ tự xử lý và trả về một dictionary layout hoàn chỉnh.
                return strategy_module.place_items(path_info, params, **kwargs)

        # ====================================================================
        # TRƯỜNG HỢP DỰ PHÒNG (FALLBACK)
        # ====================================================================
        logger.warning(f"-> FunctionPlacer: Không có chiến lược chuyên biệt cho '{map_type}'. "
                       f"Sử dụng CommandObstaclePlacer làm giải pháp dự phòng.")
        
        # Import tại chỗ để tránh lỗi import vòng lặp (circular import)
        from .command_obstacle_placer import CommandObstaclePlacer
        
        # Khởi tạo và gọi Placer dự phòng, trả về trực tiếp kết quả của nó.
        fallback_placer = CommandObstaclePlacer()
        return fallback_placer.place_items(path_info, params, **kwargs)