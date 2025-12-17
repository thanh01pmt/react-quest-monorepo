# src/map_generator/placements/item_quantity.py
"""
SMART ITEM QUANTITY MODULE

Provides intelligent calculation of item quantities based on:
- Map size (path length)
- Available slots
- Difficulty level
- Map type constraints

Usage:
    from .item_quantity import calculate_item_quantities
    
    quantities = calculate_item_quantities(
        item_types=['crystal', 'switch'],
        available_slots=15,
        map_type='l_shape',
        difficulty='medium'
    )
    # Returns: {'crystal': 4, 'switch': 1}
"""

from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
import random
import logging

logger = logging.getLogger(__name__)


# =============================================================================
# CONFIGURATION CONSTANTS
# =============================================================================

QUANTITY_CONSTRAINTS: Dict[str, Dict[str, Any]] = {
    'crystal': {'min': 1, 'max': 10, 'default_ratio': 0.3, 'priority': 1},
    'gem': {'min': 0, 'max': 5, 'default_ratio': 0.15, 'priority': 2},
    'key': {'min': 0, 'max': 3, 'default_ratio': 0.1, 'priority': 3},
    'switch': {'min': 0, 'max': 3, 'default_ratio': 0.1, 'priority': 2},
    'obstacle': {'min': 0, 'max': 5, 'default_ratio': 0.2, 'priority': 4},
}

MAP_SIZE_LIMITS: Dict[str, Dict[str, Any]] = {
    'small': {'path_length': (1, 10), 'max_total_items': 5},
    'medium': {'path_length': (11, 20), 'max_total_items': 10},
    'large': {'path_length': (21, 50), 'max_total_items': 15},
    'xlarge': {'path_length': (51, 200), 'max_total_items': 25},
}

DIFFICULTY_MULTIPLIER: Dict[str, float] = {
    'easy': 0.5,
    'medium': 0.75,
    'hard': 1.0,
    'expert': 1.2,
}

MAP_TYPE_CONSTRAINTS: Dict[str, Dict[str, Any]] = {
    # Plowing field requires full coverage for nested loop pattern
    'plowing_field': {'item_coverage': 1.0, 'ignore_difficulty': True},
    
    # Complex mazes should have fewer items due to long paths
    'complex_maze_2d': {'max_total_items': 5},
    'swift_playground_maze': {'max_total_items': 8},
    
    # Staircase needs minimum items
    'staircase': {'min_items': 2},
    'staircase_3d': {'min_items': 2},
    
    # Spiral requires items along the path
    'spiral_path': {'min_items': 3},
    'spiral_3d': {'min_items': 2, 'max_total_items': 6},
    
    # Islands may have items per island
    'symmetrical_islands': {'min_items': 2, 'items_per_island': True},
    'hub_with_stepped_islands': {'min_items': 3},
}


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def get_map_size_category(path_length: int) -> str:
    """
    Determine map size category based on path length.
    
    Args:
        path_length: Number of positions in the path
        
    Returns:
        Size category: 'small', 'medium', 'large', or 'xlarge'
    """
    for category, limits in MAP_SIZE_LIMITS.items():
        min_len, max_len = limits['path_length']
        if min_len <= path_length <= max_len:
            return category
    
    # Default to large if path is very long
    return 'xlarge' if path_length > 50 else 'small'


def get_max_total_items(path_length: int, map_type: Optional[str] = None) -> int:
    """
    Get maximum total items allowed for this map.
    
    Args:
        path_length: Number of positions
        map_type: Optional map type for specific constraints
        
    Returns:
        Maximum total items
    """
    # Check map_type specific constraint first
    if map_type and map_type in MAP_TYPE_CONSTRAINTS:
        type_max = MAP_TYPE_CONSTRAINTS[map_type].get('max_total_items')
        if type_max is not None:
            return type_max
    
    # Fall back to size-based limit
    size_category = get_map_size_category(path_length)
    return MAP_SIZE_LIMITS[size_category]['max_total_items']


def get_min_items(map_type: Optional[str] = None) -> int:
    """Get minimum items for this map type."""
    if map_type and map_type in MAP_TYPE_CONSTRAINTS:
        return MAP_TYPE_CONSTRAINTS[map_type].get('min_items', 1)
    return 1


# =============================================================================
# MAIN CALCULATION FUNCTION
# =============================================================================

