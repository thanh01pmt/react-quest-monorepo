import React, { useState, useRef, useEffect } from 'react';
import './ViewControls.css';

type View = 'perspective' | 'top' | 'front' | 'side';

interface ViewControlsProps {
  onViewChange: (view: View) => void;
  boxDimensions: { width: number; height: number; depth: number };
  onDimensionsChange: (dims: { width: number; height: number; depth: number }) => void;
}

export function ViewControls({ onViewChange, boxDimensions, onDimensionsChange }: ViewControlsProps) {
  const [showResize, setShowResize] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowResize(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (key: 'width' | 'height' | 'depth', val: string) => {
    const num = parseInt(val) || 10;
    onDimensionsChange({
      ...boxDimensions,
      [key]: Math.max(1, Math.min(100, num)) // Clamp 1-100
    });
  };

  return (
    <div className="view-controls-wrapper" style={{ position: 'absolute', right: '16px', top: '16px', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>

      {/* View Buttons Stack */}
      <div className="view-controls">
        <button onClick={() => onViewChange('perspective')} title="Perspective View">P</button>
        <button onClick={() => onViewChange('top')} title="Top View (Y)">T</button>
        <button onClick={() => onViewChange('front')} title="Front View (Z)">F</button>
        <button onClick={() => onViewChange('side')} title="Side View (X)">S</button>
      </div>

      {/* Resize Button */}
      <div style={{ position: 'relative' }}>
        <button
          ref={buttonRef}
          className="view-control-btn" // Reuse style class if exists or define inline/css
          onClick={() => setShowResize(!showResize)}
          title="Map Dimensions"
          style={{
            width: '40px', height: '40px',
            background: showResize ? '#6366f1' : 'rgba(42, 42, 46, 0.9)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '6px',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px'
          }}
        >
          📏
        </button>

        {/* Resize Popover */}
        {showResize && (
          <div
            ref={popoverRef}
            style={{
              position: 'absolute',
              top: '0',
              right: '40px', // To the left of the button
              background: 'rgba(30, 30, 36, 0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              padding: '12px',
              width: '140px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}
          >
            <h4 style={{ margin: 0, fontSize: '11px', color: '#888', textTransform: 'uppercase' }}>Build Area</h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', alignItems: 'center' }}>
              <label style={{ fontSize: '11px', color: '#ccc' }}>Width</label>
              <input
                type="number"
                value={boxDimensions.width}
                onChange={(e) => handleChange('width', e.target.value)}
                style={{ width: '100%', background: '#222', border: '1px solid #444', color: '#fff', fontSize: '11px', padding: '2px 4px', borderRadius: '4px' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', alignItems: 'center' }}>
              <label style={{ fontSize: '11px', color: '#ccc' }}>Height</label>
              <input
                type="number"
                value={boxDimensions.height}
                onChange={(e) => handleChange('height', e.target.value)}
                style={{ width: '100%', background: '#222', border: '1px solid #444', color: '#fff', fontSize: '11px', padding: '2px 4px', borderRadius: '4px' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', alignItems: 'center' }}>
              <label style={{ fontSize: '11px', color: '#ccc' }}>Depth</label>
              <input
                type="number"
                value={boxDimensions.depth}
                onChange={(e) => handleChange('depth', e.target.value)}
                style={{ width: '100%', background: '#222', border: '1px solid #444', color: '#fff', fontSize: '11px', padding: '2px 4px', borderRadius: '4px' }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}