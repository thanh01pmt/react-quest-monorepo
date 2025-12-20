# scripts/synthesizers/conditional_while.py
"""
CONDITIONAL WHILE SYNTHESIZER - Logic cho vòng lặp có điều kiện (Sensor)
Ported from gameSolver.ts (optimizeWithConditionalWhile)
"""

from typing import List, Dict, Any, Set
from .base import SynthesizerStrategy


class ConditionalWhileSynthesizer(SynthesizerStrategy):
    """
    Synthesizer nhận diện mẫu đường thẳng có vật phẩm ngẫu nhiên và
    chuyển đổi thành vòng lặp while/forever với câu lệnh điều kiện.
    Pattern: move, move, collect, move, move -> forever { move, if(item) collect }
    """
    
    def can_handle(self, logic_type: str, world: Any) -> bool:
        """
        Chiến lược này có thể được áp dụng nếu logic_type là 'conditional_while'
        hoặc 'sensor_basic'.
        """
        return logic_type in {'conditional_while', 'sensor_basic', 'automated_collection'}
    
    def synthesize(self, actions: List[str], world: Any) -> Dict:
        """
        Tạo cấu trúc vòng lặp điều kiện.
        """
        available_blocks = world.available_blocks
        solution_config = world.solution_config
        
        has_while = 'maze_forever' in available_blocks or 'controls_whileUntil' in available_blocks
        has_if = 'controls_if' in available_blocks
        
        if not has_while or not has_if:
            return {} # Fallback
            
        # Kiểm tra xem actions có phù hợp không (chỉ chứa move, collect, toggle)
        allowed_actions = {'moveForward', 'collect', 'toggleSwitch', 'maze_moveForward', 'maze_collect', 'maze_toggle_switch'}
        # Cho phép turn nếu nó rất ít (ví dụ quay đầu ở đích), nhưng model đơn giản này
        # chủ yếu cho đường thẳng. Nếu có turn, ta cần logic phức tạp hơn (Wall Follower).
        
        # Trong phiên bản port đơn giản này, ta giả định đường thẳng hoặc đường đi mà
        # việc di chuyển là hành động chủ đạo lặp lại.
        
        conditional_actions = []
        item_goals = solution_config.get('itemGoals', {})
        
        # Tự động tạo khối IF cho các item goals
        # Check switch
        if item_goals.get('switch') and any('toggleSwitch' in a or 'maze_toggle_switch' in a for a in actions):
             conditional_actions.append({
                "type": "controls_if",
                "condition": {"type": "maze_is_switch_state", "state": "off"},
                "if_actions": [{"type": "maze_toggle_switch"}]
            })
            
        # Check other items
        for goal_type in item_goals:
            if goal_type == 'switch': continue
            
            # Check if any collect action actually happens for this type (heuristic basic)
            if any('collect' in a or 'maze_collect' in a for a in actions):
                 conditional_actions.append({
                    "type": "controls_if",
                    "condition": {"type": "maze_is_item_present", "item_type": goal_type},
                    "if_actions": [{"type": "maze_collect"}]
                })
        
        # Tạo vòng lặp chính
        # Ưu tiên maze_forever nếu có
        loop_type = 'maze_forever' if 'maze_forever' in available_blocks else 'controls_whileUntil'
        
        loop_body = [{"type": "maze_moveForward"}] + conditional_actions
        
        main_program = [{
            "type": loop_type,
            "actions": loop_body
        }]
        
        if loop_type == 'controls_whileUntil':
            main_program[0]['condition'] = 'at_finish' # Mặc định until at_finish
            
        return {"main": main_program, "procedures": {}}
