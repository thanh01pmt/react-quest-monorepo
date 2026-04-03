import React, { useState } from 'react';
import './ScratchEditor.css';

interface ScratchEditorProps {
	projectId?: string;
	className?: string;
}

export function ScratchEditor({ projectId = '0', className = '' }: ScratchEditorProps) {
	const [isLoading, setIsLoading] = useState(true);

	const url = `https://turbowarp.org/editor?embed&project_url=${encodeURIComponent(projectId)}`;

	return (
		<div className={`scratch-editor-container ${className}`}>
			{isLoading && (
				<div className="editor-loading">
					<div className="spinner"></div>
					<p>Đang tải Scratch Editor...</p>
				</div>
			)}
			<iframe
				src={url}
				className="scratch-iframe"
				allowTransparency={true}
				allowFullScreen={true}
				allow="geolocation; microphone; camera; midi; bluetooth; clipboard-read; clipboard-write; usb"
				frameBorder="0"
				onLoad={() => setIsLoading(false)}
			/>
		</div>
	);
}
