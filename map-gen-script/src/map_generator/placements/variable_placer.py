# src/map_generator/placements/variable_placer.py
"""
VARIABLE PLACER - PHIÊN BẢN NÂNG CẤP TOÀN DIỆN

- "Chuyên gia" tạo ra các kịch bản yêu cầu sử dụng Biến số (Topic 4).
- [NÂNG CẤP] Tích hợp hoàn toàn với BasePlacer, tái sử dụng code hỗ trợ.
- Hỗ trợ các kịch bản sư phạm: Đếm (Counter), Cập nhật (Update), Điều khiển Vòng lặp.
- Không phụ thuộc vào "logic_gate", thay vào đó tạo ra các thử thách yêu cầu
  người chơi tự xây dựng logic kiểm tra bằng code.
- [NEW] Hỗ trợ smart item quantity.
"""

from .base_placer import BasePlacer
from src.map_generator.models.path_info import PathInfo
from .item_quantity import calculate_item_quantities  # [NEW]
import random
import logging
from typing import List, Tuple, Dict, Set, Any, Iterator
 
logger = logging.getLogger(__name__)
Coord = Tuple[int, int, int]

class VariablePlacer(BasePlacer):
    def place_item_variants(self, path_info: PathInfo, params: dict, max_variants: int) -> Iterator[Dict[str, Any]]:
        """
        [KIẾN TRÚC MỚI] Tạo ra các biến thể layout.
        Hiện tại, nó chỉ tạo ra một biến thể duy nhất bằng cách gọi place_items.
        """
        # Logic tạo nhiều biến thể có thể được thêm vào đây sau.
        yield self.place_items(path_info, params)

    def place_items(self, path_info: PathInfo, params: dict, **kwargs) -> Dict[str, Any]:
        self.path_info = path_info
        logic_type = params.get('logic_type', 'variable_counter')

        logger.info(f"-> VariablePlacer: Kích hoạt logic '{logic_type}'")

        # ==================================================================
        # 1. CHUẨN HÓA INPUT & LẤY VỊ TRÍ (Sử dụng hàm từ BasePlacer)
        # ==================================================================
        item_counts = self._get_item_counts(params)
        obstacle_count = item_counts.get('obstacle', 0)
        
        coords = self._get_coords(path_info)
        valid_coords = self._exclude_ends(coords, path_info)
        
        items = []
        used_coords = set()

        # ==================================================================
        # 2. PHÂN LUỒNG LOGIC ĐẶT ITEM DỰA TRÊN LOGIC_TYPE
        # ==================================================================
        if logic_type == 'variable_counter':
            # Kịch bản: Đếm vật phẩm.
            # Sử dụng LinearPlacerStrategy để đặt item đều nhau, dễ đếm.
            from .strategies.linear_placer_strategy import linear_placer_strategy
            
            # Ensure pattern is set appropriately if not present
            if 'placement_pattern' not in params:
                params['placement_pattern'] = 'interval'
                
            logger.info("  -> VariablePlacer: Delegating 'variable_counter' to LinearPlacerStrategy.")
            # LinearPlacer returns full layout dict. Since VariablePlacer expects to build `items` list locally
            # in this structure, we might need to extract.
            # HOWEVER, VariablePlacer structure is: place_items -> checks logic -> creates items -> calls _base_layout.
            # If we return directly here, we skip step 3 (obstacles).
            # But LinearPlacer handles obstacles too. So returning directly is safer/cleaner.
            return linear_placer_strategy.place_items(path_info, params)

        elif logic_type == 'variable_update':
            # Kịch bản: Cập nhật biến số (ví dụ: đếm ngã rẽ trên tháp xoắn ốc).
            # Logic chính của thử thách không nằm ở việc nhặt item, mà ở việc người chơi
            # tự tăng biến. Placer chỉ cần đặt một mục tiêu ở cuối để hoàn thành.
            if self.path_info.target_pos and self.path_info.target_pos in coords:
                pos = self.path_info.target_pos
                item_type = 'switch' if item_counts.get('switch', 0) > 0 else 'crystal'
                items.append({"type": item_type, "pos": pos})
                used_coords.add(pos)
                logger.info(f"  -> Đã đặt mục tiêu '{item_type}' ở đích cho thử thách cập nhật biến.")
        
        # Các kịch bản khác (ví dụ: variable_control_loop) có thể được thêm vào đây...
        
        else:
            logger.warning(f"  -> Không có logic chuyên biệt cho '{logic_type}'. Đặt ngẫu nhiên.")
            # Logic mặc định: đặt tất cả các item yêu cầu một cách ngẫu nhiên.
            items_to_place_types = [item for item, count in item_counts.items() if item != 'obstacle' for _ in range(count)]
            positions = random.sample(valid_coords, min(len(items_to_place_types), len(valid_coords)))
            for i, pos in enumerate(positions):
                 items.append({"type": items_to_place_types[i], "pos": pos})
                 used_coords.add(pos)


        # ==================================================================
        # 3. ĐẶT CÁC OBSTACLES PHỤ (Sử dụng hàm từ BasePlacer)
        # ==================================================================
        obstacles = self._place_obstacles(path_info, coords, used_coords, obstacle_count)

        return self._base_layout(path_info, items, obstacles)