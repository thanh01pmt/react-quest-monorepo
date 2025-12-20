"""
Pedagogical Strategy Handler

Maps topology types to pedagogical strategies and implements strategy-specific
placement logic based on teaching concepts.

Strategies:
- function_reuse: Identical patterns per segment (Plus, Star shapes)
- conditional_branching: Decoy items on wrong branches (T shape)
- variable_rate_change: Variable spacing (V shape)
- alternating_patterns: Even/Odd placement (S shape)
- decreasing_loop: Items decrease per layer (Spiral)
- radial_iteration: Identical pattern per arm (Star shape)
"""

from typing import List, Dict, Optional, Tuple
import logging

# [NEW] Import StrategySelector for context-aware strategy selection
from .strategy_selector import StrategySelector, ENHANCED_TOPOLOGY_STRATEGIES

logger = logging.getLogger(__name__)

Coord = Tuple[int, int, int]


# =============================================================================
# STRATEGY DEFINITIONS
# =============================================================================

TOPOLOGY_STRATEGIES = {
    # Hub-Spoke family: function reuse
    'plus_shape': 'function_reuse',
    'star_shape': 'radial_iteration',
    'plus_shape_islands': 'function_reuse',
    
    # Branch family: conditional branching
    't_shape': 'conditional_branching',
    'h_shape': 'conditional_branching',
    'ef_shape': 'conditional_branching',
    
    # Shape family with equal segments
    'v_shape': 'variable_rate_change',
    'u_shape': 'function_reuse',
    's_shape': 'alternating_patterns',
    'z_shape': 'alternating_patterns',
    'l_shape': 'segment_based',
    
    # Linear family
    'spiral_path': 'decreasing_loop',
    'spiral_3d': 'decreasing_loop',
    'zigzag': 'segment_pattern_reuse',
    'staircase': 'segment_pattern_reuse',
    'staircase_3d': 'segment_pattern_reuse',
    'straight_line': 'linear_repeat',
    
    # Square family
    'square_shape': 'function_reuse',
    'triangle': 'segment_based',
    
    # Island family
    'symmetrical_islands': 'island_replication',
    
    # Default
    'default': 'segment_based',
}

# Strategy configurations
STRATEGY_CONFIG = {
    'function_reuse': {
        'identical_patterns': True,
        'item_types': ['crystal'],
        'description': 'All segments use identical patterns for PROCEDURE reuse'
    },
    'conditional_branching': {
        'place_decoys': True,
        'decoy_type': 'switch',
        'description': 'Place decoy items on wrong branches'
    },
    'variable_rate_change': {
        'spacing_pattern': 'increasing_decreasing',
        'description': 'Spacing increases then decreases (1→2→3→2→1)'
    },
    'alternating_patterns': {
        'pattern': ['crystal', 'switch'],
        'description': 'Alternate between crystal and switch'
    },
    'decreasing_loop': {
        'decrease_per_layer': True,
        'description': 'Items decrease per layer/ring'
    },
    'radial_iteration': {
        'identical_per_arm': True,
        'description': 'Identical pattern on each radial arm'
    },
    'segment_pattern_reuse': {
        'reuse_pattern': True,
        'description': 'Reuse same pattern across segments'
    },
    'linear_repeat': {
        'simple_repeat': True,
        'description': 'Simple repeating pattern'
    },
    'island_replication': {
        'replicate_pattern': True,
        'description': 'Same pattern replicated on each island'
    },
    'segment_based': {
        'default': True,
        'description': 'Default segment-based placement'
    }
}


