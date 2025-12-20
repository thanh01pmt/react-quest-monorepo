/**
 * HelpButton Component
 * Floating button to show keyboard shortcuts panel
 */

import React, { useState, useEffect } from 'react';
import { KeyboardShortcutsPanel } from '../KeyboardShortcutsPanel';
import './HelpButton.css';

export const HelpButton: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't trigger when typing in inputs
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
                return;
            }

            if (e.key === '?' || (e.shiftKey && e.key === '/')) {
                e.preventDefault();
                setIsOpen(prev => !prev);
            } else if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    return (
        <>
            <button
                className="help-button"
                onClick={() => setIsOpen(true)}
                title="Keyboard Shortcuts (?)"
                aria-label="Show keyboard shortcuts"
            >
                <span className="help-icon">?</span>
            </button>

            <KeyboardShortcutsPanel
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
            />
        </>
    );
};

export default HelpButton;
