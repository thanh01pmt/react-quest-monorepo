import random
from .base_topology import BaseTopology
import copy
from collections import deque
from src.map_generator.models.path_info import PathInfo, Coord
from src.utils.geometry import add_vectors, FORWARD_X, FORWARD_Z, BACKWARD_Z, BACKWARD_X

class HShapeTopology(BaseTopology):
    """
    Tạo ra một con đường hình chữ H trên mặt phẳng 2D.
    Lý tưởng cho các bài học về hàm (function), nơi người chơi có thể
    viết một hàm để đi hết một "cột" và gọi lại nó.
    """
    def generate_path_info_variants(self, grid_size: tuple, params: dict, max_variants: int) -> "Iterator[PathInfo]":
        """
        [REWRITTEN] Tạo biến thể bằng cách tăng dần kích thước từ params gốc.
        Điều này đảm bảo biến thể đầu tiên khớp với curriculum và các biến thể sau lớn dần lên.
        """
        base_col_len = int(params.get('column_length', 4)) # Chiều dài cột
        base_spacing = int(params.get('column_spacing', 2)) # Khoảng cách giữa các cột
        base_bar_offset = int(params.get('bar_position_offset', 1)) # Vị trí thanh ngang

        count = 0
        # Tạo các biến thể bằng cách tăng dần kích thước cột và khoảng cách
        for i in range(max_variants):
            if count >= max_variants:
                return

            variant_params = copy.deepcopy(params)
            # Tăng dần kích thước cho mỗi biến thể
            # Tăng column_length và column_spacing một cách cân bằng
            variant_params['column_length'] = base_col_len + (i // 2)
            variant_params['column_spacing'] = base_spacing + (i % 2)
            variant_params['bar_position_offset'] = base_bar_offset # Giữ bar_offset cố định hoặc thay đổi nhẹ

            # Đảm bảo bar_position_offset hợp lệ với column_length mới
            if variant_params['column_length'] < 3: # Chiều dài cột tối thiểu để có thể đặt thanh ngang
                variant_params['column_length'] = 3
            variant_params['bar_position_offset'] = max(1, min(variant_params['bar_position_offset'], variant_params['column_length'] - 2))

            # Cập nhật cả path_length để Placer có yêu cầu tương ứng
            if 'path_length' in variant_params:
                # Chiều dài đường đi sẽ là: 1 (start_pos) + bar_offset (lên cột trái) + (column_spacing + 1) (dọc thanh ngang) + bar_offset (xuống cột phải)
                variant_params['path_length'] = 1 + variant_params['bar_position_offset'] * 2 + variant_params['column_spacing'] + 1
            yield self.generate_path_info(grid_size, variant_params) # type: ignore
            count += 1

    def generate_path_info(self, grid_size: tuple, params: dict) -> PathInfo:
        """
        Tạo ra một đường đi hình chữ H.

        Args:
            params (dict):
                - column_length (int): Số lượng ô trong mỗi "cột" dọc.
                - column_spacing (int): Khoảng cách (số ô trống) giữa hai cột.
                - bar_position_offset (int): Vị trí của thanh ngang tính từ đáy cột (0-indexed).

        Returns:
            PathInfo: Một đối tượng chứa thông tin về đường đi.
        """
        print("    LOG: Generating 'h_shape' topology...")

        # --- PHẦN 1: LẤY VÀ KIỂM TRA THAM SỐ ---
        column_len = params.get('column_length', random.randint(3, 5))
        column_spacing = params.get('column_spacing', random.randint(1, 3))
        # Đảm bảo thanh ngang không nằm ở ô trên cùng hoặc dưới cùng
        bar_offset = params.get('bar_position_offset', random.randint(1, column_len - 2))

        # Đảm bảo các giá trị tối thiểu
        if column_len < 3: column_len = 3
        if column_spacing < 1: column_spacing = 1
        bar_offset = max(1, min(bar_offset, column_len - 2)) # Thanh ngang không thể ở cạnh trên hoặc dưới cùng

        # Tính toán kích thước cần thiết của hình H
        required_width = 2 + column_spacing
        required_depth = column_len

        # Điều chỉnh kích thước nếu vượt quá grid_size
        if required_width > grid_size[0] - 2:
            required_width = grid_size[0] - 2
            column_spacing = max(1, required_width - 2) # Tính toán lại khoảng cách
        
        if required_depth > grid_size[2] - 2:
            required_depth = grid_size[2] - 2
            column_len = max(3, required_depth) # Tính toán lại chiều dài cột
            bar_offset = max(1, min(bar_offset, column_len - 2)) # Điều chỉnh lại bar_offset

        # Chọn vị trí bắt đầu an toàn cho toàn bộ hình H
        start_x_h = random.randint(1, grid_size[0] - required_width - 1)
        start_z_h = random.randint(1, grid_size[2] - required_depth - 1)
        y = 0

        start_pos: Coord = (start_x_h, y, start_z_h)

        # --- PHẦN 2: TẠO HÌNH DẠNG (placement_coords) MỘT CÁCH RÕ RÀNG ---
        
        left_column_coords = []
        current_pos = start_pos
        for _ in range(column_len):
            left_column_coords.append(current_pos)
            current_pos = add_vectors(current_pos, FORWARD_Z)

        right_column_start_pos: Coord = (start_x_h + column_spacing + 1, y, start_z_h)
        right_column_coords = []
        current_pos = right_column_start_pos
        for _ in range(column_len):
            right_column_coords.append(current_pos)
            current_pos = add_vectors(current_pos, FORWARD_Z)

        # Thanh ngang bắt đầu từ cột trái, tại độ cao bar_offset
        bar_start_pos: Coord = (start_x_h, y, start_z_h + bar_offset)
        horizontal_bar_coords = []
        current_pos = bar_start_pos
        # Đi từ cột trái sang cột phải, bao gồm cả 2 ô ở 2 cột (column_spacing + 2 ô)
        for _ in range(column_spacing + 2):
            horizontal_bar_coords.append(current_pos)
            # [FIX] Phải dùng FORWARD_X, không phải BACKWARD_X
            current_pos = add_vectors(current_pos, FORWARD_X) 
            
        all_h_coords_set = set(left_column_coords + right_column_coords + horizontal_bar_coords)
        placement_coords = list(all_h_coords_set)

        # --- PHẦN 3: [REWRITTEN] TẠO ĐƯỜNG ĐI VÀ ĐIỂM START/TARGET ĐA DẠNG HƠN ---
        # Vị trí start/finish sẽ nằm ở 2 đầu của 2 cạnh song song (4 góc của chữ H)
        # để tạo ra nhiều biến thể hơn.

        # Xác định 4 điểm cuối của 2 cột
        bottom_left = left_column_coords[0]
        top_left = left_column_coords[-1]
        bottom_right = right_column_coords[0]
        top_right = right_column_coords[-1]

        # Chọn ngẫu nhiên một cặp start/target từ các góc đối diện
        possible_pairs = [
            (bottom_left, top_right),
            (top_left, bottom_right),
            (bottom_left, bottom_right),
            (top_left, top_right)
        ]
        start_pos, target_pos = random.choice(possible_pairs)

        # Ngẫu nhiên đảo ngược cặp start/target
        if random.choice([True, False]):
            start_pos, target_pos = target_pos, start_pos

        # Tìm đường đi ngắn nhất giữa start_pos và target_pos trên hình H
        path_coords = self._find_shortest_path(start_pos, target_pos, all_h_coords_set)

        # [NEW] Semantic Positions for function_reuse and parallel_bars strategies
        semantic_positions = {
            'left_bar_top': top_left,
            'left_bar_bottom': bottom_left,
            'right_bar_top': top_right,
            'right_bar_bottom': bottom_right,
            'bridge_left': bar_start_pos,
            'bridge_right': (bar_start_pos[0] + column_spacing + 1, bar_start_pos[1], bar_start_pos[2]),
            'bridge_center': (bar_start_pos[0] + (column_spacing + 1) // 2, bar_start_pos[1], bar_start_pos[2]),
            'optimal_start': 'left_bar_bottom',
            'optimal_end': 'right_bar_bottom',
            'valid_pairs': [
                {
                    'name': 'single_bar_easy',
                    'start': 'left_bar_bottom',
                    'end': 'left_bar_top',
                    'path_type': 'single_column',
                    'strategies': ['function_reuse', 'segment_pattern_reuse'],
                    'difficulty': 'EASY',
                    'teaching_goal': 'Simple single column traversal'
                },
                {
                    'name': 'cross_bridge_medium',
                    'start': 'left_bar_bottom',
                    'end': 'right_bar_bottom',
                    'path_type': 'cross_bridge',
                    'strategies': ['function_reuse', 'parallel_bars'],
                    'difficulty': 'MEDIUM',
                    'teaching_goal': 'Cross bridge, experience parallel columns'
                },
                {
                    'name': 'full_h_hard',
                    'start': 'left_bar_top',
                    'end': 'right_bar_bottom',
                    'path_type': 'full_traversal',
                    'strategies': ['function_reuse', 'bridge_crossing'],
                    'difficulty': 'HARD',
                    'teaching_goal': 'Full H traversal with identical column patterns'
                }
            ]
        }

        # [NEW] Metadata cho Placers - branches phục vụ BranchPlacerStrategy
        metadata = {
            "topology_type": "h_shape",
            "branches": [left_column_coords, right_column_coords, horizontal_bar_coords],
            "corners": [bar_start_pos, (bar_start_pos[0] + column_spacing + 1, bar_start_pos[1], bar_start_pos[2])],  # Bar endpoints
            "left_column": left_column_coords,
            "right_column": right_column_coords,
            "horizontal_bar": horizontal_bar_coords,
            "semantic_positions": semantic_positions,  # [NEW]
        }

        return PathInfo(
            start_pos=start_pos,
            target_pos=target_pos,
            path_coords=path_coords,
            placement_coords=placement_coords,
            metadata=metadata
        )

    def _find_shortest_path(self, start: Coord, end: Coord, grid: set[Coord]) -> list[Coord]:
        """
        Tìm đường đi ngắn nhất giữa hai điểm trên một lưới cho trước bằng thuật toán BFS.
        """
        queue = deque([(start, [start])])
        visited = {start}

        while queue:
            current_pos, path = queue.popleft()

            if current_pos == end:
                return path

            # Các hướng di chuyển có thể (không đi chéo)
            for move in [FORWARD_X, BACKWARD_X, FORWARD_Z, BACKWARD_Z]:
                next_pos = add_vectors(current_pos, move)

                if next_pos in grid and next_pos not in visited:
                    visited.add(next_pos)
                    new_path = list(path)
                    new_path.append(next_pos)
                    queue.append((next_pos, new_path))

        return [] # Trả về rỗng nếu không tìm thấy đường đi