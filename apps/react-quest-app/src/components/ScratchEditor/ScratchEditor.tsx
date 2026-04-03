import React, { useState } from 'react';
import './ScratchEditor.css';

interface ScratchEditorProps {
	projectId?: string;
	className?: string;
}

/**
 * ScratchEditor
 *
 * TurboWarp does NOT allow embedding the editor in an iframe (by design).
 * Only the /embed player URL is embeddable.
 *
 * This component guides students to open TurboWarp in a new tab,
 * work on their project, export as .sb3, then upload it back.
 */
export function ScratchEditor({ projectId, className = '' }: ScratchEditorProps) {
	const [copied, setCopied] = useState(false);

	// If projectId is a valid numeric Scratch project ID, link to it directly
	const isNumericId = projectId && /^\d+$/.test(projectId) && projectId !== '0';
	const turbowarpUrl = isNumericId
		? `https://turbowarp.org/${projectId}/editor`
		: 'https://turbowarp.org/editor';

	const handleOpen = () => {
		window.open(turbowarpUrl, '_blank', 'noopener,noreferrer');
	};

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(turbowarpUrl);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			// ignore
		}
	};

	return (
		<div className={`scratch-editor-launcher ${className}`}>
			{/* Header */}
			<div className="sel-header">
				<img
					src="https://turbowarp.org/favicon.ico"
					alt="TurboWarp"
					className="sel-logo"
					onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
				/>
				<div className="sel-header-text">
					<h2 className="sel-title">TurboWarp Scratch Editor</h2>
					<p className="sel-subtitle">Trình soạn thảo Scratch tốc độ cao</p>
				</div>
			</div>

			{/* Steps */}
			<div className="sel-steps">
				<div className="sel-step">
					<div className="sel-step-number">1</div>
					<div className="sel-step-body">
						<span className="sel-step-title">Mở TurboWarp Editor</span>
						<span className="sel-step-desc">Nhấn nút bên dưới để mở trình soạn thảo Scratch trong tab mới.</span>
					</div>
				</div>
				<div className="sel-step">
					<div className="sel-step-number">2</div>
					<div className="sel-step-body">
						<span className="sel-step-title">Lập trình bài của bạn</span>
						<span className="sel-step-desc">Xây dựng chương trình Scratch theo yêu cầu đề bài ở bảng bên phải.</span>
					</div>
				</div>
				<div className="sel-step">
					<div className="sel-step-number">3</div>
					<div className="sel-step-body">
						<span className="sel-step-title">Lưu & Nộp file .sb3</span>
						<span className="sel-step-desc">
							Trong TurboWarp: <strong>File → Save to your computer</strong>. Sau đó nộp file .sb3 qua bảng bên phải.
						</span>
					</div>
				</div>
			</div>

			{/* CTA */}
			<div className="sel-actions">
				<button className="sel-open-btn" onClick={handleOpen}>
					<svg className="sel-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
						<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
						<polyline points="15 3 21 3 21 9" />
						<line x1="10" y1="14" x2="21" y2="3" />
					</svg>
					Mở TurboWarp Editor
				</button>

				<button className="sel-copy-btn" onClick={handleCopy} title="Sao chép link TurboWarp">
					{copied ? (
						<>
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
								<polyline points="20 6 9 17 4 12" />
							</svg>
							Đã sao chép!
						</>
					) : (
						<>
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
								<rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
								<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
							</svg>
							Sao chép link
						</>
					)}
				</button>
			</div>

			{/* Tip */}
			<div className="sel-tip">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
					<circle cx="12" cy="12" r="10" />
					<line x1="12" y1="8" x2="12" y2="12" />
					<line x1="12" y1="16" x2="12.01" y2="16" />
				</svg>
				<span>Bạn có thể giữ TurboWarp mở song song và nộp bài nhiều lần để kiểm tra điểm.</span>
			</div>
		</div>
	);
}
