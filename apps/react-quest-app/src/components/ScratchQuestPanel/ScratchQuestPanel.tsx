import React, { useState, useEffect, useCallback } from 'react';
import { MarkdownRenderer } from '@repo/quest-player';
import { ScratchUploader } from '../ScratchUploader/ScratchUploader';
import { getSubmissionHistory, getSubmissionDetail } from '../../services/SupabaseContestService';
import { TestcaseGrid } from './TestcaseGrid';
import { SubmissionHistory } from './SubmissionHistory';
import './ScratchQuestPanel.css';

interface ScratchQuestPanelProps {
	quest: any;
	contestId?: string;
	onUpload: (file: File, isDryRun?: boolean) => Promise<any>;
	disabled?: boolean;
}

type TabType = 'problem' | 'submit' | 'results' | 'history';

export function ScratchQuestPanel({
	quest,
	contestId,
	onUpload,
	disabled,
}: ScratchQuestPanelProps) {
	const questId = quest.id;
	const title = quest.title || quest.titleKey;
	const description = quest.description || quest.hints?.description || quest.descriptionKey;
	const gameConfig = quest.gameConfig || {};
	const [history, setHistory] = useState<any[]>([]);
	const [isLoadingHistory, setIsLoadingHistory] = useState(false);
	const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
	const [isLoadingDetail, setIsLoadingDetail] = useState(false);

	const fetchHistory = useCallback(async () => {
		setIsLoadingHistory(true);
		try {
			const data = await getSubmissionHistory(questId, contestId);
			setHistory(data);
			// Auto select the latest submission if none selected or if new submission added
			if (data.length > 0) {
				fetchDetail(data[0].id);
			}
		} catch (err) {
			console.error('Lỗi khi lấy lịch sử:', err);
		} finally {
			setIsLoadingHistory(false);
		}
	}, [questId, contestId]);

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
	}, [questId, contestId]);

	// Polling for pending status
	useEffect(() => {
		let pollInterval: NodeJS.Timeout | null = null;

		if (selectedSubmission && selectedSubmission.status === 'pending') {
			pollInterval = setInterval(async () => {
				try {
					const detail = await getSubmissionDetail(selectedSubmission.id);
					if (detail.status !== 'pending') {
						setSelectedSubmission(detail);
						fetchHistory(); // Refresh to get updated score
						if (pollInterval) clearInterval(pollInterval);
					}
				} catch (err) {
					console.error('Polling error:', err);
				}
			}, 3000);
		}

		return () => {
			if (pollInterval) clearInterval(pollInterval);
		};
	}, [selectedSubmission?.id, selectedSubmission?.status, questId, contestId, fetchHistory]);

	const handleUploadComplete = async (file: File, isDryRun?: boolean) => {
		const result = await onUpload(file, isDryRun);
		if (result && result.submissionId) {
			await fetchDetail(result.submissionId);
			fetchHistory();
		}
		return result;
	};

	return (
		<div className="scratch-quest-panel">
			<div className="panel-layout">
				{/* Left Column: Problem Statement */}
				<div className="column-problem">
					<div className="problem-header">
						<h1 className="problem-title">{title}</h1>
						<div className="problem-meta-info">
							{history.length > 0 && (
								<div className="best-score-container">
									<span className="label">Điểm cao nhất</span>
									<span className="value">{Math.max(...history.map(s => s.score || 0))} / 100</span>
								</div>
							)}
						</div>
					</div>
					
					<div className="problem-body">
						<div className="section-title">Nội dung đề bài</div>
						<div className="problem-description-box scrollable">
							{description ? (
								<MarkdownRenderer content={description} />
							) : (
								<p className="no-desc">Không có mô tả cho đề bài này.</p>
							)}
						</div>

						{/* Starter Project Section */}
						{(gameConfig.starterSb3Url || gameConfig.scratchProjectId) && (
							<div className="starter-project-box glass-card">
								<div className="card-header">
									<span className="icon">🚀</span>
									<h3>Tài liệu & Dự án mẫu</h3>
								</div>
								<div className="starter-content">
									<p>Bạn nên bắt đầu từ dự án mẫu để đảm bảo đúng yêu cầu kỹ thuật.</p>
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
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Right Column: Submission & Results */}
				<div className="column-submission">
					<div className="submission-stack">
						<div className="glass-card upload-section">
							<div className="card-header">
								<span className="icon">📤</span>
								<h3>Nộp bài làm</h3>
							</div>
							<ScratchUploader
								questId={questId}
								onUpload={handleUploadComplete}
								disabled={disabled}
							/>
						</div>

						<div className="glass-card result-section">
							<div className="card-header">
								<span className="icon">📊</span>
								<h3>Kết quả chấm bài</h3>
								{selectedSubmission?.is_dry_run && <span className="dry-badge">CHẠY THỬ</span>}
							</div>
							
							{isLoadingDetail ? (
								<div className="loading-state">
									<div className="spinner"></div>
									<p>Đang chấm bài...</p>
								</div>
							) : selectedSubmission ? (
								<div className="result-container">
									<div className="submission-ts">
										Đã nộp: {new Date(selectedSubmission.submitted_at).toLocaleTimeString('vi-VN')}
									</div>
									<TestcaseGrid 
										judgeLog={selectedSubmission.judge_log} 
										score={selectedSubmission.score} 
									/>
								</div>
							) : (
								<div className="empty-state">
									<p>Hãy nộp file .sb3 để xem kết quả chi tiết tại đây.</p>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
