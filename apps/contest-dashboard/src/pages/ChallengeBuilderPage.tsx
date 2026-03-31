import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { AlgoQuest, TestCase, Round, Exam } from '../types';
import {
    Puzzle,
    FileText,
    Brain,
    Download,
    Save,
    ArrowLeft,
    X,
    Lock,
    Plus,
    Trash2,
    CheckCircle,
    PlayCircle
} from 'lucide-react';
import { QuestPlayer } from '@repo/quest-player';
import type { QuestPlayerSettings } from '@repo/quest-player';
import React from 'react'; // Added React import for React.memo

const MemoizedQuestPlayer = React.memo(QuestPlayer);

const previewSettings: QuestPlayerSettings = {
    displayLanguage: 'javascript',
    colorSchemeMode: 'dark',
    toolboxMode: 'default'
};

interface ChallengeBuilderPageProps { }

const emptyQuest = (): AlgoQuest => ({
    id: `algo-${Date.now()}`,
    gameType: 'algo',
    level: 1,
    titleKey: '',
    questTitleKey: '',
    descriptionKey: '',
    gameConfig: {
        type: 'algo',
        description: '',
        inputFormat: '',
        outputFormat: '',
        constraints: '',
        sampleCases: [{ input: '', expectedOutput: '', label: 'Ví dụ 1' }],
        hiddenCases: [{ input: '', expectedOutput: '' }],
        supportedLanguages: ['javascript', 'python'],
    },
    solution: { type: 'match_output' },
});

