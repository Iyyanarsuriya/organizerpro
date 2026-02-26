import { useState, useEffect } from 'react';
import { getWorkLogs, createWorkLog, updateWorkLog, deleteWorkLog, getMonthlyTotal } from '../../api/Attendance/mfgAttendance';
import { getActiveMembers } from '../../api/TeamManagement/mfgTeam';
import toast from 'react-hot-toast';
import { FaPlus, FaEdit, FaTrash, FaCalendarAlt, FaMoneyBillWave, FaBoxes, FaStickyNote, FaSearch } from 'react-icons/fa';
import ConfirmModal from '../modals/ConfirmModal';
import ExportButtons from '../Common/ExportButtons';
import { exportWorkLogToCSV, exportWorkLogToTXT, exportWorkLogToPDF } from '../../utils/exportUtils/index.js';

const DailyWorkLogManager = ({ onClose, selectedDate = new Date().toISOString().split('T')[0] }) => {
    const [workLogs, setWorkLogs] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [monthlyTotals, setMonthlyTotals] = useState([]);
    const [isGuest, setIsGuest] = useState(false);

    // Search and Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [logFilterType, setLogFilterType] = useState('all'); // 'all', 'member', 'guest'
    const [dateFilter, setDateFilter] = useState({ start: selectedDate, end: selectedDate });

    const filteredLogs = (workLogs || []).filter(log => {
        const matchesSearch =
            (log.member_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (log.guest_name?.toLowerCase() || '').includes(searchTerm.toLowerCase());

        const matchesType =
            logFilterType === 'all' ? true :
                logFilterType === 'guest' ? (!log.member_id) :
                    logFilterType === 'member' ? (!!log.member_id) : true;

        return matchesSearch && matchesType;
    });

    const [formData, setFormData] = useState({
        member_id: '',
        guest_name: '',
        date: selectedDate,
        units_produced: '',
        rate_per_unit: '',
        unit_type: 'day', // 'piece' or 'day'
        work_type: '',
        notes: ''
    });
    const [editingId, setEditingId] = useState(null);
    const [viewMode, setViewMode] = useState('daily');
    const [confirmModal, setConfirmModal] = useState({ show: false, id: null });

    const fetchData = async (force = false) => {
        // Always clear stale deduplication cache when force or date changes
        const currentParamsKey = JSON.stringify({
            startDate: dateFilter.start,
            endDate: dateFilter.end,
            viewMode
        });

        // Deduplicate only when params are identical and not forced
        if (!force && window._mfgWorkLogFetchPromise && window._mfgWorkLogParamsKey === currentParamsKey) {
            try {
                const [logsRes, membersRes] = await window._mfgWorkLogFetchPromise;
                setWorkLogs(logsRes.data?.data || []);
                setMembers(membersRes.data?.data || []);
            } catch (error) {
                console.error("Error joining existing fetch:", error);
            } finally {
                setLoading(false);
            }
            return;
        }

        // Always clear old promise cache before new fetch
        window._mfgWorkLogFetchPromise = null;
        window._mfgWorkLogParamsKey = null;

        const fetchPromise = Promise.all([
            getWorkLogs({ startDate: dateFilter.start, endDate: dateFilter.end }),
            getActiveMembers()
        ]);

        if (!force) {
            window._mfgWorkLogFetchPromise = fetchPromise;
            window._mfgWorkLogParamsKey = currentParamsKey;
        }

        setLoading(true);
        try {
            const [logsRes, membersRes] = await fetchPromise;
            setWorkLogs(logsRes.data?.data || []);
            setMembers(membersRes.data?.data || []);
        } catch (error) {
            console.error("Failed to fetch data", error);
            toast.error("Failed to load data");
        } finally {
            window._mfgWorkLogFetchPromise = null;
            setLoading(false);
        }
    };

    const fetchMonthlyTotals = async () => {
        try {
            // Use dateFilter.start (or end) to derive the year/month for monthly totals
            const refDate = new Date(dateFilter.start || new Date().toISOString().split('T')[0]);
            const res = await getMonthlyTotal({
                year: refDate.getFullYear(),
                month: refDate.getMonth() + 1
            });
            setMonthlyTotals(res.data?.data || []);
        } catch (error) {
            console.error('Monthly totals error:', error);
            toast.error("Failed to fetch monthly totals");
        }
    };

    useEffect(() => {
        fetchData();
        if (viewMode === 'monthly') {
            fetchMonthlyTotals();
        }
    }, [dateFilter, viewMode]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData };
            if (isGuest) {
                payload.member_id = null;
                if (!payload.guest_name) {
                    toast.error("Guest Name is required");
                    return;
                }
            } else {
                payload.guest_name = null;
                if (!payload.member_id) {
                    toast.error("Member is required");
                    return;
                }
            }
            if (!payload.work_type) {
                payload.work_type = 'Production';
            }

            if (editingId) {
                await updateWorkLog(editingId, payload);
                toast.success("Work log updated!");
            } else {
                await createWorkLog(payload);
                toast.success("Work log added!");
            }
            resetForm();
            fetchData(true); // force refresh so new log appears immediately
            if (viewMode === 'monthly') fetchMonthlyTotals();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to save work log");
        }
    };

    const handleEdit = (log) => {
        setIsGuest(!log.member_id);
        setFormData({
            member_id: log.member_id || '',
            guest_name: log.guest_name || '',
            date: log.date,
            units_produced: log.units_produced,
            rate_per_unit: log.rate_per_unit,
            unit_type: log.unit_type || 'piece',
            work_type: log.work_type || 'Production',
            notes: log.notes || ''
        });
        setEditingId(log.id);
    };

    const handleDeleteClick = (id) => {
        setConfirmModal({ show: true, id });
    };

    const confirmDelete = async () => {
        try {
            await deleteWorkLog(confirmModal.id);
            toast.success("Work log deleted");
            fetchData(true); // force refresh so deleted log disappears immediately
            if (viewMode === 'monthly') fetchMonthlyTotals();
        } catch (error) {
            toast.error("Failed to delete");
        } finally {
            setConfirmModal({ show: false, id: null });
        }
    };

    const resetForm = () => {
        setFormData({
            member_id: '',
            guest_name: '',
            date: selectedDate,
            units_produced: '',
            rate_per_unit: '',
            unit_type: 'day',
            work_type: '',
            notes: ''
        });
        setEditingId(null);
        setIsGuest(false);
    };

    const handleMemberChange = (memberId) => {
        const member = members.find(m => m.id == memberId);
        setFormData({
            ...formData,
            member_id: memberId,
            rate_per_unit: member?.daily_wage || ''
        });
    };

    return (
        <div className="bg-white rounded-[32px] p-6 lg:p-8 h-full flex flex-col font-['Outfit'] border border-slate-100 shadow-sm animate-in fade-in duration-300 relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                        <div className="w-1 h-6 bg-indigo-600 rounded-full"></div>
                        Daily Work Log
                    </h2>
                    <p className="text-slate-500 text-xs mt-1 ml-4 font-bold tracking-wide">Track daily production and calculate earnings</p>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                {/* View Toggle */}
                <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8 w-fit border border-slate-200">
                    <button
                        onClick={() => setViewMode('daily')}
                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'daily' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Daily Entry
                    </button>
                    <button
                        onClick={() => setViewMode('monthly')}
                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'monthly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Monthly Summary
                    </button>
                </div>

                {viewMode === 'daily' ? (
                    <>
                        {/* Add/Edit Form */}
                        <form onSubmit={handleSubmit} className="mb-8 p-6 bg-slate-50 rounded-[24px] border border-slate-100 font-['Outfit'] shadow-sm">
                            <div className="flex bg-slate-100 p-1 rounded-xl mb-6 w-fit border border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => setIsGuest(false)}
                                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${!isGuest ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                                >
                                    Existing Member
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setIsGuest(true); setFormData({ ...formData, member_id: '' }); }}
                                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${isGuest ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                                >
                                    Guest / Temp
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                                <div>
                                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                                        {isGuest ? 'Guest Name *' : 'Member *'}
                                    </label>
                                    {isGuest ? (
                                        <input
                                            required
                                            type="text"
                                            value={formData.guest_name}
                                            onChange={(e) => setFormData({ ...formData, guest_name: e.target.value })}
                                            placeholder="Enter guest name"
                                            className="w-full bg-white border border-slate-200 rounded-2xl px-4 h-12 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
                                        />
                                    ) : (
                                        <select
                                            required
                                            value={formData.member_id}
                                            onChange={(e) => handleMemberChange(e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-2xl px-4 h-12 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer shadow-sm"
                                        >
                                            <option value="">Select Member</option>
                                            {members.map(m => (
                                                <option key={m.id} value={m.id}>
                                                    {m.name} - {m.wage_type === 'piece_rate' ? 'Piece' : m.wage_type === 'monthly' ? 'Monthly' : 'Daily'}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                                        <FaCalendarAlt className="inline mr-1 text-[8px]" /> Date *
                                    </label>
                                    <input
                                        required
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full bg-white border border-slate-200 rounded-2xl px-4 h-12 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
                                    />
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                            <FaBoxes className="text-[8px]" />
                                            {formData.unit_type === 'day' ? 'Days Worked *' : 'Pieces Produced *'}
                                        </label>
                                        {/* Piece / Day toggle */}
                                        <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, unit_type: 'piece' })}
                                                className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider transition-all ${formData.unit_type === 'piece'
                                                    ? 'bg-indigo-600 text-white shadow-sm'
                                                    : 'text-slate-500 hover:text-slate-700'
                                                    }`}
                                            >
                                                Piece
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, unit_type: 'day' })}
                                                className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider transition-all ${formData.unit_type === 'day'
                                                    ? 'bg-emerald-600 text-white shadow-sm'
                                                    : 'text-slate-500 hover:text-slate-700'
                                                    }`}
                                            >
                                                Day
                                            </button>
                                        </div>
                                    </div>
                                    <input
                                        required
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.units_produced}
                                        onChange={(e) => setFormData({ ...formData, units_produced: e.target.value })}
                                        placeholder={formData.unit_type === 'day' ? 'Number of days (e.g. 1, 0.5)' : 'Number of pieces produced'}
                                        className="w-full bg-white border border-slate-200 rounded-2xl px-4 h-12 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                                        <FaMoneyBillWave className="inline mr-1 text-[8px]" />
                                        {formData.unit_type === 'day' ? 'Rate per Day *' : 'Rate per Piece *'}
                                    </label>
                                    <input
                                        required
                                        type="number"
                                        step="0.01"
                                        value={formData.rate_per_unit}
                                        onChange={(e) => setFormData({ ...formData, rate_per_unit: e.target.value })}
                                        placeholder={formData.unit_type === 'day' ? 'Daily wage rate' : 'Rate per piece'}
                                        className="w-full bg-white border border-slate-200 rounded-2xl px-4 h-12 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                                        <FaStickyNote className="inline mr-1 text-[8px]" /> Notes
                                    </label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        placeholder="Optional notes..."
                                        rows="2"
                                        className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none shadow-sm"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
                                >
                                    <FaPlus className="text-sm" />
                                    {editingId ? 'Update Log' : 'Add Log'}
                                </button>
                                {editingId && (
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="px-6 bg-slate-200 hover:bg-slate-300 text-slate-700 h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                            {formData.units_produced && formData.rate_per_unit && (
                                <div className={`mt-4 p-4 rounded-2xl border flex items-center justify-between ${formData.unit_type === 'day'
                                    ? 'bg-emerald-50 border-emerald-100'
                                    : 'bg-indigo-50 border-indigo-100'
                                    }`}>
                                    <div>
                                        <p className={`text-[10px] font-black uppercase tracking-widest ${formData.unit_type === 'day' ? 'text-emerald-400' : 'text-indigo-400'
                                            }`}>Calculated Amount</p>
                                        <p className="text-[9px] font-bold text-slate-400 mt-0.5">
                                            {formData.units_produced} {formData.unit_type === 'day' ? 'days' : 'pieces'} × ₹{formData.rate_per_unit}/{formData.unit_type === 'day' ? 'day' : 'piece'}
                                        </p>
                                    </div>
                                    <p className={`text-2xl font-black ${formData.unit_type === 'day' ? 'text-emerald-600' : 'text-indigo-600'
                                        }`}>
                                        ₹{(parseFloat(formData.units_produced) * parseFloat(formData.rate_per_unit)).toFixed(2)}
                                    </p>
                                </div>
                            )}
                        </form>

                        {/* Search and Filters */}
                        <div className="flex flex-col sm:flex-row gap-4 mb-6">
                            <div className="flex gap-3 w-full sm:w-auto">
                                <div className="flex items-center gap-2 bg-slate-50 px-2 md:px-3 py-2 rounded-xl border border-slate-100 w-full sm:w-auto">
                                    <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">From</span>
                                    <input
                                        type="date"
                                        value={dateFilter.start}
                                        onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
                                        className="bg-transparent text-[10px] md:text-xs font-bold text-slate-700 outline-none w-full sm:w-[110px]"
                                    />
                                </div>
                                <div className="flex items-center gap-2 bg-slate-50 px-2 md:px-3 py-2 rounded-xl border border-slate-100 w-full sm:w-auto">
                                    <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">To</span>
                                    <input
                                        type="date"
                                        value={dateFilter.end}
                                        onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
                                        className="bg-transparent text-[10px] md:text-xs font-bold text-slate-700 outline-none w-full sm:w-[110px]"
                                    />
                                </div>
                            </div>
                            <div className="flex-1 relative">
                                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search by name..."
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 md:pl-12 pr-4 py-2 md:py-2.5 text-[10px] md:text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all"
                                />
                            </div>
                            <div className="flex bg-slate-100 p-1 rounded-xl w-fit border border-slate-200">
                                {['all', 'member', 'guest'].map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setLogFilterType(type)}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${logFilterType === type ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        {type === 'all' ? 'All' : type}
                                    </button>
                                ))}
                            </div>
                            <ExportButtons
                                onExportCSV={() => exportWorkLogToCSV(filteredLogs, 'Work_Log_Report')}
                                onExportPDF={() => exportWorkLogToPDF({ data: filteredLogs, period: `${dateFilter.start} to ${dateFilter.end}`, filename: 'Work_Log_Report' })}
                                onExportTXT={() => exportWorkLogToTXT({ data: filteredLogs, period: `${dateFilter.start} to ${dateFilter.end}`, filename: 'Work_Log_Report' })}
                            />
                        </div>

                        {/* Logs List */}
                        <div className="space-y-4 font-['Outfit']">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-1">
                                {dateFilter.start === dateFilter.end && dateFilter.start ? `Logs for ${new Date(dateFilter.start).toLocaleDateString('en-GB')}` : 'Logs'} ({filteredLogs.length})
                            </h3>
                            {loading ? (
                                <div className="text-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
                                </div>
                            ) : filteredLogs.length > 0 ? (
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                    {filteredLogs.map(log => (
                                        <div
                                            key={log.id}
                                            className="bg-white border border-slate-100 rounded-3xl p-6 hover:border-indigo-200 hover:shadow-md transition-all group"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                                            {log.member_name}
                                                            {!log.member_id && <span className="text-[9px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Guest</span>}
                                                            {log.work_type && <span className="text-[9px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">{log.work_type}</span>}
                                                        </h4>
                                                        <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-wide">
                                                            {log.units_produced} units
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3 text-sm text-slate-500">
                                                        <div className="flex items-center gap-2">
                                                            <FaMoneyBillWave className="text-slate-400 text-xs" />
                                                            <span className="font-bold">₹{log.rate_per_unit}/unit</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-black text-emerald-600 text-lg">₹{log.total_amount}</span>
                                                        </div>
                                                    </div>
                                                    {log.notes && (
                                                        <div className="mt-3 pt-3 border-t border-slate-50">
                                                            <p className="text-xs text-slate-500 italic flex items-center gap-2">
                                                                <FaStickyNote className="text-slate-300" />
                                                                {log.notes}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleEdit(log)}
                                                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                                    >
                                                        <FaEdit className="text-sm" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(log.id)}
                                                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                                    >
                                                        <FaTrash className="text-sm" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16 text-slate-400 bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
                                    <FaBoxes className="text-4xl mx-auto mb-4 opacity-20" />
                                    <p className="text-xs font-black uppercase tracking-widest">No logs for this date</p>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    /* Monthly Summary */
                    <div className="space-y-6 font-['Outfit']">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-1">
                            Monthly Summary - {new Date(dateFilter.start || new Date()).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                        </h3>
                        {monthlyTotals.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {monthlyTotals.map((total, idx) => (
                                    <div key={total.member_id || `guest-${idx}`} className="bg-linear-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-[32px] p-8 hover:shadow-lg transition-all">
                                        <div className="flex items-center justify-between mb-6">
                                            <h4 className="text-xl font-black text-slate-900 flex items-center gap-2">
                                                {total.member_name}
                                                {!total.member_id && <span className="text-[9px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Guest</span>}
                                            </h4>
                                            <span className="text-[10px] font-black text-indigo-600 bg-white px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
                                                {total.days_worked} days
                                            </span>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="bg-white/60 rounded-2xl p-4 backdrop-blur-sm border border-white/50">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Total Units</p>
                                                <p className="text-2xl font-black text-slate-900">{total.total_units}</p>
                                            </div>
                                            <div className="bg-white/60 rounded-2xl p-4 backdrop-blur-sm border border-white/50">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Total Earnings</p>
                                                <p className="text-2xl font-black text-emerald-600">₹{parseFloat(total.total_earnings).toFixed(2)}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 text-slate-400 bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
                                <FaMoneyBillWave className="text-4xl mx-auto mb-4 opacity-20" />
                                <p className="text-xs font-black uppercase tracking-widest">No data for this month</p>
                            </div>
                        )}
                    </div>
                )
                }
            </div >



            <ConfirmModal
                isOpen={confirmModal.show}
                title="Delete Work Log?"
                message="Are you sure you want to delete this daily work log?"
                onConfirm={confirmDelete}
                onCancel={() => setConfirmModal({ show: false, id: null })}
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
            />
        </div >
    );
};

export default DailyWorkLogManager;
