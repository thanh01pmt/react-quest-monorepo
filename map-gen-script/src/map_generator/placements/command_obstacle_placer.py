# src/map_generator/placements/command_obstacle_placer.py
"""
COMMAND OBSTACLE PLACER - PHIÊN BẢN NÂNG CẤP TOÀN DIỆN

- Placer nền tảng cho các thử thách di chuyển tuần tự (Topic 1).
- [NÂNG CẤP] Kế thừa hoàn toàn từ BasePlacer, tái sử dụng các hàm hỗ trợ chung.
- [NÂNG CẤP] Tái cấu trúc logic đặt item và bug cho rõ ràng, linh hoạt hơn.
- Hỗ trợ đầy đủ các challenge_type: APPLY, DEBUG.
"""

from .base_placer import BasePlacer
from src.map_generator.models.path_info import PathInfo
import random
import copy
from typing import List, Tuple, Dict, Set, Any, Iterator
from collections import deque # [THÊM] Import deque cho thuật toán tìm đường
# [THÊM] Import các vector di chuyển cho thuật toán tìm đường
from src.utils.geometry import add_vectors, FORWARD_X, FORWARD_Z, BACKWARD_X, BACKWARD_Z
import logging
logger = logging.getLogger(__name__)
Coord = Tuple[int, int, int]

