# src/map_generator/placements/for_loop_placer.py
"""
FOR LOOP PLACER – PHIÊN BẢN NÂNG CẤP TOÀN DIỆN

- "Chuyên gia" về việc tạo ra các thử thách có tính lặp lại cho Topic 3.
- [NÂNG CẤP] Tích hợp hoàn toàn với BasePlacer, loại bỏ code thừa.
- [NÂNG CẤP] Đơn giản hóa logic REFACTOR: Placer chỉ tạo map cuối cùng, hệ thống sẽ cung cấp code chưa tối ưu.
- [NÂNG CẤP] Tái cấu trúc để tăng tính rõ ràng và nhất quán.
"""

from .base_placer import BasePlacer
from src.map_generator.models.path_info import PathInfo
from collections import Counter
import random
import logging
from typing import List, Tuple, Dict, Any, Iterator

logger = logging.getLogger(__name__)
Coord = Tuple[int, int, int]

class ForLoopPlacer(BasePlacer):
    def place_item_variants(self, path_info: PathInfo, params: dict, max_variants: int) -> Iterator[Dict[str, Any]]:
        """
        [KIẾN TRÚC MỚI] Tạo ra các biến thể layout.
        Hiện tại, nó chỉ tạo ra một biến thể duy nhất bằng cách gọi place_items.
        """
        # Logic tạo nhiều biến thể (ví dụ: thay đổi item_count) có thể được thêm vào đây sau.
        yield self.place_items(path_info, params)

    def place_items(self, path_info: PathInfo, params: dict) -> dict:
        self.path_info = path_info
        challenge_type = params.get('challenge_type', 'SIMPLE_APPLY')

        # ==================================================================
        # 1. CHUẨN HÓA INPUT & LẤY VỊ TRÍ (Sử dụng hàm từ BasePlacer)
        # ==================================================================
        item_counts = self._get_item_counts(params)
        obstacle_count = item_counts.get('obstacle', 0)
        
        coords = self._get_coords(path_info)
        valid_coords = self._exclude_ends(coords, path_info)
        total_cells = len(valid_coords)

        # ==================================================================
        # 2. PHÁT HIỆN MẪU LẶP TỰ ĐỘNG
        # ==================================================================
        pattern = self._detect_loop_pattern(params.get('map_type', 'unknown'), params, total_cells)
        logger.info(f"-> ForLoopPlacer: Áp dụng mẫu '{pattern['type']}' cho map '{params.get('map_type')}'")

        if not self._validate_pattern(pattern, total_cells):
            pattern = self._fallback_pattern(total_cells)
            logger.warning("  -> Mẫu không khớp, sử dụng mẫu dự phòng.")

        # ==================================================================
        # 3. ĐIỀU KHIỂN LOGIC ĐẶT ITEM
        # ==================================================================
        if challenge_type in ['DEBUG_FIX_LOGIC', 'DEBUG_FIX_SEQUENCE']:
            items, obstacles = self._place_with_bug(valid_coords, pattern, obstacle_count, params)
        else:
            # [TỐI ƯU HÓA] Cả APPLY và REFACTOR đều có cùng một map cuối cùng.
            # Hệ thống sẽ tự xử lý việc cung cấp code chưa tối ưu cho REFACTOR.
            items, obstacles = self._place_normal(valid_coords, pattern, obstacle_count, item_counts)

        return self._base_layout(path_info, items, obstacles)

    # ==================================================================
    # 4. CÁC HÀM ĐẶT CHÍNH
    # ==================================================================
    def _place_normal(self, coords: List[Coord], pattern: Dict, obstacle_count: int, item_counts: Counter) -> Tuple[List[Dict], List[Dict]]:
        items = []
        used_coords = set()
        
        # Bước 1: Đặt item theo mẫu lặp đã được phát hiện
        items.extend(self._place_by_pattern(coords, pattern, used_coords))
        
        # Bước 2: Đặt các item phụ từ params (nếu có)
        self._place_custom_items(items, coords, item_counts, used_coords)
        
        # Bước 3: Đặt obstacle (sử dụng hàm từ BasePlacer)
        obstacles = self._place_obstacles(self.path_info, coords, used_coords, obstacle_count)
        
        return items, obstacles

    def _place_with_bug(self, coords: List[Coord], pattern: Dict, obstacle_count: int, params: dict) -> Tuple[List[Dict], List[Dict]]:
        bug_type = params.get('bug_type')
        logger.info(f"  -> DEBUG: Áp dụng lỗi '{bug_type}' cho mẫu '{pattern['type']}'")

        # [NÂNG CẤP] Tạo lỗi bằng cách thay đổi tham số của pattern
        if bug_type == 'incorrect_loop_count':
            if pattern['type'] in ['cluster_gap', 'simple_repeat']:
                current_count = pattern.get('cluster_size', pattern.get('repeat_count', 3))
                # Cộng hoặc trừ 1, đảm bảo không nhỏ hơn 1
                new_count = max(1, current_count + random.choice([-1, 1]))
                if 'cluster_size' in pattern: pattern['cluster_size'] = new_count
                if 'repeat_count' in pattern: pattern['repeat_count'] = new_count
                logger.info(f"     -> Lỗi lặp: thay đổi số lần lặp thành {new_count}")
        
        else: # Lỗi mặc định nếu không có bug_type cụ thể
             if pattern['type'] == 'nested_grid':
                pattern['rows'], pattern['cols'] = pattern['cols'], pattern['rows']
                logger.info("     -> Lỗi logic: Đảo ngược rows và cols")

        # Sau khi thay đổi pattern, gọi lại hàm đặt bình thường
        item_counts = self._get_item_counts(params)
        return self._place_normal(coords, pattern, obstacle_count, item_counts)

    # ==================================================================
    # 5. CÁC HÀM CHUYÊN BIỆT
    # ==================================================================
    def _detect_loop_pattern(self, map_type: str, params: dict, total_cells: int) -> dict:
        if params.get('rows') is not None:
            return {'type': 'nested_grid', 'rows': params['rows'], 'cols': params.get('cols', params['rows']), 'checkerboard': params.get('checkerboard', False), 'item_type': 'gem'}
        if params.get('cluster_size') is not None:
            return {'type': 'cluster_gap', 'cluster_size': params['cluster_size'], 'gap': params.get('gap', 1), 'item_type': 'crystal'}
        
        if map_type in ['grid', 'plowing_field']:
            return {'type': 'nested_grid', 'rows': 3, 'cols': 3, 'checkerboard': True, 'item_type': 'gem'}
        if map_type == 'square_shape':
             return {'type': 'edge_trace', 'item_type': 'crystal'}
        if map_type == 'staircase':
            return {'type': 'stair', 'item_type': 'crystal'}
        
        if total_cells >= 20:
            return {'type': 'cluster_gap', 'cluster_size': 3, 'gap': 2, 'item_type': 'crystal'}
        return {'type': 'simple_repeat', 'repeat_count': min(4, total_cells // 2), 'item_type': 'crystal'}

    def _place_by_pattern(self, coords: List[Coord], pattern: Dict, used_coords: Set[Coord]) -> List[Dict]:
        items = []
        item_type = pattern.get('item_type', 'crystal')

        if pattern['type'] == 'simple_repeat':
            count = pattern.get('repeat_count', 3)
            if count > 0 and len(coords) >= count:
                step = len(coords) // count
                for i in range(count):
                    pos = coords[i * step]
                    if pos not in used_coords:
                        items.append({"type": item_type, "pos": pos})
                        used_coords.add(pos)
        
        elif pattern['type'] == 'cluster_gap':
            cluster = pattern.get('cluster_size', 2)
            gap = pattern.get('gap', 1)
            i = 0
            while i + cluster <= len(coords):
                for j in range(cluster):
                    pos = coords[i + j]
                    if pos not in used_coords:
                        items.append({"type": item_type, "pos": pos})
                        used_coords.add(pos)
                i += cluster + gap

        elif pattern['type'] == 'nested_grid':
            rows, cols = pattern.get('rows', 3), pattern.get('cols', 3)
            if len(coords) >= rows * cols:
                for r in range(rows):
                    for c in range(cols):
                        idx = r * cols + c
                        if not pattern.get('checkerboard', False) or (r + c) % 2 == 0:
                            pos = coords[idx]
                            if pos not in used_coords:
                                 items.append({"type": item_type, "pos": pos})
                                 used_coords.add(pos)
        
        elif pattern['type'] == 'edge_trace' or pattern['type'] == 'stair':
            for pos in coords:
                if pos not in used_coords:
                    items.append({"type": item_type, "pos": pos})
                    used_coords.add(pos)

        return items

    def _place_custom_items(self, items: List[Dict], coords: List[Coord], item_counts: Counter, used_coords: Set[Coord]):
        placed_counts = Counter(item['type'] for item in items)
        remaining_counts = item_counts - placed_counts
        
        available_coords = [c for c in coords if c not in used_coords]
        random.shuffle(available_coords)

        for item_type, count in remaining_counts.items():
            if item_type == 'obstacle' or count <= 0: continue
            
            for _ in range(count):
                if not available_coords: break
                pos = available_coords.pop()
                items.append({"type": item_type, "pos": pos})
                used_coords.add(pos)

    # ==================================================================
    # 6. HÀM HỖ TRỢ (Đã được kế thừa từ BasePlacer, không cần định nghĩa lại)
    # ==================================================================
    # _get_coords, _exclude_ends, _get_item_counts, _parse_goals, _place_obstacles
    # đều đã có sẵn trong self.
    
    def _validate_pattern(self, p, total):
        if total == 0: return False
        if p['type'] == 'cluster_gap':
            return p['cluster_size'] + p['gap'] <= total
        if p['type'] == 'nested_grid':
            return p['rows'] * p['cols'] <= total
        return True

    def _fallback_pattern(self, total):
        return {'type': 'simple_repeat', 'repeat_count': min(3, total // 2), 'item_type': 'crystal'}