export function ChallengeBuilderPage() {
    const { id: contestId } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // Selection state
    const [rounds, setRounds] = useState<Round[]>([]);
    const [selectedRoundId, setSelectedRoundId] = useState<string>('');
    const [exams, setExams] = useState<Exam[]>([]);
    const [selectedExamId, setSelectedExamId] = useState<string>('');

    // Question state
    const [quests, setQuests] = useState<AlgoQuest[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showPreview, setShowPreview] = useState(false);

    useEffect(() => {
        if (contestId) loadRounds(contestId);
    }, [contestId]);

    useEffect(() => {
        if (selectedRoundId) loadExams(selectedRoundId);
    }, [selectedRoundId]);

    useEffect(() => {
        if (selectedExamId) loadQuests(selectedExamId);
    }, [selectedExamId]);

    const loadRounds = async (cid: string) => {
        const { data } = await supabase.from('rounds').select('id, title').eq('contest_id', cid).order('order_index');
        if (data && data.length > 0) {
            setRounds(data as Round[]);
            setSelectedRoundId(data[0].id);
        } else {
            setLoading(false);
        }
    };

    const loadExams = async (rid: string) => {
        const { data } = await supabase.from('exams').select('id, title').eq('round_id', rid);
        if (data && data.length > 0) {
            setExams(data as Exam[]);
            setSelectedExamId(data[0].id);
        } else {
            setExams([]);
            setSelectedExamId('');
            setQuests([]);
        }
        setLoading(false);
    };

    const loadQuests = async (eid: string) => {
        const { data } = await supabase.from('exams').select('quest_data').eq('id', eid).single();
        if (data?.quest_data) {
            setQuests(data.quest_data as AlgoQuest[]);
        } else {
            setQuests([]);
        }
    };

    const saveQuests = async () => {
        if (!selectedExamId) return;
        setSaving(true);
        const { error } = await supabase
            .from('exams')
            .update({ quest_data: quests })
            .eq('id', selectedExamId);
        setSaving(false);
        if (!error) {
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        }
    };

    const addExam = async () => {
        if (!selectedRoundId) return;
        const title = prompt('Tên đề thi mới:');
        if (!title) return;
        const { data, error } = await supabase.from('exams').insert({ round_id: selectedRoundId, title }).select().single();
        if (!error && data) {
            setExams([...exams, data as Exam]);
            setSelectedExamId(data.id);
        }
    };

    const addQuest = () => {
        const q = emptyQuest();
        q.level = quests.length + 1;
        setQuests([...quests, q]);
        setSelectedIndex(quests.length);
    };

    const removeQuest = (index: number) => {
        if (!confirm('Xóa challenge này?')) return;
        const updated = quests.filter((_, i) => i !== index);
        setQuests(updated);
        setSelectedIndex(Math.max(0, selectedIndex - 1));
    };

    const updateQuest = (index: number, updates: Partial<AlgoQuest>) => {
        setQuests((prev) =>
            prev.map((q, i) => (i === index ? { ...q, ...updates } : q))
        );
    };

    const updateConfig = (index: number, key: string, value: any) => {
        setQuests((prev) =>
            prev.map((q, i) =>
                i === index ? { ...q, gameConfig: { ...q.gameConfig, [key]: value } } : q
            )
        );
    };

    const addTestCase = (questIndex: number, type: 'sampleCases' | 'hiddenCases') => {
        const quest = quests[questIndex];
        const cases = [...quest.gameConfig[type], { input: '', expectedOutput: '', label: type === 'sampleCases' ? `Ví dụ ${quest.gameConfig[type].length + 1}` : undefined }];
        updateConfig(questIndex, type, cases);
    };

    const updateTestCase = (questIndex: number, type: 'sampleCases' | 'hiddenCases', caseIndex: number, field: keyof TestCase, value: string) => {
        const quest = quests[questIndex];
        const cases = quest.gameConfig[type].map((tc, i) =>
            i === caseIndex ? { ...tc, [field]: value } : tc
        );
        updateConfig(questIndex, type, cases);
    };

    const removeTestCase = (questIndex: number, type: 'sampleCases' | 'hiddenCases', caseIndex: number) => {
        const quest = quests[questIndex];
        const cases = quest.gameConfig[type].filter((_, i) => i !== caseIndex);
        updateConfig(questIndex, type, cases);
    };

    const exportExam = () => {
        if (!selectedExamId) return;
        const examData = {
            title: exams.find(e => e.id === selectedExamId)?.title || 'exam',
            quest_data: quests
        };
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(examData, null, 2));
        const a = document.createElement('a');
        a.href = dataStr;
        a.download = `exam-${examData.title}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
    };

    const current = quests[selectedIndex];

    const previewQuestData = useMemo(() => {
        if (!current) return null;
        return current as any;
    }, [current?.id, current?.gameConfig]);

    const handleSettingsChangePreview = useCallback(() => { }, []);
    const handleQuestCompletePreview = useCallback((res: any) => {
        console.log('Preview Result:', res);
        alert(`Xem trước hoàn tất!\nKết quả: ${res.isSuccess ? 'Thành công' : 'Thất bại'}`);
    }, []);

    if (loading) return <div className="empty-state card">Đang tải...</div>;

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/contest/${contestId}/edit`)} title="Quay lại" style={{ padding: 8 }}>
                        <ArrowLeft size={18} />
                    </button>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Brain size={28} className="text-secondary" />
                        <span>Quản lý Đề thi</span>
                    </h1>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    {saved && (
                        <span style={{ color: 'var(--success)', alignSelf: 'center', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600, marginRight: 12 }}>
                            <CheckCircle size={14} />
                            Đã lưu
                        </span>
                    )}
                    <button className="btn btn-secondary" onClick={addQuest} disabled={!selectedExamId}>
                        <Plus size={18} />
                        <span>Thêm câu</span>
                    </button>
                    {selectedExamId && (
                        <button className="btn btn-secondary" onClick={exportExam}>
                            <Download size={18} />
                            <span>Export JSON</span>
                        </button>
                    )}
                    <button className="btn btn-primary" onClick={saveQuests} disabled={saving || !selectedExamId}>
                        <Save size={18} />
                        <span>{saving ? 'Đang lưu...' : 'Lưu đề này'}</span>
                    </button>
                </div>
            </div>

            <div className="card glass-dark" style={{ marginBottom: 24, display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) minmax(200px, 1fr) auto', gap: 20, alignItems: 'end', padding: 24 }}>
                <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>Vòng thi</label>
                    <select value={selectedRoundId} onChange={e => setSelectedRoundId(e.target.value)} style={{ padding: 12, fontWeight: 600 }}>
                        {rounds.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                    </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>Bộ đề (Exam)</label>
                    <select value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)} style={{ padding: 12, fontWeight: 600 }}>
                        <option value="">(Chọn bộ đề)</option>
                        {exams.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                    </select>
                </div>
                <button className="btn btn-secondary" onClick={addExam} style={{ padding: '12px 20px' }}>
                    <Plus size={16} />
                    <span>Bộ đề mới</span>
                </button>
            </div>

            {!selectedExamId ? (
                <div className="empty-state card glass-dark" style={{ padding: 80 }}>
                    <Puzzle size={48} style={{ color: 'var(--text-muted)', marginBottom: 16, opacity: 0.5 }} />
                    <h3>Chọn hoặc tạo bộ đề để soạn câu hỏi</h3>
                </div>
            ) : (
                <div style={{ display: 'flex', gap: 24 }}>
                    {/* Quest list */}
                    <div style={{ width: 280, flexShrink: 0 }}>
                        <div className="card glass-dark" style={{ padding: 12 }}>
                            {quests.map((q, i) => (
                                <div
                                    key={i}
                                    onClick={() => setSelectedIndex(i)}
                                    style={{
                                        padding: '12px 16px',
                                        borderRadius: 8,
                                        cursor: 'pointer',
                                        marginBottom: 6,
                                        background: i === selectedIndex ? 'rgba(88,166,255,0.1)' : 'transparent',
                                        color: i === selectedIndex ? 'var(--accent)' : 'var(--text-secondary)',
                                        fontSize: '0.9rem',
                                        fontWeight: i === selectedIndex ? 700 : 400,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        border: '1px solid ' + (i === selectedIndex ? 'var(--accent)' : 'transparent'),
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <span>Câu {i + 1}: {q.titleKey || '(chưa đặt tên)'}</span>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); removeQuest(i); }}
                                        style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '0.8rem', cursor: 'pointer', padding: 4 }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                            {quests.length === 0 && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: 24 }}>Chưa có câu hỏi</div>}
                        </div>
                    </div>

                    {/* Editor */}
                    {current ? (
                        <div style={{ flex: 1 }}>
                            <div className="card glass-dark" style={{ marginBottom: 24, padding: 32 }}>
                                <div className="form-row" style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
                                    <div className="form-group" style={{ flex: 2 }}>
                                        <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>Tiêu đề câu hỏi</label>
                                        <input
                                            value={current.titleKey}
                                            onChange={(e) => {
                                                updateQuest(selectedIndex, { titleKey: e.target.value, questTitleKey: e.target.value });
                                            }}
                                            placeholder="VD: Tổng hai số"
                                            style={{ padding: 12, fontWeight: 700, fontSize: '1.1rem' }}
                                        />
                                    </div>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>Mã định danh (ID)</label>
                                        <div style={{ display: 'flex', gap: 12 }}>
                                            <input
                                                value={current.id}
                                                onChange={(e) => updateQuest(selectedIndex, { id: e.target.value })}
                                                style={{ padding: 12, fontFamily: 'monospace', flex: 1 }}
                                            />
                                            <button
                                                className="btn btn-secondary"
                                                onClick={() => setShowPreview(true)}
                                                style={{ whiteSpace: 'nowrap' }}
                                            >
                                                <PlayCircle size={18} />
                                                <span>Xem trước</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="form-group" style={{ marginBottom: 24 }}>
                                    <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>Nội dung đề bài (Markdown hỗ trợ)</label>
                                    <textarea
                                        value={current.gameConfig.description}
                                        onChange={(e) => updateConfig(selectedIndex, 'description', e.target.value)}
                                        rows={8}
                                        placeholder="Viết chương trình nhập vào 2 số nguyên a, b. Tính tổng của chúng."
                                        style={{ padding: 16, lineHeight: 1.6 }}
                                    />
                                </div>

                                <div className="form-row" style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>Định dạng đầu vào (Input)</label>
                                        <input
                                            value={current.gameConfig.inputFormat || ''}
                                            onChange={(e) => updateConfig(selectedIndex, 'inputFormat', e.target.value)}
                                            style={{ padding: 12 }}
                                        />
                                    </div>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>Định dạng đầu ra (Output)</label>
                                        <input
                                            value={current.gameConfig.outputFormat || ''}
                                            onChange={(e) => updateConfig(selectedIndex, 'outputFormat', e.target.value)}
                                            style={{ padding: 12 }}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>Ràng buộc dữ liệu (Constraints)</label>
                                    <input
                                        value={current.gameConfig.constraints || ''}
                                        onChange={(e) => updateConfig(selectedIndex, 'constraints', e.target.value)}
                                        placeholder="VD: -10^9 <= a, b <= 10^9"
                                        style={{ padding: 12 }}
                                    />
                                </div>
                            </div>

                            {/* Sample Cases */}
                            <div className="card glass-dark" style={{ marginBottom: 24, padding: 32 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <FileText size={18} className="text-secondary" />
                                        <span>Ví dụ mẫu (Sample Cases)</span>
                                    </h3>
                                    <button className="btn btn-secondary btn-sm" onClick={() => addTestCase(selectedIndex, 'sampleCases')}>
                                        <Plus size={14} />
                                        <span>Thêm ví dụ</span>
                                    </button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    {current.gameConfig.sampleCases.map((tc, i) => (
                                        <div key={i} className="glass-dark" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 16, padding: 20, borderRadius: 12, border: '1px solid var(--border)' }}>
                                            <div className="form-group" style={{ margin: 0 }}>
                                                <label style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Input</label>
                                                <textarea
                                                    value={tc.input}
                                                    onChange={(e) => updateTestCase(selectedIndex, 'sampleCases', i, 'input', e.target.value)}
                                                    rows={3}
                                                    style={{ fontFamily: 'monospace', fontSize: '0.85rem', padding: 10, background: 'rgba(0,0,0,0.2)' }}
                                                />
                                            </div>
                                            <div className="form-group" style={{ margin: 0 }}>
                                                <label style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Output mong đợi</label>
                                                <textarea
                                                    value={tc.expectedOutput}
                                                    onChange={(e) => updateTestCase(selectedIndex, 'sampleCases', i, 'expectedOutput', e.target.value)}
                                                    rows={3}
                                                    style={{ fontFamily: 'monospace', fontSize: '0.85rem', padding: 10, background: 'rgba(0,0,0,0.2)' }}
                                                />
                                            </div>
                                            <button
                                                onClick={() => removeTestCase(selectedIndex, 'sampleCases', i)}
                                                className="btn-link"
                                                style={{ color: 'var(--danger)', alignSelf: 'start', marginTop: 24 }}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Hidden Cases */}
                            <div className="card glass-dark" style={{ padding: 32 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <Lock size={18} className="text-accent" />
                                        <span>Bộ kiểm thử ẩn (Hidden Tests)</span>
                                    </h3>
                                    <button className="btn btn-secondary btn-sm" onClick={() => addTestCase(selectedIndex, 'hiddenCases')}>
                                        <Plus size={14} />
                                        <span>Thêm test ẩn</span>
                                    </button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    {current.gameConfig.hiddenCases.map((tc, i) => (
                                        <div key={i} className="glass-dark" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 16, padding: 20, borderRadius: 12, border: '1px solid var(--border)' }}>
                                            <div className="form-group" style={{ margin: 0 }}>
                                                <label style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Input</label>
                                                <textarea
                                                    value={tc.input}
                                                    onChange={(e) => updateTestCase(selectedIndex, 'hiddenCases', i, 'input', e.target.value)}
                                                    rows={3}
                                                    style={{ fontFamily: 'monospace', fontSize: '0.85rem', padding: 10, background: 'rgba(0,0,0,0.2)' }}
                                                />
                                            </div>
                                            <div className="form-group" style={{ margin: 0 }}>
                                                <label style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Output mong đợi</label>
                                                <textarea
                                                    value={tc.expectedOutput}
                                                    onChange={(e) => updateTestCase(selectedIndex, 'hiddenCases', i, 'expectedOutput', e.target.value)}
                                                    rows={3}
                                                    style={{ fontFamily: 'monospace', fontSize: '0.85rem', padding: 10, background: 'rgba(0,0,0,0.2)' }}
                                                />
                                            </div>
                                            <button
                                                onClick={() => removeTestCase(selectedIndex, 'hiddenCases', i)}
                                                className="btn-link"
                                                style={{ color: 'var(--danger)', alignSelf: 'start', marginTop: 24 }}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="empty-state card glass-dark" style={{ flex: 1, padding: 80 }}>
                            <h3>Chưa có câu hỏi nào trong bộ đề này</h3>
                            <button className="btn btn-primary" onClick={addQuest} style={{ marginTop: 24 }}>
                                <Plus size={18} />
                                <span>Tạo câu hỏi đầu tiên</span>
                            </button>
                        </div>
                    )}
                </div>
            )}

            {showPreview && current && (
                <div
                    className="modal-overlay"
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 2000, padding: 40
                    }}
                >
                    <div
                        className="card glass-dark"
                        style={{
                            width: '100%', maxWidth: 1200, height: '90vh',
                            display: 'flex', flexDirection: 'column', padding: 0,
                            overflow: 'hidden', border: '1px solid var(--glass-border)'
                        }}
                    >
                        <div style={{
                            padding: '16px 24px', background: 'var(--bg-tertiary)',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            borderBottom: '1px solid var(--border)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <PlayCircle size={20} className="text-secondary" />
                                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Xem trước: {current.titleKey}</h3>
                                <span className="badge badge-draft">Chế độ Admin Preview (Không lưu kết quả)</span>
                            </div>
                            <button className="btn btn-secondary btn-sm" onClick={() => setShowPreview(false)}>
                                <X size={18} />
                                <span>Đóng Preview</span>
                            </button>
                        </div>
                        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', position: 'relative', background: '#000' }}>
                            <MemoizedQuestPlayer
                                key={current.id}
                                isStandalone={false}
                                language="vi"
                                questData={previewQuestData}
                                initialSettings={previewSettings}
                                onSettingsChange={handleSettingsChangePreview}
                                onQuestComplete={handleQuestCompletePreview}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
