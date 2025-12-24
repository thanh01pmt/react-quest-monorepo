
import { Vector3, PathSegment } from '../../core/types';
import { vectorEquals, vectorToKey, vectorSub, vectorNormalize } from '../../core/GeometryUtils';

export class AreaBoundaryAnalyzer {
  
  public analyzeBoundary(areaBlocks: Vector3[]): PathSegment[] {
    if (areaBlocks.length < 3) return [];

    // 1. Dò chu vi khép kín
    const perimeter = this.tracePerimeter(areaBlocks);
    if (perimeter.length < 3) return [];

    // 2. Phân mảnh dựa trên sự thay đổi hướng vector (Raw Segments)
    const rawSegments = this.createRawSegments(perimeter);

    // 3. Gộp các đoạn nhỏ thành cạnh lớn (Smart Merge)
    // Xử lý bậc thang, zic-zac
    const mergedSegments = this.mergePatternedSegments(rawSegments);

    // 4. Đặt tên ngữ nghĩa (Labeling)
    this.labelSegments(mergedSegments, areaBlocks);

    return mergedSegments;
  }

  // --- BƯỚC 1: DÒ CHU VI (Giữ nguyên logic cũ tốt) ---
  private tracePerimeter(blocks: Vector3[]): Vector3[] {
    const blockSet = new Set(blocks.map(vectorToKey));
    // Sort để tìm điểm bắt đầu ổn định (Góc Trái-Dưới cùng)
    const startNode = [...blocks].sort((a,b) => (a.x - b.x) || (a.z - b.z))[0];
    
    const perimeter: Vector3[] = [];
    const dirs = [
      {x:0, z:1}, {x:1, z:1}, {x:1, z:0}, {x:1, z:-1}, 
      {x:0, z:-1}, {x:-1, z:-1}, {x:-1, z:0}, {x:-1, z:1}
    ]; // 8 hướng Clockwise

    let curr = startNode;
    let backtrackIdx = 6; // West start
    const MAX_STEPS = blocks.length * 3;
    let steps = 0;

    do {
      perimeter.push(curr);
      let foundNext = false;
      for (let i = 0; i < 8; i++) {
        const idx = (backtrackIdx + i) % 8;
        const d = dirs[idx];
        const neighbor = { x: curr.x + d.x, y: curr.y, z: curr.z + d.z };
        if (blockSet.has(vectorToKey(neighbor))) {
          curr = neighbor;
          backtrackIdx = (idx + 5) % 8; 
          foundNext = true;
          break;
        }
      }
      if (!foundNext) break;
      steps++;
    } while (!vectorEquals(curr, startNode) && steps < MAX_STEPS);

    return perimeter;
  }

  // --- BƯỚC 2: PHÂN MẢNH THÔ (Split at turns) ---
  private createRawSegments(perimeter: Vector3[]): PathSegment[] {
    const segments: PathSegment[] = [];
    if (perimeter.length < 2) return segments;

    // Use perimeter[0] as start
    let currentPoints: Vector3[] = [perimeter[0]];
    // Calculate initial direction
    let currentDir = vectorSub(perimeter[1], perimeter[0]); 

    // Loop through the perimeter
    for (let i = 1; i <= perimeter.length; i++) {
        const p1 = perimeter[i-1];
        const p2 = perimeter[i % perimeter.length]; // Wrap around to start if i == length
        
        const newDir = vectorSub(p2, p1);

        // If vector changes direction (turn detected)
        if (newDir.x !== currentDir.x || newDir.z !== currentDir.z) {
            // Finalize previous segment
            currentPoints.push(p1); // Include the corner point
            segments.push({
                id: `raw_${segments.length}`,
                points: currentPoints,
                direction: vectorNormalize(currentDir),
                length: currentPoints.length - 1, // Number of edges
                plane: 'xz'
            });

            // Start new segment
            currentPoints = [p1]; // New segment starts at the corner
            currentDir = newDir;
        } else {
            // Same direction, extend current segment
            currentPoints.push(p1);
        }
    }
    
    // Process the final segment closing the loop
    // Finalize the last segment
    const pFirst = perimeter[0];
    currentPoints.push(pFirst);
    segments.push({
        id: `raw_${segments.length}`,
        points: currentPoints,
        direction: vectorNormalize(currentDir),
        length: currentPoints.length - 1,
        plane: 'xz'
    });

    // Merge first and last segment if they have same direction
    // (This happens if the start point was in the middle of a straight edge)
    if (segments.length > 1) {
        const first = segments[0];
        const last = segments[segments.length - 1];
        if (vectorEquals(first.direction, last.direction)) {
            // Prepend last segment points to first segment
            // Last: [A...B], First: [B...C]
            // New First: [A...B...C] (B is shared)
            first.points = [...last.points.slice(0, -1), ...first.points];
            first.length += last.length;
            segments.pop(); // Remove last segment
        }
    }

    return segments;
  }

