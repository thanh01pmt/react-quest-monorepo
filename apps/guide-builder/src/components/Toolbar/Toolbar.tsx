import React from 'react';
import './Toolbar.css';

interface ToolbarProps {
    onInsertText: (text: string) => void;
    onInsertImage: () => void;
    onInsertVideo: () => void;
    onInsertCode: () => void;
    onInsertBlockly: () => void;
    onInsertQuiz: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
    onInsertText,
    onInsertImage,
    onInsertVideo,
    onInsertCode,
    onInsertBlockly,
    onInsertQuiz
}) => {
    return (
        <div className="toolbar">
            <div className="toolbar-group">
                <button onClick={() => onInsertText('**Bold**')} title="Bold"><strong>B</strong></button>
                <button onClick={() => onInsertText('*Italic*')} title="Italic"><em>I</em></button>
                <button onClick={() => onInsertText('# Heading 1')} title="Heading 1">H1</button>
                <button onClick={() => onInsertText('## Heading 2')} title="Heading 2">H2</button>
            </div>

            <div className="toolbar-separator" />

            <div className="toolbar-group">
                <button onClick={onInsertCode} title="Insert Code Block">
                    {/* Simple Code Icon */}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="16 18 22 12 16 6"></polyline>
                        <polyline points="8 6 2 12 8 18"></polyline>
                    </svg>
                </button>
                <button onClick={onInsertImage} title="Insert Image">
                    {/* Image Icon */}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                </button>
                <button onClick={onInsertVideo} title="Insert Video">
                    {/* Video Icon */}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="23 7 16 12 23 17 23 7"></polygon>
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                    </svg>
                </button>
            </div>

            <div className="toolbar-separator" />

            <div className="toolbar-group">
                <button onClick={onInsertBlockly} className="btn-primary-ghost" title="Insert Blockly Workspace">
                    🧩 Blockly
                </button>
                <button onClick={onInsertQuiz} className="btn-primary-ghost" title="Insert Quiz">
                    ❓ Quiz
                </button>
            </div>
        </div>
    );
};
