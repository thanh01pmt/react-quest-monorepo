# src/map_generator/placements/progressive_generator.py
"""
PROGRESSIVE QUANTITY GENERATOR

Generates item quantity combinations from easiest to hardest.
Supports:
- Progressive difficulty levels (L1-L5)
- Auto-expand constraints
- Deduplication
- variant_num limit

Usage:
    from .progressive_generator import generate_progressive_variants
    
    for combo in generate_progressive_variants(
        item_types=['crystal', 'switch'],
        available_slots=15,
        variant_num=10,
        constraints='auto'
    ):
        print(combo)  # {'crystal': 1, 'switch': 0}
"""

from typing import List, Dict, Any, Iterator, Optional, Tuple, Set
from itertools import product
import logging

logger = logging.getLogger(__name__)


# =============================================================================
# PROGRESSIVE LEVELS - From Easiest to Hardest
# =============================================================================

PROGRESSIVE_LEVELS: List[Dict[str, Tuple[int, int]]] = [
    # Level 1: Easiest - minimal items
    {
        'crystal': (1, 2),
        'gem': (0, 1),
        'key': (0, 1),
        'switch': (0, 1),
        'obstacle': (0, 0),
    },
    # Level 2
    {
        'crystal': (2, 4),
        'gem': (0, 2),
        'key': (0, 1),
        'switch': (0, 2),
        'obstacle': (0, 1),
    },
    # Level 3: Medium
    {
        'crystal': (3, 6),
        'gem': (1, 3),
        'key': (0, 2),
        'switch': (1, 2),
        'obstacle': (1, 2),
    },
    # Level 4
    {
        'crystal': (4, 8),
        'gem': (1, 4),
        'key': (1, 2),
        'switch': (1, 3),
        'obstacle': (2, 3),
    },
    # Level 5: Hardest - maximum items
    {
        'crystal': (5, 10),
        'gem': (2, 5),
        'key': (1, 3),
        'switch': (1, 3),
        'obstacle': (3, 5),
    },
]

# Default constraints config
DEFAULT_CONSTRAINTS = {
    'use_quantity_bounds': True,
    'use_map_size_limits': True,
    'use_difficulty': True,
    'use_map_type_rules': True,
}

# Maximum variants to generate (safety cap)
MAX_VARIANTS_CAP = 100


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def resolve_variant_num(
    variant_num: Any,
    available_slots: int,
    item_types: List[str]
) -> int:
    """
    Resolve variant_num to an integer.
    
    Args:
        variant_num: int, 'auto', or 'all'
        available_slots: Number of positions available
        item_types: List of item types
        
    Returns:
        Resolved integer variant count
    """
    if variant_num == 'all':
        return MAX_VARIANTS_CAP
    
    if variant_num == 'auto':
        # Calculate based on complexity
        complexity = len(item_types) * max(1, available_slots // 5)
        return min(max(5, complexity), 20)
    
    return min(int(variant_num), MAX_VARIANTS_CAP)


def get_level_range(level: Dict[str, Tuple[int, int]], item_type: str) -> Tuple[int, int]:
    """Get (min, max) range for an item type at a level."""
    return level.get(item_type, (0, 0))


def get_combos_at_level(
    item_types: List[str],
    level: Dict[str, Tuple[int, int]],
    available_slots: int
) -> Iterator[Dict[str, int]]:
    """
    Generate all valid quantity combinations at a specific level.
    
    Args:
        item_types: List of item types to consider
        level: The level config with (min, max) ranges
        available_slots: Max total items allowed
        
    Yields:
        Dict mapping item_type to count
    """
    if not item_types:
        return
    
    # Build ranges for each item type
    ranges = []
    for item_type in item_types:
        min_val, max_val = get_level_range(level, item_type)
        # Ensure we don't exceed available slots
        max_val = min(max_val, available_slots)
        ranges.append(range(min_val, max_val + 1))
    
    # Cartesian product of all ranges
    for combo in product(*ranges):
        # Check total doesn't exceed available slots
        total = sum(combo)
        if total <= available_slots and total > 0:
            yield dict(zip(item_types, combo))


def combo_to_key(combo: Dict[str, int]) -> Tuple:
    """Convert combo dict to hashable key for deduplication."""
    return tuple(sorted(combo.items()))


# =============================================================================
# MAIN GENERATOR
# =============================================================================

def generate_progressive_variants(
    item_types: List[str],
    available_slots: int,
    variant_num: Any = 10,
    constraints: Any = 'auto',
    start_level: int = 1,
    map_type: Optional[str] = None,
) -> Iterator[Dict[str, int]]:
    """
    Generate item quantity combinations from easiest to hardest.
    
    Args:
        item_types: List of item types (e.g., ['crystal', 'switch'])
        available_slots: Number of positions available for items
        variant_num: Target count - int, 'auto', or 'all'
        constraints: 'auto' or dict with toggle options
        start_level: Starting level (1-5), default 1 (easiest)
        map_type: Optional map type for specific constraints
        
    Yields:
        Dict[str, int]: Quantity combinations, e.g., {'crystal': 2, 'switch': 1}
    """
    if not item_types or available_slots <= 0:
        return
    
    # Resolve variant_num
    target = resolve_variant_num(variant_num, available_slots, item_types)
    logger.info(f"Progressive generator: target={target}, types={item_types}, slots={available_slots}")
    
    # Parse constraints
    if constraints == 'auto':
        auto_expand = True
        constraint_config = DEFAULT_CONSTRAINTS.copy()
    elif isinstance(constraints, dict):
        auto_expand = constraints.pop('auto_expand', False)
        constraint_config = {**DEFAULT_CONSTRAINTS, **constraints}
    else:
        auto_expand = False
        constraint_config = DEFAULT_CONSTRAINTS.copy()
    
    # Deduplication set
    seen: Set[Tuple] = set()
    count = 0
    
    # Iterate through levels
    levels_to_use = PROGRESSIVE_LEVELS[start_level - 1:]
    
    for level_idx, level in enumerate(levels_to_use):
        level_num = start_level + level_idx
        logger.debug(f"  Level {level_num}: checking combos")
        
        # Generate combos at this level
        for combo in get_combos_at_level(item_types, level, available_slots):
            key = combo_to_key(combo)
            
            if key not in seen:
                seen.add(key)
                count += 1
                logger.debug(f"    Variant {count}: {combo}")
                yield combo
                
                if count >= target:
                    logger.info(f"  Reached target {target} variants")
                    return
        
        # If auto_expand is False, stop after first level
        if not auto_expand:
            break
    
    logger.info(f"  Generated {count} total variants")


def generate_items_list_from_combo(combo: Dict[str, int]) -> List[str]:
    """
    Convert quantity combo to list of items.
    
    Example:
        {'crystal': 2, 'switch': 1} -> ['crystal', 'crystal', 'switch']
    """
    items = []
    for item_type, count in combo.items():
        items.extend([item_type] * count)
    return items


# =============================================================================
# HIGH-LEVEL API
# =============================================================================

def generate_progressive_items_lists(
    item_types: List[str],
    available_slots: int,
    variant_num: Any = 10,
    constraints: Any = 'auto',
    start_level: int = 1,
) -> Iterator[List[str]]:
    """
    Generate item lists (not quantity dicts) from easiest to hardest.
    
    This is the higher-level API for use in placers.
    
    Yields:
        List[str]: e.g., ['crystal', 'crystal', 'switch']
    """
    for combo in generate_progressive_variants(
        item_types=item_types,
        available_slots=available_slots,
        variant_num=variant_num,
        constraints=constraints,
        start_level=start_level,
    ):
        yield generate_items_list_from_combo(combo)
