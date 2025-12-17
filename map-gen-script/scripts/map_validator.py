# scripts/map_validator.py
"""
MAP VALIDATOR - Validate map before solving

Lớp này kiểm tra tính hợp lệ của map trước khi solver cố gắng giải.
Giúp phát hiện sớm các lỗi và tránh lãng phí tài nguyên cho các map không thể giải.

Cách sử dụng:
    from scripts.map_validator import MapValidator
    
    validator = MapValidator(world)
    errors = validator.validate()
    if errors:
        for error in errors:
            print(f"Validation error: {error}")
"""

from typing import List, Dict, Set, Tuple, Optional
from collections import deque


class MapValidator:
    """Validate map before solving."""
    
    # Các block bắt buộc phải có để solver hoạt động
    ESSENTIAL_BLOCKS = {'maze_moveForward'}
    
    def __init__(self, world):
        """
        Khởi tạo validator với GameWorld object.
        
        Args:
            world: GameWorld instance từ gameSolver.py
        """
        self.world = world
    
    def validate(self) -> List[str]:
        """
        Chạy tất cả các kiểm tra validation.
        
        Returns:
            List các error messages. Rỗng nếu map hợp lệ.
        """
        errors = []
        errors.extend(self._check_start_position())
        errors.extend(self._check_finish_position())
        errors.extend(self._check_toolbox_sufficiency())
        errors.extend(self._check_goals_defined())
        # Reachability check chỉ chạy nếu các check cơ bản pass
        if not errors:
            errors.extend(self._check_reachability())
        return errors
    
    def _check_start_position(self) -> List[str]:
        """Kiểm tra vị trí bắt đầu hợp lệ."""
        errors = []
        start = self.world.start_info
        if not start:
            errors.append("START_MISSING: Không tìm thấy vị trí bắt đầu của player")
            return errors
        
        # Kiểm tra start có nằm trên ground không
        pos_key = f"{start['x']}-{int(start['y']) - 1}-{start['z']}"
        ground_below = self.world.world_map.get(pos_key)
        if ground_below is None:
            errors.append(f"START_NO_GROUND: Player bắt đầu ở ({start['x']}, {start['y']}, {start['z']}) nhưng không có ground bên dưới")
        
        return errors
    
    def _check_finish_position(self) -> List[str]:
        """Kiểm tra vị trí kết thúc hợp lệ."""
        errors = []
        finish = self.world.finish_pos
        if not finish:
            errors.append("FINISH_MISSING: Không tìm thấy vị trí kết thúc")
            return errors
        
        # Kiểm tra finish có nằm trên ground không
        pos_key = f"{finish['x']}-{int(finish['y']) - 1}-{finish['z']}"
        ground_below = self.world.world_map.get(pos_key)
        if ground_below is None:
            errors.append(f"FINISH_NO_GROUND: Đích ở ({finish['x']}, {finish['y']}, {finish['z']}) nhưng không có ground bên dưới")
        
        return errors
    
    def _check_toolbox_sufficiency(self) -> List[str]:
        """Kiểm tra toolbox có đủ blocks cần thiết."""
        errors = []
        available = self.world.available_blocks
        
        # Check essential blocks
        missing_essential = self.ESSENTIAL_BLOCKS - available
        if missing_essential:
            errors.append(f"TOOLBOX_MISSING_ESSENTIAL: Thiếu blocks cần thiết: {missing_essential}")
        
        # Check nếu có collectibles nhưng không có collect block
        if self.world.collectibles_by_id and 'maze_collect' not in available:
            errors.append("TOOLBOX_MISSING_COLLECT: Map có collectibles nhưng không có block 'maze_collect'")
        
        # Check nếu có switches nhưng không có toggle block
        if self.world.switches and 'maze_toggle_switch' not in available:
            errors.append("TOOLBOX_MISSING_TOGGLE: Map có switches nhưng không có block 'maze_toggle_switch'")
        
        # Check nếu có obstacles nhưng không có jump block
        if self.world.obstacles and 'maze_jump' not in available:
            # Chỉ warning vì có thể obstacles chỉ để trang trí
            pass  # Could add warning level in future
        
        return errors
    
    def _check_goals_defined(self) -> List[str]:
        """Kiểm tra các mục tiêu được định nghĩa hợp lệ."""
        errors = []
        item_goals = self.world.solution_config.get("itemGoals", {})
        
        for goal_type, required_count in item_goals.items():
            if goal_type == 'switch':
                # Đếm số switches có trên map
                actual_count = len(self.world.switches)
                if isinstance(required_count, int) and required_count > actual_count:
                    errors.append(f"GOAL_SWITCH_INSUFFICIENT: Yêu cầu {required_count} switches nhưng map chỉ có {actual_count}")
            else:
                # Đếm số collectibles loại goal_type
                actual_count = sum(1 for c in self.world.collectibles_by_id.values() if c.get('type') == goal_type)
                if isinstance(required_count, int) and required_count > actual_count:
                    errors.append(f"GOAL_{goal_type.upper()}_INSUFFICIENT: Yêu cầu {required_count} {goal_type} nhưng map chỉ có {actual_count}")
        
        return errors
    
    def _check_reachability(self) -> List[str]:
        """
        Kiểm tra tất cả goals có thể đến được từ start.
        Sử dụng BFS đơn giản (không xét hướng player).
        """
        errors = []
        
        start = self.world.start_info
        start_pos = (int(start['x']), int(start['y']), int(start['z']))
        
        # BFS để tìm tất cả các vị trí có thể đến
        reachable = self._bfs_reachable(start_pos)
        
        # Check finish reachable
        finish = self.world.finish_pos
        finish_pos = (int(finish['x']), int(finish['y']), int(finish['z']))
        if finish_pos not in reachable:
            errors.append(f"UNREACHABLE_FINISH: Không thể đến đích từ vị trí bắt đầu")
        
        # Check collectibles reachable
        for coll_id, coll in self.world.collectibles_by_id.items():
            pos = coll['position']
            coll_pos = (int(pos['x']), int(pos['y']), int(pos['z']))
            if coll_pos not in reachable:
                errors.append(f"UNREACHABLE_COLLECTIBLE: Không thể đến collectible '{coll_id}' tại {coll_pos}")
        
        # Check switches reachable
        for switch_key, switch in self.world.switches.items():
            pos = switch['position']
            switch_pos = (int(pos['x']), int(pos['y']), int(pos['z']))
            if switch_pos not in reachable:
                errors.append(f"UNREACHABLE_SWITCH: Không thể đến switch '{switch['id']}' tại {switch_pos}")
        
        return errors
    
    def _bfs_reachable(self, start: Tuple[int, int, int]) -> Set[Tuple[int, int, int]]:
        """
        BFS để tìm tất cả các vị trí có thể đến được.
        Đây là phiên bản đơn giản hóa, không xét hướng player.
        """
        reachable = {start}
        queue = deque([start])
        
        # 4 hướng di chuyển ngang (không xét y vì cần jump)
        DIRECTIONS = [(1, 0, 0), (-1, 0, 0), (0, 0, 1), (0, 0, -1)]
        
        while queue:
            x, y, z = queue.popleft()
            
            for dx, dy, dz in DIRECTIONS:
                nx, ny, nz = x + dx, y + dy, z + dz
                
                if (nx, ny, nz) in reachable:
                    continue
                
                # Check if walkable (có ground bên dưới và không có obstacle chặn)
                ground_key = f"{nx}-{ny - 1}-{nz}"
                pos_key = f"{nx}-{ny}-{nz}"
                
                # Đơn giản: nếu có ground bên dưới và không bị chặn → reachable
                if self.world.world_map.get(ground_key) and not self.world.world_map.get(pos_key):
                    reachable.add((nx, ny, nz))
                    queue.append((nx, ny, nz))
                
                # Xét nhảy lên obstacle
                obstacle_key = f"{nx}-{ny}-{nz}"
                if self.world.world_map.get(obstacle_key):
                    # Có thể nhảy lên đỉnh obstacle
                    top_pos = (nx, ny + 1, nz)
                    space_above_key = f"{nx}-{ny + 1}-{nz}"
                    if not self.world.world_map.get(space_above_key) and top_pos not in reachable:
                        reachable.add(top_pos)
                        queue.append(top_pos)
                
                # Xét nhảy xuống
                lower_pos = (nx, ny - 1, nz)
                lower_ground_key = f"{nx}-{ny - 2}-{nz}"
                lower_space_key = f"{nx}-{ny - 1}-{nz}"
                if (self.world.world_map.get(lower_ground_key) and 
                    not self.world.world_map.get(lower_space_key) and 
                    lower_pos not in reachable):
                    reachable.add(lower_pos)
                    queue.append(lower_pos)
        
        return reachable


def validate_map(world) -> List[str]:
    """
    Convenience function để validate map.
    
    Args:
        world: GameWorld instance
        
    Returns:
        List các error messages. Rỗng nếu map hợp lệ.
    """
    validator = MapValidator(world)
    return validator.validate()
