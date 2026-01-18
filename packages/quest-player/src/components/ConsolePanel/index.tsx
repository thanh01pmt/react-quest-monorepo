import React, { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './ConsolePanel.css';

export interface ConsoleLog {
    type: 'log' | 'warn' | 'error' | 'info';
    message: string;
    timestamp: number;
}

interface ConsolePanelProps {
    logs: ConsoleLog[];
    onClear: () => void;
    className?: string;
}

export const ConsolePanel: React.FC<ConsolePanelProps> = ({
    logs,
    onClear,
    className
}) => {
    const { t } = useTranslation();
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when logs change
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div className={`console-panel ${className || ''}`}>
            <div className="console-header">
                <span className="console-title">{t('UI.Console', 'Console')}</span>
                <div className="console-actions">
                    <button
                        className="console-action-btn"
                        onClick={onClear}
                        title={t('UI.ClearConsole', 'Clear Console')}
                    >
                        🚫
                    </button>
                </div>
            </div>
            <div className="console-content" ref={scrollRef}>
                {logs.length === 0 ? (
                    <div className="console-empty">{t('UI.ConsoleEmpty', 'No output')}</div>
                ) : (
                    logs.map((log, index) => (
                        <div key={`${log.timestamp}-${index}`} className={`console-line ${log.type}`}>
                            <span className="console-timestamp">
                                [{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
                            </span>
                            <span className="console-message">{log.message}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
