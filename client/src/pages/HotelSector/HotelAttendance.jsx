import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ConfirmModal from '../../components/modals/ConfirmModal';
import {
    getAttendances,
    getAttendanceStats,
    getMemberSummary,
    quickMarkAttendance,
    bulkMarkAttendance,
    getProjects,
    createProject,
    deleteProject,
    deleteAttendance,
    getHolidays,
    createHoliday,
    deleteHoliday,
    getShifts,
    createShift,
    deleteShift
} from '../../api/Attendance/hotelAttendance';
import { getMembers, getMemberRoles, createMemberRole, deleteMemberRole } from '../../api/TeamManagement/hotelTeam'; // Using hotelTeam for member/role ops
import toast from 'react-hot-toast';
import {
    FaCheckCircle, FaTimesCircle, FaClock, FaExclamationCircle,
    FaPlus, FaTrash, FaEdit, FaCalendarAlt, FaSearch,
    FaFilter, FaUserCheck, FaChevronLeft,
    FaFolderPlus, FaTimes, FaInbox, FaUserEdit,
    FaFileAlt, FaTag, FaBusinessTime, FaChartBar
} from 'react-icons/fa';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from 'recharts';
import { exportAttendanceToCSV, exportAttendanceToTXT, exportAttendanceToPDF, processAttendanceExportData } from '../../utils/exportUtils/index.js';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExportButtons from '../../components/Common/ExportButtons';
import ProjectManager from '../../components/Manufacturing/ProjectManager';
import MemberManager from '../../components/Hotel/MemberManager'; // Using Hotel specific Member Manager
import RoleManager from '../../components/IT/RoleManager'; // Reusing IT Role Manager
import CalendarManager from '../../pages/ManufacturingSector/AttendanceTracker/CalendarManager';
import ShiftManager from '../../pages/ManufacturingSector/AttendanceTracker/ShiftManager';

const SECTOR = 'hotel';
// Hotel sector theme color for PDF exports (Warm Orange/Amber - hospitality theme)
const HOTEL_THEME_COLOR = [255, 138, 0]; // RGB for orange (#FF8A00)


