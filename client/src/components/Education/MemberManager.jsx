import { getMembers, createMember, updateMember, deleteMember } from '../../api/memberApi';
import { getMemberRoles, createMemberRole, deleteMemberRole } from '../../api/memberRoleApi';
import toast from 'react-hot-toast';
import { FaTimes, FaPlus, FaEdit, FaTrash, FaUser, FaUsers, FaBriefcase, FaPhone, FaEnvelope, FaTag, FaSearch, FaFilter, FaIdCard, FaBuilding, FaBan, FaCheck } from 'react-icons/fa';
import ConfirmModal from '../modals/ConfirmModal';
import RoleManager from '../IT/RoleManager'; // Reuse IT RoleManager or create new one if needed
import ExportButtons from '../Common/ExportButtons';
import { generateCSV, generatePDF, generateTXT } from '../../utils/exportUtils/base.js';
import { useState, useEffect } from 'react';

import { getDepartments, createDepartment, deleteDepartment } from '../../api/departmentApi';
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
        member_type: 'employee',
        wage_type: 'monthly',
        daily_wage: '',
        status: 'active'
    });

    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [filterDepartment, setFilterDepartment] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    const [editingId, setEditingId] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ show: false, id: null });
    const [deactivateModal, setDeactivateModal] = useState({ show: false, member: null });

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
            member_type: member.member_type || 'employee',
            wage_type: member.wage_type || 'monthly',
            daily_wage: member.daily_wage || '',
            status: member.status
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
        setFormData({ name: '', staff_id: '', role: '', department: '', phone: '', email: '', member_type: 'employee', wage_type: 'monthly', daily_wage: '', status: 'active' });
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
                <form onSubmit={handleSubmit} className="mb-6 p-6 bg-white rounded-[32px] border border-slate-100 shadow-sm font-['Outfit']">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div className="col-span-1">
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Name *</label>
                            <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Full name" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 h-10 text-xs font-bold text-slate-700 outline-none focus:border-blue-500" />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Staff ID</label>
                            <input type="text" value={formData.staff_id} onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })} placeholder="ID / Emp Code" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 h-10 text-xs font-bold text-slate-700 outline-none focus:border-blue-500" />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Role</label>
                            <div className="flex gap-2">
                                <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 h-10 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 cursor-pointer">
                                    <option value="">Select Role</option>
                                    {[...new Set([...roles.map(r => r.name), ...uniqueDepartments])].map(role => (
                                        <option key={role} value={role}>{role}</option>
                                    ))}
                                </select>
                                <button type="button" onClick={() => setShowRoleManager(true)} className="w-10 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center hover:bg-purple-50 hover:text-purple-600 transition-all border border-slate-200"><FaPlus size={10} /></button>
                            </div>
                        </div>
                        <div className="col-span-1">
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Subjects (Departments)</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1 bg-slate-50 border border-slate-200 rounded-xl min-h-[40px] px-2 py-1 flex flex-wrap items-center gap-2">
                                    {formData.department ? formData.department.split(',').map(d => d.trim()).filter(Boolean).map((dept, idx) => (
                                        <span key={idx} className="relative z-20 bg-white border border-slate-200 text-slate-700 text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                                            {dept}
                                            <button type="button" onClick={() => {
                                                const current = formData.department.split(',').map(d => d.trim()).filter(Boolean);
                                                const newDepts = current.filter(d => d !== dept);
                                                setFormData({ ...formData, department: newDepts.join(', ') });
                                            }} className="text-slate-400 hover:text-red-500 cursor-pointer pointer-events-auto"><FaTimes size={10} /></button>
                                        </span>
                                    )) : <span className="text-slate-400 text-xs px-2">Select subjects...</span>}

                                    <select
                                        value=""
                                        onChange={(e) => {
                                            if (!e.target.value) return;
                                            const current = formData.department ? formData.department.split(',').map(d => d.trim()).filter(Boolean) : [];
                                            if (!current.includes(e.target.value)) {
                                                setFormData({ ...formData, department: [...current, e.target.value].join(', ') });
                                            }
                                        }}
                                        className="bg-transparent text-xs font-bold text-slate-700 outline-none w-auto min-w-[20px] flex-1 cursor-pointer opacity-0 absolute inset-0 z-10"
                                    >
                                        <option value="">Add Subject...</option>
                                        {departments.filter(d => !formData.department?.includes(d.name)).map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                                    </select>
                                    <div className="ml-auto pointer-events-none text-slate-400 pr-2 relative z-0 text-xs">+</div>
                                </div>
                                <button type="button" onClick={() => setShowDeptManager(true)} className="w-10 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center hover:bg-orange-50 hover:text-orange-600 transition-all border border-slate-200 shrink-0"><FaPlus size={10} /></button>
                            </div>
                        </div>
                        <div className="col-span-1">
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Phone</label>
                            <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="Contact number" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 h-10 text-xs font-bold text-slate-700 outline-none focus:border-blue-500" />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Email</label>
                            <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="Email address" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 h-10 text-xs font-bold text-slate-700 outline-none focus:border-blue-500" />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Member Type</label>
                            <select
                                value={`${formData.member_type}|${formData.wage_type}`}
                                onChange={(e) => {
                                    const [mType, wType] = e.target.value.split('|');
                                    setFormData({ ...formData, member_type: mType, wage_type: wType });
                                }}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 h-10 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
                            >
                                <option value="employee|monthly">Employee (Monthly)</option>
                                <option value="worker|daily">Worker (Daily)</option>
                                <option value="student|monthly">Student (Monthly)</option>
                            </select>
                        </div>
                        <div className="col-span-1">
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">{formData.wage_type === 'monthly' ? 'Monthly Salary' : 'Daily Wage'}</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                <input
                                    type="number"
                                    value={formData.daily_wage}
                                    onChange={(e) => setFormData({ ...formData, daily_wage: e.target.value })}
                                    placeholder="0.00"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 h-10 text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>
                        <div className="col-span-1">
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Status</label>
                            <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 h-10 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 cursor-pointer">
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                        <div className="col-span-1 flex items-end gap-2">
                            <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-10 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2">
                                <FaPlus className="text-[10px]" /> {editingId ? 'Update' : 'Add Staff'}
                            </button>
                            {editingId && <button type="button" onClick={resetForm} className="px-6 bg-slate-100 hover:bg-slate-200 text-slate-600 h-10 rounded-xl text-xs font-black uppercase tracking-widest transition-all">Cancel</button>}
                        </div>
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
            {showRoleManager && <RoleManager roles={roles} onCreate={(data) => createMemberRole({ ...data, sector })} onDelete={(id) => deleteMemberRole(id, { sector })} onClose={() => { setShowRoleManager(false); fetchMembers(); }} onRefresh={() => getMemberRoles({ sector }).then(res => setRoles(res.data.data))} placeholder="Teacher, Clerk..." />}
            {showDeptManager && <DepartmentManager departments={departments} onCreate={(data) => createDepartment({ ...data, sector })} onDelete={(id) => deleteDepartment(id, { sector })} onClose={() => { setShowDeptManager(false); fetchMembers(); }} onRefresh={() => getDepartments({ sector }).then(res => setDepartments(res.data.data))} placeholder="Maths, Science, Admin..." />}
        </div>
    );
};

export default EducationMemberManager;
