"""
Solution-First Placer

Main placer class that uses topology metadata (segments, corners, segment_analysis)
to place items according to predefined patterns for predictable PROCEDURE generation.

Key Insight: Topology metadata is the GROUND TRUTH - it contains the exact segments
that were generated, not guessed from blocks.

Refactored: Logic extracted into modules:
- solution_generator.py: Expected solution generation
- symmetric_placer.py: Hub-spoke and island placement
- fallback_handler.py: Fallback placement strategies
"""

from typing import List, Dict, Optional, Tuple
import logging

from ..base_placer import BasePlacer
from .pattern_library import PatternLibrary, Pattern, FALLBACK_PATTERN, pattern_library
from .placement_calculator import PlacementCalculator, ItemPlacement
from .solution_generator import SolutionGenerator
from .symmetric_placer import SymmetricPlacer
from .fallback_handler import FallbackHandler
from .pedagogical_strategy_handler import PedagogicalStrategyHandler
from .semantic_position_handler import SemanticPositionHandler
from .topology_classifier import TopologyClassifier, topology_classifier


logger = logging.getLogger(__name__)


# =============================================================================
# CONFIGURATION FLAGS
# =============================================================================

# When True, skip A* solver and use expected solution directly
SKIP_SOLVER = False

# When True, generate expected solution for comparison with solver output
GENERATE_EXPECTED_SOLUTION = True


Coord = Tuple[int, int, int]


class SolutionFirstPlacer(BasePlacer):
    """
    Places items using Solution-First approach:
    1. Analyze topology segments from metadata
    2. Match patterns to segments
    3. Calculate item positions
    4. Verify placements
    
    This approach ensures PROCEDURE diversity by design.
    """
    
    def __init__(self):
        super().__init__()
        self.pattern_library = PatternLibrary()
        self.calculator = PlacementCalculator()
        self.solution_generator = SolutionGenerator()
        self.symmetric_placer = SymmetricPlacer()
        self.fallback_handler = FallbackHandler()
        self.pedagogical_handler = PedagogicalStrategyHandler()
        self.semantic_handler = SemanticPositionHandler()
        self.topology_classifier = TopologyClassifier()
    
    def place_items(
        self,
        path_info,
        params: dict,
        grid_size: tuple = None
    ) -> dict:
        """
        Main entry point for Solution-First placement.
        
        Args:
            path_info: PathInfo object with segments in metadata
            params: Placement parameters including logic_type
            grid_size: Grid dimensions (optional)
        
        Returns:
            Final layout dict with items placed
        """
        logic_type = params.get('logic_type', 'function_logic')
        metadata = path_info.metadata or {}
        segments = metadata.get('segments') or []
        
        # Handle singular 'segment' from linear topologies
        if not segments and 'segment' in metadata:
            logger.info("Converting singular 'segment' to 'segments' list for linear topology")
            segments = [metadata['segment']]
            segment_analysis = {
                'num_segments': 1,
                'lengths': [len(metadata['segment'])],
                'types': ['linear'],
                'min_length': len(metadata['segment']),
                'max_length': len(metadata['segment']),
                'avg_length': float(len(metadata['segment']))
            }
            metadata['segments'] = segments
            metadata['segment_analysis'] = segment_analysis
        else:
            segment_analysis = metadata.get('segment_analysis', {})
        
        corners = metadata.get('corners', [])
        topology_type = metadata.get('topology_type', '')
        
        # =============================================================
        # PEDAGOGICAL STRATEGY PLACEMENT (Highest Priority)
        # =============================================================
        
        # Try pedagogical strategy first if metadata has it
        if metadata.get('pedagogical_strategy') or topology_type:
            result = self.pedagogical_handler.apply_strategy(
                path_info, params, self._build_layout
            )
            if result:
                # Apply semantic positions to enhance placement
                items = result.get('items', [])
                enhanced_items = self.semantic_handler.apply_semantic_placements(
                    path_info, items, params
                )
                result['items'] = enhanced_items
                
                logger.info(f"Using pedagogical strategy for topology '{topology_type}'")
                return result
        
        # =============================================================
        # SYMMETRIC PLACEMENT STRATEGIES (Secondary)
        # =============================================================
        
        # Strategy 1: Hub-Spoke (plus_shape, star_shape, plus_shape_islands)
        if self.symmetric_placer.is_hub_spoke(metadata):
            result = self.symmetric_placer.symmetric_hub_spoke_placement(
                path_info, params, self._build_layout
            )
            if result:
                logger.info("Using Hub-Spoke symmetric placement")
                return result
        
        # Strategy 2: Island Array (symmetrical_islands)
        if self.symmetric_placer.is_island_array(metadata):
            result = self.symmetric_placer.symmetric_island_placement(
                path_info, params, self._build_layout
            )
            if result:
                logger.info("Using Island-Replication symmetric placement")
                return result
        
        # =============================================================
        # STANDARD SEGMENT-BASED PLACEMENT
        # =============================================================
        
        # Fallback if no segment metadata
        if not segments and not segment_analysis:
            logger.warning("No segment metadata found. Using fallback placement.")
            return self.fallback_handler.fallback_placement(
                path_info, params, self._build_layout
            )
        
        # If segments not explicit but segment_analysis exists, reconstruct
        if not segments and segment_analysis:
            segments = self._reconstruct_segments(path_info.path_coords, segment_analysis)
        
        # Linear Merge for fragmented topologies
        if segments:
            avg_len = sum(len(s) for s in segments) / len(segments)
            if avg_len < 4.0:
                logger.info(f"Topology fragmented (avg_len={avg_len:.1f}). Merging {len(segments)} segments.")
                merged_coords = []
                for seg in segments:
                    if not seg:
                        continue
                    if merged_coords and seg[0] == merged_coords[-1]:
                        merged_coords.extend(seg[1:])
                    else:
                        merged_coords.extend(seg)
                segments = [merged_coords]
                segment_analysis = {
                    'lengths': [len(merged_coords)],
                    'types': ['merged_linear'],
                    'min_length': len(merged_coords),
                    'max_length': len(merged_coords),
                    'avg_length': float(len(merged_coords))
                }
        
        # Determine Max Density Constraint
        num_blocks = len(path_info.path_coords)
        max_pattern_density = 1.0
        
        if num_blocks > 30:
            max_pattern_density = 0.30
            logger.info(f"Large map ({num_blocks} blocks). Constraining pattern density to max {max_pattern_density:.0%}")

        # Match patterns to segments
        pattern_matches = self._match_patterns_to_segments(
            segments, segment_analysis, corners, logic_type, max_density=max_pattern_density
        )
        
        # Calculate placements
        placements = self.calculator.calculate_for_all_segments(segments, pattern_matches)
        
        # Filter out invalid placements
        placements = self.calculator.filter_invalid_placements(
            placements, path_info.start_pos, path_info.target_pos, path_info.path_coords
        )
        
        # Verify remaining placements
        success, errors = self.calculator.verify_placements(
            placements, path_info.path_coords, path_info.start_pos, path_info.target_pos
        )
        
        if not success:
            logger.warning(f"Placement verification failed: {errors}")
            return self.fallback_handler.fallback_placement(
                path_info, params, self._build_layout
            )
        
        # Convert to item dicts
        items = self.calculator.to_item_dicts(placements)
        
        # Build final layout
        return self._build_layout(path_info, items, logic_type)

    def _match_patterns_to_segments(
        self,
        segments: List[List[Coord]],
        segment_analysis: dict,
        corners: List[Coord],
        logic_type: str,
        max_density: float = 1.0
    ) -> List[Tuple[int, Pattern]]:
        """Match patterns to each segment."""
        matches = []
        patterns = self.pattern_library.get_patterns(logic_type)
        segment_lengths = segment_analysis.get('lengths', [])
        
        for seg_idx in range(len(segments)):
            seg_length = segment_lengths[seg_idx] if seg_idx < len(segment_lengths) else len(segments[seg_idx])
            has_corner_after = seg_idx < len(corners)
            
            # Filter valid patterns
            valid = self.pattern_library.filter_by_segment_length(patterns, seg_length)
            valid = self.pattern_library.filter_by_corner(valid, has_corner_after)
            
            # Filter by Density
            if max_density < 1.0:
                valid = [p for p in valid if (len(p.item_types) / p.length) <= max_density]
            
            # Select best
            best = self.pattern_library.select_best_pattern(valid, seg_length)
            
            if best:
                matches.append((seg_idx, best))
        
        return matches
    
    def _reconstruct_segments(
        self,
        path_coords: List[Coord],
        segment_analysis: dict
    ) -> List[List[Coord]]:
        """Reconstruct segment coordinate lists from path_coords and segment_analysis."""
        segments = []
        lengths = segment_analysis.get('lengths', [])
        
        current_idx = 0
        for seg_len in lengths:
            end_idx = current_idx + seg_len
            if end_idx <= len(path_coords):
                segments.append(path_coords[current_idx:end_idx])
            current_idx = end_idx
        
        return segments
    
    def _build_layout(self, path_info, items: List[Dict], logic_type: str = 'function_logic') -> dict:
        """Build final layout dict from path_info and items."""
        obstacles = path_info.obstacles or []
        
        # Base layout from parent
        layout = self._base_layout(path_info, items, obstacles)
        
        # Generate expected solution if enabled
        if GENERATE_EXPECTED_SOLUTION:
            expected = self.solution_generator.generate_expected_solution(
                path_info, items, logic_type
            )
            layout['expected_solution'] = expected
        
        return layout


