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

/**
 * Prepare template code for execution - EXACT copy of TemplatePanel.getEffectiveCode()
 * 
 * Steps:
 * 1. Apply parameter overrides (replace _PLACEHOLDER_ with values)
 * 2. Evaluate "var VARNAME = random(min, max);" and replace VARNAME throughout
 * 3. Remove resulting "var <number> = ..." declarations
 * 4. Clean empty lines
 */
export function prepareTemplateCode(
  solutionCode: string,
  overrides: Record<string, number | boolean | string>
): string {
  if (!solutionCode) return '';
  
  let execCode = solutionCode;

  // Step 1: Replace all _PLACEHOLDER_ with their values from overrides
  for (const [name, value] of Object.entries(overrides)) {
    if (!name) continue;
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`\\b${escapedName}\\b`, 'g');
    execCode = execCode.replace(pattern, String(value));
  }

  // Step 2: Find and evaluate "var VARNAME = random(min, max);" 
  // Store the results and replace VARNAME throughout code
  // Use UPPERCASE pattern to match template convention (CRYSTAL_COUNT, PATH_LENGTH, etc)
  const randomVars: Record<string, number> = {};
  const randomPattern = /var\s+([A-Z][A-Z0-9_]*)\s*=\s*random\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)\s*;/g;
  let match;
  while ((match = randomPattern.exec(execCode)) !== null) {
    const varName = match[1];
    const min = parseInt(match[2], 10);
    const max = parseInt(match[3], 10);
    randomVars[varName] = Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Replace random var names with their computed values
  for (const [varName, value] of Object.entries(randomVars)) {
    const pattern = new RegExp(`\\b${varName}\\b`, 'g');
    execCode = execCode.replace(pattern, String(value));
  }

  // Step 3: Remove var declarations (now they're just "var 5 = 5;" etc)
  // Must match multiline: lines that start with var <number> = ...
  execCode = execCode.replace(/^\s*var\s+\d+\s*=\s*[^;]+;\s*$/gm, '');

  // Remove empty lines resulted from removals
  execCode = execCode.replace(/^\s*\n/gm, '');

  return execCode.trim();
}

