# src/map_generator/topologies/straight_line.py

import random
import copy
from .base_topology import BaseTopology
from src.map_generator.models.path_info import PathInfo, Coord

# --- ĐẢM BẢO TÊN LỚP NÀY HOÀN TOÀN CHÍNH XÁC ---
class StraightLineTopology(BaseTopology):
    """
    Tạo ra một con đường thẳng dài trên một trục.
    
    Đây là một topology đa năng, được sử dụng cho nhiều chủ đề khác nhau
    như Vòng lặp For, Biến, và Vòng lặp While.
    """
    def generate_path_info_variants(self, grid_size: tuple, params: dict, max_variants: int) -> "Iterator[PathInfo]":
        """
        [REWRITTEN] Tạo biến thể bắt đầu từ params gốc, sau đó tăng dần độ dài.
        Điều này đảm bảo biến thể đầu tiên luôn khớp với curriculum.
        """
        base_length = int(params.get('path_length', 5))
        max_possible_length = min(grid_size[0] - 4, grid_size[2] - 4) # Trừ lề an toàn
        
        # 1. Luôn tạo biến thể gốc đầu tiên
        yield self.generate_path_info(grid_size, params)
        
        # 2. Tạo các biến thể tiếp theo bằng cách tăng dần độ dài
        for i in range(1, max_variants):
            new_length = base_length + i
            # Dừng lại nếu đường đi quá dài so với map
            if new_length > max_possible_length:
                break
                
            variant_params = copy.deepcopy(params)
            variant_params['path_length'] = new_length
            yield self.generate_path_info(grid_size, variant_params)
    
    def generate_path_info(self, grid_size: tuple, params: dict) -> PathInfo:
        """
        Tạo ra một đường thẳng với chiều dài và hướng ngẫu nhiên.

        Args:
            params (dict): Có thể chứa 'path_length' để tùy chỉnh chiều dài.

        Returns:
            PathInfo: Một đối tượng chứa thông tin về đường thẳng.
                      'path_coords' sẽ chứa tọa độ của các ô trên đường đi.
        """
        print("    LOG: Generating 'straight_line' topology...")
        
        # Logic sinh map gốc giờ sẽ đọc trực tiếp từ params đã được biến đổi
        path_length = int(params.get('path_length', 5))

        # Đảm bảo đường đi không quá dài so với map
        max_dim = max(grid_size[0], grid_size[2])
        if path_length >= max_dim - 2:
            path_length = max_dim - 3

        # Chọn một trục (X hoặc Z) và hướng (tiến hoặc lùi) ngẫu nhiên
        axis = random.choice(['x', 'z'])
        direction = random.choice([1, -1])
        
        # Tính toán vị trí bắt đầu an toàn
        total_cells_needed = path_length + 2
        
        y = 0
        start_pos_list = [0, y, 0]
        
        if axis == 'x':
            if direction == 1:
                start_x = random.randint(0, grid_size[0] - total_cells_needed)
            else:
                start_x = random.randint(total_cells_needed - 1, grid_size[0] - 1)
            start_pos_list[0] = start_x
            start_pos_list[2] = random.randint(0, grid_size[2] - 1)
        else: # axis == 'z'
            if direction == 1:
                start_z = random.randint(0, grid_size[2] - total_cells_needed)
            else:
                start_z = random.randint(total_cells_needed - 1, grid_size[2] - 1)
            start_pos_list[2] = start_z
            start_pos_list[0] = random.randint(0, grid_size[0] - 1)
        
        start_pos: Coord = tuple(start_pos_list)
        
        # Tạo ra danh sách các tọa độ trên đường đi
        # [SỬA LỖI] Bắt đầu đường đi với vị trí start_pos để đảm bảo có khối nền
        path_coords: list[Coord] = [start_pos]
        current_pos = list(start_pos)
        
        # Tạo các ô ở giữa
        for _ in range(path_length):
            if axis == 'x':
                current_pos[0] += direction
            else:
                current_pos[2] += direction
            path_coords.append(tuple(current_pos))
        
        target_pos = path_coords[-1]
        
        # [NEW] Tạo metadata cho Placers
        metadata = {
            "segment": path_coords,
            "path_length": path_length,
            "axis": axis,
            "direction": direction,
        }
        
        return PathInfo(
            start_pos=start_pos,
            target_pos=target_pos,
            path_coords=path_coords,
            placement_coords=path_coords, # [CHUẨN HÓA] Đảm bảo tất cả các ô đều có nền
            metadata=metadata
        )