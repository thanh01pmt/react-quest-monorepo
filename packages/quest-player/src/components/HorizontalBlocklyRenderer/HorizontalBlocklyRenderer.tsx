/**
 * HorizontalBlocklyRenderer - Junior Mode Block Editor
 * 
 * A horizontal block layout component inspired by Google Doodle's "Kids Coding"
 * and ScratchJr. Designed for younger learners with icon-only blocks.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as Blockly from 'blockly';
import 'blockly/blocks';
import { javascriptGenerator } from 'blockly/javascript';
import { useTranslation } from 'react-i18next';
import { juniorTheme } from '../../renderers/juniorTheme';
import { registerHorizontalRenderer } from '../../renderers/HorizontalRenderer';
import { initJuniorBlocks, getJuniorToolbox } from '../../games/maze/juniorBlocks';
import './HorizontalBlocklyRenderer.css';

interface HorizontalBlocklyRendererProps {
    /** Initial XML to load into workspace */
    xml?: string;
    /** Width of the component */
    width?: string;
    /** Height of the component */
    height?: string;
    /** Show control buttons (run, reset) */
    showControls?: boolean;
    /** Read-only mode */
    readOnly?: boolean;
    /** Maximum number of blocks allowed */
    maxBlocks?: number;
    /** Callback when blocks change */
    onBlocksChange?: (xml: string) => void;
    /** Callback when code is generated */
    onCodeChange?: (code: string) => void;
    /** Path to media assets */
    pathToMedia?: string;
    /** Use custom horizontal renderer (true) or standard Zelos (false) */
    useHorizontalRenderer?: boolean;
}

// Track initialization state
let juniorBlocksInitialized = false;
let horizontalRendererRegistered = false;

/**
 * Helper function to create a default junior_start block
 */
function createDefaultStartBlock(workspace: Blockly.WorkspaceSvg): void {
    const startBlock = workspace.newBlock('junior_start');
    startBlock.initSvg();
    startBlock.render();
    startBlock.moveBy(50, 50);
    startBlock.setDeletable(false);
    startBlock.setMovable(true);
}

export const HorizontalBlocklyRenderer: React.FC<HorizontalBlocklyRendererProps> = ({
    xml = '',
    width = '100%',
    height = '180px',
    showControls = true,
    readOnly = false,
    maxBlocks,
    onBlocksChange,
    onCodeChange,
    pathToMedia = '/assets/junior/',
    useHorizontalRenderer = true,
}) => {
    const { t } = useTranslation();
    const containerRef = useRef<HTMLDivElement>(null);
    const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
    const [blockCount, setBlockCount] = useState(0);

    // Register horizontal renderer once
    useEffect(() => {
        if (useHorizontalRenderer && !horizontalRendererRegistered) {
            try {
                registerHorizontalRenderer();
                horizontalRendererRegistered = true;
            } catch (e) {
                console.warn('[HorizontalBlocklyRenderer] Failed to register renderer:', e);
            }
        }
    }, [useHorizontalRenderer]);

    // Initialize junior blocks
    useEffect(() => {
        if (!juniorBlocksInitialized) {
            initJuniorBlocks(t, pathToMedia);
            juniorBlocksInitialized = true;
        }
    }, [t, pathToMedia]);

    // Use refs for callbacks to prevent re-registering listeners (and disposing workspace)
    // when parent component re-renders
    const callbacksRef = useRef({ onBlocksChange, onCodeChange });
    useEffect(() => {
        callbacksRef.current = { onBlocksChange, onCodeChange };
    }, [onBlocksChange, onCodeChange]);

    // Create/destroy workspace
    useEffect(() => {
        if (!containerRef.current) return;

        // Determine which renderer to use
        const rendererName = useHorizontalRenderer && horizontalRendererRegistered
            ? 'horizontal'
            : 'zelos'; // Fallback to zelos if horizontal not registered

        // Use junior toolbox if horizontal
        const toolboxConfig = useHorizontalRenderer
            ? getJuniorToolbox()
            : undefined;

        // Inject workspace
        const workspace = Blockly.inject(containerRef.current, {
            renderer: rendererName,
            theme: juniorTheme, // CRITICAL: Restore theme for correct colors
            toolbox: toolboxConfig,
            readOnly: readOnly,
            scrollbars: true,
            trashcan: true,
            sounds: true,
            media: pathToMedia || 'https://unpkg.com/blockly/media/',
            zoom: {
                controls: true,
                wheel: true,
                startScale: 1.0,
                maxScale: 3,
                minScale: 0.3,
                scaleSpeed: 1.2,
            },
            horizontalLayout: useHorizontalRenderer, // Important for horizontal scrolling
            toolboxPosition: useHorizontalRenderer ? 'end' : 'start', // Bottom for horizontal
        });

        workspaceRef.current = workspace;

        // Handle block changes
        const changeListener = (event: Blockly.Events.Abstract) => {
            if (event.type === Blockly.Events.UI) return; // Ignore UI events

            // Generate code
            const code = javascriptGenerator.workspaceToCode(workspace);
            callbacksRef.current.onCodeChange?.(code);

            // Notify blocks changed (xml)
            const xmlText = Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(workspace));
            callbacksRef.current.onBlocksChange?.(xmlText);

            // Update block count
            setBlockCount(workspace.getAllBlocks(false).length);
        };

        workspace.addChangeListener(changeListener);

        // Load initial XML if provided, otherwise create junior_start block
        if (xml && xml.trim()) {
            try {
                const xmlDom = Blockly.utils.xml.textToDom(xml);
                Blockly.Xml.domToWorkspace(xmlDom, workspace);
            } catch (e) {
                console.warn('[HorizontalBlocklyRenderer] Failed to load XML:', e);
                createDefaultStartBlock(workspace);
            }
        } else {
            // No XML provided - create default junior_start block (only if empty workspace)
            if (workspace.getAllBlocks(false).length === 0) {
                createDefaultStartBlock(workspace);
            }
        }

        // Cleanup
        return () => {
            workspace.removeChangeListener(changeListener);
            workspace.dispose();
            workspaceRef.current = null;
        };
        // CRITICAL: Removed onBlocksChange/onCodeChange/xml from deps to prevent dispose loop
        // xml is only treated as INITIAL value here. Logic for updating xml dynamically should be separate if needed.
    }, [readOnly, maxBlocks, pathToMedia, useHorizontalRenderer]);

    // Handle reset - create new junior_start block
    const handleReset = useCallback(() => {
        const workspace = workspaceRef.current;
        if (workspace) {
            workspace.clear();
            createDefaultStartBlock(workspace);
        }
    }, []);

    // Handle undo
    const handleUndo = useCallback(() => {
        workspaceRef.current?.undo(false);
    }, []);

    return (
        <div
            className="horizontal-blockly-container"
            style={{ width, height, minHeight: height }}
        >
            {/* Control bar */}
            {showControls && (
                <div className="horizontal-blockly-controls">
                    <button
                        className="hb-control-btn hb-undo-btn"
                        onClick={handleUndo}
                        title={t('Actions.undo', 'Undo')}
                    >
                        ↶
                    </button>
                    <button
                        className="hb-control-btn hb-reset-btn"
                        onClick={handleReset}
                        title={t('Actions.reset', 'Reset')}
                    >
                        ↻
                    </button>
                    {maxBlocks && (
                        <span className="hb-block-counter">
                            {blockCount}/{maxBlocks}
                        </span>
                    )}
                </div>
            )}

            {/* Blockly workspace container */}
            <div
                ref={containerRef}
                className="horizontal-blockly-workspace"
            />
        </div>
    );
};

export default HorizontalBlocklyRenderer;
