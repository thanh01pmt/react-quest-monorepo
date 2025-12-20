"""
Strategy Selector

Selects pedagogical strategies based on curriculum context and topology type.
Implements multi-strategy support where each topology can have primary and
secondary strategies, with selection based on Bloom levels, difficulty, etc.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional, Tuple, Any
import logging
import random

logger = logging.getLogger(__name__)

Coord = Tuple[int, int, int]


# =============================================================================
# DATA CLASSES
# =============================================================================

@dataclass
class StrategyConfig:
    """
    Configuration for a topology's pedagogical strategies.
    
    Attributes:
        primary: Main strategy for this topology
        secondary: Alternative strategies that can be used
        inherits_from: Topologies whose strategies can also apply
        difficulty_patterns: Mapping of difficulty to pattern type
    """
    primary: str
    secondary: List[str] = field(default_factory=list)
    inherits_from: List[str] = field(default_factory=list)
    difficulty_patterns: Dict[str, str] = field(default_factory=dict)
    
    @classmethod
    def from_string(cls, strategy: str) -> 'StrategyConfig':
        """Backward compatibility: wrap string strategy in StrategyConfig."""
        return cls(primary=strategy, secondary=[], inherits_from=[])
    
    @classmethod
    def from_dict(cls, data: dict) -> 'StrategyConfig':
        """Create from dictionary configuration."""
        return cls(
            primary=data.get('primary', 'segment_based'),
            secondary=data.get('secondary', []),
            inherits_from=data.get('inherits_from', []),
            difficulty_patterns=data.get('difficulty_patterns', {})
        )


@dataclass
class SemanticPair:
    """
    A valid start/end pair for a topology with associated metadata.
    
    Attributes:
        name: Descriptive name for this pair
        start: Semantic position key for start (e.g., 'center', 'left_end')
        end: Semantic position key for end
        path_type: Type of traversal (e.g., 'single_branch', 'full_traversal')
        strategies: List of compatible strategy names
        difficulty: Difficulty level this pair is appropriate for
        teaching_goal: Description of pedagogical intent
    """
    name: str
    start: str
    end: str
    path_type: str = 'default'
    strategies: List[str] = field(default_factory=list)
    difficulty: str = 'MEDIUM'
    teaching_goal: str = ''
    
    @classmethod
    def from_dict(cls, data: dict) -> 'SemanticPair':
        """Create from dictionary."""
        return cls(
            name=data.get('name', 'default'),
            start=data.get('start', ''),
            end=data.get('end', ''),
            path_type=data.get('path_type', 'default'),
            strategies=data.get('strategies', []),
            difficulty=data.get('difficulty', 'MEDIUM'),
            teaching_goal=data.get('teaching_goal', '')
        )


# =============================================================================
# ENHANCED TOPOLOGY STRATEGIES
# =============================================================================

ENHANCED_TOPOLOGY_STRATEGIES: Dict[str, Dict[str, Any]] = {
    # Hub-Spoke family
    'plus_shape': {
        'primary': 'function_reuse',
        'secondary': ['l_shape_logic', 'radial_symmetry', 'hub_spoke'],
        'inherits_from': ['l_shape'],
        'difficulty_patterns': {
            'EASY': 'identical_per_branch',
            'MEDIUM': 'mostly_identical_with_exception',
            'HARD': 'hidden_progressive_pattern'
        }
    },
    'star_shape': {
        'primary': 'radial_iteration',
        'secondary': ['function_reuse', 'hub_spoke'],
        'inherits_from': ['plus_shape'],
        'difficulty_patterns': {
            'EASY': 'identical_per_arm',
            'MEDIUM': 'varied_arm_lengths',
            'HARD': 'progressive_arm_pattern'
        }
    },
    'plus_shape_islands': {
        'primary': 'function_reuse',
        'secondary': ['island_replication', 'hub_spoke'],
        'inherits_from': ['plus_shape'],
        'difficulty_patterns': {
            'EASY': 'identical_per_island',
            'MEDIUM': 'varied_island_patterns',
            'HARD': 'cross_island_pattern'
        }
    },
    
    # Branch family
    't_shape': {
        'primary': 'conditional_branching',
        'secondary': ['function_reuse', 'l_shape_logic'],
        'inherits_from': ['l_shape'],
        'difficulty_patterns': {
            'EASY': 'clear_branch_choice',
            'MEDIUM': 'branch_with_decoy',
            'HARD': 'multi_path_optimization'
        }
    },
    'ef_shape': {
        'primary': 'function_reuse',
        'secondary': ['conditional_branching', 'spine_branch'],
        'inherits_from': ['t_shape'],
        'difficulty_patterns': {
            'EASY': 'identical_per_branch',
            'MEDIUM': 'branch_length_variation',
            'HARD': 'nested_patterns'
        }
    },
    'h_shape': {
        'primary': 'function_reuse',
        'secondary': ['parallel_bars', 'bridge_crossing'],
        'inherits_from': ['straight_line'],
        'difficulty_patterns': {
            'EASY': 'identical_bars',
            'MEDIUM': 'varied_bar_patterns',
            'HARD': 'cross_bar_pattern'
        }
    },
    
    # Corner family
    'l_shape': {
        'primary': 'segment_pattern_reuse',
        'secondary': ['corner_logic', 'alternating_patterns'],
        'inherits_from': [],
        'difficulty_patterns': {
            'EASY': 'identical_segments',
            'MEDIUM': 'segment_with_corner_special',
            'HARD': 'progressive_segment_pattern'
        }
    },
    'u_shape': {
        'primary': 'segment_pattern_reuse',
        'secondary': ['symmetric_traversal', 'function_reuse'],
        'inherits_from': ['l_shape'],
        'difficulty_patterns': {
            'EASY': 'symmetric_arms',
            'MEDIUM': 'arm_variation',
            'HARD': 'hidden_symmetry'
        }
    },
    'v_shape': {
        'primary': 'variable_rate_change',
        'secondary': ['convergence_point', 'symmetric_arms'],
        'inherits_from': [],
        'difficulty_patterns': {
            'EASY': 'clear_apex',
            'MEDIUM': 'variable_spacing',
            'HARD': 'fibonacci_spacing'
        }
    },
    's_shape': {
        'primary': 'alternating_patterns',
        'secondary': ['segment_pattern_reuse', 'zigzag_logic'],
        'inherits_from': ['zigzag'],
        'difficulty_patterns': {
            'EASY': 'clear_alternation',
            'MEDIUM': 'grouped_alternation',
            'HARD': 'hidden_alternation'
        }
    },
    
    # Spiral family
    'spiral': {
        'primary': 'decreasing_loop',
        'secondary': ['ring_iteration', 'progressive_spacing'],
        'inherits_from': [],
        'difficulty_patterns': {
            'EASY': 'items_decrease_per_layer',
            'MEDIUM': 'items_with_layer_skips',
            'HARD': 'non_obvious_decrease'
        }
    },
    'spiral_3d': {
        'primary': 'decreasing_loop',
        'secondary': ['height_variation', 'ring_iteration'],
        'inherits_from': ['spiral'],
        'difficulty_patterns': {
            'EASY': 'per_level_pattern',
            'MEDIUM': 'cross_level_pattern',
            'HARD': 'spiral_up_pattern'
        }
    },
    
    # Arrow family
    'arrow_shape': {
        'primary': 'strategic_zones',
        'secondary': ['v_shape_convergence', 'parallel_wings'],
        'inherits_from': ['v_shape'],
        'difficulty_patterns': {
            'EASY': 'zone_based_simple',
            'MEDIUM': 'wing_symmetry',
            'HARD': 'optimization_paths'
        }
    },
    
    # Path family
    'straight_line': {
        'primary': 'alternating_patterns',
        'secondary': ['progressive_spacing', 'segment_based'],
        'inherits_from': [],
        'difficulty_patterns': {
            'EASY': 'regular_spacing',
            'MEDIUM': 'grouped_items',
            'HARD': 'variable_spacing'
        }
    },
    'zigzag': {
        'primary': 'segment_pattern_reuse',
        'secondary': ['alternating_patterns', 'corner_logic'],
        'inherits_from': ['l_shape'],
        'difficulty_patterns': {
            'EASY': 'identical_segments',
            'MEDIUM': 'direction_based',
            'HARD': 'progressive_segment'
        }
    },
    'interspersed_path': {
        'primary': 'alternating_patterns',
        'secondary': ['noise_with_pattern', 'segment_based'],
        'inherits_from': ['straight_line'],
        'difficulty_patterns': {
            'EASY': 'clear_interspersed',
            'MEDIUM': 'grouped_interspersed',
            'HARD': 'hidden_interspersed'
        }
    },
    
    # Staircase family
    'staircase': {
        'primary': 'segment_pattern_reuse',
        'secondary': ['step_based', 'height_variation'],
        'inherits_from': ['zigzag'],
        'difficulty_patterns': {
            'EASY': 'per_step_pattern',
            'MEDIUM': 'step_group_pattern',
            'HARD': 'cumulative_steps'
        }
    },
    'staircase_3d': {
        'primary': 'segment_pattern_reuse',
        'secondary': ['height_progression', 'layer_based'],
        'inherits_from': ['staircase'],
        'difficulty_patterns': {
            'EASY': 'per_level_pattern',
            'MEDIUM': 'cross_level_pattern',
            'HARD': 'spiral_up'
        }
    },
    
    # Island family
    'symmetrical_islands': {
        'primary': 'island_replication',
        'secondary': ['function_reuse', 'symmetric_traversal'],
        'inherits_from': [],
        'difficulty_patterns': {
            'EASY': 'identical_islands',
            'MEDIUM': 'varied_island_sizes',
            'HARD': 'cross_island_pattern'
        }
    },
    'stepped_island_clusters': {
        'primary': 'segment_based',
        'secondary': ['island_replication', 'height_variation'],
        'inherits_from': ['symmetrical_islands'],
        'difficulty_patterns': {
            'EASY': 'per_cluster_pattern',
            'MEDIUM': 'height_based_pattern',
            'HARD': 'inter_cluster_pattern'
        }
    },
    'hub_with_stepped_islands': {
        'primary': 'function_reuse',
        'secondary': ['hub_spoke', 'island_replication'],
        'inherits_from': ['plus_shape', 'symmetrical_islands'],
        'difficulty_patterns': {
            'EASY': 'identical_per_island',
            'MEDIUM': 'varied_island_patterns',
            'HARD': 'hub_centric_pattern'
        }
    },
    
    # Maze family
    'complex_maze_2d': {
        'primary': 'segment_based',
        'secondary': ['junction_based', 'path_optimization'],
        'inherits_from': [],
        'difficulty_patterns': {
            'EASY': 'segment_based_simple',
            'MEDIUM': 'junction_emphasis',
            'HARD': 'optimization_paths'
        }
    },
    'swift_playground_maze': {
        'primary': 'segment_based',
        'secondary': ['room_based', 'junction_based'],
        'inherits_from': ['complex_maze_2d'],
        'difficulty_patterns': {
            'EASY': 'room_based_simple',
            'MEDIUM': 'corridor_emphasis',
            'HARD': 'multi_path_optimization'
        }
    },
    
    # Grid family
    'grid': {
        'primary': 'row_column_iteration',
        'secondary': ['alternating_patterns', 'diagonal_patterns'],
        'inherits_from': [],
        'difficulty_patterns': {
            'EASY': 'row_based',
            'MEDIUM': 'diagonal_pattern',
            'HARD': 'checkerboard_complex'
        }
    },
    'grid_with_holes': {
        'primary': 'segment_based',
        'secondary': ['island_based', 'path_around_holes'],
        'inherits_from': ['grid'],
        'difficulty_patterns': {
            'EASY': 'avoid_holes_simple',
            'MEDIUM': 'hole_edge_pattern',
            'HARD': 'optimization_around_holes'
        }
    },
    'plowing_field': {
        'primary': 'row_based',
        'secondary': ['alternating_rows', 'serpentine'],
        'inherits_from': ['grid'],
        'difficulty_patterns': {
            'EASY': 'row_by_row',
            'MEDIUM': 'alternating_direction',
            'HARD': 'spiral_plow'
        }
    },
    
    # Other shapes
    'triangle': {
        'primary': 'segment_based',
        'secondary': ['layer_based', 'corner_logic'],
        'inherits_from': ['l_shape'],
        'difficulty_patterns': {
            'EASY': 'side_based',
            'MEDIUM': 'corner_emphasis',
            'HARD': 'height_progression'
        }
    },
    'square': {
        'primary': 'segment_pattern_reuse',
        'secondary': ['corner_based', 'side_identical'],
        'inherits_from': ['l_shape'],
        'difficulty_patterns': {
            'EASY': 'identical_sides',
            'MEDIUM': 'corner_variation',
            'HARD': 'progressive_sides'
        }
    },
}


# =============================================================================
# STRATEGY SELECTOR CLASS
# =============================================================================

class StrategySelector:
    """
    Selects pedagogical strategies based on curriculum context and topology.
    
    This class implements context-aware strategy selection, considering:
    - Bloom level codes for cognitive complexity
    - Difficulty code for pattern complexity
    - Context codes for specific teaching goals
    """
    
    def __init__(self):
        self._strategies = ENHANCED_TOPOLOGY_STRATEGIES
    
    def get_config(self, topology_type: str) -> StrategyConfig:
        """
        Get the strategy configuration for a topology.
        
        Args:
            topology_type: Name of the topology
            
        Returns:
            StrategyConfig with primary, secondary, and inherited strategies
        """
        config_data = self._strategies.get(topology_type)
        
        if config_data is None:
            # Fallback to default
            logger.debug(f"No config for topology '{topology_type}', using default")
            return StrategyConfig(primary='segment_based')
        
        if isinstance(config_data, str):
            # Backward compatibility: string → StrategyConfig
            return StrategyConfig.from_string(config_data)
        
        return StrategyConfig.from_dict(config_data)
    
    def select_strategy(
        self, 
        topology_type: str, 
        params: dict
    ) -> StrategyConfig:
        """
        Select the best strategy based on curriculum context.
        
        Args:
            topology_type: Name of the topology
            params: Curriculum parameters including:
                - bloom_level_codes: List of Bloom levels
                - difficulty_code: EASY, MEDIUM, HARD
                - context_codes: Teaching context hints
                
        Returns:
            StrategyConfig with appropriate strategy selected
        """
        config = self.get_config(topology_type)
        
        # Extract context
        bloom_levels = params.get('bloom_level_codes', [])
        if isinstance(bloom_levels, str):
            bloom_levels = [b.strip() for b in bloom_levels.split(',')]
        
        context_codes = params.get('context_codes', [])
        if isinstance(context_codes, str):
            context_codes = [c.strip() for c in context_codes.split(',')]
        
        # Check if context suggests a specific secondary strategy
        preferred_strategy = self._select_by_context(config, bloom_levels, context_codes)
        
        if preferred_strategy and preferred_strategy in config.secondary:
            # Use secondary strategy as primary for this context
            logger.info(f"Context-based strategy selection: {preferred_strategy} for {topology_type}")
            return StrategyConfig(
                primary=preferred_strategy,
                secondary=[config.primary] + [s for s in config.secondary if s != preferred_strategy],
                inherits_from=config.inherits_from,
                difficulty_patterns=config.difficulty_patterns
            )
        
        return config
    
    def _select_by_context(
        self, 
        config: StrategyConfig,
        bloom_levels: List[str],
        context_codes: List[str]
    ) -> Optional[str]:
        """
        Determine if context suggests a different strategy.
        
        Args:
            config: Base strategy configuration
            bloom_levels: Bloom taxonomy levels
            context_codes: Teaching context hints
            
        Returns:
            Strategy name if context suggests one, None otherwise
        """
        # High-level cognitive tasks may prefer function abstraction
        high_level_bloom = {'CREATE', 'EVALUATE', 'ANALYZE'}
        if any(b.upper() in high_level_bloom for b in bloom_levels):
            if 'function_reuse' in config.secondary:
                return 'function_reuse'
        
        # Context-based hints
        context_strategy_map = {
            'OPTIMIZATION': 'strategic_zones',
            'PATTERN_RECOGNITION': 'alternating_patterns',
            'FUNCTION_USAGE': 'function_reuse',
            'LOOP_ITERATION': 'decreasing_loop',
            'CONDITIONAL_LOGIC': 'conditional_branching',
        }
        
        for context in context_codes:
            if context.upper() in context_strategy_map:
                strategy = context_strategy_map[context.upper()]
                if strategy in config.secondary or strategy == config.primary:
                    return strategy
        
        return None
    
    def select_start_end_pair(
        self,
        topology_type: str,
        params: dict,
        semantic_positions: dict
    ) -> Optional[SemanticPair]:
        """
        Select appropriate start/end pair based on difficulty and strategy.
        
        Args:
            topology_type: Name of the topology
            params: Curriculum parameters with difficulty_code
            semantic_positions: Semantic positions dict from topology metadata
            
        Returns:
            SemanticPair if valid_pairs exist, None otherwise
        """
        valid_pairs = semantic_positions.get('valid_pairs', [])
        
        if not valid_pairs:
            # Fallback to legacy format
            optimal_start = semantic_positions.get('optimal_start')
            optimal_end = semantic_positions.get('optimal_end')
            
            if optimal_start and optimal_end:
                logger.debug(f"Using legacy optimal_start/optimal_end for {topology_type}")
                return SemanticPair(
                    name='legacy_default',
                    start=optimal_start,
                    end=optimal_end,
                    difficulty='MEDIUM'
                )
            return None
        
        # Get difficulty
        difficulty = params.get('difficulty_code', 'MEDIUM').upper()
        
        # Filter by difficulty
        matching_pairs = [
            SemanticPair.from_dict(p) for p in valid_pairs 
            if p.get('difficulty', 'MEDIUM').upper() == difficulty
        ]
        
        if not matching_pairs:
            # Fallback to any pair
            matching_pairs = [SemanticPair.from_dict(p) for p in valid_pairs]
        
        # Get strategy to filter further
        config = self.get_config(topology_type)
        strategy = config.primary
        
        # Filter by compatible strategy
        strategy_matching = [
            p for p in matching_pairs 
            if not p.strategies or strategy in p.strategies
        ]
        
        if strategy_matching:
            matching_pairs = strategy_matching
        
        # Select randomly from matching
        if matching_pairs:
            selected = random.choice(matching_pairs)
            logger.info(f"Selected pair '{selected.name}' for {topology_type} (difficulty={difficulty})")
            return selected
        
        return None
    
    def get_compatible_pairs(
        self,
        topology_type: str,
        strategy: str,
        semantic_positions: dict
    ) -> List[SemanticPair]:
        """
        Get all pairs compatible with a given strategy.
        
        Args:
            topology_type: Name of the topology
            strategy: Strategy name to filter by
            semantic_positions: Semantic positions from metadata
            
        Returns:
            List of compatible SemanticPairs
        """
        valid_pairs = semantic_positions.get('valid_pairs', [])
        
        compatible = []
        for pair_data in valid_pairs:
            pair = SemanticPair.from_dict(pair_data)
            if not pair.strategies or strategy in pair.strategies:
                compatible.append(pair)
        
        return compatible
    
    def get_difficulty_pattern(
        self,
        topology_type: str,
        difficulty_code: str
    ) -> str:
        """
        Get the pattern type for a given difficulty level.
        
        Args:
            topology_type: Name of the topology
            difficulty_code: EASY, MEDIUM, or HARD
            
        Returns:
            Pattern type name (e.g., 'identical_per_branch')
        """
        config = self.get_config(topology_type)
        difficulty = difficulty_code.upper() if difficulty_code else 'MEDIUM'
        
        return config.difficulty_patterns.get(difficulty, 'default')
    
    def get_all_strategies_for_topology(self, topology_type: str) -> List[str]:
        """
        Get all applicable strategies for a topology (primary + secondary + inherited).
        
        Args:
            topology_type: Name of the topology
            
        Returns:
            List of all applicable strategy names
        """
        config = self.get_config(topology_type)
        strategies = [config.primary] + config.secondary
        
        # Add inherited strategies
        for inherited in config.inherits_from:
            inherited_config = self.get_config(inherited)
            strategies.append(inherited_config.primary)
            strategies.extend(inherited_config.secondary)
        
        # Deduplicate while preserving order
        seen = set()
        unique = []
        for s in strategies:
            if s not in seen:
                seen.add(s)
                unique.append(s)
        
        return unique


# =============================================================================
# CONVENIENCE FUNCTIONS
# =============================================================================

def get_strategy_selector() -> StrategySelector:
    """Get a singleton-like StrategySelector instance."""
    return StrategySelector()


def select_strategy_for_context(topology_type: str, params: dict) -> str:
    """
    Convenience function to get primary strategy for a topology and context.
    
    Args:
        topology_type: Name of the topology
        params: Curriculum parameters
        
    Returns:
        Primary strategy name
    """
    selector = get_strategy_selector()
    config = selector.select_strategy(topology_type, params)
    return config.primary
