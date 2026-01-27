import React, { useState, useMemo } from 'react';
import { FaFileAlt, FaMoneyBillWave, FaUserCheck, FaArrowLeft, FaPlusCircle, FaPlus, FaHistory, FaHandHoldingUsd, FaReceipt, FaSearch, FaFilter, FaTag, FaUser } from 'react-icons/fa';
import { formatAmount } from '../../utils/formatUtils';
import ExportButtons from '../../components/Common/ExportButtons';

const ITSalaryCalculator = ({
    periodType,
    filterMember,
    setFilterMember,
    filterMemberType,
    members,
    roles, // Received roles
    filteredTransactions,
    handleExportPDF,
    handleExportCSV,
    handleExportTXT,
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
    handleExportPayslip,
    currentPeriod,
    transactions,
    categories,
    onSyncAttendance,
    setPeriodType,
    setCurrentPeriod,
    customRange,
    setCustomRange
}) => {
    // Local Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [filterType, setFilterType] = useState('all');

    // Filter Logic
    const filteredMembers = useMemo(() => {
        return members.filter(m => {
            const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (m.phone && m.phone.includes(searchQuery));
            const matchesRole = !filterRole || m.role === filterRole;
            const matchesType = filterType === 'all' ||
                (filterType === 'guest' ? m.isGuest : m.member_type === filterType);
            return matchesSearch && matchesRole && matchesType;
        });
    }, [members, searchQuery, filterRole, filterType]);


    // Ledger Calculations
    const ledger = useMemo(() => {
        if (!filterMember) return { earned: 0, paid: 0, advance: 0, balance: 0 };

        const memberObj = members.find(m => m.id == filterMember);
        const memberTrans = transactions.filter(t => {
            if (memberObj?.isGuest) {
                return t.member_id === null && t.guest_name === memberObj.name;
            }
            return t.member_id == filterMember;
        });

        const earned = memberTrans
            .filter(t => t.category === 'Salary Pot')
            .reduce((acc, t) => acc + parseFloat(t.amount || 0), 0);

        const advances = memberTrans
            .filter(t => t.category === 'Advance')
            .reduce((acc, t) => acc + parseFloat(t.amount || 0), 0);

        const salaryPayments = memberTrans
            .filter(t => t.category === 'Salary')
            .reduce((acc, t) => acc + parseFloat(t.amount || 0), 0);

        return {
            earned,
            paid: salaryPayments,
            advance: advances,
            totalPaid: salaryPayments + advances,
            balance: earned - (salaryPayments + advances)
        };
    }, [transactions, filterMember, members]);

    const currentAttendanceEarned = useMemo(() => {
        if (salaryMode === 'daily') {
            return ((attendanceStats?.summary?.present || 0) * dailyWage) + ((attendanceStats?.summary?.half_day || 0) * (dailyWage / 2));
        } else if (salaryMode === 'monthly') {
            // Calculate days in month dynamically
            let daysInMonth = 30;
            if (currentPeriod) {
                const [y, m] = currentPeriod.split('-');
                if (y && m) daysInMonth = new Date(y, m, 0).getDate();
            }
            return (((attendanceStats?.summary?.present || 0) + (attendanceStats?.summary?.half_day || 0) * 0.5) * (monthlySalary / daysInMonth));
        } else {
            return (unitsProduced * ratePerUnit);
        }
    }, [salaryMode, attendanceStats, dailyWage, monthlySalary, unitsProduced, ratePerUnit, currentPeriod]);

    const totalGross = currentAttendanceEarned + parseFloat(bonus || 0);
    // Note: Deductions usually include both Salary payments and Advances in this period
    const netPayable = Math.max(0, totalGross - (stats.summary?.total_expense || 0));

    // Export Wrappers
    const onExport = (type) => {
        const filters = { memberId: filterMember };
        if (type === 'PDF') {
            if (filterMember && handleExportPayslip) {
                handleExportPayslip({
                    memberId: filterMember,
                    transactions: filteredTransactions,
                    attendanceStats: attendanceStats,
                    period: currentPeriod,
                    calculatedSalary: currentAttendanceEarned,
                    bonus: parseFloat(bonus || 0)
                });
            } else {
                handleExportPDF(filteredTransactions, null, filters);
            }
        }
        if (type === 'CSV') handleExportCSV(filteredTransactions, filters);
        if (type === 'TXT') handleExportTXT(filteredTransactions, null, filters);
    };

    return (
        <div className="animate-in slide-in-from-right-10 duration-500 pb-20">
            {/* Header section... */}
            <div className="flex flex-col gap-6 mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">IT Salary & Payouts</h2>
                        {!filterMember && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select a member to calculate</p>}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                        {filterMember && (
                            <ExportButtons
                                onExportCSV={() => onExport('CSV')}
                                onExportPDF={() => onExport('PDF')}
                                onExportTXT={() => onExport('TXT')}
                            />
                        )}
                        {/* Period Badge - Removed in favor of full controls below */}
                    </div>
                </div>

                {/* Date & Period Controls */}
                <div className="flex flex-wrap items-end gap-3 p-4 bg-white rounded-3xl border border-slate-100 shadow-sm">
                    {/* Period Type Buttons */}
                    <div className="w-full md:w-auto flex-1">
                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Period Type</label>
                        <div className="flex p-1 bg-slate-50 rounded-xl border border-slate-100">
                            {['day', 'week', 'month', 'year', 'range'].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setPeriodType(type)}
                                    className={`flex-1 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${periodType === type ? 'bg-white text-blue-600 shadow-md scale-100' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Dynamic Date Inputs */}
                    <div className="w-full md:w-auto flex-2 min-w-[200px]">
                        {periodType === 'year' && (
                            <div className="w-full">
                                <label className="block text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Select Year</label>
                                <input type="number" value={currentPeriod} onChange={(e) => setCurrentPeriod(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-900 outline-none focus:border-blue-500 transition-all text-center h-[42px]" />
                            </div>
                        )}
                        {periodType === 'month' && (
                            <div className="w-full">
                                <label className="block text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Select Month</label>
                                <input type="month" value={currentPeriod} onChange={(e) => setCurrentPeriod(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-900 outline-none focus:border-blue-500 transition-all h-[42px]" />
                            </div>
                        )}
                        {periodType === 'week' && (
                            <div className="w-full">
                                <label className="block text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Select Week</label>
                                <input type="week" value={currentPeriod} onChange={(e) => setCurrentPeriod(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-900 outline-none focus:border-blue-500 transition-all h-[42px]" />
                            </div>
                        )}
                        {periodType === 'day' && (
                            <div className="w-full">
                                <label className="block text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Select Date</label>
                                <input type="date" value={currentPeriod} onChange={(e) => setCurrentPeriod(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-900 outline-none focus:border-blue-500 transition-all h-[42px]" />
                            </div>
                        )}
                        {periodType === 'range' && (
                            <div className="flex gap-2 w-full">
                                <div className="flex-1">
                                    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Start Date</label>
                                    <input type="date" value={customRange.start} onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-900 outline-none focus:border-blue-500 transition-all h-[42px]" />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">End Date</label>
                                    <input type="date" value={customRange.end} onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-900 outline-none focus:border-blue-500 transition-all h-[42px]" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-3">
                    {/* Search - Blue */}
                    <div className="relative group">
                        <FaSearch className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-blue-400 group-hover:text-blue-500 transition-colors" size={12} />
                        <input
                            type="text"
                            placeholder="SEARCH MEMBER..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-blue-50 hover:bg-blue-100 border border-transparent rounded-2xl py-2 md:py-3 pl-8 md:pl-10 pr-4 text-[10px] md:text-xs font-black text-blue-600 text-center placeholder:text-blue-300 outline-none focus:ring-2 focus:ring-blue-200 transition-all uppercase tracking-wide"
                        />
                    </div>

                    {/* Role Filter - Indigo */}
                    <div className="relative group">
                        <FaTag className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-indigo-400 group-hover:text-indigo-500 transition-colors" size={12} />
                        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="w-full bg-indigo-50 hover:bg-indigo-100 border border-transparent rounded-2xl py-2 md:py-3 pl-8 md:pl-10 pr-6 md:pr-10 text-[10px] md:text-xs font-black text-indigo-600 text-center outline-none focus:ring-2 focus:ring-indigo-200 transition-all cursor-pointer appearance-none uppercase tracking-wide">
                            <option value="">All Roles</option>
                            {[...new Set((roles || []).map(r => r.name).concat(members.map(m => m.role).filter(Boolean)))].sort().map(role => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>
                        <div className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-400 text-[10px]">▼</div>
                    </div>

                    {/* Type Filter - Emerald */}
                    <div className="relative group">
                        <FaFilter className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-emerald-400 group-hover:text-emerald-500 transition-colors" size={12} />
                        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full bg-emerald-50 hover:bg-emerald-100 border border-transparent rounded-2xl py-2 md:py-3 pl-8 md:pl-10 pr-6 md:pr-10 text-[10px] md:text-xs font-black text-emerald-600 text-center outline-none focus:ring-2 focus:ring-emerald-200 transition-all cursor-pointer appearance-none uppercase tracking-wide">
                            <option value="all">All Types</option>
                            <option value="worker">Worker</option>
                            <option value="employee">Employee</option>
                            <option value="guest">Guest</option>
                        </select>
                        <div className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-400 text-[10px]">▼</div>
                    </div>

                    {/* Member Select Dropdown - Filtered */}
                    <div className="relative group">
                        <select
                            value={filterMember}
                            onChange={(e) => setFilterMember(e.target.value)}
                            className="w-full h-full bg-slate-800 text-white rounded-2xl py-2 md:py-3 pl-8 md:pl-10 pr-6 md:pr-10 text-[10px] md:text-xs font-black text-center outline-none focus:ring-2 focus:ring-slate-600 hover:bg-slate-700 transition-all cursor-pointer appearance-none uppercase tracking-wide shadow-lg shadow-slate-200"
                        >
                            <option value="">Select Member...</option>
                            {filteredMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                        <div className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <FaUserCheck size={12} />
                        </div>
                        <div className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-[10px]">▼</div>
                    </div>
                </div>
            </div>

            {!filterMember ? (
                <div className="bg-white rounded-[40px] p-6 sm:p-8 border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-1 h-6 bg-slate-900 rounded-full"></div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Salary Overview</h3>
                        <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500">{filteredMembers.length} Members</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="py-4 px-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Member</th>
                                    <th className="py-4 px-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Earned (Pot)</th>
                                    <th className="py-4 px-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Paid (Adv+Sal)</th>
                                    <th className="py-4 px-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Balance</th>
                                    <th className="py-4 px-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMembers.length > 0 ? (
                                    filteredMembers.map(member => {
                                        const mTrans = transactions.filter(t => t.member_id == member.id);
                                        const earned = mTrans.filter(t => t.category === 'Salary Pot').reduce((acc, t) => acc + parseFloat(t.amount || 0), 0);
                                        const paid = mTrans.filter(t => ['Salary', 'Advance'].includes(t.category)).reduce((acc, t) => acc + parseFloat(t.amount || 0), 0);
                                        const balance = earned - paid;

                                        return (
                                            <tr key={member.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${member.member_type === 'employee' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
                                                            {member.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-slate-900 text-xs">{member.name}</p>
                                                            <p className="text-[9px] font-bold text-slate-400 uppercase">{member.role || 'No Role'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-right font-bold text-xs text-slate-600">₹{formatAmount(earned)}</td>
                                                <td className="py-4 px-4 text-right font-bold text-xs text-slate-600">₹{formatAmount(paid)}</td>
                                                <td className="py-4 px-4 text-right">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black ${balance > 0 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                        {balance > 0 ? 'Due' : 'Paid'} ₹{formatAmount(Math.abs(balance))}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 text-center">
                                                    <button
                                                        onClick={() => setFilterMember(member.id)}
                                                        className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 transition-colors shadow-sm active:scale-95"
                                                    >
                                                        Pay / View
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="py-8 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">No members found matching filters</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : salaryLoading ? (
                <div className="h-[400px] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Input Column */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Member Quick Stats */}
                        <div className="bg-white rounded-[40px] p-8 sm:p-12 shadow-sm border border-slate-100">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-10">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center text-2xl shadow-xs border border-indigo-100">
                                        <FaUserCheck />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-xl font-black text-slate-900 leading-tight">{members.find(m => m.id == filterMember)?.name}</h3>
                                            <span className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest ${members.find(m => m.id == filterMember)?.member_type === 'employee' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
                                                {members.find(m => m.id == filterMember)?.member_type || 'worker'}
                                            </span>
                                        </div>
                                        <div className="h-[8px] mt-1 flex items-center gap-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                            <span className="text-[6px] font-black text-slate-400 uppercase tracking-tighter">MEMBER PROFILE</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <button
                                        onClick={() => onSyncAttendance && onSyncAttendance(filterMember)}
                                        className="px-4 py-2 bg-slate-100 font-black text-[10px] text-slate-500 uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-all flex items-center gap-2"
                                        title="Refresh Attendance Data"
                                    >
                                        <FaHistory /> Sync Stats
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 xs:grid-cols-3 gap-4 mb-10">
                                <div className="p-6 bg-emerald-50/50 rounded-3xl border border-emerald-100 text-center">
                                    <p className="text-3xl font-black text-emerald-600 tracking-tighter">{attendanceStats?.summary?.present || 0}</p>
                                    <p className="text-[8px] font-black text-emerald-500 uppercase tracking-[0.2em] mt-1">Present</p>
                                </div>
                                <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100 text-center">
                                    <p className="text-3xl font-black text-blue-600 tracking-tighter">{attendanceStats?.summary?.half_day || 0}</p>
                                    <p className="text-[8px] font-black text-blue-500 uppercase tracking-[0.2em] mt-1">Half Days</p>
                                </div>
                                <div className="p-6 bg-rose-50/50 rounded-3xl border border-rose-100 text-center">
                                    <p className="text-3xl font-black text-rose-600 tracking-tighter">{attendanceStats?.summary?.absent || 0}</p>
                                    <p className="text-[8px] font-black text-rose-500 uppercase tracking-[0.2em] mt-1">Absent</p>
                                </div>
                            </div>

                            {/* Payment Controls */}
                            <div className="space-y-8">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1 h-6 bg-slate-900 rounded-full"></div>
                                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-900">Payment Logic</h4>
                                    </div>
                                    <div className="flex p-1 bg-slate-100 rounded-2xl">
                                        {(members.find(m => m.id == filterMember)?.member_type === 'employee' ? ['monthly'] : ['daily', 'monthly', 'production']).map(mode => (
                                            <button
                                                key={mode}
                                                onClick={() => setSalaryMode(mode)}
                                                className={`px-4 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${salaryMode === mode ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                                            >
                                                {mode === 'production' ? 'Piece' : mode}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {salaryMode === 'daily' ? (
                                        <div className="space-y-2">
                                            <label className="block text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Rate Per Day (₹)</label>
                                            <div className="relative group">
                                                <FaMoneyBillWave className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                                <input
                                                    type="number"
                                                    value={dailyWage}
                                                    onChange={(e) => setDailyWage(parseFloat(e.target.value) || 0)}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-3xl pl-16 pr-8 py-5 text-2xl font-black outline-none focus:border-blue-500 focus:bg-white transition-all shadow-xs"
                                                />
                                            </div>
                                        </div>
                                    ) : salaryMode === 'monthly' ? (
                                        <div className="space-y-2">
                                            <label className="block text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Base Salary (₹)</label>
                                            <div className="relative group">
                                                <FaMoneyBillWave className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                                                <input
                                                    type="number"
                                                    value={monthlySalary}
                                                    onChange={(e) => setMonthlySalary(parseFloat(e.target.value) || 0)}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-3xl pl-16 pr-8 py-5 text-2xl font-black outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-xs"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="block text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Units Count</label>
                                                <div className="relative group">
                                                    <FaPlusCircle className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                                    <input
                                                        type="number"
                                                        value={unitsProduced}
                                                        onChange={(e) => setUnitsProduced(parseFloat(e.target.value) || 0)}
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-3xl pl-16 pr-8 py-5 text-2xl font-black outline-none focus:border-blue-500 focus:bg-white transition-all shadow-xs"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Rate/Unit (₹)</label>
                                                <div className="relative group">
                                                    <FaMoneyBillWave className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                                    <input
                                                        type="number"
                                                        value={ratePerUnit}
                                                        onChange={(e) => setRatePerUnit(parseFloat(e.target.value) || 0)}
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-3xl pl-16 pr-8 py-5 text-2xl font-black outline-none focus:border-blue-500 focus:bg-white transition-all shadow-xs"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Extra Bonus (₹)</label>
                                        <div className="relative group">
                                            <FaPlusCircle className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                                            <input
                                                type="number"
                                                value={bonus}
                                                onChange={(e) => setBonus(parseFloat(e.target.value) || 0)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-3xl pl-16 pr-8 py-5 text-2xl font-black outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-xs"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                                    <button
                                        onClick={() => {
                                            const memberObj = members.find(m => m.id == filterMember);
                                            const isEmployee = memberObj?.member_type === 'employee';
                                            const potCat = categories.find(c => c.name === 'Salary Pot');
                                            setFormData({
                                                ...formData,
                                                title: isEmployee ? `Salary Accrued: ${formatAmount(currentAttendanceEarned)}` : `Daily Work: ${salaryMode.toUpperCase()} (${formatAmount(currentAttendanceEarned)})`,
                                                amount: currentAttendanceEarned,
                                                type: 'expense',
                                                category: 'Salary Pot',
                                                category_id: potCat ? potCat.id : '',
                                                member_id: memberObj?.isGuest ? '' : filterMember,
                                                guest_name: memberObj?.isGuest ? memberObj.name : '',
                                                date: new Date().toISOString().split('T')[0]
                                            });
                                            setShowAddModal(true);
                                        }}
                                        className="h-14 bg-amber-50 text-amber-600 rounded-[20px] font-black text-[10px] uppercase tracking-widest border border-amber-100 flex items-center justify-center gap-2 hover:bg-amber-100 transition-all font-['Outfit']"
                                    >
                                        <FaReceipt /> {members.find(m => m.id == filterMember)?.member_type === 'employee' ? 'Post Monthly Accrual' : 'Record Daily Work'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            const memberObj = members.find(m => m.id == filterMember);
                                            const advCat = categories.find(c => c.name === 'Advance');
                                            setFormData({
                                                ...formData,
                                                title: `Advance - ${memberObj?.name}`,
                                                amount: '',
                                                type: 'expense',
                                                category: 'Advance',
                                                category_id: advCat ? advCat.id : '',
                                                member_id: memberObj?.isGuest ? '' : filterMember,
                                                guest_name: memberObj?.isGuest ? memberObj.name : '',
                                                date: new Date().toISOString().split('T')[0]
                                            });
                                            setShowAddModal(true);
                                        }}
                                        className="h-14 bg-indigo-50 text-indigo-600 rounded-[20px] font-black text-[10px] uppercase tracking-widest border border-indigo-100 flex items-center justify-center gap-2 hover:bg-indigo-100 transition-all"
                                    >
                                        <FaHandHoldingUsd /> Give Advance
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Member Ledger (Transactions History) */}
                        <div className="bg-white rounded-[40px] p-8 sm:p-12 shadow-sm border border-slate-100">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-1 h-6 bg-slate-900 rounded-full"></div>
                                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-900">Member History</h4>
                                </div>
                                <div className="px-3 py-1 bg-slate-50 rounded-full text-[8px] font-black text-slate-400 uppercase tracking-widest border border-slate-100 italic">Ledger View</div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100">
                                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Earned (Pots)</p>
                                    <p className="text-2xl font-black text-slate-900">₹{formatAmount(ledger.earned)}</p>
                                </div>
                                <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100">
                                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Paid (Actual)</p>
                                    <p className="text-2xl font-black text-slate-900">₹{formatAmount(ledger.totalPaid)}</p>
                                </div>
                                <div className={`p-6 rounded-[32px] border ${ledger.balance > 0 ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100'}`}>
                                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Unpaid Balance</p>
                                    <p className={`text-2xl font-black ${ledger.balance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>₹{formatAmount(ledger.balance)}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {transactions
                                    .filter(t => t.member_id == filterMember && ['Salary', 'Advance', 'Salary Pot'].includes(t.category))
                                    .slice(0, 5)
                                    .map(t => (
                                        <div key={t.id} className="group flex items-center justify-between p-4 hover:bg-slate-50 rounded-[20px] transition-all border border-transparent hover:border-slate-100">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs ${t.category === 'Salary Pot' ? 'bg-amber-50 text-amber-500' : t.category === 'Advance' ? 'bg-indigo-50 text-indigo-500' : 'bg-blue-50 text-blue-500'}`}>
                                                    {t.category === 'Salary Pot' ? <FaReceipt /> : t.category === 'Advance' ? <FaHandHoldingUsd /> : <FaMoneyBillWave />}
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-black text-slate-800 tracking-tight leading-none mb-1">{t.title}</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[7px] font-black uppercase tracking-widest text-slate-400">{t.category}</span>
                                                        <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                                                        <span className="text-[7px] font-bold text-slate-400 uppercase">{new Date(t.date).toLocaleDateString('en-GB')}</span>
                                                        {t.payment_status && t.payment_status !== 'completed' && (
                                                            <>
                                                                <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                                                                <span className={`text-[7px] font-black uppercase tracking-widest ${t.payment_status === 'pending' ? 'text-amber-500' : 'text-red-500'}`}>
                                                                    {t.payment_status}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <p className={`text-sm font-black ${t.category === 'Salary Pot' ? 'text-amber-500' : 'text-slate-900'}`}>
                                                {t.category === 'Salary Pot' ? '+' : '-'}₹{formatAmount(t.amount)}
                                            </p>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>

                    {/* Summary Column - FINAL PAYOUT CALCULATION */}
                    <div className="space-y-8">
                        <div className="bg-slate-900 rounded-[40px] p-8 sm:p-10 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl -mr-24 -mt-24"></div>
                            <div className="relative z-10">
                                <p className="text-blue-400 text-[8px] font-black uppercase tracking-[0.3em] mb-8">Settlement Tool</p>

                                <div className="space-y-5 mb-10">
                                    <div className="flex justify-between items-center opacity-60">
                                        <span className="text-white text-[10px] font-bold uppercase tracking-widest">Live Attendance Pay</span>
                                        <span className="text-white font-black text-xs">₹{formatAmount(currentAttendanceEarned)}</span>
                                    </div>
                                    <div className="flex justify-between items-center opacity-60">
                                        <span className="text-white text-[10px] font-bold uppercase tracking-widest">Bonus Credit</span>
                                        <span className="text-white font-black text-xs">₹{formatAmount(bonus)}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-t border-white/5 pt-4">
                                        <span className="text-rose-400 text-[10px] font-bold uppercase tracking-widest">Paid / Advances (Period)</span>
                                        <span className="text-rose-400 font-black text-xs">-₹{formatAmount(stats.summary?.total_expense || 0)}</span>
                                    </div>
                                    <div className="h-px bg-white/10 my-6"></div>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-white/40 text-[6px] font-black uppercase tracking-widest mb-1">TOTAL NET SETTLEMENT</p>
                                            <p className="text-3xl font-black text-blue-400 tracking-tighter">
                                                ₹{formatAmount(netPayable)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        const memberObj = members.find(m => m.id == filterMember);
                                        const salCat = categories.find(c => c.name === 'Salary');
                                        setFormData({
                                            ...formData,
                                            title: `Salary Settlement - ${memberObj?.name}`,
                                            amount: netPayable,
                                            type: 'expense',
                                            category: 'Salary',
                                            category_id: salCat ? salCat.id : '',
                                            member_id: memberObj?.isGuest ? '' : filterMember,
                                            guest_name: memberObj?.isGuest ? memberObj.name : '',
                                            date: new Date().toISOString().split('T')[0]
                                        });
                                        setShowAddModal(true);
                                    }}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-3xl shadow-xl shadow-blue-500/10 transition-all active:scale-95 flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest"
                                >
                                    <FaPlusCircle /> Finalize Payout
                                </button>
                            </div>
                        </div>

                        {/* Recent Activity Log */}
                        <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-2 mb-4 border-b border-slate-50 pb-4">
                                <div className="w-1 h-5 bg-blue-500 rounded-full"></div>
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-800">Payment Summary</h4>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Earnings Posted</span>
                                    <span className="text-[12px] font-black text-amber-500">₹{formatAmount(ledger.earned)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Paid (Period)</span>
                                    <span className="text-[12px] font-black text-indigo-500">₹{formatAmount(ledger.totalPaid)}</span>
                                </div>
                                <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                                    <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Period Balance (Ledger)</span>
                                    <span className={`text-[14px] font-black ${ledger.balance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                        {ledger.balance > 0 ? 'Due ' : 'Paid '}
                                        ₹{formatAmount(Math.abs(ledger.balance))}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ITSalaryCalculator;
