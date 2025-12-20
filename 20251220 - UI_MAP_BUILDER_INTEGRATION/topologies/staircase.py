# src/map_generator/topologies/staircase.py

import random
from .base_topology import BaseTopology
import copy
from src.map_generator.models.path_info import PathInfo, Coord
from src.utils.geometry import add_vectors, FORWARD_X, UP_Y

class StaircaseTopology(BaseTopology):
    """
    Tạo ra một cấu trúc cầu thang đi lên đều đặn, với các khối nền móng rõ ràng.
    
    Đây là dạng map lý tưởng để dạy về vòng lặp 'for' kết hợp với
    lệnh 'jump' để di chuyển trong không gian 3D.
    """
    def generate_path_info_variants(self, grid_size: tuple, params: dict, max_variants: int) -> "Iterator[PathInfo]":
        """
        [KIẾN TRÚC MỚI] Tạo ra các biến thể cầu thang với số bậc khác nhau.
        """
        count = 0
        # Lặp qua các số bậc thang có thể có
        for num_steps in range(3, 10):
            if count >= max_variants: return
            
            variant_params = copy.deepcopy(params)
            variant_params['num_steps'] = num_steps
            yield self.generate_path_info(grid_size, variant_params)
            count += 1
    
    def generate_path_info(self, grid_size: tuple, params: dict) -> PathInfo:
        """
        Tạo ra một cầu thang với số bậc và hướng ngẫu nhiên.
        Logic đã được viết lại để tạo ra các bậc thang rỗng với nền móng,
        tránh hiện tượng các khối chồng chéo.

        Args:
            params (dict):
                - num_steps (int): Số bậc thang.
                - step_size (int): Chiều dài của mỗi bậc (mặt phẳng). Mặc định là 1.
                - initial_path_length (int): Chiều dài đoạn đường đi thẳng ban đầu.

        Returns:
            PathInfo: Một đối tượng chứa thông tin về cầu thang.
        """
        print("    LOG: Generating 'staircase' topology...")
        
        num_steps = params.get('num_steps', 5)
        step_size = params.get('step_size', 1)
        initial_path_length = params.get('initial_path_length', 3)

        # [REWRITTEN] Logic vị trí bắt đầu và hướng đi được đơn giản hóa
        # Luôn bắt đầu gần gốc tọa độ và đi theo hướng +X
        start_x = 1
        start_z = grid_size[2] // 2
        start_pos: Coord = (start_x, 0, start_z)

        path_coords: list[Coord] = [start_pos]
        placement_coords: list[Coord] = [start_pos]
        obstacles = []
        current_pos = start_pos
        
        # 1. Tạo một đoạn đường đi thẳng ban đầu trên mặt đất
        for _ in range(initial_path_length):
            current_pos = add_vectors(current_pos, FORWARD_X)
            path_coords.append(current_pos)
            placement_coords.append(current_pos)
            
        # 2. Vòng lặp để xây dựng từng bậc thang
        for i in range(num_steps):
            # 2.1. Di chuyển lên một bậc
            # Bậc thang bao gồm một bước nhảy lên và một bề mặt phẳng.
            # Vị trí người chơi hiện tại là (x, y, z).
            # Bậc thang tiếp theo sẽ ở (x+1, y+1, z).
            # Để làm được điều đó, chúng ta cần một khối "obstacle" ở (x+1, y, z).
            stair_base_pos = add_vectors(current_pos, FORWARD_X)

            # [SỬA LỖI] Chỉ tạo khối bậc thang (obstacle) nếu nó không phải là bậc thang cuối cùng
            # dẫn đến vị trí đích, để tránh bị khối 'finish' của game engine chồng lên.
            if i < num_steps - 1:
                # Khối bậc thang phải là một 'obstacle' để solver có thể nhảy lên.
                # Đánh dấu is_surface_obstacle: false để nó được coi là một phần của cấu trúc nền.
                obstacles.append({"type": "obstacle", "pos": stair_base_pos, "is_surface_obstacle": False})
            
            # Điểm người chơi đáp xuống sau khi nhảy.
            landing_pos = add_vectors(stair_base_pos, UP_Y)
            path_coords.append(landing_pos)
            placement_coords.append(landing_pos) # Bề mặt bậc thang là nơi có thể đứng
            current_pos = landing_pos

            # 2.2. [SỬA LỖI LOGIC] Tạo bề mặt phẳng bắt đầu từ ô TIẾP THEO sau khi đã đáp xuống.
            # Điều này tránh việc tạo một khối đường đi chồng lên chính khối bậc thang.
            for _ in range(step_size):
                current_pos = add_vectors(current_pos, FORWARD_X)
                path_coords.append(current_pos)
                placement_coords.append(current_pos)

        # 3. Vị trí đích là điểm cuối cùng trên đường đi
        target_pos = current_pos

        # [NEW] Tạo metadata cho Placers
        # Group coords by Y level (steps)
        steps_dict = {}
        for coord in path_coords:
            y_level = coord[1]
            if y_level not in steps_dict:
                steps_dict[y_level] = []
            steps_dict[y_level].append(coord)
        
        # Convert steps_dict values to a list of segments (each step is a segment)
        segments = list(steps_dict.values())

        # Pre-calculate segment analysis (steps are segments)
        lengths = [len(segment) for segment in segments]
        min_len = min(lengths) if lengths else 0
        max_len = max(lengths) if lengths else 0
        
        metadata = {
            "topology_type": "staircase",
            "segments": segments,  # Each step is a segment
            "num_steps": num_steps,
            "step_size": step_size,
            "segment_analysis": {
                "count": len(segments),
                "lengths": lengths,
                "min_length": min_len,
                "max_length": max_len,
                "min_valid_range": max(0, min_len - 2),
                "total_valid_slots": sum(max(0, l - 2) for l in lengths),
            },
            # [NEW] Semantic positions for step_based strategy
            "semantic_positions": {
                'start': start_pos,
                'end': target_pos,
                'optimal_start': 'start',
                'optimal_end': 'end',
                'valid_pairs': [
                    {
                        'name': 'climb_stairs_easy',
                        'start': 'start',
                        'end': 'end',
                        'path_type': 'ascending',
                        'strategies': ['segment_pattern_reuse', 'step_based'],
                        'difficulty': 'EASY',
                        'teaching_goal': 'Item per step'
                    },
                    {
                        'name': 'grouped_steps_medium',
                        'start': 'start',
                        'end': 'end',
                        'path_type': 'step_groups',
                        'strategies': ['segment_pattern_reuse', 'height_variation'],
                        'difficulty': 'MEDIUM',
                        'teaching_goal': 'Items grouped by step level'
                    },
                    {
                        'name': 'cumulative_steps_hard',
                        'start': 'start',
                        'end': 'end',
                        'path_type': 'progressive_steps',
                        'strategies': ['segment_pattern_reuse', 'step_based'],
                        'difficulty': 'HARD',
                        'teaching_goal': 'Cumulative pattern per step'
                    }
                ]
            }
        }

        return PathInfo(
            start_pos=start_pos,
            target_pos=target_pos,
            path_coords=list(dict.fromkeys(path_coords)), # Xóa trùng lặp, giữ thứ tự
            placement_coords=list(set(placement_coords)), # Xóa trùng lặp
            obstacles=obstacles,
            metadata=metadata
        )