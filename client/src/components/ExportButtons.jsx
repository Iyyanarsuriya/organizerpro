import React, { useState } from 'react';
import { FaFileCsv, FaFilePdf, FaFileAlt, FaCheck, FaTimes, FaQuestionCircle } from 'react-icons/fa';

const ExportButtons = ({ data, onExportCSV, onExportPDF, onExportTXT, className = "" }) => {
    const [confirmModal, setConfirmModal] = useState({ show: false, type: null, label: '' });

    if (!data || data.length === 0) return null;

    const handleConfirm = () => {
        if (confirmModal.type === 'CSV') onExportCSV(data);
        if (confirmModal.type === 'PDF') onExportPDF(data);
        if (confirmModal.type === 'TXT') onExportTXT(data);
        setConfirmModal({ show: false, type: null, label: '' });
    };

    return (
        <div className={`flex items-center gap-[8px] ${className}`}>
            <button
                onClick={() => setConfirmModal({ show: true, type: 'CSV', label: 'CSV Report' })}
                className="w-[36px] h-[36px] sm:w-[40px] sm:h-[40px] rounded-[10px] sm:rounded-[12px] bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm shrink-0 cursor-pointer"
                title="Export CSV"
            >
                <FaFileCsv size={16} />
            </button>
            <button
                onClick={() => setConfirmModal({ show: true, type: 'PDF', label: 'PDF Report' })}
                className="w-[36px] h-[36px] sm:w-[40px] sm:h-[40px] rounded-[10px] sm:rounded-[12px] bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm shrink-0 cursor-pointer"
                title="Export PDF"
            >
                <FaFilePdf size={16} />
            </button>
            <button
                onClick={() => setConfirmModal({ show: true, type: 'TXT', label: 'Plain Text' })}
                className="w-[36px] h-[36px] sm:w-[40px] sm:h-[40px] rounded-[10px] sm:rounded-[12px] bg-slate-50 text-slate-600 border border-slate-100 flex items-center justify-center hover:bg-slate-800 hover:text-white transition-all shadow-sm shrink-0 cursor-pointer"
                title="Export TXT"
            >
                <FaFileAlt size={16} />
            </button>

            {/* Confirmation Modal */}
            {confirmModal.show && (
                <div className="fixed inset-0 z-250 flex items-center justify-center p-[16px] animate-in fade-in duration-200">
                    <div className="absolute inset-0 bg-[#0f172a]/60 backdrop-blur-sm" onClick={() => setConfirmModal({ show: false, type: null, label: '' })}></div>
                    <div className="relative bg-white rounded-[32px] p-[32px] w-full max-w-[360px] shadow-2xl animate-in zoom-in duration-300 text-center border border-white">
                        <div className="w-[64px] h-[64px] bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-[20px] text-blue-500">
                            <FaQuestionCircle size={32} />
                        </div>
                        <h3 className="text-[20px] font-black text-slate-800 mb-[8px]">Export {confirmModal.label}?</h3>
                        <p className="text-slate-500 text-[14px] font-medium mb-[28px] leading-relaxed">
                            Are you sure you want to download this {confirmModal.type} report?
                        </p>
                        <div className="grid grid-cols-2 gap-[12px]">
                            <button
                                onClick={() => setConfirmModal({ show: false, type: null, label: '' })}
                                className="py-[14px] rounded-[16px] bg-slate-100 text-slate-600 text-[12px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirm}
                                className="py-[14px] rounded-[16px] bg-slate-900 text-white text-[12px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 cursor-pointer flex items-center justify-center gap-[8px]"
                            >
                                <FaCheck /> Export
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExportButtons;
