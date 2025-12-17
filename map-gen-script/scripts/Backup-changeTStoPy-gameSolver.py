# -*- coding: utf-8 -*-
"""
@file gameSolver.py (Ported from gameSolver.ts)
@description Một bộ giải mê cung sử dụng thuật toán A* để tìm đường đi tối ưu, có xử lý các mục tiêu phụ.
Hiện tại hỗ trợ di chuyển cơ bản, nhận diện tường và tìm đến điểm kết thúc.
Có thể mở rộng để xử lý các đối tượng tương tác phức tạp hơn (công tắc, cổng dịch chuyển).
"""

import json
import math
import copy
import sys
from typing import Set, Dict, List, Tuple, Any, Optional, TypedDict
import traceback

# --- SECTION 1: TYPE DEFINITIONS (Định nghĩa kiểu dữ liệu) ---

class Position(TypedDict):
    x: int
    y: int
    z: int

class PlayerStart(Position):
    direction: Optional[int]

class Block(TypedDict):
    position: Position
    modelKey: str

class Collectible(TypedDict):
    position: Position
    id: str
    type: str

class Interactible(TypedDict):
    position: Position
    id: str
    type: str
    initialState: Optional[str] # 'on' | 'off'

class GameConfig(TypedDict):
    blocks: List[Block]
    players: List[Dict[str, PlayerStart]]
    finish: Position
    collectibles: Optional[List[Collectible]]
    interactibles: Optional[List[Interactible]]

class Action(TypedDict, total=False):
    type: str
    direction: str
    times: Any # Can be int or another Action dict
    actions: List['Action']
    condition: Any
    if_actions: List['Action']
    else_if_actions: List[Any]
    else_actions: List['Action']
    name: str
    mutation: Dict[str, Any]
    variable: str
    value: Any

class Solution(TypedDict, total=False):
    type: str
    itemGoals: Dict[str, Any]
    optimalBlocks: int
    optimalLines: int
    rawActions: List[Any] # List[Union[str, Action]]
    structuredSolution: Dict[str, Any]
    basicSolution: Dict[str, Any]
    referenceOptimalBlocks: int
    referenceOptimalLines: int
    loop_structure: str

class BlocklyToolbox(TypedDict):
    kind: str
    contents: List[Any]

class QuestBlocklyConfig(TypedDict, total=False):
    toolbox: Any # BlocklyToolbox | Any
    availableBlocks: List[str]
    toolboxPresetKey: str

# --- START: LOGIC PORTED FROM PYTHON ---

class GameState:
    """
    Đại diện cho một "bản chụp" của toàn bộ game tại một thời điểm.
    Tương đương với lớp GameState trong Python.
    """
    def __init__(self, start_pos: Position, start_dir: int, world: 'GameWorld'):
        self.position: Position = copy.copy(start_pos)
        self.direction: int = start_dir
        self.collected_items: Set[str] = set()
        self.switch_states: Dict[str, str] = world.initial_switch_states.copy()

    def clone(self) -> 'GameState':
        """
        Tạo một instance mới và sao chép các thuộc tính một cách thủ công.
        Điều này đảm bảo rằng trạng thái của `switch_states` và `collected_items` được giữ lại chính xác.
        """
        new_state = GameState.__new__(GameState)
        new_state.position = self.position.copy()
        new_state.direction = self.direction
        new_state.collected_items = self.collected_items.copy()
        new_state.switch_states = self.switch_states.copy()
        return new_state

    def get_key(self) -> str:
        items = ",".join(sorted(list(self.collected_items)))
        switches = ",".join(sorted([f"{k}:{v}" for k, v in self.switch_states.items()]))
        pos = self.position
        return f"{pos['x']},{pos['y']},{pos['z']},{self.direction}|i:{items}|s:{switches}"

# Quy ước hướng (theo chiều kim đồng hồ):
# 0: -Z (Lùi / Backward)
# 1: +X (Phải / Right)
# 2: +Z (Tới / Forward)
# 3: -X (Trái / Left)
DIRECTIONS = [
    {'x': 0, 'z': -1},  # 0: -Z
    {'x': 1, 'z': 0},   # 1: +X
    {'x': 0, 'z': 1},   # 2: +Z
    {'x': -1, 'z': 0},  # 3: -X
]

class PathNode:
    """
    Nút chứa trạng thái và các thông tin chi phí cho thuật toán A*.
    Tương đương lớp PathNode trong Python.
    """
    def __init__(self, state: GameState):
        self.state: GameState = state
        self.parent: Optional['PathNode'] = None
        self.action: Optional[str] = None
        self.g_cost: float = 0.0
        self.h_cost: float = 0.0
        self.raw_actions_to_reach: List[str] = []

    def get_pos_key(self) -> str:
        pos = self.state.position
        return f"{pos['x']},{pos['y']},{pos['z']}"

    @property
    def f_cost(self) -> float:
        return self.g_cost + self.h_cost

class GameWorld:
    """
    Mô hình hóa thế giới game để solver dễ truy vấn.
    Tương đương lớp GameWorld trong Python.
    """
    def __init__(self, game_config: GameConfig, solution_config: Solution):
        self.walkable_grounds: Set[str] = {
            'wall.brick01', 'wall.brick02', 'wall.brick03', 'wall.brick04', 'wall.brick05', 'wall.brick06',
            'ground.checker', 'ground.earth', 'ground.earthChecker', 'ground.mud', 'ground.normal', 'ground.snow',
            'stone.stone01', 'stone.stone02', 'stone.stone03', 'stone.stone04', 'stone.stone05', 'stone.stone06', 'stone.stone07',
            'ice.ice01'
        }
        self.world_map: Dict[str, str] = {}
        self.collectibles_by_pos: Dict[str, Dict] = {}
        self.collectibles_by_id: Dict[str, Dict] = {}
        self.switches_by_pos: Dict[str, Dict] = {}
        self.initial_switch_states: Dict[str, str] = {}
        
        self.finish_pos: Position = game_config['finish']
        self.solution_config: Solution = solution_config

        for b in game_config.get('blocks', []):
            pos = b['position']
            pos_key = f"{pos['x']},{pos['y']},{pos['z']}"
            self.world_map[pos_key] = b['modelKey']

        for c in game_config.get('collectibles', []):
            pos = c['position']
            pos_key = f"{pos['x']},{pos['y']},{pos['z']}"
            self.collectibles_by_pos[pos_key] = {'id': c['id'], 'type': c['type']}
            self.collectibles_by_id[c['id']] = {'position': c['position'], 'type': c['type']}

        for i in game_config.get('interactibles', []):
            if i['type'] == 'switch':
                pos = i['position']
                pos_key = f"{pos['x']},{pos['y']},{pos['z']}"
                initial_state = i.get('initialState') or 'off'
                self.switches_by_pos[pos_key] = {'id': i['id'], 'initialState': initial_state}
                self.initial_switch_states[i['id']] = initial_state

    def is_walkable(self, pos: Position) -> bool:
        """
        Kiểm tra xem một vị trí có nền đất đi được (walkable) ở bên dưới không.
        """
        ground_model = self.world_map.get(f"{pos['x']},{pos['y']},{pos['z']}")
        return ground_model is not None and ground_model != 'wall.stone01' and ground_model in self.walkable_grounds

