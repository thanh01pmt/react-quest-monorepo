"""
Placement Calculator for Solution-First Placement

Converts matched patterns into actual item coordinates.
"""

from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
from .pattern_library import Pattern


Coord = Tuple[int, int, int]


@dataclass
class ItemPlacement:
    """A single item placement with metadata."""
    coord: Coord
    item_type: str
    pattern_id: str
    segment_idx: int
    repeat: int


class PlacementCalculator:
    """
    Calculates item positions from patterns and segment coordinates.
    """
    
    def calculate_for_segment(
        self, 
        segment_coords: List[Coord], 
        pattern: Pattern, 
        segment_idx: int
    ) -> List[ItemPlacement]:
        """
        Calculate item placements for a single segment.
        
        Args:
            segment_coords: List of coordinates in the segment
            pattern: The pattern to apply
            segment_idx: Index of this segment (for tracking)
        
        Returns:
            List of ItemPlacement objects
        """
        placements = []
        pattern_length = pattern.length
        segment_length = len(segment_coords)
        
        # How many complete pattern repeats fit?
        num_repeats = segment_length // pattern_length
        
        for repeat in range(num_repeats):
            base_idx = repeat * pattern_length
            
            for offset, item_type in zip(pattern.item_coord_offsets, pattern.item_types):
                coord_idx = base_idx + offset
                
                if coord_idx < segment_length:
                    placements.append(ItemPlacement(
                        coord=segment_coords[coord_idx],
                        item_type=item_type,
                        pattern_id=pattern.id,
                        segment_idx=segment_idx,
                        repeat=repeat
                    ))
        
        return placements
    
    def calculate_for_all_segments(
        self,
        segments: List[List[Coord]],
        pattern_matches: List[Tuple[int, Pattern]]
    ) -> List[ItemPlacement]:
        """
        Calculate placements for all segments.
        
        Args:
            segments: List of segment coordinate lists
            pattern_matches: List of (segment_idx, pattern) tuples
        
        Returns:
            All item placements across all segments
        """
        all_placements = []
        
        for seg_idx, pattern in pattern_matches:
            if seg_idx < len(segments):
                segment_coords = segments[seg_idx]
                placements = self.calculate_for_segment(
                    segment_coords, pattern, seg_idx
                )
                all_placements.extend(placements)
        
        return all_placements
    
    def filter_invalid_placements(
        self,
        placements: List[ItemPlacement],
        start_pos: Coord,
        target_pos: Coord,
        path_coords: List[Coord] = None
    ) -> List[ItemPlacement]:
        """
        Filter out placements at invalid positions (start, goal, off-path).
        
        Args:
            placements: List of ItemPlacements
            start_pos: Start position to exclude
            target_pos: Goal position to exclude
            path_coords: Optional path coords for on-path check
        
        Returns:
            Filtered list of valid placements
        """
        path_set = set(path_coords) if path_coords else None
        
        valid = []
        for p in placements:
            # Skip start/goal
            if p.coord == start_pos or p.coord == target_pos:
                continue
            
            # Skip off-path if path provided
            if path_set and p.coord not in path_set:
                continue
            
            valid.append(p)
        
        return valid

    def to_item_dicts(self, placements: List[ItemPlacement]) -> List[Dict]:
        """
        Convert ItemPlacement objects to simple dicts for map assembly.
        """
        return [
            {
                'type': p.item_type,
                'pos': p.coord,
                'position': list(p.coord),  # Some code expects list format
                'pattern_id': p.pattern_id,
                'segment_idx': p.segment_idx
            }
            for p in placements
        ]
    
    def verify_placements(
        self,
        placements: List[ItemPlacement],
        path_coords: List[Coord],
        start_pos: Coord,
        target_pos: Coord
    ) -> Tuple[bool, List[str]]:
        """
        Verify that all placements are valid.
        
        Checks:
        1. All items on path
        2. No duplicate coords
        3. No items at start/goal
        4. Diversity check (≥2 item types)
        
        Returns:
            (success, list of error messages)
        """
        errors = []
        path_set = set(path_coords)
        
        # Check 1: All items on path
        for p in placements:
            if p.coord not in path_set:
                errors.append(f"Item at {p.coord} not on path")
        
        # Check 2: No duplicates
        coords = [p.coord for p in placements]
        if len(coords) != len(set(coords)):
            errors.append("Duplicate item coordinates found")
        
        # Check 3: No items at start/goal
        for p in placements:
            if p.coord == start_pos:
                errors.append("Item at start position")
            if p.coord == target_pos:
                errors.append("Item at goal position")
        
        # Check 4: Diversity
        item_types = set(p.item_type for p in placements)
        if len(placements) > 0 and len(item_types) < 2:
            errors.append(f"Low item diversity: only {item_types}")
        
        return (len(errors) == 0, errors)
