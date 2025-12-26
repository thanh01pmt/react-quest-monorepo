/**
 * SelectableElement - Represents elements that can be selected for item placement
 * 
 * Part of the Selectable Placement System
 */

// ============================================================================
// TYPES
// ============================================================================

export type Coord = [number, number, number];

export type ElementType = 'keypoint' | 'segment' | 'position';

export type ElementCategory = 'critical' | 'important' | 'recommended' | 'optional' | 'avoid';

export interface ElementDisplay {
  name: string;           // User-friendly name: 'Apex', 'Left Arm [2]'
  icon: '●' | '─' | '○';  // Point, segment, position
  color: 'red' | 'blue' | 'green' | 'gray';  // Visual priority
  priority: number;       // 1-10, higher = more important
}

export interface ElementRelationships {
  mirrorOf?: string;      // ID of symmetric element
  partOf?: string;        // ID of parent segment (for positions)
}

export interface SelectableElement {
  id: string;                    // 'keypoint:apex', 'segment:left_arm', 'position:left_arm[2]'
  type: ElementType;
  category: ElementCategory;
  
  // Geometry
  position?: Coord;              // For keypoint/position types
  segment?: Coord[];             // For segment type
  segmentName?: string;          // Name of segment this belongs to
  offset?: number;               // Position offset within segment
  
  // Display info
  display: ElementDisplay;
  
  // Relationships
  relationships: ElementRelationships;
  
  // Selection state (for UI)
  selected?: boolean;
  assignedItemType?: 'crystal' | 'switch' | 'gem' | 'goal';
}

// ============================================================================
// ELEMENT SELECTORS
// ============================================================================

export type ElementSelector =
  | { type: 'keypoint'; name: string }
  | { type: 'segment'; name: string }
  | { type: 'position'; segment: string; offset: number }
  | { type: 'interval'; segment: string; every: number; skip?: number }
  | { type: 'relative'; segment: string; anchor: 'start' | 'end' | 'center'; offset: number }
  | { type: 'all'; segment: string };

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate unique element ID
 */
export function generateElementId(type: ElementType, name: string, offset?: number): string {
  if (type === 'position' && offset !== undefined) {
    return `position:${name}[${offset}]`;
  }
  return `${type}:${name}`;
}

/**
 * Parse element ID
 */
export function parseElementId(id: string): { type: ElementType; name: string; offset?: number } | null {
  const keypointMatch = id.match(/^keypoint:(.+)$/);
  if (keypointMatch) {
    return { type: 'keypoint', name: keypointMatch[1] };
  }
  
  const segmentMatch = id.match(/^segment:(.+)$/);
  if (segmentMatch) {
    return { type: 'segment', name: segmentMatch[1] };
  }
  
  const positionMatch = id.match(/^position:(.+)\[(\d+)\]$/);
  if (positionMatch) {
    return { type: 'position', name: positionMatch[1], offset: parseInt(positionMatch[2]) };
  }
  
  return null;
}

/**
 * Get display color based on category
 */
export function getCategoryColor(category: ElementCategory): ElementDisplay['color'] {
  switch (category) {
    case 'critical': return 'red';
    case 'important': return 'blue';
    case 'recommended': return 'green';
    case 'optional': return 'gray';
    case 'avoid': return 'red';
  }
}

/**
 * Get display icon based on element type
 */
export function getTypeIcon(type: ElementType): ElementDisplay['icon'] {
  switch (type) {
    case 'keypoint': return '●';
    case 'segment': return '─';
    case 'position': return '○';
  }
}

/**
 * Create a keypoint element
 */
export function createKeypointElement(
  name: string,
  position: Coord,
  category: ElementCategory = 'important',
  displayName?: string
): SelectableElement {
  return {
    id: generateElementId('keypoint', name),
    type: 'keypoint',
    category,
    position,
    display: {
      name: displayName || name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      icon: getTypeIcon('keypoint'),
      color: getCategoryColor(category),
      priority: category === 'critical' ? 10 : category === 'important' ? 8 : 5
    },
    relationships: {}
  };
}

/**
 * Create a segment element
 */
