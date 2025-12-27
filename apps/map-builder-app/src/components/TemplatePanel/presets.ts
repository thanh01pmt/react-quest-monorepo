/**
 * Template Presets
 * 
 * Predefined code templates for common patterns.
 * Commands match Quest Player exactly (see packages/quest-player/src/games/maze/blocks.ts)
 * 
 * RULES:
 * 1. Start and Finish positions must NOT contain items.
 * 2. Use {{varName}} for configurable values.
 *    - {{varName}} - Default: 3, Range: 1-10
 *    - {{varName:5}} - Default: 5, Range: 1-10
 *    - {{varName:2-8}} - Default: 2, Range: 2-8
 *    - {{varName:1-20:5}} - Range: 1-20, Default: 5
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
    description: 'Write your own code with {{variables}}',
    descriptionVi: 'Tự viết code với {{biến}}',
    difficulty: 1,
    concept: 'custom',
    code: `// Viết code của bạn ở đây
// Dùng {{tên_biến}} để tạo tham số có thể điều chỉnh

moveForward();
for (let i = 0; i < {{count:1-10:3}}; i++) {
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
    description: 'Repeat actions N times',
    descriptionVi: 'Lặp lại hành động N lần',
    difficulty: 2,
    concept: 'repeat_n',
    code: `// Thu thập {{items:1-10:5}} viên pha lê

moveForward();  // Rời Start

for (let i = 0; i < {{items:1-10:5}}; i++) {
  collectItem();
  moveForward();
}
// Kết thúc tại Finish
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
    code: `// Đường đi hình chữ L ({{segment1:1-8:3}} + {{segment2:1-8:3}} ô)

moveForward();

// Đoạn 1: đi thẳng
for (let i = 0; i < {{segment1:1-8:3}}; i++) {
  collectItem();
  moveForward();
}

turnRight();

// Đoạn 2: rẽ phải đi tiếp
for (let i = 0; i < {{segment2:1-8:3}}; i++) {
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
    code: `// Hình vuông với {{sideLength:1-6:2}} ô mỗi cạnh

moveForward();

for (let side = 0; side < 4; side++) {
  for (let step = 0; step < {{sideLength:1-6:2}}; step++) {
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
    code: `// Hàm thu thập {{perCall:1-5:2}} items

function collectItems() {
  for (let i = 0; i < {{perCall:1-5:2}}; i++) {
    collectItem();
    moveForward();
  }
}

moveForward();

// Gọi hàm {{callCount:1-4:3}} lần
for (let c = 0; c < {{callCount:1-4:3}}; c++) {
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
    code: `// Lưới {{rows:1-5:2}} hàng x {{cols:2-8:4}} cột

moveForward();

// Hàng 1: đi thẳng
for (let col = 0; col < {{cols:2-8:4}}; col++) {
  collectItem();
  moveForward();
}

// Lặp thêm các hàng còn lại
for (let row = 1; row < {{rows:1-5:2}}; row++) {
  // Chuyển sang hàng tiếp
  turnRight();
  moveForward();
  turnRight();
  
  // Đi qua hàng
  for (let col = 0; col < {{cols:2-8:4}}; col++) {
    collectItem();
    moveForward();
  }
}
`,
  },
  {
    id: 'function-in-loop',
    name: 'Function in Loop',
    nameVi: 'Hàm trong vòng lặp',
    description: 'Call function inside a loop',
    descriptionVi: 'Gọi hàm bên trong vòng lặp',
    difficulty: 4,
    concept: 'loop_function_call',
    code: `// Hàm trong vòng lặp

function collectSegment() {
  for (let i = 0; i < {{segmentSize:1-4:2}}; i++) {
    collectItem();
    moveForward();
  }
}

moveForward();

for (let i = 0; i < {{segments:2-6:4}}; i++) {
  collectSegment();
  turnRight();
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
    code: `// Cầu thang {{steps:2-8:5}} bậc

jump();  // Rời Start

for (let step = 0; step < {{steps:2-8:5}}; step++) {
  collectItem();
  jump();
}
// Đỉnh cầu thang = Finish
`,
  },
];

export function getPresetById(id: string): TemplatePreset | undefined {
  return TEMPLATE_PRESETS.find(p => p.id === id);
}

export function getPresetsByDifficulty(difficulty: number): TemplatePreset[] {
  return TEMPLATE_PRESETS.filter(p => p.difficulty === difficulty);
}
