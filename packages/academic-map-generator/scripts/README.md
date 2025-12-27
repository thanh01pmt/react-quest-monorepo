# Solution-Driven Generator Scripts

Bộ công cụ để test và sử dụng Solution-Driven Map Generator.

## Cấu trúc thư mục

```
scripts/
├── README.md                  # File này
├── run-test-cases.ts          # Script chạy test cases
├── test-solution-driven.ts    # Script test nhanh
├── test-cases/                # Thư mục chứa test cases
│   ├── 01-simple-sequence.ts
│   ├── 02-simple-for-loop.ts
│   ├── ...
│   └── 10-complex-spiral.ts
└── output/                    # Thư mục kết quả
    ├── test-reports/          # Báo cáo test cases
    │   ├── _summary.md
    │   ├── {id}.md
    │   └── {id}.json
    └── solution_driven_test.json
```

---

## Quick Start

### 1. Chạy tất cả test cases

```bash
cd packages/academic-map-generator
npx tsx scripts/run-test-cases.ts
```

### 2. Chạy test case cụ thể

```bash
# Chạy test case 01
npx tsx scripts/run-test-cases.ts 01

# Chạy nhiều test cases
npx tsx scripts/run-test-cases.ts 01 05 10

# Chạy theo pattern
npx tsx scripts/run-test-cases.ts simple    # All containing "simple"
npx tsx scripts/run-test-cases.ts loop      # All containing "loop"
```

### 3. Chạy test nhanh (development)

```bash
npx tsx scripts/test-solution-driven.ts
```

---

## Template Syntax (JavaScript ES6)

Solution-Driven Generator hỗ trợ JavaScript ES6 syntax, tương thích với output của Blockly.

### Các lệnh cơ bản

| Lệnh | Mô tả |
|------|-------|
| `moveForward()` | Di chuyển 1 bước theo hướng hiện tại |
| `turnLeft()` | Quay trái 90° |
| `turnRight()` | Quay phải 90° |
| `pickCrystal()` hoặc `collect()` | Đặt crystal tại vị trí hiện tại |
| `pickKey()` | Đặt key tại vị trí hiện tại |
| `toggleSwitch()` | Đặt switch tại vị trí hiện tại |

### FOR Loop

```javascript
// JavaScript ES6 style (khuyên dùng)
for (let i = 0; i < 5; i++) {
  moveForward();
  pickCrystal();
}

// Inclusive syntax
for (let i = 1; i <= 5; i++) {
  moveForward();
  pickCrystal();
}

// Simple syntax (backward compatible)
for i in 1 to 5 {
  moveForward();
  pickCrystal();
}
```

### Nested Loops

```javascript
for (let row = 0; row < 3; row++) {
  for (let col = 0; col < 4; col++) {
    moveForward();
    pickCrystal();
  }
  turnRight();
  moveForward();
  turnRight();
}
```

### Functions

```javascript
// Định nghĩa function
function collectLine() {
  moveForward();
  pickCrystal();
  moveForward();
  pickCrystal();
}

// Gọi function
collectLine();
turnRight();
collectLine();
```

### Comments

```javascript
// Single-line comment (được hỗ trợ)
for (let i = 0; i < 3; i++) {
  moveForward(); // Inline comment
}
```

---

## Tạo Test Case mới

### Template

Tạo file mới trong `test-cases/` với format:

```typescript
/**
 * Test Case: XX - Tên Test Case
 * Difficulty: ⭐⭐⭐ (1-5)
 * Concept: concept_name
 */

export default {
  id: 'xx-test-case-name',
  name: 'Tên hiển thị',
  difficulty: 3,  // 1-5
  concept: 'concept_name',  // AcademicConcept
  description: 'Mô tả ngắn về test case',
  code: `
    // JavaScript code
    for (let i = 0; i < 5; i++) {
      moveForward();
      pickCrystal();
    }
  `
};
```

### Các concept hỗ trợ

| Concept | Mô tả |
|---------|-------|
| `sequential` | Các lệnh tuần tự |
| `repeat_n` | Vòng lặp đếm (for loop) |
| `nested_loop` | Vòng lặp lồng nhau |
| `procedure_simple` | Hàm đơn giản |
| `procedure_compose` | Kết hợp nhiều hàm |
| `loop_function_call` | Gọi hàm trong vòng lặp |
| `if_simple` | Điều kiện đơn giản |
| `if_else` | Điều kiện có else |
| `while_condition` | Vòng lặp while |

---

## Output Files

### Markdown Report (`.md`)

Mỗi test case tạo một báo cáo Markdown bao gồm:

- **Source Code**: Code JavaScript gốc
- **Execution Summary**: Thống kê (path length, items, loop iterations)
- **Map Visualization**: ASCII map với legend
- **Raw Actions**: Danh sách lệnh đã thực thi
- **Item Goals**: Mục tiêu thu thập
- **Path Coordinates**: Tọa độ đường đi dạng JSON

### GameConfig JSON (`.json`)

File JSON hoàn chỉnh có thể import vào game:

```json
{
  "id": "test-case-id",
  "gameType": "maze",
  "gameConfig": {
    "blocks": [...],
    "players": [...],
    "collectibles": [...],
    "finish": {...}
  },
  "solution": {
    "rawActions": [...],
    "structuredSolution": {...}
  },
  "blocklyConfig": {...}
}
```

---

## Programmatic Usage

### Sử dụng trong code

```typescript
import { 
  SolutionDrivenGenerator, 
  generateFromCode 
} from '@repo/academic-map-generator';

// Quick generation
const result = generateFromCode(`
  for (let i = 0; i < 5; i++) {
    moveForward();
    pickCrystal();
  }
`);

console.log(result.gameConfig);  // Full game config
console.log(result.trace.pathCoords);  // Path coordinates
console.log(result.solution.rawActions);  // Action list
```

### Sử dụng với MarkdownReporter

```typescript
import { SolutionDrivenGenerator } from '@repo/academic-map-generator';
import { MarkdownReporter } from '@repo/academic-map-generator';

const generator = new SolutionDrivenGenerator();
const reporter = new MarkdownReporter();

const result = generator.generate({
  id: 'my-template',
  code: 'for (let i = 0; i < 5; i++) { moveForward(); pickCrystal(); }',
  parameters: {},
  concept: 'repeat_n',
  gradeLevel: '3-5'
});

const preview = reporter.generateTemplatePreview(result);
console.log(preview);  // Markdown report
```

---

## Troubleshooting

### Lỗi "Expected..."

Parser không nhận dạng được syntax. Kiểm tra:
- Dấu `{` và `}` phải đúng cặp
- `for` loop phải có đủ 3 phần: `(init; condition; increment)`
- Function call phải có `()`

### Map trống

Code không tạo movement. Đảm bảo có ít nhất một `moveForward()`.

### Loop vô hạn

`while` loop có giới hạn 1000 iterations. Kiểm tra điều kiện dừng.

---

## Liên hệ

Nếu gặp vấn đề, tạo issue hoặc liên hệ team development.
