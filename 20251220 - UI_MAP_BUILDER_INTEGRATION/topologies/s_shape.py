# src/map_generator/topologies/s_shape.py

import random
from .base_topology import BaseTopology
import copy
from src.map_generator.models.path_info import PathInfo, Coord
from src.utils.geometry import add_vectors, FORWARD_X, FORWARD_Z, BACKWARD_X, BACKWARD_Z

class SShapeTopology(BaseTopology):
    """
    Tạo ra một con đường hình chữ S trên mặt phẳng 2D.
    Lý tưởng cho các bài học về tuần tự lệnh có hai lần rẽ ngược chiều.
    """

    def generate_path_info_variants(self, grid_size: tuple, params: dict, max_variants: int) -> "Iterator[PathInfo]":
        """
        [KIẾN TRÚC MỚI] Tạo ra các biến thể hình chữ S với kích thước cạnh khác nhau.
        [CHUẨN HÓA] Logic được viết lại để tăng dần kích thước từ `params` gốc.
        """
        base_leg1 = int(params.get('leg1_length', 2))
        base_leg2 = int(params.get('leg2_length', 3))
        base_leg3 = int(params.get('leg3_length', 2))

        for i in range(max_variants):
            variant_params = copy.deepcopy(params)
            # Tăng dần kích thước của cả 3 cạnh một cách đồng đều
            variant_params['leg1_length'] = base_leg1 + i
            variant_params['leg2_length'] = base_leg2 + i
            variant_params['leg3_length'] = base_leg3 + i
            yield self.generate_path_info(grid_size, variant_params)

    def generate_path_info(self, grid_size: tuple, params: dict) -> PathInfo:
        print("    LOG: Generating 's_shape' topology...")

        leg1_len = params.get('leg1_length', random.randint(2, 4))
        leg2_len = params.get('leg2_length', random.randint(3, 4))
        leg3_len = params.get('leg3_length', random.randint(2, 4))

        # [CẢI TIẾN] Tính toán kích thước cần thiết một cách linh hoạt
        required_width = leg2_len + 1
        required_depth = leg1_len + leg3_len + 1

        # Đảm bảo hình dạng nằm gọn trong map
        if required_width > grid_size[0] - 2 or required_depth > grid_size[2] - 2:
            leg2_len = min(leg2_len, grid_size[0] - 3)
            leg1_len = min(leg1_len, (grid_size[2] - 3) // 2)
            leg3_len = min(leg3_len, (grid_size[2] - 3) // 2)

        # Chọn vị trí bắt đầu
        start_x = random.randint(1, grid_size[0] - required_width - 1)
        start_z = random.randint(1, grid_size[2] - required_depth - 1)
        y = 0
        start_pos: Coord = (start_x, y, start_z)

        # [CẢI TIẾN] Ngẫu nhiên hóa hướng và loại hình (S hoặc Z)
        initial_dir = random.choice([FORWARD_Z, BACKWARD_Z, FORWARD_X, BACKWARD_X])
        turn1_dir_choice = random.choice(['right', 'left'])
        # [SỬA LỖI] Cố định hình dạng là 'S' để đảm bảo topology này luôn tạo ra chữ S.
        # Việc tạo ra hình chữ 'Z' (giống chữ U) đã có trong u_shape.py.
        shape_type = 'S'

        TURN_MAP = {
            FORWARD_X:  {"right": FORWARD_Z,  "left": BACKWARD_Z},
            BACKWARD_X: {"right": BACKWARD_Z, "left": FORWARD_Z},
            FORWARD_Z:  {"right": BACKWARD_X, "left": FORWARD_X},
            BACKWARD_Z: {"right": FORWARD_X,  "left": BACKWARD_X}
        }

        dir1 = initial_dir
        dir2 = TURN_MAP[dir1][turn1_dir_choice]
        
        # [SỬA LỖI] Logic tạo hình chữ S bị sai. Để tạo chữ S, hai lần rẽ phải ngược chiều nhau.
        # Ví dụ: nếu lần 1 rẽ phải, lần 2 phải rẽ trái.
        # dir3 được tính bằng cách rẽ từ dir2.
        turn2_dir_choice = 'left' if turn1_dir_choice == 'right' else 'right'
        dir3 = TURN_MAP[dir2][turn2_dir_choice]
        
        # [SỬA LỖI] Luôn bắt đầu path_coords với vị trí xuất phát.
        path_coords: list[Coord] = [start_pos]
        current_pos = start_pos

        # Vẽ cạnh 1
        for _ in range(leg1_len):
            current_pos = add_vectors(current_pos, dir1)
            path_coords.append(current_pos)

        # Vẽ cạnh 2
        for _ in range(leg2_len):
            current_pos = add_vectors(current_pos, dir2)
            path_coords.append(current_pos)

        # Vẽ cạnh 3
        for _ in range(leg3_len):
            current_pos = add_vectors(current_pos, dir3)
            path_coords.append(current_pos)

        target_pos = path_coords[-1]

        # [NEW] Tạo metadata cho Placers
        # S-shape có 3 segments và 2 corners
        seg1_end = leg1_len + 1
        seg2_end = seg1_end + leg2_len
        
        seg1 = path_coords[:seg1_end]
        seg2 = path_coords[seg1_end - 1:seg2_end]
        seg3 = path_coords[seg2_end - 1:]
        
        corner1 = path_coords[seg1_end - 1]
        corner2 = path_coords[seg2_end - 1]
        
        segments = [seg1, seg2, seg3]
        
        # Pre-calculate segment analysis
        lengths = [len(seg) for seg in segments]
        min_len = min(lengths)
        max_len = max(lengths)
        
        metadata = {
            "topology_type": "s_shape",
            "segments": segments,
            "corners": [corner1, corner2],
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
                        'name': 'full_s_easy',
                        'start': 'start',
                        'end': 'end',
                        'path_type': 'full_traversal',
                        'strategies': ['alternating_patterns', 'segment_pattern_reuse'],
                        'difficulty': 'EASY',
                        'teaching_goal': 'Follow S-curve with alternating items'
                    },
                    {
                        'name': 'corner_to_corner_medium',
                        'start': 'corner1',
                        'end': 'corner2',
                        'path_type': 'middle_segment',
                        'strategies': ['alternating_patterns', 'corner_logic'],
                        'difficulty': 'MEDIUM',
                        'teaching_goal': 'Navigate between corners with pattern'
                    },
                    {
                        'name': 'reversed_s_hard',
                        'start': 'end',
                        'end': 'start',
                        'path_type': 'reversed_traversal',
                        'strategies': ['alternating_patterns', 'segment_pattern_reuse'],
                        'difficulty': 'HARD',
                        'teaching_goal': 'Reverse S-curve with hidden pattern'
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