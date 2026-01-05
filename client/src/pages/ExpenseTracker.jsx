import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getTransactions, createTransaction, updateTransaction, deleteTransaction, getTransactionStats } from '../api/transactionApi';
import { API_URL } from '../api/axiosInstance';
import toast from 'react-hot-toast';
import {
    FaWallet, FaPlus, FaTrash, FaChartBar, FaExchangeAlt, FaFileAlt, FaEdit, FaTimes,
    FaPlusCircle, FaArrowRight, FaArrowLeft, FaCheckCircle, FaUserCheck, FaFolderPlus, FaUserEdit
} from 'react-icons/fa';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import { Settings, Folder } from 'lucide-react';
import { getExpenseCategories, createExpenseCategory, deleteExpenseCategory } from '../api/expenseCategoryApi';
import { getProjects, createProject, deleteProject } from '../api/projectApi';
import { getActiveMembers } from '../api/memberApi';
import CategoryManager from '../components/CategoryManager';
import ProjectManager from '../components/ProjectManager';
import MemberManager from '../components/MemberManager';

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
    const [showMemberManager, setShowMemberManager] = useState(false);
    const [categories, setCategories] = useState([]);
    const [projects, setProjects] = useState([]); // Projects list
    const [members, setMembers] = useState([]); // Members list
    const [filterProject, setFilterProject] = useState(''); // Filter by project ID
    const [filterMember, setFilterMember] = useState(''); // Filter by member ID
    const [deleteModalOuter, setDeleteModalOuter] = useState({ show: false, id: null });

    const [formData, setFormData] = useState({
        title: '',
        amount: '',
        type: 'expense',
        category: 'Food',
        date: new Date().toISOString().split('T')[0],
        project_id: '',
        member_id: ''
    });
    const [editingId, setEditingId] = useState(null);

    const [filterType, setFilterType] = useState('all');
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportType, setExportType] = useState(null);
    const [filterCat, setFilterCat] = useState('all');
    const [sortBy, setSortBy] = useState('date_desc');
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(null); // 'income', 'expense', or null
    const [modalTransactions, setModalTransactions] = useState([]);
    const [showCustomReportModal, setShowCustomReportModal] = useState(false);
    const [customReportLoading, setCustomReportLoading] = useState(false);
    const [customReportForm, setCustomReportForm] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        projectId: '',
        memberId: '',
        category: 'all',
        type: 'all'
    });

    const expenseCategories = ['Food', 'Shopping', 'Rent', 'Transport', 'Utilities', 'Entertainment', 'Health', 'Other'];
    const incomeCategories = ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'];

    const formatAmount = (value) => {
        const num = parseFloat(value || 0);
        return num % 1 === 0 ? num.toString() : num.toFixed(2);
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = date.getHours();
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const formattedHours = hours % 12 || 12;
        return `${day}/${month}/${year} - ${formattedHours}:${minutes} ${ampm}`;
    };

    const fetchData = async () => {
        try {
            const isRange = periodType === 'range';
            const rangeStart = isRange ? customRange.start : null;
            const rangeEnd = isRange ? customRange.end : null;
            if (isRange && (!rangeStart || !rangeEnd)) return;

            const params = {
                projectId: filterProject,
                memberId: filterMember,
                period: isRange ? null : currentPeriod,
                startDate: rangeStart,
                endDate: rangeEnd
            };

            const [transRes, statsRes, catRes, projRes, membersRes] = await Promise.all([
                getTransactions(params),
                getTransactionStats(params),
                getExpenseCategories(),
                getProjects(),
                getActiveMembers()
            ]);
            setTransactions(transRes.data);
            setStats(statsRes.data);
            setCategories(catRes.data);
            setProjects(projRes.data);
            setMembers(membersRes.data.data);
            setLoading(false);
        } catch (error) {
            console.error("Fetch Data Error Details:", error.response || error);
            toast.error(`Failed to fetch data: ${error.response?.data?.message || error.message}`);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [currentPeriod, filterProject, filterMember, customRange.start, customRange.end, periodType]);

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
            if (!currentPeriod.includes('W')) {
                const target = new Date();
                const dayNr = (target.getDay() + 6) % 7;
                target.setDate(target.getDate() - dayNr + 3);
                const firstThursday = target.getTime();
                target.setMonth(0, 1);
                if (target.getDay() !== 4) {
                    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
                }
                const weekNum = 1 + Math.ceil((firstThursday - target) / 604800000);
                setCurrentPeriod(`${target.getFullYear()}-W${String(weekNum).padStart(2, '0')}`);
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
                member_id: filterMember || ''
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
            member_id: transaction.member_id || ''
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
            member_id: filterMember || ''
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
                const matchesMember = !filterMember || (t.member_id == filterMember);

                return matchesType && matchesCat && matchesSearch && matchesProject && matchesMember;
            })
            .sort((a, b) => {
                if (sortBy === 'date_desc') return new Date(b.date) - new Date(a.date);
                if (sortBy === 'date_asc') return new Date(a.date) - new Date(b.date);
                if (sortBy === 'amount_desc') return b.amount - a.amount;
                if (sortBy === 'amount_asc') return a.amount - b.amount;
                return 0;
            });
    }, [transactions, filterType, filterCat, sortBy, searchQuery, filterProject, filterMember]);

    // Derived values
    const totalBalance = (stats.summary?.total_income || 0) - (stats.summary?.total_expense || 0);

    const memberStats = useMemo(() => {
        if (!filterMember) return null;
        const totalSalary = transactions
            .filter(t => t.category.toLowerCase().includes('salary'))
            .reduce((acc, t) => acc + parseFloat(t.amount), 0);
        const totalAdvances = transactions
            .filter(t => t.category.toLowerCase().includes('advance'))
            .reduce((acc, t) => acc + parseFloat(t.amount), 0);
        return { totalSalary, totalAdvances };
    }, [transactions, filterMember]);

    // Export Functions
    const handleExportCSV = (data = transactions, filters = {}) => {
        const reportTransactions = data;
        if (reportTransactions.length === 0) {
            toast.error("No data to export");
            return;
        }

        const headers = ["Date", "Title", "Amount", "Type", "Category", "Project", "Member"];
        const rows = reportTransactions.map(t => [
            new Date(t.date).toLocaleDateString('en-GB'),
            t.title,
            t.amount,
            t.type,
            t.category,
            t.project_name || 'N/A',
            t.member_name || 'N/A'
        ]);

        const periodStr = filters.startDate && filters.endDate
            ? `${filters.startDate}_to_${filters.endDate}`
            : currentPeriod;

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `report_${periodStr}.csv`);
        link.click();
    };

    const handleExportTXT = (data = transactions, reportStats = stats, filters = {}) => {
        const reportTransactions = data;
        const currentStats = reportStats;

        if (reportTransactions.length === 0) {
            toast.error("No data to export");
            return;
        }

        let txt = `FINANCIAL REPORT\n`;
        const now = new Date();
        const nowFormatted = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${now.getHours() % 12 || 12}:${String(now.getMinutes()).padStart(2, '0')} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;

        const periodStr = filters.startDate && filters.endDate
            ? `${filters.startDate} to ${filters.endDate}`
            : (periodType === 'range' ? `${customRange.start} to ${customRange.end}` : currentPeriod);

        txt += `Period: ${periodStr}\n`;
        txt += `Generated on: ${nowFormatted}\n\n`;

        txt += `SUMMARY\n`;
        txt += `-------------------\n`;
        txt += `Total Income: ₹${formatAmount(currentStats.summary?.total_income)}\n`;
        txt += `Total Expense: ₹${formatAmount(currentStats.summary?.total_expense)}\n`;
        txt += `Net: ₹${formatAmount(currentStats.summary?.total_income - currentStats.summary?.total_expense)}\n\n`;

        txt += `TRANSACTIONS\n`;
        txt += `-------------------\n`;
        reportTransactions.forEach(t => {
            const d = new Date(t.date);
            const dateFmt = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
            txt += `${dateFmt} | ${t.title.padEnd(20)} | ₹${t.amount.toString().padEnd(10)} | ${t.type.toUpperCase()}\n`;
        });

        const blob = new Blob([txt], { type: 'text/plain;charset=utf-8;' });
        const link = document.createElement("a");
        link.setAttribute("href", URL.createObjectURL(blob));
        link.setAttribute("download", `report_${periodStr}.txt`);
        link.click();
    };

    const handleExportPDF = (data = transactions, reportStats = stats, filters = {}) => {
        const reportTransactions = data;
        const currentStats = reportStats;

        if (reportTransactions.length === 0) {
            toast.error("No data to export");
            return;
        }

        const doc = new jsPDF();
        const memberName = filters.memberId ? members.find(m => m.id == filters.memberId)?.name : (filterMember ? members.find(m => m.id == filterMember)?.name : 'Everyone');
        const projectName = filters.projectId ? projects.find(p => p.id == filters.projectId)?.name : (filterProject ? projects.find(p => p.id == filterProject)?.name : 'All Projects');

        doc.setFontSize(20);
        doc.text('Financial Report', 14, 22);

        doc.setFontSize(10);
        doc.setTextColor(100);
        const now = new Date();
        const nowFormatted = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${now.getHours() % 12 || 12}:${String(now.getMinutes()).padStart(2, '0')} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;

        doc.text(`Generated on: ${nowFormatted}`, 14, 30);

        const periodStr = filters.startDate && filters.endDate
            ? `${filters.startDate} to ${filters.endDate}`
            : (periodType === 'range' ? `${customRange.start} to ${customRange.end}` : currentPeriod);

        doc.text(`Period: ${periodStr}`, 14, 35);
        doc.text(`Member: ${memberName} | Project: ${projectName}`, 14, 40);

        // Summary Boxes
        doc.setDrawColor(230);
        doc.setFillColor(245, 247, 250);
        doc.rect(14, 45, 182, 25, 'F');
        doc.setFontSize(12);
        doc.setTextColor(40);
        doc.text(`Total Income: ₹${formatAmount(currentStats.summary?.total_income)}`, 20, 55);
        doc.text(`Total Expense: ₹${formatAmount(currentStats.summary?.total_expense)}`, 20, 62);
        doc.text(`Net Balance: ₹${formatAmount(currentStats.summary?.total_income - currentStats.summary?.total_expense)}`, 120, 55);

        autoTable(doc, {
            startY: 75,
            head: [['Date', 'Description', 'Category', 'Type', 'Member', 'Amount']],
            body: reportTransactions.map(t => {
                const d = new Date(t.date);
                const dateFmt = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
                return [
                    dateFmt,
                    t.title,
                    t.category,
                    t.type.toUpperCase(),
                    t.member_name || 'N/A',
                    `₹${formatAmount(t.amount)}`
                ];
            }),
            theme: 'striped',
            headStyles: { fillColor: [45, 91, 255] },
            alternateRowStyles: { fillColor: [250, 250, 250] },
        });

        doc.save(`report_${periodStr}.pdf`);
    };

    const handleGenerateCustomReport = async (format = 'PDF') => {
        if (!customReportForm.startDate || !customReportForm.endDate) {
            toast.error("Please select both start and end dates");
            return;
        }

        setCustomReportLoading(format);
        try {
            const params = {
                projectId: customReportForm.projectId,
                memberId: customReportForm.memberId,
                startDate: customReportForm.startDate,
                endDate: customReportForm.endDate,
                category: customReportForm.category === 'all' ? null : customReportForm.category,
                type: customReportForm.type === 'all' ? null : customReportForm.type
            };
            const [transRes, statsRes] = await Promise.all([
                getTransactions(params),
                getTransactionStats(params)
            ]);

            if (format === 'PDF') handleExportPDF(transRes.data, statsRes.data, customReportForm);
            else if (format === 'CSV') handleExportCSV(transRes.data, customReportForm);
            else if (format === 'TXT') handleExportTXT(transRes.data, statsRes.data, customReportForm);

            setShowCustomReportModal(false);
            toast.success("Custom report generated successfully!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate custom report");
        } finally {
            setCustomReportLoading(false);
        }
    };

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
                    <SidebarItem icon={FaFileAlt} label="Reports" />
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
                    {/* Filters: Period Type, Date, Project, Worker */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:flex xl:flex-wrap items-center gap-[8px] sm:gap-[12px] w-full xl:w-auto">

                        {/* Period Type Toggle */}
                        <div className="col-span-2 md:col-span-1 h-[40px] flex items-center p-[4px] bg-white border border-slate-200 rounded-[12px] shadow-sm overflow-x-auto custom-scrollbar">
                            {['day', 'week', 'month', 'year', 'range'].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setPeriodType(type)}
                                    className={`flex-1 h-full px-[12px] rounded-[8px] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center justify-center ${periodType === type ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>

                        {/* Date Picker or Range Pickers */}
                        <div className="col-span-2 md:col-span-1 h-[40px] flex items-center bg-white border border-slate-200 px-[12px] rounded-[12px] shadow-sm hover:border-blue-500 transition-colors">
                            {periodType === 'day' ? (
                                <input
                                    type="date"
                                    value={currentPeriod.length === 10 ? currentPeriod : ''}
                                    onChange={(e) => setCurrentPeriod(e.target.value)}
                                    className="w-full text-[12px] font-bold text-slate-700 outline-none bg-transparent cursor-pointer font-['Outfit']"
                                />
                            ) : periodType === 'week' ? (
                                <input
                                    type="week"
                                    value={currentPeriod.includes('W') ? currentPeriod : ''}
                                    onChange={(e) => setCurrentPeriod(e.target.value)}
                                    className="w-full text-[12px] font-bold text-slate-700 outline-none bg-transparent cursor-pointer font-['Outfit']"
                                />
                            ) : periodType === 'month' ? (
                                <input
                                    type="month"
                                    value={currentPeriod.length === 7 ? currentPeriod : ''}
                                    onChange={(e) => setCurrentPeriod(e.target.value)}
                                    className="w-full text-[12px] font-bold text-slate-700 outline-none bg-transparent cursor-pointer font-['Outfit']"
                                />
                            ) : periodType === 'year' ? (
                                <input
                                    type="number"
                                    min="2000"
                                    max="2100"
                                    value={currentPeriod.slice(0, 4)}
                                    onChange={(e) => setCurrentPeriod(e.target.value)}
                                    className="w-full text-[12px] font-bold text-slate-700 outline-none bg-transparent cursor-pointer font-['Outfit']"
                                />
                            ) : (
                                <div className="flex items-center gap-[8px] w-full">
                                    <input
                                        type="date"
                                        value={customRange.start}
                                        onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })}
                                        className="text-[10px] sm:text-[11px] font-bold text-slate-700 outline-none bg-transparent cursor-pointer font-['Outfit'] w-full min-w-0"
                                    />
                                    <span className="text-slate-400">-</span>
                                    <input
                                        type="date"
                                        value={customRange.end}
                                        onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })}
                                        className="text-[10px] sm:text-[11px] font-bold text-slate-700 outline-none bg-transparent cursor-pointer font-['Outfit'] w-full min-w-0"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Project Filter */}
                        <div className="col-span-1 h-[40px] flex items-center gap-[8px] bg-white border border-slate-200 px-[12px] rounded-[12px] shadow-sm hover:border-blue-500 transition-colors">
                            <select
                                value={filterProject}
                                onChange={(e) => setFilterProject(e.target.value)}
                                className="w-full text-[12px] font-bold text-slate-700 outline-none bg-transparent cursor-pointer font-['Outfit']"
                            >
                                <option value="">Projects</option>
                                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>

                        {/* Member Filter */}
                        <div className="col-span-1 h-[40px] flex items-center gap-[8px] bg-white border border-slate-200 px-[12px] rounded-[12px] shadow-sm hover:border-blue-500 transition-colors">
                            <select
                                value={filterMember}
                                onChange={(e) => setFilterMember(e.target.value)}
                                className="w-full text-[12px] font-bold text-slate-700 outline-none bg-transparent cursor-pointer font-['Outfit']"
                            >
                                <option value="">Everyone</option>
                                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        </div>

                        {/* Actions: New Project/Manage Members */}
                        <div className="col-span-2 flex items-center gap-[8px] xl:w-auto">
                            <button
                                onClick={() => setShowProjectManager(true)}
                                className="flex-1 xl:flex-none h-[40px] flex items-center justify-center gap-[8px] bg-[#2d5bff] text-white px-[16px] rounded-[12px] shadow-lg shadow-blue-500/20 hover:scale-105 transition-transform"
                                title="New Project"
                            >
                                <FaFolderPlus className="text-sm" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Project</span>
                            </button>
                            <button
                                onClick={() => setShowMemberManager(true)}
                                className="w-[40px] h-[40px] bg-white text-slate-500 rounded-[12px] flex items-center justify-center hover:bg-orange-50 hover:text-orange-600 transition-all border border-slate-200 shadow-sm shrink-0"
                                title="Manage Members"
                            >
                                <FaUserEdit className="text-[16px]" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Tab Navigation */}
                < div className="lg:hidden flex overflow-x-auto gap-3 mb-8 pb-2 custom-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0" >
                    {
                        ['Dashboard', 'Transactions', 'Reports'].map((tab) => (
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
                        <div className="grid grid-cols-1 gap-[24px] sm:gap-[32px] mb-[32px] lg:mb-[48px]">

                            {/* Recent Activity */}
                            <div className="bg-white rounded-[32px] p-[24px] sm:p-[32px] shadow-xl border border-slate-100">
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
                                                {t.member_name && (
                                                    <>
                                                        <span className="w-[4px] h-[4px] rounded-full bg-slate-300"></span>
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 flex items-center gap-1">
                                                            <FaUserCheck className="text-[8px]" /> {t.member_name}
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
                ) : (
                    <div className="animate-in slide-in-from-right-10 duration-500">
                        <div className="flex justify-between items-center mb-[32px]">
                            <h2 className="text-[20px] sm:text-[24px] font-black">Financial Reports</h2>
                            <div className="flex items-center gap-[8px]">
                                <button
                                    onClick={() => { setExportType('PDF'); setShowExportModal(true); }}
                                    className="bg-[#1a1c21] text-white px-[16px] py-[10px] rounded-[14px] text-[10px] font-black uppercase tracking-widest shadow-lg shadow-black/10 hover:scale-105 transition-all whitespace-nowrap"
                                >
                                    PDF
                                </button>
                                <button
                                    onClick={() => { setExportType('CSV'); setShowExportModal(true); }}
                                    className="bg-white border border-slate-200 px-[16px] py-[10px] rounded-[14px] text-[10px] font-black uppercase tracking-widest hover:border-blue-500 hover:text-blue-500 transition-all whitespace-nowrap"
                                >
                                    CSV
                                </button>
                                <button
                                    onClick={() => { setExportType('Text'); setShowExportModal(true); }}
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
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[8px]">Efficiency Score</p>
                                                <p className="text-[32px] font-black tracking-tighter text-slate-800">
                                                    {stats.summary?.total_income > 0 ? (((stats.summary.total_income - stats.summary.total_expense) / stats.summary.total_income) * 100).toFixed(0) : 0}%
                                                </p>
                                                <div className="mt-[16px] flex items-center gap-[8px]">
                                                    <div className="w-[8px] h-[8px] rounded-full bg-emerald-500"></div>
                                                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Calculated</span>
                                                </div>
                                            </div>
                                            <div className="p-[24px] bg-slate-50 rounded-[24px] border border-slate-100">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[8px]">Total Wealth</p>
                                                <p className="text-[32px] font-black tracking-tighter text-slate-800">₹{formatAmount(totalBalance)}</p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-[16px]">Net Balance</p>
                                            </div>
                                            <div className="p-[24px] bg-slate-50 rounded-[24px] border border-slate-100">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[8px]">Income Growth</p>
                                                <p className="text-[32px] font-black tracking-tighter text-blue-500">+12%</p>
                                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mt-[16px]">from last month</p>
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

                                <div className="flex justify-center">
                                    <button
                                        onClick={() => {
                                            setCustomReportForm({
                                                ...customReportForm,
                                                projectId: filterProject,
                                                memberId: filterMember,
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
                )}
            </main>

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
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[8px] ml-[8px]">Member</label>
                                            <select
                                                value={formData.member_id}
                                                onChange={(e) => setFormData({ ...formData, member_id: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-[20px] px-[20px] py-[14px] text-[12px] font-bold text-slate-700 outline-none focus:border-blue-500 transition-all cursor-pointer"
                                            >
                                                <option value="">No Member</option>
                                                {members.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
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

            {
                showMemberManager && (
                    <MemberManager
                        onUpdate={fetchData}
                        onClose={() => setShowMemberManager(false)}
                    />
                )
            }

            {/* Custom Report Modal */}
            {
                showCustomReportModal && (
                    <div className="fixed inset-0 z-150 flex items-center justify-center p-[16px] bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                        <div className="bg-white rounded-[40px] p-[32px] sm:p-[40px] w-full max-w-[500px] shadow-2xl relative animate-in zoom-in-95 duration-300">
                            <button onClick={() => setShowCustomReportModal(false)} className="absolute top-[32px] right-[32px] text-slate-400 hover:text-slate-800 transition-colors">
                                <FaTimes />
                            </button>
                            <h2 className="text-[24px] font-black mb-[32px] flex items-center gap-[12px]">
                                <div className="w-[8px] h-[32px] bg-indigo-500 rounded-full"></div>
                                Custom Report
                            </h2>

                            <div className="space-y-[24px]">
                                <div className="grid grid-cols-2 gap-[16px]">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[8px] ml-[4px]">Start Date</label>
                                        <input
                                            type="date"
                                            value={customReportForm.startDate}
                                            onChange={(e) => setCustomReportForm({ ...customReportForm, startDate: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-[16px] px-[20px] py-[12px] text-[12px] font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[8px] ml-[4px]">End Date</label>
                                        <input
                                            type="date"
                                            value={customReportForm.endDate}
                                            onChange={(e) => setCustomReportForm({ ...customReportForm, endDate: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-[16px] px-[20px] py-[12px] text-[12px] font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-[16px]">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[8px] ml-[4px]">Project</label>
                                        <select
                                            value={customReportForm.projectId}
                                            onChange={(e) => setCustomReportForm({ ...customReportForm, projectId: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-[16px] px-[20px] py-[12px] text-[12px] font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all cursor-pointer"
                                        >
                                            <option value="">All Projects</option>
                                            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[8px] ml-[4px]">Member</label>
                                        <select
                                            value={customReportForm.memberId}
                                            onChange={(e) => setCustomReportForm({ ...customReportForm, memberId: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-[16px] px-[20px] py-[12px] text-[12px] font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all cursor-pointer"
                                        >
                                            <option value="">Everyone</option>
                                            {members.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-[16px]">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[8px] ml-[4px]">Type</label>
                                        <select
                                            value={customReportForm.type}
                                            onChange={(e) => setCustomReportForm({ ...customReportForm, type: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-[16px] px-[20px] py-[12px] text-[12px] font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all cursor-pointer"
                                        >
                                            <option value="all">All Transactions</option>
                                            <option value="income">Income Only</option>
                                            <option value="expense">Expenses Only</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[8px] ml-[4px]">Category</label>
                                        <select
                                            value={customReportForm.category}
                                            onChange={(e) => setCustomReportForm({ ...customReportForm, category: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-[16px] px-[20px] py-[12px] text-[12px] font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all cursor-pointer"
                                        >
                                            <option value="all">All Categories</option>
                                            {[...new Set([...expenseCategories, ...incomeCategories, ...categories.map(c => c.name)])].map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-[12px]">
                                    <button
                                        onClick={() => handleGenerateCustomReport('PDF')}
                                        disabled={!!customReportLoading}
                                        className="w-full bg-[#2d5bff] hover:bg-blue-600 text-white font-black py-[18px] rounded-[20px] transition-all active:scale-95 shadow-xl flex items-center justify-center gap-[12px] text-[14px] disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {customReportLoading === 'PDF' ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        ) : (
                                            <FaFileAlt />
                                        )}
                                        {customReportLoading === 'PDF' ? 'Generating...' : 'Download PDF Report'}
                                    </button>

                                    <div className="grid grid-cols-2 gap-[12px]">
                                        <button
                                            onClick={() => handleGenerateCustomReport('CSV')}
                                            disabled={!!customReportLoading}
                                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-black py-[16px] rounded-[20px] transition-all active:scale-95 shadow-lg flex items-center justify-center gap-[8px] text-[12px] disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {customReportLoading === 'CSV' ? (
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            ) : (
                                                <FaFileAlt />
                                            )}
                                            CSV
                                        </button>
                                        <button
                                            onClick={() => handleGenerateCustomReport('TXT')}
                                            disabled={!!customReportLoading}
                                            className="bg-slate-700 hover:bg-slate-800 text-white font-black py-[16px] rounded-[20px] transition-all active:scale-95 shadow-lg flex items-center justify-center gap-[8px] text-[12px] disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {customReportLoading === 'TXT' ? (
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            ) : (
                                                <FaFileAlt />
                                            )}
                                            Text
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Modern Export Confirmation Modal */}
            {
                showExportModal && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl flex items-center justify-center z-200 p-[24px] animate-in fade-in duration-500">
                        <div className="bg-white rounded-[48px] p-[48px] w-full max-w-[480px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] border border-slate-100 animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-[6px] bg-linear-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
                            <div className="absolute -top-[100px] -right-[100px] w-[200px] h-[200px] bg-blue-500/5 rounded-full blur-[80px]"></div>

                            <div className="relative">
                                <div className="w-[100px] h-[100px] rounded-[36px] bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-[40px] mx-auto shadow-2xl shadow-blue-500/30 group-hover:scale-110 transition-transform duration-700">
                                    <FaFileAlt className="text-[40px] text-white" />
                                </div>

                                <div className="text-center space-y-[16px] mb-[48px]">
                                    <h3 className="text-[28px] font-black text-slate-800 tracking-tight leading-tight">Export Statement</h3>
                                    <p className="text-slate-500 font-bold leading-relaxed px-[10px]">
                                        Generate a high-resolution <span className="text-blue-600 font-black">{exportType}</span> report for the period of <span className="text-indigo-600 font-black">{currentPeriod}</span>?
                                    </p>
                                </div>

                                <div className="flex flex-col gap-[12px]">
                                    <button
                                        onClick={() => {
                                            setShowExportModal(false);
                                            if (exportType === 'PDF') handleExportPDF();
                                            else if (exportType === 'CSV') handleExportCSV();
                                            else if (exportType === 'Text') handleExportTXT();
                                        }}
                                        className="w-full px-[32px] py-[22px] rounded-[24px] text-[14px] font-black uppercase tracking-widest bg-slate-900 text-white shadow-2xl shadow-slate-900/20 hover:bg-blue-600 hover:shadow-blue-500/40 hover:-translate-y-1 active:translate-y-0 transition-all duration-300"
                                    >
                                        Confirm & Download
                                    </button>
                                    <button
                                        onClick={() => setShowExportModal(false)}
                                        className="w-full px-[32px] py-[20px] rounded-[24px] text-[12px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all duration-300"
                                    >
                                        Go Back
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
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


export default ExpenseTracker;
