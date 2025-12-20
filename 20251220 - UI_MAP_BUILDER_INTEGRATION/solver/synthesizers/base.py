# scripts/synthesizers/base.py
"""
BASE SYNTHESIZER STRATEGY - Abstract base class for all synthesizers

Định nghĩa interface chung cho tất cả các synthesizer strategies.
Cung cấp các utility functions dùng chung.
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Set, Tuple, Optional, Any
from collections import Counter


class SynthesizerStrategy(ABC):
    """Abstract base class cho tất cả các synthesizer strategies."""
    
    @abstractmethod
    def can_handle(self, logic_type: str, world: Any) -> bool:
        """
        Kiểm tra xem synthesizer này có thể xử lý input không.
        
        Args:
            logic_type: Loại logic từ solution_config
            world: GameWorld instance
            
        Returns:
            True nếu synthesizer này có thể xử lý
        """
        pass
    
    @abstractmethod
    def synthesize(self, actions: List[str], world: Any) -> Dict:
        """
        Tổng hợp raw actions thành structured program.
        
        Args:
            actions: List của raw action strings
            world: GameWorld instance
            
        Returns:
            Dict với 'main' và 'procedures' keys
        """
        pass
    
    @property
    def name(self) -> str:
        """Tên của synthesizer để logging."""
        return self.__class__.__name__
    
    # =========================================================================
    # SHARED UTILITY FUNCTIONS
    # =========================================================================
    
    @staticmethod
    def compress_actions_to_structure(actions: List[str], available_blocks: Set[str]) -> List[Dict]:
        """
        Hàm đệ quy nén chuỗi hành động thành cấu trúc có vòng lặp.
        Đây là utility function dùng chung cho tất cả synthesizers.
        """
        if not actions:
            return []
        
        structured_code, i = [], 0
        can_use_repeat = 'maze_repeat' in available_blocks

        while i < len(actions):
            best_seq_len, best_repeats = 0, 0
            
            if can_use_repeat:
                for seq_len in range(1, len(actions) // 2 + 1):
                    if i + 2 * seq_len > len(actions):
                        break
                    repeats = 1
                    while (i + (repeats + 1) * seq_len <= len(actions) and
                           actions[i:i+seq_len] == actions[i+repeats*seq_len:i+(repeats+1)*seq_len]):
                        repeats += 1
                    if repeats > 1 and (repeats * seq_len) > (1 + seq_len) and seq_len >= best_seq_len:
                        best_seq_len, best_repeats = seq_len, repeats
            
            if best_repeats > 0:
                structured_code.append({
                    "type": "maze_repeat",
                    "times": best_repeats,
                    "body": SynthesizerStrategy.compress_actions_to_structure(
                        actions[i:i+best_seq_len], available_blocks
                    )
                })
                i += best_repeats * best_seq_len
            else:
                action_str = actions[i]
                if action_str.startswith("CALL:"):
                    structured_code.append({"type": "CALL", "name": action_str.split(":", 1)[1]})
                elif action_str in ("turnLeft", "turnRight"):
                    structured_code.append({"type": "maze_turn", "direction": action_str})
                else:
                    structured_code.append({"type": f"maze_{action_str}"})
                i += 1
        
        return structured_code
    
    @staticmethod
    def find_most_frequent_sequence(
        actions: List[str], 
        min_len: int = 2, 
        max_len: int = 10, 
        force_function: bool = False
    ) -> Optional[Tuple[List[str], int]]:
        """
        Tìm chuỗi con xuất hiện thường xuyên nhất để đề xuất tạo Hàm.
        """
        sequence_counts = Counter()
        actions_tuple = tuple(actions)
        
        for length in range(min_len, max_len + 1):
            for i in range(len(actions_tuple) - length + 1):
                original_sequence = actions_tuple[i:i+length]
                sequence_counts[original_sequence] += 1

        def find_best_sequence(sequences: Counter) -> Optional[Tuple[List[str], int]]:
            # [FIX] Changed from -1 to -3 to accept patterns with freq=2
            # freq=2 patterns have savings = -2, which is valid for educational PROCEDURE creation
            # Pedagogically, a pattern repeating 2 times is sufficient to teach function reuse
            most_common, max_freq, best_savings = None, 1, -3
            for seq, freq in sequences.items():
                if freq > 1:
                    savings = (freq - 1) * len(seq) - (len(seq) + freq) if not force_function else freq
                    if savings >= best_savings:  # Accept savings >= -3 (includes freq=2 patterns)
                        best_savings, most_common, max_freq = savings, seq, freq
            return (list(most_common), max_freq) if most_common else None

        if force_function:
            jump_sequences = Counter({k: v for k, v in sequence_counts.items() if 'jump' in k})
            best_jump_seq = find_best_sequence(jump_sequences)
            if best_jump_seq:
                return best_jump_seq
        
        return find_best_sequence(sequence_counts)
    
    @staticmethod
    def find_longest_repeating_sequence(actions: List[str]) -> Tuple[Optional[List[str]], int, int, int]:
        """
        Tìm chuỗi lặp lại dài nhất liên tiếp trong actions.
        
        Returns:
            (sequence, repeat_count, sequence_length, start_index)
        """
        best_seq, best_repeats, best_len, best_start = None, 0, 0, 0
        
        for start in range(len(actions)):
            for length in range(1, (len(actions) - start) // 2 + 1):
                pattern = actions[start:start + length]
                count = 1
                pos = start + length
                
                while pos + length <= len(actions):
                    if actions[pos:pos + length] == pattern:
                        count += 1
                        pos += length
                    else:
                        break
                
                if count > 1 and count * length > best_repeats * best_len:
                    best_seq = pattern
                    best_repeats = count
                    best_len = length
                    best_start = start
        
        return best_seq, best_repeats, best_len, best_start
