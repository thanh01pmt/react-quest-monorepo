/**
 * Template Presets
 * 
 * Predefined code templates for common patterns.
 * Commands match Quest Player exactly (see packages/quest-player/src/games/maze/blocks.ts)
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
    description: 'Write your own code',
    descriptionVi: 'Tự viết code',
    difficulty: 1,
    concept: 'custom',
    code: `// Viết code của bạn ở đây
// Write your code here

moveForward();
collectItem();
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
    code: `// Di chuyển và thu thập
moveForward();
collectItem();
moveForward();
collectItem();
moveForward();
collectItem();
`,
  },
  {
    id: 'simple-for-loop',
    name: 'Simple FOR Loop',
    nameVi: 'Vòng lặp FOR đơn giản',
    description: 'Repeat actions 5 times',
    descriptionVi: 'Lặp lại hành động 5 lần',
    difficulty: 2,
    concept: 'repeat_n',
    code: `// Thu thập 5 viên pha lê
for (let i = 0; i < 5; i++) {
  moveForward();
  collectItem();
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
    code: `// Đường đi hình chữ L
for (let i = 0; i < 3; i++) {
  moveForward();
  collectItem();
}
turnRight();
for (let i = 0; i < 3; i++) {
  moveForward();
  collectItem();
}
`,
  },
  {
    id: 'square-pattern',
    name: 'Square Pattern',
    nameVi: 'Mẫu hình vuông',
    description: 'Create a square path',
    descriptionVi: 'Tạo đường đi hình vuông',
    difficulty: 3,
    concept: 'repeat_n',
    code: `// Vẽ hình vuông - lặp 4 lần
for (let side = 0; side < 4; side++) {
  moveForward();
  collectItem();
  moveForward();
  collectItem();
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
    code: `// Định nghĩa hàm
function collectTwo() {
  moveForward();
  collectItem();
  moveForward();
  collectItem();
}

// Gọi hàm 3 lần
collectTwo();
turnRight();
collectTwo();
turnRight();
collectTwo();
`,
  },
  {
    id: 'nested-loops',
    name: 'Nested FOR Loops',
    nameVi: 'Vòng lặp lồng nhau',
    description: 'Create a grid pattern (3x4)',
    descriptionVi: 'Tạo mẫu lưới (3x4)',
    difficulty: 4,
    concept: 'nested_loop',
    code: `// Vẽ lưới 3x4 bằng vòng lặp lồng nhau
for (let row = 0; row < 3; row++) {
  for (let col = 0; col < 4; col++) {
    moveForward();
    collectItem();
  }
  // Chuyển sang hàng tiếp theo
  turnRight();
  moveForward();
  turnRight();
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
    code: `// Định nghĩa hàm thu thập
function collectLine() {
  moveForward();
  collectItem();
  moveForward();
  collectItem();
  moveForward();
  collectItem();
}

// Sử dụng hàm trong vòng lặp
for (let i = 0; i < 4; i++) {
  collectLine();
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
    code: `// Tạo cầu thang với jump
for (let step = 0; step < 5; step++) {
  jump();
  collectItem();
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
