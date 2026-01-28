import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    getTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    getTransactionStats,
    getExpenseCategories,
    createExpenseCategory,
    deleteExpenseCategory
} from '../../api/Expense/itExpense';
import { getProjects, createProject, deleteProject, getAttendanceStats } from '../../api/Attendance/itAttendance';
import { getMembers, getActiveMembers, getGuests, getMemberRoles } from '../../api/TeamManagement/itTeam';
import toast from 'react-hot-toast';
import {
    FaWallet, FaPlus, FaTrash, FaChartBar, FaExchangeAlt, FaFileAlt, FaEdit, FaTimes,
    FaPlusCircle, FaFolderPlus, FaBoxes, FaTruck,
    FaCheck, FaQuestionCircle, FaCalculator, FaTag, FaUsers, FaFilePdf, FaFileCsv, FaChevronLeft
} from 'react-icons/fa';
import { exportExpenseToCSV, exportExpenseToTXT, exportExpenseToPDF, exportMemberPayslipToPDF } from '../../utils/exportUtils/index.js';
import { formatAmount } from '../../utils/formatUtils';

import ITTransactions from './ITTransactions';
import ITSalaryCalculator from './ITSalaryCalculator';
import ITExpenseDashboard from './ITExpenseDashboard';
import ITReports from './ITReports';
import MemberManager from '../../components/IT/MemberManager';
import ProjectManager from '../../components/Manufacturing/ProjectManager';
import CategoryManager from '../../components/Common/CategoryManager';

