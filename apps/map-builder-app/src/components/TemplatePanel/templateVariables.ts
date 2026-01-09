/**
 * Template Variable System - Pure JavaScript with _PLACEHOLDER_ Convention
 * 
 * Variables with _NAME_ pattern (underscore at start and end) are recognized
 * as adjustable placeholders that get UI sliders.
 * 
 * Example:
 *   var _CRYSTAL_MIN_ = 3;   // Slider auto-generated
 *   var _CRYSTAL_MAX_ = 6;   // Slider auto-generated
 *   var CRYSTAL_NUM = random(_CRYSTAL_MIN_, _CRYSTAL_MAX_);
 * 
 * The code is 100% valid JavaScript. The random() function is provided at runtime.
 */

export interface TemplateVariable {
  name: string;           // Variable name with underscores (e.g., "_CRYSTAL_MIN_")
  displayName: string;    // Display name for UI (e.g., "Crystal Min")
  value: number | string; // Current value
  type: 'number' | 'string';
  options?: string[];     // Optional dropdown values extracted from comments
  isPlaceholder: true;    // Always true for this format
}

export interface ParsedTemplate {
  rawCode: string;
  variables: TemplateVariable[];
  resolvedCode: string;
}

/**
 * Extract _PLACEHOLDER_ variables from code
 * Pattern: var _NAME_ = number;
 */
export function extractVariables(code: string): TemplateVariable[] {
  const variables: Map<string, TemplateVariable> = new Map();
  
// Match number: var _NAME_ = 123;
  const numberPattern = /var\s+(_[A-Z][A-Z0-9_]*_)\s*=\s*(\d+)\s*;(?:\s*\/\/\s*OPTIONS:\s*([^\n]+))?/g;
  
  // Match string: var _NAME_ = 'val'; or "val";
  const stringPattern = /var\s+(_[A-Z][A-Z0-9_]*_)\s*=\s*(['"])([^'"]+)\2\s*;(?:\s*\/\/\s*OPTIONS:\s*([^\n]+))?/g;

  // Process numbers
  let match;
  while ((match = numberPattern.exec(code)) !== null) {
    addVariable(match[1], parseInt(match[2], 10), 'number', match[3]);
  }

  // Process strings
  while ((match = stringPattern.exec(code)) !== null) {
    addVariable(match[1], match[3], 'string', match[4]);
  }

  function addVariable(name: string, value: number | string, type: 'number' | 'string', optionsComment?: string) {
    if (variables.has(name)) return;
    
    // Generate display name
    const displayName = name
      .replace(/^_/, '')
      .replace(/_$/, '')
      .replace(/_/g, ' ')
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    const options = optionsComment 
      ? optionsComment.split(',').map(s => s.trim()) 
      : undefined;
    
    variables.set(name, {
      name,
      displayName,
      value,
      type,
      options,
      isPlaceholder: true
    });
  }
  
  return Array.from(variables.values());
}

/**
 * Update variable values in code
 * Replaces var _NAME_ = oldValue; with var _NAME_ = newValue;
 */
export function updateVariableValues(
  code: string, 
  variableValues: Record<string, number | string>
): string {
  let result = code;
  
  for (const [name, value] of Object.entries(variableValues)) {
    // Match: var _NAME_ = number; or var _NAME_ = 'string';
    // We need to check the type to know if we should quote it
    const isString = typeof value === 'string';
    const replacement = isString ? `'${value}'` : value;
    
    // Regex for assignment (supporting both number and string original structure)
    // We replace the Right Hand Side value
    const pattern = new RegExp(`(var\\s+${escapeRegex(name)}\\s*=\\s*)(?:\\d+|['"][^'"]*['"])(\\s*;)`, 'g');
    result = result.replace(pattern, `$1${replacement}$2`);
  }
  
  return result;
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Resolve template for execution
 * The code is already valid JS, just update values if provided
 */
export function resolveTemplateBody(
  code: string, 
  variableValues: Record<string, number | string>
): string {
  return updateVariableValues(code, variableValues);
}

/**
 * Resolve template for display (same as body since it's pure JS)
 */
export function resolveTemplate(
  code: string, 
  variableValues: Record<string, number | string>
): string {
  return updateVariableValues(code, variableValues);
}

/**
 * Parse template and extract all info
 */
export function parseTemplate(code: string): ParsedTemplate {
  const variables = extractVariables(code);
  const values: Record<string, number | string> = {};
  
  variables.forEach(v => {
    values[v.name] = v.value;
  });
  
  return {
    rawCode: code,
    variables,
    resolvedCode: code  // Already resolved since it's pure JS
  };
}

/**
 * Check if template has variables
 */
export function hasVariables(code: string): boolean {
  return /var\s+_[A-Z][A-Z0-9_]*_\s*=\s*(?:['"][^'"]*['"]|\d+)\s*;/.test(code);
}

/**
 * Generate random helper function code to inject at runtime
 */
export function getRandomHelperCode(): string {
  return `
// Random helper function
function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
`;
}

/**
 * Prepare code for execution by injecting random() helper
 */
export function prepareForExecution(code: string): string {
  // Check if random() is used
  if (code.includes('random(')) {
    return getRandomHelperCode() + '\n' + code;
  }
  return code;
}
