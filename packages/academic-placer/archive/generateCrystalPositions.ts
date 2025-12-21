// Interface giữ nguyên như trước

function generateCrystalPositions(input: InputData): { [key: string]: { x: number; y: number; z: number }[] } {
    const segments = input.tier1.segments;
    const relations = input.tier1.relations;
    const areas = input.tier1.areas[0]; // Giả sử chỉ 1 area
    const endpoints = input.tier4.suggestedPlacements?.flatMap(p => p.positions) || [];

    // Tìm main segment (dài nhất, giả sử seg_0 là main dựa trên length max)
    const mainSeg = segments.reduce((max, s) => s.length > max.length ? s : max, segments[0]);
    const mainPoints = mainSeg.points;

    // Tìm branches: segments perpendicular hoặc parallel với main
    const branches = segments.filter(s => s.id !== mainSeg.id);
    const perpBranches = branches.filter(b => relations.some(r => r.type === 'perpendicular' && 
        ((r.path1Id === mainSeg.id && r.path2Id === b.id) || (r.path1Id === b.id && r.path2Id === mainSeg.id))));
    const paraBranches = branches.filter(b => relations.some(r => r.type === 'parallel_axis' && 
        ((r.path1Id === mainSeg.id && r.path2Id === b.id) || (r.path1Id === b.id && r.path2Id === mainSeg.id))));
    const symBranches = branches.filter(b => relations.some(r => (r.type === 'axis_symmetric' || r.type === 'point_symmetric') && 
        r.path1Id === b.id || r.path2Id === b.id));

    // Tìm center từ relations symmetric (nếu có) hoặc area center
    const symCenter = relations.find(r => r.type === 'point_symmetric')?.metadata.center || areas.center;

    const levels: { [key: string]: { x: number; y: number; z: number }[] } = {};

    // Màn 1: Đường thẳng cơ bản (main, cách 2 đơn vị từ min)
    const minCoord = Math.min(...mainPoints.map(p => p[mainSeg.plane.includes('z') ? 'z' : 'x'])); // Tùy direction
    levels['level1'] = mainPoints.filter(p => {
        const coord = p[mainSeg.plane.includes('z') ? 'z' : 'x'];
        return (coord - minCoord) % 2 === 0;
    });

    // Màn 2: Tương tự
    levels['level2'] = levels['level1'];

    // Màn 3: Nhánh ngắn đơn lẻ (perp branch đầu tiên)
    levels['level3'] = perpBranches[0]?.points || [];

    // Màn 4: Nhánh đối xứng (sym branches)
    levels['level4'] = symBranches.flatMap(b => b.points);

    // Màn 5: Nhánh dọc song song (para branches + phần main sau max của para)
    const maxParaCoord = paraBranches.length ? Math.max(...paraBranches.flatMap(b => b.points.map(p => p[mainSeg.plane.includes('z') ? 'z' : 'x']))) : 0;
    levels['level5'] = [...paraBranches.flatMap(b => b.points), ...mainPoints.filter(p => {
        const coord = p[mainSeg.plane.includes('z') ? 'z' : 'x'];
        return coord >= maxParaCoord;
    })];

    // Màn 6: Kết hợp vuông góc (perp + para branches)
    levels['level6'] = [...perpBranches.flatMap(b => b.points), ...paraBranches.flatMap(b => b.points)];

    // Màn 7: Toàn bộ endpoints
    levels['level7'] = endpoints;

    // Màn 8: Tương tự
    levels['level8'] = levels['level7'];

    // Màn 9: Biến tấu đối xứng (sym branches + mirror points dựa trên center)
    const mirrorPoints: { x: number; y: number; z: number }[] = [];
    symBranches.forEach(b => {
        b.points.forEach(p => {
            const mirrorX = 2 * symCenter.x - p.x; // Mirror qua center (giả sử symmetry qua x)
            const mirrorZ = p.z; // Giữ z nếu symmetry point
            mirrorPoints.push({ x: mirrorX, y: p.y, z: mirrorZ });
        });
    });
    levels['level9'] = [...symBranches.flatMap(b => b.points), ...paraBranches.flatMap(b => b.points), ...mirrorPoints];

    // Màn 10: Toàn bộ blocks
    levels['level10'] = areas.blocks;

    return levels;
}