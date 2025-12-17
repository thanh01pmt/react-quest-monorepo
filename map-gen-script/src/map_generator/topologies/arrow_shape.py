import random
from .base_topology import BaseTopology
import copy
from src.map_generator.models.path_info import PathInfo, Coord
from src.utils.geometry import add_vectors, FORWARD_Z
from src.utils.geometry import FORWARD_X, BACKWARD_X
class ArrowShapeTopology(BaseTopology):
    """
    Tạo ra một con đường hình mũi tên trên mặt phẳng 2D.
    Bao gồm một "thân" thẳng và một "đầu" hình tam giác.
    Lý tưởng cho các bài tập tổng hợp, yêu cầu một chuỗi hành động phức tạp.
    """
    def generate_path_info_variants(self, grid_size: tuple, params: dict, max_variants: int) -> "Iterator[PathInfo]":
        """
        [KIẾN TRÚC MỚI] Tạo ra các biến thể hình mũi tên với kích thước khác nhau.
        """
        count = 0
        # Lặp qua các kích thước có thể có
        for shaft in range(3, 7):
            for head in range(2, 4):
                if count >= max_variants: return
                
                variant_params = copy.deepcopy(params)
                variant_params['shaft_length'] = shaft
                variant_params['head_size'] = head
                yield self.generate_path_info(grid_size, variant_params)
                count += 1

    def generate_path_info(self, grid_size: tuple, params: dict) -> PathInfo:
        """
        Tạo ra một đường đi hình mũi tên.

        Args:
            params (dict):
                - shaft_length (int): Độ dài của thân mũi tên.
                - head_size (int): Kích thước của đầu mũi tên (quyết định chiều rộng và cao).

        Returns:
            PathInfo: Một đối tượng chứa thông tin về đường đi.
        """
        print("    LOG: Generating 'arrow_shape' topology...")

        # Lấy các tham số hoặc dùng giá trị ngẫu nhiên
        shaft_len = params.get('shaft_length', random.randint(3, 5))
        head_size = params.get('head_size', random.randint(2, 3)) # head_size=2 tạo ra đầu rộng 5, cao 2

        # Đảm bảo hình dạng nằm gọn trong map
        required_width = head_size * 2 + 1
        required_depth = shaft_len + head_size

        start_x = random.randint(head_size + 1, grid_size[0] - head_size - 2)
        start_z = random.randint(1, grid_size[2] - required_depth - 2)
        y = 0

        # Điểm bắt đầu của người chơi (ở đáy của thân)
        start_pos: Coord = (start_x, y, start_z)

        # [REFACTOR] Tách biệt các loại tọa độ để placer xử lý linh hoạt
        # placement_coords: Toàn bộ hình dạng mũi tên để render nền
        # path_coords: Đường đi thực tế cho solver, sẽ đi qua một bên cánh
        # straight_path_coords: Đường thẳng từ start->target, dùng để đặt obstacle
        placement_coords: set[Coord] = {start_pos}
        path_coords: list[Coord] = [start_pos]
        straight_path_coords: list[Coord] = [start_pos]

        # 1. Vẽ thân mũi tên (đi theo trục Z)
        current_pos = start_pos
        for _ in range(shaft_len):
            current_pos = add_vectors(current_pos, FORWARD_Z)
            path_coords.append(current_pos)
            placement_coords.add(current_pos)
            straight_path_coords.append(current_pos)

        junction_pos = current_pos # Điểm nối giữa thân và đầu

        # 2. Vẽ đầu mũi tên (hình tam giác)
        # Đầu mũi tên sẽ có chiều cao là `head_size` và chiều rộng là `2*head_size + 1`
        wing_coords = set()
        for i in range(1, head_size + 1):
            # Vị trí Z của hàng hiện tại trong tam giác
            current_z_level = junction_pos[2] + i
            # Chiều rộng của hàng tam giác ở độ cao i
            row_width = head_size - i

            # Vẽ các ô của hàng tam giác
            center_x = junction_pos[0]
            for j in range(-row_width, row_width + 1):
                coord = (center_x + j, y, current_z_level)
                placement_coords.add(coord)
                if j != 0: # Các ô không nằm trên đường thẳng là "cánh"
                    wing_coords.add(coord)

        # Đích là đỉnh của mũi tên
        target_pos = (junction_pos[0], y, junction_pos[2] + head_size)
        placement_coords.add(target_pos)
        straight_path_coords.append(target_pos)

        # 3. [REWRITTEN] Tạo đường đi rẽ sang một bên cánh
        # Chọn ngẫu nhiên rẽ trái hoặc phải
        turn_dir = random.choice([FORWARD_X, BACKWARD_X])
        
        # [REWRITTEN] Tạo đường đi từng bước để đảm bảo không đi vào đường thẳng
        # 1. Đi từ junction ra góc của cánh
        current_path_pos = junction_pos
        current_path_pos = add_vectors(current_path_pos, turn_dir)
        path_coords.append(current_path_pos)
        
        # 2. Đi dọc theo cánh ra đến đỉnh cánh
        # Ví dụ head_size=3, đi thêm 2 bước
        for _ in range(head_size - 2):
            current_path_pos = add_vectors(current_path_pos, turn_dir)
            path_coords.append(current_path_pos)

        # 3. Đi từ đỉnh cánh vào đỉnh mũi tên (target)
        # Đi từng bước theo đường chéo (Z trước, X sau) để men theo rìa
        # current_path_pos đang ở đỉnh cánh
        while current_path_pos != target_pos:
            if current_path_pos[2] < target_pos[2]:
                current_path_pos = add_vectors(current_path_pos, FORWARD_Z)
            elif current_path_pos[0] != target_pos[0]:
                # Đi ngược hướng rẽ ban đầu để vào tâm
                current_path_pos = add_vectors(current_path_pos, (turn_dir[0] * -1, 0, 0))
            path_coords.append(current_path_pos)
        path_coords.append(target_pos)

        # [MỚI] Tạo metadata để placer có thể đặt obstacle trên đường thẳng
        metadata = {
            "straight_path_coords": straight_path_coords,
            "wing_coords": list(wing_coords) # Các vị trí trên cánh để đặt item
        }

        return PathInfo(
            start_pos=start_pos,
            target_pos=target_pos,
            path_coords=list(dict.fromkeys(path_coords)), # Đường đi rẽ nhánh
            placement_coords=list(placement_coords),     # Toàn bộ hình dạng
            metadata=metadata
        )