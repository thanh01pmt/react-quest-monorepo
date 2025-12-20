# UI Map Builder Integration Guide

Hướng dẫn tích hợp hệ thống tạo map theo yếu tố học thuật vào giao diện người dùng.

---

## 📊 Tổng quan kiến trúc

```
┌───────────────────────────────────────────────────────────────────┐
│                        UI MAP BUILDER                              │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│   📋 Academic Parameters          🔧 Manual Adjustments           │
│   ├─ difficulty_code (EASY/MED)   ├─ path_length                  │
│   ├─ bloom_level_codes            ├─ arm_length                   │
│   ├─ context_codes                ├─ num_segments                 │
│   └─ core_skill_codes             └─ items_to_place               │
│                                                                   │
│                    ┌─────────────┐                                │
│                    │  GENERATE   │                                │
│                    └─────┬───────┘                                │
│                          │                                        │
└──────────────────────────┼────────────────────────────────────────┘
                           ▼
┌───────────────────────────────────────────────────────────────────┐
│                    BACKEND API LAYER                               │
│                                                                   │
│   MapGeneratorService.generate_for_difficulty()                   │
│   MapGeneratorService.generate_constrained_variants()             │
│   MapGeneratorService.generate_validated_variants()               │
└───────────────────────────────────────────────────────────────────┘
```

---

## 🗂️ Files Chính Cần Tích Hợp

### 1. Core Service - Entry Point

| File | Mô tả | API Methods |
|------|-------|-------------|
| `src/map_generator/service.py` | **Main service** - Entry point chính | `generate_map()`, `generate_map_variants()`, `generate_for_difficulty()`, `generate_constrained_variants()` |

#### Key Methods:

```python
# Simple generation
map_data = service.generate_map(
    map_type="plus_shape",      # Topology type
    logic_type="function_logic", # Placer logic
    params={
        "arm_length": 5,
        "difficulty_code": "MEDIUM",
        "bloom_level_codes": ["APPLY"],
        "items_to_place": [
            {"type": "gem", "count": 5},
            {"type": "switch", "count": 2}
        ]
    }
)

# Generate variants for difficulty
for variant in service.generate_for_difficulty(
    map_type="ef_shape",
    logic_type="function_logic", 
    params={...},
    difficulty="medium",
    max_variants=5
):
    # Each variant is a validated MapData
    pass
```

---

## 🧩 Solver & Validation System

Hệ thống cung cấp khả năng tự động giải và kiểm tra lỗi logic của map.

### 1. Game Solver

| File | Mô tả |
|------|-------|
| `solver/gameSolver.py` | Core A* Solver logic |
| `solver/synthesizers/*.py` | Code synthesizers (block generation) |

**Cách sử dụng (Python):**

```python
from solver.gameSolver import GameSolver, GameState

# 1. Khởi tạo State từ MapData
state = GameState(map_data_dict)

# 2. Tìm đường đi (Raw Actions)
solver = GameSolver(state)
path = solver.solve() # Returns list of moves

# 3. Tổng hợp code (Structured Solution)
solution = solver.synthesize_code(path, logic_type="function_logic")
print(solution["main"])
print(solution["procedures"])
```

### 2. Validation & Bug Detection

Dùng để kiểm tra xem map có giải được không và phát hiện lỗi.

| File | Mô tả |
|------|-------|
| `core/validation/pre_solve_validator.py` | Kiểm tra nhanh tính khả thi |
| `core/map_validator.py` | Validate cấu trúc JSON |

### 3. Cơ Chế Tạo Bug (Debugging Levels)

Để tạo các level "Debugging" (học sinh sửa lỗi), bạn có thể sử dụng quy trình sau:

1.  **Generate Valid Map**: Tạo map giải được bình thường.
2.  **Code Mutation (Tạo Bug)**:
    - Lấy `structuredSolution` đúng.
    - Áp dụng các phép biến đổi lỗi (Mutation Operators):
        - *Wrong Command*: Đổi `moveForward` -> `turnLeft`.
        - *Missing Block*: Xóa 1 block quan trọng.
        - *Wrong Loop Count*: Đổi `repeat 5` -> `repeat 3`.
        - *Wrong Condition*: Đổi `ifPathAhead` -> `ifPathLeft`.
3.  **Lưu thành Challenge**:
    - Lưu code lỗi vào trường `initialCode` hoặc `brokenSolution`.
    - Đặt `challenge_type` = "DEBUG".

*Ghi chú: Logic code mutation hiện tại nên được xử lý ở tầng Application (UI/Server) dựa trên output chuẩn của `gameSolver`.*

---

### 2. Pedagogical Strategy System

