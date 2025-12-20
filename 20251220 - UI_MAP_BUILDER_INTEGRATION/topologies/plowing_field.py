# src/map_generator/topologies/plowing_field.py

import random
from .base_topology import BaseTopology
from src.map_generator.models.path_info import PathInfo, Coord
from src.utils.geometry import add_vectors, FORWARD_X, FORWARD_Z, BACKWARD_X
from typing import List, Dict, Any, Iterator
import copy
 
class PlowingFieldTopology(BaseTopology):
    """
    Tạo ra một con đường đi theo kiểu "luống cày" (zig-zag qua lại)
    để lấp đầy một khu vực hình chữ nhật.
    
    Đây là dạng map kinh điển để dạy về vòng lặp lồng nhau.
    """
    def generate_path_info_variants(self, grid_size: tuple, params: dict, max_variants: int) -> Iterator[PathInfo]:
        """
        [KIẾN TRÚC MỚI] Tạo ra các biến thể luống cày với số hàng và cột khác nhau.
        """
        count = 0
        # Lặp qua các số hàng và cột có thể có
        for r in range(3, 8):
            for c in range(3, 8):
                if count >= max_variants: return
                
                variant_params = copy.deepcopy(params)
                variant_params['rows'] = r
                variant_params['cols'] = c
                yield self.generate_path_info(grid_size, variant_params)
                count += 1

    
    def generate_path_info(self, grid_size: tuple, params: dict) -> PathInfo: # type: ignore
        """
        Tạo ra một đường đi zig-zag qua các hàng và cột.

        Args:
            params (dict): Cần chứa 'rows' và 'cols'.

        Returns:
            PathInfo: Một đối tượng chứa thông tin về đường đi luống cày.
        """
        print("    LOG: Generating 'plowing_field' topology...")
        
        rows = params.get('rows', random.randint(4, 6))
        cols = params.get('cols', random.randint(5, 7))

        # Đảm bảo khu vực này nằm gọn trong map
        if cols > grid_size[0] - 2: cols = grid_size[0] - 2
        if rows > grid_size[2] - 2: rows = grid_size[2] - 2

        start_x = random.randint(1, grid_size[0] - cols - 1)
        start_z = random.randint(1, grid_size[2] - rows - 1)
        y = 0

        # [SỬA LỖI 2] Điểm bắt đầu của người chơi là điểm bắt đầu của đường đi
        start_pos: Coord = (start_x, y, start_z)
        
        path_coords: List[Coord] = [start_pos]
        current_pos = start_pos
        segments: List[List[Coord]] = []
        corners: List[Coord] = []
        
        # [REWRITTEN] Logic zig-zag được viết lại để ghi nhận metadata
        for r in range(rows):
            current_segment: List[Coord] = [current_pos]

            # Xác định hướng đi cho hàng hiện tại
            direction = FORWARD_X if r % 2 == 0 else BACKWARD_X
            
            # Đi hết một hàng (cols - 1 bước)
            for _ in range(cols - 1):
                current_pos = add_vectors(current_pos, direction)
                path_coords.append(current_pos)
                current_segment.append(current_pos)
            
            segments.append(current_segment)

            # Nếu chưa phải hàng cuối, đi xuống 1 bước để sang hàng mới
            if r < rows - 1:
                # Điểm cuối hàng hiện tại là một góc cua
                corners.append(current_pos)
                current_pos = add_vectors(current_pos, FORWARD_Z)
                path_coords.append(current_pos)
                # Điểm bắt đầu hàng mới cũng là một góc cua
                corners.append(current_pos)

        target_pos = path_coords[-1]

        # Pre-calculate segment analysis
        lengths = [len(seg) for seg in segments]
        min_len = min(lengths) if lengths else 0
        max_len = max(lengths) if lengths else 0

        # [NEW] Tạo metadata để Placer có thể hiểu cấu trúc
        metadata: Dict[str, Any] = {
            "topology_type": "plowing_field",
            "segments": segments,
            "corners": corners,
            "rows": rows,
            "cols": cols,
            "segment_analysis": {
                "count": len(segments),
                "lengths": lengths,
                "min_length": min_len,
                "max_length": max_len,
                "min_valid_range": max(0, min_len - 2),
                "total_valid_slots": sum(max(0, l - 2) for l in lengths),
            },
            # [NEW] Semantic positions for row_based strategy
            "semantic_positions": {
                'start': start_pos,
                'end': target_pos,
                'optimal_start': 'start',
                'optimal_end': 'end',
                'valid_pairs': [
                    {
                        'name': 'row_by_row_easy',
                        'start': 'start',
                        'end': 'end',
                        'path_type': 'row_traversal',
                        'strategies': ['row_based', 'alternating_rows'],
                        'difficulty': 'EASY',
                        'teaching_goal': 'Items per row'
                    },
                    {
                        'name': 'alternating_direction_medium',
                        'start': 'start',
                        'end': 'end',
                        'path_type': 'zigzag_rows',
                        'strategies': ['row_based', 'serpentine'],
                        'difficulty': 'MEDIUM',
                        'teaching_goal': 'Direction-aware items'
                    },
                    {
                        'name': 'spiral_plow_hard',
                        'start': 'start',
                        'end': 'end',
                        'path_type': 'spiral_pattern',
                        'strategies': ['row_based', 'serpentine'],
                        'difficulty': 'HARD',
                        'teaching_goal': 'Complex plow pattern'
                    }
                ]
            }
        }

        return PathInfo(
            start_pos=start_pos,
            target_pos=target_pos,
            path_coords=path_coords,
            placement_coords=path_coords,
            metadata=metadata
        )