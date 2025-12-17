# src/map_generator/placements/while_if_placer.py
"""
WHILE IF PLACER (Nâng cấp) -> CONDITIONAL LOGIC PLACER

- "Chuyên gia" về việc tạo ra các thử thách có điều kiện cho Topics 5, 6, và 7.
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

class WhileIfPlacer(BasePlacer):
    def place_item_variants(self, path_info: PathInfo, params: dict, max_variants: int) -> Iterator[Dict[str, Any]]:
        """
        [KIẾN TRÚC MỚI] Tạo ra các biến thể layout.
        Hiện tại, nó chỉ tạo ra một biến thể duy nhất bằng cách gọi place_items.
        """
        # Logic tạo nhiều biến thể có thể được thêm vào đây sau.
        yield self.place_items(path_info, params)

    def place_items(self, path_info: PathInfo, params: dict, **kwargs) -> Dict[str, Any]:
        self.path_info = path_info
        logic_type = params.get('logic_type')

        logger.info(f"-> ConditionalLogicPlacer: Kích hoạt logic '{logic_type}'")

        # ==================================================================
        # BỘ ĐIỀU PHỐI: Gọi hàm xử lý chuyên biệt dựa trên logic_type
        # ==================================================================
        if logic_type in ['if_else_logic', 'if_elseif_logic']:
            items, obstacles = self._place_for_if_else(params)
        elif logic_type == 'logical_operators':
            items, obstacles = self._place_for_operators(params)
        elif logic_type in ['while_loop', 'while_loop_simple']:
            items, obstacles = self._place_for_while(params)
        else:
            logger.warning(f"  -> Không có logic chuyên biệt cho '{logic_type}'. Dùng LinearPlacerStrategy làm fallback.")
            from .strategies.linear_placer_strategy import linear_placer_strategy
            if 'placement_pattern' not in params: params['placement_pattern'] = 'interval'
            return linear_placer_strategy.place_items(self.path_info, params)

        return self._base_layout(path_info, items, obstacles)

    # ==================================================================
    # KỊCH BẢN 1: Dạy Lệnh Điều kiện (IF-ELSE)
    # ==================================================================
    def _place_for_if_else(self, params: dict) -> Tuple[List[Dict], List[Dict]]:
        """Tạo môi trường có yếu tố bất định, bắt buộc phải kiểm tra trước khi hành động."""
        items = []
        used_coords = set()
        
        # Topology (ví dụ: GridWithHolesTopology) đã tạo ra sự bất định.
        # Placer chỉ cần đặt mục tiêu ở cuối để hoàn thành thử thách.
        target_pos = self.path_info.target_pos
        if target_pos:
            item_type_at_target = "switch" if self._get_item_counts(params).get("switch", 0) > 0 else "crystal"
            items.append({"type": item_type_at_target, "pos": target_pos})
            used_coords.add(target_pos)
            
        coords = self._get_coords(self.path_info)
        item_counts = self._get_item_counts(params)
        obstacles = self._place_obstacles(self.path_info, coords, used_coords, item_counts.get('obstacle', 0))
        
        return items, obstacles

    # ==================================================================
    # KỊCH BẢN 2: Dạy Toán tử Logic (OPERATORS)
    # ==================================================================
    def _place_for_operators(self, params: dict) -> Tuple[List[Dict], List[Dict]]:
        """Tạo kịch bản yêu cầu kiểm tra 2 điều kiện cùng lúc (AND)."""
        items = []
        used_coords = set()
        coords = self._get_coords(self.path_info)
        valid_coords = self._exclude_ends(coords, self.path_info)
        random.shuffle(valid_coords)

        item_counts = self._get_item_counts(params)
        # Số cặp (crystal + switch) cần đặt
        num_pairs = min(item_counts.get('crystal', 0), item_counts.get('switch', 0))

        # Đặt các cặp item tại cùng một vị trí để tạo điều kiện cho toán tử AND
        for _ in range(num_pairs):
            if not valid_coords: break
            pos = valid_coords.pop()
            items.append({"type": "crystal", "pos": pos})
            # Đặt công tắc ở trạng thái ngẫu nhiên để tăng độ khó, buộc người chơi phải kiểm tra
            initial_state = random.choice(["on", "off"])
            items.append({"type": "switch", "pos": pos, "initial_state": initial_state})
            used_coords.add(pos)
        
        logger.info(f"  -> Đã đặt {num_pairs} cặp Crystal/Switch để thử thách toán tử AND.")
        
        # Đặt thêm các item "mồi" để gây nhiễu và thử thách toán tử OR
        num_decoys = 2
        for _ in range(num_decoys):
            if valid_coords:
                pos = valid_coords.pop()
                items.append({"type": "crystal", "pos": pos}) # Crystal đơn lẻ
                used_coords.add(pos)
            if valid_coords:
                pos = valid_coords.pop()
                items.append({"type": "switch", "pos": pos, "initial_state": "on"}) # Switch đơn lẻ
                used_coords.add(pos)

        obstacles = self._place_obstacles(self.path_info, coords, used_coords, item_counts.get('obstacle', 0))
        return items, obstacles

    # ==================================================================
    # KỊCH BẢN 3: Dạy Vòng lặp WHILE
    # ==================================================================
    def _place_for_while(self, params: dict) -> Tuple[List[Dict], List[Dict]]:
        """Tạo kịch bản có độ dài không xác định, bắt buộc dùng while/until."""
        items = []
        used_coords = set()
        
        # Với While, Topology (zigzag, spiral) đã làm hầu hết công việc.
        # Placer chỉ cần đặt một mục tiêu duy nhất ở điểm cuối cùng.
        target_pos = self.path_info.target_pos
        if target_pos:
            item_counts = self._get_item_counts(params)
            item_type = 'switch' if item_counts.get('switch', 0) > 0 else 'crystal'
            items.append({"type": item_type, "pos": target_pos})
            used_coords.add(target_pos)
            logger.info(f"  -> Đã đặt mục tiêu '{item_type}' ở đích cho thử thách While.")

        coords = self._get_coords(self.path_info)
        obstacles = self._place_obstacles(self.path_info, coords, used_coords, 0) # Thường không cần obstacle phụ
        return items, obstacles