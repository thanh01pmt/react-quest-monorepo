/**
 * PlacementTemplate - Template system for saving and applying placement patterns
 * 
 * Part of the Selectable Placement System
 */

import { 
  ElementSelector, 
  SelectableElement, 
  Coord,
  findElementsBySelector,
  getMirrorElement 
} from './SelectableElement';

// ============================================================================
// PLACEMENT RULE
// ============================================================================

export interface PlacementRuleOptions {
  symmetric?: boolean;       // Also place on mirror element
  skipFirst?: boolean;       // Skip start of segment
  skipLast?: boolean;        // Skip end of segment
}

export interface PlacementRule {
  selector: ElementSelector;
  itemType: 'crystal' | 'switch' | 'gem';
  options?: PlacementRuleOptions;
}

// ============================================================================
// PLACEMENT TEMPLATE
// ============================================================================

export interface PlacementTemplate {
  id: string;                    // UUID
  name: string;                  // User-friendly name
  description?: string;
  topologyType: string;          // 'v_shape', 'l_shape', etc.
  rules: PlacementRule[];
  createdAt: string;             // ISO timestamp
  updatedAt: string;
}

// ============================================================================
// ITEM PLACEMENT (output)
// ============================================================================

export interface TemplateItemPlacement {
  type: 'crystal' | 'switch' | 'gem' | 'goal';
  position: Coord;
  sourceRule?: string;           // Selector that created this
  isMirror?: boolean;            // Was this created from symmetric option
}

// ============================================================================
// TEMPLATE REGISTRY
// ============================================================================

const STORAGE_KEY = 'academic-placer-templates';

export class PlacementTemplateRegistry {
  private templates: Map<string, PlacementTemplate> = new Map();
  private loaded: boolean = false;

