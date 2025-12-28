/**
 * Template Presets
 * 
 * Predefined code templates for common patterns.
 * Commands match Quest Player exactly.
 * 
 * PLACEHOLDERS:
 * - _MIN_X_ and _MAX_X_ for adjustable min/max bounds
 * - random(_MIN_X_, _MAX_X_) for runtime random values
 */

export interface TemplatePreset {
  id: string;
  name: string;
  nameVi: string;
  description: string;
  descriptionVi: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  concept: string;
  code: string;
}

export const TEMPLATE_PRESETS: TemplatePreset[] = [
  {
    id: 'custom',
    name: 'Custom Code',
    nameVi: 'Tùy chỉnh',
    description: 'Write your own code with adjustable parameters',
    descriptionVi: 'Viết code với tham số điều chỉnh được',
    difficulty: 1,
    concept: 'custom',
    code: `// === Adjustable Parameters ===
var _MIN_ITEMS_ = 2;
var _MAX_ITEMS_ = 5;
var ITEMS = random(_MIN_ITEMS_, _MAX_ITEMS_);

// Your code here
moveForward();
for (let i = 0; i < ITEMS; i++) {
  collectItem();
  moveForward();
}
`,
  },
  {
    id: 'simple-sequence',
    name: 'Simple Sequence',
    nameVi: 'Chuỗi đơn giản',
    description: 'Sequential commands without loops',
    descriptionVi: 'Các lệnh tuần tự không có vòng lặp',
    difficulty: 1,
    concept: 'sequential',
    code: `// Chuỗi lệnh tuần tự
moveForward();
collectItem();
moveForward();
collectItem();
moveForward();
collectItem();
moveForward();
`,
  },
  {
    id: 'simple-for-loop',
    name: 'Simple FOR Loop',
    nameVi: 'Vòng lặp FOR đơn giản',
    description: 'Collect N crystals with random count',
    descriptionVi: 'Thu thập N pha lê với số lượng ngẫu nhiên',
    difficulty: 2,
    concept: 'repeat_n',
    code: `// === Adjustable Parameters ===
var _MIN_CRYSTAL_NUM_ = 3;
var _MAX_CRYSTAL_NUM_ = 6;
var CRYSTAL_NUM = random(_MIN_CRYSTAL_NUM_, _MAX_CRYSTAL_NUM_);

// Thu thập pha lê
moveForward();

for (let i = 0; i < CRYSTAL_NUM; i++) {
  collectItem();
  moveForward();
}
`,
  },
  {
    id: 'for-with-turns',
    name: 'FOR Loop with Turns',
    nameVi: 'Vòng lặp có rẽ hướng',
    description: 'Create an L-shape path',
    descriptionVi: 'Tạo đường đi hình chữ L',
    difficulty: 2,
    concept: 'repeat_n',
    code: `// === Adjustable Parameters ===
var _MIN_SEGMENT1_ = 2;
var _MAX_SEGMENT1_ = 4;
var _MIN_SEGMENT2_ = 2;
var _MAX_SEGMENT2_ = 4;
var SEGMENT1 = random(_MIN_SEGMENT1_, _MAX_SEGMENT1_);
var SEGMENT2 = random(_MIN_SEGMENT2_, _MAX_SEGMENT2_);

// Đường đi hình chữ L
moveForward();

for (let i = 0; i < SEGMENT1; i++) {
  collectItem();
  moveForward();
}

turnRight();

for (let i = 0; i < SEGMENT2; i++) {
  collectItem();
  moveForward();
}
`,
  },
  {
    id: 'square-pattern',
    name: 'Square Pattern',
    nameVi: 'Mẫu hình vuông',
    description: 'Walk around a square',
    descriptionVi: 'Đi vòng quanh hình vuông',
    difficulty: 3,
    concept: 'repeat_n',
    code: `// === Adjustable Parameters ===
var _MIN_SIDE_ = 2;
var _MAX_SIDE_ = 4;
var SIDE = random(_MIN_SIDE_, _MAX_SIDE_);

// Hình vuông
moveForward();

for (let side = 0; side < 4; side++) {
  for (let step = 0; step < SIDE; step++) {
    collectItem();
    moveForward();
  }
  turnRight();
}
`,
  },
  {
    id: 'simple-function',
    name: 'Simple Function',
    nameVi: 'Hàm đơn giản',
    description: 'Define and call a function',
    descriptionVi: 'Định nghĩa và gọi hàm',
    difficulty: 3,
    concept: 'procedure_simple',
    code: `// === Adjustable Parameters ===
var _MIN_PER_CALL_ = 1;
var _MAX_PER_CALL_ = 3;
var _MIN_CALLS_ = 2;
var _MAX_CALLS_ = 4;
var PER_CALL = random(_MIN_PER_CALL_, _MAX_PER_CALL_);
var CALLS = random(_MIN_CALLS_, _MAX_CALLS_);

function collectItems() {
  for (let i = 0; i < PER_CALL; i++) {
    collectItem();
    moveForward();
  }
}

moveForward();

for (let c = 0; c < CALLS; c++) {
  collectItems();
  turnRight();
}
`,
  },
  {
    id: 'nested-loops',
    name: 'Nested FOR Loops',
    nameVi: 'Vòng lặp lồng nhau',
    description: 'Create a zigzag grid pattern',
    descriptionVi: 'Tạo mẫu lưới zigzag',
    difficulty: 4,
    concept: 'nested_loop',
    code: `// === Adjustable Parameters ===
var _MIN_ROWS_ = 2;
var _MAX_ROWS_ = 3;
var _MIN_COLS_ = 3;
var _MAX_COLS_ = 5;
var ROWS = random(_MIN_ROWS_, _MAX_ROWS_);
var COLS = random(_MIN_COLS_, _MAX_COLS_);

moveForward();

for (let col = 0; col < COLS; col++) {
  collectItem();
  moveForward();
}

for (let row = 1; row < ROWS; row++) {
  turnRight();
  moveForward();
  turnRight();
  
  for (let col = 0; col < COLS; col++) {
    collectItem();
    moveForward();
  }
}
`,
  },
  {
    id: 'staircase',
    name: 'Staircase with Jump',
    nameVi: 'Cầu thang với nhảy',
    description: 'Create elevated terrain using jump',
    descriptionVi: 'Tạo địa hình cao với lệnh nhảy',
    difficulty: 4,
    concept: 'repeat_n',
    code: `// === Adjustable Parameters ===
var _MIN_STEPS_ = 3;
var _MAX_STEPS_ = 6;
var STEPS = random(_MIN_STEPS_, _MAX_STEPS_);

// Cầu thang
jump();

for (let step = 0; step < STEPS; step++) {
  collectItem();
  jump();
}
`,
  },
];

export function getPresetById(id: string): TemplatePreset | undefined {
  return TEMPLATE_PRESETS.find(p => p.id === id);
}

export function getPresetsByDifficulty(difficulty: number): TemplatePreset[] {
  return TEMPLATE_PRESETS.filter(p => p.difficulty === difficulty);
}
