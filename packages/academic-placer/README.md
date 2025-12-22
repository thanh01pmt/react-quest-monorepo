# Academic Placement Generator System

> **Hệ thống phân tích map và tạo placements cho các mục tiêu học thuật**

Thư mục này chứa một hệ thống hoàn chỉnh để phân tích cấu trúc map game và tự động tạo ra các cách đặt items (crystals, switches, gems) phù hợp với từng concept học thuật trong lập trình.

---

## 📁 Cấu trúc thư mục

```
academic-placer/
├── README.md                        # Tài liệu này
├── CURRICULUM_MAP.md                # Visual diagram của curriculum
│
├── src/                             # Source files
│   ├── index.ts                     # Main exports
│   ├── MapAnalyzer.ts               # Tier 1-4: Phân tích cấu trúc map
│   ├── AcademicConceptTypes.ts      # Định nghĩa types và curriculum metadata
│   ├── AcademicPlacementGenerator.ts # Main generator class
│   ├── PlacementStrategy.ts         # Strategy & constraints (integrated)
│   ├── CoordinatePrioritizer.ts     # Coordinate priority system
│   │
│   └── generators/                  # Generators theo category
│       ├── index.ts                 # Central export
│       ├── common.ts                # Shared utilities
│       ├── SequentialGenerators.ts  # Sequential concepts
│       ├── LoopGenerators.ts        # Loop concepts (6 types)
│       ├── ConditionalGenerators.ts # Conditional concepts (5 types)
│       ├── FunctionGenerators.ts    # Function concepts (5 types)
│       ├── VariableGenerators.ts    # Variable concepts (5 types)
│       └── CombinationGenerators.ts # Combination concepts (15 types)
│
├── scripts/                         # CLI tools
│   ├── analyze.ts                   # Run MapAnalyzer
│   ├── test-generators.ts           # Test all generators
│   ├── test-strategy.ts             # Test strategy constraints
│   ├── test-prioritizer.ts          # Test coordinate priority
│   ├── repair.ts                    # Interactive repair script
│   └── repair-batch.ts              # Non-interactive repair script
│
├── examples/                        # Example game configs
│   ├── linear-map.json              # Simple linear map
│   └── mapconfig.json               # Complex map example
│
├── output/                          # Generated output (gitignore)
│   ├── analysis-output.json
│   ├── academic-output.json
│   └── ...
│
└── archive/                         # Old/reference files
    └── ideas.md
```

---

## 🎯 Mục tiêu

1. **Phân tích map** - Hiểu cấu trúc hình học của map (segments, areas, relations)
2. **Phát hiện patterns** - Tìm các patterns phù hợp cho từng concept
3. **Tạo placements** - Đề xuất cách đặt items cho mục tiêu học thuật cụ thể
4. **Repair config** - Sửa gameConfig với placements mới

---

## 🧠 Academic Concepts

### Coverage: **37/39 concepts = 95%**

#### 1. Sequential (1 concept)
| Concept | Difficulty | Description |
|---------|------------|-------------|
| `sequential` | 1 | Di chuyển tuần tự từ trên xuống |

#### 2. Loop (6 concepts)
| Concept | Difficulty | Description |
|---------|------------|-------------|
| `repeat_n` | 2 | Lặp n lần cố định |
| `repeat_until` | 4 | Lặp đến khi điều kiện đúng |
| `while_condition` | 5 | Lặp trong khi điều kiện đúng |
| `for_each` | 6 | Lặp qua từng phần tử collection |
| `infinite_loop` | 7 | Loop vô hạn với break |
| `nested_loop` | 7 | Loop lồng loop |

#### 3. Conditional (5 concepts)
| Concept | Difficulty | Description |
|---------|------------|-------------|
| `if_simple` | 3 | If đơn giản không có else |
| `if_else` | 4 | If với một else |
| `if_elif_else` | 5 | If với nhiều nhánh elif |
| `switch_case` | 6 | Switch-case pattern |
| `nested_if` | 6 | If lồng trong if |

#### 4. Variable (5 concepts)
| Concept | Difficulty | Description |
|---------|------------|-------------|
| `counter` | 3 | Biến đếm |
| `state_toggle` | 4 | Biến trạng thái on/off |
| `accumulator` | 5 | Biến tích lũy giá trị |
| `flag` | 5 | Biến boolean cờ |
| `collection` | 6 | Danh sách/mảng |

#### 5. Function (5 concepts)
| Concept | Difficulty | Description |
|---------|------------|-------------|
| `procedure_simple` | 4 | Procedure không tham số |
| `procedure_with_param` | 6 | Procedure có tham số |
| `function_return` | 7 | Function trả về giá trị |
| `function_compose` | 7 | Kết hợp nhiều functions |
| `recursion` | 9 | Đệ quy |

