import React, { useState, useEffect, useCallback } from 'react';
import { ScratchUploader } from '../ScratchUploader/ScratchUploader';
import { getSubmissionHistory, getSubmissionDetail } from '../../services/SupabaseContestService';
import { TestcaseGrid } from './TestcaseGrid';
import { SubmissionHistory } from './SubmissionHistory';
import './ScratchQuestPanel.css';

interface ScratchQuestPanelProps {
	questId: string;
	title?: string;
	description?: string;
	contestId?: string;
	onUpload: (file: File, isDryRun?: boolean) => Promise<any>;
	disabled?: boolean;
}

type TabType = 'problem' | 'submit' | 'results' | 'history';

export function ScratchQuestPanel({
	questId,
	title,
	description,
	contestId,
	onUpload,
	disabled,
}: ScratchQuestPanelProps) {
	const [activeTab, setActiveTab] = useState<TabType>('problem');
	const [history, setHistory] = useState<any[]>([]);
	const [isLoadingHistory, setIsLoadingHistory] = useState(false);
	const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
	const [isLoadingDetail, setIsLoadingDetail] = useState(false);

	const fetchHistory = useCallback(async () => {
		setIsLoadingHistory(true);
		try {
			const data = await getSubmissionHistory(questId, contestId);
			setHistory(data);
			// Auto select the latest submission if none selected
			if (data.length > 0 && !selectedSubmission) {
				fetchDetail(data[0].id);
			}
		} catch (err) {
			console.error('Lỗi khi lấy lịch sử:', err);
		} finally {
			setIsLoadingHistory(false);
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
	}, [questId, contestId]); // Only fetch on mount or if IDs change

	// Polling for pending status
	useEffect(() => {
		let pollInterval: NodeJS.Timeout | null = null;

		if (selectedSubmission && selectedSubmission.status === 'pending') {
			pollInterval = setInterval(async () => {
				try {
					const detail = await getSubmissionDetail(selectedSubmission.id);
					if (detail.status !== 'pending') {
						setSelectedSubmission(detail);
						// Also refresh history to update statuses there
						const data = await getSubmissionHistory(questId, contestId);
						setHistory(data);
						if (pollInterval) clearInterval(pollInterval);
					}
				} catch (err) {
					console.error('Polling error:', err);
				}
			}, 3000); // Poll every 3 seconds
		}

		return () => {
			if (pollInterval) clearInterval(pollInterval);
		};
	}, [selectedSubmission, questId, contestId]);

	const handleUploadComplete = async (file: File, isDryRun?: boolean) => {
		const result = await onUpload(file, isDryRun);
		// Refresh history and switch to results tab
		await fetchHistory();
		if (result && result.submissionId) {
			await fetchDetail(result.submissionId);
		}
		setActiveTab('results');
		return result;
	};

	const handleSelectSubmission = async (submission: any) => {
		await fetchDetail(submission.id);
		setActiveTab('results');
	};

	return (
		<div className="scratch-quest-panel">
			<div className="panel-tabs-header">
				<button
					className={`tab-button ${activeTab === 'problem' ? 'active' : ''}`}
					onClick={() => setActiveTab('problem')}
				>
					Đề bài
				</button>
				<button
					className={`tab-button ${activeTab === 'submit' ? 'active' : ''}`}
					onClick={() => setActiveTab('submit')}
				>
					Nộp bài
				</button>
				<button
					className={`tab-button ${activeTab === 'results' ? 'active' : ''}`}
					onClick={() => setActiveTab('results')}
				>
					Kết quả
				</button>
				<button
					className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
					onClick={() => setActiveTab('history')}
				>
					Lần nộp {history.length > 0 && `(${history.length})`}
				</button>
			</div>

			<div className="panel-content">
				{activeTab === 'problem' && (
					<div className="tab-pane-problem">
						<div className="problem-title-with-score">
							<h2>{title}</h2>
							{history.length > 0 && (
								<div className="best-score-badge">
									Điểm cao nhất: {Math.max(...history.map(s => s.score || 0))}
								</div>
							)}
						</div>
						<div className="problem-description-content">
							{description ? (
								<div dangerouslySetInnerHTML={{ __html: description.replace(/\n/g, '<br/>') }} />
							) : (
								<p>Không có mô tả cho đề bài này.</p>
							)}
						</div>
						<div className="problem-actions">
							<button className="primary-btn" onClick={() => setActiveTab('submit')}>
								Bắt đầu làm bài
							</button>
						</div>
					</div>
				)}

				{activeTab === 'submit' && (
					<div className="tab-pane-submit">
						<ScratchUploader
							questId={questId}
							onUpload={handleUploadComplete}
							disabled={disabled}
						/>
						<div className="quick-guide">
							<p>* Bạn nên bấm <strong>"Kiểm tra"</strong> để xem trước kết quả trước khi nộp chính thức.</p>
						</div>
					</div>
				)}

				{activeTab === 'results' && (
					<div className="tab-pane-results">
						{isLoadingDetail ? (
							<div className="loading-container">Đang tải kết quả...</div>
						) : selectedSubmission ? (
							<div className="result-detail-view">
								<div className="submission-meta">
									<div className="meta-left">
										<span className="meta-label">Bài nộp lúc:</span>
										<span className="meta-value">
											{new Date(selectedSubmission.submitted_at).toLocaleString('vi-VN')}
										</span>
									</div>
									<div className="meta-right">
										{selectedSubmission.is_dry_run && <span className="dry-run-badge">Bản chạy thử</span>}
									</div>
								</div>
								
								<TestcaseGrid 
									judgeLog={selectedSubmission.judge_log} 
									score={selectedSubmission.score} 
								/>
								
								<div className="result-actions">
									<button className="re-submit-btn" onClick={() => setActiveTab('submit')}>
										Nộp bài khác
									</button>
								</div>
							</div>
						) : (
							<div className="no-result-placeholder">
								<p>Chọn một bài nộp từ tab "Lần nộp" hoặc nộp bài mới để xem kết quả.</p>
								<button className="primary-btn" onClick={() => setActiveTab('submit')}>Nộp ngay</button>
							</div>
						)}
					</div>
				)}

				{activeTab === 'history' && (
					<div className="tab-pane-history">
						<SubmissionHistory 
							history={history} 
							onSelect={handleSelectSubmission}
							selectedId={selectedSubmission?.id}
							isLoading={isLoadingHistory}
						/>
						<div className="history-footer">
							<button className="refresh-btn" onClick={fetchHistory}>
								Làm mới danh sách
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
