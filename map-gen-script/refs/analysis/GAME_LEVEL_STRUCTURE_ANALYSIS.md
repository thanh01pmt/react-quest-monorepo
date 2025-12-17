# Phân tích Cấu trúc Màn chơi Game Level JSON

## 📋 Tổng quan

Mỗi file JSON game level chứa đầy đủ thông tin để:
1. Hiển thị màn chơi trên UI game
2. Xác định mục tiêu và điều kiện chiến thắng
3. Định nghĩa các công cụ (blocks) mà người chơi có thể sử dụng
4. Lưu trữ lời giải tối ưu

---

## 🏗️ Cấu trúc JSON

### 1. Thông tin định danh

```json
{
  "id": "COMMANDS_G3.CODING_COMMANDS_BASIC-MOVEMENT.SIMPLE_APPLY.C1-var1",
  "gameType": "maze",
  "topic": "topic-title-coding_commands_basic-movement",
  "level": 1
}
```

| Trường | Mô tả | Ví dụ |
|--------|-------|-------|
| `id` | Định danh duy nhất, format: `{TOPIC}_{GRADE}.{SUBJECT}_{SUBTOPIC}.{CHALLENGE_TYPE}.C{N}-var{M}` | `COMMANDS_G3.CODING_COMMANDS_BASIC-MOVEMENT.SIMPLE_APPLY.C1-var1` |
| `gameType` | Loại game | `maze` |
| `topic` | Chủ đề bài học | `topic-title-coding_commands_basic-movement` |
| `level` | Số thứ tự level | `1` |

---

### 2. Thông tin Phân loại Kiến thức (Files mới hơn)

> ⚠️ **Chỉ có trong các file được sinh gần đây (functions_l1_movement_only_*)**

```json
{
  "grade": "G312",
  "challenge_type": "SIMPLE_APPLY",
  "difficulty_code": "EASY",
  "gen_map_type": "straight_line",
  "gen_logic_type": "function_logic",
  
  "core_skill_codes": [
    "CMD_MOVE_FORWARD",
    "FUNC_DEFINE_SIMPLE",
    "FUNC_INTRO_CALL",
    "LOOP_FOR_BASIC",
    "SEQ_PLANNING_SIMPLE"
  ],
  
  "subject_codes": ["FUNCTIONS"],
  "category_codes": ["FUNCTIONS_G312"],
  "topic_codes": ["CODING_FUNCTIONS_MOVEMENT-PATTERNS"],
  
  "bloom_level_codes": ["ANALYZE", "APPLY"],
  "knowledge_dimension_codes": ["PROCEDURAL", "CONCEPTUAL"],
  "context_codes": ["FUNCTION_USAGE", "PATTERN_RECOGNITION", "SEQUENTIAL_EXECUTION"],
  
  "difficulty_perceived_score": 3,
  "difficulty_perceived_label": "Easy",
  "difficulty_intrinsic": "Easy"
}
```

| Nhóm | Trường | Mô tả |
|------|--------|-------|
| **Phân loại cấp cao** | `grade` | Khối lớp (G3, G312, etc.) |
| | `challenge_type` | `SIMPLE_APPLY`, `COMPLEX_APPLY`, `DEBUG` |
| | `difficulty_code` | `EASY`, `MEDIUM`, `HARD`, `EXPERT` |
| **Sinh map** | `gen_map_type` | Loại topology (`straight_line`, `l_shape`, `complex_maze`) |
| | `gen_logic_type` | Logic placer (`function_logic`, `maze_logic`) |
| **Kỹ năng** | `core_skill_codes` | Danh sách mã kỹ năng cần áp dụng |
| **Bloom's Taxonomy** | `bloom_level_codes` | Cấp độ nhận thức (`REMEMBER`, `APPLY`, `ANALYZE`) |
| **Chiều kiến thức** | `knowledge_dimension_codes` | `FACTUAL`, `CONCEPTUAL`, `PROCEDURAL`, `METACOGNITIVE` |
| **Ngữ cảnh** | `context_codes` | Ngữ cảnh áp dụng kỹ năng |

