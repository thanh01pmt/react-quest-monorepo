# src/map_generator/topologies/plus_shape_islands.py

import random
from .base_topology import BaseTopology
from src.map_generator.models.path_info import PathInfo, Coord
from typing import Dict, Any, Iterator
from src.utils.geometry import add_vectors, scale_vector

class PlusShapeIslandsTopology(BaseTopology):
    """
    Tạo ra một cấu trúc gồm 4 hòn đảo được sắp xếp theo hình dấu cộng,
    hội tụ tại một điểm trung tâm.

    Lý tưởng cho các bài học về hàm có tham số hoặc cấu trúc điều kiện phức tạp,
    khi người chơi phải xử lý các nhánh khác nhau nhưng có cấu trúc tương tự.
    """

    def _create_square_island(self, center: Coord, size: int) -> list[Coord]:
        """
        Tạo một hòn đảo hình vuông với tâm tại `center` và kích thước `size`.
        """
        cx, cy, cz = center
        half = size // 2
        coords = []
        for x_offset in range(-half, half + 1):
            for z_offset in range(-half, half + 1):
                coords.append((cx + x_offset, cy, cz + z_offset))
        return coords

    def generate_path_info_variants(self, grid_size: tuple, params: dict, max_variants: int) -> Iterator[PathInfo]:
        """
        [KIẾN TRÚC MỚI] Tạo ra các biến thể với độ dài cánh tay khác nhau.
        """
        count = 0
        # Lặp qua các độ dài cánh tay có thể có
        # [CẬP NHẬT] Tính toán giới hạn arm_length dựa trên grid_size 25x25
        island_size_param = int(params.get('island_size', 2))
        max_arm_length_x = (25 - island_size_param - 4) // 2
        max_arm_length_z = (25 - island_size_param - 4) // 2
        max_arm_length = min(max_arm_length_x, max_arm_length_z, 6) # Giới hạn trên là 6

        for arm_len in range(3, max_arm_length + 1):
            if count >= max_variants: return
            
            variant_params = params.copy()
            variant_params['arm_length'] = arm_len
            yield self.generate_path_info(grid_size, variant_params)
            count += 1

    def generate_path_info(self, grid_size: tuple, params: dict) -> PathInfo:
        """
        Tạo ra 4 hòn đảo hình dấu cộng.

        Args:
            params (dict):
                - arm_length (int): Khoảng cách từ tâm đến mỗi đảo.

        Returns:
            PathInfo: Một đối tượng chứa thông tin về đường đi.
        """
        print("    LOG: Generating 'plus_shape_islands' topology...")

        # [CẬP NHẬT] Đọc island_size từ params và đảm bảo kích thước tối đa là 25x25
        effective_grid_size = (25, 25, 25)
        island_size = int(params.get('island_size', 2))

        # [CẬP NHẬT] Giới hạn arm_length để đảm bảo nó không quá lớn so với grid_size 25x25
        # Chiều rộng/sâu tối thiểu cần thiết là 2 * arm_length + island_size + lề
        max_arm_length_x = (effective_grid_size[0] - island_size - 4) // 2
        max_arm_length_z = (effective_grid_size[2] - island_size - 4) // 2
        max_arm_length = min(max_arm_length_x, max_arm_length_z)

        arm_length_param = params.get('arm_length', random.randint(3, max_arm_length))
        arm_length = min(arm_length_param, max_arm_length) # Đảm bảo không vượt quá giới hạn

        # Chọn vị trí tâm an toàn để các cánh không bị vướng
        center_x = random.randint(arm_length + island_size, effective_grid_size[0] - arm_length - island_size - 2)
        center_z = random.randint(arm_length + island_size, effective_grid_size[2] - arm_length - island_size - 2)
        y = 0
        center_pos: Coord = (center_x, y, center_z)

        all_path_coords: list[Coord] = [center_pos]
        island_placement_coords: list[Coord] = []
        branches = [] # [MỚI] Để lưu các nhánh cho metadata
        
        # Các hướng của 4 cánh (Đông, Tây, Nam, Bắc)
        directions = [(1, 0, 0), (-1, 0, 0), (0, 0, 1), (0, 0, -1)]
        island_starts = []

        # 1. Tạo 4 đảo và các cây cầu nối vào tâm
        for direction in directions:
            # Tính vị trí bắt đầu của đảo
            island_center_pos = add_vectors(center_pos, scale_vector(direction, arm_length))
            island_starts.append(island_center_pos)

            # Tạo đảo
            island_path = self._create_square_island(island_center_pos, island_size)
            island_placement_coords.extend(island_path)

            # [MỚI] Ghi nhận nhánh này vào metadata
            branch_path = [center_pos]

            # Tạo cầu nối từ đảo về tâm
            # Ví dụ: đi từ (center_x + arm_length, y, center_z) về (center_x, y, center_z)
            current_bridge_pos = island_center_pos
            for _ in range(arm_length):
                # Di chuyển ngược hướng để về tâm
                move_back = scale_vector(direction, -1)
                current_bridge_pos = add_vectors(current_bridge_pos, move_back)
                if current_bridge_pos not in all_path_coords:
                    branch_path.append(current_bridge_pos)
            
            branch_path.extend(island_path)
            all_path_coords.extend(branch_path)
            branches.append(branch_path)

        # 2. Chọn điểm bắt đầu và kết thúc ngẫu nhiên từ 4 đảo
        random.shuffle(island_starts)
        start_pos = island_starts.pop()
        target_pos = island_starts.pop()

        # 3. Nối tất cả các đường đi lại với nhau
        # all_path_coords đã chứa các cây cầu và tâm
        # island_placement_coords chứa các đảo
        # Kết hợp chúng lại
        full_path = list(dict.fromkeys(all_path_coords + island_placement_coords))
        
        # [MỚI] Tạo metadata để FunctionPlacer có thể hiểu cấu trúc
        metadata: Dict[str, Any] = {
            "branches": branches,
            "hub": [center_pos]
        }

        return PathInfo(
            start_pos=start_pos,
            target_pos=target_pos,
            path_coords=full_path,
            placement_coords=full_path, # Toàn bộ đường đi cần có nền
            metadata=metadata
        )