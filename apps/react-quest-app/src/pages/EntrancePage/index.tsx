/**
 * EntrancePage
 *
 * Contest entrance: login with credentials, provide contact info, wait in lobby, and enter exam room.
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useContest } from '../../contexts/ContestContext';
import { getContestTimeStatus } from '../../services/SupabaseContestService';
import './EntrancePage.css';

export function EntrancePage() {
    const { contestId } = useParams<{ contestId: string }>();
    const navigate = useNavigate();
    const { user, signInWithEmail, loading: authLoading, error: authError, clearError } = useAuth();
    const { state, loadContest, registerParticipant } = useContest();

    const [step, setStep] = useState<'login' | 'contact'>('login');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [localError, setLocalError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    
    // Force re-render to update time status seamlessly
    const [, setCurrentTime] = useState(Date.now());
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Load contest on mount
    useEffect(() => {
        if (contestId) {
            loadContest(contestId);
        }
    }, [contestId, loadContest]);

    // If user is logged in but no participant, show contact step
    useEffect(() => {
        if (user && !state.participant && step === 'login') {
            setStep('contact');
        }
    }, [user, state.participant, step]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim() || !password.trim()) {
            setLocalError('Vui lòng nhập tên đăng nhập và mật khẩu');
            return;
        }

        setLocalError('');
        clearError();
        setSubmitting(true);

        try {
            const trimmedUsername = username.trim().toLowerCase();
            const contestEmail = trimmedUsername.includes('@') 
                ? trimmedUsername 
                : `${trimmedUsername}@contest.io`;
            
            await signInWithEmail(contestEmail, password);
            setStep('contact');
        } catch {
            setLocalError('Sai tên đăng nhập hoặc mật khẩu');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!displayName.trim() || !email.trim()) {
            setLocalError('Vui lòng nhập họ tên và email');
            return;
        }

        setLocalError('');
        setSubmitting(true);

        try {
            await registerParticipant({
                username,
                displayName: displayName.trim(),
                email: email.trim(),
                phone: phone.trim(),
            });
            // Registration triggers participant state update → Lobby UI will show
        } catch (err: any) {
            setLocalError(err.message || 'Lỗi đăng ký');
        } finally {
            setSubmitting(false);
        }
    };

    // ── Render ────────────────────────────────────────────────────────

    if (state.loading) {
        return (
            <div className="entrance-page">
                <div className="entrance-card">
                    <div className="entrance-loading">Đang tải thông tin cuộc thi...</div>
                </div>
            </div>
        );
    }

    if (state.error || !state.contest) {
        return (
            <div className="entrance-page">
                <div className="entrance-card">
                    <div className="entrance-error">
                        <h2>⚠️ Lỗi</h2>
                        <p>{state.error || 'Không tìm thấy cuộc thi'}</p>
                    </div>
                </div>
            </div>
        );
    }

    const timeStatus = getContestTimeStatus(state.contest);
    const startDate = state.contest.startTime ? new Date(state.contest.startTime) : null;
    const endDate = state.contest.endTime ? new Date(state.contest.endTime) : null;

    return (
        <div className="entrance-page">
            <div className="entrance-card">
                {/* Banner */}
                <div className="entrance-banner">
                    <div className="entrance-icon">🏆</div>
                    <h1 className="entrance-title">{state.contest.title}</h1>
                    <p className="entrance-description">{state.contest.description}</p>
                </div>

                {/* Time Info */}
                <div className="entrance-time-info">
                    {startDate && (
                        <div className="time-row">
                            <span className="time-label">🕐 Bắt đầu</span>
                            <span className="time-value">{startDate.toLocaleString('vi-VN')}</span>
                        </div>
                    )}
                    {endDate && (
                        <div className="time-row">
                            <span className="time-label">🕐 Kết thúc</span>
                            <span className="time-value">{endDate.toLocaleString('vi-VN')}</span>
                        </div>
                    )}
                    {state.contest.durationMinutes && (
                        <div className="time-row">
                            <span className="time-label">⏱ Thời gian làm bài</span>
                            <span className="time-value">{state.contest.durationMinutes} phút</span>
                        </div>
                    )}
                    {state.contest.questData && (
                        <div className="time-row">
                            <span className="time-label">📝 Số bài</span>
                            <span className="time-value">{state.contest.questData.length} thử thách</span>
                        </div>
                    )}
                </div>

                {!state.participant ? (
                    /* ----- LOGIN / REGISTER FLOW ----- */
                    timeStatus === 'ended' ? (
                        <div className="entrance-status entrance-status-ended">
                            🔴 Cuộc thi đã kết thúc.
                        </div>
                    ) : (
                        <>
                            {step === 'login' && (
                                <form className="entrance-form" onSubmit={handleLogin}>
                                    <h2>Đăng nhập Hệ thống</h2>
                                    <p className="form-subtitle">Đăng nhập tài khoản để vào phòng chờ cuộc thi.</p>
                                    <div className="form-group">
                                        <label htmlFor="username">Tên đăng nhập</label>
                                        <input
                                            id="username"
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            placeholder="VD: ts001"
                                            autoFocus
                                            disabled={submitting}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="password">Mật khẩu</label>
                                        <input
                                            id="password"
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Nhập mật khẩu"
                                            disabled={submitting}
                                        />
                                    </div>

                                    {(localError || authError) && (
                                        <div className="form-error">{localError || authError}</div>
                                    )}

                                    <button
                                        type="submit"
                                        className="entrance-submit-btn"
                                        disabled={submitting || authLoading}
                                    >
                                        {submitting ? 'Đang xử lý...' : 'Tiếp tục →'}
                                    </button>
                                </form>
                            )}

                            {step === 'contact' && (
                                <form className="entrance-form" onSubmit={handleRegister}>
                                    <h2>Thông tin liên hệ</h2>
                                    <p className="form-subtitle">
                                        Để nhận kết quả thi, vui lòng cung cấp thông tin liên hệ.
                                    </p>
                                    <div className="form-group">
                                        <label htmlFor="displayName">Họ và tên *</label>
                                        <input
                                            id="displayName"
                                            type="text"
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            placeholder="Nguyễn Văn A"
                                            autoFocus
                                            required
                                            disabled={submitting}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="email">Email *</label>
                                        <input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="email@example.com"
                                            required
                                            disabled={submitting}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="phone">Số điện thoại</label>
                                        <input
                                            id="phone"
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="0901234567"
                                            disabled={submitting}
                                        />
                                    </div>

                                    {localError && <div className="form-error">{localError}</div>}

                                    <button
                                        type="submit"
                                        className="entrance-submit-btn"
                                        disabled={submitting}
                                    >
                                        {submitting ? 'Đang xác nhận...' : 'Hoàn tất đăng ký'}
                                    </button>
                                </form>
                            )}
                        </>
                    )
                ) : (
                    /* ----- LOBBY FLOW ----- */
                    <div className="entrance-lobby">
                        <div className="lobby-greeting">
                            <h3>Xin chào, <span>{state.participant.displayName}</span>!</h3>
                            <p>Bạn đã có mặt tại phòng chờ.</p>
                        </div>

                        {timeStatus === 'not_started' && (
                            <div className="entrance-status entrance-status-waiting">
                                ⏳ Cuộc thi chưa bắt đầu. {startDate ? `Vui lòng chờ đến ` : ''}<b>{startDate?.toLocaleString('vi-VN')}</b>.
                            </div>
                        )}

                        {timeStatus === 'ended' && (
                            <div className="entrance-status entrance-status-ended">
                                🔴 Cuộc thi đã kết thúc. Cảm ơn bạn đã tham gia.
                            </div>
                        )}

                        {timeStatus === 'active' && (
                            <div className="lobby-action">
                                <div className="entrance-status entrance-status-active">
                                    🟢 Cuộc thi đang diễn ra! Hãy nhấn nút bên dưới để bắt đầu làm bài.
                                </div>
                                <button 
                                    className="entrance-submit-btn exam-start-btn" 
                                    onClick={() => navigate(`/contest/${contestId}/exam`)}
                                >
                                    🚀 Bắt đầu làm bài
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default EntrancePage;
