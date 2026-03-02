import React, { useState, useEffect } from 'react';
import { FaTruck, FaClock, FaMoneyBillWave, FaGasPump, FaPlus, FaTrash, FaEdit, FaRoad, FaCheck, FaTimes, FaFilter, FaSearch, FaCalendarAlt } from 'react-icons/fa';
import { getVehicleLogs, createVehicleLog, updateVehicleLog, deleteVehicleLog } from '../../api/Expense/mfgExpense';
import toast from 'react-hot-toast';
import ConfirmModal from '../modals/ConfirmModal';
import ExportButtons from './ExportButtons';
import { exportVehicleLogToCSV, exportVehicleLogToTXT, exportVehicleLogToPDF } from '../../utils/exportUtils/index.js';

const VehicleTrackerManager = ({ data: externalData, onUpdate, members = [] }) => {
    const [logs, setLogs] = useState(externalData || []);
    const [loading, setLoading] = useState(!externalData);
    const [periodType, setPeriodType] = useState('month');
    const [currentPeriod, setCurrentPeriod] = useState(new Date().toISOString().slice(0, 7)); // Default to current month
    const [customRange, setCustomRange] = useState({ start: '', end: '' });
    const [searchVehicle, setSearchVehicle] = useState('');

    // Derived state for filtering
    const filteredLogs = logs.filter(log => {
        const logDateV = new Date(log.out_time || log.created_at || Date.now());
        const logDate = logDateV.toISOString().split('T')[0];

        let matchDate = false;
        if (periodType === 'day') {
            matchDate = logDate === currentPeriod;
        } else if (periodType === 'month') {
            matchDate = logDate.startsWith(currentPeriod);
        } else if (periodType === 'year') {
            matchDate = logDate.startsWith(currentPeriod);
        } else if (periodType === 'range') {
            matchDate = (!customRange.start || logDate >= customRange.start) &&
                (!customRange.end || logDate <= customRange.end);
        }

        const term = searchVehicle.toLowerCase();
        const matchSearch = !term ||
            (log.vehicle_name && log.vehicle_name.toLowerCase().includes(term)) ||
            (log.vehicle_number && log.vehicle_number.toLowerCase().includes(term)) ||
            (log.driver_name && log.driver_name.toLowerCase().includes(term));

        return matchDate && matchSearch;
    });

    const [formData, setFormData] = useState({
        vehicle_name: '',
        vehicle_number: '',
        driver_name: '',
        member_id: '',
        guest_name: '',
        in_time: '',
        out_time: '',
        start_km: '',
        end_km: '',
        expense_amount: '',
        income_amount: '',
        notes: ''
    });
    const [editingId, setEditingId] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ show: false, id: null });

    useEffect(() => {
        if (externalData) {
            setLogs(externalData);
            setLoading(false);
        } else {
            fetchLogs();
        }
    }, [externalData]);

    const lastFetchRef = React.useRef(0);

    const fetchLogs = async (force = false) => {
        const now = Date.now();
        // Throttle fetching (60s cache/throttle)
        if (!force && now - lastFetchRef.current < 60000 && !loading) {
            return;
        }

        // Request Deduplication
        if (!force && window._mfgVehicleLogFetchPromise) {
            try {
                const res = await window._mfgVehicleLogFetchPromise;
                setLogs(res.data || []);
                lastFetchRef.current = Date.now();
            } catch (error) {
                console.error("Error joining existing fetch:", error);
            } finally {
                setLoading(false);
            }
            return;
        }

        if (force) {
            window._mfgVehicleLogFetchPromise = null;
        }

        setLoading(true);
        const fetchPromise = getVehicleLogs();

        if (!force) {
            window._mfgVehicleLogFetchPromise = fetchPromise;
        }

        try {
            const data = await fetchPromise;
            setLogs(data?.data || []);
            lastFetchRef.current = Date.now();
        } catch (error) {
            toast.error('Failed to load vehicle logs');
        } finally {
            if (!force) {
                window._mfgVehicleLogFetchPromise = null;
            }
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Determine driver name from member selection if applicable
            let finalDriverName = formData.guest_name;
            let finalMemberId = null;
            if (formData.member_id) {
                const member = members.find(m => m.id == formData.member_id);
                if (member) {
                    finalDriverName = member.name;
                    finalMemberId = member.id;
                }
            } else if (!formData.guest_name && formData.driver_name) {
                // Fallback if somehow using old state
                finalDriverName = formData.driver_name;
            }

            const payload = {
                ...formData,
                driver_name: finalDriverName,
                member_id: finalMemberId,
                sector: 'manufacturing',
                start_km: parseFloat(formData.start_km) || 0,
                end_km: parseFloat(formData.end_km) || 0,
                expense_amount: parseFloat(formData.expense_amount) || 0,
                income_amount: parseFloat(formData.income_amount) || 0
            };

            if (editingId) {
                await updateVehicleLog(editingId, payload);
                toast.success('Log updated successfully');
            } else {
                await createVehicleLog(payload);
                toast.success('Log created successfully');
            }
            setFormData({
                vehicle_name: '',
                vehicle_number: '',
                driver_name: '',
                member_id: '',
                guest_name: '',
                in_time: '',
                out_time: '',
                start_km: '',
                end_km: '',
                expense_amount: '',
                income_amount: '',
                notes: ''
            });
            setEditingId(null);
            if (onUpdate) {
                onUpdate(true);
            } else {
                fetchLogs(true);
            }
        } catch (error) {
            toast.error('Operation failed');
            console.error(error);
        }
    };

    const handleEdit = (log) => {
        setFormData({
            ...log,
            guest_name: !log.member_id ? (log.driver_name || 'Guest') : '',
            member_id: log.member_id || '',
            in_time: log.in_time ? new Date(log.in_time).toISOString().slice(0, 16) : '',
            out_time: log.out_time ? new Date(log.out_time).toISOString().slice(0, 16) : ''
        });
        setEditingId(log.id);
    };

    const handleDelete = async () => {
        if (confirmModal.id) {
            try {
                await deleteVehicleLog(confirmModal.id);
                toast.success('Log deleted');
                if (onUpdate) {
                    onUpdate(true);
                } else {
                    fetchLogs(true);
                }
            } catch (error) {
                toast.error('Failed to delete');
            } finally {
                setConfirmModal({ show: false, id: null });
            }
        }
    };

    const formatDateTime = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="animate-in slide-in-from-right-10 duration-500 pb-20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <FaTruck className="text-blue-600" /> Vehicle Tracker
                </h2>
                <div className="flex bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-100">
                    Fleet Management
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-[24px] sm:rounded-[40px] p-5 sm:p-8 border border-slate-100 shadow-sm sticky top-8">
                        <h3 className="text-[16px] sm:text-lg font-black text-slate-900 mb-5 sm:mb-6 flex items-center gap-2">
                            {editingId ? <FaEdit className="text-blue-500" /> : <FaPlus className="text-emerald-500" />}
                            {editingId ? 'Edit Log Entry' : 'New Entry'}
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Vehicle Details</label>
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        placeholder="Vehicle Name (e.g., Truck A)"
                                        value={formData.vehicle_name}
                                        onChange={e => setFormData({ ...formData, vehicle_name: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-blue-500 transition-all"
                                    />
                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                            type="text"
                                            placeholder="Vehicle No."
                                            value={formData.vehicle_number}
                                            onChange={e => setFormData({ ...formData, vehicle_number: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-blue-500 transition-all uppercase"
                                            required
                                        />
                                        <div>
                                            <div className="flex justify-between items-center mb-1.5 px-1">
                                                <div className="flex bg-slate-200 p-0.5 rounded-md">
                                                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, member_id: '', guest_name: '' }))} className={`px-1.5 py-0.5 rounded text-[8px] font-black transition-all ${!formData.guest_name ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>MEMBER</button>
                                                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, member_id: '', guest_name: 'Guest' }))} className={`px-1.5 py-0.5 rounded text-[8px] font-black transition-all ${formData.guest_name ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>GUEST</button>
                                                </div>
                                            </div>
                                            {formData.guest_name !== undefined && formData.guest_name !== null && typeof formData.guest_name === 'string' && formData.guest_name.length >= 0 && (formData.member_id === '' || formData.member_id === null) && formData.guest_name !== '' ? (
                                                <input type="text" value={formData.guest_name === 'Guest' ? '' : formData.guest_name} onChange={(e) => setFormData({ ...formData, guest_name: e.target.value, member_id: '' })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all" placeholder="Driver (Guest Name)" />
                                            ) : (
                                                <select value={formData.member_id} onChange={(e) => setFormData({ ...formData, member_id: e.target.value, guest_name: '' })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all cursor-pointer">
                                                    <option value="">Select Member</option>
                                                    {Array.isArray(members) && members.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                                </select>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Timing</label>
                                <div className="space-y-3">
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 text-[10px] font-black uppercase">OUT</span>
                                        <input
                                            type="datetime-local"
                                            value={formData.out_time}
                                            onChange={e => setFormData({ ...formData, out_time: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-xs font-bold outline-none focus:border-blue-500 transition-all"
                                        />
                                    </div>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 text-[10px] font-black uppercase">IN</span>
                                        <input
                                            type="datetime-local"
                                            value={formData.in_time}
                                            onChange={e => setFormData({ ...formData, in_time: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-xs font-bold outline-none focus:border-blue-500 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Odometer (KM)</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        type="number"
                                        placeholder="Start KM"
                                        value={formData.start_km}
                                        onChange={e => setFormData({ ...formData, start_km: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-blue-500 transition-all"
                                    />
                                    <input
                                        type="number"
                                        placeholder="End KM"
                                        value={formData.end_km}
                                        onChange={e => setFormData({ ...formData, end_km: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-blue-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Financials (₹)</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-300"><FaGasPump size={10} /></span>
                                        <input
                                            type="number"
                                            placeholder="Expense"
                                            value={formData.expense_amount}
                                            onChange={e => setFormData({ ...formData, expense_amount: e.target.value })}
                                            className="w-full bg-rose-50 border border-rose-100 rounded-xl pl-8 pr-4 py-3 text-xs font-bold text-rose-600 outline-none focus:border-rose-300 transition-all placeholder-rose-300"
                                        />
                                    </div>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-300"><FaMoneyBillWave size={10} /></span>
                                        <input
                                            type="number"
                                            placeholder="Income"
                                            value={formData.income_amount}
                                            onChange={e => setFormData({ ...formData, income_amount: e.target.value })}
                                            className="w-full bg-emerald-50 border border-emerald-100 rounded-xl pl-8 pr-4 py-3 text-xs font-bold text-emerald-600 outline-none focus:border-emerald-300 transition-all placeholder-emerald-300"
                                        />
                                    </div>
                                </div>
                            </div>

                            <textarea
                                placeholder="Notes / Purpose..."
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-blue-500 transition-all resize-none h-20"
                            ></textarea>

                            <div className="flex gap-3 pt-2">
                                {editingId && (
                                    <button
                                        type="button"
                                        onClick={() => { setEditingId(null); setFormData({ vehicle_name: '', vehicle_number: '', driver_name: '', in_time: '', out_time: '', start_km: '', end_km: '', expense_amount: '', income_amount: '', notes: '' }); }}
                                        className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                                    >
                                        Cancel
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/30 hover:bg-blue-500 hover:scale-[1.02] transition-all"
                                >
                                    {editingId ? 'Update Log' : 'Save Entry'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* List Section */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Filters Bar */}
                    <div className="bg-white/80 backdrop-blur-xl p-[12px] sm:p-4 rounded-[16px] sm:rounded-2xl border border-white/20 shadow-xl shadow-slate-200/50 mb-[14px] sm:mb-8 sticky top-2 z-10">
                        <div className="flex flex-col xl:flex-row gap-3 sm:gap-4">
                            {/* Period Selector and Date Input Group */}
                            <div className="flex flex-col sm:flex-row gap-2 p-[6px] sm:p-1.5 bg-slate-50 rounded-[14px] sm:rounded-2xl border border-slate-100 shrink-0">
                                {/* Period Tabs */}
                                <div className="flex bg-white rounded-[10px] sm:rounded-xl shadow-sm p-1 gap-1">
                                    {['day', 'month', 'year', 'range'].map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => {
                                                setPeriodType(type);
                                                if (type === 'year') setCurrentPeriod(new Date().getFullYear().toString());
                                                if (type === 'month') setCurrentPeriod(new Date().toISOString().slice(0, 7));
                                                if (type === 'day') setCurrentPeriod(new Date().toISOString().split('T')[0]);
                                            }}
                                            className={`
                                                flex-1 px-3 sm:px-4 h-7 sm:h-8 rounded-[8px] sm:rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all outline-none focus:outline-none ring-0 whitespace-nowrap
                                                ${periodType === type
                                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                                                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                                                }
                                            `}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                                {/* Date Input Dynamic */}
                                <div className="px-2 sm:px-3 flex items-center w-full sm:w-auto sm:min-w-[140px] border-t sm:border-t-0 sm:border-l border-slate-200 mt-1 sm:mt-0 pt-2 sm:pt-0 sm:pl-4 sm:ml-2 overflow-hidden">
                                    <FaCalendarAlt className="text-slate-300 mr-2 shrink-0" size={12} />
                                    {periodType === 'day' ? (
                                        <input
                                            type="date"
                                            value={currentPeriod}
                                            onChange={(e) => setCurrentPeriod(e.target.value)}
                                            className="w-full text-[11px] sm:text-xs font-bold text-slate-700 outline-none bg-transparent font-mono cursor-pointer"
                                        />
                                    ) : periodType === 'month' ? (
                                        <input
                                            type="month"
                                            value={currentPeriod}
                                            onChange={(e) => setCurrentPeriod(e.target.value)}
                                            className="w-full text-[11px] sm:text-xs font-bold text-slate-700 outline-none bg-transparent font-mono cursor-pointer"
                                        />
                                    ) : periodType === 'year' ? (
                                        <input
                                            type="number"
                                            min="2000"
                                            max="2100"
                                            value={currentPeriod}
                                            onChange={(e) => setCurrentPeriod(e.target.value)}
                                            className="w-full text-[11px] sm:text-xs font-bold text-slate-700 outline-none bg-transparent font-mono"
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="date"
                                                value={customRange.start}
                                                onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })}
                                                className="bg-transparent text-[10px] sm:text-xs font-bold text-slate-700 outline-none p-1 cursor-pointer"
                                            />
                                            <span className="text-slate-300 text-[10px] sm:text-xs">to</span>
                                            <input
                                                type="date"
                                                value={customRange.end}
                                                onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })}
                                                className="bg-transparent text-[10px] sm:text-xs font-bold text-slate-700 outline-none p-1 cursor-pointer"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 relative group">
                                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={12} />
                                <input
                                    type="text"
                                    placeholder="Find vehicle, number or driver..."
                                    value={searchVehicle}
                                    onChange={(e) => setSearchVehicle(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-[12px] sm:rounded-xl pl-10 pr-4 py-2 sm:py-2.5 text-[11px] font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-all"
                                />
                            </div>

                            <ExportButtons
                                onExportCSV={() => exportVehicleLogToCSV(filteredLogs, 'Vehicle_Log_Report')}
                                onExportPDF={() => exportVehicleLogToPDF({ data: filteredLogs, filename: 'Vehicle_Log_Report' })}
                                onExportTXT={() => exportVehicleLogToTXT({ data: filteredLogs, filename: 'Vehicle_Log_Report' })}
                            />
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                        <div className="bg-emerald-50 p-4 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-emerald-100 flex flex-col items-center sm:items-start text-center sm:text-left">
                            <p className="text-[9px] sm:text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-1">Total Income</p>
                            <p className="text-[18px] sm:text-xl font-black text-emerald-600">₹{filteredLogs.reduce((acc, log) => acc + (parseFloat(log.income_amount) || 0), 0).toLocaleString()}</p>
                        </div>
                        <div className="bg-rose-50 p-4 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-rose-100 flex flex-col items-center sm:items-start text-center sm:text-left">
                            <p className="text-[9px] sm:text-[8px] font-black text-rose-400 uppercase tracking-widest mb-1">Total Expenses</p>
                            <p className="text-[18px] sm:text-xl font-black text-rose-600">₹{filteredLogs.reduce((acc, log) => acc + (parseFloat(log.expense_amount) || 0), 0).toLocaleString()}</p>
                        </div>
                        <div className="bg-blue-50 p-4 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-blue-100 flex flex-col items-center sm:items-start text-center sm:text-left">
                            <p className="text-[9px] sm:text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1">Net Profit</p>
                            <p className="text-[18px] sm:text-xl font-black text-blue-600">₹{(filteredLogs.reduce((acc, log) => acc + (parseFloat(log.income_amount) || 0), 0) - filteredLogs.reduce((acc, log) => acc + (parseFloat(log.expense_amount) || 0), 0)).toLocaleString()}</p>
                        </div>
                    </div>

                    {/* Logs List */}
                    <div className="space-y-4">
                        {loading ? (
                            <div className="p-8 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">Loading records...</div>
                        ) : filteredLogs.length === 0 ? (
                            <div className="p-12 text-center bg-white rounded-[32px] border border-slate-100">
                                <FaTruck className="mx-auto text-4xl text-slate-200 mb-4" />
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No vehicle logs found</p>
                            </div>
                        ) : (
                            filteredLogs.map(log => (
                                <div key={log.id} className="bg-white p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">


                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                                        <div className="flex-1 w-full">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-[36px] h-[36px] sm:w-10 sm:h-10 bg-slate-900 text-white rounded-[10px] sm:rounded-xl flex items-center justify-center font-black text-[10px] sm:text-xs shrink-0">
                                                    {log.vehicle_number.slice(-4)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <h4 className="text-[14px] sm:text-[16px] font-black text-slate-900 uppercase tracking-tight truncate">{log.vehicle_name ? `${log.vehicle_name} - ` : ''}{log.vehicle_number}</h4>
                                                        <div className="flex sm:hidden gap-1 shrink-0">
                                                            <button onClick={() => handleEdit(log)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><FaEdit size={14} /></button>
                                                            <button onClick={() => setConfirmModal({ show: true, id: log.id })} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"><FaTrash size={14} /></button>
                                                        </div>
                                                    </div>
                                                    <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{log.driver_name || 'No Driver'}</p>
                                                </div>
                                            </div>

                                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-[9px] sm:text-[10px] font-bold text-slate-500 bg-slate-50 w-full sm:w-fit px-3 py-2 sm:py-1.5 rounded-[12px] sm:rounded-lg mb-3">
                                                <div className="flex items-center gap-1.5">
                                                    <FaClock className="text-slate-400 shrink-0" />
                                                    <span className="truncate">OUT: {formatDateTime(log.out_time)}</span>
                                                </div>
                                                <div className="hidden sm:block w-1 h-3 bg-slate-200"></div>
                                                <div className="flex items-center gap-1.5">
                                                    <FaClock className="text-slate-400 shrink-0" />
                                                    <span className="truncate">IN: {formatDateTime(log.in_time)}</span>
                                                </div>
                                            </div>

                                            {log.notes && <p className="text-[11px] sm:text-xs font-medium text-slate-600 italic bg-blue-50/50 p-2.5 sm:p-3 rounded-[12px] sm:rounded-xl">{log.notes}</p>}
                                        </div>

                                        <div className="hidden sm:flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 w-0 group-hover:w-auto overflow-hidden shrink-0">
                                            <button onClick={() => handleEdit(log)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-colors"><FaEdit size={16} /></button>
                                            <button onClick={() => setConfirmModal({ show: true, id: log.id })} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"><FaTrash size={16} /></button>
                                        </div>

                                        <div className="flex flex-row sm:flex-col justify-between sm:justify-center gap-2 sm:gap-3 sm:text-right border-t sm:border-t-0 sm:border-l border-slate-100 pt-3 sm:pt-0 sm:pl-6 w-full sm:w-auto sm:min-w-[140px] shrink-0 text-center sm:text-right">
                                            <div className="flex-1">
                                                <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-0.5">Income</p>
                                                <p className="text-lg font-black text-emerald-600">₹{parseFloat(log.income_amount || 0).toLocaleString()}</p>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[8px] font-black text-rose-400 uppercase tracking-widest mb-0.5">Expense</p>
                                                <p className="text-lg font-black text-rose-600">₹{parseFloat(log.expense_amount || 0).toLocaleString()}</p>
                                            </div>
                                            {(log.end_km && log.start_km) && (
                                                <div className="flex-1">
                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Distance</p>
                                                    <p className="text-sm font-black text-slate-600">{log.end_km - log.start_km} km</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <ConfirmModal
                isOpen={confirmModal.show}
                onCancel={() => setConfirmModal({ show: false, id: null })}
                onConfirm={handleDelete}
                title="Delete Vehicle Log?"
                message="This action cannot be undone."
            />
        </div >
    );
};

export default VehicleTrackerManager;
