import { getMembers, createMember, updateMember, deleteMember, getGuests, getMemberRoles, createMemberRole, deleteMemberRole } from '../../api/TeamManagement/mfgTeam';
import { getShifts } from '../../api/Attendance/mfgAttendance';
import { getTransactions } from '../../api/Expense/mfgExpense';
import toast from 'react-hot-toast';
import { FaTimes, FaPlus, FaEdit, FaTrash, FaUser, FaUsers, FaBriefcase, FaPhone, FaEnvelope, FaHistory, FaMoneyBillWave, FaUniversity, FaTag, FaSearch, FaFilter, FaClock } from 'react-icons/fa';
import ConfirmModal from '../modals/ConfirmModal';
import RoleManager from './RoleManager'; // IMPORT
import ExportButtons from '../Common/ExportButtons';
import { generateCSV, generatePDF, generateTXT } from '../../utils/exportUtils/base.js';
import { useState, useEffect, useRef } from 'react';

const MemberManager = ({ onClose, onUpdate, sector, roles: propRoles, shifts: propShifts, members: propMembers }) => {
    const [localShifts, setLocalShifts] = useState([]);
    const shifts = propShifts || localShifts;
    const [localMembers, setLocalMembers] = useState(propMembers || []);
    const members = propMembers || localMembers;
    const [localRoles, setLocalRoles] = useState([]); // Internal roles state
    const roles = propRoles || localRoles; // Use prop if available, else local

    useEffect(() => {
        if (propMembers) {
            setLocalMembers(propMembers);
            setLoading(false);
            // Only fetch shifts once per mount, not every time propMembers reference changes
            if (!propShifts && localShifts.length === 0 && !hasFetchedShiftsRef.current) {
                hasFetchedShiftsRef.current = true;
                getShifts({ sector })
                    .then(res => setLocalShifts(Array.isArray(res?.data?.data) ? res.data.data : []))
                    .catch(err => console.error("Failed to load shifts", err));
            }
        } else {
            fetchMembers();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [propMembers]);

    const [showRoleManager, setShowRoleManager] = useState(false); // MANAGER STATE
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        role: '',
        phone: '',
        email: '',
        member_type: 'employee',
        wage_type: 'monthly',
        daily_wage: '',
        shift_id: '',
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

    const lastFetchRef = useRef(0);
    const hasFetchedShiftsRef = useRef(false); // Guard to prevent double shifts fetch on mount

    const fetchMembers = async (force = false) => {
        const now = Date.now();
        // Throttle (30s cache)
        if (!force && now - lastFetchRef.current < 30000 && !loading && members.length > 0) {
            return;
        }

        if (force) {
            window._mfgMemberFetchPromise = null;
        }

        // Request Deduplication
        if (!force && window._mfgMemberFetchPromise) {
            try {
                const [memRes, roleRes, guestRes] = await window._mfgMemberFetchPromise;
                const guests = (Array.isArray(guestRes?.data?.data) ? guestRes.data.data : []).map(g => ({ ...g, isGuest: true }));
                const membersRaw = Array.isArray(memRes?.data?.data) ? memRes.data.data : [];
                setLocalMembers([...membersRaw, ...guests]);
                if (!propRoles) setLocalRoles(Array.isArray(roleRes?.data?.data) ? roleRes.data.data : []);
                lastFetchRef.current = Date.now();
            } catch (error) {
                console.error("Error joining existing fetch:", error);
            } finally {
                setLoading(false);
            }
            return;
        }

        const fetchPromise = Promise.all([
            getMembers({ sector }),
            !propRoles ? getMemberRoles({ sector }) : Promise.resolve({ data: { data: [] } }),
            !propShifts ? getShifts({ sector }) : Promise.resolve({ data: { data: [] } }),
            getGuests({ sector })
        ]);

        if (!force) {
            window._mfgMemberFetchPromise = fetchPromise;
        }

        try {
            const [memRes, roleRes, shiftRes, guestRes] = await fetchPromise;
            const guests = (Array.isArray(guestRes?.data?.data) ? guestRes.data.data : []).map(g => ({ ...g, isGuest: true }));
            const membersRaw = Array.isArray(memRes?.data?.data) ? memRes.data.data : [];
            setLocalMembers([...membersRaw, ...guests]);
            if (!propRoles) setLocalRoles(Array.isArray(roleRes?.data?.data) ? roleRes.data.data : []);
            if (!propShifts) setLocalShifts(Array.isArray(shiftRes?.data?.data) ? shiftRes.data.data : []);
            lastFetchRef.current = Date.now();
        } catch (error) {
            toast.error("Failed to fetch data");
        } finally {
            if (!force) window._mfgMemberFetchPromise = null;
            setLoading(false);
        }
    };


    // Set default shift for new members
    useEffect(() => {
        if (!editingId && shifts.length > 0 && !formData.shift_id) {
            const defaultShift = shifts.find(s => s.is_default === 1) ||
                shifts.find(s => s.name.toLowerCase().includes('9') && s.name.toLowerCase().includes('6')) ||
                shifts[0];
            if (defaultShift) {
                setFormData(prev => ({ ...prev, shift_id: defaultShift.id }));
            }
        }
    }, [shifts, editingId]);

    // Filter Logic
    const filteredMembers = (Array.isArray(members) ? members : []).filter(m => {
        const matchesSearch = (m.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (m.phone && m.phone.includes(searchQuery)) ||
            (m.email && (m.email || '').toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesRole = !filterRole || m.role === filterRole;
        const matchesType = filterType === 'all' ||
            (filterType === 'guest' ? m.isGuest : m.member_type === filterType);
        const matchesStatus = filterStatus === 'all' || m.status === filterStatus;

        return matchesSearch && matchesRole && matchesType && matchesStatus;
    });

    // Export Handlers
    const handleExportCSV = () => {
        const headers = ['Name', 'Role', 'Type', 'Status', 'Phone', 'Email', 'Wage'];
        const rows = filteredMembers.map(m => [
            m.name,
            m.role,
            m.member_type,
            m.status,
            m.phone,
            m.email,
            `${m.wage_type === 'monthly' ? 'Monthly' : 'Daily'}: ${parseFloat(m.daily_wage)}`
        ]);
        generateCSV(headers, rows, 'Members_Export');
    };

    const handleExportPDF = () => {
        const headers = ['Name', 'Role', 'Type', 'Status', 'Phone', 'Email', 'Wage'];
        const rows = filteredMembers.map(m => [
            m.name,
            m.role || '-',
            m.member_type,
            m.status,
            m.phone || '-',
            m.email || '-',
            `${m.wage_type === 'monthly' ? 'Monthly' : 'Daily'}: ${parseFloat(m.daily_wage)}`
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
        const headers = ['Name', 'Role', 'Type', 'Status', 'Phone', 'Email', 'Wage'];
        const rows = filteredMembers.map(m => [
            m.name,
            m.role,
            m.member_type,
            m.status,
            m.phone,
            m.email || '-',
            `${m.wage_type === 'monthly' ? 'Monthly' : 'Daily'}: ${parseFloat(m.daily_wage)}`
        ]);
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
                await updateMember(editingId, { ...formData, sector });
                toast.success("Member updated!");
            } else {
                await createMember({ ...formData, sector });
                toast.success("Member added!");
            }
            resetForm();
            fetchMembers(true);
            if (onUpdate) onUpdate(true);
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
            shift_id: member.shift_id || '',
            status: member.status
        });
        setEditingId(member.id);
    };

    const handleDeleteClick = (id) => {
        setDeleteModal({ show: true, id });
    };

    const confirmDelete = async () => {
        try {
            await deleteMember(deleteModal.id, { sector });
            toast.success("Member deleted");
            setDeleteModal({ show: false, id: null });
            fetchMembers(true);
            if (onUpdate) onUpdate(true);
        } catch (error) {
            toast.error("Failed to delete member");
        }
    };

    const resetForm = () => {
        setFormData({ name: '', role: '', phone: '', email: '', member_type: 'employee', wage_type: 'monthly', daily_wage: '', shift_id: '', status: 'active' });
        setEditingId(null);
    };

    const handleViewPayments = async (member) => {
        setViewingPayments(member);
        setPaymentsLoading(true);
        try {
            const params = member.isGuest ? { guestName: member.name, sector } : { memberId: member.id, sector };
            const res = await getTransactions(params);
            setPayments(res.data);
        } catch (error) {
            toast.error("Failed to fetch history");
        } finally {
            setPaymentsLoading(false);
        }
    };

    return (
        <div className="animate-in slide-in-from-right-10 duration-500 pb-[80px] sm:pb-20 w-full font-['Outfit']">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-[12px] sm:gap-4 mb-[20px] sm:mb-8">
                <div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <FaUsers className="text-blue-600" /> Manage Members
                    </h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Add and manage people in your list</p>
                </div>
                <div className="flex items-center gap-3">
                    <ExportButtons onExportCSV={handleExportCSV} onExportPDF={handleExportPDF} onExportTXT={handleExportTXT} />

                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">

                {/* Add/Edit Form */}
                <form onSubmit={handleSubmit} className="mb-[16px] sm:mb-6 p-[14px] sm:p-6 bg-white rounded-[20px] sm:rounded-[32px] border border-slate-100 shadow-sm font-['Outfit']">
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
                                    {[...new Set([(Array.isArray(roles) ? roles : []).map(r => r.name), (Array.isArray(members) ? members : []).map(m => m.role).filter(Boolean)].flat())].sort().map(role => (
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
                                <FaEnvelope className="inline mr-1 text-[8px]" /> Email
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="Email address"
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
                                <option value="employee">Employee (Monthly)</option>
                                <option value="worker">Worker (Daily)</option>
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

                        <div className="col-span-1 lg:col-span-1">
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                                <FaClock className="inline mr-1 text-[8px]" /> Assign Shift
                            </label>
                            <select
                                value={formData.shift_id}
                                onChange={(e) => setFormData({ ...formData, shift_id: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 h-10 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all cursor-pointer"
                            >
                                <option value="">Select Shift</option>
                                {shifts.map(shift => (
                                    <option key={shift.id} value={shift.id}>
                                        {shift.name} ({shift.start_time.slice(0, 5)} - {shift.end_time.slice(0, 5)})
                                    </option>
                                ))}
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

                {/* Filters Bar */}
                <div className="bg-slate-50 p-[12px] sm:p-4 rounded-[16px] sm:rounded-2xl border border-slate-100 flex flex-col gap-3 sm:gap-4 mb-6 sm:mb-8 font-['Outfit']">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1 relative group">
                            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={12} />
                            <input
                                type="text"
                                placeholder="Find member..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-[12px] sm:rounded-xl pl-10 pr-4 py-2 sm:py-2.5 text-[11px] font-bold text-slate-700 outline-none focus:border-blue-500 transition-all"
                            />
                        </div>
                        <div className="flex gap-2">
                            <div className="relative flex-1 sm:w-40">
                                <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={10} />
                                <select
                                    value={filterRole}
                                    onChange={(e) => setFilterRole(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-[12px] sm:rounded-xl pl-8 pr-6 py-2 sm:py-2.5 text-[10px] sm:text-[11px] font-bold text-slate-600 outline-none appearance-none cursor-pointer"
                                >
                                    <option value="">All Roles</option>
                                    {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                                </select>
                            </div>
                            <div className="relative flex-1 sm:w-32">
                                <FaBriefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={10} />
                                <select
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-[12px] sm:rounded-xl pl-8 pr-6 py-2 sm:py-2.5 text-[10px] sm:text-[11px] font-bold text-slate-600 outline-none appearance-none cursor-pointer"
                                >
                                    <option value="all">Any Type</option>
                                    <option value="employee">Employee</option>
                                    <option value="worker">Worker</option>
                                    <option value="guest">Guest</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex bg-slate-200/50 p-1 rounded-[10px] sm:rounded-xl border border-slate-200">
                            {['all', 'active', 'inactive'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-[8px] sm:rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-widest transition-all ${filterStatus === status ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                        <ExportButtons
                            onExportCSV={() => generateCSV(filteredMembers, 'Members_List')}
                            onExportPDF={() => generatePDF(filteredMembers, 'Members_List', 'Active Workforce')}
                            onExportTXT={() => generateTXT(filteredMembers, 'Members_List')}
                        />
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
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
                                {filteredMembers.map(member => (
                                    <div key={member.id} className={`bg-white border text-center relative group p-5 transition-all flex flex-col items-center justify-center overflow-hidden rounded-[24px] sm:rounded-[32px] ${member.isGuest ? 'border-amber-100 hover:border-amber-300' : 'border-slate-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5'}`}>
                                        {/* Actions Overlay */}
                                        <div className="absolute top-4 right-4 flex gap-2 sm:gap-3 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                                            <button onClick={() => handleEdit(member)} className="w-[30px] h-[30px] sm:w-9 sm:h-9 bg-white shadow-md rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all"><FaEdit size={12} /></button>
                                            <button onClick={() => handleDeleteClick(member.id)} className="w-[30px] h-[30px] sm:w-9 sm:h-9 bg-white shadow-md rounded-xl flex items-center justify-center text-slate-400 hover:text-red-600 transition-all"><FaTrash size={12} /></button>
                                        </div>

                                        <div className="relative mb-5">
                                            <div className={`w-[70px] h-[70px] sm:w-20 sm:h-20 rounded-[24px] sm:rounded-3xl flex items-center justify-center text-2xl sm:text-3xl font-black ${member.isGuest ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                                                {member.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-lg flex items-center justify-center border-4 border-white ${member.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                                            </div>
                                        </div>

                                        <h4 className="text-[16px] sm:text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors">{member.name}</h4>
                                        <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 mb-4">{member.role || (member.isGuest ? 'Guest' : 'Staff')}</p>

                                        <div className="flex flex-wrap items-center justify-center gap-2 w-full mt-auto">
                                            <div className="px-3 py-1.5 bg-slate-50 rounded-[10px] sm:rounded-xl text-[9px] font-bold text-slate-600 flex items-center gap-2">
                                                <FaPhone className="text-slate-300" size={10} />
                                                {member.phone || 'No phone'}
                                            </div>
                                            <div className={`px-3 py-1.5 rounded-[10px] sm:rounded-xl text-[9px] font-black uppercase tracking-widest ${member.wage_type === 'monthly' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                ₹{member.daily_wage || 0} / {member.wage_type === 'piece_rate' ? 'piece' : member.wage_type === 'monthly' ? 'mo' : 'day'}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
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
                        members={members}
                        onCreate={(data) => createMemberRole({ ...data, sector })}
                        onDelete={(id) => deleteMemberRole(id, { sector })}
                        onClose={() => {
                            setShowRoleManager(false);
                            fetchMembers(true);
                            if (onUpdate) onUpdate();
                        }}
                        onRefresh={() => propRoles ? onUpdate() : getMemberRoles({ sector }).then(res => setLocalRoles(res.data.data))}
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

                        <div className="bg-white rounded-[24px] sm:rounded-[40px] p-[20px] sm:p-[32px] md:p-[40px] w-full max-w-2xl shadow-2xl relative animate-in zoom-in-95 duration-300 max-h-[85vh] flex flex-col font-['Outfit']">
                            <button
                                onClick={() => setViewingPayments(null)}
                                className="absolute top-8 right-8 text-slate-400 hover:text-slate-800 transition-colors"
                            >
                                <FaTimes className="text-[20px]" />
                            </button>

                            <div className="mb-[20px] sm:mb-[32px]">
                                <h2 className="text-[18px] sm:text-[24px] font-black text-slate-900 flex items-center gap-3">
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
                                ) : Array.isArray(payments) && payments.length > 0 ? (
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
                                                const pArr = Array.isArray(payments) ? payments : [];
                                                const earned = pArr.filter(p => p.category === 'Salary Pot').reduce((acc, p) => acc + parseFloat(p.amount || 0), 0);
                                                const paid = pArr.filter(p => ['Salary', 'Advance'].includes(p.category)).reduce((acc, p) => acc + parseFloat(p.amount || 0), 0);
                                                return (earned - paid) > 0 ? 'bg-amber-600' : 'bg-slate-900';
                                            })()
                                                }`}>
                                                <span className="font-black uppercase tracking-widest text-[12px]">Ledger Balance (Owed)</span>
                                                <span className="text-[24px] font-black tracking-tighter">
                                                    ₹{(() => {
                                                        const pArr = Array.isArray(payments) ? payments : [];
                                                        const earned = pArr.filter(p => p.category === 'Salary Pot').reduce((acc, p) => acc + parseFloat(p.amount || 0), 0);
                                                        const paid = pArr.filter(p => ['Salary', 'Advance'].includes(p.category)).reduce((acc, p) => acc + parseFloat(p.amount || 0), 0);
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
