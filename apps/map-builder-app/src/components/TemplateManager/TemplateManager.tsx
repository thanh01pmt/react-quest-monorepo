/**
 * TemplateManager - Component for managing placement templates
 * 
 * Allows users to save, load, and apply placement templates.
 */

import React, { useState, useEffect } from 'react';
import type {
    PlacementTemplate,
    TemplateItemPlacement,
    SelectableElement
} from '@repo/academic-map-generator';
import {
    getTemplateRegistry,
    initializeDefaultTemplates
} from '@repo/academic-map-generator';
import './TemplateManager.css';
import { ClipboardList, Save, ArrowDownUp, Download, Upload, Trash2 } from 'lucide-react';

interface TemplateManagerProps {
    topologyType: string;
    selectableElements: SelectableElement[];
    currentSelections: Array<{ elementId: string; itemType: 'crystal' | 'switch'; symmetric?: boolean }>;
    onApplyTemplate: (placements: TemplateItemPlacement[]) => void;
    onTemplateLoaded?: (template: PlacementTemplate) => void;
}

export function TemplateManager({
    topologyType,
    selectableElements,
    currentSelections,
    onApplyTemplate,
    onTemplateLoaded
}: TemplateManagerProps) {
    const [templates, setTemplates] = useState<PlacementTemplate[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState('');
    const [showExportDialog, setShowExportDialog] = useState(false);

    const registry = getTemplateRegistry();

    // Initialize and load templates
    useEffect(() => {
        initializeDefaultTemplates();
        loadTemplates();
    }, [topologyType]);

    const loadTemplates = () => {
        const all = registry.getAll();
        const filtered = all.filter(t =>
            t.topologyType === topologyType || t.topologyType === '*'
        );
        setTemplates(filtered);
    };

    // Apply selected template
    const handleApply = () => {
        if (!selectedTemplateId) return;

        const placements = registry.apply(selectedTemplateId, selectableElements);
        onApplyTemplate(placements);

        const template = registry.get(selectedTemplateId);
        if (template && onTemplateLoaded) {
            onTemplateLoaded(template);
        }
    };

    // Save current selections as template
    const handleSave = () => {
        if (!newTemplateName.trim()) return;

        const template = registry.createFromSelections(
            newTemplateName.trim(),
            topologyType,
            currentSelections,
            selectableElements
        );

        setShowSaveDialog(false);
        setNewTemplateName('');
        loadTemplates();
        setSelectedTemplateId(template.id);
    };

    // Delete template
    const handleDelete = (templateId: string) => {
        if (!confirm('Delete this template?')) return;

        registry.delete(templateId);
        loadTemplates();

        if (selectedTemplateId === templateId) {
            setSelectedTemplateId(null);
        }
    };

    // Export templates
    const handleExport = () => {
        const json = registry.export();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `placement-templates-${topologyType}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setShowExportDialog(false);
    };

    // Import templates
    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            const count = registry.import(content);
            alert(`Imported ${count} template(s)`);
            loadTemplates();
        };
        reader.readAsText(file);

        // Reset input
        event.target.value = '';
    };

    return (
        <div className="template-manager">
            <div className="manager-header">
                <h3><ClipboardList size={18} /> Templates</h3>
                <div className="header-actions">
                    <button
                        className="btn-icon"
                        onClick={() => setShowSaveDialog(true)}
                        title="Save current as template"
                        disabled={currentSelections.length === 0}
                    >
                        <Save size={16} />
                    </button>
                    <button
                        className="btn-icon"
                        onClick={() => setShowExportDialog(true)}
                        title="Export/Import"
                    >
                        <ArrowDownUp size={16} />
                    </button>
                </div>
            </div>

            {/* Template List */}
            <div className="template-list">
                {templates.length === 0 ? (
                    <div className="empty-state">
                        No templates for {topologyType}
                    </div>
                ) : (
                    templates.map(template => (
                        <div
                            key={template.id}
                            className={`template-item ${selectedTemplateId === template.id ? 'selected' : ''}`}
                            onClick={() => setSelectedTemplateId(template.id)}
                        >
                            <div className="template-info">
                                <span className="template-name">{template.name}</span>
                                <span className="template-rules">{template.rules.length} rules</span>
                            </div>
                            <button
                                className="btn-delete"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(template.id);
                                }}
                                title="Delete"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Apply Button */}
            <button
                className="btn-apply"
                onClick={handleApply}
                disabled={!selectedTemplateId}
            >
                Apply Template
            </button>

            {/* Save Dialog */}
            {showSaveDialog && (
                <div className="dialog-overlay">
                    <div className="dialog">
                        <h4>Save as Template</h4>
                        <input
                            type="text"
                            placeholder="Template name..."
                            value={newTemplateName}
                            onChange={(e) => setNewTemplateName(e.target.value)}
                            autoFocus
                        />
                        <div className="dialog-actions">
                            <button onClick={() => setShowSaveDialog(false)}>Cancel</button>
                            <button onClick={handleSave} className="primary">Save</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Export Dialog */}
            {showExportDialog && (
                <div className="dialog-overlay">
                    <div className="dialog">
                        <h4>Export / Import</h4>
                        <div className="export-actions">
                            <button onClick={handleExport}>
                                <Download size={14} /> Export Templates
                            </button>
                            <label className="import-label">
                                <Upload size={14} /> Import Templates
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={handleImport}
                                    hidden
                                />
                            </label>
                        </div>
                        <div className="dialog-actions">
                            <button onClick={() => setShowExportDialog(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TemplateManager;
