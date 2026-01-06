import React from 'react';
import { FaFileAlt } from 'react-icons/fa';
import { formatAmount } from '../../utils/formatUtils';

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
    return (
        <div className="animate-in slide-in-from-right-10 duration-500">
            <div className="flex justify-between items-center mb-[32px]">
                <h2 className="text-[20px] sm:text-[24px] font-black">Financial Reports</h2>
                <div className="flex items-center gap-[8px]">
                    <button
                        onClick={() => handleExportPDF(filteredTransactions)}
                        className="bg-[#1a1c21] text-white px-[16px] py-[10px] rounded-[14px] text-[10px] font-black uppercase tracking-widest shadow-lg shadow-black/10 hover:scale-105 transition-all whitespace-nowrap"
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
                            <h3 className="text-[20px] font-black">
                                {filterMember
                                    ? `${members.find(w => w.id == filterMember)?.name}'s Report`
                                    : filterProject
                                        ? `${projects.find(p => p.id == filterProject)?.name} Report`
                                        : 'Financial Summary'}
                            </h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                {periodType} Performance: {periodType === 'range' ? `${customRange.start} to ${customRange.end}` : currentPeriod}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-[32px] mb-[64px]">
                        {filterMember ? (
                            <>
                                <div className="p-[24px] bg-blue-50/50 rounded-[24px] border border-blue-100">
                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-[8px]">Total Salary Paid</p>
                                    <p className="text-[32px] font-black tracking-tighter text-blue-600">₹{formatAmount(memberStats?.totalSalary || 0)}</p>
                                    <div className="mt-[16px] flex items-center gap-[8px]">
                                        <div className="w-[8px] h-[8px] rounded-full bg-blue-500"></div>
                                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Fixed Payouts</span>
                                    </div>
                                </div>
                                <div className="p-[24px] bg-orange-50/50 rounded-[24px] border border-orange-100">
                                    <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-[8px]">Total Advances</p>
                                    <p className="text-[32px] font-black tracking-tighter text-orange-600">₹{formatAmount(memberStats?.totalAdvances || 0)}</p>
                                    <div className="mt-[16px] flex items-center gap-[8px]">
                                        <div className="w-[8px] h-[8px] rounded-full bg-orange-500"></div>
                                        <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Ad-hoc Payments</span>
                                    </div>
                                </div>
                                <div className="p-[24px] bg-slate-900 rounded-[24px] border border-slate-800 shadow-xl shadow-slate-900/20">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[8px]">Lifetime Payout</p>
                                    <p className="text-[32px] font-black tracking-tighter text-white">₹{formatAmount(stats.lifetime?.total_expense - stats.lifetime?.total_income)}</p>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-[16px]">Total across all time</p>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="p-[24px] bg-slate-50 rounded-[24px] border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[8px]">Total Income</p>
                                    <p className="text-[32px] font-black tracking-tighter text-emerald-600">₹{formatAmount(stats.lifetime?.total_income || 0)}</p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-[16px]">Lifetime Earnings</p>
                                </div>
                                <div className="p-[24px] bg-slate-50 rounded-[24px] border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[8px]">Total Expense</p>
                                    <p className="text-[32px] font-black tracking-tighter text-rose-600">₹{formatAmount(stats.lifetime?.total_expense || 0)}</p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-[16px]">Lifetime Spending</p>
                                </div>
                            </>
                        )}
                    </div>

                    {filterMember && (
                        <div className="mb-[64px] animate-in fade-in slide-in-from-bottom-5 duration-700">
                            <div className="flex items-center gap-[12px] mb-[24px]">
                                <div className="w-[8px] h-[24px] bg-emerald-500 rounded-full"></div>
                                <h4 className="text-[16px] font-black uppercase tracking-widest text-slate-800">Member Ledger: Salaries & Advances</h4>
                            </div>
                            <div className="overflow-x-auto rounded-[24px] border border-slate-100 bg-slate-50/50">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100">
                                            <th className="px-[24px] py-[16px] text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                            <th className="px-[24px] py-[16px] text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                                            <th className="px-[24px] py-[16px] text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                                            <th className="px-[24px] py-[16px] text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transactions.length > 0 ? (
                                            [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).map((t) => (
                                                <tr key={t.id} className="border-b border-slate-50 hover:bg-white transition-colors group">
                                                    <td className="px-[24px] py-[16px]">
                                                        <p className="text-[12px] font-bold text-slate-600">
                                                            {(() => {
                                                                const d = new Date(t.date);
                                                                return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
                                                            })()}
                                                        </p>
                                                    </td>
                                                    <td className="px-[24px] py-[16px]">
                                                        <p className="text-[14px] font-black text-slate-800">{t.title}</p>
                                                    </td>
                                                    <td className="px-[24px] py-[16px]">
                                                        <span className={`px-[12px] py-[4px] rounded-full text-[10px] font-black uppercase tracking-widest ${t.category.toLowerCase().includes('salary') ? 'bg-blue-100 text-blue-600' : t.category.toLowerCase().includes('advance') ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'}`}>
                                                            {t.category}
                                                        </span>
                                                    </td>
                                                    <td className="px-[24px] py-[16px] text-right">
                                                        <p className={`text-[14px] font-black ${t.type === 'income' ? 'text-blue-500' : 'text-red-500'}`}>
                                                            {t.type === 'income' ? '+' : '-'}₹{formatAmount(t.amount)}
                                                        </p>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="4" className="px-[24px] py-[48px] text-center">
                                                    <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">No transaction history for this member in the selected period.</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                    {transactions.length > 0 && (
                                        <tfoot>
                                            <tr className="bg-slate-900 text-white">
                                                <td colSpan="3" className="px-[24px] py-[20px] rounded-bl-[24px]">
                                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Net Paid (Period Total)</p>
                                                </td>
                                                <td className="px-[24px] py-[20px] text-right rounded-br-[24px]">
                                                    <p className="text-[18px] font-black tracking-tighter">
                                                        ₹{formatAmount(stats.summary?.total_expense - stats.summary?.total_income)}
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
                        <div className="mb-[64px] animate-in fade-in slide-in-from-bottom-5 duration-1000">
                            <div className="flex items-center gap-[12px] mb-[24px]">
                                <div className="w-[8px] h-[24px] bg-blue-500 rounded-full"></div>
                                <h4 className="text-[16px] font-black uppercase tracking-widest text-slate-800">Project Breakdown (Lifetime)</h4>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[16px]">
                                {stats.memberProjects.map((pw, i) => (
                                    <div key={i} className="bg-slate-50 border border-slate-100 p-[20px] rounded-[24px] flex justify-between items-center group hover:bg-white hover:shadow-lg transition-all">
                                        <div>
                                            <p className="text-[12px] font-black text-slate-800 uppercase tracking-widest mb-[4px]">{pw.project_name}</p>
                                            <p className="text-[10px] font-bold text-slate-400">Total Contribution</p>
                                        </div>
                                        <p className="text-[18px] font-black text-blue-500 group-hover:scale-110 transition-transform">₹{formatAmount(pw.total)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {!filterMember && stats.memberExpenses && stats.memberExpenses.length > 0 && (
                        <div className="mb-[64px] animate-in fade-in slide-in-from-bottom-5 duration-700">
                            <div className="flex items-center gap-[12px] mb-[24px]">
                                <div className="w-[8px] h-[24px] bg-blue-500 rounded-full"></div>
                                <h4 className="text-[16px] font-black uppercase tracking-widest text-slate-800">Labour Payments (This Period)</h4>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[16px]">
                                {stats.memberExpenses.map((me, i) => (
                                    <div key={i} className="bg-white border border-slate-100 p-[24px] rounded-[32px] shadow-sm hover:shadow-md transition-all group">
                                        <div className="flex items-center gap-[16px] mb-[12px]">
                                            <div className="w-[40px] h-[40px] bg-slate-100 rounded-full flex items-center justify-center text-[14px] font-black text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                {me.member_name.charAt(0)}
                                            </div>
                                            <p className="font-black text-slate-800">{me.member_name}</p>
                                        </div>
                                        <p className="text-[20px] font-black text-blue-600">₹{formatAmount(me.total)}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-[4px]">Paid in this period</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-center">
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
                            className="text-[12px] font-black text-blue-500 uppercase tracking-widest hover:bg-blue-50 px-[32px] py-[12px] rounded-[16px] transition-all"
                        >
                            Generate Custom Report
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
