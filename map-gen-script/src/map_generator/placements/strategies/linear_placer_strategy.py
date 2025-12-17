# src/map_generator/placements/strategies/linear_placer_strategy.py
"""
LINEAR PLACER STRATEGY
----------------------
Chuyên gia xử lý việc đặt vật phẩm trên các đường đi tuyến tính (1D).
Trọng tâm là tính toán khoảng cách (Interval) để tạo ra các pattern đều đặn.
"""

import logging
import math
from typing import List, Tuple, Dict, Any, Iterator
from src.map_generator.models.path_info import PathInfo
from ..base_placer import BasePlacer
from ..item_quantity import calculate_item_quantities

logger = logging.getLogger(__name__)
Coord = Tuple[int, int, int]

class LinearPlacerStrategy(BasePlacer):
    """
    Strategy chuyên dụng cho việc đặt item theo quy luật trên đường đi tuyến tính.
    Hỗ trợ:
    - Interval Placement (Cách đều)
    - Anchoring (Neo vào điểm đầu/cuối để tính khoảng cách)
    - Fill All (Lấp đầy)
    """

    def place_item_variants(self, path_info: PathInfo, params: dict, max_variants: int) -> Iterator[Dict[str, Any]]:
        yield self.place_items(path_info, params)

    def place_items(self, path_info: PathInfo, params: dict, **kwargs) -> Dict[str, Any]:
        self.path_info = path_info
        
        # 1. Xác định chế độ đặt (Pattern)
        # Mặc định là 'interval' cho Logic Topics.
        placement_pattern = params.get('placement_pattern', 'interval')
        
        # 2. Lấy danh sách tọa độ tuyến tính
        # Với Linear Strategy, ta giả định path_coords là một chuỗi có thứ tự.
        path_coords = path_info.path_coords
        
        # Lọc ra các vị trí có thể đặt (trừ start/target nếu cần, nhưng logic tính toán sẽ dùng full path)
        valid_placement_indices = [
            i for i, c in enumerate(path_coords)
            if c != path_info.start_pos and c != path_info.target_pos and c in path_info.placement_coords
        ]
        
        items = []
        used_coords = set()
        obstacles = []

        # 3. Tính toán số lượng item
        # 3. Tính toán số lượng item
        # Sử dụng smart quantity logic
        item_counts = self._resolve_item_quantities(params, len(valid_placement_indices))
        
        # [FIX] Đảm bảo item_counts là Counter/Dict vì _resolve_item_quantities trả về list nếu dùng smart quantity
        if isinstance(item_counts, list):
             from collections import Counter
             item_counts = Counter(item_counts)

        # [LEGACY SUPPORT] Nếu không có items_to_place nhưng có item_count
        if not item_counts and params.get('item_count'):
            count = int(params.get('item_count'))
            item_type = params.get('item_type', 'crystal')
            item_counts[item_type] = count
            logger.info(f"  -> LinearPlacer: Fallback to vintage 'item_count'={count} for '{item_type}'")
        
        # Gom tất cả item types cần đặt vào một list
        items_to_place = []
        for item_type, count in item_counts.items():
            if item_type == 'obstacle': continue
            items_to_place.extend([item_type] * count)
            
        total_items = len(items_to_place)
        
        if total_items == 0:
             return self._base_layout(path_info, [], [])

        # 4. Tính toán vị trí đặt (Indices)
        if placement_pattern == 'interval' or placement_pattern == 'fill_all':
            # Logic: Interval / Equidistant
            
            # Check Anchors (Neo)
            # anchor_start=True: Coi Start Pos là index 0 của chuỗi logic (dù không đặt item ở đó)
            # anchor_end=True: Coi Target Pos là index cuối (dù không đặt item ở đó)
            anchor_start = params.get('anchor_start', True)
            anchor_end = params.get('anchor_end', True)
            
            # Lấy toàn bộ path để tính index
            full_path_len = len(path_coords)
            
            # Tính toán các index mục tiêu
            target_indices = self._calculate_interval_indices(
                full_path_len, 
                total_items, 
                anchor_start, 
                anchor_end
            )
            
            # Map index vào item
            # Chỉ lấy các index hợp lệ (nằm trong valid_placement_indices)
            placed_count = 0
            
            # Sort target_indices để đặt theo thứ tự đường đi
            target_indices.sort()
            
            for idx in target_indices:
                if 0 <= idx < full_path_len:
                    pos = path_coords[idx]
                    
                    # Kiểm tra xem vị trí này có được phép đặt không (không phải start/end, không trùng)
                    if pos in path_info.placement_coords and pos != path_info.start_pos and pos != path_info.target_pos and pos not in used_coords:
                        if placed_count < total_items:
                            item_type = items_to_place[placed_count]
                            items.append({"type": item_type, "pos": pos})
                            used_coords.add(pos)
                            placed_count += 1
            
            logger.info(f"-> LinearPlacer: Đã đặt {placed_count}/{total_items} items theo pattern '{placement_pattern}'.")

        elif placement_pattern == 'random':
             # Fallback: Random placement (giống CommandObstaclePlacer cũ, nhưng gọn hơn)
             import random
             available_indices = list(valid_placement_indices)
             random.shuffle(available_indices)
             
             for i in range(min(len(available_indices), total_items)):
                 idx = available_indices[i]
                 pos = path_coords[idx]
                 items.append({"type": items_to_place[i], "pos": pos})
                 used_coords.add(pos)
                 
             logger.info(f"-> LinearPlacer: Đã đặt item ngẫu nhiên.")

        # 5. Đặt Obstacles phụ (nếu có)
        obstacle_count = item_counts.get('obstacle', 0)
        if obstacle_count > 0:
             obstacles = self._place_obstacles(path_info, path_coords, used_coords, obstacle_count)

        return self._base_layout(path_info, items, obstacles)

    def _calculate_interval_indices(self, path_length: int, item_count: int, anchor_start: bool, anchor_end: bool) -> List[int]:
        """
        Tính toán danh sách các index để đặt item sao cho CÁCH ĐỀU NHAU.
        
        Thuật toán Integer Division + Remainder Distribution:
        1. Tính base_gap = total_distance // num_gaps
        2. Tính remainder = total_distance % num_gaps
        3. Phân bổ remainder vào các gaps GIỮA trước (để items cách đều nhau)
        4. Gaps ở đầu/cuối (start-to-first, last-to-end) có thể nhỏ hơn
        
        Ví dụ: path_length=8, item_count=3, cả 2 anchor
          total_distance = 7, num_gaps = 4
          base_gap = 7 // 4 = 1
          remainder = 7 % 4 = 3
          
          Phân bổ 3 remainder vào 4 gaps (ưu tiên giữa):
          gaps = [1, 1, 1, 1] → [1, 2, 2, 2] (remainder vào giữa trước)
          → indices: [1, 3, 5] → KHÔNG, cần tính lại
          
          Thực tế: gaps = [2, 2, 2, 1] (2 gaps giữa là 2, 1 gap cuối là 1)
          → indices: [2, 4, 6]
          → gaps thực: [2, 2, 2, 1] ✓
        
        Args:
            path_length: Tổng số ô trên đường đi (bao gồm Start index 0 và End index path_length-1).
            item_count: Số lượng item cần đặt.
            anchor_start: True = không đặt item tại vị trí Start (index 0).
            anchor_end: True = không đặt item tại vị trí End (index path_length-1).
        """
        if item_count <= 0: 
            return []
        if path_length <= 0:
            return []
        
        if item_count >= path_length:
            return list(range(path_length))
        
        # Số điểm neo = items + (Start nếu anchor) + (End nếu anchor)
        num_points = item_count
        if anchor_start: 
            num_points += 1
        if anchor_end: 
            num_points += 1
        
        num_gaps = num_points - 1
        
        if num_gaps <= 0:
            return [0]
        
        total_distance = path_length - 1
        
        # Integer division để tính base gap và remainder
        base_gap = total_distance // num_gaps
        remainder = total_distance % num_gaps
        
        # Tạo list gaps với base_gap
        gaps = [base_gap] * num_gaps
        
        # Phân bổ remainder vào các gaps GIỮA trước (index 1 đến num_gaps-2)
        # Điều này đảm bảo khoảng cách giữa các items (quan trọng nhất) được ưu tiên
        # Nếu không đủ gaps giữa, thì phân bổ ra 2 đầu
        if num_gaps > 2:
            # Có gaps giữa (indices 1, 2, ..., num_gaps-2)
            middle_indices = list(range(1, num_gaps - 1))
            edge_indices = [0, num_gaps - 1]
            priority_order = middle_indices + edge_indices
        else:
            # Không có gaps giữa (chỉ có 1 hoặc 2 gaps)
            priority_order = list(range(num_gaps))
        
        # Phân bổ remainder theo thứ tự ưu tiên
        for i in range(remainder):
            idx = priority_order[i % len(priority_order)]
            gaps[idx] += 1
        
        # Tính indices từ gaps
        indices = []
        pos = 0
        
        for i in range(num_gaps):
            pos += gaps[i]
            # Chỉ thêm vào indices nếu đây là vị trí item (không phải End anchor)
            if anchor_start:
                # Với anchor_start, item thứ 0 ở sau gap thứ 0
                # Item thứ 1 ở sau gap thứ 1, ...
                if i < item_count:
                    indices.append(pos)
            else:
                # Không anchor_start: item đầu tiên ở index 0
                if i == 0:
                    indices.append(0)
                elif i < item_count:
                    indices.append(sum(gaps[:i+1]))
        
        # Đảm bảo không vượt quá số item cần thiết
        indices = indices[:item_count]
        
        # Validate bounds
        indices = [max(0, min(idx, path_length - 1)) for idx in indices]
        
        # Enforce anchor constraints
        if anchor_start:
            indices = [max(1, idx) for idx in indices]
        if anchor_end:
            indices = [min(path_length - 2, idx) for idx in indices]
        
        return sorted(set(indices))

# Instance global để import
linear_placer_strategy = LinearPlacerStrategy()
