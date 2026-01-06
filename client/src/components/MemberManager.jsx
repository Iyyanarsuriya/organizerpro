import { useState, useEffect } from 'react';
import { getMembers, createMember, updateMember, deleteMember } from '../api/memberApi';
import { getTransactions } from '../api/transactionApi';
import toast from 'react-hot-toast';
import { FaTimes, FaPlus, FaEdit, FaTrash, FaUser, FaBriefcase, FaPhone, FaEnvelope, FaHistory, FaMoneyBillWave, FaUniversity } from 'react-icons/fa';

const MemberManager = ({ onClose, onUpdate }) => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        role: '',
        phone: '',
        email: '',
        wage_type: 'daily',
        daily_wage: '',
        status: 'active'
    });
    const [editingId, setEditingId] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ show: false, id: null });
    const [viewingPayments, setViewingPayments] = useState(null); // Member object
    const [payments, setPayments] = useState([]);
    const [paymentsLoading, setPaymentsLoading] = useState(false);

    const fetchMembers = async () => {
        try {
            const res = await getMembers();
            setMembers(res.data.data);
            setLoading(false);
        } catch (error) {
            toast.error("Failed to fetch members");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await updateMember(editingId, formData);
                toast.success("Member updated!");
            } else {
                await createMember(formData);
                toast.success("Member added!");
            }
            resetForm();
            fetchMembers();
            if (onUpdate) onUpdate();
        } catch (error) {
            toast.error(editingId ? "Failed to update member" : "Failed to add member");
        }
    };

    const handleEdit = (member) => {
        setFormData({
            name: member.name,
            role: member.role || '',
            phone: member.phone || '',
            email: member.email || '',
            wage_type: member.wage_type || 'daily',
            daily_wage: member.daily_wage || '',
            status: member.status
        });
        setEditingId(member.id);
    };

    const handleDeleteClick = (id) => {
        setDeleteModal({ show: true, id });
    };

    const confirmDelete = async () => {
        try {
            await deleteMember(deleteModal.id);
            toast.success("Member deleted");
            setDeleteModal({ show: false, id: null });
            fetchMembers();
            if (onUpdate) onUpdate();
        } catch (error) {
            toast.error("Failed to delete member");
        }
    };

    const resetForm = () => {
        setFormData({ name: '', role: '', phone: '', email: '', wage_type: 'daily', daily_wage: '', status: 'active' });
        setEditingId(null);
    };

    const handleViewPayments = async (member) => {
        setViewingPayments(member);
        setPaymentsLoading(true);
        try {
            const res = await getTransactions({ memberId: member.id });
            setPayments(res.data);
        } catch (error) {
            toast.error("Failed to fetch history");
        } finally {
            setPaymentsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-[40px] p-8 sm:p-10 w-full max-w-4xl shadow-2xl relative animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto custom-scrollbar">
                <button
                    onClick={onClose}
                    className="absolute top-8 right-8 text-slate-400 hover:text-slate-800 transition-colors"
                >
                    <FaTimes className="text-xl" />
                </button>

                <div className="mb-8 font-['Outfit']">
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                        <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
                        Manage Members
                    </h2>
                    <p className="text-slate-500 text-sm mt-2 ml-5">Add and manage people in your list</p>
                </div>

                {/* Add/Edit Form */}
                <form onSubmit={handleSubmit} className="mb-8 p-6 bg-slate-50 rounded-3xl border border-slate-100 font-['Outfit']">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">
                                <FaUser className="inline mr-1" /> Name *
                            </label>
                            <input
                                required
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Full name"
                                className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">
                                <FaBriefcase className="inline mr-1" /> Role/Group
                            </label>
                            <input
                                type="text"
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                placeholder="e.g. Student, Staff, Regular"
                                className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">
                                <FaPhone className="inline mr-1" /> Phone
                            </label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="Contact number"
                                className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">
                                <FaEnvelope className="inline mr-1" /> Email
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="Email address"
                                className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">
                                Salary Type
                            </label>
                            <select
                                value={formData.wage_type}
                                onChange={(e) => setFormData({ ...formData, wage_type: e.target.value })}
                                className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all cursor-pointer"
                            >
                                <option value="daily">Daily Wage</option>
                                <option value="monthly">Monthly Salary</option>
                                <option value="piece_rate">Piece Rate</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">
                                {formData.wage_type === 'piece_rate' ? 'Rate per Unit' : formData.wage_type === 'monthly' ? 'Monthly Salary' : 'Daily Wage'}
                            </label>
                            <input
                                type="number"
                                value={formData.daily_wage}
                                onChange={(e) => setFormData({ ...formData, daily_wage: e.target.value })}
                                placeholder="0.00"
                                className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">
                                Status
                            </label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all cursor-pointer"
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            type="submit"
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                        >
                            <FaPlus />
                            {editingId ? 'Update Member' : 'Add Member'}
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
                </form>

                {/* Members List */}
                <div className="space-y-3 font-['Outfit']">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">
                        All Members ({members.length})
                    </h3>
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                        </div>
                    ) : members.length > 0 ? (
                        members.map(member => (
                            <div
                                key={member.id}
                                className="bg-white border border-slate-100 rounded-2xl p-5 hover:border-blue-200 transition-all group"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h4 className="text-lg font-black text-slate-900">{member.name}</h4>
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${member.status === 'active'
                                                ? 'bg-emerald-50 text-emerald-600'
                                                : 'bg-slate-100 text-slate-500'
                                                }`}>
                                                {member.status}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-500">
                                            {member.role && (
                                                <div className="flex items-center gap-2">
                                                    <FaBriefcase className="text-slate-400 text-xs" />
                                                    <span className="font-medium">{member.role}</span>
                                                </div>
                                            )}
                                            {member.phone && (
                                                <div className="flex items-center gap-2">
                                                    <FaPhone className="text-slate-400 text-xs" />
                                                    <span className="font-medium">{member.phone}</span>
                                                </div>
                                            )}
                                            {member.email && (
                                                <div className="flex items-center gap-2">
                                                    <FaEnvelope className="text-slate-400 text-xs" />
                                                    <span className="font-medium">{member.email}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2">
                                                <FaMoneyBillWave className="text-slate-400 text-xs" />
                                                <span className="font-medium">
                                                    {member.wage_type === 'piece_rate' ? 'Piece Rate' : member.wage_type === 'monthly' ? 'Monthly' : 'Daily'}:
                                                    ₹{member.daily_wage || 0}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleViewPayments(member)}
                                            className="p-3 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                                            title="History"
                                        >
                                            <FaUniversity />
                                        </button>
                                        <button
                                            onClick={() => handleEdit(member)}
                                            className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                        >
                                            <FaEdit />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(member.id)}
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
                            <FaUser className="text-4xl mx-auto mb-3 opacity-20" />
                            <p className="text-sm font-bold uppercase tracking-widest">No members yet</p>
                            <p className="text-xs mt-1">Add your first member above</p>
                        </div>
                    )}
                </div>

                {/* Custom Delete Confirmation Modal */}
                {deleteModal.show && (
                    <div className="fixed inset-0 z-110 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white rounded-[32px] p-8 w-full max-w-xs shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 font-['Outfit']">
                            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-6">
                                <FaTrash />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 text-center mb-2">Delete Member?</h3>
                            <p className="text-slate-500 text-[10px] font-bold text-center mb-8 px-2 leading-relaxed uppercase tracking-widest">
                                This action cannot be undone. Their past attendance records will remain in the system.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteModal({ show: false, id: null })}
                                    className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-red-500/20"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* history Modal */}
                {viewingPayments && (
                    <div className="fixed inset-0 z-120 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                        <div className="bg-white rounded-[40px] p-8 sm:p-10 w-full max-w-2xl shadow-2xl relative animate-in zoom-in-95 duration-300 max-h-[85vh] flex flex-col font-['Outfit']">
                            <button
                                onClick={() => setViewingPayments(null)}
                                className="absolute top-8 right-8 text-slate-400 hover:text-slate-800 transition-colors"
                            >
                                <FaTimes className="text-xl" />
                            </button>

                            <div className="mb-8">
                                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                    <div className="w-2 h-8 bg-emerald-500 rounded-full"></div>
                                    Activity History: {viewingPayments.name}
                                </h2>
                                <p className="text-slate-500 text-sm mt-2 ml-5 uppercase font-bold tracking-widest">Linked records for this member</p>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                                {paymentsLoading ? (
                                    <div className="flex justify-center py-20">
                                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
                                    </div>
                                ) : payments.length > 0 ? (
                                    <div className="space-y-4">
                                        {payments.map(p => (
                                            <div key={p.id} className="flex justify-between items-center p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-emerald-200 transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg ${p.type === 'income' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
                                                        {p.type === 'income' ? <FaPlus /> : <FaMoneyBillWave />}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-800">{p.title}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.category}</span>
                                                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                            <span className="text-[10px] font-bold text-slate-400">
                                                                {(() => {
                                                                    const d = new Date(p.date);
                                                                    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
                                                                })()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-xl font-black tracking-tighter ${p.type === 'income' ? 'text-blue-600' : 'text-red-600'}`}>
                                                        {p.type === 'income' ? '+' : '-'}₹{p.amount}
                                                    </p>
                                                    {p.project_name && <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Project: {p.project_name}</p>}
                                                </div>
                                            </div>
                                        ))}
                                        <div className="pt-6 border-t border-slate-100 sticky bottom-0 bg-white">
                                            <div className="flex justify-between items-center p-6 bg-slate-900 rounded-[24px] text-white">
                                                <span className="font-black uppercase tracking-widest text-xs">Total Balance</span>
                                                <span className="text-2xl font-black tracking-tighter">
                                                    ₹{payments.reduce((acc, p) => p.type === 'expense' ? acc + parseFloat(p.amount) : acc - parseFloat(p.amount), 0).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-20 text-slate-400 font-['Outfit']">
                                        <FaHistory className="text-6xl mx-auto mb-4 opacity-10" />
                                        <p className="font-black uppercase tracking-widest text-sm text-slate-300">No records found</p>
                                        <p className="text-[10px] mt-2 font-bold uppercase tracking-widest text-slate-400">Add an expense and link this person to see history</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MemberManager;
