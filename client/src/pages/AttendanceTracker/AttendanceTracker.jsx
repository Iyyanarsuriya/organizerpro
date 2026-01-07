import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from '../../components/modals/ConfirmModal';
import {
    getAttendances,
    createAttendance,
    updateAttendance,
    deleteAttendance,
    getAttendanceStats,
    getMemberSummary,
    quickMarkAttendance
} from '../../api/attendanceApi';
import { getProjects, createProject, deleteProject } from '../../api/projectApi';
import { getActiveMembers } from '../../api/memberApi';
import toast from 'react-hot-toast';
import {
    FaCheckCircle, FaTimesCircle, FaClock, FaExclamationCircle,
    FaPlus, FaTrash, FaEdit, FaCalendarAlt, FaSearch,
    FaFilter, FaChartBar, FaUserCheck, FaChevronLeft, FaChevronRight,
    FaFolderPlus, FaTimes, FaInbox, FaUserEdit, FaCheck, FaQuestionCircle,
    FaFileAlt, FaTag, FaBusinessTime
} from 'react-icons/fa';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from 'recharts';
import { exportAttendanceToCSV, exportAttendanceToTXT, exportAttendanceToPDF } from '../../utils/exportUtils';
import ExportButtons from '../../components/ExportButtons';
import ProjectManager from '../../components/ProjectManager';
import MemberManager from '../../components/MemberManager';
import RoleManager from '../../components/RoleManager';
import { getMemberRoles, createMemberRole, deleteMemberRole } from '../../api/memberRoleApi';

