"""
Fallback Handler Module

Extracted from SolutionFirstPlacer - handles fallback placement strategies
when segment-based pattern matching is not available.

Provides:
- Fallback placement with guaranteed pattern repetition
- Repeating pattern placement with skip logic
- Pattern with intentional noise/break
- Simple placement for short paths
"""

from typing import List, Dict, Tuple
import logging
import math

logger = logging.getLogger(__name__)

Coord = Tuple[int, int, int]


class FallbackHandler:
    """
    Handles fallback placement strategies for paths without segment analysis
    or when pattern matching fails.
    """
    
    def fallback_placement(
        self, 
        path_info, 
        params: dict,
        build_layout_fn
    ) -> dict:
        """
        Fallback placement with GUARANTEED pattern repetition.
        
        Strategy (for function_logic):
        - Plan a repeating pattern FIRST (e.g., [move, collect, move, toggle])
        - Calculate item positions to create >= 3 repetitions
        - If path too short for 3 reps, use 2 reps with a "break" in middle
        
        This ensures the Synthesizer will detect a PROCEDURE.
        """
        coords = path_info.placement_coords or path_info.path_coords
        start = path_info.start_pos
        goal = path_info.target_pos
        logic_type = params.get('logic_type', 'function_logic')
        force_function = params.get('force_function', False)
        
        # Filter valid positions (exclude start/goal)
        valid_coords = [c for c in coords if c != start and c != goal]
        
        if len(valid_coords) < 4:
            items = self._simple_placement(valid_coords)
            return build_layout_fn(path_info, items, logic_type)
        
        PATTERN_STEP = 2  # Item every 2 positions
        
        # Scale repetitions to meet density requirement (15%)
        target_density = 0.15
        num_blocks = len(coords)
        target_items = max(3, math.ceil(num_blocks * target_density))
        
        available_slots = len(valid_coords) // PATTERN_STEP
        
        needed_reps_for_density = target_items
        max_possible_reps = available_slots
        
        num_reps = max_possible_reps
        prevent_skip = False
        
        # Scenario 1: Abundance of slots - allow skip
        if max_possible_reps >= needed_reps_for_density + 1:
            num_reps = needed_reps_for_density + 1
        # Scenario 2: Exactly enough slots - prevent skip
        elif max_possible_reps >= needed_reps_for_density:
            num_reps = needed_reps_for_density
            prevent_skip = True
            logger.debug(f"Disabling skip to strictly meet density ({num_reps} items)")
        # Scenario 3: Not enough slots - prevent skip
        else:
            num_reps = max_possible_reps
            prevent_skip = True
        
        if num_reps >= 3:
            items = self._place_repeating_pattern(
                valid_coords, 
                num_reps, 
                PATTERN_STEP, 
                force_function=force_function,
                prevent_skip=prevent_skip
            )
        elif available_slots >= 2:
            items = self._place_pattern_with_break(valid_coords, PATTERN_STEP)
        else:
            items = self._simple_placement(valid_coords)
        
        return build_layout_fn(path_info, items, logic_type)
    
    def _place_repeating_pattern(
        self, 
        coords: List[Coord], 
        min_reps: int,
        step: int,
        force_function: bool = False,
        prevent_skip: bool = False
    ) -> List[Dict]:
        """
        Place items to create exact repeating pattern.
        
        Implements "intentionally skip middle repeat" logic:
        - If force_function=True: Place all repeats (pure loop)
        - If force_function=False AND >= 4 reps: Skip middle repeat (break pure loop)
        
        Pattern: [move, collect/toggle] × min_reps
        Alternates between crystal and switch for diversity.
        """
        items = []
        used = set()
        
        # Determine which repeat to skip (if any)
        skip_repeat = None
        if not force_function and not prevent_skip and min_reps >= 4:
            skip_repeat = min_reps // 2
            logger.debug(f"Intentionally skipping repeat #{skip_repeat} to avoid pure loop")
        
        for rep in range(min_reps):
            if rep == skip_repeat:
                continue
            
            idx = (rep + 1) * step - 1
            if idx < len(coords):
                pos = coords[idx]
                pos_tuple = tuple(pos)
                
                if pos_tuple not in used:
                    item_type = 'switch' if rep == 1 else 'crystal'
                    items.append({
                        'type': item_type,
                        'pos': pos,
                        'position': list(pos),
                        'pattern_id': f'repeat_{rep}',
                        'skipped_repeat': skip_repeat
                    })
                    used.add(pos_tuple)
        
        return items
    
    def _place_pattern_with_break(
        self, 
        coords: List[Coord],
        step: int
    ) -> List[Dict]:
        """
        Place items with intentional NOISE in middle.
        
        Pattern: [move, collect] + [NOISE: switch at odd position] + [move, collect]
        Synthesizer will have difficulty detecting reuse due to noise.
        """
        items = []
        
        # Part 1: First collect pattern
        if step - 1 < len(coords):
            items.append({
                'type': 'crystal',
                'pos': coords[step - 1],
                'position': list(coords[step - 1]),
                'pattern_id': 'before_noise'
            })
        
        # NOISE: Add switch at irregular position
        noise_idx = len(coords) // 2 + 1
        
        if noise_idx < len(coords) and noise_idx != step - 1:
            items.append({
                'type': 'switch',
                'pos': coords[noise_idx],
                'position': list(coords[noise_idx]),
                'pattern_id': 'noise_block'
            })
            logger.debug(f"Inserted noise block at index {noise_idx}")
        
        # Part 2: Second collect pattern
        last_idx = len(coords) - 1
        if last_idx != noise_idx and last_idx != step - 1 and last_idx > noise_idx:
            items.append({
                'type': 'crystal',
                'pos': coords[last_idx],
                'position': list(coords[last_idx]),
                'pattern_id': 'after_noise'
            })
        
        return items
    
    def _simple_placement(self, coords: List[Coord]) -> List[Dict]:
        """Simple fallback for very short paths."""
        items = []
        for i, coord in enumerate(coords):
            if i % 2 == 0 and i < 4:
                items.append({
                    'type': 'crystal' if i == 0 else 'switch',
                    'pos': coord,
                    'position': list(coord),
                    'pattern_id': 'simple'
                })
        return items
