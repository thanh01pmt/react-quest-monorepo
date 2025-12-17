# src/map_generator/topologies/triangle.py

import random
from .base_topology import BaseTopology
import copy
from src.map_generator.models.path_info import PathInfo, Coord
from src.utils.geometry import add_vectors, FORWARD_X, FORWARD_Z, BACKWARD_X

class TriangleTopology(BaseTopology):
    """
    Tạo ra một bề mặt hình tam giác vuông được lấp đầy.
    Đường đi sẽ chạy dọc theo 2 cạnh góc vuông.
    Lý tưởng cho các bài học về vòng lặp lồng nhau hoặc tọa độ.
    """
    def generate_path_info_variants(self, grid_size: tuple, params: dict, max_variants: int) -> "Iterator[PathInfo]":
        """
        [KIẾN TRÚC MỚI] Tạo ra các biến thể hình tam giác với kích thước khác nhau.
        """
        count = 0
        # Lặp qua các kích thước có thể có
        for size in range(4, 10):
            if count >= max_variants: return
            
            variant_params = copy.deepcopy(params)
            variant_params['leg_a_length'] = size
            variant_params['leg_b_length'] = size
            yield self.generate_path_info(grid_size, variant_params)
            count += 1

    def generate_path_info(self, grid_size: tuple, params: dict) -> PathInfo:
        print("    LOG: Generating 'triangle' topology...")

        width = params.get('leg_a_length', random.randint(5, 7))
        depth = params.get('leg_b_length', random.randint(5, 7))

        # [CẢI TIẾN] Thêm kiểm tra để đảm bảo kích thước tối thiểu, giúp code an toàn hơn
        # khi được gọi độc lập với các tham số tùy chỉnh.
        width = max(2, width)
        depth = max(2, depth)

        # Chọn vị trí góc dưới bên phải của tam giác để bắt đầu vẽ
        # Điều này giúp logic lấp đầy dễ hơn
        base_x = random.randint(1, grid_size[0] - width - 2)
        base_z = random.randint(1, grid_size[2] - depth - 2)
        y = 0

        # --- PHẦN 1: TẠO BỀ MẶT TAM GIÁC (placement_coords) ---
        # Lấp đầy toàn bộ khu vực tam giác
        placement_coords = set()
        for z_offset in range(depth + 1):
            # Với mỗi hàng Z, chiều dài hàng X giảm dần
            row_width = int(width * (1 - z_offset / depth))
            for x_offset in range(row_width + 1):
                coord = (base_x + x_offset, y, base_z + z_offset)
                placement_coords.add(coord)
        
        # --- PHẦN 2: TẠO ĐƯỜNG ĐI TRÊN VIỀN (path_coords) ---
        # Đường đi là 2 cạnh góc vuông. Bắt đầu từ một góc, kết thúc ở góc kia.
        # Các đỉnh của tam giác:
        # A = (base_x, base_z)
        # B = (base_x, base_z + depth)
        # C = (base_x + width, base_z)

        # Chọn đường đi từ C -> A -> B
        start_pos: Coord = (base_x + width, y, base_z)
        
        path_coords: list[Coord] = [start_pos]
        current_pos = start_pos

        # 1. Đi dọc cạnh ngang (từ C đến A)
        for _ in range(width):
            current_pos = add_vectors(current_pos, BACKWARD_X)
            path_coords.append(current_pos)

        # 2. Đi dọc cạnh dọc (từ A đến B)
        for _ in range(depth):
            current_pos = add_vectors(current_pos, FORWARD_Z)
            path_coords.append(current_pos)

        target_pos = current_pos

        # [NEW] Tạo metadata cho Placers
        corner_a = (base_x, y, base_z)
        corner_b = (base_x, y, base_z + depth)
        corner_c = (base_x + width, y, base_z)
        corners = [corner_a, corner_b, corner_c]
        
        # Segments are the two perpendicular sides
        seg_horizontal = [(base_x + width - i, y, base_z) for i in range(width + 1)]
        seg_vertical = [(base_x, y, base_z + i) for i in range(depth + 1)]
        segments = [seg_horizontal, seg_vertical]
        
        metadata = {
            "segments": segments,
            "corners": corners,
            "width": width,
            "depth": depth,
        }

        return PathInfo(
            start_pos=start_pos,
            target_pos=target_pos,
            path_coords=path_coords,
            placement_coords=list(placement_coords),
            metadata=metadata
        )