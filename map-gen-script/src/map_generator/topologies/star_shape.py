import random
from .base_topology import BaseTopology
from typing import Iterator
import copy
from src.map_generator.models.path_info import PathInfo, Coord
from src.utils.geometry import add_vectors, FORWARD_X, FORWARD_Z, BACKWARD_X, BACKWARD_Z

class StarShapeTopology(BaseTopology):
    """
    Tạo ra một đường đi liên tục theo đường viền của một ngôi sao 5 cánh (pixel art).
    Đường đi được thiết kế để có Eulerian Path, cho phép robot di chuyển hết toàn bộ map.
    """
    def generate_path_info_variants(self, grid_size: tuple, params: dict, max_variants: int) -> "Iterator[PathInfo]":
        """
        [REWRITTEN] Tạo biến thể bằng cách tăng dần kích thước từ params gốc.
        """
        base_size = int(params.get('star_size', 2))

        for i in range(max_variants):
            variant_params = copy.deepcopy(params)
            # Tăng dần kích thước cho mỗi biến thể
            variant_params['star_size'] = base_size + i
            # Cập nhật cả path_length để Placer có yêu cầu tương ứng
            if 'path_length' in variant_params:
                variant_params['path_length'] = int(params.get('path_length', 3)) + i

            yield self.generate_path_info(grid_size, variant_params)

    def generate_path_info(self, grid_size: tuple, params: dict) -> PathInfo:
        print("    LOG: Generating 'star_shape' (outline) topology...")
        size = params.get('star_size', 3)  # Kích thước mỗi đoạn của ngôi sao
        # [NÂNG CẤP] Đọc path_mode để quyết định loại đường đi trả về.
        # 'full_outline' (mặc định) cho các Placer thông thường.
        # 'straight_segment' cho PathSearchingPlacer.
        path_mode = params.get('path_mode', 'full_outline')
        if size < 2: size = 2

        center_x = grid_size[0] // 2
        center_z = grid_size[2] // 2

        # --- PHẦN 1: TẠO HÌNH DẠNG (placement_coords) ---
        current_pos = (center_x, 0, center_z - size * 2)
        path_coords = [current_pos]

        # Ánh xạ hướng chuỗi sang vector
        direction_map = {
            'right': FORWARD_X,
            'down': FORWARD_Z,
            'left': BACKWARD_X,
            'up': BACKWARD_Z,
        }

        # [MỚI] Lưu trữ các đoạn thẳng để chọn làm đường đi chính
        straight_segments = []
        # Danh sách các đoạn di chuyển (hướng, số bước) để vẽ viền ngôi sao
        segments = [
            ('right', size),     # Đi đến đỉnh trên-phải
            ('down', size),      # Đi xuống cánh phải
            ('left', size),      # Đi vào trong
            ('down', size),      # Đi xuống đỉnh dưới-phải
            ('left', size),      # Đi qua đỉnh dưới
            ('up', size),        # Đi lên đỉnh dưới-trái
            ('left', size),      # Đi ra cánh trái
            ('up', size),        # Đi lên đỉnh trên-trái
            ('right', size),     # Đi vào trong
            ('up', size - 1),    # Đi lên gần đỉnh trên để nối vòng lặp
        ]

        for direction_key, steps in segments:
            segment_start_pos = current_pos
            move_vector = direction_map[direction_key]
            current_segment = [segment_start_pos]
            for _ in range(steps):
                current_pos = add_vectors(current_pos, move_vector)
                path_coords.append(current_pos)
                current_segment.append(current_pos)
            straight_segments.append(current_segment)

        # Loại bỏ các điểm trùng lặp nhưng vẫn giữ nguyên thứ tự
        placement_coords = list(dict.fromkeys(path_coords))

        # --- PHẦN 2: [NÂNG CẤP] TẠO ĐƯỜNG ĐI (path_coords) DỰA TRÊN path_mode ---
        if path_mode == 'straight_segment':
            # Chế độ cũ: Trích xuất một đoạn thẳng cho PathSearchingPlacer.
            # Chọn một trong các đoạn thẳng dài nhất (các "cánh" của ngôi sao).
            if straight_segments:
                # Lọc ra các đoạn có độ dài `size+1` (các cánh ngoài)
                long_segments = [seg for seg in straight_segments if len(seg) == size + 1]
                final_path = random.choice(long_segments) if long_segments else random.choice(straight_segments)
            else:
                final_path = placement_coords # Fallback
        else:
            # Chế độ mới (mặc định): Sử dụng toàn bộ đường viền làm đường đi.
            final_path = placement_coords

        # [NEW] Tạo metadata cho Placers
        metadata = {
            "segments": straight_segments,
            "star_size": size,
        }

        return PathInfo(
            start_pos=final_path[0],
            target_pos=final_path[-1],
            path_coords=final_path,
            # `placement_coords` luôn là toàn bộ cấu trúc để render nền.
            placement_coords=placement_coords,
            metadata=metadata
        )