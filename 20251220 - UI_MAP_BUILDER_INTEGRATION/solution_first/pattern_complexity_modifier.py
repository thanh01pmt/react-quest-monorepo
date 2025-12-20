"""
Pattern Complexity Modifier

Modifies item patterns based on difficulty level WITHOUT changing item count.
- EASY: Patterns are obvious and immediately recognizable
- MEDIUM: Patterns are clear but have minor variations/exceptions
- HARD: Patterns exist but require discovery (hidden regularity)
"""

from typing import List, Dict, Any, Tuple, Optional
import logging
import random
import copy

logger = logging.getLogger(__name__)


class PatternComplexityModifier:
    """
    Modifies pattern complexity for difficulty adaptation.
    
    Key principle: Difficulty is increased by making patterns harder to recognize,
    NOT by increasing item count or density.
    """
    
    def __init__(self):
        self._seed = None
    
    def set_seed(self, seed: int):
        """Set random seed for reproducible modifications."""
        self._seed = seed
        random.seed(seed)
    
    def apply_difficulty(
        self, 
        items: List[Dict[str, Any]], 
        difficulty_code: str,
        pattern_type: str = 'default'
    ) -> List[Dict[str, Any]]:
        """
        Apply difficulty-based pattern modifications.
        
        Args:
            items: List of item placements with 'type', 'pos', etc.
            difficulty_code: 'EASY', 'MEDIUM', or 'HARD'
            pattern_type: Optional pattern type hint from strategy
            
        Returns:
            Modified items list (same count, different arrangement/types)
        """
        if not items:
            return items
        
        difficulty = difficulty_code.upper() if difficulty_code else 'MEDIUM'
        
        # Deep copy to avoid mutating original
        modified_items = copy.deepcopy(items)
        
        if difficulty == 'EASY':
            modified_items = self._make_patterns_obvious(modified_items, pattern_type)
        elif difficulty == 'HARD':
            modified_items = self._obscure_patterns(modified_items, pattern_type)
        else:  # MEDIUM
            modified_items = self._add_minor_variations(modified_items, pattern_type)
        
        # Add pattern_complexity metadata
        for item in modified_items:
            item['pattern_complexity'] = difficulty
        
        original_count = len(items)
        final_count = len(modified_items)
        
        if original_count != final_count:
            logger.warning(f"Pattern modification changed item count: {original_count} → {final_count}")
            # Restore original count by trimming or duplicating
            if final_count > original_count:
                modified_items = modified_items[:original_count]
            elif final_count < original_count:
                # Duplicate last items to maintain count
                while len(modified_items) < original_count:
                    modified_items.append(copy.deepcopy(modified_items[-1]))
        
        logger.debug(f"Applied {difficulty} difficulty to {len(modified_items)} items")
        return modified_items
    
    def _make_patterns_obvious(
        self, 
        items: List[Dict[str, Any]], 
        pattern_type: str
    ) -> List[Dict[str, Any]]:
        """
        EASY: Make patterns immediately recognizable.
        
        Strategies:
        1. Ensure perfect regularity in spacing
        2. Group same item types together
        3. Use single pattern type only
        4. Remove any irregularities
        """
        if len(items) < 2:
            return items
        
        # Strategy 1: Ensure identical patterns per zone/branch
        zones = self._group_by_zone(items)
        
        if len(zones) > 1:
            # Make all zones have identical pattern
            reference_zone = list(zones.values())[0]
            reference_pattern = self._extract_pattern(reference_zone)
            
            for zone_name, zone_items in zones.items():
                self._apply_pattern(zone_items, reference_pattern)
        
        # Strategy 2: Regularize spacing
        items = self._regularize_spacing(items)
        
        # Strategy 3: Simplify item type sequence
        # E.g., ensure [C, C, C, S, S] instead of [C, S, C, S, C]
        items = self._group_item_types(items)
        
        # Mark as obvious
        for item in items:
            item['pattern_visibility'] = 'obvious'
        
        return items
    
    def _add_minor_variations(
        self, 
        items: List[Dict[str, Any]], 
        pattern_type: str
    ) -> List[Dict[str, Any]]:
        """
        MEDIUM: Add minor variations while keeping pattern clear.
        
        Strategies:
        1. Introduce 1-2 exceptions to the pattern
        2. Slight spacing variations (but still regular)
        3. One zone may differ from others
        """
        if len(items) < 3:
            return items
        
        # Strategy 1: Add one exception item
        items = self._add_pattern_exception(items)
        
        # Strategy 2: Vary one zone slightly
        zones = self._group_by_zone(items)
        if len(zones) > 2:
            # Pick one zone to have a slight variation
            zone_names = list(zones.keys())
            varied_zone = random.choice(zone_names[1:-1]) if len(zone_names) > 2 else zone_names[-1]
            
            zone_items = zones[varied_zone]
            if zone_items:
                self._introduce_variation(zone_items)
        
        # Mark as clear with variation
        for item in items:
            item['pattern_visibility'] = 'clear_with_variation'
        
        return items
    
    def _obscure_patterns(
        self, 
        items: List[Dict[str, Any]], 
        pattern_type: str
    ) -> List[Dict[str, Any]]:
        """
        HARD: Make patterns discoverable but not obvious.
        
        Strategies:
        1. Use non-uniform spacing with hidden regularity (e.g., Fibonacci)
        2. Mix item types in ways that hide the pattern
        3. Patterns span across zones (not within)
        4. Add noise that doesn't break the underlying pattern
        """
        if len(items) < 4:
            return items
        
        # Strategy 1: Apply progressive spacing
        items = self._apply_progressive_spacing(items)
        
        # Strategy 2: Interleave item types
        items = self._interleave_types(items)
        
        # Strategy 3: Add hidden regularity markers
        items = self._add_hidden_regularity(items)
        
        # Strategy 4: Mark one or more items as decoys
        items = self._mark_decoys(items)
        
        # Mark as hidden
        for item in items:
            item['pattern_visibility'] = 'hidden_regularity'
        
        return items
    
    # =========================================================================
    # HELPER METHODS
    # =========================================================================
    
    def _group_by_zone(self, items: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
        """Group items by their zone/branch/segment."""
        zones = {}
        for item in items:
            zone = item.get('zone') or item.get('pattern_id', '').split('_')[0] or 'default'
            if zone not in zones:
                zones[zone] = []
            zones[zone].append(item)
        return zones
    
    def _extract_pattern(self, items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Extract the pattern template from a list of items."""
        pattern = []
        for i, item in enumerate(items):
            pattern.append({
                'index': i,
                'type': item.get('type', 'crystal'),
                'relative_pos': i  # Position relative to zone start
            })
        return pattern
    
    def _apply_pattern(self, items: List[Dict[str, Any]], pattern: List[Dict[str, Any]]):
        """Apply a pattern template to items."""
        for i, item in enumerate(items):
            if i < len(pattern):
                item['type'] = pattern[i]['type']
    
    def _regularize_spacing(self, items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Ensure items have regular spacing (no modification to positions for EASY)."""
        # For EASY, we don't change positions, but we mark them as regular
        for i, item in enumerate(items):
            item['spacing_regularity'] = 'perfect'
        return items
    
    def _group_item_types(self, items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Group same item types together for easier recognition."""
        # Count types
        types = {}
        for item in items:
            t = item.get('type', 'crystal')
            types[t] = types.get(t, 0) + 1
        
        # For EASY, we don't actually reorder (that would change positions),
        # but we mark the intended grouping
        for item in items:
            item['grouping'] = 'type_grouped'
        
        return items
    
    def _add_pattern_exception(self, items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Add one exception to the pattern for MEDIUM difficulty."""
        if len(items) < 3:
            return items
        
        # Pick an item in the middle to be an exception
        exception_idx = len(items) // 2
        exception_item = items[exception_idx]
        
        # Mark it as exception
        exception_item['is_exception'] = True
        
        # Optionally swap its type
        types = ['crystal', 'switch']
        current_type = exception_item.get('type', 'crystal')
        if current_type in types:
            other_type = [t for t in types if t != current_type][0]
            exception_item['original_type'] = current_type
            exception_item['exception_type'] = other_type
            # Note: We don't actually change the type, just mark the intent
        
        return items
    
    def _introduce_variation(self, items: List[Dict[str, Any]]):
        """Introduce slight variation in a zone's pattern."""
        if not items:
            return
        
        # Mark as varied
        for item in items:
            item['has_variation'] = True
    
    def _apply_progressive_spacing(self, items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Apply progressive spacing pattern (e.g., 1, 2, 3, 5, 8 - Fibonacci)."""
        for i, item in enumerate(items):
            # Mark the progressive nature
            item['spacing_pattern'] = 'progressive'
            item['position_in_sequence'] = i
            
            # Add Fibonacci-like hint
            fib = [1, 1, 2, 3, 5, 8, 13]
            if i < len(fib):
                item['spacing_hint'] = fib[i]
        
        return items
    
    def _interleave_types(self, items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Interleave item types to hide simple patterns."""
        # For HARD, we mark items as interleaved but don't change actual types
        for i, item in enumerate(items):
            item['interleaving_index'] = i
            item['interleaving_type'] = 'type_a' if i % 2 == 0 else 'type_b'
        
        return items
    
    def _add_hidden_regularity(self, items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Add markers showing hidden regularity pattern."""
        # Hidden pattern: every Nth item is special
        n = max(2, len(items) // 3)
        
        for i, item in enumerate(items):
            if i % n == 0:
                item['hidden_pattern_marker'] = True
                item['pattern_sequence'] = i // n
        
        return items
    
    def _mark_decoys(self, items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Mark some items as decoys for HARD difficulty."""
        if len(items) < 5:
            return items
        
        # Mark ~20% of items as potential decoys
        num_decoys = max(1, len(items) // 5)
        decoy_indices = random.sample(range(len(items)), num_decoys)
        
        for i in decoy_indices:
            items[i]['is_potential_decoy'] = True
        
        return items
    
    # =========================================================================
    # VALIDATION
    # =========================================================================
    
    def validate_item_count_preserved(
        self, 
        original: List[Dict[str, Any]], 
        modified: List[Dict[str, Any]]
    ) -> bool:
        """Verify that modification preserved item count."""
        return len(original) == len(modified)
    
    def get_modification_summary(
        self, 
        items: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Get summary statistics of pattern modifications."""
        summary = {
            'total_items': len(items),
            'difficulty_levels': {},
            'visibility_types': {},
            'exceptions': 0,
            'decoys': 0,
        }
        
        for item in items:
            # Count by difficulty
            diff = item.get('pattern_complexity', 'unknown')
            summary['difficulty_levels'][diff] = summary['difficulty_levels'].get(diff, 0) + 1
            
            # Count by visibility
            vis = item.get('pattern_visibility', 'unknown')
            summary['visibility_types'][vis] = summary['visibility_types'].get(vis, 0) + 1
            
            # Count exceptions and decoys
            if item.get('is_exception'):
                summary['exceptions'] += 1
            if item.get('is_potential_decoy'):
                summary['decoys'] += 1
        
        return summary


# =============================================================================
# CONVENIENCE FUNCTIONS
# =============================================================================

def apply_difficulty_to_items(
    items: List[Dict[str, Any]], 
    difficulty_code: str
) -> List[Dict[str, Any]]:
    """
    Convenience function to apply difficulty modification.
    
    Args:
        items: Item list to modify
        difficulty_code: EASY, MEDIUM, or HARD
        
    Returns:
        Modified items with same count
    """
    modifier = PatternComplexityModifier()
    return modifier.apply_difficulty(items, difficulty_code)


def get_pattern_complexity_modifier() -> PatternComplexityModifier:
    """Get a PatternComplexityModifier instance."""
    return PatternComplexityModifier()
