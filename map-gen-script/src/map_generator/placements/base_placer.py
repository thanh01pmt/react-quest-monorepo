# src/map_generator/placements/base_placer.py

from abc import ABC, abstractmethod
from typing import List, Tuple, Dict, Any, Set, Iterator
from src.map_generator.models.path_info import PathInfo
from .item_quantity import resolve_items_to_place, calculate_item_quantities  # [NEW] Smart quantity
import logging
from collections import Counter
import random

Coord = Tuple[int, int, int]

class BasePlacer(ABC):
    """
    Lớp cơ sở trừu tượng (Interface) cho tất cả các chiến lược đặt vật phẩm.
    
    Cung cấp một "hợp đồng" (phương thức place_items) và một "hộp dụng cụ"
    gồm các hàm hỗ trợ chung để các lớp Placer con tái sử dụng.
    """

    logger = logging.getLogger(__name__)

    @abstractmethod
    def place_items(self, path_info: PathInfo, params: dict, **kwargs) -> dict:
        """
        Phương thức chính để đặt các vật phẩm. Bắt buộc phải được override.
        """
        pass

    def place_item_variants(self, path_info: PathInfo, params: dict, max_variants: int) -> Iterator[Dict[str, Any]]:
        """
        [DEFAULT IMPLEMENTATION] Tạo ra một chuỗi các biến thể về layout.
        
        Mặc định: yield kết quả từ place_items (1 variant).
        Các lớp con có thể override để sinh nhiều variants.

        Args:
            path_info (PathInfo): Đối tượng chứa thông tin cấu trúc map.
            params (dict): Các tham số gốc từ curriculum.
            max_variants (int): Số lượng biến thể layout tối đa cần tạo cho PathInfo này.

        Yields:
            Iterator[Dict[str, Any]]: Lần lượt trả về các dictionary layout hoàn chỉnh.
        """
        # Default: yield single variant from place_items
        yield self.place_items(path_info, params)



    # =======================================================
    # HỘP DỤNG CỤ: CÁC HÀM HỖ TRỢ CHUNG
    # =======================================================

    def _get_coords(self, path_info: PathInfo) -> List[Coord]:
        """
        Lấy danh sách tọa độ phù hợp để đặt vật phẩm.
        Ưu tiên sử dụng `placement_coords` nếu có.
        """
        return path_info.placement_coords or path_info.path_coords

    def _exclude_ends(self, coords: List[Coord], path_info: PathInfo) -> List[Coord]:
        """
        Loại bỏ các tọa độ bắt đầu và kết thúc khỏi danh sách.
        """
        return [c for c in coords if c != path_info.start_pos and c != path_info.target_pos]

    def _base_layout(self, path_info: PathInfo, items: List[Dict], obstacles: List[Dict]) -> Dict[str, Any]:
        """
        Xây dựng dictionary layout cuối cùng để trả về.
        """
        return {
            "start_pos": path_info.start_pos,
            "target_pos": path_info.target_pos,
            "items": items,
            "obstacles": obstacles
        }

    def _override_start_target(self, path_info: PathInfo, params: dict):
        """
        [MỚI] Ghi đè start_pos và target_pos dựa trên chiến lược từ params.
        Điều này cho phép Placer có quyền quyết định cuối cùng về điểm bắt đầu/kết thúc.
        """
        strategy = params.get('start_target_strategy')
        if not strategy or strategy == 'default':
            return # Không làm gì, giữ nguyên giá trị từ Topology

        self.logger.info(f"  -> BasePlacer: Áp dụng chiến lược đặt Start/Target: '{strategy}'")
        
        # Sử dụng placement_coords vì nó chứa toàn bộ cấu trúc map
        coords = path_info.placement_coords
        if not coords:
            self.logger.warning("  -> Cảnh báo: placement_coords trống, không thể áp dụng chiến lược.")
            return

        if strategy == 'full_structure_ends':
            # Sắp xếp để đảm bảo tính nhất quán
            sorted_coords = sorted(list(set(coords)))
            path_info.start_pos = sorted_coords[0]
            path_info.target_pos = sorted_coords[-1]
            self.logger.info(f"     -> Đặt Start/Target ở hai đầu của cấu trúc: {path_info.start_pos} -> {path_info.target_pos}")

        elif strategy == 'farthest_points':
            if len(coords) < 2: return
            
            max_dist = -1
            p1, p2 = coords[0], coords[1]
            # Thuật toán O(n^2) đơn giản, có thể tối ưu sau nếu cần
            for i in range(len(coords)):
                for j in range(i + 1, len(coords)):
                    dist = abs(coords[i][0] - coords[j][0]) + abs(coords[i][2] - coords[j][2])
                    if dist > max_dist:
                        max_dist = dist
                        p1, p2 = coords[i], coords[j]
            path_info.start_pos, path_info.target_pos = p1, p2
            self.logger.info(f"     -> Đặt Start/Target ở hai điểm xa nhất: {p1} -> {p2}")

    # --- [NÂNG CẤP] Chuyển các hàm phân tích params lên đây ---
    
    def _get_item_counts(self, params: dict) -> Counter:
        """
        Hợp nhất `items_to_place` và `solution_item_goals` thành một đối tượng Counter.
        """
        raw_items = params.get('items_to_place', [])
        if isinstance(raw_items, str):
            raw_items = [x.strip() for x in raw_items.split(',') if x.strip()]
        
        goal_counts = self._parse_goals(params.get('solution_item_goals', ''))
        
        counts = Counter(goal_counts)
        for item in raw_items:
            # Clean up item string if it has brackets (basic clean)
            item = item.strip("[]'\" ")
            
            # Chỉ cộng thêm nếu giá trị hiện tại là số
            # Nếu là 'all' hoặc string đặc biệt khác, giữ nguyên
            if isinstance(counts[item], int):
                counts[item] += 1
            elif item not in counts:
                 # Nếu chưa có trong counts, khởi tạo là 1
                 counts[item] = 1
        return counts

    def _parse_goals(self, s: str) -> dict:
        """
        Phân tích chuỗi `solution_item_goals` (ví dụ: 'crystal:5; switch:1').
        """
        g = {}
        if not s: return g
        for p in str(s).split(';'):
            if ':' in p:
                k, v_str = p.split(':', 1)
                k, v_str = k.strip(), v_str.strip()
                try:
                    g[k] = int(v_str)
                except ValueError:
                    g[k] = v_str # Giữ lại dạng chuỗi nếu không phải số (ví dụ: 'all')
        return g

    def _resolve_item_quantities(self, params: dict, available_slots: int) -> List[str]:
        """
        [NEW] Resolve items_to_place with smart quantity calculation.
        
        Supports 3 modes:
        - 'explicit': Use items_to_place as-is (backward compatible)
        - 'auto': Calculate quantities based on map size, difficulty
        - 'ratio': Fill a ratio of available slots
        
        Args:
            params: Full params dict
            available_slots: Number of positions available for items
            
        Returns:
            List of item types with correct quantities
        """
        items_to_place = params.get('items_to_place', [])
        
        # Use the resolve function from item_quantity module
        return resolve_items_to_place(
            items_to_place=items_to_place,
            available_slots=available_slots,
            params=params
        )

    def _handle_explicit_placements(self, params: dict, path_info: PathInfo) -> Tuple[List[Dict], List[Dict], Set[Coord]]:
        """
        [BIG UPDATE] Xử lý các tham số đặt đối tượng tường minh từ curriculum biến thể.
        Đọc `obstacle_positions` và `items_to_place` (dạng dict có position).
        """
        explicit_items = []
        explicit_obstacles = []
        used_coords: Set[Coord] = set()
        used_coords.add(path_info.start_pos)
        used_coords.add(path_info.target_pos)

        # 1. Xử lý `obstacle_positions`
        obstacle_positions = params.get('obstacle_positions', [])
        if obstacle_positions and isinstance(obstacle_positions, list):
            self.logger.info(f"  -> BasePlacer: Phát hiện {len(obstacle_positions)} vị trí vật cản tường minh.")
            for pos in obstacle_positions:
                if isinstance(pos, list) and len(pos) == 3:
                    coord = tuple(pos)
                    explicit_obstacles.append({"type": "obstacle", "pos": coord, "is_surface_obstacle": True})
                    used_coords.add(coord)

        # 2. Xử lý `items_to_place` dạng dictionary
        items_to_place = params.get('items_to_place', [])
        if items_to_place and isinstance(items_to_place, list):
            
            items_with_pos = [item for item in items_to_place if isinstance(item, dict) and 'position' in item]
            if items_with_pos:
                self.logger.info(f"  -> BasePlacer: Phát hiện {len(items_with_pos)} vật phẩm có vị trí tường minh.")
                for item_spec in items_with_pos:
                    pos = item_spec.get('position')
                    item_type = item_spec.get('type')
                    if item_type and isinstance(pos, list) and len(pos) == 3:
                        coord = tuple(pos)
                        # Tránh đặt item lên vị trí đã có obstacle
                        if coord not in used_coords:
                            explicit_items.append({"type": item_type, "pos": coord})
                            used_coords.add(coord)
                        else:
                            self.logger.warning(f"  -> BasePlacer: Cảnh báo - Vị trí {coord} cho item '{item_type}' đã bị chiếm. Bỏ qua item này.")

        return explicit_items, explicit_obstacles, used_coords


    # --- [NÂNG CẤP] Thêm hàm hỗ trợ đặt obstacle ---

    def _place_obstacles(self, path_info: PathInfo, all_coords: List[Coord], used_coords: Set[Coord], count: int) -> List[Dict]:
        """
        Đặt một số lượng `count` chướng ngại vật vào các vị trí còn trống.
        """
        # Bắt đầu với các obstacle đã có sẵn từ Topology (ví dụ: các bậc thang)
        obstacles = list(path_info.obstacles)
        
        # Xác định các vị trí có thể đặt obstacle mới
        available_coords = [
            c for c in all_coords 
            if c not in used_coords 
            and c != path_info.start_pos 
            and c != path_info.target_pos
        ]
        
        num_to_place = min(count, len(available_coords))
        if num_to_place <= 0:
            return obstacles

        positions_to_place = random.sample(available_coords, num_to_place)
        
        for pos in positions_to_place:
            obstacles.append({"type": "obstacle", "pos": pos, "is_surface_obstacle": True})
            used_coords.add(pos) # Cập nhật lại để tránh đặt item lên trên
            
        return obstacles