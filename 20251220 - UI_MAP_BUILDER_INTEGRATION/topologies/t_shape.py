import random
from .base_topology import BaseTopology
import copy
from src.map_generator.models.path_info import PathInfo, Coord
from src.utils.geometry import add_vectors, FORWARD_X, FORWARD_Z, BACKWARD_X

class TShapeTopology(BaseTopology):
    """
    Tạo ra một con đường hình chữ T trên mặt phẳng 2D.
    Lý tưởng cho các bài học về tuần tự lệnh, hàm, hoặc các cấu trúc điều kiện
    khi người chơi phải quyết định rẽ trái hay phải ở ngã ba.
    """
    def generate_path_info_variants(self, grid_size: tuple, params: dict, max_variants: int) -> "Iterator[PathInfo]":
        """
        [KIẾN TRÚC MỚI] Tạo ra các biến thể hình chữ T với kích thước khác nhau.
        """
        count = 0
        # Lặp qua các kích thước có thể có
        for stem in range(2, 7):
            for bar in range(3, 8, 2): # Thanh ngang luôn lẻ
                if count >= max_variants: return
                
                variant_params = copy.deepcopy(params)
                variant_params['stem_length'] = stem
                variant_params['bar_length'] = bar
                yield self.generate_path_info(grid_size, variant_params)
                count += 1

    def generate_path_info(self, grid_size: tuple, params: dict) -> PathInfo:
        """
        Tạo ra một đường đi hình chữ T.

        Args:
            params (dict):
                - stem_length (int): Độ dài của "thân" chữ T.
                - bar_length (int): Độ dài của "thanh ngang" chữ T.

        Returns:
            PathInfo: Một đối tượng chứa thông tin về đường đi.
        """
        print("    LOG: Generating 't_shape' topology...")

        # Lấy độ dài các cạnh từ params, hoặc dùng giá trị ngẫu nhiên
        # [FIX] Increase default sizes to ensure total path length > 10 for item placement
        stem_len = params.get('stem_length', random.randint(5, 7)) # Increased from 3-5
        bar_len = params.get('bar_length', random.randint(6, 8))   # Increased from 4-6
        if bar_len % 2 == 0: bar_len += 1 # Đảm bảo thanh ngang có điểm chính giữa

        bar_side_len = bar_len // 2

        # Đảm bảo hình dạng nằm gọn trong map
        start_x = random.randint(bar_side_len + 1, grid_size[0] - bar_side_len - 2)
        start_z = random.randint(1, grid_size[2] - stem_len - 2)
        y = 0
        
        start_pos: Coord = (start_x, y, start_z)
 
        # --- PHẦN 1: TẠO HÌNH DẠNG (placement_coords) ---
        placement_coords = set()
        current_pos = start_pos
        placement_coords.add(current_pos)
 
        # 1. Vẽ thân chữ T (đi theo trục Z)
        for _ in range(stem_len):
            current_pos = add_vectors(current_pos, FORWARD_Z)
            placement_coords.add(current_pos)
 
        junction_pos = current_pos
 
        # 2. Vẽ thanh ngang (đi theo trục X)
        # Vẽ nhánh phải
        for _ in range(bar_side_len):
            current_pos = add_vectors(current_pos, FORWARD_X)
            placement_coords.add(current_pos)
 
        # Vẽ nhánh trái
        current_pos = junction_pos # Quay lại ngã ba
        for _ in range(bar_side_len):
            current_pos = add_vectors(current_pos, BACKWARD_X)
            placement_coords.add(current_pos)
 
        # --- PHẦN 2: [SEMANTIC] TẠO ĐƯỜNG ĐI ---
        
        # 1. Reconstruct branches for logic mapping and metadata
        # stem_coords: [bottom_end, ..., center]
        stem_coords = []
        pos = start_pos # Use the initial generation point (bottom of stem)
        stem_coords.append(pos)
        for _ in range(stem_len):
            pos = add_vectors(pos, FORWARD_Z)
            stem_coords.append(pos)
        
        center = stem_coords[-1]
        bottom_end = stem_coords[0]
        
        # left_branch: [center, ..., left_end]
        left_branch = [center]
        pos = center
        for _ in range(bar_side_len):
            pos = add_vectors(pos, BACKWARD_X)
            left_branch.append(pos)
        left_end = left_branch[-1]
        
        # right_branch: [center, ..., right_end]
        right_branch = [center]
        pos = center
        for _ in range(bar_side_len):
            pos = add_vectors(pos, FORWARD_X)
            right_branch.append(pos)
        right_end = right_branch[-1]
        
        # 2. Define Semantic Positions with valid_pairs
        semantic_positions = {
            'bottom_end': bottom_end,
            'center': center,
            'left_end': left_end,
            'right_end': right_end,
            'optimal_start': 'bottom_end',
            'optimal_end': 'right_end',
            'valid_pairs': [
                {
                    'name': 'stem_to_right_easy',
                    'start': 'bottom_end',
                    'end': 'right_end',
                    'path_type': 'single_decision',
                    'strategies': ['conditional_branching', 'l_shape_logic'],
                    'difficulty': 'EASY',
                    'teaching_goal': 'Simple path with one direction choice'
                },
                {
                    'name': 'stem_to_left_medium',
                    'start': 'bottom_end',
                    'end': 'left_end',
                    'path_type': 'alternate_decision',
                    'strategies': ['conditional_branching', 'function_reuse'],
                    'difficulty': 'MEDIUM',
                    'teaching_goal': 'Alternate path with decoy on wrong branch'
                },
                {
                    'name': 'left_to_right_hard',
                    'start': 'left_end',
                    'end': 'right_end',
                    'path_type': 'cross_junction',
                    'strategies': ['conditional_branching', 'function_reuse'],
                    'difficulty': 'HARD',
                    'teaching_goal': 'Cross through center with items on both branches'
                }
            ]
        }
        
        # 3. Select Start/End
        all_pts = [bottom_end, center, left_end, right_end]
        start_pos, target_pos = self._get_start_end_positions(
            {'semantic_positions': semantic_positions}, 
            all_pts
        )
        
        # 4. Generate Path (Start -> Center -> Target)
        # Helper to get path segment
        def get_segment_to_center(p):
            if p == center: return [center]
            if p == bottom_end: return stem_coords # Already Bottom -> Center
            if p == left_end: return list(reversed(left_branch)) # Left -> Center
            if p == right_end: return list(reversed(right_branch)) # Right -> Center
            return [] # Should not happen for endpoints

        def get_segment_from_center(p):
            if p == center: return [center]
            if p == bottom_end: return list(reversed(stem_coords)) # Center -> Bottom
            if p == left_end: return left_branch # Center -> Left
            if p == right_end: return right_branch # Center -> Right
            return []

        path_to_center = get_segment_to_center(start_pos)
        path_from_center = get_segment_from_center(target_pos)
        
        if not path_to_center or not path_from_center:
             # Fallback: just line connect
             path_coords = [start_pos, center, target_pos]
        else:
             # Combine: [Start...Center] + [Center...End] -> [Start...End]
             # Avoid duplicating Center
             path_coords = path_to_center[:-1] + path_from_center
        
        # Ensure path is valid and clean
        if not path_coords: path_coords = [start_pos, target_pos]

        # [NEW] Metadata Construction
        segments = [stem_coords, right_branch, left_branch]
        corners = [center]

        segment_lengths = [len(s) for s in segments]
        segment_analysis = {
            'num_segments': len(segments),
            'lengths': segment_lengths,
            'types': ['stem', 'branch_right', 'branch_left'],
            'min_length': min(segment_lengths) if segment_lengths else 0,
            'max_length': max(segment_lengths) if segment_lengths else 0,
            'avg_length': sum(segment_lengths) / len(segment_lengths) if segment_lengths else 0
        }

        metadata = {
            "topology_type": "t_shape",
            "semantic_positions": semantic_positions, # [NEW]
            "branches": [stem_coords, left_branch, right_branch],
            "corners": corners,
            "stem": stem_coords,
            "left_branch": left_branch,
            "right_branch": right_branch,
            "junction": center,
            "segments": segments,
            "segment_analysis": segment_analysis
        }
 
        return PathInfo(
            start_pos=start_pos,
            target_pos=target_pos,
            path_coords=list(dict.fromkeys(path_coords)),
            placement_coords=list(dict.fromkeys(placement_coords)),
            metadata=metadata
        )