---

### 3. Cấu hình Blockly (Toolbox)

```json
{
  "blocklyConfig": {
    "toolbox": {
      "kind": "categoryToolbox",
      "contents": [
        {
          "kind": "category",
          "name": "%{BKY_GAMES_CATEVENTS}",
          "contents": [{ "kind": "block", "type": "maze_start" }]
        },
        {
          "kind": "category",
          "name": "%{BKY_GAMES_CATMOVEMENT}",
          "contents": [
            { "kind": "block", "type": "maze_moveForward" },
            { "kind": "block", "type": "maze_turn" },
            { "kind": "block", "type": "maze_jump" }
          ]
        }
      ]
    },
    "maxBlocks": 12,
    "startBlocks": "<xml>...</xml>",
    "toolboxPresetKey": "commands_l1_move"
  }
}
```

**Các loại block thường gặp:**

| Category | Block Types | Kỹ năng liên quan |
|----------|-------------|-------------------|
| **Events** | `maze_start` | Entry point |
| **Movement** | `maze_moveForward`, `maze_turn`, `maze_jump` | `CMD_MOVE_FORWARD`, `CMD_TURN`, `CMD_JUMP` |
| **Actions** | `maze_collect`, `maze_toggle_switch` | `INTERACT_COLLECT`, `INTERACT_TOGGLE` |
| **Loops** | `controls_repeat`, `controls_whileUntil` | `LOOP_FOR_BASIC`, `LOOP_WHILE` |
| **Conditionals** | `controls_if` | `COND_IF`, `COND_IF_ELSE` |
| **Procedures** | Custom PROCEDURE | `FUNC_DEFINE_SIMPLE`, `FUNC_INTRO_CALL` |

---

### 4. Cấu hình Game (Game World)

```json
{
  "gameConfig": {
    "type": "maze",
    "renderer": "3d",
    "blocks": [
      { "modelKey": "wall.brick02", "position": { "x": 4, "y": 0, "z": 20 } }
    ],
    "players": [
      { "id": "player1", "start": { "x": 4, "y": 1, "z": 20, "direction": 2 } }
    ],
    "collectibles": [
      { "id": "c1", "type": "crystal", "position": { "x": 2, "y": 1, "z": 3 } }
    ],
    "interactibles": [
      { "id": "s1", "type": "switch", "position": { "x": 3, "y": 1, "z": 1 }, "initialState": "off" }
    ],
    "obstacles": [
      { "id": "o1", "type": "obstacle", "modelKey": "lava.lava01", "position": { "x": 0, "y": 0, "z": 0 } }
    ],
    "finish": { "x": 3, "y": 1, "z": 3 }
  }
}
```

| Thành phần | Mô tả | Ảnh hưởng đến kiến thức |
|------------|-------|-------------------------|
| `blocks` | Các khối tạo nền địa hình | Hiểu cấu trúc không gian 3D |
| `players` | Vị trí và hướng bắt đầu | `direction` ảnh hưởng đến lệnh turn |
| `collectibles` | Vật phẩm cần thu thập | Yêu cầu `INTERACT_COLLECT` |
| `interactibles` | Công tắc/cơ chế tương tác | Yêu cầu `INTERACT_TOGGLE` |
| `obstacles` | Chướng ngại vật cần tránh | Yêu cầu `NAV_OBSTACLE_AVOID`, `SPATIAL_REASONING` |
| `finish` | Điểm đích | Xác định mục tiêu chính |

---

### 5. Lời giải (Solution)

