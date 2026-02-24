import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ConfirmModal from '../../../components/modals/ConfirmModal';
import {
    getAttendances,
    createAttendance,
    updateAttendance,
    deleteAttendance,
    getAttendanceStats,
    getMemberSummary,
    quickMarkAttendance,
    bulkMarkAttendance,
    getHolidays,
    createHoliday,
    deleteHoliday,
    getShifts,
    createShift,
    deleteShift,
    getProjects,
    deleteProject,
    getApprovals,
    createApproval,
    updateApprovalStatus
} from '../../../api/Attendance/mfgAttendance';
import { getActiveMembers } from '../../../api/TeamManagement/mfgTeam';
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
import { exportAttendanceToCSV, exportAttendanceToTXT, exportAttendanceToPDF, processAttendanceExportData } from '../../../utils/exportUtils/index.js';
import ExportButtons from '../../../components/Common/ExportButtons';
import ProjectManager from '../../../components/Manufacturing/ProjectManager';
import MemberManager from '../../../components/Manufacturing/MemberManager';
import RoleManager from '../../../components/Manufacturing/RoleManager';
import { getMemberRoles, createMemberRole, deleteMemberRole } from '../../../api/TeamManagement/mfgTeam';
import CalendarManager from './CalendarManager';
import ShiftManager from './ShiftManager';