#### 6. Combinations (15 concepts)
| Concept | Components | Difficulty |
|---------|------------|------------|
| `repeat_n_counter` | repeat_n + counter | 4 |
| `repeat_until_state` | repeat_until + state_toggle | 5 |
| `loop_if_inside` | repeat_n + if_simple | 5 |
| `loop_function_call` | repeat_n + procedure_simple | 5 |
| `function_if_inside` | procedure_simple + if_else | 5 |
| `function_loop_inside` | procedure_simple + repeat_n | 5 |
| `if_loop_inside` | if_else + repeat_n | 5 |
| `while_counter` | while_condition + counter | 6 |
| `loop_break` | while_condition + if_simple | 6 |
| `conditional_function_call` | if_else + procedure_simple | 6 |
| `for_each_accumulator` | for_each + accumulator | 7 |
| `loop_if_function` | repeat_n + if + procedure | 8 |
| `function_loop_if` | procedure + repeat_n + if | 8 |

---

## 📊 Pipeline

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           ANALYSIS PIPELINE                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   gameConfig.json                                                        │
│         │                                                                │
│         ▼                                                                │
│   ┌─────────────────────────────────────────────────────────────────┐    │
│   │                        MapAnalyzer                               │    │
│   ├─────────────────────────────────────────────────────────────────┤    │
│   │                                                                  │    │
│   │  Tier 1: Geometric Decomposition                                 │    │
│   │          → segments, areas, connectors, relations                │    │
│   │                                                                  │    │
│   │  Tier 2: Pattern Extrapolation                                   │    │
│   │          → repeat patterns, mirror patterns                      │    │
│   │                                                                  │    │
│   │  Tier 3: Length Filtering                                        │    │
│   │          → merge short segments                                  │    │
│   │                                                                  │    │
│   │  Tier 4: Context Generation                                      │    │
│   │          → metrics (size, topology, center)                      │    │
│   │          → constraints (maxItems, preferredConcepts)             │    │
│   │          → prioritizedCoords (priority, category, reasons)       │    │
│   │          → suggestedPlacements                                   │    │
│   │                                                                  │    │
│   └─────────────────────────────────────────────────────────────────┘    │
│         │                                                                │
│         ▼                                                                │
│   ┌─────────────────────────────────────────────────────────────────┐    │
│   │                      PlacementContext                            │    │
│   ├─────────────────────────────────────────────────────────────────┤    │
│   │  • segments: PathSegment[]                                       │    │
│   │  • areas: Area[]                                                 │    │
│   │  • patterns: Pattern[]                                           │    │
│   │  • relations: PathRelation[]                                     │    │
│   │  • metrics: { totalBlocks, detectedTopology, center, ... }       │    │
│   │  • constraints: { maxItems, minItems, preferredConcepts, ... }   │    │
│   │  • prioritizedCoords: [{ position, priority, category }, ...]    │    │
│   └─────────────────────────────────────────────────────────────────┘    │
│         │                                                                │
│         ▼                                                                │
│   ┌─────────────────────────────────────────────────────────────────┐    │
│   │               AcademicPlacementGenerator                         │    │
│   ├─────────────────────────────────────────────────────────────────┤    │
│   │                                                                  │    │
│   │  ├── SequentialGenerators    (1 concept)                         │    │
│   │  ├── LoopGenerators          (6 concepts)                        │    │
│   │  ├── ConditionalGenerators   (5 concepts)                        │    │
│   │  ├── VariableGenerators      (5 concepts)                        │    │
│   │  ├── FunctionGenerators      (5 concepts)                        │    │
│   │  └── CombinationGenerators   (15 concepts)                       │    │
│   │                                                                  │    │
│   │  Uses: prioritizedCoords + constraints to generate placements    │    │
│   │                                                                  │    │
│   └─────────────────────────────────────────────────────────────────┘    │
│         │                                                                │
│         ▼                                                                │
│   ┌─────────────────────────────────────────────────────────────────┐    │
│   │                    AcademicPlacement[]                           │    │
│   ├─────────────────────────────────────────────────────────────────┤    │
│   │  • id, name, primaryConcept, difficulty                          │    │
│   │  • items: [{ type, position, groupId }]                          │    │
│   │  • patternDescription, educationalGoal                           │    │
│   │  • expectedSolution: { hasLoop, loopCount, ... }                 │    │
│   │  • requiredBlocks: ['repeat_times', 'if', ...]                   │    │
│   └─────────────────────────────────────────────────────────────────┘    │
│         │                                                                │
│         ▼                                                                │
│   ┌──────────────┐                                                       │
│   │ repair-batch │  ─────→  Modified gameConfig files                    │
│   └──────────────┘         (updated collectibles & interactibles)        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Usage

