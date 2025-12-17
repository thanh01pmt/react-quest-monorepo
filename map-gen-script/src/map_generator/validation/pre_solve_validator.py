# src/map_generator/validation/pre_solve_validator.py
"""
PRE-SOLVE VALIDATOR

Provides fast validation to check if a map is likely solvable
BEFORE running expensive A* algorithm.

Components:
- PathConnectivityChecker: BFS-based path connectivity
- quick_solvability_check: Fast <100ms validation
- is_toolbox_compatible: Block availability check
- PreSolveValidator: Unified validator class
"""

from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional, Set, Tuple
from collections import deque
import logging
import time

logger = logging.getLogger(__name__)


# =============================================================================
# VALIDATION RESULT
# =============================================================================

@dataclass
class ValidationResult:
    """Result of pre-solve validation."""
    is_valid: bool
    reason: Optional[str] = None
    details: Dict[str, Any] = field(default_factory=dict)
    validation_time_ms: float = 0.0
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'is_valid': self.is_valid,
            'reason': self.reason,
            'details': self.details,
            'validation_time_ms': self.validation_time_ms,
        }


# =============================================================================
# PATH CONNECTIVITY CHECKER
# =============================================================================

class PathConnectivityChecker:
    """
    [NEW] BFS-based checker for path connectivity.
    
    Verifies that all key positions (start, collectibles, finish)
    are reachable from each other.
    """
    
    # Adjacent offsets for 3D grid (6 directions + jump up/down)
    ADJACENT_OFFSETS = [
        (1, 0, 0), (-1, 0, 0),   # X axis
        (0, 0, 1), (0, 0, -1),   # Z axis
        (0, 1, 0), (0, -1, 0),   # Y axis (jump)
    ]
    
    def __init__(self, path_coords: List[Tuple[int, int, int]]):
        """
        Initialize with path coordinates.
        
        Args:
            path_coords: List of (x, y, z) tuples representing walkable positions
        """
        self.walkable_set = set(path_coords) if path_coords else set()
    
    def is_connected(self, start: Tuple[int, int, int], 
                     targets: List[Tuple[int, int, int]]) -> ValidationResult:
        """
        Check if all targets are reachable from start using BFS.
        
        Args:
            start: Starting position (x, y, z)
            targets: List of target positions to reach
            
        Returns:
            ValidationResult with is_valid=True if all reachable
        """
        start_time = time.time()
        
        if not self.walkable_set:
            return ValidationResult(
                is_valid=False,
                reason="empty_path",
                details={"message": "No walkable positions defined"},
                validation_time_ms=(time.time() - start_time) * 1000
            )
        
        if start not in self.walkable_set:
            return ValidationResult(
                is_valid=False,
                reason="start_not_walkable",
                details={"start": start},
                validation_time_ms=(time.time() - start_time) * 1000
            )
        
        # Convert targets to set for O(1) lookup
        target_set = set(targets)
        unreachable = target_set.copy()
        
        # BFS from start
        visited = set()
        queue = deque([start])
        visited.add(start)
        
        while queue and unreachable:
            current = queue.popleft()
            
            # Check if current is a target
            if current in unreachable:
                unreachable.remove(current)
            
            # Explore neighbors
            for dx, dy, dz in self.ADJACENT_OFFSETS:
                neighbor = (current[0] + dx, current[1] + dy, current[2] + dz)
                
                if neighbor in self.walkable_set and neighbor not in visited:
                    visited.add(neighbor)
                    queue.append(neighbor)
        
        validation_time = (time.time() - start_time) * 1000
        
        if unreachable:
            return ValidationResult(
                is_valid=False,
                reason="unreachable_targets",
                details={
                    "unreachable_count": len(unreachable),
                    "unreachable_positions": list(unreachable)[:5],  # Limit for readability
                    "reachable_count": len(target_set) - len(unreachable),
                },
                validation_time_ms=validation_time
            )
        
        return ValidationResult(
            is_valid=True,
            details={
                "visited_count": len(visited),
                "targets_count": len(target_set),
            },
            validation_time_ms=validation_time
        )
    
    def is_path_reachable(self, from_pos: Tuple[int, int, int], 
                          to_pos: Tuple[int, int, int]) -> bool:
        """Simple check if one position can reach another."""
        result = self.is_connected(from_pos, [to_pos])
        return result.is_valid


# =============================================================================
# REQUIRED BLOCKS DETECTION
# =============================================================================

def get_required_blocks(map_data) -> Set[str]:
    """
    [NEW] Detect which Blockly blocks are required for this map.
    
    Args:
        map_data: MapData instance
        
    Returns:
        Set of required block names
    """
    required = {'maze_moveForward', 'maze_turn'}  # Always required
    
    path_coords = map_data.path_coords or []
    items = map_data.items or []
    
    # Check for height changes (jump required)
    if len(path_coords) >= 2:
        y_values = set(pos[1] for pos in path_coords)
        if len(y_values) > 1:
            required.add('maze_jump')
    
    # Check for collectibles
    collectibles = [item for item in items if item.get('type') in ('crystal', 'gem', 'key')]
    if collectibles:
        required.add('maze_collect')
    
    # Check for switches
    switches = [item for item in items if item.get('type') == 'switch']
    if switches:
        required.add('maze_toggle_switch')
    
    return required


# =============================================================================
# TOOLBOX COMPATIBILITY CHECK
# =============================================================================

