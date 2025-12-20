# scripts/gameSolver.py

# --- MÔ TẢ TÍNH NĂNG ---
# Đây là file chứa logic cốt lõi để giải một màn chơi (game level).
# Nó bao gồm các thành phần chính sau:
# 1. GameWorld & GameState: Các lớp để mô hình hóa trạng thái của game.
# 2. A* Solver (solve_level): Thuật toán tìm kiếm A* để tìm ra chuỗi hành động
#    (raw actions) ngắn nhất từ điểm bắt đầu đến điểm kết thúc, thỏa mãn
#    tất cả các mục tiêu (thu thập vật phẩm, bật công tắc).
# 3. Code Synthesizer (synthesize_program): Chuyển đổi chuỗi hành động thô
#    thành một chương trình có cấu trúc (structured solution) bằng cách
#    tự động phát hiện các mẫu lặp để tạo vòng lặp (for loop) và các chuỗi
#    hành động lặp lại để tạo hàm (function).
#
# --- CÁCH CHẠY ---
# Script này chủ yếu được các script khác import để sử dụng. Để chạy độc lập
# nhằm kiểm tra lời giải cho một file game level JSON cụ thể:
# python3 scripts/gameSolver.py /path/to/your/game_level.json

import json
import sys
import traceback
from typing import Set, Dict, List, Tuple, Any, Optional
import random # [FIX] Import the random module
import copy # [SỬA LỖI] Import thư viện copy để sử dụng deepcopy
from collections import Counter

# [MỚI] Import cấu hình solver từ file riêng biệt
# Sử dụng try/except để hỗ trợ cả khi chạy độc lập và khi import như module
try:
    from scripts.solver_config import SOLVER_CONFIG, is_tsp_enabled
    from scripts.map_validator import validate_map
    from scripts.solver_metrics import SolverMetrics
except ModuleNotFoundError:
    from solver_config import SOLVER_CONFIG, is_tsp_enabled
    from map_validator import validate_map
    from solver_metrics import SolverMetrics

# --- SECTION 1: TYPE DEFINITIONS (Định nghĩa kiểu dữ liệu) ---
Action = str
Position = Dict[str, int]
PlayerStart = Dict[str, Any]

# --- SECTION 2: GAME WORLD MODEL (Mô hình hóa thế giới game) ---
class GameWorld:
    """Đọc và hiểu file JSON, xây dựng một bản đồ thế giới chi tiết với các thuộc tính model."""
    # [REFACTORED] Định nghĩa các loại vật cản dựa trên modelKey
    
    # Các khối nền có thể đi bộ trên đó.
    WALKABLE_GROUNDS: Set[str] = {
        'wall.brick01', 'wall.brick02', 'wall.brick03', 'wall.brick04', 'wall.brick05', 'wall.brick06',
        'ground.checker', 'ground.earth', 'ground.earthChecker', 'ground.mud', 'ground.normal', 'ground.snow',
        'stone.stone01', 'stone.stone02', 'stone.stone03', 'stone.stone04', 'stone.stone05', 'stone.stone06', 'stone.stone07', 'ice.ice01'
    }
    
    # Các vật cản có thể nhảy LÊN trên đỉnh.
    JUMPABLE_OBSTACLES: Set[str] = {
        'wall.brick01', 'wall.brick02', 'wall.brick03', 'wall.brick04', 'wall.brick05', 'wall.brick06',
        'ground.checker', 'ground.earth', 'ground.earthChecker', 'ground.mud', 'ground.normal', 'ground.snow',
        'stone.stone01', 'stone.stone02', 'stone.stone03', 'stone.stone04', 'stone.stone05', 'stone.stone06', 'stone.stone07', 'ice.ice01'
    }

    # Các vật cản KHÔNG thể nhảy lên (tường cao, dung nham, v.v.).
    UNJUMPABLE_OBSTACLES: Set[str] = {
        'wall.stone01', # Ví dụ: tường đá cao
        'lava.lava01',
        'water.water01',
        'ice.ice01'
    }
    DEADLY_OBSTACLES: Set[str] = {
        'lava.lava01'
    }
    
    def __init__(self, json_data: Dict[str, Any]):
        config = json_data['gameConfig']
        self.start_info: PlayerStart = config['players'][0]['start']
        self.finish_pos: Position = config['finish']
        self.blockly_config: Dict[str, Any] = json_data.get('blocklyConfig', {})
        self.available_blocks: Set[str] = self._get_available_blocks()
        self.generation_config: Dict[str, Any] = json_data.get('generation_config', {}) # [THÊM] Lưu lại generation_config
        # Lấy thông tin về mục tiêu từ file JSON
        self.solution_config: Dict[str, Any] = json_data.get('solution', {})
        self.world_map: Dict[str, str] = {
            f"{block['position']['x']}-{block['position']['y']}-{block['position']['z']}": block['modelKey']
            for block in config.get('blocks', [])
        }
        # [REFACTORED] Gán modelKey chính xác cho từng loại vật cản vào world_map
        # để solver có thể nhận diện.
        # [CẢI TIẾN] Đọc modelKey từ danh sách obstacles và ghi đè vào world_map.
        # Điều này đảm bảo solver luôn biết chính xác loại vật cản tại một vị trí,
        # ngay cả khi nó không được định nghĩa trong 'blocks' (trường hợp hiếm).
        self.obstacles: List[Dict] = config.get('obstacles', [])
        for obs in self.obstacles: 
            pos = obs['position'] 
            # modelKey được thêm vào từ generate_all_maps.py, nhưng để an toàn, vẫn có giá trị mặc định.
            model_key = obs.get('modelKey', 'wall.brick01')
            self.world_map[f"{pos['x']}-{pos['y']}-{pos['z']}"] = model_key

        # [SỬA] Tách ra làm 2 dict: một cho tra cứu theo vị trí, một cho tra cứu theo ID
        self.collectibles_by_pos: Dict[str, Dict] = {
            f"{c['position']['x']}-{c['position']['y']}-{c['position']['z']}": c
            for c in config.get('collectibles', [])
        }
        self.collectibles_by_id: Dict[str, Dict] = {
            c['id']: c for c in config.get('collectibles', [])
        }

        self.switches: Dict[str, Dict] = {}
        self.portals: Dict[str, Dict] = {}
        all_interactibles = config.get('interactibles', [])
        for i in all_interactibles:
            if not isinstance(i, dict) or 'position' not in i: continue
            pos_key = f"{i['position']['x']}-{i['position']['y']}-{i['position']['z']}"
            if i['type'] == 'switch':
                self.switches[pos_key] = i
            elif i['type'] == 'portal':
                target_portal = next((p for p in all_interactibles if p['id'] == i['targetId']), None)
                if target_portal:
                    i['targetPosition'] = target_portal['position']
                    self.portals[pos_key] = i

    def _get_available_blocks(self) -> Set[str]:
        """[MỚI] Phân tích toolbox để lấy danh sách các khối lệnh được phép sử dụng."""
        available = set()
        toolbox_contents = self.blockly_config.get('toolbox', {}).get('contents', [])

        def recurse_contents(contents: List[Dict]):
            for item in contents:
                if item.get('kind') == 'block' and item.get('type'):
                    available.add(item['type'])
                elif item.get('kind') == 'category':
                    if item.get('custom') == 'PROCEDURE':
                        available.add('PROCEDURE')  # Marker đặc biệt cho phép tạo hàm
                    recurse_contents(item.get('contents', []))
        recurse_contents(toolbox_contents)
        return available
    
    def _detect_plowing_field(self) -> Optional[Dict]:
        """
        [ENHANCED] Phát hiện plowing_field với configurable thresholds và spacing check.
        Sử dụng config từ solver_config để có thể điều chỉnh dễ dàng.
        """
        # SOLVER_CONFIG đã được import ở đầu file
        config = SOLVER_CONFIG.get('plowing_detection', {})
        MIN_GRID_SIZE = config.get('min_grid_size', 3)
        MAX_MISSING_RATIO = config.get('max_missing_ratio', 0.2)
        
        positions = [(c['position']['x'], c['position']['z']) for c in self.collectibles_by_id.values()]
        if not positions:
            return None
        
        xs = sorted(list(set(p[0] for p in positions)))
        zs = sorted(list(set(p[1] for p in positions)))
        
        # Check grid size minimum
        if len(xs) < MIN_GRID_SIZE or len(zs) < MIN_GRID_SIZE:
            return None
        
        # [NEW] Check spacing uniformity
        def is_uniform_spacing(values: list) -> bool:
            if len(values) < 2:
                return True
            spacings = [values[i+1] - values[i] for i in range(len(values)-1)]
            return len(set(spacings)) == 1  # All spacings should be equal
        
        if not is_uniform_spacing(xs) or not is_uniform_spacing(zs):
            return None
        
        # Check completeness ratio
        grid = {(x, z) for x, z in positions}
        expected = len(xs) * len(zs)
        actual = len(grid)
        
        if actual / expected < (1 - MAX_MISSING_RATIO):
            return None
        
        # Calculate spacing for additional info
        x_spacing = xs[1] - xs[0] if len(xs) > 1 else 1
        z_spacing = zs[1] - zs[0] if len(zs) > 1 else 1
        
        return {
            "rows": len(zs), 
            "cols": len(xs),
            "spacing": (x_spacing, z_spacing)
        }