export function createSegmentElement(
  name: string,
  coords: Coord[],
  category: ElementCategory = 'recommended',
  displayName?: string
): SelectableElement {
  return {
    id: generateElementId('segment', name),
    type: 'segment',
    category,
    segment: coords,
    segmentName: name,
    display: {
      name: displayName || `${name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} (${coords.length} blocks)`,
      icon: getTypeIcon('segment'),
      color: getCategoryColor(category),
      priority: 6
    },
    relationships: {}
  };
}

/**
 * Create position elements along a segment
 */
export function createPositionElements(
  segmentName: string,
  coords: Coord[],
  options: {
    interval?: number;
    skipFirst?: boolean;
    skipLast?: boolean;
    mirrorSegment?: string;
  } = {}
): SelectableElement[] {
  const { interval = 1, skipFirst = true, skipLast = true, mirrorSegment } = options;
  const elements: SelectableElement[] = [];
  
  const startIdx = skipFirst ? 1 : 0;
  const endIdx = skipLast ? coords.length - 1 : coords.length;
  
  for (let i = startIdx; i < endIdx; i += interval) {
    const element: SelectableElement = {
      id: generateElementId('position', segmentName, i),
      type: 'position',
      category: 'optional',
      position: coords[i],
      segmentName,
      offset: i,
      display: {
        name: `${segmentName.replace(/_/g, ' ')} [${i}]`,
        icon: getTypeIcon('position'),
        color: getCategoryColor('optional'),
        priority: 4
      },
      relationships: {
        partOf: generateElementId('segment', segmentName)
      }
    };
    
    // Add mirror relationship if applicable
    if (mirrorSegment) {
      element.relationships.mirrorOf = generateElementId('position', mirrorSegment, i);
    }
    
    elements.push(element);
  }
  
  return elements;
}

/**
 * Find element by ID
 */
export function findElementById(elements: SelectableElement[], id: string): SelectableElement | undefined {
  return elements.find(e => e.id === id);
}

/**
 * Find elements by selector
 */
export function findElementsBySelector(
  elements: SelectableElement[],
  selector: ElementSelector
): SelectableElement[] {
  switch (selector.type) {
    case 'keypoint':
      return elements.filter(e => e.type === 'keypoint' && e.id === `keypoint:${selector.name}`);
      
    case 'segment':
      return elements.filter(e => e.type === 'segment' && e.segmentName === selector.name);
      
    case 'position':
      return elements.filter(e => 
        e.type === 'position' && 
        e.segmentName === selector.segment && 
        e.offset === selector.offset
      );
      
    case 'interval': {
      // Return both position elements (for exact offset matching) and segment elements
      // When segment elements are returned, their coords will be processed in applyRules
      const positionElements = elements.filter(e => 
        e.type === 'position' && 
        e.segmentName === selector.segment &&
        e.offset !== undefined &&
        (e.offset - (selector.skip || 0)) % selector.every === 0
      );
      
      // Also return segment elements that match the segment name
      // The interval logic will be applied in applyRules
      const segmentElements = elements.filter(e =>
        e.type === 'segment' && e.segmentName === selector.segment
      );
      
      // If no exact segment name match, try matching by index (seg_0 -> topo_seg_0)
      if (segmentElements.length === 0 && positionElements.length === 0) {
        const segmentIndex = selector.segment.match(/seg_(\d+)/)?.[1];
        if (segmentIndex !== undefined) {
          const fuzzyMatches = elements.filter(e =>
            e.type === 'segment' && 
            e.segmentName?.includes(`seg_${segmentIndex}`) ||
            e.segmentName?.includes(`seg ${segmentIndex}`)
          );
          return fuzzyMatches;
        }
      }
      
      return [...positionElements, ...segmentElements];
    }
    
    case 'relative':
      // TODO: Implement relative anchor resolution
      return [];
      
    case 'all':
      return elements.filter(e => e.segmentName === selector.segment);
      
    default:
      return [];
  }
}

/**
 * Get mirror element
 */
export function getMirrorElement(
  elements: SelectableElement[],
  element: SelectableElement
): SelectableElement | undefined {
  if (!element.relationships.mirrorOf) return undefined;
  return findElementById(elements, element.relationships.mirrorOf);
}
