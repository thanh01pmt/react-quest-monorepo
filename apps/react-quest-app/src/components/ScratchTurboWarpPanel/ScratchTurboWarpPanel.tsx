import React, { useState, useEffect, useCallback } from 'react';
import { MarkdownRenderer } from '@repo/quest-player';
import { ScratchEditor } from '../ScratchEditor/ScratchEditor';
import { ScratchUploader } from '../ScratchUploader/ScratchUploader';
import { getSubmissionHistory, getSubmissionDetail } from '../../services/SupabaseContestService';
import { TestcaseGrid } from '../ScratchQuestPanel/TestcaseGrid';
import './ScratchTurboWarpPanel.css';

interface ScratchTurboWarpPanelProps {
	quest: any;
	contestId?: string;
	onUpload: (file: File, isDryRun?: boolean) => Promise<any>;
	disabled?: boolean;
}

export function ScratchTurboWarpPanel({
	quest,
	contestId,
	onUpload,
	disabled,
}: ScratchTurboWarpPanelProps) {
	const questId = quest.id;
	const title = quest.title || quest.titleKey;
	const description = quest.description || quest.hints?.description || quest.descriptionKey;
	const gameConfig = quest.gameConfig || {};
	const [history, setHistory] = useState<any[]>([]);
	const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
	const [isLoadingDetail, setIsLoadingDetail] = useState(false);
	const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

	const fetchHistory = useCallback(async () => {
		try {
			const data = await getSubmissionHistory(questId, contestId);
			setHistory(data);
			if (data.length > 0 && !selectedSubmission) {
				fetchDetail(data[0].id);
			}
		} catch (err) {
			console.error('Lỗi khi lấy lịch sử:', err);
		}
	}, [questId, contestId, selectedSubmission]);

	const fetchDetail = async (submissionId: string) => {
		setIsLoadingDetail(true);
		try {
			const detail = await getSubmissionDetail(submissionId);
			setSelectedSubmission(detail);
		} catch (err) {
			console.error('Lỗi khi lấy chi tiết bài nộp:', err);
		} finally {
			setIsLoadingDetail(false);
		}
	};

	useEffect(() => {
		fetchHistory();
	}, [fetchHistory]);

	// Polling for pending status
	useEffect(() => {
		let pollInterval: NodeJS.Timeout | null = null;
		if (selectedSubmission && selectedSubmission.status === 'pending') {
			pollInterval = setInterval(async () => {
				try {
					const detail = await getSubmissionDetail(selectedSubmission.id);
					if (detail.status !== 'pending') {
						setSelectedSubmission(detail);
						fetchHistory();
						if (pollInterval) clearInterval(pollInterval);
					}
				} catch (err) {
					console.error('Polling error:', err);
				}
			}, 3000);
		}
		return () => { if (pollInterval) clearInterval(pollInterval); };
	}, [selectedSubmission?.id, selectedSubmission?.status, fetchHistory]);

	const handleUploadComplete = async (file: File, isDryRun?: boolean) => {
		const result = await onUpload(file, isDryRun);
		if (result && result.submissionId) {
			await fetchDetail(result.submissionId);
			fetchHistory();
		}
		return result;
	};

	return (
		<div className={`scratch-turbowarp-panel ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
			<div className="main-editor-area">
				<ScratchEditor projectId="0" />
			</div>

			<aside className="sidebar-container">
				<button 
					className="collapse-toggle" 
					onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
					title={isSidebarCollapsed ? "Mở rộng bảng điều khiển" : "Thu gọn bảng điều khiển"}
				>
					{isSidebarCollapsed ? '◀' : '▶'}
				</button>

				{!isSidebarCollapsed && (
					<div className="sidebar-content">
						<div className="sidebar-section problem-info">
							<div className="section-header">
								<span className="icon">📝</span>
								<h2 className="problem-title">{title}</h2>
							</div>
							<div className="problem-description scrollable">
								<MarkdownRenderer content={description || 'Không có mô tả cho đề bài này.'} />
							</div>
						</div>

						{/* Starter Project Section */}
						{(gameConfig.starterSb3Url || gameConfig.scratchProjectId) && (
							<div className="sidebar-section starter-project">
								<div className="section-header">
									<span className="icon">🚀</span>
									<h3>Dự án mẫu</h3>
								</div>
								<div className="starter-actions">
									{gameConfig.starterSb3Url && (
										<a 
											href={gameConfig.starterSb3Url} 
											className="action-btn download-btn"
											target="_blank" 
											rel="noopener noreferrer"
										>
											📥 Tải file mẫu (.sb3)
										</a>
									)}
									{gameConfig.scratchProjectId && (
										<button 
											className="action-btn open-btn"
											onClick={() => window.open(`https://turbowarp.org/${gameConfig.scratchProjectId}/editor`, '_blank')}
										>
											🎨 Mở trong TurboWarp
										</button>
									)}
								</div>
								<p className="hint-text small">Tải file mẫu về máy, sau đó mở bằng trình chỉnh sửa để bắt đầu làm bài.</p>
							</div>
						)}

						<div className="sidebar-divider" />

						<div className="sidebar-section submission-area">
							<div className="section-header">
								<span className="icon">📤</span>
								<h3>Nộp bài làm</h3>
							</div>
							<ScratchUploader
								questId={questId}
								onUpload={handleUploadComplete}
								disabled={disabled}
							/>
						</div>

						<div className="sidebar-divider" />

						<div className="sidebar-section results-area scrollable">
							<div className="section-header">
								<span className="icon">📊</span>
								<h3>Kết quả chấm bài</h3>
								<button className="refresh-btn" onClick={fetchHistory} title="Cập nhật kết quả">🔄</button>
							</div>
							
							{isLoadingDetail ? (
								<div className="loading-mini">
									<div className="spinner-mini"></div>
									<span>Đang chấm...</span>
								</div>
							) : selectedSubmission ? (
								<div className="result-container">
									<div className="submission-meta">
										<span className="status-badge" data-status={selectedSubmission.status}>
											{selectedSubmission.status === 'accepted' ? '✅ Hoàn thành' : 
											 selectedSubmission.status === 'pending' ? '⏳ Đang chờ' : '❌ Chưa đạt'}
										</span>
										<span className="score-badge">{selectedSubmission.score || 0}/100</span>
									</div>
									<TestcaseGrid 
										judgeLog={selectedSubmission.judge_log} 
										score={selectedSubmission.score} 
									/>
								</div>
							) : (
								<div className="empty-results">
									<p>Chưa có kết quả. Hãy nộp bài để xem chi tiết.</p>
								</div>
							)}
						</div>
					</div>
				)}
			</aside>
		</div>
	);
}
