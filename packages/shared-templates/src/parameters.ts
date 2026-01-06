/**
 * Template Parameter Utilities
 * 
 * Functions for handling template parameters safe for browser usage.
 * No heavy dependencies (like gray-matter).
 */

/**
 * Apply parameter overrides to solution code by simple string replacement.
 * Uses global replacement to substitute placeholders with values.
 * 
 * Example:
 * code: "for (i=0; i<_COUNT_; i++)"
 * overrides: { _COUNT_: 5 }
 * result: "for (i=0; i<5; i++)"
 */
export function applyParameters(
  solutionCode: string, 
  overrides: Record<string, number | boolean | string>
): string {
  if (!solutionCode) return '';
  
  let result = solutionCode;
  
  for (const [name, value] of Object.entries(overrides)) {
    // Check if name is non-empty to avoid infinite loop potential with empty regex
    if (!name) continue;

    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedName}\\b`, 'g');
    
    // Convert value to string. 
    // Note: This assumes strings in templates are handled (e.g. quoted in template if needed)
    result = result.replace(regex, String(value));
  }
  
  return result;
}