# --- SECTION 3: GAME STATE & PATH NODE (Trạng thái game và Nút tìm đường) ---
class GameState:
    """Đại diện cho một "bản chụp" của toàn bộ game tại một thời điểm."""
    def __init__(self, start_info: PlayerStart, world: GameWorld):
        self.x, self.y, self.z = int(start_info['x']), int(start_info['y']), int(start_info['z'])
        self.direction = start_info['direction']
        self.collected_items: Set[str] = set()
        self.switch_states: Dict[str, str] = {s['id']: s['initialState'] for s in world.switches.values()}

    def clone(self) -> 'GameState':
        """Tạo một bản sao nông (shallow copy) hiệu quả của trạng thái."""
        new_state = GameState.__new__(GameState)
        new_state.x, new_state.y, new_state.z, new_state.direction = self.x, self.y, self.z, self.direction
        new_state.collected_items = self.collected_items.copy() # Set cần được copy
        new_state.switch_states = self.switch_states.copy() # Dict cần được copy
        return new_state

    def get_key(self) -> Tuple:
        """
        [FIX] Trả về tuple thay vì string để tránh collision khi item ID chứa ký tự đặc biệt.
        Tuple được sử dụng vì nó hashable và đảm bảo uniqueness không phụ thuộc vào nội dung.
        """
        return (
            self.x, self.y, self.z, self.direction,
            frozenset(self.collected_items),
            tuple(sorted(self.switch_states.items()))
        )

class PathNode:
    """Nút chứa trạng thái và các thông tin chi phí cho thuật toán A*."""
    def __init__(self, state: GameState):
        self.state = state
        self.parent: Optional['PathNode'] = None
        self.action: Optional[Action] = None
        self.g_cost: float = 0.0
        self.h_cost: float = 0.0

    @property
    def f_cost(self) -> float:
        return float(self.g_cost) + float(self.h_cost)

# --- [MỚI] SECTION 3.5: META-SOLVER CHO BÀI TOÁN PHỨC TẠP (TSP) ---
def _solve_multi_goal_tsp(world: GameWorld) -> Optional[List[Action]]:
    """
    Hàm "meta-solver" sử dụng thuật toán A* để giải bài toán người giao hàng (TSP).
    Nó hoạt động bằng cách chia bài toán lớn thành các bài toán A* nhỏ hơn.
    """
    from itertools import permutations
    print("    LOG: (Solver) Phát hiện bài toán nhiều mục tiêu. Kích hoạt meta-solver TSP...")

    # 1. Xác định tất cả các điểm cần đi qua
    start_pos = {'x': world.start_info['x'], 'y': world.start_info['y'], 'z': world.start_info['z']}
    
    # [SỬA LỖI] Thêm vị trí của các công tắc vào danh sách điểm mục tiêu
    goal_positions = []
    # Thêm vị trí các vật phẩm cần thu thập
    goal_positions.extend([c['position'] for c_id, c in world.collectibles_by_id.items() if c_id in world.solution_config.get("itemGoals", {})])
    # Thêm vị trí các công tắc cần tương tác
    if world.solution_config.get("itemGoals", {}).get("switch", 0) > 0:
        goal_positions.extend([s['position'] for s in world.switches.values()])
    
    # Tạo một cache để lưu trữ đường đi giữa hai điểm bất kỳ, tránh tính toán lại
    path_cache: Dict[Tuple[str, str, str, str], Optional[List[Action]]] = {}

    def get_path_between(pos1: Position, pos2: Position, current_game_state: GameState) -> Optional[List[Action]]:
        """Hàm helper để tìm đường đi giữa 2 điểm và cache lại kết quả."""
        # [SỬA LỖI QUAN TRỌNG] Key của cache phải bao gồm cả trạng thái vật phẩm VÀ trạng thái công tắc.
        # Điều này đảm bảo rằng chúng ta không sử dụng lại một đường đi cũ vốn được tính khi công tắc ở trạng thái khác.
        collected_key = ",".join(sorted(list(current_game_state.collected_items)))
        switches_key = ",".join(sorted([f"{k}:{v}" for k, v in current_game_state.switch_states.items()]))
        key1 = f"{pos1['x']}-{pos1['y']}-{pos1['z']}|i:{collected_key}|s:{switches_key}"
        key2 = f"{pos2['x']}-{pos2['y']}-{pos2['z']}"
        
        # Kiểm tra cache trước
        if (key1, key2, collected_key, switches_key) in path_cache: return path_cache.get((key1, key2, collected_key, switches_key))

        # Tạo một "thế giới game" tạm thời cho bài toán con này
        temp_world = copy.deepcopy(world)
        temp_world.start_info['x'], temp_world.start_info['y'], temp_world.start_info['z'] = pos1['x'], pos1['y'], pos1['z']
        temp_world.finish_pos = pos2
        # [SỬA LỖI] Xóa hoàn toàn itemGoals và đặt type là reach_target.
        # Điều này đảm bảo A* con chỉ tập trung tìm đường đến đích (pos2) mà không quan tâm đến các mục tiêu khác.
        temp_world.solution_config = {"type": "reach_target", "itemGoals": {}}
        
        # [SỬA LỖI] Tạo một GameState tạm với các vật phẩm đã thu thập để A* không tìm cách thu thập lại
        # Sử dụng trạng thái hiện tại được truyền vào để đảm bảo tính đúng đắn của trạng thái công tắc.
        temp_start_state = current_game_state.clone()

        # Gọi hàm A* gốc để giải bài toán con
        sub_path = solve_level(temp_world, is_sub_problem=True, initial_state_override=temp_start_state)
        
        # Lưu vào cache và trả về
        path_cache[(key1, key2, collected_key, switches_key)] = sub_path
        return sub_path

    # --- [SỬA LỖI] Logic tìm thứ tự tối ưu ---
    # Thử mọi hoán vị (brute-force) chỉ khả thi với số lượng mục tiêu nhỏ.
    # Nếu số lượng mục tiêu lớn, chuyển sang thuật toán heuristic "Người hàng xóm gần nhất".
    # [FIX] Hạ ngưỡng xuống 7. 8! = 40,320 đã có thể gây treo. 7! = 5,040 là một con số an toàn.
    MAX_TSP_BRUTE_FORCE_GOALS = 7
    best_order = None

    if len(goal_positions) > MAX_TSP_BRUTE_FORCE_GOALS:
        print(f"    LOG: (Solver) Số mục tiêu ({len(goal_positions)}) vượt ngưỡng. Sử dụng heuristic 'Người hàng xóm gần nhất'.")
        
        # Thuật toán Người hàng xóm gần nhất (Nearest Neighbor Heuristic)
        unvisited_goals = set(tuple(p.items()) for p in goal_positions)
        current_pos = copy.deepcopy(start_pos)
        ordered_path = [start_pos]
        # [SỬA LỖI] Khởi tạo GameState ban đầu để theo dõi trạng thái
        current_state = GameState(world.start_info, world)

        while unvisited_goals:
            nearest_goal = None
            shortest_path_len = float('inf')

            for goal_tuple in unvisited_goals: # type: ignore
                goal_pos = dict(goal_tuple)
                path = get_path_between(current_pos, goal_pos, current_state)
                if path is not None and len(path) < shortest_path_len:
                    shortest_path_len = len(path)
                    nearest_goal = goal_tuple
            
            if nearest_goal:
                ordered_path.append(dict(nearest_goal))
                unvisited_goals.remove(nearest_goal)
                current_pos = dict(nearest_goal)
                # [SỬA LỖI] Cập nhật trạng thái (vật phẩm và công tắc) sau khi đi đến mục tiêu
                dest_pos_key = f"{current_pos['x']}-{current_pos['y']}-{current_pos['z']}"
                if dest_pos_key in world.collectibles_by_pos:
                    item_id = world.collectibles_by_pos[dest_pos_key]['id']
                    current_state.collected_items.add(item_id)
                elif dest_pos_key in world.switches:
                    switch_obj = world.switches[dest_pos_key]
                    switch_id = switch_obj['id']
                    current_state.switch_states[switch_id] = 'on' if current_state.switch_states[switch_id] == 'off' else 'off'

            else:
                # Không tìm thấy đường đến bất kỳ mục tiêu nào còn lại
                print("    LOG: (Solver) Heuristic không tìm được đường đi đến các mục tiêu còn lại.")
                return None # Không thể giải
        
        best_order = ordered_path

    else:
        print(f"    LOG: (Solver) Số mục tiêu ({len(goal_positions)}) trong ngưỡng. Thử tất cả các hoán vị...")
        min_total_cost = float('inf')
        for order in permutations(goal_positions):
            # [SỬA LỖI QUAN TRỌNG] Logic Brute-force TSP
            # 1. Chỉ tính toán đường đi giữa các điểm mục tiêu (start -> g1 -> g2 -> ...).
            current_order = [start_pos] + list(order)
            total_cost = 0
            possible = True
            # [SỬA LỖI] Khởi tạo GameState cho mỗi hoán vị để theo dõi trạng thái
            temp_state = GameState(world.start_info, world)

            for i in range(len(current_order) - 1):
                path = get_path_between(current_order[i], current_order[i+1], temp_state)
                if path is None:
                    possible = False
                    break
                total_cost += len(path)
                # [SỬA LỖI] Cập nhật trạng thái (vật phẩm và công tắc) sau mỗi bước
                dest_pos_key = f"{current_order[i+1]['x']}-{current_order[i+1]['y']}-{current_order[i+1]['z']}"
                if dest_pos_key in world.collectibles_by_pos:
                    item_id = world.collectibles_by_pos[dest_pos_key]['id']
                    temp_state.collected_items.add(item_id)
                elif dest_pos_key in world.switches:
                    switch_obj = world.switches[dest_pos_key]
                    switch_id = switch_obj['id']
                    temp_state.switch_states[switch_id] = 'on' if temp_state.switch_states[switch_id] == 'off' else 'off'

            # 2. Sau khi có tổng chi phí đi qua các mục tiêu, TÍNH THÊM chi phí từ mục tiêu cuối cùng đến ĐÍCH.
            if possible:
                last_goal_pos = current_order[-1]
                path_to_finish = get_path_between(last_goal_pos, world.finish_pos, temp_state)
                if path_to_finish is not None:
                    final_cost = total_cost + len(path_to_finish)
                    if final_cost < min_total_cost:
                        min_total_cost, best_order = final_cost, current_order
                else:
                    # Nếu không có đường từ mục tiêu cuối đến đích, hoán vị này không hợp lệ.
                    pass

    # 3. [SỬA LỖI] Nếu tìm thấy thứ tự tối ưu, ghép các đường đi lại và thêm hành động tương ứng
    if best_order:
        print(f"    LOG: (Solver) Đã tìm thấy một thứ tự hợp lệ để đi qua các mục tiêu.")
        # [SỬA LỖI QUAN TRỌNG] Thêm điểm kết thúc vào cuối lộ trình TỐT NHẤT, sau khi đã xác định xong.
        # Điều này áp dụng cho cả Nearest Neighbor và Brute-force.
        best_order.append(world.finish_pos)
        full_path: List[Action] = []
        # [SỬA LỖI] Theo dõi trạng thái đầy đủ (vật phẩm + công tắc) cho đường đi tốt nhất
        final_state = GameState(world.start_info, world)
        
        # [MỚI] Tạo các set vị trí để dễ dàng kiểm tra loại mục tiêu
        collectible_positions = {tuple(p.values()) for p in [c['position'] for c in world.collectibles_by_id.values()]}
        switch_positions = {tuple(p.values()) for p in [s['position'] for s in world.switches.values()]}

        for i in range(len(best_order) - 1):
            start_point = best_order[i]
            end_point = best_order[i+1]
            
            sub_path = get_path_between(start_point, end_point, final_state)

            if sub_path:
                full_path.extend(sub_path)
                
            # [REWRITTEN & FIXED] Logic thêm hành động và cập nhật trạng thái
            # Sau khi đi đến end_point, cập nhật trạng thái và thêm hành động tương ứng.
            end_pos_key = f"{end_point['x']}-{end_point['y']}-{end_point['z']}"
            end_pos_tuple = tuple(end_point.values())

            # Cập nhật trạng thái DỰA TRÊN đường đi con vừa tìm được.
            # Điều này quan trọng vì đường đi con có thể đã đi qua các vật phẩm/công tắc khác.
            temp_end_state = final_state.clone()
            for act in sub_path:
                # Tạm thời mô phỏng lại các hành động trong sub_path để cập nhật trạng thái
                # (Đây là một cách đơn giản hóa, không cần chạy lại toàn bộ logic di chuyển)
                if act == 'collect':
                    # Giả định rằng sub_path đã đi qua một vật phẩm
                    # Logic này có thể được làm chính xác hơn nếu cần
                    pass
            final_state = temp_end_state # Cập nhật trạng thái chính

            # [FIX] Thêm hành động 'collect' hoặc 'toggleSwitch' tại điểm đến (end_point)
            if end_pos_tuple in collectible_positions:
                item_id = world.collectibles_by_pos[end_pos_key]['id']
                if item_id not in final_state.collected_items:
                    full_path.append('collect')
                    final_state.collected_items.add(item_id)
            elif end_pos_tuple in switch_positions:
                switch_obj = world.switches[end_pos_key]
                switch_id = switch_obj['id']
                full_path.append('toggleSwitch')
                final_state.switch_states[switch_id] = 'on' if final_state.switch_states.get(switch_id) == 'off' else 'off'
        
        # [SỬA LỖI] Xử lý trường hợp điểm kết thúc cũng là một mục tiêu
        finish_pos_tuple = tuple(world.finish_pos.values())
        if finish_pos_tuple in collectible_positions: full_path.append('collect')
        elif finish_pos_tuple in switch_positions: full_path.append('toggleSwitch')

        return full_path

    print("    LOG: (Solver) Meta-solver không tìm được thứ tự hợp lệ.")
    return None

