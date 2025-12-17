# src/map_generator/topologies/u_shape.py

import random
import copy
from .base_topology import BaseTopology
from src.map_generator.models.path_info import PathInfo, Coord
from src.utils.geometry import add_vectors, FORWARD_X, FORWARD_Z, BACKWARD_X, BACKWARD_Z

class UShapeTopology(BaseTopology):
    """
    Tạo ra một con đường hình chữ U trên mặt phẳng 2D.
    Lý tưởng cho các bài học về tuần tự lệnh có hai lần rẽ cùng chiều.
    """
    def generate_path_info_variants(self, grid_size: tuple, params: dict, max_variants: int) -> "Iterator[PathInfo]":
        """
        [KIẾN TRÚC MỚI] Tạo ra các biến thể hình chữ U với kích thước cạnh khác nhau.
        """
        base_side_len = int(params.get('side_legs_length', 3))
        base_base_len = int(params.get('base_leg_length', 3))

        for i in range(max_variants):
            variant_params = copy.deepcopy(params)
            # [CẢI TIẾN] Tăng dần kích thước các cạnh một cách cân bằng và rõ ràng hơn.
            variant_params['side_legs_length'] = base_side_len + (i // 2) # Tăng 1 sau mỗi 2 biến thể
            variant_params['base_leg_length'] = base_base_len + ((i + 1) // 2) # Tăng 1 sau mỗi 2 biến thể, lệch pha với side_len

            yield self.generate_path_info(grid_size, variant_params)

    def generate_path_info(self, grid_size: tuple, params: dict) -> PathInfo:
        print("    LOG: Generating 'u_shape' topology...")

        side_legs_len = params.get('side_legs_length', random.randint(3, 4))
        base_leg_len = params.get('base_leg_length', random.randint(3, 4))

        # [CẢI TIẾN] Tính toán kích thước cần thiết một cách linh hoạt
        # Giả sử hướng ban đầu là Z, hướng rẽ là X
        required_depth = side_legs_len + 1
        required_width = base_leg_len + 1

        # Đảm bảo hình dạng nằm gọn trong map
        if required_width > grid_size[0] - 2 or required_depth > grid_size[2] - 2:
            base_leg_len = min(base_leg_len, grid_size[0] - 3)
            side_legs_len = min(side_legs_len, grid_size[2] - 3)

        # Chọn vị trí bắt đầu an toàn
        start_x = random.randint(1, grid_size[0] - required_width - 1)
        start_z = random.randint(1, grid_size[2] - required_depth - 1)
        y = 0
        start_pos: Coord = (start_x, y, start_z)

        # [CẢI TIẾN] Ngẫu nhiên hóa hướng của chữ U
        initial_dir = random.choice([FORWARD_Z, BACKWARD_Z, FORWARD_X, BACKWARD_X])
        turn_dir = random.choice(['right', 'left'])

        TURN_MAP = {
            FORWARD_X:  {"right": FORWARD_Z,  "left": BACKWARD_Z},
            BACKWARD_X: {"right": BACKWARD_Z, "left": FORWARD_Z},
            FORWARD_Z:  {"right": BACKWARD_X, "left": FORWARD_X},
            BACKWARD_Z: {"right": FORWARD_X,  "left": BACKWARD_X}
        }

        dir1 = initial_dir
        dir2 = TURN_MAP[dir1][turn_dir]
        dir3 = (dir1[0] * -1, dir1[1], dir1[2] * -1) # Hướng ngược lại với dir1

        # [SỬA LỖI] Luôn bắt đầu path_coords với vị trí xuất phát.
        path_coords: list[Coord] = [start_pos]
        current_pos = start_pos

        # Vẽ cạnh 1
        for _ in range(side_legs_len):
            current_pos = add_vectors(current_pos, dir1)
            path_coords.append(current_pos)

        # Vẽ cạnh 2 (cạnh đáy)
        for _ in range(base_leg_len):
            current_pos = add_vectors(current_pos, dir2)
            path_coords.append(current_pos)

        # Vẽ cạnh 3
        for _ in range(side_legs_len):
            current_pos = add_vectors(current_pos, dir3)
            path_coords.append(current_pos)

        target_pos = path_coords[-1]

        # [NEW] Tạo metadata cho Placers
        # Chia path thành 3 nhánh: leg1, base, leg2
        leg1_end = side_legs_len + 1  # +1 cho start_pos
        base_end = leg1_end + base_leg_len
        
        left_leg = path_coords[:leg1_end]
        bottom_base = path_coords[leg1_end - 1:base_end]
        right_leg = path_coords[base_end - 1:]
        
        metadata = {
            "branches": [left_leg, bottom_base, right_leg],
            "left_leg": left_leg,
            "bottom_base": bottom_base,
            "right_leg": right_leg,
        }

        return PathInfo(
            start_pos=start_pos,
            target_pos=target_pos,
            path_coords=path_coords,
            placement_coords=path_coords, # [CHUẨN HÓA] Gán tường minh để đảm bảo placer hoạt động đúng.
            metadata=metadata
        )