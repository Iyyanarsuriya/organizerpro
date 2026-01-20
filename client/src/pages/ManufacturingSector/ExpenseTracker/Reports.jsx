import React from 'react';
import { FaFileAlt, FaReceipt, FaHandHoldingUsd, FaMoneyBillWave } from 'react-icons/fa';
import { formatAmount } from '../../../utils/formatUtils';

const Reports = ({
    transactions,
    filteredTransactions,
    handleExportPDF,
    handleExportCSV,
    handleExportTXT,
    filterMember,
    filterProject,
    members,
    projects,
    periodType,
    customRange,
    currentPeriod,
    memberStats,
    stats,
    setShowCustomReportModal,
    setCustomReportForm,
    customReportForm
}) => {
    // Ledger Logic for Member View
    const memberLedgerBalance = React.useMemo(() => {
        if (!filterMember) return { earned: 0, paid: 0, balance: 0 };
        const earned = transactions.filter(t => t.category === 'Salary Pot').reduce((acc, t) => acc + parseFloat(t.amount || 0), 0);
        const paid = transactions.filter(t => ['Salary', 'Advance'].includes(t.category)).reduce((acc, t) => acc + parseFloat(t.amount || 0), 0);
        return { earned, paid, balance: earned - paid };
    }, [transactions, filterMember]);

    return (
        <div className="animate-in slide-in-from-right-10 duration-500">
            <div className="flex justify-between items-center mb-[32px]">
                <h2 className="text-[20px] sm:text-[24px] font-black tracking-tight text-slate-900">Financial Intelligence</h2>
                <div className="flex items-center gap-[8px]">
                    <button
                        onClick={() => handleExportPDF(filteredTransactions)}
                        className="bg-slate-900 text-white px-[16px] py-[10px] rounded-[14px] text-[10px] font-black uppercase tracking-widest shadow-lg shadow-black/10 hover:scale-105 transition-all whitespace-nowrap"
                    >
                        PDF
                    </button>
                    <button
                        onClick={() => handleExportCSV(filteredTransactions)}
                        className="bg-white border border-slate-200 px-[16px] py-[10px] rounded-[14px] text-[10px] font-black uppercase tracking-widest hover:border-blue-500 hover:text-blue-500 transition-all whitespace-nowrap"
                    >
                        CSV
                    </button>
                    <button
                        onClick={() => handleExportTXT(filteredTransactions)}
                        className="bg-white border border-slate-200 px-[16px] py-[10px] rounded-[14px] text-[10px] font-black uppercase tracking-widest hover:border-blue-500 hover:text-blue-500 transition-all whitespace-nowrap"
                    >
                        Text
                    </button>
                </div>
            </div>
            <div className="bg-white p-[32px] sm:p-[48px] rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[100px] -mr-[150px] -mt-[150px]"></div>
                <div className="relative">
                    <div className="flex items-center gap-[16px] mb-[48px]">
                        <div className="w-[56px] h-[56px] bg-blue-500/10 text-blue-500 rounded-[20px] flex items-center justify-center text-[24px]">
                            <FaFileAlt />
                        </div>
                        <div>
                            <h3 className="text-[20px] font-black text-slate-900">
                                {filterMember
                                    ? `${members.find(w => w.id == filterMember)?.name}'s Ledger`
                                    : filterProject
                                        ? `${projects.find(p => p.id == filterProject)?.name} Analysis`
                                        : 'Global Performance'}
                            </h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">
                                {periodType} VIEW: {periodType === 'range' ? `${customRange.start} to ${customRange.end}` : currentPeriod}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                        {filterMember ? (
                            <>
                                <div className="p-6 bg-emerald-50/50 rounded-3xl border border-emerald-100 flex flex-col justify-between min-h-[140px]">
                                    <div>
                                        <p className="text-[8px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-1">Unpaid Balance</p>
                                        <h4 className={`text-3xl font-black tracking-tighter ${memberLedgerBalance.balance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                            ₹{formatAmount(memberLedgerBalance.balance)}
                                        </h4>
                                    </div>
                                    <div className="h-[8px] flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                        <span className="text-[6px] font-black text-emerald-600 uppercase tracking-tighter">EARNED - PAID (PERIOD)</span>
                                    </div>
                                </div>
                                <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100 flex flex-col justify-between min-h-[140px]">
                                    <div>
                                        <p className="text-[8px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1">Total Earned (Pots)</p>
                                        <h4 className="text-3xl font-black tracking-tighter text-blue-600">₹{formatAmount(memberLedgerBalance.earned)}</h4>
                                    </div>
                                    <div className="h-[8px] flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                        <span className="text-[6px] font-black text-blue-600 uppercase tracking-tighter">DAILY POTS POSTED</span>
                                    </div>
                                </div>
                                <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 shadow-xl shadow-slate-900/10 flex flex-col justify-between min-h-[140px]">
                                    <div>
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Lifetime Payout</p>
                                        <h4 className="text-3xl font-black tracking-tighter text-white">₹{formatAmount(stats.lifetime?.total_expense || 0)}</h4>
                                    </div>
                                    <div className="h-[8px] flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-600"></div>
                                        <span className="text-[6px] font-black text-slate-400 uppercase tracking-tighter">TOTAL CASH TRANSFERRED</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="p-6 bg-emerald-50/50 rounded-3xl border border-emerald-100 flex flex-col justify-between min-h-[140px]">
                                    <div>
                                        <p className="text-[8px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-1">Total Income</p>
                                        <h4 className="text-3xl font-black tracking-tighter text-emerald-600">₹{formatAmount(stats.summary?.total_income || 0)}</h4>
                                    </div>
                                    <div className="h-[8px] flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                        <span className="text-[6px] font-black text-emerald-600 uppercase tracking-tighter">PERIOD EARNINGS</span>
                                    </div>
                                </div>
                                <div className="p-6 bg-rose-50/50 rounded-3xl border border-rose-100 flex flex-col justify-between min-h-[140px]">
                                    <div>
                                        <p className="text-[8px] font-black text-rose-400 uppercase tracking-[0.2em] mb-1">Total Expense</p>
                                        <h4 className="text-3xl font-black tracking-tighter text-rose-600">₹{formatAmount(stats.summary?.total_expense || 0)}</h4>
                                    </div>
                                    <div className="h-[8px] flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                                        <span className="text-[6px] font-black text-rose-600 uppercase tracking-tighter">PERIOD SPENDING</span>
                                    </div>
                                </div>
                                <div className="p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100 flex flex-col justify-between min-h-[140px]">
                                    <div>
                                        <p className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1">Total Units Tracked</p>
                                        <h4 className="text-3xl font-black tracking-tighter text-indigo-600">
                                            {formatAmount(filteredTransactions.reduce((acc, t) => acc + parseFloat(t.quantity || 1), 0))}
                                        </h4>
                                    </div>
                                    <div className="h-[8px] flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                        <span className="text-[6px] font-black text-indigo-600 uppercase tracking-tighter">UNITS (SALES + PURCHASES)</span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {filterMember && (
                        <div className="mb-16 animate-in fade-in slide-in-from-bottom-5 duration-700">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-1 h-6 bg-indigo-500 rounded-full"></div>
                                <h4 className="text-xs font-black uppercase tracking-widest text-slate-800">Detailed Transaction Ledger</h4>
                            </div>
                            <div className="overflow-x-auto rounded-[32px] border border-slate-100 bg-white shadow-xs overflow-hidden">
                                <table className="w-full text-left border-collapse min-w-[600px]">
                                    <thead>
                                        <tr className="bg-slate-50/80">
                                            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Entry Date</th>
                                            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Reference Details</th>
                                            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Debit / Credit</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {transactions.length > 0 ? (
                                            [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).map((t) => (
                                                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="px-6 py-5">
                                                        <p className="text-[11px] font-bold text-slate-500">
                                                            {new Date(t.date).toLocaleDateString('en-GB')}
                                                        </p>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <p className="text-[13px] font-black text-slate-800 leading-tight mb-1">{t.title}</p>
                                                        <div className="h-[8px] flex gap-1">
                                                            <div className={`px-1.5 rounded-full flex items-center text-[6px] font-black uppercase tracking-tighter ${t.category === 'Salary Pot' ? 'bg-amber-100 text-amber-600' :
                                                                t.category === 'Advance' ? 'bg-indigo-100 text-indigo-600' :
                                                                    'bg-blue-100 text-blue-600'
                                                                }`}>
                                                                {t.category}
                                                            </div>
                                                            {t.project_name && <div className="px-1.5 bg-slate-100 text-[6px] font-black text-slate-400 rounded-full flex items-center uppercase tracking-tighter">{t.project_name}</div>}
                                                            <div className={`px-1.5 rounded-full flex items-center text-[6px] font-black uppercase tracking-tighter ${t.type === 'income' ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-50 text-slate-400'}`}>
                                                                {t.type.toUpperCase()}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5 text-right">
                                                        <p className={`text-[13px] font-black ${t.category === 'Salary Pot' ? 'text-amber-500' : 'text-slate-900'}`}>
                                                            {t.category === 'Salary Pot' ? '+' : '-'}₹{formatAmount(t.amount)}
                                                        </p>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="3" className="px-6 py-12 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    No ledger entries found for this period
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                    {transactions.length > 0 && (
                                        <tfoot>
                                            <tr className="bg-slate-900 text-white">
                                                <td colSpan="2" className="px-6 py-6 rounded-bl-[32px]">
                                                    <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Period Net Balance (Unpaid)</p>
                                                </td>
                                                <td className="px-6 py-6 text-right rounded-br-[32px]">
                                                    <p className="text-2xl font-black tracking-tighter text-blue-400">
                                                        ₹{formatAmount(memberLedgerBalance.balance)}
                                                    </p>
                                                </td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>
                        </div>
                    )}

                    {filterMember && stats.memberProjects && stats.memberProjects.length > 0 && (
                        <div className="mb-16 animate-in fade-in slide-in-from-bottom-5 duration-1000">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                                <h4 className="text-xs font-black uppercase tracking-widest text-slate-800">Project Allocation</h4>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {stats.memberProjects.map((pw, i) => (
                                    <div key={i} className="bg-white border border-slate-100 p-5 rounded-3xl flex justify-between items-center group hover:border-blue-200 transition-all shadow-xs">
                                        <div>
                                            <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1">{pw.project_name}</h5>
                                            <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">Member Total Distribution</p>
                                        </div>
                                        <p className="text-xl font-black text-blue-600">₹{formatAmount(pw.total)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {!filterMember && stats.memberExpenses && stats.memberExpenses.length > 0 && (
                        <div className="mb-16 animate-in fade-in slide-in-from-bottom-5 duration-700">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-1 h-6 bg-purple-500 rounded-full"></div>
                                <h4 className="text-xs font-black uppercase tracking-widest text-slate-800">Member Disbursement View</h4>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {stats.memberExpenses.map((me, i) => (
                                    <div key={i} className="bg-white border border-slate-100 p-6 rounded-[32px] shadow-xs hover:border-purple-200 transition-all group">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center text-xs font-black">
                                                {me.member_name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-[13px] font-black text-slate-900">{me.member_name}</p>
                                                <div className="h-[8px] flex items-center gap-1">
                                                    <div className="w-1 h-1 rounded-full bg-blue-500"></div>
                                                    <span className="text-[6px] font-black text-slate-400 uppercase tracking-tighter">FINANCIAL ASSET</span>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-2xl font-black text-slate-900 tracking-tighter">₹{formatAmount(me.total)}</p>
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Paid this period</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-center mt-8">
                        <button
                            onClick={() => {
                                setCustomReportForm({
                                    ...customReportForm,
                                    projectId: filterProject || '',
                                    memberId: filterMember || '',
                                    startDate: periodType === 'range' ? customRange.start : (currentPeriod || new Date().toISOString().split('T')[0]),
                                    endDate: periodType === 'range' ? customRange.end : (currentPeriod || new Date().toISOString().split('T')[0])
                                });
                                setShowCustomReportModal(true);
                            }}
                            className="bg-blue-50 text-blue-600 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all border border-blue-100"
                        >
                            Configure Custom Analytics
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
