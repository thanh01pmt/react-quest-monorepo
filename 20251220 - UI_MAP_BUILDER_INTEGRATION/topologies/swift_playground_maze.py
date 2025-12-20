# src/map_generator/topologies/swift_playground_maze.py
import random
from typing import List, Set, Iterator
import copy
from .base_topology import BaseTopology
from src.map_generator.models.path_info import PathInfo, Coord
from src.utils.geometry import add_vectors, UP_Y


class SwiftPlaygroundMazeTopology(BaseTopology):
    """
    Tạo ra một mê cung nhiều tầng với các sàn nhỏ được nối với nhau bằng các bậc thang.
    Đảm bảo có một đường đi liên tục từ điểm bắt đầu đến điểm kết thúc.
    """

    def generate_path_info_variants(self, grid_size: tuple, params: dict, max_variants: int) -> Iterator[PathInfo]:
        """
        [KIẾN TRÚC MỚI] Tạo ra các biến thể mê cung 3D với số lượng và kích thước sàn khác nhau.
        """
        count = 0
        # Lặp qua các cấu hình có thể có
        for num_p in range(2, 9):  # [HIỆU CHỈNH] Bắt đầu từ 2 đến 8 sàn
            for p_size in [3, 5]:  # [FIX] Tối thiểu size=3 để đủ không gian cho cầu thang
                if count >= max_variants:
                    return

                variant_params = copy.deepcopy(params)
                variant_params['num_platforms'] = num_p
                variant_params['platform_size'] = p_size
                yield self.generate_path_info(grid_size, variant_params)
                count += 1


    # [SỬA LỖI] Chuyển các biến giới hạn thành thuộc tính của class để có thể truy cập trong _is_valid
    maze_width: int = 20
    maze_depth: int = 20
    def _is_valid(self, x, y, z) -> bool:
        return 0 <= x < self.maze_width and 0 <= y < 20 and 0 <= z < self.maze_depth

    def _add_platform(self, placement: Set[Coord], cx, cz, y, size: int = 3):
        """Sàn vuông tại Y cố định"""
        # [CẢI TIẾN] Tính toán bán kính để tạo sàn với kích thước bất kỳ
        radius = size // 2
        for dx in range(-radius, radius + 1):
            for dz in range(-radius, radius + 1):
                px, pz = cx + dx, cz + dz
                if self._is_valid(px, y, pz):
                    coord = (px, y, pz)
                    placement.add(coord)

    def _create_path_segment(self, start_coord: Coord, end_coord: Coord) -> List[Coord]:
        """
        [FIX] Tạo một đoạn đường đi thẳng (ngang hoặc dọc) giữa hai điểm.
        Sử dụng Y của end_coord cho tất cả các điểm trong segment.
        """
        path = []
        current = list(start_coord)
        # [FIX] Sử dụng Y của end_coord cho path (vì segment là ngang)
        target_y = end_coord[1]
        current[1] = target_y  # Chuyển Y ngay từ đầu
        
        dx = 1 if end_coord[0] > start_coord[0] else -1 if end_coord[0] < start_coord[0] else 0
        dz = 1 if end_coord[2] > start_coord[2] else -1 if end_coord[2] < start_coord[2] else 0
        
        while (current[0], current[2]) != (end_coord[0], end_coord[2]):
            if current[0] != end_coord[0]:
                current[0] += dx
            elif current[2] != end_coord[2]:
                current[2] += dz
            path.append(tuple(current))
        return path

    def generate_path_info(self, grid_size: tuple, params: dict) -> PathInfo:
        print("    LOG: Generating DYNAMIC 'swift_playground_maze' topology...")

        placement_coords: Set[Coord] = set()
        path_coords: List[Coord] = []
        obstacles: List[dict] = []

        # --- [CHUẨN HÓA DỮ LIỆU] Hàm nội bộ để đọc và chuyển đổi tham số thành số nguyên ---
        def _get_int_param(key: str, default: int) -> int:
            val = params.get(key, default)
            try:
                # Loại bỏ dấu ngoặc kép nếu có và chuyển đổi thành số nguyên
                return int(str(val).strip().strip('"'))
            except (ValueError, TypeError):
                # Nếu chuyển đổi thất bại, trả về giá trị mặc định
                print(f"   - ⚠️ Cảnh báo: Không thể phân tích tham số '{key}' với giá trị '{val}'. Sử dụng giá trị mặc định là {default}.")
                return default

        # --- [NÂNG CẤP] Đọc tham số để sinh map động ---
        # [SỬA LỖI] Sử dụng hàm chuẩn hóa để đảm bảo các tham số luôn là số nguyên
        num_platforms = _get_int_param('num_platforms', 6)
        self.maze_width = _get_int_param('maze_width', 20)
        self.maze_depth = _get_int_param('maze_depth', 20)
        # [CẢI TIẾN] Đọc kích thước sàn từ params, mặc định là 3
        platform_size = _get_int_param('platform_size', 3)
        # [FIX] Enforce minimum platform_size of 3 for staircase spacing
        if platform_size < 3:
            platform_size = 3
        platform_radius = platform_size // 2
        height_increase = 2  # Mỗi sàn cao hơn 2 bậc
        # [CẢI TIẾN] Đọc khoảng cách di chuyển từ params, nếu không có thì tự tính
        step_distance = _get_int_param('step_distance', platform_size + _get_int_param('gap', 2))

        # --- [NÂNG CẤP] Tự động sinh waypoints ---
        waypoints = []
        # Bắt đầu ở một góc
        current_pos = [1 + platform_radius, 0, 1 + platform_radius]
        waypoints.append(tuple(current_pos))

        # [REWRITTEN] Thuật toán sinh waypoint linh hoạt hơn
        # 0: +X, 1: -X, 2: +Z, 3: -Z
        possible_moves = list(range(4))
        random.shuffle(possible_moves)
        last_move_axis = -1

        for i in range(num_platforms - 1):
            moved = False
            for move_idx in possible_moves:
                axis = 0 if move_idx < 2 else 2
                direction = 1 if move_idx % 2 == 0 else -1

                # Tránh đi ngược lại trục vừa dùng
                if axis == last_move_axis:
                    continue

                next_pos = list(current_pos)
                next_pos[axis] += direction * step_distance
                next_pos[1] += height_increase

                # [CẢI TIẾN] Kiểm tra biên một cách chặt chẽ hơn
                if (1 + platform_radius <= next_pos[0] <= self.maze_width - platform_radius) and \
                   (1 + platform_radius <= next_pos[2] <= self.maze_depth - platform_radius):
                    
                    current_pos = next_pos
                    waypoints.append(tuple(current_pos))
                    last_move_axis = axis
                    moved = True
                    # Xáo trộn lại các hướng đi để tăng tính ngẫu nhiên cho lần sau
                    random.shuffle(possible_moves)
                    break # Đã tìm được vị trí, chuyển sang tạo sàn tiếp theo
            
            if not moved:
                print(f"   - ⚠️ Cảnh báo: Không đủ không gian để tạo sàn thứ {i+2}. Đã dừng ở {len(waypoints)} sàn.")
                # Cập nhật lại num_platforms để logic phía dưới không bị lỗi
                num_platforms = len(waypoints)
                break

        # Tạo sàn đầu tiên và đặt điểm bắt đầu
        if not waypoints:
            print("   - ⛔ Lỗi nghiêm trọng: Không thể tạo được waypoint nào. Trả về map trống.")
            return PathInfo(start_pos=(0,0,0), target_pos=(0,0,0))

        start_pos = waypoints[0]
        path_coords.append(start_pos)
        self._add_platform(placement_coords, start_pos[0], start_pos[2], start_pos[1], size=platform_size)

        # Nối các waypoint lại với nhau
        for i in range(len(waypoints) - 1):
            p1 = waypoints[i]
            p2 = waypoints[i+1]

            # [REWRITE] Sử dụng logic cầu thang đơn giản hơn
            # Mỗi bước: tiến 1 block theo horizontal + tăng/giảm 1 Y
            
            # Xác định hướng di chuyển horizontal
            dx = 1 if p2[0] > p1[0] else -1 if p2[0] < p1[0] else 0
            dz = 1 if p2[2] > p1[2] else -1 if p2[2] < p1[2] else 0
            horizontal_dir = (dx, 0, dz)
            
            # Tính số bậc thang cần (bằng height_increase = 2)
            height_diff = p2[1] - p1[1]
            y_step = 1 if height_diff > 0 else -1
            num_steps = abs(height_diff)
            
            current_pos = p1
            
            # Bước 1: Đi ra rìa platform (1 block)
            edge_pos = add_vectors(current_pos, horizontal_dir)
            placement_coords.add(edge_pos)
            path_coords.append(edge_pos)
            current_pos = edge_pos
            
            # Bước 2-N: Tạo các bậc thang (mỗi bậc 1 horizontal + 1 vertical)
            for step in range(num_steps):
                # Tiến 1 block theo horizontal VÀ lên/xuống 1 Y
                next_x = current_pos[0] + horizontal_dir[0]
                next_y = current_pos[1] + y_step
                next_z = current_pos[2] + horizontal_dir[2]
                next_pos = (next_x, next_y, next_z)
                
                placement_coords.add(next_pos)
                path_coords.append(next_pos)
                current_pos = next_pos
            
            # Bước cuối: Kết nối vào platform đích
            # Platform đích đã được tạo phía dưới
            self._add_platform(placement_coords, p2[0], p2[2], p2[1], size=platform_size)
            
            # Đi từ cuối stair vào center của platform
            path_segment = self._create_path_segment(current_pos, p2)
            for coord in path_segment:
                placement_coords.add(coord)
            path_coords.extend(path_segment)

        # [FIX] Sử dụng waypoint cuối cùng làm target_pos thay vì path_coords[-1]
        # Waypoint là center của platform, đảm bảo nằm đúng trên block thực
        target_pos = waypoints[-1] if waypoints else start_pos

        # [SỬA LỖI QUAN TRỌNG & CHUẨN HÓA]
        # Hợp nhất `placement_coords` (toàn bộ cấu trúc sàn) vào `path_coords`.
        # Điều này đảm bảo rằng khi PathSearchingPlacer thực hiện gán
        # `path_info.placement_coords = path_info.path_coords`,
        # nó sẽ không làm mất cấu trúc map. `path_coords` giờ đây sẽ là nguồn
        # đáng tin cậy cho cả việc render và tìm đường.
        final_path_coords = list(dict.fromkeys(path_coords + list(placement_coords)))

        # [NEW] Tạo metadata cho Placers
        # Group coords by Y level (platforms)
        platforms_dict = {}
        stairs = []
        for coord in placement_coords:
            y_level = coord[1]
            if y_level not in platforms_dict:
                platforms_dict[y_level] = []
            platforms_dict[y_level].append(coord)
        
        # Identify stairs from obstacles
        for obs in obstacles:
            if obs.get("type") == "obstacle":
                stairs.append(obs["pos"])
        
        platforms = list(platforms_dict.values())
        
        # [NEW] Semantic positions for segment_based strategy
        semantic_positions = {
            'start_platform': start_pos,
            'end_platform': target_pos,
            'optimal_start': 'start_platform',
            'optimal_end': 'end_platform',
            'valid_pairs': [
                {
                    'name': 'start_to_end_easy',
                    'start': 'start_platform',
                    'end': 'end_platform',
                    'path_type': 'linear_climb',
                    'strategies': ['segment_based', 'height_progression'],
                    'difficulty': 'EASY',
                    'teaching_goal': 'Simple platform-to-platform traversal'
                },
                {
                    'name': 'platform_hop_medium',
                    'start': 'start_platform',
                    'end': 'end_platform',
                    'path_type': 'room_based',
                    'strategies': ['segment_based', 'room_based'],
                    'difficulty': 'MEDIUM',
                    'teaching_goal': 'Platform-based item placement'
                },
                {
                    'name': 'multi_level_hard',
                    'start': 'start_platform',
                    'end': 'end_platform',
                    'path_type': 'full_traversal',
                    'strategies': ['segment_based', 'junction_based'],
                    'difficulty': 'HARD',
                    'teaching_goal': 'Cross-platform patterns with height awareness'
                }
            ]
        }
        
        # Add waypoint positions
        for i, wp in enumerate(waypoints):
            semantic_positions[f'platform_{i}'] = wp
        
        metadata = {
            "topology_type": "swift_playground_maze",
            "platforms": platforms,
            "stairs": stairs,
            "waypoints": waypoints,
            "num_platforms": num_platforms,
            "semantic_positions": semantic_positions,  # [NEW]
        }

        return PathInfo(
            start_pos=start_pos,
            target_pos=target_pos,
            path_coords=final_path_coords, # Sử dụng path_coords đã được hợp nhất
            obstacles=obstacles,
            metadata=metadata
        )