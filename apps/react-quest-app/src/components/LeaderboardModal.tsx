import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface LeaderboardEntry {
    participant_id: string;
    display_name: string;
    total_score: number;
    total_attempts: number;
    last_submission: string;
    rank?: number;
}

interface LeaderboardModalProps {
    isOpen: boolean;
    onClose: () => void;
    contestId: string;
    currentUserParticipantId?: string;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ 
    isOpen, 
    onClose, 
    contestId,
    currentUserParticipantId 
}) => {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && contestId) {
            fetchLeaderboard();
            
            // Subscribe to real-time updates for submissions
            const channel = supabase
                .channel(`leaderboard-${contestId}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'contest_submissions',
                        filter: `contest_id=eq.${contestId}`
                    },
                    () => {
                        fetchLeaderboard();
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [isOpen, contestId]);

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .rpc('get_contest_leaderboard', { contest_id_param: contestId });

            if (error) throw error;
            setLeaderboard(data || []);
        } catch (err) {
            console.error('Failed to fetch leaderboard:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-[#1e1e1e] border border-[#333] rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
                <div className="p-6 border-b border-[#333] flex justify-between items-center bg-[#252525]">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🏆</span>
                        <div>
                            <h2 className="text-xl font-bold text-white">Bảng Xếp Hạng</h2>
                            <p className="text-xs text-gray-400">Cập nhật thời gian thực</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-[#333] rounded-full transition-colors text-gray-400 hover:text-white"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    {loading && leaderboard.length === 0 ? (
                        <div className="flex items-center justify-center p-12 text-gray-400">
                            <div className="animate-spin mr-3">🌀</div> Đang tải bảng xếp hạng...
                        </div>
                    ) : leaderboard.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            Chưa có bài nộp nào. Hãy là người đầu tiên!
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead className="sticky top-0 bg-[#1e1e1e] text-gray-400 uppercase text-[10px] tracking-wider z-10">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Hạng</th>
                                    <th className="px-4 py-3 font-medium">Thí sinh</th>
                                    <th className="px-4 py-3 font-medium text-center">Tổng điểm</th>
                                    <th className="px-4 py-3 font-medium text-center">Nộp bài</th>
                                    <th className="px-4 py-3 font-medium text-right">Lần cuối</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#333]">
                                {leaderboard.map((entry, index) => {
                                    const isCurrentUser = entry.participant_id === currentUserParticipantId;
                                    const rank = index + 1;
                                    
                                    return (
                                        <tr 
                                            key={entry.participant_id}
                                            className={`transition-colors ${isCurrentUser ? 'bg-blue-900/20' : 'hover:bg-[#252525]'}`}
                                        >
                                            <td className="px-4 py-4">
                                                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold ${
                                                    rank === 1 ? 'bg-yellow-500 text-black' :
                                                    rank === 2 ? 'bg-gray-300 text-black' :
                                                    rank === 3 ? 'bg-amber-600 text-white' :
                                                    'bg-[#333] text-gray-400'
                                                }`}>
                                                    {rank}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="font-semibold text-white">
                                                    {entry.display_name}
                                                    {isCurrentUser && <span className="ml-2 text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded-full uppercase">Bạn</span>}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <span className="text-lg font-bold text-blue-400">{entry.total_score}</span>
                                            </td>
                                            <td className="px-4 py-4 text-center text-gray-400">
                                                {entry.total_attempts}
                                            </td>
                                            <td className="px-4 py-4 text-right text-gray-500 text-[11px]">
                                                {new Date(entry.last_submission).toLocaleTimeString('vi-VN')}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="p-4 border-t border-[#333] bg-[#1a1a1a] text-center text-[11px] text-gray-500">
                    Bảng xếp hạng tự động cập nhật khi có bài nộp mới.
                </div>
            </div>
        </div>
    );
};
