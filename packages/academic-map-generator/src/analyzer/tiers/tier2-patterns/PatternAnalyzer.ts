
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
    
    // 1. Internal Staircase/Zigzag Detection in Areas
    // Analyze both Main Segments and Area Internal Paths
    let allSegmentsToAnalyze = [...tier1.segments];
    tier1.areas.forEach(a => {
        if (a.internalPaths) allSegmentsToAnalyze.push(...a.internalPaths);
    });

    for (const seg of allSegmentsToAnalyze) {
        // If diagonal direction (e.g. x=1, z=1)
        if (Math.abs(seg.direction.x) > 0 && Math.abs(seg.direction.z) > 0) {
            patterns.push({
                id: `pattern_staircase_${seg.id}`,
                type: 'repeat', 
                unitElements: [seg.id],
                repetitions: seg.length,
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
