import { useState, useEffect, useRef, useCallback } from 'react';
import Editor, { type Monaco } from '@monaco-editor/react';
import Split from 'react-split';
import { GuideRenderer } from '@repo/quest-player';
import { XmlBlockEditor } from './components/XmlBlockEditor/XmlBlockEditor';
import { Toolbar } from './components/Toolbar/Toolbar';
import { AVAILABLE_MAPS } from './data/maps';
import { MARKDOWN_TEMPLATES } from './data/templates';
import './App.css';

// Initial Markdown Template
const INITIAL_CONTENT = `# Topic: [NAME]

{{ ... }}
<BlocklyXML>
  <xml xmlns="https://developers.google.com/blockly/xml">
    <block type="maze_moveForward"></block>
  </xml>
</BlocklyXML>

## 4. Example
[Example]

## 5. Quick Quiz
<Quiz>
  <Question>Question text?</Question>
  <Option correct="true">Correct Answer</Option>
  <Option>Wrong Answer</Option>
</Quiz>
`;

function App() {
  const [content, setContent] = useState(INITIAL_CONTENT);
  const [isXmlEditorOpen, setIsXmlEditorOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<{ line: number, xml: string, mapId?: string } | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Editor ref to handle cursor position insertions
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
  };

  // Helper to insert text at cursor position in Monaco Editor
  const insertAtCursor = useCallback((textToInsert: string) => {
    if (editorRef.current && monacoRef.current) {
      const editor = editorRef.current;
      const selection = editor.getSelection();

      const op = { range: selection, text: textToInsert, forceMoveMarkers: true };
      editor.executeEdits("my-source", [op]);
      editor.focus();
    } else {
      // Fallback if editor not ready (append)
      setContent((prev) => prev + "\n" + textToInsert);
    }
  }, []);

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'guide.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveBlocklyXml = (xml: string, mapId?: string) => {
    // Wrap XML in <BlocklyXML> tags
    const mapAttr = mapId ? ` mapId="${mapId}"` : '';
    const block = `<BlocklyXML${mapAttr}>\n  ${xml}\n</BlocklyXML>`;

    if (editingBlock) {
      // Replace existing block at specific line
      const lines = content.split('\n');
      const startLine = editingBlock.line - 1; // 0-indexed

      // Find the end of the block </BlocklyXML>
      let endLine = startLine;
      for (let i = startLine; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes('</blocklyxml>')) {
          endLine = i;
          break;
        }
      }

      const newLines = [
        ...lines.slice(0, startLine),
        block,
        ...lines.slice(endLine + 1)
      ];
      setContent(newLines.join('\n'));
      setEditingBlock(null);
    } else {
      // Insert at cursor
      insertAtCursor(`\n${block}\n`);
    }
    setIsXmlEditorOpen(false);
  };

  const handleEditBlock = (line: number, xml: string, mapId?: string) => {
    setEditingBlock({ line, xml, mapId });
    setIsXmlEditorOpen(true);
  };

  // Content Insertion Handlers
  const handleInsertImage = () => {
    const url = prompt("Enter Image URL:");
    if (url) {
      const template = MARKDOWN_TEMPLATES.IMAGE.replace('url_here', url);
      insertAtCursor(`\n${template}\n`);
    }
  };

  const handleInsertVideo = () => {
    const url = prompt("Enter Video URL (YouTube/Vimeo/MP4):");
    if (url) {
      const template = MARKDOWN_TEMPLATES.VIDEO.replace('url_here', url);
      insertAtCursor(`\n${template}\n`);
    }
  };

  const handleInsertCode = () => {
    insertAtCursor(`\n${MARKDOWN_TEMPLATES.CODE_BLOCK}\n`);
  };

  const handleInsertQuiz = () => {
    const quizTemplate = `\n<Quiz>\n  <Question>Question text?</Question>\n  <Option correct="true">Correct Answer</Option>\n  <Option>Wrong Answer</Option>\n</Quiz>\n`;
    insertAtCursor(quizTemplate);
  };

  // Sync Scroll Handlers
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef<boolean>(false);

  // Sync Monaco Scroll -> Preview
  const handleEditorScroll = useCallback(() => {
    if (isScrollingRef.current || !editorRef.current || !previewContainerRef.current) return;

    const editor = editorRef.current;
    const preview = previewContainerRef.current;

    // Use defensive methods for scroll info
    let scrollTop, scrollHeight, clientHeight;

    if (typeof editor.getScrollInfo === 'function') {
      const scrollInfo = editor.getScrollInfo();
      scrollTop = scrollInfo.scrollTop;
      scrollHeight = scrollInfo.scrollHeight;
      clientHeight = scrollInfo.height;
    } else {
      // Fallback to direct methods
      scrollTop = editor.getScrollTop();
      scrollHeight = editor.getScrollHeight();
      clientHeight = editor.getLayoutInfo ? editor.getLayoutInfo().height : preview.clientHeight;
    }

    const scrollPercent = scrollTop / (scrollHeight - clientHeight || 1);

    isScrollingRef.current = true;
    preview.scrollTop = scrollPercent * (preview.scrollHeight - preview.clientHeight);

    setTimeout(() => { isScrollingRef.current = false; }, 50);
  }, []);

  // Sync Preview Scroll -> Monaco
  const handlePreviewScroll = useCallback(() => {
    if (isScrollingRef.current || !editorRef.current || !previewContainerRef.current) return;

    const editor = editorRef.current;
    const preview = previewContainerRef.current;

    const scrollPercent = preview.scrollTop / (preview.scrollHeight - preview.clientHeight);

    isScrollingRef.current = true;
    const scrollHeight = editor.getScrollHeight();
    const height = editor.getLayoutInfo().height;
    editor.setScrollTop(scrollPercent * (scrollHeight - height));

    setTimeout(() => { isScrollingRef.current = false; }, 50);
  }, []);

  useEffect(() => {
    const editor = editorRef.current;
    if (editor) {
      const disposable = editor.onDidScrollChange(handleEditorScroll);
      return () => disposable.dispose();
    }
  }, [handleEditorScroll, editorRef.current]);

  const handleElementClick = (line: number) => {
    if (editorRef.current) {
      editorRef.current.revealLineInCenter(line);
      editorRef.current.setPosition({ lineNumber: line, column: 1 });
      editorRef.current.focus();
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div className="logo-icon">📝</div>
          <h1>Guide Builder <span className="version-tag">v3.1</span></h1>
        </div>
        <div className="header-actions">
          <button
            className="btn-theme-toggle"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            title="Toggle Preview Theme"
          >
            {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
          </button>
          <button className="btn-secondary" onClick={() => setContent(INITIAL_CONTENT)}>Reset</button>
          <button className="btn-export" onClick={handleDownload}>Export MD</button>
        </div>
      </header>

      <div className="toolbar-container">
        <Toolbar
          onInsertText={insertAtCursor}
          onInsertImage={handleInsertImage}
          onInsertVideo={handleInsertVideo}
          onInsertCode={handleInsertCode}
          onInsertBlockly={() => setIsXmlEditorOpen(true)}
          onInsertQuiz={handleInsertQuiz}
        />
      </div>

      <Split
        className="split-wrapper"
        sizes={[45, 55]}
        minSize={300}
        gutterSize={8}
        direction="horizontal"
      >
        <div className="editor-pane" title="EDITOR SIDE">
          <Editor
            height="100%"
            defaultLanguage="markdown"
            theme="vs-dark"
            value={content}
            onChange={(value) => setContent(value || '')}
            onMount={handleEditorDidMount}
            options={{
              minimap: { enabled: false },
              wordWrap: 'on',
              fontSize: 15,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              padding: { top: 20 }
            }}
          />
        </div>
        <div className={`preview-pane ${theme}-mode`} ref={previewContainerRef} onScroll={handlePreviewScroll} title="PREVIEW SIDE">
          <div className="guide-preview-container">
            <div className="guide-preview-inner">
              <GuideRenderer
                content={content}
                showSourceLine={true}
                useDynamicHeight={true}
                onElementClick={handleElementClick}
                onEditBlock={handleEditBlock}
                onRunCode={(mapId: string, xml: string) => {
                  const mapInfo = AVAILABLE_MAPS.find(m => m.id === mapId);
                  const groupId = mapInfo ? mapInfo.groupId : 'group1';
                  const playerUrl = `http://localhost:5173/quest/${groupId}/${mapId}?code=${encodeURIComponent(xml)}`;
                  window.open(playerUrl, '_blank');
                }}
              />
            </div>
          </div>
        </div>
      </Split>

      {isXmlEditorOpen && (
        <XmlBlockEditor
          initialXml={editingBlock?.xml}
          initialMapId={editingBlock?.mapId}
          onClose={() => {
            setIsXmlEditorOpen(false);
            setEditingBlock(null);
          }}
          onSave={handleSaveBlocklyXml}
        />
      )}
    </div>
  );
}

export default App;
