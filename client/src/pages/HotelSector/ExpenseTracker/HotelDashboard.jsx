import React, { useMemo } from 'react';
import { FaPlus, FaHotel, FaBed, FaWallet, FaChartPie, FaPercentage, FaArrowUp, FaArrowDown, FaCalendarAlt } from 'react-icons/fa';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { formatAmount } from '../../../utils/formatUtils';
import ExportButtons from '../../../components/Common/ExportButtons';
import { exportExpenseToCSV, exportExpenseToTXT, exportExpenseToPDF } from '../../../utils/expenseExportUtils/expense';

const StatCard = ({ title, value, color, subtitle, icon: Icon, onClick, trend }) => (
    <div
        onClick={onClick}
        className={`bg-white rounded-[40px] p-8 shadow-sm border border-slate-100 transform hover:-translate-y-1 transition-all duration-300 ${onClick ? 'cursor-pointer hover:shadow-2xl' : ''} group relative overflow-hidden`}
    >
        <div className={`absolute top-0 right-0 w-32 h-32 ${color.replace('text-', 'bg-')}/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:blur-3xl transition-all duration-500`} DC></div>
        <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${color.replace('text-', 'bg-')}/10 ${color} shadow-inner`}>
                    {Icon ? <Icon size={22} className="group-hover:scale-110 transition-transform duration-300" /> : <FaWallet size={22} />}
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${trend > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {trend > 0 ? <FaArrowUp size={8} /> : <FaArrowDown size={8} />}
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>
            <div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2 ml-1">{title}</p>
                <div className="flex items-baseline gap-2">
                    <p className={`text-3xl sm:text-4xl font-black tracking-tighter ${color}`}>{value}</p>
                </div>
                {subtitle && (
                    <p className="text-[10px] font-bold text-slate-500 flex items-center gap-2 mt-4 ml-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${color.replace('text-', 'bg-')}`}></span>
                        {subtitle}
                    </p>
                )}
            </div>
        </div>
    </div>
);

