/**
 * ValidationBadge Component
 * 
 * Compact badge showing validation status with click-to-expand details.
 * Positioned in the scene corner for always-visible feedback.
 */

import React, { useState } from 'react';
import { ValidationReport } from '../../../../../packages/map-generator/validation';
import { ValidationReportComponent } from '../ValidationReport';
import './ValidationBadge.css';

interface ValidationBadgeProps {
    /** Current validation status */
    status: 'valid' | 'warning' | 'invalid' | 'unknown';
    /** Status message */
    message: string;
    /** Full validation report */
    report: ValidationReport | null;
    /** Whether validation is in progress */
    isValidating?: boolean;
    /** Manual validation trigger */
    onValidate?: () => void;
    /** Position variant */
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export function ValidationBadge({
    status,
    message,
    report,
    isValidating = false,
    onValidate,
    position = 'top-right',
}: ValidationBadgeProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const getStatusIcon = () => {
        if (isValidating) return '⏳';
        switch (status) {
            case 'valid': return '✅';
            case 'warning': return '⚠️';
            case 'invalid': return '❌';
            default: return '🔍';
        }
    };

    const getStatusLabel = () => {
        if (isValidating) return 'Validating...';
        switch (status) {
            case 'valid': return 'Valid';
            case 'warning': return 'Issues';
            case 'invalid': return 'Invalid';
            default: return 'Unknown';
        }
    };

    return (
        <div className={`validation-badge-container ${position}`}>
            {/* Badge */}
            <div
                className={`validation-badge ${status} ${isValidating ? 'validating' : ''}`}
                onClick={() => setIsExpanded(!isExpanded)}
                title={message}
            >
                <span className="badge-icon">{getStatusIcon()}</span>
                <span className="badge-label">{getStatusLabel()}</span>
                {onValidate && (
                    <button
                        className="refresh-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            onValidate();
                        }}
                        title="Re-validate"
                    >
                        🔄
                    </button>
                )}
                <span className="expand-hint">{isExpanded ? '▲' : '▼'}</span>
            </div>

            {/* Expanded Report */}
            {isExpanded && report && (
                <div className="badge-report-wrapper">
                    <ValidationReportComponent
                        report={report}
                        onClose={() => setIsExpanded(false)}
                    />
                </div>
            )}

            {/* Expanded placeholder when no report */}
            {isExpanded && !report && (
                <div className="badge-no-report">
                    <p>No validation data available.</p>
                    {onValidate && (
                        <button onClick={onValidate} className="validate-now-btn">
                            Validate Now
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export default ValidationBadge;
