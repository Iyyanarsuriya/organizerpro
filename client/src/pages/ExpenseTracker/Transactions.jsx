import React from 'react';
import { FaPlus, FaEdit, FaTrash, FaUserCheck, FaExchangeAlt, FaSearch, FaFilter, FaCalendarAlt, FaUser, FaProjectDiagram } from 'react-icons/fa'; // Added icons
import { formatDateTime, formatAmount } from '../../utils/formatUtils';
import ExportButtons from '../../components/ExportButtons'; // Imported

const Transactions = ({
    filteredTransactions,
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    sortBy,
    setSortBy,
    handleAddNewTransaction,
    handleEdit,
    confirmDelete,

    // New Props for internal filters
    projects = [], members = [], roles = [],
    filterProject, setFilterProject,
    filterMember, setFilterMember,
    filterRole, setFilterRole,
    periodType, setPeriodType,
    currentPeriod, setCurrentPeriod,
    customRange, setCustomRange,
    onExportCSV, onExportPDF, onExportTXT
}) => {
    return (
        <div className="animate-in slide-in-from-right-10 duration-500">
            {/* Header with Filters */}
            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-[32px] border border-white/20 shadow-xl shadow-slate-200/50 mb-8 sticky top-4 z-10">
                {/* Title & Actions */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Transactions</h2>
                        <p className="text-sm font-medium text-slate-400 mt-1">Manage and track your financial records</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <ExportButtons onExportCSV={onExportCSV} onExportPDF={onExportPDF} onExportTXT={onExportTXT} />
                        <button onClick={handleAddNewTransaction} className="bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-6 rounded-2xl shadow-lg shadow-blue-500/20 hover:scale-105 transition-all flex items-center gap-2 group">
                            <FaPlus className="group-hover:rotate-90 transition-transform duration-300" />
                            <span className="text-xs font-bold uppercase tracking-widest">New</span>
                        </button>
                    </div>
                </div>

                {/* Filters Bar */}
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Left: Period & Date - Floating Style */}
                    <div className="flex flex-col sm:flex-row gap-2 p-1.5 bg-slate-50 rounded-2xl border border-slate-100 shrink-0">
                        {/* Period Tabs */}
                        <div className="flex bg-white rounded-xl shadow-sm p-1 gap-1">
                            {['day', 'week', 'month', 'range'].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setPeriodType(type)}
                                    className={`
                                        flex-1 px-4 h-8 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all outline-none focus:outline-none ring-0
                                        ${periodType === type
                                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                                            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                                        }
                                    `}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                        {/* Date Input */}
                        <div className="px-3 flex items-center min-w-[140px] border-l border-slate-200 pl-4 ml-2">
                            <FaCalendarAlt className="text-slate-300 mr-2" size={12} />
                            {periodType === 'day' ? <input type="date" value={currentPeriod.length === 10 ? currentPeriod : ''} onChange={(e) => setCurrentPeriod(e.target.value)} className="w-full text-xs font-bold text-slate-700 outline-none bg-transparent font-mono" /> :
                                periodType === 'week' ? <input type="week" value={currentPeriod.includes('W') ? currentPeriod : ''} onChange={(e) => setCurrentPeriod(e.target.value)} className="w-full text-xs font-bold text-slate-700 outline-none bg-transparent font-mono" /> :
                                    periodType === 'month' ? <input type="month" value={currentPeriod.length === 7 ? currentPeriod : ''} onChange={(e) => setCurrentPeriod(e.target.value)} className="w-full text-xs font-bold text-slate-700 outline-none bg-transparent font-mono" /> :
                                        <div className="flex items-center gap-2 w-full"><input type="date" value={customRange.start} onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })} className="text-[10px] font-bold text-slate-700 w-full bg-transparent font-mono" /><span className="text-slate-300">-</span><input type="date" value={customRange.end} onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })} className="text-[10px] font-bold text-slate-700 w-full bg-transparent font-mono" /></div>}
                        </div>
                    </div>

                    {/* Right: Entity Filters & Search */}
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
                        {/* Project - Indigo Theme */}
                        <div className="relative group">
                            <FaProjectDiagram className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 group-hover:text-indigo-500 transition-colors" size={14} />
                            <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)} className="w-full bg-indigo-50 hover:bg-indigo-100 border border-transparent rounded-2xl py-3 pl-10 pr-10 text-xs font-black text-indigo-600 text-center outline-none focus:ring-2 focus:ring-indigo-200 transition-all cursor-pointer appearance-none uppercase tracking-wide">
                                <option value="">All Projects</option>
                                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-400 text-[10px]">▼</div>
                        </div>

                        {/* Member - Emerald Theme */}
                        <div className="relative group">
                            <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 group-hover:text-emerald-500 transition-colors" size={12} />
                            <select value={filterMember} onChange={(e) => setFilterMember(e.target.value)} className="w-full bg-emerald-50 hover:bg-emerald-100 border border-transparent rounded-2xl py-3 pl-10 pr-10 text-xs font-black text-emerald-600 text-center outline-none focus:ring-2 focus:ring-emerald-200 transition-all cursor-pointer appearance-none uppercase tracking-wide">
                                <option value="">All Members</option>
                                <option value="guest">Guests / Non-Members</option>
                                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-400 text-[10px]">▼</div>
                        </div>

                        {/* Type - Purple Theme */}
                        <div className="relative group">
                            <FaFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 group-hover:text-purple-500 transition-colors" size={12} />
                            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full bg-purple-50 hover:bg-purple-100 border border-transparent rounded-2xl py-3 pl-10 pr-10 text-xs font-black text-purple-600 text-center outline-none focus:ring-2 focus:ring-purple-200 transition-all cursor-pointer appearance-none uppercase tracking-wide">
                                <option value="all">All Types</option>
                                <option value="income">Income</option>
                                <option value="expense">Expense</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-purple-400 text-[10px]">▼</div>
                        </div>

                        {/* Search - Blue Theme */}
                        <div className="relative col-span-2 md:col-span-1 group">
                            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 group-hover:text-blue-500 transition-colors" size={12} />
                            <input
                                type="text"
                                placeholder="SEARCH..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-blue-50 hover:bg-blue-100 border border-transparent rounded-2xl py-3 pl-10 pr-4 text-xs font-black text-blue-600 text-center placeholder:text-blue-300 outline-none focus:ring-2 focus:ring-blue-200 transition-all uppercase tracking-wide"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {filteredTransactions.map(t => (
                    <div key={t.id} className="bg-white p-4 sm:p-6 rounded-[32px] shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:shadow-md transition-all">
                        <div className="flex items-center gap-4">
                            <div className={`w - 12 h - 12 sm: w - 14 sm: h - 14 rounded - 2xl flex items - center justify - center text - xl shadow - sm shrink - 0 transition - transform group - hover: scale - 105 ${t.type === 'income' ? 'bg-blue-50 text-blue-500' : 'bg-red-50 text-red-500'} `}>
                                {t.type === 'income' ? '↓' : '↑'}
                            </div>
                            <div>
                                <h4 className="font-black text-slate-900 text-sm sm:text-base leading-tight">{t.title}</h4>
                                <div className="h-[8px] mt-1.5 flex flex-wrap gap-1">
                                    <div className="px-1 bg-slate-100 text-[6px] font-black text-slate-400 rounded-full flex items-center uppercase tracking-tighter">
                                        {t.category}
                                    </div>
                                    {t.project_name && (
                                        <div className="px-1 bg-blue-50 text-[6px] font-black text-blue-500 rounded-full flex items-center uppercase tracking-tighter">
                                            {t.project_name}
                                        </div>
                                    )}
                                    {t.member_name && (
                                        <div className={`px-1 text-[6px] font-black rounded-full flex items-center uppercase tracking-tighter ${!t.member_id ? 'bg-amber-50 text-amber-600' : 'bg-orange-50 text-orange-500'}`}>
                                            {!t.member_id && 'GUEST: '}{t.member_name}
                                        </div>
                                    )}
                                    <div className="px-1 bg-slate-50 text-[6px] font-black text-slate-300 rounded-full flex items-center uppercase tracking-tighter">
                                        {formatDateTime(t.updated_at || t.created_at)}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-50">
                            <p className={`text - lg sm: text - xl font - black tracking - tight ${t.type === 'income' ? 'text-blue-600' : 'text-red-600'} `}>
                                {t.type === 'income' ? '+' : '-'}₹{formatAmount(t.amount)}
                            </p>
                            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEdit(t)} className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all cursor-pointer">
                                    <FaEdit size={14} />
                                </button>
                                <button onClick={() => confirmDelete(t.id)} className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer">
                                    <FaTrash size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                {filteredTransactions.length === 0 && (
                    <div className="text-center py-[64px] bg-white rounded-[32px] border border-dashed border-slate-200">
                        <div className="w-[64px] h-[64px] bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-[16px]">
                            <FaExchangeAlt className="text-slate-300" />
                        </div>
                        <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest">No transactions found</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Transactions;
