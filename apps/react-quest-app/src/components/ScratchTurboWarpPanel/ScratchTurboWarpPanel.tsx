import React, { useState, useEffect, useCallback } from 'react';
import { MarkdownRenderer } from '@repo/quest-player';
import { ScratchEditor } from '../ScratchEditor/ScratchEditor';
import { ScratchUploader } from '../ScratchUploader/ScratchUploader';
import { getSubmissionHistory, getSubmissionDetail } from '../../services/SupabaseContestService';
import { TestcaseGrid } from '../ScratchQuestPanel/TestcaseGrid';
import './ScratchTurboWarpPanel.css';

interface ScratchTurboWarpPanelProps {
	questId: string;
	title?: string;
	description?: string;
	contestId?: string;
	onUpload: (file: File, isDryRun?: boolean) => Promise<any>;
	disabled?: boolean;
}

export function ScratchTurboWarpPanel({
	questId,
	title,
	description,
	contestId,
	onUpload,
	disabled,
}: ScratchTurboWarpPanelProps) {
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
							<h2 className="problem-title">{title}</h2>
							<div className="problem-description scrollable">
								<MarkdownRenderer content={description || 'Không có mô tả cho đề bài này.'} />
							</div>
						</div>

						<div className="sidebar-divider" />

						<div className="sidebar-section submission-area">
							<div className="section-header">
								<span className="icon">📤</span>
								<h3>Nộp bài (.sb3)</h3>
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
							</div>
							{isLoadingDetail ? (
								<div className="loading-mini">
									<div className="spinner-mini"></div>
									<span>Đang chấm...</span>
								</div>
							) : selectedSubmission ? (
								<TestcaseGrid 
									judgeLog={selectedSubmission.judge_log} 
									score={selectedSubmission.score} 
								/>
							) : (
								<p className="hint-text">Nộp file để xem kết quả.</p>
							)}
						</div>
					</div>
				)}
			</aside>
		</div>
	);
}
