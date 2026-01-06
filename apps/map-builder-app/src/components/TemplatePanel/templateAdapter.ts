/**
 * Template Adapter
 * 
 * Converts TemplateConfig from @repo/shared-templates to the format
 * expected by TemplatePanel for backward compatibility.
 */

import type { TemplateConfig, ConceptCategory } from '@repo/shared-templates';
import { BUNDLED_TEMPLATES } from '@repo/shared-templates';
import type { TemplatePreset } from './presets';

/**
 * Category display info
 */
export interface CategoryInfo {
  id: ConceptCategory;
  name: string;
  nameVi: string;
  icon: string;
}

/**
 * Category display metadata (static defaults for known categories)
 */
const CATEGORY_DISPLAY: Record<string, { name: string; nameVi: string; icon: string }> = {
  sequential: { name: 'Sequential', nameVi: 'Tuần tự', icon: '📚' },
  loop: { name: 'Loop', nameVi: 'Vòng lặp', icon: '🔁' },
  conditional: { name: 'Conditional', nameVi: 'Điều kiện', icon: '🔀' },
  function: { name: 'Function', nameVi: 'Hàm', icon: '📦' },
  variable: { name: 'Variable', nameVi: 'Biến', icon: '📊' },
  progression: { name: 'Progression', nameVi: 'Tiến trình', icon: '📈' },
  logic: { name: 'Logic', nameVi: 'Logic', icon: '🧠' },
  memory: { name: 'Memory', nameVi: 'Bộ nhớ', icon: '💾' },
  decomposition: { name: 'Decomposition', nameVi: 'Phân rã', icon: '🧩' },
  search: { name: 'Search', nameVi: 'Tìm kiếm', icon: '🔍' },
  advanced: { name: 'Advanced', nameVi: 'Nâng cao', icon: '🚀' },
};

/**
 * Generate CATEGORY_INFO dynamically from BUNDLED_TEMPLATES
 */
function generateCategoryInfo(): CategoryInfo[] {
  const uniqueCategories = new Set<ConceptCategory>();
  for (const template of BUNDLED_TEMPLATES) {
    uniqueCategories.add(template.metadata.category);
  }
  
  return Array.from(uniqueCategories).map(id => {
    const display = CATEGORY_DISPLAY[id] || { name: id, nameVi: id, icon: '📄' };
    return { id, ...display };
  }).sort((a, b) => {
    // Sort by predefined order or alphabetically
    const order = Object.keys(CATEGORY_DISPLAY);
    const idxA = order.indexOf(a.id);
    const idxB = order.indexOf(b.id);
    if (idxA >= 0 && idxB >= 0) return idxA - idxB;
    if (idxA >= 0) return -1;
    if (idxB >= 0) return 1;
    return a.id.localeCompare(b.id);
  });
}

export const CATEGORY_INFO: CategoryInfo[] = generateCategoryInfo();

/**
 * Get Vietnamese name for a concept
 */
export function getConceptNameVi(concept: string): string {
  const conceptMap: Record<string, string> = {
    sequential: 'Tuần tự',
    repeat_n: 'Lặp N lần',
    repeat_until: 'Lặp đến khi',
    while_condition: 'Vòng while',
    for_each: 'Vòng for-each',
    if_simple: 'If đơn giản',
    if_else: 'If-else',
    if_elif_else: 'If-elif-else',
    nested_if: 'If lồng nhau',
    procedure_simple: 'Hàm đơn giản',
    procedure_with_param: 'Hàm có tham số',
    function_return: 'Hàm trả về',
    counter: 'Biến đếm',
    accumulator: 'Biến tích lũy',
    pattern_recognition: 'Nhận dạng mẫu',
    nested_loop: 'Vòng lặp lồng',
    loop_if_inside: 'If trong vòng lặp',
  };
  return conceptMap[concept] || concept;
}

/**
 * Map difficulty (1-10 scale to 1-5 stars)
 */
function mapDifficulty(difficulty: number): 1 | 2 | 3 | 4 | 5 {
  if (difficulty <= 2) return 1;
  if (difficulty <= 4) return 2;
  if (difficulty <= 6) return 3;
  if (difficulty <= 8) return 4;
  return 5;
}

/**
 * Convert TemplateConfig to TemplatePreset format
 */
export function convertToPreset(template: TemplateConfig): TemplatePreset {
  const concept = template.metadata.concepts[0] || 'sequential';
  return {
    id: template.metadata.id,
    name: template.metadata.name,
    nameVi: template.metadata.name, // Use name as fallback
    description: template.metadata.description || '',
    descriptionVi: getConceptNameVi(concept),
    difficulty: mapDifficulty(template.metadata.difficulty),
    concept: concept,
    code: template.solutionCode,
  };
}

/**
 * Get all templates as presets, sorted by category and difficulty
 */
export function getAllTemplatesAsPresets(): TemplatePreset[] {
  // Use dynamic category order from CATEGORY_INFO
  const categoryOrder = CATEGORY_INFO.map(c => c.id);
  
  const sorted = [...BUNDLED_TEMPLATES].sort((a, b) => {
    const catA = categoryOrder.indexOf(a.metadata.category);
    const catB = categoryOrder.indexOf(b.metadata.category);
    // Put unknown categories at the end
    const effectiveA = catA >= 0 ? catA : categoryOrder.length;
    const effectiveB = catB >= 0 ? catB : categoryOrder.length;
    if (effectiveA !== effectiveB) return effectiveA - effectiveB;
    return a.metadata.difficulty - b.metadata.difficulty;
  });
  
  return sorted.map(convertToPreset);
}

/**
 * Get templates grouped by category
 */
export function getTemplatesGroupedByCategory(): Map<ConceptCategory, TemplatePreset[]> {
  const grouped = new Map<ConceptCategory, TemplatePreset[]>();
  
  for (const template of BUNDLED_TEMPLATES) {
    const category = template.metadata.category;
    const preset = convertToPreset(template);
    
    if (!grouped.has(category)) {
      grouped.set(category, []);
    }
    grouped.get(category)!.push(preset);
  }
  
  // Sort each category by difficulty
  for (const [, presets] of grouped) {
    presets.sort((a, b) => a.difficulty - b.difficulty);
  }
  
  return grouped;
}

/**
 * Get template preset by ID
 */
export function getTemplateById(id: string): TemplatePreset | undefined {
  const template = BUNDLED_TEMPLATES.find(t => t.metadata.id === id);
  return template ? convertToPreset(template) : undefined;
}

/**
 * Get original TemplateConfig by ID  
 */
export function getTemplateConfigById(id: string): TemplateConfig | undefined {
  return BUNDLED_TEMPLATES.find(t => t.metadata.id === id);
}

/**
 * Get available categories that have templates
 */
export function getAvailableCategories(): CategoryInfo[] {
  const available = new Set<ConceptCategory>();
  for (const template of BUNDLED_TEMPLATES) {
    available.add(template.metadata.category);
  }
  return CATEGORY_INFO.filter(cat => available.has(cat.id));
}