const HotelDashboard = ({
    stats,
    pieData,
    barData,
    COLORS,
    transactions,
    handleAddNewTransaction,
    setActiveTab,
    units = [],
    bookings = [],
    currentPeriod,
    periodType,
    customRange
}) => {
    // Hotel specific calculations
    const totalRooms = units.length || 0;
    const occupiedRooms = units.filter(u => u.status === 'occupied').length || 0;
    const occupancyRate = totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).toFixed(1) : 0;

    const totalIncome = stats.summary?.total_income || 0;
    const totalExpense = stats.summary?.total_expense || 0;
    const netProfit = totalIncome - totalExpense;

    const revPAR = totalRooms > 0 ? (totalIncome / totalRooms).toFixed(2) : 0;

    const exportPeriod = useMemo(() => {
        if (periodType === 'range') {
            if (customRange?.start && customRange?.end) return `${customRange.start} to ${customRange.end}`;
            return 'Custom Range';
        }
        return currentPeriod;
    }, [periodType, customRange, currentPeriod]);

    const handleExportPDF = () => {
        exportExpenseToPDF({
            data: transactions,
            period: exportPeriod,
            filename: `hotel_dashboard_report_${new Date().getTime()}`
        });
    };

    const handleExportCSV = () => {
        exportExpenseToCSV(transactions, `hotel_dashboard_report_${new Date().getTime()}`);
    };

    const handleExportTXT = () => {
        exportExpenseToTXT({
            data: transactions,
            period: exportPeriod,
            filename: `hotel_dashboard_report_${new Date().getTime()}`
        });
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-10">
            {/* Header for Exports */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                        <div className="w-1 h-5 bg-slate-900 rounded-full"></div>
                        Financial Insights
                    </h2>
                </div>
                <ExportButtons
                    onExportPDF={handleExportPDF}
                    onExportCSV={handleExportCSV}
                    onExportTXT={handleExportTXT}
                />
            </div>

            {/* Primary Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                <StatCard
                    title="Total Period Income"
                    value={`₹${formatAmount(totalIncome)}`}
                    color="text-blue-600"
                    subtitle="Revenue Streams"
                    icon={FaWallet}
                />
                <StatCard
                    title="Total Period Expense"
                    value={`₹${formatAmount(totalExpense)}`}
                    color="text-rose-600"
                    subtitle="Operational Outflow"
                    icon={FaChartPie}
                />
                <StatCard
                    title="Net Cash Flow"
                    value={`₹${formatAmount(netProfit)}`}
                    color={netProfit >= 0 ? "text-emerald-600" : "text-rose-600"}
                    subtitle="Bottom Line Profit"
                    icon={FaPercentage}
                />
            </div>

            {/* Hotel Performance Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                <StatCard
                    title="Revenue Per Room (RevPAR)"
                    value={`₹${formatAmount(revPAR)}`}
                    color="text-indigo-600"
                    subtitle="Average per Unit"
                    icon={FaHotel}
                />
                <StatCard
                    title="Occupancy Velocity"
                    value={`${occupancyRate}%`}
                    color="text-amber-600"
                    subtitle={`${occupiedRooms}/${totalRooms} Live Units`}
                    icon={FaBed}
                />
                <button
                    onClick={handleAddNewTransaction}
                    className="bg-slate-900 rounded-[40px] p-8 shadow-xl border border-slate-800 flex flex-col justify-center items-center text-center group cursor-pointer hover:bg-slate-800 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center text-white mb-5 group-hover:scale-110 transition-transform duration-500 shadow-lg">
                        <FaPlus size={24} />
                    </div>
                    <h4 className="text-white font-black text-lg mb-2 z-10">Add Record</h4>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest z-10">Fast Entry</p>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Expense by Category Chart */}
                <div className="bg-white rounded-[45px] p-10 shadow-sm border border-slate-100 flex flex-col min-h-[480px] hover:shadow-xl transition-shadow duration-500">
                    <div className="flex justify-between items-center mb-12">
                        <h3 className="text-sm font-black flex items-center gap-4">
                            <div className="w-1.5 h-7 bg-blue-600 rounded-full"></div>
                            Operational Breakdown
                        </h3>
                        <div className="px-4 py-2 bg-blue-50 text-blue-600 rounded-2xl text-[9px] font-black uppercase tracking-widest">Category Wise</div>
                    </div>
                    <div className="flex-1 w-full min-h-0">
                        {pieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="45%"
                                        innerRadius={80}
                                        outerRadius={120}
                                        paddingAngle={10}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '24px', color: '#fff', fontSize: '11px', fontWeight: 'bold', padding: '12px 16px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase', letterSpacing: '0.15em', paddingTop: '30px', color: '#64748b' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center">
                                <p className="text-slate-300 text-[10px] font-black uppercase tracking-widest">Zero Transaction Data</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Performance Chart */}
                <div className="bg-white rounded-[45px] p-10 shadow-sm border border-slate-100 flex flex-col min-h-[480px] hover:shadow-xl transition-shadow duration-500">
                    <div className="flex justify-between items-center mb-12">
                        <h3 className="text-sm font-black flex items-center gap-4">
                            <div className="w-1.5 h-7 bg-emerald-500 rounded-full"></div>
                            Hospitality Flow
                        </h3>
                        <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-2xl text-[9px] font-black uppercase tracking-widest">7 Day Trend</div>
                    </div>
                    <div className="flex-1 w-full min-h-0">
                        {barData && barData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={barData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '24px', color: '#fff', padding: '12px 16px' }} />
                                    <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '20px' }} />
                                    <Bar dataKey="Income" fill="#2d5bff" radius={[8, 8, 0, 0]} barSize={24} />
                                    <Bar dataKey="Expenses" fill="#f43f5e" radius={[8, 8, 0, 0]} barSize={24} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center">
                                <p className="text-slate-300 text-[10px) font-black uppercase tracking-widest">No Activity Logged</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Hospitality Transactions */}
            <div className="bg-white rounded-[40px] p-8 sm:p-10 shadow-sm border border-slate-100 mb-10">
                <div className="flex justify-between items-center mb-10">
                    <h3 className="text-sm font-black flex items-center gap-4">
                        <div className="w-1.5 h-7 bg-slate-900 rounded-full"></div>
                        Recent Hospitality Bookings
                    </h3>
                    <button onClick={() => setActiveTab('Transactions')} className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] hover:bg-blue-50 px-4 py-2 rounded-xl transition-all">Full View</button>
                </div>
                <div className="space-y-4">
                    {Array.isArray(transactions) && transactions.slice(0, 6).map(t => (
                        <div key={t.id} className="flex justify-between items-center p-5 rounded-[28px] hover:bg-slate-50 transition-all duration-300 border border-transparent hover:border-slate-100 hover:shadow-sm group">
                            <div className="flex items-center gap-5">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-sm shadow-inner transition-transform group-hover:scale-110 duration-500 ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                    {t.type === 'income' ? <FaArrowDown /> : <FaArrowUp />}
                                </div>
                                <div>
                                    <p className="font-black text-slate-900 text-[15px] leading-tight mb-1.5 group-hover:text-blue-600 transition-colors">{t.title}</p>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-3 py-1 bg-white border border-slate-100 text-[8px] font-black text-slate-500 rounded-full uppercase tracking-widest shadow-sm">{t.category_name || t.category}</span>
                                        {t.room_number && <span className="px-3 py-1 bg-blue-50 text-[8px] font-black text-blue-600 rounded-full uppercase tracking-widest">Room {t.room_number}</span>}
                                        {t.property_type && <span className="px-3 py-1 bg-indigo-50 text-[8px] font-black text-indigo-600 rounded-full uppercase tracking-widest">{t.property_type}</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className={`font-black text-[17px] tracking-tight ${t.type === 'income' ? 'text-emerald-600' : 'text-slate-900'}`}>
                                    {t.type === 'income' ? '+' : '-'}₹{formatAmount(t.amount)}
                                </p>
                                <div className="flex items-center justify-end gap-2 mt-1.5 opacity-60">
                                    <FaCalendarAlt size={8} className="text-slate-400" />
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{new Date(t.date).toLocaleDateString('en-GB')}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {(!transactions || transactions.length === 0) && (
                        <div className="text-center py-20 flex flex-col items-center">
                            <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mb-6">
                                <FaHotel size={32} />
                            </div>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Ready for your first entry</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HotelDashboard;
