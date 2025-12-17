# src/map_generator/constraints.py
"""
CONSTRAINT-BASED MAP VARIATION

Provides VariationConstraints for defining map generation constraints
and ConstraintValidator for validating maps against constraints.

Usage:
    from constraints import VariationConstraints, ConstraintValidator, DIFFICULTY_PRESETS
    
    # Define custom constraints
    constraints = VariationConstraints(
        min_path_length=5,
        max_path_length=15,
        min_items=2,
        required_features=['jump']
    )
    
    # Use preset
    easy_constraints = DIFFICULTY_PRESETS['easy']
    
    # Validate map
    validator = ConstraintValidator()
    if validator.satisfies(map_data, constraints):
        print("Map is valid!")
"""

from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any, Set
import logging

logger = logging.getLogger(__name__)


# =============================================================================
# VARIATION CONSTRAINTS DATACLASS
# =============================================================================

@dataclass
class VariationConstraints:
    """
    [NEW] Defines constraints for map variation generation.
    
    Maps that don't satisfy these constraints will be rejected
    during constrained generation.
    
    Attributes:
        min_path_length: Minimum number of steps in path
        max_path_length: Maximum number of steps in path
        min_items: Minimum number of collectible items
        max_items: Maximum number of collectible items
        required_features: Features map MUST have (e.g., 'jump', 'switch', 'multi_level')
        forbidden_features: Features map MUST NOT have
        difficulty_level: Optional label for display purposes
        min_turns: Minimum number of direction changes
        max_turns: Maximum number of direction changes
    """
    min_path_length: int = 0
    max_path_length: int = 999
    min_items: int = 0
    max_items: int = 999
    required_features: List[str] = field(default_factory=list)
    forbidden_features: List[str] = field(default_factory=list)
    difficulty_level: Optional[str] = None
    min_turns: int = 0
    max_turns: int = 999
    
    def __post_init__(self):
        """Validate constraint consistency."""
        if self.min_path_length > self.max_path_length:
            raise ValueError(f"min_path_length ({self.min_path_length}) > max_path_length ({self.max_path_length})")
        if self.min_items > self.max_items:
            raise ValueError(f"min_items ({self.min_items}) > max_items ({self.max_items})")
        
        # Check for conflicting features
        overlap = set(self.required_features) & set(self.forbidden_features)
        if overlap:
            raise ValueError(f"Features cannot be both required and forbidden: {overlap}")
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            'min_path_length': self.min_path_length,
            'max_path_length': self.max_path_length,
            'min_items': self.min_items,
            'max_items': self.max_items,
            'required_features': self.required_features,
            'forbidden_features': self.forbidden_features,
            'difficulty_level': self.difficulty_level,
            'min_turns': self.min_turns,
            'max_turns': self.max_turns,
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'VariationConstraints':
        """Create from dictionary."""
        return cls(**{k: v for k, v in data.items() if k in cls.__dataclass_fields__})


# =============================================================================
# DIFFICULTY PRESETS
# =============================================================================

DIFFICULTY_PRESETS: Dict[str, VariationConstraints] = {
    'easy': VariationConstraints(
        min_path_length=3,
        max_path_length=10,
        min_items=1,
        max_items=3,
        max_turns=3,
        forbidden_features=['multi_level', 'switch'],
        difficulty_level='easy',
    ),
    'medium': VariationConstraints(
        min_path_length=8,
        max_path_length=20,
        min_items=2,
        max_items=6,
        min_turns=2,
        max_turns=8,
        difficulty_level='medium',
    ),
    'hard': VariationConstraints(
        min_path_length=15,
        max_path_length=50,
        min_items=4,
        max_items=10,
        min_turns=5,
        required_features=['jump'],
        difficulty_level='hard',
    ),
    'expert': VariationConstraints(
        min_path_length=25,
        max_path_length=100,
        min_items=6,
        max_items=15,
        min_turns=8,
        required_features=['jump', 'switch'],
        difficulty_level='expert',
    ),
}


# =============================================================================
# CONSTRAINT VALIDATOR
# =============================================================================

