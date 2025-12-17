# src/map_generator/topologies/complex_maze.py

import copy
from collections import deque # For BFS
import random
from typing import List, Tuple, Optional
from .base_topology import BaseTopology
from src.map_generator.models.path_info import PathInfo, Coord

class ComplexMazeTopology(BaseTopology):
    """
    Tạo ra một mê cung phức tạp bằng thuật toán Randomized Depth-First Search.
    Mê cung này đảm bảo có một lối đi duy nhất từ điểm đầu đến mọi điểm khác.
    """

    def generate_path_info_variants(self, grid_size: tuple, params: dict, max_variants: int) -> "Iterator[PathInfo]":
        """
        [REWRITTEN] Tạo ra các biến thể mê cung với kích thước khác nhau, tôn trọng max_variants.
        """
        # Lấy kích thước cơ bản từ params, nếu không có thì dùng giá trị mặc định là 5.
        # Đảm bảo kích thước cơ bản là số lẻ.
        base_width_param = params.get('maze_width', 5)
        base_size = base_width_param if isinstance(base_width_param, int) else base_width_param[0]
        if base_size % 2 == 0:
            base_size += 1

        for i in range(max_variants):
            # Mỗi biến thể sẽ có kích thước tăng lên 2 để đảm bảo luôn là số lẻ.
            size = base_size + i * 2

            # [CẢI TIẾN] Thêm giới hạn trên cho kích thước để tránh map quá lớn.
            # 21 là một giới hạn hợp lý (sẽ được làm tròn xuống 20 nếu cần).
            if size > 21:
                break # Dừng việc tạo biến thể nếu kích thước vượt quá giới hạn

            variant_params = copy.deepcopy(params)
            variant_params['maze_width'] = size
            variant_params['maze_depth'] = size
            yield self.generate_path_info(grid_size, variant_params)

    def generate_path_info(self, grid_size: tuple, params: dict) -> PathInfo:
        """
        Hiện thực hóa thuật toán sinh mê cung.

        Returns:
            PathInfo: Một đối tượng chứa vị trí bắt đầu, đích và một danh sách
                      dài các tọa độ của tường tạo nên mê cung.
        """
        print("    LOG: Generating 'complex_maze' topology using Randomized DFS...")

        # --- (CẢI TIẾN) Đọc và ngẫu nhiên hóa kích thước mê cung từ params ---
        width_param = params.get('maze_width', [5, 20])
        depth_param = params.get('maze_depth', [5, 20])

        req_width = random.randint(*width_param) if isinstance(width_param, list) else width_param
        req_depth = random.randint(*depth_param) if isinstance(depth_param, list) else depth_param

        # Mê cung sẽ được tạo trên lưới 2D (XZ), với chiều cao Y cố định là 0.
        # Để thuật toán hoạt động tốt, lưới phải có kích thước lẻ.
        width = req_width if req_width % 2 != 0 else req_width - 1
        depth = req_depth if req_depth % 2 != 0 else req_depth - 1
        
        # Tạo một lưới ban đầu chứa đầy tường.
        # Giá trị '1' đại diện cho tường (wall), '0' đại diện cho đường đi (path).
        grid = [[1 for _ in range(depth)] for _ in range(width)]

        # Chọn một điểm bắt đầu ngẫu nhiên cho thuật toán "đào hầm".
        # Điểm này phải có tọa độ lẻ để nằm giữa các "bức tường" của lưới.
        start_x = random.randrange(1, width, 2)
        start_z = random.randrange(1, depth, 2)
        
        # Sử dụng một stack (ngăn xếp) để theo dõi đường đi của thuật toán DFS.
        stack = [(start_x, start_z)]
        grid[start_x][start_z] = 0  # Đánh dấu điểm bắt đầu là đường đi.

        while stack:
            cx, cz = stack[-1]  # Lấy ô hiện tại (peek).

            # Tìm các "hàng xóm" cách 2 ô mà chưa được ghé thăm (vẫn là tường).
            neighbors = []
            # (dx, dz) là các vector di chuyển tới hàng xóm.
            for dx, dz in [(0, 2), (0, -2), (2, 0), (-2, 0)]:
                nx, nz = cx + dx, cz + dz
                # Kiểm tra xem hàng xóm có nằm trong biên của lưới không.
                if 0 <= nx < width and 0 <= nz < depth and grid[nx][nz] == 1:
                    neighbors.append((nx, nz))

            if neighbors:
                # Nếu có hàng xóm hợp lệ, chọn ngẫu nhiên một trong số chúng.
                nx, nz = random.choice(neighbors)
                
                # "Đục tường" nằm giữa ô hiện tại và hàng xóm đã chọn.
                wall_x, wall_z = (cx + nx) // 2, (cz + nz) // 2
                grid[wall_x][wall_z] = 0
                
                # Đánh dấu ô hàng xóm là đường đi.
                grid[nx][nz] = 0
                
                # Thêm hàng xóm vào stack để tiếp tục khám phá từ vị trí mới này.
                stack.append((nx, nz))
            else:
                # Nếu không còn hàng xóm (ngõ cụt), quay lui (backtrack).
                stack.pop()

        # Chuyển đổi lưới 2D (chứa 0 và 1) thành danh sách chướng ngại vật 3D.
        obstacles = []
        # [FIX] Chọn một loại tường ngẫu nhiên và áp dụng cho toàn bộ mê cung.
        # Điều này đảm bảo tất cả các tường trong một map đều có cùng một giao diện.
        wall_models = ['wall.stone01', 'lava.lava01', 'water.water01']
        chosen_wall_model = random.choice(wall_models)
        for x in range(width):
            for z in range(depth):
                if grid[x][z] == 1:
                    obstacles.append({"type": "wall", "modelKey": chosen_wall_model, "pos": (x, 0, z), "is_surface_obstacle": True})

        # Xác định vị trí bắt đầu và kết thúc của màn chơi.
        # Chúng ta thường chọn hai góc đối diện để tạo ra thử thách dài nhất.
        start_pos: Coord = (1, 0, 1)
        target_pos: Coord = (width - 2, 0, depth - 2)
        
        # Đảm bảo điểm bắt đầu và kết thúc chắc chắn là đường đi.
        # (Hiếm khi cần thiết với thuật toán này, nhưng là một bước an toàn).
        obstacles = [obs for obs in obstacles if obs["pos"] not in [start_pos, target_pos]]

        # [FIX] Tạo danh sách TẤT CẢ các ô có thể đi được (để render nền)
        all_walkable_coords = []
        for x in range(width):
            for z in range(depth):
                if grid[x][z] == 0: # '0' là đường đi
                    all_walkable_coords.append((x, 0, z))

        # [FIX] Tìm một đường đi liên tục từ start_pos đến target_pos
        # Sử dụng BFS để tìm đường đi ngắn nhất
        path_coords_found = self._find_path_in_maze(grid, (start_pos[0], start_pos[2]), (target_pos[0], target_pos[2]), width, depth)
        
        if not path_coords_found:
            # Fallback nếu không tìm thấy đường đi (rất hiếm với DFS)
            print("    LOG: Không tìm thấy đường đi từ start đến target trong mê cung. Sử dụng tất cả các ô đi được.")
            path_coords_found = [(c[0], c[2]) for c in all_walkable_coords] # Chuyển về 2D cho nhất quán
            
        # Chuyển đổi đường đi 2D thành 3D
        path_coords_3d = [(x, 0, z) for x, z in path_coords_found]

        # [NEW] Tạo metadata cho Placers
        # Find dead ends (cells with only one neighbor)
        dead_ends = []
        for coord in all_walkable_coords:
            x, z = coord[0], coord[2]
            neighbors = 0
            for dx, dz in [(0, 1), (0, -1), (1, 0), (-1, 0)]:
                nx, nz = x + dx, z + dz
                if 0 <= nx < width and 0 <= nz < depth and grid[nx][nz] == 0:
                    neighbors += 1
            if neighbors == 1:
                dead_ends.append(coord)
        
        metadata = {
            "paths": [path_coords_3d],  # Main path
            "dead_ends": dead_ends,
            "width": width,
            "depth": depth,
        }

        return PathInfo(
            start_pos=start_pos,
            target_pos=target_pos,
            path_coords=path_coords_3d,
            placement_coords=all_walkable_coords, # placement_coords vẫn là tất cả các ô đi được
            obstacles=obstacles,
            metadata=metadata
        )

    def _find_path_in_maze(self, grid: List[List[int]], start: Tuple[int, int], end: Tuple[int, int], width: int, depth: int) -> Optional[List[Tuple[int, int]]]:
        """
        Sử dụng BFS để tìm một đường đi từ điểm bắt đầu đến điểm kết thúc trong mê cung.
        """
        queue = deque([(start, [start])]) # (current_node, path_so_far)
        visited = {start}

        while queue:
            (cx, cz), path = queue.popleft()

            if (cx, cz) == end:
                return path

            for dx, dz in [(0, 1), (0, -1), (1, 0), (-1, 0)]:
                nx, nz = cx + dx, cz + dz
                if 0 <= nx < width and 0 <= nz < depth and grid[nx][nz] == 0 and (nx, nz) not in visited:
                    visited.add((nx, nz))
                    queue.append(((nx, nz), path + [(nx, nz)]))
        return None