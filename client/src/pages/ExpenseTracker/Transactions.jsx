import React from 'react';
import { FaPlus, FaEdit, FaTrash, FaUserCheck, FaExchangeAlt } from 'react-icons/fa';
import { formatDateTime, formatAmount } from '../../utils/formatUtils';

const Transactions = ({
    filteredTransactions,
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    sortBy,
    setSortBy,
    handleAddNewTransaction,
    handleEdit,
    confirmDelete
}) => {
    return (
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

            <div className="space-y-4">
                {filteredTransactions.map(t => (
                    <div key={t.id} className="bg-white p-4 sm:p-6 rounded-[32px] shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:shadow-md transition-all">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-xl shadow-sm shrink-0 transition-transform group-hover:scale-105 ${t.type === 'income' ? 'bg-blue-50 text-blue-500' : 'bg-red-50 text-red-500'}`}>
                                {t.type === 'income' ? '↓' : '↑'}
                            </div>
                            <div>
                                <h4 className="font-black text-slate-900 text-sm sm:text-base leading-tight">{t.title}</h4>
                                <div className="h-[8px] mt-1.5 flex flex-wrap gap-1">
                                    <div className="px-1 bg-slate-100 text-[6px] font-black text-slate-400 rounded-full flex items-center uppercase tracking-tighter">
                                        {t.category}
                                    </div>
                                    {t.project_name && (
                                        <div className="px-1 bg-blue-50 text-[6px] font-black text-blue-500 rounded-full flex items-center uppercase tracking-tighter">
                                            {t.project_name}
                                        </div>
                                    )}
                                    {t.member_name && (
                                        <div className="px-1 bg-orange-50 text-[6px] font-black text-orange-500 rounded-full flex items-center uppercase tracking-tighter">
                                            {t.member_name}
                                        </div>
                                    )}
                                    <div className="px-1 bg-slate-50 text-[6px] font-black text-slate-300 rounded-full flex items-center uppercase tracking-tighter">
                                        {formatDateTime(t.updated_at || t.created_at)}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-50">
                            <p className={`text-lg sm:text-xl font-black tracking-tight ${t.type === 'income' ? 'text-blue-600' : 'text-red-600'}`}>
                                {t.type === 'income' ? '+' : '-'}₹{formatAmount(t.amount)}
                            </p>
                            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEdit(t)} className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all cursor-pointer">
                                    <FaEdit size={14} />
                                </button>
                                <button onClick={() => confirmDelete(t.id)} className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer">
                                    <FaTrash size={14} />
                                </button>
                            </div>
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
    );
};

export default Transactions;
