# src/map_generator/topologies/interspersed_path.py

import random
from .base_topology import BaseTopology
import copy
from src.map_generator.models.path_info import PathInfo, Coord
from src.utils.geometry import add_vectors, FORWARD_X, FORWARD_Z, BACKWARD_X, BACKWARD_Z
from typing import Dict, Any # [MỚI] Import các kiểu dữ liệu cần thiết

class InterspersedPathTopology(BaseTopology):
    """
    [REWRITTEN] Tạo ra một con đường chính với các nhánh phụ rẽ ra hai bên.
    Lý tưởng cho các bài học về hàm, nơi mỗi nhánh có thể được giải quyết bằng một hàm con.
    """
    
    def generate_path_info_variants(self, grid_size: tuple, params: dict, max_variants: int) -> "Iterator[PathInfo]":
        """
        [KIẾN TRÚC MỚI] Tạo ra các biến thể với số lượng và độ dài nhánh khác nhau.
        """
        count = 0
        # Lặp qua các số lượng và độ dài nhánh có thể có
        for num_b in range(2, 5):
            for len_b in range(2, 5):
                if count >= max_variants: return
                
                variant_params = copy.deepcopy(params)
                variant_params['num_branches'] = num_b
                variant_params['branch_length'] = len_b
                yield self.generate_path_info(grid_size, variant_params)
                count += 1
    def generate_path_info(self, grid_size: tuple, params: dict) -> PathInfo:
        """
        Tạo ra một con đường thẳng với các nhánh phụ.

        Returns:
            PathInfo: Một đối tượng chứa thông tin về con đường phức tạp này.
        """
        print("    LOG: Generating 'interspersed_path' topology...")
        
        main_path_length = params.get('main_path_length', 9)
        num_branches = params.get('num_branches', 2)
        branch_length = params.get('branch_length', 2)
        
        # Đảm bảo đường đi và các nhánh nằm gọn trong map
        if main_path_length >= grid_size[0] - 4:
            main_path_length = grid_size[0] - 5
        if branch_length * 2 + 1 >= grid_size[2] - 2:
            branch_length = 1

        # Cố định trục chính là X, các nhánh rẽ theo trục Z để đơn giản hóa
        # Vị trí bắt đầu an toàn
        start_x = random.randint(1, grid_size[0] - main_path_length - 2)
        start_z = random.randint(branch_length + 1, grid_size[2] - branch_length - 2)
        y = 0
        start_pos: Coord = (start_x, y, start_z)
        
        # --- Logic tạo đường đi và các nhánh ---
        main_path_coords = [start_pos]
        branch_coords_list = []
        current_pos = start_pos
        
        # Chọn các vị trí trên đường chính để rẽ nhánh
        branch_points_indices = sorted(random.sample(range(1, main_path_length - 1), min(num_branches, main_path_length - 2)))
        branch_point_set = set(branch_points_indices)
        
        # Hướng rẽ nhánh (lên hoặc xuống theo trục Z), xen kẽ nhau
        branch_direction = FORWARD_Z

        # Vẽ đường đi chính và các nhánh
        for i in range(main_path_length):
            current_pos = add_vectors(current_pos, FORWARD_X)
            main_path_coords.append(current_pos)

            # Nếu đây là điểm rẽ nhánh
            if i + 1 in branch_point_set:
                current_branch = []
                branch_pos = current_pos
                # Vẽ một nhánh
                for _ in range(branch_length):
                    branch_pos = add_vectors(branch_pos, branch_direction)
                    current_branch.append(branch_pos)
                
                branch_coords_list.append(current_branch)
                # Đảo hướng cho nhánh tiếp theo
                branch_direction = BACKWARD_Z if branch_direction == FORWARD_Z else FORWARD_Z

        target_pos = current_pos
        
        # [REWRITTEN] Populate segments and metadata for Smart Placer
        all_coords = set(main_path_coords)
        segments = []
        corners = []
        
        # Segment 1: Main Path (Start to End)
        # Note: In this simple implementation, the main path is straight (no corners along X)
        segments.append(main_path_coords)
        
        # Branch Segments: Each branch is a separate segment
        for branch in branch_coords_list:
            all_coords.update(branch)
            segments.append(branch)
            # The start of a branch is a "corner" relative to the main path junction
            if len(branch) > 0:
                corners.append(branch[0])
        
        # Prepare segment analysis
        segment_lengths = [len(s) for s in segments]
        segment_analysis = {
            'num_segments': len(segments),
            'lengths': segment_lengths,
            'types': ['main'] + ['branch'] * len(branch_coords_list),
            'min_length': min(segment_lengths) if segment_lengths else 0,
            'max_length': max(segment_lengths) if segment_lengths else 0,
            'avg_length': sum(segment_lengths) / len(segment_lengths) if segment_lengths else 0
        }

        metadata: Dict[str, Any] = {
            "topology_type": "interspersed_path",
            "main_path": main_path_coords,
            "branches": branch_coords_list,
            # [NEW] Standard Metadata for SolutionFirstPlacer
            "segments": segments,
            "corners": corners,
            "segment_analysis": segment_analysis,
            # [NEW] Semantic positions for branch_based strategy
            "semantic_positions": {
                'start': start_pos,
                'end': target_pos,
                'optimal_start': 'start',
                'optimal_end': 'end',
                'valid_pairs': [
                    {
                        'name': 'main_path_easy',
                        'start': 'start',
                        'end': 'end',
                        'path_type': 'main_only',
                        'strategies': ['branch_based', 'main_path_focus'],
                        'difficulty': 'EASY',
                        'teaching_goal': 'Items on main path'
                    },
                    {
                        'name': 'branch_exploration_medium',
                        'start': 'start',
                        'end': 'end',
                        'path_type': 'with_branches',
                        'strategies': ['branch_based', 'function_reuse'],
                        'difficulty': 'MEDIUM',
                        'teaching_goal': 'Items on branches'
                    },
                    {
                        'name': 'mixed_path_hard',
                        'start': 'start',
                        'end': 'end',
                        'path_type': 'mixed',
                        'strategies': ['branch_based', 'function_reuse'],
                        'difficulty': 'HARD',
                        'teaching_goal': 'Complex branch pattern'
                    }
                ]
            }
        }

        return PathInfo(
            start_pos=start_pos,
            target_pos=target_pos,
            path_coords=list(all_coords),
            placement_coords=list(all_coords),
            metadata=metadata
        )