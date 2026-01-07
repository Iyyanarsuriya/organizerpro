import { getMembers, createMember, updateMember, deleteMember } from '../api/memberApi';
import { getMemberRoles, createMemberRole, deleteMemberRole } from '../api/memberRoleApi'; // IMPORTS
import { getTransactions } from '../api/transactionApi';
import toast from 'react-hot-toast';
import { FaTimes, FaPlus, FaEdit, FaTrash, FaUser, FaBriefcase, FaPhone, FaEnvelope, FaHistory, FaMoneyBillWave, FaUniversity } from 'react-icons/fa';
import ConfirmModal from './modals/ConfirmModal';
import RoleManager from './RoleManager'; // IMPORTS
import { useState, useEffect } from 'react';

const MemberManager = ({ onClose, onUpdate }) => {
    const [members, setMembers] = useState([]);
    const [roles, setRoles] = useState([]); // ROLES STATE
    const [showRoleManager, setShowRoleManager] = useState(false); // MANAGER STATE
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        role: '',
        phone: '',
        email: '',
        member_type: 'worker',
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
            const [memRes, roleRes] = await Promise.all([getMembers(), getMemberRoles()]);
            setMembers(memRes.data.data);
            setRoles(roleRes.data.data);
            setLoading(false);
        } catch (error) {
            toast.error("Failed to fetch data");
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
            member_type: member.member_type || 'worker',
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
        setFormData({ name: '', role: '', phone: '', email: '', member_type: 'worker', wage_type: 'daily', daily_wage: '', status: 'active' });
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
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-[12px] pt-[80px] sm:px-4 sm:py-6 sm:pt-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-[20px] sm:rounded-[28px] w-full max-w-[896px] shadow-2xl relative animate-in zoom-in-95 duration-300 max-h-[calc(100vh-92px)] sm:max-h-full flex flex-col font-['Outfit'] overflow-hidden">
                {/* Fixed Header */}
                <div className="flex items-center justify-between px-[16px] sm:px-6 pt-[16px] sm:pt-6 pb-[12px] sm:pb-4 shrink-0 border-b border-slate-100">
                    <div>
                        <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                            <div className="w-1 h-5 bg-blue-600 rounded-full"></div>
                            Manage Members
                        </h2>
                        <p className="text-slate-500 text-[10px] sm:text-xs mt-1 ml-3">Add and manage people in your list</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-800 transition-colors p-1.5 hover:bg-slate-100 rounded-lg"
                    >
                        <FaTimes className="text-lg" />
                    </button>
                </div>


                {/* Scrollable Content */}
                <div className="px-[16px] sm:px-6 py-[16px] sm:py-5 overflow-y-auto custom-scrollbar flex-1">

                    {/* Add/Edit Form */}
                    <form onSubmit={handleSubmit} className="mb-5 p-4 bg-slate-50 rounded-2xl border border-slate-100 font-['Outfit']">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                            <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                                    <FaUser className="inline mr-1 text-[8px]" /> Name *
                                </label>
                                <input
                                    required
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Full name"
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 h-9 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                                    <FaBriefcase className="inline mr-1 text-[8px]" /> Category / Role
                                </label>
                                <div className="flex gap-2">
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 h-9 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all cursor-pointer"
                                    >
                                        <option value="">Select Category</option>
                                        {[...new Set([...roles.map(r => r.name), ...members.map(m => m.role).filter(Boolean)])].sort().map(role => (
                                            <option key={role} value={role}>{role}</option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => setShowRoleManager(true)}
                                        className="w-9 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center hover:bg-purple-50 hover:text-purple-600 transition-all border border-slate-200"
                                        title="Manage Categories"
                                    >
                                        <FaPlus size={10} />
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                                    <FaPhone className="inline mr-1 text-[8px]" /> Phone
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="Contact number"
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 h-9 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                                    <FaEnvelope className="inline mr-1 text-[8px]" /> Email
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="Email address"
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 h-9 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                                    Member Type
                                </label>
                                <select
                                    value={formData.member_type}
                                    onChange={(e) => {
                                        const type = e.target.value;
                                        setFormData({
                                            ...formData,
                                            member_type: type,
                                            wage_type: type === 'employee' ? 'monthly' : 'daily'
                                        });
                                    }}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 h-9 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all cursor-pointer"
                                >
                                    <option value="worker">Worker (Daily/Piece)</option>
                                    <option value="employee">Employee (Monthly)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                                    Salary Type
                                </label>
                                <select
                                    value={formData.wage_type}
                                    onChange={(e) => setFormData({ ...formData, wage_type: e.target.value })}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 h-9 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all cursor-pointer"
                                    disabled={formData.member_type === 'employee' && formData.wage_type === 'monthly'}
                                >
                                    <option value="daily">Daily Wage</option>
                                    <option value="monthly">Monthly Salary</option>
                                    <option value="piece_rate">Piece Rate</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                                    {formData.wage_type === 'piece_rate' ? 'Rate per Unit' : formData.wage_type === 'monthly' ? 'Monthly Salary' : 'Daily Wage'}
                                </label>
                                <input
                                    type="number"
                                    value={formData.daily_wage}
                                    onChange={(e) => setFormData({ ...formData, daily_wage: e.target.value })}
                                    placeholder="0.00"
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 h-9 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                                    Status
                                </label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 h-9 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all cursor-pointer"
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-10 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                            >
                                <FaPlus className="text-[10px]" />
                                {editingId ? 'Update Member' : 'Add Member'}
                            </button>
                            {editingId && (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 h-10 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>

                    {/* Separator */}
                    <div className="border-t border-slate-200 my-4"></div>

                    {/* Members List - Responsive Height with Scroll */}
                    <div className="overflow-y-auto custom-scrollbar max-h-[120px] sm:max-h-[150px] md:max-h-[200px]">
                        <div className="space-y-3 font-['Outfit']">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
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
                                        className="bg-white border border-slate-100 rounded-xl p-4 hover:border-blue-200 transition-all group"
                                    >
                                        <div className="flex items-start justify-between gap-[16px]">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h4 className="text-[18px] font-black text-slate-900">{member.name}</h4>
                                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${member.member_type === 'employee'
                                                        ? 'bg-blue-50 text-blue-600'
                                                        : 'bg-amber-50 text-amber-600'
                                                        }`}>
                                                        {member.member_type || 'worker'}
                                                    </span>
                                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${member.status === 'active'
                                                        ? 'bg-emerald-50 text-emerald-600'
                                                        : 'bg-slate-100 text-slate-500'
                                                        }`}>
                                                        {member.status}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[14px] text-slate-500">
                                                    {member.role && (
                                                        <div className="flex items-center gap-2">
                                                            <FaBriefcase className="text-slate-400 text-[12px]" />
                                                            <span className="font-medium">{member.role}</span>
                                                        </div>
                                                    )}
                                                    {member.phone && (
                                                        <div className="flex items-center gap-2">
                                                            <FaPhone className="text-slate-400 text-[12px]" />
                                                            <span className="font-medium">{member.phone}</span>
                                                        </div>
                                                    )}
                                                    {member.email && (
                                                        <div className="flex items-center gap-2">
                                                            <FaEnvelope className="text-slate-400 text-[12px]" />
                                                            <span className="font-medium">{member.email}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-2">
                                                        <FaMoneyBillWave className="text-slate-400 text-[12px]" />
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
                                <div className="text-center py-[48px] text-slate-400">
                                    <FaUser className="text-[36px] mx-auto mb-3 opacity-20" />
                                    <p className="text-[14px] font-bold uppercase tracking-widest">No members yet</p>
                                    <p className="text-[12px] mt-1">Add your first member above</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {/* Role Manager Modal */}
            {showRoleManager && (
                <RoleManager
                    roles={roles}
                    onCreate={createMemberRole}
                    onDelete={deleteMemberRole}
                    onClose={() => { setShowRoleManager(false); fetchMembers(); }}
                    onRefresh={() => getMemberRoles().then(res => setRoles(res.data.data))}
                />
            )}

            {/* Custom Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteModal.show}
                title="Delete Member?"
                message="This action cannot be undone. Their past attendance records will remain in the system."
                onConfirm={confirmDelete}
                onCancel={() => setDeleteModal({ show: false, id: null })}
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
            />

            {/* History Modal */}
            {
                viewingPayments && (
                    <div className="fixed inset-0 z-120 flex items-center justify-center p-[16px] bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                        <div className="bg-white rounded-[40px] p-[32px] sm:p-[40px] w-full max-w-2xl shadow-2xl relative animate-in zoom-in-95 duration-300 max-h-[85vh] flex flex-col font-['Outfit']">
                            <button
                                onClick={() => setViewingPayments(null)}
                                className="absolute top-8 right-8 text-slate-400 hover:text-slate-800 transition-colors"
                            >
                                <FaTimes className="text-[20px]" />
                            </button>

                            <div className="mb-[32px]">
                                <h2 className="text-[24px] font-black text-slate-900 flex items-center gap-3">
                                    <div className="w-2 h-8 bg-emerald-500 rounded-full"></div>
                                    Activity History: {viewingPayments.name}
                                </h2>
                                <p className="text-slate-500 text-[14px] mt-2 ml-5 uppercase font-bold tracking-widest">Linked records for this member</p>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                                {paymentsLoading ? (
                                    <div className="flex justify-center py-20">
                                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
                                    </div>
                                ) : payments.length > 0 ? (
                                    <div className="space-y-[16px]">
                                        {payments.map(p => (
                                            <div key={p.id} className="flex justify-between items-center p-[24px] bg-slate-50 rounded-[24px] border border-slate-100 hover:border-emerald-200 transition-all">
                                                <div className="flex items-center gap-[16px]">
                                                    <div className={`w-[48px] h-[48px] rounded-[16px] flex items-center justify-center text-[18px] ${p.type === 'income' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
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
                                                    <p className={`text-[20px] font-black tracking-tighter ${p.type === 'income' ? 'text-blue-600' : 'text-red-600'}`}>
                                                        {p.type === 'income' ? '+' : '-'}₹{p.amount}
                                                    </p>
                                                    {p.project_name && <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Project: {p.project_name}</p>}
                                                </div>
                                            </div>
                                        ))}
                                        <div className="pt-6 border-t border-slate-100 sticky bottom-0 bg-white">
                                            <div className={`flex justify-between items-center p-[24px] rounded-[24px] text-white ${(() => {
                                                const earned = payments.filter(p => p.category === 'Salary Pot').reduce((acc, p) => acc + parseFloat(p.amount), 0);
                                                const paid = payments.filter(p => ['Salary', 'Advance'].includes(p.category)).reduce((acc, p) => acc + parseFloat(p.amount), 0);
                                                return (earned - paid) > 0 ? 'bg-amber-600' : 'bg-slate-900';
                                            })()
                                                }`}>
                                                <span className="font-black uppercase tracking-widest text-[12px]">Ledger Balance (Owed)</span>
                                                <span className="text-[24px] font-black tracking-tighter">
                                                    ₹{(() => {
                                                        const earned = payments.filter(p => p.category === 'Salary Pot').reduce((acc, p) => acc + parseFloat(p.amount), 0);
                                                        const paid = payments.filter(p => ['Salary', 'Advance'].includes(p.category)).reduce((acc, p) => acc + parseFloat(p.amount), 0);
                                                        return (earned - paid).toFixed(2);
                                                    })()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-20 text-slate-400 font-['Outfit']">
                                        <FaHistory className="text-[60px] mx-auto mb-4 opacity-10" />
                                        <p className="font-black uppercase tracking-widest text-[14px] text-slate-300">No records found</p>
                                        <p className="text-[10px] mt-2 font-bold uppercase tracking-widest text-slate-400">Add an expense and link this person to see history</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
};

export default MemberManager;
