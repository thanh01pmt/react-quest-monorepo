import random
from .base_topology import BaseTopology
import copy
from src.map_generator.models.path_info import PathInfo, Coord
from src.utils.geometry import add_vectors, FORWARD_X, FORWARD_Z, BACKWARD_X

class VShapeTopology(BaseTopology):
    """
    Tạo ra một con đường hình chữ V trên mặt phẳng 2D.
    Lý tưởng cho các bài học về tuần tự hoặc hàm đơn giản.
    """
    def generate_path_info_variants(self, grid_size: tuple, params: dict, max_variants: int) -> "Iterator[PathInfo]":
        """
        [KIẾN TRÚC MỚI] Tạo ra các biến thể hình chữ V với độ dài cánh tay khác nhau.
        """
        count = 0
        # Lặp qua các độ dài cánh tay có thể có
        possible_lengths = list(range(2, 7))
        while count < max_variants:
            # Pick arm length, cycling or random if needed. 
            # For variety, let's just pick randomly from valid range.
            arm_len = random.choice(possible_lengths)
            
            variant_params = copy.deepcopy(params)
            variant_params['arm_length'] = arm_len
             # Position is randomized inside generate_path_info
            yield self.generate_path_info(grid_size, variant_params)
            count += 1

    def generate_path_info(self, grid_size: tuple, params: dict) -> PathInfo:
        """
        Tạo ra một đường đi hình chữ V.

        Args:
            params (dict):
                - arm_length (int): Số cặp bước đi trong mỗi nhánh chữ V.

        Returns:
            PathInfo: Một đối tượng chứa thông tin về đường đi.
        """
        print("    LOG: Generating 'v_shape' topology...")

        arm_len = params.get('arm_length', random.randint(3, 5))
        y = 0

        # [SỬA LỖI] Tính toán kích thước cần thiết dựa trên đường đi zigzag
        # Mỗi bước trong arm_len sẽ tạo ra 2 ô (1 ngang, 1 dọc)
        required_width = arm_len * 2
        required_depth = arm_len * 2
        
        # Đảm bảo nằm gọn trong map
        if required_width > grid_size[0] - 2: required_width = grid_size[0] - 2
        if required_depth > grid_size[2] - 2: required_depth = grid_size[2] - 2
        
        start_x = random.randint(1, grid_size[0] - required_width - 1)
        start_z = random.randint(1, grid_size[2] - required_depth - 1)

        start_pos: Coord = (start_x, y, start_z)
        # Sửa lỗi: Đường đi phải luôn bắt đầu bằng vị trí xuất phát
        path_coords: list[Coord] = [start_pos]
        current_pos = start_pos

        # [SỬA LỖI] Thay thế di chuyển chéo bằng di chuyển zigzag (bậc thang)
        
        # Nhánh đầu tiên của chữ V (đi tiến và sang phải)
        # Hướng di chuyển tổng thể: (+X, +Z)
        for _ in range(arm_len):
            # Bước 1: Đi tiến (trục Z)
            current_pos = add_vectors(current_pos, FORWARD_Z) # (0, 0, 1)
            path_coords.append(current_pos)
            # Bước 2: Đi sang phải (trục X)
            current_pos = add_vectors(current_pos, FORWARD_X) # (1, 0, 0)
            path_coords.append(current_pos)

        # Nhánh thứ hai của chữ V (đi tiến và sang trái)
        # Hướng di chuyển tổng thể: (-X, +Z)
        for _ in range(arm_len):
            # Bước 1: Đi tiến (trục Z)
            current_pos = add_vectors(current_pos, FORWARD_Z) # (0, 0, 1)
            path_coords.append(current_pos)
            # Bước 2: Đi sang trái (trục X)
            current_pos = add_vectors(current_pos, BACKWARD_X) # (-1, 0, 0)
            path_coords.append(current_pos)

        target_pos = path_coords[-1]

        # [NEW] Tạo metadata cho Placers
        # Điểm thấp nhất của V là corner (apex)
        apex_idx = arm_len * 2  # Vị trí đỉnh V trong path
        apex = path_coords[apex_idx]
        seg1 = path_coords[:apex_idx + 1]  # Nhánh trái
        seg2 = path_coords[apex_idx:]       # Nhánh phải
        
        segments = [seg1, seg2]
        
        # Pre-calculate segment analysis
        lengths = [len(seg) for seg in segments]
        min_len = min(lengths)
        max_len = max(lengths)
        
        # [NEW] Semantic positions for variable_rate_change strategy
        semantic_positions = {
            'left_end': start_pos,
            'apex': apex,
            'right_end': target_pos,
            'optimal_start': 'left_end',
            'optimal_end': 'right_end',
            'valid_pairs': [
                {
                    'name': 'left_to_right_easy',
                    'start': 'left_end',
                    'end': 'right_end',
                    'path_type': 'full_v',
                    'strategies': ['variable_rate_change', 'symmetric_arms'],
                    'difficulty': 'EASY',
                    'teaching_goal': 'Simple V traversal with clear apex'
                },
                {
                    'name': 'apex_to_end_medium',
                    'start': 'apex',
                    'end': 'right_end',
                    'path_type': 'single_arm',
                    'strategies': ['variable_rate_change', 'convergence_point'],
                    'difficulty': 'MEDIUM',
                    'teaching_goal': 'Single arm with variable spacing'
                },
                {
                    'name': 'fibonacci_spacing_hard',
                    'start': 'left_end',
                    'end': 'right_end',
                    'path_type': 'hidden_pattern',
                    'strategies': ['variable_rate_change', 'progressive_spacing'],
                    'difficulty': 'HARD',
                    'teaching_goal': 'Discover Fibonacci-like spacing pattern'
                }
            ]
        }
        
        metadata = {
            "topology_type": "v_shape",
            "segments": segments,
            "corners": [apex],  # CHUẨN HÓA: luôn dùng số nhiều
            "arm_length": arm_len,
            "semantic_positions": semantic_positions,  # [NEW]
            "segment_analysis": {
                "count": len(segments),
                "lengths": lengths,
                "min_length": min_len,
                "max_length": max_len,
                "min_valid_range": max(0, min_len - 2),
                "total_valid_slots": sum(max(0, l - 2) for l in lengths),
            }
        }

        # placement_coords chính là path_coords vì mỗi ô đi qua đều cần có đất
        return PathInfo(
            start_pos=start_pos,
            target_pos=target_pos,
            path_coords=path_coords,
            placement_coords=path_coords,
            metadata=metadata
        )