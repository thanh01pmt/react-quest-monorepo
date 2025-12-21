"""
Variable-Aware Placer

Places items based on variable state, supporting:
- Counter variables (i % N)
- Accumulator variables (count < target)
- State variables (state machine patterns)

This enables complex patterns like:
- Alternating crystal/switch (even/odd)
- Periodic patterns (every Nth position)
- Threshold-based patterns (first N items, then different)
- Progressive patterns (increasing/decreasing)
"""

from typing import List, Dict, Optional, Tuple, Any
from dataclasses import dataclass, field
from enum import Enum
import logging

logger = logging.getLogger(__name__)

Coord = Tuple[int, int, int]


class VariableType(Enum):
    """Types of variables supported."""
    COUNTER = "counter"
    ACCUMULATOR = "accumulator"
    STATE = "state"


@dataclass
class VariableContext:
    """
    Context for tracking variables during placement.
    
    Supports counter, accumulator, and state variables.
    """
    type: VariableType
    value: int = 0
    target: Optional[int] = None
    step: int = 1
    state: str = "initial"
    states: List[str] = field(default_factory=list)
    
    @classmethod
    def create_counter(cls, start: int = 0, step: int = 1) -> 'VariableContext':
        """Create a counter variable."""
        return cls(type=VariableType.COUNTER, value=start, step=step)
    
    @classmethod
    def create_accumulator(cls, initial: int = 0, target: int = 10) -> 'VariableContext':
        """Create an accumulator variable."""
        return cls(type=VariableType.ACCUMULATOR, value=initial, target=target)
    
    @classmethod
    def create_state(cls, initial_state: str = "initial", states: List[str] = None) -> 'VariableContext':
        """Create a state machine variable."""
        return cls(
            type=VariableType.STATE, 
            state=initial_state,
            states=states or ["initial", "active", "done"]
        )
    
    def increment(self, amount: int = None) -> None:
        """Increment value by step or custom amount."""
        self.value += amount if amount is not None else self.step
    
    def set_state(self, new_state: str) -> None:
        """Set state (for state machine)."""
        self.state = new_state
    
    def is_complete(self) -> bool:
        """Check if variable indicates completion."""
        if self.type == VariableType.ACCUMULATOR and self.target is not None:
            return self.value >= self.target
        if self.type == VariableType.STATE:
            return self.state == "done"
        return False


