import React, { useState, useEffect } from 'react';
import { FaTruck, FaClock, FaMoneyBillWave, FaGasPump, FaPlus, FaTrash, FaEdit, FaRoad, FaCheck, FaTimes, FaFilter, FaSearch, FaCalendarAlt } from 'react-icons/fa';
import { getVehicleLogs, createVehicleLog, updateVehicleLog, deleteVehicleLog } from '../../api/Expense/personalExpense';
import toast from 'react-hot-toast';
import ConfirmModal from '../modals/ConfirmModal';
import ExportButtons from './ExportButtons';
import { exportVehicleLogToCSV, exportVehicleLogToTXT, exportVehicleLogToPDF } from '../../utils/exportUtils/index.js';

const VehicleTrackerManager = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [searchVehicle, setSearchVehicle] = useState('');

    // Derived state for filtering
    const filteredLogs = logs.filter(log => {
        const logDateV = new Date(log.out_time || log.created_at || Date.now());
        const logDate = logDateV.toISOString().split('T')[0];

        const matchDate = (!dateRange.start || logDate >= dateRange.start) && (!dateRange.end || logDate <= dateRange.end);

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
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const data = await getVehicleLogs();
            setLogs(data);
        } catch (error) {
            toast.error('Failed to load vehicle logs');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await updateVehicleLog(editingId, formData);
                toast.success('Log updated');
            } else {
                await createVehicleLog(formData);
                toast.success('Log created');
            }
            setFormData({
                vehicle_name: '',
                vehicle_number: '',
                driver_name: '',
                in_time: '',
                out_time: '',
                start_km: '',
                end_km: '',
                expense_amount: '',
                income_amount: '',
                notes: ''
            });
            setEditingId(null);
            fetchLogs();
        } catch (error) {
            toast.error('Operation failed');
            console.error(error);
        }
    };

    const handleEdit = (log) => {
        setFormData({
            vehicle_name: log.vehicle_name || '',
            vehicle_number: log.vehicle_number,
            driver_name: log.driver_name || '',
            in_time: log.in_time ? new Date(log.in_time).toISOString().slice(0, 16) : '',
            out_time: log.out_time ? new Date(log.out_time).toISOString().slice(0, 16) : '',
            start_km: log.start_km || '',
            end_km: log.end_km || '',
            expense_amount: log.expense_amount || '',
            income_amount: log.income_amount || '',
            notes: log.notes || ''
        });
        setEditingId(log.id);
    };

    const handleDelete = async () => {
        if (confirmModal.id) {
            try {
                await deleteVehicleLog(confirmModal.id);
                toast.success('Log deleted');
                fetchLogs();
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
                    <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm sticky top-8">
                        <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
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
                                        <input
                                            type="text"
                                            placeholder="Driver Name"
                                            value={formData.driver_name}
                                            onChange={e => setFormData({ ...formData, driver_name: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-blue-500 transition-all"
                                        />
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

                    {/* Filters & Actions */}
                    <div className="bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm flex flex-col gap-4">
                        <div className="flex flex-col sm:flex-row gap-3 w-full">
                            <div className="flex items-center gap-2 bg-slate-50 px-2 md:px-3 py-2 rounded-xl border border-slate-100 w-full sm:w-auto">
                                <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">From</span>
                                <input
                                    type="date"
                                    value={dateRange.start}
                                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                    className="bg-transparent text-[10px] md:text-xs font-bold text-slate-700 outline-none w-full sm:w-[110px]"
                                />
                            </div>
                            <div className="flex items-center gap-2 bg-slate-50 px-2 md:px-3 py-2 rounded-xl border border-slate-100 w-full sm:w-auto">
                                <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">To</span>
                                <input
                                    type="date"
                                    value={dateRange.end}
                                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                    className="bg-transparent text-[10px] md:text-xs font-bold text-slate-700 outline-none w-full sm:w-[110px]"
                                />
                            </div>
                            {/* Search Input */}
                            <div className="flex-1 relative">
                                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                                <input
                                    type="text"
                                    placeholder="Search Vehicle / Driver..."
                                    value={searchVehicle}
                                    onChange={(e) => setSearchVehicle(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-9 pr-4 py-2 text-[10px] md:text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <ExportButtons
                                onExportCSV={() => exportVehicleLogToCSV(filteredLogs, 'Vehicle_Log_Report')}
                                onExportPDF={() => exportVehicleLogToPDF({ data: filteredLogs, period: 'Custom Range', filename: 'Vehicle_Log_Report' })}
                                onExportTXT={() => exportVehicleLogToTXT({ data: filteredLogs, period: 'Custom Range', filename: 'Vehicle_Log_Report' })}
                            />
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-emerald-50 p-6 rounded-[24px] border border-emerald-100">
                            <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-1">Total Income</p>
                            <p className="text-xl font-black text-emerald-600">₹{filteredLogs.reduce((acc, log) => acc + (parseFloat(log.income_amount) || 0), 0).toLocaleString()}</p>
                        </div>
                        <div className="bg-rose-50 p-6 rounded-[24px] border border-rose-100">
                            <p className="text-[8px] font-black text-rose-400 uppercase tracking-widest mb-1">Total Expenses</p>
                            <p className="text-xl font-black text-rose-600">₹{filteredLogs.reduce((acc, log) => acc + (parseFloat(log.expense_amount) || 0), 0).toLocaleString()}</p>
                        </div>
                        <div className="bg-blue-50 p-6 rounded-[24px] border border-blue-100">
                            <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1">Net Profit</p>
                            <p className="text-xl font-black text-blue-600">₹{(filteredLogs.reduce((acc, log) => acc + (parseFloat(log.income_amount) || 0), 0) - filteredLogs.reduce((acc, log) => acc + (parseFloat(log.expense_amount) || 0), 0)).toLocaleString()}</p>
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
                                <div key={log.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all group relative">


                                    <div className="flex flex-col sm:flex-row items-center gap-6">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xs">
                                                    {log.vehicle_number.slice(-4)}
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-slate-900 uppercase tracking-tight">{log.vehicle_name ? `${log.vehicle_name} - ` : ''}{log.vehicle_number}</h4>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{log.driver_name || 'No Driver'}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 bg-slate-50 w-fit px-3 py-1.5 rounded-lg mb-3">
                                                <div className="flex items-center gap-1.5">
                                                    <FaClock className="text-slate-400" />
                                                    <span>OUT: {formatDateTime(log.out_time)}</span>
                                                </div>
                                                <div className="w-1 h-3 bg-slate-200"></div>
                                                <div className="flex items-center gap-1.5">
                                                    <FaClock className="text-slate-400" />
                                                    <span>IN: {formatDateTime(log.in_time)}</span>
                                                </div>
                                            </div>

                                            {log.notes && <p className="text-xs font-medium text-slate-600 italic bg-blue-50/50 p-3 rounded-xl">{log.notes}</p>}
                                        </div>

                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 w-0 group-hover:w-auto overflow-hidden">
                                            <button onClick={() => handleEdit(log)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-colors shrink-0"><FaEdit size={16} /></button>
                                            <button onClick={() => setConfirmModal({ show: true, id: log.id })} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors shrink-0"><FaTrash size={16} /></button>
                                        </div>

                                        <div className="flex flex-row sm:flex-col gap-3 sm:text-right border-t sm:border-t-0 sm:border-l border-slate-50 pt-4 sm:pt-0 sm:pl-6 min-w-[140px]">
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