  // --- BƯỚC 3: GỘP THÔNG MINH (Staircase Merging) ---
  private mergePatternedSegments(raw: PathSegment[]): PathSegment[] {
    const merged: PathSegment[] = [];
    
    let i = 0;
    while (i < raw.length) {
        let patternFound = false;

        // Try to find pattern of length 2 segments (e.g. 1x, 1z, 1x, 1z...)
        // Need at least 2 pairs (4 segments) to confirm simple pattern
        if (i + 3 < raw.length) {
            const s1 = raw[i];
            const s2 = raw[i+1];
            const s3 = raw[i+2];
            const s4 = raw[i+3];

            // Merge Conditions:
            // 1. Segments are short (length <= 2) -> Staircase property
            // 2. Directions match periodically: s1//s3 and s2//s4
            const isShort = s1.length <= 2 && s2.length <= 2; 
            const isPattern = vectorEquals(s1.direction, s3.direction) && 
                              vectorEquals(s2.direction, s4.direction);

            if (isShort && isPattern) {
                // Collect pattern segments
                patternFound = true;
                const mergedPoints = [...s1.points]; // Start pattern
                
                let k = i + 1;
                let patternIdx = 1; // 0=s1, 1=s2 corresponding to pattern array
                
                while (k < raw.length) {
                    const expectedDir = (patternIdx % 2 === 0) ? s1.direction : s2.direction;
                    const currentSeg = raw[k];
                    
                    if (vectorEquals(currentSeg.direction, expectedDir) && currentSeg.length <= 2) {
                        // Merge points (skip first point as it is the end of prev seg)
                        mergedPoints.push(...currentSeg.points.slice(1));
                        k++;
                        patternIdx++;
                    } else {
                        break; // Pattern broken
                    }
                }

                // Create merged segment
                const startP = mergedPoints[0];
                const endP = mergedPoints[mergedPoints.length - 1];
                const trendDir = vectorNormalize(vectorSub(endP, startP));

                merged.push({
                    id: `staircase_merged_${merged.length}`,
                    points: mergedPoints,
                    direction: trendDir,
                    length: mergedPoints.length, // Total points count (approx block count)
                    plane: 'xz'
                });

                i = k; // Jump over merged segments
            }
        }

        if (!patternFound) {
            merged.push(raw[i]);
            i++;
        }
    }
    return merged;
  }

  // --- BƯỚC 4: LABELING (Đặt tên) ---
  private labelSegments(segments: PathSegment[], areaBlocks: Vector3[]) {
      if (areaBlocks.length === 0) return;

      // Find bounding box
      const xs = areaBlocks.map(b => b.x);
      const zs = areaBlocks.map(b => b.z);
      const minX = Math.min(...xs), maxX = Math.max(...xs);
      const minZ = Math.min(...zs), maxZ = Math.max(...zs);

      segments.forEach(seg => {
          if (seg.points.length === 0) return;
          
          // Calculate midpoint
          const midP = seg.points[Math.floor(seg.points.length/2)];
          
          let label = "edge";
          
          // Check if diagonal (zigzag trend)
          if (Math.abs(seg.direction.x) > 0.1 && Math.abs(seg.direction.z) > 0.1) {
              label = "zigzag_edge";
          } 
          // Check if base (bottom/top Z extreme)
          else if (Math.abs(midP.z - minZ) < 1 || Math.abs(midP.z - maxZ) < 1) {
              label = "base_edge"; 
          }
          // Check if side (left/right X extreme)
          else if (Math.abs(midP.x - minX) < 1 || Math.abs(midP.x - maxX) < 1) {
              label = "side_edge";
          }

          seg.id = `${label}_${seg.id}`;
      });
  }
}