# --- SECTION 4: A* SOLVER (Thuật toán A*) ---
def solve_level(world: GameWorld, is_sub_problem=False, initial_state_override: Optional[GameState] = None) -> Optional[List[Action]]:
    """Thực thi thuật toán A* để tìm lời giải tối ưu cho level."""
    
    # [NEW Best Practice 2.3] Validate map before solving
    if SOLVER_CONFIG.get('integration', {}).get('validate_before_solve', False) and not is_sub_problem:
        validation_errors = validate_map(world)
        if validation_errors:
            for error in validation_errors:
                print(f"    WARNING: (Validation) {error}")
            # Continue solving anyway - validation is advisory
    
    # [NEW Best Practice 2.2] Initialize metrics
    metrics = None
    if SOLVER_CONFIG.get('integration', {}).get('collect_metrics', False):
        import time
        _solve_start_time = time.time()
        metrics = SolverMetrics()
        metrics.goal_count = len(world.collectibles_by_id) + len(world.switches)
        metrics.heuristic_type = SOLVER_CONFIG['heuristic'].get('type', 'max')
    
    # [SỬA LỖI] Cho phép ghi đè trạng thái bắt đầu, hữu ích cho TSP solver
    start_state = initial_state_override if initial_state_override else GameState(world.start_info, world)
    start_node = PathNode(start_state)
    open_list: List[PathNode] = []
    visited: Set[Tuple] = set()  # [FIX] Changed from Set[str] to Set[Tuple] for state key safety

    def manhattan(p1: Position, p2: Position) -> int:
        # [SỬA LỖI] Xử lý trường hợp p1, p2 có thể là tuple (x,y,z)
        if isinstance(p1, tuple): p1 = {'x': p1[0], 'y': p1[1], 'z': p1[2]}
        if isinstance(p2, tuple): p2 = {'x': p2[0], 'y': p2[1], 'z': p2[2]}
        return abs(p1['x'] - p2['x']) + abs(p1['y'] - p2['y']) + abs(p1['z'] - p2['z'])

    def compute_mst_cost(positions: List[Position]) -> int:
        """
        [NEW Issue #4] Compute MST cost using Prim's algorithm.
        Returns minimum traversal cost through all positions.
        """
        if len(positions) <= 1:
            return 0
        
        # Build distance matrix
        n = len(positions)
        in_mst = [False] * n
        min_edge = [float('inf')] * n
        min_edge[0] = 0
        total_cost = 0
        
        for _ in range(n):
            # Find minimum edge to add
            u = -1
            for i in range(n):
                if not in_mst[i] and (u == -1 or min_edge[i] < min_edge[u]):
                    u = i
            
            if u == -1 or min_edge[u] == float('inf'):
                break
                
            in_mst[u] = True
            total_cost += min_edge[u]
            
            # Update min edges for remaining nodes
            for v in range(n):
                if not in_mst[v]:
                    dist = manhattan(positions[u], positions[v])
                    if dist < min_edge[v]:
                        min_edge[v] = dist
        
        return total_cost

    def heuristic(state: GameState) -> int:
        """[ENHANCED] Heuristic sử dụng config từ solver_config.py, hỗ trợ MST"""
        heuristic_type = SOLVER_CONFIG['heuristic'].get('type', 'max')
        goal_weight = SOLVER_CONFIG['heuristic']['goal_weight']
        current_pos = {'x': state.x, 'y': state.y, 'z': state.z}
        required_goals = world.solution_config.get("itemGoals", {})
        
        # 1. Xác định tất cả các vị trí mục tiêu phụ chưa hoàn thành
        uncollected_ids = set(world.collectibles_by_id.keys()) - state.collected_items
        sub_goal_positions = [
            c['position'] for c_id, c in world.collectibles_by_id.items() 
            if c_id in uncollected_ids and c.get('type') in required_goals
        ]
        # [FIX] Handle 'all' string values - treat as needing all switches
        switch_goal = required_goals.get('switch', 0)
        needs_switches = switch_goal == 'all' or (isinstance(switch_goal, int) and switch_goal > 0)
        if needs_switches:
            for switch_pos_key, switch_obj in world.switches.items():
                if state.switch_states.get(switch_obj['id']) == 'off':
                    sub_goal_positions.append(switch_obj['position'])

        # 2. Tính toán heuristic dựa trên type
        if sub_goal_positions:
            if heuristic_type == 'mst' and len(sub_goal_positions) > 2:
                # [NEW Issue #4] MST-based heuristic for multi-goal
                # Compute MST through all remaining goals + current pos + finish
                all_positions = [current_pos] + sub_goal_positions + [world.finish_pos]
                h = compute_mst_cost(all_positions)
            else:
                # Default max heuristic: khoảng cách đến mục tiêu xa nhất + từ đó đến đích
                h = max(manhattan(current_pos, pos) + manhattan(pos, world.finish_pos) for pos in sub_goal_positions)
        else:
            h = manhattan(current_pos, world.finish_pos)
        
        # [FIX] Sử dụng goal_weight từ config thay vì hardcode
        h += len(sub_goal_positions) * goal_weight 
        return h

    def is_goal_achieved(state: GameState, world: GameWorld) -> bool:
        """Kiểm tra xem trạng thái hiện tại có thỏa mãn điều kiện thắng của màn chơi không."""
        solution_type = world.solution_config.get("type", "reach_target")
        
        # --- [ĐÃ SỬA] Logic kiểm tra mục tiêu ---
        required_items = world.solution_config.get("itemGoals", {})
        if required_items:
            all_goals_met = True
            for goal_type, required_count in required_items.items():
                # [SỬA LỖI QUAN TRỌNG] Chuyển đổi required_count thành số nguyên một cách an toàn
                # để tránh lỗi so sánh giữa chuỗi và số. Áp dụng cho TẤT CẢ các loại mục tiêu.
                try:
                    numeric_required_count = int(required_count)
                except (ValueError, TypeError):
                    # Nếu không chuyển được (ví dụ: "all"), đặt là -1 để xử lý ở logic sau
                    numeric_required_count = -1
                if goal_type == 'switch':
                    # Đối với công tắc, đếm số lượng đang ở trạng thái 'on'
                    toggled_on_count = sum(1 for s in state.switch_states.values() if s == 'on')
                    # Sử dụng giá trị số đã được chuyển đổi để so sánh
                    if numeric_required_count != -1 and toggled_on_count < numeric_required_count:
                        all_goals_met = False
                        break
                elif goal_type == 'obstacle':
                    # [SỬA] Tạm thời coi mục tiêu obstacle luôn đạt được để tránh lỗi.
                    # Logic này sẽ được cải tiến sau để đếm số lần 'jump'.
                    pass
                else: # Mặc định là các vật phẩm có thể thu thập (collectibles)
                    # [SỬA LỖI] Đếm số lượng vật phẩm đã thu thập khớp với loại mục tiêu.
                    collected_count = sum(1 for item_id in state.collected_items if world.collectibles_by_id.get(item_id, {}).get('type') == goal_type)                 
                    if isinstance(required_count, str) and required_count.lower() == 'all':
                        # Đếm tổng số vật phẩm loại đó có trên bản đồ
                        total_of_type = sum(1 for c in world.collectibles_by_id.values() if c.get('type') == goal_type)
                        if collected_count < total_of_type:
                            all_goals_met = False
                            break
                    elif numeric_required_count != -1 and collected_count < numeric_required_count:
                        all_goals_met = False
                        break
        else:
            all_goals_met = True

        # [CẬP NHẬT THEO YÊU CẦU] Điều kiện thắng LUÔN LUÔN yêu cầu phải về đích.
        # Nếu có itemGoals, chúng cũng phải được hoàn thành.
        is_at_finish = state.x == world.finish_pos['x'] and state.y == world.finish_pos['y'] and state.z == world.finish_pos['z']

        # [SỬA LỖI QUAN TRỌNG] Xử lý trường hợp điểm kết thúc cũng là một mục tiêu.
        # Nếu đang ở đích nhưng chưa thu thập vật phẩm tại đó, thì chưa phải là goal.
        finish_pos_key = f"{world.finish_pos['x']}-{world.finish_pos['y']}-{world.finish_pos['z']}"
        if is_at_finish and finish_pos_key in world.collectibles_by_pos:
            if world.collectibles_by_pos[finish_pos_key]['id'] not in state.collected_items:
                return False # Buộc phải có hành động 'collect' trước khi kết thúc
        return is_at_finish and all_goals_met

    # --- [CẢI TIẾN] Logic điều phối ---
    # Nếu đây là bài toán phức tạp (nhiều mục tiêu), sử dụng meta-solver
    required_goals = world.solution_config.get("itemGoals", {})
    # [SỬA LỖI] Chỉ kích hoạt meta-solver cho các bài toán có nhiều hơn 1 mục tiêu CẦN THU THẬP.
    # Các mục tiêu như 'switch' cũng được coi là mục tiêu cần đến.
    
    # [REFACTORED] Sử dụng feature flag từ config thay vì hardcode 'if False'.
    # TSP meta-solver hiện đang được tắt qua config, có thể bật lại khi cần.
    if is_tsp_enabled() and not is_sub_problem:
        # TSP meta-solver cho bài toán nhiều mục tiêu
        print("    LOG: (Solver) TSP enabled via config. Đang sử dụng meta-solver...")
        return _solve_multi_goal_tsp(world)

    start_node.h_cost = heuristic(start_state)
    open_list.append(start_node)

    # [SỬA LỖI] Xây dựng danh sách hành động hợp lệ dựa trên toolbox của level.
    # Điều này ngăn solver "gian lận" bằng cách sử dụng các khối không có sẵn.
    possible_actions = []
    available_blocks = world.available_blocks
    if 'maze_moveForward' in available_blocks:
        possible_actions.append('moveForward')
    if 'maze_turn' in available_blocks:
        possible_actions.extend(['turnLeft', 'turnRight'])
    if 'maze_jump' in available_blocks:
        possible_actions.append('jump')
    if 'maze_collect' in available_blocks:
        possible_actions.append('collect')
    if 'maze_toggle_switch' in available_blocks:
        possible_actions.append('toggleSwitch')
    
    # Nếu không có hành động nào, trả về None để tránh lặp vô hạn
    if not possible_actions:
        return None

    while open_list:
        open_list.sort(key=lambda node: node.f_cost)
        current_node = open_list.pop(0)
        state_key = current_node.state.get_key()
        if state_key in visited:
            continue
        visited.add(state_key)

        state = current_node.state

        if is_goal_achieved(state, world):
            path: List[Action] = [] # type: ignore
            curr = current_node # type: ignore
            while curr and curr.action: # type: ignore
                path.insert(0, curr.action) # type: ignore
                curr = curr.parent # type: ignore
            return path # type: ignore

        DIRECTIONS = [(0, 0, -1), (1, 0, 0), (0, 0, 1), (-1, 0, 0)]
        for action in possible_actions:
            next_state = state.clone()
            is_valid_move = False
            current_pos_key = f"{state.x}-{state.y}-{state.z}"
            
            # [REWRITTEN] Logic di chuyển và nhảy được làm rõ ràng hơn
            if action in ['moveForward', 'jump']:
                dx, _, dz = DIRECTIONS[next_state.direction]
                if action == 'moveForward':
                    # Logic đi ngang: phải có nền đất bên dưới và không gian phía trước trống
                    next_pos_key = f"{state.x + dx}-{state.y}-{state.z + dz}"
                    ground_below_next_pos_key = f"{state.x + dx}-{state.y - 1}-{state.z + dz}"
                    if world.world_map.get(ground_below_next_pos_key) in GameWorld.WALKABLE_GROUNDS and world.world_map.get(next_pos_key) is None:
                        next_state.x += dx
                        next_state.z += dz
                        is_valid_move = True
                    
                elif action == 'jump':
                    # TH1: Nhảy LÊN vật cản
                    obstacle_key = f"{next_state.x + dx}-{next_state.y}-{next_state.z + dz}"
                    obstacle_model = world.world_map.get(obstacle_key)
                    space_above_obstacle_key = f"{next_state.x + dx}-{next_state.y + 1}-{next_state.z + dz}"
                    if obstacle_model in GameWorld.JUMPABLE_OBSTACLES and world.world_map.get(space_above_obstacle_key) is None:
                        next_state.x += dx
                        next_state.y += 1
                        next_state.z += dz
                        is_valid_move = True
                    
                    # TH2: Nhảy XUỐNG một bậc
                    if not is_valid_move:
                        landing_pos_key = f"{state.x + dx}-{state.y - 1}-{state.z + dz}"
                        ground_below_landing_key = f"{state.x + dx}-{state.y - 2}-{state.z + dz}"
                        if world.world_map.get(landing_pos_key) is None and world.world_map.get(ground_below_landing_key) in GameWorld.WALKABLE_GROUNDS:
                            next_state.x += dx
                            next_state.y -= 1
                            next_state.z += dz
                            is_valid_move = True

            elif action == 'turnLeft':
                next_state.direction = (state.direction + 3) % 4
                # Ngăn các hành động quay vô ích
                is_valid_move = (next_state.direction != state.direction)
            elif action == 'turnRight':
                next_state.direction = (state.direction + 1) % 4
                is_valid_move = (next_state.direction != state.direction)
            elif action == 'collect':
                if current_pos_key in world.collectibles_by_pos and world.collectibles_by_pos[current_pos_key]['id'] not in state.collected_items:
                    next_state.collected_items.add(world.collectibles_by_pos[current_pos_key]['id'])
                    is_valid_move = True
            elif action == 'toggleSwitch':
                if current_pos_key in world.switches:
                    switch = world.switches[current_pos_key]
                    current_switch_state = state.switch_states[switch['id']]
                    next_state.switch_states[switch['id']] = 'off' if current_switch_state == 'on' else 'on'
                    is_valid_move = True
            
            if is_valid_move:
                if next_state.get_key() in visited: continue
                next_node = PathNode(next_state)
                next_node.parent = current_node
                next_node.action = action

                # [UPDATED] Logic chi phí mới - sử dụng config + REPETITION DISCOUNT từ TS
                # Giảm nhẹ chi phí nếu hành động lặp lại để khuyến khích đi thẳng/mượt mà
                cost = 0.0
                REPETITION_DISCOUNT = 0.01

                if action == 'jump':
                    cost = SOLVER_CONFIG['heuristic'].get('jump_cost', 1.5)
                    if current_node.action == 'jump': cost -= REPETITION_DISCOUNT
                elif action == 'moveForward':
                    cost = SOLVER_CONFIG['heuristic'].get('move_cost', 1.0)
                    if current_node.action == 'moveForward': cost -= REPETITION_DISCOUNT
                elif action in ['turnLeft', 'turnRight']:
                    cost = SOLVER_CONFIG['heuristic'].get('turn_cost', 0.1)
                    if current_node.action == action: cost -= REPETITION_DISCOUNT
                
                # Hành động 'collect' và 'toggleSwitch' có chi phí bằng 0
                next_node.g_cost = current_node.g_cost + cost

                next_node.h_cost = heuristic(next_state)
                open_list.append(next_node)
    return None

