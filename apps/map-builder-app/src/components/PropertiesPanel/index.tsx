import { PlacedObject, BuildableAsset } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { RotateCw, FlipHorizontal, FlipVertical, Trash2, Copy, Palette, X } from 'lucide-react';
interface PropertiesPanelProps {
  selectedObjects: PlacedObject[]; // Nhận mảng các đối tượng
  onUpdateObject: (updatedObject: PlacedObject) => void;
  onClearSelection: () => void;
  onDeleteSelection: () => void; // THAY ĐỔI: Xóa cả vùng chọn
  onRotateSelection: () => void;
  onFlipSelection: (axis: 'x' | 'z') => void;
  onAddObject: (newObject: PlacedObject) => void;
  onCopyAsset: (id: string) => void; // Prop mới để sao chép asset
  // Thêm file css đã bị thiếu
  className?: string;
}

const renderPropertyInput = (key: string, value: any, onChange: (key: string, value: any) => void) => {
  // Custom editor for 'initialState'
  if (key === 'initialState') {
    return (
      <select value={value} onChange={(e) => onChange(key, e.target.value)}>
        <option value="on">On</option>
        <option value="off">Off</option>
      </select>
    );
  }
  // THÊM MỚI: Trình chỉnh sửa riêng cho thuộc tính 'direction'
  if (key === 'direction') {
    return (
      <select value={value} onChange={(e) => onChange(key, parseInt(e.target.value, 10))}>
        <option value="0">→ East (0°)</option>
        <option value="1">↑ North (90°)</option>
        <option value="2">← West (180°)</option>
        <option value="3">↓ South (270°)</option>
      </select>
    );
  }

  // Special inputs for FogZone properties
  if (key === 'scale' && typeof value === 'object') {
    return (
      <div style={{ display: 'flex', gap: '4px' }}>
        <input
          type="number"
          value={value.x}
          onChange={(e) => onChange(key, { ...value, x: parseFloat(e.target.value) })}
          placeholder="X"
          style={{ width: '33%' }}
        />
        <input
          type="number"
          value={value.y}
          onChange={(e) => onChange(key, { ...value, y: parseFloat(e.target.value) })}
          placeholder="Y"
          style={{ width: '33%' }}
        />
        <input
          type="number"
          value={value.z}
          onChange={(e) => onChange(key, { ...value, z: parseFloat(e.target.value) })}
          placeholder="Z"
          style={{ width: '33%' }}
        />
      </div>
    );
  }

  if (key === 'color') {
    return <input type="color" value={value} onChange={(e) => onChange(key, e.target.value)} style={{ width: '100%' }} />;
  }

  if (['density', 'opacity', 'noiseSpeed'].includes(key)) {
    return <input type="number" step="0.1" value={value} onChange={(e) => onChange(key, parseFloat(e.target.value))} />;
  }

  if (key === 'targetId' || key === 'type') {
    return <input type="text" value={value ?? 'N/A'} readOnly />;
  }

  // Generic text input for other properties
  return <input type="text" value={value} onChange={(e) => onChange(key, e.target.value)} />;
};

// --- COMPONENT MỚI: Giao diện khi chọn nhiều đối tượng ---
const MultipleSelectionPanel = ({
  count,
  onClear,
  onDelete,
  onRotate,
  onFlip,
}: {
  count: number;
  onClear: () => void;
  onDelete: () => void;
  onRotate: () => void;
  onFlip: (axis: 'x' | 'z') => void;
}) => (
  <>
    <div className="panel-header">
      <h2>Multiple Objects</h2>
      <button onClick={onClear} className="clear-btn"><X size={14} /></button>
    </div>
    <div className="prop-group info-group">
      <label>Selected</label>
      <span>{count} items</span>
    </div>
    <div className="selection-controls">
      <h3 className="props-title">Actions</h3>
      <div className="action-buttons multiple-actions" >
        <button onClick={onRotate} className="action-btn">
          <span className="icon"><RotateCw size={14} /></span>
          Rotate (R)
        </button>
        <button onClick={() => onFlip('x')} className="action-btn">
          <span className="icon"><FlipHorizontal size={14} /></span>
          Flip Horizontal
        </button>
        <button onClick={() => onFlip('z')} className="action-btn">
          <span className="icon"><FlipVertical size={14} /></span>
          Flip Vertical
        </button>
        <button onClick={onDelete} className="action-btn delete-btn">
          <span className="icon"><Trash2 size={14} /></span>
          Delete All
        </button>
      </div>
    </div>
  </>
);

