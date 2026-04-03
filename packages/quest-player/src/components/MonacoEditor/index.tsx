// src/components/MonacoEditor/index.tsx

import React, { useRef } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import { usePrefersColorScheme } from '../../hooks/usePrefersColorScheme';

interface MonacoEditorProps {
  initialCode: string;
  onChange: (value: string | undefined) => void;
  language?: string;
  readOnly?: boolean;
  theme?: 'light' | 'dark';
}

export const MonacoEditor: React.FC<MonacoEditorProps> = ({
  initialCode,
  onChange,
  language = 'javascript',
  readOnly = false,
  theme
}) => {
  const systemColorScheme = usePrefersColorScheme();
  const effectiveTheme = theme || systemColorScheme;
  const editorRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const editorOptions = {
    fontSize: 14,
    minimap: {
      enabled: false,
    },
    scrollBeyondLastLine: false,
    wordWrap: 'on' as const,
    readOnly: readOnly,
    // Disable Monaco's default drop-as-snippet behavior
    dropIntoEditor: {
      enabled: false,
    },
  };

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Get the editor's container DOM element
    const editorDomNode = editor.getDomNode();
    if (editorDomNode) {
      // Prevent default drop and handle manually
      editorDomNode.addEventListener('drop', (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const droppedText = e.dataTransfer?.getData('text/plain');
        if (droppedText && editorRef.current) {
          // Get drop position in editor coordinates
          const target = editor.getTargetAtClientPoint(e.clientX, e.clientY);
          if (target?.position) {
            // Insert text at drop position (plain text, not snippet)
            editor.executeEdits('drop', [{
              range: new monaco.Range(
                target.position.lineNumber,
                target.position.column,
                target.position.lineNumber,
                target.position.column
              ),
              text: droppedText,
              forceMoveMarkers: true,
            }]);
            // Move cursor to end of inserted text
            const newPosition = editor.getModel()?.getPositionAt(
              editor.getModel()!.getOffsetAt(target.position) + droppedText.length
            );
            if (newPosition) {
              editor.setPosition(newPosition);
            }
            editor.focus();
          }
        }
      });

      // Prevent default dragover to allow drop
      editorDomNode.addEventListener('dragover', (e: DragEvent) => {
        e.preventDefault();
      });
    }
  };

  return (
    <div ref={containerRef} style={{ height: '100%', width: '100%' }}>
      <Editor
        height="100%"
        width="100%"
        language={language}
        theme={effectiveTheme === 'dark' ? 'vs-dark' : 'light'}
        defaultValue={initialCode}
        value={initialCode}
        onChange={onChange}
        options={editorOptions}
        onMount={handleEditorMount}
      />
    </div>
  );
};