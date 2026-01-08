import React from 'react';
import { AVAILABLE_MAPS } from '../../data/maps';

interface MapSelectorProps {
    selectedMapId: string;
    onSelectMap: (mapId: string) => void;
}

export const MapSelector: React.FC<MapSelectorProps> = ({ selectedMapId, onSelectMap }) => {
    return (
        <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={{ fontWeight: 600, fontSize: '14px', color: '#24292e' }}>Target Map:</label>
            <select
                value={selectedMapId}
                onChange={(e) => onSelectMap(e.target.value)}
                style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid #e1e4e8',
                    fontSize: '14px',
                    flex: 1,
                    maxWidth: '400px'
                }}
            >
                <option value="">-- No Map Linked --</option>
                {AVAILABLE_MAPS.map(map => (
                    <option key={map.id} value={map.id}>
                        {map.name} ({map.id})
                    </option>
                ))}
            </select>
        </div>
    );
};
