import React, { useState, useEffect } from 'react';
import { FaPlus, FaTrash, FaCheckCircle, FaTimesCircle, FaClock, FaBriefcase, FaUser } from 'react-icons/fa';
import {
    getTimesheets,
    createTimesheet,
    updateTimesheetStatus,
    deleteTimesheet
} from '../../api/Attendance/itAttendance';
import toast from 'react-hot-toast';

const TimesheetManager = ({ members, projects, currentUser }) => {
    const [timesheets, setTimesheets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        member_id: '',
        project_id: '',
        date: new Date().toISOString().split('T')[0],
        task_description: '',
        hours_spent: '',
        is_billable: true
    });

    useEffect(() => {
        fetchTimesheets();
    }, []);

    const fetchTimesheets = async () => {
        try {
            const res = await getTimesheets({ sector: 'it' });
            setTimesheets(res.data.data);
            setLoading(false);
        } catch (error) {
            toast.error("Failed to load timesheets");
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (parseFloat(formData.hours_spent) > 24 || parseFloat(formData.hours_spent) <= 0) {
            toast.error("Hours must be between 0 and 24");
            return;
        }
        try {
            await createTimesheet({ ...formData, sector: 'it' });
            toast.success("Timesheet added");
            setShowModal(false);
            fetchTimesheets();
            setFormData({
                member_id: '',
                project_id: '',
                date: new Date().toISOString().split('T')[0],
                task_description: '',
                hours_spent: '',
                is_billable: true
            });
        } catch (error) {
            toast.error("Failed to add timesheet");
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            await updateTimesheetStatus(id, status);
            toast.success(`Timesheet ${status}`);
            fetchTimesheets();
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const handleDelete = async (id, status) => {
        if (status === 'approved') {
            toast.error("Cannot delete approved timesheet");
            return;
        }
        if (!window.confirm("Are you sure?")) return;
        try {
            await deleteTimesheet(id);
            toast.success("Timesheet deleted");
            fetchTimesheets();
        } catch (error) {
            toast.error("Failed to delete timesheet");
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">Timesheets</h2>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors shadow-lg shadow-blue-500/20"
                >
                    <FaPlus /> Add Entry
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {timesheets.map(ts => (
                    <div key={ts.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden">
                        {ts.status === 'approved' && <div className="absolute top-0 right-0 bg-emerald-500 text-white p-1 rounded-bl-xl"><FaCheckCircle /></div>}
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                    <FaUser />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">{ts.member_name}</h3>
                                    <p className="text-xs text-slate-500">{new Date(ts.date).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <span className={`px-2 py-1 rounded-lg text-xs font-bold uppercase ${ts.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                ts.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                    'bg-amber-100 text-amber-700'
                                }`}>
                                {ts.status}
                            </span>
                        </div>

                        <div className="space-y-3 mb-4">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <FaBriefcase className="text-slate-400" />
                                <span>{ts.project_name || 'No Project'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <FaClock className="text-slate-400" />
                                <span>{ts.hours_spent} Hours</span>
                            </div>
                            <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                {ts.task_description}
                            </p>
                        </div>

                        <div className="flex gap-2 pt-4 border-t border-slate-100">
                            {ts.status === 'pending' && (
                                <>
                                    <button
                                        onClick={() => handleStatusUpdate(ts.id, 'approved')}
                                        className="flex-1 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors"
                                    >
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleStatusUpdate(ts.id, 'rejected')}
                                        className="flex-1 py-2 bg-amber-50 text-amber-600 rounded-lg text-xs font-bold hover:bg-amber-100 transition-colors"
                                    >
                                        Reject
                                    </button>
                                </>
                            )}
                            <button
                                onClick={() => handleDelete(ts.id, ts.status)}
                                disabled={ts.status === 'approved'}
                                className={`p-2 rounded-lg transition-colors ml-auto ${ts.status === 'approved' ? 'text-slate-300 cursor-not-allowed' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'}`}
                            >
                                <FaTrash />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
                        <h3 className="text-xl font-bold mb-4">Add Timesheet Entry</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Member</label>
                                <select
                                    required
                                    value={formData.member_id}
                                    onChange={e => setFormData({ ...formData, member_id: e.target.value })}
                                    className="w-full p-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                                >
                                    <option value="">Select Member</option>
                                    {members.map(m => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Project</label>
                                <select
                                    value={formData.project_id}
                                    onChange={e => setFormData({ ...formData, project_id: e.target.value })}
                                    className="w-full p-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                                >
                                    <option value="">Select Project</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full p-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Hours</label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        required
                                        value={formData.hours_spent}
                                        onChange={e => setFormData({ ...formData, hours_spent: e.target.value })}
                                        className="w-full p-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                                <textarea
                                    required
                                    value={formData.task_description}
                                    onChange={e => setFormData({ ...formData, task_description: e.target.value })}
                                    className="w-full p-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500 h-24 resize-none"
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20"
                                >
                                    Save Entry
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TimesheetManager;
