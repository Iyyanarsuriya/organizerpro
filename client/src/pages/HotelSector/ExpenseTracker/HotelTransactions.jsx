import React, { useState, useMemo } from 'react';
import { FaSearch, FaFilter, FaEdit, FaTrash, FaBed, FaUser, FaBuilding, FaCreditCard, FaCalendarAlt, FaChevronRight, FaWallet } from 'react-icons/fa';
import { formatAmount } from '../../../utils/formatUtils';
import ExportButtons from '../../../components/Common/ExportButtons';
import { exportExpenseToCSV, exportExpenseToTXT, exportExpenseToPDF } from '../../../utils/expenseExportUtils/expense';

const FilterSelect = ({ label, value, onChange, options, icon: Icon }) => (
    <div className="flex-1 min-w-[150px]">
        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">{label}</label>
        <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] group-hover:text-blue-500 transition-colors pointer-events-none">
                {Icon && <Icon />}
            </div>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`w-full h-12 bg-slate-50 border border-slate-100 rounded-[16px] ${Icon ? 'pl-10' : 'px-4'} pr-8 text-[11px] font-black text-slate-700 outline-none focus:ring-4 focus:ring-blue-50/50 transition-all cursor-pointer appearance-none shadow-sm hover:shadow-md`}
            >
                <option value="">All {label}s</option>
                {options.map((opt) => (
                    <option key={opt.id || opt} value={opt.id || opt}>
                        {opt.name || opt.unit_number || opt}
                    </option>
                ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <FaChevronRight className="w-2.5 h-2.5 text-slate-400 rotate-90" />
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

    const exportPeriod = useMemo(() => {
        if (periodType === 'range') {
            if (customRange?.start && customRange?.end) return `${customRange.start} to ${customRange.end}`;
            return 'Custom Range';
        }
        return currentPeriod;
    }, [periodType, customRange, currentPeriod]);

    const handleExportPDF = () => {
        exportExpenseToPDF({
            data: filteredList,
            period: exportPeriod,
            filename: `hotel_transactions_${new Date().getTime()}`
        });
    };

    const handleExportCSV = () => {
        exportExpenseToCSV(filteredList, `hotel_transactions_${new Date().getTime()}`);
    };

    const handleExportTXT = () => {
        exportExpenseToTXT({
            data: filteredList,
            period: exportPeriod,
            filename: `hotel_transactions_${new Date().getTime()}`
        });
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8">
            {/* Header Controls */}
            <div className="flex flex-col xl:flex-row gap-6 justify-between items-start xl:items-center">
                <div className="flex bg-white p-1.5 rounded-[24px] border border-slate-100 shadow-sm w-full xl:w-auto overflow-x-auto no-scrollbar">
                    {['all', 'income', 'expense'].map((type) => (
                        <button
                            key={type}
                            onClick={() => setViewType(type)}
                            className={`flex-1 xl:flex-none px-8 py-3 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${viewType === type ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                        >
                            {type}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4 w-full xl:w-auto">
                    <div className="relative flex-1 xl:w-80 group">
                        <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search records..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-14 bg-white border border-slate-100 rounded-[24px] pl-14 pr-6 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-50/50 transition-all shadow-sm group-hover:shadow-md placeholder:text-slate-300"
                        />
                    </div>
                    <ExportButtons
                        onExportPDF={handleExportPDF}
                        onExportCSV={handleExportCSV}
                        onExportTXT={handleExportTXT}
                        className="bg-white p-2 rounded-[24px] border border-slate-100 shadow-sm h-14"
                    />
                </div>
            </div>

            {/* Advanced Filters */}
            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                    <div className="w-1 h-5 bg-slate-900 rounded-full"></div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">Filter Records</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                    <FilterSelect label="Property" value={filterProperty} onChange={setFilterProperty} options={['Hotel', 'Homestay']} icon={FaBuilding} />
                    <FilterSelect label="Room Unit" value={filterRoom} onChange={setFilterRoom} options={units} icon={FaBed} />
                    <FilterSelect label="Vendor" value={filterVendor} onChange={setFilterVendor} options={vendors} icon={FaUser} />
                    <FilterSelect label="Payment Mode" value={filterPaymentMode} onChange={setFilterPaymentMode} options={['Cash', 'UPI', 'Card', 'Bank']} icon={FaCreditCard} />
                    <FilterSelect label="Category" value={sortBy} onChange={setSortBy} options={categories} icon={FaFilter} />
                    <div className="flex items-end">
                        <button
                            type="button"
                            onClick={() => {
                                setFilterProperty('');
                                setFilterRoom('');
                                setFilterVendor('');
                                setFilterPaymentMode('');
                                setSortBy('');
                                setSearchQuery('');
                            }}
                            className="w-full h-12 bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 border border-slate-100 rounded-[16px] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                        >
                            <FaTrash size={10} /> Clear Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Transactions List */}
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-50">
                                <th className="px-10 py-6 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Transaction Details</th>
                                <th className="px-10 py-6 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Entities</th>
                                <th className="px-10 py-6 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Date & Time</th>
                                <th className="px-10 py-6 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Financials</th>
                                <th className="px-10 py-6 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredList.map((t) => (
                                <tr key={t.id} className="group hover:bg-slate-50/50 transition-all duration-300">
                                    <td className="px-10 py-6">
                                        <div className="flex items-center gap-5">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-[12px] font-black shadow-sm ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                {t.type === 'income' ? 'IN' : 'OUT'}
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 text-[14px] leading-tight mb-1.5 group-hover:text-blue-600 transition-colors">{t.title}</p>
                                                <div className="flex gap-2">
                                                    <span className="px-2.5 py-1 bg-white border border-slate-100 text-[8px] font-black text-slate-500 rounded-full uppercase tracking-widest shadow-sm">{t.type === 'income' ? (t.income_source || t.category_name || t.category) : (t.category_name || t.category)}</span>
                                                    {t.payment_mode && <span className="px-2.5 py-1 bg-slate-100 text-[8px] font-black text-slate-600 rounded-full uppercase tracking-widest">{t.payment_mode}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6">
                                        <div className="space-y-1.5">
                                            {t.room_number && (
                                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-600 bg-blue-50/50 px-3 py-1.5 rounded-xl w-fit">
                                                    <FaBed className="text-blue-400" size={12} />
                                                    <span>Room {t.room_number}</span>
                                                </div>
                                            )}
                                            {t.vendor_name && (
                                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-600 bg-orange-50/50 px-3 py-1.5 rounded-xl w-fit">
                                                    <FaUser className="text-orange-400" size={12} />
                                                    <span>{t.vendor_name}</span>
                                                </div>
                                            )}
                                            {!t.room_number && !t.vendor_name && <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic pl-2">General Operation</span>}
                                        </div>
                                    </td>
                                    <td className="px-10 py-6">
                                        <div className="flex items-center gap-3 text-[11px] font-black text-slate-600">
                                            <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                                <FaCalendarAlt size={10} />
                                            </div>
                                            <span>{new Date(t.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6 text-right">
                                        <p className={`font-black text-[16px] tracking-tight ${t.type === 'income' ? 'text-emerald-600' : 'text-slate-900'}`}>
                                            {t.type === 'income' ? '+' : '-'}₹{formatAmount(t.amount)}
                                        </p>
                                        <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${t.payment_status === 'completed' ? 'bg-emerald-50 text-emerald-500' : 'bg-amber-50 text-amber-500'}`}>
                                            {t.payment_status}
                                        </span>
                                    </td>
                                    <td className="px-10 py-6">
                                        <div className="flex items-center justify-center gap-2 opacity-100">
                                            <button onClick={() => handleEdit(t)} className="w-9 h-9 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-blue-500 hover:border-blue-100 hover:bg-blue-50 transition-all flex items-center justify-center shadow-sm">
                                                <FaEdit size={10} />
                                            </button>
                                            <button onClick={() => confirmDelete(t.id)} className="w-9 h-9 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-rose-500 hover:border-rose-100 hover:bg-rose-50 transition-all flex items-center justify-center shadow-sm">
                                                <FaTrash size={10} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredList.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-10 py-24 text-center">
                                        <div className="flex flex-col items-center animate-in zoom-in duration-300">
                                            <div className="w-20 h-20 bg-slate-50 rounded-[24px] flex items-center justify-center text-slate-200 mb-6 shadow-inset">
                                                <FaWallet size={32} />
                                            </div>
                                            <h4 className="text-slate-900 font-black text-xl mb-2">No Transactions Found</h4>
                                            <p className="text-slate-400 text-[11px] font-black uppercase tracking-widest">Adjust your filters or add a new record</p>
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
