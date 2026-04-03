import React, { useState, useRef } from 'react';
import './ScratchUploader.css';

interface ScratchUploaderProps {
    questId: string;
    onUpload: (file: File, isDryRun?: boolean) => Promise<any>;
    disabled?: boolean;
}

export function ScratchUploader({ questId, onUpload, disabled }: ScratchUploaderProps) {
    const [inputUrl, setInputUrl] = useState('');
    const [isFetching, setIsFetching] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        setError(null);
        
        if (selectedFile) {
            if (!selectedFile.name.endsWith('.sb3')) {
                setError('Vui lòng chọn file Scratch (.sb3)');
                setFile(null);
                return;
            }
            setFile(selectedFile);
        }
    };

    const extractProjectId = (url: string) => {
        const match = url.match(/projects\/(\d+)/);
        return match ? match[1] : url.trim();
    };

    const handleFetchUrl = async () => {
        if (!inputUrl || isFetching) return;
        setIsFetching(true);
        setError(null);

        try {
            const { downloadProjectFromID } = await import('@turbowarp/sbdl');
            const projectId = extractProjectId(inputUrl);
            
            if (!/^\d+$/.test(projectId)) {
                throw new Error('ID dự án không hợp lệ. Vui lòng nhập link hoặc ID số.');
            }

            const project = await downloadProjectFromID(projectId);
            const blob = new Blob([project.arrayBuffer], { type: 'application/zip' });
            const fetchedFile = new File([blob], `project_${projectId}.sb3`, { type: 'application/zip' });
            
            setFile(fetchedFile);
        } catch (err: any) {
            setError(err.message || 'Lỗi khi tải project từ Scratch.');
        } finally {
            setIsFetching(false);
        }
    };

    const handleCheckClick = async () => {
        if (!file || isUploading) return;
        setIsUploading(true);
        setError(null);
        try {
            await onUpload(file, true); // true = isDryRun
        } catch (err: any) {
            setError(err.message || 'Lỗi khi kiểm tra bài.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleUploadClick = async () => {
        if (!file || isUploading) return;
        setIsUploading(true);
        setError(null);
        try {
            await onUpload(file, false); // false = official
            setFile(null); // Clear after official upload
            setInputUrl('');
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (err: any) {
            setError(err.message || 'Lỗi khi nộp bài.');
        } finally {
            setIsUploading(false);
        }
    };

    const triggerFileInput = () => {
        if (disabled || isUploading || isFetching) return;
        fileInputRef.current?.click();
    };

    return (
        <div className={`scratch-uploader-container ${disabled ? 'uploader-disabled' : ''}`}>
            <div className="method-switcher">
                <button 
                    className={`method-btn ${uploadMethod === 'file' ? 'active' : ''}`}
                    onClick={() => setUploadMethod('file')}
                >
                    Tải File
                </button>
                <button 
                    className={`method-btn ${uploadMethod === 'url' ? 'active' : ''}`}
                    onClick={() => setUploadMethod('url')}
                >
                    Link Scratch
                </button>
            </div>

            <div className="uploader-body">
                {uploadMethod === 'file' ? (
                    <div 
                        className={`upload-zone ${file ? 'file-selected' : ''}`}
                        onClick={triggerFileInput}
                    >
                        <div className="upload-icon">
                            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                            </svg>
                        </div>
                        
                        {file ? (
                            <div className="selected-file-info">
                                <span className="file-name">{file.name}</span>
                                <span className="file-size">({(file.size / 1024).toFixed(1)} KB)</span>
                            </div>
                        ) : (
                            <div className="upload-prompt">
                                <p>Nhấp để chọn file .sb3</p>
                            </div>
                        )}

                        <input 
                            type="file" 
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".sb3"
                            style={{ display: 'none' }}
                        />
                    </div>
                ) : (
                    <div className="url-fetch-area">
                        <div className="url-input-group">
                            <input 
                                type="text" 
                                placeholder="scratch.mit.edu/projects/..."
                                value={inputUrl}
                                onChange={(e) => setInputUrl(e.target.value)}
                                disabled={isFetching || isUploading || disabled}
                                className="url-input"
                            />
                            <button 
                                onClick={handleFetchUrl}
                                disabled={!inputUrl || isFetching || isUploading || disabled}
                                className="fetch-btn"
                            >
                                {isFetching ? <div className="dot-pulse" /> : 'Lấy bài'}
                            </button>
                        </div>
                        {file && (
                            <div className="fetched-preview">
                                <span className="check-icon">✓</span>
                                <span className="file-name">{file.name}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {error && <div className="uploader-error-msg">{error}</div>}

            <div className="uploader-actions">
                <button 
                    className="check-btn"
                    onClick={handleCheckClick}
                    disabled={!file || isUploading || isFetching || disabled}
                >
                    {isUploading ? 'Đang chạy...' : 'Kiểm tra'}
                </button>

                <button 
                    className="submit-btn"
                    onClick={handleUploadClick}
                    disabled={!file || isUploading || isFetching || disabled}
                >
                    {isUploading ? 'Đang nộp...' : 'Nộp bài'}
                </button>
            </div>
        </div>
    );
}
