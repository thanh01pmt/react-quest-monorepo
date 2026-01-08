import React, { useEffect, useRef, useState } from 'react';
import * as Blockly from 'blockly';
import 'blockly/blocks';
import { javascriptGenerator } from 'blockly/javascript';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { mazeTheme } from '../../../theme';
import { init as initMazeBlocks } from '../../games/maze/blocks';
import { useTranslation } from 'react-i18next';
import { questPlayerResources } from '../../i18n';
import './BlocklyRenderer.css';

interface BlocklyRendererProps {
    xml: string;
    language?: string;
    width?: string;
    height?: string;
    showControls?: boolean;
    frameless?: boolean;
    hasRunButton?: boolean;
    onHeightChange?: (height: number) => void;
}

// Global tracker to prevent redundant block re-initialization across multiple instances
let lastLanguageInitialized: string | null = null;

const BlocklyRendererComponent: React.FC<BlocklyRendererProps> = ({
    xml,
    width = '100%',
    height = '200px',
    showControls = false,
    frameless = false,
    onHeightChange
}) => {
    const { t, i18n } = useTranslation();
    const containerRef = useRef<HTMLDivElement>(null);
    const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);

    // State for UI controls
    const [viewMode, setViewMode] = useState<'blocks' | 'code'>('blocks');
    const [generatedCode, setGeneratedCode] = useState<string>('');

    // Effect for initializing Blocks (run once per language change)
    useEffect(() => {
        if (lastLanguageInitialized !== i18n.language) {
            // Initialize blocks and translations
            const viTranslations = questPlayerResources.vi.translation as any;
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
            initMazeBlocks(t);
            lastLanguageInitialized = i18n.language;
        }
    }, [i18n.language, t]);

    // Effect for Workspace Management
    useEffect(() => {
        if (!containerRef.current) return;

        let workspace = workspaceRef.current;

        if (!workspace) {
            // Create workspace if it doesn't exist
            workspace = Blockly.inject(containerRef.current, {
                theme: mazeTheme,
                readOnly: true,
                move: { scrollbars: true, drag: true, wheel: false },
                zoom: { controls: false, wheel: false, startScale: 0.8 },
                renderer: 'zelos',
            });
            workspaceRef.current = workspace;
        }

        // Load XML
        // Clear workspace before loading new XML to avoid duplication
        workspace.clear();

        console.log('[BlocklyRenderer] Loading XML:', {
            xmlLength: xml.length,
            xmlPreview: xml.substring(0, 150),
            hasWorkspace: !!workspace
        });

        let cleanedXml = xml.trim();
        const startIdx = cleanedXml.indexOf('<xml');
        const endIdx = cleanedXml.lastIndexOf('</xml>');
        if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
            cleanedXml = cleanedXml.substring(startIdx, endIdx + 6);
        } else if (!cleanedXml.startsWith('<xml')) {
            cleanedXml = `<xml xmlns="https://developers.google.com/blockly/xml">${cleanedXml}</xml>`;
        }
        if (cleanedXml.startsWith('<xml') && !cleanedXml.includes('xmlns=')) {
            cleanedXml = cleanedXml.replace('<xml', '<xml xmlns="https://developers.google.com/blockly/xml"');
        }

        try {
            const xmlDom = Blockly.utils.xml.textToDom(cleanedXml);
            Blockly.Xml.domToWorkspace(xmlDom, workspace);

            console.log('[BlocklyRenderer] XML loaded successfully, applying layout...');

            // Dynamic Top-Left alignment and Fit logic (v2.9)
            const applyLayout = () => {
                if (workspace) {
                    Blockly.svgResize(workspace);
                    const box = workspace.getBlocksBoundingBox();

                    if (box) {
                        // "To hơn 1 tí" -> Use Scale 1.0 (default was 0.8)
                        workspace.setScale(1.0);
                        const scale = workspace.getScale();

                        // Top-left alignment with 24px padding
                        const padding = 24;
                        const dx = -box.left * scale + padding;
                        const dy = -box.top * scale + padding;
                        workspace.translate(dx, dy);

                        // Notify height change (padding * 2 to account for bottom padding)
                        if (onHeightChange) {
                            const contentHeight = (box.bottom - box.top) * scale + padding * 2;
                            onHeightChange(contentHeight);
                        }
                    } else if (onHeightChange) {
                        // No box found, use minimum height
                        onHeightChange(200);
                    }
                }
            };

            applyLayout();
            setTimeout(applyLayout, 150);
            setTimeout(applyLayout, 500);
        } catch (e) {
            console.error("[BlocklyRenderer] XML loading error:", e, '\nXML:', cleanedXml);
        }
    }, [xml]);

    // Handle Resize
    useEffect(() => {
        if (workspaceRef.current) {
            Blockly.svgResize(workspaceRef.current);
        }
    }, [width, height, viewMode]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (workspaceRef.current) {
                workspaceRef.current.dispose();
                workspaceRef.current = null;
            }
        };
    }, []);


    const handleZoomIn = () => {
        if (workspaceRef.current) {
            workspaceRef.current.zoomCenter(1); // Zoom in
        }
    };

    const handleZoomOut = () => {
        if (workspaceRef.current) {
            workspaceRef.current.zoomCenter(-1); // Zoom out
        }
    };

    const handleToggleCode = () => {
        if (viewMode === 'blocks') {
            if (workspaceRef.current) {
                const code = javascriptGenerator.workspaceToCode(workspaceRef.current);
                setGeneratedCode(code);
            }
            setViewMode('code');
        } else {
            setViewMode('blocks');
            // Re-layout blocks when switching back
            setTimeout(() => {
                if (workspaceRef.current) Blockly.svgResize(workspaceRef.current);
            }, 50);
        }
    };

    return (
        <div
            className={`blockly-renderer-container ${frameless ? 'frameless' : ''}`}
            style={{
                width,
                height,
                minHeight: height,
                position: 'relative' // For absolute toolbar
            }}
        >
            {/* Toolbar Overlay */}
            {showControls && (
                <div className="blockly-mini-toolbar">
                    <button onClick={handleZoomIn} title="Zoom In">+</button>
                    <button onClick={handleZoomOut} title="Zoom Out">-</button>
                    <button
                        onClick={handleToggleCode}
                        title="Toggle Code View"
                        className={viewMode === 'code' ? 'active' : ''}
                    >
                        {viewMode === 'code' ? '🧩' : '{ }'}
                    </button>
                </div>
            )}

            {/* Blocks View */}
            <div
                ref={containerRef}
                style={{
                    width: '100%',
                    height: '100%',
                    display: viewMode === 'blocks' ? 'block' : 'none',
                    opacity: frameless ? 0.95 : 1 // Slight transparency effect?
                }}
            />

            {/* Code View */}
            {viewMode === 'code' && (
                <div className="blockly-code-view">
                    <SyntaxHighlighter
                        language="javascript"
                        style={vscDarkPlus}
                        customStyle={{
                            margin: 0,
                            height: '100%',
                            width: '100%',
                            fontSize: '12px',
                            borderRadius: frameless ? '8px' : '0'
                        }}
                    >
                        {generatedCode || '// No code generated'}
                    </SyntaxHighlighter>
                </div>
            )}
        </div>
    );
};

export const BlocklyRenderer = React.memo(BlocklyRendererComponent);