  /**
   * Load templates from storage
   */
  private load(): void {
    if (this.loaded) return;
    
    try {
      if (typeof localStorage !== 'undefined') {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
          const parsed = JSON.parse(data) as PlacementTemplate[];
          for (const template of parsed) {
            this.templates.set(template.id, template);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load templates from localStorage:', e);
    }
    
    this.loaded = true;
  }

  /**
   * Persist templates to storage
   */
  private persist(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const data = Array.from(this.templates.values());
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
    } catch (e) {
      console.warn('Failed to persist templates to localStorage:', e);
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `tmpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Save a new template
   */
  save(template: Omit<PlacementTemplate, 'id' | 'createdAt' | 'updatedAt'>): PlacementTemplate {
    this.load();
    
    const now = new Date().toISOString();
    const fullTemplate: PlacementTemplate = {
      ...template,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now
    };
    
    this.templates.set(fullTemplate.id, fullTemplate);
    this.persist();
    
    return fullTemplate;
  }

  /**
   * Update existing template
   */
  update(id: string, updates: Partial<Omit<PlacementTemplate, 'id' | 'createdAt'>>): PlacementTemplate | null {
    this.load();
    
    const existing = this.templates.get(id);
    if (!existing) return null;
    
    const updated: PlacementTemplate = {
      ...existing,
      ...updates,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString()
    };
    
    this.templates.set(id, updated);
    this.persist();
    
    return updated;
  }

  /**
   * Delete template
   */
  delete(id: string): boolean {
    this.load();
    
    const existed = this.templates.has(id);
    this.templates.delete(id);
    
    if (existed) {
      this.persist();
    }
    
    return existed;
  }

  /**
   * Get template by ID
   */
  get(id: string): PlacementTemplate | undefined {
    this.load();
    return this.templates.get(id);
  }

  /**
   * Find templates by topology type
   */
  findByTopology(topologyType: string): PlacementTemplate[] {
    this.load();
    return Array.from(this.templates.values())
      .filter(t => t.topologyType === topologyType);
  }

  /**
   * Get all templates
   */
  getAll(): PlacementTemplate[] {
    this.load();
    return Array.from(this.templates.values());
  }

  /**
   * Apply template to generate item placements
   */
  apply(
    templateId: string,
    selectableElements: SelectableElement[]
  ): TemplateItemPlacement[] {
    this.load();
    
    const template = this.templates.get(templateId);
    if (!template) {
      console.warn(`Template not found: ${templateId}`);
      return [];
    }
    
    return this.applyRules(template.rules, selectableElements);
  }

  /**
   * Apply rules directly (without saved template)
   */
  applyRules(
    rules: PlacementRule[],
    selectableElements: SelectableElement[]
  ): TemplateItemPlacement[] {
    const placements: TemplateItemPlacement[] = [];
    const placedPositions = new Set<string>();
    
    for (const rule of rules) {
      const elements = findElementsBySelector(selectableElements, rule.selector);
      
      for (const element of elements) {
        // Skip if no position
        if (!element.position) continue;
        
        const posKey = `${element.position[0]},${element.position[1]},${element.position[2]}`;
        
        // Skip if already placed
        if (placedPositions.has(posKey)) continue;
        
        placedPositions.add(posKey);
        placements.push({
          type: rule.itemType,
          position: element.position,
          sourceRule: JSON.stringify(rule.selector)
        });
        
        // Handle symmetric placement
        if (rule.options?.symmetric) {
          const mirror = getMirrorElement(selectableElements, element);
          if (mirror && mirror.position) {
            const mirrorKey = `${mirror.position[0]},${mirror.position[1]},${mirror.position[2]}`;
            
            if (!placedPositions.has(mirrorKey)) {
              placedPositions.add(mirrorKey);
              placements.push({
                type: rule.itemType,
                position: mirror.position,
                sourceRule: JSON.stringify(rule.selector),
                isMirror: true
              });
            }
          }
        }
      }
    }
    
    return placements;
  }

  /**
   * Create template from current selections
   */
  createFromSelections(
    name: string,
    topologyType: string,
    selections: Array<{ elementId: string; itemType: 'crystal' | 'switch' | 'gem'; symmetric?: boolean }>,
    selectableElements: SelectableElement[]
  ): PlacementTemplate {
    const rules: PlacementRule[] = [];
    
    for (const selection of selections) {
      const element = selectableElements.find(e => e.id === selection.elementId);
      if (!element) continue;
      
      // Create selector based on element type
      let selector: ElementSelector;
      
      if (element.type === 'keypoint') {
        const name = element.id.replace('keypoint:', '');
        selector = { type: 'keypoint', name };
      } else if (element.type === 'segment' && element.segmentName) {
        selector = { type: 'segment', name: element.segmentName };
      } else if (element.type === 'position' && element.segmentName && element.offset !== undefined) {
        selector = { type: 'position', segment: element.segmentName, offset: element.offset };
      } else {
        continue;
      }
      
      rules.push({
        selector,
        itemType: selection.itemType,
        options: selection.symmetric ? { symmetric: true } : undefined
      });
    }
    
    return this.save({
      name,
      topologyType,
      rules
    });
  }

  /**
   * Import templates from JSON
   */
  import(jsonData: string): number {
    try {
      const templates = JSON.parse(jsonData) as PlacementTemplate[];
      let count = 0;
      
      for (const template of templates) {
        // Generate new ID to avoid conflicts
        const newTemplate = this.save({
          name: template.name,
          description: template.description,
          topologyType: template.topologyType,
          rules: template.rules
        });
        if (newTemplate) count++;
      }
      
      return count;
    } catch (e) {
      console.error('Failed to import templates:', e);
      return 0;
    }
  }

  /**
   * Export templates to JSON
   */
  export(templateIds?: string[]): string {
    this.load();
    
    let templates: PlacementTemplate[];
    
    if (templateIds) {
      templates = templateIds
        .map(id => this.templates.get(id))
        .filter((t): t is PlacementTemplate => t !== undefined);
    } else {
      templates = Array.from(this.templates.values());
    }
    
    return JSON.stringify(templates, null, 2);
  }

  /**
   * Clear all templates
   */
  clear(): void {
    this.templates.clear();
    this.persist();
  }
}

// ============================================================================
// DEFAULT TEMPLATES
// ============================================================================

export const DEFAULT_TEMPLATES: Omit<PlacementTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'V-Shape Function Reuse',
    description: 'Switch at apex, crystals at intervals on both arms',
    topologyType: 'v_shape',
    rules: [
      { selector: { type: 'keypoint', name: 'apex' }, itemType: 'switch' },
      { selector: { type: 'interval', segment: 'seg_0', every: 2 }, itemType: 'crystal', options: { symmetric: true } }
    ]
  },
  {
    name: 'V-Shape Simple',
    description: 'Single crystal on each arm',
    topologyType: 'v_shape',
    rules: [
      { selector: { type: 'position', segment: 'seg_0', offset: 2 }, itemType: 'crystal', options: { symmetric: true } }
    ]
  },
  {
    name: 'Linear Interval',
    description: 'Crystals every 2 blocks',
    topologyType: 'simple_path',
    rules: [
      { selector: { type: 'interval', segment: 'seg_0', every: 2 }, itemType: 'crystal' }
    ]
  },
  {
    name: 'L-Shape Corner',
    description: 'Switch at corner, crystals on arms',
    topologyType: 'l_shape',
    rules: [
      { selector: { type: 'keypoint', name: 'corner' }, itemType: 'switch' },
      { selector: { type: 'interval', segment: 'seg_0', every: 2 }, itemType: 'crystal' },
      { selector: { type: 'interval', segment: 'seg_1', every: 2 }, itemType: 'crystal' }
    ]
  }
];

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let registryInstance: PlacementTemplateRegistry | null = null;

export function getTemplateRegistry(): PlacementTemplateRegistry {
  if (!registryInstance) {
    registryInstance = new PlacementTemplateRegistry();
  }
  return registryInstance;
}

/**
 * Initialize registry with default templates if empty
 */
export function initializeDefaultTemplates(): void {
  const registry = getTemplateRegistry();
  
  if (registry.getAll().length === 0) {
    for (const template of DEFAULT_TEMPLATES) {
      registry.save(template);
    }
    console.log(`Initialized ${DEFAULT_TEMPLATES.length} default templates`);
  }
}
