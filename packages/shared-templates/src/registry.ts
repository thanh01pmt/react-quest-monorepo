/**
 * Template Registry
 * 
 * Central registry for loading and querying templates.
 * Supports bundled templates and remote override.
 */

import type { 
  TemplateConfig, 
  TemplateMetadata,
  DifficultyLevel,
  ConceptCategory,
  AcademicConcept
} from './types';
import { parseTemplate } from './parser';
import { BUNDLED_TEMPLATES } from './bundled-templates';

// ============================================================================
// BUNDLED TEMPLATES (imported statically)
// ============================================================================

// These will be populated by the template files
const bundledTemplates: Map<string, TemplateConfig> = new Map();

// ============================================================================
// TEMPLATE REGISTRY
// ============================================================================

export class TemplateRegistry {
  private templates: Map<string, TemplateConfig> = new Map();
  private initialized = false;

  /**
   * Initialize registry with bundled templates
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    // Load bundled templates
    // 1. Load from generated BUNDLED_TEMPLATES (primary source)
    for (const template of BUNDLED_TEMPLATES) {
      this.templates.set(template.metadata.id, template);
    }
    
    // 2. Load from manual registration (fallback/testing)
    for (const [id, template] of bundledTemplates) {
      this.templates.set(id, template);
    }
    
    this.initialized = true;
    console.log(`[TemplateRegistry] Initialized with ${this.templates.size} templates`);
  }

  /**
   * Register a template from raw markdown
   */
  registerFromMarkdown(rawContent: string): TemplateConfig {
    const template = parseTemplate(rawContent);
    this.templates.set(template.metadata.id, template);
    return template;
  }

  /**
   * Register a pre-parsed template
   */
  register(template: TemplateConfig): void {
    this.templates.set(template.metadata.id, template);
  }

  /**
   * Override templates from remote source
   * Templates with higher version replace local ones
   */
  overrideFromRemote(remoteTemplates: TemplateConfig[]): void {
    for (const remote of remoteTemplates) {
      const local = this.templates.get(remote.metadata.id);
      
      if (!local || remote.metadata.version > local.metadata.version) {
        this.templates.set(remote.metadata.id, remote);
        console.log(`[TemplateRegistry] Override: ${remote.metadata.id} v${remote.metadata.version}`);
      }
    }
  }

  /**
   * Get template by ID
   */
  get(id: string): TemplateConfig | undefined {
    return this.templates.get(id);
  }

  /**
   * Get all templates
   */
  getAll(): TemplateConfig[] {
    return Array.from(this.templates.values());
  }

  /**
   * Query templates by category
   */
  getByCategory(category: ConceptCategory): TemplateConfig[] {
    return this.getAll().filter(t => t.metadata.category === category);
  }

  /**
   * Query templates by concept
   */
  getByConcept(concept: AcademicConcept): TemplateConfig[] {
    return this.getAll().filter(t => t.metadata.concepts.includes(concept));
  }

  /**
   * Query templates by difficulty range
   */
  getByDifficultyRange(min: number, max: number): TemplateConfig[] {
    return this.getAll().filter(t => 
      t.metadata.difficulty >= min && t.metadata.difficulty <= max
    );
  }

  /**
   * Query templates by difficulty level
   */
  getByDifficultyLevel(level: DifficultyLevel): TemplateConfig[] {
    const ranges: Record<DifficultyLevel, [number, number]> = {
      very_easy: [1, 2],
      easy: [3, 4],
      medium: [5, 6],
      hard: [7, 8],
      very_hard: [9, 10],
    };
    const [min, max] = ranges[level];
    return this.getByDifficultyRange(min, max);
  }

  /**
   * Query templates matching multiple criteria
   */
  query(options: {
    category?: ConceptCategory;
    concepts?: AcademicConcept[];
    difficultyLevel?: DifficultyLevel;
    difficultyRange?: [number, number];
    tags?: string[];
  }): TemplateConfig[] {
    let results = this.getAll();

    if (options.category) {
      results = results.filter(t => t.metadata.category === options.category);
    }

    if (options.concepts && options.concepts.length > 0) {
      results = results.filter(t => 
        options.concepts!.some(c => t.metadata.concepts.includes(c))
      );
    }

    if (options.difficultyLevel) {
      const ranges: Record<DifficultyLevel, [number, number]> = {
        very_easy: [1, 2],
        easy: [3, 4],
        medium: [5, 6],
        hard: [7, 8],
        very_hard: [9, 10],
      };
      const [min, max] = ranges[options.difficultyLevel];
      results = results.filter(t => 
        t.metadata.difficulty >= min && t.metadata.difficulty <= max
      );
    }

    if (options.difficultyRange) {
      const [min, max] = options.difficultyRange;
      results = results.filter(t => 
        t.metadata.difficulty >= min && t.metadata.difficulty <= max
      );
    }

    if (options.tags && options.tags.length > 0) {
      results = results.filter(t => 
        options.tags!.some(tag => t.metadata.tags.includes(tag))
      );
    }

    return results;
  }

  /**
   * Get template count
   */
  get count(): number {
    return this.templates.size;
  }

  /**
   * Get all categories that have templates
   */
  getAvailableCategories(): ConceptCategory[] {
    const categories = new Set<ConceptCategory>();
    for (const template of this.templates.values()) {
      categories.add(template.metadata.category);
    }
    return Array.from(categories);
  }

  /**
   * Get metadata only (for listing)
   */
  listMetadata(): TemplateMetadata[] {
    return this.getAll().map(t => t.metadata);
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const templateRegistry = new TemplateRegistry();

/**
 * Register a bundled template (called at module load time)
 */
export function registerBundledTemplate(rawContent: string): void {
  const template = parseTemplate(rawContent);
  bundledTemplates.set(template.metadata.id, template);
}
