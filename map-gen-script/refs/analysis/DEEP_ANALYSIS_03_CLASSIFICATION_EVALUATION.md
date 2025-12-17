# Phân tích Chuyên sâu: Phân loại & Đánh giá Màn chơi

Tài liệu phân tích hệ thống trích xuất metadata, gán skill codes, và phân loại độ khó.

---

## 📊 Tổng quan Pipeline

```mermaid
flowchart LR
    Levels[Game Levels JSON] --> Extract[extract_map_info.py]
    Extract --> |required_concepts| Skill[skill_mapper.py]
    Skill --> |core_skills| Diff[assign_difficulty.py]
    Diff --> |difficulty| QB[question_bank.xlsx]
```

---

## 🗂️ Files chính

| File | Chức năng |
|------|-----------|
| [extract_map_info.py](file:///Users/tonypham/MEGA/WebApp/3d-quest-map-gen/scripts/extract_map_info.py) | Trích xuất metadata từ game levels |
| [skill_mapper.py](file:///Users/tonypham/MEGA/WebApp/3d-quest-map-gen/scripts/skill_mapper.py) | Gán skill codes dựa trên rules |
| [master_mapping_rules.py](file:///Users/tonypham/MEGA/WebApp/3d-quest-map-gen/scripts/master_mapping_rules.py) | Định nghĩa quy tắc mapping |
| [assign_difficulty.py](file:///Users/tonypham/MEGA/WebApp/3d-quest-map-gen/scripts/assign_difficulty.py) | Tính độ khó (Intrinsic/Perceived) |

---

## 📋 Metrics được trích xuất

### Từ `extract_map_info.py`

| Metric | Nguồn | Ý nghĩa |
|--------|-------|---------|
| `rawActionsCount` | `len(rawActions)` | Số hành động thực thi |
| `optimalBlocks` | solver | Số blocks Blockly tối ưu |
| `optimalLines` | `calculate_optimal_lines()` | LLOC |
| `crystalCount` | `itemGoals.crystal` | Số crystal cần thu |
| `switchCount` | `itemGoals.switch` | Số switch cần bật |
| `obstacleCount` | `len(obstacles)` | Số chướng ngại vật |
| `required_concepts` | `detect_required_concepts()` | Kiến thức cần áp dụng |

### Hàm `detect_required_concepts`

```python
def detect_required_concepts(data: dict) -> list:
    concepts = {"COMMANDS"}  # Luôn có
    
    # Từ toolboxPresetKey
    preset = data.get('toolboxPresetKey', '')
    if 'functions' in preset: concepts.add("FUNCTIONS")
    if 'loops' in preset: concepts.add("FOR_LOOPS")
    if 'while' in preset: concepts.add("WHILE_LOOPS")
    
    # Từ structuredSolution
    if data.get('procedures'): concepts.add("FUNCTIONS")
    for block in data.get('main', []):
        if 'repeat' in block.get('type', ''): concepts.add("FOR_LOOPS")
        if 'if' in block.get('type', ''): concepts.add("CONDITIONALS")
    
    return sorted(concepts)
```

---

## 🏷️ Skill Mapping System

### Quy tắc trong `master_mapping_rules.py`

```python
MASTER_MAPPING_RULES = {
    'by_text_keywords': {
        r'vòng lặp|loop': 'LOOPS',
        r'hàm|function': 'FUNCTIONS',
        r'điều kiện|if': 'CONDITIONALS'
    },
    'by_challenge_type': {
        'SIMPLE_APPLY': 'BASIC_COMMANDS',
        'DEBUG_FIX_LOGIC': 'DEBUGGING'
    },
    'by_toolbox_preset': {
        'functions': 'FUNCTIONS',
        'loops': 'FOR_LOOPS',
        'while': 'WHILE_LOOPS'
    },
    'by_map_type': {
        'plowing_field': ['NESTED_LOOPS', 'FOR_LOOPS'],
        'complex_maze': ['ALGORITHMS', 'PATH_FINDING']
    },
    'by_map_params': {
        'bug_type': {
            'incorrect_block': 'DEBUG_WRONG_COMMAND',
            'sequence_error': 'DEBUG_SEQUENCE'
        }
    },
    'by_solution_goals': {
        'crystal': 'COLLECTING',
        'switch': 'TOGGLING'
    }
}
```

### Hàm `generate_core_skills`

```python
def generate_core_skills(row: pd.Series) -> list:
    collected_skills = set()
    
    # 1. Quét text (title, description)
    # 2. Quét challenge_type
    # 3. Quét toolbox_preset
    # 4. Quét map_type
    # 5. Quét gen_params (bao gồm bug_config phức tạp)
    # 6. Quét solution_goals
    
    return sorted(list(collected_skills))
```

---

## 📊 Hệ thống Độ khó

### Hai tầng độ khó

| Tầng | Metric | Scale | Mục đích |
|------|--------|-------|----------|
| **Intrinsic** | Độ khó thực sự | Easy/Medium/Hard/Expert | Đánh giá khách quan |
| **Perceived** | Độ khó cảm nhận | 1-10 | Điều chỉnh theo ngữ cảnh |

### Tính Intrinsic Difficulty

```python
def assign_intrinsic_difficulty(row) -> str:
    params = get_params_as_dict(row['gen_params'])
    map_type = row['gen_map_type']
    
    # Lấy scale_metric từ MAP_STRUCTURE_DEFINITIONS
    definition = MAP_STRUCTURE_DEFINITIONS.get(map_type, MAP_STRUCTURE_DEFINITIONS['default'])
    scale = definition['scale_metric'](params)
    
    # Thresholds
    if scale <= 8: return "Easy"
    if scale <= 15: return "Medium"
    if scale <= 25: return "Hard"
    return "Expert"
```

### MAP_STRUCTURE_DEFINITIONS

```python
MAP_STRUCTURE_DEFINITIONS = {
    "straight_line": {"scale_metric": lambda p: int(p.get("path_length", 5))},
    "l_shape": {"scale_metric": lambda p: int(p.get("arm1_length", 4)) + int(p.get("arm2_length", 4))},
    "plowing_field": {"scale_metric": lambda p: int(p.get("rows", 3)) * int(p.get("cols", 4))},
    "complex_maze": {"scale_metric": lambda p: int(p.get("maze_width", 5)) * int(p.get("maze_depth", 5)) // 5},
    # ... 19+ map types defined
}
```

### Tính Perceived Difficulty

```python
def get_perceived_difficulty(row, intrinsic: str) -> int:
    base_scores = {"Easy": 2, "Medium": 4, "Hard": 7, "Expert": 9}
    score = base_scores[intrinsic]
    
    # Điều chỉnh theo topic
    if row['topic_name'] in ['Giới thiệu', 'Introduction']:
        score = max(1, score - 1)  # Giảm 1 điểm
    elif row['topic_name'] in ['Gỡ lỗi Nâng cao', 'Advanced Debugging']:
        score = min(10, score + 1)  # Tăng 1 điểm
    
    # Điều chỉnh theo exam_type
    if row.get('exam_type') == 'PRACTICE':
        score = max(1, score - 1)
    elif row.get('exam_type') == 'FINAL':
        score = min(10, score + 1)
    
    return score
```

---

## 🔄 Workflow Đầy đủ

```bash
# 1. Sinh maps (tự động trích xuất metrics)
python3 scripts/generate_all_maps.py

# 2. Trích xuất và phân loại (nếu cần riêng)
python3 scripts/extract_map_info.py

# 3. Output: data/0_source/question_bank.xlsx
```

### Output Columns

| Column | Type | Description |
|--------|------|-------------|
| `id` | string | Map ID |
| `rawActionsCount` | int | Số hành động |
| `optimalBlocks` | int | Số blocks |
| `optimalLines` | int | LLOC |
| `crystalCount` | int | Số crystals |
| `switchCount` | int | Số switches |
| `obstacleCount` | int | Số obstacles |
| `required_concepts` | list | Concepts cần thiết |
| `core_skills` | list | Skills được gán |
| `intrinsic_difficulty` | string | Easy/Medium/Hard/Expert |
| `perceived_difficulty` | int | 1-10 |

---

## 📚 Tài liệu liên quan

- [DEEP_ANALYSIS_01_MAP_CREATION.md](file:///Users/tonypham/MEGA/WebApp/3d-quest-map-gen/instructions/DEEP_ANALYSIS_01_MAP_CREATION.md)
- [DEEP_ANALYSIS_02_SOLVING_ENGINE.md](file:///Users/tonypham/MEGA/WebApp/3d-quest-map-gen/instructions/DEEP_ANALYSIS_02_SOLVING_ENGINE.md)
- [METADATA_REFERENCE_GUIDE.md](file:///Users/tonypham/MEGA/WebApp/3d-quest-map-gen/instructions/METADATA_REFERENCE_GUIDE.md)
