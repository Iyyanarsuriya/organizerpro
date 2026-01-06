import React from 'react';
import { FaFileAlt, FaMoneyBillWave, FaUserCheck, FaArrowLeft, FaPlusCircle, FaQuestionCircle } from 'react-icons/fa';
import { formatAmount } from '../../utils/formatUtils';

const SalaryCalculator = ({
    periodType,
    filterMember,
    setFilterMember,
    members,
    filteredTransactions,
    handleExportPDF,
    salaryLoading,
    attendanceStats,
    salaryMode,
    setSalaryMode,
    dailyWage,
    setDailyWage,
    monthlySalary,
    setMonthlySalary,
    unitsProduced,
    setUnitsProduced,
    ratePerUnit,
    setRatePerUnit,
    bonus,
    setBonus,
    stats,
    setFormData,
    formData,
    setShowAddModal,
    transactions
}) => {
    return (
        <div className="animate-in slide-in-from-right-10 duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-[32px]">
                <h2 className="text-[20px] sm:text-[24px] font-black">Salary Calculator</h2>
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    {filterMember && (
                        <button
                            onClick={() => handleExportPDF(filteredTransactions)}
                            className="flex-1 sm:flex-none px-4 py-3 sm:py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"
                        >
                            <FaFileAlt /> Download Report
                        </button>
                    )}
                    <div className="flex-1 sm:flex-none px-4 py-3 sm:py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest text-center">
                        Based on {periodType} Attendance
                    </div>
                </div>
            </div>

            {!filterMember ? (
                <div className="bg-white rounded-[24px] sm:rounded-[40px] p-[32px] sm:p-[64px] text-center border border-slate-100 shadow-xl">
                    <div className="w-[64px] h-[64px] sm:w-[80px] sm:h-[80px] bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-[24px]">
                        <FaMoneyBillWave className="text-slate-300 text-[28px] sm:text-[32px]" />
                    </div>
                    <h3 className="text-[18px] font-black text-slate-800 mb-[8px]">Select a Member</h3>
                    <p className="text-slate-400 text-[12px] font-bold uppercase tracking-widest mb-[32px] max-w-sm mx-auto">Please select a member from the filters above to calculate their salary</p>
                    <select
                        onChange={(e) => setFilterMember(e.target.value)}
                        className="w-full sm:w-auto px-[32px] py-[16px] bg-slate-100 rounded-[20px] font-black text-[12px] uppercase tracking-widest outline-none cursor-pointer hover:bg-slate-200 transition-all"
                    >
                        <option value="">Choose Member...</option>
                        {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                </div>
            ) : salaryLoading ? (
                <div className="h-[400px] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#2d5bff]"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-[32px]">
                    {/* Stats Column */}
                    <div className="lg:col-span-2 space-y-[32px]">
                        <div className="bg-white rounded-[24px] sm:rounded-[40px] p-[24px] sm:p-[48px] shadow-xl border border-slate-100">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-[40px]">
                                <div className="flex items-center gap-[16px]">
                                    <div className="w-[48px] h-[48px] sm:w-[56px] sm:h-[56px] bg-indigo-50 text-indigo-500 rounded-[16px] sm:rounded-[20px] flex items-center justify-center text-[20px] sm:text-[24px]">
                                        <FaUserCheck />
                                    </div>
                                    <div>
                                        <h3 className="text-[18px] sm:text-[20px] font-black">{members.find(m => m.id == filterMember)?.name}</h3>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Attendance Summary</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setFilterMember('')}
                                    className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-slate-100 flex items-center justify-center gap-2"
                                >
                                    <FaArrowLeft /> Switch Member
                                </button>
                            </div>

                            <div className="grid grid-cols-1 xs:grid-cols-3 gap-[12px] sm:gap-[16px] mb-[48px]">
                                <div className="p-4 sm:p-6 bg-emerald-50 rounded-[20px] sm:rounded-[28px] border border-emerald-100 text-center">
                                    <p className="text-[20px] sm:text-[24px] font-black text-emerald-600">{attendanceStats?.summary?.present || 0}</p>
                                    <p className="text-[9px] sm:text-[10px] font-black text-emerald-500 uppercase tracking-widest">Present</p>
                                </div>
                                <div className="p-4 sm:p-6 bg-blue-50 rounded-[20px] sm:rounded-[28px] border border-blue-100 text-center">
                                    <p className="text-[20px] sm:text-[24px] font-black text-blue-600">{attendanceStats?.summary?.half_day || 0}</p>
                                    <p className="text-[9px] sm:text-[10px] font-black text-blue-500 uppercase tracking-widest">Half Days</p>
                                </div>
                                <div className="p-4 sm:p-6 bg-red-50 rounded-[20px] sm:rounded-[28px] border border-red-100 text-center">
                                    <p className="text-[20px] sm:text-[24px] font-black text-red-600">{attendanceStats?.summary?.absent || 0}</p>
                                    <p className="text-[9px] sm:text-[10px] font-black text-red-500 uppercase tracking-widest">Absent</p>
                                </div>
                            </div>

                            <div className="space-y-[24px]">
                                <div className="flex items-center justify-between mb-[12px]">
                                    <div className="flex items-center gap-[12px]">
                                        <div className="w-[8px] h-[24px] bg-slate-800 rounded-full"></div>
                                        <h4 className="text-[14px] font-black uppercase tracking-widest">Calculation Mode</h4>
                                    </div>
                                    <div className="flex p-1 bg-slate-100 rounded-xl">
                                        <button
                                            onClick={() => setSalaryMode('daily')}
                                            className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${salaryMode === 'daily' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}
                                        >
                                            Daily
                                        </button>
                                        <button
                                            onClick={() => setSalaryMode('monthly')}
                                            className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${salaryMode === 'monthly' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}
                                        >
                                            Monthly
                                        </button>
                                        <button
                                            onClick={() => setSalaryMode('production')}
                                            className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${salaryMode === 'production' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}
                                        >
                                            Piece Rate
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-[20px] sm:gap-[24px]">
                                    {salaryMode === 'daily' ? (
                                        <div className="space-y-3 sm:space-y-4">
                                            <label className="block text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Rate Per Day (₹)</label>
                                            <div className="relative group">
                                                <FaMoneyBillWave className="absolute left-5 sm:left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors text-[14px] sm:text-base" />
                                                <input
                                                    type="number"
                                                    value={dailyWage}
                                                    onChange={(e) => setDailyWage(parseFloat(e.target.value) || 0)}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-[20px] sm:rounded-[24px] pl-12 sm:pl-16 pr-4 sm:pr-8 py-4 sm:py-5 text-[16px] sm:text-[18px] font-black outline-none focus:border-blue-500 focus:bg-white transition-all"
                                                    placeholder="500"
                                                />
                                            </div>
                                        </div>
                                    ) : salaryMode === 'monthly' ? (
                                        <div className="space-y-3 sm:space-y-4">
                                            <label className="block text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Base Monthly Salary (₹)</label>
                                            <div className="relative group">
                                                <FaMoneyBillWave className="absolute left-5 sm:left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors text-[14px] sm:text-base" />
                                                <input
                                                    type="number"
                                                    value={monthlySalary}
                                                    onChange={(e) => setMonthlySalary(parseFloat(e.target.value) || 0)}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-[20px] sm:rounded-[24px] pl-12 sm:pl-16 pr-4 sm:pr-8 py-4 sm:py-5 text-[16px] sm:text-[18px] font-black outline-none focus:border-indigo-500 focus:bg-white transition-all"
                                                    placeholder="15000"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4 col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-3 sm:space-y-4">
                                                <label className="block text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Units (Qty)</label>
                                                <div className="relative group">
                                                    <FaPlusCircle className="absolute left-5 sm:left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-500 transition-colors text-[14px] sm:text-base" />
                                                    <input
                                                        type="number"
                                                        value={unitsProduced}
                                                        onChange={(e) => setUnitsProduced(parseFloat(e.target.value) || 0)}
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-[20px] sm:rounded-[24px] pl-12 sm:pl-16 pr-4 sm:pr-8 py-4 sm:py-5 text-[16px] sm:text-[18px] font-black outline-none focus:border-orange-500 focus:bg-white transition-all"
                                                        placeholder="100"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-3 sm:space-y-4">
                                                <label className="block text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Rate/Unit (₹)</label>
                                                <div className="relative group">
                                                    <FaMoneyBillWave className="absolute left-5 sm:left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-500 transition-colors text-[14px] sm:text-base" />
                                                    <input
                                                        type="number"
                                                        value={ratePerUnit}
                                                        onChange={(e) => setRatePerUnit(parseFloat(e.target.value) || 0)}
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-[20px] sm:rounded-[24px] pl-12 sm:pl-16 pr-4 sm:pr-8 py-4 sm:py-5 text-[16px] sm:text-[18px] font-black outline-none focus:border-orange-500 focus:bg-white transition-all"
                                                        placeholder="10"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div className="space-y-3 sm:space-y-4">
                                        <label className="block text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Bonus (₹)</label>
                                        <div className="relative group">
                                            <FaPlusCircle className="absolute left-5 sm:left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors text-[14px] sm:text-base" />
                                            <input
                                                type="number"
                                                value={bonus}
                                                onChange={(e) => setBonus(parseFloat(e.target.value) || 0)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-[20px] sm:rounded-[24px] pl-12 sm:pl-16 pr-4 sm:pr-8 py-4 sm:py-5 text-[16px] sm:text-[18px] font-black outline-none focus:border-emerald-500 focus:bg-white transition-all"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>
                                </div>
                                {salaryMode === 'production' && (
                                    <div className="space-y-4">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Extra Bonus (₹)</label>
                                        <div className="relative group">
                                            <FaPlusCircle className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                                            <input
                                                type="number"
                                                value={bonus}
                                                onChange={(e) => setBonus(parseFloat(e.target.value) || 0)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-[24px] pl-16 pr-8 py-5 text-[18px] font-black outline-none focus:border-emerald-500 focus:bg-white transition-all"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Summary Column */}
                    <div className="space-y-[24px] sm:space-y-[32px]">
                        <div className="bg-slate-900 rounded-[24px] sm:rounded-[40px] p-[24px] sm:p-[48px] shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-blue-500/10 rounded-full blur-[80px] -mr-[100px] -mt-[100px]"></div>

                            <div className="relative z-10">
                                <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] mb-[32px]">Payable Summary</p>

                                <div className="space-y-[20px] sm:space-y-[24px] mb-[40px] sm:mb-[48px]">
                                    {salaryMode === 'daily' ? (
                                        <>
                                            <div className="flex justify-between items-center opacity-70">
                                                <span className="text-white text-[11px] sm:text-[12px] font-bold">Base Pay ({attendanceStats?.summary?.present || 0}d)</span>
                                                <span className="text-white font-black text-[13px] sm:text-[14px]">₹{formatAmount((attendanceStats?.summary?.present || 0) * dailyWage)}</span>
                                            </div>
                                            <div className="flex justify-between items-center opacity-70">
                                                <span className="text-white text-[11px] sm:text-[12px] font-bold">Half Days ({attendanceStats?.summary?.half_day || 0}d)</span>
                                                <span className="text-white font-black text-[13px] sm:text-[14px]">₹{formatAmount((attendanceStats?.summary?.half_day || 0) * (dailyWage / 2))}</span>
                                            </div>
                                        </>
                                    ) : salaryMode === 'monthly' ? (
                                        <>
                                            <div className="flex justify-between items-center opacity-70">
                                                <span className="text-white text-[11px] sm:text-[12px] font-bold">Standard Monthly Pay</span>
                                                <span className="text-white font-black text-[13px] sm:text-[14px]">₹{formatAmount(monthlySalary)}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-teal-400">
                                                <span className="text-[11px] sm:text-[12px] font-bold">Earned ({(attendanceStats?.summary?.present || 0) + (attendanceStats?.summary?.half_day || 0) * 0.5} days worked)</span>
                                                <span className="font-black text-[13px] sm:text-[14px]">₹{formatAmount(((attendanceStats?.summary?.present || 0) + (attendanceStats?.summary?.half_day || 0) * 0.5) * (monthlySalary / 30))}</span>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex justify-between items-center opacity-70">
                                                <span className="text-white text-[11px] sm:text-[12px] font-bold">Production Pay ({unitsProduced} units)</span>
                                                <span className="text-white font-black text-[13px] sm:text-[14px]">₹{formatAmount(unitsProduced * ratePerUnit)}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-blue-400/70">
                                                <span className="text-[10px] font-bold uppercase">Rate: ₹{ratePerUnit}/unit</span>
                                            </div>
                                        </>
                                    )}
                                    <div className="flex justify-between items-center opacity-70">
                                        <span className="text-white text-[11px] sm:text-[12px] font-bold">Extra Bonus</span>
                                        <span className="text-white font-black text-[13px] sm:text-[14px]">₹{formatAmount(bonus)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-teal-400">
                                        <span className="text-[11px] sm:text-[12px] font-bold">Already Paid (this period)</span>
                                        <span className="font-black text-[13px] sm:text-[14px]">₹{formatAmount(stats.summary?.total_expense || 0)}</span>
                                    </div>
                                    <div className="h-px bg-white/10 my-4"></div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-white text-[13px] sm:text-[14px] font-black uppercase tracking-widest">Net Payable</span>
                                        <span className="text-blue-400 text-[24px] sm:text-[28px] font-black tracking-tighter">
                                            ₹{formatAmount(Math.max(0, (
                                                salaryMode === 'daily'
                                                    ? ((attendanceStats?.summary?.present || 0) * dailyWage) + ((attendanceStats?.summary?.half_day || 0) * (dailyWage / 2)) + bonus
                                                    : salaryMode === 'monthly'
                                                        ? (((attendanceStats?.summary?.present || 0) + (attendanceStats?.summary?.half_day || 0) * 0.5) * (monthlySalary / 30)) + bonus
                                                        : (unitsProduced * ratePerUnit) + bonus
                                            ) - (stats.summary?.total_expense || 0)))}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        const gross = salaryMode === 'daily'
                                            ? ((attendanceStats?.summary?.present || 0) * dailyWage) + ((attendanceStats?.summary?.half_day || 0) * (dailyWage / 2)) + bonus
                                            : salaryMode === 'monthly'
                                                ? (((attendanceStats?.summary?.present || 0) + (attendanceStats?.summary?.half_day || 0) * 0.5) * (monthlySalary / 30)) + bonus
                                                : (unitsProduced * ratePerUnit) + bonus;

                                        const calculated = Math.max(0, gross - (stats.summary?.total_expense || 0));
                                        setFormData({
                                            ...formData,
                                            title: `Salary Payout (${salaryMode}) - ${members.find(m => m.id == filterMember)?.name}`,
                                            amount: calculated,
                                            type: 'expense',
                                            category: 'Salary',
                                            member_id: filterMember
                                        });
                                        setShowAddModal(true);
                                    }}
                                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-black py-4 sm:py-5 rounded-[20px] sm:rounded-[24px] shadow-xl shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-3 text-[13px] sm:text-[14px]"
                                >
                                    <FaPlusCircle /> Add to Expenses
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-[40px] p-[32px] border border-slate-100 shadow-xl">
                        <h4 className="text-[14px] font-black mb-[16px] flex items-center gap-2">
                            <FaQuestionCircle className="text-slate-300" />
                            {salaryMode === 'daily' ? 'Daily Wage' : salaryMode === 'monthly' ? 'Monthly Salary' : 'Piece Rate'} Logic
                        </h4>
                        <p className="text-[12px] text-slate-500 leading-relaxed font-bold">
                            {salaryMode === 'daily'
                                ? "Earn for every day you work. Present = 1 day, Half Day = 0.5 days."
                                : salaryMode === 'monthly'
                                    ? "Start with a fixed monthly pay. We deduct 1/30th for every day you are absent and 1/60th for every half day."
                                    : "Pay based on production volume. Total = (Units Produced × Rate Per Piece) + Bonus."
                            }
                        </p>
                    </div>

                    {/* Recent Payouts History */}
                    {filterMember && (
                        <div className="bg-white rounded-[40px] p-[32px] border border-slate-100 shadow-xl overflow-hidden">
                            <div className="flex items-center gap-[12px] mb-[20px]">
                                <div className="w-[6px] h-[18px] bg-blue-500 rounded-full"></div>
                                <h4 className="text-[12px] font-black uppercase tracking-widest text-slate-800">Recent Payouts</h4>
                            </div>
                            <div className="space-y-3">
                                {transactions
                                    .filter(t => t.member_id == filterMember && (
                                        t.category?.toLowerCase().includes('salary') ||
                                        t.category?.toLowerCase().includes('advance') ||
                                        t.title?.toLowerCase().includes('salary') ||
                                        t.title?.toLowerCase().includes('advance')
                                    ))
                                    .slice(0, 5)
                                    .map(t => (
                                        <div key={t.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-2xl transition-all border-b border-slate-50 last:border-0">
                                            <div className="flex-1 pr-2">
                                                <p className="text-[12px] font-black text-slate-800 line-clamp-1">{t.title}</p>
                                                <p className="text-[10px] font-bold text-slate-400 capitalize">{t.category}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[12px] font-black text-rose-500">₹{formatAmount(t.amount)}</p>
                                                <p className="text-[8px] font-black text-slate-300 uppercase">{new Date(t.date).toLocaleDateString('en-GB')}</p>
                                            </div>
                                        </div>
                                    ))}
                                {transactions.filter(t => t.member_id == filterMember && (
                                    t.category?.toLowerCase().includes('salary') ||
                                    t.category?.toLowerCase().includes('advance') ||
                                    t.title?.toLowerCase().includes('salary') ||
                                    t.title?.toLowerCase().includes('advance')
                                )).length === 0 && (
                                        <p className="text-[10px] font-bold text-slate-400 text-center py-4">No recent payouts found</p>
                                    )}
                            </div>
                        </div>
                    )}
                    {/* Add Modal logic could also be here if it's specific to this view but it's shared, so we open via showAddModal */}
                    {/* Note: The SalaryCalculator requires AddModal to be present in the parent or imported here. Since showAddModal is global, we trigger it from parent */}
                </div>
            )}
        </div>
    );
};

export default SalaryCalculator;
