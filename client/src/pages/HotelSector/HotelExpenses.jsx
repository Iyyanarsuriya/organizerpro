// Force reload
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactDOM from 'react-dom';
import {
    getTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    getTransactionStats,
    getExpenseCategories,
    createExpenseCategory,
    deleteExpenseCategory
} from '../../api/Expense/hotelExpense';
import { getProjects, createProject, deleteProject, getAttendanceStats } from '../../api/Attendance/hotelAttendance';
import { getMembers, getGuests, getMemberRoles } from '../../api/TeamManagement/hotelTeam';
import toast from 'react-hot-toast';
import {
    FaWallet, FaPlus, FaTrash, FaChartBar, FaExchangeAlt, FaFileAlt, FaEdit, FaTimes,
    FaPlusCircle, FaFolderPlus,
    FaCheck, FaCalculator, FaUsers, FaFilePdf, FaFileCsv
} from 'react-icons/fa';
import { exportExpenseToCSV, exportExpenseToTXT, exportExpenseToPDF, exportMemberPayslipToPDF } from '../../utils/exportUtils/index.js';
import { formatAmount } from '../../utils/formatUtils';

import CategoryManager from '../../components/Common/CategoryManager';
import ProjectManager from '../../components/Manufacturing/ProjectManager';
import MemberManager from '../../components/Manufacturing/MemberManager';
import ExportButtons from '../../components/Common/ExportButtons';

// Sub-components
import Dashboard from '../ManufacturingSector/ExpenseTracker/Dashboard';
import Transactions from '../ManufacturingSector/ExpenseTracker/Transactions';
import Reports from '../ManufacturingSector/ExpenseTracker/Reports';
import SalaryCalculator from '../ManufacturingSector/ExpenseTracker/SalaryCalculator';

