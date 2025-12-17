# scripts/synthesizers/plowing_field.py
"""
PLOWING FIELD SYNTHESIZER - Xử lý map dạng cánh đồng với nested loops
"""

from typing import List, Dict, Any
from .base import SynthesizerStrategy


class PlowingFieldSynthesizer(SynthesizerStrategy):
    """
    Synthesizer cho các map dạng plowing_field.
    Tạo nested loops cho các vật phẩm xếp thành grid.
    """
    
    def can_handle(self, logic_type: str, world: Any) -> bool:
        """
        Xử lý khi:
        - world có plowing_field pattern (grid đều collectibles)
        - logic_type là for_loop_logic hoặc nested_for_loop
        """
        # Kiểm tra plowing field pattern
        if hasattr(world, '_detect_plowing_field'):
            plowing_info = world._detect_plowing_field()
            if plowing_info is not None:
                return True
        
        # Hoặc logic_type yêu cầu nested loop
        if logic_type in ('nested_for_loop', 'plowing_field'):
            return True
        
        return False
    
    def synthesize(self, actions: List[str], world: Any) -> Dict:
        """
        Tạo nested loop structure cho plowing field.
        """
        available_blocks = world.available_blocks
        loop_structure = world.solution_config.get('loop_structure', 'auto')
        
        # Detect plowing field info
        plowing_info = None
        if hasattr(world, '_detect_plowing_field'):
            plowing_info = world._detect_plowing_field()
        
        if plowing_info and loop_structure in ('auto', 'nested'):
            # [FIX P1] Pass world for start direction info
            return self._synthesize_nested_loop(actions, plowing_info, available_blocks, world)
        else:
            # Fallback to basic compression
            return {
                "main": self.compress_actions_to_structure(actions, available_blocks),
                "procedures": {}
            }
    
    def _synthesize_nested_loop(
        self, 
        actions: List[str], 
        plowing_info: Dict,
        available_blocks: set,
        world: Any = None
    ) -> Dict:
        """
        Tạo nested loop dựa trên thông tin plowing field.
        """
        rows = plowing_info.get('rows', 1)
        cols = plowing_info.get('cols', 1)
        
        # Tìm pattern của một hàng (inner loop body)
        # Thường là: [moveForward, collect] * (cols-1) + collect
        inner_loop_body = []
        
        # Detect pattern cho inner loop
        if len(actions) >= cols:
            # Tìm repeating pattern trong actions
            seq, repeats, seq_len, start = self.find_longest_repeating_sequence(actions)
            
            if seq and repeats >= rows:
                # Có pattern lặp theo hàng
                inner_actions = seq[:cols] if len(seq) >= cols else seq
                inner_loop_body = self.compress_actions_to_structure(inner_actions, available_blocks)
            else:
                # Không phát hiện được pattern rõ ràng, chia đều
                actions_per_row = len(actions) // rows
                inner_actions = actions[:actions_per_row]
                inner_loop_body = self.compress_actions_to_structure(inner_actions, available_blocks)
        
        if not inner_loop_body:
            # Fallback: basic inner loop
            inner_loop_body = [{"type": "maze_moveForward"}, {"type": "maze_collect"}]
        
        # [FIX P3] Add spacing support - extra moves between cells
        spacing = plowing_info.get('spacing', 1)
        if spacing > 1:
            # Add extra moveForward between cells
            spaced_body = []
            for item in inner_loop_body:
                spaced_body.append(item)
                if item.get('type') == 'maze_moveForward':
                    # Add spacing-1 extra moves after each moveForward
                    for _ in range(spacing - 1):
                        spaced_body.append({"type": "maze_moveForward"})
            inner_loop_body = spaced_body
        
        # Tạo outer loop với turn logic sau mỗi hàng
        outer_body = [
            {"type": "maze_repeat", "times": cols, "body": inner_loop_body}
        ]
        
        # [FIX P1] Dynamic turn direction based on player start direction
        if rows > 1:
            # Determine turn direction based on start direction
            start_direction = "N"  # Default
            if world and hasattr(world, 'start_info'):
                start_direction = world.start_info.get('direction', 'N')
            
            # For North/South starting: use Right turns
            # For East/West starting: use Left turns for vertical movement
            # This is a simplified heuristic - actual logic may need finetuning
            if start_direction in ('N', 'S'):
                turn_direction = "turnRight"
            else:
                turn_direction = "turnLeft"
            
            outer_body.extend([
                {"type": "maze_turn", "direction": turn_direction},
                {"type": "maze_moveForward"},
                {"type": "maze_turn", "direction": turn_direction}
            ])
        
        main_program = [
            {"type": "maze_repeat", "times": rows, "body": outer_body}
        ]
        
        return {"main": main_program, "procedures": {}}
