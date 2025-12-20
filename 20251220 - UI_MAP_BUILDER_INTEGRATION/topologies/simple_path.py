# src/map_generator/topologies/simple_path.py

import math
import random
import copy
from .base_topology import BaseTopology
from src.map_generator.models.path_info import PathInfo, Coord

class SimplePathTopology(BaseTopology):
    """
    (Nâng cấp) Tạo ra một con đường ngắn cho các bài tập giới thiệu.
    Có khả năng tùy chỉnh độ dài và hình dạng qua params.
    """
    def generate_path_info_variants(self, grid_size: tuple, params: dict, max_variants: int) -> "Iterator[PathInfo]":
        """
        [KIẾN TRÚC MỚI] Tạo ra các biến thể đường đi đơn giản với độ dài khác nhau.
        """
        count = 0
        # Lặp qua các độ dài có thể có
        for length in range(2, 10):
            if count >= max_variants: break
            
            variant_params = copy.deepcopy(params)
            variant_params['path_length'] = length
            # Có thể thêm logic để thay đổi cả 'turns' ở đây nếu muốn
            yield self.generate_path_info(grid_size, variant_params)
            count += 1
    
    def generate_path_info(self, grid_size: tuple, params: dict) -> PathInfo:
        print(f"    LOG: Generating 'simple_path' with params: {params}")
        
        # [CẢI TIẾN] Hỗ trợ path_length là một khoảng [min, max] để tạo sự đa dạng.
        path_length_param = params.get('path_length', [3, 5])
        if isinstance(path_length_param, list) and len(path_length_param) == 2:
            path_length = random.randint(path_length_param[0], path_length_param[1])
        else:
            path_length = int(path_length_param)

        
        # [SỬA LỖI] Đọc tham số 'turns' thay vì 'pattern' để quyết định hình dạng.
        # Nếu có 'turns' > 0, tạo đường có góc cua. Nếu không, tạo đường thẳng.
        num_turns = params.get('turns', 0)
        pattern = 'corner' if num_turns > 0 else 'straight'
        
        max_dim = min(grid_size[0], grid_size[2])
        if path_length >= max_dim - 3:
            path_length = max_dim - 4
        if path_length < 1:
            path_length = 1

        # [FIX] Tính toán không gian cần thiết cho đường đi có góc cua
        required_space = math.ceil(path_length / 2) if num_turns > 0 else path_length
        start_x = random.randint(1, grid_size[0] - required_space - 2)
        start_z = random.randint(1, grid_size[2] - required_space - 2)
        start_pos: Coord = (start_x, 0, start_z)

        path_coords: list[Coord] = []
        target_pos: Coord
        
        current_pos = list(start_pos)
        
        if pattern == 'straight':
            for _ in range(path_length):
                current_pos[0] += 1
                path_coords.append(tuple(current_pos))
            target_pos = (current_pos[0] + 1, current_pos[1], current_pos[2])

        elif pattern == 'corner':
            if path_length < 2:
                half_len, remaining_len = path_length, 0
            else:
                half_len = path_length // 2
                remaining_len = path_length - half_len
            
            for _ in range(half_len):
                current_pos[0] += 1
                path_coords.append(tuple(current_pos))
                
            for _ in range(remaining_len):
                current_pos[2] += 1
                path_coords.append(tuple(current_pos))
                
            target_pos = (current_pos[0], current_pos[1], current_pos[2] + 1)
        else:
             for _ in range(path_length):
                current_pos[0] += 1
                path_coords.append(tuple(current_pos))
             target_pos = (current_pos[0] + 1, current_pos[1], current_pos[2])

        # [NEW] Tạo metadata cho Placers
        midpoint = path_coords[len(path_coords) // 2] if path_coords else start_pos
        
        metadata = {
            "topology_type": "simple_path",
            "segment": path_coords,
            "pattern": pattern,
            "path_length": path_length,
            # [NEW] Semantic positions for simple progression
            "semantic_positions": {
                'start': start_pos,
                'end': target_pos,
                'midpoint': midpoint,
                'optimal_start': 'start',
                'optimal_end': 'end',
                'valid_pairs': [
                    {
                        'name': 'basic_traversal_easy',
                        'start': 'start',
                        'end': 'end',
                        'path_type': 'full_path',
                        'strategies': ['simple_progression', 'alternating_patterns'],
                        'difficulty': 'EASY',
                        'teaching_goal': 'Basic item collection'
                    },
                    {
                        'name': 'halfway_challenge_medium',
                        'start': 'start',
                        'end': 'midpoint',
                        'path_type': 'partial_path',
                        'strategies': ['simple_progression'],
                        'difficulty': 'MEDIUM',
                        'teaching_goal': 'Partial navigation'
                    },
                    {
                        'name': 'reverse_path_hard',
                        'start': 'end',
                        'end': 'start',
                        'path_type': 'reversed',
                        'strategies': ['simple_progression', 'corner_logic'],
                        'difficulty': 'HARD',
                        'teaching_goal': 'Reverse navigation'
                    }
                ]
            }
        }

        return PathInfo(
            start_pos=start_pos,
            target_pos=target_pos,
            path_coords=path_coords,
            metadata=metadata
        )