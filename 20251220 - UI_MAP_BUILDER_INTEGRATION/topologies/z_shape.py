# src/map_generator/topologies/z_shape.py

import random
from .base_topology import BaseTopology
import copy
from src.map_generator.models.path_info import PathInfo, Coord
from src.utils.geometry import add_vectors, FORWARD_X, FORWARD_Z, BACKWARD_X

class ZShapeTopology(BaseTopology):
    """
    Tạo ra một con đường hình chữ Z trên mặt phẳng 2D.
    """
    def generate_path_info_variants(self, grid_size: tuple, params: dict, max_variants: int) -> "Iterator[PathInfo]":
        """
        [KIẾN TRÚC MỚI] Tạo ra các biến thể hình chữ Z với kích thước cạnh khác nhau.
        """
        count = 0
        # Lặp qua các kích thước có thể có
        for l1 in range(2, 6):
            for l2 in range(2, 6):
                if count >= max_variants: return
                
                variant_params = copy.deepcopy(params)
                variant_params['leg1_length'] = l1
                variant_params['leg2_length'] = l2
                variant_params['leg3_length'] = l1 # Giữ đối xứng
                yield self.generate_path_info(grid_size, variant_params)
                count += 1

    def generate_path_info(self, grid_size: tuple, params: dict) -> PathInfo:
        """
        Tạo ra một đường đi hình chữ Z.

        Args:
            params (dict):
                - leg1_length (int): Độ dài cạnh ngang trên.
                - leg2_length (int): Số cặp bước đi của cạnh chéo.
                - leg3_length (int): Độ dài cạnh ngang dưới.

        Returns:
            PathInfo: Một đối tượng chứa thông tin về đường đi.
        """
        print("    LOG: Generating 'z_shape' topology...")

        leg1_len = params.get('leg1_length', random.randint(2, 4))
        leg2_len = params.get('leg2_length', random.randint(2, 4))
        leg3_len = params.get('leg3_length', random.randint(2, 4))
        y = 0

        # [SỬA LỖI] Cần tính toán không gian cần thiết một cách an toàn
        required_width = leg1_len + leg3_len
        required_depth = leg2_len + 1

        start_x = random.randint(1, grid_size[0] - required_width - 1)
        start_z = random.randint(1, grid_size[2] - required_depth - 1)
        
        start_pos: Coord = (start_x, y, start_z)
        # [SỬA LỖI] Luôn bắt đầu path_coords với vị trí xuất phát
        path_coords: list[Coord] = [start_pos]
        current_pos = start_pos

        # Cạnh ngang trên (đi sang phải)
        for _ in range(leg1_len):
            current_pos = add_vectors(current_pos, FORWARD_X)
            path_coords.append(current_pos)

        # [SỬA LỖI] Cạnh chéo: Thay thế bằng các bước đi zigzag
        # Hướng tổng thể: (-X, +Z)
        for _ in range(leg2_len):
            # Bước 1: Đi tiến (trục Z)
            current_pos = add_vectors(current_pos, FORWARD_Z)
            path_coords.append(current_pos)
            # Bước 2: Đi sang trái (trục X)
            current_pos = add_vectors(current_pos, BACKWARD_X)
            path_coords.append(current_pos)

        # Cạnh ngang dưới (đi sang phải)
        for _ in range(leg3_len):
            current_pos = add_vectors(current_pos, FORWARD_X)
            path_coords.append(current_pos)

        target_pos = path_coords[-1]

        # [NEW] Tạo metadata cho Placers
        # Z có 3 segments: top, diagonal, bottom
        top_end = leg1_len + 1
        diag_end = top_end + leg2_len * 2
        
        top_seg = path_coords[:top_end]
        diag_seg = path_coords[top_end - 1:diag_end]
        bottom_seg = path_coords[diag_end - 1:]
        
        segments = [top_seg, diag_seg, bottom_seg]
        
        # Corners là các điểm chuyển tiếp
        corner1 = path_coords[top_end - 1]
        corner2 = path_coords[diag_end - 1] if diag_end <= len(path_coords) else path_coords[-1]
        
        # Pre-calculate segment analysis
        lengths = [len(seg) for seg in segments]
        min_len = min(lengths) if lengths else 0
        max_len = max(lengths) if lengths else 0
        
        metadata = {
            "topology_type": "z_shape",
            "segments": segments,
            "corners": [corner1, corner2],
            "leg1_length": leg1_len,
            "leg2_length": leg2_len,
            "leg3_length": leg3_len,
            "segment_analysis": {
                "count": len(segments),
                "lengths": lengths,
                "min_length": min_len,
                "max_length": max_len,
                "min_valid_range": max(0, min_len - 2),
                "total_valid_slots": sum(max(0, l - 2) for l in lengths),
            },
            # [NEW] Semantic positions for alternating_patterns strategy
            "semantic_positions": {
                'start': start_pos,
                'end': target_pos,
                'corner1': corner1,
                'corner2': corner2,
                'optimal_start': 'start',
                'optimal_end': 'end',
                'valid_pairs': [
                    {
                        'name': 'full_z_easy',
                        'start': 'start',
                        'end': 'end',
                        'path_type': 'full_traversal',
                        'strategies': ['alternating_patterns', 'zigzag_logic'],
                        'difficulty': 'EASY',
                        'teaching_goal': 'Follow Z-curve with alternating items'
                    },
                    {
                        'name': 'diagonal_focus_medium',
                        'start': 'corner1',
                        'end': 'corner2',
                        'path_type': 'diagonal_segment',
                        'strategies': ['alternating_patterns', 'corner_logic'],
                        'difficulty': 'MEDIUM',
                        'teaching_goal': 'Navigate diagonal with pattern'
                    },
                    {
                        'name': 'reversed_z_hard',
                        'start': 'end',
                        'end': 'start',
                        'path_type': 'reversed_traversal',
                        'strategies': ['alternating_patterns', 'segment_pattern_reuse'],
                        'difficulty': 'HARD',
                        'teaching_goal': 'Reverse Z-curve with hidden pattern'
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