import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from '../../components/modals/ConfirmModal';
import {
    getAttendances as getEduAttendances,
    updateAttendance as updateEduAttendance,
    deleteAttendance as deleteEduAttendance,
    getAttendanceStats as getEduAttendanceStats,
    getMemberSummary as getEduMemberSummary,
    quickMarkAttendance as quickMarkEduAttendance,
    lockAttendance as lockEduAttendance,
    unlockAttendance as unlockEduAttendance,
    getLockedDates as getEduLockedDates,
    getHolidays as getEduHolidays,
    createHoliday as createEduHoliday,
    deleteHoliday as deleteEduHoliday,
    getShifts as getEduShifts,
    createShift as createEduShift,
    deleteShift as deleteEduShift
} from '../../api/Attendance/eduAttendance';

import {
    getActiveMembers, getMemberRoles, getDepartments,
    createMemberRole, deleteMemberRole, createDepartment, deleteDepartment
} from '../../api/TeamManagement/eduTeam';
import toast from 'react-hot-toast';
import {
    FaCheckCircle, FaTimesCircle, FaClock, FaExclamationCircle,
    FaCalendarAlt, FaSearch,
    FaFilter, FaChartBar, FaUserCheck,
    FaInbox, FaUserEdit,
    FaTag, FaBusinessTime, FaBuilding, FaPlane, FaBriefcaseMedical, FaHome, FaArrowLeft, FaPlus, FaFileAlt
} from 'react-icons/fa';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from 'recharts';
import { exportAttendanceToCSV, exportAttendanceToTXT, exportAttendanceToPDF, processAttendanceExportData } from '../../utils/exportUtils/index.js';
import ExportButtons from '../../components/Common/ExportButtons';
import EducationMemberManager from '../../components/Education/MemberManager';
import RoleManager from '../../components/IT/RoleManager';
import DepartmentManager from '../../components/Education/DepartmentManager';
import EducationShiftManager from './EducationShiftManager';
import EducationCalendarManager from './EducationCalendarManager';

