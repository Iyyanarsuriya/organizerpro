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
import { getMembers, getMemberRoles } from '../../api/TeamManagement/hotelTeam';
import { getVendors } from '../../api/TeamManagement/hotelVendor';
import { getUnits, getBookings } from '../../api/Hotel/hotelOp';
import { getAttendanceStats } from '../../api/Attendance/hotelAttendance';
import toast from 'react-hot-toast';
import {
    FaWallet, FaPlus, FaTrash, FaChartBar, FaExchangeAlt, FaFileAlt, FaEdit, FaTimes,
    FaPlusCircle, FaFolderPlus, FaCheck, FaCalculator, FaUsers, FaBuilding, FaBed, FaUserTie, FaCog
} from 'react-icons/fa';
import { formatAmount } from '../../utils/formatUtils';

// Sub-components
import HotelDashboard from './ExpenseTracker/HotelDashboard';
import HotelTransactions from './ExpenseTracker/HotelTransactions';
import HotelReports from './ExpenseTracker/HotelReports';
import HotelVendorManager from './ExpenseTracker/HotelVendorManager';
import SalaryCalculator from '../ManufacturingSector/ExpenseTracker/SalaryCalculator';
import CategoryManager from '../../components/Common/CategoryManager';
import MemberManager from '../../components/Manufacturing/MemberManager';

