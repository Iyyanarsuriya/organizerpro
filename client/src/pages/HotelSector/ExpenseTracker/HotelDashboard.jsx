import React from 'react';
import { FaPlus, FaHotel, FaBed, FaWallet, FaChartPie, FaPercentage } from 'react-icons/fa';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { formatAmount } from '../../../utils/formatUtils';

const StatCard = ({ title, value, color, subtitle, icon: Icon, onClick }) => (
    <div
        onClick={onClick}
        className={`bg-white rounded-[32px] p-[24px] sm:p-[32px] shadow-sm border border-slate-100 transform hover:-translate-y-1 transition-all duration-300 ${onClick ? 'cursor-pointer hover:shadow-xl' : ''} group relative overflow-hidden`}
    >
        <div className={`absolute top-0 right-0 w-24 h-24 ${color.replace('text-', 'bg-')}/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:blur-3xl transition-all`}></div>
        <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color.replace('text-', 'bg-')}/10 ${color}`}>
                    {Icon ? <Icon size={18} /> : <FaWallet size={18} />}
                </div>
                {subtitle && (
                    <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-1 rounded-full uppercase tracking-tighter">
                        {subtitle}
                    </span>
                )}
            </div>
            <div>
                <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.15em] mb-1">{title}</p>
                <p className={`text-[24px] sm:text-[28px] font-black tracking-tight ${color}`}>{value}</p>
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
    bookings = []
}) => {
    // Hotel specific calculations
    const totalRooms = units.length || 0;
    const occupiedRooms = units.filter(u => u.status === 'occupied').length || 0;
    const occupancyRate = totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).toFixed(1) : 0;

    const totalIncome = stats.summary?.total_income || 0;
    const totalExpense = stats.summary?.total_expense || 0;
    const netProfit = totalIncome - totalExpense;

    const revPAR = totalRooms > 0 ? (totalIncome / totalRooms).toFixed(2) : 0;

    return (
        <div className="animate-in fade-in duration-500 space-y-8">
            {/* Primary Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard
                    title="Total Period Income"
                    value={`₹${formatAmount(totalIncome)}`}
                    color="text-blue-600"
                    subtitle="Revenue"
                    icon={FaWallet}
                />
                <StatCard
                    title="Total Period Expense"
                    value={`₹${formatAmount(totalExpense)}`}
                    color="text-rose-600"
                    subtitle="Operations"
                    icon={FaChartPie}
                />
                <StatCard
                    title="Net Profit"
                    value={`₹${formatAmount(netProfit)}`}
                    color={netProfit >= 0 ? "text-emerald-600" : "text-rose-600"}
                    subtitle="Bottom Line"
                    icon={FaChartPie}
                />
            </div>

            {/* Hotel Performance Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard
                    title="Revenue Per Room (RevPAR)"
                    value={`₹${formatAmount(revPAR)}`}
                    color="text-indigo-600"
                    subtitle="Average per Unit"
                    icon={FaHotel}
                />
                <StatCard
                    title="Occupancy Rate"
                    value={`${occupancyRate}%`}
                    color="text-amber-600"
                    subtitle={`${occupiedRooms}/${totalRooms} Units`}
                    icon={FaBed}
                />
                <div className="bg-slate-900 rounded-[32px] p-8 shadow-xl border border-slate-800 flex flex-col justify-center items-center text-center group cursor-pointer hover:bg-slate-800 transition-all" onClick={handleAddNewTransaction}>
                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform">
                        <FaPlus size={24} />
                    </div>
                    <h4 className="text-white font-black text-lg mb-2">New Transaction</h4>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Add Income or Expense</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 lg:mb-12">
                {/* Expense by Category Chart */}
                <div className="bg-white rounded-[40px] p-8 sm:p-10 shadow-sm border border-slate-100 flex flex-col min-h-[450px]">
                    <div className="flex justify-between items-center mb-10">
                        <h3 className="text-sm font-black flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                            Operation Costs by Category
                        </h3>
                    </div>
                    <div className="flex-1 w-full min-h-0">
                        {pieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="45%"
                                        innerRadius={70}
                                        outerRadius={110}
                                        paddingAngle={8}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '16px', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase', letterSpacing: '0.1em', paddingTop: '20px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-300 text-[10px] font-black uppercase tracking-widest">No operation data available</div>
                        )}
                    </div>
                </div>

                {/* Performance Chart */}
                <div className="bg-white rounded-[40px] p-8 sm:p-10 shadow-sm border border-slate-100 flex flex-col min-h-[450px]">
                    <div className="flex justify-between items-center mb-10">
                        <h3 className="text-sm font-black flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-slate-900 rounded-full"></div>
                            Monthly Flow Comparison
                        </h3>
                    </div>
                    <div className="flex-1 w-full min-h-0">
                        {barData && barData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={barData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '16px', color: '#fff' }} />
                                    <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                                    <Bar dataKey="Income" fill="#2d5bff" radius={[6, 6, 0, 0]} />
                                    <Bar dataKey="Expenses" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-300 text-[10px] font-black uppercase tracking-widest">No transaction history</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Hospitality Transactions */}
            <div className="bg-white rounded-[32px] p-6 sm:p-8 shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-black flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-slate-900 rounded-full"></div>
                        Recent Hospitality Flow
                    </h3>
                    <button onClick={() => setActiveTab('Transactions')} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">Full Statement</button>
                </div>
                <div className="space-y-3">
                    {Array.isArray(transactions) && transactions.slice(0, 5).map(t => (
                        <div key={t.id} className="flex justify-between items-center p-4 rounded-3xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm shadow-xs ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                    {t.type === 'income' ? '↓' : '↑'}
                                </div>
                                <div>
                                    <p className="font-black text-slate-900 text-[14px] leading-tight">{t.title}</p>
                                    <div className="flex gap-2 mt-1.5">
                                        <span className="px-2 py-0.5 bg-slate-100 text-[7px] font-black text-slate-500 rounded-full uppercase tracking-tighter">{t.category_name || t.category}</span>
                                        {t.room_number && <span className="px-2 py-0.5 bg-blue-50 text-[7px] font-black text-blue-600 rounded-full uppercase tracking-tighter">Room {t.room_number}</span>}
                                        {t.payment_mode && <span className="px-2 py-0.5 bg-indigo-50 text-[7px] font-black text-indigo-600 rounded-full uppercase tracking-tighter">{t.payment_mode}</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className={`font-black text-[15px] ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {t.type === 'income' ? '+' : '-'}₹{formatAmount(t.amount)}
                                </p>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{new Date(t.date).toLocaleDateString('en-GB')}</p>
                            </div>
                        </div>
                    ))}
                    {(!transactions || transactions.length === 0) && <p className="text-center py-12 text-slate-400 text-[10px] font-black uppercase tracking-widest">No transaction history yet</p>}
                </div>
            </div>
        </div>
    );
};

export default HotelDashboard;
