import React, { useState, useEffect } from 'react';
import { FaPlus, FaTrash, FaCheckCircle, FaTimesCircle, FaCalendarAlt, FaUser } from 'react-icons/fa';
import {
    getLeaves,
    createLeave,
    updateLeaveStatus,
    deleteLeave
} from '../../api/Attendance/itAttendance';
import toast from 'react-hot-toast';

const LeaveManager = ({ members, currentUser }) => {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        member_id: '',
        leave_type: 'CL',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        reason: ''
    });

    useEffect(() => {
        fetchLeaves();
    }, []);

    const fetchLeaves = async () => {
        try {
            const res = await getLeaves({ sector: 'it' });
            setLeaves(res.data.data);
            setLoading(false);
        } catch (error) {
            toast.error("Failed to load leaves");
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await createLeave({ ...formData, sector: 'it' });
            toast.success("Leave request added");
            setShowModal(false);
            fetchLeaves();
            setFormData({
                member_id: '',
                leave_type: 'CL',
                start_date: new Date().toISOString().split('T')[0],
                end_date: new Date().toISOString().split('T')[0],
                reason: ''
            });
        } catch (error) {
            toast.error("Failed to add leave request");
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            await updateLeaveStatus(id, status);
            toast.success(`Leave request ${status}`);
            fetchLeaves();
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            await deleteLeave(id);
            toast.success("Leave request deleted");
            fetchLeaves();
        } catch (error) {
            toast.error("Failed to delete request");
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">Leave Requests</h2>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors shadow-lg shadow-blue-500/20"
                >
                    <FaPlus /> Request Leave
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {leaves.map(leave => (
                    <div key={leave.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                                    <FaUser />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">{leave.member_name}</h3>
                                    <p className="text-xs text-slate-500">{leave.leave_type} Leave</p>
                                </div>
                            </div>
                            <span className={`px-2 py-1 rounded-lg text-xs font-bold uppercase ${leave.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                leave.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                    'bg-amber-100 text-amber-700'
                                }`}>
                                {leave.status}
                            </span>
                        </div>

                        <div className="space-y-3 mb-4">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <FaCalendarAlt className="text-slate-400" />
                                <span>{new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                "{leave.reason}"
                            </p>
                        </div>

                        <div className="flex gap-2 pt-4 border-t border-slate-100">
                            {leave.status === 'pending' && (
                                <>
                                    <button
                                        onClick={() => handleStatusUpdate(leave.id, 'approved')}
                                        className="flex-1 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors"
                                    >
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleStatusUpdate(leave.id, 'rejected')}
                                        className="flex-1 py-2 bg-amber-50 text-amber-600 rounded-lg text-xs font-bold hover:bg-amber-100 transition-colors"
                                    >
                                        Reject
                                    </button>
                                </>
                            )}
                            <button
                                onClick={() => handleDelete(leave.id)}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-auto"
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
                        <h3 className="text-xl font-bold mb-4">Request Leave</h3>
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
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type</label>
                                <select
                                    value={formData.leave_type}
                                    onChange={e => setFormData({ ...formData, leave_type: e.target.value })}
                                    className="w-full p-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                                >
                                    <option value="CL">Casual Leave (CL)</option>
                                    <option value="SL">Sick Leave (SL)</option>
                                    <option value="EL">Earned Leave (EL)</option>
                                    <option value="OD">On Duty (OD)</option>
                                    <option value="Unpaid">Unpaid Leave</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.start_date}
                                        onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                                        className="w-full p-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">End Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.end_date}
                                        onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                                        className="w-full p-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Reason</label>
                                <textarea
                                    required
                                    value={formData.reason}
                                    onChange={e => setFormData({ ...formData, reason: e.target.value })}
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
                                    Submit Request
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeaveManager;
