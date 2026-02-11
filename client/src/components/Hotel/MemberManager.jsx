import { getMembers, createMember, updateMember, deleteMember, getGuests, getMemberRoles, createMemberRole, deleteMemberRole } from '../../api/TeamManagement/hotelTeam';
import { getProjects } from '../../api/Attendance/hotelAttendance';
import { getTransactions } from '../../api/Expense/hotelExpense';
import toast from 'react-hot-toast';
import { FaTimes, FaPlus, FaEdit, FaTrash, FaUser, FaUsers, FaBriefcase, FaPhone, FaEnvelope, FaHistory, FaMoneyBillWave, FaUniversity, FaTag, FaSearch, FaFilter, FaMapMarkerAlt, FaIdCard } from 'react-icons/fa';
import ConfirmModal from '../modals/ConfirmModal';
import RoleManager from './RoleManager';
import ExportButtons from '../Common/ExportButtons';
import { generateCSV, generatePDF, generateTXT } from '../../utils/exportUtils/base.js';
import { useState, useEffect } from 'react';

const MemberManager = ({ onClose, onUpdate, sector = 'hotel' }) => {
    const [members, setMembers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [projects, setProjects] = useState([]);
    const [showRoleManager, setShowRoleManager] = useState(false);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        role: '',
        phone: '',
        email: '',
        member_type: 'employee',
        wage_type: 'monthly',
        daily_wage: '',
        status: 'active',
        employment_nature: 'Permanent',
        primary_work_area: 'Rooms',
        project_id: ''
    });

    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [filterProject, setFilterProject] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');

    const [editingId, setEditingId] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ show: false, id: null });
    const [viewingPayments, setViewingPayments] = useState(null);
    const [payments, setPayments] = useState([]);
    const [paymentsLoading, setPaymentsLoading] = useState(false);

    const fetchMembers = async () => {
        try {
            const [memRes, roleRes, guestRes, projRes] = await Promise.all([
                getMembers({ sector }),
                getMemberRoles({ sector }),
                getGuests({ sector }),
                getProjects({ sector })
            ]);
            const guests = (Array.isArray(guestRes?.data?.data) ? guestRes.data.data : []).map(g => ({ ...g, isGuest: true }));
            const membersRaw = Array.isArray(memRes?.data?.data) ? memRes.data.data : [];
            setMembers([...membersRaw, ...guests]);
            setRoles(Array.isArray(roleRes?.data?.data) ? roleRes.data.data : []);
            setProjects(Array.isArray(projRes?.data?.data) ? projRes.data.data : []);
            setLoading(false);
        } catch (error) {
            toast.error("Failed to fetch hotel staff data");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, []);

    const filteredMembers = (Array.isArray(members) ? members : []).filter(m => {
        const matchesSearch = (m.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (m.phone && m.phone.includes(searchQuery)) ||
            (m.email && (m.email || '').toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesRole = !filterRole || m.role === filterRole;
        const matchesProject = !filterProject || m.project_id === parseInt(filterProject);
        const matchesType = filterType === 'all' ||
            (filterType === 'guest' ? m.isGuest : m.member_type === filterType);
        const matchesStatus = filterStatus === 'all' || m.status === filterStatus;

        return matchesSearch && matchesRole && matchesProject && matchesType && matchesStatus;
    });

    const handleExportCSV = () => {
        const headers = ['Name', 'Role/Designation', 'Type', 'Area', 'Status', 'Phone', 'Wage'];
        const rows = filteredMembers.map(m => [
            m.name,
            m.role,
            m.member_type,
            m.primary_work_area,
            m.status,
            m.phone,
            `₹${parseFloat(m.daily_wage)} (${m.wage_type === 'monthly' ? 'Monthly' : 'Daily'})`
        ]);
        generateCSV(headers, rows, 'Hotel_Staff_Export');
    };

    const handleExportPDF = () => {
        const headers = ['Name', 'Role', 'Type', 'Area', 'Status', 'Wage'];
        const rows = filteredMembers.map(m => [
            m.name,
            m.role || '-',
            m.member_type,
            m.primary_work_area || '-',
            m.status,
            `₹${parseFloat(m.daily_wage)}`
        ]);

        generatePDF({
            title: 'Hotel Staff List',
            period: 'All Time',
            stats: [
                { label: 'Total Staff', value: filteredMembers.length },
                { label: 'Active', value: filteredMembers.filter(m => m.status === 'active').length },
                { label: 'Employees', value: filteredMembers.filter(m => m.member_type === 'employee').length }
            ],
            tableHeaders: headers,
            tableRows: rows,
            filename: 'Hotel_Staff_Report'
        });
    };

    const handleExportTXT = () => {
        const headers = ['Name', 'Role', 'Area', 'Status', 'Phone', 'Wage'];
        const rows = filteredMembers.map(m => [
            m.name,
            m.role,
            m.primary_work_area,
            m.status,
            m.phone,
            `${m.wage_type === 'monthly' ? 'Monthly' : 'Daily'}: ₹${parseFloat(m.daily_wage)}`
        ]);
        generateTXT({
            title: 'Hotel Staff Member Report',
            period: 'All Time',
            stats: [{ label: 'Total', value: filteredMembers.length }],
            logHeaders: headers,
            logRows: rows,
            filename: 'Hotel_Staff_Report'
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await updateMember(editingId, { ...formData, sector });
                toast.success("Staff member updated!");
            } else {
                await createMember({ ...formData, sector });
                toast.success("Staff member added!");
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
            status: member.status,
            employment_nature: member.employment_nature || 'Permanent',
            primary_work_area: member.primary_work_area || 'Rooms',
            project_id: member.project_id || ''
        });
        setEditingId(member.id);
    };

    const handleDeleteClick = (id) => {
        setDeleteModal({ show: true, id });
    };

    const confirmDelete = async () => {
        try {
            await deleteMember(deleteModal.id, { sector });
            toast.success("Staff member deleted");
            setDeleteModal({ show: false, id: null });
            fetchMembers();
            if (onUpdate) onUpdate();
        } catch (error) {
            toast.error("Failed to delete member");
        }
    };

    const resetForm = () => {
        setFormData({
            name: '', role: '', phone: '', email: '', member_type: 'employee',
            wage_type: 'monthly', daily_wage: '', status: 'active',
            employment_nature: 'Permanent', primary_work_area: 'Rooms',
            project_id: ''
        });
        setEditingId(null);
    };

    const handleViewPayments = async (member) => {
        setViewingPayments(member);
        setPaymentsLoading(true);
        try {
            const params = member.isGuest ? { guestName: member.name, sector } : { memberId: member.id, sector };
            const res = await getTransactions(params);
            setPayments(res.data.data || res.data);
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
                        <FaUsers className="text-blue-600" /> Hotel Staff Management
                    </h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Manage employees and seasonal staff</p>
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
                        <span className="hidden sm:inline">Designations</span>
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
                                placeholder="Staff Name"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 h-10 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                            />
                        </div>

                        <div className="col-span-1 lg:col-span-1">
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                                Linked Project / Dept
                            </label>
                            <select
                                value={formData.project_id}
                                onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 h-10 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all cursor-pointer"
                            >
                                <option value="">No Project</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="col-span-1 lg:col-span-1">
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                                <FaBriefcase className="inline mr-1 text-[8px]" /> Designation (Role)
                            </label>
                            <div className="flex gap-2">
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 h-10 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all cursor-pointer"
                                    required
                                >
                                    <option value="">Select Role</option>
                                    {[...new Set([(roles || []).map(r => r.name), (members || []).map(m => m.role).filter(Boolean)].flat())].sort().map(role => (
                                        <option key={role} value={role}>{role}</option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => setShowRoleManager(true)}
                                    className="w-10 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center hover:bg-purple-50 hover:text-purple-600 transition-all border border-slate-200"
                                    title="Manage Designations"
                                >
                                    <FaPlus size={10} />
                                </button>
                            </div>
                        </div>

                        <div className="col-span-1 lg:col-span-1">
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                                Work Area / Dept
                            </label>
                            <select
                                value={formData.primary_work_area}
                                onChange={(e) => setFormData({ ...formData, primary_work_area: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 h-10 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all cursor-pointer"
                            >
                                <option value="Rooms">Housekeeping/Rooms</option>
                                <option value="Reception">Front Desk/Reception</option>
                                <option value="Kitchen">Kitchen/F&B</option>
                                <option value="Security">Security</option>
                                <option value="Maintenance">Maintenance</option>
                            </select>
                        </div>

                        <div className="col-span-1 lg:col-span-1">
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                                Employment Nature
                            </label>
                            <select
                                value={formData.employment_nature}
                                onChange={(e) => setFormData({ ...formData, employment_nature: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 h-10 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all cursor-pointer"
                            >
                                <option value="Permanent">Permanent</option>
                                <option value="Contract">Contract</option>
                                <option value="Seasonal">Seasonal / Temp</option>
                            </select>
                        </div>

                        <div className="col-span-1 lg:col-span-1">
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                                <FaPhone className="inline mr-1 text-[8px]" /> Phone
                            </label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="Contact"
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
                                <option value="employee">Staff (Monthly)</option>
                                <option value="worker">Staff (Daily/Wage)</option>
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
                                {editingId ? 'Update Staff Info' : 'Add Staff Member'}
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

                {/* Filter Bar */}
                <div className="bg-white/80 backdrop-blur-xl p-4 rounded-[24px] border border-white/20 shadow-xl shadow-slate-200/50 mb-6 sticky top-2 z-10">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <div className="relative group">
                            <FaTag className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" size={12} />
                            <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="w-full bg-indigo-50 border border-transparent rounded-2xl py-3 pl-10 pr-10 text-xs font-black text-indigo-600 text-center outline-none transition-all cursor-pointer appearance-none uppercase tracking-wide">
                                <option value="">All Designations</option>
                                {[...new Set((members || []).map(m => m.role).filter(Boolean))].map(role => (
                                    <option key={role} value={role}>{role}</option>
                                ))}
                            </select>
                        </div>
                        <div className="relative group">
                            <FaMapMarkerAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400" size={12} />
                            <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)} className="w-full bg-orange-50 border border-transparent rounded-2xl py-3 pl-10 pr-10 text-xs font-black text-orange-600 text-center outline-none transition-all cursor-pointer appearance-none uppercase tracking-wide">
                                <option value="">All Projects</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="relative group">
                            <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400" size={12} />
                            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full bg-emerald-50 border border-transparent rounded-2xl py-3 pl-10 pr-10 text-xs font-black text-emerald-600 text-center outline-none transition-all cursor-pointer appearance-none uppercase tracking-wide">
                                <option value="all">All Types</option>
                                <option value="worker">Daily Wage</option>
                                <option value="employee">Monthly Staff</option>
                                <option value="guest">Guest</option>
                            </select>
                        </div>
                        <div className="relative group">
                            <FaFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400" size={12} />
                            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full bg-purple-50 border border-transparent rounded-2xl py-3 pl-10 pr-10 text-xs font-black text-purple-600 text-center outline-none transition-all cursor-pointer appearance-none uppercase tracking-wide">
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                        <div className="relative group">
                            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400" size={12} />
                            <input
                                type="text"
                                placeholder="SEARCH..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-blue-50 border border-transparent rounded-2xl py-3 pl-10 pr-4 text-xs font-black text-blue-600 text-center placeholder:text-blue-300 outline-none transition-all uppercase tracking-wide"
                            />
                        </div>
                    </div>
                </div>

                {/* List */}
                <div className="px-1 overflow-y-auto custom-scrollbar flex-1">
                    <div className="space-y-3">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 px-2">
                            Hotel Staff ({filteredMembers.length})
                        </h3>
                        {loading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                            </div>
                        ) : filteredMembers.length > 0 ? (
                            filteredMembers.map(member => (
                                <div key={member.id} className="bg-white border border-slate-100 rounded-xl p-4 hover:border-blue-200 transition-all group">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h4 className="text-[18px] font-black text-slate-900">{member.name}</h4>
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${member.wage_type === 'monthly' ? 'bg-purple-50 text-purple-600' : 'bg-amber-50 text-amber-600'}`}>
                                                    {member.primary_work_area} <span className="opacity-50">|</span> {member.employment_nature}
                                                </span>
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${member.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                                    {member.status}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-[14px] text-slate-500 font-bold">
                                                {member.role && (
                                                    <div className="flex items-center gap-2">
                                                        <FaBriefcase className="text-slate-400" />
                                                        <span>{member.role}</span>
                                                    </div>
                                                )}
                                                {member.phone && (
                                                    <div className="flex items-center gap-2">
                                                        <FaPhone className="text-slate-400" />
                                                        <span>{member.phone}</span>
                                                    </div>
                                                )}
                                                {member.project_name && (
                                                    <div className="flex items-center gap-2">
                                                        <FaMapMarkerAlt className="text-slate-400" />
                                                        <span>{member.project_name}</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2">
                                                    <FaMoneyBillWave className="text-slate-400" />
                                                    <span>₹{parseFloat(member.daily_wage || 0)} / {member.wage_type === 'monthly' ? 'Mo' : 'Day'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 opacity-100 group-hover:opacity-100 sm:opacity-0 transition-opacity">
                                            <button onClick={() => handleViewPayments(member)} className="p-3 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all" title="View History"><FaHistory /></button>
                                            {!member.isGuest && (
                                                <>
                                                    <button onClick={() => handleEdit(member)} className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><FaEdit /></button>
                                                    <button onClick={() => handleDeleteClick(member.id)} className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><FaTrash /></button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 text-slate-400">
                                <FaUser className="text-[36px] mx-auto mb-3 opacity-20" />
                                <p className="text-[14px] font-black uppercase tracking-widest">No staff recorded</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showRoleManager && (
                <RoleManager
                    roles={roles}
                    onCreate={(data) => createMemberRole({ ...data, sector })}
                    onDelete={(id) => deleteMemberRole(id, { sector })}
                    onClose={() => { setShowRoleManager(false); fetchMembers(); }}
                    onRefresh={() => getMemberRoles({ sector }).then(res => setRoles(res.data.data))}
                />
            )}

            <ConfirmModal
                isOpen={deleteModal.show}
                title="Remove Staff?"
                message="Are you sure you want to delete this staff member? Past history will be archived."
                onConfirm={confirmDelete}
                onCancel={() => setDeleteModal({ show: false, id: null })}
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
            />

            {viewingPayments && (
                <div className="fixed inset-0 z-120 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
                    <div className="bg-white rounded-[40px] p-8 w-full max-w-2xl shadow-2xl relative flex flex-col max-h-[85vh]">
                        <button onClick={() => setViewingPayments(null)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-800"><FaTimes size={20} /></button>
                        <h2 className="text-2xl font-black mb-6">Activity History: {viewingPayments.name}</h2>
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {paymentsLoading ? (
                                <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-emerald-500"></div></div>
                            ) : payments.length > 0 ? (
                                <div className="space-y-4">
                                    {payments.map(p => (
                                        <div key={p.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-3xl border border-slate-100">
                                            <div>
                                                <p className="font-black text-slate-800">{p.title}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase">{p.category}</span>
                                                    <span className="text-[10px] font-bold text-slate-400">{new Date(p.date).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <p className={`text-xl font-black ${p.type === 'income' ? 'text-blue-600' : 'text-red-600'}`}>
                                                {p.type === 'income' ? '+' : '-'}₹{p.amount}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center py-10 text-slate-400 font-bold uppercase tracking-widest italic">No activities found</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MemberManager;
