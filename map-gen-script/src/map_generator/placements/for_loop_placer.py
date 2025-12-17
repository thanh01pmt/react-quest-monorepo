# src/map_generator/placements/for_loop_placer.py

import random
from .base_placer import BasePlacer
from typing import Iterator, Dict, Any
from src.map_generator.models.path_info import PathInfo, Coord
from .item_quantity import calculate_item_quantities  # [NEW] Smart quantity
import logging
logger = logging.getLogger(__name__)


class ForLoopPlacer(BasePlacer):
    """
    Đặt các vật phẩm theo một quy luật lặp lại nhất quán.
    
    [NEW] Hỗ trợ smart quantity:
    - Nếu quantity_mode = 'auto': tự tính item_count
    - Nếu không: giữ nguyên behavior cũ
    
    Placer này được thiết kế để hoạt động với nhiều loại Topology khác nhau
    (StraightLine, Staircase, Square, PlowingField) để tạo ra các thử thách
    về Vòng lặp For.
    """ 
    def place_item_variants(self, path_info: PathInfo, params: dict, max_variants: int) -> Iterator[Dict[str, Any]]:
        """
        [KIẾN TRÚC MỚI] Tạo ra các biến thể layout.
        """
        yield self.place_items(path_info, params)

    def place_items(self, path_info: PathInfo, params: dict, **kwargs) -> Dict[str, Any]:
        """
        Nhận một con đường có cấu trúc và đặt vật phẩm lên các điểm quan trọng.
        
        [SYSTEMIC FIX] Sử dụng LinearPlacerStrategy để đảm bảo tính quy luật (Equidistant)
        """
        self.path_info = path_info
        
        # Thay vì logic random cũ, ta ủy quyền cho chiến lược tuyến tính.
        from .strategies.linear_placer_strategy import linear_placer_strategy
        
        # Inject params để LinearPlacer hiểu
        # Loop thường cần pattern 'interval'
        if 'placement_pattern' not in params:
             params['placement_pattern'] = 'interval'
        
        # Gọi strategy
        logger.info("-> ForLoopPlacer: Delegating to LinearPlacerStrategy for patterned placement.")
        return linear_placer_strategy.place_items(path_info, params)