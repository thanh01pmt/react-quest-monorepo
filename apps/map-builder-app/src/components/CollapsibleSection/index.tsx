/**
 * CollapsibleSection Component
 * 
 * Reusable collapsible section wrapper with:
 * - Animated expand/collapse
 * - localStorage persistence
 * - Customizable styling
 * - Controlled/Uncontrolled mode support
 */

import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import './CollapsibleSection.css';

interface CollapsibleSectionProps {
    /** Section title */
    title: string;
    /** Optional icon to display before title */
    icon?: ReactNode;
    /** Unique key for localStorage persistence */
    storageKey?: string;
    /** Initial collapsed state (default: false = expanded) */
    defaultCollapsed?: boolean;
    /** Controlled collapsed state */
    isCollapsed?: boolean;
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
    isCollapsed: controlledCollapsed,
    children,
    badge,
    className = '',
    onToggle,
}: CollapsibleSectionProps) {
    // Internal state for uncontrolled mode
    const [internalCollapsed, setInternalCollapsed] = useState(() => {
        if (storageKey) {
            const stored = localStorage.getItem(`collapsible-${storageKey}`);
            if (stored !== null) {
                return stored === 'true';
            }
        }
        return defaultCollapsed;
    });

    // Check if component is controlled
    const isControlled = controlledCollapsed !== undefined;
    const isCollapsed = isControlled ? controlledCollapsed : internalCollapsed;

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
        if (!isControlled) {
            setInternalCollapsed(newState);
        }
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
                    <ChevronDown size={14} />
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
