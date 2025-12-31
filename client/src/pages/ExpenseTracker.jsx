import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTransactions, createTransaction, deleteTransaction, getTransactionStats } from '../api/transactionApi';
import { API_URL } from '../api/axiosInstance';
import toast from 'react-hot-toast';
import {
    FaWallet, FaPlus, FaTrash, FaChartBar, FaTag, FaHome,
    FaExchangeAlt, FaPiggyBank, FaFileAlt, FaSignOutAlt, FaTimes
} from 'react-icons/fa';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

const ExpenseTracker = () => {
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState([]);
    const [stats, setStats] = useState({ summary: { total_income: 0, total_expense: 0 }, categories: [] });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Dashboard');
    const [showAddModal, setShowAddModal] = useState(false);
    const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')) || {});

    const [formData, setFormData] = useState({
        title: '',
        amount: '',
        type: 'expense',
        category: 'Food',
        date: new Date().toISOString().split('T')[0]
    });

    const expenseCategories = ['Food', 'Shopping', 'Rent', 'Transport', 'Utilities', 'Entertainment', 'Health', 'Other'];
    const incomeCategories = ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'];

    const fetchData = async () => {
        try {
            const [transRes, statsRes] = await Promise.all([
                getTransactions(),
                getTransactionStats()
            ]);
            setTransactions(transRes.data);
            setStats(statsRes.data);
            setLoading(false);
        } catch (error) {
            toast.error("Failed to fetch data");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await createTransaction(formData);
            toast.success("Transaction added!");
            setShowAddModal(false);
            setFormData({
                title: '',
                amount: '',
                type: 'expense',
                category: 'Food',
                date: new Date().toISOString().split('T')[0]
            });
            fetchData();
        } catch (error) {
            toast.error("Failed to add transaction");
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteTransaction(id);
            toast.success("Transaction deleted");
            fetchData();
        } catch (error) {
            toast.error("Failed to delete transaction");
        }
    };

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
            onClick={() => setActiveTab(label)}
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
                <div className="flex flex-col items-center mb-12">
                    <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4 border-4 border-white shadow-xl overflow-hidden relative group">
                        {user.profile_image ? (
                            <img src={`${API_URL}${user.profile_image}`} className="w-full h-full object-cover" alt="Profile" />
                        ) : (
                            <div className="text-3xl font-black text-[#2d5bff]">{user.username?.charAt(0).toUpperCase()}</div>
                        )}
                    </div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Welcome!</p>
                    <h3 className="text-xl font-black">{user.username}</h3>
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
            <main className="flex-1 p-6 lg:p-12 h-screen overflow-y-auto custom-scrollbar">
                {/* Header */}
                <div className="flex justify-between items-center mb-12">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-[#2d5bff] rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <FaWallet className="text-white text-xl" />
                            </div>
                            <h1 className="text-3xl font-black tracking-tight">Income and Expense Tracker</h1>
                        </div>
                        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest ml-13">Take control of your finances</p>
                    </div>
                    <button
                        onClick={() => navigate('/')}
                        className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center hover:bg-slate-300 transition-all active:scale-95 group"
                    >
                        <FaTimes className="text-slate-600 transition-transform group-hover:rotate-90" />
                    </button>
                </div>

                {activeTab === 'Dashboard' ? (
                    <div className="animate-in fade-in duration-500">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                            <StatCard title="Total Balance" value={`$${totalBalance.toFixed(2)}`} color="text-slate-800" subtitle={`${totalBalance >= 0 ? '+' : ''}0% from last month`} />
                            <StatCard title="Monthly Income" value={`$${parseFloat(stats.summary?.total_income || 0).toFixed(2)}`} color="text-blue-500" subtitle="This month" />
                            <StatCard title="Monthly Expenses" value={`$${parseFloat(stats.summary?.total_expense || 0).toFixed(2)}`} color="text-red-500" subtitle="This month" />
                            <StatCard title="Savings Rate" value={`${savingsRate}%`} color="text-emerald-500" subtitle="% of income" />
                        </div>

                        {/* Charts Section */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-12">
                            {/* Donut Chart */}
                            <div className="bg-white rounded-[32px] p-8 shadow-xl border border-slate-100 h-[500px] flex flex-col">
                                <h3 className="text-lg font-black mb-8 flex items-center gap-2">
                                    <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
                                    Spending by Category
                                </h3>
                                <div className="flex-1">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={80}
                                                outerRadius={140}
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
                            <div className="bg-white rounded-[32px] p-8 shadow-xl border border-slate-100 h-[500px] flex flex-col">
                                <h3 className="text-lg font-black mb-8 flex items-center gap-2">
                                    <div className="w-2 h-6 bg-slate-800 rounded-full"></div>
                                    Monthly Overview
                                </h3>
                                <div className="flex-1">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={barData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} />
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
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                            {/* Budgets Progress */}
                            <div className="lg:col-span-1 bg-white rounded-[32px] p-8 shadow-xl border border-slate-100">
                                <h3 className="text-lg font-black mb-6 flex items-center gap-2">
                                    <div className="w-2 h-6 bg-emerald-500 rounded-full"></div>
                                    Monthly Budgets
                                </h3>
                                <div className="space-y-6">
                                    <BudgetProgress label="Food & Dining" spent={stats.categories.find(c => c.category === 'Food')?.total || 0} limit={500} color="bg-blue-500" />
                                    <BudgetProgress label="Shopping" spent={stats.categories.find(c => c.category === 'Shopping')?.total || 0} limit={300} color="bg-emerald-500" />
                                    <BudgetProgress label="Entertainment" spent={stats.categories.find(c => c.category === 'Entertainment')?.total || 0} limit={200} color="bg-purple-500" />
                                    <BudgetProgress label="Transport" spent={stats.categories.find(c => c.category === 'Transport')?.total || 0} limit={150} color="bg-orange-500" />
                                </div>
                            </div>

                            {/* Recent Activity */}
                            <div className="lg:col-span-2 bg-white rounded-[32px] p-8 shadow-xl border border-slate-100">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-black flex items-center gap-2">
                                        <div className="w-2 h-6 bg-slate-800 rounded-full"></div>
                                        Recent Activity
                                    </h3>
                                    <button onClick={() => setActiveTab('Transactions')} className="text-xs font-black text-[#2d5bff] uppercase tracking-widest hover:underline">View All</button>
                                </div>
                                <div className="space-y-4">
                                    {transactions.slice(0, 4).map(t => (
                                        <div key={t.id} className="flex justify-between items-center p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm ${t.type === 'income' ? 'bg-blue-50 text-blue-500' : 'bg-red-50 text-red-500'}`}>
                                                    {t.type === 'income' ? '↓' : '↑'}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-800 text-sm">{t.title}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.category}</p>
                                                </div>
                                            </div>
                                            <p className={`font-black text-sm ${t.type === 'income' ? 'text-blue-500' : 'text-red-500'}`}>
                                                {t.type === 'income' ? '+' : '-'}${parseFloat(t.amount).toFixed(2)}
                                            </p>
                                        </div>
                                    ))}
                                    {transactions.length === 0 && <p className="text-center py-8 text-slate-400 text-xs font-bold uppercase tracking-widest">No activity yet</p>}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-center">
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="bg-[#1a1c21] hover:bg-slate-800 text-white font-black px-12 py-5 rounded-3xl shadow-2xl transition-all active:scale-95 flex items-center gap-4 hover:shadow-blue-500/10"
                            >
                                <FaPlus /> Add Transaction
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="animate-in slide-in-from-right-10 duration-500">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-black">All Transactions</h2>
                            <button onClick={() => setShowAddModal(true)} className="bg-[#2d5bff] text-white p-3 rounded-xl shadow-lg shadow-blue-500/20 hover:scale-105 transition-transform">
                                <FaPlus />
                            </button>
                        </div>
                        <div className="space-y-4">
                            {transactions.map(t => (
                                <div key={t.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex justify-between items-center group hover:shadow-lg transition-all transform hover:-translate-y-1">
                                    <div className="flex items-center gap-5">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl shadow-sm ${t.type === 'income' ? 'bg-blue-50 text-blue-500' : 'bg-red-50 text-red-500'}`}>
                                            {t.type === 'income' ? '↓' : '↑'}
                                        </div>
                                        <div>
                                            <h4 className="font-black text-slate-800">{t.title}</h4>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.category}</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                <span className="text-[10px] font-bold text-slate-400">{new Date(t.date).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <p className={`text-xl font-black tracking-tighter ${t.type === 'income' ? 'text-blue-500' : 'text-red-500'}`}>
                                            {t.type === 'income' ? '+' : '-'}${parseFloat(t.amount).toFixed(2)}
                                        </p>
                                        <button onClick={() => handleDelete(t.id)} className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[40px] p-10 w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-300">
                        <button onClick={() => setShowAddModal(false)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-800 transition-colors">
                            <FaTimes />
                        </button>
                        <h2 className="text-2xl font-black mb-8 flex items-center gap-3">
                            <div className="w-2 h-8 bg-blue-500 rounded-full"></div>
                            Add {formData.type === 'income' ? 'Income' : 'Expense'}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="flex p-1 bg-slate-100 rounded-2xl mb-8">
                                <button type="button" onClick={() => setFormData({ ...formData, type: 'expense', category: 'Food' })} className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${formData.type === 'expense' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}>Expense</button>
                                <button type="button" onClick={() => setFormData({ ...formData, type: 'income', category: 'Salary' })} className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${formData.type === 'income' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}>Income</button>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Label</label>
                                <input required type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-['Outfit']" placeholder="Electricity, Salary..." />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Amount</label>
                                    <input required type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-['Outfit']" placeholder="0.00" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Category</label>
                                    <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-['Outfit'] cursor-pointer">
                                        {(formData.type === 'expense' ? expenseCategories : incomeCategories).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Date</label>
                                <input required type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-['Outfit'] cursor-pointer" />
                            </div>

                            <button type="submit" className="w-full bg-[#1a1c21] hover:bg-slate-800 text-white font-black py-5 rounded-2xl transition-all active:scale-95 shadow-xl shadow-blue-500/10 flex items-center justify-center gap-3">
                                <FaPlus /> Save Transaction
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const StatCard = ({ title, value, color, subtitle }) => (
    <div className="bg-white rounded-[32px] p-8 shadow-xl border border-slate-100 transform hover:-translate-y-1 transition-transform">
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{title}</p>
        <p className={`text-2xl font-black tracking-tight mb-2 ${color}`}>{value}</p>
        <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
            {subtitle}
        </p>
    </div>
);

const BudgetProgress = ({ label, spent, limit, color }) => {
    const percentage = Math.min((spent / limit) * 100, 100);
    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</span>
                <span className="text-[10px] font-black text-slate-800">${parseFloat(spent).toFixed(0)} / ${limit}</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                    className={`h-full ${color} transition-all duration-1000`}
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
};

export default ExpenseTracker;