const HotelExpenses = () => {
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState([]);
    const [stats, setStats] = useState({ summary: { total_income: 0, total_expense: 0 }, categories: [] });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Dashboard');
    const [showAddModal, setShowAddModal] = useState(false);

    // Filters & Period
    const [periodType, setPeriodType] = useState('day');
    const [currentPeriod, setCurrentPeriod] = useState(new Date().toISOString().split('T')[0]);
    const [customRange, setCustomRange] = useState({ start: '', end: '' });

    // Active Filters
    const [filterProject, setFilterProject] = useState('');
    const [filterMember, setFilterMember] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [filterMemberType, setFilterMemberType] = useState('all');
    const [deleteModalOuter, setDeleteModalOuter] = useState({ show: false, id: null });

    const [showCategoryManager, setShowCategoryManager] = useState(false);
    const [showProjectManager, setShowProjectManager] = useState(false);

    const [categories, setCategories] = useState([]);
    const [projects, setProjects] = useState([]);
    const [members, setMembers] = useState([]);
    const [roles, setRoles] = useState([]);

    const [formData, setFormData] = useState({
        title: '',
        amount: '',
        quantity: 1,
        unit_price: 0,
        type: 'expense',
        category: 'General',
        date: new Date().toISOString().split('T')[0],
        project_id: '',
        member_id: '',
        payment_status: 'completed'
    });
    const [editingId, setEditingId] = useState(null);

    const [filterType, setFilterType] = useState('all');
    const [filterCat, setFilterCat] = useState('all');
    const [sortBy, setSortBy] = useState('date_desc');
    const [searchQuery, setSearchQuery] = useState('');

    const [showModal, setShowModal] = useState(null);
    const [modalTransactions, setModalTransactions] = useState([]);

    const [showCustomReportModal, setShowCustomReportModal] = useState(false);
    const [customReportLoading, setCustomReportLoading] = useState(false);
    const [customReportForm, setCustomReportForm] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        projectId: '',
        memberId: '',
        type: 'all',
        category: 'all'
    });
    const [confirmModal, setConfirmModal] = useState({ show: false, type: null, label: '' });

    const [attendanceStats, setAttendanceStats] = useState(null);
    const [salaryMode, setSalaryMode] = useState('daily');
    const [dailyWage, setDailyWage] = useState(0);
    const [monthlySalary, setMonthlySalary] = useState(0);
    const [unitsProduced, setUnitsProduced] = useState(0);
    const [ratePerUnit, setRatePerUnit] = useState(0);
    const [bonus, setBonus] = useState(0);
    const [salaryLoading, setSalaryLoading] = useState(false);

    const COLORS = ['#2d5bff', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

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
                endDate: rangeEnd
            };

            const [transRes, statsRes, catRes, projRes, membersRes, roleRes, guestRes] = await Promise.all([
                getTransactions(params),
                getTransactionStats(params),
                getExpenseCategories(),
                getProjects(),
                getMembers(),
                getMemberRoles(),
                getGuests()
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
                setSalaryLoading(true);
                const attRes = await getAttendanceStats({
                    memberId: filterMember,
                    period: isRange ? null : currentPeriod,
                    startDate: rangeStart,
                    endDate: rangeEnd
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
                setSalaryLoading(false);
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

    useEffect(() => {
        fetchData();
    }, [currentPeriod, filterProject, filterMember, filterMemberType, customRange.start, customRange.end, periodType]);

    useEffect(() => {
        if (filterMember && members.length > 0) {
            const member = members.find(m => m.id == filterMember);
            if (member) {
                const mode = member.wage_type === 'piece_rate' ? 'production' : member.wage_type;
                setSalaryMode(mode || 'daily');
                const amount = parseFloat(member.daily_wage) || 0;
                if (mode === 'daily') setDailyWage(amount);
                else if (mode === 'monthly') setMonthlySalary(amount);
                else if (mode === 'production') setRatePerUnit(amount);
            }
        }
    }, [filterMember, members]);

    useEffect(() => {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');

        if (periodType === 'year') {
            if (currentPeriod.length !== 4) setCurrentPeriod(`${yyyy}`);
        } else if (periodType === 'month') {
            if (currentPeriod.length !== 7) setCurrentPeriod(`${yyyy}-${mm}`);
        } else if (periodType === 'day') {
            if (currentPeriod.length !== 10) setCurrentPeriod(`${yyyy}-${mm}-${dd}`);
        }
    }, [periodType]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) await updateTransaction(editingId, formData);
            else await createTransaction(formData);
            toast.success(editingId ? "Transaction updated!" : "Transaction added!");
            setShowAddModal(false);
            setEditingId(null);
            fetchData();
        } catch (error) {
            toast.error("Error saving transaction");
        }
    };

    const handleEdit = (t) => {
        setFormData({ ...t, date: new Date(t.date).toISOString().split('T')[0] });
        setEditingId(t.id);
        setShowAddModal(true);
    };

    const handleAddNewTransaction = () => {
        setFormData({ title: '', amount: '', quantity: 1, unit_price: 0, type: 'expense', category: 'General', category_id: null, date: new Date().toISOString().split('T')[0], project_id: filterProject || '', member_id: filterMember || '', payment_status: 'completed' });
        setEditingId(null);
        setShowAddModal(true);
    };

    const handleDelete = async (id) => {
        try {
            await deleteTransaction(id);
            toast.success("Deleted");
            setDeleteModalOuter({ show: false, id: null });
            fetchData();
        } catch (error) {
            toast.error("Delete failed");
        }
    };

    const confirmDelete = (id) => setDeleteModalOuter({ show: true, id });

    const handleShowTransactions = (type) => {
        setModalTransactions(transactions.filter(t => t.type === type));
        setShowModal(type);
    };

    const memberIdToRoleMap = useMemo(() => {
        const map = {};
        members.forEach(m => { map[m.id] = m.role; });
        return map;
    }, [members]);

    const combinedData = useMemo(() => transactions.sort((a, b) => new Date(b.date) - new Date(a.date)), [transactions]);

    const filteredTransactions = useMemo(() => {
        return combinedData.filter(t => {
            const matchesType = filterType === 'all' || t.type === filterType;
            const matchesCat = filterCat === 'all' || t.category === filterCat;
            const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesRole = !filterRole || (t.member_id && memberIdToRoleMap[t.member_id] === filterRole);
            return matchesType && matchesCat && matchesSearch && matchesRole;
        });
    }, [combinedData, filterType, filterCat, searchQuery, filterRole, memberIdToRoleMap]);

    const pieData = useMemo(() => {
        if (!stats.categories) return [];
        return stats.categories
            .filter(c => c.type === 'expense')
            .map(c => ({ name: c.category || 'Other', value: parseFloat(c.total) }));
    }, [stats.categories]);

    const barData = useMemo(() => {
        const last7Days = [...new Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();

        return last7Days.map(date => {
            const dayTrans = transactions.filter(t => t.date.split('T')[0] === date);
            return {
                name: new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
                Income: dayTrans.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0),
                Expenses: dayTrans.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0)
            };
        });
    }, [transactions]);

    const handleExportCSV = (data = transactions) => exportExpenseToCSV(data, `hotel_expense_${currentPeriod}`);
    const handleExportPDF = (data = transactions) => exportExpenseToPDF({ data, period: currentPeriod, filename: `hotel_expense_${currentPeriod}` });
    const handleExportTXT = (data = transactions) => exportExpenseToTXT({ data, period: currentPeriod, filename: `hotel_expense_${currentPeriod}` });

    const handleExportPayslip = ({ memberId, transactions, attendanceStats, period, calculatedSalary, bonus }) => {
        const member = members.find(m => m.id == memberId);
        if (member) exportMemberPayslipToPDF({ member, transactions, attendanceStats, period, filename: `payslip_${member.name}_${period}`, calculatedSalary, bonus });
    };

    const handleGenerateCustomReport = async (format) => {
        setCustomReportLoading(format);
        try {
            const params = {
                projectId: customReportForm.projectId,
                memberId: customReportForm.memberId,
                startDate: customReportForm.startDate,
                endDate: customReportForm.endDate
            };
            const res = await getTransactions(params);
            if (format === 'PDF') handleExportPDF(res.data);
            else if (format === 'CSV') handleExportCSV(res.data);
            setShowCustomReportModal(false);
            toast.success("Report generated");
        } catch (error) {
            toast.error("Failed to generate report");
        } finally {
            setCustomReportLoading(false);
        }
    };

    const SidebarItem = ({ icon: Icon, label, onClick }) => (
        <button onClick={() => onClick ? onClick() : setActiveTab(label)} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group ${activeTab === label ? 'bg-[#2d5bff] text-white shadow-lg shadow-blue-500/30' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
            <Icon className={`text-lg transition-transform group-hover:scale-110 ${activeTab === label ? 'text-white' : 'text-slate-400'}`} />
            <span className="font-black text-xs uppercase tracking-widest">{label}</span>
        </button>
    );

    if (loading) return <div className="h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#2d5bff]"></div></div>;

    return (
        <div className="flex bg-slate-50 min-h-screen text-slate-800 font-['Outfit']">
            <aside className="w-72 bg-white border-r border-slate-200 p-8 hidden lg:flex flex-col">
                <div className="flex items-center gap-3 mb-12">
                    <div className="w-10 h-10 rounded-xl bg-linear-to-br from-[#2d5bff] to-[#6366f1] flex items-center justify-center shadow-lg shadow-blue-500/20"><FaWallet className="text-white text-lg" /></div>
                    <div><h2 className="text-sm font-black tracking-tight">Financial Hub</h2><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Management</p></div>
                </div>
                <nav className="flex-1 space-y-2">
                    <SidebarItem icon={FaChartBar} label="Dashboard" />
                    <SidebarItem icon={FaUsers} label="Members" />
                    <SidebarItem icon={FaExchangeAlt} label="Transactions" />
                    <SidebarItem icon={FaFileAlt} label="Reports" />
                    <SidebarItem icon={FaCalculator} label="Salary" />
                </nav>
            </aside>

            <main className="flex-1 p-[16px] lg:p-[48px] h-screen overflow-y-auto custom-scrollbar">
                {activeTab === 'Dashboard' && (
                    <div className="flex flex-col gap-6 mb-8 lg:mb-12">
                        <div className="flex items-center justify-between">
                            <div><h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">Hotel Expenses</h1><div className="h-[8px] mt-0.5 flex gap-1"><div className="px-1 bg-emerald-50 text-[6px] font-black text-emerald-600 rounded-full flex items-center uppercase tracking-tighter">FINANCE HUB</div></div></div>
                        </div>

                        <div className="flex flex-wrap items-end gap-3 p-6 bg-white rounded-[32px] border border-slate-100 shadow-sm transition-all hover:shadow-md">
                            <div className="w-full">
                                <label className="block text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Period Type</label>
                                <div className="flex p-1 bg-slate-50 rounded-xl border border-slate-100">
                                    {['day', 'week', 'month', 'year', 'range'].map((type) => (
                                        <button key={type} onClick={() => setPeriodType(type)} className={`flex-1 h-9 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${periodType === type ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{type}</button>
                                    ))}
                                </div>
                            </div>
                            <div className="w-full sm:w-[140px]">
                                <label className="block text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Project</label>
                                <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)} className="h-10 w-full bg-slate-50 border border-slate-100 rounded-xl px-3 text-xs font-bold text-slate-700 outline-none cursor-pointer"><option value="">All Projects</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                            </div>
                            <div className="flex items-center gap-2 ml-auto">
                                <ExportButtons onExportCSV={() => setConfirmModal({ show: true, type: 'CSV', label: 'CSV' })} onExportPDF={() => setConfirmModal({ show: true, type: 'PDF', label: 'PDF' })} onExportTXT={() => setConfirmModal({ show: true, type: 'TXT', label: 'TXT' })} />
                                <button onClick={() => setShowProjectManager(true)} className="h-10 bg-blue-600 text-white px-4 rounded-xl shadow-lg"><FaFolderPlus /></button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="lg:hidden flex overflow-x-auto gap-3 mb-8 pb-2 custom-scrollbar">
                    {['Dashboard', 'Members', 'Transactions', 'Reports', 'Salary'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`whitespace-nowrap px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-[#2d5bff] text-white' : 'bg-white text-slate-500 border'}`}>{tab}</button>
                    ))}
                </div>

                {activeTab === 'Dashboard' ? (
                    <Dashboard
                        periodType={periodType}
                        customRange={customRange}
                        currentPeriod={currentPeriod}
                        stats={stats}
                        transactions={combinedData}
                        pieData={pieData}
                        barData={barData}
                        COLORS={COLORS}
                        handleShowTransactions={handleShowTransactions}
                        handleAddNewTransaction={handleAddNewTransaction}
                        setActiveTab={setActiveTab}
                        formatCurrency={(v) => `₹${formatAmount(v)}`}
                    />
                ) : activeTab === 'Members' ? (
                    <MemberManager onUpdate={fetchData} />
                ) : activeTab === 'Transactions' ? (
                    <Transactions
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
                        filterProject={filterProject}
                        setFilterProject={setFilterProject}
                        filterMember={filterMember}
                        setFilterMember={setFilterMember}
                        periodType={periodType}
                        setPeriodType={setPeriodType}
                        currentPeriod={currentPeriod}
                        setCurrentPeriod={setCurrentPeriod}
                        customRange={customRange}
                        setCustomRange={setCustomRange}
                    />
                ) : activeTab === 'Reports' ? (
                    <Reports transactions={transactions} filteredTransactions={filteredTransactions} handleExportPDF={handleExportPDF} handleExportCSV={handleExportCSV} handleExportTXT={handleExportTXT} members={members} projects={projects} periodType={periodType} stats={stats} setShowCustomReportModal={setShowCustomReportModal} />
                ) : (
                    <SalaryCalculator periodType={periodType} filterMember={filterMember} setFilterMember={setFilterMember} members={members} filteredTransactions={filteredTransactions} handleExportPayslip={handleExportPayslip} salaryLoading={salaryLoading} attendanceStats={attendanceStats} salaryMode={salaryMode} setSalaryMode={setSalaryMode} dailyWage={dailyWage} setDailyWage={setDailyWage} monthlySalary={monthlySalary} setMonthlySalary={setMonthlySalary} bonus={bonus} setBonus={setBonus} stats={stats} transactions={transactions} />
                )}
            </main>

            {showAddModal && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-[40px] p-8 w-full max-w-lg shadow-2xl relative overflow-y-auto max-h-[90vh] custom-scrollbar">
                        <button onClick={() => setShowAddModal(false)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-600 transition-colors"><FaTimes /></button>
                        <h2 className="text-2xl font-black mb-6 tracking-tight text-slate-900">{editingId ? 'Update Record' : 'New Transaction'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Title</label>
                                    <input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100 transition-all" placeholder="Enter title..." />
                                </div>

                                <div>
                                    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Type</label>
                                    <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-sm font-bold outline-none cursor-pointer">
                                        <option value="expense">Expense</option>
                                        <option value="income">Income</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Date</label>
                                    <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-sm font-bold outline-none" />
                                </div>

                                <div>
                                    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Category</label>
                                    <div className="relative group">
                                        <select value={formData.category_id || ''} onChange={e => {
                                            const cat = categories.find(c => c.id == e.target.value);
                                            setFormData({ ...formData, category_id: e.target.value, category: cat ? cat.name : 'Other' });
                                        }} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-sm font-bold outline-none cursor-pointer appearance-none">
                                            <option value="">Select Category</option>
                                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                        <div onClick={() => setShowCategoryManager(true)} className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-600 cursor-pointer"><FaPlusCircle size={14} /></div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Project</label>
                                    <select value={formData.project_id || ''} onChange={e => setFormData({ ...formData, project_id: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-sm font-bold outline-none cursor-pointer">
                                        <option value="">No Project</option>
                                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Member / Staff</label>
                                    <select value={formData.member_id || ''} onChange={e => setFormData({ ...formData, member_id: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-sm font-bold outline-none cursor-pointer">
                                        <option value="">No Member</option>
                                        {members.map(m => <option key={m.id} value={m.id}>{m.name} ({m.role})</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Quantity</label>
                                    <input type="number" step="0.01" value={formData.quantity} onChange={e => {
                                        const qty = parseFloat(e.target.value) || 0;
                                        setFormData({ ...formData, quantity: qty, amount: (qty * formData.unit_price).toFixed(2) });
                                    }} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-sm font-bold outline-none" />
                                </div>

                                <div>
                                    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Unit Price</label>
                                    <input type="number" step="0.01" value={formData.unit_price} onChange={e => {
                                        const up = parseFloat(e.target.value) || 0;
                                        setFormData({ ...formData, unit_price: up, amount: (formData.quantity * up).toFixed(2) });
                                    }} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-sm font-bold outline-none" />
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Total Amount (₹)</label>
                                    <input required type="number" step="0.01" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} className="w-full bg-blue-50 text-blue-600 border border-blue-100 rounded-2xl px-5 py-3 text-lg font-black outline-none" placeholder="0.00" />
                                </div>
                            </div>

                            <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-2xl shadow-xl transition-all active:scale-[0.98] mt-4 flex items-center justify-center gap-2">
                                {editingId ? <FaEdit /> : <FaCheck />}
                                <span>{editingId ? 'Update Record' : 'Confirm & Save'}</span>
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {showCategoryManager && <CategoryManager categories={categories} onUpdate={() => getExpenseCategories().then(res => setCategories(res.data))} onCreate={createExpenseCategory} onDelete={deleteExpenseCategory} onClose={() => setShowCategoryManager(false)} />}
            {showProjectManager && <ProjectManager projects={projects} onCreate={createProject} onDelete={deleteProject} onRefresh={fetchData} onClose={() => setShowProjectManager(false)} />}
            {showCustomReportModal && (
                <div className="fixed inset-0 z-150 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                    <div className="bg-white rounded-[40px] p-8 w-full max-w-md shadow-2xl relative">
                        <button onClick={() => setShowCustomReportModal(false)} className="absolute top-8 right-8 text-slate-400"><FaTimes /></button>
                        <h2 className="text-2xl font-black mb-6">Custom Report</h2>
                        <div className="space-y-4">
                            <input type="date" value={customReportForm.startDate} onChange={e => setCustomReportForm({ ...customReportForm, startDate: e.target.value })} className="w-full bg-slate-50 border rounded-2xl px-5 py-3" />
                            <input type="date" value={customReportForm.endDate} onChange={e => setCustomReportForm({ ...customReportForm, endDate: e.target.value })} className="w-full bg-slate-50 border rounded-2xl px-5 py-3" />
                            <button onClick={() => handleGenerateCustomReport('PDF')} className="w-full bg-[#2d5bff] text-white font-black py-4 rounded-2xl">Generate PDF</button>
                        </div>
                    </div>
                </div>
            )}

            {confirmModal.show && ReactDOM.createPortal(
                <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md" onClick={() => setConfirmModal({ show: false, type: null, label: '' })}></div>
                    <div className="relative bg-white rounded-[32px] p-8 w-full max-w-sm shadow-2xl text-center">
                        <h3 className="text-2xl font-black mb-4 tracking-tight">Export {confirmModal.label}?</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => setConfirmModal({ show: false, type: null, label: '' })} className="py-4 rounded-2xl bg-slate-100 font-black">Cancel</button>
                            <button onClick={() => { if (confirmModal.type === 'CSV') handleExportCSV(); if (confirmModal.type === 'PDF') handleExportPDF(); if (confirmModal.type === 'TXT') handleExportTXT(); setConfirmModal({ show: false, type: null, label: '' }); }} className="py-4 rounded-2xl bg-slate-900 text-white font-black">Confirm</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default HotelExpenses;
