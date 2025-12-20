/**
 * Tooltip Component
 * Simple, reusable tooltip with keyboard shortcut display
 */

import React, { useState, useRef, useEffect } from 'react';
import './Tooltip.css';

interface TooltipProps {
    content: string;
    shortcut?: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
    delay?: number;
    children: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({
    content,
    shortcut,
    position = 'top',
    delay = 500,
    children
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState({ x: 0, y: 0 });
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const triggerRef = useRef<HTMLDivElement>(null);

    const showTooltip = () => {
        timeoutRef.current = setTimeout(() => {
            if (triggerRef.current) {
                const rect = triggerRef.current.getBoundingClientRect();
                setCoords(calculatePosition(rect, position));
                setIsVisible(true);
            }
        }, delay);
    };

    const hideTooltip = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        setIsVisible(false);
    };

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const calculatePosition = (rect: DOMRect, pos: string) => {
        const offset = 8;
        switch (pos) {
            case 'top':
                return { x: rect.left + rect.width / 2, y: rect.top - offset };
            case 'bottom':
                return { x: rect.left + rect.width / 2, y: rect.bottom + offset };
            case 'left':
                return { x: rect.left - offset, y: rect.top + rect.height / 2 };
            case 'right':
                return { x: rect.right + offset, y: rect.top + rect.height / 2 };
            default:
                return { x: rect.left + rect.width / 2, y: rect.top - offset };
        }
    };

    const formatShortcut = (shortcut: string) => {
        return shortcut
            .replace('ctrl+', '⌘')
            .replace('shift+', '⇧')
            .replace('alt+', '⌥')
            .toUpperCase();
    };

    return (
        <div
            ref={triggerRef}
            className="tooltip-trigger"
            onMouseEnter={showTooltip}
            onMouseLeave={hideTooltip}
            onFocus={showTooltip}
            onBlur={hideTooltip}
        >
            {children}
            {isVisible && (
                <div
                    className={`tooltip tooltip-${position}`}
                    style={{
                        left: coords.x,
                        top: coords.y,
                    }}
                >
                    <span className="tooltip-content">{content}</span>
                    {shortcut && (
                        <span className="tooltip-shortcut">{formatShortcut(shortcut)}</span>
                    )}
                </div>
            )}
        </div>
    );
};

export default Tooltip;
