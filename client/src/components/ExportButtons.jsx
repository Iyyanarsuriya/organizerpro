import React from 'react';
import { FaFileCsv, FaFilePdf, FaFileAlt } from 'react-icons/fa';

const ExportButtons = ({ onExportCSV, onExportPDF, onExportTXT, className = "" }) => {
    return (
        <div className={`flex items-center gap-[8px] ${className}`}>
            <button
                onClick={onExportCSV}
                className="w-[36px] h-[36px] sm:w-[40px] sm:h-[40px] rounded-[10px] sm:rounded-[12px] bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm shrink-0 cursor-pointer"
                title="Export CSV"
            >
                <FaFileCsv size={16} />
            </button>
            <button
                onClick={onExportPDF}
                className="w-[36px] h-[36px] sm:w-[40px] sm:h-[40px] rounded-[10px] sm:rounded-[12px] bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm shrink-0 cursor-pointer"
                title="Export PDF"
            >
                <FaFilePdf size={16} />
            </button>
            <button
                onClick={onExportTXT}
                className="w-[36px] h-[36px] sm:w-[40px] sm:h-[40px] rounded-[10px] sm:rounded-[12px] bg-slate-50 text-slate-600 border border-slate-100 flex items-center justify-center hover:bg-slate-800 hover:text-white transition-all shadow-sm shrink-0 cursor-pointer"
                title="Export TXT"
            >
                <FaFileAlt size={16} />
            </button>
        </div>
    );
};

export default ExportButtons;
