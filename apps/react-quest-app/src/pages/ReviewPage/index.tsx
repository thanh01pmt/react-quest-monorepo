import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSubmissionById, type ContestSubmission } from '../../services/SupabaseContestService';
import { useContest } from '../../contexts/ContestContext';
import './ReviewPage.css';

export function ReviewPage() {
    const { contestId, submissionId } = useParams<{ contestId: string; submissionId: string }>();
    const navigate = useNavigate();
    const { state } = useContest();
    
    const [submission, setSubmission] = useState<ContestSubmission | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSubmission = async () => {
            if (!submissionId) return;
            setLoading(true);
            try {
                const sub = await getSubmissionById(submissionId);
                if (sub) {
                    setSubmission(sub);
                } else {
                    setError('Không tìm thấy bài nộp.');
                }
            } catch (err) {
                console.error('Error fetching submission:', err);
                setError('Có lỗi xảy ra khi tải bài nộp.');
            } finally {
                setLoading(false);
            }
        };

        fetchSubmission();
    }, [submissionId]);

    if (loading) {
        return (
            <div className="review-page loading">
                <div className="loader"></div>
                <p>Đang tải thông tin bài nộp...</p>
            </div>
        );
    }

    if (error || !submission) {
        return (
            <div className="review-page error">
                <div className="error-card">
                    <h2>⚠️ Lỗi</h2>
                    <p>{error || 'Bài nộp không hợp lệ.'}</p>
                    <button onClick={() => navigate(`/contest/${contestId}`)}>Quay lại Lobby</button>
                </div>
            </div>
        );
    }

    const quest = state.contest?.questData?.find(q => q.id === submission.questId);
    const questTitle = quest?.title || submission.questId;

    return (
        <div className="review-page">
            <div className="review-container">
                <header className="review-header">
                    <div className="header-info">
                        <button className="back-btn" onClick={() => navigate(`/contest/${contestId}`)}>
                            ← Quay lại
                        </button>
                        <h1>Chi tiết bài nộp</h1>
                    </div>
                    <div className="header-meta">
                        <span className="meta-item">
                            ID: <code>{submission.id.substring(0, 8)}</code>
                        </span>
                        <span className="meta-item">
                            Ngày nộp: {new Date(submission.submittedAt).toLocaleString('vi-VN')}
                        </span>
                    </div>
                </header>

                <main className="review-content">
                    <section className="review-info-grid">
                        <div className="info-card">
                            <label>Thử thách</label>
                            <div className="info-value">{questTitle}</div>
                        </div>
                        <div className="info-card highlight">
                            <label>Tổng điểm</label>
                            <div className="info-value score">{submission.score}</div>
                        </div>
                        <div className="info-card">
                            <label>Lần nộp</label>
                            <div className="info-value">#{submission.attempt}</div>
                        </div>
                        <div className="info-card">
                            <label>Ngôn ngữ</label>
                            <div className="info-value lang">{submission.language}</div>
                        </div>
                    </section>

                    <section className="review-code">
                        <div className="section-header">
                            <h3>Mã nguồn</h3>
                        </div>
                        <div className="code-block">
                            <pre><code>{submission.code}</code></pre>
                        </div>
                    </section>

                    <section className="review-results">
                        <div className="section-header">
                            <h3>Kết quả chấm điểm</h3>
                        </div>
                        <div className="results-list">
                            {submission.testResults.length > 0 ? (
                                submission.testResults.map((result, idx) => (
                                    <div key={idx} className={`result-item ${result.status === 'pass' ? 'pass' : 'fail'}`}>
                                        <div className="result-status-icon">
                                            {result.status === 'pass' ? '✅' : '❌'}
                                        </div>
                                        <div className="result-details">
                                            <div className="result-main">
                                                <span className="result-name">{result.testName}</span>
                                                <span className={`result-status-text ${result.status}`}>
                                                    {result.status === 'pass' ? 'ĐẠT' : 'KHÔNG ĐẠT'}
                                                </span>
                                            </div>
                                            {result.message && (
                                                <div className="result-message">
                                                    {result.message}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="no-results">Không có dữ liệu chấm điểm chi tiết.</p>
                            )}
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
}
