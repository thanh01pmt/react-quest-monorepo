import React, { useState, useRef } from 'react';
import './ScratchUploader.css';

interface ScratchUploaderProps {
    questId: string;
    onUpload: (file: File) => Promise<void>;
    disabled?: boolean;
}

export function ScratchUploader({ questId, onUpload, disabled }: ScratchUploaderProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
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

    const handleUploadClick = async () => {
        if (!file || isUploading) return;

        setIsUploading(true);
        setError(null);

        try {
            await onUpload(file);
            setFile(null); // Clear after upload
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (err: any) {
            setError(err.message || 'Lỗi khi tải lên tệp tin.');
        } finally {
            setIsUploading(false);
        }
    };

    const triggerFileInput = () => {
        if (disabled || isUploading) return;
        fileInputRef.current?.click();
    };

    return (
        <div className={`scratch-uploader-container ${disabled ? 'uploader-disabled' : ''}`}>
            <div 
                className={`upload-zone ${file ? 'file-selected' : ''}`}
                onClick={triggerFileInput}
            >
                <div className="upload-icon">
                    <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="2">
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
                        <p className="primary-text">Nhấn để chọn file .sb3</p>
                        <p className="secondary-text">Hoặc kéo thả file vào đây</p>
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

            {error && <div className="uploader-error-msg">{error}</div>}

            <button 
                className={`submit-sb3-btn ${!file || isUploading ? 'btn-disabled' : ''}`}
                onClick={handleUploadClick}
                disabled={!file || isUploading || disabled}
            >
                {isUploading ? (
                    <>
                        <span className="spinner-border"></span>
                        Đang nộp bài...
                    </>
                ) : (
                    'Nộp bài Scratch'
                )}
            </button>
        </div>
    );
}
