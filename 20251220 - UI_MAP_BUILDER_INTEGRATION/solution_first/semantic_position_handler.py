"""
Semantic Position Handler

Uses semantic positions from topology metadata to guide special item placements.

Semantic positions provide meaningful locations like:
- center: Hub center for hub-spoke topologies
- left_end, right_end, top_end, bottom_end: Branch endpoints
- valid_pairs: [NEW] Structured start/end pairs with difficulty and strategies
- optimal_start, optimal_end: [DEPRECATED] Use valid_pairs instead
"""

from typing import List, Dict, Optional, Tuple
import logging
import warnings

# [NEW] Import StrategySelector for valid_pairs handling
from .strategy_selector import StrategySelector, SemanticPair

logger = logging.getLogger(__name__)

Coord = Tuple[int, int, int]


class SemanticPositionHandler:
    """
    Handles item placement using semantic positions from topology metadata.
    
    [ENHANCED] Now supports valid_pairs for difficulty-based start/end selection.
    """
    
    def __init__(self):
        # [NEW] Initialize StrategySelector for valid_pairs selection
        self.strategy_selector = StrategySelector()
    
    def apply_semantic_placements(
        self,
        path_info,
        items: List[Dict],
        params: dict
    ) -> List[Dict]:
        """
        Enhance item list with semantic position placements.
        
        Args:
            path_info: PathInfo with semantic_positions in metadata
            items: Existing items to enhance
            params: Placement parameters
        
        Returns:
            Enhanced item list with semantic placements
        """
        metadata = path_info.metadata or {}
        semantic = metadata.get('semantic_positions', {})
        
        if not semantic:
            return items
        
        # Track used positions
        used = set()
        for item in items:
            pos = item.get('pos') or item.get('position')
            if pos:
                used.add(tuple(pos) if isinstance(pos, (list, tuple)) else pos)
        
        used.add(tuple(path_info.start_pos))
        used.add(tuple(path_info.target_pos))
        
        new_items = list(items)
        
        # Rule 1: Place switch at center for hub-spoke
        if 'center' in semantic and semantic['center']:
            center = semantic['center']
            center_tuple = tuple(center) if isinstance(center, (list, tuple)) else center
            
            if center_tuple not in used:
                new_items.append({
                    'type': 'switch',
                    'pos': center,
                    'position': list(center) if isinstance(center, (list, tuple)) else center,
                    'pattern_id': 'semantic_center',
                    'semantic_role': 'hub_switch'
                })
                used.add(center_tuple)
                logger.info(f"Placed switch at semantic center: {center}")
        
        # Rule 2: Place crystals near endpoints
        endpoint_keys = ['left_end', 'right_end', 'top_end', 'bottom_end']
        crystals_at_endpoints = 0
        
        for key in endpoint_keys:
            if key in semantic and semantic[key]:
                pos = semantic[key]
                pos_tuple = tuple(pos) if isinstance(pos, (list, tuple)) else pos
                
                if pos_tuple not in used and crystals_at_endpoints < 4:
                    new_items.append({
                        'type': 'crystal',
                        'pos': pos,
                        'position': list(pos) if isinstance(pos, (list, tuple)) else pos,
                        'pattern_id': f'semantic_{key}',
                        'semantic_role': key
                    })
                    used.add(pos_tuple)
                    crystals_at_endpoints += 1
                    logger.debug(f"Placed crystal at semantic {key}: {pos}")
        
        if crystals_at_endpoints > 0:
            logger.info(f"Placed {crystals_at_endpoints} crystals at semantic endpoints")
        
        return new_items
    
    def select_start_end_pair(
        self,
        path_info,
        params: dict
    ) -> Optional[SemanticPair]:
        """
        [NEW] Select appropriate start/end pair based on difficulty and strategy.
        
        Args:
            path_info: PathInfo with semantic_positions in metadata
            params: Curriculum parameters with difficulty_code
            
        Returns:
            SemanticPair if valid_pairs exist, None otherwise
        """
        metadata = path_info.metadata or {}
        semantic = metadata.get('semantic_positions', {})
        topology_type = metadata.get('topology_type', '')
        
        return self.strategy_selector.select_start_end_pair(
            topology_type, params, semantic
        )
    
    def get_optimal_path_positions(self, metadata: dict) -> Tuple[Optional[Coord], Optional[Coord]]:
        """
        Get optimal start and end positions from semantic metadata.
        
        [DEPRECATED] Use select_start_end_pair() with valid_pairs instead.
        
        Returns:
            (optimal_start, optimal_end) or (None, None) if not defined
        """
        semantic = metadata.get('semantic_positions', {})
        
        # Check for new valid_pairs format first
        valid_pairs = semantic.get('valid_pairs', [])
        if valid_pairs:
            # Log deprecation warning but still support legacy
            logger.debug(
                "valid_pairs available, consider using select_start_end_pair() "
                "instead of get_optimal_path_positions()"
            )
        
        optimal_start_key = semantic.get('optimal_start')
        optimal_end_key = semantic.get('optimal_end')
        
        start_pos = None
        end_pos = None
        
        if optimal_start_key and optimal_start_key in semantic:
            start_pos = semantic[optimal_start_key]
        
        if optimal_end_key and optimal_end_key in semantic:
            end_pos = semantic[optimal_end_key]
        
        return (start_pos, end_pos)
    
    def get_valid_pairs(self, metadata: dict) -> List[SemanticPair]:
        """
        [NEW] Get all valid start/end pairs from metadata.
        
        Args:
            metadata: Topology metadata dict
            
        Returns:
            List of SemanticPair objects
        """
        semantic = metadata.get('semantic_positions', {})
        valid_pairs_data = semantic.get('valid_pairs', [])
        
        return [SemanticPair.from_dict(p) for p in valid_pairs_data]
    
    def get_pair_for_difficulty(
        self, 
        metadata: dict, 
        difficulty: str
    ) -> Optional[SemanticPair]:
        """
        [NEW] Get a pair matching the specified difficulty.
        
        Args:
            metadata: Topology metadata dict
            difficulty: EASY, MEDIUM, or HARD
            
        Returns:
            Matching SemanticPair or None
        """
        pairs = self.get_valid_pairs(metadata)
        difficulty_upper = difficulty.upper() if difficulty else 'MEDIUM'
        
        matching = [p for p in pairs if p.difficulty.upper() == difficulty_upper]
        
        if matching:
            return matching[0]
        
        # Fallback to any pair
        return pairs[0] if pairs else None
    
    def get_branch_endpoints(self, metadata: dict) -> List[Coord]:
        """
        Extract all branch endpoint positions from semantic data.
        """
        semantic = metadata.get('semantic_positions', {})
        endpoints = []
        
        endpoint_keys = ['left_end', 'right_end', 'top_end', 'bottom_end', 
                         'upper_left_point', 'upper_right_point', 
                         'bottom_left_point', 'bottom_right_point']
        
        for key in endpoint_keys:
            if key in semantic and semantic[key]:
                endpoints.append(semantic[key])
        
        return endpoints
    
    def has_hub_center(self, metadata: dict) -> bool:
        """Check if topology has a hub center defined."""
        semantic = metadata.get('semantic_positions', {})
        return 'center' in semantic and semantic['center'] is not None
    
    def has_valid_pairs(self, metadata: dict) -> bool:
        """[NEW] Check if topology has valid_pairs defined."""
        semantic = metadata.get('semantic_positions', {})
        valid_pairs = semantic.get('valid_pairs', [])
        return len(valid_pairs) > 0

