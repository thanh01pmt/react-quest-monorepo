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
        // Get positions from element
        let positions: Coord[] = [];
        
        if (element.type === 'segment' && element.segment && element.segment.length > 0) {
          // For segments: apply interval-based placement
          const skipFirst = rule.options?.skipFirst ?? true;
          const skipLast = rule.options?.skipLast ?? true;
          const startIdx = skipFirst ? 1 : 0;
          const endIdx = skipLast ? element.segment.length - 1 : element.segment.length;
          
          // For interval selectors, use the specified interval
          if (rule.selector.type === 'interval' && 'every' in rule.selector) {
            const skip = (rule.selector as any).skip || 0;
            for (let i = startIdx; i < endIdx; i++) {
              if ((i - skip) % rule.selector.every === 0) {
                positions.push(element.segment[i]);
              }
            }
          } else if (rule.selector.type === 'all') {
            // All positions in segment
            for (let i = startIdx; i < endIdx; i++) {
              positions.push(element.segment[i]);
            }
          } else {
            // Default: single item at center
            const centerIdx = Math.floor(element.segment.length / 2);
            if (centerIdx >= 0 && centerIdx < element.segment.length) {
              positions.push(element.segment[centerIdx]);
            }
          }
        } else if (element.position) {
          // For keypoints and positions: use the single position
          positions.push(element.position);
        }
        
        // Create placements for each position
        for (const pos of positions) {
          const posKey = `${pos[0]},${pos[1]},${pos[2]}`;
          
          // Skip if already placed
          if (placedPositions.has(posKey)) continue;
          
          placedPositions.add(posKey);
          placements.push({
            type: rule.itemType,
            position: pos,
            sourceRule: JSON.stringify(rule.selector)
          });
        }
        
        // Handle symmetric placement
        if (rule.options?.symmetric) {
          const mirror = getMirrorElement(selectableElements, element);
          if (mirror) {
            let mirrorPositions: Coord[] = [];
            
            if (mirror.type === 'segment' && mirror.segment) {
              const skipFirst = rule.options?.skipFirst ?? true;
              const skipLast = rule.options?.skipLast ?? true;
              const startIdx = skipFirst ? 1 : 0;
              const endIdx = skipLast ? mirror.segment.length - 1 : mirror.segment.length;
              
              if (rule.selector.type === 'interval' && 'every' in rule.selector) {
                const skip = (rule.selector as any).skip || 0;
                for (let i = startIdx; i < endIdx; i++) {
                  if ((i - skip) % rule.selector.every === 0) {
                    mirrorPositions.push(mirror.segment[i]);
                  }
                }
              } else {
                const centerIdx = Math.floor(mirror.segment.length / 2);
                if (centerIdx >= 0 && centerIdx < mirror.segment.length) {
                  mirrorPositions.push(mirror.segment[centerIdx]);
                }
              }
            } else if (mirror.position) {
              mirrorPositions.push(mirror.position);
            }
            
            for (const mPos of mirrorPositions) {
              const mirrorKey = `${mPos[0]},${mPos[1]},${mPos[2]}`;
              
              if (!placedPositions.has(mirrorKey)) {
                placedPositions.add(mirrorKey);
                placements.push({
                  type: rule.itemType,
                  position: mPos,
                  sourceRule: JSON.stringify(rule.selector),
                  isMirror: true
                });
              }
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
// SEGMENT PATTERN TYPES
// ============================================================================

/**
 * Pattern notation:
 * - C = Crystal
 * - S = Switch
 * - - = Empty block
 * - | = Separator for repeating units
 * 
 * Examples:
 * - "C" = Single crystal
 * - "C-C" = Two crystals with 1 gap
 * - "C--C" = Two crystals with 2 gaps
 * - "CSC" = Crystal, Switch, Crystal (adjacent)
 * - "C-S-C" = Crystal, gap, Switch, gap, Crystal
 */
export interface SegmentPattern {
  id: string;
  name: string;
  description: string;
  pattern: ('C' | 'S' | '-')[];  // The pattern to apply
  minSegmentLength: number;       // Minimum segment length to apply this pattern
  repeatMode: 'single' | 'fill' | 'edges';  // How to apply on segment
  skipEnds?: boolean;             // Skip first/last block of segment
}

// Universal segment patterns that work for any topology
export const SEGMENT_PATTERNS: SegmentPattern[] = [
  // === SINGLE ITEMS ===
  {
    id: 'single_crystal',
    name: '1 × Crystal',
    description: 'Single crystal at center of segment',
    pattern: ['C'],
    minSegmentLength: 3,
    repeatMode: 'single',
    skipEnds: true
  },
  {
    id: 'single_switch',
    name: '1 × Switch',
    description: 'Single switch at center of segment',
    pattern: ['S'],
    minSegmentLength: 3,
    repeatMode: 'single',
    skipEnds: true
  },

  // === PAIRS (ADJACENT) ===
  {
    id: 'pair_cc',
    name: '1 × (C-C)',
    description: 'Pair of adjacent crystals at center',
    pattern: ['C', 'C'],
    minSegmentLength: 4,
    repeatMode: 'single',
    skipEnds: true
  },
  {
    id: 'pair_cs',
    name: '1 × (C-S)',
    description: 'Crystal followed by switch at center',
    pattern: ['C', 'S'],
    minSegmentLength: 4,
    repeatMode: 'single',
    skipEnds: true
  },

  // === PAIRS (SPACED) ===
  {
    id: 'spaced_c_c',
    name: '1 × (C_C)',
    description: 'Two crystals with 1 block gap',
    pattern: ['C', '-', 'C'],
    minSegmentLength: 5,
    repeatMode: 'single',
    skipEnds: true
  },
  {
    id: 'spaced_c__c',
    name: '1 × (C__C)',
    description: 'Two crystals with 2 block gaps',
    pattern: ['C', '-', '-', 'C'],
    minSegmentLength: 6,
    repeatMode: 'single',
    skipEnds: true
  },

  // === TRIPLETS ===
  {
    id: 'triple_csc',
    name: '1 × (CSC)',
    description: 'Crystal-Switch-Crystal triplet',
    pattern: ['C', 'S', 'C'],
    minSegmentLength: 5,
    repeatMode: 'single',
    skipEnds: true
  },
  {
    id: 'triple_scs',
    name: '1 × (SCS)',
    description: 'Switch-Crystal-Switch triplet',
    pattern: ['S', 'C', 'S'],
    minSegmentLength: 5,
    repeatMode: 'single',
    skipEnds: true
  },
  {
    id: 'triple_c_s_c',
    name: '1 × (C_S_C)',
    description: 'Crystal, gap, Switch, gap, Crystal',
    pattern: ['C', '-', 'S', '-', 'C'],
    minSegmentLength: 7,
    repeatMode: 'single',
    skipEnds: true
  },

  // === FILL PATTERNS ===
  {
    id: 'fill_crystals',
    name: 'Fill Crystals',
    description: 'Fill segment with crystals (skip ends)',
    pattern: ['C'],
    minSegmentLength: 3,
    repeatMode: 'fill',
    skipEnds: true
  },
  {
    id: 'fill_alternating',
    name: 'Fill Alternating C-S',
    description: 'Alternating crystals and switches',
    pattern: ['C', 'S'],
    minSegmentLength: 4,
    repeatMode: 'fill',
    skipEnds: true
  },
  {
    id: 'fill_spaced',
    name: 'Fill Spaced (C_C_...)',
    description: 'Crystals with 1 block gaps',
    pattern: ['C', '-'],
    minSegmentLength: 4,
    repeatMode: 'fill',
    skipEnds: true
  },

  // === EDGE PATTERNS ===
  {
    id: 'edges_crystals',
    name: 'Edge Crystals',
    description: 'Crystal at start and end of segment',
    pattern: ['C'],
    minSegmentLength: 4,
    repeatMode: 'edges',
    skipEnds: false  // We want the edges!
  },
  {
    id: 'edges_switches',
    name: 'Edge Switches',
    description: 'Switch at start and end of segment',
    pattern: ['S'],
    minSegmentLength: 4,
    repeatMode: 'edges',
    skipEnds: false
  }
];

/**
 * Apply a segment pattern to generate item positions
 */
export function applySegmentPattern(
  pattern: SegmentPattern,
  segmentCoords: Coord[]
): TemplateItemPlacement[] {
  if (segmentCoords.length < pattern.minSegmentLength) {
    return [];
  }

  const placements: TemplateItemPlacement[] = [];
  const startIdx = pattern.skipEnds ? 1 : 0;
  const endIdx = pattern.skipEnds ? segmentCoords.length - 1 : segmentCoords.length;
  const usableLength = endIdx - startIdx;

  if (usableLength <= 0) return [];

  switch (pattern.repeatMode) {
    case 'single': {
      // Center the pattern on the segment
      const patternLen = pattern.pattern.length;
      const centerOffset = Math.floor((usableLength - patternLen) / 2);
      const patternStart = startIdx + Math.max(0, centerOffset);

      for (let i = 0; i < pattern.pattern.length; i++) {
        const coordIdx = patternStart + i;
        if (coordIdx >= endIdx) break;
        
        const item = pattern.pattern[i];
        if (item === 'C' || item === 'S') {
          placements.push({
            type: item === 'C' ? 'crystal' : 'switch',
            position: segmentCoords[coordIdx]
          });
        }
      }
      break;
    }

    case 'fill': {
      // Repeat pattern to fill the segment
      let patternIdx = 0;
      for (let i = startIdx; i < endIdx; i++) {
        const item = pattern.pattern[patternIdx % pattern.pattern.length];
        if (item === 'C' || item === 'S') {
          placements.push({
            type: item === 'C' ? 'crystal' : 'switch',
            position: segmentCoords[i]
          });
        }
        patternIdx++;
      }
      break;
    }

    case 'edges': {
      // Place at start and end only
      const item = pattern.pattern[0];
      if (item === 'C' || item === 'S') {
        // Start edge
        placements.push({
          type: item === 'C' ? 'crystal' : 'switch',
          position: segmentCoords[startIdx]
        });
        // End edge (if different position)
        if (endIdx - 1 > startIdx) {
          placements.push({
            type: item === 'C' ? 'crystal' : 'switch',
            position: segmentCoords[endIdx - 1]
          });
        }
      }
      break;
    }
  }

  return placements;
}

/**
 * Get patterns that can be applied to a segment of given length
 */
export function getApplicablePatterns(segmentLength: number): SegmentPattern[] {
  return SEGMENT_PATTERNS.filter(p => segmentLength >= p.minSegmentLength);
}

// ============================================================================
// DEFAULT TEMPLATES (Legacy - for specific topologies)
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
  },
  // Universal templates for any topology
  {
    name: 'Universal: Crystal Trail',
    description: 'Fill segments with crystals every 2 blocks',
    topologyType: '*',  // Universal
    rules: [
      { selector: { type: 'interval', segment: 'seg_0', every: 2 }, itemType: 'crystal' },
      { selector: { type: 'interval', segment: 'seg_1', every: 2 }, itemType: 'crystal' },
      { selector: { type: 'interval', segment: 'seg_2', every: 2 }, itemType: 'crystal' },
      { selector: { type: 'interval', segment: 'seg_3', every: 2 }, itemType: 'crystal' }
    ]
  },
  {
    name: 'Universal: Switch Corners',
    description: 'Switches at segment ends/corners',
    topologyType: '*',
    rules: [
      { selector: { type: 'keypoint', name: 'center' }, itemType: 'switch' },
      { selector: { type: 'keypoint', name: 'corner' }, itemType: 'switch' },
      { selector: { type: 'keypoint', name: 'apex' }, itemType: 'switch' }
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
