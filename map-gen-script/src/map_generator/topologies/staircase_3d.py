# src/map_generator/topologies/staircase_3d.py

import copy
import random
from .base_topology import BaseTopology
from src.map_generator.models.path_info import PathInfo, Coord
from src.utils.geometry import add_vectors, FORWARD_Z, FORWARD_X, BACKWARD_Z, BACKWARD_X, UP_Y

class Staircase3DTopology(BaseTopology):
    """
    Tạo ra một cấu trúc cầu thang 3D đi lên theo cả hai trục X và Z.
    Lý tưởng cho các bài học về vòng lặp và di chuyển trong không gian 3D.
    """

    def generate_path_info_variants(self, grid_size: tuple, params: dict, max_variants: int) -> "Iterator[PathInfo]":
        """
        [CẬP NHẬT] Tạo ra các biến thể cầu thang 3D với số tầng và độ dài bước khác nhau.
        """
        count = 0
        # Lặp qua các cấu hình có thể có
        for levels in range(2, 5): # 2 đến 4 tầng
            for initial_len in range(1, 3): # Độ dài bước ban đầu từ 1 đến 2
                if count >= max_variants: return
                
                variant_params = copy.deepcopy(params)
                variant_params['num_levels'] = levels
                variant_params['initial_step_length'] = initial_len
                yield self.generate_path_info(grid_size, variant_params)
                count += 1

    def generate_path_info(self, grid_size: tuple, params: dict) -> PathInfo:
        """
        [REWRITTEN] Tạo ra một cầu thang xoắn ốc 3D với các bậc thang có độ dài tăng dần.

        Args:
            params (dict):
                - num_levels (int): Số tầng của cầu thang xoắn ốc.
                - initial_step_length (int): Độ dài của các đoạn đường ở tầng đầu tiên.
                - step_increment (int): Số ô được cộng thêm cho mỗi tầng mới.

        Returns:
            PathInfo: Một đối tượng chứa thông tin về cầu thang.
        """
        print("    LOG: Generating 'staircase_3d' topology...")

        # Đọc các tham số mới
        num_levels = params.get('num_levels', 2)
        initial_step_length = params.get('initial_step_length', 1)
        step_increment = params.get('step_increment', 1)

        # Đặt cầu thang ở giữa lưới
        start_x = grid_size[0] // 2
        start_z = grid_size[2] // 2
        start_y = 0
        start_pos: Coord = (start_x, start_y, start_z)

        path_coords: list[Coord] = [start_pos]
        placement_coords: list[Coord] = [start_pos]
        obstacles: list[dict] = []
        current_pos = start_pos
        
        # Các hướng đi xoay vòng: Tới, Phải, Lùi, Trái
        directions = [FORWARD_Z, FORWARD_X, BACKWARD_Z, BACKWARD_X]
        current_step_length = initial_step_length

        for level in range(num_levels):
            # Một tầng bao gồm 4 cạnh
            for i in range(4):
                # 1. Tạo một đoạn đường đi thẳng
                move_direction = directions[i % 4]
                for _ in range(current_step_length):
                    current_pos = add_vectors(current_pos, move_direction)
                    path_coords.append(current_pos)

                # 2. Tạo một bậc thang đi lên ở góc (trừ góc cuối cùng của tầng cuối)
                if level < num_levels - 1 or i < 3:
                    stair_base_pos = add_vectors(current_pos, UP_Y)
                    path_coords.append(stair_base_pos)
                    current_pos = stair_base_pos
            
            # Tăng độ dài cho tầng tiếp theo
            current_step_length += step_increment

        target_pos = path_coords[-1]
        placement_coords.extend(path_coords)
        
        # [NEW] Tạo metadata cho Placers
        # Group coords by Y level (platforms)
        platforms_dict = {}
        stairs = []
        for i, coord in enumerate(path_coords):
            y_level = coord[1]
            if y_level not in platforms_dict:
                platforms_dict[y_level] = []
            platforms_dict[y_level].append(coord)
            
            # Detect stairs (Y changes)
            if i > 0 and path_coords[i-1][1] != coord[1]:
                stairs.append(coord)
        
        platforms = list(platforms_dict.values())
        
        metadata = {
            "platforms": platforms,
            "stairs": stairs,
            "num_levels": num_levels,
        }
        
        return PathInfo(
            start_pos=start_pos, 
            target_pos=target_pos, 
            path_coords=path_coords, 
            placement_coords=list(set(placement_coords)), 
            obstacles=obstacles,
            metadata=metadata
        )