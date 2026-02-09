import { getMembers, createMember, updateMember, deleteMember, getGuests, getMemberRoles, createMemberRole, deleteMemberRole } from '../../api/TeamManagement/hotelTeam';
import { getProjects, getShifts } from '../../api/Attendance/hotelAttendance';
import { getTransactions } from '../../api/Expense/hotelExpense';
import toast from 'react-hot-toast';
import { FaTimes, FaPlus, FaEdit, FaTrash, FaUser, FaUsers, FaBriefcase, FaPhone, FaEnvelope, FaHistory, FaMoneyBillWave, FaUniversity, FaTag, FaSearch, FaFilter, FaFolder, FaBan, FaCheck } from 'react-icons/fa';
import ConfirmModal from '../modals/ConfirmModal';
import RoleManager from '../IT/RoleManager';
import ExportButtons from '../Common/ExportButtons';
import { generateCSV, generatePDF, generateTXT } from '../../utils/exportUtils/base.js';
import { useState, useEffect } from 'react';

const MemberManager = ({ onClose, onUpdate, sector = 'hotel', projects: parentProjects, shifts: parentShifts }) => {

    // Get current user role
    const userJson = localStorage.getItem('user');
    const currentUser = userJson ? JSON.parse(userJson) : null;
    const isOwner = currentUser?.role === 'owner';

    const [members, setMembers] = useState([]);
    const [projects, setProjects] = useState(parentProjects || []);
    const [shifts, setShifts] = useState(parentShifts || []);
    const [roles, setRoles] = useState([]); // ROLES STATE
    const [showRoleManager, setShowRoleManager] = useState(false); // MANAGER STATE
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        role: '',
        phone: '',
        email: '',
        project_id: '',
        member_type: 'staff',
        employment_nature: 'Permanent',
        primary_work_area: 'Rooms',
        wage_type: 'monthly',
        monthly_salary: '',
        daily_wage: '',
        hourly_rate: '',
        overtime_rate: '',
        allow_overtime: true,
        allow_late: true,
        max_hours_per_day: 12,
        auto_mark_absent: false,
        default_shift_id: '',
        status: 'active'
    });

    // ... existing filter state and other states ...
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [filterProject, setFilterProject] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');

    const [editingId, setEditingId] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ show: false, id: null });
    const [deactivateModal, setDeactivateModal] = useState({ show: false, member: null }); // Deactivate modal state
    const [viewingPayments, setViewingPayments] = useState(null); // Member object
    const [payments, setPayments] = useState([]);
    const [paymentsLoading, setPaymentsLoading] = useState(false);

    const fetchMembers = async () => {
        try {
            console.log('Fetching members for sector:', sector);
            const promises = [
                getMembers({ sector }),
                getMemberRoles({ sector }),
                getGuests({ sector })
            ];

            // Only fetch projects if not provided by parent
            if (!parentProjects || parentProjects.length === 0) {
                promises.push(getProjects({ sector }));
            }
            if (!parentShifts || parentShifts.length === 0) {
                promises.push(getShifts({ sector }));
            }

            const results = await Promise.all(promises);

            // Safely extract data with fallbacks
            const membersData = results[0]?.data?.data || [];
            const rolesData = results[1]?.data?.data || [];
            const guestsData = results[2]?.data?.data || [];

            console.log('Members response:', results[0]);
            console.log('Roles response:', results[1]);
            console.log('Guests response:', results[2]);

            // Handle dynamic promises results
            let fetchedProjects = parentProjects || [];
            let fetchedShifts = parentShifts || [];

            let extraIndex = 3;
            if (!parentProjects || parentProjects.length === 0) {
                const projectsRes = results[extraIndex++];
                fetchedProjects = projectsRes?.data?.data || projectsRes?.data || [];
            }
            if (!parentShifts || parentShifts.length === 0) {
                const shiftsRes = results[extraIndex];
                fetchedShifts = shiftsRes?.data?.data || shiftsRes?.data || [];
            }

            setMembers([...membersData, ...guestsData]);
            setRoles(rolesData);
            setProjects(fetchedProjects);
            setShifts(fetchedShifts);
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

    // Filter Logic
    const filteredMembers = members.filter(m => {
        if (!m) return false;

        const matchesSearch = (m.name && m.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (m.phone && m.phone.includes(searchQuery)) ||
            (m.email && m.email.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesRole = !filterRole || m.role === filterRole;
        const matchesProject = !filterProject || (m.project_id && m.project_id.toString() === filterProject.toString());
        const matchesType = filterType === 'all' ||
            (filterType === 'guest' ? m.isGuest : m.member_type === filterType);
        const matchesStatus = filterStatus === 'all' || m.status === filterStatus;

        return matchesSearch && matchesRole && matchesProject && matchesType && matchesStatus;
    });

    // Export Handlers
    const handleExportCSV = () => {
        const headers = ['Name', 'Role', 'Type', 'Status', 'Phone', 'Email', 'Wage Calculation'];
        const rows = filteredMembers.map(m => [
            m.name,
            m.role,
            m.member_type,
            m.status,
            m.phone,
            m.email,
            `${m.wage_type === 'monthly' ? 'Monthly' : (m.wage_type === 'hourly' ? 'Hourly' : 'Daily')}: ₹${m.wage_type === 'monthly' ? m.monthly_salary : (m.wage_type === 'hourly' ? m.hourly_rate : m.daily_wage)}`
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
            `${m.wage_type === 'monthly' ? 'Monthly' : (m.wage_type === 'hourly' ? 'Hourly' : 'Daily')}: ₹${m.wage_type === 'monthly' ? m.monthly_salary : (m.wage_type === 'hourly' ? m.hourly_rate : m.daily_wage)}`
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
            `${m.wage_type === 'monthly' ? 'Monthly' : (m.wage_type === 'hourly' ? 'Hourly' : 'Daily')}: ₹${m.wage_type === 'monthly' ? m.monthly_salary : (m.wage_type === 'hourly' ? m.hourly_rate : m.daily_wage)}`
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

    // Handle Edit
    const handleEdit = (member) => {
        setFormData({
            name: member.name,
            role: member.role || '',
            phone: member.phone || '',
            email: member.email || '',
            member_type: member.member_type || 'staff',
            employment_nature: member.employment_nature || 'Permanent',
            primary_work_area: member.primary_work_area || 'Rooms',
            wage_type: member.wage_type || 'monthly',
            monthly_salary: member.monthly_salary || '',
            daily_wage: member.daily_wage || '',
            hourly_rate: member.hourly_rate || '',
            overtime_rate: member.overtime_rate || '',
            allow_overtime: !!member.allow_overtime,
            allow_late: !!member.allow_late,
            max_hours_per_day: member.max_hours_per_day || 12,
            auto_mark_absent: !!member.auto_mark_absent,
            default_shift_id: member.default_shift_id || '',
            status: member.status,
            project_id: member.project_id || ''
        });
        setEditingId(member.id);
    };

    const resetForm = () => {
        setFormData({
            name: '', role: '', phone: '', email: '', project_id: '',
            member_type: 'staff', employment_nature: 'Permanent', primary_work_area: 'Rooms',
            wage_type: 'monthly', monthly_salary: '', daily_wage: '', hourly_rate: '', overtime_rate: '',
            allow_overtime: true, allow_late: true, max_hours_per_day: 12, auto_mark_absent: false,
            default_shift_id: '', status: 'active'
        });
        setEditingId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData, sector };
            if (editingId) {
                await updateMember(editingId, payload);
                toast.success("Member updated!");
            } else {
                await createMember(payload);
                toast.success("Member added!");
            }
            resetForm();
            fetchMembers();
            if (onUpdate) onUpdate();
        } catch (error) {
            toast.error(editingId ? "Failed to update member" : "Failed to add member");
        }
    };

    const confirmDeactivate = async () => {
        const member = deactivateModal.member;
        if (!member) return;
        try {
            await updateMember(member.id, { ...member, status: 'inactive', sector });
            toast.success("Member deactivated");
            setDeactivateModal({ show: false, member: null });
            fetchMembers();
            if (onUpdate) onUpdate();
        } catch (error) {
            toast.error("Failed to deactivate member");
        }
    };

    const confirmDelete = async () => {
        try {
            await deleteMember(deleteModal.id, { sector });
            toast.success("Member deleted");
            setDeleteModal({ show: false, id: null });
            fetchMembers();
            if (onUpdate) onUpdate();
        } catch (error) {
            toast.error("Failed to delete member");
        }
    };

    const handleDeleteClick = (id) => {
        setDeleteModal({ show: true, id });
    };

    const handleDeactivateClick = (member) => {
        setDeactivateModal({ show: true, member });
    };

    return (
        <div className="animate-in slide-in-from-right-10 duration-500 pb-20 w-full font-['Outfit']">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <FaUsers className="text-blue-600" /> Manage Staff
                    </h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Staff Roster & Attendance Configuration</p>
                </div>
                <div className="flex items-center gap-3">
                    <ExportButtons onExportCSV={handleExportCSV} onExportPDF={handleExportPDF} onExportTXT={handleExportTXT} />
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="mb-6 bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div>
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Full Name *</label>
                            <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 h-10 text-xs font-bold" />
                        </div>
                        <div>
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Designation</label>
                            <div className="flex gap-2">
                                <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 h-10 text-xs font-bold">
                                    <option value="">Select Role</option>
                                    {[...new Set([...roles.map(r => r.name), ...members.map(m => m.role).filter(Boolean)])].sort().map(role => <option key={role} value={role}>{role}</option>)}
                                </select>
                                <button type="button" onClick={() => setShowRoleManager(true)} className="w-10 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all"><FaPlus /></button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Department</label>
                            <select value={formData.project_id} onChange={(e) => setFormData({ ...formData, project_id: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 h-10 text-xs font-bold">
                                <option value="">No Department</option>
                                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Contact Phone</label>
                            <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 h-10 text-xs font-bold" />
                        </div>
                    </div>

                    {/* Pro Info */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div>
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Employment Nature</label>
                            <select value={formData.employment_nature} onChange={(e) => setFormData({ ...formData, employment_nature: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 h-10 text-xs font-bold">
                                <option value="Permanent">Permanent</option>
                                <option value="Contract">Contract</option>
                                <option value="Seasonal">Seasonal</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Primary Work Area</label>
                            <select value={formData.primary_work_area} onChange={(e) => setFormData({ ...formData, primary_work_area: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 h-10 text-xs font-bold">
                                <option value="Rooms">Rooms / Housekeeping</option>
                                <option value="Reception">Reception / Front Desk</option>
                                <option value="Kitchen">Kitchen / F&B</option>
                                <option value="Security">Security</option>
                                <option value="Maintenance">Maintenance</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Default Shift *</label>
                            <select required value={formData.default_shift_id} onChange={(e) => setFormData({ ...formData, default_shift_id: e.target.value })} className="w-full bg-blue-50 border border-blue-100 rounded-xl px-3 h-10 text-xs font-bold text-blue-700">
                                <option value="">Assign Shift</option>
                                {shifts.map(s => <option key={s.id} value={s.id}>{s.name} ({s.start_time?.slice(0, 5)})</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Staff Status</label>
                            <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 h-10 text-xs font-bold">
                                <option value="active">Active (On Roster)</option>
                                <option value="inactive">Inactive (Relieved)</option>
                            </select>
                        </div>
                    </div>

                    {/* Wage Configuration */}
                    <div className="bg-slate-50/50 p-4 rounded-2xl border border-dashed border-slate-200 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Wage Calculation</label>
                                <select value={formData.wage_type} onChange={(e) => setFormData({ ...formData, wage_type: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl px-3 h-10 text-xs font-bold">
                                    <option value="monthly">Monthly Salary</option>
                                    <option value="daily">Daily Wage</option>
                                    <option value="hourly">Hourly Pay</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                                    {formData.wage_type === 'monthly' ? 'Base Salary' : (formData.wage_type === 'hourly' ? 'Rate per Hour' : 'Rate per Day')}
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                                    <input
                                        type="number"
                                        value={formData.wage_type === 'monthly' ? formData.monthly_salary : (formData.wage_type === 'hourly' ? formData.hourly_rate : formData.daily_wage)}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (formData.wage_type === 'monthly') setFormData({ ...formData, monthly_salary: val });
                                            else if (formData.wage_type === 'hourly') setFormData({ ...formData, hourly_rate: val });
                                            else setFormData({ ...formData, daily_wage: val });
                                        }}
                                        className="w-full bg-white border border-slate-200 rounded-xl pl-6 h-10 text-xs font-bold"
                                    />
                                </div>
                            </div>
                            {formData.allow_overtime && (
                                <div>
                                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">OT Rate (per hour)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                                        <input type="number" value={formData.overtime_rate} onChange={(e) => setFormData({ ...formData, overtime_rate: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl pl-6 h-10 text-xs font-bold text-blue-600" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Rules */}
                    <div className="flex flex-wrap items-center gap-6 px-2">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input type="checkbox" checked={formData.allow_overtime} onChange={(e) => setFormData({ ...formData, allow_overtime: e.target.checked })} className="hidden" />
                            <div className={`w-10 h-5 rounded-full relative transition-all ${formData.allow_overtime ? 'bg-blue-600' : 'bg-slate-200'}`}>
                                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${formData.allow_overtime ? 'left-6' : 'left-1'}`} />
                            </div>
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">Allow OT</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input type="checkbox" checked={formData.allow_late} onChange={(e) => setFormData({ ...formData, allow_late: e.target.checked })} className="hidden" />
                            <div className={`w-10 h-5 rounded-full relative transition-all ${formData.allow_late ? 'bg-blue-600' : 'bg-slate-200'}`}>
                                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${formData.allow_late ? 'left-6' : 'left-1'}`} />
                            </div>
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">Allow Late</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input type="checkbox" checked={formData.auto_mark_absent} onChange={(e) => setFormData({ ...formData, auto_mark_absent: e.target.checked })} className="hidden" />
                            <div className={`w-10 h-5 rounded-full relative transition-all ${formData.auto_mark_absent ? 'bg-orange-600' : 'bg-slate-200'}`}>
                                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${formData.auto_mark_absent ? 'left-6' : 'left-1'}`} />
                            </div>
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">Auto Absent</span>
                        </label>
                        <div className="flex items-center gap-3 ml-auto">
                            <span className="text-[10px] font-black text-slate-400 uppercase">Max Hrs/Day</span>
                            <input type="number" step="0.5" value={formData.max_hours_per_day} onChange={(e) => setFormData({ ...formData, max_hours_per_day: e.target.value })} className="w-16 bg-slate-100 border-none rounded-lg h-8 text-center text-xs font-bold" />
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 font-['Outfit']">
                    {editingId && <button type="button" onClick={resetForm} className="px-6 py-2 text-xs font-black uppercase text-slate-500 hover:text-slate-700 transition-all">Cancel Edit</button>}
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-2">
                        {editingId ? <><FaEdit /> Update Staff</> : <><FaPlus /> Add to Roster</>}
                    </button>
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

                    {/* Project Filter - Orange */}
                    <div className="relative group">
                        <FaFolder className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400 group-hover:text-orange-500 transition-colors" size={12} />
                        <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)} className="w-full bg-orange-50 hover:bg-orange-100 border border-transparent rounded-2xl py-3 pl-10 pr-10 text-xs font-black text-orange-600 text-center outline-none focus:ring-2 focus:ring-orange-200 transition-all cursor-pointer appearance-none uppercase tracking-wide">
                            <option value="">All Departments</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-orange-400 text-[10px]">▼</div>
                    </div>

                    {/* Status Filter - Purple */}
                    <div className="relative group">
                        <FaFilter className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-purple-400 group-hover:text-purple-500 transition-colors" size={12} />
                        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full bg-purple-50 hover:bg-purple-100 border border-transparent rounded-2xl py-2 md:py-3 pl-8 md:pl-10 pr-6 md:pr-10 text-[10px] md:text-xs font-black text-purple-600 text-center outline-none focus:ring-2 focus:ring-purple-200 transition-all cursor-pointer appearance-none uppercase tracking-wide">
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                        <div className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 pointer-events-none text-purple-400 text-[10px]">▼</div>
                    </div>

                    {/* Search - Blue */}
                    <div className="relative group">
                        <FaSearch className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-blue-400 group-hover:text-blue-500 transition-colors" size={12} />
                        <input
                            type="text"
                            placeholder="SEARCH..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-blue-50 hover:bg-blue-100 border border-transparent rounded-2xl py-2 md:py-3 pl-8 md:pl-10 pr-4 text-[10px] md:text-xs font-black text-blue-600 text-center placeholder:text-blue-300 outline-none focus:ring-2 focus:ring-blue-200 transition-all uppercase tracking-wide"
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
                            <div key={member.id} className="bg-white border border-slate-100 rounded-2xl p-5 hover:border-blue-200 transition-all group shadow-sm">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h4 className="text-lg font-black text-slate-900">{member.name}</h4>
                                            {member.employment_nature && <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-2 py-1 rounded-full uppercase">{member.employment_nature}</span>}
                                            <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase ${member.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>{member.status}</span>
                                        </div>
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-3 gap-x-6 text-[11px] font-bold text-slate-500">
                                            <div className="flex items-center gap-2"><div className="w-5 h-5 rounded-lg bg-slate-100 flex items-center justify-center"><FaBriefcase className="text-[10px]" /></div> {member.role || 'No Role'}</div>
                                            <div className="flex items-center gap-2"><div className="w-5 h-5 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600"><FaTag className="text-[10px]" /></div> {member.primary_work_area || 'N/A'}</div>
                                            <div className="flex items-center gap-2"><div className="w-5 h-5 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600"><FaHistory className="text-[10px]" /></div> {shifts.find(s => s.id === member.default_shift_id)?.name || 'No Shift'}</div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600"><FaMoneyBillWave className="text-[10px]" /></div>
                                                ₹{member.wage_type === 'monthly' ? (member.monthly_salary || 0) : (member.wage_type === 'hourly' ? (member.hourly_rate || 0) : (member.daily_wage || 0))} / {member.wage_type || 'daily'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">

                                        {!member.isGuest && (
                                            <>
                                                <button
                                                    onClick={() => handleEdit(member)}
                                                    className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                                    title="Edit Member"
                                                >
                                                    <FaEdit />
                                                </button>

                                                {member.status === 'active' ? (
                                                    <button
                                                        onClick={() => handleDeactivateClick(member)}
                                                        className="p-3 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all"
                                                        title="Deactivate (Hide from Daily Attendance)"
                                                    >
                                                        <FaBan />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                await updateMember(member.id, { ...member, status: 'active', sector });
                                                                toast.success("Member reactivated");
                                                                fetchMembers();
                                                                if (onUpdate) onUpdate();
                                                            } catch (error) {
                                                                toast.error("Failed to reactivate");
                                                            }
                                                        }}
                                                        className="p-3 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                                                        title="Reactivate Member"
                                                    >
                                                        <FaCheck />
                                                    </button>
                                                )}

                                                {isOwner && (
                                                    <button
                                                        onClick={() => handleDeleteClick(member.id)}
                                                        className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                                        title="Delete Permanently"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                )}
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

            {/* Deactivate Confirm Modal */}
            <ConfirmModal
                isOpen={deactivateModal.show}
                title="Deactivate Member?"
                message={`Are you sure you want to deactivate ${deactivateModal.member?.name}? They will be marked as inactive.`}
                onConfirm={confirmDeactivate}
                onCancel={() => setDeactivateModal({ show: false, member: null })}
                confirmText="Deactivate"
                cancelText="Cancel"
                type="warning"
            />

            {/* Role Manager Modal */}
            {showRoleManager && (
                <RoleManager
                    roles={roles}
                    onCreate={(data) => createMemberRole({ ...data, sector })}
                    onDelete={(id) => deleteMemberRole(id, { sector })}
                    onClose={() => { setShowRoleManager(false); fetchMembers(); }}
                    onRefresh={() => getMemberRoles({ sector }).then(res => setRoles(res.data.data))}
                    placeholder="Developer, Tester, Manager..."
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
        </div>
    );
};

export default MemberManager;
