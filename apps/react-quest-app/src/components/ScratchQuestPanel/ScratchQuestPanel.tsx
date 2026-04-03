import React, { useState, useEffect, useCallback } from 'react';
import { ScratchUploader } from '../ScratchUploader/ScratchUploader';
import { getSubmissionHistory } from '../../services/SupabaseContestService';
import './ScratchQuestPanel.css';

interface ScratchQuestPanelProps {
	questId: string;
	contestId?: string;
	onUpload: (file: File, isDryRun?: boolean) => Promise<any>;
	disabled?: boolean;
}

type TabType = 'submit' | 'history' | 'guide';

export function ScratchQuestPanel({
	questId,
	contestId,
	onUpload,
	disabled,
}: ScratchQuestPanelProps) {
	const [activeTab, setActiveTab] = useState<TabType>('submit');
	const [history, setHistory] = useState<any[]>([]);
	const [isLoadingHistory, setIsLoadingHistory] = useState(false);

	const fetchHistory = useCallback(async () => {
		if (activeTab !== 'history') return;
		setIsLoadingHistory(true);
		try {
			const data = await getSubmissionHistory(questId, contestId);
			setHistory(data);
		} catch (err) {
			console.error('Lỗi khi lấy lịch sử:', err);
		} finally {
			setIsLoadingHistory(false);
		}
	}, [questId, contestId, activeTab]);

	useEffect(() => {
		if (activeTab === 'history') {
			fetchHistory();
		}
	}, [activeTab, fetchHistory]);

	const handleUploadComplete = async (file: File, isDryRun?: boolean) => {
		const result = await onUpload(file, isDryRun);
		// Nếu nộp bài xong, có thể tự động chuyển sang tab lịch sử để xem trạng thái
		if (!isDryRun) {
			setActiveTab('history');
		} else {
			// Nếu là chạy thử, vẫn ở lại tab nộp bài nhưng fetch lại lịch sử nếu cần
			fetchHistory();
		}
		return result;
	};

	return (
		<div className="scratch-quest-panel">
			<div className="panel-tabs-header">
				<button
					className={`tab-button ${activeTab === 'submit' ? 'active' : ''}`}
					onClick={() => setActiveTab('submit')}
				>
					Nộp bài
				</button>
				<button
					className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
					onClick={() => setActiveTab('history')}
				>
					Lịch sử {history.length > 0 && `(${history.length})`}
				</button>
				<button
					className={`tab-button ${activeTab === 'guide' ? 'active' : ''}`}
					onClick={() => setActiveTab('guide')}
				>
					Hướng dẫn
				</button>
			</div>

			<div className="panel-content">
				{activeTab === 'submit' && (
					<div className="tab-pane-submit">
						<ScratchUploader
							questId={questId}
							onUpload={handleUploadComplete}
							disabled={disabled}
						/>
					</div>
				)}

				{activeTab === 'history' && (
					<div className="tab-pane-history">
						{isLoadingHistory ? (
							<div className="loading-spinner">Đang tải lịch sử...</div>
						) : history.length === 0 ? (
							<div className="empty-history">
								<p>Bạn chưa có bài nộp nào cho câu hỏi này.</p>
							</div>
						) : (
							<div className="history-list">
								{history.map((item) => (
									<div key={item.id} className="history-item">
										<div className="history-item-header">
											<span className="submitted-at">
												{new Date(item.submitted_at).toLocaleString('vi-VN')}
											</span>
											<span className={`status-badge status-${item.status}`}>
												{item.status === 'judged' ? 'Đã chấm' : 
												 item.status === 'pending' ? 'Đang chờ' : 
												 item.status === 'failed' ? 'Lỗi' : item.status}
											</span>
										</div>
										<div className="history-details">
											<span className="score-text">
												Điểm: {item.score ?? 0}/100
											</span>
											{item.is_dry_run && <span className="dry-run-tag">(Chạy thử)</span>}
										</div>
										{item.judge_log && (
											<div className="judge-log-preview">
												{typeof item.judge_log === 'string' 
													? item.judge_log 
													: JSON.stringify(item.judge_log, null, 2)}
											</div>
										)}
									</div>
								))}
							</div>
						)}
						<button className="refresh-history-btn" onClick={fetchHistory} style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>
							Làm mới
						</button>
					</div>
				)}

				{activeTab === 'guide' && (
					<div className="tab-pane-guide">
						<div className="guide-content">
							<h3>Hướng dẫn nộp bài Scratch</h3>
							<p>Hệ thống hỗ trợ 2 cách để bạn nộp bài:</p>
							
							<h4>Cách 1: Tải file từ máy tính</h4>
							<ul>
								<li>Lưu dự án Scratch của bạn dưới dạng file <strong>.sb3</strong>.</li>
								<li>Kéo thả hoặc chọn file từ máy tính trong tab "Nộp bài".</li>
							</ul>

							<h4>Cách 2: Sử dụng link trực tiếp từ Scratch</h4>
							<ul>
								<li>Mở dự án trên trang <a href="https://scratch.mit.edu" target="_blank" rel="noreferrer">scratch.mit.edu</a>.</li>
								<li>Đảm bảo dự án đã được <strong>Chia sẻ (Shared)</strong>.</li>
								<li>Copy link dự án (ví dụ: <code>https://scratch.mit.edu/projects/12345678/</code>) và dán vào ô nhập link.</li>
								<li>Bấm "Lấy bài" để hệ thống tự động tải dự án về.</li>
							</ul>

							<h4>Lưu ý quan trọng:</h4>
							<ul>
								<li>Sử dụng nút <strong>"Kiểm tra (Chạy thử)"</strong> để xem kết quả với các test case công khai mà không bị tính số lần nộp (nếu có giới hạn).</li>
								<li>Nút <strong>"Nộp chính thức"</strong> sẽ ghi lại điểm số cuối cùng của bạn vào bảng xếp hạng.</li>
								<li>Chỉ nộp file <strong>.sb3</strong> hợp lệ.</li>
							</ul>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