class VariableAwarePlacer:
    """
    Places items based on variable state.
    
    Supports modulo, threshold, and state-based pattern selection.
    """
    
    def __init__(self):
        self.default_patterns = {
            'crystal': {'type': 'crystal', 'actions': ['collect']},
            'switch': {'type': 'switch', 'actions': ['toggle']},
            'none': {'type': 'none', 'actions': []}
        }
    
    def place_items_with_variable(
        self,
        segment_coords: List[Coord],
        variable_config: Dict,
        pattern_rules: Dict,
        start_idx: int = 0,
        max_iterations: int = 100
    ) -> Dict:
        """
        Place items based on variable state.
        
        Args:
            segment_coords: List of coordinates to place items
            variable_config: Configuration for variable
                {
                    'type': 'counter' | 'accumulator' | 'state',
                    'start': 0,
                    'step': 1,
                    'target': None  # for accumulator
                }
            pattern_rules: Rules for pattern selection
                {
                    'rule': 'modulo' | 'threshold' | 'alternating',
                    'modulo': 2,  # for modulo rule
                    'patterns': {0: 'crystal', 1: 'switch'}
                }
            start_idx: Starting index in segment_coords
            max_iterations: Safety limit
        
        Returns:
            {
                'items': List of placed items,
                'actions': List of actions,
                'final_variable': Variable state at end
            }
        """
        # Initialize variable
        variable = self._create_variable(variable_config)
        
        items: List[Dict] = []
        actions: List[str] = []
        current_idx = start_idx
        iteration = 0
        
        while iteration < max_iterations and current_idx < len(segment_coords):
            current_pos = segment_coords[current_idx]
            
            # Check termination
            if variable.is_complete():
                break
            
            # Select pattern based on variable state
            pattern = self._select_pattern(variable, pattern_rules, iteration)
            
            # Place item if pattern is not 'none'
            if pattern['type'] != 'none':
                items.append({
                    'type': pattern['type'],
                    'pos': current_pos,
                    'position': list(current_pos),
                    'iteration': iteration,
                    'variable_value': variable.value,
                    'variable_state': variable.state if variable.type == VariableType.STATE else None,
                    'pattern_id': f'var_{variable.type.value}_{iteration}'
                })
                
                # Add action
                if pattern['type'] == 'crystal':
                    actions.append('collectGem')
                elif pattern['type'] == 'switch':
                    actions.append('toggleSwitch')
            
            # Add move action
            actions.append('moveForward')
            
            # Update variable
            self._update_variable(variable, pattern, pattern_rules)
            
            current_idx += 1
            iteration += 1
        
        return {
            'items': items,
            'actions': actions,
            'iterations': iteration,
            'final_variable': {
                'type': variable.type.value,
                'value': variable.value,
                'state': variable.state
            }
        }
    
    def place_alternating_pattern(
        self,
        segment_coords: List[Coord],
        item_types: List[str] = None,
        start_idx: int = 0
    ) -> Dict:
        """
        Convenience method for alternating pattern (even/odd).
        
        Args:
            segment_coords: List of coordinates
            item_types: List of types to alternate (default: ['crystal', 'switch'])
            start_idx: Starting index
        
        Returns:
            Placement result dict
        """
        if item_types is None:
            item_types = ['crystal', 'switch']
        
        variable_config = {
            'type': 'counter',
            'start': 0,
            'step': 1
        }
        
        pattern_rules = {
            'rule': 'modulo',
            'modulo': len(item_types),
            'patterns': {i: item_types[i] for i in range(len(item_types))}
        }
        
        return self.place_items_with_variable(
            segment_coords=segment_coords,
            variable_config=variable_config,
            pattern_rules=pattern_rules,
            start_idx=start_idx
        )
    
    def place_threshold_pattern(
        self,
        segment_coords: List[Coord],
        threshold: int,
        before_type: str = 'crystal',
        after_type: str = 'switch',
        start_idx: int = 0
    ) -> Dict:
        """
        Convenience method for threshold-based pattern.
        
        Place before_type until threshold, then after_type.
        
        Args:
            segment_coords: List of coordinates
            threshold: Number of items before switch
            before_type: Item type before threshold
            after_type: Item type after threshold
            start_idx: Starting index
        
        Returns:
            Placement result dict
        """
        variable_config = {
            'type': 'accumulator',
            'start': 0,
            'target': len(segment_coords)  # Continue until end
        }
        
        pattern_rules = {
            'rule': 'threshold',
            'threshold': threshold,
            'patterns': {
                'before': before_type,
                'after': after_type
            }
        }
        
        return self.place_items_with_variable(
            segment_coords=segment_coords,
            variable_config=variable_config,
            pattern_rules=pattern_rules,
            start_idx=start_idx
        )
    
    def place_periodic_pattern(
        self,
        segment_coords: List[Coord],
        period: int,
        patterns: Dict[int, str],
        start_idx: int = 0
    ) -> Dict:
        """
        Convenience method for periodic pattern (every Nth position).
        
        Args:
            segment_coords: List of coordinates
            period: Period of pattern (N)
            patterns: Dict mapping position in period to item type
                {0: 'crystal', 1: 'switch', 2: 'none'}
            start_idx: Starting index
        
        Returns:
            Placement result dict
        """
        variable_config = {
            'type': 'counter',
            'start': 0,
            'step': 1
        }
        
        pattern_rules = {
            'rule': 'modulo',
            'modulo': period,
            'patterns': patterns
        }
        
        return self.place_items_with_variable(
            segment_coords=segment_coords,
            variable_config=variable_config,
            pattern_rules=pattern_rules,
            start_idx=start_idx
        )
    
    def place_progressive_pattern(
        self,
        segment_coords: List[Coord],
        item_type: str = 'crystal',
        spacing_start: int = 1,
        spacing_increment: int = 1,
        direction: str = 'increase'
    ) -> Dict:
        """
        Place items with progressive spacing (1, 2, 3, ... or 5, 4, 3, ...).
        
        Args:
            segment_coords: List of coordinates
            item_type: Type of item to place
            spacing_start: Initial spacing
            spacing_increment: How much to change spacing
            direction: 'increase' or 'decrease'
        
        Returns:
            Placement result dict
        """
        items: List[Dict] = []
        actions: List[str] = []
        
        current_spacing = spacing_start
        next_item_at = 0
        idx = 0
        item_count = 0
        
        while idx < len(segment_coords):
            current_pos = segment_coords[idx]
            
            if idx == next_item_at:
                items.append({
                    'type': item_type,
                    'pos': current_pos,
                    'position': list(current_pos),
                    'spacing': current_spacing,
                    'iteration': item_count,
                    'pattern_id': f'progressive_{item_count}'
                })
                
                actions.append('collectGem' if item_type == 'crystal' else 'toggleSwitch')
                
                # Calculate next item position
                next_item_at = idx + current_spacing + 1
                
                # Update spacing
                if direction == 'increase':
                    current_spacing += spacing_increment
                else:
                    current_spacing = max(1, current_spacing - spacing_increment)
                
                item_count += 1
            
            actions.append('moveForward')
            idx += 1
        
        return {
            'items': items,
            'actions': actions,
            'pattern_type': 'progressive',
            'direction': direction
        }
    
    # =============================================================================
    # Private Methods
    # =============================================================================
    
    def _create_variable(self, config: Dict) -> VariableContext:
        """Create variable from config."""
        var_type = config.get('type', 'counter')
        
        if var_type == 'counter':
            return VariableContext.create_counter(
                start=config.get('start', 0),
                step=config.get('step', 1)
            )
        elif var_type == 'accumulator':
            return VariableContext.create_accumulator(
                initial=config.get('start', 0),
                target=config.get('target', 100)
            )
        elif var_type == 'state':
            return VariableContext.create_state(
                initial_state=config.get('initial_state', 'initial'),
                states=config.get('states', ['initial', 'active', 'done'])
            )
        else:
            return VariableContext.create_counter()
    
    def _select_pattern(
        self, 
        variable: VariableContext, 
        rules: Dict,
        iteration: int
    ) -> Dict:
        """Select pattern based on variable state and rules."""
        rule_type = rules.get('rule', 'modulo')
        
        if rule_type == 'modulo':
            modulo = rules.get('modulo', 2)
            patterns = rules.get('patterns', {0: 'crystal', 1: 'switch'})
            
            position = variable.value % modulo
            item_type = patterns.get(position, 'none')
            
            return self.default_patterns.get(item_type, {'type': item_type, 'actions': []})
        
        elif rule_type == 'threshold':
            threshold = rules.get('threshold', 5)
            patterns = rules.get('patterns', {'before': 'crystal', 'after': 'switch'})
            
            if variable.value < threshold:
                item_type = patterns.get('before', 'crystal')
            else:
                item_type = patterns.get('after', 'switch')
            
            return self.default_patterns.get(item_type, {'type': item_type, 'actions': []})
        
        elif rule_type == 'alternating':
            # Simple alternating
            if iteration % 2 == 0:
                return self.default_patterns['crystal']
            else:
                return self.default_patterns['switch']
        
        else:
            return self.default_patterns['crystal']
    
    def _update_variable(
        self, 
        variable: VariableContext, 
        pattern: Dict,
        rules: Dict
    ) -> None:
        """Update variable after action."""
        if variable.type == VariableType.COUNTER:
            variable.increment()
        
        elif variable.type == VariableType.ACCUMULATOR:
            # Only increment on collect/toggle
            if pattern['type'] in ['crystal', 'switch']:
                variable.increment(1)
        
        elif variable.type == VariableType.STATE:
            # State transitions based on rules
            transitions = rules.get('transitions', {})
            current = variable.state
            if current in transitions:
                next_state = transitions[current]
                variable.set_state(next_state)


# Singleton instance
variable_aware_placer = VariableAwarePlacer()