# --- END: LOGIC PORTED FROM PYTHON ---

def convert_raw_to_structured_actions(raw_actions: List[Any]) -> List[Action]:
    """
    Chuyển đổi một mảng chuỗi rawActions thành một mảng đối tượng Action.
    """
    structured_actions = []
    for action in raw_actions:
        action_obj = {'type': action} if isinstance(action, str) else action
        action_type = action_obj.get('type')

        if action_type == 'moveForward':
            structured_actions.append({'type': 'maze_moveForward'})
        elif action_type in ['turnLeft', 'maze_turnLeft']:
            structured_actions.append({'type': 'maze_turn', 'direction': 'turnLeft'})
        elif action_type in ['turnRight', 'maze_turnRight']:
            structured_actions.append({'type': 'maze_turn', 'direction': 'turnRight'})
        elif action_type == 'collect':
            structured_actions.append({'type': 'maze_collect'})
        elif action_type == 'toggleSwitch':
            structured_actions.append({'type': 'maze_toggle_switch'})
        elif action_type == 'jump':
            structured_actions.append({'type': 'maze_jump'})
        else:
            structured_actions.append(action_obj)
    return structured_actions

def find_most_frequent_sequence(actions: List[Action], min_len: int = 3, max_len: int = 10) -> Optional[Dict[str, Any]]:
    """
    Tìm chuỗi con lặp lại không liền kề thường xuyên nhất.
    """
    sequence_counts = {}
    effective_max_len = min(max_len, len(actions) // 2)

    for length in range(min_len, effective_max_len + 1):
        for i in range(len(actions) - length + 1):
            sequence = tuple(json.dumps(act, sort_keys=True) for act in actions[i:i+length])
            if sequence in sequence_counts:
                sequence_counts[sequence]['count'] += 1
            else:
                sequence_counts[sequence] = {'sequence': actions[i:i+length], 'count': 1}

    best_sequence = None
    max_savings = 0

    for data in sequence_counts.values():
        sequence = data['sequence']
        count = data['count']
        if count > 1:
            savings = (count - 1) * len(sequence) - count + (len(sequence) * 0.1)
            if savings > max_savings:
                max_savings = savings
                best_sequence = sequence

    if best_sequence:
        key = tuple(json.dumps(act, sort_keys=True) for act in best_sequence)
        return {'sequence': best_sequence, 'count': sequence_counts[key]['count']}

    return None

def find_longest_repeating_sequence(actions: List[Action]) -> Dict[str, Any]:
    """
    Tìm chuỗi con lặp lại liên tiếp dài nhất và mang lại "lợi ích" cao nhất.
    """
    n = len(actions)
    best_seq, best_repeats, best_len, best_start_index, max_savings = None, 0, 0, -1, 0

    for length in range(1, n // 2 + 1):
        for i in range(n - length + 1):
            repeats = 1
            while i + (repeats + 1) * length <= n:
                current_segment_str = json.dumps(actions[i : i + length], sort_keys=True)
                next_segment_str = json.dumps(actions[i + repeats * length : i + (repeats + 1) * length], sort_keys=True)
                if current_segment_str == next_segment_str:
                    repeats += 1
                else:
                    break
            
            if repeats > 1:
                savings = (repeats * length) - (length + 1)
                if savings > max_savings:
                    max_savings = savings
                    best_seq = actions[i : i + length]
                    best_repeats = repeats
                    best_len = length
                    best_start_index = i

    return {'sequence': best_seq, 'repeats': best_repeats, 'length': best_len, 'startIndex': best_start_index, 'savings': max_savings}

def find_factors(n: int) -> Optional[Tuple[int, int]]:
    """
    Phân tích một số thành các thừa số nguyên.
    """
    if n < 4:
        return None
    factors = []
    for i in range(2, int(math.sqrt(n)) + 1):
        if n % i == 0:
            factors.append((n // i, i))
    if not factors:
        return None
    factors.sort(key=lambda x: abs(x[0] - x[1]))
    return factors[0]

def optimize_with_loops(actions: List[Action], available_blocks: Set[str], solution_config: Solution) -> Dict[str, Any]:
    """
    Tối ưu hóa chỉ bằng vòng lặp.
    """
    if 'maze_repeat' not in available_blocks and 'maze_for' not in available_blocks:
        return {'main': actions, 'procedures': {}}

    def optimize_recursively(current_actions: List[Action]) -> List[Action]:
        optimized_inner_actions = []
        for action in current_actions:
            if (action.get('type') in ['maze_repeat', 'maze_for']) and isinstance(action.get('actions'), list):
                action_copy = action.copy()
                action_copy['actions'] = optimize_recursively(action['actions'])
                optimized_inner_actions.append(action_copy)
            else:
                optimized_inner_actions.append(action)

        result = find_longest_repeating_sequence(optimized_inner_actions)
        sequence = result['sequence']
        if sequence and result['savings'] > 0:
            before_loop = optimized_inner_actions[:result['startIndex']]
            after_loop = optimized_inner_actions[result['startIndex'] + result['repeats'] * result['length']:]
            
            loop_body = optimize_recursively(sequence)
            
            loop_type = 'maze_for' if 'maze_for' in available_blocks else 'maze_repeat'
            loop_block: Action = {'type': loop_type, 'times': result['repeats'], 'actions': loop_body}

            return optimize_recursively([*before_loop, loop_block, *after_loop])

        return optimized_inner_actions

    final_actions = optimize_recursively(actions)
    return {'main': final_actions}

def optimize_with_while_loops(actions: List[Action], available_blocks: Set[str], world: GameWorld) -> List[Action]:
    """
    Tối ưu hóa bằng vòng lặp có điều kiện (while/until).
    """
    has_while_block = 'maze_repeat_until' in available_blocks or 'controls_whileUntil' in available_blocks or 'maze_forever' in available_blocks
    if not has_while_block:
        return actions

    if any(action.get('type') != 'maze_moveForward' for action in actions):
        return actions

    optimized_actions = []
    i = 0
    while i < len(actions):
        action = actions[i]
        if action.get('type') != 'maze_moveForward':
            optimized_actions.append(action)
            i += 1
            continue

        sequence_end = i
        while sequence_end < len(actions) and actions[sequence_end].get('type') == 'maze_moveForward':
            sequence_end += 1
        
        sequence_length = sequence_end - i

        if sequence_length > 2:
            if 'maze_forever' in available_blocks:
                optimized_actions.append({
                    'type': 'maze_forever',
                    'actions': [{'type': 'maze_moveForward'}]
                })
            else:
                optimized_actions.append({
                    'type': 'maze_repeat_until',
                    'condition': 'at_finish',
                    'actions': [{'type': 'maze_moveForward'}]
                })
            i = sequence_end
        else:
            optimized_actions.append(action)
            i += 1
    return optimized_actions

def optimize_with_conditional_while(actions: List[Action], available_blocks: Set[str], solution_config: Solution) -> Optional[Dict[str, Any]]:
    """
    Tối ưu hóa bằng vòng lặp có điều kiện và các hành động bên trong.
    """
    has_while = 'maze_forever' in available_blocks or 'controls_whileUntil' in available_blocks
    has_if = 'controls_if' in available_blocks

    if not has_while or not has_if:
        return None

    allowed_action_types = {'maze_moveForward', 'maze_collect', 'maze_toggle_switch'}
    if not all(action.get('type') in allowed_action_types for action in actions) or not any(action.get('type') == 'maze_moveForward' for action in actions):
        return None

    conditional_actions = []
    item_goals = solution_config.get('itemGoals', {})

    for goal_type in item_goals:
        if goal_type == 'switch' and any(a.get('type') == 'maze_toggle_switch' for a in actions):
            conditional_actions.append({
                'type': 'controls_if',
                'condition': {'type': 'maze_is_switch_state', 'state': 'off'},
                'if_actions': [{'type': 'maze_toggle_switch'}]
            })
        elif goal_type != 'switch' and any(a.get('type') == 'maze_collect' for a in actions):
            conditional_actions.append({
                'type': 'controls_if',
                'condition': {'type': 'maze_is_item_present', 'item_type': goal_type},
                'if_actions': [{'type': 'maze_collect'}]
            })

    loop_block: Action = {'type': 'maze_forever', 'actions': [{'type': 'maze_moveForward'}, *conditional_actions]}
    return {'main': [loop_block], 'procedures': {}}

def optimize_with_functions(initial_actions: List[Action], available_blocks: Set[str], solution_config: Solution) -> Dict[str, Any]:
    """
    Tối ưu hóa chỉ bằng hàm (procedure).
    """
    if 'PROCEDURE' not in available_blocks:
        return {'main': initial_actions, 'procedures': {}}

    current_actions = list(initial_actions)
    procedures = {}
    procedure_count = 0

    changed = True
    while changed:
        changed = False
        result = find_most_frequent_sequence(current_actions)
        if result:
            sequence = result['sequence']
            procedure_count += 1
            proc_name = f"PROCEDURE_{procedure_count}"
            
            procedures[proc_name] = optimize_with_loops(sequence, available_blocks, solution_config)['main']
            
            call_block: Action = {'type': 'CALL', 'name': proc_name}
            new_actions = []
            i = 0
            seq_str = json.dumps(sequence, sort_keys=True)
            while i < len(current_actions):
                if i <= len(current_actions) - len(sequence) and json.dumps(current_actions[i:i+len(sequence)], sort_keys=True) == seq_str:
                    new_actions.append(call_block)
                    i += len(sequence)
                else:
                    new_actions.append(current_actions[i])
                    i += 1
            current_actions = new_actions
            changed = True
            
    return {'main': current_actions, 'procedures': procedures}

def optimize_with_variables_and_loops(actions: List[Action], available_blocks: Set[str]) -> Optional[Dict[str, Any]]:
    """
    Tối ưu hóa bằng cách sử dụng biến và vòng lặp for.
    """
    has_var_blocks = 'variables_set' in available_blocks and 'math_change' in available_blocks
    has_loop_var_block = 'maze_repeat_variable' in available_blocks
    has_for_loop = 'maze_repeat' in available_blocks

    if not (has_var_blocks and has_loop_var_block and has_for_loop):
        return None

    if not actions:
        return None

    grouped_actions = []
    current_action_key = json.dumps(actions[0], sort_keys=True)
    current_count = 0
    for action in actions:
        action_key = json.dumps(action, sort_keys=True)
        if action_key == current_action_key:
            current_count += 1
        else:
            grouped_actions.append({'action': json.loads(current_action_key), 'count': current_count})
            current_action_key = action_key
            current_count = 1
    grouped_actions.append({'action': json.loads(current_action_key), 'count': current_count})

    for chunk_size in range(1, len(grouped_actions) // 2 + 1):
        for i in range(len(grouped_actions) - chunk_size * 2 + 1):
            chunk1 = grouped_actions[i : i + chunk_size]
            chunk2 = grouped_actions[i + chunk_size : i + chunk_size * 2]

            structure1 = json.dumps([a['action'] for a in chunk1], sort_keys=True)
            structure2 = json.dumps([a['action'] for a in chunk2], sort_keys=True)
            if structure1 != structure2:
                continue

            diff_indices = [k for k in range(chunk_size) if chunk1[k]['count'] != chunk2[k]['count']]

            if diff_indices:
                differences = [{'initialValue': chunk1[k]['count'], 'commonDifference': chunk2[k]['count'] - chunk1[k]['count']} for k in diff_indices]

                repeats = 2
                while i + (repeats + 1) * chunk_size <= len(grouped_actions):
                    next_chunk = grouped_actions[i + repeats * chunk_size : i + (repeats + 1) * chunk_size]
                    next_chunk_structure = json.dumps([a['action'] for a in next_chunk], sort_keys=True)
                    if next_chunk_structure != structure1:
                        break

                    pattern_holds = True
                    for k_idx, k in enumerate(diff_indices):
                        expected_count = chunk1[k]['count'] + repeats * differences[k_idx]['commonDifference']
                        if next_chunk[k]['count'] != expected_count:
                            pattern_holds = False
                            break
                    if not pattern_holds:
                        break
                    repeats += 1

                total_original_actions = sum(sum(g['count'] for g in grouped_actions[i + r * chunk_size : i + (r + 1) * chunk_size]) for r in range(repeats))
                total_original_grouped_blocks = sum(len(grouped_actions[i + r * chunk_size : i + (r + 1) * chunk_size]) for r in range(repeats))
                new_blocks_cost = (len(diff_indices) * 2) + 1 + chunk_size

                if repeats > 1 and total_original_grouped_blocks > new_blocks_cost:
                    print(f"Solver: Phát hiện quy luật đa biến số! Lặp {repeats} lần.")
                    
                    variable_setup_blocks = []
                    loop_body = []

                    for k, diff_data in enumerate(differences):
                        var_name = f"i_{k}"
                        variable_setup_blocks.append({'type': 'variables_set', 'variable': var_name, 'value': {'type': 'math_number', 'value': diff_data['initialValue']}})

                    for k, group in enumerate(chunk1):
                        if k in diff_indices:
                            diff_index = diff_indices.index(k)
                            var_name = f"i_{diff_index}"
                            loop_body.append({'type': 'maze_repeat', 'times': {'type': 'variables_get', 'variable': var_name}, 'actions': [group['action']]})
                        else:
                            loop_body.extend([group['action']] * group['count'])

                    for k, diff_data in enumerate(differences):
                        loop_body.append({'type': 'math_change', 'variable': f"i_{k}", 'value': {'type': 'math_number', 'value': diff_data['commonDifference']}})

                    start_action_index = sum(g['count'] for g in grouped_actions[:i])
                    before_pattern_actions = actions[:start_action_index]
                    after_pattern_actions = actions[start_action_index + total_original_actions:]

                    loop_block: Action = {'type': 'maze_repeat', 'times': repeats, 'actions': loop_body}

                    return {'main': [*before_pattern_actions, *variable_setup_blocks, loop_block, *after_pattern_actions], 'procedures': {}}
    return None

def optimize_with_parameterized_functions(actions: List[Action], available_blocks: Set[str]) -> Optional[Dict[str, Any]]:
    """
    Tối ưu hóa bằng cách tạo ra các hàm có tham số.
    """
    if 'PROCEDURE' not in available_blocks:
        return None

    if not actions:
        return None

    grouped_actions = []
    current_action_key = json.dumps(actions[0], sort_keys=True)
    current_count = 0
    for action in actions:
        action_key = json.dumps(action, sort_keys=True)
        if action_key == current_action_key:
            current_count += 1
        else:
            grouped_actions.append({'action': json.loads(current_action_key), 'count': current_count})
            current_action_key = action_key
            current_count = 1
    grouped_actions.append({'action': json.loads(current_action_key), 'count': current_count})

    sequence_occurrences = {}
    for length in range(2, len(grouped_actions) // 2 + 1):
        for i in range(len(grouped_actions) - length + 1):
            sequence = grouped_actions[i:i+length]
            structure_key = json.dumps([g['action'] for g in sequence], sort_keys=True)
            
            if structure_key not in sequence_occurrences:
                sequence_occurrences[structure_key] = {'structure': [g['action'] for g in sequence], 'occurrences': []}
            
            diff_indices = [k for k, g in enumerate(sequence) if g['action'].get('type') == 'maze_moveForward']
            if len(diff_indices) == 1:
                counts = [g['count'] for g in sequence]
                sequence_occurrences[structure_key]['occurrences'].append({'index': i, 'counts': counts})

    best_savings = 0
    best_result = None

    for data in sequence_occurrences.values():
        structure = data['structure']
        occurrences = data['occurrences']
        if len(occurrences) < 2:
            continue

        param_index = next((i for i, s in enumerate(structure) if s.get('type') == 'maze_moveForward'), -1)
        if param_index == -1:
            continue

        sequence_length = len(structure)
        original_blocks = len(occurrences) * sequence_length
        new_blocks = (len(occurrences) * 2) + sequence_length
        savings = original_blocks - new_blocks

        if savings > best_savings:
            best_savings = savings
            proc_name = f"do_pattern_{len(best_result.get('procedures', {})) + 1 if best_result else 1}"
            param_name = 'steps'

            procedure_body = []
            for i, group_action in enumerate(structure):
                if i == param_index:
                    procedure_body.append({'type': 'maze_repeat', 'times': {'type': 'variables_get', 'variable': param_name}, 'actions': [group_action]})
                else:
                    procedure_body.append(group_action)

            new_main_grouped = list(grouped_actions)
            for occ in reversed(occurrences):
                call_block: Action = {
                    'type': 'procedures_callnoreturn',
                    'mutation': {'name': proc_name, 'arguments': [{'name': param_name, 'value': occ['counts'][param_index]}]}
                }
                new_main_grouped[occ['index'] : occ['index'] + sequence_length] = [{'action': call_block, 'count': 1}]

            final_main = [g['action'] for g in new_main_grouped for _ in range(g['count'])]
            best_result = {'main': final_main, 'procedures': {proc_name: procedure_body}}

    return best_result

def parse_allowed_topics(preset_key: Optional[str]) -> List[str]:
    """
    Phân tích `toolboxPresetKey` để xác định tất cả các topic lập trình được phép.
    """
    if not preset_key:
        return ['commands']
    
    parts = preset_key.split('_')
    main_topic = parts[0]
    allowed = {main_topic}
    if 'functions' in preset_key:
        allowed.add('functions')
    
    return list(allowed)

def create_structured_solution(
    initial_actions: List[Action],
    available_blocks: Set[str],
    solution_config: Solution,
    world: GameWorld,
    blockly_config: Optional[QuestBlocklyConfig] = None
) -> Dict[str, Any]:
    """
    Phân tích và tối ưu hóa một chuỗi hành động thành các giải pháp khác nhau.
    """
    blockly_config = blockly_config or {}
    topics = parse_allowed_topics(blockly_config.get('toolboxPresetKey'))
    allowed_strategies = set()

    if 'functions' in topics: allowed_strategies.add('func_only')
    if 'loops' in topics: allowed_strategies.add('loop_only')
    if 'functions' in topics and 'loops' in topics: allowed_strategies.add('func_then_loop')
    if 'variables' in topics: allowed_strategies.add('variable_loop')
    if 'conditionals' in topics or 'while' in topics: allowed_strategies.add('conditional_while')
    if 'parameters' in topics: allowed_strategies.add('parameterized_function')

    print(f"Solver: Preset key là '{blockly_config.get('toolboxPresetKey')}'. Các chiến lược được phép:", list(allowed_strategies))

    strategies = []
    original_actions = list(initial_actions)

    if 'parameterized_function' in allowed_strategies:
        param_func_solution = optimize_with_parameterized_functions(original_actions, available_blocks)
        if param_func_solution:
            strategies.append({'name': 'parameterized_function', 'solution': param_func_solution})

    if 'variable_loop' in allowed_strategies:
        var_solution = optimize_with_variables_and_loops(original_actions, available_blocks)
        if var_solution:
            further_optimized_main = optimize_with_loops(var_solution['main'], available_blocks, solution_config)['main']
            var_solution['main'] = further_optimized_main
            strategies.append({'name': 'variable_loop', 'solution': var_solution})

    if 'conditional_while' in allowed_strategies:
        conditional_while_solution = optimize_with_conditional_while(original_actions, available_blocks, solution_config)
        if conditional_while_solution:
            strategies.append({'name': 'conditional_while', 'solution': conditional_while_solution})

    simple_while_actions = optimize_with_while_loops(original_actions, available_blocks, world)

    if 'loop_only' in allowed_strategies:
        loop_only_solution = optimize_with_loops(simple_while_actions, available_blocks, solution_config)
        strategies.append({'name': 'loop_only', 'solution': loop_only_solution})

    if 'func_only' in allowed_strategies:
        func_only_solution = optimize_with_functions(original_actions, available_blocks, solution_config)
        strategies.append({'name': 'func_only', 'solution': func_only_solution})

    if 'func_then_loop' in allowed_strategies:
        func_only_for_looping = optimize_with_functions(original_actions, available_blocks, solution_config)
        main_after_funcs = func_only_for_looping['main']
        loops_after_funcs = optimize_with_loops(main_after_funcs, available_blocks, solution_config)
        strategies.append({'name': 'func_then_loop', 'solution': {'main': loops_after_funcs['main'], 'procedures': func_only_for_looping['procedures']}})

    if not strategies:
        empty_solution = {'main': original_actions, 'procedures': {}}
        return {'pedagogicalSolution': empty_solution, 'technicallyOptimalSolution': empty_solution}

    strategy_priority = {
        'func_only': 2.0,
        'loop_only': 3.0,
        'func_then_loop': 3.5,
        'variable_loop': 4.0,
        'conditional_while': 7.0,
        'wall_follower': 8.0,
        'parameterized_function': 9.0,
    }

    best_solution = strategies[0]['solution']
    best_strategy_name = strategies[0]['name']
    min_cost = calculate_total_blocks_in_solution(best_solution)

    technically_optimal_solution = strategies[0]['solution']
    technically_optimal_cost = min_cost

    print("--- Bắt đầu so sánh các chiến lược tối ưu ---")
    print(f"Chiến lược ban đầu: '{strategies[0]['name']}', Chi phí: {min_cost} khối")

    for strategy in strategies[1:]:
        current_strategy_name = strategy['name']
        current_solution = strategy['solution']
        current_cost = calculate_total_blocks_in_solution(current_solution)
        print(f"So sánh với chiến lược: '{current_strategy_name}', Chi phí: {current_cost} khối")

        if current_cost < technically_optimal_cost:
            technically_optimal_cost = current_cost
            technically_optimal_solution = current_solution

        current_priority = strategy_priority.get(current_strategy_name, 0)
        best_priority = strategy_priority.get(best_strategy_name, 0)
        COST_TOLERANCE = 2

        if current_cost < min_cost:
            print(f" -> Lựa chọn mới: '{current_strategy_name}' (chi phí thấp hơn)")
            min_cost, best_solution, best_strategy_name = current_cost, current_solution, current_strategy_name
        elif current_cost == min_cost and current_priority > best_priority:
            print(f" -> Lựa chọn mới: '{current_strategy_name}' (cùng chi phí nhưng ưu tiên cao hơn)")
            best_solution, best_strategy_name = current_solution, current_strategy_name
        elif current_cost <= min_cost + COST_TOLERANCE and current_priority > best_priority:
            print(f" -> Lựa chọn mới: '{current_strategy_name}' (chi phí chấp nhận được và ưu tiên cao hơn)")
            min_cost, best_solution, best_strategy_name = current_cost, current_solution, current_strategy_name

    print(f"--- Kết quả: Chiến lược sư phạm được chọn là '{best_strategy_name}' với chi phí {min_cost} khối. ---")
    print(f"--- Ghi chú: Chiến lược tối ưu kỹ thuật có chi phí {technically_optimal_cost} khối. ---")

    def finalize_solution(solution):
        final_main = []
        for action in solution['main']:
            if action.get('type') == 'CALL' and action.get('name'):
                final_main.append({'type': 'procedures_callnoreturn', 'mutation': {**(action.get('mutation') or {}), 'name': action['name']}})
            else:
                final_main.append(action)
        
        procedures = solution.get('procedures')
        return {'main': final_main, 'procedures': procedures if procedures else None}

    final_pedagogical_solution = finalize_solution(best_solution)
    final_technically_optimal_solution = finalize_solution(technically_optimal_solution)

    return {
        'pedagogicalSolution': final_pedagogical_solution,
        'technicallyOptimalSolution': final_technically_optimal_solution
    }

def count_blocks_in_structure(actions: List[Action]) -> int:
    """
    Đếm tổng số khối lệnh trong một structuredSolution.
    """
    count = 0
    for action in actions:
        count += 1
        if isinstance(action.get('actions'), list):
            count += count_blocks_in_structure(action['actions'])
        if action.get('type') == 'controls_if':
            if action.get('condition'): count += 1
            if isinstance(action.get('if_actions'), list): count += count_blocks_in_structure(action['if_actions'])
            for else_if in action.get('else_if_actions', []):
                count += 1
                if else_if.get('condition'): count += 1
                if isinstance(else_if.get('actions'), list): count += count_blocks_in_structure(else_if['actions'])
            if isinstance(action.get('else_actions'), list): count += count_blocks_in_structure(action['else_actions'])
    return count

def calculate_total_blocks_in_solution(structured_solution: Dict[str, Any]) -> int:
    """
    Đếm tổng số khối lệnh trong toàn bộ structuredSolution.
    """
    total = 1 + count_blocks_in_structure(structured_solution.get('main', []))
    if structured_solution.get('procedures'):
        for proc_name, proc_body in structured_solution['procedures'].items():
            total += 1 + count_blocks_in_structure(proc_body)
    return total

def calculate_optimal_lines(structured_solution: Dict[str, Any]) -> int:
    """
    Tính toán số dòng code logic (LLOC) từ structuredSolution.
    """
    def _count_lines_recursively(block_list: List[Action], declared_vars: Set[str]) -> int:
        lloc = 0
        if not block_list: return 0
        for block in block_list:
            block_type = block.get('type')
            if block_type == "variables_set":
                var_name = block.get('variable')
                if var_name and var_name not in declared_vars:
                    lloc += 1
                    declared_vars.add(var_name)
                lloc += 1
            elif block_type in ['maze_repeat', 'maze_for', 'maze_forever', 'maze_repeat_until']:
                lloc += 1
                lloc += _count_lines_recursively(block.get('actions', []) or block.get('body', []), declared_vars)
            elif block_type == 'controls_if':
                lloc += 1
                if block.get('if_actions'): lloc += _count_lines_recursively(block['if_actions'], declared_vars)
                if block.get('else_if_actions'):
                    for else_if_block in block['else_if_actions']:
                        lloc += 1
                        lloc += _count_lines_recursively(else_if_block.get('actions', []), declared_vars)
                if block.get('else_actions'):
                    lloc += 1
                    lloc += _count_lines_recursively(block['else_actions'], declared_vars)
            elif block_type:
                lloc += 1
        return lloc

    total_lloc = 0
    declared_variables = set()
    if structured_solution.get('procedures'):
        for proc_name, proc_body in structured_solution['procedures'].items():
            total_lloc += 1
            total_lloc += _count_lines_recursively(proc_body, declared_variables)
    
    total_lloc += _count_lines_recursively(structured_solution.get('main', []), declared_variables)
    return total_lloc

def solve_maze(game_config: GameConfig, solution_config: Solution, blockly_config: Optional[QuestBlocklyConfig] = None) -> Optional[Solution]:
    """
    Tìm lời giải cho một cấu hình game mê cung.
    """
    return a_star_path_solver(game_config, solution_config, blockly_config)

def a_star_path_solver(game_config: GameConfig, solution_config: Solution, blockly_config: Optional[QuestBlocklyConfig] = None) -> Optional[Solution]:
    """
    Thuật toán A* tìm đường đi theo VỊ TRÍ thay vì HÀNH ĐỘNG.
    """
    if not game_config.get('players') or not game_config['players'][0].get('start') or not game_config.get('finish'):
        print("Solver: Thiếu điểm bắt đầu hoặc kết thúc.", file=sys.stderr)
        return None

    blockly_config = blockly_config or {}
    available_blocks = set()
    if blockly_config.get('availableBlocks') and isinstance(blockly_config['availableBlocks'], list):
        available_blocks.update(blockly_config['availableBlocks'])
    else:
        queue = list((blockly_config.get('toolbox') or {}).get('contents', []) or blockly_config.get('contents', []))
        while queue:
            item = queue.pop(0)
            if not item: continue
            if item.get('type'): available_blocks.add(item['type'])
            if item.get('custom') == 'PROCEDURE': available_blocks.add('PROCEDURE')
            if isinstance(item.get('contents'), list): queue.extend(item['contents'])
    print("Solver: Các khối lệnh có sẵn từ toolbox:", list(available_blocks))

    has_logic_blocks = 'controls_if' in available_blocks and 'maze_is_path' in available_blocks
    has_loop_block = 'maze_forever' in available_blocks or 'controls_whileUntil' in available_blocks
    is_algorithmic_mode = has_logic_blocks and has_loop_block

    world = GameWorld(game_config, solution_config)
    start_pos = game_config['players'][0]['start']
    start_dir = start_pos.get('direction', 2) # Mặc định là 2 (+Z)
    start_state = GameState(start_pos, start_dir, world)
    start_node = PathNode(start_state)

    open_list: List[PathNode] = []
    closed_list: Dict[str, float] = {}

    def manhattan(p1: Position, p2: Position) -> int:
        return abs(p1['x'] - p2['x']) + abs(p1['y'] - p2['y']) + abs(p1['z'] - p2['z'])

    def heuristic(state: GameState) -> float:
        current_pos = state.position
        required_goals = world.solution_config.get('itemGoals', {})
        remaining_goal_positions = []

        for goal_type, required_count in required_goals.items():
            if goal_type != 'switch':
                collected_count = sum(1 for item_id in state.collected_items if world.collectibles_by_id.get(item_id, {}).get('type') == goal_type)
                if collected_count < required_count:
                    for item_id, item in world.collectibles_by_id.items():
                        if item['type'] == goal_type and item_id not in state.collected_items:
                            remaining_goal_positions.append(item['position'])
        
        if 'switch' in required_goals:
            for pos_key, s in world.switches_by_pos.items():
                if state.switch_states.get(s['id']) != 'on':
                    x, y, z = map(int, pos_key.split(','))
                    remaining_goal_positions.append({'x': x, 'y': y, 'z': z})

        if not remaining_goal_positions:
            return manhattan(current_pos, world.finish_pos)

        max_heuristic = float(manhattan(current_pos, world.finish_pos))
        if 'PROCEDURE' in available_blocks:
            max_heuristic *= 0.95

        for pos in remaining_goal_positions:
            cost_via_this_goal = manhattan(current_pos, pos) + manhattan(pos, world.finish_pos)
            max_heuristic = max(max_heuristic, cost_via_this_goal)
        
        return max_heuristic

    def is_goal_achieved(state: GameState) -> bool:
        required_goals = world.solution_config.get('itemGoals', {})
        for goal_type, required_count in required_goals.items():
            if goal_type == 'switch':
                toggled_on_count = sum(1 for s in state.switch_states.values() if s == 'on')
                if isinstance(required_count, str) and required_count.lower() == 'all':
                    if toggled_on_count < len(world.switches_by_pos):
                        return False
                else:
                    numeric_required_count = int(required_count)
                    if toggled_on_count < numeric_required_count:
                        return False
            else:
                collected_count = sum(1 for item_id in state.collected_items if world.collectibles_by_id.get(item_id, {}).get('type') == goal_type)
                if isinstance(required_count, str) and required_count.lower() == 'all':
                    total_of_type = sum(1 for c in world.collectibles_by_id.values() if c['type'] == goal_type)
                    if collected_count < total_of_type:
                        return False
                else:
                    numeric_required_count = int(required_count)
                    if collected_count < numeric_required_count:
                        return False
        return True

    start_node.h_cost = heuristic(start_state)
    open_list.append(start_node)

    while open_list:
        open_list.sort(key=lambda n: n.f_cost)
        current_node = open_list.pop(0)
        state_key = current_node.state.get_key()

        if state_key in closed_list and closed_list[state_key] <= current_node.g_cost:
            continue
        closed_list[state_key] = current_node.g_cost

        state = current_node.state

        if is_goal_achieved(state):
            final_path_node = find_path_to_finish(current_node, world, heuristic)
            if not final_path_node:
                print("Solver: Đã hoàn thành mục tiêu nhưng không tìm thấy đường đến đích. Tiếp tục tìm kiếm...", file=sys.stderr)
                continue

            path = final_path_node.raw_actions_to_reach
            print("Solver: Tìm thấy lời giải tối ưu!", path)

            turn_count = sum(1 for action in path if 'turn' in action)
            is_complex_path = turn_count > 2
            requires_jumping = 'jump' in path

            if is_algorithmic_mode and is_complex_path and not requires_jumping:
                print(f"Solver: Chế độ thuật toán đang hoạt động (số lần rẽ: {turn_count}). Ghi đè structuredSolution bằng thuật toán bám tường.")
                wall_follower_solution = create_wall_follower_solution(solution_config)
                pedagogical_solution = wall_follower_solution
                technically_optimal_solution = wall_follower_solution
            else:
                solutions = create_structured_solution(convert_raw_to_structured_actions(path), available_blocks, solution_config, world, blockly_config)
                pedagogical_solution = solutions['pedagogicalSolution']
                technically_optimal_solution = solutions['technicallyOptimalSolution']

            final_optimal_blocks = calculate_total_blocks_in_solution(pedagogical_solution)
            reference_optimal_blocks = calculate_total_blocks_in_solution(technically_optimal_solution)
            final_optimal_lines = calculate_optimal_lines(pedagogical_solution)
            reference_optimal_lines = calculate_optimal_lines(technically_optimal_solution)
            basic_solution_main = convert_raw_to_structured_actions(path)

            return {
                'optimalBlocks': final_optimal_blocks,
                'optimalLines': final_optimal_lines,
                'rawActions': path,
                'structuredSolution': pedagogical_solution,
                'referenceSolution': technically_optimal_solution,
                'referenceOptimalBlocks': reference_optimal_blocks,
                'referenceOptimalLines': reference_optimal_lines,
                'basicSolution': {'main': basic_solution_main, 'procedures': {}}
            }

        neighbors = find_neighbors(state, world)

        for neighbor in neighbors:
            neighbor_pos = neighbor['pos']
            move_action = neighbor['action']
            next_state = state.clone()
            next_state.position = neighbor_pos
            neighbor_pos_key = f"{neighbor_pos['x']},{neighbor_pos['y']},{neighbor_pos['z']}"

            cost = 0.0
            actions_to_reach_neighbor = []
            last_action = current_node.raw_actions_to_reach[-1] if current_node.raw_actions_to_reach else None

            turn_info = calculate_turn_actions(state, neighbor_pos, last_action)
            actions_to_reach_neighbor.extend(turn_info['actions'])
            cost += turn_info['cost']

            REPETITION_DISCOUNT = 0.01
            if move_action == 'walk':
                actions_to_reach_neighbor.append('moveForward')
                move_cost = 1.0 - REPETITION_DISCOUNT if last_action == 'moveForward' else 1.0
                cost += move_cost
            else: # jump
                actions_to_reach_neighbor.append('jump')
                jump_cost = 1.2 - REPETITION_DISCOUNT if last_action == 'jump' else 1.2
                cost += jump_cost
            
            next_state.direction = turn_info['newDirection']

            item = world.collectibles_by_pos.get(neighbor_pos_key)
            if item and item['id'] not in next_state.collected_items:
                next_state.collected_items.add(item['id'])
                cost += 0.01
                actions_to_reach_neighbor.append('collect')

            switch_info = world.switches_by_pos.get(neighbor_pos_key)
            if switch_info and next_state.switch_states.get(switch_info['id']) != 'on':
                next_state.switch_states[switch_info['id']] = 'on'
                cost += 0.01
                actions_to_reach_neighbor.append('toggleSwitch')

            new_g_cost = current_node.g_cost + cost
            next_state_key = next_state.get_key()

            if next_state_key in closed_list and closed_list[next_state_key] <= new_g_cost:
                continue

            existing_node = next((n for n in open_list if n.state.get_key() == next_state_key), None)
            if existing_node and existing_node.g_cost <= new_g_cost:
                continue

            next_node = PathNode(next_state)
            next_node.parent = current_node
            next_node.g_cost = new_g_cost
            next_node.h_cost = heuristic(next_state)
            next_node.raw_actions_to_reach = [*current_node.raw_actions_to_reach, *actions_to_reach_neighbor]

            if existing_node:
                open_list[open_list.index(existing_node)] = next_node
            else:
                open_list.append(next_node)

    print("Solver: Không tìm thấy lời giải.", file=sys.stderr)
    return None

def find_path_to_finish(start_node: PathNode, world: GameWorld, heuristic: callable) -> Optional[PathNode]:
    """
    Tìm đường đi ngắn nhất từ trạng thái hiện tại đến ô kết thúc.
    """
    open_list: List[PathNode] = [start_node]
    closed_list: Dict[str, float] = {}

    while open_list:
        open_list.sort(key=lambda n: n.f_cost)
        current_node = open_list.pop(0)
        state_key = current_node.state.get_key()

        if state_key in closed_list and closed_list[state_key] <= current_node.g_cost:
            continue
        closed_list[state_key] = current_node.g_cost

        state = current_node.state
        pos = state.position
        if pos['x'] == world.finish_pos['x'] and pos['y'] == world.finish_pos['y'] and pos['z'] == world.finish_pos['z']:
            return current_node

        neighbors = find_neighbors(state, world)
        for neighbor in neighbors:
            neighbor_pos = neighbor['pos']
            move_action = neighbor['action']
            next_state = state.clone()
            next_state.position = neighbor_pos

            cost = 0.0
            actions_to_reach_neighbor = []
            last_action = current_node.raw_actions_to_reach[-1] if current_node.raw_actions_to_reach else None

            turn_info = calculate_turn_actions(state, neighbor_pos, last_action)
            actions_to_reach_neighbor.extend(turn_info['actions'])
            cost += turn_info['cost']

            move_action_str = 'moveForward' if move_action == 'walk' else 'jump'
            actions_to_reach_neighbor.append(move_action_str)
            cost += 1.0

            next_state.direction = turn_info['newDirection']
            new_g_cost = current_node.g_cost + cost
            next_state_key = next_state.get_key()

            if next_state_key in closed_list and closed_list[next_state_key] <= new_g_cost:
                continue

            next_node = PathNode(next_state)
            next_node.parent = current_node
            next_node.g_cost = new_g_cost
            next_node.h_cost = heuristic(next_state)
            next_node.raw_actions_to_reach = [*current_node.raw_actions_to_reach, *actions_to_reach_neighbor]
            open_list.append(next_node)

    return None

def find_neighbors(state: GameState, world: GameWorld) -> List[Dict[str, Any]]:
    """
    Tìm tất cả các hàng xóm hợp lệ từ một trạng thái nhất định.
    """
    neighbors = []
    pos = state.position
    x, y, z = pos['x'], pos['y'], pos['z']

    for d in DIRECTIONS:
        next_x, next_z = x + d['x'], z + d['z']

        # Walk
        walk_pos = {'x': next_x, 'y': y, 'z': next_z}
        ground_below_walk_pos = {'x': next_x, 'y': y - 1, 'z': next_z}
        block_at_walk_pos = world.world_map.get(f"{walk_pos['x']},{walk_pos['y']},{walk_pos['z']}")
        if block_at_walk_pos != 'wall.stone01' and f"{walk_pos['x']},{walk_pos['y']},{walk_pos['z']}" not in world.world_map and world.is_walkable(ground_below_walk_pos):
            neighbors.append({'pos': walk_pos, 'action': 'walk'})

        # Jump Up
        jump_up_obstacle_pos = {'x': next_x, 'y': y, 'z': next_z}
        jump_up_landing_pos = {'x': next_x, 'y': y + 1, 'z': next_z}
        obstacle_key = f"{jump_up_obstacle_pos['x']},{jump_up_obstacle_pos['y']},{jump_up_obstacle_pos['z']}"
        obstacle_model = world.world_map.get(obstacle_key)
        non_jumpable_obstacles = {'wall.stone01', 'lava.lava01', 'water.water01'}
        if obstacle_model and obstacle_model not in non_jumpable_obstacles and f"{jump_up_landing_pos['x']},{jump_up_landing_pos['y']},{jump_up_landing_pos['z']}" not in world.world_map:
            neighbors.append({'pos': jump_up_landing_pos, 'action': 'jump'})

        # Jump Down
        jump_down_air_pos = {'x': next_x, 'y': y, 'z': next_z}
        jump_down_landing_pos = {'x': next_x, 'y': y - 1, 'z': next_z}
        ground_below_jump_down = {'x': next_x, 'y': y - 2, 'z': next_z}
        if f"{jump_down_air_pos['x']},{jump_down_air_pos['y']},{jump_down_air_pos['z']}" not in world.world_map and \
           f"{jump_down_landing_pos['x']},{jump_down_landing_pos['y']},{jump_down_landing_pos['z']}" not in world.world_map and \
           world.is_walkable(ground_below_jump_down):
            neighbors.append({'pos': jump_down_landing_pos, 'action': 'jump'})

    return neighbors

def has_path_relative(state: GameState, relative_dir: str, world: GameWorld) -> bool:
    """
    Kiểm tra xem có đường đi hợp lệ theo một hướng tương đối không.
    """
    current_dir = state.direction
    if relative_dir == 'ahead':
        target_dir = current_dir
    elif relative_dir == 'left':
        target_dir = (current_dir - 1 + 4) % 4
    else: # right
        target_dir = (current_dir + 1) % 4

    dir_vector = DIRECTIONS[target_dir]
    pos = state.position
    next_pos = {'x': pos['x'] + dir_vector['x'], 'y': pos['y'], 'z': pos['z'] + dir_vector['z']}
    
    is_blocked = f"{next_pos['x']},{next_pos['y']},{next_pos['z']}" in world.world_map
    ground_below = {**next_pos, 'y': next_pos['y'] - 1}
    has_ground = world.is_walkable(ground_below)

    return not is_blocked and has_ground

def simulate_wall_follower(world: GameWorld, start_state: GameState) -> List[str]:
    """
    Mô phỏng thuật toán bám tường để tạo ra một chuỗi rawActions.
    """
    raw_actions = []
    current_state = start_state.clone()
    max_steps = 1000

    for _ in range(max_steps):
        pos = current_state.position
        if pos['x'] == world.finish_pos['x'] and pos['z'] == world.finish_pos['z']:
            break

        if has_path_relative(current_state, 'right', world):
            current_state.direction = (current_state.direction + 1) % 4
            raw_actions.append('turnRight')
            dir_vector = DIRECTIONS[current_state.direction]
            current_state.position['x'] += dir_vector['x']
            current_state.position['z'] += dir_vector['z']
            raw_actions.append('moveForward')
        elif has_path_relative(current_state, 'ahead', world):
            dir_vector = DIRECTIONS[current_state.direction]
            current_state.position['x'] += dir_vector['x']
            current_state.position['z'] += dir_vector['z']
            raw_actions.append('moveForward')
        else:
            current_state.direction = (current_state.direction - 1 + 4) % 4
            raw_actions.append('turnLeft')

        pos_key = f"{current_state.position['x']},{current_state.position['y']},{current_state.position['z']}"
        if pos_key in world.switches_by_pos and current_state.switch_states.get(world.switches_by_pos[pos_key]['id']) != 'on':
            current_state.switch_states[world.switches_by_pos[pos_key]['id']] = 'on'
            raw_actions.append('toggleSwitch')
        
        collectible = world.collectibles_by_pos.get(pos_key)
        if collectible and collectible['id'] not in current_state.collected_items:
            current_state.collected_items.add(collectible['id'])
            raw_actions.append('collect')
            
    return raw_actions

def create_wall_follower_solution(solution_config: Solution) -> Dict[str, Any]:
    """
    Tạo ra một lời giải có cấu trúc dựa trên thuật toán bám tường.
    """
    item_goal_actions = []
    item_goals = solution_config.get('itemGoals', {})

    for goal_type in item_goals:
        if goal_type != 'switch':
            item_goal_actions.append({
                'type': 'controls_if',
                'condition': {'type': 'maze_is_item_present', 'item_type': goal_type},
                'if_actions': [{'type': 'maze_collect'}]
            })

    if 'switch' in item_goals:
        item_goal_actions.append({
            'type': 'controls_if',
            'condition': {'type': 'maze_is_switch_state', 'state': 'off'},
            'if_actions': [{'type': 'maze_toggle_switch'}]
        })

    solution = {
        'main': [
            {
                'type': 'maze_forever',
                'actions': [
                    {
                        'type': 'controls_if',
                        'condition': {'type': 'maze_is_path', 'direction': 'path to the right'},
                        'if_actions': [
                            {'type': 'maze_turn', 'direction': 'turnRight'},
                            {'type': 'maze_moveForward'}
                        ],
                        'else_if_actions': [{
                            'condition': {'type': 'maze_is_path', 'direction': 'path ahead'},
                            'actions': [{'type': 'maze_moveForward'}]
                        }],
                        'else_actions': [{'type': 'maze_turn', 'direction': 'turnLeft'}]
                    },
                    *item_goal_actions
                ]
            }
        ]
    }
    return solution

def calculate_turn_actions(current_state: GameState, next_pos: Position, last_action: Optional[str]) -> Dict[str, Any]:
    """
    Tính toán các hành động xoay, hướng mới và chi phí.
    """
    actions = []
    REPETITION_DISCOUNT = 0.01
    cost = 0.0
    pos = current_state.position
    dx = next_pos['x'] - pos['x']
    dz = next_pos['z'] - pos['z']

    target_dir = current_state.direction
    if dx == 1 and dz == 0: target_dir = 1
    elif dx == -1 and dz == 0: target_dir = 3
    elif dx == 0 and dz == 1: target_dir = 2
    elif dx == 0 and dz == -1: target_dir = 0

    if target_dir != current_state.direction:
        diff = (target_dir - current_state.direction + 4) % 4
        if diff == 1:
            actions.append('turnRight')
            cost += 0.1 - REPETITION_DISCOUNT if last_action == 'turnRight' else 0.1
        elif diff == 3:
            actions.append('turnLeft')
            cost += 0.1 - REPETITION_DISCOUNT if last_action == 'turnLeft' else 0.1
        elif diff == 2:
            actions.append('turnRight')
            actions.append('turnRight')
            cost += 0.2

    return {'actions': actions, 'newDirection': target_dir, 'cost': cost}

if __name__ == "__main__":
    if len(sys.argv) > 1:
        filepath = sys.argv[1]
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                level_data = json.load(f)
            
            solution = solve_maze(level_data['gameConfig'], level_data['solution'], level_data.get('blocklyConfig'))
            
            if solution:
                print("\n--- FINAL SOLUTION ---")
                print(json.dumps(solution, indent=2, ensure_ascii=False))
                print(f"\nOptimal Blocks: {solution.get('optimalBlocks')}")
                print(f"Optimal Lines: {solution.get('optimalLines')}")
            else:
                print("\nNo solution found.")

        except Exception as e:
            print(f"Error processing file {filepath}: {e}")
            traceback.print_exc()