# src/map_generator/topologies/grid.py

import logging
import random
import copy
from .base_topology import BaseTopology
from ..models.path_info import PathInfo

class GridTopology(BaseTopology):
    """
    Tạo ra một cấu trúc map dạng lưới (grid) phẳng.
    Tất cả các ô trong một khu vực xác định đều có thể đi được.
    """
    _logger = logging.getLogger(__name__)

    def generate_path_info_variants(self, grid_size: tuple, params: dict, max_variants: int) -> "Iterator[PathInfo]":
        """
        [KIẾN TRÚC MỚI] Tạo ra các biến thể lưới với kích thước khác nhau.
        """
        count = 0
        # Lặp qua các kích thước lưới có thể có
        for size in range(5, 13):
            if count >= max_variants: return
            
            variant_params = copy.deepcopy(params)
            variant_params['grid_width'] = size
            variant_params['grid_depth'] = size
            yield self.generate_path_info(grid_size, variant_params)
            count += 1
    def generate_path_info(self, grid_size: tuple, params: dict) -> PathInfo:
        """
        Sinh ra một lưới các tọa độ có thể đi được.
        """
        width = params.get('grid_width', 10)
        depth = params.get('grid_depth', 10)
        
        # Tạo một mặt phẳng các khối đất
        path_coords = []
        for x in range(1, width + 1):
            for z in range(1, depth + 1):
                path_coords.append((x, 0, z))

        # Chọn vị trí bắt đầu và kết thúc ngẫu nhiên trên lưới
        # Đảm bảo chúng không quá gần nhau
        start_pos = (random.randint(1, width // 2), 0, random.randint(1, depth // 2))
        target_pos = (random.randint(width // 2 + 1, width), 0, random.randint(depth // 2 + 1, depth))
        
        # [FIX] Xử lý tham số 'origin' có thể là 2D hoặc 3D
        items_to_place = params.get('items_to_place', [])
        for item_config in items_to_place:
            origin = item_config.get('origin')
            if isinstance(origin, list):
                if len(origin) == 2:
                    # Nếu origin là 2D [x, z], chuyển nó thành 3D [x, 0, z]
                    new_origin = (origin[0], 0, origin[1])
                    self._logger.debug(f"Chuyển đổi origin 2D {origin} -> 3D {new_origin}")
                    item_config['origin'] = new_origin
                elif len(origin) == 3:
                    # Nếu đã là 3D, chuyển tuple thành tuple để đảm bảo tính nhất quán
                    item_config['origin'] = tuple(origin)
                else:
                    self._logger.warning(
                        f"Tham số 'origin' có độ dài không hợp lệ: {origin}. Bỏ qua."
                    )

        # [NEW] Tạo metadata cho Placers
        rows = []
        for z in range(1, depth + 1):
            row = [(x, 0, z) for x in range(1, width + 1)]
            rows.append(row)
        
        columns = []
        for x in range(1, width + 1):
            col = [(x, 0, z) for z in range(1, depth + 1)]
            columns.append(col)
        
        metadata = {
            "topology_type": "grid",
            "rows": rows,
            "columns": columns,
            "width": width,
            "depth": depth,
            # [NEW] Semantic positions for row_column_iteration strategy
            "semantic_positions": {
                'start': start_pos,
                'end': target_pos,
                'optimal_start': 'start',
                'optimal_end': 'end',
                'valid_pairs': [
                    {
                        'name': 'row_based_easy',
                        'start': 'start',
                        'end': 'end',
                        'path_type': 'row_traversal',
                        'strategies': ['row_column_iteration', 'alternating_patterns'],
                        'difficulty': 'EASY',
                        'teaching_goal': 'Items along rows'
                    },
                    {
                        'name': 'diagonal_pattern_medium',
                        'start': 'start',
                        'end': 'end',
                        'path_type': 'diagonal',
                        'strategies': ['row_column_iteration', 'diagonal_patterns'],
                        'difficulty': 'MEDIUM',
                        'teaching_goal': 'Diagonal placement'
                    },
                    {
                        'name': 'checkerboard_hard',
                        'start': 'start',
                        'end': 'end',
                        'path_type': 'checkerboard',
                        'strategies': ['row_column_iteration', 'alternating_patterns'],
                        'difficulty': 'HARD',
                        'teaching_goal': 'Complex grid pattern'
                    }
                ]
            }
        }

        return PathInfo(
            start_pos=start_pos,
            target_pos=target_pos,
            path_coords=path_coords,
            placement_coords=path_coords,
            obstacles=[],
            metadata=metadata
        )
