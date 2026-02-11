import React, { useState } from 'react';
import { FaSearch, FaFilter, FaPlus, FaEllipsisV, FaEdit, FaTrash, FaBed, FaUser, FaBuilding, FaCreditCard, FaCalendarAlt, FaChevronLeft, FaChevronRight, FaWallet } from 'react-icons/fa';
import { formatAmount } from '../../../utils/formatUtils';

const FilterSelect = ({ label, value, onChange, options, icon: Icon }) => (
    <div className="flex-1 min-w-[150px]">
        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">{label}</label>
        <div className="relative">
            {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]" />}
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`w-full h-11 bg-slate-50 border border-slate-100 rounded-2xl ${Icon ? 'pl-10' : 'px-4'} pr-4 text-[11px] font-black text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer appearance-none shadow-xs`}
            >
                <option value="">All {label}s</option>
                {options.map((opt) => (
                    <option key={opt.id || opt} value={opt.id || opt}>
                        {opt.name || opt.unit_number || opt}
                    </option>
                ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-2.5 h-2.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
            </div>
        </div>
    </div>
);

const HotelTransactions = ({
    filteredTransactions,
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    sortBy,
    setSortBy,
    handleAddNewTransaction,
    handleEdit,
    confirmDelete,
    units,
    members,
    vendors = [],
    categories = [],
    filterProperty,
    setFilterProperty,
    filterRoom,
    setFilterRoom,
    filterVendor,
    setFilterVendor,
    filterPaymentMode,
    setFilterPaymentMode,
    periodType,
    setPeriodType,
    currentPeriod,
    setCurrentPeriod,
    customRange,
    setCustomRange
}) => {
    const [viewType, setViewType] = useState('all'); // all, income, expense

    const filteredList = filteredTransactions.filter(t =>
        viewType === 'all' || t.type === viewType
    );

    const handlePrevPeriod = () => {
        const date = new Date(currentPeriod);
        if (periodType === 'day') date.setDate(date.getDate() - 1);
        else if (periodType === 'month') date.setMonth(date.getMonth() - 1);
        else if (periodType === 'year') date.setFullYear(date.getFullYear() - 1);
        setCurrentPeriod(periodType === 'day' ? date.toISOString().split('T')[0] :
            periodType === 'month' ? date.toISOString().slice(0, 7) :
                date.getFullYear().toString());
    };

    const handleNextPeriod = () => {
        const date = new Date(currentPeriod);
        if (periodType === 'day') date.setDate(date.getDate() + 1);
        else if (periodType === 'month') date.setMonth(date.getMonth() + 1);
        else if (periodType === 'year') date.setFullYear(date.getFullYear() + 1);
        setCurrentPeriod(periodType === 'day' ? date.toISOString().split('T')[0] :
            periodType === 'month' ? date.toISOString().slice(0, 7) :
                date.getFullYear().toString());
    };

    return (
        <div className="animate-in fade-in duration-500 space-y-6">
            {/* Search & Main Type Tabs */}
            <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
                <div className="flex bg-white p-1.5 rounded-[22px] border border-slate-100 shadow-sm w-full lg:w-auto">
                    {['all', 'income', 'expense'].map((type) => (
                        <button
                            key={type}
                            onClick={() => setViewType(type)}
                            className={`flex-1 lg:flex-none px-8 py-2.5 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${viewType === type ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
                <div className="relative w-full lg:w-96 group">
                    <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-blue-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search Guest name, Invoice ID, Category..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-14 bg-white border border-slate-100 rounded-[24px] pl-14 pr-6 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-50 transition-all shadow-sm group-hover:shadow-md"
                    />
                </div>
            </div>

            {/* Period Navigation */}
            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-6">
                <div className="flex items-center gap-2">
                    <div className="flex p-1 bg-slate-50 rounded-xl border border-slate-100">
                        {['day', 'month', 'year', 'range'].map((type) => (
                            <button
                                key={type}
                                onClick={() => setPeriodType(type)}
                                className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${periodType === type ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {periodType !== 'range' ? (
                        <div className="flex items-center gap-3">
                            <button onClick={handlePrevPeriod} className="p-2.5 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 transition-all border border-transparent hover:border-slate-200"><FaChevronLeft size={10} /></button>
                            <span className="text-sm font-black text-slate-900 min-w-32 text-center">
                                {periodType === 'day' ? new Date(currentPeriod).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) :
                                    periodType === 'month' ? new Date(currentPeriod).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) :
                                        currentPeriod}
                            </span>
                            <button onClick={handleNextPeriod} className="p-2.5 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 transition-all border border-transparent hover:border-slate-200"><FaChevronRight size={10} /></button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <input type="date" value={customRange.start} onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })} className="h-10 bg-slate-50 border border-slate-100 rounded-xl px-3 text-[11px] font-black" />
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">To</span>
                            <input type="date" value={customRange.end} onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })} className="h-10 bg-slate-50 border border-slate-100 rounded-xl px-3 text-[11px] font-black" />
                        </div>
                    )}
                </div>
            </div>

            {/* Advanced Hospitality Filters */}
            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <FilterSelect label="Property" value={filterProperty} onChange={setFilterProperty} options={['Hotel', 'Homestay']} icon={FaBuilding} />
                <FilterSelect label="Room" value={filterRoom} onChange={setFilterRoom} options={units} icon={FaBed} />
                <FilterSelect label="Vendor" value={filterVendor} onChange={setFilterVendor} options={vendors} icon={FaUser} />
                <FilterSelect label="Payment Mode" value={filterPaymentMode} onChange={setFilterPaymentMode} options={['Cash', 'UPI', 'Card', 'Bank']} icon={FaCreditCard} />
                <FilterSelect label="Category" value={sortBy} onChange={setSortBy} options={categories} icon={FaFilter} />
                <div className="flex items-end">
                    <button onClick={handleAddNewTransaction} className="w-full h-11 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 shadow-lg shadow-black/10 flex items-center justify-center gap-2 transition-transform active:scale-95">
                        <FaPlus size={10} /> Add New
                    </button>
                </div>
            </div>

            {/* Transactions List */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden min-h-[500px]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Transaction Details</th>
                                <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Entities</th>
                                <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Timeline</th>
                                <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Accounting</th>
                                <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredList.map((t) => (
                                <tr key={t.id} className="group hover:bg-slate-50/50 transition-all duration-300">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-black ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                {t.type === 'income' ? 'IN' : 'EX'}
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 text-[14px] leading-tight mb-1">{t.title}</p>
                                                <div className="flex gap-2">
                                                    <span className="px-2 py-0.5 bg-white border border-slate-100 text-[7px] font-black text-slate-500 rounded-full uppercase tracking-tighter">{t.category_name || t.category}</span>
                                                    {t.payment_mode && <span className="px-2 py-0.5 bg-indigo-50 text-[7px] font-black text-indigo-600 rounded-full uppercase tracking-tighter">{t.payment_mode}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="space-y-1.5">
                                            {t.room_number && (
                                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-600">
                                                    <FaBed className="text-slate-300" size={12} />
                                                    <span>Room {t.room_number}</span>
                                                </div>
                                            )}
                                            {t.vendor_name && (
                                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-600">
                                                    <FaUser className="text-slate-300" size={12} />
                                                    <span>{t.vendor_name}</span>
                                                </div>
                                            )}
                                            {!t.room_number && !t.vendor_name && <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Operations</span>}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2 text-[11px] font-black text-slate-600">
                                            <FaCalendarAlt className="text-slate-300" size={12} />
                                            <span>{new Date(t.date).toLocaleDateString('en-GB')}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <p className={`font-black text-[15px] ${t.type === 'income' ? 'text-emerald-600' : 'text-slate-900'}`}>
                                            {t.type === 'income' ? '+' : '-'}₹{formatAmount(t.amount)}
                                        </p>
                                        <span className={`text-[8px] font-black uppercase tracking-tighter ${t.payment_status === 'completed' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                            {t.payment_status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center justify-center gap-2">
                                            <button onClick={() => handleEdit(t)} className="p-2.5 rounded-xl hover:bg-white text-slate-400 hover:text-blue-500 transition-all border border-transparent hover:border-slate-100">
                                                <FaEdit size={12} />
                                            </button>
                                            <button onClick={() => confirmDelete(t.id)} className="p-2.5 rounded-xl hover:bg-white text-slate-400 hover:text-rose-500 transition-all border border-transparent hover:border-slate-100">
                                                <FaTrash size={12} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredList.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-8 py-16 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-4">
                                                <FaWallet size={24} />
                                            </div>
                                            <h4 className="text-slate-900 font-black text-lg mb-1">No Transactions Found</h4>
                                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Adjust your filters or add a new record</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default HotelTransactions;
