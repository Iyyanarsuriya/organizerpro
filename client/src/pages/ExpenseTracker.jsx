import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getTransactions, createTransaction, updateTransaction, deleteTransaction, getTransactionStats } from '../api/transactionApi';
import { API_URL } from '../api/axiosInstance';
import toast from 'react-hot-toast';
import {
    FaWallet, FaPlus, FaTrash, FaChartBar, FaTag, FaHome,
    FaExchangeAlt, FaPiggyBank, FaFileAlt, FaSignOutAlt, FaTimes,
    FaArrowLeft, FaEdit, FaFolderPlus, FaUserCheck, FaUserEdit
} from 'react-icons/fa';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

import { Settings, Folder } from 'lucide-react';
import { getExpenseCategories, createExpenseCategory, deleteExpenseCategory } from '../api/expenseCategoryApi';
import { getProjects, createProject, deleteProject } from '../api/projectApi';
import { getActiveWorkers } from '../api/workerApi';
import CategoryManager from '../components/CategoryManager';
import ProjectManager from '../components/ProjectManager';
import WorkerManager from '../components/WorkerManager';

const ExpenseTracker = () => {
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState([]);
    const [stats, setStats] = useState({ summary: { total_income: 0, total_expense: 0 }, categories: [] });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Dashboard');
    const [showAddModal, setShowAddModal] = useState(false);
    const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')) || {});

    const [periodType, setPeriodType] = useState('day'); // 'month', 'year', 'week', 'day', 'range'
    const [currentPeriod, setCurrentPeriod] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
    const [customRange, setCustomRange] = useState({ start: '', end: '' });

    const [showCategoryManager, setShowCategoryManager] = useState(false);
    const [showProjectManager, setShowProjectManager] = useState(false);
    const [showWorkerManager, setShowWorkerManager] = useState(false);
    const [categories, setCategories] = useState([]);
    const [projects, setProjects] = useState([]); // Projects list
    const [workers, setWorkers] = useState([]); // Workers list
    const [filterProject, setFilterProject] = useState(''); // Filter by project ID
    const [filterWorker, setFilterWorker] = useState(''); // Filter by worker ID
    const [deleteModalOuter, setDeleteModalOuter] = useState({ show: false, id: null });

    const [formData, setFormData] = useState({
        title: '',
        amount: '',
        type: 'expense',
        category: 'Food',
        date: new Date().toISOString().split('T')[0],
        project_id: '',
        worker_id: ''
    });
    const [editingId, setEditingId] = useState(null);

    const [filterType, setFilterType] = useState('all');
    const [filterCat, setFilterCat] = useState('all');
    const [sortBy, setSortBy] = useState('date_desc');
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(null); // 'income', 'expense', or null
    const [modalTransactions, setModalTransactions] = useState([]);

    const expenseCategories = ['Food', 'Shopping', 'Rent', 'Transport', 'Utilities', 'Entertainment', 'Health', 'Other'];
    const incomeCategories = ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'];

    const formatAmount = (value) => {
        const num = parseFloat(value || 0);
        return num % 1 === 0 ? num.toString() : num.toFixed(2);
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }).replace(',', ' -');
    };

    const fetchData = async () => {
        try {
            // Adjust currentPeriod format based on type if needed, but input handles it mostly.
            // When switching to 'year', currentPeriod might need adjustment if it was 'YYYY-MM'

            const isRange = periodType === 'range';
            const rangeStart = isRange ? customRange.start : null;
            const rangeEnd = isRange ? customRange.end : null;
            // If range is selected but not full, don't fetch or maybe fetch empty?
            // Let's only fetch if both are set or if not range.
            if (isRange && (!rangeStart || !rangeEnd)) return;

            const [transRes, statsRes, catsRes, projRes, workersRes] = await Promise.all([
                getTransactions({
                    projectId: filterProject,
                    workerId: filterWorker,
                    period: isRange ? null : currentPeriod,
                    startDate: rangeStart,
                    endDate: rangeEnd
                }),
                getTransactionStats(isRange ? null : currentPeriod, filterProject, rangeStart, rangeEnd),
                getExpenseCategories(),
                getProjects(),
                getActiveWorkers()
            ]);
            setTransactions(transRes.data);
            setStats(statsRes.data);
            setCategories(catsRes.data);
            setProjects(projRes.data);
            setWorkers(workersRes.data.data);
            setLoading(false);
        } catch (error) {
            console.error("Fetch Data Error Details:", error.response || error);
            toast.error(`Failed to fetch data: ${error.response?.data?.message || error.message}`);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [currentPeriod, filterProject, customRange.start, customRange.end, periodType]);

    // Ensure period format is correct when switching types
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
            // Simple week calculation for default
            if (!currentPeriod.includes('W')) {
                // Gets current week number approx
                const start = new Date(today.getFullYear(), 0, 1);
                const days = Math.floor((today - start) / (24 * 60 * 60 * 1000));
                const weekNumber = Math.ceil(days / 7);
                setCurrentPeriod(`${yyyy}-W${String(weekNumber).padStart(2, '0')}`);
            }
        } else if (periodType === 'day') {
            if (currentPeriod.length !== 10) setCurrentPeriod(`${yyyy}-${mm}-${dd}`);
        } else if (periodType === 'range') {
            // Initialize range if empty
            if (!customRange.start) setCustomRange({ start: `${yyyy}-${mm}-${dd}`, end: `${yyyy}-${mm}-${dd}` });
        }
    }, [periodType]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await updateTransaction(editingId, formData);
                toast.success("Transaction updated!");
            } else {
                await createTransaction(formData);
                toast.success("Transaction added!");
            }
            setShowAddModal(false);
            setEditingId(null);
            setFormData({
                title: '',
                amount: '',
                type: 'expense',
                category: 'Food',
                date: new Date().toISOString().split('T')[0],
                project_id: filterProject || '',
                worker_id: filterWorker || ''
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
            type: transaction.type,
            category: transaction.category,
            date: new Date(transaction.date).toISOString().split('T')[0],
            project_id: transaction.project_id || '',
            worker_id: transaction.worker_id || ''
        });
        setEditingId(transaction.id);
        setShowAddModal(true);
    };

    const handleAddNewTransaction = () => {
        setFormData({
            title: '',
            amount: '',
            type: 'expense',
            category: 'Food',
            date: new Date().toISOString().split('T')[0],
            project_id: filterProject || '',
            worker_id: filterWorker || ''
        });
        setEditingId(null);
        setShowAddModal(true);
    };

    const handleDelete = async (id) => {
        try {
            await deleteTransaction(id);
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

    const handleShowTransactions = (type) => {
        let filtered = [];
        if (type === 'income') {
            filtered = transactions.filter(t => t.type === 'income');
        } else if (type === 'expense') {
            filtered = transactions.filter(t => t.type === 'expense');
        }
        setModalTransactions(filtered);
        setShowModal(type);
    };

    const filteredTransactions = useMemo(() => {
        return transactions
            .filter(t => {
                const matchesType = filterType === 'all' || t.type === filterType;
                const matchesCat = filterCat === 'all' || t.category === filterCat;
                const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
                // Note: transactions fetched are already filtered by Project via API if filterProject is set.
                // But strictly speaking, if we want client side filtering on top of server side optional filtering:
                const matchesProject = !filterProject || (t.project_id == filterProject);
                const matchesWorker = !filterWorker || (t.worker_id == filterWorker);

                return matchesType && matchesCat && matchesSearch && matchesProject && matchesWorker;
            })
            .sort((a, b) => {
                if (sortBy === 'date_desc') return new Date(b.date) - new Date(a.date);
                if (sortBy === 'date_asc') return new Date(a.date) - new Date(b.date);
                if (sortBy === 'amount_desc') return b.amount - a.amount;
                if (sortBy === 'amount_asc') return a.amount - b.amount;
                return 0;
            });
    }, [transactions, filterType, filterCat, sortBy, searchQuery, filterProject]);

    // Derived values
    const totalBalance = (stats.summary?.total_income || 0) - (stats.summary?.total_expense || 0);
    const savingsRate = stats.summary?.total_income > 0
        ? (((stats.summary.total_income - stats.summary.total_expense) / stats.summary.total_income) * 100).toFixed(1)
        : 0;

    // Charts Data
    const pieData = stats.categories
        .filter(c => c.type === 'expense')
        .map(c => ({ name: c.category, value: parseFloat(c.total) }));

    const barData = [
        { name: 'This Period', Income: parseFloat(stats.summary?.total_income || 0), Expenses: parseFloat(stats.summary?.total_expense || 0) }
    ];

    const COLORS = ['#2d5bff', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

    const SidebarItem = ({ icon: Icon, label }) => (
        <button
            onClick={() => {
                if (label === 'Attendance') navigate('/attendance');
                else setActiveTab(label);
            }}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group ${activeTab === label ? 'bg-[#2d5bff] text-white shadow-lg shadow-blue-500/30' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
        >
            <Icon className={`text-lg transition-transform group-hover:scale-110 ${activeTab === label ? 'text-white' : 'text-slate-400'}`} />
            <span className="font-black text-xs uppercase tracking-widest">{label}</span>
        </button>
    );

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
                        <h2 className="text-sm font-black tracking-tight">Financial Hub</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Management</p>
                    </div>
                </div>

                <nav className="flex-1 space-y-2">
                    <SidebarItem icon={FaChartBar} label="Dashboard" />
                    <SidebarItem icon={FaExchangeAlt} label="Transactions" />
                    <SidebarItem icon={FaWallet} label="Budgets" />
                    <SidebarItem icon={FaFileAlt} label="Reports" />
                    <SidebarItem icon={FaPiggyBank} label="Savings Goals" />
                </nav>

                <button className="flex items-center gap-4 px-6 py-4 text-slate-400 hover:text-red-500 font-black text-xs uppercase tracking-widest transition-colors">
                    <FaExchangeAlt /> Export Data
                </button>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-[16px] lg:p-[48px] h-screen overflow-y-auto custom-scrollbar">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6 mb-[32px] lg:mb-[48px]">
                    <div>
                        <div className="flex items-center gap-[12px] mb-[8px]">
                            <button
                                onClick={() => setShowCategoryManager(true)}
                                className="w-[40px] h-[40px] bg-slate-500 rounded-[12px] flex items-center justify-center text-white hover:bg-slate-600 transition-all cursor-pointer shadow-lg shadow-slate-500/20 group/cat-btn shrink-0"
                                title="Manage Categories"
                            >
                                <Settings className="w-[20px] h-[20px] group-hover/cat-btn:rotate-90 transition-transform" />
                            </button>
                            <div className="w-[40px] h-[40px] bg-[#2d5bff] rounded-[12px] flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                                <FaWallet className="text-white text-[20px]" />
                            </div>
                            <h1 className="text-[20px] sm:text-[30px] font-black tracking-tight leading-tight">Income and Expense Tracker</h1>
                        </div>
                        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest ml-[52px]">Take control of your finances</p>
                    </div>

                    {/* Filters: Project, Period Type, Date */}
                    <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">

                        {/* Create Project Button */}
                        <button
                            onClick={() => setShowProjectManager(true)}
                            className="h-[40px] flex items-center gap-2 bg-[#2d5bff] text-white px-4 rounded-xl shadow-lg shadow-blue-500/20 hover:scale-105 transition-transform shrink-0"
                        >
                            <FaFolderPlus className="text-sm" />
                            <span className="text-xs font-black uppercase tracking-widest hidden sm:inline">New Project</span>
                            <span className="text-xs font-black uppercase tracking-widest sm:hidden">New</span>
                        </button>

                        {/* Project Filter */}
                        <div className="h-[40px] flex items-center gap-2 bg-white border border-slate-200 px-3 rounded-[12px] shadow-sm hover:border-blue-500 transition-colors">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0 hidden sm:inline">Project:</span>
                            <select
                                value={filterProject}
                                onChange={(e) => setFilterProject(e.target.value)}
                                className="text-[12px] font-bold text-slate-700 outline-none bg-transparent cursor-pointer font-['Outfit'] min-w-[80px] sm:min-w-[100px]"
                            >
                                <option value="">All Projects</option>
                                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>

                        {/* Period Type Toggle */}
                        <div className="h-[40px] flex items-center p-1 bg-white border border-slate-200 rounded-[12px] overflow-x-auto custom-scrollbar max-w-full">
                            {['day', 'week', 'month', 'year', 'range'].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setPeriodType(type)}
                                    className={`h-full px-3 rounded-[8px] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center ${periodType === type ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>

                        {/* Date Picker or Range Pickers */}
                        <div className="h-[40px] flex items-center gap-2 bg-white border border-slate-200 px-3 rounded-[12px] shadow-sm hover:border-blue-500 transition-colors">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0 hidden sm:inline">Period:</span>
                            {periodType === 'day' ? (
                                <input
                                    type="date"
                                    value={currentPeriod.length === 10 ? currentPeriod : ''}
                                    onChange={(e) => setCurrentPeriod(e.target.value)}
                                    className="text-[12px] font-bold text-slate-700 outline-none bg-transparent cursor-pointer font-['Outfit']"
                                />
                            ) : periodType === 'week' ? (
                                <input
                                    type="week"
                                    value={currentPeriod.includes('W') ? currentPeriod : ''}
                                    onChange={(e) => setCurrentPeriod(e.target.value)}
                                    className="text-[12px] font-bold text-slate-700 outline-none bg-transparent cursor-pointer font-['Outfit']"
                                />
                            ) : periodType === 'month' ? (
                                <input
                                    type="month"
                                    value={currentPeriod.length === 7 ? currentPeriod : ''}
                                    onChange={(e) => setCurrentPeriod(e.target.value)}
                                    className="text-[12px] font-bold text-slate-700 outline-none bg-transparent cursor-pointer font-['Outfit']"
                                />
                            ) : periodType === 'year' ? (
                                <input
                                    type="number"
                                    min="2000"
                                    max="2100"
                                    value={currentPeriod.slice(0, 4)}
                                    onChange={(e) => setCurrentPeriod(e.target.value)}
                                    className="text-[12px] font-bold text-slate-700 outline-none bg-transparent cursor-pointer font-['Outfit'] w-[60px]"
                                />
                            ) : (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="date"
                                        value={customRange.start}
                                        onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })}
                                        className="text-[10px] sm:text-[12px] font-bold text-slate-700 outline-none bg-transparent cursor-pointer font-['Outfit'] w-[85px] sm:w-[100px]"
                                    />
                                    <span className="text-xs text-slate-400">-</span>
                                    <input
                                        type="date"
                                        value={customRange.end}
                                        onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })}
                                        className="text-[10px] sm:text-[12px] font-bold text-slate-700 outline-none bg-transparent cursor-pointer font-['Outfit'] w-[85px] sm:w-[100px]"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div >

                {/* Mobile Tab Navigation */}
                < div className="lg:hidden flex overflow-x-auto gap-3 mb-8 pb-2 custom-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0" >
                    {
                        ['Dashboard', 'Transactions', 'Budgets', 'Reports', 'Savings Goals'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`whitespace-nowrap px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-[#2d5bff] text-white shadow-lg shadow-blue-500/30' : 'bg-white text-slate-500 border border-slate-200'}`}
                            >
                                {tab}
                            </button>
                        ))
                    }
                </div >

                {activeTab === 'Dashboard' ? (
                    <div className="animate-in fade-in duration-500">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[16px] sm:gap-[24px] mb-[32px] lg:mb-[48px]">
                            <StatCard title="Total Balance" value={`₹${formatAmount(totalBalance)}`} color="text-slate-800" subtitle={`${totalBalance >= 0 ? '+' : ''}0% from last month`} />
                            <StatCard
                                title={`${periodType === 'range' ? 'Range' : periodType === 'day' ? 'Daily' : periodType.charAt(0).toUpperCase() + periodType.slice(1) + 'ly'} Income`}
                                value={`₹${formatAmount(stats.summary?.total_income)}`}
                                color="text-blue-500"
                                subtitle={periodType === 'range' ? `${customRange.start} to ${customRange.end}` : currentPeriod}
                                onClick={() => handleShowTransactions('income')}
                            />
                            <StatCard
                                title={`${periodType === 'range' ? 'Range' : periodType === 'day' ? 'Daily' : periodType.charAt(0).toUpperCase() + periodType.slice(1) + 'ly'} Expenses`}
                                value={`₹${formatAmount(stats.summary?.total_expense)}`}
                                color="text-red-500"
                                subtitle={currentPeriod}
                                onClick={() => handleShowTransactions('expense')}
                            />
                            <StatCard title="Savings Rate" value={`${savingsRate}%`} color="text-emerald-500" subtitle="% of income" />
                        </div>

                        {/* Charts Section */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-[24px] sm:gap-[32px] mb-[32px] lg:mb-[48px]">
                            {/* Donut Chart */}
                            <div className="bg-white rounded-[32px] p-[24px] sm:p-[32px] shadow-xl border border-slate-100 h-[400px] sm:h-[500px] flex flex-col">
                                <h3 className="text-[16px] sm:text-[18px] font-black mb-[24px] sm:mb-[32px] flex items-center gap-[8px]">
                                    <div className="w-[8px] h-[24px] bg-blue-500 rounded-full"></div>
                                    Spending by Category
                                </h3>
                                <div className="flex-1 min-h-0">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {pieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend verticalAlign="bottom" height={36} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Bar Chart */}
                            <div className="bg-white rounded-[32px] p-[24px] sm:p-[32px] shadow-xl border border-slate-100 h-[400px] sm:h-[500px] flex flex-col">
                                <h3 className="text-[16px] sm:text-[18px] font-black mb-[24px] sm:mb-[32px] flex items-center gap-[8px]">
                                    <div className="w-[8px] h-[24px] bg-slate-800 rounded-full"></div>
                                    Monthly Overview
                                </h3>
                                <div className="flex-1 min-h-0">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={barData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} />
                                            <Tooltip cursor={{ fill: '#f8fafc' }} />
                                            <Legend verticalAlign="top" align="right" iconType="circle" />
                                            <Bar dataKey="Income" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                                            <Bar dataKey="Expenses" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Budgets & Recent Activity */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-[24px] sm:gap-[32px] mb-[32px] lg:mb-[48px]">
                            {/* Budgets Progress */}
                            <div className="lg:col-span-1 bg-white rounded-[32px] p-[24px] sm:p-[32px] shadow-xl border border-slate-100">
                                <div className="flex justify-between items-center mb-[24px]">
                                    <h3 className="text-[16px] sm:text-[18px] font-black flex items-center gap-[8px]">
                                        <div className="w-[8px] h-[24px] bg-emerald-500 rounded-full"></div>
                                        Monthly Budgets
                                    </h3>
                                    <button onClick={() => setActiveTab('Budgets')} className="text-[10px] sm:text-[12px] font-black text-[#2d5bff] uppercase tracking-widest hover:underline">Manage</button>
                                </div>
                                <div className="space-y-[24px]">
                                    <BudgetProgress label="Food & Dining" spent={stats.categories.find(c => c.category === 'Food')?.total || 0} limit={500} color="bg-blue-500" />
                                    <BudgetProgress label="Shopping" spent={stats.categories.find(c => c.category === 'Shopping')?.total || 0} limit={300} color="bg-emerald-500" />
                                    <BudgetProgress label="Entertainment" spent={stats.categories.find(c => c.category === 'Entertainment')?.total || 0} limit={200} color="bg-purple-500" />
                                    <BudgetProgress label="Transport" spent={stats.categories.find(c => c.category === 'Transport')?.total || 0} limit={150} color="bg-orange-500" />
                                </div>
                            </div>

                            {/* Recent Activity */}
                            <div className="lg:col-span-2 bg-white rounded-[32px] p-[24px] sm:p-[32px] shadow-xl border border-slate-100">
                                <div className="flex justify-between items-center mb-[24px]">
                                    <h3 className="text-[16px] sm:text-[18px] font-black flex items-center gap-[8px]">
                                        <div className="w-[8px] h-[24px] bg-slate-800 rounded-full"></div>
                                        Recent Activity
                                    </h3>
                                    <button onClick={() => setActiveTab('Transactions')} className="text-[10px] sm:text-[12px] font-black text-[#2d5bff] uppercase tracking-widest hover:underline">View All</button>
                                </div>
                                <div className="space-y-[16px]">
                                    {transactions.slice(0, 4).map(t => (
                                        <div key={t.id} className="flex justify-between items-center p-[16px] rounded-[24px] hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                            <div className="flex items-center gap-[16px]">
                                                <div className={`w-[32px] h-[32px] sm:w-[40px] sm:h-[40px] rounded-[10px] sm:rounded-[12px] flex items-center justify-center text-[12px] sm:text-[14px] ${t.type === 'income' ? 'bg-blue-50 text-blue-500' : 'bg-red-50 text-red-500'}`}>
                                                    {t.type === 'income' ? '↓' : '↑'}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-800 text-[13px] sm:text-[14px]">{t.title}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.category}</p>
                                                </div>
                                            </div>
                                            <p className={`font-black text-[13px] sm:text-[14px] ${t.type === 'income' ? 'text-blue-500' : 'text-red-500'}`}>
                                                {t.type === 'income' ? '+' : '-'}₹{formatAmount(t.amount)}
                                            </p>
                                        </div>
                                    ))}
                                    {transactions.length === 0 && <p className="text-center py-[32px] text-slate-400 text-[10px] font-bold uppercase tracking-widest">No activity yet</p>}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-center mt-[32px]">
                            <button
                                onClick={handleAddNewTransaction}
                                className="bg-[#1a1c21] hover:bg-slate-800 text-white font-black px-[48px] py-[20px] rounded-[24px] shadow-2xl transition-all active:scale-95 flex items-center gap-[16px] hover:shadow-blue-500/10 text-[14px]"
                            >
                                <FaPlus /> Add Transaction
                            </button>
                        </div>
                    </div>
                ) : activeTab === 'Transactions' ? (
                    <div className="animate-in slide-in-from-right-10 duration-500">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-[16px] mb-[32px]">
                            <h2 className="text-[20px] sm:text-[24px] font-black">All Transactions</h2>

                            <div className="flex flex-wrap items-center gap-[8px] sm:gap-[12px]">
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-white border border-slate-200 rounded-[12px] px-[16px] py-[8px] text-[12px] font-bold outline-none focus:border-blue-500 transition-all w-full sm:w-[160px]"
                                />
                                <select
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                    className="bg-white border border-slate-200 rounded-[12px] px-[12px] py-[8px] text-[12px] font-bold outline-none cursor-pointer"
                                >
                                    <option value="all">All Types</option>
                                    <option value="income">Income</option>
                                    <option value="expense">Expense</option>
                                </select>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="bg-white border border-slate-200 rounded-[12px] px-[12px] py-[8px] text-[12px] font-bold outline-none cursor-pointer"
                                >
                                    <option value="date_desc">Newest</option>
                                    <option value="date_asc">Oldest</option>
                                    <option value="amount_desc">Highest Amount</option>
                                    <option value="amount_asc">Lowest Amount</option>
                                </select>
                                {/* Worker Filter and Manage Button */}
                                <div className="flex items-center gap-2">
                                    <select
                                        value={filterWorker}
                                        onChange={(e) => setFilterWorker(e.target.value)}
                                        className="h-[40px] bg-white border border-slate-200 rounded-xl px-4 text-xs font-black uppercase tracking-widest text-slate-700 outline-none focus:border-blue-500 transition-all cursor-pointer shadow-sm"
                                    >
                                        <option value="">All Workers</option>
                                        {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                    </select>
                                    <button
                                        onClick={() => setShowWorkerManager(true)}
                                        className="w-[40px] h-[40px] bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center hover:bg-orange-50 hover:text-orange-600 transition-all shadow-sm border border-slate-200 shrink-0"
                                        title="Manage Workers"
                                    >
                                        <FaUserEdit />
                                    </button>
                                </div>
                                <button onClick={handleAddNewTransaction} className="bg-[#2d5bff] text-white p-[12px] rounded-[12px] shadow-lg shadow-blue-500/20 hover:scale-105 transition-transform">
                                    <FaPlus />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-[16px]">
                            {filteredTransactions.map(t => (
                                <div key={t.id} className="bg-white p-[20px] sm:p-[24px] rounded-[32px] shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:justify-between sm:items-center group hover:shadow-lg transition-all transform hover:-translate-y-1 gap-[16px]">
                                    <div className="flex items-center gap-[20px]">
                                        <div className={`w-[48px] h-[48px] sm:w-[56px] sm:h-[56px] rounded-[20px] flex items-center justify-center text-[20px] shadow-sm shrink-0 ${t.type === 'income' ? 'bg-blue-50 text-blue-500' : 'bg-red-50 text-red-500'}`}>
                                            {t.type === 'income' ? '↓' : '↑'}
                                        </div>
                                        <div>
                                            <h4 className="font-black text-slate-800 text-[14px] sm:text-[16px]">{t.title}</h4>
                                            <div className="flex flex-wrap items-center gap-[12px] mt-[4px]">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.category}</span>
                                                {t.worker_name && (
                                                    <>
                                                        <span className="w-[4px] h-[4px] rounded-full bg-slate-300"></span>
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 flex items-center gap-1">
                                                            <FaUserCheck className="text-[8px]" /> {t.worker_name}
                                                        </span>
                                                    </>
                                                )}
                                                <span className="w-[4px] h-[4px] rounded-full bg-slate-300"></span>
                                                <span className="text-[10px] font-bold text-slate-400">{formatDateTime(t.updated_at || t.created_at)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between sm:justify-end gap-[12px] sm:gap-[24px]">
                                        <p className={`text-[18px] sm:text-[20px] font-black tracking-tighter ${t.type === 'income' ? 'text-blue-500' : 'text-red-500'}`}>
                                            {t.type === 'income' ? '+' : '-'}₹{formatAmount(t.amount)}
                                        </p>
                                        <button onClick={() => handleEdit(t)} className="p-[12px] text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-[12px] transition-all opacity-100 sm:opacity-0 group-hover:opacity-100 cursor-pointer">
                                            <FaEdit />
                                        </button>
                                        <button onClick={() => confirmDelete(t.id)} className="p-[12px] text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-[12px] transition-all opacity-100 sm:opacity-0 group-hover:opacity-100 cursor-pointer">
                                            <FaTrash />
                                        </button>
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
                ) : activeTab === 'Budgets' ? (
                    <div className="animate-in slide-in-from-right-10 duration-500">
                        <div className="flex justify-between items-center mb-[32px]">
                            <h2 className="text-[20px] sm:text-[24px] font-black">Monthly Budgets</h2>
                            <button className="bg-emerald-500 text-white px-[20px] py-[10px] rounded-[16px] shadow-lg shadow-emerald-500/20 text-[12px] font-black uppercase tracking-widest hover:scale-105 transition-all">Set Budget</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-[24px]">
                            <div className="bg-white p-[32px] rounded-[32px] shadow-xl border border-slate-100 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-[24px]">
                                        <div className="w-[48px] h-[48px] bg-blue-50 text-blue-500 rounded-[16px] flex items-center justify-center">
                                            <FaTag />
                                        </div>
                                        <span className="text-[24px] font-black tracking-tighter text-blue-500">76%</span>
                                    </div>
                                    <h4 className="text-[18px] font-black mb-[8px]">Food & Dining</h4>
                                    <p className="text-[12px] text-slate-500 font-bold uppercase tracking-widest mb-[24px]">Budget: ₹500.00</p>
                                    <div className="w-full h-[12px] bg-slate-50 rounded-full overflow-hidden mb-[8px]">
                                        <div className="h-full bg-blue-500 w-[76%] rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                                    </div>
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-[24px]">Remaining: ₹120.00</p>
                            </div>
                            <div className="bg-white p-[32px] rounded-[32px] shadow-xl border border-slate-100 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-[24px]">
                                        <div className="w-[48px] h-[48px] bg-emerald-50 text-emerald-500 rounded-[16px] flex items-center justify-center">
                                            <FaPiggyBank />
                                        </div>
                                        <span className="text-[24px] font-black tracking-tighter text-emerald-500">45%</span>
                                    </div>
                                    <h4 className="text-[18px] font-black mb-[8px]">Health & Wellness</h4>
                                    <p className="text-[12px] text-slate-500 font-bold uppercase tracking-widest mb-[24px]">Budget: ₹200.00</p>
                                    <div className="w-full h-[12px] bg-slate-50 rounded-full overflow-hidden mb-[8px]">
                                        <div className="h-full bg-emerald-500 w-[45%] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                                    </div>
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-[24px]">Remaining: ₹110.00</p>
                            </div>
                        </div>
                    </div>
                ) : activeTab === 'Reports' ? (
                    <div className="animate-in slide-in-from-right-10 duration-500">
                        <div className="flex justify-between items-center mb-[32px]">
                            <h2 className="text-[20px] sm:text-[24px] font-black">Financial Reports</h2>
                            <div className="flex gap-[12px]">
                                <button className="bg-white border border-slate-200 px-[16px] py-[8px] rounded-[12px] text-[10px] font-black uppercase tracking-widest hover:border-blue-500 transition-all">This Month</button>
                                <button className="bg-[#1a1c21] text-white px-[16px] py-[8px] rounded-[12px] text-[10px] font-black uppercase tracking-widest shadow-lg shadow-black/10">Download PDF</button>
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
                                        <h3 className="text-[20px] font-black">Monthly Summary</h3>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">December 2023 Performance</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-[32px] mb-[64px]">
                                    <div className="p-[24px] bg-slate-50 rounded-[24px] border border-slate-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[8px]">Savings Ratio</p>
                                        <p className="text-[32px] font-black tracking-tighter text-slate-800">{savingsRate}%</p>
                                        <div className="mt-[16px] flex items-center gap-[8px]">
                                            <div className="w-[8px] h-[8px] rounded-full bg-emerald-500"></div>
                                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Healthy</span>
                                        </div>
                                    </div>
                                    <div className="p-[24px] bg-slate-50 rounded-[24px] border border-slate-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[8px]">Average Expense</p>
                                        <p className="text-[32px] font-black tracking-tighter text-slate-800">₹42.50</p>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-[16px]">per transaction</p>
                                    </div>
                                    <div className="p-[24px] bg-slate-50 rounded-[24px] border border-slate-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[8px]">Income Growth</p>
                                        <p className="text-[32px] font-black tracking-tighter text-blue-500">+12%</p>
                                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mt-[16px]">from last month</p>
                                    </div>
                                </div>

                                <div className="flex justify-center">
                                    <button className="text-[12px] font-black text-blue-500 uppercase tracking-widest hover:bg-blue-50 px-[32px] py-[12px] rounded-[16px] transition-all">Generate Custom Report</button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="animate-in slide-in-from-right-10 duration-500">
                        <div className="flex justify-between items-center mb-[32px]">
                            <h2 className="text-[20px] sm:text-[24px] font-black">Savings Goals</h2>
                            <button className="bg-[#1a1c21] text-white px-[20px] py-[10px] rounded-[16px] shadow-lg shadow-black/10 text-[12px] font-black uppercase tracking-widest hover:scale-105 transition-all">New Goal</button>
                        </div>
                        <div className="bg-linear-to-br from-[#2d5bff] to-[#6366f1] p-[32px] sm:p-[48px] rounded-[40px] text-white shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 rounded-full blur-[80px] -mr-[200px] -mt-[200px]"></div>
                            <div className="relative">
                                <div className="flex items-center gap-[24px] mb-[40px]">
                                    <div className="w-[72px] h-[72px] bg-white/20 backdrop-blur-md rounded-[24px] flex items-center justify-center text-[32px]">
                                        🏠
                                    </div>
                                    <div>
                                        <h3 className="text-[24px] font-black">Dreams House Fund</h3>
                                        <p className="text-white/60 text-[12px] font-bold uppercase tracking-widest">Target: ₹500,000</p>
                                    </div>
                                </div>

                                <div className="mb-[12px] flex justify-between items-end">
                                    <span className="text-[48px] font-black tracking-tighter">₹125,400</span>
                                    <span className="text-[18px] font-black opacity-80 mb-[12px]">25% reached</span>
                                </div>

                                <div className="w-full h-[16px] bg-white/20 rounded-full overflow-hidden mb-[32px]">
                                    <div className="h-full bg-white shadow-[0_0_20px_rgba(255,255,255,0.8)]" style={{ width: '25%' }}></div>
                                </div>

                                <div className="flex gap-[16px]">
                                    <button className="bg-white text-[#2d5bff] px-[32px] py-[14px] rounded-[16px] font-black text-[12px] uppercase tracking-widest hover:shadow-xl transition-all active:scale-95">Add Funds</button>
                                    <button className="bg-white/10 hover:bg-white/20 px-[32px] py-[14px] rounded-[16px] font-black text-[12px] uppercase tracking-widest transition-all">Edit Goal</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </main >

            {/* Add Modal */}
            {
                showAddModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-[16px] bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                        <div className="bg-white rounded-[40px] p-[32px] sm:p-[40px] w-full max-w-[448px] shadow-2xl relative animate-in zoom-in-95 duration-300">
                            <button onClick={() => { setShowAddModal(false); setEditingId(null); }} className="absolute top-[32px] right-[32px] text-slate-400 hover:text-slate-800 transition-colors">
                                <FaTimes />
                            </button>
                            <h2 className="text-[24px] font-black mb-[32px] flex items-center gap-[12px]">
                                <div className="w-[8px] h-[32px] bg-blue-500 rounded-full"></div>
                                {editingId ? 'Edit Transaction' : `Add ${formData.type === 'income' ? 'Income' : 'Expense'}`}
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-[24px]">
                                <div className="flex p-[4px] bg-slate-100 rounded-[16px] mb-[32px]">
                                    <button type="button" onClick={() => setFormData({ ...formData, type: 'expense', category: 'Food' })} className={`flex-1 py-[12px] px-[16px] rounded-[12px] text-[10px] font-black uppercase tracking-widest transition-all ${formData.type === 'expense' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}>Expense</button>
                                    <button type="button" onClick={() => setFormData({ ...formData, type: 'income', category: 'Salary' })} className={`flex-1 py-[12px] px-[16px] rounded-[12px] text-[10px] font-black uppercase tracking-widest transition-all ${formData.type === 'income' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}>Income</button>
                                </div>

                                <div className="space-y-[16px]">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[8px] ml-[4px]">Label</label>
                                        <input required type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-[16px] px-[20px] py-[16px] text-[14px] font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-['Outfit']" placeholder="Electricity, Salary..." />
                                    </div>

                                    <div className="grid grid-cols-2 gap-[16px]">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[8px] ml-[8px]">Project</label>
                                            <select
                                                value={formData.project_id}
                                                onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-[20px] px-[20px] py-[14px] text-[12px] font-bold text-slate-700 outline-none focus:border-blue-500 transition-all cursor-pointer"
                                            >
                                                <option value="">No Project</option>
                                                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[8px] ml-[8px]">Worker</label>
                                            <select
                                                value={formData.worker_id}
                                                onChange={(e) => setFormData({ ...formData, worker_id: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-[20px] px-[20px] py-[14px] text-[12px] font-bold text-slate-700 outline-none focus:border-blue-500 transition-all cursor-pointer"
                                            >
                                                <option value="">No Worker</option>
                                                {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-[16px]">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[8px] ml-[4px]">Amount</label>
                                            <input required type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-[16px] px-[20px] py-[16px] text-[14px] font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-['Outfit']" placeholder="0.00" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[8px] ml-[4px]">Category</label>
                                            <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-[16px] px-[20px] py-[16px] text-[14px] font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-['Outfit'] cursor-pointer">
                                                {[...new Set([...(formData.type === 'expense' ? expenseCategories : incomeCategories), ...categories.map(c => c.name)])].map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[8px] ml-[4px]">Date</label>
                                        <input required type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-[16px] px-[20px] py-[16px] text-[14px] font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-['Outfit'] cursor-pointer" />
                                    </div>
                                </div>

                                <button type="submit" className="w-full bg-[#1a1c21] hover:bg-slate-800 text-white font-black py-[20px] rounded-[24px] transition-all active:scale-95 shadow-xl shadow-blue-500/10 flex items-center justify-center gap-[12px] text-[14px]">
                                    {editingId ? <FaEdit /> : <FaPlus />} {editingId ? 'Update Transaction' : 'Save Transaction'}
                                </button>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Transaction Details Modal */}
            {
                showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <div
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                            onClick={() => setShowModal(null)}
                        ></div>

                        {/* Modal Content */}
                        <div className="relative bg-white rounded-[32px] shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden z-10">
                            {/* Modal Header */}
                            <div className="sticky top-0 bg-white border-b border-slate-100 p-6 flex items-center justify-between z-10">
                                <h3 className="text-xl font-black text-slate-800">
                                    {showModal === 'income' ? 'Income Transactions' : 'Expense Transactions'}
                                </h3>
                                <button
                                    onClick={() => setShowModal(null)}
                                    className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                                >
                                    <FaTimes className="w-5 h-5 text-slate-600" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
                                {modalTransactions.length > 0 ? (
                                    <div className="space-y-3">
                                        {modalTransactions.map((transaction) => (
                                            <div
                                                key={transaction.id}
                                                className="bg-slate-50 rounded-2xl p-4 border border-slate-100 hover:border-blue-200 transition-all"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-slate-800 mb-1">{transaction.title}</h4>
                                                        <div className="flex flex-wrap gap-2 text-xs">
                                                            <span className={`px-2 py-1 rounded-full font-bold ${transaction.type === 'income'
                                                                ? 'bg-blue-100 text-blue-600'
                                                                : 'bg-red-100 text-red-600'
                                                                }`}>
                                                                {transaction.type}
                                                            </span>
                                                            {transaction.category && (
                                                                <span className="px-2 py-1 rounded-full bg-slate-200 text-slate-700 font-bold">
                                                                    {transaction.category}
                                                                </span>
                                                            )}
                                                            {transaction.date && (
                                                                <span className="px-2 py-1 rounded-full bg-slate-200 text-slate-700 font-bold">
                                                                    {new Date(transaction.date).toLocaleDateString()}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className={`text-lg font-black ${transaction.type === 'income' ? 'text-blue-600' : 'text-red-600'
                                                        }`}>
                                                        ₹{formatAmount(transaction.amount)}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <FaWallet className="w-8 h-8 text-slate-400" />
                                        </div>
                                        <p className="text-slate-500 font-bold">No {showModal} transactions found</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Delete Confirmation Modal */}
            {
                deleteModalOuter.show && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-[16px] bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                        <div className="bg-white rounded-[32px] p-[32px] w-full max-w-[400px] shadow-2xl animate-in zoom-in-95 duration-300 border border-white">
                            <div className="w-[64px] h-[64px] bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-[24px] mx-auto">
                                <FaTrash className="text-[24px]" />
                            </div>
                            <h3 className="text-[20px] font-black text-center text-slate-800 mb-[12px]">Delete Transaction?</h3>
                            <p className="text-center text-slate-500 text-[14px] font-medium mb-[32px]">
                                Are you sure you want to delete this transaction? This action cannot be undone.
                            </p>
                            <div className="flex gap-[16px]">
                                <button
                                    onClick={() => setDeleteModalOuter({ show: false, id: null })}
                                    className="flex-1 py-[16px] rounded-[16px] font-black text-[14px] bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all uppercase tracking-widest"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDelete(deleteModalOuter.id)}
                                    className="flex-1 py-[16px] rounded-[16px] font-black text-[14px] bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all uppercase tracking-widest"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Category Manager Modal */}
            {
                showCategoryManager && (
                    <CategoryManager
                        categories={categories}
                        onUpdate={() => {
                            getExpenseCategories().then(res => setCategories(res.data));
                        }}
                        onCreate={createExpenseCategory}
                        onDelete={deleteExpenseCategory}
                        onClose={() => setShowCategoryManager(false)}
                    />
                )
            }

            {/* Project Manager Modal */}
            {
                showProjectManager && (
                    <ProjectManager
                        projects={projects}
                        onCreate={createProject}
                        onDelete={deleteProject}
                        onRefresh={fetchData}
                        onClose={() => setShowProjectManager(false)}
                    />
                )
            }

            {showWorkerManager && (
                <WorkerManager
                    onUpdate={fetchData}
                    onClose={() => setShowWorkerManager(false)}
                />
            )}
        </div >
    );
};

const StatCard = ({ title, value, color, subtitle, onClick }) => (
    <div
        onClick={onClick}
        className={`bg-white rounded-[32px] p-[24px] sm:p-[32px] shadow-xl border border-slate-100 transform hover:-translate-y-1 transition-transform ${onClick ? 'cursor-pointer hover:shadow-2xl' : ''}`}
    >
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-[4px]">{title}</p>
        <p className={`text-[20px] sm:text-[24px] font-black tracking-tight mb-[8px] ${color}`}>{value}</p>
        <p className="text-[10px] font-bold text-slate-500 flex items-center gap-[4px]">
            <span className="w-[6px] h-[6px] rounded-full bg-slate-200"></span>
            {subtitle}
        </p>
    </div>
);

const BudgetProgress = ({ label, spent, limit, color }) => {
    const percentage = Math.min((spent / limit) * 100, 100);
    return (
        <div>
            <div className="flex justify-between items-center mb-[8px]">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</span>
                <span className="text-[10px] font-black text-slate-800">₹{parseFloat(spent).toFixed(0)} / ₹{limit}</span>
            </div>
            <div className="w-full h-[8px] bg-slate-100 rounded-full overflow-hidden">
                <div
                    className={`h-full ${color} transition-all duration-1000`}
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
};

export default ExpenseTracker;