### 1. Phân tích Map

```bash
npx tsx test-analyzer.ts test_game_config.json
```

Output: `analysis-output.json`

### 2. Test Generators

```bash
npx tsx test-generators.ts test_game_config.json
```

Output: `generator-test-output.json`

### 3. Repair GameConfig (Non-interactive)

```bash
# Tất cả categories, mỗi loại 1 file
npx tsx repair-batch.ts test_game_config.json

# Chọn categories cụ thể
npx tsx repair-batch.ts test_game_config.json --categories=1,2,4

# Chỉ định số lượng
npx tsx repair-batch.ts test_game_config.json --categories=1,2 --quantities=2,3

# Output directory tùy chỉnh
npx tsx repair-batch.ts test_game_config.json --output=my_output
```

### 4. Repair GameConfig (Interactive)

```bash
npx tsx repair.ts test_game_config.json
```

---

## 🎯 Selectable Placement System (NEW)

Cho phép user chọn vị trí đặt items và lưu thành templates có thể tái sử dụng.

### 1. Convert Topology to PlacementContext

```typescript
import { MapAnalyzer } from '@repo/academic-placer';

// Từ IPathInfo của Topology
const pathInfo = vShapeTopology.generatePathInfo();

// Convert sang PlacementContext với selectableElements
const context = MapAnalyzer.fromTopology(pathInfo);

console.log(context.selectableElements);
// → [
//   { id: 'keypoint:apex', type: 'keypoint', category: 'critical', ... },
//   { id: 'segment:seg_0', type: 'segment', category: 'recommended', ... },
//   { id: 'position:seg_0[2]', type: 'position', category: 'optional', ... },
// ]
```

### 2. Placement Templates

```typescript
import { 
  getTemplateRegistry, 
  PlacementTemplateRegistry 
} from '@repo/academic-placer';

const registry = getTemplateRegistry();

// Save template
const template = registry.save({
  name: 'V-Shape Function Reuse',
  topologyType: 'v_shape',
  rules: [
    { selector: { type: 'keypoint', name: 'apex' }, itemType: 'switch' },
    { selector: { type: 'interval', segment: 'seg_0', every: 2 }, itemType: 'crystal', options: { symmetric: true } }
  ]
});

// Apply template
const placements = registry.apply(template.id, context.selectableElements);
// → [
//   { type: 'switch', position: [3, 0, 4] },
//   { type: 'crystal', position: [2, 0, 2] },
//   { type: 'crystal', position: [2, 0, 6] }, // symmetric
// ]

// Find templates for topology
const vShapeTemplates = registry.findByTopology('v_shape');

// Export/Import
const json = registry.export();
registry.import(json);
```

### 3. Element Selectors

```typescript
// Keypoint: select specific keypoint by name
{ type: 'keypoint', name: 'apex' }

// Segment: select entire segment
{ type: 'segment', name: 'left_arm' }

// Position: specific position in segment
{ type: 'position', segment: 'seg_0', offset: 2 }

// Interval: every N positions in segment
{ type: 'interval', segment: 'seg_0', every: 2, skip: 1 }

// All: all positions in segment
{ type: 'all', segment: 'seg_0' }
```

### 4. Default Templates

```typescript
import { DEFAULT_TEMPLATES, initializeDefaultTemplates } from '@repo/academic-placer';

// Initialize default templates on first run
initializeDefaultTemplates();

// Available defaults:
// - 'V-Shape Function Reuse'
// - 'V-Shape Simple'
// - 'Linear Interval'
// - 'L-Shape Corner'
```

---

## 📖 API Reference

### AcademicPlacementGenerator

```typescript
import { AcademicPlacementGenerator } from './AcademicPlacementGenerator';
import { MapAnalyzer } from './MapAnalyzer';

// 1. Analyze map
const analyzer = new MapAnalyzer(gameConfig);
const context = analyzer.analyze();

// 2. Create generator
const generator = new AcademicPlacementGenerator(context);

// 3. Generate placements
const all = generator.generateAll();                           // All placements
const loops = generator.generateByCategory('loop');            // By category
const easy = generator.generateByDifficulty(1, 4);             // By difficulty
const forRepeat = generator.generateForConcept('repeat_n');    // By concept
const next = generator.generateForMasteredConcepts([           // By mastered
  'sequential', 'repeat_n'
]);

// 4. Get summary
const summary = generator.getSummary();

// 5. Get opportunities
const opportunities = generator.getOpportunities();


// Static method
const coverage = AcademicPlacementGenerator.getCoverage();
// → { totalImplemented: 37, totalConcepts: 39, percentage: 95, ... }
```

### Placement Structure

