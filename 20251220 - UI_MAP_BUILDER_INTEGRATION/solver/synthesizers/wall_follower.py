# scripts/synthesizers/wall_follower.py
"""
WALL FOLLOWER SYNTHESIZER - Thuật toán bám tường (Right-hand rule)
Ported from gameSolver.ts (createWallFollowerSolution)
"""

from typing import List, Dict, Any
from .base import SynthesizerStrategy


class WallFollowerSynthesizer(SynthesizerStrategy):
    """
    Synthesizer tạo thuật toán bám tường (Right-hand rule).
    Phù hợp cho các mê cung phức tạp hoặc khi yêu cầu giải thuật tổng quát.
    """
    
    def can_handle(self, logic_type: str, world: Any) -> bool:
        return logic_type in {'wall_follower', 'maze_algorithm', 'complex_maze'}
    
    def synthesize(self, actions: List[str], world: Any) -> Dict:
        """
        Tạo structure cho thuật toán bám phải.
        """
        solution_config = world.solution_config
        item_goals = solution_config.get('itemGoals', {})
        
        # Tạo các conditional actions cho items (sensors)
        item_goal_actions = []
        for goal_type in item_goals:
            if goal_type != 'switch':
                item_goal_actions.append({
                    "type": "controls_if",
                    "condition": {"type": "maze_is_item_present", "item_type": goal_type},
                    "if_actions": [{"type": "maze_collect"}]
                })
        
        if item_goals.get('switch'):
            item_goal_actions.append({
                "type": "controls_if",
                "condition": {"type": "maze_is_switch_state", "state": "off"},
                "if_actions": [{"type": "maze_toggle_switch"}]
            })
            
        # Logic di chuyển bám phải:
        # If path_right: turnRight, move
        # Else If path_ahead: move
        # Else: turnLeft
        
        movement_logic = {
            "type": "controls_if",
            "condition": {"type": "maze_is_path", "direction": "path to the right"},
            "if_actions": [
                {"type": "maze_turn", "direction": "turnRight"},
                {"type": "maze_moveForward"}
            ],
            "else_if_actions": [{
                "condition": {"type": "maze_is_path", "direction": "path ahead"},
                "actions": [{"type": "maze_moveForward"}]
            }],
            "else_actions": [{"type": "maze_turn", "direction": "turnLeft"}]
        }
        
        # Main loops
        main_program = [{
            "type": "maze_forever", # Hoặc controls_whileUntil logic
            "actions": [movement_logic] + item_goal_actions
        }]
        
        return {"main": main_program, "procedures": {}}
