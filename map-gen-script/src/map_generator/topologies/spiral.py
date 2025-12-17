# src/map_generator/topologies/spiral.py

import random
import copy
import math
from .base_topology import BaseTopology
from src.map_generator.models.path_info import PathInfo, Coord
from src.utils.geometry import add_vectors, FORWARD_X, FORWARD_Z, BACKWARD_X, BACKWARD_Z

class SpiralTopology(BaseTopology):
    """
    Tạo ra một con đường xoắn ốc 2D hình vuông trên mặt phẳng XZ.
    Lý tưởng cho các bài học về vòng lặp với các biến thay đổi (độ dài cạnh thay đổi).
    """

    def generate_path_info_variants(self, grid_size: tuple, params: dict, max_variants: int) -> "Iterator[PathInfo]":
        """
        [KIẾN TRÚC MỚI] Tạo ra các biến thể xoắn ốc với số vòng khác nhau.
        """
        base_turns = int(params.get('num_turns', 4))
        # [NÂNG CẤP] Đọc cả hướng đi từ params gốc
        base_start_at_center = params.get('start_at_center', False)
        max_grid_dim = min(grid_size[0], grid_size[2]) - 4 # Trừ đi lề an toàn
 
        # [FIX] Vòng lặp while để tạo biến thể cho đến khi kích thước vượt quá giới hạn,
        # thay vì dựa vào max_variants. Điều này đảm bảo topology chỉ tạo ra các biến thể hợp lệ.
        i = 0
        variants_generated = 0
        while variants_generated < max_variants:
            # Logic tăng kích thước và hướng đi xen kẽ
            # i=0: size 1, dir 1; i=1: size 1, dir 2; i=2: size 2, dir 1; i=3: size 2, dir 2
            current_turns = base_turns + (i // 2)
            current_start_at_center = not base_start_at_center if i % 2 != 0 else base_start_at_center
 
            # Ước tính kích thước xoắn ốc sẽ chiếm dụng.
            # [FIX] Công thức tính kích thước chiếm dụng được cập nhật để chính xác hơn.
            # Một xoắn ốc với N lần rẽ sẽ có cạnh dài nhất khoảng N/2. Tổng kích thước là (N/2)*2 + lề.
            required_dim = (current_turns // 2) * 2 + 3
            # Dừng tạo biến thể nếu kích thước ước tính vượt quá lưới
            if required_dim > max_grid_dim:
                print(f"    LOG: (Spiral Variants) Dừng tạo biến thể ở num_turns={current_turns} vì kích thước ({required_dim}) đã vượt quá giới hạn lưới ({max_grid_dim}). Đã tạo {variants_generated} biến thể.")
                break # Thoát khỏi vòng lặp, không tạo thêm biến thể lớn hơn nữa.
 
            variant_params = copy.deepcopy(params)
            variant_params['num_turns'] = current_turns
            variant_params['start_at_center'] = current_start_at_center # [NÂNG CẤP] Gán hướng đi cho biến thể
            # Cập nhật cả path_length để Placer có yêu cầu tương ứng
            if 'path_length' in variant_params:
                variant_params['path_length'] = int(params.get('path_length', 5)) + i
 
            yield self.generate_path_info(grid_size, variant_params)
            i += 1
            variants_generated += 1

    def generate_path_info(self, grid_size: tuple, params: dict) -> PathInfo:
        """
        Tạo ra một đường đi xoắn ốc hình vuông, đi từ ngoài vào trong hoặc từ trong ra ngoài.

        Args:
            params (dict):
                - num_turns (int): Số lần rẽ góc vuông.
                - start_at_center (bool): True để bắt đầu từ tâm đi ra, False để đi từ ngoài vào.

        Returns:
            PathInfo: Một đối tượng chứa thông tin về con đường.
        """
        print("    LOG: Generating 'spiral' (2D) topology...")

        num_turns = int(params.get('num_turns', 8))
        start_at_center = params.get('start_at_center', False)
        # [REFACTOR] Thêm path_mode để quyết định loại đường đi trả về.
        # 'full_path' (mặc định) cho SpiralPlacer, 'straight_segment' cho PathSearchingPlacer.
        path_mode = params.get('path_mode', 'full_path')

        # Tính toán kích thước tối đa của xoắn ốc để nó nằm gọn trong lưới
        max_side_len = math.ceil(num_turns)
        if max_side_len * 2 > min(grid_size[0], grid_size[2]) - 4:
            num_turns = min(num_turns, 6) # Giảm số vòng nếu quá lớn
            max_side_len = math.ceil(num_turns / 2) + 1

        # Đặt tâm của xoắn ốc vào giữa lưới
        center_x = grid_size[0] // 2
        center_z = grid_size[2] // 2
        y = 0

        # Tính toán điểm bắt đầu ở góc trên-trái của hình xoắn ốc
        start_x = center_x - max_side_len // 2
        start_z = center_z - max_side_len // 2

        # --- Logic tạo xoắn ốc từ ngoài vào trong ---
        current_pos: Coord = (start_x, y, start_z)
        path_coords: list[Coord] = [current_pos]
        straight_segments = []

        # Các hướng di chuyển theo thứ tự: Phải (+X), Xuống (+Z), Trái (-X), Lên (-Z)
        directions = [FORWARD_X, FORWARD_Z, BACKWARD_X, BACKWARD_Z]
        
        # Độ dài các cạnh sẽ giảm dần
        side_length = max_side_len

        for i in range(num_turns):
            # Lấy hướng di chuyển cho cạnh hiện tại
            current_segment = [current_pos]
            move_direction = directions[i % 4]
            
            # Cứ sau 1 lần rẽ, độ dài cạnh giảm đi 1
            if i > 0:
                side_length -=1

            # Vẽ một cạnh của xoắn ốc
            for _ in range(side_length):
                current_pos = add_vectors(current_pos, move_direction)
                path_coords.append(current_pos)
                current_segment.append(current_pos)
            straight_segments.append(current_segment)

        # Loại bỏ các điểm trùng lặp có thể xảy ra ở tâm
        placement_coords = list(dict.fromkeys(path_coords))

        # --- [REWRITTEN] TẠO ĐƯỜNG ĐI THẲNG CHO PATH_SEARCHING_PLACER ---
        # Chọn một trong các cạnh thẳng của xoắn ốc làm đường đi chính.
        if straight_segments:
            # Ưu tiên các đoạn thẳng dài hơn
            straight_segments.sort(key=len, reverse=True)
            final_path = random.choice(straight_segments[:2]) # Chọn ngẫu nhiên 1 trong 2 đoạn dài nhất
        # --- [REFACTOR] Logic chọn đường đi dựa trên path_mode ---
        if path_mode == 'straight_segment':
            # Chế độ cũ: Trích xuất một đoạn thẳng cho PathSearchingPlacer
            if straight_segments:
                straight_segments.sort(key=len, reverse=True)
                final_path = random.choice(straight_segments[:2])
            else:
                final_path = placement_coords
        else:
            final_path = placement_coords # Fallback
        
            # Chế độ mới (mặc định): Sử dụng toàn bộ đường đi xoắn ốc
            final_path = placement_coords

        if start_at_center: # Nếu đi từ trong ra, đảo ngược đoạn thẳng đã chọn
            final_path.reverse()
        

        start_pos = final_path[0]
        target_pos = final_path[-1]

        # [NEW] Tạo metadata cho Placers
        metadata = {
            "rings": straight_segments,  # Each ring is a list of segments
            "num_turns": num_turns,
            "start_at_center": start_at_center,
        }

        return PathInfo(
            start_pos=start_pos,
            target_pos=target_pos,
            path_coords=final_path,
            placement_coords=placement_coords,
            metadata=metadata
        )