export function PropertiesPanel({
  selectedObjects,
  onUpdateObject,
  onClearSelection,
  onDeleteSelection,
  onRotateSelection,
  onAddObject,
  onCopyAsset,
  onFlipSelection
}: PropertiesPanelProps) {
  const selectedObject = selectedObjects.length === 1 ? selectedObjects[0] : null;

  const handleDuplicate = () => {
    if (!selectedObject) return;
    // Tạo vị trí mới, ví dụ dịch sang 1 đơn vị trên trục X
    const newPosition: [number, number, number] = [
      selectedObject.position[0] + 1,
      selectedObject.position[1],
      selectedObject.position[2],
    ];

    const newObject: PlacedObject = {
      ...selectedObject,
      id: uuidv4(), // Tạo ID mới duy nhất
      position: newPosition,
    };
    onAddObject(newObject);
  };

  const handleCopyAsset = () => {
    if (!selectedObject) return;
    onCopyAsset(selectedObject.id);
  };
  const handlePropertyChange = (key: string, value: any) => {
    // Nếu không có đối tượng nào được chọn, không làm gì cả
    if (!selectedObject) return;

    const updatedObject = {
      ...selectedObject,
      properties: {
        ...selectedObject.properties,
        [key]: value,
      },
    };
    onUpdateObject(updatedObject);
  };

  return (
    <aside className="properties-panel"> {/* Giữ lại class này */}
      {/* ThemeSelector has been moved to CenterToolbar */}

      {/* --- LOGIC MỚI: Hiển thị panel phù hợp --- */}
      {selectedObjects.length > 1 ? (
        <MultipleSelectionPanel
          count={selectedObjects.length}
          onClear={onClearSelection}
          onDelete={onDeleteSelection}
          onRotate={onRotateSelection}
          onFlip={onFlipSelection}
        />
      ) : selectedObject ? (
        <>
          <div className="panel-header">
            <h2>Properties</h2>
            <button onClick={onClearSelection} className="clear-btn"><X size={14} /></button>
          </div>

          <div className="prop-group info-group">
            <label>Asset</label>
            <span>{selectedObject.asset.name}</span>
          </div>
          <div className="prop-group info-group">
            <label>ID</label>
            <span className="object-id">{selectedObject.id}</span>
          </div>

          <h3 className="props-title">Custom Properties</h3>
          {Object.entries(selectedObject.properties).map(([key, value]) => (
            <div key={key} className="prop-group">
              <label>{key}</label>
              {renderPropertyInput(key, value, handlePropertyChange)}
            </div>
          ))}

          <div className="selection-controls single-object-controls">
            <h3 className="props-title">Actions</h3>
            <div className="action-description">
              Click an asset in the palette to **replace** this object.
            </div>
            <div className="action-buttons" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <button onClick={handleCopyAsset} className="action-btn copy-btn">
                <span className="icon"><Copy size={14} /></span>
                Copy Asset
              </button>
              <button onClick={handleDuplicate} className="action-btn duplicate-btn">
                <span className="icon"><Palette size={14} /></span>
                Duplicate
              </button>
              <button onClick={onDeleteSelection} className="action-btn delete-btn">
                <span className="icon"><Trash2 size={14} /></span>
                Delete
              </button>
            </div>
          </div>
        </>
      ) : (
        <p style={{ textAlign: 'center', color: '#888', marginTop: '20px' }}>Select an object to see its properties.</p>
      )}
    </aside>
  );
}