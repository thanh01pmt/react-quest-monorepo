
// ============================================================================
// PATTERN ANALYZER (TIER 2)
// ============================================================================

import { 
  Tier1Result, Tier2Result, Pattern, PathRelation, PathSegment, Vector3 
} from '../../core/types';
import { vectorSub } from '../../core/GeometryUtils';

export class PatternAnalyzer {
  public analyze(tier1Result: Tier1Result): Tier2Result {
    const patterns = this.findPatterns(tier1Result);
    
    return {
      ...tier1Result,
      patterns
    };
  }

  private findPatterns(tier1: Tier1Result): Pattern[] {
    const patterns: Pattern[] = [];
    
    // 1. Staircase/Zigzag Detection
    // FIX: Only detect staircase for segments that are part of macro_staircase MetaPaths
    // or segments explicitly named as staircase/zigzag (from area internals)
    // This prevents false positives from diagonal wings or spiral sections
    
    // Collect segment IDs that belong to macro_staircase MetaPaths
    const staircaseSegmentIds = new Set<string>();
    if (tier1.metaPaths) {
      for (const mp of tier1.metaPaths) {
        if (mp.structureType === 'macro_staircase') {
          for (const seg of mp.segments) {
            staircaseSegmentIds.add(seg.id);
          }
        }
      }
    }
    
    let allSegmentsToAnalyze = [...tier1.segments];
    tier1.areas.forEach(a => {
        if (a.internalPaths) allSegmentsToAnalyze.push(...a.internalPaths);
    });

    for (const seg of allSegmentsToAnalyze) {
        // Only mark as staircase if:
        // 1. Segment belongs to a macro_staircase MetaPath, OR
        // 2. Segment ID contains 'staircase' or 'zigzag' (explicit naming from area internals)
        const isFromStaircaseMetaPath = staircaseSegmentIds.has(seg.id);
        const hasStaircaseName = seg.id.toLowerCase().includes('staircase') || 
                                  seg.id.toLowerCase().includes('zigzag');
        
        if (isFromStaircaseMetaPath || hasStaircaseName) {
            patterns.push({
                id: `pattern_staircase_${seg.id}`,
                type: 'repeat', 
                unitElements: [seg.id],
                repetitions: Math.max(1, seg.length - 1),  // FIX: repetitions = steps, not points
                transform: { translate: seg.direction }
            });
        }
    }

    // 2. Area Symmetry (Wings)
    for (const area of tier1.areas) {
      if (area.subStructures) {
        const leftWing = area.subStructures.find(s => s.id.includes('left_mass') || s.id.includes('left_wing'));
        const rightWing = area.subStructures.find(s => s.id.includes('right_mass') || s.id.includes('right_wing'));

        if (leftWing && rightWing) {
          patterns.push({
            id: `pattern_area_symmetry_${area.id}`,
            type: 'mirror',
            unitElements: [leftWing.id, rightWing.id], 
            repetitions: 2,
            transform: {
              mirrorPlane: 'xz' 
            }
          });
        }
      }
    }

    // Find repeat patterns from relations
    const symmetricPairs = tier1.relations.filter(r => r.type === 'axis_symmetric');
    if (symmetricPairs.length >= 2) {
      // Multiple symmetric pairs might form a repeating pattern
      patterns.push({
        id: `pattern_${patterns.length}`,
        type: 'mirror',
        unitElements: symmetricPairs.slice(0, 2).map(r => r.path1Id),
        repetitions: symmetricPairs.length,
        transform: {
          mirrorPlane: 'xz' // Simplified
        }
      });
    }

    // Find translation patterns (same-length parallel segments)
    const parallelGroups = this.groupParallelSegments(tier1);
    for (const [key, group] of parallelGroups) {
      if (group.length >= 3) {
        const translateVector = this.findTranslationVector(group, tier1.segments);
        if (translateVector) {
          patterns.push({
            id: `pattern_${patterns.length}`,
            type: 'repeat',
            unitElements: [group[0].path1Id],
            repetitions: group.length,
            transform: {
              translate: translateVector
            }
          });
        }
      }
    }

    return patterns;
  }

  private groupParallelSegments(tier1: Tier1Result): Map<string, PathRelation[]> {
    const groups = new Map<string, PathRelation[]>();
    
    for (const relation of tier1.relations) {
      if (relation.type === 'parallel_axis') {
        const key = `${relation.metadata.distance?.toFixed(1)}`;
        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key)!.push(relation);
      }
    }

    return groups;
  }

  private findTranslationVector(group: PathRelation[], segments: PathSegment[]): Vector3 | null {
    if (group.length < 2) return null;

    const seg1 = segments.find(s => s.id === group[0].path1Id);
    const seg2 = segments.find(s => s.id === group[0].path2Id);

    if (!seg1 || !seg2) return null;

    return vectorSub(seg2.points[0], seg1.points[0]);
  }
}
