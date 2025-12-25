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

// Default shortcuts for Map Builder - matches actual implementation in App.tsx
export const defaultShortcuts = {
  // ============================================================
  // EDITING SHORTCUTS
  // ============================================================
  undo: { key: 'Z', ctrl: true, description: 'Undo', category: 'edit' as const },
  redo: { key: 'Z', ctrl: true, shift: true, description: 'Redo', category: 'edit' as const },
  redoAlt: { key: 'Y', ctrl: true, description: 'Redo (Alt)', category: 'edit' as const },
  copy: { key: 'C', ctrl: true, description: 'Copy selection', category: 'edit' as const },
  paste: { key: 'V', ctrl: true, description: 'Paste', category: 'edit' as const },
  duplicate: { key: 'D', ctrl: true, description: 'Duplicate selection', category: 'edit' as const },
  delete: { key: 'Delete', description: 'Delete selected', category: 'edit' as const },
  deleteAlt: { key: 'Backspace', description: 'Delete selected (Alt)', category: 'edit' as const },
  selectAll: { key: 'A', ctrl: true, description: 'Select all', category: 'edit' as const },
  deselect: { key: 'Escape', description: 'Deselect / Cancel modes', category: 'edit' as const },
  
  // ============================================================
  // VIEW SHORTCUTS
  // ============================================================
  zoomIn: { key: '+', ctrl: true, description: 'Zoom in', category: 'view' as const },
  zoomOut: { key: '-', ctrl: true, description: 'Zoom out', category: 'view' as const },
  showHelp: { key: '?', description: 'Show shortcuts panel', category: 'view' as const },
  
  // ============================================================
  // TOOL/MODE SHORTCUTS  
  // ============================================================
  smartSelect: { key: 'S', description: 'Smart Select mode', category: 'tools' as const },
  grab: { key: 'G', description: 'Grab/Move mode', category: 'tools' as const },
  rotate: { key: 'R', description: 'Rotate selection', category: 'tools' as const },
  fill: { key: 'F', description: 'Fill mode / Fill selection', category: 'tools' as const },
  
  // ============================================================
  // ASSET SHORTCUTS (Quick place items)
  // ============================================================
  placeCrystal: { key: '1', description: 'Place Crystal', category: 'tools' as const },
  placeSwitch: { key: '2', description: 'Place Switch', category: 'tools' as const },
  placeKey: { key: '3', description: 'Place Key', category: 'tools' as const },
  placePortal: { key: '4', description: 'Place Portal', category: 'tools' as const },
  placeStart: { key: '5', description: 'Place Player Start', category: 'tools' as const },
  placeFinish: { key: '6', description: 'Place Finish', category: 'tools' as const },
  
  // ============================================================
  // FILE SHORTCUTS
  // ============================================================
  save: { key: 'S', ctrl: true, description: 'Export JSON', category: 'file' as const },
  open: { key: 'O', ctrl: true, description: 'Import JSON', category: 'file' as const },
};

export type ShortcutKey = keyof typeof defaultShortcuts;
