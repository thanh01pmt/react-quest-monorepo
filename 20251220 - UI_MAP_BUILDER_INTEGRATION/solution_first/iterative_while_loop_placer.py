"""
Iterative While Loop Placer

Places items iteratively for item-based while loops, solving the circular
dependency problem where placement depends on loop execution and vice versa.

Supports condition types:
- isOnGem: Continue while on gem
- isOnSwitch: Continue while on switch
- isOnOpenSwitch: Continue while switch is open

Termination strategies:
- natural: Terminate at path end
- count: Terminate after N iterations
- pattern: Terminate based on item pattern
"""

from typing import List, Dict, Optional, Tuple
import logging

logger = logging.getLogger(__name__)

Coord = Tuple[int, int, int]


class IterativeWhileLoopPlacer:
    """
    Places items iteratively for item-based while loops.
    
    Solves circular dependency by simulating loop execution:
    1. Start at position
    2. Evaluate condition (place item if needed)
    3. Execute pattern actions
    4. Move to next position
    5. Repeat until termination
    """
    
    # Default maximum iterations to prevent infinite loops
    DEFAULT_MAX_ITERATIONS = 100
    
    # Condition type to item type mapping
    CONDITION_ITEM_MAP = {
        'isOnGem': 'crystal',
        'isOnCrystal': 'crystal',
        'isOnSwitch': 'switch',
        'isOnOpenSwitch': 'switch',
        'isOnClosedSwitch': 'switch',
    }
    
    # Condition type to action mapping
    CONDITION_ACTION_MAP = {
        'isOnGem': 'collectGem',
        'isOnCrystal': 'collectGem',
        'isOnSwitch': 'toggleSwitch',
        'isOnOpenSwitch': 'toggleSwitch',
        'isOnClosedSwitch': 'toggleSwitch',
    }
    
    def place_items_for_while_loop(
        self,
        segment_coords: List[Coord],
        condition_type: str,
        pattern: Dict,
        start_idx: int = 0,
        max_iterations: Optional[int] = None,
        termination_strategy: str = 'natural',
        target_count: Optional[int] = None
    ) -> Dict:
        """
        Iteratively simulate while loop and place items.
        
        Args:
            segment_coords: Available coordinates to place items
            condition_type: 'isOnGem', 'isOnSwitch', etc.
            pattern: Action pattern dict with 'actions' list
            start_idx: Starting index in segment_coords
            max_iterations: Safety limit (default: 100)
            termination_strategy: 'natural', 'count', or 'pattern'
            target_count: For 'count' strategy, number of iterations
        
        Returns:
            {
                'items': List of placed items,
                'actions': List of raw actions,
                'iterations': Number of iterations executed,
                'termination_reason': Why loop terminated
            }
        """
        if max_iterations is None:
            max_iterations = self.DEFAULT_MAX_ITERATIONS
        
        items: List[Dict] = []
        actions: List[str] = []
        current_pos_idx = start_idx
        iteration = 0
        termination_reason = 'unknown'
        
        # Get pattern actions
        pattern_actions = pattern.get('actions', ['collect', 'move'])
        
        while iteration < max_iterations:
            # Check if we're still on path
            if current_pos_idx >= len(segment_coords):
                termination_reason = 'path_end'
                break
            
            current_pos = segment_coords[current_pos_idx]
            
            # Evaluate condition based on termination strategy
            should_continue = self._evaluate_condition(
                condition_type=condition_type,
                current_pos=current_pos,
                current_pos_idx=current_pos_idx,
                segment_coords=segment_coords,
                placed_items=items,
                iteration=iteration,
                termination_strategy=termination_strategy,
                target_count=target_count
            )
            
            if not should_continue:
                termination_reason = f'condition_false_{termination_strategy}'
                break
            
            # Execute pattern and place items
            for action in pattern_actions:
                if action in ('collect', 'collectGem'):
                    # Place item at current position
                    item_type = self._get_item_type(condition_type)
                    items.append({
                        'type': item_type,
                        'pos': current_pos,
                        'position': list(current_pos),
                        'iteration': iteration,
                        'pattern_id': f'while_{condition_type}_{iteration}',
                        'while_loop': True
                    })
                    actions.append(self._get_action(condition_type))
                    
                elif action in ('toggle', 'toggleSwitch'):
                    # Place switch at current position
                    items.append({
                        'type': 'switch',
                        'pos': current_pos,
                        'position': list(current_pos),
                        'iteration': iteration,
                        'pattern_id': f'while_switch_{iteration}',
                        'while_loop': True
                    })
                    actions.append('toggleSwitch')
                    
                elif action in ('move', 'moveForward'):
                    actions.append('moveForward')
                    current_pos_idx += 1
                    
                    # Check bounds after move
                    if current_pos_idx >= len(segment_coords):
                        termination_reason = 'path_end_after_move'
                        break
                    
                    current_pos = segment_coords[current_pos_idx]
                    
                elif action == 'turnLeft':
                    actions.append('turnLeft')
                    
                elif action == 'turnRight':
                    actions.append('turnRight')
                    
                elif action == 'jump':
                    actions.append('jump')
                    current_pos_idx += 1
                    
                    if current_pos_idx >= len(segment_coords):
                        termination_reason = 'path_end_after_jump'
                        break
                    
                    current_pos = segment_coords[current_pos_idx]
            
            iteration += 1
        
        if iteration >= max_iterations:
            termination_reason = 'max_iterations'
        
        logger.info(f"While loop placement: {len(items)} items, {iteration} iterations, reason={termination_reason}")
        
        return {
            'items': items,
            'actions': actions,
            'iterations': iteration,
            'termination_reason': termination_reason,
            'condition_type': condition_type,
            'pattern': pattern
        }
    
    def _evaluate_condition(
        self,
        condition_type: str,
        current_pos: Coord,
        current_pos_idx: int,
        segment_coords: List[Coord],
        placed_items: List[Dict],
        iteration: int,
        termination_strategy: str,
        target_count: Optional[int]
    ) -> bool:
        """
        Evaluate if condition should be true at this point.
        
        This is the KEY LOGIC that determines placement strategy.
        """
        if termination_strategy == 'natural':
            # Strategy 1: Continue until end of path (leave last for goal)
            return current_pos_idx < len(segment_coords) - 1
        
        elif termination_strategy == 'count':
            # Strategy 2: Continue for exactly N iterations
            if target_count is None:
                target_count = 5  # Default
            return iteration < target_count
        
        elif termination_strategy == 'pattern':
            # Strategy 3: Based on modulo pattern
            # Place item based on position in pattern
            return self._pattern_condition(current_pos_idx, iteration, placed_items)
        
        elif termination_strategy == 'density':
            # Strategy 4: Based on target density
            # Calculate if we should place more items
            placed_count = len(placed_items)
            remaining = len(segment_coords) - current_pos_idx
            target_density = 0.5  # 50% of remaining path
            return placed_count < remaining * target_density
        
        else:
            # Default: always continue (rely on max_iterations)
            return True
    
    def _pattern_condition(
        self,
        pos_idx: int,
        iteration: int,
        placed_items: List[Dict]
    ) -> bool:
        """
        Evaluate condition based on pattern.
        
        Default: Place every other position (modulo 2)
        """
        # Alternate: place on even positions
        return pos_idx % 2 == 0
    
    def _get_item_type(self, condition_type: str) -> str:
        """Map condition type to item type."""
        return self.CONDITION_ITEM_MAP.get(condition_type, 'crystal')
    
    def _get_action(self, condition_type: str) -> str:
        """Map condition type to action."""
        return self.CONDITION_ACTION_MAP.get(condition_type, 'collectGem')
    
    def generate_while_solution(
        self,
        items: List[Dict],
        actions: List[str],
        condition_type: str
    ) -> Dict:
        """
        Generate structured solution for while loop.
        
        Args:
            items: Placed items from place_items_for_while_loop
            actions: Raw actions from place_items_for_while_loop
            condition_type: The condition type used
        
        Returns:
            Structured solution with while loop construct
        """
        # Calculate loop body from pattern
        # Typical pattern: [collect, move] or [collect, turnRight, move]
        
        # Find repeating pattern in actions
        body = self._extract_loop_body(actions)
        
        return {
            'main': [{
                'type': 'while_condition',
                'condition': condition_type,
                'body': body
            }],
            'rawActions': actions,
            'loop_type': 'while',
            'condition': condition_type,
            'iterations': len(items)
        }
    
    def _extract_loop_body(self, actions: List[str]) -> List[str]:
        """
        Extract the repeating loop body from actions.
        
        Finds the shortest repeating pattern.
        """
        if len(actions) < 2:
            return actions
        
        # Try pattern lengths from 1 to half of actions
        for pattern_len in range(1, len(actions) // 2 + 1):
            pattern = actions[:pattern_len]
            
            # Check if this pattern repeats throughout
            is_repeating = True
            for i in range(pattern_len, len(actions)):
                if actions[i] != pattern[i % pattern_len]:
                    is_repeating = False
                    break
            
            if is_repeating:
                return pattern
        
        # No repeating pattern found, return first segment
        return actions[:min(3, len(actions))]


# Singleton instance
iterative_while_loop_placer = IterativeWhileLoopPlacer()