| File | Mô tả | Tận dụng cho UI |
|------|-------|-----------------|
| `src/map_generator/placements/solution_first/strategy_selector.py` | **Chọn chiến lược dựa trên context** | Suggest optimal strategies based on user's academic params |
| `src/map_generator/placements/solution_first/pattern_complexity_modifier.py` | **Điều chỉnh độ khó** | Apply difficulty-based modifications |
| `src/map_generator/placements/solution_first/pedagogical_strategy_handler.py` | **Handler cho 7 chiến lược** | Execute pedagogical placement |

#### StrategySelector Usage:

```python
from src.map_generator.placements.solution_first.strategy_selector import StrategySelector

selector = StrategySelector()

# Get recommended strategy based on params
config = selector.select_strategy(
    topology_type="plus_shape",
    params={
        "difficulty_code": "MEDIUM",
        "bloom_level_codes": ["APPLY", "ANALYZE"],
        "context_codes": ["GAME_BASED"]
    }
)

print(config.primary_strategy)   # e.g., "function_reuse"
print(config.difficulty_pattern) # e.g., "alternating"
print(config.teaching_goal)      # e.g., "Pattern recognition"
```

---

### 3. Topology System (30 topologies)

| File | Mô tả | UI Params |
|------|-------|-----------|
| `src/map_generator/topologies/*.py` | **32 topology files** | Mỗi file có params riêng |

#### Available Topologies (for UI dropdown):

```python
TOPOLOGY_OPTIONS = {
    # Letter shapes
    "plus_shape": {"arm_length": [3, 8], "default": 5},
    "star_shape": {"star_size": [3, 6], "default": 4},
    "h_shape": {"column_length": [4, 8], "default": 5},
    "t_shape": {"stem_length": [3, 7], "default": 5},
    "ef_shape": {"stem_length": [5, 10], "default": 7},
    "l_shape": {"leg1_length": [3, 7], "default": 5},
    "u_shape": {"side_legs_length": [3, 7], "default": 5},
    "v_shape": {"arm_length": [3, 7], "default": 5},
    "s_shape": {"leg1_length": [3, 6], "default": 4},
    "z_shape": {"leg1_length": [3, 6], "default": 4},
    "arrow_shape": {"shaft_length": [4, 8], "head_size": [2, 4]},
    
    # Path types
    "straight_line": {"path_length": [4, 12], "default": 8},
    "simple_path": {"path_length": [3, 8], "turns": [0, 2]},
    "zigzag": {"num_segments": [3, 8], "default": 5},
    "interspersed_path": {"num_branches": [2, 5], "branch_length": [2, 4]},
    
    # Grid types
    "grid": {"grid_width": [5, 12], "grid_depth": [5, 12]},
    "grid_with_holes": {"grid_width": [6, 10], "hole_chance": [0.15, 0.35]},
    "plowing_field": {"rows": [3, 7], "cols": [4, 8]},
    "complex_maze_2d": {"maze_width": [7, 15], "maze_depth": [7, 15]},
    
    # Geometric
    "square": {"side_length": [3, 8], "default": 5},
    "triangle": {"leg_a_length": [4, 8], "leg_b_length": [4, 8]},
    "spiral": {"num_turns": [3, 8], "default": 5},
    
    # 3D types
    "staircase": {"num_steps": [3, 8], "step_size": [1, 2]},
    "staircase_3d": {"num_levels": [2, 4], "initial_step_length": [1, 3]},
    "spiral_3d": {"num_turns": [4, 12], "default": 8},
    
    # Island types
    "symmetrical_islands": {"num_islands": [2, 5], "island_pattern": ["u_shape", "l_shape", "plus_shape"]},
    "hub_with_stepped_islands": {"num_islands": [3, 6]},
    "plus_shape_islands": {"num_arms": [2, 4]},
    "stepped_island_clusters": {"num_clusters": [2, 4]},
    "swift_playground_maze": {"num_platforms": [3, 6]}
}
```

---

### 4. Logic Types (Placers)

| Logic Type | Mô tả | Best for |
|------------|-------|----------|
| `function_logic` | Tạo PROCEDURE và CALL | Dạy hàm, tái sử dụng code |
| `loop_logic` | Vòng lặp repeat/for | Dạy iteration |
| `for_loop_logic` | Vòng lặp for với biến | Dạy counting loops |
| `while_loop_logic` | Vòng lặp while với điều kiện | Dạy conditional loops |
| `conditional_logic` | Rẽ nhánh if/else | Dạy decision making |
| `algorithm_logic` | Thuật toán tổng quát | Dạy problem solving |
| `path_searching` | Tìm đường | Dạy maze navigation |

---

### 5. Academic Parameters Schema