```json
{
  "solution": {
    "type": "reach_target",
    "itemGoals": { "crystal": 1, "switch": 1 },
    "optimalBlocks": 16,
    "optimalLines": 15,
    "rawActions": [
      "turnRight", "moveForward", "moveForward", "turnLeft", 
      "moveForward", "collect", "moveForward", "turnLeft",
      "moveForward", "moveForward", "toggleSwitch", 
      "turnLeft", "turnLeft", "moveForward", "moveForward"
    ],
    "structuredSolution": {
      "main": [
        { "type": "maze_turn", "direction": "turnRight" },
        { "type": "maze_moveForward" },
        { "type": "maze_collect" },
        ...
      ],
      "procedures": {
        "PROCEDURE_1": [
          { "type": "maze_moveForward" },
          { "type": "maze_moveForward" }
        ]
      }
    }
  }
}
```

| Trường | Mô tả | Ý nghĩa phân tích kiến thức |
|--------|-------|----------------------------|
| `type` | Loại mục tiêu | `reach_target` = đến đích |
| `itemGoals` | Số vật phẩm cần thu | Xác định yêu cầu `INTERACT_*` |
| `optimalBlocks` | Số block tối ưu | Độ phức tạp code |
| `optimalLines` | Số dòng logic tối ưu | LLOC - thước đo độ khó |
| `rawActions` | Chuỗi hành động | **Có thể suy ra kỹ năng từ đây** |
| `structuredSolution.procedures` | Các hàm được định nghĩa | Cho biết có cần `FUNC_*` không |

---

## 🔍 Nguồn dữ liệu để suy ra Kiến thức

### Nguồn hiện có trong files cũ:

1. **`toolboxPresetKey`** → Tập blocks có sẵn → Giới hạn kỹ năng áp dụng
2. **`solution.rawActions`** → Chuỗi hành động thực tế → Các lệnh đã sử dụng
3. **`solution.structuredSolution.procedures`** → Có hàm = cần `FUNC_*`
4. **`gameConfig.collectibles`** → Crystal = `INTERACT_COLLECT`
5. **`gameConfig.interactibles`** → Switch = `INTERACT_TOGGLE`
6. **`gameConfig.obstacles`** → Chướng ngại = `NAV_OBSTACLE_AVOID`

### Nguồn đầy đủ trong files mới:

1. **`core_skill_codes`** ✅ Đã có sẵn
2. **`bloom_level_codes`** ✅ Đã có sẵn
3. **`knowledge_dimension_codes`** ✅ Đã có sẵn
4. **`context_codes`** ✅ Đã có sẵn

---

## ⚠️ Vấn đề phát hiện

1. **Không đồng nhất giữa các files**: Files cũ (Topic1-Done-Exam) thiếu nhiều trường metadata so với files mới.
2. **`core_skill_codes` chỉ có ở files mới**: Cần bổ sung cho files cũ.
3. **Không có field tổng hợp "kiến thức cần thiết"**: Cần tạo mới hoặc suy ra từ dữ liệu có sẵn.

---

## 📊 Bảng tổng hợp Toolbox Presets → Skills

| `toolboxPresetKey` | Blocks có sẵn | Kỹ năng cần áp dụng |
|-------------------|---------------|---------------------|
| `commands_l1_move` | `moveForward` | `CMD_MOVE_FORWARD` |
| `commands_l2_turn` | + `turn` | + `CMD_TURN`, `SPATIAL_ORIENTATION` |
| `commands_l3_jump` | + `jump` | + `CMD_JUMP`, `SPATIAL_REASONING_3D` |
| `commands_l4_collect` | + `collect` | + `INTERACT_COLLECT` |
| `commands_l5_toggle` | + `toggleSwitch` | + `INTERACT_TOGGLE` |
| `commands_l6_comprehensive` | All above | All above |
| `functions_l1_movement_only` | + `PROCEDURE` | + `FUNC_DEFINE_SIMPLE`, `FUNC_INTRO_CALL` |
| `loops_l1_repeat` | + `controls_repeat` | + `LOOP_FOR_BASIC` |
| `conditionals_l1_if` | + `controls_if` | + `COND_IF` |
