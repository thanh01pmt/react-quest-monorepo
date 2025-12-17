# scripts/synthesizers/math_expression.py
"""
MATH EXPRESSION SYNTHESIZER - Xử lý loops với biểu thức toán học
"""

from typing import List, Dict, Any
from .base import SynthesizerStrategy


class MathExpressionSynthesizer(SynthesizerStrategy):
    """
    Synthesizer cho các map yêu cầu math expressions trong loops.
    Sử dụng maze_repeat_expression với math_arithmetic.
    """
    
    HANDLED_LOGIC_TYPES = {
        'math_expression_loop',
        'math_complex',
        'math_basic',
    }
    
    def can_handle(self, logic_type: str, world: Any) -> bool:
        """
        Xử lý khi logic_type yêu cầu math expression.
        """
        return logic_type in self.HANDLED_LOGIC_TYPES
    
    def synthesize(self, actions: List[str], world: Any) -> Dict:
        """
        Tạo math expression loop structure.
        """
        available_blocks = world.available_blocks
        
        # Lấy thông tin math expression từ config
        math_config = world.solution_config.get('math_expression', {})
        
        if not math_config:
            # Không có config, generate từ pattern
            return self._synthesize_from_pattern(actions, available_blocks)
        
        return self._synthesize_from_config(actions, math_config, available_blocks)
    
    def _synthesize_from_config(
        self, 
        actions: List[str],
        math_config: Dict,
        available_blocks: set
    ) -> Dict:
        """
        Tạo structure từ math config đã định nghĩa.
        """
        # Tìm repeating pattern
        seq, repeats, seq_len, start = self.find_longest_repeating_sequence(actions)
        
        if not seq or repeats < 2:
            # Fallback to basic
            return {
                "main": self.compress_actions_to_structure(actions, available_blocks),
                "procedures": {}
            }
        
        before_loop = actions[:start]
        loop_body = seq
        after_loop = actions[start + repeats * seq_len:]
        
        # Build math expression
        operator = math_config.get('operator', 'ADD')
        var_a = math_config.get('var_a', 'a')
        var_b = math_config.get('var_b', 'b')
        
        # [FIX M2] Support configurable initial values
        initial_values = math_config.get('initial_values', {})
        init_a = initial_values.get(var_a, 1)
        init_b = initial_values.get(var_b, repeats)
        
        main_program = []
        
        # Before loop
        if before_loop:
            main_program.extend(self.compress_actions_to_structure(before_loop, available_blocks))
        
        # Initialize variables with configurable values
        main_program.append({"type": "variables_set", "variable": var_a, "value": init_a})
        main_program.append({"type": "variables_set", "variable": var_b, "value": init_b})
        
        # [FIX M1] Loop with correct math expression structure
        # Use left/right with nested variables_get objects instead of string var names
        loop_body_compressed = self.compress_actions_to_structure(loop_body, available_blocks)
        
        main_program.append({
            "type": "maze_repeat_expression",
            "expression": {
                "type": "math_arithmetic",
                "op": operator,
                "left": {"type": "variables_get", "variable": var_a},
                "right": {"type": "variables_get", "variable": var_b}
            },
            "body": loop_body_compressed
        })
        
        # After loop
        if after_loop:
            main_program.extend(self.compress_actions_to_structure(after_loop, available_blocks))
        
        return {"main": main_program, "procedures": {}}
    
    def _synthesize_from_pattern(
        self, 
        actions: List[str],
        available_blocks: set
    ) -> Dict:
        """
        Tạo structure từ detected pattern khi không có config.
        """
        seq, repeats, seq_len, start = self.find_longest_repeating_sequence(actions)
        
        if not seq or repeats < 2:
            return {
                "main": self.compress_actions_to_structure(actions, available_blocks),
                "procedures": {}
            }
        
        before_loop = actions[:start]
        loop_body = seq
        after_loop = actions[start + repeats * seq_len:]
        
        main_program = []
        
        if before_loop:
            main_program.extend(self.compress_actions_to_structure(before_loop, available_blocks))
        
        # [FIX M3] Use integer values instead of string literals
        # Create a simple expression: 1 * repeats = repeats iterations
        main_program.append({
            "type": "maze_repeat_expression",
            "expression": {
                "type": "math_arithmetic",
                "op": "MULTIPLY",
                "left": 1,           # Integer, not string "1"
                "right": repeats     # Integer, not string
            },
            "body": self.compress_actions_to_structure(loop_body, available_blocks)
        })
        
        if after_loop:
            main_program.extend(self.compress_actions_to_structure(after_loop, available_blocks))
        
        return {"main": main_program, "procedures": {}}
