import React from 'react';
import { FaPlus } from 'react-icons/fa';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { formatAmount } from '../../../utils/formatUtils';

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
            {/* Period Summary Stats */}
            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 sm:mb-8">
                <div className="bg-white p-6 sm:p-8 rounded-[32px] shadow-sm border border-slate-100 relative group overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-blue-500/10 transition-colors"></div>
                    <div className="relative z-10 flex flex-col justify-between h-full">
                        <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Period Income</p>
                            <h3 className="text-3xl font-black tracking-tight text-blue-600">₹{formatAmount(stats.summary?.total_income || 0)}</h3>
                        </div>
                        <div className="h-[8px] mt-4 flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                            <span className="text-[6px] font-black text-blue-400 uppercase tracking-tighter">LIVE FLOW</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 sm:p-8 rounded-[32px] shadow-sm border border-slate-100 relative group overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-red-500/10 transition-colors"></div>
                    <div className="relative z-10 flex flex-col justify-between h-full">
                        <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Period Expense</p>
                            <h3 className="text-3xl font-black tracking-tight text-rose-600">₹{formatAmount(stats.summary?.total_expense || 0)}</h3>
                        </div>
                        <div className="h-[8px] mt-4 flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div>
                            <span className="text-[6px] font-black text-rose-400 uppercase tracking-tighter">PERIOD SPEND</span>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900 p-6 sm:p-8 rounded-[32px] shadow-xl border border-slate-800 relative group overflow-hidden xs:col-span-2 lg:col-span-1">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-500/20 transition-colors"></div>
                    <div className="relative z-10 flex flex-col justify-between h-full">
                        <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Period Net Cash Flow</p>
                            <h3 className={`text-3xl font-black tracking-tight ${(stats.summary?.total_income - stats.summary?.total_expense) >= 0 ? 'text-blue-400' : 'text-rose-400'}`}>
                                ₹{formatAmount(stats.summary?.total_income - stats.summary?.total_expense)}
                            </h3>
                        </div>
                        <div className="h-[8px] mt-4 flex items-center gap-1">
                            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${(stats.summary?.total_income - stats.summary?.total_expense) >= 0 ? 'bg-blue-400' : 'bg-rose-400'}`}></div>
                            <span className="text-[6px] font-black text-slate-500 uppercase tracking-tighter">BALANCE STATUS</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 lg:mb-12">
                {/* Visualizations */}
                <div className="bg-white rounded-[40px] p-8 sm:p-10 shadow-sm border border-slate-100 flex flex-col min-h-[450px]">
                    <div className="flex justify-between items-center mb-10">
                        <h3 className="text-sm font-black flex items-center gap-2">
                            <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
                            Spend by Category
                        </h3>
                        {stats.mostSpentCategory && (
                            <div className="h-[20px] px-3 bg-rose-50 text-rose-600 rounded-full flex items-center text-[10px] font-black uppercase tracking-widest border border-rose-100">
                                Most: {stats.mostSpentCategory}
                            </div>
                        )}
                    </div>
                    <div className="flex-1 w-full min-h-0">
                        {pieData.length > 0 ? (
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
                                        {Array.isArray(pieData) && pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={['#2d5bff', '#f43f5e', '#0ea5e9', '#f59e0b', '#8b5cf6', '#10b981'][index % 6]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '16px', color: '#fff', fontSize: '10px', fontWeight: 'bold' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-300 text-[10px] font-black uppercase tracking-widest">No data available</div>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-[40px] p-8 sm:p-10 shadow-sm border border-slate-100 flex flex-col min-h-[450px]">
                    <div className="flex justify-between items-center mb-10">
                        <h3 className="text-sm font-black flex items-center gap-2">
                            <div className="w-1 h-6 bg-slate-900 rounded-full"></div>
                            Activity Overview
                        </h3>
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
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
                            <div className="h-full flex items-center justify-center text-slate-300 text-[10px] font-black uppercase tracking-widest">No transaction data</div>
                        )}
                    </div>
                </div>
            </div>
            {/* Budgets & Recent Activity */}
            <div className="grid grid-cols-1 gap-6 mb-8 lg:mb-12">

                {/* Recent Activity */}
                <div className="bg-white rounded-[32px] p-6 sm:p-8 shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-black flex items-center gap-2">
                            <div className="w-1 h-6 bg-slate-900 rounded-full"></div>
                            Recent Activity
                        </h3>
                        <button onClick={() => setActiveTab('Transactions')} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">View All Records</button>
                    </div>
                    <div className="space-y-3">
                        {Array.isArray(transactions) && transactions.slice(0, 5).map(t => (
                            <div key={t.id} className="flex justify-between items-center p-4 rounded-3xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm shadow-xs ${t.type === 'income' ? 'bg-blue-50 text-blue-500' : 'bg-red-50 text-red-500'}`}>
                                        {t.type === 'income' ? '↓' : '↑'}
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-900 text-sm leading-tight">{t.title}</p>
                                        <div className="h-[8px] mt-1 flex gap-1">
                                            <div className="px-1 bg-slate-100 text-[6px] font-black text-slate-400 rounded-full flex items-center uppercase tracking-tighter">{t.category}</div>
                                            {t.project_name && <div className="px-1 bg-blue-50 text-[6px] font-black text-blue-500 rounded-full flex items-center uppercase tracking-tighter">{t.project_name}</div>}
                                            {t.member_name && <div className="px-1 bg-orange-50 text-[6px] font-black text-orange-500 rounded-full flex items-center uppercase tracking-tighter">{t.member_name}</div>}
                                        </div>
                                    </div>
                                </div>
                                <p className={`font-black text-sm ${t.type === 'income' ? 'text-blue-600' : 'text-rose-600'}`}>
                                    {t.type === 'income' ? '+' : '-'}₹{formatAmount(t.amount)}
                                </p>
                            </div>
                        ))}
                        {transactions.length === 0 && <p className="text-center py-8 text-slate-400 text-[10px] font-bold uppercase tracking-widest">No transaction history yet</p>}
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
