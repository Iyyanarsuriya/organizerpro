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
    quickMarkAttendance as quickMarkITAttendance,
    bulkMarkAttendance as bulkMarkITAttendance,
    getProjects,
    createProject,
    deleteProject
} from '../../api/Attendance/itAttendance';
import { getMembers, getMemberRoles } from '../../api/TeamManagement/itTeam';
import toast from 'react-hot-toast';
import {
    FaCheckCircle, FaTimesCircle, FaClock, FaExclamationCircle,
    FaPlus, FaTrash, FaEdit, FaCalendarAlt, FaSearch,
    FaFilter, FaChartBar, FaUserCheck, FaChevronLeft, FaChevronRight,
    FaFolderPlus, FaTimes, FaInbox, FaUserEdit, FaCheck, FaQuestionCircle,
    FaFileAlt, FaTag, FaBusinessTime, FaChevronDown
} from 'react-icons/fa';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from 'recharts';
import { exportAttendanceToCSV, exportAttendanceToTXT, exportAttendanceToPDF, processAttendanceExportData } from '../../utils/exportUtils/index.js';
import ExportButtons from '../../components/Common/ExportButtons';
import ProjectManager from '../../components/Manufacturing/ProjectManager';
import MemberManager from '../../components/IT/MemberManager';
import TimesheetManager from '../../components/IT/TimesheetManager';
import LeaveManager from '../../components/IT/LeaveManager';
import AuditLogViewer from '../../components/IT/AuditLogViewer';

const SECTOR = 'it';

