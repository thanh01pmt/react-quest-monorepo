# scripts/synthesizers/advanced_algorithm.py
"""
ADVANCED ALGORITHM SYNTHESIZER - Xử lý thuật toán phức tạp (Fibonacci, etc.)
"""

from typing import List, Dict, Any
from .base import SynthesizerStrategy


class AdvancedAlgorithmSynthesizer(SynthesizerStrategy):
    """
    Synthesizer cho các map yêu cầu thuật toán phức tạp như Fibonacci.
    Tạo program structure dựa trên algorithm template.
    """
    
    def can_handle(self, logic_type: str, world: Any) -> bool:
        """
        Xử lý khi logic_type là advanced_algorithm và có template.
        """
        if logic_type != 'advanced_algorithm':
            return False
        
        # Kiểm tra xem có algorithm template không
        algorithm_template = world.solution_config.get('algorithm_template', {})
        return bool(algorithm_template)
    
    def synthesize(self, actions: List[str], world: Any) -> Dict:
        """
        Tạo algorithm structure based on template.
        """
        algorithm_template = world.solution_config.get('algorithm_template', {})
        algorithm_name = algorithm_template.get('name', '')
        
        if algorithm_name == 'fibonacci':
            return self._synthesize_fibonacci(world, algorithm_template, actions)
        elif algorithm_name == 'factorial':
            return self._synthesize_factorial(world, algorithm_template, actions)
        else:
            # Default: basic compression
            return {
                "main": self.compress_actions_to_structure(actions, world.available_blocks),
                "procedures": {}
            }
    
    def _synthesize_fibonacci(self, world: Any, template: Dict, actions: List[str]) -> Dict:
        """
        [FIX A1] Tạo Fibonacci algorithm structure, synchronized với actual actions.
        """
        # [FIX A1] Analyze actions to determine loop count
        # Find repeating pattern in actions to sync with actual path
        if actions:
            # Count significant actions (moveForward, collect, toggle_switch)
            significant_actions = [a for a in actions if a in ('moveForward', 'collect', 'toggle_switch')]
            loop_times = len(significant_actions) if significant_actions else len(actions)
        else:
            # Fallback to collectibles count
            num_items = len(world.collectibles_by_id) + len(world.switches)
            loop_times = max(num_items, 5) if num_items > 0 else 5
        
        if loop_times < 3:
            loop_times = 3  # Đảm bảo đủ số lần lặp cho Fibonacci

        # Lấy tên các biến từ template
        variables = template.get("variables", ["a", "b", "temp"])
        var_a = variables[0] if len(variables) > 0 else "a"
        var_b = variables[1] if len(variables) > 1 else "b"
        var_temp = variables[2] if len(variables) > 2 else "temp"

        # [FIX A1] Determine loop body from actions or template
        loop_body_actions = template.get("loop_body", None)
        if loop_body_actions is None:
            # Default loop body based on available actions
            loop_body = [
                # Logic Fibonacci: temp = a; a = b; b = temp + b
                {"type": "variables_set", "variable": var_temp, 
                 "value": {"type": "variables_get", "variable": var_a}},
                {"type": "variables_set", "variable": var_a, 
                 "value": {"type": "variables_get", "variable": var_b}},
                # [FIX A3] Use left/right structure for math_arithmetic
                {"type": "variables_set", "variable": var_b, 
                 "value": {"type": "math_arithmetic", "op": "ADD", 
                          "left": {"type": "variables_get", "variable": var_temp}, 
                          "right": {"type": "variables_get", "variable": var_b}}},
            ]
            # Add movement/interaction based on what's in actions
            if 'moveForward' in actions:
                loop_body.append({"type": "maze_moveForward"})
            if 'toggle_switch' in actions or world.switches:
                loop_body.append({"type": "maze_toggle_switch"})
            elif 'collect' in actions or world.collectibles_by_id:
                loop_body.append({"type": "maze_collect"})
        else:
            # Use template-defined loop body
            loop_body = loop_body_actions

        main_program = [
            {"type": "variables_set", "variable": var_a, "value": 0},
            {"type": "variables_set", "variable": var_b, "value": 1},
            {"type": "variables_set", "variable": var_temp, "value": 0},
            {"type": "maze_repeat", "times": loop_times, "body": loop_body}
        ]
        
        return {"main": main_program, "procedures": {}}
    
    def _synthesize_factorial(self, world: Any, template: Dict, actions: List[str]) -> Dict:
        """
        [FIX A1] Tạo Factorial algorithm structure, synchronized với actual actions.
        """
        # [FIX A1] Analyze actions to determine n value
        if actions:
            # Count significant actions
            significant_actions = [a for a in actions if a in ('moveForward', 'collect', 'toggle_switch')]
            n_value = len(significant_actions) if significant_actions else len(actions)
        else:
            num_items = len(world.collectibles_by_id) + len(world.switches)
            n_value = max(num_items, 5)
        
        variables = template.get("variables", ["n", "result"])
        var_n = variables[0] if len(variables) > 0 else "n"
        var_result = variables[1] if len(variables) > 1 else "result"
        
        main_program = [
            {"type": "variables_set", "variable": var_n, "value": n_value},
            {"type": "variables_set", "variable": var_result, "value": 1},
            {"type": "maze_repeat_until", "condition": {"type": "logic_compare", "op": "LTE", 
                                                        "left": {"type": "variables_get", "variable": var_n}, 
                                                        "right": 1},
             "body": [
                # [FIX A3] Use left/right structure for math_arithmetic
                {"type": "variables_set", "variable": var_result,
                 "value": {"type": "math_arithmetic", "op": "MULTIPLY", 
                          "left": {"type": "variables_get", "variable": var_result}, 
                          "right": {"type": "variables_get", "variable": var_n}}},
                {"type": "variables_change", "variable": var_n, "change": -1},
                {"type": "maze_moveForward"}
            ]}
        ]
        
        return {"main": main_program, "procedures": {}}
