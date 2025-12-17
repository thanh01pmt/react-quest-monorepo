# src/map_generator/topologies/plus_shape.py

import random
from collections import deque
import copy
from .base_topology import BaseTopology
from src.map_generator.models.path_info import PathInfo, Coord
from typing import List, Set, Iterator, Optional, Tuple
# [THÊM] Import các vector và deque để tìm đường đi
from src.utils.geometry import add_vectors, FORWARD_X, FORWARD_Z, BACKWARD_X, BACKWARD_Z
class PlusShapeTopology(BaseTopology):
    """
    [REWRITTEN] Tạo ra một cấu trúc hình dấu cộng (+) và tìm một đường đi trên đó.
    Logic đã được viết lại hoàn toàn để đảm bảo cấu trúc dấu cộng luôn được tạo ra một cách chính xác.
    """
    def generate_path_info_variants(self, grid_size: tuple, params: dict, max_variants: int) -> Iterator[PathInfo]:
        """
        [REWRITTEN] Tạo biến thể bằng cách tăng dần kích thước từ params gốc.
        """
        base_arm_len = params.get('arm_length', 3)

        for i in range(max_variants):
            variant_params = copy.deepcopy(params)
            # Tăng dần kích thước cho mỗi biến thể
            variant_params['arm_length'] = base_arm_len + i
            # Cập nhật cả path_length để Placer có yêu cầu tương ứng
            if 'path_length' in variant_params:
                variant_params['path_length'] = params.get('path_length', 5) + i

            yield self.generate_path_info(grid_size, variant_params)

    def generate_path_info(self, grid_size: tuple, params: dict) -> PathInfo:
        """
        [REWRITTEN] Tạo cấu trúc dấu cộng, chọn điểm start/target, và tìm đường đi ngắn nhất giữa chúng.
        """
        grid_w, _, grid_d = grid_size
        arm_length = params.get('arm_length', 5)

        # Tính toán trung tâm của lưới để đặt dấu cộng
        center_x, center_z = grid_w // 2, grid_d // 2

        # 1. Tạo ra toàn bộ các ô (coordinates) của hình dấu cộng.
        placement_coords: Set[Coord] = set()
        # Cánh ngang
        for i in range(-arm_length, arm_length + 1):
            placement_coords.add((center_x + i, 0, center_z))
        # Cánh dọc
        for i in range(-arm_length, arm_length + 1):
            placement_coords.add((center_x, 0, center_z + i))

        # 2. [LOGIC MỚI] Xác định các điểm cuối của 4 cánh
        endpoints_h = [ # Ngang
            (center_x - arm_length, 0, center_z),
            (center_x + arm_length, 0, center_z)
        ]
        endpoints_v = [ # Dọc
            (center_x, 0, center_z - arm_length),
            (center_x, 0, center_z + arm_length)
        ]

        # 3. [LOGIC MỚI] Chọn start/target ở 2 đầu cánh không thẳng hàng
        start_pos = random.choice(endpoints_h)
        target_pos = random.choice(endpoints_v)

        # Ngẫu nhiên đảo ngược để tăng biến thể
        if random.choice([True, False]):
            start_pos, target_pos = target_pos, start_pos

        # 4. [LOGIC MỚI] Tìm đường đi ngắn nhất giữa start và target
        path_coords = self._find_shortest_path(start_pos, target_pos, placement_coords)

        # [NEW] Tạo danh sách các nhánh cho metadata
        horizontal_arm = [(center_x + i, 0, center_z) for i in range(-arm_length, arm_length + 1)]
        vertical_arm = [(center_x, 0, center_z + i) for i in range(-arm_length, arm_length + 1)]
        
        metadata = {
            "branches": [horizontal_arm, vertical_arm],
            "horizontal_arm": horizontal_arm,
            "vertical_arm": vertical_arm,
            "center": (center_x, 0, center_z),
        }

        # `placement_coords` vẫn là toàn bộ cấu trúc để render nền.
        # `path_coords` là đường đi cụ thể để Placer và Solver sử dụng.
        return PathInfo(
            start_pos=start_pos,
            target_pos=target_pos,
            path_coords=path_coords if path_coords else [start_pos, target_pos], # Fallback
            placement_coords=list(placement_coords),
            metadata=metadata
        )

    def _find_shortest_path(self, start: Coord, end: Coord, grid: set[Coord]) -> list[Coord]:
        """
        [LOGIC MỚI] Tìm đường đi ngắn nhất giữa hai điểm trên một lưới cho trước bằng thuật toán BFS.
        """
        queue = deque([(start, [start])])
        visited = {start}

        while queue:
            current_pos, path = queue.popleft()

            if current_pos == end:
                return path

            for move in [FORWARD_X, BACKWARD_X, FORWARD_Z, BACKWARD_Z]:
                next_pos = add_vectors(current_pos, move)

                if next_pos in grid and next_pos not in visited:
                    visited.add(next_pos)
                    new_path = list(path)
                    new_path.append(next_pos)
                    queue.append((next_pos, new_path))

        return [] # Trả về rỗng nếu không tìm thấy đường đi