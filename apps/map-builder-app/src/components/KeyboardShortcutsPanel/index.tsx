/**
 * KeyboardShortcutsPanel Component
 * Displays available keyboard shortcuts in a floating panel
 */

import React, { useState } from 'react';
import { defaultShortcuts } from '../../hooks/useKeyboardShortcuts';
import './KeyboardShortcutsPanel.css';

interface KeyboardShortcutsPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export const KeyboardShortcutsPanel: React.FC<KeyboardShortcutsPanelProps> = ({
    isOpen,
    onClose
}) => {
    if (!isOpen) return null;

    const formatKey = (key: string, ctrl?: boolean, shift?: boolean, alt?: boolean) => {
        const parts: string[] = [];
        if (ctrl) parts.push('⌘');
        if (shift) parts.push('⇧');
        if (alt) parts.push('⌥');
        parts.push(key.length === 1 ? key.toUpperCase() : key);
        return parts.join('');
    };

    const categories = {
        edit: { label: 'Editing', icon: '✏️' },
        view: { label: 'View', icon: '👁️' },
        tools: { label: 'Tools', icon: '🛠️' },
        file: { label: 'File', icon: '📁' },
    };

    const groupedShortcuts = Object.entries(defaultShortcuts).reduce((acc, [shortcutName, shortcut]) => {
        const category = shortcut.category;
        if (!acc[category]) acc[category] = [];
        acc[category].push({ shortcutName, ...shortcut });
        return acc;
    }, {} as Record<string, (typeof defaultShortcuts[keyof typeof defaultShortcuts] & { shortcutName: string })[]>);

    return (
        <div className="keyboard-shortcuts-overlay" onClick={onClose}>
            <div className="keyboard-shortcuts-panel" onClick={e => e.stopPropagation()}>
                <div className="ks-header">
                    <h2>⌨️ Keyboard Shortcuts</h2>
                    <button className="ks-close" onClick={onClose}>✕</button>
                </div>

                <div className="ks-content">
                    {Object.entries(categories).map(([categoryKey, categoryInfo]) => {
                        const shortcuts = groupedShortcuts[categoryKey];
                        if (!shortcuts || shortcuts.length === 0) return null;

                        return (
                            <div key={categoryKey} className="ks-category">
                                <h3>{categoryInfo.icon} {categoryInfo.label}</h3>
                                <div className="ks-list">
                                    {shortcuts.map((shortcut: any) => (
                                        <div key={shortcut.shortcutName} className="ks-item">
                                            <span className="ks-description">{shortcut.description}</span>
                                            <span className="ks-keys">
                                                {formatKey(shortcut.key, shortcut.ctrl, shortcut.shift, shortcut.alt)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="ks-footer">
                    <span>Press <kbd>?</kbd> to toggle this panel</span>
                </div>
            </div>
        </div>
    );
};

export default KeyboardShortcutsPanel;
