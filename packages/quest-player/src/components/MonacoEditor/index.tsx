// src/components/MonacoEditor/index.tsx

import React from 'react';
import Editor from '@monaco-editor/react';
import { usePrefersColorScheme } from '../../hooks/usePrefersColorScheme';

interface MonacoEditorProps {
  initialCode: string;
  onChange: (value: string | undefined) => void;
  language?: string;
  readOnly?: boolean;
}

export const MonacoEditor: React.FC<MonacoEditorProps> = ({
  initialCode,
  onChange,
  language = 'javascript',
  readOnly = false
}) => {
  const colorScheme = usePrefersColorScheme();

  const editorOptions = {
    fontSize: 14,
    minimap: {
      enabled: false,
    },
    scrollBeyondLastLine: false,
    wordWrap: 'on' as const,
    readOnly: readOnly,
  };

  return (
    <Editor
      height="100%"
      width="100%"
      language={language}
      theme={colorScheme === 'dark' ? 'vs-dark' : 'light'}
      defaultValue={initialCode}
      value={initialCode} // Controlled component for updates
      onChange={onChange}
      options={editorOptions}
    // You can add an onMount handler to add custom language definitions (e.g., for Pond API)
    // onMount={handleEditorDidMount}
    />
  );
};