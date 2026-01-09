/**
 * Template Presets
 * 
 * Local presets that don't exist in shared-templates.
 * Main templates now come from @repo/shared-templates.
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
  // Optional: for toolbox auto-selection
  tags?: string[];
  category?: string;
  concepts?: string[];
  // Hints for student guidance (extracted from template markdown)
  hints?: {
    title: string;
    description: string;
    learningGoals?: string;
    goalDetails?: string[];
  };
}

/**
 * Custom Code preset - always available for users to write their own code
 */
export const CUSTOM_PRESET: TemplatePreset = {
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
};

/**
 * @deprecated Use templates from @repo/shared-templates instead
 * This array is kept for backward compatibility only
 */
export const TEMPLATE_PRESETS: TemplatePreset[] = [
  CUSTOM_PRESET,
];

export function getPresetById(id: string): TemplatePreset | undefined {
  if (id === 'custom') return CUSTOM_PRESET;
  return undefined;
}

export function getPresetsByDifficulty(difficulty: number): TemplatePreset[] {
  return TEMPLATE_PRESETS.filter(p => p.difficulty === difficulty);
}
