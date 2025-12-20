# UI Map Builder Integration

Thư mục này chứa bản sao các file cần thiết để tích hợp hệ thống tạo map theo yếu tố học thuật vào giao diện người dùng.

**Ngày tạo:** 2025-12-20

---

## 📁 Cấu trúc thư mục

```
20251220 - UI_MAP_BUILDER_INTEGRATION/
├── README.md                 # File này
├── UI_MAP_BUILDER_INTEGRATION.md  # Hướng dẫn tích hợp chi tiết
├── core/
│   ├── service.py           # Entry point chính - MapGeneratorService
│   ├── map_validator.py     # JSON validator
│   └── validation/
│       └── pre_solve_validator.py # Logic validation
├── models/
│   ├── map_data.py          # MapData class
│   └── path_info.py         # PathInfo class
├── solver/
│   ├── gameSolver.py        # Core A* Solver
│   ├── solver_config.py     # Solver configs
│   └── synthesizers/        # Code block synthesizers
│       ├── function.py
│       └── ...
├── solution_first/
│   ├── README.md            # Docs cho placer module
│   ├── strategy_selector.py # Chọn chiến lược theo academic params
│   ├── pattern_complexity_modifier.py # Điều chỉnh độ khó
│   ├── pedagogical_strategy_handler.py # 7 chiến lược sư phạm
│   ├── solution_first_placer.py # Main placer
│   └── semantic_position_handler.py # Xử lý valid_pairs
└── topologies/
    ├── base_topology.py     # Base class
    ├── plus_shape.py        # Sample topology
    ├── ef_shape.py
    ├── spiral.py
    ├── square.py
    ├── straight_line.py
    ├── grid.py
    ├── staircase.py
    └── complex_maze.py
```

---

## 🔌 Cách sử dụng

### 1. Import từ bản gốc (khuyến nghị)

```python
# Import từ source chính
from src.map_generator.service import MapGeneratorService
from src.map_generator.placements.solution_first.strategy_selector import StrategySelector
```

### 2. Key Methods

```python
service = MapGeneratorService()

# Generate một map
map_data = service.generate_map(
    map_type="plus_shape",
    logic_type="function_logic",
    params={
        "arm_length": 5,
        "difficulty_code": "MEDIUM",
        "bloom_level_codes": ["APPLY"],
        "items_to_place": [{"type": "gem", "count": 4}]
    }
)

# Generate nhiều variants với validation
for variant in service.generate_validated_variants(
    map_type="ef_shape",
    logic_type="function_logic",
    params={...},
    max_variants=5
):
    # Mỗi variant đã được validate
    pass
```

---

## 📋 Academic Parameters

| Param | Type | Values |
|-------|------|--------|
| `difficulty_code` | string | "EASY", "MEDIUM", "HARD" |
| `bloom_level_codes` | string[] | "REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE", "EVALUATE", "CREATE" |
| `context_codes` | string[] | "GAME_BASED", "REAL_WORLD", "ABSTRACT" |
| `items_to_place` | object[] | [{type: "gem", count: 5}] |

---

## 📐 30 Topologies có sẵn

| Category | Topologies |
|----------|------------|
| Letter Shapes | plus_shape, star_shape, h_shape, t_shape, ef_shape, l_shape, u_shape, v_shape, s_shape, z_shape, arrow_shape |
| Path Types | straight_line, simple_path, zigzag, interspersed_path |
| Grid Types | grid, grid_with_holes, plowing_field, complex_maze_2d |
| Geometric | square, triangle, spiral |
| 3D Types | staircase, staircase_3d, spiral_3d |
| Island Types | symmetrical_islands, hub_with_stepped_islands, plus_shape_islands, stepped_island_clusters, swift_playground_maze |

---

## 🔧 7 Logic Types

| Logic Type | Mô tả |
|------------|-------|
| `function_logic` | Tạo PROCEDURE và CALL |
| `loop_logic` | Vòng lặp repeat/for |
| `for_loop_logic` | Vòng lặp for với biến đếm |
| `while_loop_logic` | Vòng lặp while với điều kiện |
| `conditional_logic` | Rẽ nhánh if/else |
| `algorithm_logic` | Thuật toán tổng quát |
| `path_searching` | Tìm đường trong maze |

---

## 📊 Kết quả test E2E

Đã chạy test với `test-sample.tsv`:

| Metric | Kết quả |
|--------|---------|
| Maps Generated | 151 |
| Solvable | 100% |
| Tier 2 Logic Pass | 99% |
| Function Logic w/ PROC | 99% |

Xem chi tiết: `instructions/analysis/e2e_test_results_20251220.md`

---

## 📚 Tài liệu liên quan

- `UI_MAP_BUILDER_INTEGRATION.md` - Hướng dẫn tích hợp đầy đủ
- `solution_first/README.md` - Docs cho placer module
- `docs/ENHANCED_PEDAGOGY_DESIGN.md` - Thiết kế hệ thống
