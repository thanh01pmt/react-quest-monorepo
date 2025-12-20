import React, { useMemo } from 'react';
import { PlacedObject } from '../../types';

interface MapInspectorProps {
    placedObjects: PlacedObject[];
    pathInfo?: any;
    solutionPath?: any;
}

export const MapInspector: React.FC<MapInspectorProps> = ({ placedObjects, pathInfo, solutionPath }) => {
    const stats = useMemo(() => {
        const items = placedObjects.filter(o => o.asset.type === 'collectible' || o.asset.type === 'interactible');

        let pathLength = 0;
        if (solutionPath && Array.isArray(solutionPath)) {
            pathLength = solutionPath.length;
        } else if (pathInfo?.path_coords) {
            pathLength = pathInfo.path_coords.length;
        }

        // Simple Complexity Score: Path Length * 0.1 + Items * 0.5
        const complexity = Math.round((pathLength * 0.1) + (items.length * 0.5));

        return {
            itemCount: items.length,
            pathLength: pathLength,
            complexity
        };
    }, [placedObjects, pathInfo, solutionPath]);

    return (
        <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '20px', // Bottom Left of the Canvas
            background: 'rgba(30, 30, 30, 0.9)',
            color: '#eee',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '13px',
            zIndex: 900, // Below Modals but above Canvas
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
            pointerEvents: 'none',
            minWidth: '160px',
            border: '1px solid #444'
        }}>
            <h4 style={{ margin: '0 0 8px 0', borderBottom: '1px solid #555', paddingBottom: '4px', color: '#fff' }}>Map Inspector</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Path Steps:</span>
                <strong style={{ color: '#4caf50' }}>{stats.pathLength}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Items:</span>
                <strong style={{ color: '#2196f3' }}>{stats.itemCount}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Complexity:</span>
                <strong style={{ color: '#ff9800' }}>{stats.complexity}</strong>
            </div>
        </div>
    );
}
