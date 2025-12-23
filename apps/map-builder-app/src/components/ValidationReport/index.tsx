/**
 * ValidationReport Component
 * Displays 3-tier validation results with visual indicators
 */

import React from 'react';
import { ValidationReport as ValidationReportType, TierValidationResult } from '../../../../../packages/map-generator/validation';
import './ValidationReport.css';

interface ValidationReportProps {
    report: ValidationReportType | null;
    onClose?: () => void;
}

const TierSection: React.FC<{ tier: TierValidationResult; title: string }> = ({ tier, title }) => {
    return (
        <div className={`tier-section ${tier.passed ? 'passed' : 'failed'}`}>
            <div className="tier-header">
                <span className="tier-icon">{tier.passed ? '✅' : '❌'}</span>
                <span className="tier-title">{title}</span>
            </div>
            <div className="tier-checks">
                {tier.checks.map((check, idx) => (
                    <div key={idx} className={`check-item ${check.passed ? 'pass' : 'fail'}`}>
                        <span className="check-icon">{check.passed ? '✓' : '✗'}</span>
                        <span className="check-name">{check.name}</span>
                        <span className="check-message">{check.message}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const ValidationReportComponent: React.FC<ValidationReportProps> = ({ report, onClose }) => {
    if (!report) {
        return null;
    }

    return (
        <div className="validation-report">
            <div className="validation-header">
                <h3>🔍 Validation Report</h3>
                {onClose && (
                    <button className="close-btn" onClick={onClose}>×</button>
                )}
            </div>

            <div className={`validation-summary ${report.isValid ? 'valid' : 'invalid'}`}>
                {report.summary}
            </div>

            <TierSection
                tier={report.tier1}
                title="Tier 1: Basic Structure"
            />
            <TierSection
                tier={report.tier2}
                title="Tier 2: Logic Compliance"
            />
            <TierSection
                tier={report.tier3}
                title="Tier 3: Pedagogy Quality"
            />

            {report.suggestions.length > 0 && (
                <div className="suggestions">
                    <h4>💡 Suggestions</h4>
                    <ul>
                        {report.suggestions.map((s, idx) => (
                            <li key={idx}>{s}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};