```typescript
interface AcademicParams {
  // Difficulty
  difficulty_code: "EASY" | "MEDIUM" | "HARD";
  difficulty_perceived_score?: number; // 1-10
  
  // Bloom's Taxonomy
  bloom_level_codes: ("REMEMBER" | "UNDERSTAND" | "APPLY" | "ANALYZE" | "EVALUATE" | "CREATE")[];
  
  // Context
  context_codes?: ("GAME_BASED" | "REAL_WORLD" | "ABSTRACT" | "VISUAL")[];
  
  // Skills
  core_skill_codes?: ("problem_solving" | "logical_thinking" | "pattern_recognition" | "decomposition")[];
  
  // Course/Subject
  subject_codes?: string[];
  course_codes?: string[];
  topic_codes?: string[];
}
```

---

### 6. Item Configuration

```typescript
interface ItemConfig {
  type: "gem" | "switch" | "crystal" | "key" | "coin";
  count: number;
  placement_hint?: "start" | "middle" | "end" | "corners" | "segments";
}

interface ItemGoals {
  items_to_place: ItemConfig[];
  solution_item_goals?: string; // "gem:5,switch:2,crystal:3"
}
```

---

## 🔄 UI Integration Flow

### Step 1: User selects parameters

```javascript
const userParams = {
  // Topology selection
  map_type: "ef_shape",
  
  // Logic type
  logic_type: "function_logic",
  
  // Academic params
  difficulty_code: "MEDIUM",
  bloom_level_codes: ["APPLY"],
  
  // Manual adjustments
  stem_length: 7,
  num_prongs: 3,
  
  // Item goals
  items_to_place: [
    { type: "gem", count: 6 },
    { type: "switch", count: 2 }
  ]
};
```

### Step 2: Call generator API

```python
# Backend API endpoint
@app.post("/api/generate-map")
def generate_map(params: MapGenerationRequest):
    service = MapGeneratorService()
    
    # Merge academic and manual params
    generation_params = {
        **params.manual_params,
        "difficulty_code": params.difficulty_code,
        "bloom_level_codes": params.bloom_level_codes,
        "items_to_place": params.items_to_place
    }
    
    # Generate with validation
    for map_data in service.generate_validated_variants(
        map_type=params.map_type,
        logic_type=params.logic_type,
        params=generation_params,
        max_variants=1
    ):
        return map_data.to_dict()
    
    raise HTTPException(400, "Failed to generate valid map")
```

### Step 3: Return result

```json
{
  "id": "generated_map_001",
  "gen_map_type": "ef_shape",
  "gen_logic_type": "function_logic",
  "validation": {
    "isPedagogyValid": true,
    "pedagogyTier": {
      "tier1_basic": true,
      "tier2_logic": true,
      "tier3_pattern": true
    },
    "isSolvable": true
  },
  "gameConfig": {
    "blocks": [...],
    "collectibles": [...],
    "players": [...],
    "finish": {...}
  },
  "solution": {
    "structuredSolution": {
      "procedures": {
        "PROCEDURE_1": [...]
      },
      "main": [...]
    }
  }
}
```

---

## 📁 File Summary Table

| Category | Files | Mục đích |
|----------|-------|----------|
| **Entry Point** | `service.py` | Main API for generation |
| **Models** | `models/map_data.py`, `models/path_info.py` | Data structures |
| **Strategy** | `strategy_selector.py`, `pattern_complexity_modifier.py` | Academic-aware selection |
| **Placement** | `pedagogical_strategy_handler.py`, `solution_first_placer.py` | Item placement |
| **Topologies** | `topologies/*.py` (32 files) | Map structure definitions |
| **Solver** | `solver/*` | Auto-solving & Code generation |
| **Validation** | `core/validation/*` | Pre-solve checks |

---

## 🎯 Quick Start Integration

```python
from src.map_generator.service import MapGeneratorService
from src.map_generator.placements.solution_first.strategy_selector import StrategySelector

# 1. Initialize
service = MapGeneratorService()
selector = StrategySelector()

# 2. User params from UI
user_params = {
    "map_type": "plus_shape",
    "logic_type": "function_logic",
    "difficulty_code": "MEDIUM",
    "arm_length": 5,
    "items_to_place": [{"type": "gem", "count": 4}]
}

# 3. Get strategy recommendation
strategy = selector.select_strategy(
    user_params["map_type"], 
    user_params
)
print(f"Recommended: {strategy.primary_strategy}")

# 4. Generate map
map_data = service.generate_map(
    map_type=user_params["map_type"],
    logic_type=user_params["logic_type"],
    params=user_params
)

# 5. Return to UI
print(map_data.to_dict())
```

---

## 📚 Related Documentation

- `src/map_generator/placements/solution_first/README.md` - Detailed placer docs
- `docs/ENHANCED_PEDAGOGY_DESIGN.md` - Design decisions
- `instructions/analysis/e2e_test_results_20251220.md` - Test results
