/**
 * Template Variable System
 * 
 * Supports variable placeholders in template code:
 * - {{varName}} - Variable with default value 3, range 1-10
 * - {{varName:5}} - Variable with default value 5, range 1-10
 * - {{varName:2-8}} - Variable with default 2, range 2-8
 * - {{varName:1-20:5}} - Variable with range 1-20, default 5
 */

export interface TemplateVariable {
  name: string;
  displayName: string;
  min: number;
  max: number;
  defaultValue: number;
  currentValue: number;
}

export interface ParsedTemplate {
  rawCode: string;
  variables: TemplateVariable[];
  resolvedCode: string;
}

/**
 * Extract variables from template code
 * Patterns supported:
 * - {{varName}} -> default: 3, range: 1-10
 * - {{varName:5}} -> default: 5, range: 1-10
 * - {{varName:2-8}} -> default: 2, range: 2-8
 * - {{varName:1-20:5}} -> range: 1-20, default: 5
 */
export function extractVariables(code: string): TemplateVariable[] {
  const variablePattern = /\{\{(\w+)(?::([^}]+))?\}\}/g;
  const variables: Map<string, TemplateVariable> = new Map();
  
  let match;
  while ((match = variablePattern.exec(code)) !== null) {
    const name = match[1];
    const config = match[2];
    
    if (variables.has(name)) continue; // Skip duplicates
    
    let min = 1;
    let max = 10;
    let defaultValue = 3;
    
    if (config) {
      // Parse config string
      if (config.includes('-') && config.includes(':')) {
        // Format: 1-20:5 (range:default)
        const [rangeStr, defaultStr] = config.split(':');
        const [minStr, maxStr] = rangeStr.split('-');
        min = parseInt(minStr, 10) || 1;
        max = parseInt(maxStr, 10) || 10;
        defaultValue = parseInt(defaultStr, 10) || min;
      } else if (config.includes('-')) {
        // Format: 2-8 (range only)
        const [minStr, maxStr] = config.split('-');
        min = parseInt(minStr, 10) || 1;
        max = parseInt(maxStr, 10) || 10;
        defaultValue = min;
      } else {
        // Format: 5 (default only)
        defaultValue = parseInt(config, 10) || 3;
      }
    }
    
    // Generate display name from camelCase or snake_case
    const displayName = name
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .trim()
      .replace(/^\w/, c => c.toUpperCase());
    
    variables.set(name, {
      name,
      displayName,
      min,
      max,
      defaultValue,
      currentValue: defaultValue
    });
  }
  
  return Array.from(variables.values());
}

/**
 * Resolve template by replacing variables with values
 */
export function resolveTemplate(
  code: string, 
  variableValues: Record<string, number>
): string {
  return code.replace(/\{\{(\w+)(?::[^}]+)?\}\}/g, (match, name) => {
    const value = variableValues[name];
    return value !== undefined ? String(value) : match;
  });
}

/**
 * Parse template and extract all info
 */
export function parseTemplate(code: string): ParsedTemplate {
  const variables = extractVariables(code);
  const defaultValues: Record<string, number> = {};
  
  variables.forEach(v => {
    defaultValues[v.name] = v.defaultValue;
  });
  
  const resolvedCode = resolveTemplate(code, defaultValues);
  
  return {
    rawCode: code,
    variables,
    resolvedCode
  };
}

/**
 * Check if template has variables
 */
export function hasVariables(code: string): boolean {
  return /\{\{\w+(?::[^}]+)?\}\}/.test(code);
}