const EducationAttendance = () => {
    const navigate = useNavigate();
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const [attendances, setAttendances] = useState([]);
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);

    const [members, setMembers] = useState([]);
    const [filterMember, setFilterMember] = useState('');
    const [filterDepartment, setFilterDepartment] = useState('');
    const [periodType, setPeriodType] = useState('day');
    const [currentPeriod, setCurrentPeriod] = useState(new Date().toISOString().split('T')[0]);
    const [customRange, setCustomRange] = useState({ start: '', end: '' });
    const [searchQuery, setSearchQuery] = useState('');
    const [memberSummary, setMemberSummary] = useState([]);
    const [activeTab, setActiveTab] = useState('records');

    const [roles, setRoles] = useState([]);
    const [departments, setDepartments] = useState([]); // Add departments state
    const [filterRole, setFilterRole] = useState('');
    const [confirmModal, setConfirmModal] = useState({ show: false, type: null, label: '', id: null });
    const [lockedDates, setLockedDates] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [shifts, setShifts] = useState([]);

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

    const [showRoleManager, setShowRoleManager] = useState(false);
    const [showDeptManager, setShowDeptManager] = useState(false);
    const [showManualAttendance, setShowManualAttendance] = useState(false);
    const [manualAttendanceData, setManualAttendanceData] = useState({
        member_id: '',
        date: new Date().toISOString().split('T')[0],
        status: 'present',
        note: ''
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

    const fetchData = async () => {
        try {
            const isRange = periodType === 'range';
            const rangeStart = isRange ? customRange.start : null;
            const rangeEnd = isRange ? customRange.end : null;

            if (isRange && (!rangeStart || !rangeEnd)) return;

            const [attRes, statsRes, summaryRes, membersRes, roleRes, deptRes, lockRes, holidayRes, shiftRes] = await Promise.all([
                getEduAttendances({
                    memberId: filterMember,
                    period: isRange ? null : currentPeriod,
                    startDate: rangeStart,
                    endDate: rangeEnd,
                    role: filterRole,
                    department: filterDepartment
                }),
                getEduAttendanceStats({
                    memberId: filterMember,
                    period: isRange ? null : currentPeriod,
                    startDate: rangeStart,
                    endDate: rangeEnd,
                    role: filterRole,
                    department: filterDepartment
                }),
                getEduMemberSummary({
                    period: isRange ? null : currentPeriod,
                    startDate: rangeStart,
                    endDate: rangeEnd,
                    department: filterDepartment
                }),
                getActiveMembers({ sector: 'education' }),
                getMemberRoles({ sector: 'education' }),
                getDepartments({ sector: 'education' }),
                getEduLockedDates(new Date(currentPeriod).getMonth() + 1, new Date(currentPeriod).getFullYear()),
                getEduHolidays({ sector: 'education' }),
                getEduShifts({ sector: 'education' })
            ]);
            setAttendances(attRes.data.data);
            setStats(statsRes.data.data || []);
            setMemberSummary(summaryRes.data.data);
            setMembers(membersRes.data.data);
            setRoles(roleRes.data.data);
            setDepartments(deptRes.data.data);
            setLockedDates(lockRes.data.data.filter(d => d.is_locked).map(d => new Date(d.date).toISOString().split('T')[0]));
            setHolidays(holidayRes.data.data);
            setShifts(shiftRes.data.data);
            setLoading(false);
        } catch (error) {
            toast.error("Failed to fetch attendance data");
            setLoading(false);
        }
    };

    const handleToggleLock = async () => {
        if (!currentPeriod || periodType !== 'day') {
            toast.error("Please select a specific day to lock/unlock");
            return;
        }

        const isCurrentlyLocked = lockedDates.includes(currentPeriod);
        try {
            if (isCurrentlyLocked) {
                await unlockEduAttendance(currentPeriod);
                toast.success("Attendance Unlocked");
            } else {
                await lockEduAttendance(currentPeriod);
                toast.success("Attendance Locked");
            }
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Action failed");
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
    }, [currentPeriod, filterMember, periodType, customRange.start, customRange.end]);

    const handleBulkMark = (status) => {
        if (!currentPeriod || periodType !== 'day') {
            toast.error("Please switch to 'Day' view to use Quick Actions");
            return;
        }

        const membersToMark = members.filter(m => (!filterDepartment || m.department === filterDepartment) && (!filterRole || m.role === filterRole) && (m.status === 'active'));

        if (membersToMark.length === 0) {
            toast.error("No active members found to mark");
            return;
        }

        setConfirmModal({
            show: true,
            type: 'bulk_mark',
            title: 'Confirm Bulk Action',
            message: `Are you sure you want to mark "${status.replace('_', ' ')}" for ${membersToMark.length} members for ${currentPeriod}?`,
            status: status
        });
    };

    const handleModalConfirm = async () => {
        if (confirmModal.type === 'bulk_mark') {
            const { status } = confirmModal;
            const membersToMark = members.filter(m => (!filterDepartment || m.department === filterDepartment) && (!filterRole || m.role === filterRole) && (m.status === 'active'));

            try {
                const promises = membersToMark.map(member => {
                    return quickMarkEduAttendance({
                        member_id: member.id,
                        date: currentPeriod,
                        status: status,
                        subject: status === 'holiday' ? 'Holiday' : (status === 'week_off' ? 'Weekend' : 'Daily Attendance'),
                        note: status === 'holiday' ? 'Holiday' : (status === 'week_off' ? 'Weekend' : null)
                    });
                });

                await Promise.all(promises);
                toast.success(`Marked ${status} for ${membersToMark.length} members`);
                fetchData();
            } catch (error) {
                console.error("Bulk mark error:", error);
                toast.error("Failed to mark properly");
            }
        }
        setConfirmModal({ show: false, type: null });
    };

    const handleTimeLogUpdate = async (memberId, field, value) => {
        const todayRecord = attendances.find(a => a.member_id === memberId && new Date(a.date).toDateString() === new Date(currentPeriod).toDateString());

        let checkIn = todayRecord?.check_in || '09:00:00';
        let checkOut = todayRecord?.check_out || '18:00:00';

        if (field === 'check_in') checkIn = value;
        if (field === 'check_out') checkOut = value;

        // Calculate total hours
        const [h1, m1] = checkIn.split(':').map(Number);
        const [h2, m2] = checkOut.split(':').map(Number);
        const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
        const totalHours = Math.max(0, diff / 60).toFixed(2);

        try {
            const res = await quickMarkEduAttendance({
                member_id: memberId,
                date: currentPeriod,
                check_in: checkIn,
                check_out: checkOut,
                total_hours: totalHours,
                status: todayRecord?.status || 'present'
            });
            if (res.data.success === false) {
                toast.error(res.data.message);
            } else {
                fetchData();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update time");
        }
    };

    const handleOvertimeSubmit = async () => {
        const { member_id, start_hour, start_minute, start_period, end_hour, end_minute, end_period, reason, attendance_id } = overtimeModalData;
        const duration = `${start_hour}:${start_minute} ${start_period} - ${end_hour}:${end_minute} ${end_period}`;

        try {
            await quickMarkEduAttendance({
                member_id,
                date: currentPeriod,
                overtime_duration: duration,
                overtime_reason: reason,
                status: attendances.find(a => a.id === attendance_id)?.status || 'present'
            });
            toast.success("Overtime updated");
            setShowOvertimeModal(false);
            fetchData();
        } catch (err) {
            toast.error("Failed to update overtime");
        }
    };

    const handleWorkDoneSubmit = async () => {
        const { member_id, note, attendance_id } = workDoneModalData;

        try {
            await quickMarkEduAttendance({
                member_id,
                date: currentPeriod,
                note: note,
                status: attendances.find(a => a.id === attendance_id)?.status || 'present'
            });
            toast.success("Note updated");
            setShowWorkDoneModal(false);
            fetchData();
        } catch (err) {
            toast.error("Failed to update note");
        }
    };

    const filteredAttendances = useMemo(() => {
        return attendances.filter(a => {
            const d = new Date(a.date);
            const dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
            const matchesSearch = (a.subject || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (a.member_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                dateStr.includes(searchQuery);
            const matchesRole = !filterRole || a.role === filterRole;
            const matchesDept = !filterDepartment || (a.department && a.department.includes(filterDepartment));
            return matchesSearch && matchesRole && matchesDept;
        });
    }, [attendances, searchQuery, filterRole, filterDepartment]);

    const pieData = stats.map(s => {
        const option = statusOptions.find(o => o.id === s.status);
        return {
            name: option ? option.label : s.status,
            value: s.count,
            color: option ? getHexColor(s.status) : '#ccc'
        };
    });

    const uniqueDepartments = useMemo(() => [...new Set(members.map(m => m.department).filter(Boolean))], [members]);

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-slate-50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f8fafc] font-['Outfit'] text-slate-900 overflow-x-hidden">
            <div className="fixed top-0 left-0 w-full h-80 bg-linear-to-b from-blue-50/50 to-transparent pointer-events-none -z-10"></div>

            <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-40 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/education-sector')}
                                className="w-10 h-10 sm:w-12 sm:h-12 bg-white border border-slate-200 rounded-xl sm:rounded-2xl flex items-center justify-center text-slate-500 hover:text-slate-900 hover:border-slate-300 hover:shadow-md transition-all duration-300 group"
                            >
                                <FaArrowLeft className="text-base sm:text-lg group-hover:-translate-x-1 transition-transform" />
                            </button>
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-linear-to-br from-blue-500 to-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                                <FaUserCheck className="text-white text-lg sm:text-xl" />
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Attendance</h1>
                                <p className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest">Education Sector</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {/* Export Buttons */}
                            <ExportButtons
                                onExportCSV={() => {
                                    if (activeTab === 'summary') {
                                        if (memberSummary.length === 0) return toast.error("No data available to export");
                                        const headers = ['Staff Name', 'Present', 'Absent', 'Half Day', 'Leaves (CL/SL/EL)', 'Total %'];
                                        const rows = memberSummary.map(m => {
                                            const totalLeaves = (m.CL || 0) + (m.SL || 0) + (m.EL || 0) + (m.OD || 0);
                                            const percentage = m.total > 0 ? ((m.present + (m.half_day * 0.5)) / m.total * 100).toFixed(0) : 0;
                                            return [m.name, m.present, m.absent, m.half_day, totalLeaves > 0 ? totalLeaves : '-', percentage + '%'];
                                        });
                                        import('../../utils/exportUtils/base.js').then(({ generateCSV }) => {
                                            generateCSV(headers, rows, `Attendance_Summary_${currentPeriod}`);
                                        }).catch(err => toast.error("Export failed"));
                                    } else {
                                        const dataToExport = filteredAttendances.length > 0 ? filteredAttendances : attendances;
                                        if (dataToExport.length === 0) return toast.error("No data available to export");
                                        exportAttendanceToCSV(dataToExport, `Education_Attendance_${currentPeriod}`);
                                    }
                                }}
                                onExportPDF={() => {
                                    if (activeTab === 'summary') {
                                        if (memberSummary.length === 0) return toast.error("No data available to export");
                                        const headers = ['Staff Name', 'Present', 'Absent', 'Half Day', 'Leaves', 'Total %'];
                                        const rows = memberSummary.map(m => {
                                            const totalLeaves = (m.CL || 0) + (m.SL || 0) + (m.EL || 0) + (m.OD || 0);
                                            const percentage = m.total > 0 ? ((m.present + (m.half_day * 0.5)) / m.total * 100).toFixed(0) : 0;
                                            return [m.name, m.present, m.absent, m.half_day, totalLeaves > 0 ? totalLeaves : '-', percentage + '%'];
                                        });
                                        import('../../utils/exportUtils/base.js').then(({ generatePDF }) => {
                                            generatePDF({
                                                title: 'Attendance Summary',
                                                period: currentPeriod,
                                                tableHeaders: headers,
                                                tableRows: rows,
                                                filename: `Attendance_Summary_Report_${currentPeriod}`
                                            });
                                        }).catch(err => toast.error("Export failed"));
                                    } else {
                                        const dataToExport = filteredAttendances.length > 0 ? filteredAttendances : attendances;
                                        if (dataToExport.length === 0) return toast.error("No data available to export");
                                        exportAttendanceToPDF({
                                            data: dataToExport,
                                            period: currentPeriod,
                                            filename: `Education_Attendance_${currentPeriod}`
                                        });
                                    }
                                }}
                                onExportTXT={() => {
                                    if (activeTab === 'summary') {
                                        if (memberSummary.length === 0) return toast.error("No data available to export");
                                        const textContent = memberSummary.map(m =>
                                            `${m.name}: Present=${m.present}, Absent=${m.absent}`
                                        ).join('\n');
                                        const blob = new Blob([textContent], { type: 'text/plain' });
                                        const link = document.createElement('a');
                                        link.href = URL.createObjectURL(blob);
                                        link.download = `Attendance_Summary_${currentPeriod}.txt`;
                                        link.click();
                                    } else {
                                        const dataToExport = filteredAttendances.length > 0 ? filteredAttendances : attendances;
                                        if (dataToExport.length === 0) return toast.error("No data available to export");
                                        exportAttendanceToTXT({
                                            data: dataToExport,
                                            period: currentPeriod,
                                            filename: `Education_Attendance_${currentPeriod}`
                                        });
                                    }
                                }}
                            />
                            <div className="flex-1 min-w-[140px] sm:flex-none h-[38px] flex items-center p-1 bg-slate-50 border border-slate-200 rounded-xl shadow-sm overflow-x-auto custom-scrollbar no-scrollbar">
                                {['day', 'month', 'year', 'range'].map((type) => (
                                    <button key={type} onClick={() => setPeriodType(type)} className={`flex-1 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${periodType === type ? 'bg-white text-blue-600 shadow-sm border border-blue-100' : 'text-slate-400 hover:text-slate-600'}`}>{type}</button>
                                ))}
                            </div>
                            <div className="flex-1 min-w-[140px] h-[38px] flex items-center bg-white border border-slate-200 px-3 rounded-xl shadow-sm hover:border-blue-500 transition-colors">
                                {periodType === 'day' ? <input type="date" value={currentPeriod} onChange={(e) => setCurrentPeriod(e.target.value)} className="w-full text-[11px] font-bold text-slate-700 outline-none bg-transparent" /> : null}
                                {periodType === 'month' ? <input type="month" value={currentPeriod} onChange={(e) => setCurrentPeriod(e.target.value)} className="w-full text-[11px] font-bold text-slate-700 outline-none bg-transparent" /> : null}
                                {periodType === 'year' ? <input type="number" value={currentPeriod} onChange={(e) => setCurrentPeriod(e.target.value)} className="w-full text-[11px] font-bold text-slate-700 outline-none bg-transparent" /> : null}
                                {periodType === 'range' && (
                                    <div className="flex items-center gap-2">
                                        <div className="flex flex-col">
                                            <span className="text-[7px] font-black text-slate-400 uppercase leading-none mb-0.5">Start</span>
                                            <input type="date" value={customRange.start} onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })} className="text-[10px] font-bold text-slate-700 outline-none bg-transparent h-3 w-20" />
                                        </div>
                                        <div className="w-px h-6 bg-slate-200"></div>
                                        <div className="flex flex-col">
                                            <span className="text-[7px] font-black text-slate-400 uppercase leading-none mb-0.5">End</span>
                                            <input type="date" value={customRange.end} onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })} className="text-[10px] font-bold text-slate-700 outline-none bg-transparent h-3 w-20" />
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="w-full sm:w-auto flex items-center gap-2">
                                <div className="flex items-center gap-1 group">
                                    <select value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)} className="h-[38px] bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 outline-none px-3 cursor-pointer">
                                        <option value="">All Depts</option>
                                        {[...new Set([...departments.map(d => d.name), ...uniqueDepartments])].map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                    <button onClick={() => setShowDeptManager(true)} className="h-[38px] w-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-orange-600 hover:border-orange-200 transition-all shadow-xs shrink-0"><FaPlus size={10} /></button>
                                </div>
                                <div className="flex items-center gap-1 group">
                                    <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="h-[38px] bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 outline-none px-3 cursor-pointer">
                                        <option value="">All Roles</option>
                                        {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                                    </select>
                                    <button onClick={() => setShowRoleManager(true)} className="h-[38px] w-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-purple-600 hover:border-purple-200 transition-all shadow-xs shrink-0"><FaPlus size={10} /></button>
                                </div>
                                <button
                                    onClick={() => {
                                        if (activeTab === 'members') {
                                            // Handle scroll to add form in members tab
                                            setActiveTab('members');
                                            setTimeout(() => {
                                                const form = document.querySelector('form');
                                                if (form) form.scrollIntoView({ behavior: 'smooth' });
                                            }, 100);
                                        } else {
                                            setShowManualAttendance(true);
                                        }
                                    }}
                                    className="h-[38px] w-10 sm:w-[48px] sm:h-[48px] bg-blue-600 text-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 shrink-0 ml-2"
                                    title={activeTab === 'members' ? "Register Staff" : "Add Attendance"}
                                >
                                    <FaPlus className="text-sm sm:text-lg" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner border border-slate-200 w-full sm:w-fit mb-8 overflow-x-auto custom-scrollbar no-scrollbar">
                    {[
                        { id: 'records', label: 'Records' },
                        { id: 'summary', label: 'Summary' },
                        { id: 'daily', label: 'Daily Sheet' },
                        { id: 'shifts', label: 'Shifts & Rules' },
                        { id: 'calendar', label: 'Calendar' },
                        { id: 'members', label: 'Manage Staff' }
                    ].map(tab => (
                        <button 
                            key={tab.id} 
                            id={`tab-${tab.id}`}
                            data-tab-id={tab.id}
                            onClick={() => setActiveTab(tab.id)} 
                            className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === 'daily' && (
                    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
                        {/* Dark Design Header */}
                        <div className="bg-[#0f172a] rounded-[32px] p-8 text-white shadow-xl shadow-slate-200/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
                            <div className="relative z-10">
                                <h2 className="text-3xl font-black tracking-tight mb-2 text-white flex items-center gap-4">
                                    Attendance Tracker
                                    {lockedDates.includes(currentPeriod) && (
                                        <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] px-3 py-1 rounded-full uppercase tracking-widest font-black">Locked</span>
                                    )}
                                </h2>
                                <div className="flex items-center gap-3 text-slate-400 font-bold uppercase tracking-widest text-xs">
                                    <FaCalendarAlt className="text-blue-500" />
                                    {new Date(currentPeriod).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 relative z-10">
                                <div className="bg-white/5 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 flex flex-col items-center min-w-[120px]">
                                    <p className="text-[9px] text-blue-300 font-black uppercase tracking-widest mb-1">Total Staff</p>
                                    <p className="font-black text-white text-xl">{members.filter(m => m.status === 'active').length}</p>
                                </div>
                                <div className="bg-white/5 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 flex flex-col items-center min-w-[120px]">
                                    <p className="text-[9px] text-emerald-400 font-black uppercase tracking-widest mb-1">Present Today</p>
                                    <p className="font-black text-white text-xl">
                                        {attendances.filter(a => new Date(a.date).toDateString() === new Date(currentPeriod).toDateString() && ['present', 'late', 'permission'].includes(a.status)).length}
                                    </p>
                                </div>
                                {currentUser.role === 'owner' && (
                                    <button
                                        onClick={handleToggleLock}
                                        className={`px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 ${lockedDates.includes(currentPeriod)
                                            ? 'bg-emerald-500 text-white shadow-emerald-500/20 hover:bg-emerald-600'
                                            : 'bg-red-500 text-white shadow-red-500/20 hover:bg-red-600'
                                            }`}
                                    >
                                        {lockedDates.includes(currentPeriod) ? 'Unlock Sheet' : 'Lock Sheet'}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Bulk Action Toolbar */}
                        <div className="px-8 py-6 bg-white border border-slate-200 rounded-[28px] shadow-sm flex flex-wrap items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-50 rounded-2xl">
                                    <FaFilter className="text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Quick Filters</p>
                                    <p className="text-sm font-bold text-slate-900">Batch Marking Mode</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <button
                                    onClick={() => handleBulkMark('present')}
                                    className="px-6 py-3 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all flex items-center gap-2 active:scale-95"
                                >
                                    <FaCheckCircle /> Mark All Present
                                </button>
                                <button
                                    onClick={() => handleBulkMark('week_off')}
                                    className="px-6 py-3 bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center gap-2 active:scale-95"
                                >
                                    <FaCalendarAlt /> Mark Weekend
                                </button>
                                <button
                                    onClick={() => handleBulkMark('holiday')}
                                    className="px-6 py-3 bg-rose-50 text-rose-700 border border-rose-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all flex items-center gap-2 active:scale-95"
                                >
                                    <FaTag /> Mark Holiday
                                </button>
                            </div>
                        </div>

                        {/* Enhanced Table */}
                        <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl shadow-slate-200/20 overflow-visible">
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50 border-b border-slate-100">
                                            <th className="p-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[250px]">Member</th>
                                            <th className="p-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[320px]">Status Selection</th>
                                            <th className="p-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[280px]">Time Log</th>
                                            <th className="p-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[150px]">Quick Extras</th>
                                            <th className="p-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[120px]">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {members.filter(m => (!filterDepartment || m.department === filterDepartment) && (!filterRole || m.role === filterRole) && (m.status === 'active')).map(member => {
                                            const todayRecord = attendances.find(a => a.member_id === member.id && new Date(a.date).toDateString() === new Date(currentPeriod).toDateString());
                                            const currentStatus = todayRecord?.status || 'not-marked';
                                            const statusOption = statusOptions.find(o => o.id === currentStatus);

                                            const mark = async (status) => {
                                                try {
                                                    const res = await quickMarkEduAttendance({
                                                        member_id: member.id,
                                                        date: currentPeriod,
                                                        status: status,
                                                        check_in: todayRecord?.check_in || '09:00:00',
                                                        check_out: todayRecord?.check_out || '18:00:00',
                                                        total_hours: todayRecord?.total_hours || '9.00'
                                                    });
                                                    if (res.data.success === false) {
                                                        toast.error(res.data.message);
                                                    } else {
                                                        toast.success(`Marked ${status}`);
                                                        fetchData();
                                                    }
                                                } catch (err) {
                                                    toast.error(err.response?.data?.message || "Failed to mark");
                                                }
                                            };

                                            return (
                                                <tr key={member.id} className="hover:bg-slate-50/50 transition-colors group">
                                                    {/* Member Info */}
                                                    <td className="p-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 bg-linear-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center font-black text-slate-400 border border-white shadow-sm ring-1 ring-slate-100">
                                                                {member.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-black text-slate-900 text-sm whitespace-nowrap">{member.name}</h4>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">{member.role}</span>
                                                                    <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                                                                    <span className="text-[9px] font-black uppercase tracking-wider text-blue-500/70">{member.department}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Status Selection */}
                                                    <td className="p-6">
                                                        <div className="flex flex-wrap justify-center gap-1.5 max-w-[320px] mx-auto">
                                                            {statusOptions.slice(0, 8).map(opt => (
                                                                <button
                                                                    key={opt.id}
                                                                    onClick={() => mark(opt.id)}
                                                                    title={opt.label}
                                                                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-black transition-all shadow-sm active:scale-90 ${currentStatus === opt.id ? `${opt.bg} ${opt.color} ring-2 ring-offset-2 ${opt.border.replace('border', 'ring')}` : 'bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-100'}`}
                                                                >
                                                                    {opt.id === 'present' ? 'P' : opt.id === 'absent' ? 'A' : opt.id === 'half-day' ? 'HD' : opt.id === 'late' ? 'L' : opt.id}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </td>

                                                    {/* Time Log */}
                                                    <td className="p-6">
                                                        <div className="flex items-center justify-center gap-3">
                                                            <div className="relative">
                                                                <p className="absolute -top-4 left-0 text-[8px] font-black text-slate-400 uppercase tracking-widest">In</p>
                                                                <input
                                                                    type="time"
                                                                    value={todayRecord?.check_in || '09:00'}
                                                                    onChange={(e) => handleTimeLogUpdate(member.id, 'check_in', e.target.value)}
                                                                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[11px] font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                                                />
                                                            </div>
                                                            <div className="w-2 h-px bg-slate-300 mt-2"></div>
                                                            <div className="relative">
                                                                <p className="absolute -top-4 left-0 text-[8px] font-black text-slate-400 uppercase tracking-widest">Out</p>
                                                                <input
                                                                    type="time"
                                                                    value={todayRecord?.check_out || '18:00'}
                                                                    onChange={(e) => handleTimeLogUpdate(member.id, 'check_out', e.target.value)}
                                                                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[11px] font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                                                />
                                                            </div>
                                                            <div className="ml-2 flex flex-col items-center">
                                                                <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest mb-0.5">Total</p>
                                                                <span className="text-[12px] font-black text-slate-900">{todayRecord?.total_hours || '0.00'}h</span>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Quick Extras */}
                                                    <td className="p-6">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                onClick={() => {
                                                                    const currentReason = todayRecord?.permission_reason || '';
                                                                    const [startStr, endStr] = (todayRecord?.permission_duration || '09:00 AM - 10:00 AM').split(' - ');
                                                                    const parseTime = (str) => {
                                                                        const [time, period] = (str || '').split(' ');
                                                                        const [h, m] = (time || '09:00').split(':');
                                                                        return { h: h || '09', m: m || '00', p: period || 'AM' };
                                                                    };
                                                                    const start = parseTime(startStr);
                                                                    const end = parseTime(endStr);
                                                                    setPermissionModalData({
                                                                        member_id: member.id,
                                                                        member_name: member.name,
                                                                        status: 'permission',
                                                                        start_hour: start.h,
                                                                        start_minute: start.m,
                                                                        start_period: start.p,
                                                                        end_hour: end.h,
                                                                        end_minute: end.m,
                                                                        end_period: end.p,
                                                                        reason: currentReason,
                                                                        attendance_id: todayRecord?.id
                                                                    });
                                                                    setShowPermissionModal(true);
                                                                }}
                                                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm ${todayRecord?.permission_duration ? 'bg-purple-600 text-white shadow-purple-200' : 'bg-slate-50 text-slate-400 hover:bg-purple-50 hover:text-purple-600 border border-slate-100'}`}
                                                                title="Add Permission"
                                                            >
                                                                <FaBusinessTime />
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    const currentReason = todayRecord?.overtime_reason || '';
                                                                    const [startStr, endStr] = (todayRecord?.overtime_duration || '05:00 PM - 07:00 PM').split(' - ');
                                                                    const parseTime = (str) => {
                                                                        const [time, period] = (str || '').split(' ');
                                                                        const [h, m] = (time || '05:00').split(':');
                                                                        return { h: h || '05', m: m || '00', p: period || 'PM' };
                                                                    };
                                                                    const start = parseTime(startStr);
                                                                    const end = parseTime(endStr);
                                                                    setOvertimeModalData({
                                                                        member_id: member.id,
                                                                        member_name: member.name,
                                                                        status: 'overtime',
                                                                        start_hour: start.h,
                                                                        start_minute: start.m,
                                                                        start_period: start.p,
                                                                        end_hour: end.h,
                                                                        end_minute: end.m,
                                                                        end_period: end.p,
                                                                        reason: currentReason,
                                                                        attendance_id: todayRecord?.id
                                                                    });
                                                                    setShowOvertimeModal(true);
                                                                }}
                                                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm ${todayRecord?.overtime_duration ? 'bg-orange-600 text-white shadow-orange-200' : 'bg-slate-50 text-slate-400 hover:bg-orange-50 hover:text-orange-600 border border-slate-100'}`}
                                                                title="Add Overtime"
                                                            >
                                                                <FaClock />
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setWorkDoneModalData({
                                                                        member_id: member.id,
                                                                        member_name: member.name,
                                                                        status: todayRecord?.status || 'present',
                                                                        note: todayRecord?.note || '',
                                                                        attendance_id: todayRecord?.id
                                                                    });
                                                                    setShowWorkDoneModal(true);
                                                                }}
                                                                className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 border border-slate-100 flex items-center justify-center transition-all shadow-sm"
                                                                title="Add Note"
                                                            >
                                                                <FaFileAlt />
                                                            </button>
                                                        </div>
                                                    </td>

                                                    {/* Status Badge */}
                                                    <td className="p-6 text-center">
                                                        <div className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2 shadow-sm ${statusOption ? `${statusOption.bg} ${statusOption.color} border ${statusOption.border}` : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
                                                            {statusOption ? (
                                                                <>
                                                                    <statusOption.icon className="text-xs" />
                                                                    {statusOption.label}
                                                                </>
                                                            ) : (
                                                                <span>Not Marked</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'records' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 h-80">
                                <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2"><FaChartBar className="text-blue-500" /> Stats</h3>
                                <div className="h-48">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                                {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 min-h-[500px]">
                                <h3 className="text-lg font-black text-slate-900 mb-6">Recent Records</h3>
                                <div className="space-y-4">
                                    {filteredAttendances.length > 0 ? filteredAttendances.map((item, idx) => {
                                        const option = statusOptions.find(o => o.id === item.status);
                                        return (
                                            <div key={item.id} className="p-4 bg-white border border-slate-100 rounded-2xl flex justify-between items-center hover:shadow-md transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 ${option?.bg} ${option?.color} rounded-xl flex items-center justify-center text-lg`}>{option && <option.icon />}</div>
                                                    <div>
                                                        <h4 className="font-black text-slate-900 text-sm">{item.member_name}</h4>
                                                        <div className="flex gap-2 text-[10px] text-slate-400 font-bold uppercase">
                                                            <span>{new Date(item.date).toLocaleDateString()}</span>
                                                            <span className={`px-2 rounded-full ${option?.bg} ${option?.color}`}>{option?.label}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }) : <div className="text-center text-slate-300 py-10">No records found</div>}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'summary' && (
                    <div className="bg-white rounded-[32px] shadow-xl border border-slate-100 p-8">
                        <h3 className="text-lg font-black text-slate-900 mb-6">Staff Performance Summary</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest ">
                                        <th className="py-5 pl-4">Staff Member</th>
                                        <th className="py-5 text-center text-emerald-500">P</th>
                                        <th className="py-5 text-center text-red-500">A</th>
                                        <th className="py-5 text-center text-blue-500">HD</th>
                                        <th className="py-5 text-center text-amber-500">LV</th>
                                        <th className="py-5 text-center text-purple-500">HOL</th>
                                        <th className="py-5 text-center text-slate-900">Performance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                        {memberSummary.map(m => {
                                            const presentDays = Number(m.present || 0);
                                            const halfDays = Number(m.half_day || 0);
                                            const totalActive = Number(m.total || 0) - Number(m.holiday || 0) - Number(m.week_off || 0);
                                            const utilization = totalActive > 0 ? (((presentDays + (halfDays * 0.5)) / totalActive) * 100).toFixed(0) : 0;
                                            
                                            return (
                                                <tr key={m.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-all group">
                                                    <td className="py-5 pl-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-slate-100 to-slate-200 flex items-center justify-center font-black text-slate-500 text-xs shadow-sm group-hover:scale-110 transition-transform">
                                                                {m.name?.[0]}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-black text-slate-900 text-sm tracking-tight">{m.name}</h4>
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{m.role || 'Staff'}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-5 text-center">
                                                        <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 font-black text-xs inline-flex items-center justify-center shadow-sm">{m.present || 0}</span>
                                                    </td>
                                                    <td className="py-5 text-center">
                                                        <span className="w-8 h-8 rounded-lg bg-red-50 text-red-600 font-black text-xs inline-flex items-center justify-center shadow-sm">{m.absent || 0}</span>
                                                    </td>
                                                    <td className="py-5 text-center">
                                                        <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 font-black text-xs inline-flex items-center justify-center shadow-sm">{m.half_day || 0}</span>
                                                    </td>
                                                    <td className="py-5 text-center">
                                                        <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 font-black text-xs inline-flex items-center justify-center shadow-sm">{Number(m.CL || 0) + Number(m.SL || 0) + Number(m.EL || 0)}</span>
                                                    </td>
                                                    <td className="py-5 text-center">
                                                        <span className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 font-black text-xs inline-flex items-center justify-center shadow-sm">{m.holiday || 0}</span>
                                                    </td>
                                                    <td className="py-5 text-center">
                                                        <div className="flex flex-col items-center gap-1.5 px-4">
                                                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden shadow-inner">
                                                                <div 
                                                                    className={`h-full transition-all duration-1000 ${utilization >= 90 ? 'bg-emerald-500' : utilization >= 75 ? 'bg-blue-500' : utilization >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                                    style={{ width: `${utilization}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className={`text-[10px] font-black tracking-widest uppercase ${utilization >= 75 ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                                {utilization}% Utilization
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                )}

                {activeTab === 'shifts' && (
                    <EducationShiftManager
                        shifts={shifts}
                        onAdd={(data) => createEduShift({ ...data, sector: 'education' }).then(() => fetchData())}
                        onDelete={(id) => deleteEduShift(id).then(() => fetchData())}
                    />
                )}

                {activeTab === 'calendar' && (
                    <EducationCalendarManager
                        holidays={holidays}
                        onAdd={(data) => createEduHoliday({ ...data, sector: 'education' }).then(() => fetchData())}
                        onDelete={(id) => deleteEduHoliday(id).then(() => fetchData())}
                    />
                )}

                {activeTab === 'members' && <EducationMemberManager onUpdate={fetchData} />}

            </main>

            {/* Generic Confirm Modal */}
            <ConfirmModal
                isOpen={confirmModal.show}
                title={confirmModal.title || "Confirm Action"}
                message={confirmModal.message || "Are you sure?"}
                onConfirm={handleModalConfirm}
                onCancel={() => setConfirmModal({ ...confirmModal, show: false })}
                type={confirmModal.type === 'DELETE' ? 'danger' : 'info'}
                confirmText="Yes, Proceed"
            />


            {showRoleManager && (
                <RoleManager
                    roles={roles}
                    onCreate={(data) => createMemberRole({ ...data, sector: 'education' }).then(() => fetchData())}
                    onDelete={(id) => deleteMemberRole(id, { sector: 'education' }).then(() => fetchData())}
                    onRefresh={fetchData}
                    onClose={() => setShowRoleManager(false)}
                    placeholder="Teacher, Manager, Staff..."
                />
            )}

            {showDeptManager && (
                <DepartmentManager
                    departments={departments}
                    onCreate={(data) => createDepartment({ ...data, sector: 'education' }).then(() => fetchData())}
                    onDelete={(id) => deleteDepartment(id, { sector: 'education' }).then(() => fetchData())}
                    onRefresh={fetchData}
                    onClose={() => setShowDeptManager(false)}
                    placeholder="Math, Science, English..."
                />
            )}

            {/* Permission Modal */}
            {showPermissionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300">
                        <div className="p-8 bg-linear-to-br from-purple-600 to-indigo-700 text-white relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                            <h3 className="text-2xl font-black tracking-tight relative z-10 flex items-center gap-3">
                                <FaBusinessTime className="text-purple-200" />
                                Permission Request
                            </h3>
                            <p className="text-purple-100/80 text-xs font-bold uppercase tracking-widest mt-2 relative z-10">
                                {permissionModalData.member_name}
                            </p>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Start Time</label>
                                    <div className="flex gap-1">
                                        <select value={permissionModalData.start_hour} onChange={e => setPermissionModalData({...permissionModalData, start_hour: e.target.value})} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-purple-500/20">
                                            {Array.from({length: 12}, (_, i) => (i + 1).toString().padStart(2, '0')).map(h => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                        <select value={permissionModalData.start_period} onChange={e => setPermissionModalData({...permissionModalData, start_period: e.target.value})} className="w-16 bg-slate-50 border border-slate-200 rounded-xl px-2 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-purple-500/20">
                                            <option value="AM">AM</option><option value="PM">PM</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">End Time</label>
                                    <div className="flex gap-1">
                                        <select value={permissionModalData.end_hour} onChange={e => setPermissionModalData({...permissionModalData, end_hour: e.target.value})} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-purple-500/20">
                                            {Array.from({length: 12}, (_, i) => (i + 1).toString().padStart(2, '0')).map(h => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                        <select value={permissionModalData.end_period} onChange={e => setPermissionModalData({...permissionModalData, end_period: e.target.value})} className="w-16 bg-slate-50 border border-slate-200 rounded-xl px-2 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-purple-500/20">
                                            <option value="AM">AM</option><option value="PM">PM</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reason</label>
                                <textarea
                                    value={permissionModalData.reason}
                                    onChange={e => setPermissionModalData({...permissionModalData, reason: e.target.value})}
                                    placeholder="Enter permission reason..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-purple-500/20 min-h-[100px] resize-none"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setShowPermissionModal(false)} className="flex-1 px-6 py-4 rounded-2xl bg-slate-100 text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95">Cancel</button>
                                <button
                                    onClick={async () => {
                                        const { member_id, start_hour, start_minute, start_period, end_hour, end_minute, end_period, reason } = permissionModalData;
                                        const duration = `${start_hour}:${start_minute || '00'} ${start_period} - ${end_hour}:${end_minute || '00'} ${end_period}`;
                                        try {
                                            await quickMarkEduAttendance({
                                                member_id,
                                                date: currentPeriod,
                                                status: 'permission',
                                                permission_duration: duration,
                                                permission_reason: reason
                                            });
                                            toast.success("Permission updated");
                                            setShowPermissionModal(false);
                                            fetchData();
                                        } catch (err) { toast.error("Failed to update"); }
                                    }}
                                    className="flex-1 px-6 py-4 rounded-2xl bg-purple-600 text-white font-black text-xs uppercase tracking-widest hover:bg-purple-700 shadow-lg shadow-purple-200 transition-all active:scale-95"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Overtime Modal */}
            {showOvertimeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300">
                        <div className="p-8 bg-linear-to-br from-orange-500 to-red-600 text-white relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                            <h3 className="text-2xl font-black tracking-tight relative z-10 flex items-center gap-3">
                                <FaClock className="text-orange-200" />
                                Overtime Marking
                            </h3>
                            <p className="text-orange-100/80 text-xs font-bold uppercase tracking-widest mt-2 relative z-10">
                                {overtimeModalData.member_name}
                            </p>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">OT Start</label>
                                    <div className="flex gap-1">
                                        <select value={overtimeModalData.start_hour} onChange={e => setOvertimeModalData({...overtimeModalData, start_hour: e.target.value})} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500/20">
                                            {Array.from({length: 12}, (_, i) => (i + 1).toString().padStart(2, '0')).map(h => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                        <select value={overtimeModalData.start_period} onChange={e => setOvertimeModalData({...overtimeModalData, start_period: e.target.value})} className="w-16 bg-slate-50 border border-slate-200 rounded-xl px-2 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500/20">
                                            <option value="AM">AM</option><option value="PM">PM</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">OT End</label>
                                    <div className="flex gap-1">
                                        <select value={overtimeModalData.end_hour} onChange={e => setOvertimeModalData({...overtimeModalData, end_hour: e.target.value})} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500/20">
                                            {Array.from({length: 12}, (_, i) => (i + 1).toString().padStart(2, '0')).map(h => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                        <select value={overtimeModalData.end_period} onChange={e => setOvertimeModalData({...overtimeModalData, end_period: e.target.value})} className="w-16 bg-slate-50 border border-slate-200 rounded-xl px-2 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500/20">
                                            <option value="AM">AM</option><option value="PM">PM</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Work Reason / Description</label>
                                <textarea
                                    value={overtimeModalData.reason}
                                    onChange={e => setOvertimeModalData({...overtimeModalData, reason: e.target.value})}
                                    placeholder="Briefly describe the work done..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500/20 min-h-[100px] resize-none"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setShowOvertimeModal(false)} className="flex-1 px-6 py-4 rounded-2xl bg-slate-100 text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95">Cancel</button>
                                <button onClick={handleOvertimeSubmit} className="flex-1 px-6 py-4 rounded-2xl bg-orange-600 text-white font-black text-xs uppercase tracking-widest hover:bg-orange-700 shadow-lg shadow-orange-200 transition-all active:scale-95">Save OT</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Work Done / Notes Modal */}
            {showWorkDoneModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300">
                        <div className="p-8 bg-linear-to-br from-blue-600 to-indigo-700 text-white relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                            <h3 className="text-2xl font-black tracking-tight relative z-10 flex items-center gap-3">
                                <FaPlus className="text-blue-200" />
                                Work Report / Note
                            </h3>
                            <p className="text-blue-100/80 text-xs font-bold uppercase tracking-widest mt-2 relative z-10">
                                {workDoneModalData.member_name}
                            </p>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Attendance Note</label>
                                <textarea
                                    value={workDoneModalData.note}
                                    onChange={e => setWorkDoneModalData({...workDoneModalData, note: e.target.value})}
                                    placeholder="Enter any work notes or remarks..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 min-h-[150px] resize-none"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setShowWorkDoneModal(false)} className="flex-1 px-6 py-4 rounded-2xl bg-slate-100 text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95">Cancel</button>
                                <button onClick={handleWorkDoneSubmit} className="flex-1 px-6 py-4 rounded-2xl bg-blue-600 text-white font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95">Save Note</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EducationAttendance;
