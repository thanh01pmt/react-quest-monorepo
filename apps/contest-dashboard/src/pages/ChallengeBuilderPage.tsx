import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { AlgoQuest, TestCase } from '../types';

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
    const [quests, setQuests] = useState<AlgoQuest[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (contestId) loadQuests(contestId);
    }, [contestId]);

    const loadQuests = async (cid: string) => {
        const { data } = await supabase
            .from('contests')
            .select('quest_data')
            .eq('id', cid)
            .single();
        if (data?.quest_data) {
            setQuests(data.quest_data as AlgoQuest[]);
        }
    };

    const saveQuests = async () => {
        if (!contestId) return;
        setSaving(true);
        await supabase
            .from('contests')
            .update({ quest_data: quests })
            .eq('id', contestId);
        setSaving(false);
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

    const current = quests[selectedIndex];

    return (
        <div>
            <div className="page-header">
                <h1>🧩 Đề thi ({quests.length} câu)</h1>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary" onClick={addQuest}>+ Thêm câu</button>
                    <button className="btn btn-primary" onClick={saveQuests} disabled={saving}>
                        {saving ? 'Đang lưu...' : '💾 Lưu tất cả'}
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 16 }}>
                {/* Quest list */}
                <div style={{ width: 200, flexShrink: 0 }}>
                    {quests.map((q, i) => (
                        <div
                            key={i}
                            onClick={() => setSelectedIndex(i)}
                            style={{
                                padding: '10px 12px',
                                borderRadius: 'var(--radius)',
                                cursor: 'pointer',
                                marginBottom: 4,
                                background: i === selectedIndex ? 'rgba(88,166,255,0.1)' : 'transparent',
                                color: i === selectedIndex ? 'var(--accent)' : 'var(--text-secondary)',
                                fontSize: '0.88rem',
                                fontWeight: i === selectedIndex ? 600 : 400,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <span>Câu {i + 1}: {q.titleKey || '(chưa đặt tên)'}</span>
                            <button
                                onClick={(e) => { e.stopPropagation(); removeQuest(i); }}
                                style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '0.8rem', cursor: 'pointer' }}
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>

                {/* Editor */}
                {current ? (
                    <div style={{ flex: 1 }}>
                        <div className="card" style={{ marginBottom: 16 }}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Tiêu đề</label>
                                    <input
                                        value={current.titleKey}
                                        onChange={(e) => {
                                            updateQuest(selectedIndex, { titleKey: e.target.value, questTitleKey: e.target.value });
                                        }}
                                        placeholder="VD: Tổng hai số"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>ID</label>
                                    <input
                                        value={current.id}
                                        onChange={(e) => updateQuest(selectedIndex, { id: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Đề bài (Markdown)</label>
                                <textarea
                                    value={current.gameConfig.description}
                                    onChange={(e) => updateConfig(selectedIndex, 'description', e.target.value)}
                                    rows={5}
                                    placeholder="Viết chương trình nhập vào 2 số nguyên a, b. Tính tổng của chúng."
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Input Format</label>
                                    <input
                                        value={current.gameConfig.inputFormat || ''}
                                        onChange={(e) => updateConfig(selectedIndex, 'inputFormat', e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Output Format</label>
                                    <input
                                        value={current.gameConfig.outputFormat || ''}
                                        onChange={(e) => updateConfig(selectedIndex, 'outputFormat', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Ràng buộc</label>
                                <input
                                    value={current.gameConfig.constraints || ''}
                                    onChange={(e) => updateConfig(selectedIndex, 'constraints', e.target.value)}
                                    placeholder="VD: -10^9 <= a, b <= 10^9"
                                />
                            </div>
                        </div>

                        {/* Sample Cases */}
                        <div className="card" style={{ marginBottom: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <h3 style={{ fontSize: '0.95rem' }}>📝 Ví dụ mẫu (Sample)</h3>
                                <button className="btn btn-secondary btn-sm" onClick={() => addTestCase(selectedIndex, 'sampleCases')}>+ Thêm</button>
                            </div>
                            {current.gameConfig.sampleCases.map((tc, i) => (
                                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, marginBottom: 8 }}>
                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label style={{ fontSize: '0.7rem' }}>Input</label>
                                        <textarea
                                            value={tc.input}
                                            onChange={(e) => updateTestCase(selectedIndex, 'sampleCases', i, 'input', e.target.value)}
                                            rows={2}
                                            style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}
                                        />
                                    </div>
                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label style={{ fontSize: '0.7rem' }}>Expected Output</label>
                                        <textarea
                                            value={tc.expectedOutput}
                                            onChange={(e) => updateTestCase(selectedIndex, 'sampleCases', i, 'expectedOutput', e.target.value)}
                                            rows={2}
                                            style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}
                                        />
                                    </div>
                                    <button
                                        onClick={() => removeTestCase(selectedIndex, 'sampleCases', i)}
                                        style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', alignSelf: 'end', marginBottom: 4 }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Hidden Cases */}
                        <div className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <h3 style={{ fontSize: '0.95rem' }}>🔒 Test ẩn (Hidden)</h3>
                                <button className="btn btn-secondary btn-sm" onClick={() => addTestCase(selectedIndex, 'hiddenCases')}>+ Thêm</button>
                            </div>
                            {current.gameConfig.hiddenCases.map((tc, i) => (
                                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, marginBottom: 8 }}>
                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label style={{ fontSize: '0.7rem' }}>Input</label>
                                        <textarea
                                            value={tc.input}
                                            onChange={(e) => updateTestCase(selectedIndex, 'hiddenCases', i, 'input', e.target.value)}
                                            rows={2}
                                            style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}
                                        />
                                    </div>
                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label style={{ fontSize: '0.7rem' }}>Expected Output</label>
                                        <textarea
                                            value={tc.expectedOutput}
                                            onChange={(e) => updateTestCase(selectedIndex, 'hiddenCases', i, 'expectedOutput', e.target.value)}
                                            rows={2}
                                            style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}
                                        />
                                    </div>
                                    <button
                                        onClick={() => removeTestCase(selectedIndex, 'hiddenCases', i)}
                                        style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', alignSelf: 'end', marginBottom: 4 }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="empty-state" style={{ flex: 1 }}>
                        <h3>Chưa có câu hỏi</h3>
                        <p>Nhấn "+ Thêm câu" để tạo câu hỏi đầu tiên</p>
                    </div>
                )}
            </div>
        </div>
    );
}
