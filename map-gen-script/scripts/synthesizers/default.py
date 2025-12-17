# scripts/synthesizers/default.py
"""
DEFAULT SYNTHESIZER - Fallback synthesizer cho các trường hợp không match
"""

from typing import List, Dict, Any
from .base import SynthesizerStrategy


class DefaultSynthesizer(SynthesizerStrategy):
    """
    Default/Fallback synthesizer.
    Xử lý các trường hợp không có synthesizer chuyên biệt.
    Thực hiện basic loop compression.
    """
    
    def can_handle(self, logic_type: str, world: Any) -> bool:
        """
        DefaultSynthesizer luôn có thể xử lý - đây là fallback.
        """
        return True
    
    def synthesize(self, actions: List[str], world: Any) -> Dict:
        """
        Thực hiện basic loop compression.
        """
        available_blocks = world.available_blocks
        logic_type = world.solution_config.get('logic_type', 'sequencing')
        
        # Đặc biệt cho for_loop_logic: tìm và tạo loop structure
        if logic_type in ('for_loop_logic', 'repeat_loop'):
            return self._synthesize_for_loop(actions, available_blocks)
        
        # Default: basic compression
        return {
            "main": self.compress_actions_to_structure(actions, available_blocks),
            "procedures": {}
        }
    
    def _synthesize_for_loop(self, actions: List[str], available_blocks: set) -> Dict:
        """
        Tìm và tạo for loop structure từ repeating pattern.
        """
        # [FIX D1] Check if maze_repeat is available
        if 'maze_repeat' not in available_blocks:
            print("    WARNING: maze_repeat not in available_blocks, returning sequential actions")
            return {
                "main": self.compress_actions_to_structure(actions, available_blocks),
                "procedures": {}
            }
        
        # Tìm repeating pattern
        seq, repeats, seq_len, start = self.find_longest_repeating_sequence(actions)
        
        if seq and repeats >= 2:
            before_loop = actions[:start]
            loop_body = seq
            after_loop = actions[start + repeats * seq_len:]
            
            main_program = []
            
            if before_loop:
                main_program.extend(self.compress_actions_to_structure(before_loop, available_blocks))
            
            main_program.append({
                "type": "maze_repeat",
                "times": repeats,
                "body": self.compress_actions_to_structure(loop_body, available_blocks)
            })
            
            if after_loop:
                main_program.extend(self.compress_actions_to_structure(after_loop, available_blocks))
            
            return {"main": main_program, "procedures": {}}
        
        # No clear pattern, just compress
        return {
            "main": self.compress_actions_to_structure(actions, available_blocks),
            "procedures": {}
        }