class ConstraintValidator:
    """
    [NEW] Validates MapData against VariationConstraints.
    """
    
    # Known features that can be detected from MapData
    DETECTABLE_FEATURES = {'jump', 'switch', 'multi_level', 'crystal', 'gem', 'key'}
    
    def satisfies(self, map_data, constraints: VariationConstraints) -> bool:
        """
        Check if map_data satisfies all constraints.
        
        Args:
            map_data: MapData instance to validate
            constraints: VariationConstraints to check against
            
        Returns:
            True if all constraints are satisfied
        """
        violations = self.get_violations(map_data, constraints)
        return len(violations) == 0
    
    def get_violations(self, map_data, constraints: VariationConstraints) -> List[str]:
        """
        Get list of constraint violations.
        
        Args:
            map_data: MapData instance to validate
            constraints: VariationConstraints to check against
            
        Returns:
            List of violation descriptions (empty if all satisfied)
        """
        violations = []
        
        # Check path length
        path_length = len(map_data.path_coords) if map_data.path_coords else 0
        if path_length < constraints.min_path_length:
            violations.append(
                f"path_length ({path_length}) < min_path_length ({constraints.min_path_length})"
            )
        if path_length > constraints.max_path_length:
            violations.append(
                f"path_length ({path_length}) > max_path_length ({constraints.max_path_length})"
            )
        
        # Check item count
        item_count = len(map_data.items) if map_data.items else 0
        if item_count < constraints.min_items:
            violations.append(
                f"item_count ({item_count}) < min_items ({constraints.min_items})"
            )
        if item_count > constraints.max_items:
            violations.append(
                f"item_count ({item_count}) > max_items ({constraints.max_items})"
            )
        
        # Check turns (direction changes)
        turns = self._count_turns(map_data)
        if turns < constraints.min_turns:
            violations.append(
                f"turns ({turns}) < min_turns ({constraints.min_turns})"
            )
        if turns > constraints.max_turns:
            violations.append(
                f"turns ({turns}) > max_turns ({constraints.max_turns})"
            )
        
        # Check required features
        map_features = self._detect_features(map_data)
        for feature in constraints.required_features:
            if feature not in map_features:
                violations.append(f"missing required feature: {feature}")
        
        # Check forbidden features
        for feature in constraints.forbidden_features:
            if feature in map_features:
                violations.append(f"has forbidden feature: {feature}")
        
        return violations
    
    def _count_turns(self, map_data) -> int:
        """Count direction changes in path."""
        if not map_data.path_coords or len(map_data.path_coords) < 3:
            return 0
        
        turns = 0
        for i in range(1, len(map_data.path_coords) - 1):
            prev = map_data.path_coords[i - 1]
            curr = map_data.path_coords[i]
            next_pos = map_data.path_coords[i + 1]
            
            # Get direction vectors
            dx1, dz1 = curr[0] - prev[0], curr[2] - prev[2]
            dx2, dz2 = next_pos[0] - curr[0], next_pos[2] - curr[2]
            
            if (dx1, dz1) != (dx2, dz2):
                turns += 1
        
        return turns
    
    def _detect_features(self, map_data) -> Set[str]:
        """Detect features present in map."""
        features = set()
        
        # Check for switches
        if map_data.items:
            for item in map_data.items:
                item_type = item.get('type', '')
                if item_type == 'switch':
                    features.add('switch')
                elif item_type in ('crystal', 'gem', 'key'):
                    features.add(item_type)
        
        # Check for height changes (jump required)
        if map_data.path_coords and len(map_data.path_coords) >= 2:
            y_values = set(pos[1] for pos in map_data.path_coords)
            if len(y_values) > 1:
                features.add('jump')
                features.add('multi_level')
        
        return features


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def get_constraints_for_difficulty(difficulty: str) -> VariationConstraints:
    """
    Get constraints for a difficulty level.
    
    Args:
        difficulty: 'easy', 'medium', 'hard', or 'expert'
        
    Returns:
        VariationConstraints for that difficulty
        
    Raises:
        ValueError if difficulty not recognized
    """
    if difficulty not in DIFFICULTY_PRESETS:
        available = ', '.join(DIFFICULTY_PRESETS.keys())
        raise ValueError(f"Unknown difficulty '{difficulty}'. Available: {available}")
    
    return DIFFICULTY_PRESETS[difficulty]


def merge_constraints(
    base: VariationConstraints, 
    overrides: Dict[str, Any]
) -> VariationConstraints:
    """
    Merge base constraints with overrides.
    
    Args:
        base: Base VariationConstraints
        overrides: Dict of values to override
        
    Returns:
        New VariationConstraints with merged values
    """
    base_dict = base.to_dict()
    
    for key, value in overrides.items():
        if key in base_dict:
            if key in ('required_features', 'forbidden_features'):
                # Merge lists
                base_dict[key] = list(set(base_dict[key]) | set(value))
            else:
                base_dict[key] = value
    
    return VariationConstraints.from_dict(base_dict)


# Convenience exports
__all__ = [
    'VariationConstraints',
    'ConstraintValidator', 
    'DIFFICULTY_PRESETS',
    'get_constraints_for_difficulty',
    'merge_constraints',
]
