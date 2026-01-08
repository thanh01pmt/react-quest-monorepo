import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import ReactPlayer from 'react-player';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { BlocklyRenderer } from '../BlocklyRenderer';
import './GuideRenderer.css';

export interface GuideRendererProps {
    guideUrl?: string;
    content?: string;
    onRunCode?: (mapId: string, xml: string) => void;
    onEditBlock?: (line: number, xml: string, mapId?: string) => void;
    showSourceLine?: boolean;
    onElementClick?: (line: number) => void;
    useDynamicHeight?: boolean;
}


export const GuideRenderer: React.FC<GuideRendererProps> = ({
    guideUrl,
    content: initialContent,
    onRunCode,
    onEditBlock,
    showSourceLine = false,
    onElementClick,
    useDynamicHeight = false
}) => {
    const { t } = useTranslation();
    const [dynamicHeights, setDynamicHeights] = useState<Record<number, number>>({});

    const [, forceUpdate] = useState(0);

    // Stable callback for height changes with threshold filtering
    const handleHeightChange = useCallback((line: number, height: number, minHeight: number) => {
        const adjustedHeight = Math.max(height, minHeight);
        setDynamicHeights(prev => {
            const current = prev[line];
            if (current !== undefined && Math.abs(current - adjustedHeight) < 5) {
                return prev;
            }
            // Force re-render after updating heights
            setTimeout(() => forceUpdate(n => n + 1), 0);
            return { ...prev, [line]: adjustedHeight };
        });
    }, [forceUpdate]);

    // Use ref to store latest dynamicHeights without causing re-renders
    const dynamicHeightsRef = useRef(dynamicHeights);
    useEffect(() => {
        dynamicHeightsRef.current = dynamicHeights;
    }, [dynamicHeights]);

    const [content, setContent] = useState<string>(initialContent || '');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (initialContent !== undefined) {
            // Apply same regex fix for direct content to preserve Blockly tags formatting
            const processedText = initialContent.replace(/([^\n])\n(\s*)<(blocklyxml|BlocklyXML)/gi, '$1\n\n$2<$3');
            setContent(processedText);
            setLoading(false);
            setError(null);
            return;
        }

        if (!guideUrl) {
            setLoading(false);
            return;
        }

        setLoading(true);
        fetch(guideUrl)
            .then(response => {
                if (!response.ok) throw new Error("Failed to load guide");
                return response.text();
            })
            .then(text => {
                const processedText = text.replace(/([^\n])\n(\s*)<(blocklyxml|BlocklyXML)/gi, '$1\n\n$2<$3');
                setContent(processedText);
                setLoading(false);
                setError(null);
            })
            .catch(err => {
                if (guideUrl && (guideUrl.startsWith('#') || guideUrl.includes('\n'))) {
                    setContent(guideUrl);
                    setLoading(false);
                } else {
                    setError(err.message);
                    setLoading(false);
                }
            });
    }, [guideUrl, initialContent]);

    // Memoize renderBlocklyXML to prevent infinite re-render loops
    // MUST be defined before early returns (React hooks rule)
    const renderBlocklyXML = useCallback(({ node, children, ...props }: any) => {
        const xmlContent = extractTextFromChildren(children).trim();
        const mapId = props.mapid || props.mapId;

        // Debug logging
        console.log('[GuideRenderer] renderBlocklyXML called:', {
            xmlLength: xmlContent.length,
            mapId,
            useDynamicHeight,
            xmlPreview: xmlContent.substring(0, 100)
        });

        const sourceLine = node?.position?.start?.line;

        // Initial calculated height as a fallback/starting point
        let height = props.height;
        if (!height) {
            const blockCount = (xmlContent.match(/<block/gi) || []).length;
            const buttonPadding = (onRunCode && mapId) ? 70 : 0;

            // Use larger base heights for dynamic mode to ensure content is visible initially
            const baseHeights: Record<number, number> = useDynamicHeight
                ? { 0: 200, 1: 250, 2: 300, 3: 400 }
                : { 0: 100, 1: 150, 2: 200, 3: 260 };
            const staticHeight = (baseHeights[blockCount] || (blockCount * 55 + 100)) + buttonPadding;

            // If dynamic height for this specific sourceLine exists, use it
            if (useDynamicHeight && sourceLine && dynamicHeightsRef.current[sourceLine]) {
                height = `${dynamicHeightsRef.current[sourceLine]}px`;
            } else {
                height = `${Math.min(staticHeight, 1200)}px`;
            }
        }

        const extraProps = showSourceLine && sourceLine ? {
            'data-source-line': sourceLine,
            onClick: () => onElementClick?.(sourceLine),
            style: { cursor: onElementClick ? 'pointer' : 'default' }
        } : {};

        return (
            <div className="blockly-xml-block" style={{ height, minHeight: height, marginBottom: '24px', position: 'relative' }} {...extraProps}>
                {/* Edit and Run Code buttons - top right, next to Blockly toolbar */}
                {(onEditBlock || (onRunCode && mapId)) && sourceLine && (
                    <div style={{
                        position: 'absolute',
                        top: '12px',
                        right: '160px', // Increased to ensure clear separation from toolbar
                        zIndex: 50,
                        display: 'flex',
                        gap: '8px'
                    }}>
                        {onEditBlock && (
                            <button
                                className="btn-edit-block"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEditBlock(sourceLine, xmlContent, mapId);
                                }}
                                title="Edit this block"
                            >
                                ✏️ Edit
                            </button>
                        )}
                        {onRunCode && mapId && (
                            <button
                                className="btn-run-code"
                                onClick={() => onRunCode(mapId, xmlContent)}
                            >
                                ▶ Run Code
                            </button>
                        )}
                    </div>
                )}
                {xmlContent ? (
                    <BlocklyRenderer
                        xml={xmlContent}
                        height={height}
                        frameless={true}
                        showControls={true}
                        onHeightChange={(newHeight) => {
                            if (useDynamicHeight && sourceLine) {
                                const minH = (onRunCode && mapId ? 140 : 80);
                                handleHeightChange(sourceLine, newHeight, minH);
                            }
                        }}
                    />
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', border: '1px dashed #ccc', color: '#888' }}>
                        (Empty XML)
                    </div>
                )}
            </div>
        );
    }, [useDynamicHeight, onRunCode, onEditBlock, showSourceLine, onElementClick]);

    if (loading) return <div className="guide-loading">Loading guide...</div>;
    // Removed strict error view to allow fallback content display attempt
    if (error && !content) return <div className="guide-error">Error: {error}</div>;

    const renderQuiz = ({ children }: any) => {
        const quizXml = extractTextFromChildren(children).trim();
        const questionMatch = quizXml.match(/<Question>(.*?)<\/Question>/i);
        const optionsMatches = [...quizXml.matchAll(/<Option(.*?)>(.*?)<\/Option>/gi)];

        return (
            <div className="quiz-block-wrapper" style={{ marginBottom: '24px' }}>
                {questionMatch && <div className="quiz-question"><strong>Q: </strong>{questionMatch[1]}</div>}
                {optionsMatches.map((opt, i) => {
                    const isCorrect = opt[1].includes('correct="true"');
                    return (
                        <div key={i} className={`quiz-option ${isCorrect ? 'correct-debug' : ''}`}>
                            <label>
                                <input type="radio" name={`quiz-${Math.random()}`} /> {opt[2]}
                            </label>
                        </div>
                    );
                })}
            </div>
        );
    };

    // Help with quiz tags
    const quizComponents = {
        question: ({ children }: any) => <div className="quiz-question"><strong>Q: </strong>{children}</div>,
        option: ({ children, ...props }: any) => {
            const isCorrect = props.correct === 'true';
            return (
                <div className={`quiz-option ${isCorrect ? 'correct-debug' : ''}`}>
                    <label>
                        <input type="radio" name="quiz-radio" /> {children}
                    </label>
                </div>
            )
        }
    };

    const renderVideo = ({ children, ...props }: any) => {
        let url = props.url || props.src;
        if (!url) return null;

        // Convert YouTube URLs to embed format
        let embedUrl = url;
        let isYouTube = false;

        // Handle youtu.be/VIDEO_ID format
        if (url.includes('youtu.be/')) {
            const videoId = url.split('youtu.be/')[1]?.split('?')[0]?.split('&')[0];
            if (videoId) {
                embedUrl = `https://www.youtube.com/embed/${videoId}`;
                isYouTube = true;
            }
        }
        // Handle youtube.com/watch?v=VIDEO_ID format
        else if (url.includes('youtube.com/watch')) {
            const urlParams = new URLSearchParams(url.split('?')[1]);
            const videoId = urlParams.get('v');
            if (videoId) {
                embedUrl = `https://www.youtube.com/embed/${videoId}`;
                isYouTube = true;
            }
        }
        // Handle already embed format
        else if (url.includes('youtube.com/embed/')) {
            isYouTube = true;
            embedUrl = url;
        }

        console.log('[GuideRenderer] renderVideo:', { originalUrl: url, embedUrl, isYouTube });

        // Use iframe for YouTube
        if (isYouTube) {
            return (
                <div className="guide-video-wrapper" style={{ margin: '20px 0', borderRadius: '8px', overflow: 'hidden' }}>
                    <iframe
                        width="100%"
                        height="360"
                        src={embedUrl}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                        style={{ borderRadius: '8px' }}
                    />
                </div>
            );
        }

        // Use ReactPlayer for other video sources
        return (
            <div className="guide-video-wrapper" style={{ margin: '20px 0', borderRadius: '8px', overflow: 'hidden' }}>
                <ReactPlayer
                    {...({
                        url: embedUrl,
                        controls: true,
                        width: "100%",
                        height: "360px"
                    } as any)}
                />
            </div>
        );
    };

    // Custom Image renderer for <Image> tag and markdown ![](url)
    const renderImage = ({ children, ...props }: any) => {
        const src = props.src || props.url;
        const alt = props.alt || props.title || 'Image';
        const caption = props.caption;

        if (!src) return null;

        return (
            <figure className="guide-image-wrapper" style={{ margin: '20px 0', textAlign: 'center' }}>
                <img
                    src={src}
                    alt={alt}
                    style={{
                        maxWidth: '100%',
                        height: 'auto',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                />
                {caption && (
                    <figcaption style={{ marginTop: '8px', color: '#666', fontSize: '14px', fontStyle: 'italic' }}>
                        {caption}
                    </figcaption>
                )}
            </figure>
        );
    };

    const renderCode = ({ node, inline, className, children, ...props }: any) => {
        const match = /language-(\w+)/.exec(className || '');
        const language = match ? match[1] : null;

        if (!inline && language) {
            return (
                <SyntaxHighlighter
                    {...props}
                    children={String(children).replace(/\n$/, '')}
                    style={vscDarkPlus}
                    language={language}
                    PreTag="div"
                    customStyle={{ borderRadius: '8px', margin: '16px 0' }}
                />
            );
        }
        return (
            <code className={className} {...props} style={!inline ? {} : { backgroundColor: 'rgba(27,31,35,0.05)', padding: '0.2em 0.4em', borderRadius: '3px', fontFamily: 'monospace' }}>
                {children}
            </code>
        );
    };

    return (
        <div className="guide-renderer markdown-body">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                    blocklyxml: renderBlocklyXML,
                    BlocklyXML: renderBlocklyXML,
                    quiz: renderQuiz,
                    Quiz: renderQuiz,
                    video: renderVideo,
                    Video: renderVideo,
                    img: renderImage,
                    Image: renderImage,
                    code: renderCode,
                    p: ({ node, children, ...props }: any) => {
                        const line = node?.position?.start?.line;
                        const { isInline, ...cleanProps } = props; // Filter out markdown-specific props
                        return (
                            <div
                                {...cleanProps}
                                data-source-line={showSourceLine ? line : undefined}
                                onClick={showSourceLine && line ? () => onElementClick?.(line) : undefined}
                                style={{
                                    marginBottom: '20px',
                                    cursor: showSourceLine && onElementClick ? 'pointer' : 'inherit',
                                    ...(props.style || {})
                                }}
                            >
                                {children}
                            </div>
                        );
                    },
                    h1: ({ node, children, ...props }: any) => {
                        const line = node?.position?.start?.line;
                        const { isInline, ...cleanProps } = props;
                        return (
                            <h1
                                {...cleanProps}
                                data-source-line={showSourceLine ? line : undefined}
                                onClick={showSourceLine && line ? () => onElementClick?.(line) : undefined}
                                style={{
                                    cursor: showSourceLine && onElementClick ? 'pointer' : 'inherit',
                                    ...(props.style || {})
                                }}
                            >
                                {children}
                            </h1>
                        );
                    },
                    h2: ({ node, children, ...props }: any) => {
                        const line = node?.position?.start?.line;
                        const { isInline, ...cleanProps } = props;
                        return (
                            <h2
                                {...cleanProps}
                                data-source-line={showSourceLine ? line : undefined}
                                onClick={showSourceLine && line ? () => onElementClick?.(line) : undefined}
                                style={{
                                    cursor: showSourceLine && onElementClick ? 'pointer' : 'inherit',
                                    ...(props.style || {})
                                }}
                            >
                                {children}
                            </h2>
                        );
                    },
                    h3: ({ node, children, ...props }: any) => {
                        const line = node?.position?.start?.line;
                        const { isInline, ...cleanProps } = props;
                        return (
                            <h3
                                {...cleanProps}
                                data-source-line={showSourceLine ? line : undefined}
                                onClick={showSourceLine && line ? () => onElementClick?.(line) : undefined}
                                style={{
                                    cursor: showSourceLine && onElementClick ? 'pointer' : 'inherit',
                                    ...(props.style || {})
                                }}
                            >
                                {children}
                            </h3>
                        );
                    },
                    ...quizComponents
                } as any}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};