# =============================================================================
# BACKWARD COMPATIBILITY - Keep old method names as aliases
# =============================================================================

# For testing
def test_with_zigzag():
    """Test SolutionFirstPlacer with zigzag topology."""
    from src.map_generator.service import MapGeneratorService
    
    service = MapGeneratorService()
    topo = service.topologies.get('zigzag')
    
    if not topo:
        print("zigzag topology not found")
        return
    
    path_info = topo.generate_path_info(grid_size=(30, 30, 30), params={})
    
    print("=== ZIGZAG TEST ===")
    print(f"Path coords: {len(path_info.path_coords)}")
    print(f"Metadata keys: {list(path_info.metadata.keys()) if path_info.metadata else []}")
    
    if path_info.metadata:
        sa = path_info.metadata.get('segment_analysis', {})
        print(f"Segment analysis: {sa}")
        segments = path_info.metadata.get('segments', [])
        print(f"Segments count: {len(segments)}")
    
    placer = SolutionFirstPlacer()
    result = placer.place_items(path_info, {'logic_type': 'function_logic'})
    
    print(f"\n=== RESULT ===")
    print(f"Collectibles: {len(result.get('collectibles', []))}")
    print(f"Interactibles: {len(result.get('interactibles', []))}")
    
    for c in result.get('collectibles', [])[:5]:
        print(f"  {c['type']} at {c['pos']} (pattern: {c.get('pattern_id')})")


if __name__ == '__main__':
    test_with_zigzag()
