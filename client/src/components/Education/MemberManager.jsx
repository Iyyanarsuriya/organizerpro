import { getMembers, createMember, updateMember, deleteMember, getMemberRoles, createMemberRole, deleteMemberRole, getDepartments, createDepartment, deleteDepartment } from '../../api/TeamManagement/eduTeam';
import toast from 'react-hot-toast';
import { FaTimes, FaPlus, FaEdit, FaTrash, FaUser, FaUsers, FaBriefcase, FaPhone, FaEnvelope, FaTag, FaSearch, FaFilter, FaIdCard, FaBuilding, FaBan, FaCheck } from 'react-icons/fa';
import ConfirmModal from '../modals/ConfirmModal';
import RoleManager from '../IT/RoleManager'; // Reuse IT RoleManager or create new one if needed
import ExportButtons from '../Common/ExportButtons';
import { generateCSV, generatePDF, generateTXT } from '../../utils/exportUtils/base.js';
import { useState, useEffect } from 'react';
import DepartmentManager from './DepartmentManager';

const EducationMemberManager = ({ onClose, onUpdate, sector = 'education' }) => {

    const userJson = localStorage.getItem('user');
    const currentUser = userJson ? JSON.parse(userJson) : null;
    const isOwner = currentUser?.role === 'owner';

    const [members, setMembers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [departments, setDepartments] = useState([]); // Department State
    const [showRoleManager, setShowRoleManager] = useState(false);
    const [showDeptManager, setShowDeptManager] = useState(false); // Department Manager State
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        staff_id: '',
        role: '',
        department: '',
        phone: '',
        email: '',
        gender: '',
        profile_image: '',
        member_type: 'employee',
        wage_type: 'monthly',
        daily_wage: '',
        status: 'active',
        employment_type: 'permanent',
        date_of_joining: new Date().toISOString().split('T')[0],
        reporting_manager_id: '',
        subjects: '',
        shift_start_time: '09:00',
        shift_end_time: '17:00',
        cl_balance: 0,
        sl_balance: 0,
        el_balance: 0
    });

    const [collapsed, setCollapsed] = useState({
        basic: false,
        job: false,
        attendance: false
    });

    const toggleCollapse = (section) => {
        setCollapsed(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [filterDepartment, setFilterDepartment] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    const [editingId, setEditingId] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ show: false, id: null });
    const [deactivateModal, setDeactivateModal] = useState({ show: false, member: null });

    // Multi-select state
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [bulkDeleteModal, setBulkDeleteModal] = useState(false);

    const toggleSelectMember = (id) => {
        setSelectedMembers(prev => prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id]);
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedMembers(filteredMembers.map(m => m.id));
        } else {
            setSelectedMembers([]);
        }
    };

    const handleBulkDelete = async () => {
        try {
            // Sequential delete - ideally backend should support bulk delete
            for (const id of selectedMembers) {
                await deleteMember(id, { sector });
            }
            toast.success(`Deleted ${selectedMembers.length} staff members`);
            setBulkDeleteModal(false);
            setSelectedMembers([]);
            fetchMembers();
            if (onUpdate) onUpdate();
        } catch (error) {
            toast.error("Failed to delete selected members");
        }
    };

    const fetchMembers = async () => {
        try {
            const [memRes, roleRes, deptRes] = await Promise.all([
                getMembers({ sector }),
                getMemberRoles({ sector }),
                getDepartments({ sector })
            ]);
            setMembers(memRes.data.data);
            setRoles(roleRes.data.data);
            setDepartments(deptRes.data.data);
            setLoading(false);
        } catch (error) {
            console.error('Error in fetchMembers:', error);
            toast.error("Failed to fetch data");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, []);

    const uniqueDepartments = [...new Set(members.map(m => m.department).filter(Boolean))];

    const filteredMembers = members.filter(m => {
        const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (m.staff_id && m.staff_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (m.phone && m.phone.includes(searchQuery)) ||
            (m.email && m.email.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesRole = !filterRole || m.role === filterRole;
        const matchesDepartment = !filterDepartment || (m.department && m.department.includes(filterDepartment));
        const matchesStatus = filterStatus === 'all' || m.status === filterStatus;

        return matchesSearch && matchesRole && matchesDepartment && matchesStatus;
    });

    const getManagerName = (managerId) => {
        if (!managerId) return '-';
        const manager = members.find(m => m.id === parseInt(managerId));
        return manager ? manager.name : 'Unknown';
    };

    const handleExportCSV = () => {
        const headers = ['Staff ID', 'Name', 'Role', 'Department', 'Phone', 'Email', 'Status'];
        const rows = filteredMembers.map(m => [
            m.staff_id || '-',
            m.name,
            m.role,
            m.department || '-',
            m.phone || '-',
            m.email || '-',
            m.status
        ]);
        generateCSV(headers, rows, 'Staff_Export');
    };

    const handleExportPDF = () => {
        const headers = ['Staff ID', 'Name', 'Role', 'Department', 'Phone', 'Status'];
        const rows = filteredMembers.map(m => [
            m.staff_id || '-',
            m.name,
            m.role || '-',
            m.department || '-',
            m.phone || '-',
            m.status
        ]);
        generatePDF({
            title: 'Staff List',
            period: 'All Time',
            stats: [
                { label: 'Total Staff', value: filteredMembers.length },
                { label: 'Active', value: filteredMembers.filter(m => m.status === 'active').length },
            ],
            tableHeaders: headers,
            tableRows: rows,
            filename: 'Staff_Report'
        });
    };

    const handleExportTXT = () => {
        handleExportCSV(); // Fallback to CSV logic for now or simple text
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await updateMember(editingId, { ...formData, sector });
                toast.success("Staff updated!");
            } else {
                await createMember({ ...formData, sector });
                toast.success("Staff added!");
            }
            resetForm();
            fetchMembers();
            if (onUpdate) onUpdate();
        } catch (error) {
            toast.error(editingId ? "Failed to update" : "Failed to add");
        }
    };

    const handleEdit = (member) => {
        setFormData({
            name: member.name,
            staff_id: member.staff_id || '',
            role: member.role || '',
            department: member.department || '',
            phone: member.phone || '',
            email: member.email || '',
            gender: member.gender || '',
            profile_image: member.profile_image || '',
            member_type: member.member_type || 'employee',
            wage_type: member.wage_type || 'monthly',
            daily_wage: member.daily_wage || '',
            status: member.status,
            employment_type: member.employment_type || 'permanent',
            date_of_joining: member.date_of_joining ? new Date(member.date_of_joining).toISOString().split('T')[0] : '',
            reporting_manager_id: member.reporting_manager_id || '',
            subjects: member.subjects || '',
            shift_start_time: member.shift_start_time || '09:00',
            shift_end_time: member.shift_end_time || '17:00',
            cl_balance: member.cl_balance || 0,
            sl_balance: member.sl_balance || 0,
            el_balance: member.el_balance || 0
        });
        setEditingId(member.id);
    };

    const handleDeleteClick = (id) => setDeleteModal({ show: true, id });
    const handleDeactivateClick = (member) => setDeactivateModal({ show: true, member });

    const confirmDeactivate = async () => {
        const member = deactivateModal.member;
        if (!member) return;
        try {
            await updateMember(member.id, { ...member, status: 'inactive', sector });
            toast.success("Staff deactivated");
            setDeactivateModal({ show: false, member: null });
            fetchMembers();
            if (onUpdate) onUpdate();
        } catch (error) {
            toast.error("Failed to deactivate");
        }
    };

    const confirmDelete = async () => {
        try {
            await deleteMember(deleteModal.id, { sector });
            toast.success("Staff deleted");
            setDeleteModal({ show: false, id: null });
            fetchMembers();
            if (onUpdate) onUpdate();
        } catch (error) {
            toast.error("Failed to delete");
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            staff_id: '',
            role: '',
            department: '',
            phone: '',
            email: '',
            gender: '',
            profile_image: '',
            member_type: 'employee',
            wage_type: 'monthly',
            daily_wage: '',
            status: 'active',
            employment_type: 'permanent',
            date_of_joining: new Date().toISOString().split('T')[0],
            reporting_manager_id: '',
            subjects: '',
            shift_start_time: '09:00',
            shift_end_time: '17:00',
            cl_balance: 0,
            sl_balance: 0,
            el_balance: 0
        });
        setEditingId(null);
    };

    return (
        <div className="animate-in slide-in-from-right-10 duration-500 pb-20 w-full font-['Outfit']">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <FaUsers className="text-blue-600" /> Manage Staff
                    </h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Add and manage staff members</p>
                </div>
                <div className="flex items-center gap-3">
                    <ExportButtons onExportCSV={handleExportCSV} onExportPDF={handleExportPDF} onExportTXT={handleExportTXT} />
                </div>
            </div>

            <div className="flex-1">
                <form onSubmit={handleSubmit} className="mb-8 space-y-6">
                    {/* 1. Basic Information */}
                    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                        <button
                            type="button"
                            onClick={() => toggleCollapse('basic')}
                            className="w-full px-6 py-4 flex items-center justify-between bg-slate-50/50 hover:bg-slate-50 transition-colors border-b border-slate-100"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                                    <FaUser size={14} />
                                </div>
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">1. Basic Information</h3>
                            </div>
                            <span className={`text-slate-400 transition-transform duration-300 ${collapsed.basic ? '-rotate-90' : ''}`}>▼</span>
                        </button>

                        {!collapsed.basic && (
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-2">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Full Name *</label>
                                    <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Enter full name" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 h-11 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Staff ID / code *</label>
                                    <input required type="text" value={formData.staff_id} onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })} placeholder="E.g. STF001" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 h-11 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Gender</label>
                                    <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 h-11 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 cursor-pointer">
                                        <option value="">Select Gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Phone Number</label>
                                    <div className="relative">
                                        <FaPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={12} />
                                        <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="Contact number" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 h-11 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
                                    <div className="relative">
                                        <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={12} />
                                        <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="Email address" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 h-11 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Profile Photo URL</label>
                                    <input type="text" value={formData.profile_image} onChange={(e) => setFormData({ ...formData, profile_image: e.target.value })} placeholder="Image URL (optional)" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 h-11 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 2. Job Information */}
                    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                        <button
                            type="button"
                            onClick={() => toggleCollapse('job')}
                            className="w-full px-6 py-4 flex items-center justify-between bg-slate-50/50 hover:bg-slate-50 transition-colors border-b border-slate-100"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                    <FaBriefcase size={14} />
                                </div>
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">2. Job Information</h3>
                            </div>
                            <span className={`text-slate-400 transition-transform duration-300 ${collapsed.job ? '-rotate-90' : ''}`}>▼</span>
                        </button>

                        {!collapsed.job && (
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-2">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Department *</label>
                                    <div className="flex gap-2">
                                        <select required value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 h-11 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 cursor-pointer">
                                            <option value="">Select Department</option>
                                            {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                                        </select>
                                        <button type="button" onClick={() => setShowDeptManager(true)} className="w-11 h-11 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center hover:bg-orange-50 hover:text-orange-600 transition-all border border-slate-200 shrink-0"><FaPlus size={12} /></button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Designation / Role *</label>
                                    <div className="flex gap-2">
                                        <select required value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 h-11 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 cursor-pointer">
                                            <option value="">Select Role</option>
                                            {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                                        </select>
                                        <button type="button" onClick={() => setShowRoleManager(true)} className="w-11 h-11 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center hover:bg-purple-50 hover:text-purple-600 transition-all border border-slate-200 shrink-0"><FaPlus size={12} /></button>
                                    </div>
                                </div>

                                {formData.role?.toLowerCase().includes('teacher') && (
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Subjects</label>
                                        <input type="text" value={formData.subjects || ''} onChange={(e) => setFormData({ ...formData, subjects: e.target.value })} placeholder="E.g. Maths, Physics" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 h-11 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all" />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Employment Type</label>
                                    <select value={formData.employment_type} onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 h-11 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 cursor-pointer">
                                        <option value="permanent">Permanent</option>
                                        <option value="contract">Contract</option>
                                        <option value="visiting">Visiting</option>
                                        <option value="part_time">Part-time</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Member Type</label>
                                    <select value={formData.member_type} onChange={(e) => setFormData({ ...formData, member_type: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 h-11 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 cursor-pointer">
                                        <option value="employee">Monthly Basis</option>
                                        <option value="worker">Daily Basis</option>
                                        <option value="student">Hourly Basis</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Date of Joining *</label>
                                    <input required type="date" value={formData.date_of_joining} onChange={(e) => setFormData({ ...formData, date_of_joining: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 h-11 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Reporting To (HOD/Manager) *</label>
                                    <select required value={formData.reporting_manager_id} onChange={(e) => setFormData({ ...formData, reporting_manager_id: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 h-11 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 cursor-pointer">
                                        <option value="">Select Manager</option>
                                        {members.filter(m => m.id !== editingId).map(m => (
                                            <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Status</label>
                                    <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 h-11 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 cursor-pointer">
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 3. Attendance & Leave */}
                    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                        <button
                            type="button"
                            onClick={() => toggleCollapse('attendance')}
                            className="w-full px-6 py-4 flex items-center justify-between bg-slate-50/50 hover:bg-slate-50 transition-colors border-b border-slate-100"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                    <FaCheck size={12} />
                                </div>
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">3. Attendance & Leave</h3>
                            </div>
                            <span className={`text-slate-400 transition-transform duration-300 ${collapsed.attendance ? '-rotate-90' : ''}`}>▼</span>
                        </button>

                        {!collapsed.attendance && (
                            <div className="p-6 space-y-8 animate-in fade-in slide-in-from-top-2">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Shift Start Time</label>
                                        <input type="time" value={formData.shift_start_time} onChange={(e) => setFormData({ ...formData, shift_start_time: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 h-11 text-xs font-bold text-slate-700 outline-none focus:border-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Shift End Time</label>
                                        <input type="time" value={formData.shift_end_time} onChange={(e) => setFormData({ ...formData, shift_end_time: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 h-11 text-xs font-bold text-slate-700 outline-none focus:border-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Monthly Salary / Daily Wage</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                            <input type="number" value={formData.daily_wage} onChange={(e) => setFormData({ ...formData, daily_wage: e.target.value })} placeholder="0.00" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 h-11 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all" />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-100">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Leave Balances (Initial)</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Casual Leave (CL)</label>
                                            <input type="number" value={formData.cl_balance} onChange={(e) => setFormData({ ...formData, cl_balance: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 h-11 text-xs font-bold text-slate-700 outline-none focus:border-blue-500" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Sick Leave (SL)</label>
                                            <input type="number" value={formData.sl_balance} onChange={(e) => setFormData({ ...formData, sl_balance: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 h-11 text-xs font-bold text-slate-700 outline-none focus:border-blue-500" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Earned Leave (EL)</label>
                                            <input type="number" value={formData.el_balance} onChange={(e) => setFormData({ ...formData, el_balance: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 h-11 text-xs font-bold text-slate-700 outline-none focus:border-blue-500" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-4 pt-4">
                        <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2">
                            {editingId ? <FaEdit /> : <FaPlus />} {editingId ? 'Update Staff Member' : 'Register New Staff'}
                        </button>
                        {editingId && (
                            <button type="button" onClick={resetForm} className="px-8 bg-slate-100 hover:bg-slate-200 text-slate-600 h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                                Cancel
                            </button>
                        )}
                    </div>
                </form>

                <div className="bg-white/80 backdrop-blur-xl p-4 rounded-[24px] border border-white/20 shadow-xl shadow-slate-200/50 mb-6 sticky top-2 z-10">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="relative group">
                            <FaTag className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 " size={12} />
                            <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="w-full bg-indigo-50 hover:bg-indigo-100 border border-transparent rounded-2xl py-3 pl-10 pr-10 text-xs font-black text-indigo-600 text-center outline-none cursor-pointer uppercase">
                                <option value="">All Roles</option>
                                {[...new Set(members.map(m => m.role).filter(Boolean))].map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                        <div className="relative group">
                            <FaBuilding className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400 " size={12} />
                            <select value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)} className="w-full bg-orange-50 hover:bg-orange-100 border border-transparent rounded-2xl py-3 pl-10 pr-10 text-xs font-black text-orange-600 text-center outline-none cursor-pointer uppercase">
                                <option value="">All Depts</option>
                                {/* Combine used departments and available departments for filter */}
                                {[...new Set([...departments.map(d => d.name), ...uniqueDepartments])].map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <div className="relative group">
                            <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" size={12} />
                            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full bg-purple-50 hover:bg-purple-100 border border-transparent rounded-2xl py-3 pl-8 pr-6 text-xs font-black text-purple-600 text-center outline-none cursor-pointer uppercase">
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                        <div className="relative group">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" size={12} />
                            <input type="text" placeholder="SEARCH..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-blue-50 hover:bg-blue-100 border border-transparent rounded-2xl py-3 pl-8 pr-4 text-xs font-black text-blue-600 text-center placeholder:text-blue-300 outline-none uppercase" />
                        </div>
                    </div>
                    {isOwner && (
                        <div className="flex items-center justify-between mt-4 px-2">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    onChange={handleSelectAll}
                                    checked={filteredMembers.length > 0 && selectedMembers.length === filteredMembers.length}
                                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select All</span>
                            </div>
                            {selectedMembers.length > 0 && (
                                <button
                                    onClick={() => setBulkDeleteModal(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-colors shadow-sm"
                                >
                                    <FaTrash size={12} /> Delete Selected ({selectedMembers.length})
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className="px-[4px] py-[4px] overflow-y-auto custom-scrollbar flex-1">
                    <div className="space-y-3 font-['Outfit']">
                        {loading ? <div className="text-center py-8">Loading...</div> : filteredMembers.length > 0 ? (
                            filteredMembers.map(member => (
                                <div key={member.id} className="bg-white border border-slate-100 rounded-xl p-4 hover:border-blue-200 transition-all group">
                                    <div className="flex flex-col gap-3">
                                        {/* Header: Name, Tags, Status, Actions */}
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center flex-wrap gap-2">
                                                {isOwner && (
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedMembers.includes(member.id)}
                                                        onChange={() => toggleSelectMember(member.id)}
                                                        className="w-4 h-4 mr-2 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                    />
                                                )}
                                                <h4 className="text-[16px] font-black text-slate-900">{member.name}</h4>

                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-black uppercase tracking-wider bg-purple-50 text-purple-600 px-2 py-1 rounded-md">
                                                        {member.member_type} | {member.wage_type}
                                                    </span>
                                                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-md ${member.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                                        {member.status}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEdit(member)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><FaEdit size={14} /></button>
                                                {member.status === 'active' ?
                                                    <button onClick={() => handleDeactivateClick(member)} className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"><FaBan size={14} /></button> :
                                                    <button onClick={async () => { await updateMember(member.id, { ...member, status: 'active', sector }); fetchMembers(); }} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"><FaCheck size={14} /></button>
                                                }
                                                {isOwner && <button onClick={() => handleDeleteClick(member.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><FaTrash size={14} /></button>}
                                            </div>
                                        </div>

                                        {/* Details Grid */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-8">
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <FaBriefcase className="text-slate-400" size={12} />
                                                <span className="text-[12px] font-bold">{member.role || 'No Role'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <FaPhone className="text-slate-400" size={12} />
                                                <span className="text-[12px] font-medium">{member.phone || '-'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <FaUsers className="text-slate-400" size={12} />
                                                <span className="text-[12px] font-medium">Reports to: <b>{getManagerName(member.reporting_manager_id)}</b></span>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <FaEnvelope className="text-slate-400" size={12} />
                                                <span className="text-[12px] font-medium lowercase">{member.email || '-'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <span className="font-sans text-slate-400 text-[14px]">₹</span>
                                                <span className="text-[12px] font-medium capitalize">{member.wage_type}: <span className="text-slate-700 font-bold">₹{member.daily_wage || 0}</span></span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : <div className="text-center py-[48px] text-slate-400">No staff found</div>}
                    </div>
                </div>
            </div>
            <ConfirmModal isOpen={deactivateModal.show} title="Deactivate Staff?" message={`Deactivate ${deactivateModal.member?.name}?`} onConfirm={confirmDeactivate} onCancel={() => setDeactivateModal({ show: false, member: null })} confirmText="Deactivate" cancelText="Cancel" type="warning" />
            <ConfirmModal isOpen={deleteModal.show} title="Delete Staff?" message="This action cannot be undone." onConfirm={confirmDelete} onCancel={() => setDeleteModal({ show: false, id: null })} confirmText="Delete" cancelText="Cancel" type="danger" />
            <ConfirmModal isOpen={bulkDeleteModal} title="Delete Selected Staff?" message={`Are you sure you want to delete ${selectedMembers.length} staff members? This action cannot be undone.`} onConfirm={handleBulkDelete} onCancel={() => setBulkDeleteModal(false)} confirmText={`Delete ${selectedMembers.length} Staff`} cancelText="Cancel" type="danger" />
            {showRoleManager && <RoleManager roles={roles} onCreate={(data) => createMemberRole({ ...data, sector })} onDelete={(id) => deleteMemberRole(id, { sector })} onClose={() => { setShowRoleManager(false); fetchMembers(); }} onRefresh={() => getMemberRoles({ sector }).then(res => setRoles(res.data.data))} placeholder="Teacher, Clerk..." />}
            {showDeptManager && <DepartmentManager departments={departments} onCreate={(data) => createDepartment({ ...data, sector })} onDelete={(id) => deleteDepartment(id, { sector })} onClose={() => { setShowDeptManager(false); fetchMembers(); }} onRefresh={() => getDepartments({ sector }).then(res => setDepartments(res.data.data))} placeholder="Maths, Science, Admin..." />}
        </div>
    );
};

export default EducationMemberManager;
