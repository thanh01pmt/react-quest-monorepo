# src/map_generator/placements/strategies/parameter_shape_strategy.py
"""
PARAMETER SHAPE STRATEGY

- Chuyên gia tạo ra các thử thách về Tham số (Topic 9).
- Không đọc cấu trúc map, mà "vẽ" ra các hình dạng bằng item trên một không gian mở (grid).
- Đọc các tham số hình học như `pattern`, `width`, `height`, `side`, `origin` từ `gen_params`.
"""

import logging
from typing import List, Tuple, Dict, Set, Any, Iterator
from src.map_generator.models.path_info import PathInfo
from ..base_placer import BasePlacer

logger = logging.getLogger(__name__)

class ParameterShapeStrategy(BasePlacer):
    def place_item_variants(self, path_info: PathInfo, params: dict, max_variants: int) -> Iterator[Dict[str, Any]]:
        """
        [KIẾN TRÚC MỚI] Tạo ra các biến thể layout.
        Hiện tại, nó chỉ tạo ra một biến thể duy nhất bằng cách gọi place_items.
        """
        # Logic tạo nhiều biến thể có thể được thêm vào đây sau.
        yield self.place_items(path_info, params)

    def place_items(self, path_info: PathInfo, params: dict, **kwargs) -> Dict[str, Any]:
        self.path_info = path_info
        items = []
        used_coords = set()

        # `items_to_place` có thể là:
        # 1. Danh sách các dictionary mô tả hình dạng: [{'type':'crystal', 'pattern':'square', 'side':3}]
        # 2. Danh sách đơn giản các item types: ['crystal', 'switch'] (smart quantity mode)
        shapes_to_place = params.get('items_to_place', [])
        
        # [FIX] Kiểm tra nếu là list of strings (smart quantity mode)
        if shapes_to_place and isinstance(shapes_to_place, list):
            if all(isinstance(item, str) for item in shapes_to_place):
                # ... existing smart quantity logic ...
                pass 
                
        # ... existing legacy check ...

        logger.info(f"-> ParameterShapeStrategy: Sẽ vẽ {len(shapes_to_place)} hình dạng.")

        for shape_params in shapes_to_place:
            # [FIX] Skip if shape_params is a string (simple item type)
            if isinstance(shape_params, str):
                continue
                
            if not isinstance(shape_params, dict):
                logger.warning(f"  -> Bỏ qua shape_params không phải dict: {type(shape_params)}")
                continue
                
            pattern = shape_params.get('pattern')
            item_type = shape_params.get('type', 'crystal')
            
            # [NEW] Logic Random Origin
            import random
            origin = shape_params.get('origin', [0, 0, 0])
             
            # Nếu origin="random", tính toán bounds dựa trên metadata
            if isinstance(origin, str) and origin == "random":
                width = path_info.metadata.get('width', 10) # Grid width
                depth = path_info.metadata.get('depth', 10) # Grid depth
                
                # Xác định kích thước hình để tính max_x, max_z
                shape_w, shape_d = 0, 0
                if pattern == 'square':
                    s = shape_params.get('side', 3)
                    shape_w, shape_d = s, s
                elif pattern == 'rectangle':
                    shape_w = shape_params.get('width', 4)
                    shape_d = shape_params.get('height', 3)
                    
                # An toàn biên: trừ đi kích thước hình
                max_x = max(0, width - shape_w)
                max_z = max(0, depth - shape_d)
                
                # Chọn random (tránh đè lên Start/Target nếu có thể, nhưng Grid rộng nên xác suất thấp)
                # Lưu ý: GridTopology start/target ở hàng 0.
                rx = random.randint(0, max_x) # 0-indexed logic 
                rz = random.randint(0, max_z)
                
                # GridTopology tạo tọa độ từ (1, 0, 1) -> (width, 0, depth)
                # Cần mapping đúng hệ tọa độ.
                # GridTopology: x in [1, width], z in [1, depth].
                # ParameterShapeStrategy vẽ cộng dồn vào origin.
                # Nếu origin là (1,0,1), square side 3 sẽ chiếm x=1,2,3.
                # Vậy max_origin_x = 1 + (width - side).
                # start_x = rand(1, width - side + 1).
                
                rx = random.randint(1, max(1, width - shape_w + 1))
                rz = random.randint(1, max(1, depth - shape_d + 1))
                
                origin = [rx, 0, rz]
                logger.info(f"  -> Random Origin selected: {origin} for shape {shape_w}x{shape_d}")

            shape_coords = []

            if pattern == 'square':
                side = shape_params.get('side', 3)
                shape_coords = self._get_square_coords(origin, side)
            elif pattern == 'rectangle':
                width = shape_params.get('width', 4)
                height = shape_params.get('height', 3)
                shape_coords = self._get_rectangle_coords(origin, width, height)
            # Thêm các hình dạng khác ở đây nếu cần (triangle, circle, etc.)
            else:
                logger.warning(f"  -> Bỏ qua hình dạng không xác định: '{pattern}'")
                continue

            for pos in shape_coords:
                if pos not in used_coords:
                    items.append({"type": item_type, "pos": pos})
                    used_coords.add(pos)
        
        # Với strategy này, thường không cần thêm obstacles phụ
        obstacles = path_info.obstacles or []

        return self._base_layout(path_info, items, obstacles)

    def _get_square_coords(self, origin: List[int], side: int) -> List[Tuple[int, int, int]]:
        """Tính toán tọa độ chu vi của một hình vuông."""
        x, y, z = origin
        coords = []
        # Cạnh trên
        for i in range(side): coords.append((x + i, y, z))
        # Cạnh phải
        for i in range(1, side): coords.append((x + side - 1, y, z + i))
        # Cạnh dưới
        for i in range(1, side): coords.append((x + side - 1 - i, y, z + side - 1))
        # Cạnh trái
        for i in range(1, side - 1): coords.append((x, y, z + side - 1 - i))
        return coords

    def _get_rectangle_coords(self, origin: List[int], width: int, height: int) -> List[Tuple[int, int, int]]:
        """Tính toán tọa độ chu vi của một hình chữ nhật."""
        x, y, z = origin
        coords = []
        # Cạnh trên
        for i in range(width): coords.append((x + i, y, z))
        # Cạnh phải
        for i in range(1, height): coords.append((x + width - 1, y, z + i))
        # Cạnh dưới
        for i in range(1, width): coords.append((x + width - 1 - i, y, z + height - 1))
        # Cạnh trái
        for i in range(1, height - 1): coords.append((x, y, z + height - 1 - i))
        return coords

# Tạo một instance để FunctionPlacer có thể import và sử dụng
parameter_shape_strategy = ParameterShapeStrategy()