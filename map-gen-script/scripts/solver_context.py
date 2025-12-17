# scripts/solver_context.py
"""
SOLVER CONTEXT - Bridge between Map Generator and Solver

Lớp này trích xuất thông tin từ generation_config của map để cung cấp
hints cho solver, giúp cải thiện hiệu suất và độ chính xác.

Cách sử dụng:
    from scripts.solver_context import SolverContext
    
    context = SolverContext(json_data.get('generation_config', {}))
    heuristic_params = context.get_heuristic_params()
"""

from typing import Dict, List, Optional, Any


class SolverContext:
    """
    Bridge thông tin từ Map Generator sang Solver.
    
    Trích xuất các hints hữu ích từ quá trình sinh map để tối ưu hóa
    việc giải, bao gồm: expected path length, jump locations, loop patterns.
    """
    
    def __init__(self, generation_config: Dict[str, Any]):
        """
        Khởi tạo context từ generation_config.
        
        Args:
            generation_config: Dict chứa thông tin từ quá trình sinh map
        """
        self.config = generation_config
        self.map_type = generation_config.get('map_type', 'unknown')
        self.logic_type = generation_config.get('logic_type', 'sequencing')
        self.params = generation_config.get('params', {})
        
        # Trích xuất path info nếu có
        self.path_coords = generation_config.get('path_coords', [])
        self.branch_coords = generation_config.get('branch_coords', [])
        self.placement_coords = generation_config.get('placement_coords', [])
    
    @property
    def expected_path_length(self) -> int:
        """Số bước di chuyển dự kiến dựa trên path_coords."""
        return len(self.path_coords) if self.path_coords else 0
    
    @property
    def expected_turns(self) -> int:
        """Số lần quay hướng dự kiến."""
        if len(self.path_coords) < 2:
            return 0
        
        turns = 0
        for i in range(1, len(self.path_coords) - 1):
            prev = self.path_coords[i - 1]
            curr = self.path_coords[i]
            next_pos = self.path_coords[i + 1]
            
            # Tính hướng di chuyển
            dir1 = (curr['x'] - prev['x'], curr['z'] - prev['z'])
            dir2 = (next_pos['x'] - curr['x'], next_pos['z'] - curr['z'])
            
            if dir1 != dir2:
                turns += 1
        
        return turns
    
    def identify_height_changes(self) -> List[Dict[str, Any]]:
        """
        Xác định các vị trí có sự thay đổi độ cao (cần jump).
        
        Returns:
            List các vị trí cần jump với thông tin delta_y
        """
        if len(self.path_coords) < 2:
            return []
        
        height_changes = []
        for i in range(1, len(self.path_coords)):
            prev = self.path_coords[i - 1]
            curr = self.path_coords[i]
            
            delta_y = curr.get('y', 0) - prev.get('y', 0)
            if delta_y != 0:
                height_changes.append({
                    'position': curr,
                    'index': i,
                    'delta_y': delta_y,
                    'action': 'jump_up' if delta_y > 0 else 'jump_down'
                })
        
        return height_changes
    
    def detect_repeating_sections(self) -> List[Dict[str, Any]]:
        """
        Phát hiện các đoạn lặp lại trong path (hints cho loop synthesis).
        
        Returns:
            List các pattern lặp với thông tin: sequence, count, start_index
        """
        if len(self.path_coords) < 4:
            return []
        
        # Chuyển đổi path thành chuỗi hướng di chuyển
        directions = []
        for i in range(1, len(self.path_coords)):
            prev = self.path_coords[i - 1]
            curr = self.path_coords[i]
            
            dx = curr.get('x', 0) - prev.get('x', 0)
            dz = curr.get('z', 0) - prev.get('z', 0)
            dy = curr.get('y', 0) - prev.get('y', 0)
            
            if dy > 0:
                directions.append('UP')
            elif dy < 0:
                directions.append('DOWN')
            elif dx > 0:
                directions.append('E')
            elif dx < 0:
                directions.append('W')
            elif dz > 0:
                directions.append('S')
            elif dz < 0:
                directions.append('N')
        
        # Tìm các pattern lặp
        patterns = []
        for length in range(2, min(10, len(directions) // 2 + 1)):
            for start in range(len(directions) - 2 * length + 1):
                pattern = tuple(directions[start:start + length])
                count = 1
                check_pos = start + length
                
                while check_pos + length <= len(directions):
                    if tuple(directions[check_pos:check_pos + length]) == pattern:
                        count += 1
                        check_pos += length
                    else:
                        break
                
                if count >= 2:
                    patterns.append({
                        'sequence': list(pattern),
                        'count': count,
                        'start_index': start,
                        'length': length
                    })
        
        # Sắp xếp theo số lần lặp giảm dần
        patterns.sort(key=lambda p: p['count'] * p['length'], reverse=True)
        return patterns[:5]  # Chỉ trả về top 5 patterns
    
    def get_heuristic_params(self) -> Dict[str, Any]:
        """
        Trả về các tham số heuristic được tùy chỉnh dựa trên đặc điểm map.
        
        Returns:
            Dict chứa các tham số để fine-tune heuristic function
        """
        params = {
            'goal_weight': 5,
            'turn_cost': 0.1,
            'use_path_hint': len(self.path_coords) > 0,
            'expected_length': self.expected_path_length,
            'expected_turns': self.expected_turns,
        }
        
        # Tùy chỉnh dựa trên map_type
        if self.map_type == 'plowing_field':
            params['goal_weight'] = 3  # Ít penalty hơn vì cần thu thập theo thứ tự
        elif self.map_type in ['zigzag', 's_shape', 'z_shape']:
            params['turn_cost'] = 0.05  # Giảm cost quay vì map có nhiều turn
        elif self.map_type in ['spiral_3d', 'staircase_3d']:
            params['jump_bonus'] = True  # Ưu tiên jump ở các map 3D
        
        # Tùy chỉnh dựa trên logic_type
        if self.logic_type in ['for_loop_logic', 'nested_for_loop']:
            params['prefer_straight'] = True  # Ưu tiên đi thẳng cho loop detection
        
        return params
    
    def get_collection_order_hint(self) -> Optional[List[Dict[str, Any]]]:
        """
        Gợi ý thứ tự thu thập vật phẩm tối ưu dựa trên vị trí placement.
        
        Returns:
            List các vị trí theo thứ tự gợi ý, hoặc None nếu không có hint
        """
        if not self.placement_coords:
            return None
        
        # Trả về placement_coords theo thứ tự xuất hiện (thường là thứ tự tối ưu)
        return self.placement_coords
    
    def has_multi_level(self) -> bool:
        """Kiểm tra xem map có nhiều tầng (cần jump) không."""
        if not self.path_coords:
            return False
        
        y_values = set(p.get('y', 0) for p in self.path_coords)
        return len(y_values) > 1
    
    def to_dict(self) -> Dict[str, Any]:
        """Serialize context thành dict để debug/logging."""
        return {
            'map_type': self.map_type,
            'logic_type': self.logic_type,
            'expected_path_length': self.expected_path_length,
            'expected_turns': self.expected_turns,
            'has_multi_level': self.has_multi_level(),
            'height_changes': len(self.identify_height_changes()),
            'repeating_patterns': len(self.detect_repeating_sections()),
        }
    
    # =========================================================================
    # [NEW Part 3.3] ENHANCED HINTS INTEGRATION
    # =========================================================================
    
    def load_from_map_hints(self, hints: Dict[str, Any]):
        """
        [NEW Part 3.3] Load hints directly from MapData.get_solver_hints().
        
        Args:
            hints: Dict from MapData.get_solver_hints()
        """
        self._map_hints = hints
        
        # Update internal state from hints
        if 'expected_path_length' in hints:
            self._hints_path_length = hints['expected_path_length']
        if 'jump_locations' in hints:
            self._jump_locations = set(tuple(loc) for loc in hints['jump_locations'])
        else:
            self._jump_locations = set()
        if 'loop_patterns' in hints:
            self._loop_patterns = hints['loop_patterns']
        else:
            self._loop_patterns = []
    
    def get_action_priority(self, current_pos: tuple, available_actions: List[str]) -> List[str]:
        """
        [NEW Part 3.3] Get prioritized action order based on hints.
        
        Args:
            current_pos: Current player position as (x, y, z) tuple
            available_actions: List of available action names
            
        Returns:
            List of actions sorted by priority (highest first)
        """
        priority_map = {action: 0 for action in available_actions}
        
        # If at a jump location, prioritize jump
        if hasattr(self, '_jump_locations') and current_pos in self._jump_locations:
            if 'jump' in priority_map:
                priority_map['jump'] = 10  # Highest priority
            if 'maze_jump' in priority_map:
                priority_map['maze_jump'] = 10
        
        # For loop-based maps, prefer straight movement
        if self.logic_type in ['for_loop_logic', 'nested_for_loop', 'for_loop']:
            if 'moveForward' in priority_map:
                priority_map['moveForward'] = 5
            if 'maze_moveForward' in priority_map:
                priority_map['maze_moveForward'] = 5
        
        # Sort by priority descending
        return sorted(available_actions, key=lambda a: priority_map.get(a, 0), reverse=True)
    
    def get_heuristic_weight_adjustment(self, current_steps: int) -> float:
        """
        [NEW Part 3.3] Get heuristic weight adjustment based on expected path.
        
        Args:
            current_steps: Number of steps taken so far
            
        Returns:
            Weight multiplier for heuristic (>1.0 = penalize longer paths)
        """
        expected = getattr(self, '_hints_path_length', None)
        if not expected or expected == 0:
            expected = self.expected_path_length
        
        if expected <= 0:
            return 1.0
        
        ratio = current_steps / expected
        
        # If exceeding expected, increase heuristic weight
        if ratio > 1.0:
            return 1.0 + (ratio - 1.0) * 0.5
        
        return 1.0
    
    def get_loop_patterns_for_synthesis(self) -> List[Dict[str, Any]]:
        """
        [NEW Part 3.3] Get loop patterns for code synthesizer.
        
        Returns:
            List of pattern dicts for synthesizer to use
        """
        if hasattr(self, '_loop_patterns') and self._loop_patterns:
            return self._loop_patterns
        return self.detect_repeating_sections()
