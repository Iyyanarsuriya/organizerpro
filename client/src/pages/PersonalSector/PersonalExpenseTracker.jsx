import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, TrendingUp, TrendingDown, IndianRupee, Tag, Filter, LayoutDashboard, List, Calendar, X } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import toast from 'react-hot-toast';
import { getTransactions, createTransaction, updateTransaction, deleteTransaction } from '../../api/transactionApi';
import { formatAmount } from '../../utils/formatUtils';
import { getExpenseCategories, createExpenseCategory, deleteExpenseCategory } from '../../api/expenseCategoryApi';
import CategoryManager from '../../components/CategoryManager';
import ExportButtons from '../../components/ExportButtons';
import { exportPersonalExpenseToCSV, exportPersonalExpenseToTXT, exportPersonalExpenseToPDF } from '../../utils/exportUtils';

const PersonalExpenseTracker = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('list'); // 'list' | 'analytics'
    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showCategoryManager, setShowCategoryManager] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        amount: '',
        type: 'expense', // 'expense' | 'income'
        category: 'General',
        date: new Date().toISOString().split('T')[0],
        description: ''
    });
    const [editingId, setEditingId] = useState(null);

    // Filters
    const [filterType, setFilterType] = useState('all'); // 'all', 'expense', 'income'
    const [filterTime, setFilterTime] = useState('month'); // 'all', 'month', 'year', 'range'
    const [customRange, setCustomRange] = useState({ start: new Date().toISOString().split('T')[0], end: '' });
    const [filterCategory, setFilterCategory] = useState('all');

    const fetchData = async () => {
        try {
            setLoading(true);
            const [transRes, catRes] = await Promise.all([
                getTransactions({}), // Fetches all transactions for the user
                getExpenseCategories()
            ]);

            // Filter out complex manufacturing transactions (optional: could rely on category or project_id being null)
            // For now, we'll just show all, but when creating we won't add project_id
            setTransactions(transRes.data || []);
            setCategories(catRes.data || []);
        } catch (error) {
            console.error("Failed to fetch expenses", error);
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                project_id: null, // Explicitly null for personal
                member_id: null
            };

            if (editingId) {
                await updateTransaction(editingId, payload);
                toast.success("Updated successfully");
            } else {
                await createTransaction(payload);
                toast.success("Added successfully");
            }
            setShowAddModal(false);
            setEditingId(null);
            resetForm();
            fetchData();
        } catch (error) {
            toast.error("Operation failed");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this?")) return;
        try {
            await deleteTransaction(id);
            toast.success("Deleted successfully");
            fetchData();
        } catch (error) {
            toast.error("Delete failed");
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            amount: '',
            type: 'expense',
            category: 'General',
            date: new Date().toISOString().split('T')[0],
            description: ''
        });
    };

    const openEdit = (t) => {
        setFormData({
            title: t.title,
            amount: t.amount,
            type: t.type,
            category: t.category,
            date: t.date.split('T')[0],
            description: t.description || ''
        });
        setEditingId(t.id);
        setShowAddModal(true);
    };

    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            if (filterType !== 'all' && t.type !== filterType) return false;
            if (filterCategory !== 'all' && t.category !== filterCategory) return false;

            const tDate = new Date(t.date);
            const now = new Date();
            const tDateStr = t.date.split('T')[0];

            if (filterTime === 'day') {
                return customRange.start ? tDateStr === customRange.start : true;
            } else if (filterTime === 'month') {
                return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
            } else if (filterTime === 'year') {
                return tDate.getFullYear() === now.getFullYear();
            } else if (filterTime === 'range') {
                if (customRange.start && tDateStr < customRange.start) return false;
                if (customRange.end && tDateStr > customRange.end) return false;
                return true;
            }

            return true;
        }).sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [transactions, filterType, filterTime, filterCategory, customRange]);

    const stats = useMemo(() => {
        const income = filteredTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + parseFloat(t.amount), 0);
        const expense = filteredTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + parseFloat(t.amount), 0);
        return { income, expense, balance: income - expense };
    }, [filteredTransactions]);

    const chartData = useMemo(() => {
        const expenseByCategory = {};
        filteredTransactions.filter(t => t.type === 'expense').forEach(t => {
            expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + parseFloat(t.amount);
        });
        return Object.keys(expenseByCategory).map(key => ({ name: key, value: expenseByCategory[key] }));
    }, [filteredTransactions]);

    const trendData = useMemo(() => {
        const last7Days = [...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();

        return last7Days.map(date => {
            const dayTrans = filteredTransactions.filter(t => t.date.startsWith(date));
            const income = dayTrans.filter(t => t.type === 'income').reduce((acc, t) => acc + parseFloat(t.amount), 0);
            const expense = dayTrans.filter(t => t.type === 'expense').reduce((acc, t) => acc + parseFloat(t.amount), 0);
            return {
                name: new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
                income,
                expense
            };
        });
    }, [filteredTransactions]);

    const COLORS = ['#2d5bff', '#10b981', '#f43f5e', '#8b5cf6', '#f59e0b', '#06b6d4'];

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#2d5bff]"></div>
        </div>
    );

    return (
        <div className="min-h-[100vh] bg-[#f8fafc] font-['Outfit',sans-serif] text-slate-800 pb-[48px]">
            {/* Background Decor */}
            <div className="fixed top-0 left-0 right-0 h-[256px] bg-linear-to-b from-blue-50/80 to-transparent pointer-events-none z-0"></div>

            <div className="max-w-[1024px] mx-auto px-[16px] sm:px-[24px] lg:px-[32px] py-[32px] relative z-10">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-[24px] mb-[24px] md:mb-[40px]">
                    <div className="flex items-center gap-[12px] md:gap-[16px]">
                        <button
                            onClick={() => navigate('/personal')}
                            className="w-[40px] h-[40px] md:w-[48px] md:h-[48px] bg-white border border-slate-200 rounded-[12px] md:rounded-[16px] flex items-center justify-center text-slate-500 hover:text-[#2d5bff] hover:border-[#2d5bff] hover:shadow-lg hover:shadow-blue-500/10 transition-all active:scale-95 shrink-0 cursor-pointer group"
                        >
                            <ArrowLeft className="w-[20px] h-[20px] md:w-[24px] md:h-[24px] group-hover:-translate-x-[2px] transition-transform" />
                        </button>
                        <div>
                            <h1 className="text-[22px] md:text-[30px] font-black text-[#1e293b] tracking-tight mb-[2px] md:mb-[4px]">Personal Expenses</h1>
                            <p className="text-[10px] md:text-[12px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-[6px] md:gap-[8px]">
                                <span className="w-[6px] h-[6px] md:w-[8px] md:h-[8px] rounded-full bg-[#2d5bff]"></span>
                                Track your financial health
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-[12px]">
                        <div className="bg-white md:bg-slate-100 p-[3px] md:p-[4px] rounded-[10px] md:rounded-[12px] flex shadow-sm md:shadow-inner border border-slate-100 md:border-transparent">
                            <button
                                onClick={() => setActiveTab('list')}
                                className={`p-[6px] md:p-[8px] rounded-[8px] transition-all ${activeTab === 'list' ? 'bg-slate-100 md:bg-white text-[#2d5bff] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                title="List View"
                            >
                                <List className="w-[18px] h-[18px] md:w-[20px] md:h-[20px]" />
                            </button>
                            <button
                                onClick={() => setActiveTab('analytics')}
                                className={`p-[6px] md:p-[8px] rounded-[8px] transition-all ${activeTab === 'analytics' ? 'bg-slate-100 md:bg-white text-[#2d5bff] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                title="Analytics View"
                            >
                                <LayoutDashboard className="w-[18px] h-[18px] md:w-[20px] md:h-[20px]" />
                            </button>
                        </div>
                        <button
                            onClick={() => setShowCategoryManager(true)}
                            className="h-[36px] w-[36px] md:w-auto md:h-[48px] md:px-[24px] bg-white border border-slate-200 rounded-[12px] md:rounded-[16px] flex items-center justify-center gap-[8px] text-slate-600 font-bold text-[12px] uppercase tracking-widest hover:text-[#2d5bff] hover:border-[#2d5bff] hover:shadow-lg hover:shadow-blue-500/10 transition-all active:scale-95 cursor-pointer"
                        >
                            <Tag className="w-[16px] h-[16px]" /> <span className="hidden md:inline">Categories</span>
                        </button>
                        <button
                            onClick={() => { resetForm(); setShowAddModal(true); }}
                            className="h-[40px] w-[40px] md:w-auto md:px-[32px] bg-[#2d5bff] hover:bg-blue-600 text-white rounded-[14px] md:rounded-[16px] font-black text-[12px] uppercase tracking-widest shadow-lg shadow-blue-500/30 flex items-center justify-center gap-[8px] transition-all active:scale-95 hover:translate-y-[-2px] cursor-pointer"
                        >
                            <Plus className="w-[20px] h-[20px]" /> <span className="hidden md:inline">Transaction</span>
                        </button>
                    </div>
                </div>



                {/* Filters & Actions */}
                {/* Filters & Actions */}
                {/* Filters & Actions */}
                {/* Filters & Actions */}
                <div className="bg-white rounded-[24px] border border-slate-200/60 p-[12px] md:p-[16px] shadow-sm mb-[24px]">
                    <div className="flex flex-col xl:flex-row items-center gap-[12px]">

                        {/* Time Period Pills */}
                        <div className="bg-slate-100/80 p-[4px] md:p-[6px] rounded-[12px] md:rounded-[16px] flex items-center gap-[4px] w-full xl:w-auto overflow-x-auto custom-scrollbar">
                            {['day', 'month', 'year', 'range'].map(time => (
                                <button
                                    key={time}
                                    onClick={() => {
                                        setFilterTime(time);
                                        if (time === 'day' && !customRange.start) {
                                            setCustomRange(prev => ({ ...prev, start: new Date().toISOString().split('T')[0] }));
                                        }
                                    }}
                                    className={`flex-1 xl:flex-none px-[12px] md:px-[16px] py-[8px] md:py-[12px] rounded-[10px] md:rounded-[12px] text-[10px] md:text-[11px] font-black uppercase tracking-widest transition-all cursor-pointer whitespace-nowrap ${filterTime === time ? 'bg-white text-[#2d5bff] shadow-sm ring-[1px] ring-black/5' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'}`}
                                >
                                    {time}
                                </button>
                            ))}
                        </div>

                        {/* Date Inputs - Animate In */}
                        {(filterTime === 'day' || filterTime === 'range') && (
                            <div className="flex flex-col sm:flex-row items-center gap-[8px] w-full xl:w-auto animate-in fade-in slide-in-from-left-[16px] duration-300">
                                <div className="relative flex-1 w-full xl:flex-none group">
                                    <input
                                        type="date"
                                        value={customRange.start}
                                        onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })}
                                        className="w-full xl:w-auto bg-slate-50 border border-slate-200 text-slate-600 text-[12px] font-bold rounded-[12px] md:rounded-[16px] px-[12px] md:px-[16px] py-[10px] md:py-[12px] pl-[36px] md:pl-[40px] focus:outline-none focus:border-[#2d5bff] focus:ring-[4px] focus:ring-blue-500/10 cursor-pointer transition-all hover:bg-white hover:border-slate-300 hover:shadow-sm"
                                    />
                                    <Calendar className="w-[14px] h-[14px] md:w-[16px] md:h-[16px] text-slate-400 absolute left-[12px] md:left-[16px] top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-[#2d5bff] transition-colors" />
                                </div>
                                {filterTime === 'range' && (
                                    <>
                                        <span className="text-slate-300 font-bold hidden sm:inline">&rarr;</span>
                                        <div className="relative flex-1 w-full xl:flex-none group">
                                            <input
                                                type="date"
                                                value={customRange.end}
                                                onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })}
                                                className="w-full xl:w-auto bg-slate-50 border border-slate-200 text-slate-600 text-[12px] font-bold rounded-[12px] md:rounded-[16px] px-[12px] md:px-[16px] py-[10px] md:py-[12px] pl-[36px] md:pl-[40px] focus:outline-none focus:border-[#2d5bff] focus:ring-[4px] focus:ring-blue-500/10 cursor-pointer transition-all hover:bg-white hover:border-slate-300 hover:shadow-sm"
                                            />
                                            <Calendar className="w-[14px] h-[14px] md:w-[16px] md:h-[16px] text-slate-400 absolute left-[12px] md:left-[16px] top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-[#2d5bff] transition-colors" />
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        <div className="hidden xl:block w-[1px] h-[32px] bg-slate-100 mx-[8px]"></div>

                        {/* Filters Dropdowns */}
                        <div className="flex flex-col sm:flex-row items-center gap-[8px] w-full xl:w-auto">
                            <div className="relative flex-1 w-full sm:w-auto group">
                                <select
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                    className="appearance-none w-full bg-slate-50 md:bg-white border border-slate-200 text-slate-600 text-[12px] font-bold rounded-[12px] md:rounded-[16px] px-[12px] md:px-[16px] py-[10px] md:py-[12px] pl-[36px] md:pl-[40px] pr-[32px] focus:outline-none focus:border-[#2d5bff] focus:ring-[4px] focus:ring-blue-500/10 cursor-pointer transition-all hover:border-slate-300 hover:shadow-sm"
                                >
                                    <option value="all">All Types</option>
                                    <option value="income">Income</option>
                                    <option value="expense">Expense</option>
                                </select>
                                <Filter className="w-[14px] h-[14px] md:w-[16px] md:h-[16px] text-slate-400 absolute left-[12px] md:left-[16px] top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-[#2d5bff] transition-colors" />
                            </div>

                            <div className="relative flex-1 w-full sm:w-auto group">
                                <select
                                    value={filterCategory}
                                    onChange={(e) => setFilterCategory(e.target.value)}
                                    className="appearance-none w-full bg-slate-50 md:bg-white border border-slate-200 text-slate-600 text-[12px] font-bold rounded-[12px] md:rounded-[16px] px-[12px] md:px-[16px] py-[10px] md:py-[12px] pl-[36px] md:pl-[40px] pr-[32px] focus:outline-none focus:border-[#2d5bff] focus:ring-[4px] focus:ring-blue-500/10 cursor-pointer transition-all hover:border-slate-300 hover:shadow-sm"
                                >
                                    <option value="all">All Categories</option>
                                    <option value="General">General</option>
                                    {categories.filter(c => c.name !== 'General').map(c => (
                                        <option key={c.id} value={c.name}>{c.name}</option>
                                    ))}
                                </select>
                                <Tag className="w-[14px] h-[14px] md:w-[16px] md:h-[16px] text-slate-400 absolute left-[12px] md:left-[16px] top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-[#2d5bff] transition-colors" />
                            </div>

                            {/* Export Actions (Hidden on Mobile) */}
                            <div className="hidden sm:block ml-auto xl:ml-0">
                                <ExportButtons
                                    onExportCSV={() => exportPersonalExpenseToCSV(filteredTransactions, `personal_expenses_${new Date().toISOString().split('T')[0]}`)}
                                    onExportPDF={() => exportPersonalExpenseToPDF({ data: filteredTransactions, period: filterTime === 'range' ? `${customRange.start || 'Start'} to ${customRange.end || 'End'}` : (filterTime === 'all' ? 'All Time' : filterTime), filename: `personal_expenses_${new Date().toISOString().split('T')[0]}` })}
                                    onExportTXT={() => exportPersonalExpenseToTXT({ data: filteredTransactions, period: filterTime === 'range' ? `${customRange.start || 'Start'} to ${customRange.end || 'End'}` : (filterTime === 'all' ? 'All Time' : filterTime), filename: `personal_expenses_${new Date().toISOString().split('T')[0]}` })}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                {activeTab === 'analytics' ? (
                    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-[24px]">
                            {/* Income Card */}
                            <div className="relative overflow-hidden bg-white p-[16px] md:p-[24px] rounded-[20px] md:rounded-[24px] border border-slate-100 shadow-xl shadow-slate-200/50 group">
                                <div className="absolute top-0 right-0 p-[24px] opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                                    <TrendingUp className="w-[64px] h-[64px] md:w-[96px] md:h-[96px] text-emerald-500" />
                                </div>
                                <div className="relative z-10">
                                    <div className="w-[32px] h-[32px] md:w-[40px] md:h-[40px] rounded-[10px] md:rounded-[12px] bg-emerald-50 flex items-center justify-center mb-[12px] md:mb-[16px] text-emerald-500 group-hover:scale-110 transition-transform">
                                        <TrendingUp className="w-[16px] h-[16px] md:w-[20px] md:h-[20px]" />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[2px] md:mb-[4px]">Total Income</p>
                                    <p className="text-[24px] md:text-[30px] font-black text-slate-800 tracking-tight">₹{formatAmount(stats.income)}</p>
                                    <div className="mt-[8px] w-full bg-slate-100 h-[4px] rounded-full overflow-hidden">
                                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: '100%' }}></div>
                                    </div>
                                </div>
                            </div>

                            {/* Expense Card */}
                            <div className="relative overflow-hidden bg-white p-[16px] md:p-[24px] rounded-[20px] md:rounded-[24px] border border-slate-100 shadow-xl shadow-slate-200/50 group">
                                <div className="absolute top-0 right-0 p-[24px] opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                                    <TrendingDown className="w-[64px] h-[64px] md:w-[96px] md:h-[96px] text-rose-500" />
                                </div>
                                <div className="relative z-10">
                                    <div className="w-[32px] h-[32px] md:w-[40px] md:h-[40px] rounded-[10px] md:rounded-[12px] bg-rose-50 flex items-center justify-center mb-[12px] md:mb-[16px] text-rose-500 group-hover:scale-110 transition-transform">
                                        <TrendingDown className="w-[16px] h-[16px] md:w-[20px] md:h-[20px]" />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[2px] md:mb-[4px]">Total Expenses</p>
                                    <p className="text-[24px] md:text-[30px] font-black text-slate-800 tracking-tight">₹{formatAmount(stats.expense)}</p>
                                    <div className="mt-[8px] w-full bg-slate-100 h-[4px] rounded-full overflow-hidden">
                                        <div className="bg-rose-500 h-full rounded-full" style={{ width: `${(stats.expense / (stats.income || 1)) * 100}%` }}></div>
                                    </div>
                                </div>
                            </div>

                            {/* Balance Card */}
                            <div className="relative overflow-hidden bg-linear-to-br from-[#2d5bff] to-[#6366f1] p-[16px] md:p-[24px] rounded-[20px] md:rounded-[24px] shadow-2xl shadow-blue-500/30 group text-white">
                                <div className="absolute top-0 right-0 p-[24px] opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                                    <IndianRupee className="w-[64px] h-[64px] md:w-[96px] md:h-[96px] text-white" />
                                </div>
                                <div className="absolute -bottom-10 -left-10 w-[120px] h-[120px] md:w-[160px] md:h-[160px] bg-white/10 rounded-full blur-2xl"></div>

                                <div className="relative z-10">
                                    <div className="w-[32px] h-[32px] md:w-[40px] md:h-[40px] rounded-[10px] md:rounded-[12px] bg-white/20 flex items-center justify-center mb-[12px] md:mb-[16px] text-white group-hover:scale-110 transition-transform backdrop-blur-sm border border-white/20">
                                        <IndianRupee className="w-[16px] h-[16px] md:w-[20px] md:h-[20px]" />
                                    </div>
                                    <p className="text-[10px] font-black text-blue-100 uppercase tracking-widest mb-[2px] md:mb-[4px]">Available Balance</p>
                                    <p className="text-[24px] md:text-[30px] font-black text-white tracking-tight">₹{formatAmount(stats.balance)}</p>
                                    <p className="text-[10px] mt-[8px] font-medium text-blue-100/80">
                                        {stats.balance >= 0 ? 'You are saving well! 🚀' : 'Expenses exceeding income ⚠️'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        {/* Summary Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-[24px]">
                            {/* Expense Distribution */}
                            <div className="bg-white p-[24px] rounded-[24px] border border-slate-100 shadow-xl shadow-slate-200/50">
                                <h3 className="text-[18px] font-black text-slate-800 mb-[24px] flex items-center gap-[8px]"><Tag className="w-[20px] h-[20px] text-[#2d5bff]" /> Spend by Category</h3>
                                <div className="h-[256px]">
                                    {chartData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={chartData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {chartData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip formatter={(value) => `₹${formatAmount(value)}`} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                            <p className="font-bold text-[14px]">No expense data</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Weekly Trend */}
                            <div className="bg-white p-[24px] rounded-[24px] border border-slate-100 shadow-xl shadow-slate-200/50">
                                <h3 className="text-[18px] font-black text-slate-800 mb-[24px] flex items-center gap-[8px]"><TrendingUp className="w-[20px] h-[20px] text-emerald-500" /> Activity Trend (Last 7 Days)</h3>
                                <div className="h-[256px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={trendData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(value) => `₹${value / 1000}k`} />
                                            <Tooltip
                                                cursor={{ fill: '#f8fafc' }}
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                            />
                                            <Legend iconType="circle" />
                                            <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                                            <Bar dataKey="expense" name="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Recent Large Transactions */}
                        <div className="bg-white rounded-[24px] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                            <div className="p-[24px] border-b border-slate-50">
                                <h3 className="text-[18px] font-black text-slate-800">Biggest Expenses</h3>
                            </div>
                            <div className="divide-y divide-slate-50">
                                {filteredTransactions
                                    .filter(t => t.type === 'expense')
                                    .sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))
                                    .slice(0, 5)
                                    .map(t => (
                                        <div key={t.id} className="p-[12px] md:p-[16px] flex items-center justify-between hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-[12px] md:gap-[16px]">
                                                <div className="w-[32px] h-[32px] md:w-[40px] md:h-[40px] rounded-[10px] md:rounded-[12px] bg-rose-50 text-rose-500 flex items-center justify-center">
                                                    <TrendingDown className="w-[16px] h-[16px] md:w-[20px] md:h-[20px]" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 text-[13px] md:text-[14px]">{t.title}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">{t.category}</p>
                                                </div>
                                            </div>
                                            <span className="font-black text-rose-500 text-[14px] md:text-[16px]">- ₹{formatAmount(t.amount)}</span>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-[24px] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden min-h-[400px]">
                        <div className="p-[16px] md:p-[24px] border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                            <h2 className="text-[16px] md:text-[18px] font-black text-slate-800 tracking-tight flex items-center gap-[8px]">
                                Recent Transactions
                                <span className="bg-slate-100 text-slate-500 text-[10px] px-[8px] py-[4px] rounded-full">{filteredTransactions.length}</span>
                            </h2>
                        </div>

                        {filteredTransactions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-[60px] md:py-[80px] opacity-50">
                                <div className="w-[60px] h-[60px] md:w-[80px] md:h-[80px] bg-slate-100 rounded-full flex items-center justify-center mb-[12px] md:mb-[16px]">
                                    <IndianRupee className="w-[24px] h-[24px] md:w-[32px] md:h-[32px] text-slate-400" />
                                </div>
                                <p className="text-slate-500 font-bold">No transactions found</p>
                                <p className="text-[12px] text-slate-400 mt-[4px]">Try changing filters or add a new one</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {filteredTransactions.map((t, index) => (
                                    <div
                                        key={t.id}
                                        onClick={() => openEdit(t)}
                                        className="p-[12px] md:p-[20px] flex items-center justify-between hover:bg-slate-50/80 transition-all cursor-pointer group animate-in fade-in slide-in-from-bottom-[8px] duration-300"
                                        style={{ animationDelay: `${index * 50}ms` }}
                                    >
                                        <div className="flex items-center gap-[12px] md:gap-[20px]">
                                            <div className={`w-[40px] h-[40px] md:w-[48px] md:h-[48px] rounded-[12px] md:rounded-[16px] flex items-center justify-center shadow-sm transition-transform group-hover:scale-110 ${t.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                                {t.type === 'income' ? <TrendingUp className="w-[20px] h-[20px] md:w-[24px] md:h-[24px]" /> : <TrendingDown className="w-[20px] h-[20px] md:w-[24px] md:h-[24px]" />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 text-[13px] md:text-[14px] mb-[2px] group-hover:text-[#2d5bff] transition-colors line-clamp-1">{t.title}</p>
                                                <div className="flex items-center gap-[8px]">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-[8px] py-[2px] rounded-full">{t.category}</span>
                                                    <span className="text-[10px] font-medium text-slate-400">{new Date(t.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-[12px] md:gap-[24px]">
                                            <span className={`font-black text-[14px] md:text-[16px] ${t.type === 'income' ? 'text-emerald-500' : 'text-slate-800'}`}>
                                                {t.type === 'income' ? '+' : '-'} ₹{formatAmount(t.amount)}
                                            </span>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }}
                                                className="w-[28px] h-[28px] md:w-[32px] md:h-[32px] rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-rose-500 transition-all opacity-0 group-hover:opacity-100 cursor-pointer transform hover:scale-110"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-[14px] h-[14px] md:w-[16px] md:h-[16px]" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Add/Edit Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-[16px] bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
                        <div className="bg-white rounded-[24px] md:rounded-[32px] w-full max-w-md p-[20px] md:p-[32px] shadow-2xl animate-in zoom-in-95 duration-200 scale-100 border border-slate-100 relative">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="absolute top-[16px] right-[16px] md:top-[24px] md:right-[24px] w-[32px] h-[32px] rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-rose-100 hover:text-rose-500 transition-colors cursor-pointer"
                            >
                                <X className="w-[16px] h-[16px]" />
                            </button>

                            <div className="mb-[20px] md:mb-[32px]">
                                <h2 className="text-[20px] md:text-[24px] font-black text-slate-800 tracking-tight">{editingId ? 'Edit' : 'New'} Transaction</h2>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-[16px] md:space-y-[24px]">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[8px] md:mb-[12px] block">Transaction Type</label>
                                    <div className="grid grid-cols-2 gap-[8px] md:gap-[12px] p-[4px] bg-slate-50 rounded-[12px] md:rounded-[16px] border border-slate-100">
                                        <button type="button" onClick={() => setFormData({ ...formData, type: 'expense' })} className={`py-[10px] md:py-[12px] rounded-[10px] md:rounded-[12px] text-[11px] md:text-[12px] font-black uppercase tracking-wider transition-all cursor-pointer ${formData.type === 'expense' ? 'bg-white text-rose-500 shadow-md transform scale-[1.02]' : 'text-slate-400 hover:text-slate-600'}`}>Expense</button>
                                        <button type="button" onClick={() => setFormData({ ...formData, type: 'income' })} className={`py-[10px] md:py-[12px] rounded-[10px] md:rounded-[12px] text-[11px] md:text-[12px] font-black uppercase tracking-wider transition-all cursor-pointer ${formData.type === 'income' ? 'bg-white text-emerald-500 shadow-md transform scale-[1.02]' : 'text-slate-400 hover:text-slate-600'}`}>Income</button>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[6px] md:mb-[8px] block">Title</label>
                                    <input required type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full bg-slate-50 border-none rounded-[12px] md:rounded-[16px] px-[16px] md:px-[20px] py-[12px] md:py-[16px] text-[13px] md:text-[14px] font-bold text-slate-800 placeholder:text-slate-300 focus:ring-[2px] focus:ring-[#2d5bff] transition-all" placeholder="e.g. Grocery Shopping" />
                                </div>

                                <div className="grid grid-cols-2 gap-[12px] md:gap-[16px]">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[6px] md:mb-[8px] block">Amount</label>
                                        <input required type="number" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} className="w-full bg-slate-50 border-none rounded-[12px] md:rounded-[16px] px-[16px] md:px-[20px] py-[12px] md:py-[16px] text-[13px] md:text-[14px] font-bold text-slate-800 placeholder:text-slate-300 focus:ring-[2px] focus:ring-[#2d5bff] transition-all" placeholder="₹0.00" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[6px] md:mb-[8px] block">Date</label>
                                        <input required type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full bg-slate-50 border-none rounded-[12px] md:rounded-[16px] px-[16px] md:px-[20px] py-[12px] md:py-[16px] text-[13px] md:text-[14px] font-bold text-slate-800 focus:ring-[2px] focus:ring-[#2d5bff] transition-all" />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[6px] md:mb-[8px] block">Category</label>
                                    <div className="relative">
                                        <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full bg-slate-50 border-none rounded-[12px] md:rounded-[16px] px-[16px] md:px-[20px] py-[12px] md:py-[16px] text-[13px] md:text-[14px] font-bold text-slate-800 appearance-none focus:ring-[2px] focus:ring-[#2d5bff] transition-all cursor-pointer">
                                            <option value="General">General</option>
                                            {categories.filter(c => c.name !== 'General').map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                        </select>
                                        <Tag className="w-[16px] h-[16px] text-slate-400 absolute right-[16px] top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>
                                </div>

                                <div className="flex gap-[12px] md:gap-[16px] pt-[12px] md:pt-[16px]">
                                    <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-[12px] md:py-[16px] rounded-[12px] md:rounded-[16px] border border-slate-200 text-slate-500 font-bold text-[11px] md:text-[12px] uppercase tracking-widest hover:bg-slate-50 cursor-pointer transition-colors">Cancel</button>
                                    <button type="submit" className="flex-1 py-[12px] md:py-[16px] rounded-[12px] md:rounded-[16px] bg-[#2d5bff] text-white font-bold text-[11px] md:text-[12px] uppercase tracking-widest shadow-lg shadow-blue-500/30 hover:bg-blue-600 hover:shadow-xl hover:translate-y-[-2px] transition-all cursor-pointer">Save Transaction</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Category Manager */}
                {showCategoryManager && (
                    <CategoryManager
                        categories={categories}
                        onUpdate={fetchData}
                        onClose={() => setShowCategoryManager(false)}
                        onCreate={createExpenseCategory}
                        onDelete={deleteExpenseCategory}
                    />
                )}

            </div>
        </div>
    );
};

export default PersonalExpenseTracker;
