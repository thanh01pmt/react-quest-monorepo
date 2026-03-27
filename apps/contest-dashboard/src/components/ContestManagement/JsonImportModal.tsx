import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { FileDown, XCircle } from 'lucide-react';

interface JsonImportModalProps {
    onClose: () => void;
    onSuccess: () => void;
    context: {
        contestId?: string;
        roundId?: string;
    };
}

export function JsonImportModal({ onClose, onSuccess, context }: JsonImportModalProps) {
    const [jsonText, setJsonText] = useState('');
    const [importLevel, setImportLevel] = useState<'contest' | 'round' | 'exam'>('contest');
    const [importing, setImporting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const JSON_SAMPLES: Record<string, any> = {
        contest: {
            title: "Cuộc thi Tin học 2026",
            description: "Mô tả chi tiết về cuộc thi...",
            settings: {
                allowLanguages: ["javascript", "python", "cpp"],
                showHiddenTestCases: false,
                maxSubmissionsPerChallenge: 0,
                scoringMode: "highest"
            }
        },
        round: {
            title: "Vòng Loại Miền Bắc",
            order_index: 1,
            timing: {
                timingMode: "synchronized",
                duration_minutes: 120,
                start_time: null,
                end_time: null
            },
            promotion_config: {
                mode: "manual",
                autoRule: null
            }
        },
        exam: {
            title: "Đề thi Bảng A - Lượt 1",
            quest_data: [
                {
                    id: "algo-sum-2026",
                    gameType: "algo",
                    level: 1,
                    titleKey: "Tổng hai số",
                    descriptionKey: "Tính tổng 2 số nguyên a và b.",
                    gameConfig: {
                        type: "algo",
                        inputFormat: "2 số nguyên",
                        outputFormat: "1 số nguyên",
                        sampleCases: [{ input: "5 10", expectedOutput: "15", label: "Ví dụ 1" }],
                        hiddenCases: [{ input: "100 200", expectedOutput: "300" }]
                    }
                }
            ]
        }
    };

    const downloadSample = () => {
        const sample = JSON_SAMPLES[importLevel];
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sample, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `sample-${importLevel}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const handleImport = async () => {
        setImporting(true);
        setError(null);
        try {
            const data = JSON.parse(jsonText);

            if (importLevel === 'contest') {
                await importContest(data);
            } else if (importLevel === 'round') {
                await importRound(data);
            } else if (importLevel === 'exam') {
                await importExam(data);
            }

            onSuccess();
            onClose();
        } catch (e: any) {
            setError(e.message || 'Lỗi xử lý JSON');
        } finally {
            setImporting(false);
        }
    };

    const importContest = async (data: any) => {
        // Implementation of full contest import (Insert to multiple tables)
        const { error } = await supabase.from('contests').insert({
            id: `imported-${Date.now()}`,
            title: data.title,
            description: data.description,
            settings: data.settings,
            status: 'draft'
        });
        if (error) throw error;
        // ... (Nested rounds/exams import logic would go here)
        alert('Đã import contest metadata. Hợp đồng Round/Exam sẽ được xử lý trong bản cập nhật tới.');
    };

    const importRound = async (data: any) => {
        if (!context.contestId) throw new Error('Cần Contest ID để import Round');
        const { error } = await supabase.from('rounds').insert({
            contest_id: context.contestId,
            title: data.title,
            order_index: data.order_index,
            timing: data.timing,
            promotion_config: data.promotion_config
        });
        if (error) throw error;
    };

    const importExam = async (data: any) => {
        if (!context.roundId) throw new Error('Cần Round ID để import Exam');
        const { error } = await supabase.from('exams').insert({
            round_id: context.roundId,
            title: data.title,
            quest_data: data.quest_data
        });
        if (error) throw error;
    };

    return (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
            <div className="card glass-dark modal-content" style={{ width: 600, padding: 32, display: 'flex', flexDirection: 'column', gap: 20, border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 12, margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                    <FileDown size={24} className="text-accent" />
                    <span>Import Dữ liệu JSON</span>
                </h3>

                <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-secondary)', margin: 0 }}>Cấp độ Import</label>
                        <button
                            className="btn-link"
                            onClick={downloadSample}
                            style={{ fontSize: '0.75rem' }}
                        >
                            <FileDown size={14} />
                            Tải JSON mẫu
                        </button>
                    </div>
                    <select value={importLevel} onChange={e => setImportLevel(e.target.value as any)} style={{ padding: '14px 16px', fontWeight: 600, background: 'var(--bg-tertiary)', borderRadius: 10 }}>
                        <option value="contest">Toàn bộ Cuộc thi (Mới)</option>
                        <option value="round">Thêm Vòng thi mới</option>
                        <option value="exam">Thêm Bộ đề mới</option>
                    </select>
                </div>

                <div className="form-group">
                    <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>Nội dung JSON</label>
                    <textarea
                        value={jsonText}
                        onChange={e => setJsonText(e.target.value)}
                        placeholder='{"title": "Demo", ...}'
                        rows={10}
                        style={{ fontFamily: 'monospace', fontSize: '0.85rem', padding: 16, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 10 }}
                    />
                </div>

                {error && (
                    <div style={{ color: 'var(--danger)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8, padding: 12, background: 'rgba(255,107,107,0.1)', borderRadius: 8 }}>
                        <XCircle size={16} />
                        <span>{error}</span>
                    </div>
                )}

                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12 }}>
                    <button className="btn btn-secondary" onClick={onClose} style={{ padding: '12px 24px' }}>Hủy</button>
                    <button className="btn btn-primary" onClick={handleImport} disabled={importing || !jsonText} style={{ padding: '12px 24px' }}>
                        {importing ? 'Đang xử lý...' : 'Bắt đầu Import'}
                    </button>
                </div>
            </div>
        </div>
    );
}
