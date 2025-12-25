/**
 * RightPanelLayout Component
 * 
 * Unified layout for the right sidebar with collapsible sections:
 * - Properties Panel
 * - Quest Details Panel  
 * - JSON Output Panel
 */

import React, { ReactNode } from 'react';
import { CollapsibleSection } from '../CollapsibleSection';
import { Settings, Target, FileJson } from 'lucide-react';
import './RightPanelLayout.css';

interface RightPanelLayoutProps {
    /** Content for Properties section */
    propertiesContent: ReactNode;
    /** Content for Quest Details section */
    questDetailsContent: ReactNode;
    /** Content for JSON Output section */
    jsonOutputContent: ReactNode;
    /** Whether any object is selected */
    hasSelection?: boolean;
    /** Selection count for badge */
    selectionCount?: number;
}

export function RightPanelLayout({
    propertiesContent,
    questDetailsContent,
    jsonOutputContent,
    hasSelection = false,
    selectionCount = 0,
}: RightPanelLayoutProps) {
    return (
        <div className="right-panel-layout">
            {/* Properties Section */}
            <CollapsibleSection
                title="Properties"
                icon={<Settings size={16} />}
                storageKey="right-properties"
                defaultCollapsed={!hasSelection}
                badge={selectionCount > 0 ? `${selectionCount}` : undefined}
                className="properties"
            >
                <div className="section-content-wrapper">
                    {propertiesContent}
                </div>
            </CollapsibleSection>

            {/* Quest Details Section */}
            <CollapsibleSection
                title="Quest Details"
                icon={<Target size={16} />}
                storageKey="right-quest"
                defaultCollapsed={true}
                className="quest"
            >
                <div className="section-content-wrapper">
                    {questDetailsContent}
                </div>
            </CollapsibleSection>

            {/* JSON Output Section */}
            <CollapsibleSection
                title="JSON Output"
                icon={<FileJson size={16} />}
                storageKey="right-json"
                defaultCollapsed={true}
                className="json"
            >
                <div className="section-content-wrapper">
                    {jsonOutputContent}
                </div>
            </CollapsibleSection>
        </div>
    );
}

export default RightPanelLayout;
