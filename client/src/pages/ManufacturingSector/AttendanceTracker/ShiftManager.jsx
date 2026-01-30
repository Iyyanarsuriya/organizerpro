import React, { useState } from 'react';
import { FaBusinessTime, FaTrash, FaPlus, FaClock } from 'react-icons/fa';
import toast from 'react-hot-toast';

const ShiftManager = ({ shifts, onAdd, onDelete }) => {
    const [newShift, setNewShift] = useState({ name: '', start_time: '', end_time: '', break_duration: 60, is_default: false });

    const handleAdd = async () => {
        if (!newShift.name || !newShift.start_time || !newShift.end_time) return toast.error("Name and Times are required");
        try {
            await onAdd(newShift);
            toast.success("Shift added");
            setNewShift({ name: '', start_time: '', end_time: '', break_duration: 60, is_default: false });
        } catch (e) { toast.error("Failed to add shift"); }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Delete this shift?")) {
            try {
                await onDelete(id);
                toast.success("Deleted");
            } catch (e) { toast.error("Failed to delete"); }
        }
    };

    return (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
                    <FaBusinessTime />
                </div>
                <div>
                    <h3 className="text-lg font-black text-slate-900">Shifts & Rules</h3>
                    <p className="text-xs font-bold text-slate-400">Configure working hours</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Add Form */}
                <div className="space-y-4">
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">Add Shift</h4>
                        <div className="space-y-3">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Name</label>
                                <input
                                    type="text"
                                    value={newShift.name}
                                    onChange={e => setNewShift({ ...newShift, name: e.target.value })}
                                    className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
                                    placeholder="e.g. Morning Shift"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Start</label>
                                    <input
                                        type="time"
                                        value={newShift.start_time}
                                        onChange={e => setNewShift({ ...newShift, start_time: e.target.value })}
                                        className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">End</label>
                                    <input
                                        type="time"
                                        value={newShift.end_time}
                                        onChange={e => setNewShift({ ...newShift, end_time: e.target.value })}
                                        className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Break (Mins)</label>
                                <input
                                    type="number"
                                    value={newShift.break_duration}
                                    onChange={e => setNewShift({ ...newShift, break_duration: parseInt(e.target.value) })}
                                    className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
                                />
                            </div>
                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="isDefault"
                                    checked={newShift.is_default}
                                    onChange={e => setNewShift({ ...newShift, is_default: e.target.checked })}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                                />
                                <label htmlFor="isDefault" className="text-xs font-bold text-slate-600 cursor-pointer">Set as Default Shift</label>
                            </div>
                            <button
                                onClick={handleAdd}
                                className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                            >
                                <FaPlus className="inline mr-2" /> Add Shift
                            </button>
                        </div>
                    </div>
                </div>

                {/* List */}
                <div className="md:col-span-2">
                    <div className="overflow-hidden rounded-2xl border border-slate-100">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Name</th>
                                    <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Timings</th>
                                    <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Break</th>
                                    <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {shifts.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-8 text-center text-xs font-bold text-slate-400">No shifts defined yet.</td>
                                    </tr>
                                ) : (
                                    shifts.map(s => (
                                        <tr key={s.id} className="hover:bg-slate-50/50">
                                            <td className="px-6 py-3 text-xs font-bold text-slate-700">
                                                {s.name}
                                                {s.is_default === 1 && <span className="ml-2 px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[9px] font-black uppercase">Default</span>}
                                            </td>
                                            <td className="px-6 py-3 text-xs font-bold text-slate-700">
                                                {s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)}
                                            </td>
                                            <td className="px-6 py-3 text-xs font-bold text-slate-700 text-center">{s.break_duration}m</td>
                                            <td className="px-6 py-3 text-right">
                                                <button
                                                    onClick={() => handleDelete(s.id)}
                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShiftManager;
