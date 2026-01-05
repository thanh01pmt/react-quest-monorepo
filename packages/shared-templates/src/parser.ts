/**
 * Template Parser
 * 
 * Parses markdown templates with YAML frontmatter into TemplateConfig objects.
 */

import matter from 'gray-matter';
import type { 
  TemplateConfig, 
  TemplateMetadata, 
  TemplateParameter 
} from './types';

/**
 * Extract parameters from solution code
 * Looks for patterns like: var _PARAM_NAME_ = value;
 */
function extractParameters(code: string): TemplateParameter[] {
  const params: TemplateParameter[] = [];
  const regex = /(?:var|const|let)\s+(_[A-Z_]+_)\s*=\s*(\d+|true|false|"[^"]*"|'[^']*');?/g;
  
  let match;
  while ((match = regex.exec(code)) !== null) {
    const name = match[1];
    const rawValue = match[2];
    
    // Determine type and value
    let type: 'number' | 'boolean' | 'string' = 'number';
    let defaultValue: number | boolean | string;
    
    if (rawValue === 'true' || rawValue === 'false') {
      type = 'boolean';
      defaultValue = rawValue === 'true';
    } else if (rawValue.startsWith('"') || rawValue.startsWith("'")) {
      type = 'string';
      defaultValue = rawValue.slice(1, -1);
    } else {
      type = 'number';
      defaultValue = parseInt(rawValue, 10);
    }
    
    // Generate display name from _PARAM_NAME_ -> "Param Name"
    const displayName = name
      .replace(/^_/, '')
      .replace(/_$/, '')
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    params.push({
      name,
      displayName,
      type,
      defaultValue,
    });
  }
  
  return params;
}

/**
 * Extract code from markdown code blocks
 */
function extractCodeBlocks(content: string): { 
  solutionCode: string; 
  parameterCode: string;
} {
  const codeBlockRegex = /```(?:js|javascript)\n([\s\S]*?)```/g;
  const blocks: string[] = [];
  
  let match;
  while ((match = codeBlockRegex.exec(content)) !== null) {
    blocks.push(match[1].trim());
  }
  
  // Convention: first block is parameters, second is solution
  // Or if only one block, it contains both
  if (blocks.length >= 2) {
    return {
      parameterCode: blocks[0],
      solutionCode: blocks[1],
    };
  } else if (blocks.length === 1) {
    return {
      parameterCode: blocks[0],
      solutionCode: blocks[0],
    };
  }
  
  return {
    parameterCode: '',
    solutionCode: '',
  };
}

/**
 * Parse raw markdown template into TemplateConfig
 */
export function parseTemplate(rawContent: string): TemplateConfig {
  // Parse YAML frontmatter
  const { data, content } = matter(rawContent);
  
  // Validate required fields
  const metadata: TemplateMetadata = {
    id: data.id || 'unknown',
    name: data.name || 'Untitled Template',
    category: data.category || 'sequential',
    concepts: data.concepts || [data.category || 'sequential'],
    difficulty: typeof data.difficulty === 'number' ? data.difficulty : 5,
    tags: Array.isArray(data.tags) ? data.tags : [],
    author: data.author || 'system',
    version: typeof data.version === 'number' ? data.version : 1,
    description: data.description,
  };
  
  // Extract code blocks
  const { solutionCode, parameterCode } = extractCodeBlocks(content);
  
  // Extract parameters from code
  const parameters = extractParameters(parameterCode || solutionCode);
  
  // Remove code blocks from description
  const descriptionMarkdown = content
    .replace(/```[\s\S]*?```/g, '')
    .replace(/##\s*Parameters[\s\S]*?(?=##|$)/i, '')
    .replace(/##\s*Solution Code[\s\S]*?(?=##|$)/i, '')
    .trim();
  
  return {
    metadata,
    parameters,
    solutionCode,
    descriptionMarkdown,
    rawContent,
  };
}

/**
 * Validate template config
 */
export function validateTemplate(template: TemplateConfig): { 
  valid: boolean; 
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!template.metadata.id) {
    errors.push('Template must have an id');
  }
  
  if (!template.metadata.name) {
    errors.push('Template must have a name');
  }
  
  if (!template.solutionCode) {
    errors.push('Template must have solution code');
  }
  
  if (template.metadata.difficulty < 1 || template.metadata.difficulty > 10) {
    errors.push('Difficulty must be between 1 and 10');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Apply parameter overrides to solution code
 */
export function applyParameters(
  solutionCode: string, 
  overrides: Record<string, number | boolean | string>
): string {
  let result = solutionCode;
  
  for (const [name, value] of Object.entries(overrides)) {
    const regex = new RegExp(
      `((?:var|const|let)\\s+${name}\\s*=\\s*)([^;]+)(;?)`,
      'g'
    );
    
    const replacement = typeof value === 'string' 
      ? `$1"${value}"$3` 
      : `$1${value}$3`;
    
    result = result.replace(regex, replacement);
  }
  
  return result;
}