class CommandObstaclePlacer(BasePlacer):
    def place_item_variants(self, path_info: PathInfo, params: dict, max_variants: int) -> Iterator[Dict[str, Any]]:
        """
        [REFACTOR] Đơn giản hóa. Placer này chỉ có một chiến lược đặt đối tượng.
        Nó sẽ chỉ tạo ra một biến thể layout duy nhất cho mỗi biến thể cấu trúc (PathInfo) nhận được.
        Logic tạo biến thể (ví dụ: thay đổi số obstacle) nên được xử lý ở tầng Topology hoặc service.
        """
        yield self.place_items(path_info, params)

    def place_items(self, path_info: PathInfo, params: dict, **kwargs) -> dict:
        """
        Place items randomly (or by explicit config).
        """
        self.path_info = path_info
        challenge_type = params.get('challenge_type', 'SIMPLE_APPLY')

        # [MỚI] Cho phép Placer ghi đè start/target do Topology cung cấp
        # dựa trên tham số `start_target_strategy` từ curriculum.
        self._override_start_target(path_info, params)

        # ==================================================================
        # 1. CHUẨN HÓA INPUT & LẤY VỊ TRÍ (Sử dụng hàm từ BasePlacer)
        # ==================================================================
        coords = self._get_coords(path_info)
        valid_coords = self._exclude_ends(coords, path_info)
        
        # [FIX] Sử dụng _resolve_item_quantities() để hỗ trợ smart quantity
        # Kết quả là List[str] như ['crystal', 'crystal', 'switch']
        items_to_place_list = self._resolve_item_quantities(params, len(valid_coords))
        
        # Chuyển đổi list thành Counter để tương thích với logic cũ
        from collections import Counter
        item_counts = Counter(items_to_place_list)
        
        # [FIX] Ưu tiên đọc `obstacle_count` trực tiếp từ params.
        obstacle_count = int(params.get('obstacle_count', item_counts.get('obstacle', 0)))
        
        # Bảo vệ chống tràn
        total_items = sum(c for i, c in item_counts.items() if i != 'obstacle')
        total_needed = total_items + obstacle_count
        if total_needed > len(valid_coords):
            logger.warning(f"MAP QUÁ NHỎ. Cần {total_needed} ô nhưng chỉ có {len(valid_coords)}.")
            # Ưu tiên item hơn obstacle
            obstacle_count = max(0, len(valid_coords) - total_items)

        # ==================================================================
        # 2. ĐẶT THEO CHALLENGE TYPE
        # ==================================================================
        if challenge_type in ['DEBUG_FIX_SEQUENCE', 'DEBUG_FIX_LOGIC']:
            items, obstacles = self._place_with_bug(params, coords, valid_coords, item_counts, obstacle_count)
        else: # Mặc định là APPLY
            items, obstacles = self._place_normal(params, coords, valid_coords, item_counts, obstacle_count)

        logger.info(f"ĐÃ ĐẶT: {len(items)} item | {len(obstacles) - len(path_info.obstacles)} obstacle mới.")

        return self._base_layout(path_info, items, obstacles)

    # ==================================================================
    # 3. CÁC HÀM ĐẶT CHÍNH
    # ==================================================================
    def _place_normal(self, params: dict, all_coords: List[Coord], valid_coords: List[Coord], item_counts: "Counter[str]", obstacle_count: int) -> Tuple[List[Dict], List[Dict]]:
        used_coords = set()
        
        # Bước 1: [CŨ] Đặt Obstacle trước để xác định các vị trí 'trên đỉnh'
        obstacles = self._place_obstacles(self.path_info, all_coords, used_coords, obstacle_count)
        obstacle_top_positions = {(pos[0], pos[1] + 1, pos[2]) for obs in obstacles for pos in [obs['pos']] if obs.get('is_surface_obstacle')}

        # Bước 2: Xác định các vị trí có thể đặt item dựa trên chiến lược
        item_placement_strategy = params.get('item_placement_strategy', 'ground_only')
        possible_item_positions = set()
        
        ground_positions = {c for c in valid_coords if c not in used_coords}
        
        if item_placement_strategy == 'ground_only':
            possible_item_positions.update(ground_positions)
        elif item_placement_strategy == 'on_obstacle':
            possible_item_positions.update(obstacle_top_positions)
        elif item_placement_strategy == 'mixed':
            possible_item_positions.update(ground_positions)
            possible_item_positions.update(obstacle_top_positions)
        else: # Mặc định
            possible_item_positions.update(ground_positions)

        # Bước 3: Đặt Item vào các vị trí đã chọn
        items = []
        items_to_place_types = [item for item, count in item_counts.items() if item != 'obstacle' for _ in range(count)]

        # [MỚI] Logic ưu tiên đặt item vào các "đầu mút" nếu có
        endpoints = self.path_info.metadata.get('endpoints', [])
        prioritized_positions = [pos for pos in endpoints if pos in possible_item_positions]
        remaining_positions = [pos for pos in possible_item_positions if pos not in prioritized_positions]

        # Xáo trộn riêng từng danh sách
        random.shuffle(prioritized_positions)
        random.shuffle(remaining_positions)

        # Kết hợp lại: các vị trí ưu tiên được đặt trước
        final_placement_order = prioritized_positions + remaining_positions
        
        num_to_place = min(len(items_to_place_types), len(final_placement_order))
        for i in range(num_to_place):
            pos = final_placement_order[i]
            item_type = items_to_place_types[i]

            if item_type == "switch":
                items.append({"type": item_type, "pos": pos, "initial_state": "off"})
            else:
                items.append({"type": item_type, "pos": pos})

        # --- [NÂNG CẤP] LOGIC ĐẶT OBSTACLE THÔNG MINH ---
        # Bước 4: Tìm các vị trí chiến lược để đặt obstacle
        # Các vị trí này nằm trên đường đi ngắn nhất từ start đến target và từ start đến các item.
        strategic_coords = set()
        grid = set(all_coords)

        # Đường đi từ start đến target
        path_to_target = self._find_shortest_path(self.path_info.start_pos, self.path_info.target_pos, grid)
        if path_to_target:
            strategic_coords.update(path_to_target)

        # Đường đi từ start đến các item
        for item in items:
            path_to_item = self._find_shortest_path(self.path_info.start_pos, item['pos'], grid)
            if path_to_item:
                strategic_coords.update(path_to_item)

        # Loại bỏ các vị trí đã có item, start, target
        item_positions = {tuple(item['pos']) for item in items}
        strategic_coords -= item_positions
        strategic_coords -= {self.path_info.start_pos, self.path_info.target_pos}

        # Bước 5: Đặt Obstacle vào các vị trí chiến lược này
        final_obstacles = self._place_obstacles(self.path_info, list(strategic_coords), used_coords, obstacle_count)
        return items, final_obstacles

    def _place_with_bug(self, params: dict, all_coords: List[Coord], valid_coords: List[Coord], item_counts: Any, obstacle_count: int) -> Tuple[List[Dict], List[Dict]]:
        items = []
        used_coords = set()
        bug_type = params.get('bug_type')
        items_to_place_types = [item for item, count in item_counts.items() if item != 'obstacle' for _ in range(count)]

        # KỊCH BẢN 1: Lỗi thứ tự, đặt item ngay ở đầu
        if bug_type == 'sequence_error' and items_to_place_types:
            # Chọn vị trí gần điểm bắt đầu nhất
            if valid_coords:
                pos = min(valid_coords, key=lambda c: abs(c[0] - self.path_info.start_pos[0]) + abs(c[2] - self.path_info.start_pos[2]))
                item_type = items_to_place_types.pop(0)
                items.append({"type": item_type, "pos": pos})
                used_coords.add(pos)
                logger.info(f"  -> DEBUG (sequence): Đặt '{item_type}' ở vị trí đầu {pos} để gây lỗi.")

        # KỊCH BẢN 2: Lỗi logic, cần nhảy nhưng code lại đi thẳng
        if bug_type == 'incorrect_block' and 'jump' in params.get('bug_config', {}).get('options', {}).get('from', ''):
             # Đặt một obstacle duy nhất ở vị trí chiến lược
            if obstacle_count > 0 and valid_coords:
                # Đặt ở khoảng 1/3 đường đi
                pos = valid_coords[len(valid_coords) // 3]
                obstacles_so_far = self._place_obstacles(self.path_info, [pos], used_coords, 1)
                logger.info(f"  -> DEBUG (logic): Đặt 1 obstacle ở {pos} để buộc phải nhảy.")
                # Trả về ngay sau khi đặt obstacle
                self._place_remaining_items(items, all_coords, used_coords, items_to_place_types)
                return items, obstacles_so_far

        # Đặt các item và obstacle còn lại một cách ngẫu nhiên
        self._place_remaining_items(items, all_coords, used_coords, items_to_place_types)
        obstacles = self._place_obstacles(self.path_info, all_coords, used_coords, obstacle_count)

        return items, obstacles

    # ==================================================================
    # 4. HÀM HỖ TRỢ PHỤ
    # ==================================================================
    def _place_remaining_items(self, items: List[Dict], all_coords: List[Coord], used_coords: Set[Coord], items_to_place_types: List[str]):
        """Đặt các item còn lại vào các vị trí trống một cách ngẫu nhiên."""
        if not items_to_place_types:
            return
            
        available_coords = [c for c in all_coords if c not in used_coords and c != self.path_info.start_pos and c != self.path_info.target_pos]
        shuffled_positions = random.sample(available_coords, len(available_coords))
        
        num_to_place = min(len(items_to_place_types), len(shuffled_positions))
        for i in range(num_to_place):
            pos = shuffled_positions[i]
            item_type = items_to_place_types[i]
            if item_type == "switch":
                items.append({"type": item_type, "pos": pos, "initial_state": "off"})
            else:
                items.append({"type": item_type, "pos": pos})

    def _find_shortest_path(self, start: Coord, end: Coord, grid: set[Coord]) -> list[Coord]:
        """
        [MỚI] Tìm đường đi ngắn nhất giữa hai điểm trên một lưới cho trước bằng thuật toán BFS.
        Hàm này rất quan trọng để xác định các vị trí chiến lược đặt obstacle.
        """
        if start not in grid or end not in grid:
            return []

        queue = deque([(start, [start])])
        visited = {start}

        while queue:
            current_pos, path = queue.popleft()

            if current_pos == end:
                return path

            for move in [FORWARD_X, BACKWARD_X, FORWARD_Z, BACKWARD_Z]:
                next_pos = add_vectors(current_pos, move)
                if next_pos in grid and next_pos not in visited:
                    visited.add(next_pos)
                    queue.append((next_pos, path + [next_pos]))
        return [] # Trả về rỗng nếu không tìm thấy đường đi