import React, { useState } from 'react';
import { FaCalendarAlt, FaTrash, FaPlus, FaTag } from 'react-icons/fa';
import toast from 'react-hot-toast';

const CalendarManager = ({ holidays, onAdd, onDelete }) => {
    const [newHoliday, setNewHoliday] = useState({ name: '', date: '', type: 'National' });

    const handleAdd = async () => {
        if (!newHoliday.name || !newHoliday.date) return toast.error("Name and Date are required");
        try {
            await onAdd(newHoliday);
            toast.success("Holiday added");
            setNewHoliday({ name: '', date: '', type: 'National' });
        } catch (e) { toast.error("Failed to add holiday"); }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Delete this holiday?")) {
            try {
                await onDelete(id);
                toast.success("Deleted");
            } catch (e) { toast.error("Failed to delete"); }
        }
    };

    return (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500">
                    <FaCalendarAlt />
                </div>
                <div>
                    <h3 className="text-lg font-black text-slate-900">Calendar & Holidays</h3>
                    <p className="text-xs font-bold text-slate-400">Manage non-working days</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Add Form */}
                <div className="space-y-4">
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">Add Holiday</h4>
                        <div className="space-y-3">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Name</label>
                                <input
                                    type="text"
                                    value={newHoliday.name}
                                    onChange={e => setNewHoliday({ ...newHoliday, name: e.target.value })}
                                    className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-rose-500"
                                    placeholder="e.g. Diwali"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</label>
                                <input
                                    type="date"
                                    value={newHoliday.date}
                                    onChange={e => setNewHoliday({ ...newHoliday, date: e.target.value })}
                                    className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-rose-500"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</label>
                                <select
                                    value={newHoliday.type}
                                    onChange={e => setNewHoliday({ ...newHoliday, type: e.target.value })}
                                    className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-rose-500"
                                >
                                    <option value="National">National</option>
                                    <option value="Regional">Regional</option>
                                    <option value="Company">Company</option>
                                </select>
                            </div>
                            <button
                                onClick={handleAdd}
                                className="w-full py-2.5 bg-rose-500 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20"
                            >
                                <FaPlus className="inline mr-2" /> Add Holiday
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
                                    <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Date</th>
                                    <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Name</th>
                                    <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Type</th>
                                    <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {holidays.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-8 text-center text-xs font-bold text-slate-400">No holidays defined yet.</td>
                                    </tr>
                                ) : (
                                    holidays.map(h => (
                                        <tr key={h.id} className="hover:bg-slate-50/50">
                                            <td className="px-6 py-3 text-xs font-bold text-slate-700">
                                                {new Date(h.date).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-3 text-xs font-bold text-slate-700">{h.name}</td>
                                            <td className="px-6 py-3">
                                                <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${h.type === 'National' ? 'bg-orange-50 text-orange-600' :
                                                    h.type === 'Regional' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                                                    }`}>
                                                    {h.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                <button
                                                    onClick={() => handleDelete(h.id)}
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

export default CalendarManager;