class PedagogicalStrategyHandler:
    """
    Handles placement based on pedagogical strategies derived from topology type.
    
    [ENHANCED] Now integrates with StrategySelector for context-aware selection
    based on difficulty_code, bloom_level_codes, and context_codes.
    
    [ENHANCED] Also applies PatternComplexityModifier for difficulty-based
    pattern modifications after item placement.
    """
    
    def __init__(self):
        # [NEW] Initialize StrategySelector for smart selection
        self.strategy_selector = StrategySelector()
        
        # [NEW] Initialize PatternComplexityModifier for difficulty adjustments
        from .pattern_complexity_modifier import PatternComplexityModifier
        self.complexity_modifier = PatternComplexityModifier()
    
    def _apply_difficulty_modifications(
        self, 
        items: List[dict], 
        params: dict,
        topology_type: str
    ) -> List[dict]:
        """
        Apply difficulty-based pattern modifications to placed items.
        
        EASY: Make patterns obvious (grouped types, regular intervals)
        MEDIUM: Add minor variations (slight spacing changes)
        HARD: Obscure patterns (interleaved types, hidden regularity)
        
        This changes cognitive difficulty without changing item count.
        """
        difficulty_code = params.get('difficulty_code', 'MEDIUM')
        
        # Get pattern type for this difficulty/topology
        pattern_type = self.strategy_selector.get_difficulty_pattern(
            topology_type, difficulty_code
        )
        
        # Apply complexity modifications
        modified_items = self.complexity_modifier.apply_difficulty(
            items, difficulty_code, pattern_type
        )
        
        if modified_items != items:
            logger.info(
                f"Applied difficulty modifications: {difficulty_code} pattern={pattern_type}, "
                f"items={len(items)}"
            )
        
        return modified_items
    
    def get_strategy_for_topology(self, topology_type: str, params: dict = None) -> str:
        """
        Get the pedagogical strategy for a topology type.
        
        [ENHANCED] Uses StrategySelector for context-aware selection when params provided.
        Falls back to legacy TOPOLOGY_STRATEGIES for backward compatibility.
        
        Returns:
            Strategy name string (e.g., 'function_reuse')
        """
        if params:
            # [NEW] Context-aware selection using StrategySelector
            config = self.strategy_selector.select_strategy(topology_type, params)
            # Extract primary strategy string from StrategyConfig
            strategy = config.primary if hasattr(config, 'primary') else str(config)
            logger.debug(f"Context-aware strategy selection: {topology_type} -> {strategy}")
            return strategy
        
        # Legacy fallback
        return TOPOLOGY_STRATEGIES.get(topology_type, TOPOLOGY_STRATEGIES['default'])
    
    def get_strategy_config(self, strategy: str) -> dict:
        """Get configuration for a strategy."""
        return STRATEGY_CONFIG.get(strategy, STRATEGY_CONFIG['segment_based'])
    
    def _get_item_types(self, params: dict) -> List[str]:
        """
        Get item types to place from params.
        
        Reads items_to_place from curriculum, defaults to ['crystal', 'switch']
        if not specified.
        """
        items_to_place = params.get('items_to_place', [])
        
        # Parse if string
        if isinstance(items_to_place, str):
            # Handle format like "['switch', 'crystal']"
            items_to_place = items_to_place.strip("[]'").replace("'", "").split(", ")
        
        # Filter to valid item types
        valid_types = ['crystal', 'switch', 'gem']
        items_to_place = [i.strip() for i in items_to_place if i.strip() in valid_types]
        
        # Default to crystal and switch if empty
        if not items_to_place:
            items_to_place = ['crystal', 'switch']
        
        return items_to_place
    
    def _get_next_item_type(self, item_types: List[str], index: int) -> str:
        """Get item type at index, cycling through available types."""
        if not item_types:
            return 'crystal'
        return item_types[index % len(item_types)]
    
    def apply_strategy(
        self,
        path_info,
        params: dict,
        build_layout_fn
    ) -> Optional[dict]:
        """
        Apply pedagogical strategy to placement.
        
        [ENHANCED] Now uses context-aware strategy selection based on curriculum params.
        
        Returns placement result if strategy applied, None to use default.
        """
        metadata = path_info.metadata or {}
        topology_type = metadata.get('topology_type', '')
        
        # [ENHANCED] Get strategy with context-aware selection
        strategy = metadata.get('pedagogical_strategy') or self.get_strategy_for_topology(topology_type, params)
        
        if not strategy:
            return None
        
        # [NEW] Log curriculum context for debugging
        difficulty_code = params.get('difficulty_code', 'N/A')
        bloom_levels = params.get('bloom_level_codes', [])
        context_codes = params.get('context_codes', [])
        logger.info(
            f"Applying pedagogical strategy '{strategy}' for topology '{topology_type}' "
            f"[difficulty={difficulty_code}, bloom={bloom_levels}, context={context_codes}]"
        )
        
        # Dispatch to strategy handler
        if strategy == 'function_reuse':
            return self._apply_function_reuse(path_info, params, build_layout_fn)
        elif strategy == 'conditional_branching':
            return self._apply_conditional_branching(path_info, params, build_layout_fn)
        elif strategy == 'variable_rate_change':
            return self._apply_variable_rate_change(path_info, params, build_layout_fn)
        elif strategy == 'alternating_patterns':
            return self._apply_alternating_patterns(path_info, params, build_layout_fn)
        elif strategy == 'decreasing_loop':
            return self._apply_decreasing_loop(path_info, params, build_layout_fn)
        elif strategy == 'radial_iteration':
            return self._apply_radial_iteration(path_info, params, build_layout_fn)
        elif strategy == 'segment_based':
            return self._apply_segment_based(path_info, params, build_layout_fn)
        
        # Strategies that use default segment-based
        return None
    
    def _apply_function_reuse(
        self,
        path_info,
        params: dict,
        build_layout_fn
    ) -> Optional[dict]:
        """
        Apply function_reuse strategy: All segments have IDENTICAL patterns.
        
        This teaches PROCEDURE reuse - student writes one function, calls multiple times.
        """
        metadata = path_info.metadata or {}
        segments = metadata.get('segments', [])
        logic_type = params.get('logic_type', 'function_logic')
        
        if len(segments) < 2:
            return None
        
        items = []
        used = set()
        used.add(tuple(path_info.start_pos))
        used.add(tuple(path_info.target_pos))
        
        # Use shortest segment to determine pattern
        min_len = min(len(s) for s in segments if s)
        items_per_segment = min(3, max(1, min_len // 2))
        
        # IDENTICAL pattern: place items at same relative positions in each segment
        for seg_idx, segment in enumerate(segments):
            if not segment:
                continue
            
            for item_idx in range(items_per_segment):
                pos_idx = (item_idx + 1) * 2 - 1  # 1, 3, 5...
                if pos_idx >= len(segment):
                    continue
                
                pos = segment[pos_idx]
                pos_tuple = tuple(pos)
                
                if pos_tuple in used:
                    continue
                
                # Use alternating item types from curriculum
                item_types = self._get_item_types(params)
                item_type = self._get_next_item_type(item_types, item_idx)
                
                items.append({
                    'type': item_type,
                    'pos': pos,
                    'position': list(pos),
                    'pattern_id': f'function_reuse_{seg_idx}_{item_idx}',
                    'segment_idx': seg_idx,
                    'identical_pattern': True
                })
                used.add(pos_tuple)
        
        if len(items) < 3:
            return None
        
        # [NEW] Apply difficulty-based pattern modifications
        topology_type = metadata.get('topology_type', '')
        items = self._apply_difficulty_modifications(items, params, topology_type)
        
        logger.info(f"function_reuse: Placed {len(items)} items (identical pattern) across {len(segments)} segments")
        return build_layout_fn(path_info, items, logic_type)
    
    def _apply_conditional_branching(
        self,
        path_info,
        params: dict,
        build_layout_fn
    ) -> Optional[dict]:
        """
        Apply conditional_branching strategy: Place decoy items on wrong branches.
        
        This teaches conditional logic - student learns to choose correct path.
        """
        metadata = path_info.metadata or {}
        branches = metadata.get('branches', [])
        main_path = metadata.get('main_path', [])
        logic_type = params.get('logic_type', 'function_logic')
        
        if not branches or len(branches) < 2:
            return None
        
        items = []
        used = set()
        used.add(tuple(path_info.start_pos))
        used.add(tuple(path_info.target_pos))
        
        # Find which branch leads to goal
        goal_pos = tuple(path_info.target_pos)
        goal_branch_idx = -1
        
        for idx, branch in enumerate(branches):
            if branch and tuple(branch[-1]) == goal_pos:
                goal_branch_idx = idx
                break
        
        # Place crystals on main path / correct branch
        # Place DECOY switch on wrong branches
        for idx, branch in enumerate(branches):
            if not branch or len(branch) < 2:
                continue
            
            is_wrong_branch = idx != goal_branch_idx and goal_branch_idx >= 0
            
            for i, pos in enumerate(branch[1:], 1):  # Skip first (junction)
                pos_tuple = tuple(pos)
                if pos_tuple in used:
                    continue
                
                if is_wrong_branch and i == len(branch) - 1:
                    # Place decoy switch at end of wrong branch
                    items.append({
                        'type': 'switch',
                        'pos': pos,
                        'position': list(pos),
                        'pattern_id': f'decoy_branch_{idx}',
                        'decoy': True
                    })
                else:
                    # Place crystal
                    items.append({
                        'type': 'crystal',
                        'pos': pos,
                        'position': list(pos),
                        'pattern_id': f'branch_{idx}_{i}'
                    })
                used.add(pos_tuple)
        
        if len(items) < 2:
            return None
        
        # [NEW] Apply difficulty-based pattern modifications
        items = self._apply_difficulty_modifications(items, params, metadata.get('topology_type', ''))
        
        logger.info(f"conditional_branching: Placed {len(items)} items with decoys on wrong branches")
        return build_layout_fn(path_info, items, logic_type)
    
    def _apply_variable_rate_change(
        self,
        path_info,
        params: dict,
        build_layout_fn
    ) -> Optional[dict]:
        """
        Apply variable_rate_change strategy: Spacing increases then decreases.
        
        This teaches variable manipulation - student learns to track changing values.
        V-shape: spacing 1→2→3→2→1
        """
        metadata = path_info.metadata or {}
        segments = metadata.get('segments', [])
        logic_type = params.get('logic_type', 'function_logic')
        
        if not segments:
            return None
        
        items = []
        used = set()
        used.add(tuple(path_info.start_pos))
        used.add(tuple(path_info.target_pos))
        
        # Flatten segments for linear processing
        all_coords = []
        for seg in segments:
            if seg:
                all_coords.extend(seg)
        
        # Variable spacing: 1, 2, 3, ... (increasing)
        spacing = 1
        i = 1
        phase = 'increasing'
        mid_point = len(all_coords) // 2
        
        while i < len(all_coords) - 1:
            pos = all_coords[i]
            pos_tuple = tuple(pos)
            
            if pos_tuple not in used:
                # Use mixed item types from curriculum
                item_types = self._get_item_types(params)
                item_type = self._get_next_item_type(item_types, len(items))
                
                items.append({
                    'type': item_type,
                    'pos': pos,
                    'position': list(pos),
                    'pattern_id': f'var_spacing_{spacing}',
                    'spacing': spacing
                })
                used.add(pos_tuple)
            
            # Update spacing and move to next
            i += spacing
            
            # Change phase at midpoint
            if i >= mid_point and phase == 'increasing':
                phase = 'decreasing'
            
            if phase == 'increasing' and spacing < 3:
                spacing += 1
            elif phase == 'decreasing' and spacing > 1:
                spacing -= 1
        
        if len(items) < 3:
            return None
        
        # [NEW] Apply difficulty-based pattern modifications
        items = self._apply_difficulty_modifications(items, params, metadata.get('topology_type', ''))
        
        logger.info(f"variable_rate_change: Placed {len(items)} items with variable spacing")
        return build_layout_fn(path_info, items, logic_type)
    
    def _apply_alternating_patterns(
        self,
        path_info,
        params: dict,
        build_layout_fn
    ) -> Optional[dict]:
        """
        Apply alternating_patterns strategy: Crystal at even, switch at odd positions.
        
        This teaches modulo/even-odd logic.
        """
        metadata = path_info.metadata or {}
        segments = metadata.get('segments', [])
        logic_type = params.get('logic_type', 'function_logic')
        
        items = []
        used = set()
        used.add(tuple(path_info.start_pos))
        used.add(tuple(path_info.target_pos))
        
        item_count = 0
        
        for seg_idx, segment in enumerate(segments):
            if not segment:
                continue
            
            for pos_idx, pos in enumerate(segment):
                pos_tuple = tuple(pos)
                if pos_tuple in used:
                    continue
                
                # Every 2nd position gets an item
                if pos_idx % 2 == 1:
                    # Alternate crystal/switch based on global count
                    item_type = 'crystal' if item_count % 2 == 0 else 'switch'
                    items.append({
                        'type': item_type,
                        'pos': pos,
                        'position': list(pos),
                        'pattern_id': f'alternating_{seg_idx}_{pos_idx}',
                        'alternating_idx': item_count
                    })
                    used.add(pos_tuple)
                    item_count += 1
        
        if len(items) < 2:
            return None
        
        # [NEW] Apply difficulty-based pattern modifications
        items = self._apply_difficulty_modifications(items, params, metadata.get('topology_type', ''))
        
        logger.info(f"alternating_patterns: Placed {len(items)} items (crystal/switch alternating)")
        return build_layout_fn(path_info, items, logic_type)
    
    def _apply_decreasing_loop(
        self,
        path_info,
        params: dict,
        build_layout_fn
    ) -> Optional[dict]:
        """
        Apply decreasing_loop strategy: Items decrease per layer/ring.
        
        This teaches while-loop with decreasing counter.
        Spiral: outer ring has more items, inner has fewer.
        """
        metadata = path_info.metadata or {}
        segments = metadata.get('segments', [])
        logic_type = params.get('logic_type', 'function_logic')
        
        if not segments:
            return None
        
        items = []
        used = set()
        used.add(tuple(path_info.start_pos))
        used.add(tuple(path_info.target_pos))
        
        # Items per segment decreases: 3, 2, 1, 1, ...
        items_per_segment = 3
        
        for seg_idx, segment in enumerate(segments):
            if not segment:
                continue
            
            # Place items_per_segment items in this segment
            step = max(1, len(segment) // (items_per_segment + 1))
            
            for i in range(items_per_segment):
                pos_idx = (i + 1) * step
                if pos_idx >= len(segment):
                    continue
                
                pos = segment[pos_idx]
                pos_tuple = tuple(pos)
                
                if pos_tuple in used:
                    continue
                
                # Use mixed item types from curriculum
                item_types = self._get_item_types(params)
                item_type = self._get_next_item_type(item_types, len(items))
                
                items.append({
                    'type': item_type,
                    'pos': pos,
                    'position': list(pos),
                    'pattern_id': f'layer_{seg_idx}_item_{i}',
                    'layer': seg_idx,
                    'items_in_layer': items_per_segment
                })
                used.add(pos_tuple)
            
            # Decrease for next segment
            if items_per_segment > 1:
                items_per_segment -= 1
        
        if len(items) < 3:
            return None
        
        # [NEW] Apply difficulty-based pattern modifications
        items = self._apply_difficulty_modifications(items, params, metadata.get('topology_type', ''))
        
        logger.info(f"decreasing_loop: Placed {len(items)} items (decreasing per layer)")
        return build_layout_fn(path_info, items, logic_type)
    
    def _apply_radial_iteration(
        self,
        path_info,
        params: dict,
        build_layout_fn
    ) -> Optional[dict]:
        """
        Apply radial_iteration strategy: Identical pattern on each radial arm.
        
        This teaches loop with rotation - process each arm identically.
        """
        metadata = path_info.metadata or {}
        branches = metadata.get('branches', [])
        logic_type = params.get('logic_type', 'function_logic')
        
        if len(branches) < 3:
            return None
        
        items = []
        used = set()
        used.add(tuple(path_info.start_pos))
        used.add(tuple(path_info.target_pos))
        
        # Identical pattern for each arm
        min_arm_len = min(len(b) for b in branches if b)
        items_per_arm = min(2, max(1, min_arm_len - 1))
        
        for arm_idx, arm in enumerate(branches):
            if not arm or len(arm) < 2:
                continue
            
            for item_idx in range(items_per_arm):
                pos_idx = item_idx + 1  # Skip center
                if pos_idx >= len(arm):
                    continue
                
                pos = arm[pos_idx]
                pos_tuple = tuple(pos)
                
                if pos_tuple in used:
                    continue
                
                # Use mixed item types from curriculum
                item_types = self._get_item_types(params)
                item_type = self._get_next_item_type(item_types, len(items))
                
                items.append({
                    'type': item_type,
                    'pos': pos,
                    'position': list(pos),
                    'pattern_id': f'arm_{arm_idx}_item_{item_idx}',
                    'arm_idx': arm_idx,
                    'radial_pattern': True
                })
                used.add(pos_tuple)
        
        if len(items) < 3:
            return None
        
        # [NEW] Apply difficulty-based pattern modifications
        items = self._apply_difficulty_modifications(items, params, metadata.get('topology_type', ''))
        
        logger.info(f"radial_iteration: Placed {len(items)} items (identical per arm) across {len(branches)} arms")
        return build_layout_fn(path_info, items, logic_type)
    
    def _apply_segment_based(
        self,
        path_info,
        params: dict,
        build_layout_fn
    ) -> Optional[dict]:
        """
        Apply segment_based strategy: Distribute items across path with target density.
        
        For complex mazes and fallback cases. Ensures mixed item types from curriculum.
        """
        metadata = path_info.metadata or {}
        segments = metadata.get('segments', [])
        logic_type = params.get('logic_type', 'function_logic')
        # Use placement_coords for density calculation (total blocks in map)
        placement_coords = path_info.placement_coords or path_info.path_coords or []
        total_blocks = len(placement_coords)
        
        all_coords = []
        if segments:
            for seg in segments:
                if seg:
                    all_coords.extend(seg)
        else:
            all_coords = list(path_info.path_coords or [])
        
        if len(all_coords) < 4:
            return None
        
        items = []
        used = set()
        used.add(tuple(path_info.start_pos))
        used.add(tuple(path_info.target_pos))
        
        # Get item types from curriculum
        item_types = self._get_item_types(params)
        
        # Target density: 22% for function_logic to ensure >= 15% after validation
        # The validation uses different block count (may include obstacles etc.)
        # Also ensure minimum 5 items for PROCEDURE detection
        target_density = 0.22 if logic_type == 'function_logic' else 0.15
        min_items = 5 if logic_type == 'function_logic' else 3
        target_count = max(min_items, int(total_blocks * target_density))
        
        # Calculate step to achieve target density, using available positions
        available_positions = len(all_coords) - 2  # Exclude start/goal
        step = max(1, available_positions // target_count) if target_count > 0 else 2
        
        placed_count = 0
        for i, pos in enumerate(all_coords):
            pos_tuple = tuple(pos)
            if pos_tuple in used:
                continue
            
            # Place at step intervals
            if placed_count >= target_count:
                break
            
            # Use step-based placement but ensure we reach target
            if i % max(1, step) != 1 and placed_count < target_count - 2:
                continue
            
            item_type = self._get_next_item_type(item_types, len(items))
            
            items.append({
                'type': item_type,
                'pos': pos,
                'position': list(pos),
                'pattern_id': f'segment_{placed_count}',
                'segment_based': True
            })
            used.add(pos_tuple)
            placed_count += 1
        
        # Require minimum items for function_logic to enable PROCEDURE detection
        if len(items) < min_items:
            return None
        
        # [NEW] Apply difficulty-based pattern modifications
        items = self._apply_difficulty_modifications(items, params, metadata.get('topology_type', ''))
        
        actual_density = len(items) / total_blocks * 100 if total_blocks > 0 else 0
        logger.info(f"segment_based: Placed {len(items)} items with {len(set(i['type'] for i in items))} types ({actual_density:.1f}% density)")
        return build_layout_fn(path_info, items, logic_type)

