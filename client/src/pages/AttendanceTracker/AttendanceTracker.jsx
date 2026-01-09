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
import { exportAttendanceToCSV, exportAttendanceToTXT, exportAttendanceToPDF, processAttendanceExportData } from '../../utils/exportUtils/index.js';
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
    // showMemberManager removed
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
    const handleExportCSV = (dataOrEvent = attendances, filters = {}) => {
        const data = processAttendanceExportData(
            Array.isArray(dataOrEvent) ? dataOrEvent : attendances,
            members,
            { periodType, currentPeriod, filterRole, filterMember, searchQuery }
        );

        if (data.length === 0) { toast.error("No data to export"); return; }

        const periodStr = filters.startDate && filters.endDate ? `${filters.startDate}_to_${filters.endDate}` : currentPeriod;
        const memberStr = filters.memberId ? `_${members.find(m => m.id == filters.memberId)?.name}` : (filterMember ? `_${members.find(m => m.id == filterMember)?.name}` : '');
        const roleStr = filters.role ? `_${filters.role}` : (filterRole ? `_${filterRole}` : '');

        exportAttendanceToCSV(data, `attendance_report_${periodStr}${memberStr}${roleStr}`);
        toast.success("CSV Exported");
    };

    const handleExportTXT = (dataOrEvent = attendances, reportStats = stats, filters = {}) => {
        const data = processAttendanceExportData(
            Array.isArray(dataOrEvent) ? dataOrEvent : attendances,
            members,
            { periodType, currentPeriod, filterRole, filterMember, searchQuery }
        );

        if (data.length === 0) { toast.error("No data to export"); return; }

        const periodStr = filters.startDate && filters.endDate
            ? `${filters.startDate} to ${filters.endDate}`
            : (periodType === 'range' ? `${customRange.start} to ${customRange.end}` : currentPeriod);

        const memberStr = filters.memberId ? `_${members.find(m => m.id == filters.memberId)?.name}` : (filterMember ? `_${members.find(m => m.id == filterMember)?.name}` : '');
        const roleStr = filters.role ? `_${filters.role}` : (filterRole ? `_${filterRole}` : '');

        exportAttendanceToTXT({ data, period: periodStr, filename: `attendance_report_${periodStr}${memberStr}${roleStr}` });
        toast.success("TXT Exported");
    };

    const handleExportPDF = (dataOrEvent = attendances, reportStats = stats, filters = {}) => {
        const data = processAttendanceExportData(
            Array.isArray(dataOrEvent) ? dataOrEvent : attendances,
            members,
            { periodType, currentPeriod, filterRole, filterMember, searchQuery }
        );

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

                        <div className="flex flex-wrap items-center gap-2">
                            {/* Period Selector - Now scrollable on mobile */}
                            <div className="flex-1 min-w-[140px] sm:flex-none h-[38px] flex items-center p-1 bg-slate-50 border border-slate-200 rounded-xl shadow-sm overflow-x-auto custom-scrollbar no-scrollbar">
                                {['day', 'month', 'year', 'range'].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setPeriodType(type)}
                                        className={`flex-1 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${periodType === type ? 'bg-white text-blue-600 shadow-sm border border-blue-100' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>

                            {/* Date Input - Balanced for mobile */}
                            <div className="flex-1 min-w-[140px] sm:min-w-[160px] h-[38px] flex items-center bg-white border border-slate-200 px-3 rounded-xl shadow-sm hover:border-blue-500 transition-colors">
                                {periodType === 'day' ? (
                                    <input
                                        type="date"
                                        value={currentPeriod.length === 10 ? currentPeriod : ''}
                                        onChange={(e) => setCurrentPeriod(e.target.value)}
                                        className="w-full text-[11px] font-bold text-slate-700 outline-none bg-transparent cursor-pointer"
                                    />
                                ) : periodType === 'month' ? (
                                    <input
                                        type="month"
                                        value={currentPeriod.length === 7 ? currentPeriod : ''}
                                        onChange={(e) => setCurrentPeriod(e.target.value)}
                                        className="w-full text-[11px] font-bold text-slate-700 outline-none bg-transparent cursor-pointer"
                                    />
                                ) : periodType === 'year' ? (
                                    <input
                                        type="number"
                                        min="2000"
                                        max="2100"
                                        value={currentPeriod.slice(0, 4)}
                                        onChange={(e) => setCurrentPeriod(e.target.value)}
                                        className="w-full text-[11px] font-bold text-slate-700 outline-none bg-transparent cursor-pointer"
                                    />
                                ) : (
                                    <div className="flex items-center gap-2 w-full">
                                        <input
                                            type="date"
                                            value={customRange.start}
                                            onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })}
                                            className="text-[10px] font-bold text-slate-700 outline-none bg-transparent cursor-pointer w-full min-w-0"
                                        />
                                        <span className="text-[10px] text-slate-400 font-bold">-</span>
                                        <input
                                            type="date"
                                            value={customRange.end}
                                            onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })}
                                            className="text-[10px] font-bold text-slate-700 outline-none bg-transparent cursor-pointer w-full min-w-0"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Project & Member Selectors - Stacked nicely */}
                            <div className="w-full sm:w-auto flex items-center gap-2">
                                <div className="flex-1 sm:w-[150px] relative">
                                    <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]" />
                                    <select
                                        value={filterProject}
                                        onChange={(e) => setFilterProject(e.target.value)}
                                        className="w-full h-[38px] pl-8 pr-3 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 outline-none hover:border-blue-500 transition-all cursor-pointer appearance-none shadow-sm"
                                    >
                                        <option value="">All Projects</option>
                                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div className="flex-1 sm:w-[150px] relative">
                                    <FaUserCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]" />
                                    <select
                                        value={filterMember}
                                        onChange={(e) => setFilterMember(e.target.value)}
                                        className="w-full h-[38px] pl-8 pr-3 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 outline-none hover:border-blue-500 transition-all cursor-pointer appearance-none shadow-sm"
                                    >
                                        <option value="">All Members</option>
                                        {members.sort((a, b) => a.name.localeCompare(b.name)).map(m => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    onClick={() => setActiveTab('members')}
                                    className={`w-[38px] h-[38px] rounded-xl flex items-center justify-center transition-all shadow-sm border border-slate-200 shrink-0 ${activeTab === 'members' ? 'bg-blue-600 text-white shadow-blue-500/30 border-transparent' : 'bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-600'}`}
                                    title="Manage Members"
                                >
                                    <FaUserEdit />
                                </button>
                            </div>

                            {/* Role Filter & Manager */}
                            <div className="w-full sm:w-auto flex items-center gap-2">
                                <div className="flex-1 sm:w-[150px] relative">
                                    <FaTag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]" />
                                    <select
                                        value={filterRole}
                                        onChange={(e) => setFilterRole(e.target.value)}
                                        className="w-full h-[38px] pl-8 pr-3 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 outline-none hover:border-blue-500 transition-all cursor-pointer appearance-none shadow-sm"
                                    >
                                        <option value="">All Categories</option>
                                        {[...new Set([...roles.map(r => r.name), ...uniqueRoles])].sort().map(role => (
                                            <option key={role} value={role}>{role}</option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    onClick={() => setShowRoleManager(true)}
                                    className="w-[38px] h-[38px] bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center hover:bg-purple-50 hover:text-purple-600 transition-all shadow-sm border border-slate-200 shrink-0"
                                    title="Manage Categories"
                                >
                                    <FaTag />
                                </button>
                            </div>

                            {/* Global Search & Mark Button */}
                            <div className="w-full flex items-center gap-2">
                                <div className="flex-1 relative">
                                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]" />
                                    <input
                                        type="text"
                                        placeholder="Search logs..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full h-[38px] pl-9 pr-4 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 outline-none focus:border-blue-500 transition-all shadow-sm"
                                    />
                                </div>
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="h-[38px] bg-blue-600 hover:bg-blue-700 text-white px-5 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-2"
                                >
                                    <FaPlus className="text-[10px]" /> Mark
                                </button>
                            </div>

                            <ExportButtons
                                onExportCSV={() => setConfirmModal({ show: true, type: 'CSV', label: 'CSV Report' })}
                                onExportPDF={() => setConfirmModal({ show: true, type: 'PDF', label: 'PDF Report' })}
                                onExportTXT={() => setConfirmModal({ show: true, type: 'TXT', label: 'Plain Text Log' })}
                                className="w-full justify-center"
                            />
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
                        { id: 'quick', label: 'Daily Sheet' },
                        { id: 'members', label: 'Members' }
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
                                    {filteredAttendances.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-3">
                                            {filteredAttendances.map((item, idx) => {
                                                const option = statusOptions.find(o => o.id === item.status);
                                                return (
                                                    <div
                                                        key={item.id}
                                                        className="group p-3 sm:p-4 bg-white border border-slate-100 rounded-2xl hover:shadow-lg hover:border-blue-200 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2"
                                                        style={{ animationDelay: `${idx * 30}ms` }}
                                                    >
                                                        <div className="flex items-center justify-between gap-3">
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                <div className={`w-10 h-10 sm:w-12 sm:h-12 ${option?.bg} rounded-xl flex items-center justify-center text-lg ${option?.color} transition-transform group-hover:scale-105 duration-300 shrink-0`}>
                                                                    {option && <option.icon />}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <div className="flex items-center gap-2 mb-0.5">
                                                                        <h4 className="font-black text-slate-900 text-sm leading-tight truncate">{item.subject}</h4>
                                                                        <div className={`h-[8px] flex items-center px-1.5 rounded-full text-[6px] font-black uppercase tracking-tighter ${option?.bg} ${option?.color} border ${option?.border}`}>
                                                                            {option?.label}
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] text-slate-400 font-bold uppercase tracking-tight">
                                                                        <span className="flex items-center gap-1">
                                                                            <FaCalendarAlt className="text-slate-300 text-[8px]" />
                                                                            {new Date(item.date).toLocaleDateString('en-GB')}
                                                                        </span>
                                                                        {item.project_name && <span className="text-blue-500 flex items-center gap-1 font-black"><div className="w-1 h-1 rounded-full bg-blue-400" /> {item.project_name}</span>}
                                                                        {item.member_name && <span className="text-amber-500 flex items-center gap-1 font-black"><div className="w-1 h-1 rounded-full bg-amber-400" /> {item.member_name}</span>}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <button onClick={() => handleEdit(item)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all active:scale-90"><FaEdit className="text-xs" /></button>
                                                                <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all active:scale-90"><FaTrash className="text-xs" /></button>
                                                            </div>
                                                        </div>
                                                        {item.note && <div className="mt-2 text-[10px] text-slate-500 italic border-l-2 border-slate-100 pl-2 line-clamp-1">"{item.note}"</div>}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="py-20 flex flex-col items-center justify-center text-slate-300">
                                            <FaInbox className="text-4xl mb-3 opacity-10" />
                                            <p className="text-[10px] font-black uppercase tracking-widest">No records found</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : activeTab === 'summary' ? (
                    <div className="bg-white rounded-[32px] shadow-xl border border-slate-100 overflow-hidden animate-in fade-in duration-500">
                        <div className="p-4 sm:p-8 border-b border-slate-100 bg-slate-50/50">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center text-blue-600 text-xl shrink-0">
                                        <FaChartBar />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900 leading-tight">Attendance Summary</h3>
                                        <p className="text-slate-400 text-[9px] font-black uppercase tracking-wider mt-0.5">Performance Analytics</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 sm:flex-none flex bg-white p-1 rounded-xl border border-slate-200">
                                        <div className="px-4 py-1 text-center border-r border-slate-100">
                                            <p className="text-[8px] font-black text-slate-400 uppercase">Staff</p>
                                            <p className="text-sm font-black text-slate-900">{memberSummary.length}</p>
                                        </div>
                                        <div className="px-4 py-1 text-center">
                                            <p className="text-[8px] font-black text-slate-400 uppercase">Avg</p>
                                            <p className="text-sm font-black text-blue-600">
                                                {(memberSummary.reduce((acc, curr) => acc + (curr.total > 0 ? ((curr.present + curr.half_day * 0.5) / curr.total) * 100 : 0), 0) / (memberSummary.length || 1)).toFixed(0)}%
                                            </p>
                                        </div>
                                    </div>
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
                                        className="h-[44px] px-5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2 active:scale-95"
                                    >
                                        <FaFileAlt /> Report
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Desktop Summary View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Member</th>
                                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-center">Stats (P/A/L/H/Per)</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-right">Progress</th>
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
                                            const rate = w.total > 0 ? ((w.present + w.half_day * 0.5) / w.total * 100) : 0;
                                            return (
                                                <tr key={w.id} className="hover:bg-slate-50/80 transition-colors group">
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-black text-xs transition-all group-hover:bg-blue-600 group-hover:text-white">
                                                                {w.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <p className="font-black text-slate-900 leading-none">{w.name}</p>
                                                                <div className="h-[8px] mt-1.5 flex gap-1">
                                                                    <div className="px-1 bg-slate-100 text-[6px] font-black text-slate-400 rounded-full flex items-center uppercase tracking-tighter">ID: #{w.id}</div>
                                                                    <div className="px-1 bg-blue-50 text-[6px] font-black text-blue-500 rounded-full flex items-center uppercase tracking-tighter">{memberIdToRoleMap[w.id]}</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <span className="w-8 h-8 flex items-center justify-center bg-emerald-50 text-emerald-600 rounded-lg font-black text-[10px] border border-emerald-100" title="Present">{w.present}</span>
                                                            <span className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-600 rounded-lg font-black text-[10px] border border-red-100" title="Absent">{w.absent}</span>
                                                            <span className="w-8 h-8 flex items-center justify-center bg-amber-50 text-amber-600 rounded-lg font-black text-[10px] border border-amber-100" title="Late">{w.late}</span>
                                                            <span className="w-8 h-8 flex items-center justify-center bg-blue-50 text-blue-600 rounded-lg font-black text-[10px] border border-blue-100" title="Half Day">{w.half_day}</span>
                                                            <span className="w-8 h-8 flex items-center justify-center bg-purple-50 text-purple-600 rounded-lg font-black text-[10px] border border-purple-100" title="Permission">{w.permission || 0}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        <div className="flex items-center justify-end gap-3">
                                                            <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                                <div className={`h-full rounded-full transition-all duration-1000 ${rate >= 90 ? 'bg-emerald-500' : rate >= 75 ? 'bg-blue-500' : 'bg-amber-500'}`} style={{ width: `${rate}%` }} />
                                                            </div>
                                                            <span className={`text-[11px] font-black min-w-[32px] ${rate >= 90 ? 'text-emerald-600' : rate >= 75 ? 'text-blue-600' : 'text-amber-600'}`}>{rate.toFixed(0)}%</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Summary View */}
                        <div className="md:hidden space-y-3 p-4 bg-slate-50/50">
                            {memberSummary
                                .filter(w => {
                                    const matchesRole = !filterRole || memberIdToRoleMap[w.id] === filterRole;
                                    const matchesSearch = !searchQuery || w.name.toLowerCase().includes(searchQuery.toLowerCase());
                                    const matchesMember = !filterMember || w.id == filterMember;
                                    return matchesRole && matchesSearch && matchesMember;
                                })
                                .map((w) => {
                                    const rate = w.total > 0 ? ((w.present + w.half_day * 0.5) / w.total * 100) : 0;
                                    return (
                                        <div key={w.id} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-900 font-black text-sm">
                                                        {w.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-slate-900 text-sm leading-tight">{w.name}</h4>
                                                        <div className="h-[8px] mt-1 flex gap-1">
                                                            <div className="px-1 bg-slate-100 text-[6px] font-black text-slate-400 rounded-full flex items-center uppercase">ID: #{w.id}</div>
                                                            <div className="px-1 bg-blue-50 text-[6px] font-black text-blue-500 rounded-full flex items-center uppercase">{memberIdToRoleMap[w.id]}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-base font-black ${rate >= 90 ? 'text-emerald-600' : rate >= 75 ? 'text-blue-600' : 'text-amber-600'}`}>{rate.toFixed(0)}%</p>
                                                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest text-right">Performance</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded-2xl">
                                                <div className="flex-1 text-center">
                                                    <p className="text-[8px] font-black text-emerald-500 uppercase">P</p>
                                                    <p className="text-xs font-black text-slate-900">{w.present}</p>
                                                </div>
                                                <div className="w-px h-4 bg-slate-200" />
                                                <div className="flex-1 text-center">
                                                    <p className="text-[8px] font-black text-red-500 uppercase">A</p>
                                                    <p className="text-xs font-black text-slate-900">{w.absent}</p>
                                                </div>
                                                <div className="w-px h-4 bg-slate-200" />
                                                <div className="flex-1 text-center">
                                                    <p className="text-[8px] font-black text-amber-500 uppercase">L</p>
                                                    <p className="text-xs font-black text-slate-900">{w.late}</p>
                                                </div>
                                                <div className="w-px h-4 bg-slate-200" />
                                                <div className="flex-1 text-center">
                                                    <p className="text-[8px] font-black text-blue-500 uppercase">H</p>
                                                    <p className="text-xs font-black text-slate-900">{w.half_day}</p>
                                                </div>
                                                <div className="w-px h-4 bg-slate-200" />
                                                <div className="flex-1 text-center">
                                                    <p className="text-[8px] font-black text-purple-500 uppercase">Per</p>
                                                    <p className="text-xs font-black text-slate-900">{w.permission || 0}</p>
                                                </div>
                                            </div>
                                            <div className="mt-4 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full ${rate >= 90 ? 'bg-emerald-500' : rate >= 75 ? 'bg-blue-500' : 'bg-amber-500'}`} style={{ width: `${rate}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            {memberSummary.length === 0 && (
                                <div className="py-20 text-center text-slate-300">
                                    <FaInbox className="text-4xl mb-3 opacity-10 mx-auto" strokeWidth={1} />
                                    <p className="text-[10px] font-black uppercase tracking-widest">No statistics available</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : activeTab === 'members' ? (
                    <MemberManager onClose={() => setActiveTab('records')} onUpdate={fetchData} />
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

                        <div className="p-0">
                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50/50">
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Name</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Status</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Permission</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Work Details</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Current</th>
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
                                                        <td className="px-8 py-6">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 bg-white rounded-xl border border-slate-100 items-center justify-center text-slate-400 group-hover:text-blue-500 shadow-sm transition-all shrink-0 flex">
                                                                    <FaUserCheck />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <h4 className="font-black text-slate-900 leading-tight truncate text-base">{w.name}</h4>
                                                                    <p className="text-[9px] font-black uppercase tracking-tighter text-slate-400 mt-0.5">#{w.id}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6 text-center">
                                                            <div className="flex items-center justify-center gap-4">
                                                                <button
                                                                    disabled={currentStatus === 'present' || currentStatus === 'permission'}
                                                                    onClick={() => handleQuickMark(w.id, 'present')}
                                                                    className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${(currentStatus === 'present' || currentStatus === 'permission') ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-105' : 'bg-slate-100/50 text-slate-400 border border-slate-100 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 cursor-pointer'}`}
                                                                >
                                                                    Present
                                                                </button>
                                                                <button
                                                                    disabled={currentStatus === 'absent'}
                                                                    onClick={() => handleQuickMark(w.id, 'absent')}
                                                                    className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${currentStatus === 'absent' ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 scale-105' : 'bg-slate-100/50 text-slate-400 border border-slate-100 hover:bg-red-500 hover:text-white hover:border-red-500 cursor-pointer'}`}
                                                                >
                                                                    Absent
                                                                </button>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <div className={`flex flex-col items-center gap-2 transition-all duration-300 ${isPresentOrPerm ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        disabled={!isPresentOrPerm}
                                                                        onClick={() => {
                                                                            const currentReason = attendance?.permission_reason || '';
                                                                            const [startStr, endStr] = (attendance?.permission_duration || '09:00 AM - 10:00 AM').split(' - ');
                                                                            const parseTime = (str) => {
                                                                                const [time, period] = (str || '').split(' ');
                                                                                const [h, m] = (time || '09:00').split(':');
                                                                                return { h: h || '09', m: m || '00', p: period || 'AM' };
                                                                            };
                                                                            const start = parseTime(startStr);
                                                                            const end = parseTime(endStr);
                                                                            setPermissionModalData({
                                                                                member_id: w.id, member_name: w.name, status: 'permission',
                                                                                start_hour: start.h, start_minute: start.m, start_period: start.p,
                                                                                end_hour: end.h, end_minute: end.m, end_period: end.p,
                                                                                reason: currentReason, attendance_id: attendance?.id
                                                                            });
                                                                            setShowPermissionModal(true);
                                                                        }}
                                                                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${currentStatus === 'permission' ? 'bg-purple-500 text-white shadow-xs' : 'bg-slate-50 text-slate-400 border border-slate-200 hover:bg-purple-50 hover:text-purple-600'}`}
                                                                    >
                                                                        <FaClock className="text-[10px]" /> Perm.
                                                                    </button>
                                                                    {currentStatus === 'permission' && (
                                                                        <div className="bg-white border border-slate-100 rounded-lg px-2 py-1.5 text-[10px] font-bold text-slate-600 truncate max-w-[120px]">
                                                                            {attendance?.permission_duration}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <div
                                                                onClick={() => { if (!isPresentOrPerm) return; setWorkDoneModalData({ member_id: w.id, member_name: w.name, status: currentStatus || 'present', note: attendance?.note || '', attendance_id: attendance?.id }); setShowWorkDoneModal(true); }}
                                                                className={`cursor-pointer transition-all duration-300 ${isPresentOrPerm ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}
                                                            >
                                                                <div className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-[10px] font-bold text-slate-500 flex items-center hover:border-blue-300">
                                                                    <span className="truncate">{attendance?.note || "Work notes..."}</span>
                                                                    <FaEdit className="ml-auto text-[10px] text-slate-300" />
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6 text-right">
                                                            {option && (
                                                                <div className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${option.bg} ${option.color} border ${option.border}`}>
                                                                    <option.icon className="text-xs" />
                                                                    {option.label}
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="md:hidden space-y-3 p-4 bg-slate-50/50">
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
                                            <div key={w.id} className="bg-white rounded-[24px] border border-slate-100 p-4 shadow-sm active:scale-[0.98] transition-all">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl flex items-center justify-center text-blue-600 border border-blue-100 font-black text-xs">
                                                            {w.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-black text-slate-900 text-sm">{w.name}</h4>
                                                            <p className="text-[9px] font-black uppercase text-slate-400">ID: #{w.id}</p>
                                                        </div>
                                                    </div>
                                                    {option && (
                                                        <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${option.bg} ${option.color} border ${option.border} flex items-center gap-1`}>
                                                            <option.icon /> {option.label}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-2 gap-2 mb-3">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleQuickMark(w.id, 'present'); }}
                                                        className={`h-[42px] rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${currentStatus === 'present' || currentStatus === 'permission' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}
                                                    >
                                                        <FaCheckCircle className="text-xs" /> Present
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleQuickMark(w.id, 'absent'); }}
                                                        className={`h-[42px] rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${currentStatus === 'absent' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}
                                                    >
                                                        <FaTimesCircle className="text-xs" /> Absent
                                                    </button>
                                                </div>

                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            disabled={!isPresentOrPerm}
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
                                                                    member_id: w.id, member_name: w.name, status: 'permission',
                                                                    start_hour: start.h, start_minute: start.m, start_period: start.p,
                                                                    end_hour: end.h, end_minute: end.m, end_period: end.p,
                                                                    reason: attendance?.permission_reason || '', attendance_id: attendance?.id
                                                                });
                                                                setShowPermissionModal(true);
                                                            }}
                                                            className={`flex-1 h-[36px] rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2 transition-all ${currentStatus === 'permission' ? 'bg-purple-500 text-white shadow-lg' : isPresentOrPerm ? 'bg-purple-50 text-purple-600 border border-purple-100' : 'bg-slate-50 text-slate-300 border border-slate-50 cursor-not-allowed'}`}
                                                        >
                                                            <FaClock /> Permission {currentStatus === 'permission' && `(${attendance?.permission_duration})`}
                                                        </button>
                                                    </div>
                                                    <div
                                                        onClick={() => { if (!isPresentOrPerm) return; setWorkDoneModalData({ member_id: w.id, member_name: w.name, status: currentStatus || 'present', note: attendance?.note || '', attendance_id: attendance?.id }); setShowWorkDoneModal(true); }}
                                                        className={`h-[36px] rounded-xl px-4 flex items-center gap-3 transition-all ${isPresentOrPerm ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-slate-50 text-slate-300 border border-slate-50 cursor-not-allowed'}`}
                                                    >
                                                        <FaEdit className="text-[10px]" />
                                                        <span className="text-[10px] font-black uppercase truncate">{attendance?.note || "Add work details..."}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {
                showAddModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-3 sm:px-4 py-4 sm:py-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                        <div className="bg-white rounded-[24px] sm:rounded-[28px] w-full max-w-lg shadow-2xl relative animate-in zoom-in-95 duration-300 max-h-full flex flex-col">
                            {/* Fixed Header */}
                            <div className="flex items-center justify-between px-5 sm:px-6 pt-5 sm:pt-6 pb-3 sm:pb-4 shrink-0 border-b border-slate-100">
                                <div>
                                    <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2 font-['Outfit']">
                                        <div className="w-1 h-5 bg-blue-600 rounded-full"></div>
                                        {editingId ? 'Edit Record' : 'Mark Attendance'}
                                    </h2>
                                    <p className="text-slate-500 text-[10px] sm:text-xs mt-1 ml-3">Track attendance for the day</p>
                                </div>
                                <button onClick={() => { setShowAddModal(false); resetForm(); }} className="text-slate-400 hover:text-slate-800 transition-colors p-1.5 hover:bg-slate-100 rounded-lg"><FaTimes className="text-lg" /></button>
                            </div>

                            {/* Scrollable Content */}
                            <div className="overflow-y-auto custom-scrollbar px-5 sm:px-6 py-4 sm:py-5">

                                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                                    <div className="grid grid-cols-5 gap-2">
                                        {statusOptions.map(opt => (
                                            <button key={opt.id} type="button" onClick={() => setFormData({ ...formData, status: opt.id })} className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${formData.status === opt.id ? 'border-blue-500 bg-blue-50 scale-105' : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'}`}>
                                                <opt.icon className={`text-sm ${formData.status === opt.id ? 'text-blue-500' : 'text-slate-400'}`} />
                                                <span className={`text-[7px] font-black uppercase tracking-wider ${formData.status === opt.id ? 'text-blue-700' : 'text-slate-500'}`}>{opt.label.split(' ')[0]}</span>
                                            </button>
                                        ))}
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Subject / Label</label>
                                            <input required type="text" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} placeholder="E.g. Office, College, Gym..." className="w-full bg-white border border-slate-200 rounded-xl px-3 h-9 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all font-['Outfit']" />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Date</label>
                                                <div className="relative">
                                                    <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]" />
                                                    <input required type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 h-9 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all font-['Outfit'] cursor-pointer" />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Project</label>
                                                <select value={formData.project_id} onChange={(e) => setFormData({ ...formData, project_id: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl px-3 h-9 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all cursor-pointer font-['Outfit']">
                                                    <option value="">No Project</option>
                                                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Member</label>
                                            <select value={formData.member_id} onChange={(e) => setFormData({ ...formData, member_id: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl px-3 h-9 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all cursor-pointer font-['Outfit']">
                                                <option value="">No Member</option>
                                                {members.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Note (Optional)</label>
                                            <textarea value={formData.note} onChange={(e) => setFormData({ ...formData, note: e.target.value })} placeholder="Add more details..." rows="2" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all resize-none font-['Outfit']"></textarea>
                                        </div>
                                    </div>

                                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg transition-all hover:scale-[1.02] active:scale-95 font-['Outfit']">
                                        {editingId ? 'Update Record' : 'Mark Attendance'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                )
            }

            {showProjectManager && (
                <ProjectManager
                    projects={projects}
                    onCreate={createProject}
                    onDelete={deleteProject}
                    onClose={() => { setShowProjectManager(false); fetchData(); }}
                    onRefresh={() => getProjects().then(res => setProjects(res.data))}
                />
            )
            }
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
            <ConfirmModal
                isOpen={confirmModal.show}
                onCancel={() => setConfirmModal({ show: false, type: null, label: '', id: null })}
                onConfirm={handleModalConfirm}
                title={confirmModal.type === 'DELETE' ? 'Delete Record' : `Export ${confirmModal.label}`}
                message={confirmModal.type === 'DELETE' ? 'Are you sure you want to delete this attendance record?' : `Do you want to download the ${confirmModal.label}?`}
                confirmText={confirmModal.type === 'DELETE' ? "Delete" : "Download"}
                type={confirmModal.type === 'DELETE' ? 'danger' : 'success'}
            />
        </div>
    );
};

export default AttendanceTracker;
