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
    );
};

export default Transactions;