const AttendanceTracker = () => {
    const navigate = useNavigate();
    const [attendances, setAttendances] = useState([]);
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [projects, setProjects] = useState([]);
    const [members, setMembers] = useState([]);
    const [showProjectManager, setShowProjectManager] = useState(false);
    const [showMemberManager, setShowMemberManager] = useState(false);
    const [filterProject, setFilterProject] = useState('');
    const [filterMember, setFilterMember] = useState('');
    const [periodType, setPeriodType] = useState('day'); // 'month', 'year', 'day', 'range'
    const [currentPeriod, setCurrentPeriod] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
    const [customRange, setCustomRange] = useState({ start: '', end: '' });
    const [searchQuery, setSearchQuery] = useState('');
    const [memberSummary, setMemberSummary] = useState([]);
    const [activeTab, setActiveTab] = useState('records'); // 'records', 'summary', 'quick'
    const [showCustomReportModal, setShowCustomReportModal] = useState(false);
    const [customReportLoading, setCustomReportLoading] = useState(false);
    const [customReportForm, setCustomReportForm] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        projectId: '',
        memberId: '',
        status: 'all',
        role: ''
    });

    const [showPermissionModal, setShowPermissionModal] = useState(false);
    const [permissionModalData, setPermissionModalData] = useState({
        member_id: null,
        member_name: '',
        status: 'permission',
        start_hour: '09',
        start_minute: '00',
        start_period: 'AM',
        end_hour: '10',
        end_minute: '00',
        end_period: 'AM',
        reason: '',
        attendance_id: null
    });

    const [showWorkDoneModal, setShowWorkDoneModal] = useState(false);
    const [workDoneModalData, setWorkDoneModalData] = useState({
        member_id: null,
        member_name: '',
        status: 'present',
        note: '',
        attendance_id: null
    });

    // Role Management
    const [roles, setRoles] = useState([]);
    const [showRoleManager, setShowRoleManager] = useState(false);

    const [confirmModal, setConfirmModal] = useState({ show: false, type: null, label: '', id: null });
    const [filterRole, setFilterRole] = useState('');
    const [formData, setFormData] = useState({
        subject: '',
        status: 'present',
        date: new Date().toISOString().split('T')[0],
        note: '',
        project_id: '',
        member_id: ''
    });

    // Helper for mapping member IDs to their roles
    const memberIdToRoleMap = useMemo(() => {
        const map = {};
        members.forEach(m => {
            map[m.id] = m.role;
        });
        return map;
    }, [members]);

    const uniqueRoles = useMemo(() => {
        return [...new Set(members.map(m => m.role).filter(Boolean))];
    }, [members]);

    const statusOptions = [
        { id: 'present', label: 'Present', icon: FaCheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100' },
        { id: 'absent', label: 'Absent', icon: FaTimesCircle, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100' },
        { id: 'late', label: 'Late', icon: FaClock, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100' },
        { id: 'half-day', label: 'Half Day', icon: FaExclamationCircle, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100' },
        { id: 'permission', label: 'Permission', icon: FaBusinessTime, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-100' }
    ];

    function getHexColor(status) {
        switch (status) {
            case 'present': return '#10b981';
            case 'absent': return '#ef4444';
            case 'late': return '#f59e0b';
            case 'half-day': return '#3b82f6';
            case 'permission': return '#a855f7'; // Purple
            default: return '#94a3b8';
        }
    }

    const fetchData = async () => {
        try {
            const isRange = periodType === 'range';
            const rangeStart = isRange ? customRange.start : null;
            const rangeEnd = isRange ? customRange.end : null;

            if (isRange && (!rangeStart || !rangeEnd)) return;

            const [attRes, statsRes, summaryRes, projRes, membersRes, roleRes] = await Promise.all([
                getAttendances({
                    projectId: filterProject,
                    memberId: filterMember,
                    period: isRange ? null : currentPeriod,
                    startDate: rangeStart,
                    endDate: rangeEnd
                }),
                getAttendanceStats({
                    projectId: filterProject,
                    memberId: filterMember,
                    period: isRange ? null : currentPeriod,
                    startDate: rangeStart,
                    endDate: rangeEnd
                }),
                getMemberSummary({
                    projectId: filterProject,
                    period: isRange ? null : currentPeriod,
                    startDate: rangeStart,
                    endDate: rangeEnd
                }),
                getProjects(),
                getActiveMembers(),
                getMemberRoles()
            ]);
            setAttendances(attRes.data.data);
            setStats(statsRes.data.data || []);
            setMemberSummary(summaryRes.data.data);
            setProjects(projRes.data);
            setMembers(membersRes.data.data);
            setRoles(roleRes.data.data);
            setLoading(false);
        } catch (error) {
            toast.error("Failed to fetch attendance data");
            setLoading(false);
        }
    };

    useEffect(() => {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');

        if (periodType === 'year') {
            setCurrentPeriod(prev => prev.length === 4 ? prev : `${yyyy}`);
        } else if (periodType === 'month') {
            setCurrentPeriod(prev => prev.length === 7 ? prev : `${yyyy}-${mm}`);
        } else if (periodType === 'day') {
            setCurrentPeriod(prev => prev.length === 10 ? prev : `${yyyy}-${mm}-${dd}`);
        } else if (periodType === 'range') {
            if (!customRange.start) setCustomRange({ start: `${yyyy}-${mm}-${dd}`, end: `${yyyy}-${mm}-${dd}` });
        }
    }, [periodType]);

    useEffect(() => {
        fetchData();
    }, [currentPeriod, filterProject, filterMember, periodType, customRange.start, customRange.end]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await updateAttendance(editingId, formData);
                toast.success("Attendance updated!");
            } else {
                await createAttendance(formData);
                toast.success("Attendance marked!");
            }
            setShowAddModal(false);
            setEditingId(null);
            resetForm();
            fetchData();
        } catch (error) {
            toast.error(editingId ? "Failed to update" : "Failed to mark attendance");
        }
    };

    const handleQuickMark = async (memberId, status = null, permission_duration = null, note = null, permission_start_time = null, permission_end_time = null, permission_reason = null) => {
        try {
            const date = periodType === 'day' ? currentPeriod : new Date().toISOString().split('T')[0];
            await quickMarkAttendance({
                member_id: memberId,
                status,
                date,
                project_id: filterProject || null,
                subject: `Daily Attendance`,
                permission_duration,
                note,
                permission_start_time,
                permission_end_time,
                permission_reason
            });
            fetchData();
        } catch (error) {
            toast.error("Failed to update");
        }
    };

    const resetForm = () => {
        setFormData({
            subject: '',
            status: 'present',
            date: new Date().toISOString().split('T')[0],
            note: '',
            project_id: filterProject || '',
            member_id: ''
        });
        setEditingId(null);
    };

    const handleEdit = (item) => {
        setFormData({
            subject: item.subject,
            status: item.status,
            date: new Date(item.date).toISOString().split('T')[0],
            note: item.note || '',
            project_id: item.project_id || '',
            member_id: item.member_id || ''
        });
        setEditingId(item.id);
        setShowAddModal(true);
    };

    const handleDelete = (id) => {
        setConfirmModal({ show: true, type: 'DELETE', label: 'Delete Record', id });
    };

    const handleModalConfirm = async () => {
        if (confirmModal.type === 'DELETE') {
            try {
                await deleteAttendance(confirmModal.id);
                toast.success("Record deleted");
                fetchData();
            } catch (error) {
                toast.error("Failed to delete record");
            }
        } else if (confirmModal.type === 'CSV') handleExportCSV(attendances);
        else if (confirmModal.type === 'PDF') handleExportPDF(attendances);
        else if (confirmModal.type === 'TXT') handleExportTXT(attendances);

        setConfirmModal({ show: false, type: null, label: '', id: null });
    };

    // Export Functions
    const handleExportCSV = (data = attendances, filters = {}) => {
        if (data.length === 0) { toast.error("No data to export"); return; }
        const periodStr = filters.startDate && filters.endDate ? `${filters.startDate}_to_${filters.endDate}` : currentPeriod;
        const memberStr = filters.memberId ? `_${members.find(m => m.id == filters.memberId)?.name}` : (filterMember ? `_${members.find(m => m.id == filterMember)?.name}` : '');
        const roleStr = filters.role ? `_${filters.role}` : (filterRole ? `_${filterRole}` : '');
        exportAttendanceToCSV(data, `attendance_report_${periodStr}${memberStr}${roleStr}`);
    };

    const handleExportTXT = (data = attendances, reportStats = stats, filters = {}) => {
        if (data.length === 0) { toast.error("No data to export"); return; }
        const periodStr = filters.startDate && filters.endDate
            ? `${filters.startDate} to ${filters.endDate}`
            : (periodType === 'range' ? `${customRange.start} to ${customRange.end}` : currentPeriod);

        const memberStr = filters.memberId ? `_${members.find(m => m.id == filters.memberId)?.name}` : (filterMember ? `_${members.find(m => m.id == filterMember)?.name}` : '');
        const roleStr = filters.role ? `_${filters.role}` : (filterRole ? `_${filterRole}` : '');

        exportAttendanceToTXT({ data, period: periodStr, filename: `attendance_report_${periodStr}${memberStr}${roleStr}` });
    };

    const handleExportPDF = (data = attendances, reportStats = stats, filters = {}) => {
        if (data.length === 0) { toast.error("No data to export"); return; }
        const memberName = filters.memberId ? members.find(m => m.id == filters.memberId)?.name : (filterMember ? members.find(m => m.id == filterMember)?.name : 'Everyone');
        const projectName = filters.projectId ? projects.find(p => p.id == filters.projectId)?.name : (filterProject ? projects.find(p => p.id == filterProject)?.name : 'All Projects');
        const categoryName = filters.role || (filterRole || 'All Categories');

        const periodStr = filters.startDate && filters.endDate
            ? `${filters.startDate} to ${filters.endDate}`
            : (periodType === 'range' ? `${customRange.start} to ${customRange.end}` : currentPeriod);

        const memberShort = memberName !== 'Everyone' ? `_${memberName}` : '';
        const roleShort = categoryName !== 'All Categories' ? `_${categoryName}` : '';

        exportAttendanceToPDF({
            data,
            period: periodStr,
            subHeader: `Member: ${memberName}  |  Project: ${projectName}  |  Category: ${categoryName}`,
            filename: `attendance_report_${periodStr}${memberShort}${roleShort}`
        });
    };

    const handleGenerateCustomReport = async (format = 'PDF') => {
        if (!customReportForm.startDate || !customReportForm.endDate) {
            toast.error("Please select both start and end dates");
            return;
        }

        setCustomReportLoading(format);
        try {
            const [attRes, statsRes] = await Promise.all([
                getAttendances({
                    projectId: customReportForm.projectId,
                    memberId: customReportForm.memberId,
                    startDate: customReportForm.startDate,
                    endDate: customReportForm.endDate,
                    status: customReportForm.status === 'all' ? null : customReportForm.status,
                    role: customReportForm.role === '' ? null : customReportForm.role
                }),
                getAttendanceStats({
                    projectId: customReportForm.projectId,
                    memberId: customReportForm.memberId,
                    startDate: customReportForm.startDate,
                    endDate: customReportForm.endDate,
                    status: customReportForm.status === 'all' ? null : customReportForm.status,
                    role: customReportForm.role === '' ? null : customReportForm.role
                })
            ]);

            if (format === 'PDF') handleExportPDF(attRes.data.data, statsRes.data.data, customReportForm);
            else if (format === 'CSV') handleExportCSV(attRes.data.data, customReportForm);
            else if (format === 'TXT') handleExportTXT(attRes.data.data, statsRes.data.data, customReportForm);

            setShowCustomReportModal(false);
            toast.success("Attendance report generated!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate report");
        } finally {
            setCustomReportLoading(false);
        }
    };

    const filteredAttendances = useMemo(() => {
        return attendances.filter(a => {
            const d = new Date(a.date);
            const dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
            const matchesSearch = (a.subject || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (a.member_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                dateStr.includes(searchQuery);
            const matchesRole = !filterRole || memberIdToRoleMap[a.member_id] === filterRole;
            return matchesSearch && matchesRole;
        });
    }, [attendances, searchQuery, filterRole, memberIdToRoleMap]);

    const activeTargetDate = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        if (periodType === 'day') return currentPeriod;
        if (periodType === 'range') return customRange.end || today;
        if (periodType === 'month' && currentPeriod.length === 7) {
            return today.startsWith(currentPeriod) ? today : `${currentPeriod}-01`;
        }
        if (periodType === 'year' && currentPeriod.length === 4) {
            return today.startsWith(currentPeriod) ? today : `${currentPeriod}-01-01`;
        }
        return today;
    }, [periodType, currentPeriod, customRange.end]);

    const activeMembersAttendanceRecords = useMemo(() => {
        const targetDate = activeTargetDate;
        if (!targetDate) return {};

        const map = {};
        attendances.forEach(a => {
            if (a.member_id) {
                // Robust date matching: format both to YYYY-MM-DD
                const d = new Date(a.date);
                const aDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

                if (aDate === targetDate) {
                    map[a.member_id] = a;
                }
            }
        });
        return map;
    }, [attendances, activeTargetDate]);

    const activeMembersAttendanceMat = useMemo(() => {
        const map = {};
        Object.keys(activeMembersAttendanceRecords).forEach(id => {
            map[id] = activeMembersAttendanceRecords[id].status;
        });
        return map;
    }, [activeMembersAttendanceRecords]);

    const pieData = stats.map(s => {
        const option = statusOptions.find(o => o.id === s.status);
        return {
            name: option ? option.label : s.status,
            value: s.count,
            color: option ? getHexColor(s.status) : '#ccc'
        };
    });

    function getHexColor(status) {
        switch (status) {
            case 'present': return '#10b981';
            case 'absent': return '#ef4444';
            case 'late': return '#f59e0b';
            case 'half-day': return '#3b82f6';
            case 'permission': return '#a855f7';
            default: return '#94a3b8';
        }
    }

    const formatTimeToAMPM = (timeStr) => {
        if (!timeStr) return '';
        const [hours, minutes] = timeStr.split(':');
        let h = parseInt(hours);
        const m = minutes;
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        h = h ? h : 12;
        return `${h}:${m} ${ampm}`;
    };

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-slate-50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f8fafc] font-['Outfit'] text-slate-900 overflow-x-hidden">
            {/* Glossy Header Background */}
            <div className="fixed top-0 left-0 w-full h-80 bg-linear-to-b from-blue-50/50 to-transparent pointer-events-none -z-10"></div>

            {/* Header */}
            <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-40 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-linear-to-br from-blue-500 to-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                                <FaUserCheck className="text-white text-lg sm:text-xl" />
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Attendance</h1>
                                <p className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest">Consistency is key</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 lg:flex lg:flex-wrap items-center gap-2 sm:gap-3">
                            <div className="col-span-2 sm:col-span-1 h-[40px] flex items-center p-1 bg-slate-50 border border-slate-200 rounded-[12px] shadow-sm overflow-x-auto custom-scrollbar">
                                {['day', 'month', 'year', 'range'].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setPeriodType(type)}
                                        className={`flex-1 px-3 py-1.5 rounded-[8px] text-[9px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${periodType === type ? 'bg-white text-blue-600 shadow-xs border border-blue-100 ring-2 ring-blue-500/5' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>

                            <div className="col-span-2 sm:col-span-1 h-[40px] flex items-center bg-white border border-slate-200 px-3 rounded-[12px] shadow-sm hover:border-blue-500 transition-colors">
                                {periodType === 'day' ? (
                                    <input
                                        type="date"
                                        value={currentPeriod.length === 10 ? currentPeriod : ''}
                                        onChange={(e) => setCurrentPeriod(e.target.value)}
                                        className="w-full text-[11px] sm:text-[12px] font-bold text-slate-700 outline-none bg-transparent cursor-pointer font-['Outfit']"
                                    />
                                ) : periodType === 'month' ? (
                                    <input
                                        type="month"
                                        value={currentPeriod.length === 7 ? currentPeriod : ''}
                                        onChange={(e) => setCurrentPeriod(e.target.value)}
                                        className="w-full text-[11px] sm:text-[12px] font-bold text-slate-700 outline-none bg-transparent cursor-pointer font-['Outfit']"
                                    />
                                ) : periodType === 'year' ? (
                                    <input
                                        type="number"
                                        min="2000"
                                        max="2100"
                                        value={currentPeriod.slice(0, 4)}
                                        onChange={(e) => setCurrentPeriod(e.target.value)}
                                        className="w-full text-[11px] sm:text-[12px] font-bold text-slate-700 outline-none bg-transparent cursor-pointer font-['Outfit']"
                                    />
                                ) : (
                                    <div className="flex items-center gap-1 sm:gap-2 w-full">
                                        <input
                                            type="date"
                                            value={customRange.start}
                                            onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })}
                                            className="text-[9px] sm:text-[11px] font-bold text-slate-700 outline-none bg-transparent cursor-pointer font-['Outfit'] w-full min-w-0"
                                        />
                                        <span className="text-[9px] text-slate-400">-</span>
                                        <input
                                            type="date"
                                            value={customRange.end}
                                            onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })}
                                            className="text-[9px] sm:text-[11px] font-bold text-slate-700 outline-none bg-transparent cursor-pointer font-['Outfit'] w-full min-w-0"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="col-span-1 flex items-center gap-1.5">
                                <select
                                    value={filterProject}
                                    onChange={(e) => setFilterProject(e.target.value)}
                                    className="flex-1 bg-white border border-slate-200 rounded-xl px-2 sm:px-4 h-[40px] text-[11px] sm:text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all cursor-pointer shadow-sm"
                                >
                                    <option value="">Projects</option>
                                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                                <button
                                    onClick={() => setShowProjectManager(true)}
                                    className="w-[40px] h-[40px] bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm border border-slate-200 shrink-0"
                                    title="Manage Projects"
                                >
                                    <FaFolderPlus />
                                </button>
                            </div>

                            <div className="col-span-1 flex items-center gap-1.5">
                                <select
                                    value={filterMember}
                                    onChange={(e) => setFilterMember(e.target.value)}
                                    className="flex-1 bg-white border border-slate-200 rounded-xl px-2 sm:px-4 h-[40px] text-[11px] sm:text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all cursor-pointer shadow-sm"
                                >
                                    <option value="">Everyone</option>
                                    {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                </select>
                                <button
                                    onClick={() => setShowMemberManager(true)}
                                    className="w-[40px] h-[40px] bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center hover:bg-orange-50 hover:text-orange-600 transition-all shadow-sm border border-slate-200 shrink-0"
                                    title="Manage Members"
                                >
                                    <FaUserEdit />
                                </button>
                            </div>

                            {/* Role Filter & Manager */}
                            <div className="col-span-1 flex items-center gap-1.5 h-[40px]">
                                <select
                                    value={filterRole}
                                    onChange={(e) => setFilterRole(e.target.value)}
                                    className="flex-1 bg-white border border-slate-200 rounded-xl px-2 sm:px-4 h-full text-[11px] sm:text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all cursor-pointer shadow-sm"
                                >
                                    <option value="">All Categories</option>
                                    {/* Merge DB roles and existing unique roles from members to avoid missing data */}
                                    {[...new Set([...roles.map(r => r.name), ...uniqueRoles])].sort().map(role => (
                                        <option key={role} value={role}>{role}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={() => setShowRoleManager(true)}
                                    className="w-[40px] h-[40px] bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center hover:bg-purple-50 hover:text-purple-600 transition-all shadow-sm border border-slate-200 shrink-0"
                                    title="Manage Categories"
                                >
                                    <FaTag />
                                </button>
                            </div>

                            {/* Global Search */}
                            <div className="col-span-2 md:col-span-1 relative h-[40px]">
                                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                                <input
                                    type="text"
                                    placeholder="Find person..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-full pl-9 pr-4 bg-white border border-slate-200 rounded-xl text-[11px] sm:text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all shadow-sm font-['Outfit']"
                                />
                            </div>

                            <ExportButtons
                                onExportCSV={() => setConfirmModal({ show: true, type: 'CSV', label: 'CSV Report' })}
                                onExportPDF={() => setConfirmModal({ show: true, type: 'PDF', label: 'PDF Report' })}
                                onExportTXT={() => setConfirmModal({ show: true, type: 'TXT', label: 'Plain Text Log' })}
                                className="col-span-2 lg:col-auto justify-center"
                            />

                            <button
                                onClick={() => setShowAddModal(true)}
                                className="col-span-2 lg:col-auto bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 rounded-xl text-[11px] sm:text-sm font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                            >
                                <FaPlus className="text-xs sm:text-sm" /> Mark
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* View Selector */}
                <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner border border-slate-200 w-full sm:w-fit mb-8 overflow-x-auto custom-scrollbar">
                    {[
                        { id: 'records', label: 'Records' },
                        { id: 'summary', label: 'Summary' },
                        { id: 'quick', label: 'Daily Sheet' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === 'records' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100">
                                <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2 font-['Outfit']">
                                    <FaChartBar className="text-blue-500" />
                                    {periodType.charAt(0).toUpperCase() + periodType.slice(1)} Stats
                                </h3>
                                <div className="h-64">
                                    {stats.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={pieData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {pieData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={{
                                                        borderRadius: '16px',
                                                        border: 'none',
                                                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                                                        padding: '12px'
                                                    }}
                                                />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                            <FaInbox className="text-4xl mb-4 opacity-20" />
                                            <p className="text-xs font-bold uppercase tracking-widest font-['Outfit']">No data available</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 min-h-[500px]">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                                    <h3 className="text-lg font-black text-slate-900 font-['Outfit']">Recent Records</h3>
                                    {/* Global search applies here */}
                                </div>
                                <div className="space-y-4">
                                    {filteredAttendances.length > 0 ? filteredAttendances.map((item, idx) => {
                                        const option = statusOptions.find(o => o.id === item.status);
                                        return (
                                            <div
                                                key={item.id}
                                                className="group p-5 bg-white border border-slate-100 rounded-[24px] hover:shadow-xl hover:shadow-blue-500/5 hover:border-blue-500/20 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2"
                                                style={{ animationDelay: `${idx * 50}ms` }}
                                            >
                                                <div className="flex items-center justify-between gap-4">
                                                    <div className="flex items-center gap-4 min-w-0">
                                                        <div className={`w-12 h-12 sm:w-14 sm:h-14 ${option?.bg} rounded-2xl flex items-center justify-center text-xl sm:text-2xl ${option?.color} transition-transform group-hover:scale-110 duration-500 shrink-0`}>
                                                            {option && <option.icon />}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                                                <h4 className="font-black text-slate-900 leading-tight truncate max-w-[150px] sm:max-w-none font-['Outfit']">{item.subject}</h4>
                                                                <span className={`px-2.5 py-0.5 rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-widest ${option?.bg} ${option?.color} border ${option?.border} shadow-sm font-['Outfit']`}>
                                                                    {option?.label}
                                                                </span>
                                                            </div>
                                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">
                                                                <span className="flex items-center gap-1.5 font-['Outfit']">
                                                                    <FaCalendarAlt className="text-blue-400" />
                                                                    {(() => {
                                                                        const d = new Date(item.date);
                                                                        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
                                                                    })()}
                                                                </span>
                                                                {item.project_name && <span className="flex items-center gap-1.5 text-blue-500 bg-blue-50 px-2 py-0.5 rounded-md font-['Outfit']"><FaFilter className="text-[10px]" />{item.project_name}</span>}
                                                                {item.member_name && <span className="flex items-center gap-1.5 text-orange-500 bg-orange-50 px-2 py-0.5 rounded-md font-['Outfit']"><FaUserCheck className="text-[10px]" />{item.member_name}</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 sm:gap-2 sm:opacity-0 group-hover:opacity-100 transition-all duration-300">
                                                        <button onClick={() => handleEdit(item)} className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all active:scale-90"><FaEdit /></button>
                                                        <button onClick={() => handleDelete(item.id)} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-90"><FaTrash /></button>
                                                    </div>
                                                </div>
                                                {item.note && <div className="mt-4 pt-4 border-t border-slate-50 italic text-slate-500 text-xs line-clamp-2 font-['Outfit']">"{item.note}"</div>}
                                            </div>
                                        );
                                    }) : (
                                        <div className="py-20 flex flex-col items-center justify-center text-slate-300">
                                            <FaInbox className="text-6xl mb-4 opacity-10" />
                                            <p className="text-sm font-black uppercase tracking-widest font-['Outfit']">No records found</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : activeTab === 'summary' ? (
                    <div className="bg-white rounded-[32px] shadow-xl border border-slate-100 overflow-hidden animate-in fade-in duration-500">
                        <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 font-['Outfit']">Attendance Summary</h3>
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1 font-['Outfit']">Aggregated statistics for the selected period</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-4">
                                    <button
                                        onClick={() => {
                                            setCustomReportForm({
                                                ...customReportForm,
                                                projectId: filterProject,
                                                memberId: filterMember,
                                                startDate: periodType === 'range' ? customRange.start : (currentPeriod || new Date().toISOString().split('T')[0]),
                                                endDate: periodType === 'range' ? customRange.end : (currentPeriod || new Date().toISOString().split('T')[0]),
                                                role: filterRole
                                            });
                                            setShowCustomReportModal(true);
                                        }}
                                        className="px-6 py-3 bg-blue-600 text-white rounded-[16px] text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 group order-last sm:order-0 w-full sm:w-auto font-['Outfit']"
                                    >
                                        <FaFileAlt className="group-hover:rotate-12 transition-transform" />
                                        Custom Report
                                    </button>
                                    <div className="flex bg-white p-1 rounded-xl border border-slate-200">
                                        <div className="px-4 py-2 text-center border-r border-slate-100">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-['Outfit']">Total</p>
                                            <p className="text-sm font-black text-slate-900 font-['Outfit']">{memberSummary.length}</p>
                                        </div>
                                        <div className="px-4 py-2 text-center">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-['Outfit']">Avg Rate</p>
                                            <p className="text-sm font-black text-blue-600 font-['Outfit']">
                                                {memberSummary.length > 0 ? (memberSummary.reduce((acc, w) => acc + (w.total > 0 ? (w.present + w.permission + w.half_day * 0.5) / w.total : 0), 0) / memberSummary.length * 100).toFixed(0) + '%' : '0%'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 font-['Outfit']">Member</th>
                                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-emerald-500 text-center font-['Outfit']">P</th>
                                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-red-500 text-center font-['Outfit']">A</th>
                                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-amber-500 text-center font-['Outfit']">L</th>
                                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-blue-500 text-center font-['Outfit']">H</th>
                                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-purple-500 text-center font-['Outfit']">Per</th>
                                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-900 text-center font-['Outfit']">Total</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right font-['Outfit']">Performance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {memberSummary
                                        .filter(w => {
                                            const matchesRole = !filterRole || memberIdToRoleMap[w.id] === filterRole;
                                            const matchesSearch = !searchQuery || w.name.toLowerCase().includes(searchQuery.toLowerCase());
                                            const matchesMember = !filterMember || w.id == filterMember;
                                            return matchesRole && matchesSearch && matchesMember;
                                        })
                                        .map((w) => {
                                            const rate = w.total > 0 ? ((w.present + w.permission + w.half_day * 0.5) / w.total * 100) : 0;
                                            return (
                                                <tr key={w.id} className="hover:bg-slate-50/80 transition-colors group">
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-black text-xs group-hover:bg-blue-600 group-hover:text-white transition-colors font-['Outfit']">
                                                                {w.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <p className="font-black text-slate-900 leading-none font-['Outfit']">{w.name}</p>
                                                                <p className="text-[9px] font-black text-slate-400 uppercase mt-1 font-['Outfit']">ID: #{w.id}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5 text-center">
                                                        <span className="inline-flex w-7 h-7 items-center justify-center bg-emerald-50 text-emerald-600 rounded-lg font-black text-[11px] border border-emerald-100 font-['Outfit']">{w.present}</span>
                                                    </td>
                                                    <td className="px-6 py-5 text-center">
                                                        <span className="inline-flex w-7 h-7 items-center justify-center bg-red-50 text-red-600 rounded-lg font-black text-[11px] border border-red-100 font-['Outfit']">{w.absent}</span>
                                                    </td>
                                                    <td className="px-6 py-5 text-center">
                                                        <span className="inline-flex w-7 h-7 items-center justify-center bg-amber-50 text-amber-600 rounded-lg font-black text-[11px] border border-amber-100 font-['Outfit']">{w.late}</span>
                                                    </td>
                                                    <td className="px-6 py-5 text-center">
                                                        <span className="inline-flex w-7 h-7 items-center justify-center bg-blue-50 text-blue-600 rounded-lg font-black text-[11px] border border-blue-100 font-['Outfit']">{w.half_day}</span>
                                                    </td>
                                                    <td className="px-6 py-5 text-center">
                                                        <span className="inline-flex w-7 h-7 items-center justify-center bg-purple-50 text-purple-600 rounded-lg font-black text-[11px] border border-purple-100 font-['Outfit']">{w.permission || 0}</span>
                                                    </td>
                                                    <td className="px-6 py-5 text-center font-black text-slate-900 text-[11px] font-['Outfit']">{w.total}</td>
                                                    <td className="px-8 py-5 text-right">
                                                        <div className="flex items-center justify-end gap-3">
                                                            <div className="w-20 sm:w-28 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full transition-all duration-1000 ${rate >= 90 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]' : rate >= 75 ? 'bg-blue-500' : 'bg-amber-500'}`}
                                                                    style={{ width: `${rate}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className={`text-[11px] font-black min-w-[32px] font-['Outfit'] ${rate >= 90 ? 'text-emerald-600' : rate >= 75 ? 'text-blue-600' : 'text-amber-600'}`}>{rate.toFixed(0)}%</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    {memberSummary.length === 0 && (
                                        <tr>
                                            <td colSpan="8" className="px-8 py-20 text-center">
                                                <FaInbox className="text-5xl mx-auto mb-4 text-slate-200" />
                                                <p className="text-sm font-black text-slate-400 uppercase tracking-widest font-['Outfit']">No statistics available</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    /* Daily Sheet View */
                    <div className="bg-white rounded-[40px] shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="p-8 sm:p-12 border-b border-slate-100 bg-linear-to-br from-slate-900 to-slate-800 text-white">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                <div>
                                    <h3 className="text-2xl font-black mb-2 font-['Outfit']">Daily Attendance Sheet</h3>
                                    <div className="flex items-center gap-3">
                                        <FaCalendarAlt className="text-blue-400" />
                                        <span className="text-slate-400 font-bold uppercase tracking-widest text-xs font-['Outfit']">
                                            {(() => {
                                                try {
                                                    return new Date(activeTargetDate).toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
                                                } catch (e) { return 'Invalid Date'; }
                                            })()}
                                        </span>
                                    </div>
                                </div>
                                {periodType === 'day' && (
                                    <div className="bg-white/10 px-6 py-3 rounded-2xl border border-white/10 backdrop-blur-md">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-300 mb-1 font-['Outfit']">Marking Mode</p>
                                        <p className="text-sm font-black font-['Outfit']">Single Click Upsert</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {true ? (
                            <div className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-50/50">
                                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 font-['Outfit']">Name</th>
                                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center font-['Outfit']">Status</th>
                                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center font-['Outfit']">Permission</th>
                                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 font-['Outfit']">Work Details</th>
                                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right font-['Outfit']">Current</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {members
                                                .filter(m => {
                                                    const matchesRole = !filterRole || m.role === filterRole;
                                                    const matchesSearch = !searchQuery || m.name.toLowerCase().includes(searchQuery.toLowerCase());
                                                    const matchesMemberFilter = !filterMember || m.id == filterMember;
                                                    return matchesRole && matchesSearch && matchesMemberFilter;
                                                })
                                                .map(w => {
                                                    const attendance = activeMembersAttendanceRecords[w.id];
                                                    const currentStatus = attendance?.status;
                                                    const option = statusOptions.find(o => o.id === currentStatus);
                                                    const isPresentOrPerm = currentStatus === 'present' || currentStatus === 'late' || currentStatus === 'half-day' || currentStatus === 'permission';

                                                    return (
                                                        <tr key={w.id} className="hover:bg-slate-50/50 transition-colors group">
                                                            <td className="px-4 sm:px-8 py-4 sm:py-6">
                                                                <div className="flex items-center gap-3 sm:gap-4">
                                                                    <div className="hidden sm:flex w-10 h-10 bg-white rounded-xl border border-slate-100 items-center justify-center text-slate-400 group-hover:text-blue-500 shadow-sm transition-all shrink-0">
                                                                        <FaUserCheck />
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <h4 className="font-black text-slate-900 leading-tight truncate text-sm sm:text-base font-['Outfit']">{w.name}</h4>
                                                                        <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-tighter text-slate-400 mt-0.5 font-['Outfit']">#{w.id}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 sm:px-8 py-4 sm:py-6 text-center">
                                                                <div className="flex items-center justify-center gap-2 sm:gap-4">
                                                                    <button
                                                                        disabled={currentStatus === 'present' || currentStatus === 'permission'}
                                                                        onClick={() => handleQuickMark(w.id, 'present')}
                                                                        className={`flex-1 sm:flex-none px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all font-['Outfit'] ${(currentStatus === 'present' || currentStatus === 'permission') ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-105 cursor-default' : (isPresentOrPerm && currentStatus !== 'absent' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 cursor-pointer' : 'bg-slate-100/50 text-slate-400 border border-slate-100 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 cursor-pointer')}`}
                                                                    >
                                                                        P<span className="hidden sm:inline">resent</span>
                                                                    </button>
                                                                    <button
                                                                        disabled={currentStatus === 'absent'}
                                                                        onClick={() => handleQuickMark(w.id, 'absent')}
                                                                        className={`flex-1 sm:flex-none px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all font-['Outfit'] ${currentStatus === 'absent' ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 scale-105 cursor-default' : 'bg-slate-100/50 text-slate-400 border border-slate-100 hover:bg-red-500 hover:text-white hover:border-red-500 hover:shadow-lg hover:shadow-red-500/30 cursor-pointer'}`}
                                                                    >
                                                                        A<span className="hidden sm:inline">bsent</span>
                                                                    </button>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 sm:px-8 py-4 sm:py-6">
                                                                <div className={`flex flex-col items-center gap-2 transition-all duration-300 ${isPresentOrPerm ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                                                                    <div className="flex items-center gap-2">
                                                                        <button
                                                                            disabled={!isPresentOrPerm}
                                                                            onClick={() => {
                                                                                const currentReason = attendance?.permission_reason || '';
                                                                                // Parse existing duration or use defaults
                                                                                const [startStr, endStr] = (attendance?.permission_duration || '09:00 AM - 10:00 AM').split(' - ');
                                                                                const parseTime = (str) => {
                                                                                    const [time, period] = (str || '').split(' ');
                                                                                    const [h, m] = (time || '09:00').split(':');
                                                                                    return { h: h || '09', m: m || '00', p: period || 'AM' };
                                                                                };
                                                                                const start = parseTime(startStr);
                                                                                const end = parseTime(endStr);

                                                                                setPermissionModalData({
                                                                                    member_id: w.id,
                                                                                    member_name: w.name,
                                                                                    status: 'permission',
                                                                                    start_hour: start.h,
                                                                                    start_minute: start.m,
                                                                                    start_period: start.p,
                                                                                    end_hour: end.h,
                                                                                    end_minute: end.m,
                                                                                    end_period: end.p,
                                                                                    reason: currentReason,
                                                                                    attendance_id: attendance?.id
                                                                                });
                                                                                setShowPermissionModal(true);
                                                                            }}
                                                                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${currentStatus === 'permission' ? 'bg-purple-500 text-white shadow-xs' : 'bg-slate-50 text-slate-400 border border-slate-200 hover:bg-purple-50 hover:text-purple-600'}`}
                                                                        >
                                                                            <FaClock className="text-[10px]" /> Perm.
                                                                        </button>
                                                                        {currentStatus === 'permission' && (
                                                                            <div className="flex flex-col gap-1">
                                                                                <div
                                                                                    onClick={() => {
                                                                                        const [startStr, endStr] = (attendance?.permission_duration || '09:00 AM - 10:00 AM').split(' - ');
                                                                                        const parseTime = (str) => {
                                                                                            const [time, period] = (str || '').split(' ');
                                                                                            const [h, m] = (time || '09:00').split(':');
                                                                                            return { h: h || '09', m: m || '00', p: period || 'AM' };
                                                                                        };
                                                                                        const start = parseTime(startStr);
                                                                                        const end = parseTime(endStr);

                                                                                        setPermissionModalData({
                                                                                            member_id: w.id,
                                                                                            member_name: w.name,
                                                                                            status: 'permission',
                                                                                            start_hour: start.h,
                                                                                            start_minute: start.m,
                                                                                            start_period: start.p,
                                                                                            end_hour: end.h,
                                                                                            end_minute: end.m,
                                                                                            end_period: end.p,
                                                                                            reason: attendance?.permission_reason || '',
                                                                                            attendance_id: attendance?.id
                                                                                        });
                                                                                        setShowPermissionModal(true);
                                                                                    }}
                                                                                    className="bg-white border border-slate-100 rounded-lg px-2 py-1.5 text-[10px] font-bold text-slate-600 cursor-pointer hover:border-purple-300 transition-all font-['Outfit']"
                                                                                >
                                                                                    {attendance?.permission_duration || 'Set Time'}
                                                                                </div>
                                                                                {attendance?.permission_reason && (
                                                                                    <p className="text-[8px] font-black text-purple-400 truncate max-w-[100px] text-center font-['Outfit'] italic">
                                                                                        {attendance.permission_reason}
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 sm:px-8 py-4 sm:py-6">
                                                                <div className={`transition-all duration-300 ${isPresentOrPerm ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                                                                    <div
                                                                        onClick={() => {
                                                                            if (!isPresentOrPerm) return;
                                                                            setWorkDoneModalData({
                                                                                member_id: w.id,
                                                                                member_name: w.name,
                                                                                status: currentStatus || 'present',
                                                                                note: attendance?.note || '',
                                                                                attendance_id: attendance?.id
                                                                            });
                                                                            setShowWorkDoneModal(true);
                                                                        }}
                                                                        className="relative group/note cursor-pointer"
                                                                    >
                                                                        <div className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 text-[10px] font-bold text-slate-500 min-h-[32px] flex items-center font-['Outfit'] group-hover:bg-white group-hover:border-blue-400 transition-all">
                                                                            {attendance?.note || "Work completed details..."}
                                                                        </div>
                                                                        <FaEdit className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-300 pointer-events-none group-hover:text-blue-500" />
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 sm:px-8 py-4 sm:py-6 text-right">
                                                                <div className="flex justify-end">
                                                                    {option ? (
                                                                        <div className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-widest font-['Outfit'] ${option.bg} ${option.color} border ${option.border}`}>
                                                                            <option.icon className="text-[10px] sm:text-xs" />
                                                                            <span className="truncate max-w-[40px] sm:max-w-none">{option.label}</span>
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-300 font-['Outfit']">Wait</span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            {members.length === 0 && (
                                                <tr>
                                                    <td colSpan="5" className="px-8 py-20 text-center">
                                                        <FaInbox className="text-6xl mx-auto mb-6 opacity-10" />
                                                        <h4 className="text-lg font-black text-slate-900 mb-2 font-['Outfit']">No Members Found</h4>
                                                        <p className="text-slate-500 text-sm font-medium font-['Outfit']">Add some people first to start using the Daily Sheet</p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="p-20 text-center">
                                <div className="w-24 h-24 bg-blue-50 rounded-[40px] flex items-center justify-center mx-auto mb-8">
                                    <FaCalendarAlt className="text-4xl text-blue-500 opacity-20" />
                                </div>
                                <h4 className="text-xl font-black text-slate-900 mb-4 font-['Outfit']">Select a Day to Begin</h4>
                                <p className="text-slate-500 max-w-sm mx-auto font-medium font-['Outfit']">The Daily Sheet works only when a specific day is selected from the filters above.</p>
                                <button
                                    onClick={() => setPeriodType('day')}
                                    className="mt-8 bg-slate-900 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-xl font-['Outfit']"
                                >
                                    Switch to Day View
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] sm:pt-[10vh] px-3 sm:px-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[24px] sm:rounded-[32px] md:rounded-[40px] w-full max-w-lg shadow-2xl relative animate-in zoom-in-95 duration-300 max-h-[84vh] sm:max-h-[80vh] overflow-y-auto custom-scrollbar mb-[4vh] sm:mb-0">
                        <button onClick={() => { setShowAddModal(false); resetForm(); }} className="absolute top-[16px] sm:top-[24px] right-[16px] sm:right-[24px] text-slate-400 hover:text-slate-800 transition-colors p-1.5 sm:p-2 hover:bg-slate-100 rounded-xl z-10"><FaTimes className="text-[18px] sm:text-[20px]" /></button>

                        <div className="p-[16px] sm:p-[24px] md:p-[32px]">
                            <div className="mb-6 sm:mb-8">
                                <h2 className="text-[18px] sm:text-[20px] md:text-[24px] font-black text-slate-900 flex items-center gap-2 sm:gap-3 font-['Outfit']">
                                    <div className="w-1.5 sm:w-2 h-6 sm:h-8 bg-blue-600 rounded-full"></div>
                                    {editingId ? 'Edit Record' : 'Mark Attendance'}
                                </h2>
                                <p className="text-slate-500 text-[11px] sm:text-[12px] md:text-[14px] mt-1 sm:mt-2 ml-3 sm:ml-5">Track attendance for the day</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                                    {statusOptions.map(opt => (
                                        <button key={opt.id} type="button" onClick={() => setFormData({ ...formData, status: opt.id })} className={`flex flex-col items-center gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-[12px] sm:rounded-[16px] md:rounded-2xl border-2 transition-all ${formData.status === opt.id ? 'border-blue-500 bg-blue-50 scale-105' : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'}`}>
                                            <opt.icon className={`text-[16px] sm:text-[18px] md:text-xl ${formData.status === opt.id ? 'text-blue-500' : 'text-slate-400'}`} />
                                            <span className={`text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-widest ${formData.status === opt.id ? 'text-blue-700' : 'text-slate-500'}`}>{opt.label}</span>
                                        </button>
                                    ))}
                                </div>

                                <div className="space-y-3 sm:space-y-4">
                                    <div>
                                        <label className="block text-[8px] sm:text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[4px] sm:mb-[6px] md:mb-[7px] ml-[4px] sm:ml-[6px] md:ml-[7px]">Subject / Label</label>
                                        <input required type="text" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} placeholder="E.g. Office, College, Gym..." className="w-full bg-white border border-slate-200 rounded-[10px] sm:rounded-[12px] md:rounded-[13px] lg:rounded-[16px] px-[12px] sm:px-[16px] md:px-[18px] lg:px-[24px] h-[32px] sm:h-[36px] md:h-[38px] lg:h-[44px] text-[11px] sm:text-[12px] md:text-[13px] lg:text-[14px] font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 sm:focus:ring-4 focus:ring-blue-500/10 transition-all font-['Outfit']" />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                        <div>
                                            <label className="block text-[8px] sm:text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[4px] sm:mb-[6px] md:mb-[7px] ml-[4px] sm:ml-[6px] md:ml-[7px]">Date</label>
                                            <div className="relative">
                                                <FaCalendarAlt className="absolute left-[12px] sm:left-[16px] md:left-[18px] top-1/2 -translate-y-1/2 text-slate-400 text-[10px] sm:text-[12px]" />
                                                <input required type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full bg-white border border-slate-200 rounded-[10px] sm:rounded-[12px] md:rounded-[13px] lg:rounded-[16px] pl-[32px] sm:pl-[40px] md:pl-[44px] pr-[12px] sm:pr-[16px] md:pr-[18px] h-[32px] sm:h-[36px] md:h-[38px] lg:h-[44px] text-[11px] sm:text-[12px] md:text-[13px] lg:text-[14px] font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 sm:focus:ring-4 focus:ring-blue-500/10 transition-all font-['Outfit'] cursor-pointer" />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[8px] sm:text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[4px] sm:mb-[6px] md:mb-[7px] ml-[4px] sm:ml-[6px] md:ml-[7px]">Project (Optional)</label>
                                            <select value={formData.project_id} onChange={(e) => setFormData({ ...formData, project_id: e.target.value })} className="w-full bg-white border border-slate-200 rounded-[10px] sm:rounded-[12px] md:rounded-[13px] lg:rounded-[16px] px-[12px] sm:px-[16px] md:px-[18px] lg:px-[24px] h-[32px] sm:h-[36px] md:h-[38px] lg:h-[44px] text-[11px] sm:text-[12px] md:text-[13px] lg:text-[14px] font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 sm:focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer font-['Outfit']">
                                                <option value="">No Project</option>
                                                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                            </select>
                                        </div>

                                        <div className="sm:col-span-2">
                                            <label className="block text-[8px] sm:text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[4px] sm:mb-[6px] md:mb-[7px] ml-[4px] sm:ml-[6px] md:ml-[7px]">Member (Optional)</label>
                                            <select value={formData.member_id} onChange={(e) => setFormData({ ...formData, member_id: e.target.value })} className="w-full bg-white border border-slate-200 rounded-[10px] sm:rounded-[12px] md:rounded-[13px] lg:rounded-[16px] px-[12px] sm:px-[16px] md:px-[18px] lg:px-[24px] h-[32px] sm:h-[36px] md:h-[38px] lg:h-[44px] text-[11px] sm:text-[12px] md:text-[13px] lg:text-[14px] font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 sm:focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer font-['Outfit']">
                                                <option value="">No Member</option>
                                                {members.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[8px] sm:text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[4px] sm:mb-[6px] md:mb-[7px] ml-[4px] sm:ml-[6px] md:ml-[7px]">Note (Optional)</label>
                                        <textarea value={formData.note} onChange={(e) => setFormData({ ...formData, note: e.target.value })} placeholder="Add more details..." rows="3" className="w-full bg-white border border-slate-200 rounded-[10px] sm:rounded-[12px] md:rounded-[13px] lg:rounded-[16px] px-[12px] sm:px-[16px] md:px-[18px] lg:px-[24px] py-[8px] sm:py-[10px] md:py-[11px] text-[11px] sm:text-[12px] md:text-[13px] lg:text-[14px] font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 sm:focus:ring-4 focus:ring-blue-500/10 transition-all resize-none font-['Outfit']"></textarea>
                                    </div>
                                </div>

                                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white h-[36px] sm:h-[40px] md:h-[42px] lg:h-[48px] rounded-[10px] sm:rounded-[12px] md:rounded-[13px] lg:rounded-[16px] text-[10px] sm:text-[11px] md:text-[12px] lg:text-[13px] font-black uppercase tracking-widest shadow-lg transition-all hover:scale-[1.02] active:scale-95 mt-2 sm:mt-4 font-['Outfit']">
                                    {editingId ? 'Update Record' : 'Mark Attendance'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {
                showProjectManager && (
                    <ProjectManager
                        projects={projects}
                        onCreate={createProject}
                        onDelete={deleteProject}
                        onClose={() => { setShowProjectManager(false); fetchData(); }}
                        onRefresh={() => getProjects().then(res => setProjects(res.data))}
                    />
                )
            }
            {showMemberManager && <MemberManager onClose={() => { setShowMemberManager(false); fetchData(); }} onUpdate={fetchData} />}
            {
                showRoleManager && (
                    <RoleManager
                        roles={roles}
                        onCreate={createMemberRole}
                        onDelete={deleteMemberRole}
                        onClose={() => { setShowRoleManager(false); fetchData(); }}
                        onRefresh={() => getMemberRoles().then(res => setRoles(res.data.data))}
                    />
                )
            }

            {/* Generic Confirmation Modal */}
            <ConfirmModal
                isOpen={confirmModal.show}
                title={confirmModal.type === 'DELETE' ? "Delete Record?" : `Export ${confirmModal.label}?`}
                message={confirmModal.type === 'DELETE'
                    ? "Are you sure you want to delete this attendance record?"
                    : `Are you sure you want to download this ${confirmModal.type} report?`}
                onConfirm={handleModalConfirm}
                onCancel={() => setConfirmModal({ show: false, type: null, label: '', id: null })}
                confirmText={confirmModal.type === 'DELETE' ? "Delete" : "Confirm"}
                cancelText="Cancel"
                type={confirmModal.type === 'DELETE' ? "danger" : "info"}
            />

            {/* Custom Report Modal */}
            {
                showCustomReportModal && (
                    <div className="fixed inset-0 z-150 flex items-center justify-center p-[16px] bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                        <div className="bg-white rounded-[40px] p-[32px] sm:p-[40px] w-full max-w-[500px] shadow-2xl relative animate-in zoom-in-95 duration-300">
                            <button onClick={() => setShowCustomReportModal(false)} className="absolute top-[32px] right-[32px] text-slate-400 hover:text-slate-800 transition-colors">
                                <FaTimes />
                            </button>
                            <h2 className="text-[24px] font-black mb-[32px] flex items-center gap-[12px] font-['Outfit']">
                                <div className="w-[8px] h-[32px] bg-blue-600 rounded-full"></div>
                                Attendance Report
                            </h2>

                            <div className="space-y-[24px]">
                                <div className="grid grid-cols-2 gap-[16px]">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[8px] ml-[4px]">Start Date</label>
                                        <input
                                            type="date"
                                            value={customReportForm.startDate}
                                            onChange={(e) => setCustomReportForm({ ...customReportForm, startDate: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-[16px] px-[20px] py-[12px] text-[12px] font-bold text-slate-700 outline-none focus:border-blue-600 transition-all font-['Outfit']"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[8px] ml-[4px]">End Date</label>
                                        <input
                                            type="date"
                                            value={customReportForm.endDate}
                                            onChange={(e) => setCustomReportForm({ ...customReportForm, endDate: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-[16px] px-[20px] py-[12px] text-[12px] font-bold text-slate-700 outline-none focus:border-blue-600 transition-all font-['Outfit']"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-[16px]">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[8px] ml-[4px]">Project</label>
                                        <select
                                            value={customReportForm.projectId}
                                            onChange={(e) => setCustomReportForm({ ...customReportForm, projectId: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-[16px] px-[20px] py-[12px] text-[12px] font-bold text-slate-700 outline-none focus:border-blue-600 transition-all cursor-pointer font-['Outfit']"
                                        >
                                            <option value="">All Projects</option>
                                            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[8px] ml-[4px]">Member</label>
                                        <select
                                            value={customReportForm.memberId}
                                            onChange={(e) => setCustomReportForm({ ...customReportForm, memberId: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-[16px] px-[20px] py-[12px] text-[12px] font-bold text-slate-700 outline-none focus:border-blue-600 transition-all cursor-pointer font-['Outfit']"
                                        >
                                            <option value="">Everyone</option>
                                            {members.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-[16px]">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[8px] ml-[4px]">Category</label>
                                        <select
                                            value={customReportForm.role}
                                            onChange={(e) => setCustomReportForm({ ...customReportForm, role: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-[16px] px-[20px] py-[12px] text-[12px] font-bold text-slate-700 outline-none focus:border-blue-600 transition-all cursor-pointer font-['Outfit']"
                                        >
                                            <option value="">All Categories</option>
                                            {[...new Set([...roles.map(r => r.name), ...uniqueRoles])].sort().map(role => (
                                                <option key={role} value={role}>{role}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[8px] ml-[4px]">Status Filter</label>
                                        <select
                                            value={customReportForm.status}
                                            onChange={(e) => setCustomReportForm({ ...customReportForm, status: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-[16px] px-[20px] py-[12px] text-[12px] font-bold text-slate-700 outline-none focus:border-blue-600 transition-all cursor-pointer font-['Outfit']"
                                        >
                                            <option value="all">All Statuses</option>
                                            {statusOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-[12px]">
                                    <button
                                        onClick={() => handleGenerateCustomReport('PDF')}
                                        disabled={!!customReportLoading}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-[18px] rounded-[20px] transition-all active:scale-95 shadow-xl flex items-center justify-center gap-[12px] text-[14px] disabled:opacity-50 disabled:cursor-not-allowed font-['Outfit']"
                                    >
                                        {customReportLoading === 'PDF' ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        ) : (
                                            <FaFileAlt />
                                        )}
                                        {customReportLoading === 'PDF' ? 'Generating...' : 'Download PDF Report'}
                                    </button>

                                    <div className="grid grid-cols-2 gap-[12px]">
                                        <button
                                            onClick={() => handleGenerateCustomReport('CSV')}
                                            disabled={!!customReportLoading}
                                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-black py-[16px] rounded-[20px] transition-all active:scale-95 shadow-lg flex items-center justify-center gap-[8px] text-[12px] disabled:opacity-50 disabled:cursor-not-allowed font-['Outfit']"
                                        >
                                            {customReportLoading === 'CSV' ? (
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            ) : (
                                                <FaFileAlt />
                                            )}
                                            CSV (Excel)
                                        </button>
                                        <button
                                            onClick={() => handleGenerateCustomReport('TXT')}
                                            disabled={!!customReportLoading}
                                            className="bg-slate-700 hover:bg-slate-800 text-white font-black py-[16px] rounded-[20px] transition-all active:scale-95 shadow-lg flex items-center justify-center gap-[8px] text-[12px] disabled:opacity-50 disabled:cursor-not-allowed font-['Outfit']"
                                        >
                                            {customReportLoading === 'TXT' ? (
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            ) : (
                                                <FaFileAlt />
                                            )}
                                            Text Log
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {showPermissionModal && (
                <div className="fixed inset-0 z-160 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[40px] w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-300 overflow-hidden">
                        <div className="p-8 border-b border-slate-100 bg-linear-to-br from-purple-900 to-purple-800 text-white">
                            <button onClick={() => setShowPermissionModal(false)} className="absolute top-6 right-6 text-purple-300 hover:text-white transition-colors">
                                <FaTimes />
                            </button>
                            <h3 className="text-xl font-black font-['Outfit']">Permission Details</h3>
                            <p className="text-purple-300 text-[10px] font-black uppercase tracking-widest mt-1 font-['Outfit']">{permissionModalData.member_name}</p>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="space-y-4">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 font-['Outfit']">Permission Time</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 font-['Outfit']">From</p>
                                        <div className="flex gap-2">
                                            <select value={permissionModalData.start_hour} onChange={(e) => setPermissionModalData({ ...permissionModalData, start_hour: e.target.value })} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-3 text-xs font-black text-slate-700 outline-none focus:border-purple-500 font-['Outfit']">
                                                {Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0')).map(h => <option key={h} value={h}>{h}</option>)}
                                            </select>
                                            <select value={permissionModalData.start_minute} onChange={(e) => setPermissionModalData({ ...permissionModalData, start_minute: e.target.value })} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-3 text-xs font-black text-slate-700 outline-none focus:border-purple-500 font-['Outfit']">
                                                {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map(m => <option key={m} value={m}>{m}</option>)}
                                            </select>
                                            <select value={permissionModalData.start_period} onChange={(e) => setPermissionModalData({ ...permissionModalData, start_period: e.target.value })} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-3 text-xs font-black text-slate-700 outline-none focus:border-purple-500 font-['Outfit']">
                                                <option value="AM">AM</option>
                                                <option value="PM">PM</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 font-['Outfit']">To</p>
                                        <div className="flex gap-2">
                                            <select value={permissionModalData.end_hour} onChange={(e) => setPermissionModalData({ ...permissionModalData, end_hour: e.target.value })} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-3 text-xs font-black text-slate-700 outline-none focus:border-purple-500 font-['Outfit']">
                                                {Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0')).map(h => <option key={h} value={h}>{h}</option>)}
                                            </select>
                                            <select value={permissionModalData.end_minute} onChange={(e) => setPermissionModalData({ ...permissionModalData, end_minute: e.target.value })} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-3 text-xs font-black text-slate-700 outline-none focus:border-purple-500 font-['Outfit']">
                                                {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map(m => <option key={m} value={m}>{m}</option>)}
                                            </select>
                                            <select value={permissionModalData.end_period} onChange={(e) => setPermissionModalData({ ...permissionModalData, end_period: e.target.value })} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-3 text-xs font-black text-slate-700 outline-none focus:border-purple-500 font-['Outfit']">
                                                <option value="AM">AM</option>
                                                <option value="PM">PM</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 font-['Outfit']">Reason for Permission</label>
                                <textarea
                                    value={permissionModalData.reason}
                                    onChange={(e) => setPermissionModalData({ ...permissionModalData, reason: e.target.value })}
                                    placeholder="Enter reason for leaving..."
                                    rows="3"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-600 outline-none focus:bg-white focus:border-purple-500 transition-all resize-none font-['Outfit']"
                                ></textarea>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 flex gap-3">
                            <button
                                onClick={() => setShowPermissionModal(false)}
                                className="flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 bg-white border border-slate-200 hover:bg-slate-100 transition-all font-['Outfit']"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    const duration = `${permissionModalData.start_hour}:${permissionModalData.start_minute} ${permissionModalData.start_period} - ${permissionModalData.end_hour}:${permissionModalData.end_minute} ${permissionModalData.end_period}`;
                                    const to24h = (h, m, p) => {
                                        let hours = parseInt(h);
                                        if (p === 'PM' && hours < 12) hours += 12;
                                        if (p === 'AM' && hours === 12) hours = 0;
                                        return `${hours.toString().padStart(2, '0')}:${m}`;
                                    };

                                    await handleQuickMark(
                                        permissionModalData.member_id,
                                        'permission',
                                        duration,
                                        null, // don't overwrite work notes here
                                        to24h(permissionModalData.start_hour, permissionModalData.start_minute, permissionModalData.start_period),
                                        to24h(permissionModalData.end_hour, permissionModalData.end_minute, permissionModalData.end_period),
                                        permissionModalData.reason
                                    );
                                    setShowPermissionModal(false);
                                    toast.success("Permission details saved!");
                                }}
                                className="flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white bg-purple-600 shadow-lg shadow-purple-600/20 hover:bg-purple-700 transition-all font-['Outfit']"
                            >
                                Save Permission
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showWorkDoneModal && (
                <div className="fixed inset-0 z-160 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[40px] w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-300 overflow-hidden">
                        <div className="p-8 border-b border-slate-100 bg-linear-to-br from-blue-900 to-blue-800 text-white">
                            <button onClick={() => setShowWorkDoneModal(false)} className="absolute top-6 right-6 text-blue-300 hover:text-white transition-colors">
                                <FaTimes />
                            </button>
                            <h3 className="text-xl font-black font-['Outfit']">Work of the Day</h3>
                            <p className="text-blue-300 text-[10px] font-black uppercase tracking-widest mt-1 font-['Outfit']">{workDoneModalData.member_name}</p>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 font-['Outfit']">Tasks Completed / Notes</label>
                                <textarea
                                    value={workDoneModalData.note}
                                    onChange={(e) => setWorkDoneModalData({ ...workDoneModalData, note: e.target.value })}
                                    placeholder="Describe the work completed today..."
                                    rows="6"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-600 outline-none focus:bg-white focus:border-blue-500 transition-all resize-none font-['Outfit']"
                                ></textarea>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 flex gap-3">
                            <button
                                onClick={() => setShowWorkDoneModal(false)}
                                className="flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 bg-white border border-slate-200 hover:bg-slate-100 transition-all font-['Outfit']"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    await handleQuickMark(
                                        workDoneModalData.member_id,
                                        workDoneModalData.status,
                                        null, // keep current duration
                                        workDoneModalData.note
                                    );
                                    setShowWorkDoneModal(false);
                                    toast.success("Work log updated!");
                                }}
                                className="flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white bg-blue-600 shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all font-['Outfit']"
                            >
                                Save Work Log
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttendanceTracker;
