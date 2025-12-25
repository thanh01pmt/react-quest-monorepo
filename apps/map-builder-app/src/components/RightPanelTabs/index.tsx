import { useState, useEffect } from 'react';
import { PropertiesPanel } from '../PropertiesPanel';
import { QuestDetailsPanel } from '../QuestDetailsPanel';
import { JsonOutputPanel } from '../JsonOutputPanel';
import { PlacedObject } from '../../types';
import { Palette, Target, Settings } from 'lucide-react';
import './RightPanelTabs.css';

type TabType = 'properties' | 'quest' | 'advanced';

interface RightPanelTabsProps {
    // Properties Panel props
    selectedObjects: PlacedObject[];
    onUpdateObject: (updatedObject: PlacedObject) => void;
    onDeleteSelection: () => void;
    onAddObject: (newObject: PlacedObject) => void;
    onCopyAsset: (id: string) => void;
    onRotateSelection: () => void;
    onFlipSelection: (axis: 'x' | 'z') => void;
    onClearSelection: () => void;

    // Quest Details Panel props
    metadata: Record<string, any> | null;
    onMetadataChange: (path: string, value: any) => void;
    onSolveMaze: () => void;
    onImportMap: (file: File) => void;
    onLoadMapFromUrl?: (url: string) => void;

    // JSON Output Panel props
    questId: string;
    editedJson: string;
    onJsonChange: (newJson: string) => void;
    onRender: () => void;
    onSave?: () => void; // Made optional to match JsonOutputPanel
}

export function RightPanelTabs(props: RightPanelTabsProps) {
    const [activeTab, setActiveTab] = useState<TabType>('properties');

    // Auto-switch to properties tab when object is selected
    useEffect(() => {
        if (props.selectedObjects.length > 0 && activeTab !== 'properties') {
            setActiveTab('properties');
        }
    }, [props.selectedObjects.length]);

    // Save active tab to localStorage for persistence
    useEffect(() => {
        localStorage.setItem('rightPanelActiveTab', activeTab);
    }, [activeTab]);

    // Restore active tab from localStorage on mount
    useEffect(() => {
        const savedTab = localStorage.getItem('rightPanelActiveTab') as TabType;
        if (savedTab && ['properties', 'quest', 'advanced'].includes(savedTab)) {
            setActiveTab(savedTab);
        }
    }, []);

    return (
        <div className="right-panel-tabs">
            {/* Tab Bar */}
            <div className="tab-bar">
                <button
                    className={`tab-button ${activeTab === 'properties' ? 'active' : ''}`}
                    onClick={() => setActiveTab('properties')}
                    title="Object Properties & Actions"
                >
                    <span className="tab-icon"><Palette size={16} /></span>
                    <span className="tab-label">Properties</span>
                    {props.selectedObjects.length > 0 && (
                        <span className="tab-badge">{props.selectedObjects.length}</span>
                    )}
                </button>

                <button
                    className={`tab-button ${activeTab === 'quest' ? 'active' : ''}`}
                    onClick={() => setActiveTab('quest')}
                    title="Quest Configuration & Solutions"
                >
                    <span className="tab-icon"><Target size={16} /></span>
                    <span className="tab-label">Quest</span>
                </button>

                <button
                    className={`tab-button ${activeTab === 'advanced' ? 'active' : ''}`}
                    onClick={() => setActiveTab('advanced')}
                    title="JSON Editor & Advanced Settings"
                >
                    <span className="tab-icon"><Settings size={16} /></span>
                    <span className="tab-label">Advanced</span>
                </button>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
                {activeTab === 'properties' && (
                    <PropertiesPanel
                        selectedObjects={props.selectedObjects}
                        onUpdateObject={props.onUpdateObject}
                        onDeleteSelection={props.onDeleteSelection}
                        onAddObject={props.onAddObject}
                        onCopyAsset={props.onCopyAsset}
                        onRotateSelection={props.onRotateSelection}
                        onFlipSelection={props.onFlipSelection}
                        onClearSelection={props.onClearSelection}
                    />
                )}

                {activeTab === 'quest' && (
                    <QuestDetailsPanel
                        metadata={props.metadata}
                        onMetadataChange={props.onMetadataChange}
                        onSolveMaze={props.onSolveMaze}
                        onImportMap={props.onImportMap}
                        onLoadMapFromUrl={props.onLoadMapFromUrl}
                    />
                )}

                {activeTab === 'advanced' && (
                    <JsonOutputPanel
                        questId={props.questId}
                        editedJson={props.editedJson}
                        onJsonChange={props.onJsonChange}
                        onRender={props.onRender}
                        {...(props.onSave && { onSave: props.onSave })}
                    />
                )}
            </div>
        </div>
    );
}
