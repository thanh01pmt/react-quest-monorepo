import random
from .base_topology import BaseTopology
import copy
from src.map_generator.models.path_info import PathInfo, Coord
from src.utils.geometry import add_vectors, FORWARD_Z
from src.utils.geometry import FORWARD_X, BACKWARD_X
class ArrowShapeTopology(BaseTopology):
    """
    Tạo ra một con đường hình mũi tên trên mặt phẳng 2D.
    Bao gồm một "thân" thẳng và một "đầu" hình tam giác.
    Lý tưởng cho các bài tập tổng hợp, yêu cầu một chuỗi hành động phức tạp.
    """
    def generate_path_info_variants(self, grid_size: tuple, params: dict, max_variants: int) -> "Iterator[PathInfo]":
        """
        [KIẾN TRÚC MỚI] Tạo ra các biến thể hình mũi tên với kích thước khác nhau.
        """
        count = 0
        # Lặp qua các kích thước có thể có
        for shaft in range(3, 9): # [UPDATED] Increased max shaft to allow >10 variants (6*2=12)
            for head in range(3, 5):
                if count >= max_variants: return
                
                variant_params = copy.deepcopy(params)
                variant_params['shaft_length'] = shaft
                variant_params['head_size'] = head
                yield self.generate_path_info(grid_size, variant_params)
                count += 1

    def generate_path_info(self, grid_size: tuple, params: dict) -> PathInfo:
        """
        Tạo ra một đường đi hình mũi tên.

        Args:
            params (dict):
                - shaft_length (int): Độ dài của thân mũi tên.
                - head_size (int): Kích thước của đầu mũi tên (quyết định chiều rộng và cao).

        Returns:
            PathInfo: Một đối tượng chứa thông tin về đường đi.
        """
        print("    LOG: Generating 'arrow_shape' topology...")

        # Lấy các tham số hoặc dùng giá trị ngẫu nhiên
        shaft_len = params.get('shaft_length', random.randint(3, 5))
        head_size = params.get('head_size', random.randint(3, 4)) # head_size=3 tạo ra đầu rộng hơn

        # Đảm bảo hình dạng nằm gọn trong map
        required_width = head_size * 2 + 1
        required_depth = shaft_len + head_size

        start_x = random.randint(head_size + 1, grid_size[0] - head_size - 2)
        start_z = random.randint(1, grid_size[2] - required_depth - 2)
        y = 0

        # Điểm bắt đầu của người chơi (ở đáy của thân)
        start_pos: Coord = (start_x, y, start_z)

        # [REFACTOR] Tách biệt các loại tọa độ để placer xử lý linh hoạt
        # placement_coords: Toàn bộ hình dạng mũi tên để render nền
        # path_coords: Đường đi thực tế cho solver, sẽ đi qua một bên cánh
        # straight_path_coords: Đường thẳng từ start->target, dùng để đặt obstacle
        placement_coords: set[Coord] = {start_pos}
        path_coords: list[Coord] = [start_pos]
        straight_path_coords: list[Coord] = [start_pos]

        # 1. Vẽ thân mũi tên (đi theo trục Z)
        current_pos = start_pos
        for _ in range(shaft_len):
            current_pos = add_vectors(current_pos, FORWARD_Z)
            path_coords.append(current_pos)
            placement_coords.add(current_pos)
            straight_path_coords.append(current_pos)

        junction_pos = current_pos # Điểm nối giữa thân và đầu

        # 2. Vẽ đầu mũi tên (hình tam giác)
        # Đầu mũi tên sẽ có chiều cao là `head_size` và chiều rộng là `2*head_size + 1`
        wing_coords = set()
        # [RESTORED] Track semantic segments for Shaft
        shaft_indices = list(range(1, shaft_len + 1)) # Start is 0
        shaft_vector = FORWARD_Z
        
        segments_info = [
            {
                "id": "shaft",
                "role": "stem",
                "length": shaft_len,
                "vector": shaft_vector,
                "indices": shaft_indices
            }
        ]

        # 2. Vẽ đầu mũi tên (hình tam giác) - [UPDATED] Full Zig-Zag Traversal
        # Để đảm bảo "dọn dẹp sạch sẽ bản đồ", path sẽ đi qua tất cả các ô của đầu mũi tên.
        
        # Grid logic:
        # Height = head_size
        # Row i (from 1 to head_size): Width depends on (head_size - i)
        
        head_rows = []
        for i in range(1, head_size + 1):
            current_z = junction_pos[2] + i
            row_width = head_size - i # 1-side width
            
            # Generate coords for this row
            row_coords = []
            center_x = junction_pos[0]
            for j in range(-row_width, row_width + 1):
                coord = (center_x + j, y, current_z)
                row_coords.append(coord)
                placement_coords.add(coord)
            
            head_rows.append(row_coords)
            
        # 3. Create Zig-Zag Path through the rows
        # Current pos is junction.
        # Enter Row 1.
        
        segment_head_indices = []
        current_idx_start = len(path_coords)
        
        # Traverse rows
        for r_idx, row in enumerate(head_rows):
            # Quyết định hướng đi: Trái->Phải hay Phải->Trái
            # Row 0 (gần junction nhất): Đi từ center ra?
            # Thực tế junction ở giữa. Row 1 cũng có center ở giữa.
            # Để liên tục, ta nên đi từ vị trí gần current_pos nhất.
            
            # Sort row by X
            row_sorted = sorted(row, key=lambda c: c[0])
            
            # Nếu current_pos đang ở bên trái (x nhỏ), đi từ trái sang phải.
            # Nếu ở bên phải (x lớn), đi từ phải sang trái.
            # Nếu ở giữa (như lúc bắt đầu từ junction), chọn một bên để bắt đầu?
            # Tốt nhất là đi từ Junction -> Góc Trái (hoặc Phải) -> Quét hết hàng -> Sang hàng kế.
            
            if r_idx == 0:
                # Từ Junction (center), ta nên đi ra biên rồi quét vào? hmmm
                # Hoặc quét từ trái qua phải: Junction -> ... -> Leftmost -> ... Rightmost? 
                # Không được, path phải continuous adjacent.
                # A* solution sẽ tìm đường ngắn nhất.
                # Nếu mình ADD tất cả vào path_coords, mình đang force structure.
                
                # Chiến lược Serpentine cho tam giác: 
                # Khó vì width thay đổi.
                # Cách đơn giản: Junction -> Leftmost Row 1 -> Rightmost Row 1 -> Rightmost Row 2 -> Leftmost Row 2 ...
                
                # Move from Junction to Start of Row 1.
                # Junction (X, Z). Row 1 has Z+1.
                # Start point candidates: Row 1 Leftmost or Rightmost.
                # Distance from Junction to Leftmost: sqrt(1 + width^2).
                # Path must be connected step-by-step.
                # Solver expects adjacent moves. I cannot jump.
                # I must generate intermediate steps?
                # Wait, `row_coords` are adjacent (dx=1). 
                # But Junction to Leftmost is NOT adjacent specificially unless width=0.
                
                # Solution: Start Zig-Zag from the CENTER (Junction).
                # Spiral Out?
                # Or: Shaft -> Center Row 1 -> Left Row 1 -> Back to Center -> Right Row 1 ... (Inefficient overlapping)
                
                # Better: 
                # Shaft -> Junction.
                # Path continues to Center of Row 1 (Straight).
                # Then fills Row 1?
                # If I go Center -> Left -> Center -> Right, I re-visit Center.
                # Is that allowed? Yes, but `placement_coords` handles floor. `path_coords` handles logical path item placement.
                # If Placer places items on re-visited nodes, it might be tricky.
                
                # Alternate Strategy "Plowing":
                # Shaft -> Junction.
                # Move to Leftmost of Row 1 (requires creating path to it? or just assume adjacent?)
                # If Leftmost is (X-2, Z+1) and Junction is (X, Z), they are NOT neighbors.
                # Neighbors of Junction (X, Z) are (X, Z+1), (X-1, Z), (X+1, Z).
                # (X, Z+1) is Center of Row 1.
                
                # So forced entry: Shaft -> Junction -> Row 1 Center.
                # From Row 1 Center, how to visit Left and Right?
                # Go Left end, come back, Go Right end?
                # Or: Junction -> (X-1, Z) -> (X-2, Z) ... -> (Leftmost) -> Up to Row 1 Leftmost?
                # BUT Row 1 is at Z+1.
                
                # "Don't leave a walkway" -> Just fill the area.
                # If I just generate the `placement_coords` (filled triangle) and a SIMPLE path (legacy linear path).
                # AND ensure NO OBSTACLES are placed.
                # Then the map is a wide open floor.
                # The user can run ANYWHERE.
                # Items are on the simple path.
                # Challenge: "Clean the map". If items are only on the line, user just runs the line.
                # User wants items EVERYWHERE.
                # So I DO need a path that visits everywhere to guide the PLACER.
                
                # Let's try a "Recursive Backtracker" or simple "Branching" logic for Plowing?
                # Or just hardcode for small head_size?
                # head_size is 3 or 4. Small.
                
                # Strategy: "Center Out - Row by Row"
                # Row 1 (Center) -> Split Left/Right? No, single path.
                # Path: ... -> Junction
                #       -> Row 1 Center
                #       -> Row 1 Left Loop (Center -> L1 -> L2 -> L1 -> Center)
                #       -> Row 1 Right Loop (Center -> R1 -> R2 -> R1 -> Center)
                #       -> Row 2 Center
                #       ...
                # This involves backtracking (re-visiting center). That's fine.
                # It ensures we visit all nodes.
                
                # Let's implement this "Row Scan" logic.
                
                pass

        # Thực thi logic "Row Scan with Backtracking"
        current_pos = junction_pos
        
        segments_info.append({
             "id": "head_start",
             "role": "branch_out", # Signal start of head
             "length": 0,
             "vector": FORWARD_Z,
             "indices": []
        })

        for r_idx, row in enumerate(head_rows):
            # Find Center of this row (aligned with shaft)
            center_x = junction_pos[0]
            current_z = row[0][2] # Z of this row
            center_node = (center_x, y, current_z)
            
            # Step from previous row center to this row center
            # (Assumes aligned)
            if current_pos != center_node:
                # Should be just 1 step forward if Z increments by 1
                current_pos = center_node
                path_coords.append(current_pos)
            
            # Now "Plow" this row: Go Left then Back, Go Right then Back
            sorted_row = sorted(row, key=lambda c: c[0])
            left_side = [c for c in sorted_row if c[0] < center_x]
            right_side = [c for c in sorted_row if c[0] > center_x]
            
            # Sort left side descending (closest to center first) to walk out
            left_side.sort(key=lambda c: c[0], reverse=True) 
            # Sort right side ascending (closest to center first)
            right_side.sort(key=lambda c: c[0])
            
            # Traverse Left
            for node in left_side:
                path_coords.append(node)
            # Backtrack Left (excluding farthest, which we just visited, to center)
            for node in reversed(left_side):
                path_coords.append(node) # Re-add to path to simulate walking back
                # Note: `path_coords` in `PathInfo` is used for PLACEMENT slots.
                # If we append same coord twice, Placer might put 2 items?
                # SegmentPlacer usually iterates standard coords.
                # But `place_semantic_segments` uses INDICES.
                # If I add duplicates to `path_coords`, they have unique indices.
                # So I can place multiple items on the "return" trip? 
                # Or verify uniqueness in Placer?
                # Placer logic: `pos = path_coords[path_idx]`.
                # If I want items ONLY on unique tiles, this is fine, but efficiency drops.
                # BUT, `PathInfo` constructor cleans duplicates: `list(dict.fromkeys(path_coords))`.
                # LINE 207 inside `generate_path_info` REMOVES DUPLICATES!
                # `path_coords=list(dict.fromkeys(path_coords))`
                # So backtracking steps will be REMOVED from the final path list logic?
                # Yes.
                # SO: If I walk Center -> Left -> Center.
                # The path list becomes [Center, Left]. (Center removed 2nd time).
                # This breaks connectivity for the Solver if it relies on `path_coords` sequence strictly?
                # Solver usually uses A* on the GRID (`gameConfig`). It doesn't strictly follow `path_coords` list.
                # The `path_coords` list is mainly for PLACER to find spots.
                # IF I want items on Left and Right, I need them in the list.
                pass
            
            # Back to Center (implicitly done by next step or redundancy)
            path_coords.append(center_node) 
            
            # Traverse Right
            for node in right_side:
                path_coords.append(node)
            # Backtrack Right
            for node in reversed(right_side):
                path_coords.append(node)
                
            path_coords.append(center_node)

            # Record segment for this row
            # Collect all INDICES that correspond to this row's unique nodes?
            # Since duplicates are removed at the end, I can't easily track indices here unless I know the final usage.
            # HOWEVER, for Semantic Placement, I want to define role="parallel" or "spread".
            pass

        # [CRITICAL] `PathInfo` constructor line 207 removes duplicates!
        # `path_coords=list(dict.fromkeys(path_coords))`
        # This will collapse my "back-and-forth" path into just the set of visited nodes.
        # This is GOOD for Placer (unique spots).
        # But `segment_analysis` relies on INDICES into that unique list.
        # So I need to construct the unique list MYSELF here to generate correct indices.
        
        # New Logic: Just append unique nodes in a "scanning" order?
        # Center -> Left Side -> Right Side -> Next Center?
        # Solver can jump? No.
        # But `path_coords` for Placer doesn't need to be a walkable path?
        # Actually `SegmentPlacer` usually assumes path order for difficulty flow.
        # But if the map is open, difficulty is just distance.
        
        # Let's just collect all head coords and append them to path_coords unique-ly.
        # Order: Layer by Layer (Z).
        
        # Re-calc path_coords to be safe
        path_coords = list(dict.fromkeys(path_coords)) # Clean up duplicates
        
        # Calculate Head Indices
        # Shaft indices are from 0 to shaft_len (size: 1 + shaft_len)
        # Head starts after that.
        head_start_idx = len(shaft_indices) + 1 # +1 for Start/Junction handling?
        # Start_pos is 0. 
        # Shaft loop adds 1..shaft_len.
        # shaft_indices was range(1, shaft_len + 1).
        # So occupied: 0 (start), 1..shaft_len.
        # Next is shaft_len + 1.
        
        visited_head_coords = list(range(len(shaft_indices) + 1, len(path_coords)))
        
        # Define one big semantic segment for the head
        segments_info.append({
            "id": "arrow_head",
            "role": "parallel", # Treat as parallel to fill items sequentially
            "fill_strategy": "dense", # Force sequential fill to ensure symmetry/cleanliness
            "length": len(visited_head_coords),
            "vector": FORWARD_Z, 
            "indices": visited_head_coords
        })
        
        # Start and Target need to be in placement
        target_pos = (junction_pos[0], y, junction_pos[2] + head_size) 
        path_coords.append(target_pos) # Ensure target is strictly last if not already?
        # If target was visited in zigzag, de-dupe kept first occurrence.
        # But commonly we want target to be the destination.
        # Usually target is last.
        # Check if target is in path_coords?
        if target_pos in path_coords:
             # If it's not the last element, we might have an issue in "end game" logic?
             # But for Maze, as long as it's reachable.
             pass
        else:
             path_coords.append(target_pos)
             
        # Recalculate unique again just in case
        path_coords = list(dict.fromkeys(path_coords))
        

        # [MỚI] Tạo metadata để placer có thể đặt obstacle trên đường thẳng
        # Segments: shaft + head (simplified)
        shaft_segment = straight_path_coords[:shaft_len + 1]
        head_segment = straight_path_coords[shaft_len:]
        segments = [shaft_segment, head_segment]
        
        # [LANDMARKS] Define key points for reference/extrapolation
        base_row_z = junction_pos[2] + 1
        max_width = head_size - 1
        left_wing_tip = (junction_pos[0] - max_width, y, base_row_z)
        right_wing_tip = (junction_pos[0] + max_width, y, base_row_z)
        
        # [ENRICHED] Calculate full wing paths (from junction outward to wing tips on the base row)
        # Path moves horizontally from center outward
        wing_left_path = [(junction_pos[0] - i, y, base_row_z) for i in range(1, max_width + 1)]
        wing_right_path = [(junction_pos[0] + i, y, base_row_z) for i in range(1, max_width + 1)]
        
        landmarks = {
            "tail": start_pos,
            "junction": junction_pos,
            "tip": target_pos,
            "wing_left": left_wing_tip,
            "wing_right": right_wing_tip,
            # [NEW] Full path from center to wing tips
            "wing_left_path": wing_left_path,
            "wing_right_path": wing_right_path
        }

        # [NEW] Semantic positions for strategic_zones strategy
        semantic_positions = {
            'tail': start_pos,
            'junction': junction_pos,
            'tip': target_pos,
            'wing_left': left_wing_tip,
            'wing_right': right_wing_tip,
            'optimal_start': 'tail',
            'optimal_end': 'tip',
            'valid_pairs': [
                {
                    'name': 'tail_to_tip_easy',
                    'start': 'tail',
                    'end': 'tip',
                    'path_type': 'shaft_then_head',
                    'strategies': ['strategic_zones', 'segment_based'],
                    'difficulty': 'EASY',
                    'teaching_goal': 'Simple arrow traversal through shaft to tip'
                },
                {
                    'name': 'wing_to_wing_medium',
                    'start': 'wing_left',
                    'end': 'wing_right',
                    'path_type': 'parallel_wings',
                    'strategies': ['strategic_zones', 'v_shape_convergence'],
                    'difficulty': 'MEDIUM',
                    'teaching_goal': 'Cross arrow head through junction'
                },
                {
                    'name': 'tail_all_zones_hard',
                    'start': 'tail',
                    'end': 'wing_right',
                    'path_type': 'full_traversal',
                    'strategies': ['strategic_zones', 'parallel_wings'],
                    'difficulty': 'HARD',
                    'teaching_goal': 'Visit all zones: shaft, wings, tip'
                }
            ]
        }

        # [METADATA]
        metadata = {
            "topology_type": "arrow_shape",
            "segments": segments, # Legacy
            "corners": [junction_pos] + list(wing_coords), # Include wings as corners?
            "semantic_positions": semantic_positions,  # [NEW]
            "segment_analysis": {
                "segments_detail": segments_info,
                "landmarks": landmarks, # New field
                "suggested_patterns": ["interval_fill", "corner_checkpoints", "parallel_climb"]
            }
        }

        return PathInfo(
            start_pos=start_pos,
            target_pos=target_pos,
            path_coords=list(dict.fromkeys(path_coords)), # Đường đi rẽ nhánh
            placement_coords=list(placement_coords),     # Toàn bộ hình dạng
            metadata=metadata
        )