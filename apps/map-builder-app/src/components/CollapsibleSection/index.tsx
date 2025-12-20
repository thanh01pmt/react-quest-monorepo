/**
 * CollapsibleSection Component
 * 
 * Reusable collapsible section wrapper with:
 * - Animated expand/collapse
 * - localStorage persistence
 * - Customizable styling
 */

import React, { useState, useEffect, useRef, ReactNode } from 'react';
import './CollapsibleSection.css';

interface CollapsibleSectionProps {
    /** Section title */
    title: string;
    /** Optional icon to display before title */
    icon?: string;
    /** Unique key for localStorage persistence */
    storageKey?: string;
    /** Initial collapsed state (default: false = expanded) */
    defaultCollapsed?: boolean;
    /** Children content */
    children: ReactNode;
    /** Optional subtitle/badge */
    badge?: ReactNode;
    /** Optional className for the section */
    className?: string;
    /** Callback when expanded/collapsed */
    onToggle?: (isCollapsed: boolean) => void;
}

export function CollapsibleSection({
    title,
    icon,
    storageKey,
    defaultCollapsed = false,
    children,
    badge,
    className = '',
    onToggle,
}: CollapsibleSectionProps) {
    // Initialize state from localStorage if available
    const [isCollapsed, setIsCollapsed] = useState(() => {
        if (storageKey) {
            const stored = localStorage.getItem(`collapsible-${storageKey}`);
            if (stored !== null) {
                return stored === 'true';
            }
        }
        return defaultCollapsed;
    });

    const contentRef = useRef<HTMLDivElement>(null);
    const [contentHeight, setContentHeight] = useState<number | undefined>(undefined);

    // Update content height for animation
    useEffect(() => {
        if (contentRef.current) {
            setContentHeight(contentRef.current.scrollHeight);
        }
    }, [children]);

    // Persist to localStorage
    useEffect(() => {
        if (storageKey) {
            localStorage.setItem(`collapsible-${storageKey}`, String(isCollapsed));
        }
    }, [isCollapsed, storageKey]);

    const handleToggle = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        onToggle?.(newState);
    };

    return (
        <div className={`collapsible-section ${className} ${isCollapsed ? 'collapsed' : 'expanded'}`}>
            <button
                className="collapsible-header"
                onClick={handleToggle}
                aria-expanded={!isCollapsed}
            >
                <div className="header-content">
                    {icon && <span className="header-icon">{icon}</span>}
                    <span className="header-title">{title}</span>
                    {badge && <span className="header-badge">{badge}</span>}
                </div>
                <span className={`toggle-icon ${isCollapsed ? 'collapsed' : ''}`}>
                    ▼
                </span>
            </button>

            <div
                className="collapsible-content"
                ref={contentRef}
                style={{
                    maxHeight: isCollapsed ? 0 : contentHeight,
                    opacity: isCollapsed ? 0 : 1,
                }}
            >
                <div className="content-inner">
                    {children}
                </div>
            </div>
        </div>
    );
}

export default CollapsibleSection;
