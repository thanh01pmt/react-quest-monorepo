# src/map_generator/placements/strategies/branch_placer_strategy.py
"""
BRANCH PLACER STRATEGY (Nâng cấp)

- Chuyên gia xử lý các map có cấu trúc "nhánh" (h_shape, plus_shape, etc.).
- [NÂNG CẤP] Kế thừa trực tiếp từ BasePlacer.
- [NÂNG CẤP] Đọc cấu trúc 'branches' từ `path_info.metadata`.
- [NÂNG CẤP] Xử lý đầy đủ các challenge_type: APPLY, REFACTOR, DEBUG.
"""

import random
from typing import List, Tuple, Dict, Set, Any, Iterator
from src.map_generator.models.path_info import PathInfo
# Import BasePlacer từ thư mục cha
import logging
from ..base_placer import BasePlacer

logger = logging.getLogger(__name__)

class BranchPlacerStrategy(BasePlacer):
    def place_item_variants(self, path_info: PathInfo, params: dict, max_variants: int) -> Iterator[Dict[str, Any]]:
        """
        [KIẾN TRÚC MỚI] Tạo ra các biến thể layout.
        Hiện tại, nó chỉ tạo ra một biến thể duy nhất bằng cách gọi place_items.
        """
        # Logic tạo nhiều biến thể có thể được thêm vào đây sau.
        yield self.place_items(path_info, params)

    def place_items(self, path_info: PathInfo, params: dict) -> Dict[str, Any]:
        self.path_info = path_info # Cần thiết để các hàm từ BasePlacer hoạt động
        challenge_type = params.get('challenge_type', 'SIMPLE_APPLY')
        
        items = []
        used_coords = set()

        # 1. Lấy thông tin cấu trúc từ metadata, nhất quán với các strategy khác
        branches = path_info.metadata.get("branches", [path_info.path_coords])
        if not branches:
            logger.warning(f"Cảnh báo: Branch Placer không tìm thấy 'branches' cho map '{params.get('map_type')}'.")
            return self._base_layout(path_info, [], path_info.obstacles)

        # 2. Đặt item dựa trên challenge_type
        logger.info(f"-> BranchPlacer: Áp dụng kịch bản '{challenge_type}'")
        item_types_to_place = params.get('items_to_place', ['crystal'])
        
        if challenge_type == 'REFACTOR':
            # Đặt 1 item ở cuối mỗi nhánh để tạo ra kịch bản lặp lại, buộc phải đi hết
            for i, branch_coords in enumerate(branches):
                if branch_coords:
                    pos = branch_coords[-1] # Đặt ở cuối nhánh
                    if pos not in used_coords:
                        item_type = item_types_to_place[i % len(item_types_to_place)]
                        items.append({"type": item_type, "pos": pos})
                        used_coords.add(pos)

        elif challenge_type == 'DEBUG_FIX_LOGIC':
            # Đặt item ở tất cả các nhánh TRỪ MỘT nhánh, tạo ra lỗi "bỏ sót"
            for i, branch_coords in enumerate(branches):
                if i < len(branches) - 1 and branch_coords: # Bỏ qua nhánh cuối
                    pos = branch_coords[len(branch_coords) // 2] # Đặt ở giữa nhánh
                    if pos not in used_coords:
                        item_type = item_types_to_place[i % len(item_types_to_place)]
                        items.append({"type": item_type, "pos": pos})
                        used_coords.add(pos)
        
        else: # SIMPLE_APPLY / COMPLEX_APPLY
            # Đặt 1 item ngẫu nhiên trên mỗi nhánh
            for i, branch_coords in enumerate(branches):
                valid_branch_coords = [c for c in branch_coords if c not in used_coords]
                if valid_branch_coords:
                    pos = random.choice(valid_branch_coords)
                    item_type = item_types_to_place[i % len(item_types_to_place)]
                    items.append({"type": item_type, "pos": pos})
                    used_coords.add(pos)

        # 3. Đặt các obstacles phụ (nếu có) bằng hàm từ BasePlacer
        item_counts = self._get_item_counts(params)
        obstacle_count = item_counts.get('obstacle', 0)
        all_coords = [coord for branch in branches for coord in branch]
        obstacles = self._place_obstacles(path_info, all_coords, used_coords, obstacle_count)

        # 4. Đóng gói và trả về layout hoàn chỉnh bằng hàm từ BasePlacer
        return self._base_layout(path_info, items, obstacles)

# Tạo một instance để FunctionPlacer có thể import và sử dụng
branch_placer_strategy = BranchPlacerStrategy()