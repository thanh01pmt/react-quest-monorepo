# src/map_generator/topologies/spiral_3d.py

import copy
import random
from .base_topology import BaseTopology
from src.map_generator.models.path_info import PathInfo, Coord
from src.utils.geometry import add_vectors, FORWARD_X, FORWARD_Z, BACKWARD_X, BACKWARD_Z, UP_Y, DOWN_Y

class Spiral3DTopology(BaseTopology):
    """
    Tạo ra một con đường xoắn ốc 3D đi lên, giống như một cầu thang.
    Lý tưởng cho các bài học về vòng lặp với các biến thay đổi (độ dài cạnh tăng dần).
    """

    def generate_path_info_variants(self, grid_size: tuple, params: dict, max_variants: int) -> "Iterator[PathInfo]":
        """
        [KIẾN TRÚC MỚI] Tạo ra các biến thể xoắn ốc 3D với số tầng khác nhau.
        CHỈ generate variants nếu num_turns KHÔNG được chỉ định trong params.
        """
        count = 0
        
        # [FIX] Chỉ override num_turns nếu nó chưa được set
        if 'num_turns' not in params:
            # Lặp qua các số lần rẽ (mỗi 4 lần rẽ là 1 tầng)
            for num_turns in range(4, 17, 4):
                if count >= max_variants: 
                    return
                
                variant_params = copy.deepcopy(params)
                variant_params['num_turns'] = num_turns
                yield self.generate_path_info(grid_size, variant_params)
                count += 1
        else:
            # Params đã có num_turns → chỉ generate 1 variant duy nhất
            yield self.generate_path_info(grid_size, params)

    def generate_path_info(self, grid_size: tuple, params: dict) -> PathInfo:
        """
        Tạo ra một đường đi xoắn ốc đi lên hoặc xuống.

        Args:
            params (dict):
                - num_turns (int): Số lần rẽ góc vuông (mỗi 4 lần rẽ tạo 1 tầng).
                - reverse (bool): True để tạo xoắn ốc đi từ trên xuống và thu hẹp dần.

        Returns:
            PathInfo: Một đối tượng chứa thông tin về con đường.
        """
        print("    LOG: Generating 'spiral_3d' topology...")

        num_turns = params.get('num_turns', 12)  # Mặc định 12 lần rẽ = 3 tầng
        reverse = params.get('reverse', False)
        
        # Ước tính kích thước để đặt xoắn ốc vào giữa map
        start_x = grid_size[0] // 2
        start_z = grid_size[2] // 2

        path_coords: list[Coord] = []
        obstacles: list[dict] = []

        if not reverse:
            # --- FORWARD MODE: Đi từ dưới lên, mở rộng ra ---
            path_coords, placement_coords = self._generate_forward_spiral(
                start_x, start_z, num_turns
            )
        else:
            # --- REVERSE MODE: Đi từ trên xuống, thu hẹp vào ---
            print("    LOG: Generating REVERSED spiral (top-down, shrinking)...")
            path_coords, placement_coords = self._generate_reverse_spiral(
                start_x, start_z, num_turns
            )

        start_pos = path_coords[0]
        target_pos = path_coords[-1]

        # [NEW] Tạo metadata cho Placers
        # Group coords by Y level (platforms)
        platforms_dict = {}
        for coord in path_coords:
            y_level = coord[1]
            if y_level not in platforms_dict:
                platforms_dict[y_level] = []
            platforms_dict[y_level].append(coord)
        
        platforms = list(platforms_dict.values())
        
        metadata = {
            "topology_type": "spiral_3d",
            "platforms": platforms,
            "rings": platforms,  # In spiral, each level is a ring
            "num_turns": num_turns,
            "reverse": reverse,
            # [NEW] Semantic positions for platform_based strategy
            "semantic_positions": {
                'start': start_pos,
                'end': target_pos,
                'optimal_start': 'start',
                'optimal_end': 'end',
                'valid_pairs': [
                    {
                        'name': 'level_by_level_easy',
                        'start': 'start',
                        'end': 'end',
                        'path_type': 'level_traversal',
                        'strategies': ['platform_based', 'height_progression'],
                        'difficulty': 'EASY',
                        'teaching_goal': 'Items per level'
                    },
                    {
                        'name': 'ring_pattern_medium',
                        'start': 'start',
                        'end': 'end',
                        'path_type': 'ring_based',
                        'strategies': ['platform_based', 'radial_iteration'],
                        'difficulty': 'MEDIUM',
                        'teaching_goal': 'Ring-based patterns'
                    },
                    {
                        'name': 'progressive_spiral_hard',
                        'start': 'start',
                        'end': 'end',
                        'path_type': 'progressive',
                        'strategies': ['platform_based', 'height_progression'],
                        'difficulty': 'HARD',
                        'teaching_goal': 'Progressive spiral pattern'
                    }
                ]
            }
        }

        return PathInfo(
            start_pos=start_pos,
            target_pos=target_pos,
            path_coords=path_coords,  # Giữ nguyên thứ tự, không remove duplicates
            placement_coords=list(placement_coords), # [FIX] Dùng tập hợp blocks đầy đủ
            obstacles=obstacles,
            metadata=metadata
        )

    def _generate_forward_spiral(self, start_x: int, start_z: int, num_turns: int) -> tuple[list[Coord], set[Coord]]:
        """
        Generate spiral path going UP (expanding outward).
        Returns (path_coords, placement_coords).
        path_coords: Walkable nodes (tops of blocks).
        placement_coords: All solid blocks (including support structures).
        """
        y = 0
        start_pos: Coord = (start_x, y, start_z)
        path_coords = [start_pos]
        placement_coords = {start_pos}
        current_pos = start_pos
        
        directions = [FORWARD_X, FORWARD_Z, BACKWARD_X, BACKWARD_Z]
        side_length = 1

        for i in range(num_turns):
            if i > 0 and i % 2 == 0:
                side_length += 1
            
            move_direction = directions[i % 4]
            for _ in range(side_length):
                current_pos = add_vectors(current_pos, move_direction)
                path_coords.append(current_pos)
                placement_coords.add(current_pos)
            
            # Corner turn (UP)
            if i < num_turns - 1:
                next_turn_direction = directions[(i + 1) % 4]
                
                # Logic: Jump from Current (Y) -> Landing (Y+1).
                # To make it look solid, we place a block at Landing (Y) [Under Landing].
                # We DO NOT place a block at StepPos (Y) if it blocks anything?
                # StepPos is (Current + new_dir).
                # Landing is (StepPos + UP). i.e. (StepPos with Y+1).
                # If we place block at StepPos(Y), it is UNDER Landing(Y+1).
                # So it supports Landing.
                
                step_pos = add_vectors(current_pos, next_turn_direction)
                landing_pos = add_vectors(step_pos, UP_Y)
                
                # Solidify: Add block at step_pos (Y)
                placement_coords.add(step_pos)
                
                # Add Landing block (Y+1)
                placement_coords.add(landing_pos)
                
                # Path: Direct connection Current -> Landing
                # We SKIP step_pos in path to prevents item placement there
                # and to force jump logic.
                path_coords.append(landing_pos)
                current_pos = landing_pos

        return path_coords, placement_coords

    def _generate_reverse_spiral(self, start_x: int, start_z: int, num_turns: int) -> tuple[list[Coord], set[Coord]]:
        """
        Generate spiral path going DOWN (shrinking inward).
        Returns (path_coords, placement_coords).
        """
        # Start high
        y = num_turns 
        side_length = (num_turns // 2) + 1
        
        # Calculate start position (top outer corner)
        start_pos_calc = [start_x, y, start_z]
        for i in range(num_turns):
            if i > 0 and i % 2 == 0:
                side_length -= 1
            move_direction = [FORWARD_X, FORWARD_Z, BACKWARD_X, BACKWARD_Z][i % 4]
            for _ in range(side_length):
                start_pos_calc[0] -= move_direction[0]
                start_pos_calc[2] -= move_direction[2]
        
        start_pos = tuple(start_pos_calc)
        path_coords = [start_pos]
        placement_coords = {start_pos}
        current_pos = start_pos
        
        directions = [BACKWARD_X, BACKWARD_Z, FORWARD_X, FORWARD_Z]
        side_length = (num_turns // 2) + 1

        for i in range(num_turns):
            move_direction = directions[i % 4]
            for _ in range(side_length):
                current_pos = add_vectors(current_pos, move_direction)
                path_coords.append(current_pos)
                placement_coords.add(current_pos)
            
            # Corner turn (DOWN)
            if i < num_turns - 1:
                next_turn_direction = directions[(i + 1) % 4]
                
                # Logic: Jump DOWN from Current (Y) -> Landing (Y-1).
                # StepPos = Current + new_dir (at Y).
                # Landing = StepPos - UP (at Y-1).
                # If we place block at StepPos(Y), it is ABOVE Landing(Y-1).
                # This BLOCKS standing on Landing.
                # So we CANNOT place block at StepPos(Y).
                # We can place block at StepPos(Y-1) [Under StepPos] -> This is Landing.
                # Do we need to solidity under Current?
                # Current is Y. Under Current is Y-1.
                # We can add block at (Current_X, Y-1, Current_Z) to make strictly solid stairs?
                
                step_pos = add_vectors(current_pos, next_turn_direction)
                landing_pos = add_vectors(step_pos, DOWN_Y)
                
                # Support block under 'Current' to make it a thick step?
                # support_pos = (current_pos[0], current_pos[1]-1, current_pos[2])
                # placement_coords.add(support_pos) 
                # (Optional, maybe not needed for solvability, just aesthetics)
                
                # Add Landing block (Y-1)
                placement_coords.add(landing_pos)
                
                # Path: Direct connection Current -> Landing
                path_coords.append(landing_pos)
                current_pos = landing_pos

            if i > 0 and i % 2 != 0:
                side_length -= 1
        
        return path_coords, placement_coords