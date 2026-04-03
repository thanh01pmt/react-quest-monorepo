import React from 'react';
import './SubmissionHistory.css';

interface SubmissionHistoryProps {
  history: any[];
  onSelect: (submission: any) => void;
  selectedId?: string;
  isLoading?: boolean;
}

export function SubmissionHistory({ history, onSelect, selectedId, isLoading }: SubmissionHistoryProps) {
  if (isLoading) {
    return <div className="history-loading">Đang tải lịch sử...</div>;
  }

  if (history.length === 0) {
    return (
      <div className="history-empty">
        <p>Bạn chưa có bài nộp nào cho câu hỏi này.</p>
      </div>
    );
  }

  return (
    <div className="submission-history-list">
      {history.map((item) => (
        <div 
          key={item.id} 
          className={`submission-item ${selectedId === item.id ? 'selected' : ''}`}
          onClick={() => onSelect(item)}
        >
          <div className="item-main">
            <div className="item-info">
              <span className="item-date">
                {new Date(item.submitted_at).toLocaleString('vi-VN', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
              <span className={`item-status status-${item.status}`}>
                {item.status === 'judged' ? 'Đã chấm' : 
                 item.status === 'pending' ? 'Đang chờ' : 
                 item.status === 'failed' ? 'Lỗi' : item.status}
              </span>
              {item.is_dry_run && <span className="item-tag tag-dry">Chạy thử</span>}
            </div>
            <div className="item-score">
              <span className="score-value">{item.score ?? 0}</span>
              <span className="score-max">/100</span>
            </div>
          </div>
          {selectedId === item.id && (
            <div className="item-indicator">
              <span className="viewing-text">Đang xem</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