```typescript
interface AcademicPlacement {
  id: string;                           // 'repeat_n_interval_2'
  name: string;                         // 'Repeat - crystal cách 2 bước'
  concepts: AcademicConcept[];          // ['repeat_n', 'pattern_recognition']
  primaryConcept: AcademicConcept;      // 'repeat_n'
  difficulty: number;                   // 1-10
  items: ItemPlacement[];               // Crystals, switches, gems
  patternDescription: string;           // 'Repeat 5 times: move 2, collect'
  expectedSolution: ExpectedSolution;   // Loop info, estimated steps
  requiredBlocks: string[];             // ['repeat_times']
  tags: string[];                       // ['loop', 'pattern']
  educationalGoal: string;              // Learning objective
  prerequisiteConcepts: AcademicConcept[]; // ['sequential']
}
```

---

## 📊 Categories Reference

| # | Category | Key | Concepts | Difficulty Range |
|---|----------|-----|----------|------------------|
| 1 | Sequential | `sequential` | 1 | 1-2 |
| 2 | Loop | `loop` | 6 | 2-7 |
| 3 | Conditional | `conditional` | 5 | 3-6 |
| 4 | Variable | `variable` | 5 | 3-6 |
| 5 | Function | `function` | 5 | 4-9 |
| 6 | Combination | `combination` | 15 | 4-8 |

---

## 🔧 Repair Output

```
repaired_test_game_config_1766311737679/
├── _manifest.json                        # Metadata
├── sequential_1_sequential_basic.json    # D1, 1 crystal
├── sequential_2_sequential_multiple.json # D2, 4 crystals
├── loop_1_repeat_n_interval_2.json       # D2, 5 crystals
├── loop_2_repeat_n_every_step.json       # D3, 8 crystals
└── loop_3_repeat_n_interval_3.json       # D3, 3 crystals
```

### Manifest Structure

```json
{
  "source": "test_game_config.json",
  "generatedAt": "2025-12-21T10:08:57.680Z",
  "totalFiles": 5,
  "categories": [
    { "name": "Sequential", "count": 2 },
    { "name": "Loop", "count": 3 }
  ],
  "files": [
    {
      "filename": "sequential_1_sequential_basic.json",
      "category": "Sequential",
      "placement": {
        "id": "sequential_basic",
        "name": "Đường thẳng cơ bản",
        "primaryConcept": "sequential",
        "difficulty": 1,
        "patternDescription": "Di chuyển thẳng đến crystal",
        "educationalGoal": "Hiểu cách lệnh thực hiện tuần tự"
      },
      "items": { "collectibles": 1, "interactibles": 0 }
    }
  ]
}
```

---

## 🧪 Testing

### Run All Tests

```bash
# Test với config mặc định
npx tsx test-generators.ts

# Test với config cụ thể
npx tsx test-generators.ts test_game_config.json
```

### Expected Output

```
══════════════════════════════════════════════════════════════════════
  ACADEMIC PLACEMENT GENERATOR TESTS
══════════════════════════════════════════════════════════════════════

📊 COVERAGE: 37/39 = 95%

📋 INDIVIDUAL GENERATOR TESTS: 35/35 passed ✅

📦 TOTAL PLACEMENTS: 33+
📊 DIFFICULTY RANGE: 1-9
📊 AVAILABLE CONCEPTS: 17+
```

---

## 📝 Notes

### Map Features → Concepts Mapping

| Map Feature | Primary Concept | Combinations |
|-------------|-----------------|--------------|
| Đường thẳng dài | `repeat_n` | `repeat_n_counter` |
| Crystal cách đều | `repeat_n` | `loop_if_inside` |
| Nhánh đối xứng | `procedure_simple` | `loop_function_call` |
| Switch xen kẽ | `state_toggle` | `loop_if_inside` |
| Grid 2D | `nested_loop` | - |
| Junction points | `if_else` | `conditional_function_call` |
| Parallel segments | `nested_loop` | - |
| Multi-area | `for_each` | `for_each_accumulator` |

### GameConfig Changes

Script **CHỈ SỬA** 2 fields:
- `collectibles` - Danh sách crystals/gems mới
- `interactibles` - Danh sách switches/goals mới

Các fields khác giữ nguyên:
- `type`, `renderer`, `blocks`, `players`, `finish`

---

## 📜 Changelog

### 2025-12-21
- ✅ Created MapAnalyzer (Tier 1-4 analysis)
- ✅ Created AcademicConceptTypes (37 concepts)
- ✅ Created 6 generator modules
- ✅ Created test scripts
- ✅ Created repair scripts (interactive & batch)
- ✅ Coverage: 95%

---

## 🔗 Related Files

- `../README.md` - Main integration documentation
- `../UI_MAP_BUILDER_INTEGRATION.md` - UI integration guide
- `CURRICULUM_MAP.md` - Visual curriculum diagram