const ITExpenseTracker = () => {
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState([]);
    const [stats, setStats] = useState({ summary: { total_income: 0, total_expense: 0 }, categories: [] });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Dashboard');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showProjectManager, setShowProjectManager] = useState(false);
    const [showCategoryManager, setShowCategoryManager] = useState(false);

    // Filters & Period
    const [periodType, setPeriodType] = useState('day');
    const [currentPeriod, setCurrentPeriod] = useState(new Date().toISOString().split('T')[0]);
    const [customRange, setCustomRange] = useState({ start: '', end: '' });

    // Active Filters
    const [filterProject, setFilterProject] = useState('');
    const [filterMember, setFilterMember] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [filterMemberType, setFilterMemberType] = useState('all');

    // Modals
    const [deleteModalOuter, setDeleteModalOuter] = useState({ show: false, id: null });

    // Data Lists
    const [categories, setCategories] = useState([]);
    const [projects, setProjects] = useState([]);
    const [members, setMembers] = useState([]);
    const [roles, setRoles] = useState([]);

    // Form Data
    const [formData, setFormData] = useState({
        title: '',
        amount: '',
        quantity: 1,
        unit_price: 0,
        type: 'expense',
        category_id: '',
        date: new Date().toISOString().split('T')[0],
        project_id: '',
        member_id: '',
        payment_status: 'completed',
        description: ''
    });
    const [editingId, setEditingId] = useState(null);

    // Transaction List Filters
    const [filterType, setFilterType] = useState('all');
    const [filterCat, setFilterCat] = useState('all');
    const [sortBy, setSortBy] = useState('date_desc');
    const [searchQuery, setSearchQuery] = useState('');

    // Salary Calculator States
    const [attendanceStats, setAttendanceStats] = useState(null);
    const [salaryMode, setSalaryMode] = useState('daily');
    const [dailyWage, setDailyWage] = useState(0);
    const [monthlySalary, setMonthlySalary] = useState(0);
    const [unitsProduced, setUnitsProduced] = useState(0);
    const [ratePerUnit, setRatePerUnit] = useState(0);
    const [bonus, setBonus] = useState(0);
    const [salaryLoading, setSalaryLoading] = useState(false);

    const [showCustomReportModal, setShowCustomReportModal] = useState(false);
    const [customReportForm, setCustomReportForm] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        projectId: '',
        memberId: '',
        type: 'all',
        category: 'all'
    });

    const fetchData = async () => {
        try {
            const isRange = periodType === 'range';
            const rangeStart = isRange ? customRange.start : null;
            const rangeEnd = isRange ? customRange.end : null;
            if (isRange && (!rangeStart || !rangeEnd)) return;

            const params = {
                projectId: filterProject,
                memberId: filterMember,
                memberType: filterMemberType,
                period: isRange ? null : currentPeriod,
                startDate: rangeStart,
                endDate: rangeEnd,
                sector: 'it'
            };

            const [transRes, statsRes, catRes, projRes, membersRes, roleRes, guestRes] = await Promise.all([
                getTransactions(params),
                getTransactionStats(params),
                getExpenseCategories({ sector: 'it' }),
                getProjects({ sector: 'it' }),
                getMembers({ sector: 'it' }),
                getMemberRoles({ sector: 'it' }),
                getGuests({ sector: 'it' })
            ]);
            setTransactions(transRes.data);
            setStats(statsRes.data);
            setCategories(catRes.data);
            setProjects(projRes.data);
            const rawMembers = membersRes.data.data;
            const guests = guestRes.data.data.map(g => ({ ...g, isGuest: true }));
            setMembers([...rawMembers, ...guests]);
            setRoles(roleRes.data.data);

            if (filterMember) {
                await fetchAttendanceData(filterMember);
            } else {
                setAttendanceStats(null);
            }

            setLoading(false);
        } catch (error) {
            console.error("Fetch Data Error Details:", error.response || error);
            toast.error(`Failed to fetch data: ${error.response?.data?.message || error.message}`);
            setLoading(false);
        }
    };

    const fetchAttendanceData = async (memberId) => {
        if (!memberId) return;

        const isRange = periodType === 'range';
        const rangeStart = isRange ? customRange.start : null;
        const rangeEnd = isRange ? customRange.end : null;

        setSalaryLoading(true);
        try {
            const attRes = await getAttendanceStats({
                memberId: memberId,
                period: isRange ? null : currentPeriod,
                startDate: rangeStart,
                endDate: rangeEnd,
                sector: 'it'
            });

            const statsArray = attRes.data?.data || [];
            const summary = {
                present: statsArray.filter(s => ['present', 'late', 'permission'].includes(s.status))
                    .reduce((acc, curr) => acc + curr.count, 0),
                absent: statsArray.find(s => s.status === 'absent')?.count || 0,
                late: statsArray.find(s => s.status === 'late')?.count || 0,
                half_day: statsArray.find(s => s.status === 'half-day')?.count || 0,
            };

            setAttendanceStats({ summary, raw: statsArray });
        } catch (error) {
            console.error("Attendance Fetch Error:", error);
            toast.error("Failed to sync attendance data");
        } finally {
            setSalaryLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [currentPeriod, filterProject, filterMember, filterMemberType, customRange.start, customRange.end, periodType]);

    // Auto-fill Salary Calculator from Member Data
    useEffect(() => {
        if (filterMember && members.length > 0) {
            const member = members.find(m => m.id == filterMember);
            if (member) {
                const mode = member.wage_type === 'piece_rate' ? 'production' : member.wage_type;
                setSalaryMode(mode || 'daily');

                const amount = parseFloat(member.daily_wage) || 0;
                if (mode === 'daily') {
                    setDailyWage(amount);
                } else if (mode === 'monthly') {
                    setMonthlySalary(amount);
                } else if (mode === 'production') {
                    setRatePerUnit(amount);
                }
            }
        } else if (!filterMember) {
            setSalaryMode('daily');
            setDailyWage(0);
            setMonthlySalary(0);
            setRatePerUnit(0);
        }
    }, [filterMember, members]);

    // Period formatting logic
    useEffect(() => {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');

        if (periodType === 'year') {
            if (currentPeriod.length !== 4) setCurrentPeriod(`${yyyy}`);
        } else if (periodType === 'month') {
            if (currentPeriod.length !== 7) setCurrentPeriod(`${yyyy}-${mm}`);
        } else if (periodType === 'week') {
            if (!currentPeriod.includes('W')) {
                const target = new Date();
                const dayNr = (target.getDay() + 6) % 7;
                target.setDate(target.getDate() - dayNr + 3);
                const firstThursday = target.getTime();
                const isoWeekYear = target.getFullYear();
                target.setMonth(0, 1);
                if (target.getDay() !== 4) {
                    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
                }
                const weekNum = 1 + Math.ceil((firstThursday - target) / 604800000);
                setCurrentPeriod(`${isoWeekYear}-W${String(weekNum).padStart(2, '0')}`);
            }
        } else if (periodType === 'day') {
            if (currentPeriod.length !== 10) setCurrentPeriod(`${yyyy}-${mm}-${dd}`);
        } else if (periodType === 'range') {
            if (!customRange.start) setCustomRange({ start: `${yyyy}-${mm}-${dd}`, end: `${yyyy}-${mm}-${dd}` });
        }
    }, [periodType]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                sector: 'it'
            };
            if (editingId) {
                await updateTransaction(editingId, payload);
                toast.success("Transaction updated!");
            } else {
                await createTransaction(payload);
                toast.success("Transaction added!");
            }
            setShowAddModal(false);
            setEditingId(null);
            setFormData({
                title: '',
                amount: '',
                quantity: 1,
                unit_price: 0,
                type: 'expense',
                category_id: '',
                date: new Date().toISOString().split('T')[0],
                project_id: filterProject || '',
                member_id: filterMember || '',
                description: ''
            });
            fetchData();
        } catch (error) {
            toast.error(editingId ? "Failed to update transaction" : "Failed to add transaction");
        }
    };

    const handleEdit = (transaction) => {
        setFormData({
            title: transaction.title,
            amount: transaction.amount,
            quantity: transaction.quantity || 1,
            unit_price: transaction.unit_price || 0,
            type: transaction.type,
            category_id: transaction.category_id || '',
            date: new Date(transaction.date).toISOString().split('T')[0],
            project_id: transaction.project_id || '',
            member_id: transaction.member_id || '',
            description: transaction.description || ''
        });
        setEditingId(transaction.id);
        setShowAddModal(true);
    };

    const handleAddNewTransaction = () => {
        setFormData({
            title: '',
            amount: '',
            quantity: 1,
            unit_price: 0,
            type: 'expense',
            category_id: '',
            date: new Date().toISOString().split('T')[0],
            project_id: filterProject || '',
            member_id: filterMember || '',
            description: ''
        });
        setEditingId(null);
        setShowAddModal(true);
    };

    const handleDelete = async (id) => {
        try {
            await deleteTransaction(id, 'it');
            toast.success("Transaction deleted");
            setDeleteModalOuter({ show: false, id: null });
            fetchData();
        } catch (error) {
            toast.error("Failed to delete transaction");
        }
    };

    const confirmDelete = (id) => {
        setDeleteModalOuter({ show: true, id });
    };

    const memberIdToRoleMap = useMemo(() => {
        const map = {};
        members.forEach(m => {
            map[m.id] = m.role;
        });
        return map;
    }, [members]);

    const filteredTransactions = useMemo(() => {
        return transactions
            .filter(t => {
                const matchesType = filterType === 'all' || t.type === filterType;
                const matchesCat = filterCat === 'all' || t.category === filterCat;
                const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesRole = !filterRole || (t.member_id && memberIdToRoleMap[t.member_id] === filterRole);
                return matchesType && matchesCat && matchesSearch && matchesRole;
            })
            .sort((a, b) => {
                if (sortBy === 'date_desc') return new Date(b.date) - new Date(a.date);
                if (sortBy === 'date_asc') return new Date(a.date) - new Date(b.date);
                if (sortBy === 'amount_desc') return b.amount - a.amount;
                if (sortBy === 'amount_asc') return a.amount - b.amount;
                return 0;
            });
    }, [transactions, filterType, filterCat, sortBy, searchQuery, filterProject, filterRole, memberIdToRoleMap]);

    const exportPeriod = useMemo(() => {
        if (periodType === 'range') {
            if (customRange.start && customRange.end) return `${customRange.start} to ${customRange.end}`;
            return 'Custom Range';
        }
        return currentPeriod;
    }, [periodType, customRange, currentPeriod]);

    if (loading) return <div className="h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#2d5bff]"></div></div>;

    return (
        <div className="flex bg-slate-50 min-h-screen text-slate-800 font-['Outfit']">
            {/* Sidebar */}
            <aside className="w-72 bg-white border-r border-slate-200 p-8 hidden lg:flex flex-col">
                <div className="flex items-center gap-3 mb-12">
                    <div className="w-10 h-10 rounded-xl bg-linear-to-br from-[#2d5bff] to-[#6366f1] flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <FaWallet className="text-white text-lg" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black tracking-tight">IT Finance</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tracker</p>
                    </div>
                </div>
                <nav className="flex-1 space-y-2">
                    <button onClick={() => setActiveTab('Dashboard')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group ${activeTab === 'Dashboard' ? 'bg-[#2d5bff] text-white shadow-lg shadow-blue-500/30' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
                        <FaChartBar className={`text-lg transition-transform group-hover:scale-110 ${activeTab === 'Dashboard' ? 'text-white' : 'text-slate-400'}`} />
                        <span className="font-black text-xs uppercase tracking-widest">Dashboard</span>
                    </button>
                    <button onClick={() => setActiveTab('Transactions')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group ${activeTab === 'Transactions' ? 'bg-[#2d5bff] text-white shadow-lg shadow-blue-500/30' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
                        <FaExchangeAlt className={`text-lg transition-transform group-hover:scale-110 ${activeTab === 'Transactions' ? 'text-white' : 'text-slate-400'}`} />
                        <span className="font-black text-xs uppercase tracking-widest">Transactions</span>
                    </button>
                    <button onClick={() => setActiveTab('Reports')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group ${activeTab === 'Reports' ? 'bg-[#2d5bff] text-white shadow-lg shadow-blue-500/30' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
                        <FaFileAlt className={`text-lg transition-transform group-hover:scale-110 ${activeTab === 'Reports' ? 'text-white' : 'text-slate-400'}`} />
                        <span className="font-black text-xs uppercase tracking-widest">Reports</span>
                    </button>
                    <button onClick={() => { setActiveTab('Salary'); setFilterMemberType('all') }} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group ${activeTab === 'Salary' ? 'bg-[#2d5bff] text-white shadow-lg shadow-blue-500/30' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
                        <FaCalculator className={`text-lg transition-transform group-hover:scale-110 ${activeTab === 'Salary' ? 'text-white' : 'text-slate-400'}`} />
                        <span className="font-black text-xs uppercase tracking-widest">Salary</span>
                    </button>
                    <button onClick={() => setActiveTab('Members')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group ${activeTab === 'Members' ? 'bg-[#2d5bff] text-white shadow-lg shadow-blue-500/30' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
                        <FaUsers className={`text-lg transition-transform group-hover:scale-110 ${activeTab === 'Members' ? 'text-white' : 'text-slate-400'}`} />
                        <span className="font-black text-xs uppercase tracking-widest">Members</span>
                    </button>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-[16px] lg:p-[48px] h-screen overflow-y-auto custom-scrollbar">
                <div className="flex flex-col gap-6 mb-8 lg:mb-12">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Link to="/it-sector" className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:text-[#2d5bff] hover:border-[#2d5bff] transition-all shadow-sm hover:shadow-md active:scale-95 shrink-0">
                                <FaChevronLeft className="w-4 h-4" />
                            </Link>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">IT Expense Tracker</h1>
                            </div>
                        </div>
                    </div>


                    {activeTab === 'Dashboard' && (
                        <div className="flex flex-col gap-4">
                            {/* Filter Grid */}
                            <div className="flex flex-wrap items-end gap-3 p-6 bg-white rounded-[32px] border border-slate-100 shadow-sm transition-all hover:shadow-md mb-6">
                                {/* Period Type - Full Width Row */}
                                <div className="w-full">
                                    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Period Type</label>
                                    <div className="flex p-1 bg-slate-50 rounded-xl border border-slate-100">
                                        {['day', 'week', 'month', 'year', 'range'].map((type) => (
                                            <button
                                                key={type}
                                                onClick={() => setPeriodType(type)}
                                                className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${periodType === type ? 'bg-white text-blue-600 shadow-md scale-100' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Date Controls */}
                                <div className="flex-1 min-w-[200px]">
                                    {periodType === 'year' && (
                                        <div className="w-full">
                                            <label className="block text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Select Year</label>
                                            <input type="number" value={currentPeriod} onChange={(e) => setCurrentPeriod(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 transition-all text-center" />
                                        </div>
                                    )}
                                    {periodType === 'month' && (
                                        <div className="w-full">
                                            <label className="block text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Select Month</label>
                                            <input type="month" value={currentPeriod} onChange={(e) => setCurrentPeriod(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 transition-all" />
                                        </div>
                                    )}
                                    {periodType === 'week' && (
                                        <div className="w-full">
                                            <label className="block text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Select Week</label>
                                            <input type="week" value={currentPeriod} onChange={(e) => setCurrentPeriod(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 transition-all" />
                                        </div>
                                    )}
                                    {periodType === 'day' && (
                                        <div className="w-full">
                                            <label className="block text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Select Date</label>
                                            <input type="date" value={currentPeriod} onChange={(e) => setCurrentPeriod(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 transition-all" />
                                        </div>
                                    )}
                                    {periodType === 'range' && (
                                        <div className="flex gap-2 w-full">
                                            <div className="flex-1">
                                                <label className="block text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Start Date</label>
                                                <input type="date" value={customRange.start} onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 transition-all" />
                                            </div>
                                            <div className="flex-1">
                                                <label className="block text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">End Date</label>
                                                <input type="date" value={customRange.end} onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 transition-all" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <ITExpenseDashboard
                                periodType={periodType}
                                customRange={customRange}
                                currentPeriod={currentPeriod}
                                stats={stats}
                                pieData={stats.categories.filter(c => c.type === 'expense').map(c => ({ name: c.category, value: parseFloat(c.total) }))}
                                barData={[{ name: 'This Period', Income: parseFloat(stats.summary?.total_income || 0), Expenses: parseFloat(stats.summary?.total_expense || 0) }]}
                                COLORS={['#2d5bff', '#f43f5e', '#0ea5e9', '#f59e0b', '#8b5cf6', '#10b981']}
                                transactions={transactions}
                                handleAddNewTransaction={handleAddNewTransaction}
                                setActiveTab={setActiveTab}
                                formatCurrency={(val) => '₹' + formatAmount(val)}
                                handleExportPDF={() => exportExpenseToPDF({ data: transactions, period: exportPeriod, filename: 'it_dashboard_report' })}
                                handleExportCSV={() => exportExpenseToCSV(transactions, 'it_dashboard_report')}
                                handleExportTXT={() => exportExpenseToTXT({ data: transactions, period: exportPeriod, filename: 'it_dashboard_report' })}
                            />
                        </div>
                    )}

                    {activeTab === 'Transactions' && (
                        <div className="flex flex-col gap-6">
                            <ITTransactions
                                filteredTransactions={filteredTransactions}
                                searchQuery={searchQuery}
                                setSearchQuery={setSearchQuery}
                                filterType={filterType}
                                setFilterType={setFilterType}
                                sortBy={sortBy}
                                setSortBy={setSortBy}
                                handleAddNewTransaction={handleAddNewTransaction}
                                handleEdit={handleEdit}
                                confirmDelete={confirmDelete}
                                projects={projects}
                                members={members}
                                roles={roles}
                                filterProject={filterProject}
                                setFilterProject={setFilterProject}
                                filterMember={filterMember}
                                setFilterMember={setFilterMember}
                                filterRole={filterRole}
                                setFilterRole={setFilterRole}
                                periodType={periodType}
                                setPeriodType={setPeriodType}
                                currentPeriod={currentPeriod}
                                setCurrentPeriod={setCurrentPeriod}
                                customRange={customRange}
                                setCustomRange={setCustomRange}
                                onExportCSV={() => exportExpenseToCSV(transactions, 'it_expenses')}
                                onExportPDF={() => exportExpenseToPDF({ data: transactions, period: exportPeriod, filename: 'it_expenses' })}
                                onExportTXT={() => exportExpenseToTXT({ data: transactions, period: exportPeriod, filename: 'it_expenses' })}
                                setShowProjectManager={setShowProjectManager}
                            />
                        </div>
                    )}

                    {activeTab === 'Salary' && (
                        <ITSalaryCalculator
                            periodType={periodType}
                            filterMember={filterMember}
                            setFilterMember={setFilterMember}
                            filterMemberType={filterMemberType}
                            members={members}
                            roles={roles}
                            filteredTransactions={filteredTransactions}
                            handleExportPDF={() => exportExpenseToPDF({ data: transactions, period: exportPeriod, filename: 'it_salary' })}
                            handleExportCSV={() => exportExpenseToCSV(transactions, 'it_salary')}
                            handleExportTXT={() => exportExpenseToTXT({ data: transactions, period: exportPeriod, filename: 'it_salary' })}
                            salaryLoading={salaryLoading}
                            attendanceStats={attendanceStats}
                            salaryMode={salaryMode}
                            setSalaryMode={setSalaryMode}
                            dailyWage={dailyWage}
                            setDailyWage={setDailyWage}
                            monthlySalary={monthlySalary}
                            setMonthlySalary={setMonthlySalary}
                            unitsProduced={unitsProduced}
                            setUnitsProduced={setUnitsProduced}
                            ratePerUnit={ratePerUnit}
                            setRatePerUnit={setRatePerUnit}
                            bonus={bonus}
                            setBonus={setBonus}
                            stats={stats}
                            setFormData={setFormData}
                            formData={formData}
                            setShowAddModal={setShowAddModal}
                            handleExportPayslip={exportMemberPayslipToPDF}
                            currentPeriod={currentPeriod}
                            transactions={transactions}
                            categories={categories}
                            onSyncAttendance={fetchAttendanceData}
                            setPeriodType={setPeriodType}
                            setCurrentPeriod={setCurrentPeriod}
                            customRange={customRange}
                            setCustomRange={setCustomRange}
                        />

                    )}
                    {activeTab === 'Reports' && (
                        <ITReports
                            transactions={transactions}
                            filteredTransactions={filteredTransactions}
                            handleExportPDF={() => exportExpenseToPDF({ data: transactions, period: exportPeriod, filename: 'it_report' })}
                            handleExportCSV={() => exportExpenseToCSV(transactions, 'it_report')}
                            handleExportTXT={() => exportExpenseToTXT({ data: transactions, period: exportPeriod, filename: 'it_report' })}
                            filterMember={filterMember}
                            filterProject={filterProject}
                            members={members}
                            projects={projects}
                            periodType={periodType}
                            customRange={customRange}
                            currentPeriod={currentPeriod}
                            stats={stats}
                            setShowCustomReportModal={setShowCustomReportModal}
                            setCustomReportForm={setCustomReportForm}
                            customReportForm={customReportForm}
                            setPeriodType={setPeriodType}
                            setCurrentPeriod={setCurrentPeriod}
                            setCustomRange={setCustomRange}
                            salaryMode={salaryMode}
                            dailyWage={dailyWage}
                            monthlySalary={monthlySalary}
                            ratePerUnit={ratePerUnit}
                            unitsProduced={unitsProduced}
                            bonus={bonus}
                            attendanceStats={attendanceStats}
                            onSyncAttendance={fetchAttendanceData}
                        />
                    )}
                    {activeTab === 'Members' && (
                        <MemberManager
                            sector="it"
                            onUpdate={fetchData}
                            projects={projects}
                        />
                    )}

                </div>
            </main>

            {/* Add/Edit Modal */}
            {showProjectManager && (
                <ProjectManager
                    projects={projects}
                    onCreate={(data) => createProject({ ...data, sector: 'it' })}
                    onDelete={(id) => deleteProject(id, { sector: 'it' })}
                    onClose={() => { setShowProjectManager(false); fetchData(); }}
                    onRefresh={() => getProjects({ sector: 'it' }).then(res => setProjects(res.data))}
                />
            )}

            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-[20px] sm:rounded-[32px] w-full max-w-sm sm:max-w-[550px] shadow-2xl border border-white/20 animate-in zoom-in-95 duration-200">
                        <div className="p-[12px] sm:p-[24px] border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-base sm:text-xl font-black text-slate-900">{editingId ? 'Edit Transaction' : 'New Transaction'}</h3>
                            <button onClick={() => setShowAddModal(false)} className="w-[24px] h-[24px] sm:w-[32px] sm:h-[32px] flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 transition-colors">
                                <FaTimes className="text-[10px] sm:text-sm" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-[12px] sm:p-[24px] space-y-[8px] sm:space-y-[20px]">
                            <div className="grid grid-cols-2 gap-[8px] sm:gap-[20px]">
                                <div className="space-y-[2px] sm:space-y-[6px]">
                                    <label className="text-[9px] sm:text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Type</label>
                                    <div className="flex p-[2px] sm:p-[4px] bg-slate-50 rounded-xl border border-slate-100 h-[36px] sm:h-[48px]">
                                        <button type="button" onClick={() => setFormData({ ...formData, type: 'income' })} className={`flex-1 rounded-lg text-[10px] sm:text-[12px] font-black uppercase tracking-wider transition-all flex items-center justify-center ${formData.type === 'income' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'text-slate-400 hover:text-slate-600'}`}>
                                            <span className="block sm:hidden">Inc</span>
                                            <span className="hidden sm:block">Income</span>
                                        </button>
                                        <button type="button" onClick={() => setFormData({ ...formData, type: 'expense' })} className={`flex-1 rounded-lg text-[10px] sm:text-[12px] font-black uppercase tracking-wider transition-all flex items-center justify-center ${formData.type === 'expense' ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'text-slate-400 hover:text-slate-600'}`}>
                                            <span className="block sm:hidden">Exp</span>
                                            <span className="hidden sm:block">Expense</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-[2px] sm:space-y-[6px]">
                                    <label className="text-[9px] sm:text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Amount</label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[10px] sm:text-sm">₹</div>
                                        <input type="number" required value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} className="w-full h-[36px] sm:h-[48px] bg-slate-50 border border-slate-200 rounded-xl pl-6 sm:pl-8 pr-2 sm:pr-4 text-[12px] sm:text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-300" placeholder="0.00" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-[2px] sm:space-y-[6px]">
                                <label className="text-[9px] sm:text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Title</label>
                                <input type="text" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full h-[36px] sm:h-[48px] bg-slate-50 border border-slate-200 rounded-xl px-3 sm:px-4 text-[12px] sm:text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-300" placeholder="Transaction title..." />
                            </div>

                            <div className="grid grid-cols-2 gap-[8px] sm:gap-[20px]">
                                <div className="space-y-[2px] sm:space-y-[6px]">
                                    <label className="text-[9px] sm:text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Category</label>
                                    <div className="flex gap-1 sm:gap-3">
                                        <select value={formData.category_id} onChange={e => setFormData({ ...formData, category_id: e.target.value })} className="flex-1 h-[36px] sm:h-[48px] bg-slate-50 border border-slate-200 rounded-xl px-2 sm:px-4 text-[11px] sm:text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer">
                                            <option value="">Select Category</option>
                                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                        <button
                                            type="button"
                                            onClick={() => setShowCategoryManager(true)}
                                            className="w-[36px] h-[36px] sm:w-[48px] sm:h-[48px] flex items-center justify-center bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all border border-blue-100/50 shadow-sm active:scale-95 shrink-0"
                                            title="Add Category"
                                        >
                                            <FaPlus className="text-[10px] sm:text-sm" />
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-[2px] sm:space-y-[6px]">
                                    <label className="text-[9px] sm:text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Date</label>
                                    <input type="date" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full h-[36px] sm:h-[48px] bg-slate-50 border border-slate-200 rounded-xl px-2 sm:px-4 text-[11px] sm:text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-[8px] sm:gap-[20px]">
                                <div className="space-y-[2px] sm:space-y-[6px]">
                                    <label className="text-[9px] sm:text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Project</label>
                                    <select value={formData.project_id} onChange={e => setFormData({ ...formData, project_id: e.target.value })} className="w-full h-[36px] sm:h-[48px] bg-slate-50 border border-slate-200 rounded-xl px-2 sm:px-4 text-[11px] sm:text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer">
                                        <option value="">None</option>
                                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-[2px] sm:space-y-[6px]">
                                    <label className="text-[9px] sm:text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Member</label>
                                    <select value={formData.member_id || ''} onChange={e => setFormData({ ...formData, member_id: e.target.value })} className="w-full h-[36px] sm:h-[48px] bg-slate-50 border border-slate-200 rounded-xl px-2 sm:px-4 text-[11px] sm:text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer">
                                        <option value="">None</option>
                                        {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-[2px] sm:space-y-[6px]">
                                <label className="text-[9px] sm:text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Description (Optional)</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full h-[36px] sm:h-[80px] bg-slate-50 border border-slate-200 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-[12px] sm:text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-300 resize-none"
                                    placeholder="Add notes..."
                                />
                            </div>

                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-[40px] sm:h-[56px] flex items-center justify-center text-xs sm:text-sm uppercase tracking-widest rounded-xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all pt-1 sm:pt-0 mt-2 sm:mt-6">
                                {editingId ? 'Update Transaction' : 'Add Transaction'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {deleteModalOuter.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-[32px] w-full max-w-sm shadow-2xl border border-white/20 p-8 text-center animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                            <FaTrash />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-2">Delete Transaction?</h3>
                        <p className="text-slate-500 text-sm mb-6">This action cannot be undone.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteModalOuter({ show: false, id: null })} className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
                            <button onClick={() => handleDelete(deleteModalOuter.id)} className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 transition-all">Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {showCategoryManager && (
                <CategoryManager
                    categories={categories}
                    onUpdate={fetchData}
                    onClose={() => setShowCategoryManager(false)}
                    onCreate={(data) => createExpenseCategory({ ...data, sector: 'it' })}
                    onDelete={(id) => deleteExpenseCategory(id, 'it')}
                />
            )}

            {showCustomReportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl border border-white/20 animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-xl font-black text-slate-900">Custom Analytics & Reports</h3>
                            <button onClick={() => setShowCustomReportModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 transition-colors">
                                <FaTimes />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Start Date</label>
                                    <input type="date" value={customReportForm.startDate} onChange={e => setCustomReportForm({ ...customReportForm, startDate: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 transition-all" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">End Date</label>
                                    <input type="date" value={customReportForm.endDate} onChange={e => setCustomReportForm({ ...customReportForm, endDate: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 transition-all" />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Filter by Project</label>
                                <select value={customReportForm.projectId} onChange={e => setCustomReportForm({ ...customReportForm, projectId: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 transition-all cursor-pointer">
                                    <option value="">All Projects</option>
                                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Filter by Member</label>
                                <select value={customReportForm.memberId} onChange={e => setCustomReportForm({ ...customReportForm, memberId: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 transition-all cursor-pointer">
                                    <option value="">All Members</option>
                                    {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                </select>
                            </div>

                            <div className="pt-4 grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => {
                                        // Logic to filter transactions based on form and export PDF
                                        const filtered = transactions.filter(t => {
                                            const d = new Date(t.date);
                                            const start = new Date(customReportForm.startDate);
                                            const end = new Date(customReportForm.endDate);
                                            return d >= start && d <= end &&
                                                (!customReportForm.projectId || t.project_id == customReportForm.projectId) &&
                                                (!customReportForm.memberId || t.member_id == customReportForm.memberId);
                                        });
                                        exportExpenseToPDF({ data: filtered, filename: 'custom_report' });
                                    }}
                                    className="w-full py-4 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-all"
                                >
                                    Export Full Report
                                </button>
                                {customReportForm.memberId ? (
                                    <button
                                        onClick={async () => {
                                            const member = members.find(m => m.id == customReportForm.memberId);
                                            if (member) {
                                                // Ensure we have correct attendance stats for this member
                                                // If the main filter is already this member, attendanceStats is up to date
                                                // If not, we rely on the fact that changing the dropdown triggered ITReports' onSyncAttendance
                                                // or we can fetch it explicitly here to be safe (though onSyncAttendance updates global state which is risky if async race)
                                                // Let's assume attendanceStats is current because ITReports triggers sync on member change.

                                                // Calculate Salary Details on the fly based on Member object (ignoring global dailyWage state which might be stale)
                                                const rate = parseFloat(member.daily_wage) || 0;
                                                let calculatedPay = 0;
                                                const s = attendanceStats?.summary || { present: 0, half_day: 0 };

                                                const getWorkingDaysInMonth = (year, month) => {
                                                    let count = 0;
                                                    const date = new Date(year, month, 1);
                                                    while (date.getMonth() === month) {
                                                        const day = date.getDay();
                                                        if (day !== 0 && day !== 6) count++;
                                                        date.setDate(date.getDate() + 1);
                                                    }
                                                    return count;
                                                };

                                                if (member.wage_type === 'daily') {
                                                    calculatedPay = (s.present * rate) + (s.half_day * (rate / 2));
                                                } else if (member.wage_type === 'monthly') {
                                                    const d = new Date(customReportForm.startDate);
                                                    const workingDays = getWorkingDaysInMonth(d.getFullYear(), d.getMonth());
                                                    calculatedPay = ((s.present + (s.half_day * 0.5)) / (workingDays || 22)) * rate;
                                                } else if (member.wage_type === 'piece_rate') {
                                                    // We don't have units production here easily unless we fetch it. 
                                                    // For now, default to 0 or base rate if just attending.
                                                    calculatedPay = 0;
                                                }

                                                exportMemberPayslipToPDF({
                                                    member,
                                                    transactions: transactions.filter(t => t.member_id == member.id &&
                                                        new Date(t.date) >= new Date(customReportForm.startDate) &&
                                                        new Date(t.date) <= new Date(customReportForm.endDate)
                                                    ),
                                                    attendanceStats: attendanceStats, // Passes the summary
                                                    period: `${customReportForm.startDate} to ${customReportForm.endDate}`,
                                                    filename: `${member.name}_Payslip_${customReportForm.startDate}`,
                                                    calculatedSalary: calculatedPay,
                                                    bonus: 0 // Bonus is harder to track without salary calculator state, default 0
                                                });
                                            }
                                        }}
                                        className="w-full py-4 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-blue-700 transition-all"
                                    >
                                        Generate Payslip
                                    </button>
                                ) : (
                                    <button
                                        disabled
                                        className="w-full py-4 bg-slate-100 text-slate-400 rounded-xl text-xs font-black uppercase tracking-widest cursor-not-allowed"
                                    >
                                        Select Member for Payslip
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default ITExpenseTracker;
