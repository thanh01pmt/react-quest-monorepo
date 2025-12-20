# src/map_generator/topologies/l_shape.py
import random
import copy
from .base_topology import BaseTopology
from src.map_generator.models.path_info import PathInfo, Coord
from src.utils.geometry import add_vectors, FORWARD_X, FORWARD_Z, BACKWARD_X, BACKWARD_Z

class LShapeTopology(BaseTopology):
    """
    Tạo đường đi hình chữ L.
    Hỗ trợ turn_direction: "right" / "left"
    """
    def generate_path_info_variants(self, grid_size: tuple, params: dict, max_variants: int) -> "Iterator[PathInfo]":
        """
        [KIẾN TRÚC MỚI] Tạo ra các biến thể hình chữ L với kích thước cạnh khác nhau.
        [CHUẨN HÓA] Logic được viết lại để tăng dần kích thước từ `params` gốc.
        """
        base_leg1 = int(params.get('leg1_length', 3))
        base_leg2 = int(params.get('leg2_length', 3))

        for i in range(max_variants):
            variant_params = copy.deepcopy(params)
            # Logic tăng dần: mỗi biến thể sẽ tăng kích thước của một trong hai cạnh
            if i % 2 == 0:
                # Tăng leg1, giữ nguyên leg2
                variant_params['leg1_length'] = base_leg1 + (i // 2)
                variant_params['leg2_length'] = base_leg2
            else:
                # Tăng leg2, giữ nguyên leg1 của bước trước
                variant_params['leg1_length'] = base_leg1 + (i // 2)
                variant_params['leg2_length'] = base_leg2 + 1
            yield self.generate_path_info(grid_size, variant_params)

    def generate_path_info(self, grid_size: tuple, params: dict) -> PathInfo:
        print("    LOG: Generating 'l_shape' topology...")

        # === 1. ĐỌC THAM SỐ ===
        leg1_len = params.get('leg1_length', random.randint(3, 5))
        leg2_len = params.get('leg2_length', random.randint(3, 5))
        turn_dir = params.get('turn_direction', 'right').lower()  # "right" hoặc "left"

        # === 2. ĐẢM BẢO TRONG MAP ===
        max_dim = min(grid_size[0], grid_size[2]) - 2
        leg1_len = max(2, min(leg1_len, max_dim - 1))
        leg2_len = max(2, min(leg2_len, max_dim - 1))

        # === 3. CHỌN ĐIỂM BẮT ĐẦU ===
        start_x = random.randint(1, grid_size[0] - leg1_len - 2)
        start_z = random.randint(1, grid_size[2] - leg2_len - 2)
        start_pos: Coord = (start_x, 0, start_z)

        # === 4. CHỌN HƯỚNG ĐẦU NGẪU NHIÊN ===
        initial_dir = random.choice([FORWARD_X, BACKWARD_X, FORWARD_Z, BACKWARD_Z])

        # === 5. TÍNH HƯỚNG RẼ ===
        TURN_MAP = {
            FORWARD_X:  {"right": FORWARD_Z,  "left": BACKWARD_Z},
            BACKWARD_X: {"right": BACKWARD_Z, "left": FORWARD_Z},
            FORWARD_Z:  {"right": BACKWARD_X, "left": FORWARD_X},
            BACKWARD_Z: {"right": FORWARD_X,  "left": BACKWARD_X}
        }
        dir1 = initial_dir
        dir2 = TURN_MAP[dir1][turn_dir]

        # === 6. VẼ ĐƯỜNG ĐI ===
        path_coords: List[Coord] = [start_pos]
        current_pos = start_pos

        # Cạnh 1
        for _ in range(leg1_len):
            current_pos = add_vectors(current_pos, dir1)
            path_coords.append(current_pos)

        # Cạnh 2
        for _ in range(leg2_len):
            current_pos = add_vectors(current_pos, dir2)
            path_coords.append(current_pos)

        target_pos = path_coords[-1]

        # [NEW] Tạo metadata cho Placers
        # Tách path thành 2 segments tại corner
        corner_pos = path_coords[leg1_len]  # Vị trí góc rẽ
        seg1 = path_coords[:leg1_len + 1]  # Segment 1 bao gồm corner
        seg2 = path_coords[leg1_len:]       # Segment 2 bắt đầu từ corner
        
        segments = [seg1, seg2]
        
        # Pre-calculate segment analysis
        lengths = [len(seg) for seg in segments]
        min_len = min(lengths)
        max_len = max(lengths)

        # [NEW] Semantic positions for segment_pattern_reuse strategy
        semantic_positions = {
            'start_point': start_pos,
            'corner': corner_pos,
            'end_point': target_pos,
            'optimal_start': 'start_point',
            'optimal_end': 'end_point',
            'valid_pairs': [
                {
                    'name': 'full_l_easy',
                    'start': 'start_point',
                    'end': 'end_point',
                    'path_type': 'full_traversal',
                    'strategies': ['segment_pattern_reuse', 'corner_logic'],
                    'difficulty': 'EASY',
                    'teaching_goal': 'Simple L traversal with identical segment patterns'
                },
                {
                    'name': 'corner_to_end_medium',
                    'start': 'corner',
                    'end': 'end_point',
                    'path_type': 'single_segment',
                    'strategies': ['segment_pattern_reuse', 'alternating_patterns'],
                    'difficulty': 'MEDIUM',
                    'teaching_goal': 'Single segment with pattern variation'
                },
                {
                    'name': 'reversed_l_hard',
                    'start': 'end_point',
                    'end': 'start_point',
                    'path_type': 'reversed_traversal',
                    'strategies': ['segment_pattern_reuse', 'progressive_spacing'],
                    'difficulty': 'HARD',
                    'teaching_goal': 'Reversed L with hidden segment symmetry'
                }
            ]
        }
        
        metadata = {
            "topology_type": "l_shape",
            "segments": segments,
            "corners": [corner_pos],  # CHUẨN HÓA: luôn dùng số nhiều
            "leg1_length": leg1_len,
            "leg2_length": leg2_len,
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

        return PathInfo(
            start_pos=start_pos,
            target_pos=target_pos,
            path_coords=path_coords,
            placement_coords=path_coords,  # BẮT BUỘC GÁN
            metadata=metadata
        )