# --- SECTION 5: CODE SYNTHESIS & OPTIMIZATION (Tổng hợp & Tối ưu code) ---

# [MỚI] Import synthesizers package cho Strategy Pattern
# Sử dụng try/except để hỗ trợ cả standalone và module execution
try:
    from scripts.synthesizers import get_synthesizer, SYNTHESIZERS
    USE_NEW_SYNTHESIZERS = True
except ImportError:
    try:
        from synthesizers import get_synthesizer, SYNTHESIZERS
        USE_NEW_SYNTHESIZERS = True
    except ImportError:
        USE_NEW_SYNTHESIZERS = False
        print("    WARNING: Synthesizers package not found, using legacy synthesis.")


def find_most_frequent_sequence(actions: List[str], min_len=2, max_len=10, force_function=False) -> Optional[Tuple[List[str], int]]:
    """
    [REWRITTEN] Tìm chuỗi con GIỐNG HỆT NHAU xuất hiện thường xuyên nhất để đề xuất tạo Hàm.
    Đã loại bỏ logic chuẩn hóa 'turnLeft'/'turnRight' để tránh tạo ra các hàm không chính xác
    trên các map có các mẫu rẽ đối xứng (ví dụ: plowing_field, h_shape).
    """

    sequence_counts = Counter()
    actions_tuple = tuple(actions)
    for length in range(min_len, max_len + 1):
        for i in range(len(actions_tuple) - length + 1):
            original_sequence = actions_tuple[i:i+length]
            sequence_counts[original_sequence] += 1

    # [CẢI TIẾN] Ưu tiên tìm các chuỗi có 'jump' khi force_function=True
    def find_best_sequence(sequences: Counter) -> Optional[Tuple[List[str], int]]:
        most_common, max_freq, best_savings = None, 1, 0
        for seq, freq in sequences.items():
            if freq > 1:
                savings = (freq - 1) * len(seq) - (len(seq) + freq) if not force_function else freq
                if savings > best_savings:
                    best_savings, most_common, max_freq = savings, seq, freq
        return (list(most_common), max_freq) if most_common else None

    if force_function:
        jump_sequences = Counter({k: v for k, v in sequence_counts.items() if 'jump' in k})
        best_jump_seq = find_best_sequence(jump_sequences)
        if best_jump_seq: return best_jump_seq
    return find_best_sequence(sequence_counts)

