# src/map_generator/topologies/stepped_island_clusters.py

import random
from .base_topology import BaseTopology
import copy
from src.map_generator.models.path_info import PathInfo, Coord
from src.utils.geometry import add_vectors, FORWARD_X, UP_Y, FORWARD_Z

class SteppedIslandClustersTopology(BaseTopology):
    """
    Tạo ra nhiều cụm đảo, với mỗi cụm ở một độ cao khác nhau,
    được nối với nhau bằng các bậc thang.
    """

    def _create_island(self, top_left_corner: Coord, size: int = 2) -> list[Coord]:
        """Tạo một hòn đảo hình vuông."""
        x, y, z = top_left_corner
        coords = []
        for i in range(size):
            for j in range(size):
                coords.append((x + i, y, z + j))
        return coords

    def _create_staircase(self, start_point: Coord, direction: Coord, num_steps: int) -> tuple[list[Coord], list[Coord], list[Coord]]:
        """
        [CHUẨN HÓA] Tạo cầu thang rỗng, đi lên theo hướng cho trước.
        Returns:
            - path_coords: Đường đi của người chơi.
            - surface_coords: Các khối bề mặt của bậc thang (để đặt nền).
            - obstacle_coords: Các khối vật cản (chỉ khối trigger cho bước nhảy).
        """
        path = []
        surfaces = []
        obstacles = []
        current_pos = start_point
        for _ in range(num_steps):
            # Bước 1: Đi ngang
            current_pos = add_vectors(current_pos, direction)
            path.append(current_pos)
            obstacles.append(current_pos) # Khối này là vật cản để nhảy LÊN
            # Bước 2: Điểm đáp sau khi nhảy (đi lên)
            current_pos = add_vectors(current_pos, UP_Y)
            path.append(current_pos)
            surfaces.append(current_pos) # Chỉ bề mặt trên cùng là khối vật lý
        return path, surfaces, obstacles

    def _create_bridge(self, start_point: Coord, end_point: Coord) -> list[Coord]:
        """Tạo một cây cầu phẳng từ start đến end theo trục X."""
        path = []
        curr_x, y, z = start_point
        end_x = end_point[0]
        step = 1 if end_x > curr_x else -1
        # Bỏ qua điểm đầu tiên vì nó đã tồn tại
        while curr_x != end_x:
            curr_x += step
            path.append((curr_x, y, z))
        return path

    def generate_path_info_variants(self, grid_size: tuple, params: dict, max_variants: int) -> "Iterator[PathInfo]":
        """
        [KIẾN TRÚC MỚI] Tạo ra các biến thể với số lượng cụm và đảo khác nhau.
        """
        count = 0
        # Lặp qua các cấu hình có thể có
        for num_c in range(2, 4):
            for isl_per_c in range(2, 4):
                if count >= max_variants: return
                
                variant_params = copy.deepcopy(params)
                variant_params['num_clusters'] = num_c
                variant_params['islands_per_cluster'] = isl_per_c
                yield self.generate_path_info(grid_size, variant_params)
                count += 1

    def generate_path_info(self, grid_size: tuple, params: dict) -> PathInfo:
        """Sinh ra các cụm đảo ở các độ cao khác nhau."""
        print("    LOG: Generating 'stepped_island_clusters' topology...")

        num_clusters = params.get('num_clusters', 2)
        islands_per_cluster = params.get('islands_per_cluster', 2)
        cluster_spacing = params.get('cluster_spacing', 8)
        height_step = params.get('height_step', 2)

        start_x = 2
        start_z = grid_size[2] // 2 - (islands_per_cluster * 2) # Căn giữa cụm đảo
        y = 0

        path_coords: list[Coord] = []
        placement_coords: list[Coord] = []
        obstacles = []
        islands: list[list[Coord]] = [] # [FIX] Collect islands for metadata

        # Tạo đảo đầu tiên làm điểm bắt đầu
        first_island = self._create_island((start_x, y, start_z), size=2)
        placement_coords.extend(first_island)
        islands.append(first_island) # [FIX]
        start_pos = (start_x, y, start_z)
        path_coords.append(start_pos)
        last_exit_point = (start_x + 1, y, start_z + 1) # Góc dưới bên phải của đảo đầu tiên
        path_coords.append(last_exit_point)

        for i in range(num_clusters):
            # Tính toán độ cao cho cụm đảo hiện tại
            island_base_y = y + i * height_step
            
            # Nối các đảo trong cụm
            for j in range(islands_per_cluster):
                # Điểm vào của đảo tiếp theo
                next_island_entry = (last_exit_point[0] + 3, island_base_y, last_exit_point[2])
                
                # Tạo cầu nối
                bridge = self._create_bridge(last_exit_point, next_island_entry)
                path_coords.extend(bridge)
                placement_coords.extend(bridge)
                
                # Tạo đảo
                island = self._create_island(next_island_entry, size=2)
                path_coords.append(next_island_entry)
                placement_coords.extend(island)
                islands.append(island) # [FIX]
                
                # Cập nhật điểm ra cho đảo/cầu tiếp theo
                last_exit_point = (next_island_entry[0] + 1, island_base_y, next_island_entry[2] + 1)
                path_coords.append(last_exit_point)

            # Nếu chưa phải cụm cuối, tạo cầu thang đi lên
            if i < num_clusters - 1:
                # [CHUẨN HÓA] Tạo cầu thang và xử lý kết quả
                stair_path, stair_surfaces, stair_obstacles = self._create_staircase(last_exit_point, FORWARD_X, height_step)
                
                path_coords.extend(stair_path)
                # Bề mặt bậc thang cũng là nơi có thể đặt nền móng, nhưng không đặt vật phẩm
                placement_coords.extend(stair_surfaces)
                # Các khối bề mặt được coi là vật cản
                obstacles.extend([{"pos": pos, "is_surface_obstacle": False} for pos in stair_obstacles])
                
                # Cập nhật điểm ra là điểm cuối của cầu thang
                last_exit_point = stair_path[-1] if stair_path else last_exit_point

        target_pos = last_exit_point
        
        # [NEW] Semantic positions for segment_based and island_replication strategies
        # Calculate island centers
        island_centers = []
        for island in islands:
            if island:
                # Center is approximately the first coordinate
                island_centers.append(island[0])
        
        semantic_positions = {
            'start_island': start_pos,
            'end_island': target_pos,
            'optimal_start': 'start_island',
            'optimal_end': 'end_island',
            'valid_pairs': [
                {
                    'name': 'island_hop_easy',
                    'start': 'start_island',
                    'end': 'end_island',
                    'path_type': 'linear_islands',
                    'strategies': ['segment_based', 'island_replication'],
                    'difficulty': 'EASY',
                    'teaching_goal': 'Simple island-to-island traversal'
                },
                {
                    'name': 'cluster_traverse_medium',
                    'start': 'start_island',
                    'end': 'end_island',
                    'path_type': 'cluster_based',
                    'strategies': ['segment_based', 'height_variation'],
                    'difficulty': 'MEDIUM',
                    'teaching_goal': 'Traverse clusters with height awareness'
                },
                {
                    'name': 'all_islands_hard',
                    'start': 'start_island',
                    'end': 'end_island',
                    'path_type': 'full_traversal',
                    'strategies': ['segment_based', 'island_replication'],
                    'difficulty': 'HARD',
                    'teaching_goal': 'Visit all islands with identical patterns'
                }
            ]
        }
        
        # Add island positions
        for i, center in enumerate(island_centers):
            semantic_positions[f'island_{i}'] = center
        
        # [FIX] Populate metadata for IslandPlacerStrategy
        # Convert islands list to segments for segment_based strategy
        segments = [[coord] for island in islands for coord in island]
        
        metadata = {
            "islands": islands,
            "topology_type": "stepped_island_clusters",
            "num_clusters": num_clusters,
            "segments": segments,  # [NEW]
            "semantic_positions": semantic_positions,  # [NEW]
        }

        return PathInfo(
            start_pos=start_pos,
            target_pos=target_pos,
            path_coords=list(dict.fromkeys(path_coords)),
            placement_coords=list(set(placement_coords)),
            obstacles=obstacles,
            metadata=metadata
        )