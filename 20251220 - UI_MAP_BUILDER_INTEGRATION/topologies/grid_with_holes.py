# src/map_generator/topologies/grid_with_holes.py
import random
from .base_topology import BaseTopology
from src.map_generator.models.path_info import PathInfo, Coord
import copy
from collections import deque # [MỚI] Import deque để dùng cho BFS
from typing import List, Set, Optional, Iterator # [MỚI] Import các kiểu dữ liệu

class GridWithHolesTopology(BaseTopology):
    """
    Tạo ra một khu vực lưới hình chữ nhật với các ô ngẫu nhiên bị loại bỏ,
    tạo thành các "hố" hoặc "vực".
    """

    def generate_path_info_variants(self, grid_size: tuple, params: dict, max_variants: int) -> Iterator[PathInfo]:
        """
        [KIẾN TRÚC MỚI] Tạo ra các biến thể lưới với kích thước và mật độ hố khác nhau.
        """
        count = 0
        # Lặp qua các kích thước và xác suất tạo hố có thể có
        for size in range(6, 11):
            for chance in [0.15, 0.25, 0.35]:
                if count >= max_variants: return
                
                variant_params = copy.deepcopy(params)
                variant_params['grid_width'] = size
                variant_params['grid_depth'] = size
                variant_params['hole_chance'] = chance
                yield self.generate_path_info(grid_size, variant_params)
                count += 1
    def generate_path_info(self, grid_size: tuple, params: dict) -> PathInfo:
        """
        [REWRITTEN] Sinh ra một lưới với các hố ngẫu nhiên và đảm bảo có đường đi
        từ điểm bắt đầu đến điểm kết thúc bằng thuật toán BFS.

        Args:
            params (dict):
                - grid_width (int): Chiều rộng của khu vực lưới.
                - grid_depth (int): Chiều sâu của khu vực lưới.
                - hole_chance (float): Xác suất một ô là hố (0.0 đến 1.0).
        """
        print("    LOG: Generating 'grid_with_holes' topology...")

        width = params.get('grid_width', 8)
        depth = params.get('grid_depth', 8)
        hole_chance = params.get('hole_chance', 0.25)

        if width > grid_size[0] - 2: width = grid_size[0] - 2
        if depth > grid_size[2] - 2: depth = grid_size[2] - 2

        # 1. Chọn vị trí và tạo ra một lưới đầy đủ ban đầu
        start_x_offset = random.randint(1, grid_size[0] - width - 1)
        start_z_offset = random.randint(1, grid_size[2] - depth - 1)
        y = 0

        all_grid_coords: Set[Coord] = set()
        for x in range(width):
            for z in range(depth):
                all_grid_coords.add((start_x_offset + x, y, start_z_offset + z))

        # 2. Chọn điểm bắt đầu và kết thúc ngẫu nhiên trên lưới
        start_pos = random.choice(list(all_grid_coords))
        target_pos = random.choice(list(all_grid_coords - {start_pos}))

        # 3. Đục lỗ ngẫu nhiên, nhưng không đục ở điểm start/target
        holes = {
            coord for coord in all_grid_coords
            if coord != start_pos and coord != target_pos and random.random() < hole_chance
        }
        
        # 4. Tìm đường đi trên lưới đã bị đục lỗ
        walkable_coords = all_grid_coords - holes
        path_coords = self._find_path(start_pos, target_pos, walkable_coords)

        # 5. Đảm bảo luôn có đường đi
        # 5. Đảm bảo luôn có đường đi
        if not path_coords:
            # Nếu không tìm thấy đường đi, khôi phục các block để tạo lối đi
            print("    LOG: (GridWithHoles) Không tìm thấy đường đi. Khôi phục lối đi trực tiếp.")
            # Tạo đường đi manhattan đơn giản
            params_temp = {'grid_width': width, 'grid_depth': depth}
            # Sử dụng logic manhattan đơn giản (L-shape)
            backup_path = []
            curr = start_pos
            # Move along X
            step_x = 1 if target_pos[0] > start_pos[0] else -1
            while curr[0] != target_pos[0]:
                curr = (curr[0] + step_x, curr[1], curr[2])
                backup_path.append(curr)
            
            # Move along Z
            step_z = 1 if target_pos[2] > start_pos[2] else -1
            while curr[2] != target_pos[2]:
                curr = (curr[0], curr[1], curr[2] + step_z)
                backup_path.append(curr)
                
            # Thêm path này vào walkable (lấp hố)
            for p in backup_path:
                if p in holes:
                    holes.remove(p)
                walkable_coords.add(p)
            
            # Tính lại path (lúc này chắc chắn có đường) hoặc dùng luôn backup_path
            # Để đẹp hơn, gọi lại _find_path (có thể tìm đường tối ưu hơn đường thẳng)
            path_coords = self._find_path(start_pos, target_pos, walkable_coords)
            if not path_coords:
                 # Fallback cuối cùng nếu _find_path vẫn fail (hiếm)
                 path_coords = [start_pos] + backup_path

        # Các khối nền là tất cả các ô có thể đi được, cộng thêm path để chắc chắn
        # Fallback có thể thêm path vào walkable, nhưng an toàn tuyệt đối là hợp nhất
        safe_placement = walkable_coords.union(set(path_coords))
        safe_placement.add(start_pos)
        safe_placement.add(target_pos)
        placement_coords = list(safe_placement)

        # [NEW] Tạo metadata cho Placers
        # Create rows and columns from walkable coords
        rows_dict = {}
        cols_dict = {}
        for coord in walkable_coords:
            x, y, z = coord
            if z not in rows_dict:
                rows_dict[z] = []
            rows_dict[z].append(coord)
            if x not in cols_dict:
                cols_dict[x] = []
            cols_dict[x].append(coord)
        
        metadata = {
            "topology_type": "grid_with_holes",
            "rows": list(rows_dict.values()),
            "columns": list(cols_dict.values()),
            "holes": list(holes),
            "width": width,
            "depth": depth,
            # [NEW] Semantic positions for segment_based strategy
            "semantic_positions": {
                'start': start_pos,
                'end': target_pos,
                'optimal_start': 'start',
                'optimal_end': 'end',
                'valid_pairs': [
                    {
                        'name': 'avoid_holes_easy',
                        'start': 'start',
                        'end': 'end',
                        'path_type': 'safe_path',
                        'strategies': ['segment_based', 'island_based'],
                        'difficulty': 'EASY',
                        'teaching_goal': 'Items on safe paths'
                    },
                    {
                        'name': 'hole_edge_medium',
                        'start': 'start',
                        'end': 'end',
                        'path_type': 'hole_adjacent',
                        'strategies': ['segment_based', 'path_around_holes'],
                        'difficulty': 'MEDIUM',
                        'teaching_goal': 'Items near holes'
                    },
                    {
                        'name': 'optimization_hard',
                        'start': 'start',
                        'end': 'end',
                        'path_type': 'optimal_path',
                        'strategies': ['segment_based', 'path_around_holes'],
                        'difficulty': 'HARD',
                        'teaching_goal': 'Optimal path discovery'
                    }
                ]
            }
        }

        return PathInfo(
            start_pos=start_pos,
            target_pos=target_pos,
            path_coords=path_coords,
            placement_coords=placement_coords,
            obstacles=[], # [CHUẨN HÓA] Không cần định nghĩa "hole" là obstacle nữa
            metadata=metadata
        )

    def _find_path(self, start: Coord, end: Coord, grid: Set[Coord]) -> List[Coord]:
        """Sử dụng BFS để tìm đường đi ngắn nhất giữa hai điểm trên lưới."""
        queue = deque([(start, [start])])
        visited = {start}

        while queue:
            current_pos, path = queue.popleft()
            if current_pos == end:
                return path

            x, y, z = current_pos
            for dx, dz in [(0, 1), (0, -1), (1, 0), (-1, 0)]:
                next_pos = (x + dx, y, z + dz)
                if next_pos in grid and next_pos not in visited:
                    visited.add(next_pos)
                    new_path = list(path)
                    new_path.append(next_pos)
                    queue.append((next_pos, new_path))
        return [] # Trả về rỗng nếu không tìm thấy đường đi