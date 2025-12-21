/**
 * Academic Concept Types
 * 
 * Định nghĩa chi tiết các concepts học thuật cho curriculum design
 */

import type { Vector3 } from './MapAnalyzer';

// ============================================================================
// CONCEPT CATEGORIES
// ============================================================================

/**
 * Concept Categories - Các nhóm concept chính
 */
export type ConceptCategory = 
  | 'sequential'
  | 'loop'
  | 'conditional'
  | 'function'
  | 'variable'
  | 'advanced';

// ============================================================================
// FINE-GRAINED CONCEPTS
// ============================================================================

/**
 * Loop Concepts - Chi tiết các loại vòng lặp
 */
export type LoopConcept = 
  | 'repeat_n'              // Repeat n times (số lần cố định)
  | 'repeat_until'          // Repeat until condition (lặp đến khi)
  | 'while_condition'       // While condition (lặp trong khi)
  | 'for_each'              // For each item (lặp qua collection)
  | 'infinite_loop';        // Loop vô hạn (cần break)

/**
 * Conditional Concepts - Chi tiết các loại điều kiện
 */
export type ConditionalConcept = 
  | 'if_simple'             // If đơn giản (path_ahead, at_crystal...)
  | 'if_else'               // If-else
  | 'if_elif_else'          // If-elif-else (nhiều nhánh)
  | 'switch_case'           // Switch-case
  | 'nested_if';            // If lồng if

/**
 * Function Concepts - Chi tiết các loại hàm
 */
export type FunctionConcept = 
  | 'procedure_simple'      // Procedure không tham số
  | 'procedure_with_param'  // Procedure có tham số
  | 'function_return'       // Function trả về giá trị
  | 'function_compose'      // Kết hợp nhiều function
  | 'recursion';            // Đệ quy

/**
 * Variable Concepts - Chi tiết các loại biến
 */
export type VariableConcept = 
  | 'counter'               // Biến đếm (increment/decrement)
  | 'state_toggle'          // Biến trạng thái (on/off)
  | 'accumulator'           // Biến tích lũy (sum, collect)
  | 'collection'            // Danh sách/mảng
  | 'flag';                 // Biến cờ (boolean flag)

/**
 * Advanced Concepts - Kỹ năng tư duy nâng cao
 */
export type AdvancedConcept = 
  | 'pattern_recognition'   // Nhận diện pattern
  | 'optimization'          // Tối ưu code
  | 'abstraction'           // Trừu tượng hóa
  | 'decomposition';        // Phân rã bài toán

// ============================================================================
// CONCEPT COMBINATIONS
// ============================================================================

/**
 * Concept Combinations - Kết hợp nhiều concepts
 * Format: primary_secondary hoặc primary_modifier
 */
export type ConceptCombination = 
  // Loop + Variable
  | 'repeat_n_counter'          // Loop n lần + biến đếm
  | 'while_counter'             // While + biến đếm (thoát khi counter = target)
  | 'repeat_until_state'        // Repeat until + state variable
  | 'for_each_accumulator'      // For each + tích lũy
  
  // Loop + Conditional
  | 'loop_if_inside'            // Loop chứa if (lặp, kiểm tra mỗi vòng)
  | 'if_loop_inside'            // If chứa loop (điều kiện rồi lặp)
  | 'loop_break'                // Loop với điều kiện thoát sớm
  
  // Function + Loop
  | 'function_loop_inside'      // Function chứa loop
  | 'loop_function_call'        // Loop gọi function mỗi vòng
  
  // Function + Conditional
  | 'function_if_inside'        // Function chứa conditional
  | 'conditional_function_call' // Gọi function khác tùy điều kiện
  
  // Nested structures
  | 'nested_loop'               // Loop lồng loop
  | 'nested_conditional'        // If lồng if
  | 'nested_function'           // Function gọi function
  
  // Triple combinations
  | 'loop_if_function'          // Loop → if → function call
  | 'function_loop_if';         // Function chứa loop chứa if

// ============================================================================
// UNIFIED CONCEPT TYPE
// ============================================================================

/**
 * Full AcademicConcept - Có thể là đơn lẻ hoặc kết hợp
 */
export type AcademicConcept = 
  | 'sequential'
  | LoopConcept 
  | ConditionalConcept 
  | FunctionConcept 
  | VariableConcept 
  | AdvancedConcept
  | ConceptCombination;

// ============================================================================
// CONCEPT METADATA
// ============================================================================

/**
 * Concept metadata cho curriculum design
 */