const AttendanceTracker = () => {
    const navigate = useNavigate();
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const [attendances, setAttendances] = useState([]);
    const [stats, setStats] = useState([]);
    const [approvals, setApprovals] = useState([]);
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
    const [showBulkStatusModal, setShowBulkStatusModal] = useState(false);
    const [bulkStatusData, setBulkStatusData] = useState({ status: '', note: '' });
    const [holidays, setHolidays] = useState([]);
    const [shifts, setShifts] = useState([]);
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


    // Helper for mapping member IDs to their roles
    const memberIdToRoleMap = useMemo(() => {
        const map = {};
        members.forEach(m => {
            map[m.id] = m.role;
        });
        return map;
    }, [members]);

    const uniqueRoles = useMemo(() => {
        return [...new Set((Array.isArray(members) ? members : []).map(m => m.role).filter(Boolean))];
    }, [members]);

    const statusOptions = [
        { id: 'present', label: 'Present', icon: FaCheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
        { id: 'absent', label: 'Absent', icon: FaTimesCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
        { id: 'half-day', label: 'Half Day', icon: FaExclamationCircle, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
        { id: 'late', label: 'Late', icon: FaClock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
        { id: 'CL', label: 'CL', icon: FaTag, color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-200' },
        { id: 'SL', label: 'SL', icon: FaTag, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' },
        { id: 'EL', label: 'EL', icon: FaTag, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200' },
        { id: 'OD', label: 'OD', icon: FaTag, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' },
        { id: 'holiday', label: 'Holiday', icon: FaTag, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' },
        { id: 'week_off', label: 'Weekend', icon: FaCalendarAlt, color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200' }
    ];

    function getHexColor(status) {
        switch (status) {
            case 'present': return '#10b981';
            case 'absent': return '#ef4444';
            case 'late': return '#f59e0b';
            case 'half-day': return '#3b82f6';
            case 'permission': return '#a855f7';
            case 'CL': return '#06b6d4';
            case 'SL': return '#f43f5e';
            case 'EL': return '#8b5cf6';
            case 'OD': return '#6366f1';
            case 'holiday': return '#f43f5e';
            case 'week_off': return '#94a3b8';
            default: return '#94a3b8';
        }
    }

    const lastFetchRef = useRef(0);

    const fetchData = async (force = false) => {
        const now = Date.now();
        // Throttle fetching (2s cache/throttle)
        if (!force && now - lastFetchRef.current < 2000 && !loading) {
            return;
        }

        if (force) {
            window._mfgAttendanceFetchPromise = null;
        }

        // Request Deduplication
        if (!force && window._mfgAttendanceFetchPromise) {
            try {
                const [attRes, statsRes, summaryRes, projRes, membersRes, roleRes, holidaysRes, shiftsRes, approvalsRes] = await window._mfgAttendanceFetchPromise;
                // Safe data access with fallbacks
                setAttendances(attRes?.data?.data || []);
                setStats(statsRes?.data?.data || []);
                setMemberSummary(summaryRes?.data?.data || []);
                setProjects(projRes?.data?.data || []);
                setMembers(membersRes?.data?.data || []);
                setRoles(roleRes?.data?.data || []);
                setHolidays(holidaysRes?.data?.data || []);
                setShifts(shiftsRes?.data?.data || []);
                setApprovals(approvalsRes?.data?.data || []);
                lastFetchRef.current = Date.now();
            } catch (error) {
                console.error("Error joining existing fetch:", error);
            } finally {
                setLoading(false);
            }
            return;
        }

        try {
            const isRange = periodType === 'range';
            const rangeStart = isRange ? customRange.start : null;
            const rangeEnd = isRange ? customRange.end : null;

            if (isRange && (!rangeStart || !rangeEnd)) return;

            const fetchPromise = Promise.all([
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
                getMemberRoles(),
                getHolidays({ sector: 'manufacturing' }),
                getShifts({ sector: 'manufacturing' }),
                getApprovals({ entity_type: 'attendance', status: 'pending' })
            ]);

            if (!force) {
                window._mfgAttendanceFetchPromise = fetchPromise;
            }

            const [attRes, statsRes, summaryRes, projRes, membersRes, roleRes, holidaysRes, shiftsRes, approvalsRes] = await fetchPromise;

            // Safe data access with fallbacks
            setAttendances(attRes?.data?.data || []);
            setStats(statsRes?.data?.data || []);
            setMemberSummary(summaryRes?.data?.data || []);
            setProjects(projRes?.data?.data || []);
            setMembers(membersRes?.data?.data || []);
            setRoles(roleRes?.data?.data || []);
            setHolidays(holidaysRes?.data?.data || []);
            setShifts(shiftsRes?.data?.data || []);
            setApprovals(approvalsRes?.data?.data || []);
            lastFetchRef.current = Date.now();
            setLoading(false);
        } catch (error) {
            console.error("Fetch error:", error);
            toast.error("Failed to fetch attendance data");
            // Set empty arrays to prevent crashes
            setAttendances([]);
            setStats([]);
            setMemberSummary([]);
            setProjects([]);
            setMembers([]);
            setRoles([]);
            setHolidays([]);
            setShifts([]);
            setApprovals([]);
            setLoading(false);
        } finally {
            if (!force) window._mfgAttendanceFetchPromise = null;
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



    const handleQuickMark = async (memberId, status = null, permission_duration = null, note = null, permission_start_time = null, permission_end_time = null, permission_reason = null, overtimeData = null, check_in = null, check_out = null, total_hours = null, work_mode = null) => {
        try {
            const date = periodType === 'day' ? currentPeriod : new Date().toISOString().split('T')[0];
            const existing = activeMembersAttendanceRecords[memberId];

            let finalCheckIn = check_in || existing?.check_in || null;
            let finalCheckOut = check_out || existing?.check_out || null;
            let finalTotalHours = total_hours || existing?.total_hours || null;
            let finalWorkMode = work_mode || existing?.work_mode || null;

            // Auto-fill check_in and check_out if marking present and it's empty, using shift times if available
            if (status === 'present') {
                const member = members.find(m => m.id === memberId);
                if (!finalCheckIn) {
                    finalCheckIn = member?.start_time ? member.start_time.slice(0, 5) : `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`;
                }
                if (!finalCheckOut && member?.end_time) {
                    finalCheckOut = member.end_time.slice(0, 5);
                }
            }

            // Recalculate total hours if both in and out exist
            if (finalCheckIn && finalCheckOut && (!total_hours || total_hours === existing?.total_hours)) {
                finalTotalHours = calculateDuration(finalCheckIn, finalCheckOut);
            }

            const payload = {
                member_id: memberId,
                status: status || existing?.status || 'present',
                date,
                project_id: filterProject || null,
                subject: `Daily Attendance`,
                permission_duration,
                note: note !== null ? note : (existing?.note || null),
                permission_start_time,
                permission_end_time,
                permission_reason,
                sector: 'manufacturing',
                check_in: finalCheckIn,
                check_out: finalCheckOut,
                total_hours: finalTotalHours,
                work_mode: finalWorkMode
            };

            if (overtimeData) {
                payload.overtime_duration = overtimeData.duration;
                payload.overtime_reason = overtimeData.reason;
            }

            await quickMarkAttendance(payload);
            toast.success(status ? `Marked as ${status.replace('_', ' ')}` : 'Attendance Updated');
            fetchData(true);
        } catch (error) {
            toast.error("Failed to update");
        }
    };

    const handleBulkMark = (status) => {
        const date = periodType === 'day' ? currentPeriod : new Date().toISOString().split('T')[0];
        setConfirmModal({
            show: true,
            type: 'BULK_MARK',
            label: status === 'present' ? 'MARK ALL PRESENT' : status === 'week_off' ? 'MARK WEEKEND' : status === 'holiday' ? 'MARK HOLIDAY' : 'BULK ACTION',
            message: `Are you sure you want to mark ALL active members as ${status === 'week_off' ? 'Weekend' : status === 'holiday' ? 'Holiday' : 'Present'} for ${date}?`,
            onConfirm: () => confirmBulkMark(status)
        });
    };

    const confirmBulkMark = async (status) => {
        try {
            const date = periodType === 'day' ? currentPeriod : new Date().toISOString().split('T')[0];
            const activeMembers = (Array.isArray(members) ? members : []).filter(m => m.status === 'active');
            const activeMemberIds = activeMembers.map(m => m.id);

            if (activeMemberIds.length === 0) {
                toast.error("No active members found");
                return;
            }

            const bulkPayloads = activeMembers.map(member => {
                let m_check_in = member?.start_time ? member.start_time.slice(0, 5) : null;
                let m_check_out = member?.end_time ? member.end_time.slice(0, 5) : null;
                let m_total_hours = (m_check_in && m_check_out) ? calculateDuration(m_check_in, m_check_out) : null;

                if (status === 'present' && !m_check_in) {
                    const now = new Date();
                    m_check_in = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                }

                return {
                    member_id: member.id,
                    status: status === 'week_off' ? 'week_off' : status === 'holiday' ? 'holiday' : 'present',
                    date,
                    subject: status === 'week_off' ? 'Weekend' : status === 'holiday' ? 'Holiday' : 'Daily Attendance',
                    note: '',
                    sector: 'manufacturing',
                    check_in: m_check_in,
                    check_out: m_check_out,
                    total_hours: m_total_hours
                };
            });

            await bulkMarkAttendance({
                user_id: currentUser.id,
                payloads: bulkPayloads,
                sector: 'manufacturing'
            });

            toast.success("Bulk update successful");
            fetchData(true);
        } catch (error) {
            console.error(error);
            toast.error("Failed to update bulk attendance");
        }
    };

    const calculateDuration = (inTime, outTime) => {
        if (!inTime || !outTime) return null;
        const [h1, m1] = inTime.split(':').map(Number);
        const [h2, m2] = outTime.split(':').map(Number);
        const date1 = new Date(0, 0, 0, h1, m1, 0);
        const date2 = new Date(0, 0, 0, h2, m2, 0);
        let diff = date2 - date1;
        if (diff < 0) diff += 24 * 60 * 60 * 1000;
        const hours = diff / 1000 / 60 / 60;
        return hours.toFixed(2);
    };



    const handleDelete = (id) => {
        setConfirmModal({ show: true, type: 'DELETE', label: 'Delete Record', id });
    };

    const handleModalConfirm = async () => {
        if (confirmModal.type === 'DELETE') {
            try {
                await deleteAttendance(confirmModal.id);
                toast.success("Record deleted");
                fetchData(true);
            } catch (error) {
                toast.error("Failed to delete record");
            }
        } else if (confirmModal.type === 'CSV') handleExportCSV(attendances);
        else if (confirmModal.type === 'PDF') handleExportPDF(attendances);
        else if (confirmModal.type === 'TXT') handleExportTXT(attendances);
        else if (confirmModal.type === 'BULK_MARK') {
            if (confirmModal.onConfirm) confirmModal.onConfirm();
        }

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
        return (Array.isArray(attendances) ? attendances : []).filter(a => {
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

    const activeHoliday = useMemo(() => {
        if (!activeTargetDate || !Array.isArray(holidays)) return null;
        return holidays.find(h => {
            const d = new Date(h.date);
            const hDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            return hDate === activeTargetDate;
        });
    }, [activeTargetDate, holidays]);

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
        (Array.isArray(attendances) ? attendances : []).forEach(a => {
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

    const pieData = (Array.isArray(stats) ? stats : []).map(s => {
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
        <div className="min-h-screen bg-[#f8fafc] font-['Outfit'] text-slate-900 overflow-x-hidden w-full">
            {/* Glossy Header Background */}
            <div className="fixed top-0 left-0 w-full h-[320px] bg-linear-to-b from-blue-50/50 to-transparent pointer-events-none -z-10"></div>

            {/* Header */}
            <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-40 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                    <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <Link
                                to="/manufacturing"
                                className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:text-[#2d5bff] hover:border-[#2d5bff] transition-all shadow-sm hover:shadow-md active:scale-95 shrink-0"
                            >
                                <FaChevronLeft className="w-4 h-4" />
                            </Link>
                            <div className="w-10 h-10 sm:w-[48px] sm:h-[48px] bg-linear-to-br from-blue-500 to-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                                <FaUserCheck className="text-white text-lg sm:text-xl" />
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Attendance</h1>
                                <p className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest leading-none">Consistency is key</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                            {/* Period Selector - Now scrollable on mobile */}
                            <div className="w-full lg:w-auto h-[38px] flex items-center p-1 bg-slate-50 border border-slate-200 rounded-xl shadow-sm overflow-x-auto no-scrollbar">
                                {['day', 'month', 'year', 'range'].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setPeriodType(type)}
                                        className={`flex-1 lg:flex-none px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${periodType === type ? 'bg-white text-blue-600 shadow-sm border border-blue-100' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>

                            {/* Date Input - Balanced for mobile */}
                            <div className="w-full lg:w-[180px] h-[38px] flex items-center bg-white border border-slate-200 px-3 rounded-xl shadow-sm hover:border-blue-500 transition-colors">
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
                                        {(Array.isArray(projects) ? projects : []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
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
                                        {(Array.isArray(members) ? members : []).slice().sort((a, b) => (a.name || '').localeCompare(b.name || '')).map(m => (
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
                                        {[...new Set([...(Array.isArray(roles) ? roles : []).map(r => r.name), ...uniqueRoles])].sort().map(role => (
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
                <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner border border-slate-200 w-full mb-8 overflow-x-auto no-scrollbar custom-scrollbar">
                    <div className="flex flex-nowrap min-w-max gap-1">
                        {[
                            { id: 'records', label: 'Records' },
                            { id: 'summary', label: 'Summary' },
                            { id: 'quick', label: 'Daily Sheet' },
                            { id: 'members', label: 'Members' },
                            { id: 'shifts', label: 'Shifts & Rules' },
                            { id: 'approvals', label: 'Approvals' },
                            { id: 'calendar', label: 'Calendar' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 sm:px-6 py-2.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {activeTab === 'records' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100">
                                <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2 font-['Outfit']">
                                    <FaChartBar className="text-blue-500" />
                                    {periodType.charAt(0).toUpperCase() + periodType.slice(1)} Stats
                                </h3>
                                <div className="h-[256px]">
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
                                                    {(Array.isArray(pieData) ? pieData : []).map((entry, index) => (
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
                                    {Array.isArray(filteredAttendances) && filteredAttendances.length > 0 ? (
                                        <div className="flex flex-col gap-3">
                                            {filteredAttendances.map((item, idx) => {
                                                const option = statusOptions.find(o => o.id === item.status);
                                                return (
                                                    <div
                                                        key={item.id}
                                                        className="group bg-white p-4 rounded-3xl border border-slate-100 hover:shadow-lg hover:border-blue-200 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2"
                                                        style={{ animationDelay: `${idx * 50}ms` }}
                                                    >
                                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                            <div className="flex items-start gap-4">
                                                                <div className={`w-12 h-12 ${option?.bg} rounded-2xl flex items-center justify-center text-xl ${option?.color} shrink-0`}>
                                                                    {option && <option.icon />}
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-3 mb-1.5 align-middle h-full">
                                                                        <h4 className="font-black text-slate-900 text-base">Daily Attendance</h4>
                                                                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${option?.bg} ${option?.color} border ${option?.border}`}>
                                                                            {option?.label}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex flex-wrap items-center gap-x-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                                        <span className="flex items-center gap-1">
                                                                            <FaCalendarAlt /> {new Date(item.date).toLocaleDateString('en-GB')}
                                                                        </span>
                                                                        <span className="w-[1px] h-[1px] rounded-full bg-slate-300" />
                                                                        <span className="text-amber-500 font-black">{item.member_name}</span>
                                                                        {item.created_by && (
                                                                            <>
                                                                                <span className="w-[1px] h-[1px] rounded-full bg-slate-300" />
                                                                                <span className="text-purple-400">CREATED: {item.created_by}</span>
                                                                            </>
                                                                        )}
                                                                    </div>

                                                                    {/* Work Mode Badge */}
                                                                    <div className="mt-3">
                                                                        <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest rounded-lg">
                                                                            {item.work_mode || 'OFFICE'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3 sm:gap-1">
                                                                {/* Timings */}
                                                                {(item.check_in || item.check_out) && (
                                                                    <div className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-2">
                                                                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">
                                                                            IN: {item.check_in?.substring(0, 5) || '--:--'}
                                                                        </span>
                                                                        <span className="text-slate-300">|</span>
                                                                        <span className="text-[10px] font-black text-red-500 uppercase tracking-wider">
                                                                            OUT: {item.check_out?.substring(0, 5) || '--:--'}
                                                                        </span>
                                                                    </div>
                                                                )}

                                                                {/* Duration */}
                                                                {item.total_hours > 0 && (
                                                                    <div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                                                        {item.total_hours} HRS
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
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
                                    {/* Stats Badge */}
                                    <div className="flex bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                        <div className="px-4 py-2 border-r border-slate-100 flex flex-col items-center justify-center min-w-[70px]">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">STAFF</p>
                                            <p className="text-sm font-black text-slate-900">{memberSummary.length}</p>
                                        </div>
                                        <div className="px-4 py-2 flex flex-col items-center justify-center min-w-[70px]">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">AVG</p>
                                            <p className="text-sm font-black text-blue-600">
                                                {(() => {
                                                    const data = Array.isArray(memberSummary) ? memberSummary : [];
                                                    const totalDays = data.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
                                                    const totalPresentValue = data.reduce((acc, curr) => {
                                                        return acc + (Number(curr.present) || 0) + (Number(curr.late) || 0) + (Number(curr.permission) || 0) + (Number(curr.OD) || 0) + (Number(curr.holiday) || 0) + (Number(curr.week_off) || 0) + (Number(curr.half_day) || 0) * 0.5;
                                                    }, 0);
                                                    return totalDays > 0 ? ((totalPresentValue / totalDays) * 100).toFixed(0) : '0';
                                                })()}%
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Desktop Summary View */}
                        <div className="hidden md:block overflow-x-auto custom-scrollbar">
                            <table className="w-full min-w-[1000px] text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">MEMBER</th>
                                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-center">STATS (D/P/A/L/H/HO/WO/Pr)</th>
                                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-center">UTIL. %</th>
                                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-right">PROGRESS</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {(Array.isArray(memberSummary) ? memberSummary : [])
                                        .filter(w => {
                                            const matchesRole = !filterRole || memberIdToRoleMap[w.id] === filterRole;
                                            const matchesSearch = !searchQuery || (w.name || '').toLowerCase().includes(searchQuery.toLowerCase());
                                            const matchesMember = !filterMember || w.id == filterMember;
                                            return matchesRole && matchesSearch && matchesMember;
                                        })
                                        .map((w) => {
                                            const totalRelevantDays = w.total || 0;
                                            const presentValue = (Number(w.present) || 0) + (Number(w.late) || 0) + (Number(w.permission) || 0) + (Number(w.OD) || 0) + (Number(w.holiday) || 0) + (Number(w.week_off) || 0) + (Number(w.half_day) || 0) * 0.5;
                                            const rate = totalRelevantDays > 0 ? (presentValue / totalRelevantDays * 100) : 0;
                                            return (
                                                <tr key={w.id} className="hover:bg-slate-50/80 transition-colors group">
                                                    <td className="px-6 py-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xs shrink-0 shadow-md shadow-blue-500/20">
                                                                {w.name ? w.name.charAt(0) : '?'}
                                                            </div>
                                                            <div>
                                                                <p className="font-black text-slate-900 leading-none mb-1.5">{w.name}</p>
                                                                <div className="flex gap-1.5">
                                                                    <div className="px-1.5 py-0.5 bg-slate-100 text-[6px] font-black text-slate-400 rounded flex items-center uppercase tracking-tighter">ID: #{w.id}</div>
                                                                    <div className="px-1.5 py-0.5 bg-blue-50 text-[6px] font-black text-blue-500 rounded flex items-center uppercase tracking-tighter">{memberIdToRoleMap[w.id]}</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5 text-center">
                                                        <div className="flex items-center justify-center gap-1.5 flex-wrap max-w-[320px] mx-auto">
                                                            <span className="w-8 h-8 flex items-center justify-center bg-slate-900 text-white rounded-lg font-black text-[10px] shrink-0" title="Total Days">{w.total || 0}</span>
                                                            <span className="w-8 h-8 flex items-center justify-center bg-emerald-50 text-emerald-600 rounded-lg font-black text-[10px] border border-emerald-100 shrink-0" title="Present">{w.present}</span>
                                                            <span className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-600 rounded-lg font-black text-[10px] border border-red-100 shrink-0" title="Absent">{w.absent}</span>
                                                            <span className="w-8 h-8 flex items-center justify-center bg-amber-50 text-amber-600 rounded-lg font-black text-[10px] border border-amber-100 shrink-0" title="Late">{w.late}</span>
                                                            <span className="w-8 h-8 flex items-center justify-center bg-blue-50 text-blue-600 rounded-lg font-black text-[10px] border border-blue-100 shrink-0" title="Half Day">{w.half_day}</span>
                                                            <span className="w-8 h-8 flex items-center justify-center bg-rose-50 text-rose-600 rounded-lg font-black text-[10px] border border-rose-100 shrink-0" title="Holiday">{w.holiday || 0}</span>
                                                            <span className="w-8 h-8 flex items-center justify-center bg-slate-50 text-slate-500 rounded-lg font-black text-[10px] border border-slate-100 shrink-0" title="Week Off/Weekend">{w.week_off || 0}</span>
                                                            <span className="w-8 h-8 flex items-center justify-center bg-purple-50 text-purple-600 rounded-lg font-black text-[10px] border border-purple-100 shrink-0" title="Permission">{w.permission || 0}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5 text-center">
                                                        <span className={`font-black text-xs ${rate >= 90 ? 'text-emerald-500' : rate >= 75 ? 'text-blue-500' : 'text-amber-500'}`}>
                                                            {rate.toFixed(0)}%
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5 text-right w-1/4">
                                                        <div className="flex items-center justify-end gap-4">
                                                            <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                                                                <div className={`h-full rounded-full transition-all duration-1000 ${rate >= 90 ? 'bg-emerald-500' : rate >= 75 ? 'bg-blue-500' : 'bg-amber-500'}`} style={{ width: `${rate}%` }} />
                                                            </div>
                                                            <span className={`text-xs font-black min-w-[32px] ${rate >= 90 ? 'text-emerald-600' : rate >= 75 ? 'text-blue-600' : 'text-amber-600'}`}>{rate.toFixed(0)}%</span>
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
                            {(Array.isArray(memberSummary) ? memberSummary : [])
                                .filter(w => {
                                    const matchesRole = !filterRole || memberIdToRoleMap[w.id] === filterRole;
                                    const matchesSearch = !searchQuery || (w.name || '').toLowerCase().includes(searchQuery.toLowerCase());
                                    const matchesMember = !filterMember || w.id == filterMember;
                                    return matchesRole && matchesSearch && matchesMember;
                                })
                                .map((w) => {
                                    const totalRelevantDays = w.total || 0;
                                    const presentValue = (Number(w.present) || 0) + (Number(w.late) || 0) + (Number(w.permission) || 0) + (Number(w.OD) || 0) + (Number(w.holiday) || 0) + (Number(w.week_off) || 0) + (Number(w.half_day) || 0) * 0.5;
                                    const rate = totalRelevantDays > 0 ? (presentValue / totalRelevantDays * 100) : 0;
                                    return (
                                        <div key={w.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                                            <div className="flex items-center justify-between mb-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-md shadow-blue-500/20">
                                                        {w.name ? w.name.charAt(0) : '?'}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-slate-900 text-base leading-tight mb-1">{w.name}</h4>
                                                        <div className="flex gap-2">
                                                            <div className="px-2 py-0.5 bg-slate-100 text-[10px] font-black text-slate-400 rounded flex items-center uppercase">ID: #{w.id}</div>
                                                            <div className="px-2 py-0.5 bg-blue-50 text-[10px] font-black text-blue-500 rounded flex items-center uppercase">{memberIdToRoleMap[w.id]}</div>
                                                        </div>
                                                    </div>
                                                </div>

                                            </div>

                                            <div className="grid grid-cols-6 gap-2 p-3 bg-slate-50 rounded-2xl mb-4">
                                                <div className="text-center">
                                                    <p className="text-[9px] font-black text-slate-900 uppercase mb-1">D</p>
                                                    <div className="w-full aspect-square bg-slate-900 rounded-lg flex items-center justify-center text-white text-xs font-black">{w.total || 0}</div>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[9px] font-black text-emerald-500 uppercase mb-1">P</p>
                                                    <div className="w-full aspect-square bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center text-xs font-black">{w.present}</div>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[9px] font-black text-red-500 uppercase mb-1">A</p>
                                                    <div className="w-full aspect-square bg-red-100 text-red-600 rounded-lg flex items-center justify-center text-xs font-black">{w.absent}</div>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[9px] font-black text-amber-500 uppercase mb-1">L</p>
                                                    <div className="w-full aspect-square bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center text-xs font-black">{w.late}</div>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[9px] font-black text-blue-500 uppercase mb-1">H</p>
                                                    <div className="w-full aspect-square bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-xs font-black">{w.half_day}</div>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[9px] font-black text-rose-500 uppercase mb-1">Hol</p>
                                                    <div className="w-full aspect-square bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center text-xs font-black">{w.holiday || 0}</div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-end mb-2">
                                                        <span className="text-[10px] font-black uppercase text-slate-400">Progress</span>
                                                        <span className={`text-xs font-black ${rate >= 90 ? 'text-emerald-600' : rate >= 75 ? 'text-blue-600' : 'text-amber-600'}`}>{rate.toFixed(0)}%</span>
                                                    </div>
                                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                                        <div className={`h-full rounded-full ${rate >= 90 ? 'bg-emerald-500' : rate >= 75 ? 'bg-blue-500' : 'bg-amber-500'}`} style={{ width: `${rate}%` }} />
                                                    </div>
                                                </div>
                                                <div className="text-center px-4 border-l border-slate-100">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">Util.</p>
                                                    <p className={`text-sm font-black ${rate >= 90 ? 'text-emerald-500' : rate >= 75 ? 'text-blue-500' : 'text-amber-500'}`}>{rate.toFixed(0)}%</p>
                                                </div>
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
                    <MemberManager onClose={() => setActiveTab('records')} onUpdate={() => fetchData(true)} roles={roles} shifts={shifts} sector="manufacturing" />
                ) : activeTab === 'shifts' ? (
                    <ShiftManager
                        shifts={shifts}
                        onAdd={async (data) => {
                            await createShift({ ...data, sector: 'manufacturing' });
                            fetchData(true);
                        }}
                        onDelete={async (id) => {
                            await deleteShift(id);
                            fetchData(true);
                        }}
                    />
                ) : activeTab === 'approvals' ? (
                    <div className="bg-white rounded-[40px] shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="p-6 sm:p-10 border-b border-slate-100 bg-linear-to-br from-slate-900 to-slate-800 text-white">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-xl sm:text-2xl font-black mb-1.5 ">Approvals & Exceptions</h3>
                                    <p className="text-slate-400 font-bold text-sm">Review and approve overtime requests, leave applications.</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={async () => {
                                            const reason = prompt("Enter dummy Overtime or Leave request to test:");
                                            if (reason) {
                                                await createApproval({
                                                    entity_type: 'attendance',
                                                    entity_id: 1,
                                                    title: 'Overtime Request',
                                                    description: reason,
                                                    requested_by: currentUser.username
                                                });
                                                fetchData(true);
                                                toast.success("Test request created");
                                            }
                                        }}
                                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-colors"
                                    >
                                        + Test Request
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            {approvals.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-slate-500">No pending approvals.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {approvals.map(appr => (
                                        <div key={appr.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <div>
                                                <h4 className="font-bold text-slate-900">{appr.title}</h4>
                                                <p className="text-sm text-slate-500">{appr.description}</p>
                                                <p className="text-[10px] text-slate-400 mt-1">Requested by: {appr.requested_by}</p>
                                            </div>
                                            <div className="flex gap-2 mt-4 sm:mt-0">
                                                <button
                                                    onClick={async () => {
                                                        await updateApprovalStatus(appr.id, { status: 'approved' });
                                                        toast.success("Approved!");
                                                        fetchData(true);
                                                    }}
                                                    className="px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl text-xs font-bold transition-colors"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        const reason = prompt("Rejection Reason:");
                                                        if (reason !== null) {
                                                            await updateApprovalStatus(appr.id, { status: 'rejected', rejection_reason: reason });
                                                            toast.error("Rejected");
                                                            fetchData(true);
                                                        }
                                                    }}
                                                    className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-bold transition-colors"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ) : activeTab === 'calendar' ? (
                    <CalendarManager
                        holidays={holidays}
                        onAdd={async (data) => {
                            await createHoliday({ ...data, sector: 'manufacturing' });
                            fetchData(true);
                        }}
                        onDelete={async (id) => {
                            await deleteHoliday(id);
                            fetchData(true);
                        }}
                    />
                ) : (
                    <div className="bg-white rounded-[40px] shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="p-6 sm:p-10 border-b border-slate-100 bg-linear-to-br from-slate-900 to-slate-800 text-white">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-xl sm:text-2xl font-black mb-1.5 font-['Outfit']">Daily Attendance Sheet</h3>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <FaCalendarAlt className="text-blue-400 text-[12px]" />
                                        <span className="text-slate-400 font-bold uppercase tracking-widest text-[9px] sm:text-[10px] font-['Outfit']">
                                            {(() => {
                                                try {
                                                    return new Date(activeTargetDate).toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
                                                } catch (e) { return 'Invalid Date'; }
                                            })()}
                                        </span>
                                        {activeHoliday && (
                                            <div className="flex items-center gap-2 px-3 py-1 bg-rose-500/20 border border-rose-500/30 rounded-full">
                                                <FaTag className="text-rose-400 text-[9px]" />
                                                <span className="text-rose-200 text-[9px] font-black uppercase tracking-widest">{activeHoliday.name} (HOLIDAY)</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {periodType === 'day' && (
                                    <div className="bg-white/10 px-4 py-2 sm:px-6 sm:py-3 rounded-2xl border border-white/10 backdrop-blur-md self-start sm:self-center">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-blue-300 mb-0.5 font-['Outfit']">Marking Mode</p>
                                        <p className="text-xs sm:text-sm font-black font-['Outfit']">Quick Upsert</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-0">
                            <div className="px-6 py-4 sm:px-8 sm:py-6 border-b border-slate-100 flex flex-wrap items-center gap-3 sm:gap-4 bg-slate-50/30">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Quick Actions:</label>
                                <button
                                    id="mark-all-present"
                                    onClick={() => handleBulkMark('present')}
                                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 shadow-sm transition-all flex items-center gap-2"
                                >
                                    <FaCheckCircle className="text-sm" /> MARK ALL PRESENT
                                </button>
                                <div className="w-[1px] h-[24px] bg-slate-200 hidden sm:block" />
                                <button
                                    onClick={() => handleBulkMark('week_off')}
                                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 hover:border-slate-300 shadow-sm transition-all flex items-center gap-2"
                                >
                                    <FaCalendarAlt className="text-sm" /> MARK WEEKEND
                                </button>
                                <button
                                    onClick={() => handleBulkMark('holiday')}
                                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 hover:border-rose-200 shadow-sm transition-all flex items-center gap-2"
                                >
                                    <FaTag className="text-sm" /> MARK HOLIDAY
                                </button>
                            </div>

                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto custom-scrollbar">
                                <table className="w-full min-w-[1024px] text-left">
                                    <thead>
                                        <tr className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            <th className="px-6 py-5">Name</th>
                                            <th className="px-6 py-5 text-center">Status</th>
                                            <th className="px-6 py-5 text-center">Time Log</th>
                                            <th className="px-6 py-5 text-center">Quick Extras</th>
                                            <th className="px-6 py-5">Work Details</th>
                                            <th className="px-6 py-5 text-right">Current</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {(Array.isArray(members) ? members : [])
                                            .filter(m => {
                                                const matchesRole = !filterRole || m.role === filterRole;
                                                const matchesSearch = !searchQuery || (m.name || '').toLowerCase().includes(searchQuery.toLowerCase());
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
                                                        <td className="px-6 py-6">
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
                                                        <td className="px-6 py-6 text-center">
                                                            <div className="flex flex-col gap-2">
                                                                <div className="flex flex-wrap items-center justify-center gap-[6px] max-w-[320px] mx-auto">
                                                                    {statusOptions.map(option => {
                                                                        const getDisplayLabel = (id) => {
                                                                            if (id === 'present') return 'P';
                                                                            if (id === 'absent') return 'A';
                                                                            if (id === 'half-day') return 'H';
                                                                            if (id === 'late') return 'L';
                                                                            if (id === 'holiday') return 'HO';
                                                                            if (id === 'week_off') return 'WO';
                                                                            return id;
                                                                        };
                                                                        return (
                                                                            <button
                                                                                key={option.id}
                                                                                onClick={() => handleQuickMark(w.id, option.id)}
                                                                                className={`w-[32px] h-[32px] rounded-lg flex items-center justify-center text-[10px] font-black uppercase transition-all ${currentStatus === option.id ? `${option.bg} ${option.color} ring-2 ring-offset-1 ring-${option.color.split('-')[1]}-200 shadow-sm border ${option.border}` : 'bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-100 hover:border-slate-200'}`}
                                                                                title={option.label}
                                                                            >
                                                                                {getDisplayLabel(option.id)}
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-6 text-center">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <div className="flex flex-col items-center gap-1">
                                                                    <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-1.5 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                                                                        <FaClock className="text-slate-300 text-[10px]" />
                                                                        <input
                                                                            type="time"
                                                                            disabled={!isPresentOrPerm}
                                                                            value={attendance?.check_in || ''}
                                                                            onChange={(e) => {
                                                                                const newIn = e.target.value;
                                                                                const duration = calculateDuration(newIn, attendance?.check_out);
                                                                                handleQuickMark(w.id, currentStatus, null, null, null, null, null, null, newIn, attendance?.check_out, duration);
                                                                            }}
                                                                            className="bg-transparent text-[10px] font-bold text-slate-600 outline-none w-[45px] disabled:opacity-50"
                                                                        />
                                                                    </div>
                                                                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">IN</span>
                                                                </div>
                                                                <div className="text-slate-300 text-[10px]">→</div>
                                                                <div className="flex flex-col items-center gap-1">
                                                                    <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-1.5 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                                                                        <input
                                                                            type="time"
                                                                            disabled={!isPresentOrPerm}
                                                                            value={attendance?.check_out || ''}
                                                                            onChange={(e) => {
                                                                                const newOut = e.target.value;
                                                                                const duration = calculateDuration(attendance?.check_in, newOut);
                                                                                handleQuickMark(w.id, currentStatus, null, null, null, null, null, null, attendance?.check_in, newOut, duration);
                                                                            }}
                                                                            className="bg-transparent text-[10px] font-bold text-slate-600 outline-none w-[45px] text-right disabled:opacity-50"
                                                                        />
                                                                        <FaClock className="text-slate-300 text-[10px]" />
                                                                    </div>
                                                                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">OUT</span>
                                                                </div>
                                                            </div>
                                                            {attendance?.total_hours && (
                                                                <div className="mt-2 text-center">
                                                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${parseFloat(attendance.total_hours) >= 8 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                                        TOTAL: {attendance.total_hours} Hrs
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-6">
                                                            <div className="flex items-center justify-center gap-2">
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
                                                                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase flex items-center gap-2 transition-all ${currentStatus === 'permission' ? 'bg-purple-500 text-white shadow-md' : isPresentOrPerm ? 'bg-purple-50 text-purple-600 border border-purple-100 hover:bg-purple-100' : 'bg-slate-50 text-slate-300 border border-slate-50 cursor-not-allowed'}`}
                                                                    title={attendance?.permission_duration ? `Perm: ${attendance.permission_duration}` : 'Add Permission'}
                                                                >
                                                                    <FaClock /> PER
                                                                </button>
                                                                <button
                                                                    disabled={!canEdit || !isPresentOrPerm}
                                                                    onClick={() => {
                                                                        setOvertimeModalData({
                                                                            member_id: w.id, member_name: w.name, status: 'overtime',
                                                                            start_hour: '05', start_minute: '00', start_period: 'PM',
                                                                            end_hour: '07', end_minute: '00', end_period: 'PM',
                                                                            reason: attendance?.overtime_reason || '', attendance_id: attendance?.id
                                                                        });
                                                                        setShowOvertimeModal(true);
                                                                    }}
                                                                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase flex items-center gap-2 transition-all ${attendance?.overtime_duration ? 'bg-orange-500 text-white shadow-md' : isPresentOrPerm ? 'bg-orange-50 text-orange-600 border border-orange-100 hover:bg-orange-100' : 'bg-slate-50 text-slate-300 border border-slate-50 cursor-not-allowed'}`}
                                                                    title={attendance?.overtime_duration ? `OT: ${attendance.overtime_duration}` : 'Add Overtime'}
                                                                >
                                                                    <FaBusinessTime /> OT
                                                                </button>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-6">
                                                            <div
                                                                onClick={() => { if (!isPresentOrPerm || !canEdit) return; setWorkDoneModalData({ member_id: w.id, member_name: w.name, status: currentStatus || 'present', note: attendance?.note || '', attendance_id: attendance?.id }); setShowWorkDoneModal(true); }}
                                                                className={`cursor-pointer transition-all duration-300 ${isPresentOrPerm ? (canEdit ? 'opacity-100' : 'opacity-70 cursor-not-allowed') : 'opacity-30 pointer-events-none'}`}
                                                            >
                                                                <div className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-[10px] font-bold text-slate-500 flex items-center hover:border-blue-300">
                                                                    <span className="truncate">{attendance?.note || "Work notes..."}</span>
                                                                    <FaEdit className="ml-auto text-[10px] text-slate-300" />
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-6 text-right">
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
                                {((Array.isArray(members) ? members : []))
                                    .filter(m => {
                                        const matchesRole = !filterRole || m.role === filterRole;
                                        const matchesSearch = !searchQuery || (m.name || '').toLowerCase().includes(searchQuery.toLowerCase());
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

                                                <div className="grid grid-cols-4 gap-1 mb-3">
                                                    <button
                                                        disabled={!canEdit}
                                                        onClick={(e) => { e.stopPropagation(); handleQuickMark(w.id, 'present'); }}
                                                        className={`h-[42px] rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1 transition-all ${!canEdit ? 'opacity-50 cursor-not-allowed bg-slate-50 border border-slate-100' : (currentStatus === 'present' || currentStatus === 'permission') ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}
                                                    >
                                                        Pre
                                                    </button>
                                                    <button
                                                        disabled={!canEdit}
                                                        onClick={(e) => { e.stopPropagation(); handleQuickMark(w.id, 'absent'); }}
                                                        className={`h-[42px] rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1 transition-all ${!canEdit ? 'opacity-50 cursor-not-allowed bg-slate-50 border border-slate-100' : currentStatus === 'absent' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}
                                                    >
                                                        Abs
                                                    </button>
                                                    <button
                                                        disabled={!canEdit}
                                                        onClick={(e) => { e.stopPropagation(); handleQuickMark(w.id, 'holiday'); }}
                                                        className={`h-[42px] rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1 transition-all ${!canEdit ? 'opacity-50 cursor-not-allowed bg-slate-50 border border-slate-100' : currentStatus === 'holiday' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}
                                                    >
                                                        HO
                                                    </button>
                                                    <button
                                                        disabled={!canEdit}
                                                        onClick={(e) => { e.stopPropagation(); handleQuickMark(w.id, 'week_off'); }}
                                                        className={`h-[42px] rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1 transition-all ${!canEdit ? 'opacity-50 cursor-not-allowed bg-slate-50 border border-slate-100' : currentStatus === 'week_off' ? 'bg-slate-500 text-white shadow-lg shadow-slate-500/20' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}
                                                    >
                                                        WO
                                                    </button>
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
                )
                }
            </main >
            {showProjectManager && (
                <ProjectManager
                    projects={projects}
                    onCreate={createProject}
                    onDelete={deleteProject}
                    onClose={() => { setShowProjectManager(false); fetchData(true); }}
                    onRefresh={() => getProjects().then(res => setProjects(res.data.data))}
                />
            )
            }
            {
                showRoleManager && (
                    <RoleManager
                        roles={roles}
                        members={members}
                        onCreate={createMemberRole}
                        onDelete={deleteMemberRole}
                        onClose={() => { setShowRoleManager(false); fetchData(true); }}
                        onRefresh={() => getMemberRoles().then(res => setRoles(res.data.data))}
                    />
                )
            }
            {
                showOvertimeModal && (
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
                )
            }

            {
                showPermissionModal && (
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
                )
            }

            {
                showWorkDoneModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                        <div className="bg-white rounded-[28px] w-full max-w-sm shadow-2xl p-6 relative animate-in zoom-in-95 duration-300">
                            <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                                <FaFileAlt className="text-blue-500" /> Work Details
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Work Note</label>
                                    <textarea
                                        value={workDoneModalData.note}
                                        onChange={(e) => setWorkDoneModalData({ ...workDoneModalData, note: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 resize-none outline-none focus:border-blue-500 transition-colors"
                                        rows="4"
                                        placeholder="Enter work details or subject..."
                                    ></textarea>
                                </div>
                                <div className="flex gap-3 mt-2">
                                    <button onClick={() => setShowWorkDoneModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-colors">Cancel</button>
                                    <button
                                        onClick={() => {
                                            handleQuickMark(workDoneModalData.member_id, workDoneModalData.status, null, workDoneModalData.note);
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
                title={confirmModal.type === 'DELETE' ? 'Delete Record' : confirmModal.type === 'BULK_MARK' ? 'Confirm Action' : `Export ${confirmModal.label}`}
                message={confirmModal.message || (confirmModal.type === 'DELETE' ? 'Are you sure you want to delete this attendance record?' : `Do you want to download the ${confirmModal.label}?`)}
                confirmText={confirmModal.type === 'DELETE' ? "Delete" : confirmModal.type === 'BULK_MARK' ? 'Confirm' : "Download"}
                type={confirmModal.type === 'DELETE' ? 'danger' : 'success'}
            />
        </div >
    );
};

export default AttendanceTracker;

