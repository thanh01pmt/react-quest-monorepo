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
        # [FIX] Increase base arm_length to 5 to ensuring valid path length (>10)
        base_arm_len = params.get('arm_length', 5)

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

        # 3. [SEMANTIC] Logic chọn start/target dựa trên semantic positions
        # Define semantic positions
        # [ENHANCED] Add valid_pairs for difficulty-based selection
        valid_pairs = [
            {
                'name': 'center_to_right_easy',
                'start': 'center',
                'end': 'right_end',
                'path_type': 'single_branch',
                'strategies': ['function_reuse', 'hub_spoke'],
                'difficulty': 'EASY',
                'teaching_goal': 'Simple single branch traversal'
            },
            {
                'name': 'left_to_right_medium',
                'start': 'left_end',
                'end': 'right_end',
                'path_type': 'traverse_hub',
                'strategies': ['function_reuse', 'l_shape_logic'],
                'difficulty': 'MEDIUM',
                'teaching_goal': 'Cross through center, two branches'
            },
            {
                'name': 'corner_all_branches_hard',
                'start': 'left_end',
                'end': 'bottom_end',
                'path_type': 'full_traversal',
                'strategies': ['function_reuse', 'radial_symmetry'],
                'difficulty': 'HARD',
                'teaching_goal': 'Visit all 4 branches with identical pattern'
            }
        ]
        
        semantic_positions = {
            'center': (center_x, 0, center_z),
            'left_end': endpoints_h[0],
            'right_end': endpoints_h[1],
            'top_end': endpoints_v[0],
            'bottom_end': endpoints_v[1],
            'optimal_start': 'center',
            'optimal_end': 'right_end',
            'valid_pairs': valid_pairs  # [NEW]
        }
        
        # Get start/end using helper (prioritizes semantic, falls back to farthest)
        all_potential_points = endpoints_h + endpoints_v + [(center_x, 0, center_z)]
        start_pos, target_pos = self._get_start_end_positions(
            {'semantic_positions': semantic_positions}, 
            all_potential_points
        )

        # 4. [NEW] Define branches FIRST
        center = (center_x, 0, center_z)
        
        # Branch Right: center → +X
        branch_right = [center] + [(center_x + i, 0, center_z) for i in range(1, arm_length + 1)]
        # Branch Left: center → -X
        branch_left = [center] + [(center_x - i, 0, center_z) for i in range(1, arm_length + 1)]
        # Branch Down: center → +Z
        branch_down = [center] + [(center_x, 0, center_z + i) for i in range(1, arm_length + 1)]
        # Branch Up: center → -Z
        branch_up = [center] + [(center_x, 0, center_z - i) for i in range(1, arm_length + 1)]
        
        # Map endpoints/center to branches for path logic
        # Note: center maps to 'center' special handling
        branch_map = {
            (center_x + arm_length, 0, center_z): ('right', branch_right),
            (center_x - arm_length, 0, center_z): ('left', branch_left),
            (center_x, 0, center_z + arm_length): ('down', branch_down),
            (center_x, 0, center_z - arm_length): ('up', branch_up),
        }
        if center not in branch_map:
             branch_map[center] = ('center', [center])

        # 5. [NEW] Generate path traversing ALL branches
        path_coords = []
        visited_branches = set()
        
        # --- PATH PART 1: Start → Center ---
        start_branch_name, start_branch = branch_map.get(start_pos, ('unknown', []))
        visited_branches.add(start_branch_name)
        
        if start_pos == center:
            path_coords.append(center)
        else:
            # Go from endpoint to center (reverse of branch which is center->out)
            path_coords.extend(reversed(start_branch))
            # Now at center
        
        # --- PATH PART 2: Visit OTHER branches ---
        target_branch_name, target_branch = branch_map.get(target_pos, ('unknown', []))
        if target_pos != center:
            visited_branches.add(target_branch_name)
            
        all_branch_defs = [
            ('right', branch_right), ('left', branch_left),
            ('down', branch_down), ('up', branch_up)
        ]
        
        # Sort branches to have deterministic order (optional, but good for debugging)
        # Verify if one of them is visited, skip it.
        for b_name, b_coords in all_branch_defs:
            if b_name not in visited_branches:
                # Go out (skip center as we are at center)
                path_coords.extend(b_coords[1:])
                # Come back (reverse, skip endpoint)
                path_coords.extend(reversed(b_coords[1:-1]))
                # Ensure we are back at center explicitly to connect to next branch
                path_coords.append(center)
        
        # --- PATH PART 3: Center → Target ---
        if target_pos != center:
            # Go from center to target endpoint (skip center as we are at center)
            path_coords.extend(target_branch[1:])
        
        # Remove any potential duplicate consecutive points (just in case)
        # e.g. center followed by center
        cleaned_path = [path_coords[0]]
        for p in path_coords[1:]:
            if p != cleaned_path[-1]:
                cleaned_path.append(p)
        path_coords = cleaned_path

        # [NEW] Metadata Construction
        # Legacy arms for backward compatibility
        horizontal_arm = [(center_x + i, 0, center_z) for i in range(-arm_length, arm_length + 1)]
        vertical_arm = [(center_x, 0, center_z + i) for i in range(-arm_length, arm_length + 1)]
        
        four_branches = [branch_right, branch_left, branch_down, branch_up]
        
        # Analyze segments
        segments = []
        corners = []
        if path_coords:
            current_segment = [path_coords[0]]
            if len(path_coords) > 1:
                last_diff = (
                    path_coords[1][0] - path_coords[0][0],
                    path_coords[1][2] - path_coords[0][2]
                )
                for i in range(1, len(path_coords)):
                    curr = path_coords[i]
                    prev = path_coords[i-1]
                    curr_diff = (curr[0] - prev[0], curr[2] - prev[2])
                    
                    if curr_diff == last_diff:
                        current_segment.append(curr)
                    else:
                        corners.append(prev)
                        segments.append(current_segment)
                        current_segment = [prev, curr]
                        last_diff = curr_diff
                segments.append(current_segment)
            else:
                segments.append(current_segment)

        segment_lengths = [len(s) for s in segments]
        segment_analysis = {
            'num_segments': len(segments),
            'lengths': segment_lengths,
            'min_length': min(segment_lengths) if segment_lengths else 0,
            'max_length': max(segment_lengths) if segment_lengths else 0,
            'avg_length': sum(segment_lengths) / len(segment_lengths) if segment_lengths else 0
        }

        metadata = {
            "topology_type": "plus_shape",
            "semantic_positions": semantic_positions, # [NEW]
            "center": center,
            "branches": four_branches,
            "horizontal_arm": horizontal_arm,
            "vertical_arm": vertical_arm,
            "segments": segments,
            "corners": corners,
            "segment_analysis": segment_analysis
        }

        return PathInfo(
            start_pos=start_pos,
            target_pos=target_pos,
            path_coords=path_coords if path_coords else [start_pos, target_pos],
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