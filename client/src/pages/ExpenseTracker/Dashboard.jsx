import React from 'react';
import { FaPlus } from 'react-icons/fa';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { formatAmount } from '../../utils/formatUtils';

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

const Dashboard = ({
    periodType,
    customRange,
    currentPeriod,
    stats,
    pieData,
    barData,
    COLORS,
    transactions,
    handleShowTransactions,
    handleAddNewTransaction,
    setActiveTab,
    formatCurrency
}) => {
    return (
        <div className="animate-in fade-in duration-500">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[16px] sm:gap-[24px] mb-[32px] lg:mb-[48px]">
                <StatCard
                    title={`${periodType === 'range' ? 'Range' : periodType === 'day' ? 'Daily' : periodType.charAt(0).toUpperCase() + periodType.slice(1) + 'ly'} Income`}
                    value={formatCurrency(stats.summary?.total_income)}
                    color="text-emerald-500"
                    subtitle={periodType === 'range' ? `${customRange.start} to ${customRange.end}` : currentPeriod}
                    onClick={() => handleShowTransactions('income')}
                />
                <StatCard
                    title={`${periodType === 'range' ? 'Range' : periodType === 'day' ? 'Daily' : periodType.charAt(0).toUpperCase() + periodType.slice(1) + 'ly'} Expense`}
                    value={formatCurrency(stats.summary?.total_expense)}
                    color="text-rose-500"
                    subtitle={periodType === 'range' ? `${customRange.start} to ${customRange.end}` : currentPeriod}
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
    );
};

export default Dashboard;
