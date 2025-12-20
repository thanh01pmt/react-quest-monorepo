# src/map_generator/topologies/hub_with_stepped_islands.py

import random
from .base_topology import BaseTopology
import copy
from src.map_generator.models.path_info import PathInfo, Coord
from src.utils.geometry import add_vectors, FORWARD_Z, FORWARD_X, BACKWARD_Z, BACKWARD_X, UP_Y, DOWN_Y, scale_vector
from typing import List, Dict, Any, Iterator

class HubWithSteppedIslandsTopology(BaseTopology):
    """
    Tạo ra một hòn đảo trung tâm và 4 hòn đảo vệ tinh ở các độ cao khác nhau,
    được nối với nhau bằng các bậc thang đi lên hoặc đi xuống.
    """

    def generate_path_info_variants(self, grid_size: tuple, params: dict, max_variants: int) -> Iterator[PathInfo]:
        """
        [KIẾN TRÚC MỚI] Tạo ra các biến thể với số lượng đảo và cấu trúc độ cao khác nhau.
        """
        count = 0
        
        # Các kịch bản về độ cao và số lượng đảo
        scenarios = [
            [3, -3],              # 2 đảo, 1 lên 1 xuống
            [2, -2, 4],           # 3 đảo, độ cao khác nhau
            [2, 3, 4],            # 3 đảo, tất cả đi lên
            [2, -2, 3, -3],       # 4 đảo
            [-2, -3, -4]          # 3 đảo, tất cả đi xuống
        ]

        for scenario in scenarios:
            if count >= max_variants:
                return
            
            # Tạo một bản sao sâu của params để không ảnh hưởng đến các lần lặp sau
            variant_params = copy.deepcopy(params)
            # Ghi đè height_options bằng kịch bản hiện tại
            variant_params['height_options'] = scenario
            
            yield self.generate_path_info(grid_size, variant_params)
            count += 1

    def _create_square_platform(self, center: Coord, size: int) -> list[Coord]:
        """Tạo một nền tảng hình vuông với tâm tại `center` và kích thước `size`."""
        cx, cy, cz = center
        half = size // 2
        platform_coords = []
        for x_offset in range(-half, half + 1):
            for z_offset in range(-half, half + 1):
                platform_coords.append((cx + x_offset, cy, cz + z_offset))
        return platform_coords

    def _create_staircase(self, start_point: Coord, direction: Coord, height_diff: int, gap_size: int) -> tuple[list[Coord], list[Coord]]:
        """
        [FIX] Tạo cầu thang với các bậc có thể nhảy được (1 height unit per step).
        `height_diff` dương thì đi lên, âm thì đi xuống.
        `direction` là hướng di chuyển trên mặt phẳng (X, Z).
        Returns:
            - path_coords: Đường đi trên cầu thang (tất cả các block đều có thể đi được).
            - obstacle_coords: Các khối vật cản (rỗng - không cần obstacles cho design này).
        """
        path = []
        obstacles = []
        current_pos = start_point
        
        # [FIX] Tạo cầu thang với các bậc có thể đi được
        # Mỗi bậc cao 1 unit (jumpable) và tiến 1 block theo direction
        steps_needed = abs(height_diff)
        y_step = 1 if height_diff > 0 else -1
        
        for _ in range(steps_needed):
            # Tiến theo hướng horizontal
            current_pos = add_vectors(current_pos, direction)
            # Thay đổi độ cao
            current_pos = (current_pos[0], current_pos[1] + y_step, current_pos[2])
            path.append(current_pos)
        
        # Thêm các bước gap ở độ cao cuối cùng (không thay đổi Y)
        for _ in range(gap_size - steps_needed):
            if gap_size > steps_needed:
                current_pos = add_vectors(current_pos, direction)
                path.append(current_pos)

        return path, obstacles

    def generate_path_info(self, grid_size: tuple, params: dict) -> PathInfo: # type: ignore
        print("    LOG: Generating 'hub_with_stepped_islands' topology...")

        hub_size = params.get('hub_size', 3)
        island_size = params.get('island_size', 3)
        gap_size = params.get('gap_size', 3)
        height_options = params.get('height_options', [])

        if not height_options or not isinstance(height_options, list):
            height_options = [2, -2, 3, -3] # Mặc định 4 đảo

        num_islands = len(height_options)

        center_x = grid_size[0] // 2
        center_z = grid_size[2] // 2

        placement_coords = []
        obstacles = []
        branches = [] # [MỚI] Để lưu các nhánh cho metadata

        # 1. Tạo hòn đảo trung tâm (Hub)
        hub_center: Coord = (center_x, 0, center_z)
        start_pos = hub_center
        hub_coords = self._create_square_platform(hub_center, hub_size)
        placement_coords.extend(hub_coords)

        # 2. Xác định vị trí và độ cao cho 4 đảo vệ tinh
        directions = [FORWARD_Z, FORWARD_X, BACKWARD_Z, BACKWARD_X] # Bắc, Đông, Nam, Tây
        random.shuffle(height_options)
        if num_islands < len(directions):
            directions = random.sample(directions, num_islands)

        # 3. Vòng lặp tạo cầu thang và các đảo
        for i in range(num_islands):
            direction = directions[i]
            height_diff = height_options[i]

            # Điểm bắt đầu của cầu thang, nằm ở rìa của Hub
            stair_start_point = add_vectors(hub_center, scale_vector(direction, hub_size // 2))

            # Tạo cầu thang và lấy đường đi, vật cản từ nó
            stair_path, stair_obstacles = self._create_staircase(stair_start_point, direction, height_diff, gap_size)
            obstacles.extend(stair_obstacles)

            # Điểm cuối của cầu thang cũng là điểm vào của đảo vệ tinh
            island_entry_point = stair_path[-1] if stair_path else stair_start_point

            # Tạo hòn đảo vệ tinh
            island_center = add_vectors(island_entry_point, scale_vector(direction, island_size // 2))
            island_coords = self._create_square_platform(island_center, island_size)

            # Cập nhật các khối cần đặt
            placement_coords.extend(island_coords)
            placement_coords.extend(stair_path) # Bậc thang cũng là nơi có thể đi được

            # [MỚI] Ghi nhận nhánh này vào metadata
            branch_path = [hub_center, stair_start_point] + stair_path + [island_center]
            branches.append(branch_path)

        # [FIX] Chọn target_pos là center của đảo cuối cùng (xa nhất từ hub)
        # thay vì lấy ngẫu nhiên từ set
        path_coords = list(set(placement_coords))
        
        # Target là center của đảo cuối cùng trong branches
        if branches:
            last_branch = branches[-1]
            target_pos = last_branch[-1]  # island_center của branch cuối
        else:
            target_pos = start_pos

        # [NEW] Calculate island centers for semantic positions
        island_centers = []
        for branch in branches:
            if branch:
                island_centers.append(branch[-1])  # Last coord is island_center
        
        # [NEW] Semantic positions for function_reuse and hub_spoke strategies
        semantic_positions = {
            'hub_center': hub_center,
            'optimal_start': 'hub_center',
            'optimal_end': 'island_0' if island_centers else 'hub_center',
            'valid_pairs': [
                {
                    'name': 'hub_to_island_easy',
                    'start': 'hub_center',
                    'end': 'island_0',
                    'path_type': 'single_island',
                    'strategies': ['function_reuse', 'hub_spoke'],
                    'difficulty': 'EASY',
                    'teaching_goal': 'Simple hub to single island traversal'
                },
                {
                    'name': 'hub_to_far_island_medium',
                    'start': 'hub_center',
                    'end': 'island_last',
                    'path_type': 'cross_hub',
                    'strategies': ['function_reuse', 'island_replication'],
                    'difficulty': 'MEDIUM',
                    'teaching_goal': 'Visit multiple islands with PROCEDURE reuse'
                },
                {
                    'name': 'island_to_island_hard',
                    'start': 'island_0',
                    'end': 'island_last',
                    'path_type': 'full_traversal',
                    'strategies': ['function_reuse', 'hub_spoke'],
                    'difficulty': 'HARD',
                    'teaching_goal': 'Visit all islands with identical patterns'
                }
            ]
        }
        
        # Add island positions dynamically
        for i, center in enumerate(island_centers):
            semantic_positions[f'island_{i}'] = center
        if island_centers:
            semantic_positions['island_last'] = island_centers[-1]

        # [MỚI] Tạo metadata để FunctionPlacer có thể hiểu cấu trúc
        metadata: Dict[str, Any] = {
            "topology_type": "hub_with_stepped_islands",
            "branches": branches,
            "hub": hub_coords,
            "center": hub_center,
            "semantic_positions": semantic_positions,  # [NEW]
        }

        return PathInfo(
            start_pos=start_pos,
            target_pos=target_pos,
            path_coords=path_coords,
            placement_coords=path_coords,
            obstacles=obstacles,
            metadata=metadata
        )