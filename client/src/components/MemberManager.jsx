import { getMembers, createMember, updateMember, deleteMember, getGuests } from '../api/memberApi';
import { getMemberRoles, createMemberRole, deleteMemberRole } from '../api/memberRoleApi'; // IMPORTS
import { getTransactions } from '../api/transactionApi';
import toast from 'react-hot-toast';
import { FaTimes, FaPlus, FaEdit, FaTrash, FaUser, FaUsers, FaBriefcase, FaPhone, FaEnvelope, FaHistory, FaMoneyBillWave, FaUniversity, FaTag, FaSearch, FaFilter } from 'react-icons/fa';
import ConfirmModal from './modals/ConfirmModal';
import RoleManager from './RoleManager'; // IMPORT
import ExportButtons from './ExportButtons';
import { generateCSV, generatePDF, generateTXT } from '../utils/exportUtils/base.js';
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

    // Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');

    const [editingId, setEditingId] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ show: false, id: null });
    const [viewingPayments, setViewingPayments] = useState(null); // Member object
    const [payments, setPayments] = useState([]);
    const [paymentsLoading, setPaymentsLoading] = useState(false);

    const fetchMembers = async () => {
        try {
            const [memRes, roleRes, guestRes] = await Promise.all([getMembers(), getMemberRoles(), getGuests()]);
            const guests = guestRes.data.data.map(g => ({ ...g, isGuest: true }));
            setMembers([...memRes.data.data, ...guests]);
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

    // Filter Logic
    const filteredMembers = members.filter(m => {
        const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (m.phone && m.phone.includes(searchQuery)) ||
            (m.email && m.email.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesRole = !filterRole || m.role === filterRole;
        const matchesType = filterType === 'all' ||
            (filterType === 'guest' ? m.isGuest : m.member_type === filterType);
        const matchesStatus = filterStatus === 'all' || m.status === filterStatus;

        return matchesSearch && matchesRole && matchesType && matchesStatus;
    });

    // Export Handlers
    const handleExportCSV = () => {
        const headers = ['Name', 'Role', 'Type', 'Status', 'Phone', 'Email', 'Wage Type', 'Wage'];
        const rows = filteredMembers.map(m => [m.name, m.role, m.member_type, m.status, m.phone, m.email, m.wage_type, m.daily_wage]);
        generateCSV(headers, rows, 'Members_Export');
    };

    const handleExportPDF = () => {
        const headers = ['Name', 'Role', 'Type', 'Status', 'Phone', 'Wage'];
        const rows = filteredMembers.map(m => [
            m.name,
            m.role || '-',
            m.member_type,
            m.status,
            m.phone || '-',
            `${m.wage_type === 'monthly' ? 'Monthly' : 'Daily'}: ${m.daily_wage}`
        ]);

        generatePDF({
            title: 'Member List',
            period: 'All Time',
            stats: [
                { label: 'Total Members', value: filteredMembers.length },
                { label: 'Active', value: filteredMembers.filter(m => m.status === 'active').length },
                { label: 'Employees', value: filteredMembers.filter(m => m.member_type === 'employee').length },
                { label: 'Workers', value: filteredMembers.filter(m => m.member_type === 'worker').length }
            ],
            tableHeaders: headers,
            tableRows: rows,
            filename: 'Members_Report'
        });
    };

    const handleExportTXT = () => {
        const headers = ['Name', 'Role', 'Type', 'Status', 'Phone', 'Email'];
        const rows = filteredMembers.map(m => [m.name, m.role, m.member_type, m.status, m.phone, m.email]);
        generateTXT({
            title: 'Member List Report',
            period: 'All Time',
            stats: [{ label: 'Total', value: filteredMembers.length }],
            logHeaders: headers,
            logRows: rows,
            filename: 'Members_Report'
        });
    };

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
            const params = member.isGuest ? { guestName: member.name } : { memberId: member.id };
            const res = await getTransactions(params);
            setPayments(res.data);
        } catch (error) {
            toast.error("Failed to fetch history");
        } finally {
            setPaymentsLoading(false);
        }
    };

    return (
        <div className="animate-in slide-in-from-right-10 duration-500 pb-20 w-full font-['Outfit']">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <FaUsers className="text-blue-600" /> Manage Members
                    </h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Add and manage people in your list</p>
                </div>
                <div className="flex items-center gap-3">
                    <ExportButtons onExportCSV={handleExportCSV} onExportPDF={handleExportPDF} onExportTXT={handleExportTXT} />
                    <button
                        onClick={() => setShowRoleManager(true)}
                        className="group flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:border-purple-300 hover:text-purple-600 transition-all shadow-sm hover:shadow-md"
                    >
                        <div className="w-6 h-6 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                            <FaTag size={10} />
                        </div>
                        <span className="hidden sm:inline">Categories</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">

                {/* Add/Edit Form */}
                <form onSubmit={handleSubmit} className="mb-6 p-6 bg-white rounded-[32px] border border-slate-100 shadow-sm font-['Outfit']">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div className="col-span-1 lg:col-span-1">
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                                <FaUser className="inline mr-1 text-[8px]" /> Name *
                            </label>
                            <input
                                required
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Full name"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 h-10 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                            />
                        </div>
                        <div className="col-span-1 lg:col-span-1">
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                                <FaBriefcase className="inline mr-1 text-[8px]" /> Category / Role
                            </label>
                            <div className="flex gap-2">
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 h-10 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all cursor-pointer"
                                >
                                    <option value="">Select Category</option>
                                    {[...new Set([...roles.map(r => r.name), ...members.map(m => m.role).filter(Boolean)])].sort().map(role => (
                                        <option key={role} value={role}>{role}</option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => setShowRoleManager(true)}
                                    className="w-10 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center hover:bg-purple-50 hover:text-purple-600 transition-all border border-slate-200"
                                    title="Manage Categories"
                                >
                                    <FaPlus size={10} />
                                </button>
                            </div>
                        </div>
                        <div className="col-span-1 lg:col-span-1">
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                                <FaPhone className="inline mr-1 text-[8px]" /> Phone
                            </label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="Contact number"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 h-10 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                            />
                        </div>

                        <div className="col-span-1 lg:col-span-1">
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
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 h-10 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all cursor-pointer"
                            >
                                <option value="worker">Worker (Daily/Piece)</option>
                                <option value="employee">Employee (Monthly)</option>
                            </select>
                        </div>

                        <div className="col-span-1 lg:col-span-1">
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                                {formData.member_type === 'employee' ? 'Monthly Salary' : 'Daily Wage'}
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                                <input
                                    type="number"
                                    value={formData.daily_wage}
                                    onChange={(e) => setFormData({ ...formData, daily_wage: e.target.value })}
                                    placeholder="0.00"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-6 pr-3 h-10 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                                />
                            </div>
                        </div>

                        <div className="col-span-1 lg:col-span-1">
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                                Status
                            </label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 h-10 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all cursor-pointer"
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>

                        <div className="col-span-1 md:col-span-2 lg:col-span-2 flex items-end gap-2">
                            <button
                                type="submit"
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-10 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                            >
                                <FaPlus className="text-[10px]" />
                                {editingId ? 'Update' : 'Add Member'}
                            </button>
                            {editingId && (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-6 bg-slate-100 hover:bg-slate-200 text-slate-600 h-10 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </div>
                </form>

                {/* Filter Bar - Modern Design */}
                <div className="bg-white/80 backdrop-blur-xl p-4 rounded-[24px] border border-white/20 shadow-xl shadow-slate-200/50 mb-6 sticky top-2 z-10">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {/* Category Filter - Indigo */}
                        <div className="relative group">
                            <FaTag className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 group-hover:text-indigo-500 transition-colors" size={12} />
                            <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="w-full bg-indigo-50 hover:bg-indigo-100 border border-transparent rounded-2xl py-3 pl-10 pr-10 text-xs font-black text-indigo-600 text-center outline-none focus:ring-2 focus:ring-indigo-200 transition-all cursor-pointer appearance-none uppercase tracking-wide">
                                <option value="">All Categories</option>
                                {[...new Set(members.map(m => m.role).filter(Boolean))].map(role => (
                                    <option key={role} value={role}>{role}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-400 text-[10px]">▼</div>
                        </div>

                        {/* Type Filter - Emerald */}
                        <div className="relative group">
                            <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 group-hover:text-emerald-500 transition-colors" size={12} />
                            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full bg-emerald-50 hover:bg-emerald-100 border border-transparent rounded-2xl py-3 pl-10 pr-10 text-xs font-black text-emerald-600 text-center outline-none focus:ring-2 focus:ring-emerald-200 transition-all cursor-pointer appearance-none uppercase tracking-wide">
                                <option value="all">All Types</option>
                                <option value="worker">Worker</option>
                                <option value="employee">Employee</option>
                                <option value="guest">Guest</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-400 text-[10px]">▼</div>
                        </div>

                        {/* Status Filter - Purple */}
                        <div className="relative group">
                            <FaFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 group-hover:text-purple-500 transition-colors" size={12} />
                            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full bg-purple-50 hover:bg-purple-100 border border-transparent rounded-2xl py-3 pl-10 pr-10 text-xs font-black text-purple-600 text-center outline-none focus:ring-2 focus:ring-purple-200 transition-all cursor-pointer appearance-none uppercase tracking-wide">
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-purple-400 text-[10px]">▼</div>
                        </div>

                        {/* Search - Blue */}
                        <div className="relative group">
                            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 group-hover:text-blue-500 transition-colors" size={12} />
                            <input
                                type="text"
                                placeholder="SEARCH..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-blue-50 hover:bg-blue-100 border border-transparent rounded-2xl py-3 pl-10 pr-4 text-xs font-black text-blue-600 text-center placeholder:text-blue-300 outline-none focus:ring-2 focus:ring-blue-200 transition-all uppercase tracking-wide"
                            />
                        </div>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="px-[4px] py-[4px] overflow-y-auto custom-scrollbar flex-1">
                    <div className="space-y-3 font-['Outfit']">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 px-2">
                            All Members ({filteredMembers.length})
                        </h3>
                        {loading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                            </div>
                        ) : filteredMembers.length > 0 ? (
                            filteredMembers.map(member => (
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
                                            {!member.isGuest && (
                                                <>
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
                                                </>
                                            )}
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


            {/* Role Manager Modal */}
            {
                showRoleManager && (
                    <RoleManager
                        roles={roles}
                        onCreate={createMemberRole}
                        onDelete={deleteMemberRole}
                        onClose={() => { setShowRoleManager(false); fetchMembers(); }}
                        onRefresh={() => getMemberRoles().then(res => setRoles(res.data.data))}
                    />
                )
            }

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
                        {/* ... modal content ... */}
                        {/* I will assume the modal content is fine but need to ensure the closing tags for the main component are correct. */}
                        {/* The logic suggests I have 2 div tags open: the main wrapper, and the flex-1 content wrapper. */}
                        {/* The original code had 2 main div tags corresponding to the modal structure. */}
                        {/* So the closing tags should be fine if I didn't change the number of open tags. */}
                        {/* Checking the middle... */}

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
        </div >
    );
};

export default MemberManager;
