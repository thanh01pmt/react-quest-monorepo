"""
Symmetric Placer Module

Extracted from SolutionFirstPlacer - handles symmetric placement strategies
for hub-spoke (plus_shape, star_shape) and island array topologies.

Provides:
- Hub-spoke detection and symmetric branch placement
- Island array detection and identical pattern placement
"""

from typing import List, Dict, Optional, Tuple
import logging

logger = logging.getLogger(__name__)


class SymmetricPlacer:
    """
    Handles symmetric placement strategies for topologies with repeating structures.
    """
    
    def is_hub_spoke(self, metadata: dict) -> bool:
        """
        Detect if topology is Hub-Spoke (plus_shape, star_shape, etc.)
        
        Requirements:
        - Has 'center' position
        - Has >= 3 branches
        """
        center = metadata.get('center')
        branches = metadata.get('branches', [])
        topology_type = metadata.get('topology_type', '')
        
        return (
            topology_type == 'hub_spoke' or
            (center is not None and len(branches) >= 3)
        )
    
    def symmetric_hub_spoke_placement(
        self, 
        path_info, 
        params: dict,
        build_layout_fn
    ) -> Optional[dict]:
        """
        Place items SYMMETRICALLY on each branch from the hub.
        
        Algorithm:
        1. Get all branches from metadata
        2. For each branch, place items at SAME relative positions
        3. Item types based on curriculum or alternating pattern
        
        User Requirements:
        - Minimum 3 branches must have items (prefer 4)
        - Item types: Based on curriculum, else alternate crystal/switch
        """
        metadata = path_info.metadata or {}
        center = metadata.get('center')
        branches = metadata.get('branches', [])
        logic_type = params.get('logic_type', 'function_logic')
        
        if len(branches) < 3:
            logger.warning(f"Hub-Spoke requires >= 3 branches, found {len(branches)}")
            return None
        
        # Parse solution_item_goals
        solution_item_goals = self._parse_item_goals(params.get('solution_item_goals', ['crystal', 'switch']))
        
        # Calculate items per branch
        min_branch_len = min(len(b) for b in branches if b)
        available_slots_per_branch = min_branch_len - 1
        items_per_branch = min(2, max(1, available_slots_per_branch // 2))
        
        items = []
        used_positions = set()
        used_positions.add(tuple(center) if center else ())
        used_positions.add(tuple(path_info.start_pos))
        used_positions.add(tuple(path_info.target_pos))
        
        # Place items on each branch at same relative positions
        branch_idx = 0
        for branch in branches:
            if not branch or len(branch) < 2:
                continue
            
            for item_idx in range(items_per_branch):
                pos_idx = item_idx + 1
                if pos_idx >= len(branch):
                    continue
                
                pos = branch[pos_idx]
                pos_tuple = tuple(pos)
                
                if pos_tuple in used_positions:
                    continue
                
                item_type_idx = item_idx % len(solution_item_goals)
                item_type = solution_item_goals[item_type_idx]
                
                items.append({
                    'type': item_type,
                    'pos': pos,
                    'position': list(pos),
                    'pattern_id': f'branch_{branch_idx}_item_{item_idx}',
                    'branch_idx': branch_idx,
                    'symmetric': True
                })
                used_positions.add(pos_tuple)
            
            branch_idx += 1
        
        # Verify: At least 3 branches have items
        branches_with_items = len(set(item.get('branch_idx') for item in items))
        if branches_with_items < 3:
            logger.warning(f"Only {branches_with_items} branches have items, need >= 3")
            return None
        
        logger.info(f"Hub-Spoke: Placed {len(items)} items across {branches_with_items} branches")
        return build_layout_fn(path_info, items, logic_type)
    
    def is_island_array(self, metadata: dict) -> bool:
        """
        Detect if topology is Island Array (symmetrical_islands)
        
        Requirements:
        - Has 'islands' list with >= 2 islands
        """
        islands = metadata.get('islands', [])
        topology_type = metadata.get('topology_type', '')
        
        return topology_type == 'island' or len(islands) >= 2
    
    def symmetric_island_placement(
        self, 
        path_info, 
        params: dict,
        build_layout_fn
    ) -> Optional[dict]:
        """
        Place IDENTICAL pattern on EACH island.
        
        Algorithm:
        1. Determine pattern for single island (1-3 items based on island size)
        2. Apply SAME pattern to ALL islands
        3. Ensure total items meet density requirements
        
        User Requirements:
        - Items per island: min 1, max 3
        - Pattern must be identical across all islands
        """
        metadata = path_info.metadata or {}
        islands = metadata.get('islands', [])
        logic_type = params.get('logic_type', 'function_logic')
        
        if len(islands) < 2:
            logger.warning(f"Island-Array requires >= 2 islands, found {len(islands)}")
            return None
        
        # Parse solution_item_goals
        solution_item_goals = self._parse_item_goals(params.get('solution_item_goals', ['crystal', 'switch']))
        
        # Calculate items per island based on smallest island size
        min_island_size = min(len(island) for island in islands if island)
        items_per_island = min(3, max(1, min_island_size // 2))
        
        items = []
        used_positions = set()
        used_positions.add(tuple(path_info.start_pos))
        used_positions.add(tuple(path_info.target_pos))
        
        # Determine relative positions for pattern
        pattern_indices = []
        if min_island_size >= 1:
            pattern_indices.append(0)
        if min_island_size >= 3 and items_per_island >= 2:
            pattern_indices.append(min_island_size // 2)
        if min_island_size >= 4 and items_per_island >= 3:
            pattern_indices.append(min_island_size - 1)
        
        pattern_indices = pattern_indices[:items_per_island]
        
        # Apply pattern to each island
        for island_idx, island in enumerate(islands):
            if not island:
                continue
            
            for item_idx, pos_idx in enumerate(pattern_indices):
                if pos_idx >= len(island):
                    continue
                
                pos = island[pos_idx]
                pos_tuple = tuple(pos)
                
                if pos_tuple in used_positions:
                    continue
                
                item_type_idx = item_idx % len(solution_item_goals)
                item_type = solution_item_goals[item_type_idx]
                
                items.append({
                    'type': item_type,
                    'pos': pos,
                    'position': list(pos),
                    'pattern_id': f'island_{island_idx}_item_{item_idx}',
                    'island_idx': island_idx,
                    'symmetric': True
                })
                used_positions.add(pos_tuple)
        
        if len(items) < 3:
            logger.warning(f"Island placement produced only {len(items)} items, need >= 3")
            return None
        
        logger.info(f"Island-Array: Placed {len(items)} items across {len(islands)} islands ({items_per_island} per island)")
        return build_layout_fn(path_info, items, logic_type)
    
    def _parse_item_goals(self, solution_item_goals) -> List[str]:
        """
        Parse solution_item_goals to list of item types.
        
        Input can be:
        - String: "switch:all,crystal:all"
        - List: ['crystal', 'switch']
        """
        if isinstance(solution_item_goals, str):
            parsed_types = []
            for item_spec in solution_item_goals.split(','):
                item_spec = item_spec.strip()
                base_type = item_spec.split(':')[0].strip()
                if base_type:
                    parsed_types.append(base_type)
            return parsed_types if parsed_types else ['crystal', 'switch']
        
        if not solution_item_goals:
            return ['crystal', 'switch']
        
        return solution_item_goals
