import React, { useState } from 'react';
import type { TestCaseResult } from '../../types';
import './TestCasePanel.css';

interface TestCasePanelProps {
    testResults: TestCaseResult[];
    theme?: 'light' | 'dark';
}

export const TestCasePanel: React.FC<TestCasePanelProps> = ({ testResults, theme = 'dark' }) => {
    const [activeTab, setActiveTab] = useState(0);

    if (!testResults || testResults.length === 0) {
        return (
            <div className={`test-case-panel theme-${theme}`}>
                <div className="test-case-header">
                    <span className="test-case-title">Test Cases</span>
                </div>
                <div className="test-case-empty">No test cases defined.</div>
            </div>
        );
    }

    const activeResult = testResults[activeTab] || testResults[0];

    return (
        <div className={`test-case-panel theme-${theme}`}>
            <div className="test-case-header">
                <span className="test-case-title">Test Cases</span>
            </div>

            <div className="test-case-tabs">
                {testResults.map((result, index) => (
                    <button
                        key={index}
                        className={`test-case-tab ${activeTab === index ? 'active' : ''} ${result.status}`}
                        onClick={() => setActiveTab(index)}
                    >
                        <span className="status-icon">
                            {result.status === 'pass' && '✓'}
                            {result.status === 'fail' && '✗'}
                            {result.status === 'error' && '!'}
                            {result.status === 'pending' && '○'}
                        </span>
                        {result.isHidden ? `Case ${index + 1} (Hidden)` : `Case ${index + 1}`}
                    </button>
                ))}
            </div>

            <div className="test-case-content">
                {activeResult ? (
                    <div className="test-case-details">
                        <div className="detail-section">
                            <span className="detail-label">Status</span>
                            <span className={`detail-value status-${activeResult.status}`}>
                                {activeResult.status.toUpperCase()}
                            </span>
                        </div>

                        {activeResult.error && (
                            <div className="detail-section error-msg">
                                <span className="detail-label">Error</span>
                                <pre className="detail-code">{activeResult.error}</pre>
                            </div>
                        )}

                        {!activeResult.isHidden && (
                            <>
                                <div className="detail-section">
                                    <span className="detail-label">Input</span>
                                    <pre className="detail-code">{activeResult.input || '(empty)'}</pre>
                                </div>

                                <div className="detail-grid">
                                    <div className="detail-section">
                                        <span className="detail-label">Expected Output</span>
                                        <pre className="detail-code">{activeResult.expectedOutput || '(empty)'}</pre>
                                    </div>

                                    <div className="detail-section">
                                        <span className="detail-label">Actual Output</span>
                                        <pre className="detail-code">{activeResult.actualOutput || '(empty)'}</pre>
                                    </div>
                                </div>
                            </>
                        )}

                        {activeResult.isHidden && activeResult.status !== 'pending' && (
                            <div className="hidden-case-msg">
                                Input and expected output are hidden for this test case.
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="test-case-empty">Select a test case to see details.</div>
                )}
            </div>
        </div>
    );
};