def compress_actions_to_structure(actions: List[str], available_blocks: Set[str]) -> List[Dict]:
    """Hàm đệ quy nén chuỗi hành động thành cấu trúc có vòng lặp."""
    if not actions: return []
    structured_code, i = [], 0
    can_use_repeat = 'maze_repeat' in available_blocks

    while i < len(actions):
        best_seq_len, best_repeats = 0, 0
        if can_use_repeat: # Chỉ tìm vòng lặp nếu khối 'repeat' có sẵn
            for seq_len in range(1, len(actions) // 2 + 1):
                if i + 2 * seq_len > len(actions): break
                repeats = 1
                while i + (repeats + 1) * seq_len <= len(actions) and \
                      actions[i:i+seq_len] == actions[i+repeats*seq_len:i+(repeats+1)*seq_len]:
                    repeats += 1
                if repeats > 1 and (repeats * seq_len) > (1 + seq_len) and seq_len >= best_seq_len:
                    best_seq_len, best_repeats = seq_len, repeats
        
        if best_repeats > 0:
            structured_code.append({
                "type": "maze_repeat",
                "times": best_repeats,
                "body": compress_actions_to_structure(actions[i:i+best_seq_len], available_blocks)
            })
            i += best_repeats * best_seq_len
        else:
            action_str = actions[i]
            if action_str.startswith("CALL:"):
                structured_code.append({"type": "CALL", "name": action_str.split(":", 1)[1]})
            else:
                # [CẢI TIẾN] Nhóm các hành động rẽ thành một khối 'maze_turn' duy nhất
                # với thuộc tính 'direction'. Điều này rất quan trọng để các chiến lược
                # tạo lỗi (như IncorrectParameterBug) có thể tìm và sửa đổi chúng.
                if action_str == "turnLeft" or action_str == "turnRight":
                    structured_code.append({"type": "maze_turn", "direction": action_str})
                else:
                    structured_code.append({"type": f"maze_{action_str}"})
            i += 1
    return structured_code

def _synthesize_fibonacci(world: GameWorld, template: Dict) -> Dict:
    """
    [MỚI] Hàm helper chuyên dụng để tổng hợp lời giải cho thuật toán Fibonacci.
    Đọc các thông số từ template để tạo ra cấu trúc code.
    """
    # Xác định số lần lặp dựa trên số lượng vật phẩm cần tương tác
    num_items = len(world.collectibles_by_id) + len(world.switches)
    loop_times = num_items if num_items > 0 else 5 # Ít nhất 5 lần lặp nếu không có item
    if loop_times < 3: loop_times = 3 # Đảm bảo đủ số lần lặp để có logic Fibonacci

    # Lấy tên các biến từ template, sử dụng giá trị mặc định nếu không có
    var_a = template.get("variables", ["a", "b", "temp"])[0]
    var_b = template.get("variables", ["a", "b", "temp"])[1]
    var_temp = template.get("variables", ["a", "b", "temp"])[2]

    main_program = [
        {"type": "variables_set", "variable": var_a, "value": 0},
        {"type": "variables_set", "variable": var_b, "value": 1},
        {"type": "variables_set", "variable": var_temp, "value": 0},
        {"type": "maze_repeat", "times": loop_times, "body": [
            # Logic Fibonacci: temp = a; a = b; b = temp + b
            {"type": "variables_set", "variable": var_temp, "value": {"type": "variables_get", "variable": var_a}},
            {"type": "variables_set", "variable": var_a, "value": {"type": "variables_get", "variable": var_b}},
            {"type": "variables_set", "variable": var_b, "value": {"type": "math_arithmetic", "op": "ADD", "var_a": var_temp, "var_b": var_b}},
            {"type": "maze_moveForward"},
            {"type": "maze_toggle_switch"}
        ]}
    ]
    return {"main": main_program, "procedures": {}}

def synthesize_program(actions: List[Action], world: GameWorld) -> Dict:
    """
    [REFACTORED] Quy trình tổng hợp code chính sử dụng Strategy Pattern.
    
    Thứ tự ưu tiên synthesizers:
    1. PlowingFieldSynthesizer - Grid patterns
    2. VariableLoopSynthesizer - Variable-based loops
    3. MathExpressionSynthesizer - Math expressions
    4. AdvancedAlgorithmSynthesizer - Fibonacci, etc.
    5. FunctionSynthesizer - Procedure extraction
    6. DefaultSynthesizer - Fallback
    """
    logic_type = world.solution_config.get('logic_type', 'sequencing')
    
    # Thử sử dụng synthesizers mới nếu available
    if USE_NEW_SYNTHESIZERS:
        try:
            synthesizer = get_synthesizer(logic_type, world)
            print(f"    LOG: (Solver) Using {synthesizer.name} for logic_type='{logic_type}'")
            result = synthesizer.synthesize(list(actions), world)
            if result and result.get('main'):
                return result
        except Exception as e:
            print(f"    WARNING: Synthesizer failed ({e}), falling back to legacy.")
    
    # Fallback to legacy implementation
    return _synthesize_program_legacy(actions, world)


def _synthesize_program_legacy(actions: List[Action], world: GameWorld) -> Dict:
    """[LEGACY] Quy trình tổng hợp code cũ, giữ lại để fallback."""
    procedures, remaining_actions = {}, list(actions)
    # [CẢI TIẾN] Lấy các cấu hình từ solution_config
    available_blocks = world.available_blocks
    force_function = world.solution_config.get('force_function', False)
    suggested_function_names = world.solution_config.get('function_names', [])
    # [MỚI] Lấy logic_type để quyết định cách tổng hợp code
    # Điều này rất quan trọng cho các bài toán về biến
    logic_type = world.solution_config.get('logic_type', 'sequencing')
    # [MỚI] Lấy cấu hình cấu trúc vòng lặp mong muốn (single, nested, auto)
    # Tham số này sẽ được truyền từ file curriculum.
    loop_structure_config = world.solution_config.get('loop_structure', 'auto')

    # === [MỚI] SPECIAL CASE: PLOWING FIELD TỪ COLLECTIBLES ===
    # Logic này được thêm vào dựa trên phân tích của bạn để làm cho việc
    # phát hiện map "cánh đồng" trở nên mạnh mẽ hơn.
    plow = world._detect_plowing_field()
    if plow and 'maze_repeat' in available_blocks:
        print("    LOG: (Solver) Phát hiện plowing_field từ collectibles → Tạo nested loop.")
        rows, cols = plow["rows"], plow["cols"]
        inner = {"type": "maze_repeat", "times": cols,
                 "body": [{"type": "maze_moveForward"}, {"type": "maze_collect"}]}
        
        outer_body = [inner]
        
        # Thêm logic quay đầu cho zigzag
        if rows > 1:
            # Hướng quay đầu phụ thuộc vào hướng bắt đầu và cấu trúc map
            # Giả định một mẫu zigzag đơn giản: R-M-R hoặc L-M-L
            turn = "turnRight" # Có thể cần logic phức tạp hơn để xác định hướng quay chính xác
            outer_body.extend([
                {"type": "maze_turn", "direction": turn},
                {"type": "maze_moveForward"},
                {"type": "maze_turn", "direction": turn}
            ])
        return {"main": [{"type": "maze_repeat", "times": rows, "body": outer_body}], "procedures": {}}

    # [SỬA LỖI] Xóa logic không cần thiết khi không có hành động
    if not actions:
        return {"main": [], "procedures": {}}

    # === SPECIAL CASE: PLOWING FIELD + FOR_LOOP (SỬA HOÀN TOÀN) ===
    gen_config = getattr(world, 'generation_config', {})
    if gen_config.get('map_type') == 'plowing_field' and gen_config.get('logic_type') in ['for_loop_logic', 'nested_for_loop']:
        
        print("    LOG: (Solver) Phát hiện plowing_field + for_loop → Tạo nested loop tối ưu.")
        try:
            params = gen_config.get('params', {})
            rows = params.get('rows', 4)
            cols = params.get('cols', 5)

            # Vòng lặp trong: đi 1 hàng (5 lần: move + collect)
            inner_loop = {
                "type": "maze_repeat",
                "times": cols,
                "body": [
                    {"type": "maze_moveForward"},
                    {"type": "maze_collect"}
                ]
            }

            # Vòng lặp ngoài: lặp qua từng hàng
            outer_body = [inner_loop]
            
            # Thêm lệnh quay đầu giữa các hàng (trừ hàng cuối)
            if rows > 1:
                # Hướng quay phụ thuộc vào số hàng chẵn/lẻ
                # Hàng chẵn: turnRight + move + turnRight
                # Hàng lẻ: turnLeft + move + turnLeft
                turn_dir = "turnRight" if rows % 2 == 0 else "turnLeft"
                outer_body.extend([
                    {"type": "maze_turn", "direction": turn_dir},
                    {"type": "maze_moveForward"},
                    {"type": "maze_turn", "direction": turn_dir}
                ])

            main_program = [{
                "type": "maze_repeat",
                "times": rows,
                "body": outer_body
            }]

            return {"main": main_program, "procedures": {}}

        except Exception as e:
            print(f"   - Lỗi plowing_field solver: {e}")
            # Fallback về logic mặc định

    # [CẢI TIẾN] Đọc cấu hình thuật toán từ curriculum
    algorithm_template = world.solution_config.get('algorithm_template')

    # --- [REWRITTEN] Xử lý các trường hợp đặc biệt dựa trên logic_type ---
    if logic_type in ['variable_loop', 'variable_counter', 'math_basic', 'math_complex', 'math_expression_loop', 'advanced_algorithm', 'config_driven_execution', 'math_puzzle']:
        # Đối với logic này, chúng ta muốn tạo ra một lời giải tường minh sử dụng biến
        # mà không cố gắng tạo ra các hàm (function) phức tạp.
        def find_factors(n):
            if not isinstance(n, int): return None # Guard clause
            if n < 4: return None # Chỉ tạo lồng nhau cho số lần lặp >= 4
            factors = []
            for i in range(2, int(n**0.5) + 1):
                if n % i == 0:
                    factors.append((n // i, i))
            if not factors: return None
            factors.sort(key=lambda p: abs(p[0] - p[1]))
            return factors[0]

        # [REWRITTEN] Logic cho bài toán dùng biến để lặp (variable_loop)
        if logic_type in ['variable_loop', 'variable_counter']:
            # [SỬA LỖI QUAN TRỌNG] Logic tìm chuỗi lặp đã được viết lại hoàn toàn để sửa lỗi
            best_seq, best_repeats, best_len, best_start_index = find_longest_repeating_sequence(actions)

            if best_seq and best_repeats > 1:
                start_index = best_start_index
                before_loop = actions[:start_index]
                loop_body_actions = best_seq
                after_loop = actions[start_index + best_repeats * best_len:]
                # [REWRITTEN] Logic tạo vòng lặp đơn hoặc lồng nhau dựa trên cấu hình
                factors = None
                if loop_structure_config == 'nested' and 'maze_repeat_variable' in available_blocks:
                    factors = find_factors(best_repeats)
                    if not factors: print(f"   - ⚠️ Cảnh báo: Yêu cầu vòng lặp lồng nhau nhưng không thể phân tích {best_repeats} thành thừa số. Sẽ dùng vòng lặp đơn.")
                elif loop_structure_config == 'auto':
                    factors = find_factors(best_repeats)
                # Nếu loop_structure_config == 'single', factors sẽ luôn là None
                
                main_program = compress_actions_to_structure(before_loop, available_blocks)

                if factors and 'maze_repeat_variable' in available_blocks: # Nếu tìm thấy thừa số, tạo vòng lặp lồng nhau
                    outer_loops, inner_loops = factors
                    main_program.append({"type": "variables_set", "variable": "steps", "value": outer_loops})
                    nested_loop_body = {
                        "type": "maze_repeat", "times": inner_loops,
                        "body": compress_actions_to_structure(loop_body_actions, available_blocks)
                    }
                    main_program.append({"type": "maze_repeat_variable", "variable": "steps", "body": [nested_loop_body]}) # type: ignore
                elif 'maze_repeat_variable' in available_blocks: # Nếu không, giữ nguyên logic vòng lặp đơn dùng biến
                    main_program.append({"type": "variables_set", "variable": "steps", "value": best_repeats})
                    main_program.append({
                        "type": "maze_repeat_variable", "variable": "steps",
                        "body": compress_actions_to_structure(loop_body_actions, available_blocks)
                    })
                else: # Nếu không có khối lặp bằng biến, dùng lặp bằng số
                    main_program.append({
                        "type": "maze_repeat", "times": best_repeats,
                        "body": compress_actions_to_structure(loop_body_actions, available_blocks)
                    })
                main_program.extend(compress_actions_to_structure(after_loop, available_blocks))
                return {"main": main_program, "procedures": {}}
            else: # Nếu không tìm thấy chuỗi lặp, trả về giải pháp tuần tự
                return {"main": compress_actions_to_structure(actions, available_blocks), "procedures": {}}

        # Logic cho bài toán dùng biểu thức toán học
        if logic_type in ['math_expression_loop', 'math_complex', 'math_basic']:
            # [CẢI TIẾN] Tìm chuỗi lặp lại dài nhất để đưa vào vòng lặp, thay vì chỉ 'moveForward'
            best_seq, best_repeats, best_len, best_start_index = find_longest_repeating_sequence(actions)

            if not best_seq or best_repeats < 2:
                print("   - ⚠️ Cảnh báo (math_expression_loop): Không tìm thấy chuỗi lặp lại đủ dài. Trả về lời giải tuần tự.")
                return {"main": compress_actions_to_structure(actions, available_blocks), "procedures": {}}

            val_a = random.randint(1, best_repeats - 1)
            val_b = best_repeats - val_a
            
            # [REWRITTEN] Logic tạo toán tử dựa trên ngữ cảnh
            # Nếu đây là bài fixbug, chủ động tạo ra toán tử sai.
            # Nếu không, luôn dùng toán tử đúng (ADD).
            bug_type = world.solution_config.get('bug_type')
            operator = "ADD"
            # [SỬA LỖI] Đảm bảo chỉ tạo toán tử sai khi bug_type là 'incorrect_math_expression'
            if world.solution_config.get('params', {}).get('bug_type') == 'incorrect_math_expression':
                possible_ops = ["SUBTRACT", "MULTIPLY", "DIVIDE"]
                operator = random.choice(possible_ops)
                print(f"    LOG: (Solver) Ép buộc tạo lời giải với toán tử sai '{operator}' cho bài fixbug.")

            # Tách các hành động thành 3 phần: trước, trong và sau vòng lặp
            before_loop = actions[:best_start_index]
            after_loop = actions[best_start_index + best_repeats * best_len:]
            main_program = compress_actions_to_structure(before_loop, available_blocks)
            main_program.extend([
                {"type": "variables_set", "variable": "a", "value": val_a},
                {"type": "variables_set", "variable": "b", "value": val_b},
                {
                    "type": "maze_repeat_expression", # Loại khối đặc biệt
                    "expression": {
                        "type": "math_arithmetic",
                        "op": operator,
                        "var_a": "a",
                        "var_b": "b"
                    },
                    "body": compress_actions_to_structure(best_seq, available_blocks)
                }
            ])
            main_program.extend(compress_actions_to_structure(after_loop, available_blocks))
            return {"main": main_program, "procedures": {}}

        # [CẢI TIẾN] Logic cho các bài toán thuật toán phức tạp (Fibonacci, config-driven)
        if logic_type == 'advanced_algorithm' and algorithm_template:
            # Thay vì hard-code, chúng ta đọc template và gọi hàm tương ứng
            if algorithm_template.get("name") == "fibonacci":
                print("    LOG: (Solver) Synthesizing solution based on 'fibonacci' template.")
                return _synthesize_fibonacci(world, algorithm_template)
            # Có thể thêm các thuật toán khác ở đây, ví dụ:
            # elif algorithm_template.get("name") == "factorial":
            #     return _synthesize_factorial(world, algorithm_template)

        # Nếu không có logic đặc biệt nào khớp, trả về lời giải tuần tự đã được nén vòng lặp cơ bản
        return {"main": compress_actions_to_structure(remaining_actions, available_blocks), "procedures": procedures}
    # --- Logic cũ để tạo hàm ---
    can_use_procedures = 'PROCEDURE' in available_blocks
    # [REVERTED] Hoàn nguyên về logic tạo hàm gốc, an toàn.
    # Solver chỉ tạo các hàm PROCEDURE_X. Việc đổi tên sẽ do các script cấp cao hơn xử lý.
    if can_use_procedures and logic_type not in ['math_basic', 'variable_loop', 'variable_counter']:
        for i in range(3): # Thử tạo tối đa 3 hàm
            result = find_most_frequent_sequence(remaining_actions, min_len=3, max_len=10, force_function=force_function)
            if result:
                sequence = result[0]
                # Luôn tạo tên hàm chung chung, an toàn.
                proc_name = f"PROCEDURE_{i+1}"

                procedures[proc_name] = compress_actions_to_structure(sequence, available_blocks)
                new_actions, j = [], 0
                seq_tuple = tuple(sequence)
                while j < len(remaining_actions):
                    if tuple(remaining_actions[j:j+len(seq_tuple)]) == seq_tuple:
                        new_actions.append(f"CALL:{proc_name}")
                        j += len(seq_tuple)
                    else:
                        new_actions.append(remaining_actions[j])
                        j += 1
                remaining_actions = new_actions
            else: break

    return {"main": compress_actions_to_structure(remaining_actions, available_blocks), "procedures": procedures}

# --- SECTION 6: REPORTING & UTILITIES (Báo cáo & Tiện ích) ---

def count_blocks(program: Dict) -> int:
    """
    [CHỨC NĂNG MỚI] Đệ quy đếm tổng số khối lệnh trong chương trình đã tối ưu.
    Mỗi lệnh, vòng lặp, định nghĩa hàm, lời gọi hàm đều được tính là 1 khối.
    """
    def _count_list_recursively(block_list: List[Dict]) -> int:
        count = 0
        for block in block_list:
            count += 1  # Đếm khối lệnh hiện tại (move, repeat, call,...)
            if block.get("type") == "maze_repeat":
                # Nếu là vòng lặp, đệ quy đếm các khối bên trong nó
                count += _count_list_recursively(block.get("body", []))
        return count

    total = 0
    # Đếm các khối trong các hàm đã định nghĩa
    if "procedures" in program:
        for name, body in program["procedures"].items():
            total += 1  # Đếm khối "DEFINE PROCEDURE"
            total += _count_list_recursively(body)
    
    # Đếm các khối trong chương trình chính
    total += 1 # Đếm khối "On start"
    total += _count_list_recursively(program.get("main", []))
    
    return total

def format_program(program: Dict, indent=0) -> str:
    """
    [REFACTORED] Hàm helper để in chương trình ra màn hình theo cấu trúc Blockly.
    Phiên bản này sẽ in rõ ràng các khối định nghĩa hàm.
    """
    output, prefix = "", "  " * indent
    # In các khối định nghĩa hàm trước
    if indent == 0 and program.get("procedures"):
        for name, body in program["procedures"].items():
            output += f"{prefix}DEFINE {name}:\n"
            # Đệ quy để in nội dung của hàm
            output += format_program({"main": body}, indent + 1)
        output += "\n"

    # In chương trình chính
    if indent == 0:
        output += f"{prefix}MAIN PROGRAM:\n{prefix}  On start:\n"
        indent += 1 # Tăng indent cho nội dung của main
        prefix = "  " * indent
    
    # Lấy body của chương trình/hàm/vòng lặp để in
    body_to_print = program.get("main", program.get("body", []))
    for block in body_to_print:
        block_type = block.get("type")
        if block_type in ['maze_repeat', 'maze_repeat_variable', 'maze_repeat_expression']:
            output += f"{prefix}repeat ({block['times']}) do:\n"
            output += format_program(block, indent + 1)
        elif block_type == 'CALL':
            output += f"{prefix}CALL {block['name']}\n"
        else:
            output += f"{prefix}{block.get('type')}\n"
    return output

def find_longest_repeating_sequence(actions: List[str]) -> Tuple[Optional[List[str]], int, int, int]:
    """
    [REWRITTEN] Tìm chuỗi con lặp lại liên tiếp dài nhất và mang lại "lợi ích" cao nhất.
    Lợi ích được tính bằng số khối lệnh tiết kiệm được.
    """
    n = len(actions)
    best_seq, best_repeats, best_len, best_start_index = None, 0, 0, -1
    max_savings = 0

    for length in range(1, n // 2 + 1):
        for i in range(n - length):
            repeats = 1
            while i + (repeats + 1) * length <= n and \
                  actions[i : i + length] == actions[i + repeats * length : i + (repeats + 1) * length]:
                repeats += 1

            if repeats > 1:
                savings = (repeats * length) - (length + 1) # (Số khối ban đầu) - (Số khối trong vòng lặp + 1 khối repeat)
                if savings > max_savings:
                    max_savings = savings
                    best_seq, best_repeats, best_len, best_start_index = actions[i:i+length], repeats, length, i
    return best_seq, best_repeats, best_len, best_start_index

def calculate_accurate_optimal_blocks(level_data: Dict[str, Any], verbose=True, print_solution=False, return_solution=False) -> Optional[Any]:
    """
    [HÀM MỚI] Hàm chính để tính toán số khối tối ưu.
    Có thể được import và sử dụng bởi các script khác.
    """
    if verbose: print("  - Bắt đầu Giai đoạn 1 (Solver): Tìm đường đi tối ưu bằng A*...")
    world = GameWorld(level_data)
    optimal_actions = solve_level(world)
    
    if optimal_actions:
        if verbose: print(f"  - Giai đoạn 1 hoàn tất: Tìm thấy chuỗi {len(optimal_actions)} hành động.")
        
        # [MỚI] Hiển thị chi tiết 33 hành động thô
        if print_solution:
            print("  - Chi tiết chuỗi hành động thô:", ", ".join(optimal_actions))

        if verbose: print("  - Bắt đầu Giai đoạn 2 (Solver): Tổng hợp thành chương trình có cấu trúc...")
        
        program_solution = synthesize_program(optimal_actions, world)
        optimized_block_count = count_blocks(program_solution)
        
        if verbose:
            print(f"  - Giai đoạn 2 hoàn tất: Chuyển đổi {len(optimal_actions)} hành động thành chương trình {optimized_block_count} khối lệnh.")
        
        if print_solution:
            print("\n" + "="*40)
            print("LỜI GIẢI CHI TIẾT ĐƯỢC TỔNG HỢP:")
            print(format_program(program_solution).strip())
            print("="*40)
        
        if return_solution:
            # [SỬA] Trả về một gói dữ liệu đầy đủ hơn
            return {
                "block_count": optimized_block_count, 
                "program_solution_dict": program_solution,
                "raw_actions": optimal_actions,
                "structuredSolution": program_solution} # [SỬA] Trả về dict trực tiếp
        else:
            return optimized_block_count
    else:
        if verbose: print("  - ❌ KHÔNG TÌM THẤY LỜI GIẢI cho level này.")
        return None

# --- SECTION 7: MAIN EXECUTION BLOCK (Phần thực thi chính) ---
def solve_map_and_get_solution(level_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Hàm chính để giải một map và trả về một dictionary chứa các thông tin lời giải.
    Đây là điểm đầu vào cho các script khác.
    """
    try:
        solution_data = calculate_accurate_optimal_blocks(level_data, verbose=False, print_solution=False, return_solution=True)
        return solution_data # type: ignore
    except Exception as e:
        print(f"   - ❌ Lỗi khi giải map: {e}")
        # traceback.print_exc() # Bỏ comment để gỡ lỗi chi tiết
        return None

if __name__ == "__main__":
    # Phần này chỉ chạy khi script được thực thi trực tiếp, dùng để test.
    if len(sys.argv) > 1:
        print("======================================================")
        print("=== SCRIPT KIỂM TRA LỜI GIẢI CHO MAP ĐƠN LẺ ===")
        print("======================================================")

        json_filename = sys.argv[1]
        try:
            with open(json_filename, "r", encoding="utf-8") as f:
                level_data = json.load(f)
            
            solution = calculate_accurate_optimal_blocks(level_data, verbose=True, print_solution=True, return_solution=True)
            if solution:
                print(f"\n===> KẾT QUẢ TEST: Số khối tối ưu là {solution['block_count']}") # Sửa lỗi subscriptable
        except Exception as e:
            print(f"Lỗi khi test file '{json_filename}': {e}") # Sửa lỗi subscriptable
    

# --- SECTION 6: REPORTING & UTILITIES (Báo cáo & Tiện ích) ---

def count_blocks(program: Dict) -> int:
    """
    [CHỨC NĂNG MỚI] Đệ quy đếm tổng số khối lệnh trong chương trình đã tối ưu.
    Mỗi lệnh, vòng lặp, định nghĩa hàm, lời gọi hàm đều được tính là 1 khối.
    """
    def _count_list_recursively(block_list: List[Dict]) -> int:
        count = 0
        for block in block_list:
            count += 1  # Đếm khối lệnh hiện tại (move, repeat, call,...)
            if block.get("type") == "maze_repeat":
                # Nếu là vòng lặp, đệ quy đếm các khối bên trong nó
                count += _count_list_recursively(block.get("body", []))
        return count

    total = 0
    # Đếm các khối trong các hàm đã định nghĩa
    if "procedures" in program:
        for name, body in program["procedures"].items():
            total += 1  # Đếm khối "DEFINE PROCEDURE"
            total += _count_list_recursively(body)
    
    # Đếm các khối trong chương trình chính
    total += 1 # Đếm khối "On start"
    total += _count_list_recursively(program.get("main", []))
    
    return total

def format_program(program: Dict, indent=0) -> str:
    """
    [REFACTORED] Hàm helper để in chương trình ra màn hình theo cấu trúc Blockly.
    Phiên bản này sẽ in rõ ràng các khối định nghĩa hàm.
    """
    output, prefix = "", "  " * indent
    # In các khối định nghĩa hàm trước
    if indent == 0 and program.get("procedures"):
        for name, body in program["procedures"].items():
            output += f"{prefix}DEFINE {name}:\n"
            # Đệ quy để in nội dung của hàm
            output += format_program({"main": body}, indent + 1)
        output += "\n"

    # In chương trình chính
    if indent == 0:
        output += f"{prefix}MAIN PROGRAM:\n{prefix}  On start:\n"
        indent += 1 # Tăng indent cho nội dung của main
        prefix = "  " * indent
    
    # Lấy body của chương trình/hàm/vòng lặp để in
    body_to_print = program.get("main", program.get("body", []))
    for block in body_to_print:
        block_type = block.get("type")
        if block_type in ['maze_repeat', 'maze_repeat_variable', 'maze_repeat_expression']:
            output += f"{prefix}repeat ({block['times']}) do:\n"
            output += format_program(block, indent + 1)
        elif block_type == 'CALL':
            output += f"{prefix}CALL {block['name']}\n"
        else:
            output += f"{prefix}{block.get('type')}\n"
    return output

def calculate_accurate_optimal_blocks(level_data: Dict[str, Any], verbose=True, print_solution=False, return_solution=False) -> Optional[Any]:
    """
    [HÀM MỚI] Hàm chính để tính toán số khối tối ưu.
    Có thể được import và sử dụng bởi các script khác.
    """
    if verbose: print("  - Bắt đầu Giai đoạn 1 (Solver): Tìm đường đi tối ưu bằng A*...")
    world = GameWorld(level_data)
    optimal_actions = solve_level(world)
    
    if optimal_actions:
        if verbose: print(f"  - Giai đoạn 1 hoàn tất: Tìm thấy chuỗi {len(optimal_actions)} hành động.")
        
        # [MỚI] Hiển thị chi tiết 33 hành động thô
        if print_solution:
            print("  - Chi tiết chuỗi hành động thô:", ", ".join(optimal_actions))

        if verbose: print("  - Bắt đầu Giai đoạn 2 (Solver): Tổng hợp thành chương trình có cấu trúc...")
        
        program_solution = synthesize_program(optimal_actions, world)
        optimized_block_count = count_blocks(program_solution)
        
        if verbose:
            print(f"  - Giai đoạn 2 hoàn tất: Chuyển đổi {len(optimal_actions)} hành động thành chương trình {optimized_block_count} khối lệnh.")
        
        if print_solution:
            print("\n" + "="*40)
            print("LỜI GIẢI CHI TIẾT ĐƯỢC TỔNG HỢP:")
            print(format_program(program_solution).strip())
            print("="*40)
        
        if return_solution:
            # [SỬA] Trả về một gói dữ liệu đầy đủ hơn
            return {
                "block_count": optimized_block_count, 
                "program_solution_dict": program_solution,
                "raw_actions": optimal_actions,
                "structuredSolution": program_solution} # [SỬA] Trả về dict trực tiếp
        else:
            return optimized_block_count
    else:
        if verbose: print("  - ❌ KHÔNG TÌM THẤY LỜI GIẢI cho level này.")
        return None

# --- SECTION 7: MAIN EXECUTION BLOCK (Phần thực thi chính) ---
def solve_map_and_get_solution(level_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Hàm chính để giải một map và trả về một dictionary chứa các thông tin lời giải.
    Đây là điểm đầu vào cho các script khác.
    """
    try:
        solution_data = calculate_accurate_optimal_blocks(level_data, verbose=False, print_solution=False, return_solution=True)
        return solution_data # type: ignore
    except Exception as e:
        print(f"   - ❌ Lỗi khi giải map: {e}")
        # traceback.print_exc() # Bỏ comment để gỡ lỗi chi tiết
        return None

if __name__ == "__main__":
    # Phần này chỉ chạy khi script được thực thi trực tiếp, dùng để test.
    if len(sys.argv) > 1:
        json_filename = sys.argv[1]
        try:
            with open(json_filename, "r", encoding="utf-8") as f:
                level_data = json.load(f)
            
            solution = calculate_accurate_optimal_blocks(level_data, verbose=True, print_solution=True, return_solution=True)
            if solution:
                print(f"\n===> KẾT QUẢ TEST: Số khối tối ưu là {solution['block_count']}") # Sửa lỗi subscriptable
        except Exception as e:
            print(f"Lỗi khi test file '{json_filename}': {e}") # Sửa lỗi subscriptable