const HotelExpenses = () => {
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState([]);
    const [stats, setStats] = useState({ summary: { total_income: 0, total_expense: 0 }, categories: [] });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Dashboard');
    const [showAddModal, setShowAddModal] = useState(false);

    // Filters & Period
    const [periodType, setPeriodType] = useState('month');
    const [currentPeriod, setCurrentPeriod] = useState(new Date().toISOString().slice(0, 7));
    const [customRange, setCustomRange] = useState({ start: '', end: '' });

    // State for Entities
    const [categories, setCategories] = useState([]);
    const [members, setMembers] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [units, setUnits] = useState([]);
    const [bookings, setBookings] = useState([]);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        amount: '',
        type: 'expense',
        category_id: '',
        category: '',
        date: new Date().toISOString().split('T')[0],
        payment_mode: 'Cash',
        property_type: 'Hotel',
        unit_id: '',
        booking_id: '',
        vendor_id: '',
        income_source: 'Room Booking',
        description: '',
        attachment_url: '',
        payment_status: 'completed'
    });
    const [editingId, setEditingId] = useState(null);

    // UI States
    const [showCategoryManager, setShowCategoryManager] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterProperty, setFilterProperty] = useState('');
    const [filterRoom, setFilterRoom] = useState('');
    const [filterVendor, setFilterVendor] = useState('');
    const [filterPaymentMode, setFilterPaymentMode] = useState('');
    const [filterCategory, setFilterCategory] = useState('');

    // Salary integration states
    const [filterMember, setFilterMember] = useState('');
    const [attendanceStats, setAttendanceStats] = useState(null);
    const [salaryMode, setSalaryMode] = useState('daily');
    const [dailyWage, setDailyWage] = useState(0);
    const [monthlySalary, setMonthlySalary] = useState(0);
    const [bonus, setBonus] = useState(0);
    const [salaryLoading, setSalaryLoading] = useState(false);

    const COLORS = ['#2d5bff', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

    const fetchData = async () => {
        try {
            const isRange = periodType === 'range';
            const rangeStart = isRange ? customRange.start : null;
            const rangeEnd = isRange ? customRange.end : null;

            const params = {
                period: isRange ? null : currentPeriod,
                startDate: rangeStart,
                endDate: rangeEnd,
                propertyType: filterProperty,
                unitId: filterRoom,
                vendorId: filterVendor,
                paymentMode: filterPaymentMode,
                categoryId: filterCategory,
                sector: 'hotel'
            };

            const [transRes, statsRes, catRes, membersRes, vendorRes, unitRes, bookingRes] = await Promise.all([
                getTransactions(params),
                getTransactionStats(params),
                getExpenseCategories({ sector: 'hotel' }),
                getMembers({ sector: 'hotel' }),
                getVendors(),
                getUnits(),
                getBookings()
            ]);

            setTransactions(transRes.data.data || []);
            setStats(statsRes.data.data || { summary: { total_income: 0, total_expense: 0 }, categories: [] });
            setCategories(catRes.data.data || []);
            setMembers(membersRes.data?.data || []);
            setVendors(vendorRes.data?.data || []);
            setUnits(unitRes.data?.data || []);
            setBookings(bookingRes.data?.data || []);

            setLoading(false);
        } catch (error) {
            console.error("Fetch Data Error:", error);
            toast.error("Failed to load hospitality data");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [currentPeriod, periodType, customRange.start, customRange.end, filterProperty, filterRoom, filterVendor, filterPaymentMode, filterCategory]);

    const handleSalaryFetch = async (memberId) => {
        if (!memberId) return;
        setSalaryLoading(true);
        try {
            const res = await getAttendanceStats({
                memberId,
                period: periodType === 'range' ? null : currentPeriod,
                startDate: customRange.start,
                endDate: customRange.end
            });
            const statsArray = res.data?.data || [];
            const summary = {
                present: statsArray.filter(s => ['present', 'late', 'permission'].includes(s.status))
                    .reduce((acc, curr) => acc + curr.count, 0),
                absent: statsArray.find(s => s.status === 'absent')?.count || 0,
                late: statsArray.find(s => s.status === 'late')?.count || 0,
                half_day: statsArray.find(s => s.status === 'half-day')?.count || 0,
            };
            setAttendanceStats({ summary, raw: statsArray });

            const member = members.find(m => m.id == memberId);
            if (member) {
                setSalaryMode(member.wage_type || 'daily');
                if (member.wage_type === 'daily') setDailyWage(member.daily_wage || 0);
                else if (member.wage_type === 'monthly') setMonthlySalary(member.monthly_salary || 0);
            }
        } catch (error) {
            toast.error("Failed to fetch member attendance");
        } finally {
            setSalaryLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'Salary' && filterMember) {
            handleSalaryFetch(filterMember);
        }
    }, [filterMember, activeTab]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData, sector: 'hotel' };
            if (editingId) await updateTransaction(editingId, payload);
            else await createTransaction(payload);
            toast.success(editingId ? "Transaction updated" : "Hospitality transaction recorded");
            setShowAddModal(false);
            setEditingId(null);
            fetchData();
        } catch (error) {
            toast.error("Error saving hospitality record");
        }
    };

    const handleEdit = (t) => {
        setFormData({
            ...t,
            date: new Date(t.date).toISOString().split('T')[0],
            category_id: t.category_id || '',
            unit_id: t.unit_id || '',
            booking_id: t.booking_id || '',
            vendor_id: t.vendor_id || ''
        });
        setEditingId(t.id);
        setShowAddModal(true);
    };

    const handleAddNewTransaction = () => {
        setFormData({
            title: '', amount: '', type: 'expense', category_id: '', category: '',
            date: new Date().toISOString().split('T')[0], payment_mode: 'Cash',
            property_type: 'Hotel', unit_id: '', booking_id: '', vendor_id: '',
            income_source: 'Room Booking', description: '', attachment_url: '',
            payment_status: 'completed'
        });
        setEditingId(null);
        setShowAddModal(true);
    };

    const confirmDelete = async (id) => {
        if (window.confirm('Delete this transaction record?')) {
            try {
                await deleteTransaction(id);
                toast.success("Deleted");
                fetchData();
            } catch (error) {
                toast.error("Delete failed");
            }
        }
    };

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

    const SidebarItem = ({ icon: Icon, label }) => (
        <button onClick={() => setActiveTab(label)} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group ${activeTab === label ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
            <Icon className={`text-lg transition-transform group-hover:scale-110 ${activeTab === label ? 'text-white' : 'text-slate-400'}`} />
            <span className="font-black text-[10px] uppercase tracking-widest">{label}</span>
        </button>
    );

    if (loading) return <div className="h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-slate-900"></div></div>;

    return (
        <div className="flex bg-[#fcfcfd] min-h-screen text-slate-800 font-['Outfit']">
            {/* Sidebar */}
            <aside className="w-76 bg-white border-r border-slate-100 p-8 hidden lg:flex flex-col fixed h-full z-50">
                <div className="flex items-center gap-4 mb-14">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center shadow-2xl shadow-slate-200">
                        <FaBuilding className="text-white text-xl" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black tracking-tighter leading-tight">Hospitality ERP</h2>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-0.5">Expense Tracker</p>
                    </div>
                </div>
                <nav className="flex-1 space-y-3">
                    <SidebarItem icon={FaChartBar} label="Dashboard" />
                    <SidebarItem icon={FaExchangeAlt} label="Transactions" />
                    <SidebarItem icon={FaUserTie} label="Vendors" />
                    <SidebarItem icon={FaUsers} label="Members" />
                    <SidebarItem icon={FaCalculator} label="Salary" />
                    <SidebarItem icon={FaFileAlt} label="Reports" />
                    <SidebarItem icon={FaCog} label="Categories" />
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 lg:ml-76 p-4 lg:p-12 overflow-y-auto">
                <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2 uppercase">{activeTab}</h1>
                        <nav className="flex gap-2 text-[10px] font-black uppercase tracking-widest text-slate-300">
                            <span>Hospitality</span>
                            <span>/</span>
                            <span className="text-slate-900">Expense Hub</span>
                        </nav>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={handleAddNewTransaction} className="h-14 bg-slate-900 text-white rounded-[24px] px-8 text-[11px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-slate-800 transition-all shadow-xl shadow-black/10 transition-transform active:scale-95">
                            <FaPlus size={14} /> New Entry
                        </button>
                    </div>
                </header>

                <div className="lg:hidden flex overflow-x-auto gap-3 mb-10 pb-2 no-scrollbar">
                    {['Dashboard', 'Transactions', 'Vendors', 'Members', 'Salary', 'Reports'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`whitespace-nowrap px-6 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-100'}`}>{tab}</button>
                    ))}
                </div>

                {/* Content Mapping */}
                {activeTab === 'Dashboard' && (
                    <HotelDashboard
                        stats={stats}
                        pieData={pieData}
                        barData={barData}
                        COLORS={COLORS}
                        transactions={transactions}
                        handleAddNewTransaction={handleAddNewTransaction}
                        setActiveTab={setActiveTab}
                        units={units}
                        bookings={bookings}
                    />
                )}

                {activeTab === 'Transactions' && (
                    <HotelTransactions
                        filteredTransactions={transactions}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        filterType={formData.type}
                        setFilterType={(t) => setFormData({ ...formData, type: t })}
                        sortBy={filterCategory}
                        setSortBy={setFilterCategory}
                        handleAddNewTransaction={handleAddNewTransaction}
                        handleEdit={handleEdit}
                        confirmDelete={confirmDelete}
                        units={units}
                        members={members}
                        vendors={vendors}
                        categories={categories}
                        filterProperty={filterProperty}
                        setFilterProperty={setFilterProperty}
                        filterRoom={filterRoom}
                        setFilterRoom={setFilterRoom}
                        filterVendor={filterVendor}
                        setFilterVendor={setFilterVendor}
                        filterPaymentMode={filterPaymentMode}
                        setFilterPaymentMode={setFilterPaymentMode}
                        periodType={periodType}
                        setPeriodType={setPeriodType}
                        currentPeriod={currentPeriod}
                        setCurrentPeriod={setCurrentPeriod}
                        customRange={customRange}
                        setCustomRange={setCustomRange}
                    />
                )}

                {activeTab === 'Vendors' && <HotelVendorManager />}
                {activeTab === 'Members' && (
                    <MemberManager sector="hotel" onUpdate={fetchData} />
                )}
                {activeTab === 'Salary' && (
                    <SalaryCalculator
                        periodType={periodType}
                        filterMember={filterMember}
                        setFilterMember={setFilterMember}
                        members={members}
                        filteredTransactions={transactions}
                        handleExportPayslip={() => { }}
                        salaryLoading={salaryLoading}
                        attendanceStats={attendanceStats}
                        salaryMode={salaryMode}
                        setSalaryMode={setSalaryMode}
                        dailyWage={dailyWage}
                        setDailyWage={setDailyWage}
                        monthlySalary={monthlySalary}
                        setMonthlySalary={setMonthlySalary}
                        bonus={bonus}
                        setBonus={setBonus}
                        stats={stats}
                        transactions={transactions}
                    />
                )}
                {activeTab === 'Reports' && (
                    <HotelReports
                        transactions={transactions}
                        categories={categories}
                        stats={stats}
                        units={units}
                    />
                )}
                {activeTab === 'Categories' && (
                    <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm max-w-4xl mx-auto">
                        <div className="flex justify-between items-center mb-10">
                            <h2 className="text-xl font-black">Expense Categories</h2>
                            <button onClick={() => setShowCategoryManager(true)} className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">Manage All</button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {categories.map(cat => (
                                <div key={cat.id} className="p-6 rounded-[32px] border border-slate-50 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center group">
                                    <div className="w-4 h-4 rounded-full mb-3" style={{ backgroundColor: cat.color }}></div>
                                    <span className="text-[11px] font-black uppercase text-slate-600 tracking-tight">{cat.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {/* Entry Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowAddModal(false)}></div>
                    <div className="relative bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                        <div className="max-h-[90vh] overflow-y-auto no-scrollbar">
                            <div className="p-10">
                                <header className="flex justify-between items-center mb-10">
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-900 mb-1">{editingId ? 'Edit Record' : 'Add New Record'}</h2>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hospitality Flow Management</p>
                                    </div>
                                    <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                                        <button onClick={() => setFormData({ ...formData, type: 'income' })} className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${formData.type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>Income</button>
                                        <button onClick={() => setFormData({ ...formData, type: 'expense' })} className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${formData.type === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400'}`}>Expense</button>
                                    </div>
                                </header>

                                <form onSubmit={handleSubmit} className="space-y-8">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="col-span-2">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Title / Label</label>
                                            <input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full h-14 bg-slate-50 border border-slate-100 rounded-[24px] px-6 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-50 transition-all shadow-sm" placeholder="e.g., Room Booking #102, Laundry Soap, Kitchen Gas" />
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Amount (₹)</label>
                                            <input required type="number" step="0.01" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} className="w-full h-14 bg-blue-50/50 border border-blue-100 rounded-[24px] px-6 text-lg font-black text-blue-600 outline-none focus:ring-4 focus:ring-blue-100/30 transition-all" placeholder="0.00" />
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Date</label>
                                            <input type="date" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full h-14 bg-slate-50 border border-slate-100 rounded-[24px] px-6 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-50 transition-all shadow-sm" />
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Payment Mode</label>
                                            <select value={formData.payment_mode} onChange={e => setFormData({ ...formData, payment_mode: e.target.value })} className="w-full h-14 bg-slate-50 border border-slate-100 rounded-[24px] px-6 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-50 transition-all shadow-sm cursor-pointer appearance-none">
                                                <option value="Cash">Cash</option>
                                                <option value="UPI">UPI / Digital</option>
                                                <option value="Card">Credit/Debit Card</option>
                                                <option value="Bank">Bank Transfer</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Property Type</label>
                                            <select value={formData.property_type} onChange={e => setFormData({ ...formData, property_type: e.target.value })} className="w-full h-14 bg-slate-50 border border-slate-100 rounded-[24px] px-6 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-50 transition-all shadow-sm cursor-pointer appearance-none">
                                                <option value="Hotel">Hotel</option>
                                                <option value="Homestay">Homestay</option>
                                            </select>
                                        </div>

                                        {formData.type === 'income' ? (
                                            <>
                                                <div>
                                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Income Source</label>
                                                    <select value={formData.income_source} onChange={e => setFormData({ ...formData, income_source: e.target.value })} className="w-full h-14 bg-slate-50 border border-slate-100 rounded-[24px] px-6 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-50 transition-all shadow-sm cursor-pointer appearance-none">
                                                        <option value="Room Booking">Room Booking</option>
                                                        <option value="Food">Food / Restaurant</option>
                                                        <option value="Laundry">Laundry Service</option>
                                                        <option value="Other">Other Services</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Linked Room</label>
                                                    <select value={formData.unit_id} onChange={e => setFormData({ ...formData, unit_id: e.target.value })} className="w-full h-14 bg-slate-50 border border-slate-100 rounded-[24px] px-6 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-50 transition-all shadow-sm cursor-pointer appearance-none">
                                                        <option value="">Select Room (Optional)</option>
                                                        {units.map(u => <option key={u.id} value={u.id}>Room {u.unit_number} ({u.category})</option>)}
                                                    </select>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div>
                                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Category</label>
                                                    <select required value={formData.category_id} onChange={e => {
                                                        const cat = categories.find(c => c.id == e.target.value);
                                                        setFormData({ ...formData, category_id: e.target.value, category: cat?.name || '' });
                                                    }} className="w-full h-14 bg-slate-50 border border-slate-100 rounded-[24px] px-6 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-50 transition-all shadow-sm cursor-pointer appearance-none">
                                                        <option value="">Select Category</option>
                                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Linked Vendor</label>
                                                    <select value={formData.vendor_id} onChange={e => setFormData({ ...formData, vendor_id: e.target.value })} className="w-full h-14 bg-slate-50 border border-slate-100 rounded-[24px] px-6 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-50 transition-all shadow-sm cursor-pointer appearance-none">
                                                        <option value="">Select Vendor (Optional)</option>
                                                        {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                                    </select>
                                                </div>
                                            </>
                                        )}

                                        <div className="col-span-2">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Linked Booking</label>
                                            <select value={formData.booking_id} onChange={e => setFormData({ ...formData, booking_id: e.target.value })} className="w-full h-14 bg-slate-50 border border-slate-100 rounded-[24px] px-6 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-50 transition-all shadow-sm cursor-pointer appearance-none">
                                                <option value="">Select Active Booking (Optional)</option>
                                                {bookings.filter(b => b.status !== 'cancelled').map(b => (
                                                    <option key={b.id} value={b.id}>
                                                        #{b.id} - {b.guest_name} (Room {b.unit_number})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="col-span-2">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Notes / Description</label>
                                            <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full h-24 bg-slate-50 border border-slate-100 rounded-[24px] p-6 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-50 transition-all shadow-sm resize-none" placeholder="Add relevant details..."></textarea>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 pt-6">
                                        <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 h-14 bg-slate-100 text-slate-400 rounded-[24px] text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all shadow-sm">Cancel</button>
                                        <button type="submit" className={`flex-1 h-14 rounded-[24px] text-[10px] font-black uppercase tracking-widest transition-all shadow-2xl shadow-black/10 ${formData.type === 'income' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
                                            {editingId ? 'Update Record' : 'Confirm & Save'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showCategoryManager && (
                <CategoryManager
                    categories={categories}
                    onUpdate={() => getExpenseCategories({ sector: 'hotel' }).then(res => setCategories(res.data.data))}
                    onCreate={(data) => createExpenseCategory({ ...data, sector: 'hotel' })}
                    onDelete={deleteExpenseCategory}
                    onClose={() => setShowCategoryManager(false)}
                />
            )}
        </div>
    );
};

export default HotelExpenses;