def calculate_item_quantities(
    item_types: List[str],
    available_slots: int,
    map_type: Optional[str] = None,
    difficulty: str = 'medium',
    min_items: Optional[int] = None,
    max_items: Optional[int] = None,
    fill_ratio: Optional[float] = None,
) -> Dict[str, int]:
    """
    Calculate item quantities based on constraints.
    
    Args:
        item_types: List of item types to place (e.g., ['crystal', 'switch'])
        available_slots: Number of positions available for items
        map_type: Optional map type for specific constraints
        difficulty: Difficulty level affecting quantity
        min_items: Override minimum total items
        max_items: Override maximum total items
        fill_ratio: If provided, fill this ratio of available slots
        
    Returns:
        Dictionary mapping item type to count
    """
    if not item_types or available_slots <= 0:
        return {}
    
    # Remove duplicates while preserving order
    unique_types = list(dict.fromkeys(item_types))
    
    logger.debug(f"Calculating quantities for {unique_types}, slots={available_slots}, "
                 f"map={map_type}, difficulty={difficulty}")
    
    # Get difficulty multiplier
    diff_mult = DIFFICULTY_MULTIPLIER.get(difficulty, 0.75)
    
    # Check for map-type specific overrides
    if map_type and map_type in MAP_TYPE_CONSTRAINTS:
        type_constraints = MAP_TYPE_CONSTRAINTS[map_type]
        
        # Full coverage mode (e.g., plowing_field for nested loops)
        if type_constraints.get('item_coverage') == 1.0:
            # Place items on all available slots
            # Distribute evenly among types
            count_per_type = max(1, available_slots // len(unique_types))
            result = {t: count_per_type for t in unique_types}
            
            # Handle remainder
            remainder = available_slots - (count_per_type * len(unique_types))
            if remainder > 0 and unique_types:
                result[unique_types[0]] += remainder
            
            logger.debug(f"Full coverage mode: {result}")
            return result
        
        # Ignore difficulty for some map types
        if type_constraints.get('ignore_difficulty'):
            diff_mult = 1.0
    
    # Calculate effective max items
    path_based_max = get_max_total_items(available_slots, map_type)
    effective_max = min(
        max_items if max_items else 999,
        path_based_max,
        available_slots
    )
    
    # Apply difficulty multiplier to max
    effective_max = max(1, int(effective_max * diff_mult))
    
    # Calculate effective min
    effective_min = max(
        min_items if min_items else 1,
        get_min_items(map_type)
    )
    
    # Ensure min <= max
    effective_min = min(effective_min, effective_max)
    
    # Calculate base quantities
    result: Dict[str, int] = {}
    remaining_slots = effective_max
    
    # Sort by priority (lower = higher priority)
    sorted_types = sorted(
        unique_types,
        key=lambda t: QUANTITY_CONSTRAINTS.get(t, {}).get('priority', 5)
    )
    
    for i, item_type in enumerate(sorted_types):
        constraints = QUANTITY_CONSTRAINTS.get(item_type, {'min': 1, 'max': 5, 'default_ratio': 0.2})
        
        # Calculate quantity based on ratio or remaining
        if fill_ratio is not None:
            # [FIX] Use fill_ratio directly, not multiplied with default_ratio
            # fill_ratio = 0.5 means fill 50% of available slots
            base_count = int(available_slots * fill_ratio / len(sorted_types))
        else:
            base_count = int(available_slots * constraints['default_ratio'])
        
        # Apply random variation (±20%)
        variation = random.uniform(0.8, 1.2)
        varied_count = int(base_count * variation)
        
        # Apply constraints
        item_min = constraints['min']
        item_max = min(constraints['max'], remaining_slots)
        
        # [FIX] Do NOT apply difficulty multiplier here - already applied to effective_max
        
        # Clamp to constraints
        final_count = max(item_min, min(varied_count, item_max))
        
        # Don't exceed remaining slots
        final_count = min(final_count, remaining_slots)
        
        result[item_type] = final_count
        remaining_slots -= final_count
        
        if remaining_slots <= 0:
            break
    
    # Ensure we meet minimum total
    total = sum(result.values())
    if total < effective_min and result:
        # Add more of the first item type
        first_type = sorted_types[0]
        result[first_type] += (effective_min - total)
    
    logger.debug(f"Calculated quantities: {result} (total={sum(result.values())})")
    return result


def resolve_items_to_place(
    items_to_place: Any,
    available_slots: int,
    params: dict
) -> List[str]:
    """
    Resolve items_to_place to a list with quantities.
    
    Supports:
    1. Explicit list: ['crystal', 'crystal'] → use as-is
    2. Type list + auto mode: ['crystal', 'switch'] → calculate quantities
    3. Type list + ratio mode: fill_ratio applied
    4. [NEW] Progressive mode: returns first variant only (use generator for multiple)
    5. [NEW] Auto-detect 'all' in solution_item_goals → fill most available slots
    
    Args:
        items_to_place: Raw items_to_place from params
        available_slots: Number of available positions
        params: Full params dict for additional options
        
    Returns:
        List of item types with correct quantities
    """
    # Check quantity_mode
    quantity_mode = params.get('quantity_mode', 'explicit')
    
    # [NEW] Auto-detect 'all' in solution_item_goals → switch to fill mode
    solution_goals = params.get('solution_item_goals', '')
    if isinstance(solution_goals, str) and ':all' in solution_goals:
        # When goal is 'crystal:all', fill 50% of available slots with that item
        quantity_mode = 'ratio'
        params = dict(params)  # Create copy to avoid mutation
        params['fill_ratio'] = 0.5  # Fill 50% of available slots
        logger.debug(f"Auto-detected ':all' in goals, switching to ratio mode with fill_ratio=0.5")
    
    # If explicit mode or items_to_place has duplicates → use as-is
    if quantity_mode == 'explicit':
        if isinstance(items_to_place, str):
            return [items_to_place]
        return list(items_to_place) if items_to_place else []
    
    # Check if items_to_place already has duplicates (explicit counts)
    if isinstance(items_to_place, list):
        unique = set(items_to_place)
        if len(unique) < len(items_to_place):
            # Has duplicates = explicit counts, use as-is
            return list(items_to_place)
        
        # Unique items → calculate quantities
        item_types = list(items_to_place)
    elif isinstance(items_to_place, str):
        item_types = [items_to_place]
    else:
        return []
    
    # [NEW] Progressive mode - use generator for first variant
    if quantity_mode == 'progressive':
        from .progressive_generator import generate_progressive_variants, generate_items_list_from_combo
        
        variant_num = params.get('variant_num', 1)
        constraints = params.get('constraints', 'auto')
        start_level = params.get('start_level', 1)
        
        # Get first variant
        for combo in generate_progressive_variants(
            item_types=item_types,
            available_slots=available_slots,
            variant_num=1,  # Just get first
            constraints=constraints,
            start_level=start_level,
        ):
            return generate_items_list_from_combo(combo)
        
        # Fallback if no combos
        return item_types[:1] if item_types else []
    
    # Get params for calculation
    map_type = params.get('map_type')
    difficulty = params.get('difficulty', 'medium')
    min_items = params.get('min_items')
    max_items = params.get('max_items')
    fill_ratio = params.get('fill_ratio') if quantity_mode == 'ratio' else None
    
    # Calculate quantities
    quantities = calculate_item_quantities(
        item_types=item_types,
        available_slots=available_slots,
        map_type=map_type,
        difficulty=difficulty,
        min_items=min_items,
        max_items=max_items,
        fill_ratio=fill_ratio,
    )
    
    # Convert to list
    result = []
    for item_type, count in quantities.items():
        result.extend([item_type] * count)
    
    return result


def generate_progressive_item_variants(
    item_types: List[str],
    available_slots: int,
    params: dict
):
    """
    [NEW] Generate progressive item variants.
    
    Use this in place_item_variants() to yield multiple layouts.
    
    Args:
        item_types: List of item types
        available_slots: Number of positions
        params: Parameters with variant_num, constraints, start_level
        
    Yields:
        List[str]: Item lists for each variant
    """
    from .progressive_generator import generate_progressive_items_lists
    
    variant_num = params.get('variant_num', 10)
    constraints = params.get('constraints', 'auto')
    start_level = params.get('start_level', 1)
    
    yield from generate_progressive_items_lists(
        item_types=item_types,
        available_slots=available_slots,
        variant_num=variant_num,
        constraints=constraints,
        start_level=start_level,
    )

