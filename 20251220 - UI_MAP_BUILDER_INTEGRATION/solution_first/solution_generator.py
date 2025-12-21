"""
Solution Generator Module

Extracted from SolutionFirstPlacer - handles generation of expected solutions
from path and item placements.

Provides:
- Raw action generation from path traversal
- Structured solution conversion (while loop, for loop, procedure)
- Pattern compression and procedure extraction
"""

from typing import List, Dict, Optional, Tuple
import logging

logger = logging.getLogger(__name__)


class SolutionGenerator:
    """
    Generates expected solutions directly from path and item placements.
    
    This solution can be used to:
    1. Compare with A* solver output for validation
    2. Skip solver entirely when SKIP_SOLVER=True
    """
    
    def generate_expected_solution(
        self, 
        path_info, 
        items: List[Dict],
        logic_type: str
    ) -> Dict:
        """
        Generate expected solution directly from path and item placements.
        
        Returns:
            dict with rawActions, structuredSolution, procedureBlocks
        """
        path_coords = path_info.path_coords
        
        # Build item positions set for quick lookup
        item_positions = {}
        for item in items:
            pos = item.get('pos') or item.get('position')
            if isinstance(pos, (list, tuple)):
                pos = tuple(pos[:3]) if len(pos) >= 3 else tuple(pos)
            item_positions[pos] = item.get('type', 'crystal')
        
        # Generate raw actions from path traversal
        raw_actions = self._generate_raw_actions(path_coords, item_positions)
        
        # Generate structured solution based on logic type
        if logic_type == 'for_loop_logic':
            structured = self.actions_to_loop(raw_actions)
        elif logic_type == 'while_loop_logic':
            structured = self.actions_to_while_loop(raw_actions)
        else:
            structured = self.actions_to_procedure(raw_actions, items)
        
        return {
            'rawActions': raw_actions,
            'structuredSolution': structured,
            'source': 'solution_first_expected',
            'logic_type_used': logic_type
        }
    
    def _generate_raw_actions(
        self, 
        path_coords: List, 
        item_positions: Dict
    ) -> List[str]:
        """
        Generate raw action list from path traversal.
        """
        # Direction constants: 0=north(-z), 1=east(+x), 2=south(+z), 3=west(-x)
        DIRECTIONS = {
            (0, 0, -1): 0,   # north
            (1, 0, 0): 1,    # east
            (0, 0, 1): 2,    # south
            (-1, 0, 0): 3,   # west
        }
        
        raw_actions = []
        current_dir = 2  # Start facing south (default)
        
        # Check item at start position
        if tuple(path_coords[0]) in item_positions:
            item_type = item_positions[tuple(path_coords[0])]
            if item_type in ['crystal', 'gem']:
                raw_actions.append('collect')
            elif item_type == 'switch':
                raw_actions.append('toggleSwitch')
        
        # Walk through path and generate actions
        for i in range(len(path_coords) - 1):
            current = path_coords[i]
            next_pos = path_coords[i + 1]
            
            # Calculate required direction (ignore Y for direction)
            dx = next_pos[0] - current[0]
            dy = next_pos[1] - current[1]
            dz = next_pos[2] - current[2]
            
            # Use sign of dx/dz to handle larger steps
            step_dx = 0 if dx == 0 else int(dx / abs(dx))
            step_dz = 0 if dz == 0 else int(dz / abs(dz))
            
            required_dir = DIRECTIONS.get((step_dx, 0, step_dz), current_dir)
            
            # Turn if needed
            if (step_dx != 0 or step_dz != 0):
                turn_diff = (required_dir - current_dir) % 4
                if turn_diff == 1:
                    raw_actions.append('turnRight')
                elif turn_diff == 3:
                    raw_actions.append('turnLeft')
                elif turn_diff == 2:
                    raw_actions.append('turnRight')
                    raw_actions.append('turnRight')
                current_dir = required_dir
            
            # Move logic (handles jump)
            if dy > 0:
                raw_actions.append('jump')
            else:
                raw_actions.append('moveForward')
            
            # Check if next position has item
            if tuple(next_pos) in item_positions:
                item_type = item_positions[tuple(next_pos)]
                if item_type in ['crystal', 'gem']:
                    raw_actions.append('collect')
                elif item_type == 'switch':
                    raw_actions.append('toggleSwitch')
        
        return raw_actions

    def actions_to_while_loop(self, raw_actions: List[str]) -> Dict:
        """
        Convert actions to while loop structure (repeat until goal).
        """
        # Reuse loop detection logic
        loop_struct = self.actions_to_loop(raw_actions)
        body = loop_struct.get('main', [])
        
        # If we found a loop that covers most actions, convert it to while
        if len(body) == 1 and isinstance(body[0], dict) and body[0].get('type') == 'maze_repeat':
            repeating_body = body[0].get('body', [])
            return {
                'main': [{
                    'type': 'maze_forever',
                    'body': repeating_body
                }]
            }
        
        # Fallback to normal loop structure
        return loop_struct

    def actions_to_loop(self, raw_actions: List[str]) -> Dict:
        """
        Convert raw actions to structured solution with maze_repeat (Loop).
        Uses simple recursive pattern compression.
        """
        structured = []
        i = 0
        n = len(raw_actions)
        
        while i < n:
            best_len = 0
            best_repeats = 0
            
            # Try to find repetition
            max_p_len = (n - i) // 2
            
            for pat_len in range(1, max_p_len + 1):
                pattern = raw_actions[i : i + pat_len]
                repeats = 1
                while (i + (repeats + 1) * pat_len <= n and 
                       raw_actions[i + repeats * pat_len : i + (repeats + 1) * pat_len] == pattern):
                    repeats += 1
                
                if repeats > 1:
                    current_covered = repeats * pat_len
                    best_covered = best_repeats * best_len
                    
                    if current_covered > best_covered:
                        best_len = pat_len
                        best_repeats = repeats
                    elif current_covered == best_covered:
                        if pat_len < best_len:
                            best_len = pat_len
                            best_repeats = repeats
            
            if best_repeats > 1:
                body_raw = raw_actions[i : i + best_len]
                body_struct = self.actions_to_loop(body_raw)['main']
                
                structured.append({
                    'type': 'maze_repeat',
                    'times': best_repeats,
                    'body': body_struct
                })
                i += best_repeats * best_len
            else:
                structured.append(raw_actions[i])
                i += 1
                
        return {'main': structured}
    
    def actions_to_procedure(
        self, 
        raw_actions: List[str], 
        items: List[Dict]
    ) -> Dict:
        """
        Convert raw actions to structured solution with PROCEDURE.
        
        Uses SAME algorithm as FunctionSynthesizer for accurate comparison:
        1. Find most frequent subsequences
        2. Extract up to 3 procedures iteratively
        3. Replace occurrences with CALL
        """
        from collections import Counter
        
        procedures = {}
        remaining_actions = list(raw_actions)
        
        MIN_LEN = 2
        MAX_LEN = 10
        MAX_PROCEDURES = 3
        MIN_FREQ = 2
        
        for proc_idx in range(MAX_PROCEDURES):
            result = self._find_most_frequent_sequence(
                remaining_actions, 
                min_len=MIN_LEN, 
                max_len=MAX_LEN
            )
            
            if not result:
                break
            
            sequence, freq = result
            
            if freq < MIN_FREQ or len(sequence) < MIN_LEN:
                break
            
            proc_name = f"PROCEDURE_{proc_idx + 1}"
            procedures[proc_name] = sequence
            
            # Replace occurrences with CALL
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
        
        main_block = self._compress_to_structure(remaining_actions)
        
        return {
            'main': main_block,
            'procedures': procedures
        }
    
    def _find_most_frequent_sequence(
        self,
        actions: List[str],
        min_len: int = 2,
        max_len: int = 10
    ) -> Optional[Tuple[List[str], int]]:
        """
        Find most frequent subsequence in actions.
        """
        from collections import Counter
        
        sequence_counts = Counter()
        actions_tuple = tuple(actions)
        
        for length in range(min_len, min(max_len + 1, len(actions_tuple) + 1)):
            for i in range(len(actions_tuple) - length + 1):
                seq = actions_tuple[i:i+length]
                if not any('CALL' in str(a) for a in seq):
                    sequence_counts[seq] += 1
        
        best_seq = None
        best_freq = 1
        best_savings = -1
        
        for seq, freq in sequence_counts.items():
            if freq > 1:
                savings = (freq - 1) * len(seq) - (len(seq) + freq)
                if savings >= best_savings:
                    best_savings = savings
                    best_seq = seq
                    best_freq = freq
        
        if best_seq:
            return (list(best_seq), best_freq)
        return None
    
    def _compress_to_structure(self, actions: List) -> List:
        """
        Compress action list, handling CALL strings.
        """
        result = []
        for action in actions:
            if isinstance(action, str) and action.startswith('CALL:'):
                proc_name = action.split(':')[1]
                result.append({'type': 'CALL', 'name': proc_name})
            else:
                result.append(action)
        return result
