/**
 * FullEditorDialog Component
 * 
 * Full-screen Monaco editor dialog for editing template code.
 * Changes are synced in real-time with the parent TemplatePanel.
 */

import React, { useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { X, Maximize2 } from 'lucide-react';
import './FullEditorDialog.css';

interface FullEditorDialogProps {
    isOpen: boolean;
    onClose: () => void;
    code: string;
    onCodeChange: (code: string) => void;
    variables?: Array<{ name: string; displayName: string; value: number }>;
}

export function FullEditorDialog({
    isOpen,
    onClose,
    code,
    onCodeChange,
    variables = []
}: FullEditorDialogProps) {
    // Handle editor change
    const handleEditorChange = useCallback((value: string | undefined) => {
        if (value !== undefined) {
            onCodeChange(value);
        }
    }, [onCodeChange]);

    // Handle ESC key to close
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="full-editor-overlay"
            onClick={(e) => e.target === e.currentTarget && onClose()}
            onKeyDown={handleKeyDown}
        >
            <div className="full-editor-dialog">
                {/* Header */}
                <div className="full-editor-header">
                    <div className="full-editor-title">
                        <Maximize2 size={18} />
                        <span>Full Code Editor</span>
                    </div>
                    {variables.length > 0 && (
                        <div className="full-editor-variables">
                            <span className="full-editor-variables-label">Variables:</span>
                            {variables.map(v => (
                                <span key={v.name} className="full-editor-variable-badge">
                                    {`${v.name} = ${v.value}`}
                                </span>
                            ))}
                        </div>
                    )}
                    <button
                        className="full-editor-close"
                        onClick={onClose}
                        title="Close (ESC)"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Editor */}
                <div className="full-editor-body">
                    <Editor
                        height="100%"
                        defaultLanguage="javascript"
                        theme="vs-dark"
                        value={code}
                        onChange={handleEditorChange}
                        options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            lineNumbers: 'on',
                            scrollBeyondLastLine: false,
                            wordWrap: 'on',
                            automaticLayout: true,
                            tabSize: 2,
                            formatOnPaste: true,
                            formatOnType: true,
                            suggestOnTriggerCharacters: true,
                            quickSuggestions: true,
                            scrollbar: {
                                vertical: 'auto',
                                horizontal: 'auto'
                            }
                        }}
                    />
                </div>

                {/* Footer */}
                <div className="full-editor-footer">
                    <div className="full-editor-hint">
                        💡 Tip: Sử dụng <code>{`{{tên_biến:min-max:default}}`}</code> để tạo tham số có thể điều chỉnh
                    </div>
                    <button
                        className="full-editor-done-btn"
                        onClick={onClose}
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}

export default FullEditorDialog;
