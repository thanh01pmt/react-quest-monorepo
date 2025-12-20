# src/map_generator/topologies/zigzag.py

import copy
import random
from .base_topology import BaseTopology
from src.map_generator.models.path_info import PathInfo, Coord
from src.utils.geometry import add_vectors, FORWARD_X, FORWARD_Z

class ZigzagTopology(BaseTopology):
    """
    Tạo ra một con đường hình ziczac trên mặt phẳng 2D.
    Lý tưởng cho các bài học về vòng lặp với các hành động lặp lại có quy luật.
    """

    def generate_path_info_variants(self, grid_size: tuple, params: dict, max_variants: int) -> "Iterator[PathInfo]":
        """
        [KIẾN TRÚC MỚI] Tạo ra các biến thể ziczac với số đoạn khác nhau.
        """
        count = 0
        # Lặp qua các số đoạn và độ dài đoạn có thể có
        for num_segments in range(3, 8):
            for seg_len in range(2, 5):
                if count >= max_variants: return
                
                variant_params = copy.deepcopy(params)
                variant_params['num_segments'] = num_segments
                variant_params['segment_length'] = seg_len
                yield self.generate_path_info(grid_size, variant_params)
                count += 1
    def generate_path_info(self, grid_size: tuple, params: dict) -> PathInfo:
        print("    LOG: Generating 'zigzag' topology...")

        num_segments = params.get('num_segments', random.randint(4, 6))
        segment_len = params.get('segment_length', random.randint(2, 3))

        # [SỬA LỖI] Tính toán kích thước cần thiết một cách chính xác hơn.
        # Số đoạn đi theo trục X là ceil(num_segments / 2)
        # Số đoạn đi theo trục Z là floor(num_segments / 2)
        # Điều này xử lý đúng cho cả trường hợp num_segments chẵn và lẻ.
        total_width = segment_len * ((num_segments + 1) // 2)
        total_depth = segment_len * (num_segments // 2)

        # [SỬA LỖI] Đảm bảo giới hạn của randint luôn hợp lệ.
        # Nếu không gian không đủ, ta sẽ không thể sinh map, nhưng ít nhất chương trình không bị crash.
        # Ta dùng max(1, ...) để đảm bảo giới hạn dưới không bao giờ lớn hơn giới hạn trên.
        max_start_x = max(1, grid_size[0] - total_width - 2)
        max_start_z = max(1, grid_size[2] - total_depth - 2)

        # Chọn vị trí bắt đầu
        start_x = random.randint(1, max_start_x)
        start_z = random.randint(1, max_start_z)
        y = 0
        start_pos: Coord = (start_x, y, start_z)

        path_coords: list[Coord] = [start_pos] # Đường đi nên bao gồm cả điểm bắt đầu
        current_pos = start_pos

        # Hướng ban đầu (luân phiên giữa Z và X)
        directions = [FORWARD_Z, FORWARD_X]

        for i in range(num_segments):
            # Chọn hướng cho đoạn hiện tại
            current_dir = directions[i % 2]
            
            # Vẽ đoạn thẳng
            for _ in range(segment_len):
                current_pos = add_vectors(current_pos, current_dir)
                path_coords.append(current_pos)

        target_pos = path_coords[-1]

        # [NEW] Tạo metadata cho Placers
        segments = []
        corners = []
        current_segment = [start_pos]
        
        # Rebuild segments from path
        seg_start = 0
        for i in range(num_segments):
            seg_end = seg_start + segment_len + 1
            segment_coords = path_coords[seg_start:seg_end]
            segments.append(segment_coords)
            
            # Corner is the last point of each segment (except the last one)
            if i < num_segments - 1:
                corners.append(segment_coords[-1])
            
            seg_start = seg_end - 1  # Overlap at corner
        
        # Pre-calculate segment analysis
        lengths = [len(seg) for seg in segments]
        min_len = min(lengths) if lengths else 0
        max_len = max(lengths) if lengths else 0
        
        metadata = {
            "topology_type": "zigzag",
            "segments": segments,
            "corners": corners,
            "num_segments": num_segments,
            "segment_length": segment_len,
            "segment_analysis": {
                "count": len(segments),
                "lengths": lengths,
                "min_length": min_len,
                "max_length": max_len,
                "min_valid_range": max(0, min_len - 2),
                "total_valid_slots": sum(max(0, l - 2) for l in lengths),
            },
            # [NEW] Semantic positions for segment_pattern_reuse strategy
            "semantic_positions": {
                'start': start_pos,
                'end': target_pos,
                'optimal_start': 'start',
                'optimal_end': 'end',
                'valid_pairs': [
                    {
                        'name': 'full_zigzag_easy',
                        'start': 'start',
                        'end': 'end',
                        'path_type': 'full_traversal',
                        'strategies': ['segment_pattern_reuse', 'alternating_patterns'],
                        'difficulty': 'EASY',
                        'teaching_goal': 'Traverse zigzag with identical segments'
                    },
                    {
                        'name': 'alternating_corners_medium',
                        'start': 'start',
                        'end': 'end',
                        'path_type': 'corner_based',
                        'strategies': ['segment_pattern_reuse', 'corner_logic'],
                        'difficulty': 'MEDIUM',
                        'teaching_goal': 'Navigate corners with direction changes'
                    },
                    {
                        'name': 'progressive_zigzag_hard',
                        'start': 'start',
                        'end': 'end',
                        'path_type': 'progressive_segments',
                        'strategies': ['segment_pattern_reuse', 'alternating_patterns'],
                        'difficulty': 'HARD',
                        'teaching_goal': 'Complex pattern across segments'
                    }
                ]
            }
        }

        return PathInfo(
            start_pos=start_pos,
            target_pos=target_pos,
            path_coords=path_coords,
            placement_coords=path_coords, # Đối với zigzag, đường đi và điểm đặt là một
            metadata=metadata
        )