const ITAttendance = () => {
    const navigate = useNavigate();
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const [attendances, setAttendances] = useState([]);
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);

    const [projects, setProjects] = useState([]);
    const [members, setMembers] = useState([]);
    const [showProjectManager, setShowProjectManager] = useState(false);
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

    const [showHalfDayModal, setShowHalfDayModal] = useState(false);
    const [halfDayModalData, setHalfDayModalData] = useState({
        member_id: null,
        member_name: '',
        period: 'AM' // or 'PM'
    });

    const [showOvertimeModal, setShowOvertimeModal] = useState(false);
    const [overtimeModalData, setOvertimeModalData] = useState({
        member_id: null,
        member_name: '',
        status: 'overtime',
        start_hour: '05',
        start_minute: '00',
        start_period: 'PM',
        end_hour: '07',
        end_minute: '00',
        end_period: 'PM',
        reason: '',
        attendance_id: null
    });

    const [showBulkStatusModal, setShowBulkStatusModal] = useState(false);
    const [bulkStatusData, setBulkStatusData] = useState({
        status: '',
        date: '',
        reason: ''
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

    const [confirmModal, setConfirmModal] = useState({ show: false, type: null, label: '', id: null });
    const [filterRole, setFilterRole] = useState('');


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
        { id: 'permission', label: 'Permission', icon: FaBusinessTime, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-100' },
        { id: 'week_off', label: 'Week Off', icon: FaCalendarAlt, color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-100' },
        { id: 'holiday', label: 'Holiday', icon: FaCalendarAlt, color: 'text-pink-500', bg: 'bg-pink-50', border: 'border-pink-100' }
    ];

    function getHexColor(status) {
        switch (status) {
            case 'present': return '#10b981';
            case 'absent': return '#ef4444';
            case 'late': return '#f59e0b';
            case 'half-day': return '#3b82f6';
            case 'permission': return '#a855f7';
            case 'week_off': return '#64748b';
            case 'holiday': return '#ec4899';
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
                    endDate: rangeEnd,
                    sector: SECTOR
                }),
                getAttendanceStats({
                    projectId: filterProject,
                    memberId: filterMember,
                    period: isRange ? null : currentPeriod,
                    startDate: rangeStart,
                    endDate: rangeEnd,
                    sector: SECTOR
                }),
                getMemberSummary({
                    projectId: filterProject,
                    period: isRange ? null : currentPeriod,
                    startDate: rangeStart,
                    endDate: rangeEnd,
                    sector: SECTOR
                }),
                getProjects({ sector: SECTOR }),
                getMembers({ sector: SECTOR }),
                getMemberRoles({ sector: SECTOR })
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



    const calculateDuration = (start, end) => {
        if (!start || !end) return 0;
        const [h1, m1] = start.split(':').map(Number);
        const [h2, m2] = end.split(':').map(Number);
        const date1 = new Date(0, 0, 0, h1, m1, 0);
        const date2 = new Date(0, 0, 0, h2, m2, 0);
        let diff = date2 - date1;
        if (diff < 0) diff += 24 * 60 * 60 * 1000;
        return (diff / (1000 * 60 * 60)).toFixed(2);
    };

    const handleQuickMark = async (memberId, status = null, permission_duration = null, note = null, permission_start_time = null, permission_end_time = null, permission_reason = null, overtimeData = null, check_in = null, check_out = null, total_hours = null, work_mode = null) => {
        try {
            const date = periodType === 'day' ? currentPeriod : new Date().toISOString().split('T')[0];
            const payload = {
                member_id: memberId,
                status,
                date,
                project_id: filterProject || null,
                subject: `Daily Attendance`,
                permission_duration,
                note,
                permission_start_time,
                permission_end_time,
                permission_reason,
                sector: SECTOR,
                check_in,
                check_out,
                total_hours,
                work_mode
            };

            if (overtimeData) {
                payload.overtime_duration = overtimeData.duration;
                payload.overtime_reason = overtimeData.reason;
            }

            await quickMarkITAttendance(payload);
            fetchData();
        } catch (error) {
            toast.error("Failed to update");
        }
    };






    const handleBulkMark = (status) => {
        const targetDate = activeTargetDate;
        const isChild = currentUser.owner_id != null;
        const today = new Date().toISOString().split('T')[0];

        if (isChild && targetDate < today) {
            toast.error("Child users cannot mark for previous days.");
            return;
        }

        if (status === 'custom') {
            setBulkStatusData({
                status: 'custom',
                date: targetDate,
                endDate: targetDate,
                returnDate: targetDate,
                isRange: false,
                reason: '',
                selectedStatus: 'present'
            });
            setShowBulkStatusModal(true);
        } else {
            setBulkStatusData({
                status: status,
                date: targetDate,
                endDate: targetDate,
                returnDate: targetDate,
                isRange: false,
                reason: '',
                selectedStatus: status
            });
            setShowBulkStatusModal(true);
        }
    };

    const confirmBulkMark = async () => {
        const { status, date, reason, selectedStatus } = bulkStatusData;

        // Determine final values
        const finalStatus = status === 'custom' ? selectedStatus : status;
        let subject = finalStatus === 'week_off' ? 'Weekend' : 'Bulk Mark';
        let note = null;

        if (status === 'holiday') {
            subject = reason.trim() || 'Holiday';
            note = subject;
        } else if (status === 'custom') {
            // For custom, use the entered reason as note/subject if provided
            if (reason && reason.trim()) {
                note = reason.trim();
                subject = reason.trim(); // Optional: or keep as 'Bulk Mark'
            }
        }

        try {
            const memberIds = members.map(m => m.id);
            let datesToMark = [date];

            if (bulkStatusData.isRange && bulkStatusData.endDate) {
                const start = new Date(date);
                const end = new Date(bulkStatusData.endDate);
                datesToMark = [];
                for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
                    datesToMark.push(new Date(d).toISOString().split('T')[0]);
                }
            }

            const promises = datesToMark.map(d => {
                const payload = {
                    member_ids: memberIds,
                    date: d,
                    status: finalStatus,
                    subject,
                    note,
                    sector: SECTOR
                };
                return bulkMarkITAttendance(payload);
            });

            await Promise.all(promises);
            toast.success("Bulk update successful");
            fetchData();
            setShowBulkStatusModal(false);
        } catch (err) {
            toast.error("Failed to bulk update");
        }
    };

    const handleDelete = (id) => {
        setConfirmModal({ show: true, type: 'DELETE', label: 'Delete Record', id });
    };

    const handleModalConfirm = async () => {
        if (confirmModal.type === 'DELETE') {
            try {
                await deleteAttendance(confirmModal.id, { sector: SECTOR });
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

    const canEdit = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const isPastDate = activeTargetDate < today;
        const isChild = currentUser.owner_id != null;
        return !isChild || !isPastDate;
    }, [activeTargetDate, currentUser]);

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

    const projectSummary = useMemo(() => {
        if (!attendances.length) return [];
        const map = {};
        projects.forEach(p => map[p.id] = { id: p.id, name: p.name, hours: 0, cost: 0, count: 0 });
        map['null'] = { id: 'null', name: 'No Project', hours: 0, cost: 0, count: 0 };

        attendances.forEach(a => {
            const pid = a.project_id || 'null';
            if (!map[pid]) map[pid] = { id: pid, name: a.project_name || 'Unknown', hours: 0, cost: 0, count: 0 };

            if (a.total_hours) map[pid].hours += parseFloat(a.total_hours);
            map[pid].count += 1;

            // Calculate refined cost if possible
            const member = members.find(m => m.id === a.member_id);
            if (member) {
                // Approximate cost: (wage / 8) * hours
                const hourlyRate = (parseFloat(member.daily_wage) || 0) / 8; // Assuming 8hr day for wage calc
                map[pid].cost += hourlyRate * (parseFloat(a.total_hours) || 0);
            }
        });

        return Object.values(map).filter(p => p.hours > 0 || p.count > 0).sort((a, b) => b.hours - a.hours);
    }, [attendances, projects, members]);

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
                            <button
                                onClick={() => navigate('/it-sector')}
                                className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-600 transition-all cursor-pointer shadow-sm active:scale-95"
                            >
                                <FaChevronLeft className="text-sm sm:text-base from-neutral-400" />
                            </button>
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
                                            <option key={m.id} value={m.id}>
                                                {m.name} {m.status === 'inactive' ? '(Inactive)' : ''}
                                            </option>
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

                            {/* Role Filter & Project Filter */}
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
                                <div className="flex-1 sm:w-[150px] relative">
                                    <FaFolderPlus className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]" />
                                    <select
                                        value={filterProject}
                                        onChange={(e) => setFilterProject(e.target.value)}
                                        className="w-full h-[38px] pl-8 pr-3 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 outline-none hover:border-blue-500 transition-all cursor-pointer appearance-none shadow-sm"
                                    >
                                        <option value="">All Projects</option>
                                        {projects.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Global Search & Mark Button */}
                            <div className="w-full sm:w-auto flex items-center gap-2">
                                {/* Project Manager Button - NEW */}
                                <button
                                    onClick={() => setShowProjectManager(true)}
                                    className="h-[38px] w-[38px] bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 transition-all active:scale-95 shrink-0"
                                    title="Manage Projects"
                                >
                                    <FaFolderPlus className="text-xs" />
                                </button>

                                <div className="flex-1 relative min-w-[120px]">
                                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]" />
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full h-[38px] pl-8 pr-3 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 outline-none focus:border-blue-500 transition-all shadow-sm"
                                    />
                                </div>



                            </div>

                            <div className="flex items-center gap-2">
                                <ExportButtons
                                    onExportPDF={() => onExport('PDF')}
                                    onExportCSV={() => onExport('CSV')}
                                    onExportTXT={() => onExport('TXT')}
                                />
                            </div>
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
                        { id: 'timesheets', label: 'Timesheets' },
                        { id: 'leaves', label: 'Leaves' },
                        { id: 'audit', label: 'Audit Logs' },
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

                {activeTab === 'timesheets' && (
                    <TimesheetManager
                        members={members}
                        projects={projects}
                        currentUser={currentUser}
                    />
                )}

                {activeTab === 'leaves' && (
                    <LeaveManager
                        members={members}
                        currentUser={currentUser}
                    />
                )}

                {activeTab === 'audit' && (
                    <AuditLogViewer
                        sector={SECTOR}
                    />
                )}

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
                                                                        <div className={`py-0.5 px-2 rounded-full text-[8px] font-black uppercase tracking-wider whitespace-nowrap ${option?.bg} ${option?.color} border ${option?.border}`}>
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
                                                                        {item.created_by && <span className="text-purple-400 flex items-center gap-1">Created: {item.created_by}</span>}
                                                                        {item.updated_by && <span className="text-orange-400 flex items-center gap-1">Updated: {item.updated_by}</span>}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <div className="flex flex-col items-end gap-1">
                                                                    {item.check_in && (
                                                                        <div className="text-[9px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 flex items-center gap-1.5">
                                                                            <span className="text-emerald-600">IN: {item.check_in.slice(0, 5)}</span>
                                                                            {item.check_out && (
                                                                                <>
                                                                                    <span className="text-slate-300">|</span>
                                                                                    <span className="text-red-500">OUT: {item.check_out.slice(0, 5)}</span>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                    {item.total_hours > 0 && <span className="text-[8px] font-black text-blue-500 uppercase tracking-wide bg-blue-50 px-1.5 py-0.5 rounded-md">{item.total_hours} Hrs</span>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {item.work_mode && (
                                                            <div className="mt-2 flex items-center gap-2">
                                                                <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${item.work_mode === 'WFH' ? 'bg-purple-50 text-purple-600' : 'bg-slate-50 text-slate-500'}`}>
                                                                    {item.work_mode}
                                                                </span>
                                                                {item.note && <div className="text-[10px] text-slate-500 italic line-clamp-1 border-l border-slate-200 pl-2">"{item.note}"</div>}
                                                            </div>
                                                        )}
                                                        {!item.work_mode && item.note && <div className="mt-2 text-[10px] text-slate-500 italic border-l-2 border-slate-100 pl-2 line-clamp-1">"{item.note}"</div>}
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
                                                {(memberSummary.reduce((acc, curr) => acc + (curr.working_days > 0 ? ((curr.present + curr.half_day * 0.5) / curr.working_days) * 100 : 0), 0) / (memberSummary.length || 1)).toFixed(0)}%
                                            </p>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>

                        {/* Desktop Summary View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Member</th>
                                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-center">Stats (Days/P/A/L/H/Per)</th>
                                        <th className="px-4 py-5 text-[10px] font-black uppercase tracking-widest text-center">Util. %</th>
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
                                            const rate = w.working_days > 0 ? ((w.present + w.half_day * 0.5) / w.working_days * 100) : 0;
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
                                                            <span className="w-8 h-8 flex items-center justify-center bg-slate-800 text-white rounded-lg font-black text-[10px] border border-slate-700 shadow-sm" title="Working Days">{w.working_days}</span>
                                                            <span className="w-8 h-8 flex items-center justify-center bg-emerald-50 text-emerald-600 rounded-lg font-black text-[10px] border border-emerald-100" title="Present">{w.present}</span>
                                                            <span className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-600 rounded-lg font-black text-[10px] border border-red-100" title="Absent">{w.absent}</span>
                                                            <span className="w-8 h-8 flex items-center justify-center bg-amber-50 text-amber-600 rounded-lg font-black text-[10px] border border-amber-100" title="Late">{w.late}</span>
                                                            <span className="w-8 h-8 flex items-center justify-center bg-blue-50 text-blue-600 rounded-lg font-black text-[10px] border border-blue-100" title="Half Day">{w.half_day}</span>
                                                            <span className="w-8 h-8 flex items-center justify-center bg-purple-50 text-purple-600 rounded-lg font-black text-[10px] border border-purple-100" title="Permission">{w.permission || 0}</span>
                                                            {w.overtime_hours > 0 && <span className="w-auto px-2 h-8 flex items-center justify-center bg-orange-50 text-orange-600 rounded-lg font-black text-[10px] border border-orange-100" title="Overtime Hours">OT: {w.overtime_hours}h</span>}
                                                            {w.undertime_days > 0 && <span className="w-auto px-2 h-8 flex items-center justify-center bg-pink-50 text-pink-600 rounded-lg font-black text-[10px] border border-pink-100" title="Undertime Days">UT: {w.undertime_days}</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-5 text-center">
                                                        {(() => {
                                                            const memberParam = members.find(m => m.id === w.id);
                                                            const expectedH = memberParam?.expected_hours || 8;
                                                            const totalExpected = w.working_days * expectedH;
                                                            const util = totalExpected > 0 ? ((w.total_hours_worked || 0) / totalExpected) * 100 : 0;
                                                            return (
                                                                <span className={`text-xs font-black ${util >= 100 ? 'text-emerald-500' : util >= 80 ? 'text-blue-500' : 'text-amber-500'}`}>
                                                                    {util.toFixed(0)}%
                                                                </span>
                                                            );
                                                        })()}
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
                                    const rate = w.working_days > 0 ? ((w.present + w.half_day * 0.5) / w.working_days * 100) : 0;
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
                                            <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded-2xl mb-3">
                                                <div className="flex-1 text-center">
                                                    <p className="text-[8px] font-black text-slate-400 uppercase">Util %</p>
                                                    <p className="text-xs font-black text-blue-600">
                                                        {(() => {
                                                            const memberParam = members.find(m => m.id === w.id);
                                                            const expectedH = memberParam?.expected_hours || 8;
                                                            const totalExpected = w.working_days * expectedH;
                                                            return totalExpected > 0 ? (((w.total_hours_worked || 0) / totalExpected) * 100).toFixed(0) : '0';
                                                        })()}%
                                                    </p>
                                                </div>
                                                <div className="w-px h-4 bg-slate-200" />
                                                <div className="flex-1 text-center">
                                                    <p className="text-[8px] font-black text-slate-500 uppercase">Days</p>
                                                    <p className="text-xs font-black text-slate-900">{w.working_days}</p>
                                                </div>
                                                <div className="w-px h-4 bg-slate-200" />
                                                <div className="flex-1 text-center">
                                                    <p className="text-[8px] font-black text-emerald-500 uppercase">P</p>
                                                    <p className="text-xs font-black text-slate-900">{w.present}</p>
                                                </div>
                                                <div className="w-px h-4 bg-slate-200" />
                                                <div className="flex-1 text-center">
                                                    <p className="text-[8px] font-black text-red-500 uppercase">A</p>
                                                    <p className="text-xs font-black text-slate-900">{w.absent}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded-2xl">
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
                                            {(w.overtime_hours > 0 || w.undertime_days > 0) && (
                                                <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded-2xl mt-1">
                                                    {w.overtime_hours > 0 && (
                                                        <div className="flex-1 text-center">
                                                            <p className="text-[8px] font-black text-orange-500 uppercase">OT</p>
                                                            <p className="text-xs font-black text-slate-900">{w.overtime_hours}h</p>
                                                        </div>
                                                    )}
                                                    {w.overtime_hours > 0 && w.undertime_days > 0 && <div className="w-px h-4 bg-slate-200" />}
                                                    {w.undertime_days > 0 && (
                                                        <div className="flex-1 text-center">
                                                            <p className="text-[8px] font-black text-pink-500 uppercase">UT</p>
                                                            <p className="text-xs font-black text-slate-900">{w.undertime_days}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
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

                        {/* Project Summary Section */}
                        {projectSummary.length > 0 && (
                            <div className="border-t border-slate-100 p-8">
                                <h4 className="text-md font-black text-slate-900 mb-6 flex items-center gap-2">
                                    <FaFolderPlus className="text-indigo-500" /> Project Performance
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {projectSummary.map(p => (
                                        <div key={p.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                            <div className="flex justify-between items-start mb-2">
                                                <h5 className="font-black text-slate-700 text-sm truncate pr-2">{p.name}</h5>
                                                <span className="bg-white text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200 text-slate-500">{p.hours.toFixed(1)}h</span>
                                            </div>
                                            <div className="flex items-center gap-4 text-[10px] text-slate-500 font-bold uppercase tracking-wide">
                                                <span className="flex items-center gap-1"><FaUserCheck /> {p.count} Recs</span>
                                                <span className="flex items-center gap-1 text-emerald-600"><FaTag /> ${p.cost.toFixed(0)} Est.</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                ) : activeTab === 'members' ? (
                    <MemberManager sector={SECTOR} projects={projects} onClose={() => setActiveTab('records')} onUpdate={fetchData} />
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
                            {/* Bulk Action Toolbar */}
                            <div className="px-6 sm:px-8 py-4 bg-slate-50/50 border-b border-slate-100 flex flex-wrap items-center gap-3">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2 hidden sm:block">Quick Actions:</p>
                                <button
                                    onClick={() => handleBulkMark('present')}
                                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 shadow-sm transition-all flex items-center gap-2"
                                >
                                    <FaCheckCircle className="text-sm" /> Mark All Present
                                </button>
                                <div className="w-px h-6 bg-slate-200 hidden sm:block" />
                                <button
                                    onClick={() => handleBulkMark('week_off')}
                                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 hover:border-slate-300 shadow-sm transition-all flex items-center gap-2"
                                >
                                    <FaCalendarAlt className="text-sm" /> Mark Weekend
                                </button>
                                <button
                                    onClick={() => handleBulkMark('holiday')}
                                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-pink-500 hover:bg-pink-50 hover:border-pink-200 shadow-sm transition-all flex items-center gap-2"
                                >
                                    <FaTag className="text-sm" /> Mark Holiday
                                </button>
                            </div>

                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50/50">
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Name</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Status</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Check-In / Out</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Work Details</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Hours</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Current</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {members
                                            .filter(m => m.status === 'active') // Only show active members in daily sheet
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
                                                            <div className="flex items-center justify-center gap-1">
                                                                <button
                                                                    disabled={!canEdit || currentStatus === 'present' || currentStatus === 'permission'}
                                                                    onClick={() => handleQuickMark(w.id, 'present')}
                                                                    className={`px-3 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${(!canEdit && (currentStatus !== 'present' && currentStatus !== 'permission')) ? 'opacity-50 cursor-not-allowed bg-slate-50' : (currentStatus === 'present' || currentStatus === 'permission') ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-105' : 'bg-slate-100/50 text-slate-400 border border-slate-100 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 cursor-pointer'}`}
                                                                >
                                                                    Pre
                                                                </button>
                                                                <button
                                                                    disabled={!canEdit || currentStatus === 'absent'}
                                                                    onClick={() => handleQuickMark(w.id, 'absent')}
                                                                    className={`px-3 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${(!canEdit && currentStatus !== 'absent') ? 'opacity-50 cursor-not-allowed bg-slate-50' : currentStatus === 'absent' ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 scale-105' : 'bg-slate-100/50 text-slate-400 border border-slate-100 hover:bg-red-500 hover:text-white hover:border-red-500 cursor-pointer'}`}
                                                                >
                                                                    Abs
                                                                </button>
                                                                <button
                                                                    disabled={!canEdit || currentStatus === 'half-day'}
                                                                    onClick={() => {
                                                                        setHalfDayModalData({ member_id: w.id, member_name: w.name, period: 'AM' });
                                                                        setShowHalfDayModal(true);
                                                                    }}
                                                                    className={`px-3 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${(!canEdit && currentStatus !== 'half-day') ? 'opacity-50 cursor-not-allowed bg-slate-50' : currentStatus === 'half-day' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 scale-105' : 'bg-slate-100/50 text-slate-400 border border-slate-100 hover:bg-blue-500 hover:text-white hover:border-blue-500 cursor-pointer'}`}
                                                                >
                                                                    Half
                                                                </button>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <div className="flex items-center justify-center gap-2">
                                                                {/* Check In Button */}
                                                                {!attendance?.check_in ? (
                                                                    <button
                                                                        disabled={!canEdit || (currentStatus !== 'present' && currentStatus !== 'late')}
                                                                        onClick={() => {
                                                                            const time = new Date().toLocaleTimeString('en-GB', { hour12: false });
                                                                            handleQuickMark(w.id, 'present', null, null, null, null, null, null, time, null, null, 'Office');
                                                                        }}
                                                                        className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1 ${(currentStatus !== 'present' && currentStatus !== 'late') ? 'opacity-30 cursor-not-allowed bg-slate-50' : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-600'}`}
                                                                    >
                                                                        <FaCheckCircle /> IN
                                                                    </button>
                                                                ) : (
                                                                    <div className="text-center">
                                                                        <div className="text-[10px] font-bold text-slate-700 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                                                                            {attendance.check_in.slice(0, 5)}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Arrow */}
                                                                <span className="text-slate-300">→</span>

                                                                {/* Check Out Button */}
                                                                {!attendance?.check_out ? (
                                                                    <button
                                                                        disabled={!canEdit || !attendance?.check_in}
                                                                        onClick={() => {
                                                                            const time = new Date().toLocaleTimeString('en-GB', { hour12: false });
                                                                            const total = calculateDuration(attendance.check_in, time);
                                                                            handleQuickMark(w.id, 'present', null, null, null, null, null, null, null, time, total, attendance.work_mode || 'Office');
                                                                        }}
                                                                        className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1 ${!attendance?.check_in ? 'opacity-30 cursor-not-allowed bg-slate-50' : 'bg-red-500 text-white shadow-lg shadow-red-500/30 hover:bg-red-600'}`}
                                                                    >
                                                                        <FaTimesCircle /> OUT
                                                                    </button>
                                                                ) : (
                                                                    <div className="text-center">
                                                                        <div className="text-[10px] font-bold text-slate-700 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                                                                            {attendance.check_out.slice(0, 5)}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {/* Mode Selection */}
                                                            {attendance?.check_in && !attendance?.check_out && (
                                                                <div className="mt-2 flex justify-center">
                                                                    <select
                                                                        value={attendance?.work_mode || 'Office'}
                                                                        onChange={(e) => handleQuickMark(w.id, currentStatus, null, null, null, null, null, null, null, null, null, e.target.value)}
                                                                        className="bg-transparent text-[9px] font-black uppercase text-blue-500 outline-none cursor-pointer text-center"
                                                                    >
                                                                        <option value="Office">Office</option>
                                                                        <option value="WFH">WFH</option>
                                                                        <option value="On-site">On-site</option>
                                                                    </select>
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <div
                                                                onClick={() => {
                                                                    if (!isPresentOrPerm || !canEdit) return;
                                                                    setWorkDoneModalData({
                                                                        member_id: w.id,
                                                                        member_name: w.name,
                                                                        status: currentStatus || 'present',
                                                                        note: attendance?.note || '',
                                                                        attendance_id: attendance?.id,
                                                                        check_in: attendance?.check_in,
                                                                        check_out: attendance?.check_out,
                                                                        work_mode: attendance?.work_mode
                                                                    });
                                                                    setShowWorkDoneModal(true);
                                                                }}
                                                                className={`cursor-pointer transition-all duration-300 ${isPresentOrPerm ? (canEdit ? 'opacity-100' : 'opacity-70 cursor-not-allowed') : 'opacity-30 pointer-events-none'}`}
                                                            >
                                                                <div className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-[10px] font-bold text-slate-500 flex items-center hover:border-blue-300">
                                                                    <span className="truncate max-w-[150px]">{attendance?.note || "Work notes..."}</span>
                                                                    <FaEdit className="ml-auto text-[10px] text-slate-300" />
                                                                </div>
                                                                {attendance?.work_mode && (
                                                                    <div className="mt-1 flex gap-1">
                                                                        <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-[8px] font-bold">{attendance.work_mode}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <div className={`text-xs font-bold text-slate-600 ${isPresentOrPerm ? 'opacity-100' : 'opacity-30'}`}>
                                                                {attendance?.check_in ? (
                                                                    <div className="flex flex-col">
                                                                        <span>In: {attendance.check_in.slice(0, 5)}</span>
                                                                        <span>Out: {attendance.check_out ? attendance.check_out.slice(0, 5) : '--:--'}</span>
                                                                        {attendance?.total_hours > 0 && (
                                                                            <span className="text-[10px] text-emerald-600 mt-1">{attendance.total_hours} Hrs</span>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-slate-300">--:--</span>
                                                                )}
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
                                    .filter(m => m.status === 'active') // Only show active members in daily sheet
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

                                                {/* Mobile Hours Display */}
                                                {isPresentOrPerm && attendance?.check_in && (
                                                    <div className="mb-3 flex items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                                        <div className="text-[10px] font-bold text-slate-600">
                                                            In: <span className="text-slate-900">{attendance.check_in.slice(0, 5)}</span>
                                                        </div>
                                                        <div className="w-px h-3 bg-slate-300"></div>
                                                        <div className="text-[10px] font-bold text-slate-600">
                                                            Out: <span className="text-slate-900">{attendance.check_out ? attendance.check_out.slice(0, 5) : '--:--'}</span>
                                                        </div>
                                                        {attendance?.total_hours > 0 && (
                                                            <>
                                                                <div className="w-px h-3 bg-slate-300"></div>
                                                                <div className="text-[10px] font-black text-emerald-600">
                                                                    {attendance.total_hours}h
                                                                </div>
                                                            </>
                                                        )}
                                                        {attendance?.work_mode && (
                                                            <div className="ml-auto bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[8px] font-bold">
                                                                {attendance.work_mode === 'WFH' ? 'WFH' : attendance.work_mode === 'On-site' ? 'Site' : 'Office'}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-4 gap-1 mb-3">
                                                    <button
                                                        disabled={!canEdit}
                                                        onClick={(e) => { e.stopPropagation(); handleQuickMark(w.id, 'present'); }}
                                                        className={`h-[42px] rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${!canEdit ? 'opacity-50 cursor-not-allowed bg-slate-50 border border-slate-100' : (currentStatus === 'present' || currentStatus === 'permission') ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}
                                                    >
                                                        Pre
                                                    </button>
                                                    <button
                                                        disabled={!canEdit}
                                                        onClick={(e) => { e.stopPropagation(); handleQuickMark(w.id, 'absent'); }}
                                                        className={`h-[42px] rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${!canEdit ? 'opacity-50 cursor-not-allowed bg-slate-50 border border-slate-100' : currentStatus === 'absent' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}
                                                    >
                                                        Abs
                                                    </button>
                                                    {!attendance?.check_in ? (
                                                        <button
                                                            disabled={!canEdit}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const time = new Date().toLocaleTimeString('en-GB', { hour12: false });
                                                                handleQuickMark(w.id, 'present', null, null, null, null, null, null, time, null, null, 'Office');
                                                            }}
                                                            className="h-[42px] col-span-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                                                        >
                                                            <FaCheckCircle /> Check In
                                                        </button>
                                                    ) : !attendance?.check_out ? (
                                                        <button
                                                            disabled={!canEdit}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const time = new Date().toLocaleTimeString('en-GB', { hour12: false });
                                                                const total = calculateDuration(attendance.check_in, time);
                                                                handleQuickMark(w.id, 'present', null, null, null, null, null, null, null, time, total, attendance.work_mode || 'Office');
                                                            }}
                                                            className="h-[42px] col-span-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all bg-slate-800 text-white shadow-lg shadow-slate-800/20"
                                                        >
                                                            <FaTimesCircle /> Check Out
                                                        </button>
                                                    ) : (
                                                        <div className="h-[42px] col-span-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center gap-2 text-[10px] font-black text-slate-500 uppercase">
                                                            Done
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex flex-col gap-1">
                                                    <div className="grid grid-cols-2 gap-1">
                                                        <button
                                                            disabled={!canEdit || !isPresentOrPerm}
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
                                                            className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase flex flex-col items-center justify-center gap-1 transition-all ${currentStatus === 'permission' ? 'bg-purple-500 text-white shadow-lg' : isPresentOrPerm ? 'bg-purple-50 text-purple-600 border border-purple-100' : 'bg-slate-50 text-slate-300 border border-slate-50 cursor-not-allowed'}`}
                                                        >
                                                            <div className="flex items-center gap-1.5"><FaClock /> PERMISSION</div>
                                                            {currentStatus === 'permission' && <div className="text-[8px] opacity-90 font-medium leading-none">{attendance?.permission_duration}</div>}
                                                        </button>
                                                        <button
                                                            disabled={!canEdit || !isPresentOrPerm}
                                                            onClick={() => {
                                                                setOvertimeModalData({
                                                                    member_id: w.id, member_name: w.name, status: 'overtime',
                                                                    start_hour: '05', start_minute: '00', start_period: 'PM',
                                                                    end_hour: '07', end_minute: '00', end_period: 'PM',
                                                                    reason: attendance?.permission_reason || '', attendance_id: attendance?.id
                                                                });
                                                                setShowOvertimeModal(true);
                                                            }}
                                                            className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase flex flex-col items-center justify-center gap-1 transition-all ${attendance?.overtime_duration ? 'bg-orange-500 text-white shadow-lg' : isPresentOrPerm ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-slate-50 text-slate-300 border border-slate-50 cursor-not-allowed'}`}
                                                        >
                                                            <div className="flex items-center gap-1.5"><FaBusinessTime /> OT</div>
                                                            {attendance?.overtime_duration && <div className="text-[8px] opacity-90 font-medium leading-none">{attendance?.overtime_duration}</div>}
                                                        </button>
                                                    </div>

                                                    {(attendance?.permission_reason || attendance?.overtime_reason) && (
                                                        <div className="grid grid-cols-2 gap-1 mb-2">
                                                            {attendance?.permission_reason && (
                                                                <div className="bg-purple-50 border border-purple-100 rounded-xl px-3 py-2">
                                                                    <p className="text-[8px] font-black uppercase text-purple-300 tracking-widest mb-0.5">Perm Reason</p>
                                                                    <p className="text-[10px] font-bold text-purple-700 leading-tight">{attendance.permission_reason}</p>
                                                                </div>
                                                            )}
                                                            {attendance?.overtime_reason && (
                                                                <div className="bg-orange-50 border border-orange-100 rounded-xl px-3 py-2">
                                                                    <p className="text-[8px] font-black uppercase text-orange-300 tracking-widest mb-0.5">OT Reason</p>
                                                                    <p className="text-[10px] font-bold text-orange-700 leading-tight">{attendance.overtime_reason}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    <div
                                                        onClick={() => { if (!isPresentOrPerm || !canEdit) return; setWorkDoneModalData({ member_id: w.id, member_name: w.name, status: currentStatus || 'present', note: attendance?.note || '', attendance_id: attendance?.id }); setShowWorkDoneModal(true); }}
                                                        className={`py-3 h-auto rounded-xl px-4 flex items-center gap-3 transition-all ${isPresentOrPerm ? (canEdit ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-slate-50 text-slate-300 border border-slate-100 cursor-not-allowed opacity-50') : 'bg-slate-50 text-slate-300 border border-slate-50 cursor-not-allowed'}`}
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



            {showProjectManager && (
                <ProjectManager
                    projects={projects}
                    onCreate={(data) => createProject({ ...data, sector: SECTOR })}
                    onDelete={(id) => deleteProject(id, { sector: SECTOR })}
                    onClose={() => { setShowProjectManager(false); fetchData(); }}
                    onRefresh={() => getProjects({ sector: SECTOR }).then(res => setProjects(res.data))}
                />
            )
            }

            {showOvertimeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[28px] w-full max-w-sm shadow-2xl p-6 relative animate-in zoom-in-95 duration-300">
                        <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                            <FaBusinessTime className="text-orange-500" /> Overtime Details
                        </h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Start Time</label>
                                    <div className="flex bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                                        <select value={overtimeModalData.start_hour} onChange={(e) => setOvertimeModalData({ ...overtimeModalData, start_hour: e.target.value })} className="w-full bg-transparent p-2 text-xs font-bold text-slate-700 outline-none"><option value="01">01</option><option value="02">02</option><option value="03">03</option><option value="04">04</option><option value="05">05</option><option value="06">06</option><option value="07">07</option><option value="08">08</option><option value="09">09</option><option value="10">10</option><option value="11">11</option><option value="12">12</option></select>
                                        <div className="w-px bg-slate-200"></div>
                                        <select value={overtimeModalData.start_minute} onChange={(e) => setOvertimeModalData({ ...overtimeModalData, start_minute: e.target.value })} className="w-full bg-transparent p-2 text-xs font-bold text-slate-700 outline-none">
                                            {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map(m => (
                                                <option key={m} value={m}>{m}</option>
                                            ))}
                                        </select>
                                        <div className="w-px bg-slate-200"></div>
                                        <select value={overtimeModalData.start_period} onChange={(e) => setOvertimeModalData({ ...overtimeModalData, start_period: e.target.value })} className="w-full bg-transparent p-2 text-[10px] font-black uppercase text-slate-500 outline-none"><option value="AM">AM</option><option value="PM">PM</option></select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">End Time</label>
                                    <div className="flex bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                                        <select value={overtimeModalData.end_hour} onChange={(e) => setOvertimeModalData({ ...overtimeModalData, end_hour: e.target.value })} className="w-full bg-transparent p-2 text-xs font-bold text-slate-700 outline-none"><option value="01">01</option><option value="02">02</option><option value="03">03</option><option value="04">04</option><option value="05">05</option><option value="06">06</option><option value="07">07</option><option value="08">08</option><option value="09">09</option><option value="10">10</option><option value="11">11</option><option value="12">12</option></select>
                                        <div className="w-px bg-slate-200"></div>
                                        <select value={overtimeModalData.end_minute} onChange={(e) => setOvertimeModalData({ ...overtimeModalData, end_minute: e.target.value })} className="w-full bg-transparent p-2 text-xs font-bold text-slate-700 outline-none">
                                            {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map(m => (
                                                <option key={m} value={m}>{m}</option>
                                            ))}
                                        </select>
                                        <div className="w-px bg-slate-200"></div>
                                        <select value={overtimeModalData.end_period} onChange={(e) => setOvertimeModalData({ ...overtimeModalData, end_period: e.target.value })} className="w-full bg-transparent p-2 text-[10px] font-black uppercase text-slate-500 outline-none"><option value="AM">AM</option><option value="PM">PM</option></select>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Reason/Note</label>
                                <textarea
                                    value={overtimeModalData.reason}
                                    onChange={(e) => setOvertimeModalData({ ...overtimeModalData, reason: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 resize-none outline-none focus:border-orange-500 transition-colors"
                                    rows="3"
                                    placeholder="Enter overtime details..."
                                ></textarea>
                            </div>
                            <div className="flex gap-3 mt-2">
                                <button onClick={() => setShowOvertimeModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-colors">Cancel</button>
                                <button
                                    onClick={() => {
                                        const duration = `${overtimeModalData.start_hour}:${overtimeModalData.start_minute} ${overtimeModalData.start_period} - ${overtimeModalData.end_hour}:${overtimeModalData.end_minute} ${overtimeModalData.end_period}`;
                                        handleQuickMark(overtimeModalData.member_id, null, null, null, null, null, null, { duration, reason: overtimeModalData.reason });
                                        setShowOvertimeModal(false);
                                    }}
                                    className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-colors"
                                >
                                    Save OT
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showPermissionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[28px] w-full max-w-sm shadow-2xl p-6 relative animate-in zoom-in-95 duration-300">
                        <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                            <FaClock className="text-purple-500" /> Permission Details
                        </h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Start Time</label>
                                    <div className="flex bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                                        <select value={permissionModalData.start_hour} onChange={(e) => setPermissionModalData({ ...permissionModalData, start_hour: e.target.value })} className="w-full bg-transparent p-2 text-xs font-bold text-slate-700 outline-none"><option value="01">01</option><option value="02">02</option><option value="03">03</option><option value="04">04</option><option value="05">05</option><option value="06">06</option><option value="07">07</option><option value="08">08</option><option value="09">09</option><option value="10">10</option><option value="11">11</option><option value="12">12</option></select>
                                        <div className="w-px bg-slate-200"></div>
                                        <select value={permissionModalData.start_minute} onChange={(e) => setPermissionModalData({ ...permissionModalData, start_minute: e.target.value })} className="w-full bg-transparent p-2 text-xs font-bold text-slate-700 outline-none">
                                            {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map(m => (
                                                <option key={m} value={m}>{m}</option>
                                            ))}
                                        </select>
                                        <div className="w-px bg-slate-200"></div>
                                        <select value={permissionModalData.start_period} onChange={(e) => setPermissionModalData({ ...permissionModalData, start_period: e.target.value })} className="w-full bg-transparent p-2 text-[10px] font-black uppercase text-slate-500 outline-none"><option value="AM">AM</option><option value="PM">PM</option></select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">End Time</label>
                                    <div className="flex bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                                        <select value={permissionModalData.end_hour} onChange={(e) => setPermissionModalData({ ...permissionModalData, end_hour: e.target.value })} className="w-full bg-transparent p-2 text-xs font-bold text-slate-700 outline-none"><option value="01">01</option><option value="02">02</option><option value="03">03</option><option value="04">04</option><option value="05">05</option><option value="06">06</option><option value="07">07</option><option value="08">08</option><option value="09">09</option><option value="10">10</option><option value="11">11</option><option value="12">12</option></select>
                                        <div className="w-px bg-slate-200"></div>
                                        <select value={permissionModalData.end_minute} onChange={(e) => setPermissionModalData({ ...permissionModalData, end_minute: e.target.value })} className="w-full bg-transparent p-2 text-xs font-bold text-slate-700 outline-none">
                                            {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map(m => (
                                                <option key={m} value={m}>{m}</option>
                                            ))}
                                        </select>
                                        <div className="w-px bg-slate-200"></div>
                                        <select value={permissionModalData.end_period} onChange={(e) => setPermissionModalData({ ...permissionModalData, end_period: e.target.value })} className="w-full bg-transparent p-2 text-[10px] font-black uppercase text-slate-500 outline-none"><option value="AM">AM</option><option value="PM">PM</option></select>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Reason</label>
                                <textarea
                                    value={permissionModalData.reason}
                                    onChange={(e) => setPermissionModalData({ ...permissionModalData, reason: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 resize-none outline-none focus:border-purple-500 transition-colors"
                                    rows="3"
                                    placeholder="Enter permission reason..."
                                ></textarea>
                            </div>
                            <div className="flex gap-3 mt-2">
                                <button onClick={() => setShowPermissionModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-colors">Cancel</button>
                                <button
                                    onClick={() => {
                                        const duration = `${permissionModalData.start_hour}:${permissionModalData.start_minute} ${permissionModalData.start_period} - ${permissionModalData.end_hour}:${permissionModalData.end_minute} ${permissionModalData.end_period}`;
                                        const startTime = `${permissionModalData.start_hour}:${permissionModalData.start_minute} ${permissionModalData.start_period}`;
                                        const endTime = `${permissionModalData.end_hour}:${permissionModalData.end_minute} ${permissionModalData.end_period}`;
                                        handleQuickMark(permissionModalData.member_id, 'permission', duration, null, startTime, endTime, permissionModalData.reason);
                                        setShowPermissionModal(false);
                                    }}
                                    className="flex-1 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-purple-500/20 hover:bg-purple-700 transition-colors"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showBulkStatusModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[28px] w-full max-w-sm shadow-2xl p-6 relative animate-in zoom-in-95 duration-300">
                        <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                            <FaCalendarAlt className="text-pink-500" />
                            {bulkStatusData.status === 'holiday' ? 'Mark Holiday' : 'Bulk Mark Status'}
                        </h3>

                        <div className="space-y-4">
                            <p className="text-xs font-bold text-slate-500 leading-relaxed">
                                You are about to mark <span className="text-slate-900">{members.length} active members</span> as <span className="uppercase text-blue-600">{bulkStatusData.status === 'custom' ? (bulkStatusData.selectedStatus ? bulkStatusData.selectedStatus.replace('_', ' ') : 'Present') : bulkStatusData.status.replace('_', ' ')}</span>.
                            </p>

                            {/* Date Selection Mode */}
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date Selection</span>
                                    <div className="flex bg-white rounded-lg p-1 border border-slate-200">
                                        <button
                                            onClick={() => setBulkStatusData({ ...bulkStatusData, isRange: false })}
                                            className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-wider transition-all ${!bulkStatusData.isRange ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            Single Day
                                        </button>
                                        <button
                                            onClick={() => setBulkStatusData({ ...bulkStatusData, isRange: true })}
                                            className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-wider transition-all ${bulkStatusData.isRange ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            Date Range
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1">
                                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Start Date</label>
                                        <input
                                            type="date"
                                            value={bulkStatusData.date}
                                            onChange={(e) => setBulkStatusData({ ...bulkStatusData, date: e.target.value })}
                                            className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
                                        />
                                    </div>
                                    {bulkStatusData.isRange && (
                                        <>
                                            <span className="mt-6 text-slate-300">-</span>
                                            <div className="flex-1">
                                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">End Date</label>
                                                <input
                                                    type="date"
                                                    value={bulkStatusData.endDate}
                                                    onChange={(e) => setBulkStatusData({ ...bulkStatusData, endDate: e.target.value })}
                                                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {bulkStatusData.status === 'custom' && (
                                <div>
                                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Select Status</label>
                                    <div className="grid grid-cols-2 gap-2 mb-3">
                                        {statusOptions.filter(o => o.id !== 'all').map(option => (
                                            <button
                                                key={option.id}
                                                onClick={() => setBulkStatusData({ ...bulkStatusData, selectedStatus: option.id })}
                                                className={`p-2 rounded-lg border text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${bulkStatusData.selectedStatus === option.id
                                                    ? `${option.bg} ${option.color} ${option.border} ring-2 ring-offset-1 ring-blue-200`
                                                    : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
                                                    }`}
                                            >
                                                <option.icon /> {option.label}
                                            </button>
                                        ))}
                                    </div>
                                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Note (Optional)</label>
                                    <input
                                        type="text"
                                        value={bulkStatusData.reason || ''}
                                        onChange={(e) => setBulkStatusData({ ...bulkStatusData, reason: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-colors"
                                        placeholder="Add a note..."
                                    />
                                </div>
                            )}

                            {bulkStatusData.status === 'holiday' && (
                                <div>
                                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Holiday Reason</label>
                                    <input
                                        type="text"
                                        value={bulkStatusData.reason}
                                        onChange={(e) => setBulkStatusData({ ...bulkStatusData, reason: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:border-pink-500 transition-colors"
                                        placeholder="e.g. Diwali, Independence Day..."
                                        autoFocus
                                    />
                                </div>
                            )}

                            <div className="flex gap-3 mt-4">
                                <button
                                    onClick={() => setShowBulkStatusModal(false)}
                                    className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-500 text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmBulkMark}
                                    className={`flex-1 py-3 rounded-xl text-white text-xs font-black uppercase tracking-widest shadow-lg transition-colors ${bulkStatusData.status === 'holiday'
                                        ? 'bg-pink-500 shadow-pink-500/20 hover:bg-pink-600'
                                        : 'bg-blue-600 shadow-blue-500/20 hover:bg-blue-700'
                                        }`}
                                >
                                    Confirm
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showWorkDoneModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[28px] w-full max-w-sm shadow-2xl p-6 relative animate-in zoom-in-95 duration-300">
                        <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                            <FaFileAlt className="text-blue-500" /> Work Details
                        </h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3 mb-2">
                                <div>
                                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Check In</label>
                                    <input
                                        type="time"
                                        value={workDoneModalData.check_in || ''}
                                        onChange={(e) => setWorkDoneModalData({ ...workDoneModalData, check_in: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Check Out</label>
                                    <input
                                        type="time"
                                        value={workDoneModalData.check_out || ''}
                                        onChange={(e) => setWorkDoneModalData({ ...workDoneModalData, check_out: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="mb-2">
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Work Mode</label>
                                <select
                                    value={workDoneModalData.work_mode || 'Office'}
                                    onChange={(e) => setWorkDoneModalData({ ...workDoneModalData, work_mode: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
                                >
                                    <option value="Office">Office</option>
                                    <option value="WFH">Work From Home</option>
                                    <option value="On-site">On-site</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Work Note</label>
                                <textarea
                                    value={workDoneModalData.note}
                                    onChange={(e) => setWorkDoneModalData({ ...workDoneModalData, note: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 resize-none outline-none focus:border-blue-500 transition-colors"
                                    rows="3"
                                    placeholder="Enter work details or subject..."
                                ></textarea>
                            </div>
                            <div className="flex gap-3 mt-2">
                                <button onClick={() => setShowWorkDoneModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-colors">Cancel</button>
                                <button
                                    onClick={() => {
                                        let total_hours = 0;
                                        if (workDoneModalData.check_in && workDoneModalData.check_out) {
                                            const start = new Date(`1970-01-01T${workDoneModalData.check_in}:00`);
                                            const end = new Date(`1970-01-01T${workDoneModalData.check_out}:00`);
                                            total_hours = (end - start) / 1000 / 60 / 60;
                                            if (total_hours < 0) total_hours += 24; // Handle overnight
                                            total_hours = total_hours.toFixed(2);
                                        }

                                        handleQuickMark(
                                            workDoneModalData.member_id,
                                            workDoneModalData.status,
                                            null,
                                            workDoneModalData.note,
                                            null, // permission start
                                            null, // permission end
                                            null, // permission reason
                                            null, // overtime data
                                            workDoneModalData.check_in,
                                            workDoneModalData.check_out,
                                            total_hours,
                                            workDoneModalData.work_mode
                                        );
                                        setShowWorkDoneModal(false);
                                    }}
                                    className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-colors"
                                >
                                    Save Note
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )
            }

            {
                showHalfDayModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                        <div className="bg-white rounded-[28px] w-full max-w-sm shadow-2xl p-6 relative animate-in zoom-in-95 duration-300">
                            <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                                <FaBusinessTime className="text-blue-500" /> Half Day Session
                            </h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setHalfDayModalData({ ...halfDayModalData, period: 'AM' })}
                                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${halfDayModalData.period === 'AM' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-blue-200'}`}
                                    >
                                        <span className="text-xl font-black">AM</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest">Morning</span>
                                    </button>
                                    <button
                                        onClick={() => setHalfDayModalData({ ...halfDayModalData, period: 'PM' })}
                                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${halfDayModalData.period === 'PM' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-blue-200'}`}
                                    >
                                        <span className="text-xl font-black">PM</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest">Afternoon</span>
                                    </button>
                                </div>
                                <div className="flex gap-3 mt-2">
                                    <button onClick={() => setShowHalfDayModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-colors">Cancel</button>
                                    <button
                                        onClick={() => {
                                            const note = halfDayModalData.period === 'AM' ? 'Morning Half Day' : 'Afternoon Half Day';
                                            handleQuickMark(halfDayModalData.member_id, 'half-day', null, note);
                                            setShowHalfDayModal(false);
                                        }}
                                        className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-colors"
                                    >
                                        Confirm
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
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
        </div >
    );
};

export default ITAttendance;
