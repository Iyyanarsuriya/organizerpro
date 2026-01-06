import { useState, useEffect } from 'react';
import { getMembers, createMember, updateMember, deleteMember } from '../api/memberApi';
import { getTransactions } from '../api/transactionApi';
import toast from 'react-hot-toast';
import { FaTimes, FaPlus, FaEdit, FaTrash, FaUser, FaBriefcase, FaPhone, FaEnvelope, FaHistory, FaMoneyBillWave, FaUniversity } from 'react-icons/fa';
import ConfirmModal from './modals/ConfirmModal';

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
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] sm:pt-[10vh] px-3 sm:px-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-[24px] sm:rounded-[32px] md:rounded-[40px] w-full max-w-[896px] shadow-2xl relative animate-in zoom-in-95 duration-300 h-auto max-h-[84vh] sm:max-h-[80vh] flex flex-col font-['Outfit'] overflow-hidden mb-[4vh] sm:mb-0">
                {/* Fixed Header */}
                <div className="p-[16px] sm:p-[24px] md:p-[40px] pb-0 shrink-0 flex items-start justify-between bg-white z-10">
                    <div>
                        <h2 className="text-[18px] sm:text-[20px] md:text-[24px] font-black text-slate-900 flex items-center gap-2 sm:gap-3">
                            <div className="w-1.5 sm:w-2 h-6 sm:h-8 bg-blue-600 rounded-full"></div>
                            Manage Members
                        </h2>
                        <p className="text-slate-500 text-[11px] sm:text-[12px] md:text-[14px] mt-1 sm:mt-2 ml-3 sm:ml-5">Add and manage people in your list</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-800 transition-colors p-1.5 sm:p-2 hover:bg-slate-100 rounded-xl"
                    >
                        <FaTimes className="text-[18px] sm:text-[20px]" />
                    </button>
                </div>


                {/* Scrollable Content */}
                <div className="p-[16px] sm:p-[24px] md:p-[40px] pt-4 sm:pt-6 overflow-y-auto custom-scrollbar flex-1">

                    {/* Add/Edit Form */}
                    <form onSubmit={handleSubmit} className="mb-6 sm:mb-8 p-[16px] sm:p-[20px] md:p-[24px] bg-slate-50 rounded-[20px] sm:rounded-[24px] border border-slate-100 font-['Outfit']">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-[12px] sm:gap-[14px] md:gap-[16px] mb-[12px] sm:mb-[14px] md:mb-[16px]">
                            <div>
                                <label className="block text-[8px] sm:text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[4px] sm:mb-[6px] md:mb-[8px] ml-[4px] sm:ml-[6px] md:ml-[8px]">
                                    <FaUser className="inline mr-1 text-[7px] sm:text-[8px] md:text-[10px]" /> Name *
                                </label>
                                <input
                                    required
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Full name"
                                    className="w-full bg-white border border-slate-200 rounded-[10px] sm:rounded-[12px] md:rounded-[13px] lg:rounded-[16px] px-[12px] sm:px-[16px] md:px-[18px] lg:px-[24px] h-[32px] sm:h-[36px] md:h-[38px] lg:h-[44px] text-[11px] sm:text-[12px] md:text-[13px] lg:text-[14px] font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 sm:focus:ring-4 focus:ring-blue-500/10 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[8px] sm:text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[4px] sm:mb-[6px] md:mb-[8px] ml-[4px] sm:ml-[6px] md:ml-[8px]">
                                    <FaBriefcase className="inline mr-1 text-[7px] sm:text-[8px] md:text-[10px]" /> Role/Group
                                </label>
                                <input
                                    type="text"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    placeholder="e.g. Student, Staff, Regular"
                                    className="w-full bg-white border border-slate-200 rounded-[10px] sm:rounded-[12px] md:rounded-[13px] lg:rounded-[16px] px-[12px] sm:px-[16px] md:px-[18px] lg:px-[24px] h-[32px] sm:h-[36px] md:h-[38px] lg:h-[44px] text-[11px] sm:text-[12px] md:text-[13px] lg:text-[14px] font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 sm:focus:ring-4 focus:ring-blue-500/10 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[8px] sm:text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[4px] sm:mb-[6px] md:mb-[8px] ml-[4px] sm:ml-[6px] md:ml-[8px]">
                                    <FaPhone className="inline mr-1 text-[7px] sm:text-[8px] md:text-[10px]" /> Phone
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="Contact number"
                                    className="w-full bg-white border border-slate-200 rounded-[10px] sm:rounded-[12px] md:rounded-[13px] lg:rounded-[16px] px-[12px] sm:px-[16px] md:px-[18px] lg:px-[24px] h-[32px] sm:h-[36px] md:h-[38px] lg:h-[44px] text-[11px] sm:text-[12px] md:text-[13px] lg:text-[14px] font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 sm:focus:ring-4 focus:ring-blue-500/10 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[8px] sm:text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[4px] sm:mb-[6px] md:mb-[8px] ml-[4px] sm:ml-[6px] md:ml-[8px]">
                                    <FaEnvelope className="inline mr-1 text-[7px] sm:text-[8px] md:text-[10px]" /> Email
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="Email address"
                                    className="w-full bg-white border border-slate-200 rounded-[10px] sm:rounded-[12px] md:rounded-[13px] lg:rounded-[16px] px-[12px] sm:px-[16px] md:px-[18px] lg:px-[24px] h-[32px] sm:h-[36px] md:h-[38px] lg:h-[44px] text-[11px] sm:text-[12px] md:text-[13px] lg:text-[14px] font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 sm:focus:ring-4 focus:ring-blue-500/10 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[8px] sm:text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[4px] sm:mb-[6px] md:mb-[8px] ml-[4px] sm:ml-[6px] md:ml-[8px]">
                                    Salary Type
                                </label>
                                <select
                                    value={formData.wage_type}
                                    onChange={(e) => setFormData({ ...formData, wage_type: e.target.value })}
                                    className="w-full bg-white border border-slate-200 rounded-[10px] sm:rounded-[12px] md:rounded-[13px] lg:rounded-[16px] px-[12px] sm:px-[16px] md:px-[18px] lg:px-[24px] h-[32px] sm:h-[36px] md:h-[38px] lg:h-[44px] text-[11px] sm:text-[12px] md:text-[13px] lg:text-[14px] font-bold text-slate-700 outline-none focus:border-blue-500 transition-all cursor-pointer"
                                >
                                    <option value="daily">Daily Wage</option>
                                    <option value="monthly">Monthly Salary</option>
                                    <option value="piece_rate">Piece Rate</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[8px] sm:text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[4px] sm:mb-[6px] md:mb-[8px] ml-[4px] sm:ml-[6px] md:ml-[8px]">
                                    {formData.wage_type === 'piece_rate' ? 'Rate per Unit' : formData.wage_type === 'monthly' ? 'Monthly Salary' : 'Daily Wage'}
                                </label>
                                <input
                                    type="number"
                                    value={formData.daily_wage}
                                    onChange={(e) => setFormData({ ...formData, daily_wage: e.target.value })}
                                    placeholder="0.00"
                                    className="w-full bg-white border border-slate-200 rounded-[10px] sm:rounded-[12px] md:rounded-[13px] lg:rounded-[16px] px-[12px] sm:px-[16px] md:px-[18px] lg:px-[24px] h-[32px] sm:h-[36px] md:h-[38px] lg:h-[44px] text-[11px] sm:text-[12px] md:text-[13px] lg:text-[14px] font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 sm:focus:ring-4 focus:ring-blue-500/10 transition-all"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-[8px] sm:text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[4px] sm:mb-[6px] md:mb-[8px] ml-[4px] sm:ml-[6px] md:ml-[8px]">
                                    Status
                                </label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full bg-white border border-slate-200 rounded-[10px] sm:rounded-[12px] md:rounded-[13px] lg:rounded-[16px] px-[12px] sm:px-[16px] md:px-[18px] lg:px-[24px] h-[32px] sm:h-[36px] md:h-[38px] lg:h-[44px] text-[11px] sm:text-[12px] md:text-[13px] lg:text-[14px] font-bold text-slate-700 outline-none focus:border-blue-500 transition-all cursor-pointer"
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-2 sm:gap-3">
                            <button
                                type="submit"
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-[36px] sm:h-[40px] md:h-[42px] lg:h-[48px] rounded-[10px] sm:rounded-[12px] md:rounded-[13px] lg:rounded-[16px] text-[10px] sm:text-[11px] md:text-[12px] lg:text-[13px] font-black uppercase tracking-widest shadow-lg transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                            >
                                <FaPlus className="text-[8px] sm:text-[10px] md:text-[11px] lg:text-[12px]" />
                                {editingId ? 'Update Member' : 'Add Member'}
                            </button>
                            {editingId && (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-[12px] sm:px-[16px] md:px-[18px] lg:px-[24px] bg-slate-200 hover:bg-slate-300 text-slate-700 h-[36px] sm:h-[40px] md:h-[42px] lg:h-[48px] rounded-[10px] sm:rounded-[12px] md:rounded-[13px] lg:rounded-[16px] text-[10px] sm:text-[11px] md:text-[12px] lg:text-[13px] font-black uppercase tracking-widest transition-all"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>

                    {/* Members List */}
                    <div className="space-y-[12px] font-['Outfit']">
                        <h3 className="text-[14px] font-black text-slate-400 uppercase tracking-widest mb-[16px]">
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
                                    className="bg-white border border-slate-100 rounded-[16px] p-[20px] hover:border-blue-200 transition-all group"
                                >
                                    <div className="flex items-start justify-between gap-[16px]">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h4 className="text-[18px] font-black text-slate-900">{member.name}</h4>
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

            {/* history Modal */}
            {viewingPayments && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-[16px] bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
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
                                        <div className="flex justify-between items-center p-[24px] bg-slate-900 rounded-[24px] text-white">
                                            <span className="font-black uppercase tracking-widest text-[12px]">Total Balance</span>
                                            <span className="text-[24px] font-black tracking-tighter">
                                                ₹{payments.reduce((acc, p) => p.type === 'expense' ? acc + parseFloat(p.amount) : acc - parseFloat(p.amount), 0).toFixed(2)}
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
            )}
        </div>
    );
};

export default MemberManager;
