# scripts/synthesizers/function.py
"""
FUNCTION SYNTHESIZER - Tạo PROCEDURE từ repeating sequences
"""

from typing import List, Dict, Any
from .base import SynthesizerStrategy


class FunctionSynthesizer(SynthesizerStrategy):
    """
    Synthesizer cho các map yêu cầu tạo procedures (functions).
    Phát hiện các chuỗi lặp lại và extract thành PROCEDURE blocks.
    """
    
    HANDLED_LOGIC_TYPES = {
        'function_logic',
        'procedure_logic',
        'function_call',
    }
    
    def can_handle(self, logic_type: str, world: Any) -> bool:
        """
        Xử lý khi:
        - logic_type yêu cầu function
        - force_function = True
        - PROCEDURE có trong available_blocks
        """
        if logic_type in self.HANDLED_LOGIC_TYPES:
            return True
        
        # Check force_function flag
        if world.solution_config.get('force_function', False):
            return True
        
        return False
    
    def synthesize(self, actions: List[str], world: Any) -> Dict:
        """
        Tạo program với procedures extracted.
        """
        available_blocks = world.available_blocks
        force_function = world.solution_config.get('force_function', False)
        
        # Check if procedures are available
        if 'PROCEDURE' not in available_blocks:
            # Cannot create procedures, fallback
            return {
                "main": self.compress_actions_to_structure(actions, available_blocks),
                "procedures": {}
            }
        
        procedures = {}
        remaining_actions = list(actions)
        
        # Thử tạo tối đa 3 hàm
        for i in range(3):
            # [FIX A] Reduced min_len from 3 to 2 to allow shorter patterns
            result = self.find_most_frequent_sequence(
                remaining_actions, 
                min_len=2,  # Reduced from 3 to capture shorter repeating patterns
                max_len=10, 
                force_function=force_function
            )
            
            if not result:
                break
            
            sequence, freq = result
            
            # [FIX B] Reduced frequency threshold from 3 to 2
            # Allow freq=1 if force_function is enabled
            MIN_FREQ_DEFAULT = 2  # Reduced from 3
            MIN_FREQ_FORCED = 1   # Allow single occurrence if forced
            
            min_freq = MIN_FREQ_FORCED if force_function else MIN_FREQ_DEFAULT
            if freq < min_freq:
                # Not enough occurrences to justify a procedure
                break
            
            # [FIX F2] Validate sequence length
            if len(sequence) < 2:
                # Sequence too short for a meaningful procedure
                break
            
            # Tạo tên hàm
            proc_name = f"PROCEDURE_{i+1}"
            
            # Compress sequence thành procedure body
            procedures[proc_name] = self.compress_actions_to_structure(sequence, available_blocks)
            
            # Replace occurrences với CALL
            new_actions = []
            j = 0
            seq_tuple = tuple(sequence)
            
            while j < len(remaining_actions):
                if tuple(remaining_actions[j:j+len(seq_tuple)]) == seq_tuple:
                    new_actions.append(f"CALL:{proc_name}")
                    j += len(seq_tuple)
                else:
                    new_actions.append(remaining_actions[j])
                    j += 1
            
            remaining_actions = new_actions
        
        return {
            "main": self.compress_actions_to_structure(remaining_actions, available_blocks),
            "procedures": procedures
        }
