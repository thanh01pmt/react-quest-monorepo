"""
Topology Classifier

Classifies topologies by their support level for solution-first placement
and selects appropriate placement strategies.

Support Levels:
- FULLY_SUPPORTED: Segment-based placement works perfectly
- PARTIALLY_SUPPORTED: Works but may need fallback for some cases
- FALLBACK_ONLY: No segment structure, use fallback placement
"""

from typing import Dict, List, Tuple
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class SupportLevel(Enum):
    """Support level for solution-first placement."""
    FULLY_SUPPORTED = "fully_supported"
    PARTIALLY_SUPPORTED = "partially_supported"
    FALLBACK_ONLY = "fallback_only"


# =============================================================================
# TOPOLOGY CLASSIFICATIONS
# =============================================================================

TOPOLOGY_CLASSIFICATIONS = {
    # Fully Supported - Segment-based with equal segments
    'fully_supported': [
        'straight_line',
        'spiral_path',
        'spiral_3d',
        'zigzag',
        'star_shape',
        'plowing_field',
        'square_shape',
        'v_shape',
        'u_shape',
        's_shape',
        'z_shape',
        'staircase',
        'staircase_3d',
        'symmetrical_islands',
    ],
    
    # Partially Supported - Works but may need adjustments
    'partially_supported': [
        'l_shape',
        't_shape',
        'h_shape',
        'plus_shape',
        'triangle',
        'ef_shape',
    ],
    
    # Fallback Only - No segment structure
    'fallback_only': [
        'complex_maze_2d',
        'complex_maze',
        'grid_with_holes',
        'arrow_shape',
        'hub_with_stepped_islands',
        'plus_shape_islands',
        'stepped_island_clusters',
        'swift_playground_maze',
    ]
}

# Strategy recommendations per topology
TOPOLOGY_STRATEGY_RECOMMENDATION = {
    # Linear - Simple repeat patterns
    'straight_line': 'pattern_based',
    'spiral_path': 'pattern_based',
    'spiral_3d': 'pattern_based',
    
    # Segment-based - Use segment analysis
    'zigzag': 'segment_based',
    'v_shape': 'segment_based',
    'u_shape': 'segment_based',
    's_shape': 'segment_based',
    'z_shape': 'segment_based',
    'l_shape': 'segment_based',
    'staircase': 'segment_based',
    'staircase_3d': 'segment_based',
    
    # Hub-spoke - Symmetric branch placement
    'plus_shape': 'hub_spoke',
    'star_shape': 'hub_spoke',
    'plus_shape_islands': 'hub_spoke',
    
    # Island - Replicate pattern
    'symmetrical_islands': 'island_replication',
    
    # Shape-based
    'square_shape': 'segment_based',
    'triangle': 'segment_based',
    
    # Branch-based
    't_shape': 'branch_based',
    'h_shape': 'branch_based',
    'ef_shape': 'branch_based',
    'arrow_shape': 'branch_based',
    
    # Default
    'default': 'fallback',
}


class TopologyClassifier:
    """
    Classifies topologies and recommends placement strategies.
    """
    
    def get_support_level(self, topology_type: str) -> SupportLevel:
        """Get the support level for a topology type."""
        if topology_type in TOPOLOGY_CLASSIFICATIONS['fully_supported']:
            return SupportLevel.FULLY_SUPPORTED
        elif topology_type in TOPOLOGY_CLASSIFICATIONS['partially_supported']:
            return SupportLevel.PARTIALLY_SUPPORTED
        elif topology_type in TOPOLOGY_CLASSIFICATIONS['fallback_only']:
            return SupportLevel.FALLBACK_ONLY
        else:
            # Unknown topology - check metadata later
            return SupportLevel.PARTIALLY_SUPPORTED
    
    def select_placement_strategy(self, metadata: dict) -> str:
        """
        Select the best placement strategy based on topology metadata.
        
        Returns strategy name: 'pattern_based', 'segment_based', 'hub_spoke', 
                              'island_replication', 'branch_based', 'fallback'
        """
        topology_type = metadata.get('topology_type', '')
        
        # Check explicit recommendation
        if topology_type in TOPOLOGY_STRATEGY_RECOMMENDATION:
            return TOPOLOGY_STRATEGY_RECOMMENDATION[topology_type]
        
        # Heuristics based on metadata
        if self._has_segments(metadata):
            segments = metadata.get('segments', [])
            if len(segments) >= 3 and self._segments_are_equal(segments):
                return 'segment_based'
            elif len(segments) >= 2:
                return 'segment_based'
        
        if self._has_branches(metadata):
            branches = metadata.get('branches', [])
            if len(branches) >= 3:
                return 'hub_spoke'
            else:
                return 'branch_based'
        
        if self._has_islands(metadata):
            return 'island_replication'
        
        # Default fallback
        return TOPOLOGY_STRATEGY_RECOMMENDATION.get('default', 'fallback')
    
    def is_suitable_for_function_logic(self, topology_type: str) -> bool:
        """
        Check if topology is suitable for function_logic (PROCEDURE generation).
        
        Topologies with equal segments or symmetric branches are best.
        """
        support = self.get_support_level(topology_type)
        return support != SupportLevel.FALLBACK_ONLY
    
    def get_all_fully_supported(self) -> List[str]:
        """Get list of all fully supported topology types."""
        return list(TOPOLOGY_CLASSIFICATIONS['fully_supported'])
    
    def get_all_partially_supported(self) -> List[str]:
        """Get list of all partially supported topology types."""
        return list(TOPOLOGY_CLASSIFICATIONS['partially_supported'])
    
    def get_all_fallback_only(self) -> List[str]:
        """Get list of topology types that only use fallback."""
        return list(TOPOLOGY_CLASSIFICATIONS['fallback_only'])
    
    # =============================================================================
    # Private Helpers
    # =============================================================================
    
    def _has_segments(self, metadata: dict) -> bool:
        """Check if metadata has segment information."""
        return bool(metadata.get('segments') or metadata.get('segment') or 
                   metadata.get('segment_analysis'))
    
    def _has_branches(self, metadata: dict) -> bool:
        """Check if metadata has branch information."""
        return bool(metadata.get('branches'))
    
    def _has_islands(self, metadata: dict) -> bool:
        """Check if metadata has island information."""
        return bool(metadata.get('islands'))
    
    def _segments_are_equal(self, segments: List) -> bool:
        """Check if all segments have approximately equal length."""
        if not segments or len(segments) < 2:
            return False
        
        lengths = [len(s) for s in segments if s]
        if not lengths:
            return False
        
        avg = sum(lengths) / len(lengths)
        # Within 20% of average
        return all(abs(l - avg) <= avg * 0.2 for l in lengths)


# Singleton instance
topology_classifier = TopologyClassifier()
