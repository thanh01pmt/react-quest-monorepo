/**
 * Keyboard Shortcuts Hook
 * Provides global keyboard shortcuts for the Map Builder
 */

import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
  category: 'edit' | 'view' | 'tools' | 'file';
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

export function useKeyboardShortcuts({ shortcuts, enabled = true }: UseKeyboardShortcutsOptions) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;
    
    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    for (const shortcut of shortcuts) {
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !(event.ctrlKey || event.metaKey);
      const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
      const altMatch = shortcut.alt ? event.altKey : !event.altKey;

      if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
        event.preventDefault();
        event.stopPropagation();
        shortcut.action();
        return;
      }
    }
  }, [shortcuts, enabled]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return shortcuts;
}

// Default shortcuts for Map Builder
export const defaultShortcuts = {
  undo: { key: 'z', ctrl: true, description: 'Undo', category: 'edit' as const },
  redo: { key: 'z', ctrl: true, shift: true, description: 'Redo', category: 'edit' as const },
  redoAlt: { key: 'y', ctrl: true, description: 'Redo (Alt)', category: 'edit' as const },
  delete: { key: 'Delete', description: 'Delete selected', category: 'edit' as const },
  deleteAlt: { key: 'Backspace', description: 'Delete selected (Alt)', category: 'edit' as const },
  selectAll: { key: 'a', ctrl: true, description: 'Select all', category: 'edit' as const },
  deselect: { key: 'Escape', description: 'Deselect / Cancel', category: 'edit' as const },
  
  // View shortcuts
  zoomIn: { key: '+', ctrl: true, description: 'Zoom in', category: 'view' as const },
  zoomOut: { key: '-', ctrl: true, description: 'Zoom out', category: 'view' as const },
  resetView: { key: '0', ctrl: true, description: 'Reset view', category: 'view' as const },
  
  // Tool shortcuts
  pointer: { key: 'v', description: 'Pointer tool', category: 'tools' as const },
  brush: { key: 'b', description: 'Brush tool', category: 'tools' as const },
  eraser: { key: 'e', description: 'Eraser tool', category: 'tools' as const },
  fill: { key: 'g', description: 'Fill tool', category: 'tools' as const },
  
  // File shortcuts
  save: { key: 's', ctrl: true, description: 'Export JSON', category: 'file' as const },
  open: { key: 'o', ctrl: true, description: 'Import JSON', category: 'file' as const },
  
  // Special
  generateMap: { key: 'Enter', ctrl: true, description: 'Generate Map', category: 'tools' as const },
  validate: { key: 'Enter', shift: true, description: 'Validate Map', category: 'tools' as const },
  solve: { key: 'p', ctrl: true, description: 'Solve & Preview', category: 'tools' as const },
};

export type ShortcutKey = keyof typeof defaultShortcuts;
