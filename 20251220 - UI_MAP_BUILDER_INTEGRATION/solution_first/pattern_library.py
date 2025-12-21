"""
Pattern Library for Solution-First Placement

Patterns define action sequences and corresponding item positions
to create predictable, reusable PROCEDURE structures.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional


@dataclass
class Pattern:
    """
    A pattern defines a repeatable sequence of actions and item placements.
    
    Attributes:
        id: Unique pattern identifier
        actions: List of action names (e.g., ['move', 'collect'])
        item_coord_offsets: Index positions within segment_coords to place items
        item_types: Type of item at each offset position
        min_segment_length: Minimum segment length for this pattern
        diversity_score: Number of distinct block types (higher = better for function_logic)
        turn_positions: Action indices that are turns (for patterns with internal turns)
        turn_type: 'any', 'left', or 'right'
        requires_corner: Whether pattern needs a corner after segment
    """
    id: str
    actions: List[str]
    item_coord_offsets: List[int]
    item_types: List[str]
    min_segment_length: int
    diversity_score: int
    turn_positions: List[int] = field(default_factory=list)
    turn_type: str = 'any'
    requires_corner: bool = False
    
    @property
    def length(self) -> int:
        return len(self.actions)


# === PATTERN DEFINITIONS ===

# ============================================================================
# BASIC PATTERNS (2 actions, diversity=2)
# ============================================================================

PATTERN_MOVE_COLLECT = Pattern(
    id='move_collect_2',
    actions=['move', 'collect'],
    item_coord_offsets=[1],
    item_types=['crystal'],
    min_segment_length=2,
    diversity_score=2
)

PATTERN_MOVE_TOGGLE = Pattern(
    id='move_toggle_2',
    actions=['move', 'toggle'],
    item_coord_offsets=[1],
    item_types=['switch'],
    min_segment_length=2,
    diversity_score=2
)

# ============================================================================
# DENSE PATTERNS (nhiều items liên tiếp - for loops với >= 3 iterations)
# ============================================================================

# Pattern 3 actions, 2 items (dense)
PATTERN_MOVE_COLLECT_COLLECT = Pattern(
    id='move_collect_collect_3',
    actions=['move', 'collect', 'collect'],
    item_coord_offsets=[1, 2],
    item_types=['crystal', 'crystal'],
    min_segment_length=3,
    diversity_score=2  # Only move+collect types
)

# Pattern 4 actions, 2 items (dense với spacing)
PATTERN_MOVE_MOVE_COLLECT_COLLECT = Pattern(
    id='move_move_collect_collect_4',
    actions=['move', 'move', 'collect', 'collect'],
    item_coord_offsets=[2, 3],  # Items at coords[2] và coords[3]
    item_types=['crystal', 'crystal'],
    min_segment_length=4,
    diversity_score=2
)

# Dense pattern cho switch
PATTERN_MOVE_TOGGLE_TOGGLE = Pattern(
    id='move_toggle_toggle_3',
    actions=['move', 'toggle', 'toggle'],
    item_coord_offsets=[1, 2],
    item_types=['switch', 'switch'],
    min_segment_length=3,
    diversity_score=2
)

# ============================================================================
# EXTENDED PATTERNS (3+ actions, diversity=3)
# ============================================================================

PATTERN_MCT_3 = Pattern(
    id='move_collect_toggle_3',
    actions=['move', 'collect', 'toggle'],
    item_coord_offsets=[1, 2],
    item_types=['crystal', 'switch'],
    min_segment_length=3,
    diversity_score=3
)

PATTERN_MCM_3 = Pattern(
    id='move_collect_move_3',
    actions=['move', 'collect', 'move'],
    item_coord_offsets=[1],
    item_types=['crystal'],
    min_segment_length=3,
    diversity_score=2
)

# Move-Move-Collect (spacing pattern)
PATTERN_MMC_3 = Pattern(
    id='move_move_collect_3',
    actions=['move', 'move', 'collect'],
    item_coord_offsets=[2],  # Item at 3rd position
    item_types=['crystal'],
    min_segment_length=3,
    diversity_score=2
)

# ============================================================================
# COMPLEX PATTERNS (4+ actions, high diversity)
# ============================================================================

# Pattern with alternating items
PATTERN_MCMC_4 = Pattern(
    id='move_collect_move_collect_4',
    actions=['move', 'collect', 'move', 'collect'],
    item_coord_offsets=[1, 3],
    item_types=['crystal', 'crystal'],
    min_segment_length=4,
    diversity_score=2
)

# Pattern with mixed items
PATTERN_MCTC_4 = Pattern(
    id='move_collect_toggle_collect_4',
    actions=['move', 'collect', 'toggle', 'collect'],
    item_coord_offsets=[1, 2, 3],
    item_types=['crystal', 'switch', 'crystal'],
    min_segment_length=4,
    diversity_score=3
)

# Dense move + collect pattern (5 actions)
PATTERN_MMCCC_5 = Pattern(
    id='move_move_collect_collect_collect_5',
    actions=['move', 'move', 'collect', 'collect', 'collect'],
    item_coord_offsets=[2, 3, 4],
    item_types=['crystal', 'crystal', 'crystal'],
    min_segment_length=5,
    diversity_score=2
)

# ============================================================================
# SPARSE PATTERNS (Low density for large maps)
# ============================================================================

PATTERN_MMMC_4 = Pattern(
    id='move_move_move_collect_4',
    actions=['move', 'move', 'move', 'collect'],
    item_coord_offsets=[3],
    item_types=['crystal'],
    min_segment_length=4,
    diversity_score=1
)

# ============================================================================
# WHILE-LOOP PATTERNS (condition-based iteration)
# ============================================================================

# isOnGem() pattern - collect while on gem
PATTERN_WHILE_GEM = Pattern(
    id='while_isOnGem_collect_move',
    actions=['collect', 'move'],
    item_coord_offsets=[0],
    item_types=['crystal'],
    min_segment_length=2,
    diversity_score=2
)

# isOnSwitch() pattern - toggle while on switch
PATTERN_WHILE_SWITCH = Pattern(
    id='while_isOnSwitch_toggle_move',
    actions=['toggle', 'move'],
    item_coord_offsets=[0],
    item_types=['switch'],
    min_segment_length=2,
    diversity_score=2
)

# Complex while pattern with turn
PATTERN_WHILE_COLLECT_TURN = Pattern(
    id='while_collect_turn_move',
    actions=['collect', 'turnRight', 'move'],
    item_coord_offsets=[0],
    item_types=['crystal'],
    min_segment_length=3,
    diversity_score=3,
    turn_positions=[1],
    turn_type='right'
)

# ============================================================================
# VARIABLE-BASED PATTERNS (modulo/alternating)
# ============================================================================

# Alternating crystal-switch (i % 2)
PATTERN_ALTERNATING_CS = Pattern(
    id='alternating_crystal_switch',
    actions=['move', 'collect', 'move', 'toggle'],
    item_coord_offsets=[1, 3],
    item_types=['crystal', 'switch'],
    min_segment_length=4,
    diversity_score=4  # High diversity due to alternation
)

# Period-3 pattern (i % 3): crystal, switch, empty
PATTERN_PERIODIC_3 = Pattern(
    id='periodic_3_cs_empty',
    actions=['move', 'collect', 'move', 'toggle', 'move'],
    item_coord_offsets=[1, 3],
    item_types=['crystal', 'switch'],
    min_segment_length=5,
    diversity_score=4
)

# Progressive spacing pattern (1, 2, 3 steps)
PATTERN_PROGRESSIVE_SPACING = Pattern(
    id='progressive_spacing_1_2_3',
    actions=['move', 'collect', 'move', 'move', 'collect', 'move', 'move', 'move', 'collect'],
    item_coord_offsets=[1, 4, 8],
    item_types=['crystal', 'crystal', 'crystal'],
    min_segment_length=9,
    diversity_score=3
)

# ============================================================================
# PEDAGOGICAL-SPECIFIC PATTERNS
# ============================================================================

# Function Reuse pattern - identical sequence for hub-spoke
PATTERN_FUNCTION_REUSE = Pattern(
    id='function_reuse_hub_spoke',
    actions=['move', 'collect', 'move', 'toggle', 'collect'],
    item_coord_offsets=[1, 3, 4],
    item_types=['crystal', 'switch', 'crystal'],
    min_segment_length=5,
    diversity_score=4
)

# Conditional Branching pattern - with decoy
PATTERN_CONDITIONAL_BRANCH = Pattern(
    id='conditional_branch_decoy',
    actions=['move', 'collect', 'collect', 'move'],
    item_coord_offsets=[1, 2],
    item_types=['crystal', 'crystal'],
    min_segment_length=4,
    diversity_score=3
)

# Decreasing Loop pattern - for spiral (items per layer)
PATTERN_DECREASING_LOOP = Pattern(
    id='decreasing_loop_spiral',
    actions=['move', 'collect', 'move', 'collect', 'move'],
    item_coord_offsets=[1, 3],
    item_types=['crystal', 'crystal'],
    min_segment_length=5,
    diversity_score=3
)

# Radial Iteration pattern - for star shape
PATTERN_RADIAL_ITERATION = Pattern(
    id='radial_iteration_star',
    actions=['move', 'collect', 'move', 'collect', 'collect'],
    item_coord_offsets=[1, 3, 4],
    item_types=['crystal', 'crystal', 'crystal'],
    min_segment_length=5,
    diversity_score=3
)

# ============================================================================
# FALLBACK PATTERN
# ============================================================================

FALLBACK_PATTERN = Pattern(
    id='fallback_collect_every_2',
    actions=['move', 'collect'],
    item_coord_offsets=[1],
    item_types=['crystal'],
    min_segment_length=2,
    diversity_score=2
)


class PatternLibrary:
    """
    Central repository of patterns organized by logic_type.
    
    Patterns are ordered by priority: more complex/diverse patterns first.
    """
    
    def __init__(self):
        self._patterns: Dict[str, List[Pattern]] = {
            'function_logic': [
                # Prioritize high diversity patterns first
                PATTERN_MCTC_4,       # diversity=3, len=4 (BEST for varied procedures)
                PATTERN_MCT_3,        # diversity=3, len=3
                
                # [NEW] Pedagogical patterns
                PATTERN_FUNCTION_REUSE,    # For hub-spoke topologies
                PATTERN_ALTERNATING_CS,    # Alternating crystal/switch
                
                # Then dense patterns (good for showing repetition)
                PATTERN_MMCCC_5,      # Dense collect, len=5
                PATTERN_MCMC_4,       # Alternating, len=4
                
                # Medium complexity
                PATTERN_MOVE_COLLECT_COLLECT,  # Dense, len=3
                PATTERN_MOVE_MOVE_COLLECT_COLLECT,  # Dense with spacing, len=4
                PATTERN_MOVE_TOGGLE_TOGGLE,    # Dense switches, len=3
                
                # Extended patterns
                PATTERN_MMC_3,        # Spacing pattern
                PATTERN_MCM_3,        # Classic
                
                # Basic patterns (fallback)
                PATTERN_MOVE_COLLECT,
                PATTERN_MOVE_TOGGLE,
                
                # [NEW] Sparse Patterns for Large Maps (Max Density < 30%)
                PATTERN_MMMC_4,      # Density 0.25 (1/4)
            ],
            'for_loop_logic': [
                # For loops prioritize patterns that create >= 3 iterations
                # Dense patterns with many items are best
                PATTERN_MMCCC_5,              # 3 items in 5 actions - BEST
                PATTERN_MOVE_COLLECT_COLLECT, # 2 items in 3 actions
                PATTERN_MOVE_MOVE_COLLECT_COLLECT,  # 2 items in 4 actions
                PATTERN_MCMC_4,               # 2 items alternating
                
                # Medium density
                PATTERN_MOVE_COLLECT,  # Classic simple repeat
                PATTERN_MMC_3,         # Spacing
                PATTERN_MCM_3,         # Classic with spacing
            ],
            'while_loop_logic': [
                # [UPDATED] While loops with condition-aware patterns
                PATTERN_WHILE_GEM,           # isOnGem() - collect/move
                PATTERN_WHILE_SWITCH,        # isOnSwitch() - toggle/move
                PATTERN_WHILE_COLLECT_TURN,  # Complex with turn
                
                # Legacy patterns
                PATTERN_MOVE_COLLECT,
                PATTERN_MOVE_TOGGLE,
                PATTERN_MMC_3,
            ],
            'variable_logic': [
                # [NEW] Variable-based patterns
                PATTERN_ALTERNATING_CS,      # i % 2 alternating
                PATTERN_PERIODIC_3,          # i % 3 periodic
                PATTERN_PROGRESSIVE_SPACING, # Increasing spacing
                
                # Fallback
                PATTERN_MOVE_COLLECT,
            ],
            'pedagogical_logic': [
                # [NEW] Pedagogical strategy-specific patterns
                PATTERN_FUNCTION_REUSE,      # Hub-spoke identical
                PATTERN_CONDITIONAL_BRANCH,  # Branching with decoy
                PATTERN_DECREASING_LOOP,     # Spiral decreasing
                PATTERN_RADIAL_ITERATION,    # Star radial
                PATTERN_ALTERNATING_CS,      # S-shape alternating
            ],
            'sequence_logic': [
                # Sequences just need basic patterns
                PATTERN_MOVE_COLLECT,
                PATTERN_MOVE_TOGGLE,
            ],
            'default': [
                PATTERN_MOVE_COLLECT,
            ]
        }
    
    def get_patterns(self, logic_type: str) -> List[Pattern]:
        """Get all patterns for a given logic type."""
        return self._patterns.get(logic_type, self._patterns['default'])
    
    def filter_by_segment_length(self, patterns: List[Pattern], segment_length: int) -> List[Pattern]:
        """Filter patterns that can fit in the given segment length."""
        return [p for p in patterns if p.min_segment_length <= segment_length]
    
    def filter_by_corner(self, patterns: List[Pattern], has_corner_after: bool) -> List[Pattern]:
        """Filter patterns based on corner requirements."""
        return [p for p in patterns if not p.requires_corner or has_corner_after]
    
    def select_best_pattern(self, valid_patterns: List[Pattern], segment_length: int) -> Optional[Pattern]:
        """
        Select the best pattern for a segment using multi-criteria scoring.
        
        Priority:
        1. diversity_score (higher = better)
        2. fit quality (less remainder = better)
        3. pattern length (shorter = more repeats)
        """
        if not valid_patterns:
            return FALLBACK_PATTERN
        
        def score(pattern: Pattern) -> tuple:
            remainder = segment_length % pattern.length
            num_repeats = segment_length // pattern.length
            
            return (
                pattern.diversity_score * 1000,   # Primary
                -remainder * 10,                   # Secondary (negative = better)
                -pattern.length,                   # Tertiary
                num_repeats                        # Bonus
            )
        
        return max(valid_patterns, key=score)
    
    def get_while_loop_patterns(self) -> List[Pattern]:
        """Get patterns suitable for while loops."""
        return self._patterns.get('while_loop_logic', [])
    
    def get_variable_patterns(self) -> List[Pattern]:
        """Get patterns for variable-based placement."""
        return self._patterns.get('variable_logic', [])
    
    def get_pedagogical_patterns(self) -> List[Pattern]:
        """Get patterns for pedagogical strategies."""
        return self._patterns.get('pedagogical_logic', [])
    
    def get_pattern_by_id(self, pattern_id: str) -> Optional[Pattern]:
        """Get a specific pattern by ID."""
        for patterns in self._patterns.values():
            for pattern in patterns:
                if pattern.id == pattern_id:
                    return pattern
        return None
    
    def get_pattern_for_condition(self, condition_type: str) -> Optional[Pattern]:
        """Get pattern suitable for a while loop condition."""
        condition_patterns = {
            'isOnGem': PATTERN_WHILE_GEM,
            'isOnCrystal': PATTERN_WHILE_GEM,
            'isOnSwitch': PATTERN_WHILE_SWITCH,
            'isOnOpenSwitch': PATTERN_WHILE_SWITCH,
            'isOnClosedSwitch': PATTERN_WHILE_SWITCH,
        }
        return condition_patterns.get(condition_type, PATTERN_WHILE_GEM)
    
    def get_pattern_for_strategy(self, strategy: str) -> Optional[Pattern]:
        """Get pattern suitable for a pedagogical strategy."""
        strategy_patterns = {
            'function_reuse': PATTERN_FUNCTION_REUSE,
            'conditional_branching': PATTERN_CONDITIONAL_BRANCH,
            'variable_rate_change': PATTERN_PROGRESSIVE_SPACING,
            'alternating_patterns': PATTERN_ALTERNATING_CS,
            'decreasing_loop': PATTERN_DECREASING_LOOP,
            'radial_iteration': PATTERN_RADIAL_ITERATION,
        }
        return strategy_patterns.get(strategy, PATTERN_MOVE_COLLECT)


# Singleton instance
pattern_library = PatternLibrary()
