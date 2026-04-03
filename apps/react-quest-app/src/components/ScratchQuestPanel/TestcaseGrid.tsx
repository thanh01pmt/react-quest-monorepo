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
        <div className="score-viz">
          <div className="score-circle">
            <svg viewBox="0 0 36 36" className="circular-chart">
              <path className="circle-bg"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path className="circle"
                strokeDasharray={`${percentage}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <text x="18" y="20.35" className="percentage">{percentage}%</text>
            </svg>
          </div>
          <div className="score-text">
            <div className="main-score">{totalScore} <span className="max-score">/ {maxScore}</span></div>
            <div className="score-subtext">Điểm số bài nộp</div>
          </div>
        </div>
      </div>

      <div className="testcase-grid-layout">
        {testCases.map((tc, index) => (
          <div key={tc.id || index} className={`testcase-card status-${tc.status}`} title={tc.status}>
            <div className="tc-header">
              <span className="tc-num">#{index + 1}</span>
              {tc.is_sample && <span className="tc-sample">Sample</span>}
            </div>
            <div className="tc-status-icon">
              {tc.status === 'pass' && '✓'}
              {tc.status === 'fail' && '✗'}
              {tc.status === 'tle' && '⏰'}
              {tc.status === 'error' && '⚠'}
              {tc.status === 'pending' && <div className="tc-spinner" />}
            </div>
            <div className="tc-score">{tc.score}/{tc.max_score}</div>
          </div>
        ))}
      </div>

      <div className="testcase-legend">
        <div className="legend-item"><span className="dot pass"></span> Pass</div>
        <div className="legend-item"><span className="dot fail"></span> Fail</div>
        <div className="legend-item"><span className="dot tle"></span> TLE</div>
        <div className="legend-item"><span className="dot error"></span> Error</div>
      </div>
    </div>
  );
}
