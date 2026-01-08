import React, { useEffect, useRef, useState } from 'react';
import * as Blockly from 'blockly';
import 'blockly/blocks'; // Import standard blocks
import { initMazeBlocks, toolboxPresets, questPlayerResources, createBlocklyTheme } from '@repo/quest-player';
import * as Vi from 'blockly/msg/vi';
import { MapSelector } from '../MapSelector';
import './XmlBlockEditor.css';

// Fix validation errors
// @ts-ignore
Blockly.setLocale(Vi);

// Correct TFunction using shared resources
const viTranslations = questPlayerResources.vi.translation as any;

// Manual population of Blockly.Msg to support %{BKY_...} in toolbox
const populateMsg = (obj: any, prefix = '') => {
    for (const key in obj) {
        const fullKey = prefix ? `${prefix}_${key}` : key;
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            populateMsg(obj[key], fullKey);
        } else {
            const msgKey = fullKey.toUpperCase().replace(/\./g, '_');
            Blockly.Msg[msgKey] = obj[key];
            Blockly.Msg[fullKey] = obj[key];
            const lowercaseKey = fullKey.replace(/\./g, '_');
            Blockly.Msg[lowercaseKey] = obj[key];
        }
    }
};
populateMsg(viTranslations);

const mockT: any = (key: string, options?: any) => {
    // Check flat key first
    if (viTranslations[key]) return viTranslations[key];

    // Fallback to nested navigation
    const parts = key.split('.');
    let value: any = viTranslations;
    for (const part of parts) {
        value = value?.[part];
        if (value === undefined) break;
    }
    return value || options?.defaultValue || key;
};

// Use the FULL toolbox preset from shared config
const toolboxJson = toolboxPresets.full;

interface XmlBlockEditorProps {
    initialXml?: string;
    initialMapId?: string;
    onClose: () => void;
    onSave: (xml: string, mapId?: string) => void;
}

export const XmlBlockEditor: React.FC<XmlBlockEditorProps> = ({ initialXml, initialMapId, onClose, onSave }) => {
    const blocklyDiv = useRef<HTMLDivElement>(null);
    const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
    const [selectedMapId, setSelectedMapId] = useState<string>(initialMapId || '');

    // Settings State
    const [blockThemeName, setBlockThemeName] = useState<'zelos' | 'classic'>('zelos');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    useEffect(() => {
        if (blocklyDiv.current) {
            // Clean up existing workspace if any
            if (workspaceRef.current) {
                workspaceRef.current.dispose();
            }

            Blockly.setLocale(Vi as any);

            // Initialize shared blocks (Mock translation function)
            initMazeBlocks(mockT);

            // Dynamic theme creation
            const theme = createBlocklyTheme(blockThemeName, 'light'); // Always light mode for editor for now

            const workspace = Blockly.inject(blocklyDiv.current, {
                toolbox: toolboxJson,
                theme: theme,
                renderer: blockThemeName === 'zelos' ? 'zelos' : 'geras', // Switch renderer based on theme
                scrollbars: true,
                zoom: {
                    controls: true,
                    wheel: true,
                    startScale: 0.8,
                    maxScale: 3,
                    minScale: 0.3,
                    scaleSpeed: 1.2,
                },
            });
            workspaceRef.current = workspace;

            if (initialXml) {
                try {
                    const xmlDom = Blockly.utils.xml.textToDom(initialXml);
                    Blockly.Xml.domToWorkspace(xmlDom, workspace);
                } catch (e) {
                    console.error("Failed to parse initial XML", e);
                }
            }

            // Auto-inject when run clicked block if missing
            const topBlocks = workspace.getTopBlocks(false);
            const hasStartBlock = topBlocks.some(b => b.type === 'maze_start');
            if (!hasStartBlock) {
                const startBlock = workspace.newBlock('maze_start');
                startBlock.initSvg();
                startBlock.render();
                startBlock.moveBy(20, 20);
                // @ts-ignore
                if (startBlock.setDeletable) startBlock.setDeletable(false);
            }
        }

        return () => {
            if (workspaceRef.current) {
                workspaceRef.current.dispose();
                workspaceRef.current = null;
            }
        };
    }, [initialXml, blockThemeName]); // Re-run when theme changes

    const handleSave = () => {
        if (!workspaceRef.current) return;

        // Convert workspace to XML (headless, no IDs)
        const xmlDom = Blockly.Xml.workspaceToDom(workspaceRef.current, true);

        // Clean up IDs and coordinates to make it compact
        const elements = xmlDom.getElementsByTagName('*');
        for (let i = 0; i < elements.length; i++) {
            elements[i].removeAttribute('id');
            elements[i].removeAttribute('x');
            elements[i].removeAttribute('y');
        }

        const serializer = new XMLSerializer();
        let xmlText = serializer.serializeToString(xmlDom);

        // Remove xmlns for cleaner markdown embedding
        xmlText = xmlText.replace(/ xmlns="https:\/\/developers\.google\.com\/blockly\/xml"/g, '');

        onSave(xmlText, selectedMapId);
    };

    return (
        <div className="xml-block-editor-overlay">
            <div className="xml-block-editor-content">
                <header className="xml-block-editor-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1 }}>
                        <h2>Block Editor</h2>
                        <div style={{ flex: 1 }}>
                            <MapSelector selectedMapId={selectedMapId} onSelectMap={setSelectedMapId} />
                        </div>
                    </div>

                    <div className="editor-settings" style={{ position: 'relative', marginRight: '10px' }}>
                        <button
                            className="btn-secondary"
                            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                            title="Cài đặt"
                        >
                            ⚙️
                        </button>
                        {isSettingsOpen && (
                            <div className="editor-settings-dropdown">
                                <div className="editor-settings-title">Cài đặt</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label className="editor-setting-item">
                                        Chủ đề khối:
                                        <select
                                            className="editor-setting-select"
                                            value={blockThemeName}
                                            onChange={(e) => setBlockThemeName(e.target.value as 'zelos' | 'classic')}
                                        >
                                            <option value="zelos">Zelos</option>
                                            <option value="classic">Classic</option>
                                        </select>
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="editor-actions">
                        <button className="btn-secondary" onClick={onClose}>Cancel</button>
                        <button className="btn-primary" onClick={handleSave}>Insert Blocks</button>
                    </div>
                </header>
                <div className="blockly-container" ref={blocklyDiv}></div>
            </div>
        </div>
    );
};