export interface ConceptMetadata {
  concept: AcademicConcept;
  category: ConceptCategory;
  prerequisites: AcademicConcept[];  // Concepts cần học trước
  difficulty: number;                 // 1-10
  blockTypes: string[];               // Blockly blocks cần dùng
  description: string;
  learningGoal: string;
}

/**
 * Predefined concept metadata (curriculum map)
 */
export const CONCEPT_CURRICULUM: Record<AcademicConcept, ConceptMetadata> = {
  // === SEQUENTIAL ===
  'sequential': {
    concept: 'sequential',
    category: 'sequential',
    prerequisites: [],
    difficulty: 1,
    blockTypes: ['moveForward', 'turnLeft', 'turnRight'],
    description: 'Thực hiện lệnh theo thứ tự',
    learningGoal: 'Hiểu cách lệnh thực hiện tuần tự từ trên xuống'
  },
  
  // === LOOP ===
  'repeat_n': {
    concept: 'repeat_n',
    category: 'loop',
    prerequisites: ['sequential'],
    difficulty: 2,
    blockTypes: ['repeat_times'],
    description: 'Lặp lại một nhóm lệnh n lần',
    learningGoal: 'Nhận diện pattern lặp lại và sử dụng repeat'
  },
  'repeat_until': {
    concept: 'repeat_until',
    category: 'loop',
    prerequisites: ['repeat_n', 'if_simple'],
    difficulty: 4,
    blockTypes: ['repeat_until'],
    description: 'Lặp đến khi thỏa mãn điều kiện',
    learningGoal: 'Sử dụng vòng lặp có điều kiện dừng'
  },
  'while_condition': {
    concept: 'while_condition',
    category: 'loop',
    prerequisites: ['repeat_until'],
    difficulty: 5,
    blockTypes: ['while'],
    description: 'Lặp trong khi điều kiện đúng',
    learningGoal: 'Phân biệt while và repeat_until'
  },
  'for_each': {
    concept: 'for_each',
    category: 'loop',
    prerequisites: ['repeat_n', 'collection'],
    difficulty: 6,
    blockTypes: ['foreach'],
    description: 'Lặp qua từng phần tử trong collection',
    learningGoal: 'Xử lý danh sách với vòng lặp'
  },
  'infinite_loop': {
    concept: 'infinite_loop',
    category: 'loop',
    prerequisites: ['while_condition', 'if_simple'],
    difficulty: 7,
    blockTypes: ['while_true', 'break'],
    description: 'Loop vô hạn cần break để thoát',
    learningGoal: 'Xử lý trường hợp không biết trước số lần lặp'
  },
  
  // === CONDITIONAL ===
  'if_simple': {
    concept: 'if_simple',
    category: 'conditional',
    prerequisites: ['sequential'],
    difficulty: 3,
    blockTypes: ['if'],
    description: 'Thực hiện lệnh nếu điều kiện đúng',
    learningGoal: 'Kiểm tra điều kiện trước khi hành động'
  },
  'if_else': {
    concept: 'if_else',
    category: 'conditional',
    prerequisites: ['if_simple'],
    difficulty: 4,
    blockTypes: ['if_else'],
    description: 'Chọn một trong hai nhánh',
    learningGoal: 'Xử lý cả hai trường hợp true/false'
  },
  'if_elif_else': {
    concept: 'if_elif_else',
    category: 'conditional',
    prerequisites: ['if_else'],
    difficulty: 5,
    blockTypes: ['if_elseif_else'],
    description: 'Chọn một trong nhiều nhánh',
    learningGoal: 'Xử lý nhiều trường hợp khác nhau'
  },
  'switch_case': {
    concept: 'switch_case',
    category: 'conditional',
    prerequisites: ['if_elif_else'],
    difficulty: 6,
    blockTypes: ['switch'],
    description: 'Chọn nhánh dựa trên giá trị',
    learningGoal: 'Xử lý nhiều case từ một biến'
  },
  'nested_if': {
    concept: 'nested_if',
    category: 'conditional',
    prerequisites: ['if_else'],
    difficulty: 6,
    blockTypes: ['if', 'if_else'],
    description: 'Điều kiện lồng điều kiện',
    learningGoal: 'Kết hợp nhiều điều kiện logic'
  },
  
  // === FUNCTION ===
  'procedure_simple': {
    concept: 'procedure_simple',
    category: 'function',
    prerequisites: ['repeat_n'],
    difficulty: 4,
    blockTypes: ['procedures_defnoreturn', 'procedures_callnoreturn'],
    description: 'Định nghĩa và gọi procedure',
    learningGoal: 'Đóng gói nhóm lệnh thành procedure'
  },
  'procedure_with_param': {
    concept: 'procedure_with_param',
    category: 'function',
    prerequisites: ['procedure_simple', 'counter'],
    difficulty: 6,
    blockTypes: ['procedures_defnoreturn', 'procedures_callnoreturn', 'variables_get'],
    description: 'Procedure nhận tham số',
    learningGoal: 'Tái sử dụng code với dữ liệu khác nhau'
  },
  'function_return': {
    concept: 'function_return',
    category: 'function',
    prerequisites: ['procedure_with_param'],
    difficulty: 7,
    blockTypes: ['procedures_defreturn', 'procedures_callreturn'],
    description: 'Function trả về giá trị',
    learningGoal: 'Tính toán và trả về kết quả'
  },
  'function_compose': {
    concept: 'function_compose',
    category: 'function',
    prerequisites: ['procedure_simple'],
    difficulty: 7,
    blockTypes: ['procedures_defnoreturn', 'procedures_callnoreturn'],
    description: 'Function gọi function khác',
    learningGoal: 'Xây dựng giải pháp từ nhiều function nhỏ'
  },
  'recursion': {
    concept: 'recursion',
    category: 'function',
    prerequisites: ['procedure_simple', 'if_simple'],
    difficulty: 9,
    blockTypes: ['procedures_defnoreturn', 'procedures_callnoreturn', 'if'],
    description: 'Function gọi chính nó',
    learningGoal: 'Giải quyết bài toán phân rã tự tương tự'
  },
  
  // === VARIABLE ===
  'counter': {
    concept: 'counter',
    category: 'variable',
    prerequisites: ['repeat_n'],
    difficulty: 3,
    blockTypes: ['variables_set', 'variables_get', 'math_arithmetic'],
    description: 'Biến đếm tăng/giảm',
    learningGoal: 'Theo dõi số lượng với biến'
  },
  'state_toggle': {
    concept: 'state_toggle',
    category: 'variable',
    prerequisites: ['if_simple'],
    difficulty: 4,
    blockTypes: ['variables_set', 'variables_get', 'logic_boolean'],
    description: 'Biến on/off',
    learningGoal: 'Lưu trạng thái và thay đổi'
  },
  'accumulator': {
    concept: 'accumulator',
    category: 'variable',
    prerequisites: ['counter', 'repeat_n'],
    difficulty: 5,
    blockTypes: ['variables_set', 'variables_get', 'math_arithmetic'],
    description: 'Biến tích lũy',
    learningGoal: 'Tổng hợp giá trị qua nhiều bước'
  },
  'collection': {
    concept: 'collection',
    category: 'variable',
    prerequisites: ['counter'],
    difficulty: 6,
    blockTypes: ['lists_create_with', 'lists_getIndex', 'lists_setIndex'],
    description: 'Danh sách/mảng',
    learningGoal: 'Lưu trữ và truy cập nhiều giá trị'
  },
  'flag': {
    concept: 'flag',
    category: 'variable',
    prerequisites: ['if_simple', 'state_toggle'],
    difficulty: 5,
    blockTypes: ['variables_set', 'variables_get', 'logic_boolean'],
    description: 'Biến cờ boolean',
    learningGoal: 'Sử dụng cờ để điều khiển luồng'
  },
  
  // === ADVANCED ===
  'pattern_recognition': {
    concept: 'pattern_recognition',
    category: 'advanced',
    prerequisites: ['repeat_n'],
    difficulty: 3,
    blockTypes: [],
    description: 'Nhận diện pattern trong bài toán',
    learningGoal: 'Tìm quy luật lặp lại để tối ưu code'
  },
  'optimization': {
    concept: 'optimization',
    category: 'advanced',
    prerequisites: ['repeat_n', 'procedure_simple'],
    difficulty: 6,
    blockTypes: [],
    description: 'Tối ưu hóa giải pháp',
    learningGoal: 'Giảm số lượng blocks/steps'
  },
  'abstraction': {
    concept: 'abstraction',
    category: 'advanced',
    prerequisites: ['procedure_simple'],
    difficulty: 7,
    blockTypes: [],
    description: 'Trừu tượng hóa',
    learningGoal: 'Ẩn chi tiết, tập trung vào ý tưởng lớn'
  },
  'decomposition': {
    concept: 'decomposition',
    category: 'advanced',
    prerequisites: ['procedure_simple'],
    difficulty: 6,
    blockTypes: [],
    description: 'Phân rã bài toán',
    learningGoal: 'Chia bài toán lớn thành phần nhỏ'
  },
  
  // === COMBINATIONS ===
  'repeat_n_counter': {
    concept: 'repeat_n_counter',
    category: 'loop',
    prerequisites: ['repeat_n', 'counter'],
    difficulty: 4,
    blockTypes: ['repeat_times', 'variables_set', 'variables_get'],
    description: 'Loop n lần kết hợp đếm',
    learningGoal: 'Theo dõi tiến trình trong vòng lặp'
  },
  'while_counter': {
    concept: 'while_counter',
    category: 'loop',
    prerequisites: ['while_condition', 'counter'],
    difficulty: 6,
    blockTypes: ['while', 'variables_set', 'variables_get', 'math_arithmetic'],
    description: 'While với điều kiện counter',
    learningGoal: 'Điều khiển loop bằng biến đếm'
  },
  'repeat_until_state': {
    concept: 'repeat_until_state',
    category: 'loop',
    prerequisites: ['repeat_until', 'state_toggle'],
    difficulty: 5,
    blockTypes: ['repeat_until', 'variables_set', 'variables_get'],
    description: 'Repeat until biến state thay đổi',
    learningGoal: 'Kết hợp loop và state management'
  },
  'for_each_accumulator': {
    concept: 'for_each_accumulator',
    category: 'loop',
    prerequisites: ['for_each', 'accumulator'],
    difficulty: 7,
    blockTypes: ['foreach', 'variables_set', 'variables_get', 'math_arithmetic'],
    description: 'For each với tích lũy',
    learningGoal: 'Tính tổng/đếm qua collection'
  },
  'loop_if_inside': {
    concept: 'loop_if_inside',
    category: 'loop',
    prerequisites: ['repeat_n', 'if_simple'],
    difficulty: 5,
    blockTypes: ['repeat_times', 'if'],
    description: 'Kiểm tra điều kiện mỗi vòng lặp',
    learningGoal: 'Kết hợp lặp và kiểm tra điều kiện'
  },
  'if_loop_inside': {
    concept: 'if_loop_inside',
    category: 'conditional',
    prerequisites: ['if_simple', 'repeat_n'],
    difficulty: 5,
    blockTypes: ['if', 'repeat_times'],
    description: 'Điều kiện rồi mới lặp',
    learningGoal: 'Lặp có điều kiện tiên quyết'
  },
  'loop_break': {
    concept: 'loop_break',
    category: 'loop',
    prerequisites: ['while_condition', 'if_simple'],
    difficulty: 6,
    blockTypes: ['while', 'if', 'break'],
    description: 'Loop với điều kiện thoát sớm',
    learningGoal: 'Thoát loop khi đạt điều kiện'
  },
  'function_loop_inside': {
    concept: 'function_loop_inside',
    category: 'function',
    prerequisites: ['procedure_simple', 'repeat_n'],
    difficulty: 5,
    blockTypes: ['procedures_defnoreturn', 'repeat_times'],
    description: 'Function chứa loop',
    learningGoal: 'Đóng gói pattern lặp thành function'
  },
  'loop_function_call': {
    concept: 'loop_function_call',
    category: 'loop',
    prerequisites: ['repeat_n', 'procedure_simple'],
    difficulty: 5,
    blockTypes: ['repeat_times', 'procedures_callnoreturn'],
    description: 'Gọi procedure trong mỗi vòng lặp',
    learningGoal: 'Tái sử dụng procedure nhiều lần'
  },
  'function_if_inside': {
    concept: 'function_if_inside',
    category: 'function',
    prerequisites: ['procedure_simple', 'if_simple'],
    difficulty: 5,
    blockTypes: ['procedures_defnoreturn', 'if'],
    description: 'Function chứa conditional',
    learningGoal: 'Function với logic điều kiện'
  },
  'conditional_function_call': {
    concept: 'conditional_function_call',
    category: 'conditional',
    prerequisites: ['if_else', 'procedure_simple'],
    difficulty: 6,
    blockTypes: ['if_else', 'procedures_callnoreturn'],
    description: 'Gọi function khác tùy điều kiện',
    learningGoal: 'Điều hướng giữa các functions'
  },
  'nested_loop': {
    concept: 'nested_loop',
    category: 'loop',
    prerequisites: ['repeat_n'],
    difficulty: 7,
    blockTypes: ['repeat_times'],
    description: 'Vòng lặp lồng vòng lặp',
    learningGoal: 'Xử lý cấu trúc 2D với loop lồng'
  },
  'nested_conditional': {
    concept: 'nested_conditional',
    category: 'conditional',
    prerequisites: ['if_else'],
    difficulty: 6,
    blockTypes: ['if', 'if_else'],
    description: 'If lồng if',
    learningGoal: 'Logic điều kiện phức tạp'
  },
  'nested_function': {
    concept: 'nested_function',
    category: 'function',
    prerequisites: ['procedure_simple'],
    difficulty: 6,
    blockTypes: ['procedures_defnoreturn', 'procedures_callnoreturn'],
    description: 'Function gọi function',
    learningGoal: 'Xây dựng abstraction layers'
  },
  'loop_if_function': {
    concept: 'loop_if_function',
    category: 'advanced',
    prerequisites: ['repeat_n', 'if_simple', 'procedure_simple'],
    difficulty: 8,
    blockTypes: ['repeat_times', 'if', 'procedures_callnoreturn'],
    description: 'Loop chứa if gọi function',
    learningGoal: 'Kết hợp ba pattern cơ bản'
  },
  'function_loop_if': {
    concept: 'function_loop_if',
    category: 'advanced',
    prerequisites: ['procedure_simple', 'repeat_n', 'if_simple'],
    difficulty: 8,
    blockTypes: ['procedures_defnoreturn', 'repeat_times', 'if'],
    description: 'Function chứa loop chứa if',
    learningGoal: 'Function phức tạp với nhiều logic'
  }
};

