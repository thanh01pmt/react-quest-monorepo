import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSnippets } from './useSnippets';
import './SnippetToolbox.css';

interface SnippetToolboxProps {
    currentEditor: string;
    allowedCategories?: Set<string>;
    theme?: 'light' | 'dark';
}

export const SnippetToolbox: React.FC<SnippetToolboxProps> = ({ currentEditor, allowedCategories, theme = 'light' }) => {
    const { t } = useTranslation();
    const categories = useSnippets(currentEditor);
    const [expandedCategory, setExpandedCategory] = useState<string | null>('movement');
    const [searchQuery, setSearchQuery] = useState('');

    const toggleCategory = (id: string) => {
        setExpandedCategory(expandedCategory === id ? null : id);
    };

    const handleDragStart = (e: React.DragEvent, code: string) => {
        // Aggressively sanitize code: remove ALL '$' characters to prevent Monaco snippet interpretation
        const sanitizedCode = code.replace(/\$/g, '');
        console.log('[SnippetToolbox] Dragging code:', { original: code, sanitized: sanitizedCode });
        e.dataTransfer.setData('text/plain', sanitizedCode);
        e.dataTransfer.effectAllowed = 'copy';
    };

    // Filter logic
    const filteredCategories = categories.map(cat => ({
        ...cat,
        snippets: cat.snippets.filter(s =>
            s.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.code.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })).filter(cat => {
        const hasSnippets = cat.snippets.length > 0;
        const isAllowed = !allowedCategories || allowedCategories.has(cat.name) || allowedCategories.size === 0;
        return hasSnippets && isAllowed;
    });

    // Auto-expand all when searching
    // const displayExpanded = searchQuery ? filteredCategories.map(c => c.id) : (expandedCategory ? [expandedCategory] : []);

    return (
        <div className={`snippet-toolbox ${theme}`}>
            <div className="snippet-search-container">
                <input
                    type="search"
                    className="snippet-search-input"
                    placeholder={t('UI.searchSnippets', 'Search...')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <div className="snippet-toolbox-content">
                {filteredCategories.map((category) => (
                    <div key={category.id} className="snippet-category">
                        <div
                            className="snippet-category-header"
                            style={{ '--category-color': category.color } as React.CSSProperties}
                            onClick={() => toggleCategory(category.id)}
                        >
                            {category.name}
                        </div>
                        {(searchQuery || expandedCategory === category.id) && (
                            <div className="snippet-category-content">
                                {category.snippets.map((snippet) => (
                                    <div
                                        key={snippet.id}
                                        className="snippet-item"
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, snippet.code)}
                                        title={snippet.tooltip || snippet.code}
                                        style={{ '--category-color': category.color } as React.CSSProperties}
                                    >
                                        <span className="snippet-item-label">{snippet.label}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