# Map types that require specific blocks
MAP_TYPE_REQUIREMENTS = {
    'staircase_3d': {'maze_jump'},
    'spiral_3d': {'maze_jump'},
    'hub_with_stepped_islands': {'maze_jump'},
    'stepped_island_clusters': {'maze_jump'},
    'switch_maze': {'maze_toggle_switch'},
}


def is_toolbox_compatible(map_type: str, toolbox_blocks: Set[str]) -> ValidationResult:
    """
    [NEW] Check if toolbox has required blocks for map type.
    
    Args:
        map_type: Type of map topology
        toolbox_blocks: Set of available block names
        
    Returns:
        ValidationResult
    """
    required = MAP_TYPE_REQUIREMENTS.get(map_type, set())
    missing = required - toolbox_blocks
    
    if missing:
        return ValidationResult(
            is_valid=False,
            reason="missing_required_blocks",
            details={
                "map_type": map_type,
                "missing_blocks": list(missing),
                "required_blocks": list(required),
            }
        )
    
    return ValidationResult(is_valid=True)


# =============================================================================
# QUICK SOLVABILITY CHECK
# =============================================================================

def quick_solvability_check(map_data, toolbox_blocks: Set[str] = None) -> ValidationResult:
    """
    [NEW] Fast validation to check if map is likely solvable.
    
    Target: <100ms validation time.
    
    Args:
        map_data: MapData instance
        toolbox_blocks: Set of available Blockly blocks
        
    Returns:
        ValidationResult with is_valid and reason
    """
    start_time = time.time()
    
    # Check 1: Basic structure
    if not map_data.start_pos:
        return ValidationResult(
            is_valid=False, 
            reason="missing_start",
            validation_time_ms=(time.time() - start_time) * 1000
        )
    
    if not map_data.target_pos:
        return ValidationResult(
            is_valid=False, 
            reason="missing_target",
            validation_time_ms=(time.time() - start_time) * 1000
        )
    
    if map_data.start_pos == map_data.target_pos:
        return ValidationResult(
            is_valid=False, 
            reason="start_equals_target",
            validation_time_ms=(time.time() - start_time) * 1000
        )
    
    # Check 2: Path exists
    path_coords = map_data.path_coords or []
    if not path_coords:
        return ValidationResult(
            is_valid=False, 
            reason="empty_path",
            validation_time_ms=(time.time() - start_time) * 1000
        )
    
    # Check 3: Connectivity
    checker = PathConnectivityChecker(path_coords)
    
    # Collect all targets: finish + collectibles
    targets = [map_data.target_pos]
    for item in (map_data.items or []):
        if 'pos' in item:
            targets.append(tuple(item['pos']))
    
    connectivity_result = checker.is_connected(map_data.start_pos, targets)
    if not connectivity_result.is_valid:
        connectivity_result.validation_time_ms = (time.time() - start_time) * 1000
        return connectivity_result
    
    # Check 4: Toolbox compatibility (if provided)
    if toolbox_blocks:
        required = get_required_blocks(map_data)
        missing = required - toolbox_blocks
        
        if missing:
            return ValidationResult(
                is_valid=False,
                reason="missing_blocks",
                details={"missing": list(missing), "required": list(required)},
                validation_time_ms=(time.time() - start_time) * 1000
            )
    
    return ValidationResult(
        is_valid=True,
        details={
            "path_length": len(path_coords),
            "item_count": len(map_data.items or []),
        },
        validation_time_ms=(time.time() - start_time) * 1000
    )


# =============================================================================
# UNIFIED PRE-SOLVE VALIDATOR
# =============================================================================

class PreSolveValidator:
    """
    [NEW] Unified validator combining all pre-solve checks.
    
    Usage:
        validator = PreSolveValidator(toolbox_blocks={'maze_moveForward', 'maze_turn'})
        result = validator.validate(map_data)
        if result.is_valid:
            # Proceed to solve
    """
    
    def __init__(self, toolbox_blocks: Set[str] = None):
        """
        Initialize validator.
        
        Args:
            toolbox_blocks: Set of available Blockly blocks
        """
        self.toolbox_blocks = toolbox_blocks or set()
        self.stats = {
            'total_validated': 0,
            'valid_count': 0,
            'invalid_count': 0,
            'failure_reasons': {},
        }
    
    def validate(self, map_data) -> ValidationResult:
        """
        Run all validation checks on map.
        
        Args:
            map_data: MapData instance
            
        Returns:
            ValidationResult
        """
        self.stats['total_validated'] += 1
        
        result = quick_solvability_check(map_data, self.toolbox_blocks)
        
        if result.is_valid:
            self.stats['valid_count'] += 1
        else:
            self.stats['invalid_count'] += 1
            reason = result.reason or 'unknown'
            self.stats['failure_reasons'][reason] = \
                self.stats['failure_reasons'].get(reason, 0) + 1
        
        return result
    
    def get_stats(self) -> Dict[str, Any]:
        """Get validation statistics."""
        total = self.stats['total_validated']
        return {
            **self.stats,
            'valid_percentage': (self.stats['valid_count'] / total * 100) if total > 0 else 0,
        }
    
    def reset_stats(self):
        """Reset statistics."""
        self.stats = {
            'total_validated': 0,
            'valid_count': 0,
            'invalid_count': 0,
            'failure_reasons': {},
        }