// ============================================================================
// PLACEMENT TYPES
// ============================================================================

export type ItemType = 'crystal' | 'switch' | 'gem' | 'goal';

export interface ItemPlacement {
  type: ItemType;
  position: Vector3;
  groupId?: string;
  patternRole?: string;
}

export interface ExpectedSolution {
  hasLoop: boolean;
  loopType?: LoopConcept;
  loopCount?: number;
  hasProcedure: boolean;
  procedureCount?: number;
  hasConditional: boolean;
  conditionalType?: ConditionalConcept;
  hasVariable: boolean;
  variableType?: VariableConcept;
  estimatedSteps: number;
  estimatedBlocks: number;
}

export interface AcademicPlacement {
  id: string;
  name: string;
  concepts: AcademicConcept[];
  primaryConcept: AcademicConcept;
  difficulty: number;
  items: ItemPlacement[];
  patternDescription: string;
  expectedSolution: ExpectedSolution;
  requiredBlocks: string[];
  tags: string[];
  educationalGoal: string;
  prerequisiteConcepts: AcademicConcept[];
}

export interface PlacementOpportunity {
  type: string;
  description: string;
  segments?: string[];
  positions?: Vector3[];
  concepts: AcademicConcept[];
  potentialDifficulty: [number, number];
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get concept metadata
 */
export function getConceptMetadata(concept: AcademicConcept): ConceptMetadata | undefined {
  return CONCEPT_CURRICULUM[concept];
}

/**
 * Get all concepts by category
 */
export function getConceptsByCategory(category: ConceptCategory): AcademicConcept[] {
  return Object.values(CONCEPT_CURRICULUM)
    .filter(meta => meta.category === category)
    .map(meta => meta.concept);
}

/**
 * Get prerequisites for a concept
 */
export function getPrerequisites(concept: AcademicConcept): AcademicConcept[] {
  const meta = CONCEPT_CURRICULUM[concept];
  return meta ? meta.prerequisites : [];
}

/**
 * Check if all prerequisites are met
 */
export function checkPrerequisites(
  concept: AcademicConcept, 
  masteredConcepts: AcademicConcept[]
): boolean {
  const prereqs = getPrerequisites(concept);
  return prereqs.every(prereq => masteredConcepts.includes(prereq));
}

/**
 * Get next recommended concepts based on mastered ones
 */
export function getNextConcepts(masteredConcepts: AcademicConcept[]): AcademicConcept[] {
  const allConcepts = Object.keys(CONCEPT_CURRICULUM) as AcademicConcept[];
  
  return allConcepts.filter(concept => {
    // Already mastered
    if (masteredConcepts.includes(concept)) return false;
    
    // Prerequisites not met
    const prereqs = getPrerequisites(concept);
    return prereqs.every(prereq => masteredConcepts.includes(prereq));
  });
}

/**
 * Create a default ExpectedSolution
 */
export function createDefaultSolution(overrides: Partial<ExpectedSolution> = {}): ExpectedSolution {
  return {
    hasLoop: false,
    hasProcedure: false,
    hasConditional: false,
    hasVariable: false,
    estimatedSteps: 0,
    estimatedBlocks: 0,
    ...overrides
  };
}

export default CONCEPT_CURRICULUM;
