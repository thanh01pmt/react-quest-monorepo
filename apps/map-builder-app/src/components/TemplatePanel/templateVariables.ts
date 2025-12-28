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
  value: number;          // Current value
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
  
  // Pattern: var _NAME_ = number;
  // Matches: var _CRYSTAL_MIN_ = 3;
  const pattern = /var\s+(_[A-Z][A-Z0-9_]*_)\s*=\s*(\d+)\s*;/g;
  
  let match;
  while ((match = pattern.exec(code)) !== null) {
    const name = match[1];  // e.g., "_CRYSTAL_MIN_"
    const value = parseInt(match[2], 10);
    
    if (variables.has(name)) continue;
    
    // Generate display name: _CRYSTAL_MIN_ -> "Crystal Min"
    const displayName = name
      .replace(/^_/, '')      // Remove leading underscore
      .replace(/_$/, '')      // Remove trailing underscore
      .replace(/_/g, ' ')     // Replace underscores with spaces
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    variables.set(name, {
      name,
      displayName,
      value,
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
  variableValues: Record<string, number>
): string {
  let result = code;
  
  for (const [name, value] of Object.entries(variableValues)) {
    // Match: var _NAME_ = number;
    const pattern = new RegExp(`(var\\s+${escapeRegex(name)}\\s*=\\s*)\\d+(\\s*;)`, 'g');
    result = result.replace(pattern, `$1${value}$2`);
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
  variableValues: Record<string, number>
): string {
  return updateVariableValues(code, variableValues);
}

/**
 * Resolve template for display (same as body since it's pure JS)
 */
export function resolveTemplate(
  code: string, 
  variableValues: Record<string, number>
): string {
  return updateVariableValues(code, variableValues);
}

/**
 * Parse template and extract all info
 */
export function parseTemplate(code: string): ParsedTemplate {
  const variables = extractVariables(code);
  const values: Record<string, number> = {};
  
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
  return /var\s+_[A-Z][A-Z0-9_]*_\s*=\s*\d+\s*;/.test(code);
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
