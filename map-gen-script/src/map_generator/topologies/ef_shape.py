import random
from .base_topology import BaseTopology
import copy
from collections import deque
from src.map_generator.models.path_info import PathInfo, Coord
from src.utils.geometry import add_vectors, FORWARD_X, FORWARD_Z, BACKWARD_X, BACKWARD_Z

class EFShapeTopology(BaseTopology):
    """
    Tạo ra một con đường hình chữ E hoặc F trên mặt phẳng 2D.
    Lý tưởng cho các bài học về vòng lặp lồng nhau hoặc hàm với tham số,
    ví dụ: một hàm `draw_branch(length)` có thể được gọi nhiều lần.
    """
    def generate_path_info_variants(self, grid_size: tuple, params: dict, max_variants: int) -> "Iterator[PathInfo]":
        """
        [REWRITTEN] Tạo biến thể bằng cách tăng dần kích thước từ params gốc.
        """
        base_stem_len = int(params.get('stem_length', 5))
        base_branch_len = int(params.get('branch_length', 2))
        base_num_branches = int(params.get('num_branches', 3))

        for i in range(max_variants):
            variant_params = copy.deepcopy(params)
            # [CẢI TIẾN] Tăng dần kích thước và thay đổi cả số nhánh
            variant_params['stem_length'] = base_stem_len + (i // 2)
            variant_params['branch_length'] = base_branch_len + (i % 2)
            # Xen kẽ giữa E và F
            variant_params['num_branches'] = 2 if (base_num_branches + i) % 2 == 0 else 3
            
            # Cập nhật cả path_length để Placer có yêu cầu tương ứng
            if 'path_length' in variant_params:
                variant_params['path_length'] = int(params.get('path_length', 5)) + (i // 2)

            yield self.generate_path_info(grid_size, variant_params)

    def generate_path_info(self, grid_size: tuple, params: dict) -> PathInfo:
        """
        Tạo ra một đường đi hình chữ E/F.

        Args:
            params (dict):
                - stem_length (int): Độ dài của "thân" chính.
                - num_branches (int): Số lượng nhánh (2 cho F, 3 cho E).
                - branch_length (int): Độ dài của mỗi nhánh.

        Returns:
            PathInfo: Một đối tượng chứa thông tin về đường đi.
        """
        print("    LOG: Generating 'ef_shape' topology...")

        # --- PHẦN 1: LẤY VÀ KIỂM TRA THAM SỐ (Tối ưu hóa) ---
        stem_len = params.get('stem_length', random.randint(5, 7))
        num_branches = params.get('num_branches', random.choice([2, 3])) # 2 cho F, 3 cho E
        branch_len = params.get('branch_length', random.randint(2, 4))
        
        # Đảm bảo stem_len đủ dài cho các nhánh
        min_stem_len = 3 if num_branches == 2 else 5 # F cần ít nhất 3 ô, E cần ít nhất 5
        if stem_len < min_stem_len: stem_len = min_stem_len

        # Đảm bảo hình dạng nằm gọn trong map
        required_width = branch_len + 1 # Thân + nhánh
        required_depth = stem_len
        
        # Điều chỉnh nếu cần
        if required_width > grid_size[0] - 2: required_width = grid_size[0] - 2
        if required_depth > grid_size[2] - 2: required_depth = grid_size[2] - 2
        
        start_x = random.randint(1, grid_size[0] - required_width - 1)
        start_z = random.randint(1, grid_size[2] - required_depth - 1)
        y = 0

        start_pos: Coord = (start_x, y, start_z)
        
        # --- PHẦN 2: TẠO HÌNH DẠNG (placement_coords) CHÍNH XÁC ---
        
        placement_coords_set = set()
        endpoints = []

        stem_coords = []
        # 1. Vẽ thân chính (luôn tồn tại)
        for i in range(stem_len):
            coord = (start_x, y, start_z + i)
            placement_coords_set.add(coord)
            stem_coords.append(coord)
        
        endpoints.append(stem_coords[0]) # Đáy thân
        endpoints.append(stem_coords[-1]) # Đỉnh thân

        # 2. [SỬA LỖI] Xác định vị trí các nhánh một cách tường minh
        branch_offsets = []
        middle_offset = (stem_len - 1) // 2
        top_offset = stem_len - 1
        
        if num_branches == 3: # Chữ E: nhánh ở đáy, giữa, và đỉnh
            # Nhánh dưới cùng không tính là endpoint vì nó trùng với đáy thân
            branch_offsets = [0, middle_offset, top_offset] 
        elif num_branches == 2: # Chữ F: nhánh ở giữa và đỉnh
            branch_offsets = [middle_offset, top_offset]

        # 3. Vẽ các nhánh từ các vị trí đã xác định
        for offset in branch_offsets:
            branch_start_pos: Coord = (start_x, y, start_z + offset)
            current_branch_pos = branch_start_pos
            # Thêm các ô của nhánh vào placement_coords
            for i in range(1, branch_len + 1):
                current_branch_pos = (branch_start_pos[0] + i, y, branch_start_pos[2])
                placement_coords_set.add(current_branch_pos)
            
            # Chỉ thêm đầu nhánh làm endpoint nếu nó không trùng với đầu thân
            if offset != 0 and offset != top_offset:
                 endpoints.append(current_branch_pos)

        # --- PHẦN 3: [REWRITTEN] TẠO ĐƯỜNG ĐI VÀ ĐIỂM START/TARGET ĐA DẠNG ---
        # Chọn ngẫu nhiên 2 điểm cuối khác nhau làm start và target
        possible_endpoints = list(set(endpoints))
        if len(possible_endpoints) < 2:
            # Fallback trong trường hợp hiếm gặp
            start_pos = stem_coords[0]
            target_pos = stem_coords[-1]
        else:
            start_pos, target_pos = random.sample(possible_endpoints, 2)

        # [CẢI TIẾN] Đảm bảo start và finish không tạo thành đường thẳng.
        # Lặp lại việc chọn nếu chúng nằm trên cùng một trục X hoặc Z.
        while start_pos[0] == target_pos[0] or start_pos[2] == target_pos[2]:
            start_pos, target_pos = random.sample(possible_endpoints, 2)

        # Tìm đường đi ngắn nhất giữa start và target trên hình E/F
        path_coords = self._find_shortest_path(start_pos, target_pos, placement_coords_set)
        
        # [NEW] Tạo metadata cho Placers
        # Tạo danh sách các nhánh
        all_branches = [stem_coords]  # Thân chính là nhánh đầu tiên
        
        for offset in branch_offsets:
            branch_coords = []
            branch_start = (start_x, y, start_z + offset)
            for i in range(1, branch_len + 1):
                branch_coords.append((branch_start[0] + i, y, branch_start[2]))
            all_branches.append(branch_coords)
        
        metadata = {
            "branches": all_branches,
            "stem": stem_coords,
            "num_branches": num_branches,
            "branch_offsets": branch_offsets,
        }
        
        return PathInfo(
            start_pos=start_pos,
            target_pos=target_pos,
            path_coords=list(dict.fromkeys(path_coords)),
            placement_coords=list(placement_coords_set),
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

            for move in [FORWARD_X, BACKWARD_X, FORWARD_Z, BACKWARD_Z]:
                next_pos = add_vectors(current_pos, move)

                if next_pos in grid and next_pos not in visited:
                    visited.add(next_pos)
                    new_path = list(path)
                    new_path.append(next_pos)
                    queue.append((next_pos, new_path))

        return [] # Trả về rỗng nếu không tìm thấy đường đi