import { useState, useEffect } from 'react';
import { getWorkLogs, createWorkLog, updateWorkLog, deleteWorkLog, getMonthlyTotal } from '../api/workLogApi';
import { getActiveMembers } from '../api/memberApi';
import toast from 'react-hot-toast';
import { FaTimes, FaPlus, FaEdit, FaTrash, FaCalendarAlt, FaMoneyBillWave, FaBoxes, FaStickyNote } from 'react-icons/fa';
import ConfirmModal from './modals/ConfirmModal';

const DailyWorkLogManager = ({ onClose, selectedDate = new Date().toISOString().split('T')[0] }) => {
    const [workLogs, setWorkLogs] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [monthlyTotals, setMonthlyTotals] = useState([]);
    const [formData, setFormData] = useState({
        member_id: '',
        date: selectedDate,
        units_produced: '',
        rate_per_unit: '',
        work_type: 'production',
        notes: ''
    });
    const [editingId, setEditingId] = useState(null);
    const [viewMode, setViewMode] = useState('daily'); // 'daily' or 'monthly'
    const [confirmModal, setConfirmModal] = useState({ show: false, id: null });

    const fetchData = async () => {
        try {
            const [logsRes, membersRes] = await Promise.all([
                getWorkLogs({
                    startDate: formData.date,
                    endDate: formData.date
                }),
                getActiveMembers()
            ]);
            setWorkLogs(logsRes.data.data);
            setMembers(membersRes.data.data);
            setLoading(false);
        } catch (error) {
            toast.error("Failed to fetch data");
            setLoading(false);
        }
    };

    const fetchMonthlyTotals = async () => {
        try {
            const date = new Date(formData.date);
            const res = await getMonthlyTotal({
                year: date.getFullYear(),
                month: date.getMonth() + 1
            });
            setMonthlyTotals(res.data.data);
        } catch (error) {
            toast.error("Failed to fetch monthly totals");
        }
    };

    useEffect(() => {
        fetchData();
        if (viewMode === 'monthly') {
            fetchMonthlyTotals();
        }
    }, [formData.date, viewMode]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await updateWorkLog(editingId, formData);
                toast.success("Work log updated!");
            } else {
                await createWorkLog(formData);
                toast.success("Work log added!");
            }
            resetForm();
            fetchData();
            if (viewMode === 'monthly') fetchMonthlyTotals();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to save work log");
        }
    };

    const handleEdit = (log) => {
        setFormData({
            member_id: log.member_id,
            date: log.date,
            units_produced: log.units_produced,
            rate_per_unit: log.rate_per_unit,
            work_type: log.work_type || 'production',
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
            fetchData();
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
            date: selectedDate,
            units_produced: '',
            rate_per_unit: '',
            work_type: 'production',
            notes: ''
        });
        setEditingId(null);
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-[40px] p-8 sm:p-10 w-full max-w-5xl shadow-2xl relative animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto custom-scrollbar">
                <button
                    onClick={onClose}
                    className="absolute top-8 right-8 text-slate-400 hover:text-slate-800 transition-colors"
                >
                    <FaTimes className="text-xl" />
                </button>

                <div className="mb-8 font-['Outfit']">
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                        <div className="w-2 h-8 bg-indigo-600 rounded-full"></div>
                        Daily Work Log
                    </h2>
                    <p className="text-slate-500 text-sm mt-2 ml-5">Track daily production and calculate earnings</p>
                </div>

                {/* View Toggle */}
                <div className="flex bg-slate-100 p-1 rounded-xl mb-6 w-fit">
                    <button
                        onClick={() => setViewMode('daily')}
                        className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'daily' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                    >
                        Daily Entry
                    </button>
                    <button
                        onClick={() => setViewMode('monthly')}
                        className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'monthly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                    >
                        Monthly Summary
                    </button>
                </div>

                {viewMode === 'daily' ? (
                    <>
                        {/* Add/Edit Form */}
                        <form onSubmit={handleSubmit} className="mb-8 p-6 bg-slate-50 rounded-3xl border border-slate-100 font-['Outfit']">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">
                                        Member *
                                    </label>
                                    <select
                                        required
                                        value={formData.member_id}
                                        onChange={(e) => handleMemberChange(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-3 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer"
                                    >
                                        <option value="">Select Member</option>
                                        {members.map(m => (
                                            <option key={m.id} value={m.id}>
                                                {m.name} - {m.wage_type === 'piece_rate' ? 'Piece Rate' : m.wage_type === 'monthly' ? 'Monthly' : 'Daily'}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">
                                        <FaCalendarAlt className="inline mr-1" /> Date *
                                    </label>
                                    <input
                                        required
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-3 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">
                                        <FaBoxes className="inline mr-1" /> Units Produced *
                                    </label>
                                    <input
                                        required
                                        type="number"
                                        step="0.01"
                                        value={formData.units_produced}
                                        onChange={(e) => setFormData({ ...formData, units_produced: e.target.value })}
                                        placeholder="e.g., 100"
                                        className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-3 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">
                                        <FaMoneyBillWave className="inline mr-1" /> Rate per Unit *
                                    </label>
                                    <input
                                        required
                                        type="number"
                                        step="0.01"
                                        value={formData.rate_per_unit}
                                        onChange={(e) => setFormData({ ...formData, rate_per_unit: e.target.value })}
                                        placeholder="e.g., 5.50"
                                        className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-3 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">
                                        <FaStickyNote className="inline mr-1" /> Notes
                                    </label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        placeholder="Optional notes..."
                                        rows="2"
                                        className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-3 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <FaPlus />
                                    {editingId ? 'Update Log' : 'Add Log'}
                                </button>
                                {editingId && (
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="px-6 bg-slate-200 hover:bg-slate-300 text-slate-700 py-3 rounded-2xl text-sm font-black uppercase tracking-widest transition-all"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                            {formData.units_produced && formData.rate_per_unit && (
                                <div className="mt-4 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Amount</p>
                                    <p className="text-2xl font-black text-indigo-600">
                                        ₹{(parseFloat(formData.units_produced) * parseFloat(formData.rate_per_unit)).toFixed(2)}
                                    </p>
                                </div>
                            )}
                        </form>

                        {/* Today's Logs */}
                        <div className="space-y-3 font-['Outfit']">
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">
                                Logs for {new Date(formData.date).toLocaleDateString('en-GB')} ({workLogs.length})
                            </h3>
                            {loading ? (
                                <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
                                </div>
                            ) : workLogs.length > 0 ? (
                                workLogs.map(log => (
                                    <div
                                        key={log.id}
                                        className="bg-white border border-slate-100 rounded-2xl p-5 hover:border-indigo-200 transition-all group"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h4 className="text-lg font-black text-slate-900">{log.member_name}</h4>
                                                    <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                                                        {log.units_produced} units
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 text-sm text-slate-500">
                                                    <div className="flex items-center gap-2">
                                                        <FaMoneyBillWave className="text-slate-400 text-xs" />
                                                        <span className="font-medium">₹{log.rate_per_unit}/unit</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-black text-emerald-600">₹{log.total_amount}</span>
                                                    </div>
                                                </div>
                                                {log.notes && (
                                                    <p className="text-xs text-slate-400 mt-2 italic">{log.notes}</p>
                                                )}
                                            </div>
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEdit(log)}
                                                    className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                                >
                                                    <FaEdit />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(log.id)}
                                                    className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 text-slate-400">
                                    <FaBoxes className="text-4xl mx-auto mb-3 opacity-20" />
                                    <p className="text-sm font-bold uppercase tracking-widest">No logs for this date</p>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    /* Monthly Summary */
                    <div className="space-y-4 font-['Outfit']">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">
                            Monthly Summary - {new Date(formData.date).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                        </h3>
                        {monthlyTotals.length > 0 ? (
                            monthlyTotals.map(total => (
                                <div key={total.member_id} className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-3xl p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-xl font-black text-slate-900">{total.member_name}</h4>
                                        <span className="text-xs font-black text-indigo-600 bg-white px-3 py-1 rounded-full">
                                            {total.days_worked} days
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white rounded-2xl p-4">
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Units</p>
                                            <p className="text-2xl font-black text-slate-900">{total.total_units}</p>
                                        </div>
                                        <div className="bg-white rounded-2xl p-4">
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Earnings</p>
                                            <p className="text-2xl font-black text-emerald-600">₹{parseFloat(total.total_earnings).toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 text-slate-400">
                                <FaMoneyBillWave className="text-4xl mx-auto mb-3 opacity-20" />
                                <p className="text-sm font-bold uppercase tracking-widest">No data for this month</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

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
        </div>
    );
};

export default DailyWorkLogManager;
