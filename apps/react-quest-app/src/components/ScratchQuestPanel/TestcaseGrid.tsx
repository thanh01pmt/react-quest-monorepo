import React from 'react';
import './TestcaseGrid.css';

export interface TestcaseResult {
  id: string;
  status: 'pass' | 'fail' | 'tle' | 'error' | 'pending';
  score: number;
  max_score: number;
  input?: string;
  output?: string;
  expected?: string;
  error?: string;
  time?: number;
  is_sample?: boolean;
}

export interface JudgeLog {
  test_cases: TestcaseResult[];
  summary?: {
    total_score: number;
    max_score: number;
    passed: number;
    total: number;
  };
}

interface TestcaseGridProps {
  judgeLog: JudgeLog | string | null;
  score?: number;
}

export function TestcaseGrid({ judgeLog, score }: TestcaseGridProps) {
  if (!judgeLog) {
    return <div className="testcase-grid-empty">Chưa có kết quả chấm bài.</div>;
  }

  let log: JudgeLog;
  try {
    log = typeof judgeLog === 'string' ? JSON.parse(judgeLog) : judgeLog;
  } catch (e) {
    return <div className="testcase-grid-error">Dữ liệu kết quả không hợp lệ.</div>;
  }

  const testCases = log.test_cases || [];
  const totalScore = log.summary?.total_score ?? score ?? 0;
  const maxScore = log.summary?.max_score ?? 100;
  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  return (
    <div className="testcase-grid-container">
      <div className="testcase-grid-header">
        <div className="overall-score">
          <span className="score-label">Tổng điểm:</span>
          <span className="score-value">{totalScore}/{maxScore}</span>
          <span className="score-percentage">({percentage}%)</span>
        </div>
      </div>

      <div className="testcase-grid-layout">
        {testCases.map((tc, index) => (
          <div key={tc.id || index} className={`testcase-card status-${tc.status}`}>
            <div className="testcase-number">#{index + 1}</div>
            <div className="testcase-status">
              {tc.status === 'pass' && '✓'}
              {tc.status === 'fail' && '✗'}
              {tc.status === 'tle' && '⏰'}
              {tc.status === 'error' && '⚠'}
              {tc.status === 'pending' && '...'}
            </div>
            <div className="testcase-score">{tc.score}/{tc.max_score}</div>
            {tc.is_sample && <div className="sample-tag">Mẫu</div>}
          </div>
        ))}
      </div>

      <div className="testcase-legend">
        <div className="legend-item"><span className="dot pass"></span> Chấp nhận</div>
        <div className="legend-item"><span className="dot fail"></span> Sai kết quả</div>
        <div className="legend-item"><span className="dot tle"></span> Quá thời gian</div>
        <div className="legend-item"><span className="dot error"></span> Lỗi chạy</div>
      </div>
    </div>
  );
}
