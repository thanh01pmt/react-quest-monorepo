// src/components/QuestPlayer/hooks/useEditorManager.ts

import { useState, useEffect, type RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import * as Blockly from 'blockly/core';
import { javascriptGenerator } from 'blockly/javascript';
import type { Quest, EditorType } from '../../../types';
import { stripBlockIds } from '../utils';



export const useEditorManager = (
  questData: Quest | null,
  workspaceRef: RefObject<Blockly.WorkspaceSvg>,
  generateSafeCode: (workspace: Blockly.WorkspaceSvg | null) => string // Thêm prop mới
) => {
  const { t } = useTranslation();
  const [currentEditor, setCurrentEditor] = useState<EditorType>('blockly');
  const [aceCode, setAceCode] = useState<string>('');

  useEffect(() => {
    if (questData) {
      const initialEditor = questData.supportedEditors?.[0] || 'blockly';
      setCurrentEditor(initialEditor);
      if (initialEditor === 'monaco' && questData.monacoConfig) {
        setAceCode(questData.monacoConfig.initialCode);
      } else {
        setAceCode('');
      }
    }
  }, [questData]);

  const handleEditorChange = (editor: EditorType) => {
    // Check if we are checking from a mutable code view (javascript/monaco) back to blockly
    if ((currentEditor === 'monaco' || currentEditor === 'javascript') && editor === 'blockly') {
      if (!window.confirm(t('Games.breakLink'))) {
        return; // User cancelled the switch
      }
    }

    if (editor === 'monaco' || editor === 'javascript') {
      const code = generateSafeCode(workspaceRef.current); // Sử dụng hàm an toàn
      // Strip block IDs for cleaner display in Monaco editor
      setAceCode(stripBlockIds(code));
    }
    // Note: Python/Lua generation is handled in the UI layer's onEditorChange for now, 
    // or could be moved here if we pass the generator.
    
    setCurrentEditor(editor);
  };

  return {
    currentEditor,
    aceCode,
    setAceCode,
    handleEditorChange,
  };
};