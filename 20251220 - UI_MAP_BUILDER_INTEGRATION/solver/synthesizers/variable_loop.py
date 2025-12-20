# scripts/synthesizers/variable_loop.py
"""
VARIABLE LOOP SYNTHESIZER - Xử lý loops sử dụng biến đếm
"""

from typing import List, Dict, Any
from .base import SynthesizerStrategy


class VariableLoopSynthesizer(SynthesizerStrategy):
    """
    Synthesizer cho các map yêu cầu variable-based loops.
    Sử dụng maze_repeat_variable với biến đếm.
    """
    
    HANDLED_LOGIC_TYPES = {
        'variable_loop',
        'variable_counter',
        'counter_loop',
    }
    
    def can_handle(self, logic_type: str, world: Any) -> bool:
        """
        Xử lý khi logic_type yêu cầu variable-based loop.
        """
        return logic_type in self.HANDLED_LOGIC_TYPES
    
    def synthesize(self, actions: List[str], world: Any) -> Dict:
        """
        Tạo variable loop structure.
        """
        available_blocks = world.available_blocks
        loop_structure = world.solution_config.get('loop_structure', 'auto')
        
        # Tìm repeating pattern
        seq, repeats, seq_len, start = self.find_longest_repeating_sequence(actions)
        
        if not seq or repeats < 2:
            # Không có pattern lặp, fallback to basic
            return {
                "main": self.compress_actions_to_structure(actions, available_blocks),
                "procedures": {}
            }
        
        # Tách actions thành 3 phần: before_loop, loop_body, after_loop
        before_loop = actions[:start]
        loop_body = seq
        after_loop = actions[start + repeats * seq_len:]
        
        # Xác định tên biến đếm
        counter_var = world.solution_config.get('counter_variable', 'counter')
        
        # Build main program với variable loop
        main_program = []
        
        # Before loop actions
        if before_loop:
            main_program.extend(self.compress_actions_to_structure(before_loop, available_blocks))
        
        # Initialize counter
        main_program.append({
            "type": "variables_set",
            "variable": counter_var,
            "value": 0
        })
        
        # Variable loop
        loop_body_compressed = self.compress_actions_to_structure(loop_body, available_blocks)
        
        if loop_structure == 'nested' and len(loop_body) > 2:
            # Thử tìm nested pattern trong loop body
            inner_seq, inner_repeats, _, _ = self.find_longest_repeating_sequence(loop_body)
            if inner_seq and inner_repeats >= 2:
                inner_body = self.compress_actions_to_structure(inner_seq, available_blocks)
                loop_body_compressed = [
                    {"type": "maze_repeat", "times": inner_repeats, "body": inner_body}
                ]
        
        # [FIX V1] Check if variables_change is available before adding
        loop_body_with_increment = list(loop_body_compressed)
        if 'variables_change' in available_blocks:
            loop_body_with_increment.append({
                "type": "variables_change",
                "variable": counter_var,
                "change": 1
            })
        else:
            # Log warning về missing block
            print(f"    WARNING: variables_change not in available_blocks, skipping counter increment")
        
        # [FIX V3] Check if maze_repeat_variable is available
        if 'maze_repeat_variable' in available_blocks:
            main_program.append({
                "type": "maze_repeat_variable",
                "variable": counter_var,
                "times": repeats,
                "body": loop_body_with_increment
            })
        else:
            # Fallback to regular maze_repeat if variable loop not available
            print(f"    WARNING: maze_repeat_variable not available, using maze_repeat")
            main_program.append({
                "type": "maze_repeat",
                "times": repeats,
                "body": loop_body_compressed  # Without counter increment
            })
        
        # After loop actions
        if after_loop:
            main_program.extend(self.compress_actions_to_structure(after_loop, available_blocks))
        
        return {"main": main_program, "procedures": {}}
