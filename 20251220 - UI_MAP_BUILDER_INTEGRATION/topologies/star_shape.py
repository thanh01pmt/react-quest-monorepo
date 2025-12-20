import random
from .base_topology import BaseTopology
from typing import Iterator
import copy
from src.map_generator.models.path_info import PathInfo, Coord
from src.utils.geometry import add_vectors, FORWARD_X, FORWARD_Z, BACKWARD_X, BACKWARD_Z

class StarShapeTopology(BaseTopology):
    """
    Tạo ra một đường đi liên tục theo đường viền của một ngôi sao 5 cánh (pixel art).
    Đường đi được thiết kế để có Eulerian Path, cho phép robot di chuyển hết toàn bộ map.
    """
    def generate_path_info_variants(self, grid_size: tuple, params: dict, max_variants: int) -> "Iterator[PathInfo]":
        """
        [REWRITTEN] Tạo biến thể bằng cách tăng dần kích thước từ params gốc.
        """
        base_size = int(params.get('star_size', 2))

        for i in range(max_variants):
            variant_params = copy.deepcopy(params)
            # Tăng dần kích thước cho mỗi biến thể
            variant_params['star_size'] = base_size + i
            # Cập nhật cả path_length để Placer có yêu cầu tương ứng
            if 'path_length' in variant_params:
                variant_params['path_length'] = int(params.get('path_length', 3)) + i

            yield self.generate_path_info(grid_size, variant_params)

    def generate_path_info(self, grid_size: tuple, params: dict) -> PathInfo:
        print("    LOG: Generating 'star_shape' (outline) topology...")
        size = params.get('star_size', 3)  # Kích thước mỗi đoạn của ngôi sao
        # [NÂNG CẤP] Đọc path_mode để quyết định loại đường đi trả về.
        # 'full_outline' (mặc định) cho các Placer thông thường.
        # 'straight_segment' cho PathSearchingPlacer.
        path_mode = params.get('path_mode', 'full_outline')
        if size < 2: size = 2

        center_x = grid_size[0] // 2
        center_z = grid_size[2] // 2

        # --- PHẦN 1: TẠO HÌNH DẠNG (placement_coords) ---
        current_pos = (center_x, 0, center_z - size * 2)
        path_coords = [current_pos]

        # Ánh xạ hướng chuỗi sang vector
        direction_map = {
            'right': FORWARD_X,
            'down': FORWARD_Z,
            'left': BACKWARD_X,
            'up': BACKWARD_Z,
        }

        # [MỚI] Lưu trữ các đoạn thẳng để chọn làm đường đi chính
        straight_segments = []
        # Danh sách các đoạn di chuyển (hướng, số bước) để vẽ viền ngôi sao
        segments = [
            ('right', size),     # Đi đến đỉnh trên-phải
            ('down', size),      # Đi xuống cánh phải
            ('left', size),      # Đi vào trong
            ('down', size),      # Đi xuống đỉnh dưới-phải
            ('left', size),      # Đi qua đỉnh dưới
            ('up', size),        # Đi lên đỉnh dưới-trái
            ('left', size),      # Đi ra cánh trái
            ('up', size),        # Đi lên đỉnh trên-trái
            ('right', size),     # Đi vào trong
            ('up', size - 1),    # Đi lên gần đỉnh trên để nối vòng lặp
        ]

        for direction_key, steps in segments:
            segment_start_pos = current_pos
            move_vector = direction_map[direction_key]
            current_segment = [segment_start_pos]
            for _ in range(steps):
                current_pos = add_vectors(current_pos, move_vector)
                path_coords.append(current_pos)
                current_segment.append(current_pos)
            straight_segments.append(current_segment)

        # Loại bỏ các điểm trùng lặp nhưng vẫn giữ nguyên thứ tự
        placement_coords = list(dict.fromkeys(path_coords))

        # --- PHẦN 2: [NÂNG CẤP] TẠO ĐƯỜNG ĐI (path_coords) DỰA TRÊN path_mode ---
        if path_mode == 'straight_segment':
            # Chế độ cũ: Trích xuất một đoạn thẳng cho PathSearchingPlacer.
            # Chọn một trong các đoạn thẳng dài nhất (các "cánh" của ngôi sao).
            if straight_segments:
                # Lọc ra các đoạn có độ dài `size+1` (các cánh ngoài)
                long_segments = [seg for seg in straight_segments if len(seg) == size + 1]
                final_path = random.choice(long_segments) if long_segments else random.choice(straight_segments)
            else:
                final_path = placement_coords # Fallback
        else:
            # Chế độ mới (mặc định): Sử dụng toàn bộ đường viền làm đường đi.
            final_path = placement_coords

        # Pre-calculate segment analysis
        lengths = [len(seg) for seg in straight_segments]
        min_len = min(lengths) if lengths else 0
        max_len = max(lengths) if lengths else 0
        
        # [NEW] Tạo metadata cho Placers
        # [REWRITTEN] Standard Metadata for Smart Placer
        
        # Calculate corners (start points of each segment, except the last point of the path)
        corners = []
        for seg in straight_segments:
            if seg:
                corners.append(seg[0])
        
        # [NEW] Create branches (arms) for radial_iteration strategy
        # Group segments into arms (pairs of segments form an arm)
        # Star has 5 arms, each consisting of 2 segments (out and in)
        branches = []
        for i in range(0, len(straight_segments) - 1, 2):
            arm = straight_segments[i] + straight_segments[i + 1][1:]  # Combine without duplicating junction
            branches.append(arm)
        
        # [NEW] Calculate arm endpoints for semantic positions
        center_pos = (center_x, 0, center_z)
        arm_endpoints = []
        for i, branch in enumerate(branches):
            if branch:
                # Arm tip is typically the middle point where direction changes
                tip_idx = len(branch) // 2
                arm_endpoints.append(branch[tip_idx] if tip_idx < len(branch) else branch[-1])
        
        # [NEW] Semantic positions for star shape
        semantic_positions = {
            'center': center_pos,
        }
        
        # Add arm endpoints
        for i, endpoint in enumerate(arm_endpoints):
            semantic_positions[f'arm_{i}_end'] = endpoint
        
        # Add first and last positions
        semantic_positions['start_point'] = final_path[0]
        semantic_positions['end_point'] = final_path[-1]
        
        # Define valid start/end pairs with difficulty and strategy metadata
        valid_pairs = [
            {
                'name': 'center_outward_easy',
                'start': 'center',
                'end': 'arm_0_end',
                'path_type': 'single_arm',
                'strategies': ['radial_iteration', 'function_reuse'],
                'difficulty': 'EASY',
                'teaching_goal': 'Traverse one arm with simple pattern'
            },
            {
                'name': 'arm_to_arm_medium',
                'start': 'arm_0_end',
                'end': 'arm_2_end',
                'path_type': 'cross_center',
                'strategies': ['radial_iteration', 'function_reuse'],
                'difficulty': 'MEDIUM',
                'teaching_goal': 'Cross through center, experience arm symmetry'
            },
            {
                'name': 'full_star_hard',
                'start': 'start_point',
                'end': 'end_point',
                'path_type': 'full_traversal',
                'strategies': ['radial_iteration', 'segment_pattern_reuse'],
                'difficulty': 'HARD',
                'teaching_goal': 'Complete star traversal with all arms'
            }
        ]
        
        # Add optimal_start/optimal_end for backward compatibility
        semantic_positions['optimal_start'] = 'center'
        semantic_positions['optimal_end'] = 'arm_0_end'
        semantic_positions['valid_pairs'] = valid_pairs
        
        # Standardize segment analysis
        # Note: 'min_valid_range' and 'total_valid_slots' are custom fields, 
        # but we should ensure standard fields for Placer are present.
        
        segment_lengths = [len(s) for s in straight_segments]
        segment_analysis = {
            'num_segments': len(straight_segments),
            'lengths': segment_lengths,
            'types': ['star_segment'] * len(straight_segments),
            'min_length':  min(segment_lengths) if segment_lengths else 0,
            'max_length': max(segment_lengths) if segment_lengths else 0,
            'avg_length': sum(segment_lengths) / len(straight_segments) if straight_segments else 0,
            # Keeping extra fields for backward compat if needed (though not used by BasePlacer)
            "min_valid_range": max(0, min(segment_lengths) - 2) if segment_lengths else 0,
            "total_valid_slots": sum(max(0, l - 2) for l in segment_lengths),
        }

        metadata = {
            "topology_type": "star_shape",  # Keep original for backward compat
            "segments": straight_segments,
            "branches": branches,  # [NEW] Arms as branches
            "corners": corners,
            "star_size": size,
            "segment_analysis": segment_analysis,
            "semantic_positions": semantic_positions,  # [NEW]
        }

        return PathInfo(
            start_pos=final_path[0],
            target_pos=final_path[-1],
            path_coords=final_path,
            # `placement_coords` luôn là toàn bộ cấu trúc để render nền.
            placement_coords=placement_coords,
            metadata=metadata
        )