const HotelAttendance = () => {
    const navigate = useNavigate();
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const [attendances, setAttendances] = useState([]);
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);

    const [projects, setProjects] = useState([]);
    const [members, setMembers] = useState([]);
    const [showProjectManager, setShowProjectManager] = useState(false);
    const [showRoleManager, setShowRoleManager] = useState(false);
    const [filterProject, setFilterProject] = useState('');
    const [filterMember, setFilterMember] = useState('');
    const [periodType, setPeriodType] = useState('day'); // 'month', 'year', 'day', 'range'
    const [currentPeriod, setCurrentPeriod] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
    const [customRange, setCustomRange] = useState({ start: '', end: '' });
    const [searchQuery, setSearchQuery] = useState('');
    const [memberSummary, setMemberSummary] = useState([]);
    const [activeTab, setActiveTab] = useState('records'); // 'records', 'summary', 'quick', 'shifts', 'calendar'

    // Managers Data
    const [holidays, setHolidays] = useState([]);
    const [shifts, setShifts] = useState([]);

    const [roles, setRoles] = useState([]);
    const [confirmModal, setConfirmModal] = useState({ show: false, type: null, label: '', id: null });
    const [filterRole, setFilterRole] = useState('');

    const memberIdToRoleMap = useMemo(() => {
        const map = {};
        members.forEach(m => { map[m.id] = m.role; });
        return map;
    }, [members]);

    const uniqueRoles = useMemo(() => {
        return [...new Set(members.map(m => m.role).filter(Boolean))];
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
        { id: 'week_off', label: 'Week Off', icon: FaCalendarAlt, color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-100' },
        { id: 'holiday', label: 'Holiday', icon: FaCalendarAlt, color: 'text-pink-500', bg: 'bg-pink-50', border: 'border-pink-100' },
        { id: 'overtime', label: 'Overtime', icon: FaBusinessTime, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-100' }
    ];

    const [showWorkDoneModal, setShowWorkDoneModal] = useState(false);
    const [workDoneModalData, setWorkDoneModalData] = useState({
        member_id: null,
        member_name: '',
        status: 'present',
        note: '',
        attendance_id: null
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
        period: 'AM'
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

    const activeMembersAttendanceRecords = useMemo(() => {
        const map = {};
        attendances.forEach(a => {
            if (a.date.startsWith(currentPeriod)) {
                map[a.member_id] = a;
            }
        });
        return map;
    }, [attendances, currentPeriod]);

    const calculateDuration = (startTime, endTime) => {
        if (!startTime || !endTime) return null;
        try {
            const start = new Date(`2000-01-01 ${startTime}`);
            let end = new Date(`2000-01-01 ${endTime}`);
            if (end < start) end.setDate(end.getDate() + 1);
            return (Math.abs(end - start) / (1000 * 60 * 60)).toFixed(2);
        } catch (e) { return null; }
    };

    const canEdit = true;

    const getHexColor = (status) => {
        switch (status) {
            case 'present': return '#10b981';
            case 'absent': return '#ef4444';
            case 'late': return '#f59e0b';
            case 'half-day': return '#3b82f6';
            case 'CL': return '#06b6d4';
            case 'SL': return '#f43f5e';
            case 'EL': return '#8b5cf6';
            case 'OD': return '#6366f1';
            case 'week_off': return '#64748b';
            case 'holiday': return '#ec4899';
            case 'overtime': return '#a855f7';
            default: return '#94a3b8';
        }
    };

    const fetchData = async () => {
        try {
            const isRange = periodType === 'range';
            const rangeStart = isRange ? customRange.start : null;
            const rangeEnd = isRange ? customRange.end : null;

            if (isRange && (!rangeStart || !rangeEnd)) {
                setLoading(false);
                return;
            }

            const [attRes, statsRes, summaryRes, projRes, membersRes, roleRes, holRes, shiftRes] = await Promise.all([
                getAttendances({ projectId: filterProject, memberId: filterMember, period: isRange ? null : currentPeriod, startDate: rangeStart, endDate: rangeEnd, sector: SECTOR }),
                getAttendanceStats({ projectId: filterProject, memberId: filterMember, period: isRange ? null : currentPeriod, startDate: rangeStart, endDate: rangeEnd, sector: SECTOR }),
                getMemberSummary({ projectId: filterProject, period: isRange ? null : currentPeriod, startDate: rangeStart, endDate: rangeEnd, sector: SECTOR }),
                getProjects({ sector: SECTOR }),
                getMembers({ sector: SECTOR }),
                getMemberRoles({ sector: SECTOR }),
                getHolidays({ sector: SECTOR }),
                getShifts({ sector: SECTOR })
            ]);
            setAttendances(attRes.data.data);
            setStats(statsRes.data.data || []);
            setMemberSummary(summaryRes.data.data);
            setProjects(projRes.data.data || projRes.data);
            setMembers(membersRes.data.data);
            setRoles(roleRes.data.data);
            setHolidays(holRes.data.data);
            setShifts(shiftRes.data.data);
            setLoading(false);
        } catch (error) {
            toast.error("Failed to fetch data");
            setLoading(false);
        }
    };

    const pieData = useMemo(() => stats.map(s => ({
        name: statusOptions.find(o => o.id === s.status)?.label || s.status,
        value: s.count,
        color: getHexColor(s.status)
    })), [stats]);

    useEffect(() => {
        fetchData();
    }, [currentPeriod, filterProject, filterMember, periodType, customRange.start, customRange.end]);

    const handleQuickMark = async (memberId, status = null, permission_duration = null, note = null, permission_start_time = null, permission_end_time = null, permission_reason = null, overtimeData = null, check_in = null, check_out = null, total_hours = null, work_mode = null) => {
        try {
            const date = periodType === 'day' ? currentPeriod : new Date().toISOString().split('T')[0];
            const payload = {
                member_id: memberId,
                status: status || activeMembersAttendanceRecords[memberId]?.status || 'present',
                date,
                project_id: filterProject || members.find(m => m.id === memberId)?.project_id || null,
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

            await quickMarkAttendance(payload);
            fetchData();
            if (!note && !overtimeData) toast.success("Updated");
        } catch (error) { toast.error("Failed"); }
    };

    const handleBulkMark = (status) => {
        const date = periodType === 'day' ? currentPeriod : new Date().toISOString().split('T')[0];
        setConfirmModal({
            show: true,
            type: 'BULK_MARK',
            label: status === 'present' ? 'MARK ALL PRESENT' : status === 'week_off' ? 'MARK WEEKEND' : status === 'holiday' ? 'MARK HOLIDAY' : 'BULK ACTION',
            message: `Marks ALL active members as ${status === 'week_off' ? 'Weekend' : status === 'holiday' ? 'Holiday' : 'Present'} for ${date}?`,
            onConfirm: () => confirmBulkMark(status)
        });
    };

    const confirmBulkMark = async (status) => {
        try {
            const date = periodType === 'day' ? currentPeriod : new Date().toISOString().split('T')[0];
            await bulkMarkAttendance({
                member_ids: members.map(m => m.id),
                date,
                status,
                sector: SECTOR
            });
            toast.success("Bulk update successful");
            fetchData();
        } catch (error) {
            toast.error("Failed");
        }
    };

    const filteredAttendances = useMemo(() => {
        return attendances.filter(a => {
            const matchesSearch = (a.member_name || '').toLowerCase().includes(searchQuery.toLowerCase());
            const matchesRole = !filterRole || memberIdToRoleMap[a.member_id] === filterRole;
            return matchesSearch && matchesRole;
        });
    }, [attendances, searchQuery, filterRole, memberIdToRoleMap]);

    const handleExportCSV = () => {
        switch (activeTab) {
            case 'records': {
                const enrichedData = processAttendanceExportData(attendances, members, { periodType, currentPeriod, filterRole, filterMember, searchQuery, filterProject });
                exportAttendanceToCSV(enrichedData, `Hotel_Attendance_Records_${currentPeriod}`);
                break;
            }
            case 'summary': {
                // Apply filters to summary
                let filteredSummary = memberSummary;
                if (filterRole) filteredSummary = filteredSummary.filter(m => m.role === filterRole);
                if (filterProject) filteredSummary = filteredSummary.filter(m => m.project_id && m.project_id.toString() === filterProject.toString());
                if (searchQuery) filteredSummary = filteredSummary.filter(m => m.member_name.toLowerCase().includes(searchQuery.toLowerCase()));

                const headers = ['Member Name', 'Role', 'Department', 'Total Days', 'Present', 'Absent', 'Late', 'Half Day', 'Week Off', 'Holiday', 'Overtime'];
                const rows = filteredSummary.map(m => [
                    m.member_name || 'N/A',
                    m.role || 'N/A',
                    projects.find(p => p.id === m.project_id)?.name || 'N/A',
                    m.total_days || 0,
                    m.present || 0,
                    m.absent || 0,
                    m.late || 0,
                    m.half_day || 0,
                    m.week_off || 0,
                    m.holiday || 0,
                    m.overtime || 0
                ]);
                const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Hotel_Attendance_Summary_${currentPeriod}.csv`;
                a.click();
                toast.success('Summary exported to CSV');
                break;
            }
            case 'quick': {
                // Export daily sheet - only members with their status for the selected date
                // Apply filters
                let filteredMembers = members;
                if (filterRole) filteredMembers = filteredMembers.filter(m => m.role === filterRole);
                if (filterProject) filteredMembers = filteredMembers.filter(m => m.project_id && m.project_id.toString() === filterProject.toString());
                if (searchQuery) filteredMembers = filteredMembers.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()));

                const headers = ['Member Name', 'Role', 'Department', 'Status', 'Check In', 'Check Out', 'Total Hours', 'Notes'];
                const rows = filteredMembers.map(m => {
                    const todayAttendance = attendances.find(a => a.member_id === m.id && a.date.startsWith(currentPeriod));
                    return [
                        m.name || 'N/A',
                        m.role || 'N/A',
                        projects.find(p => p.id === m.project_id)?.name || 'N/A',
                        todayAttendance?.status || 'Not Marked',
                        todayAttendance?.check_in || '-',
                        todayAttendance?.check_out || '-',
                        todayAttendance?.total_hours || '-',
                        todayAttendance?.note || '-'
                    ];
                });
                const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Hotel_Daily_Sheet_${currentPeriod}.csv`;
                a.click();
                toast.success('Daily Sheet exported to CSV');
                break;
            }
            case 'members': {
                // Apply filters to members
                let filteredMembers = members;
                if (filterRole) filteredMembers = filteredMembers.filter(m => m.role === filterRole);
                if (filterProject) filteredMembers = filteredMembers.filter(m => m.project_id && m.project_id.toString() === filterProject.toString());
                if (searchQuery) filteredMembers = filteredMembers.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()));

                const headers = ['Name', 'Role', 'Department', 'Phone', 'Email', 'Employment Nature', 'Work Area', 'Shift', 'Wage Type', 'Salary/Wage', 'Status'];
                const rows = filteredMembers.map(m => [
                    m.name || 'N/A',
                    m.role || 'N/A',
                    projects.find(p => p.id === m.project_id)?.name || 'N/A',
                    m.phone || 'N/A',
                    m.email || 'N/A',
                    m.employment_nature || 'N/A',
                    m.primary_work_area || 'N/A',
                    shifts.find(s => s.id === m.default_shift_id)?.name || 'N/A',
                    m.wage_type || 'daily',
                    m.wage_type === 'monthly' ? (m.monthly_salary || 0) : (m.wage_type === 'hourly' ? (m.hourly_rate || 0) : (m.daily_wage || 0)),
                    m.status || 'active'
                ]);
                const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Hotel_Members_${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
                toast.success('Members exported to CSV');
                break;
            }
            case 'shifts': {
                const headers = ['Shift Name', 'Start Time', 'End Time', 'Total Hours', 'Break Duration', 'Status'];
                const rows = shifts.map(s => [
                    s.name || 'N/A',
                    s.start_time || 'N/A',
                    s.end_time || 'N/A',
                    s.total_hours || 'N/A',
                    s.break_duration || 0,
                    s.status || 'active'
                ]);
                const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Hotel_Shifts_${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
                toast.success('Shifts exported to CSV');
                break;
            }
            case 'calendar': {
                const headers = ['Holiday Name', 'Date', 'Type'];
                const rows = holidays.map(h => [
                    h.name || 'N/A',
                    h.date || 'N/A',
                    h.type || 'National'
                ]);
                const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Hotel_Holidays_${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
                toast.success('Holidays exported to CSV');
                break;
            }
            default:
                toast.error('No data to export');
        }
    };

    const handleExportPDF = () => {
        switch (activeTab) {
            case 'records': {
                const enrichedData = processAttendanceExportData(attendances, members, { periodType, currentPeriod, filterRole, filterMember, searchQuery, filterProject });
                exportAttendanceToPDF({ data: enrichedData, period: currentPeriod, filename: `Hotel_Attendance_Records_${currentPeriod}`, themeColor: HOTEL_THEME_COLOR });
                break;
            }
            case 'summary': {
                // Apply filters to summary
                let filteredSummary = memberSummary;
                if (filterRole) filteredSummary = filteredSummary.filter(m => m.role === filterRole);
                if (filterProject) filteredSummary = filteredSummary.filter(m => m.project_id && m.project_id.toString() === filterProject.toString());
                if (searchQuery) filteredSummary = filteredSummary.filter(m => m.member_name.toLowerCase().includes(searchQuery.toLowerCase()));

                const doc = new jsPDF();
                const pageWidth = doc.internal.pageSize.getWidth();

                // Hotel theme header
                doc.setFillColor(HOTEL_THEME_COLOR[0], HOTEL_THEME_COLOR[1], HOTEL_THEME_COLOR[2]);
                doc.rect(0, 0, pageWidth, 35, 'F');

                doc.setFontSize(18);
                doc.setTextColor(255, 255, 255);
                doc.setFont('helvetica', 'bold');
                doc.text('Hotel Attendance Summary', 14, 15);
                doc.setFontSize(10);
                doc.setTextColor(255, 255, 255, 0.9);
                doc.setFont('helvetica', 'normal');
                doc.text(`Period: ${currentPeriod}  |  Generated: ${new Date().toLocaleString('en-GB')}`, 14, 25);

                const tableData = filteredSummary.map(m => [
                    m.member_name || 'N/A',
                    m.role || 'N/A',
                    projects.find(p => p.id === m.project_id)?.name || 'N/A',
                    m.total_days || 0,
                    m.present || 0,
                    m.absent || 0,
                    m.late || 0,
                    m.half_day || 0,
                    m.week_off || 0,
                    m.holiday || 0,
                    m.overtime || 0
                ]);

                autoTable(doc, {
                    head: [['Member', 'Role', 'Dept', 'Total', 'Present', 'Absent', 'Late', 'Half', 'Week Off', 'Holiday', 'OT']],
                    body: tableData,
                    startY: 40,
                    styles: { fontSize: 8 },
                    headStyles: { fillColor: HOTEL_THEME_COLOR }
                });

                doc.save(`Hotel_Attendance_Summary_${currentPeriod}.pdf`);
                toast.success('Summary exported to PDF');
                break;
            }
            case 'quick': {
                // Apply filters
                let filteredMembers = members;
                if (filterRole) filteredMembers = filteredMembers.filter(m => m.role === filterRole);
                if (filterProject) filteredMembers = filteredMembers.filter(m => m.project_id && m.project_id.toString() === filterProject.toString());
                if (searchQuery) filteredMembers = filteredMembers.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()));

                const doc = new jsPDF();
                const pageWidth = doc.internal.pageSize.getWidth();

                // Hotel theme header
                doc.setFillColor(HOTEL_THEME_COLOR[0], HOTEL_THEME_COLOR[1], HOTEL_THEME_COLOR[2]);
                doc.rect(0, 0, pageWidth, 35, 'F');

                doc.setFontSize(18);
                doc.setTextColor(255, 255, 255);
                doc.setFont('helvetica', 'bold');
                doc.text('Hotel Daily Attendance Sheet', 14, 15);
                doc.setFontSize(10);
                doc.setTextColor(255, 255, 255, 0.9);
                doc.setFont('helvetica', 'normal');
                doc.text(`Date: ${currentPeriod}  |  Generated: ${new Date().toLocaleString('en-GB')}`, 14, 25);

                const tableData = filteredMembers.map(m => {
                    const todayAttendance = attendances.find(a => a.member_id === m.id && a.date.startsWith(currentPeriod));
                    return [
                        m.name || 'N/A',
                        m.role || 'N/A',
                        projects.find(p => p.id === m.project_id)?.name || 'N/A',
                        todayAttendance?.status || 'Not Marked',
                        todayAttendance?.check_in || '-',
                        todayAttendance?.check_out || '-',
                        todayAttendance?.total_hours || '-'
                    ];
                });

                autoTable(doc, {
                    head: [['Member', 'Role', 'Dept', 'Status', 'Check In', 'Check Out', 'Hours']],
                    body: tableData,
                    startY: 40,
                    styles: { fontSize: 8 },
                    headStyles: { fillColor: HOTEL_THEME_COLOR }
                });

                doc.save(`Hotel_Daily_Sheet_${currentPeriod}.pdf`);
                toast.success('Daily Sheet exported to PDF');
                break;
            }
            case 'members': {
                // Apply filters to members
                let filteredMembers = members;
                if (filterRole) filteredMembers = filteredMembers.filter(m => m.role === filterRole);
                if (filterProject) filteredMembers = filteredMembers.filter(m => m.project_id && m.project_id.toString() === filterProject.toString());
                if (searchQuery) filteredMembers = filteredMembers.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()));

                const doc = new jsPDF();
                const pageWidth = doc.internal.pageSize.getWidth();

                // Hotel theme header
                doc.setFillColor(HOTEL_THEME_COLOR[0], HOTEL_THEME_COLOR[1], HOTEL_THEME_COLOR[2]);
                doc.rect(0, 0, pageWidth, 35, 'F');

                doc.setFontSize(18);
                doc.setTextColor(255, 255, 255);
                doc.setFont('helvetica', 'bold');
                doc.text('Hotel Staff Members', 14, 15);
                doc.setFontSize(10);
                doc.setTextColor(255, 255, 255, 0.9);
                doc.setFont('helvetica', 'normal');
                doc.text(`Generated: ${new Date().toLocaleString('en-GB')}`, 14, 25);

                const tableData = filteredMembers.map(m => [
                    m.name || 'N/A',
                    m.role || 'N/A',
                    projects.find(p => p.id === m.project_id)?.name || 'N/A',
                    m.phone || 'N/A',
                    m.employment_nature || 'N/A',
                    m.primary_work_area || 'N/A',
                    m.status || 'active'
                ]);

                autoTable(doc, {
                    head: [['Name', 'Role', 'Department', 'Phone', 'Employment', 'Work Area', 'Status']],
                    body: tableData,
                    startY: 40,
                    styles: { fontSize: 8 },
                    headStyles: { fillColor: HOTEL_THEME_COLOR }
                });

                doc.save(`Hotel_Members_${new Date().toISOString().split('T')[0]}.pdf`);
                toast.success('Members exported to PDF');
                break;
            }
            case 'shifts': {
                const doc = new jsPDF();
                const pageWidth = doc.internal.pageSize.getWidth();

                // Hotel theme header
                doc.setFillColor(HOTEL_THEME_COLOR[0], HOTEL_THEME_COLOR[1], HOTEL_THEME_COLOR[2]);
                doc.rect(0, 0, pageWidth, 35, 'F');

                doc.setFontSize(18);
                doc.setTextColor(255, 255, 255);
                doc.setFont('helvetica', 'bold');
                doc.text('Hotel Shift Configurations', 14, 15);
                doc.setFontSize(10);
                doc.setTextColor(255, 255, 255, 0.9);
                doc.setFont('helvetica', 'normal');
                doc.text(`Generated: ${new Date().toLocaleString('en-GB')}`, 14, 25);

                const tableData = shifts.map(s => [
                    s.name || 'N/A',
                    s.start_time || 'N/A',
                    s.end_time || 'N/A',
                    s.total_hours || 'N/A',
                    s.break_duration || 0,
                    s.status || 'active'
                ]);

                autoTable(doc, {
                    head: [['Shift Name', 'Start Time', 'End Time', 'Total Hours', 'Break (mins)', 'Status']],
                    body: tableData,
                    startY: 40,
                    styles: { fontSize: 8 },
                    headStyles: { fillColor: HOTEL_THEME_COLOR }
                });

                doc.save(`Hotel_Shifts_${new Date().toISOString().split('T')[0]}.pdf`);
                toast.success('Shifts exported to PDF');
                break;
            }
            case 'calendar': {
                const doc = new jsPDF();
                const pageWidth = doc.internal.pageSize.getWidth();

                // Hotel theme header
                doc.setFillColor(HOTEL_THEME_COLOR[0], HOTEL_THEME_COLOR[1], HOTEL_THEME_COLOR[2]);
                doc.rect(0, 0, pageWidth, 35, 'F');

                doc.setFontSize(18);
                doc.setTextColor(255, 255, 255);
                doc.setFont('helvetica', 'bold');
                doc.text('Hotel Holidays Calendar', 14, 15);
                doc.setFontSize(10);
                doc.setTextColor(255, 255, 255, 0.9);
                doc.setFont('helvetica', 'normal');
                doc.text(`Generated: ${new Date().toLocaleString('en-GB')}`, 14, 25);

                const tableData = holidays.map(h => [
                    h.name || 'N/A',
                    h.date || 'N/A',
                    h.type || 'National'
                ]);

                autoTable(doc, {
                    head: [['Holiday Name', 'Date', 'Type']],
                    body: tableData,
                    startY: 40,
                    styles: { fontSize: 8 },
                    headStyles: { fillColor: HOTEL_THEME_COLOR }
                });

                doc.save(`Hotel_Holidays_${new Date().toISOString().split('T')[0]}.pdf`);
                toast.success('Holidays exported to PDF');
                break;
            }
            default: {
                const enrichedData = processAttendanceExportData(attendances, members, { periodType, currentPeriod, filterRole, filterMember, searchQuery, filterProject });
                exportAttendanceToPDF({ data: enrichedData, period: currentPeriod, filename: `Hotel_Attendance_${currentPeriod}`, themeColor: HOTEL_THEME_COLOR });
            }
        }
    };

    const handleExportTXT = () => {
        switch (activeTab) {
            case 'records': {
                const enrichedData = processAttendanceExportData(attendances, members, { periodType, currentPeriod, filterRole, filterMember, searchQuery, filterProject });
                exportAttendanceToTXT({ data: enrichedData, period: currentPeriod, filename: `Hotel_Attendance_Records_${currentPeriod}` });
                break;
            }
            case 'summary': {
                // Apply filters to summary
                let filteredSummary = memberSummary;
                if (filterRole) filteredSummary = filteredSummary.filter(m => m.role === filterRole);
                if (filterProject) filteredSummary = filteredSummary.filter(m => m.project_id && m.project_id.toString() === filterProject.toString());
                if (searchQuery) filteredSummary = filteredSummary.filter(m => m.member_name.toLowerCase().includes(searchQuery.toLowerCase()));

                let txtContent = `HOTEL ATTENDANCE SUMMARY\n`;
                txtContent += `Period: ${currentPeriod}\n`;
                txtContent += `Generated: ${new Date().toLocaleString()}\n`;
                txtContent += `${'='.repeat(100)}\n\n`;

                filteredSummary.forEach(m => {
                    txtContent += `Member: ${m.member_name || 'N/A'}\n`;
                    txtContent += `Role: ${m.role || 'N/A'}\n`;
                    txtContent += `Department: ${projects.find(p => p.id === m.project_id)?.name || 'N/A'}\n`;
                    txtContent += `Total Days: ${m.total_days || 0} | Present: ${m.present || 0} | Absent: ${m.absent || 0} | Late: ${m.late || 0}\n`;
                    txtContent += `Half Day: ${m.half_day || 0} | Week Off: ${m.week_off || 0} | Holiday: ${m.holiday || 0} | Overtime: ${m.overtime || 0}\n`;
                    txtContent += `${'-'.repeat(100)}\n`;
                });

                const blob = new Blob([txtContent], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Hotel_Attendance_Summary_${currentPeriod}.txt`;
                a.click();
                toast.success('Summary exported to TXT');
                break;
            }
            case 'quick': {
                // Apply filters
                let filteredMembers = members;
                if (filterRole) filteredMembers = filteredMembers.filter(m => m.role === filterRole);
                if (filterProject) filteredMembers = filteredMembers.filter(m => m.project_id && m.project_id.toString() === filterProject.toString());
                if (searchQuery) filteredMembers = filteredMembers.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()));

                let txtContent = `HOTEL DAILY ATTENDANCE SHEET\n`;
                txtContent += `Date: ${currentPeriod}\n`;
                txtContent += `Generated: ${new Date().toLocaleString()}\n`;
                txtContent += `${'='.repeat(100)}\n\n`;

                filteredMembers.forEach(m => {
                    const todayAttendance = attendances.find(a => a.member_id === m.id && a.date.startsWith(currentPeriod));
                    txtContent += `Member: ${m.name || 'N/A'}\n`;
                    txtContent += `Role: ${m.role || 'N/A'} | Department: ${projects.find(p => p.id === m.project_id)?.name || 'N/A'}\n`;
                    txtContent += `Status: ${todayAttendance?.status || 'Not Marked'}\n`;
                    txtContent += `Check In: ${todayAttendance?.check_in || '-'} | Check Out: ${todayAttendance?.check_out || '-'}\n`;
                    txtContent += `Total Hours: ${todayAttendance?.total_hours || '-'}\n`;
                    if (todayAttendance?.note) {
                        txtContent += `Notes: ${todayAttendance.note}\n`;
                    }
                    txtContent += `${'-'.repeat(100)}\n`;
                });

                const blob = new Blob([txtContent], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Hotel_Daily_Sheet_${currentPeriod}.txt`;
                a.click();
                toast.success('Daily Sheet exported to TXT');
                break;
            }
            case 'members': {
                // Apply filters to members
                let filteredMembers = members;
                if (filterRole) filteredMembers = filteredMembers.filter(m => m.role === filterRole);
                if (filterProject) filteredMembers = filteredMembers.filter(m => m.project_id && m.project_id.toString() === filterProject.toString());
                if (searchQuery) filteredMembers = filteredMembers.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()));

                let txtContent = `HOTEL STAFF MEMBERS\n`;
                txtContent += `Generated: ${new Date().toLocaleString()}\n`;
                txtContent += `${'='.repeat(100)}\n\n`;

                filteredMembers.forEach(m => {
                    txtContent += `Name: ${m.name || 'N/A'}\n`;
                    txtContent += `Role: ${m.role || 'N/A'} | Department: ${projects.find(p => p.id === m.project_id)?.name || 'N/A'}\n`;
                    txtContent += `Phone: ${m.phone || 'N/A'} | Email: ${m.email || 'N/A'}\n`;
                    txtContent += `Employment: ${m.employment_nature || 'N/A'} | Work Area: ${m.primary_work_area || 'N/A'}\n`;
                    txtContent += `Wage: ${m.wage_type || 'daily'} - ₹${m.wage_type === 'monthly' ? (m.monthly_salary || 0) : (m.wage_type === 'hourly' ? (m.hourly_rate || 0) : (m.daily_wage || 0))}\n`;
                    txtContent += `Status: ${m.status || 'active'}\n`;
                    txtContent += `${'-'.repeat(100)}\n`;
                });

                const blob = new Blob([txtContent], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Hotel_Members_${new Date().toISOString().split('T')[0]}.txt`;
                a.click();
                toast.success('Members exported to TXT');
                break;
            }
            case 'shifts': {
                let txtContent = `HOTEL SHIFTS CONFIGURATION\n`;
                txtContent += `Generated: ${new Date().toLocaleString()}\n`;
                txtContent += `${'='.repeat(100)}\n\n`;

                shifts.forEach(s => {
                    txtContent += `Shift: ${s.name || 'N/A'}\n`;
                    txtContent += `Time: ${s.start_time || 'N/A'} - ${s.end_time || 'N/A'}\n`;
                    txtContent += `Total Hours: ${s.total_hours || 'N/A'} | Break: ${s.break_duration || 0} mins\n`;
                    txtContent += `Status: ${s.status || 'active'}\n`;
                    txtContent += `${'-'.repeat(100)}\n`;
                });

                const blob = new Blob([txtContent], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Hotel_Shifts_${new Date().toISOString().split('T')[0]}.txt`;
                a.click();
                toast.success('Shifts exported to TXT');
                break;
            }
            case 'calendar': {
                let txtContent = `HOTEL HOLIDAYS CALENDAR\n`;
                txtContent += `Generated: ${new Date().toLocaleString()}\n`;
                txtContent += `${'='.repeat(100)}\n\n`;

                holidays.forEach(h => {
                    txtContent += `Holiday: ${h.name || 'N/A'}\n`;
                    txtContent += `Date: ${h.date || 'N/A'}\n`;
                    txtContent += `Type: ${h.type || 'National'}\n`;
                    txtContent += `${'-'.repeat(100)}\n`;
                });

                const blob = new Blob([txtContent], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Hotel_Holidays_${new Date().toISOString().split('T')[0]}.txt`;
                a.click();
                toast.success('Holidays exported to TXT');
                break;
            }
            default: {
                const enrichedData = processAttendanceExportData(attendances, members, { periodType, currentPeriod, filterRole, filterMember, searchQuery });
                exportAttendanceToTXT({ data: enrichedData, period: currentPeriod, filename: `Hotel_Attendance_${currentPeriod}` });
            }
        }
    };

    const handleDelete = (id) => {
        setConfirmModal({
            show: true,
            type: 'DELETE',
            label: 'Delete Attendance Record',
            message: 'Are you sure you want to permanently delete this attendance record?',
            onConfirm: async () => {
                try {
                    await deleteAttendance(id);
                    toast.success("Record deleted");
                    fetchData();
                } catch (error) {
                    toast.error("Failed to delete record");
                }
            }
        });
    };

    if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div></div>;

    return (
        <div className="min-h-screen bg-[#f8fafc] font-['Outfit'] text-slate-900 overflow-x-hidden">
            {/* Glossy Header Background */}
            <div className="fixed top-0 left-0 w-full h-80 bg-linear-to-b from-blue-50/50 to-transparent pointer-events-none -z-10"></div>

            <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <Link to="/hotel-sector" className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all shadow-sm"><FaChevronLeft /></Link>
                            <div className="w-12 h-12 bg-linear-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 text-white"><FaUserCheck size={20} /></div>
                            <div>
                                <h1 className="text-2xl font-black tracking-tight">Attendance & Shifts</h1>
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Manage Staff & Rosters</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {/* Period Selector */}
                            <div className="flex bg-slate-50 border p-1 rounded-xl">
                                {['day', 'month', 'year', 'range'].map(type => (
                                    <button key={type} onClick={() => setPeriodType(type)} className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase ${periodType === type ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>{type}</button>
                                ))}
                            </div>

                            {/* Date Picker */}
                            <div className="flex items-center bg-white border border-slate-200 px-3 rounded-xl shadow-sm h-[38px] hover:border-blue-500 transition-colors">
                                {periodType === 'range' ? (
                                    <div className="flex gap-2">
                                        <input type="date" value={customRange.start} onChange={e => setCustomRange({ ...customRange, start: e.target.value })} className="text-xs font-bold outline-none bg-transparent" />
                                        <span>-</span>
                                        <input type="date" value={customRange.end} onChange={e => setCustomRange({ ...customRange, end: e.target.value })} className="text-xs font-bold outline-none bg-transparent" />
                                    </div>
                                ) : (
                                    <input type={periodType === 'month' ? 'month' : periodType === 'year' ? 'number' : 'date'} value={currentPeriod} onChange={e => setCurrentPeriod(e.target.value)} className="text-xs font-bold outline-none bg-transparent" />
                                )}
                            </div>

                            {/* Project Filter */}
                            <div className="relative">
                                <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]" />
                                <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className="h-[38px] pl-8 pr-3 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 outline-none hover:border-blue-500 transition-all appearance-none shadow-sm min-w-[140px]">
                                    <option value="">All Departments</option>
                                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>

                            <button onClick={() => setShowProjectManager(true)} className="w-[38px] h-[38px] bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all"><FaFolderPlus /></button>

                            {/* Role Filter */}
                            <div className="relative">
                                <FaTag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]" />
                                <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="h-[38px] pl-8 pr-3 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 outline-none hover:border-blue-500 transition-all appearance-none shadow-sm min-w-[120px]">
                                    <option value="">All Roles</option>
                                    {[...new Set([...roles.map(r => r.name), ...uniqueRoles])].sort().map(role => (
                                        <option key={role} value={role}>{role}</option>
                                    ))}
                                </select>
                            </div>
                            <button onClick={() => setShowRoleManager(true)} className="w-[38px] h-[38px] bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center border border-slate-200 hover:bg-purple-50 hover:text-purple-600 transition-all"><FaTag /></button>


                            <ExportButtons
                                onExportCSV={handleExportCSV}
                                onExportPDF={handleExportPDF}
                                onExportTXT={handleExportTXT}
                            />
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* Tabs */}
                <div className="flex bg-slate-100 p-1 rounded-xl mb-8 w-full sm:w-fit overflow-x-auto">
                    {[
                        { id: 'records', label: 'Records' },
                        { id: 'summary', label: 'Summary' },
                        { id: 'quick', label: 'Daily Sheet' },
                        { id: 'members', label: 'Members' }, // Added Member tab
                        { id: 'shifts', label: 'Shifts & Rules' }, // Added Shifts tab
                        { id: 'calendar', label: 'Holidays' } // Added Calendar tab
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === 'records' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Stats Column */}
                        <div className="space-y-6">
                            <div className="bg-white rounded-[32px] p-8 shadow-xl border border-slate-100">
                                <h3 className="text-lg font-black mb-6 flex items-center gap-2"><div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>{periodType.toUpperCase()} STATS</h3>
                                <div className="h-64">
                                    {stats.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">{pieData.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie><Tooltip /><Legend /></PieChart>
                                        </ResponsiveContainer>
                                    ) : <div className="h-full flex flex-col items-center justify-center text-slate-300"><FaInbox size={40} /><p className="text-[10px] font-black uppercase mt-4">No Data</p></div>}
                                </div>
                            </div>
                            <div className="bg-linear-to-br from-blue-600 to-indigo-700 rounded-[32px] p-8 text-white shadow-xl shadow-blue-500/20">
                                <p className="text-blue-100 text-[10px] font-black uppercase tracking-widest mb-2">Total Staff</p>
                                <h4 className="text-4xl font-black mb-4">{members.length} Members</h4>
                                <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden mb-4"><div className="h-full bg-yellow-400" style={{ width: '70%' }}></div></div>
                                <p className="text-sm font-medium text-blue-100 opacity-80">Across {projects.length} Depts</p>
                            </div>
                        </div>

                        {/* Records Table */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-[32px] p-8 shadow-xl border border-slate-100 min-h-[600px]">
                                <div className="flex justify-between items-center mb-8">
                                    <h3 className="text-lg font-black tracking-tight">{periodType.toUpperCase()} Records</h3>
                                    <div className="relative"><FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" /><input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="bg-slate-50 border rounded-xl pl-9 pr-4 py-2 text-xs font-bold outline-none focus:border-blue-500 transition-all" /></div>
                                </div>
                                {filteredAttendances.length === 0 ? <div className="text-center py-20 text-slate-400 font-bold">No records found.</div> : (
                                    <div className="overflow-x-auto"><table className="w-full text-left border-separate border-spacing-y-3">
                                        <thead><tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest"><th className="pb-4 pl-4">Member</th><th className="pb-4">Date</th><th className="pb-4">Shift</th><th className="pb-4">In / Out</th><th className="pb-4">OT</th><th className="pb-4">Status</th><th className="pb-4 text-center">Actions</th></tr></thead>
                                        <tbody>{filteredAttendances.map(a => (
                                            <tr key={a.id} className="bg-slate-50/50 hover:bg-slate-50 transition-colors rounded-2xl">
                                                <td className="py-4 pl-4 font-black text-xs text-slate-700">{a.member_name}</td>
                                                <td className="py-4 font-bold text-[10px] text-slate-500">{new Date(a.date).toLocaleDateString()}</td>
                                                <td className="py-4 text-[10px] font-bold text-slate-600">
                                                    {shifts.find(s => s.id === a.shift_id)?.name || '-'}
                                                </td>
                                                <td className="py-4 text-[10px] font-bold text-slate-600">
                                                    {a.check_in ? a.check_in.substring(0, 5) : '-'} / {a.check_out ? a.check_out.substring(0, 5) : '-'}
                                                </td>
                                                <td className="py-4 text-[10px] font-bold text-purple-600">
                                                    {a.overtime_duration > 0 ? `${a.overtime_duration}h` : '-'}
                                                </td>
                                                <td className="py-4">
                                                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${statusOptions.find(o => o.id === a.status)?.bg} ${statusOptions.find(o => o.id === a.status)?.color}`}>{a.status}</span>
                                                </td>
                                                <td className="py-4 text-center"><button onClick={() => handleDelete(a.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><FaTrash /></button></td>
                                            </tr>
                                        ))}</tbody>
                                    </table></div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'quick' && (
                    <div className="bg-white rounded-[40px] shadow-xl border border-slate-100 overflow-hidden">
                        <div className="p-8 border-b border-slate-100 bg-linear-to-br from-slate-900 to-slate-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                            <div>
                                <h3 className="text-xl font-black mb-1">Daily Attendance Sheet</h3>
                                <div className="flex items-center gap-2 opacity-60">
                                    <FaCalendarAlt size={12} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{new Date(currentPeriod).toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={() => handleBulkMark('present')} className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"><FaCheckCircle /> Mark All Present</button>
                                <button onClick={() => handleBulkMark('week_off')} className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"><FaCalendarAlt /> Weekend</button>
                            </div>
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        <th className="px-8 py-5">Staff Member</th>
                                        <th className="px-4 py-5 text-center">Status</th>
                                        <th className="px-4 py-5 text-center">Actions</th>
                                        <th className="px-4 py-5 text-center">Time Log</th>
                                        <th className="px-4 py-5">Work Details</th>
                                        <th className="px-8 py-5 text-right">Current</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {members
                                        .filter(m => {
                                            const matchesRole = !filterRole || m.role === filterRole;
                                            const matchesSearch = !searchQuery || (m.name || '').toLowerCase().includes(searchQuery.toLowerCase());
                                            const matchesProject = !filterProject || (m.project_id && m.project_id.toString() === filterProject.toString());
                                            return matchesRole && matchesSearch && matchesProject;
                                        })
                                        .map(w => {
                                            const attendance = activeMembersAttendanceRecords[w.id];
                                            const currentStatus = attendance?.status;
                                            const option = statusOptions.find(o => o.id === currentStatus);
                                            const isPresentOrPerm = ['present', 'late', 'half-day', 'permission'].includes(currentStatus || '');

                                            return (
                                                <tr key={w.id} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 bg-white rounded-xl border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-amber-500 shadow-sm transition-all shrink-0">
                                                                <FaUserCheck />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <h4 className="font-black text-slate-900 leading-tight truncate text-sm">{w.name}</h4>
                                                                <p className="text-[9px] font-black uppercase tracking-tighter text-slate-400 mt-0.5">{w.role || 'Staff'}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-6 text-center">
                                                        <div className="flex flex-col gap-2">
                                                            <div className="flex items-center justify-center gap-1">
                                                                {['present', 'absent'].map(status => (
                                                                    <button
                                                                        key={status}
                                                                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black uppercase transition-all ${currentStatus === status ? `${statusOptions.find(o => o.id === status).bg} ${statusOptions.find(o => o.id === status).color} ring-2 ring-offset-1 ring-blue-100` : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                                                        onClick={() => handleQuickMark(w.id, status)}
                                                                    >
                                                                        {status === 'present' ? 'P' : 'A'}
                                                                    </button>
                                                                ))}
                                                                <button
                                                                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black uppercase transition-all ${currentStatus === 'half-day' ? `${statusOptions.find(o => o.id === 'half-day').bg} ${statusOptions.find(o => o.id === 'half-day').color} ring-2 ring-offset-1 ring-blue-100` : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                                                    onClick={() => { setHalfDayModalData({ member_id: w.id, member_name: w.name, period: 'AM' }); setShowHalfDayModal(true); }}
                                                                >
                                                                    H
                                                                </button>
                                                                <button
                                                                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black uppercase transition-all ${currentStatus === 'late' ? `${statusOptions.find(o => o.id === 'late').bg} ${statusOptions.find(o => o.id === 'late').color} ring-2 ring-offset-1 ring-blue-100` : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                                                    onClick={() => handleQuickMark(w.id, 'late')}
                                                                >
                                                                    L
                                                                </button>
                                                            </div>
                                                            <div className="flex items-center justify-center gap-1">
                                                                {['CL', 'SL', 'EL', 'OD'].map(status => (
                                                                    <button
                                                                        key={status}
                                                                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black uppercase transition-all ${currentStatus === status ? `${statusOptions.find(o => o.id === status).bg} ${statusOptions.find(o => o.id === status).color} ring-2 ring-offset-1 ring-blue-100` : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                                                        onClick={() => handleQuickMark(w.id, status)}
                                                                    >
                                                                        {status}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-6 text-center">
                                                        <div className="flex flex-col gap-1 items-center">
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
                                                                className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase flex items-center gap-1 transition-all ${currentStatus === 'permission' ? 'bg-purple-500 text-white shadow-lg' : isPresentOrPerm ? 'bg-purple-50 text-purple-600 border border-purple-100' : 'bg-slate-50 text-slate-300 border border-slate-50 cursor-not-allowed'}`}
                                                            >
                                                                <FaClock size={10} /> PERM
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
                                                                className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase flex items-center gap-1 transition-all ${attendance?.overtime_hours > 0 ? 'bg-orange-500 text-white shadow-lg' : isPresentOrPerm ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-slate-50 text-slate-300 border border-slate-50 cursor-not-allowed'}`}
                                                            >
                                                                <FaBusinessTime size={10} /> OT
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-6 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <div className="flex flex-col items-center gap-1">
                                                                <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-1.5 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                                                                    <FaClock size={10} className="text-slate-300" />
                                                                    <input
                                                                        type="time"
                                                                        disabled={!isPresentOrPerm}
                                                                        value={attendance?.check_in?.substring(0, 5) || ''}
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
                                                                        value={attendance?.check_out?.substring(0, 5) || ''}
                                                                        onChange={(e) => {
                                                                            const newOut = e.target.value;
                                                                            const duration = calculateDuration(attendance?.check_in, newOut);
                                                                            handleQuickMark(w.id, currentStatus, null, null, null, null, null, null, attendance?.check_in, newOut, duration);
                                                                        }}
                                                                        className="bg-transparent text-[10px] font-bold text-slate-600 outline-none w-[45px] text-right disabled:opacity-50"
                                                                    />
                                                                    <FaClock size={10} className="text-slate-300" />
                                                                </div>
                                                                <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">OUT</span>
                                                            </div>
                                                        </div>
                                                        {(attendance?.total_hours || (attendance?.overtime_hours > 0)) && (
                                                            <div className="mt-2 flex flex-col gap-1 items-center">
                                                                {attendance?.total_hours && (
                                                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${parseFloat(attendance.total_hours) >= 8 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                                        TOTAL: {attendance.total_hours} Hrs
                                                                    </span>
                                                                )}
                                                                {attendance?.overtime_hours > 0 && (
                                                                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-purple-50 text-purple-600">
                                                                        OT: {attendance.overtime_hours} Hrs
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-6">
                                                        <div
                                                            onClick={() => { if (!isPresentOrPerm || !canEdit) return; setWorkDoneModalData({ member_id: w.id, member_name: w.name, status: currentStatus || 'present', note: attendance?.note || '', attendance_id: attendance?.id }); setShowWorkDoneModal(true); }}
                                                            className={`cursor-pointer transition-all duration-300 ${isPresentOrPerm ? (canEdit ? 'opacity-100' : 'opacity-70 cursor-not-allowed') : 'opacity-30 pointer-events-none'}`}
                                                        >
                                                            <div className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-[10px] font-bold text-slate-500 flex items-center hover:border-blue-300">
                                                                <span className="truncate">{attendance?.note || "Work notes..."}</span>
                                                                <FaEdit size={10} className="ml-auto text-slate-300" />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        {option && (
                                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${option.bg} ${option.color} border ${option.border}`}>
                                                                <option.icon size={11} />
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
                            {members.map(w => {
                                const attendance = activeMembersAttendanceRecords[w.id];
                                const currentStatus = attendance?.status;
                                const option = statusOptions.find(o => o.id === currentStatus);
                                const isPresentOrPerm = currentStatus === 'present' || currentStatus === 'late' || currentStatus === 'half-day' || currentStatus === 'permission' || ['CL', 'SL', 'EL', 'OD'].includes(currentStatus);

                                return (
                                    <div key={w.id} className="bg-white rounded-[24px] border border-slate-100 p-4 shadow-sm active:scale-[0.98] transition-all">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl flex items-center justify-center text-blue-600 border border-blue-100 font-black text-xs">
                                                    {w.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-slate-900 text-sm">{w.name}</h4>
                                                    <p className="text-[9px] font-black uppercase text-slate-400">{w.role || 'Staff'}</p>
                                                </div>
                                            </div>
                                            {option && (
                                                <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${option.bg} ${option.color} border ${option.border} flex items-center gap-1`}>
                                                    <option.icon size={10} /> {option.label}
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-4 gap-1 mb-3">
                                            {['present', 'absent', 'late'].map(st => (
                                                <button
                                                    key={st}
                                                    disabled={!canEdit}
                                                    onClick={(e) => { e.stopPropagation(); handleQuickMark(w.id, st); }}
                                                    className={`h-[38px] rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1 transition-all ${!canEdit ? 'opacity-50' : currentStatus === st ? `${statusOptions.find(o => o.id === st).bg} ${statusOptions.find(o => o.id === st).color} shadow-lg` : 'bg-slate-50 text-slate-400 border border-slate-50'}`}
                                                >
                                                    {st.charAt(0)}
                                                </button>
                                            ))}
                                            <button
                                                disabled={!canEdit}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setHalfDayModalData({ member_id: w.id, member_name: w.name, period: 'AM' });
                                                    setShowHalfDayModal(true);
                                                }}
                                                className={`h-[38px] rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1 transition-all ${!canEdit ? 'opacity-50' : currentStatus === 'half-day' ? 'bg-blue-500 text-white shadow-lg' : 'bg-slate-50 text-slate-400 border border-slate-50'}`}
                                            >
                                                H
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-4 gap-1 mb-3">
                                            {['CL', 'SL', 'EL', 'OD'].map(st => (
                                                <button
                                                    key={st}
                                                    disabled={!canEdit}
                                                    onClick={(e) => { e.stopPropagation(); handleQuickMark(w.id, st); }}
                                                    className={`h-[32px] rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center justify-center transition-all ${!canEdit ? 'opacity-50' : currentStatus === st ? `${statusOptions.find(o => o.id === st).bg} ${statusOptions.find(o => o.id === st).color} shadow-md` : 'bg-slate-50 text-slate-400 border border-slate-50'}`}
                                                >
                                                    {st}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="flex flex-col gap-1">
                                            <div className="grid grid-cols-2 gap-1 mb-1">
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
                                                    className={`flex-1 py-2 rounded-xl text-[8px] font-black uppercase flex flex-col items-center justify-center gap-0.5 transition-all ${currentStatus === 'permission' ? 'bg-purple-500 text-white shadow-lg' : isPresentOrPerm ? 'bg-purple-50 text-purple-600 border border-purple-100' : 'bg-slate-50 text-slate-300 border border-slate-50 cursor-not-allowed'}`}
                                                >
                                                    <div className="flex items-center gap-1"><FaClock size={10} /> PERM</div>
                                                    {currentStatus === 'permission' && <div className="text-[7px] opacity-90 leading-none">{attendance?.permission_duration}</div>}
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
                                                    className={`flex-1 py-2 rounded-xl text-[8px] font-black uppercase flex flex-col items-center justify-center gap-0.5 transition-all ${attendance?.overtime_hours > 0 ? 'bg-orange-500 text-white shadow-lg' : isPresentOrPerm ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-slate-50 text-slate-300 border border-slate-50 cursor-not-allowed'}`}
                                                >
                                                    <div className="flex items-center gap-1"><FaBusinessTime size={10} /> OT</div>
                                                    {attendance?.overtime_hours > 0 && <div className="text-[7px] opacity-90 leading-none">{attendance?.overtime_hours} Hrs</div>}
                                                </button>
                                            </div>

                                            <div
                                                onClick={() => { if (!isPresentOrPerm || !canEdit) return; setWorkDoneModalData({ member_id: w.id, member_name: w.name, status: currentStatus || 'present', note: attendance?.note || '', attendance_id: attendance?.id }); setShowWorkDoneModal(true); }}
                                                className={`py-2 rounded-xl px-3 flex items-center gap-2 transition-all ${isPresentOrPerm ? (canEdit ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-slate-50 text-slate-300 border border-slate-100 cursor-not-allowed') : 'bg-slate-50 text-slate-300 border border-slate-50 cursor-not-allowed'}`}
                                            >
                                                <FaEdit className="text-[10px]" />
                                                <span className="text-[9px] font-black uppercase truncate">{attendance?.note || "Work notes..."}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {activeTab === 'summary' && (
                    <div className="bg-white rounded-[32px] p-8 shadow-xl border border-slate-100 overflow-hidden">
                        <div className="flex justify-between items-center mb-6 px-2">
                            <div>
                                <h3 className="text-lg font-black tracking-tight">Financial Summary</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Estimated wages based on attendance rules</p>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-slate-400 uppercase">Grand Total</p>
                                    <p className="text-xl font-black text-blue-600">₹{memberSummary.reduce((acc, s) => acc + parseFloat(s.estimated_total_wage || 0), 0).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-separate border-spacing-y-2">
                                <thead>
                                    <tr className="text-slate-400 text-[9px] font-black uppercase tracking-widest">
                                        <th className="pb-4 pl-6">Staff Member</th>
                                        <th className="pb-4 text-center">Nature</th>
                                        <th className="pb-4 text-center">Present</th>
                                        <th className="pb-4 text-center">Hours</th>
                                        <th className="pb-4 text-center">OT Pay</th>
                                        <th className="pb-4 text-right pr-6">Est. Total Wage</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {memberSummary.map(s => (
                                        <tr key={s.id} className="group hover:bg-slate-50 transition-all">
                                            <td className="py-4 pl-6 bg-slate-50/50 rounded-l-2xl group-hover:bg-white transition-all">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-linear-to-br from-slate-100 to-slate-200 flex items-center justify-center font-black text-slate-500 text-[10px] uppercase">
                                                        {s.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-xs text-slate-800 flex items-center gap-2">
                                                            {s.name}
                                                            {!members.find(m => m.id === s.id)?.default_shift_id && (
                                                                <FaExclamationCircle className="text-orange-500 animate-pulse" title="No default shift assigned!" />
                                                            )}
                                                        </p>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{s.role || 'Staff'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 text-center">
                                                <span className="text-[9px] font-black uppercase px-2 py-1 bg-blue-50 text-blue-600 rounded-full tracking-tighter">{s.employment_nature}</span>
                                            </td>
                                            <td className="py-4 text-center">
                                                <p className="text-xs font-black text-emerald-600">{s.present}</p>
                                                <p className="text-[8px] font-bold text-slate-400 uppercase">{s.absent} Absent</p>
                                            </td>
                                            <td className="py-4 text-center">
                                                <p className="text-xs font-black text-slate-700">{parseFloat(s.total_hours_worked).toFixed(1)}h</p>
                                                <p className="text-[8px] font-bold text-purple-400 uppercase">{parseFloat(s.total_overtime_hours).toFixed(1)}h OT</p>
                                            </td>
                                            <td className="py-4 text-center">
                                                <p className="text-xs font-black text-purple-600">₹{parseFloat(s.ot_wage || 0).toLocaleString()}</p>
                                            </td>
                                            <td className="py-4 pr-6 text-right rounded-r-2xl bg-slate-50/50 group-hover:bg-white transition-all">
                                                <p className="text-sm font-black text-slate-900 leading-none">₹{parseFloat(s.estimated_total_wage || 0).toLocaleString()}</p>
                                                <p className="text-[8px] font-bold text-slate-400 uppercase mt-1 tracking-tighter">Base: ₹{parseFloat(s.base_wage || 0).toLocaleString()}</p>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {memberSummary.length === 0 && (
                            <div className="py-20 text-center text-slate-300">
                                <FaFileAlt size={48} className="mx-auto mb-4 opacity-20" />
                                <p className="text-sm font-black uppercase tracking-widest">No summary data available</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'shifts' && (
                    <ShiftManager
                        shifts={shifts}
                        onAdd={(data) => createShift({ ...data, sector: SECTOR }).then(fetchData)}
                        onDelete={(id) => deleteShift(id).then(fetchData)}
                    />
                )}

                {activeTab === 'calendar' && (
                    <CalendarManager
                        holidays={holidays}
                        onAdd={(data) => createHoliday({ ...data, sector: SECTOR }).then(fetchData)}
                        onDelete={(id) => deleteHoliday(id).then(fetchData)}
                    />
                )}

                {activeTab === 'members' && (
                    <MemberManager shifts={shifts} onUpdate={fetchData} />
                )}

            </main>

            {/* Modals */}
            {showProjectManager && (
                <ProjectManager
                    projects={projects}
                    onCreate={name => createProject({ name, sector: SECTOR }).then(fetchData)}
                    onDelete={id => deleteProject(id).then(fetchData)}
                    onClose={() => setShowProjectManager(false)}
                />
            )}

            {showRoleManager && (
                <RoleManager
                    roles={roles}
                    onCreate={(data) => createMemberRole({ ...data, sector: SECTOR }).then(fetchData)}
                    onDelete={(id) => deleteMemberRole(id, { sector: SECTOR }).then(fetchData)}
                    onClose={() => setShowRoleManager(false)}
                    onRefresh={fetchData}
                />
            )}

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
                title={confirmModal.label}
                message={confirmModal.message || "Are you sure?"}
                onConfirm={() => {
                    if (confirmModal.onConfirm) confirmModal.onConfirm();
                    setConfirmModal({ ...confirmModal, show: false });
                }}
                onCancel={() => setConfirmModal({ ...confirmModal, show: false })}
            />
        </div>
    );
};

export default HotelAttendance;
