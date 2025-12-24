
// ============================================================================
// SEGMENT FILTER (TIER 3)
// ============================================================================

import { Tier2Result, Tier3Result, PathSegment } from '../../core/types';

export class SegmentFilter {
  constructor(private minLength: number = 2) {}

  public analyze(tier2Result: Tier2Result): Tier3Result {
    const patternSegmentIds = new Set(
      tier2Result.patterns.flatMap(p => p.unitElements)
    );

    const filteredSegments: PathSegment[] = [];
    const keptShortSegments: PathSegment[] = [];
    const normalSegments: PathSegment[] = [];

    for (const segment of tier2Result.segments) {
      if (segment.length < this.minLength) {
        if (patternSegmentIds.has(segment.id)) {
          keptShortSegments.push(segment);
        } else {
          filteredSegments.push(segment);
        }
      } else {
        normalSegments.push(segment);
      }
    }

    // Merge adjacent segments if possible
    const mergedSegments = this.mergeAdjacentSegments([...normalSegments, ...keptShortSegments]);

    return {
      ...tier2Result,
      filteredSegments,
      mergedSegments,
      keptShortSegments
    };
  }

  private mergeAdjacentSegments(segments: PathSegment[]): PathSegment[] {
    // Simplified: just return as-is for now
    // TODO: Implement actual merging logic
    return segments;
  }
}