// Helper to extract text from React children, preserving tags for XML content
// Helper to extract text from React children, preserving tags for XML content
function extractTextFromChildren(children: any): string {
    if (!children) return '';
    if (typeof children === 'string') return children;
    if (typeof children === 'number') return String(children);
    if (Array.isArray(children)) return children.map(extractTextFromChildren).join('');

    // Handle standard React elements or rehype nodes
    if (children.type) {
        let tag = '';
        if (typeof children.type === 'string') {
            tag = children.type;
        } else if (children.type.name) {
            tag = children.type.name;
        } else if (children.type.displayName) {
            tag = children.type.displayName;
        }

        const props = children.props || {};
        const lowTag = tag ? tag.toLowerCase() : '';

        // If it's a known non-XML tag (common HTML wrappers in MD), just process children
        const htmlWrappers = ['p', 'div', 'span', 'section'];

        // Reconstruct any other tag as XML (this covers xml, block, field, etc.)
        if (lowTag && !htmlWrappers.includes(lowTag)) {
            const attrStrings = Object.entries(props)
                .filter(([key, value]) => {
                    const lowKey = key.toLowerCase();
                    // Basic heuristic to exclude React-internal props and nested children
                    return !['children', 'node', 'isinline', 'isInline', 'className'].includes(lowKey) &&
                        (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean');
                })
                .map(([key, value]) => {
                    // Handle special cases or just return key="value"
                    return `${key}="${value}"`;
                });

            // Re-add class if it exists
            if (props.className) {
                attrStrings.push(`class="${props.className}"`);
            }

            const attrs = attrStrings.length > 0 ? ' ' + attrStrings.join(' ') : '';

            if (props.children) {
                return `<${lowTag}${attrs}>${extractTextFromChildren(props.children)}</${lowTag}>`;
            } else {
                return `<${lowTag}${attrs}/>`;
            }
        }

        // If it's a wrapper like p or div inside blocklyxml, just extract text from children
        if (props.children) {
            return extractTextFromChildren(props.children);
        }
    }

    // rehype-raw text nodes
    if (children.value && typeof children.value === 'string') {
        return children.value;
    }

    return '';
}
