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
import ExportButtons from '../../components/Common/ExportButtons';
import ProjectManager from '../../components/Manufacturing/ProjectManager';
import MemberManager from '../../components/Hotel/MemberManager'; // Using Hotel specific Member Manager
import RoleManager from '../../components/IT/RoleManager'; // Reusing IT Role Manager
import CalendarManager from '../../pages/ManufacturingSector/AttendanceTracker/CalendarManager';
import ShiftManager from '../../pages/ManufacturingSector/AttendanceTracker/ShiftManager';

const SECTOR = 'hotel';

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
        { id: 'present', label: 'Present', icon: FaCheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100' },
        { id: 'absent', label: 'Absent', icon: FaTimesCircle, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100' },
        { id: 'late', label: 'Late', icon: FaClock, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100' },
        { id: 'half-day', label: 'Half Day', icon: FaExclamationCircle, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100' },
        { id: 'week_off', label: 'Week Off', icon: FaCalendarAlt, color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-100' },
        { id: 'holiday', label: 'Holiday', icon: FaCalendarAlt, color: 'text-pink-500', bg: 'bg-pink-50', border: 'border-pink-100' },
        { id: 'overtime', label: 'Overtime', icon: FaBusinessTime, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-100' }
    ];

    const getHexColor = (status) => {
        switch (status) {
            case 'present': return '#10b981';
            case 'absent': return '#ef4444';
            case 'late': return '#f59e0b';
            case 'half-day': return '#3b82f6';
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
            setProjects(projRes.data);
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

    const handleQuickMark = async (memberId, status) => {
        try {
            const date = periodType === 'day' ? currentPeriod : new Date().toISOString().split('T')[0];
            await quickMarkAttendance({
                member_id: memberId,
                status,
                date,
                project_id: filterProject || null,
                sector: SECTOR
            });
            fetchData();
            toast.success("Updated");
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
        const enrichedData = processAttendanceExportData(attendances, members, { periodType, currentPeriod, filterRole, filterMember, searchQuery });
        exportAttendanceToCSV(enrichedData, `Hotel_Attendance_${currentPeriod}`);
    };

    const handleExportPDF = () => {
        const enrichedData = processAttendanceExportData(attendances, members, { periodType, currentPeriod, filterRole, filterMember, searchQuery });
        exportAttendanceToPDF({ data: enrichedData, period: currentPeriod, filename: `Hotel_Attendance_${currentPeriod}` });
    };

    const handleExportTXT = () => {
        const enrichedData = processAttendanceExportData(attendances, members, { periodType, currentPeriod, filterRole, filterMember, searchQuery });
        exportAttendanceToTXT({ data: enrichedData, period: currentPeriod, filename: `Hotel_Attendance_${currentPeriod}` });
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
                                                <td className="py-4 text-center"><button onClick={() => deleteAttendance(a.id).then(fetchData)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><FaTrash /></button></td>
                                            </tr>
                                        ))}</tbody>
                                    </table></div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'quick' && (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        <div className="lg:col-span-1 space-y-6">
                            {/* Bulk Actions */}
                            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
                                <h4 className="text-sm font-black text-slate-800 mb-4">Bulk Actions</h4>
                                <div className="space-y-2">
                                    <button onClick={() => handleBulkMark('present')} className="w-full py-3 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-xs uppercase tracking-wide hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2">Mark All Present</button>
                                    <button onClick={() => handleBulkMark('week_off')} className="w-full py-3 bg-slate-50 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-wide hover:bg-slate-100 transition-colors flex items-center justify-center gap-2">Mark Weekend</button>
                                    <button onClick={() => handleBulkMark('holiday')} className="w-full py-3 bg-pink-50 text-pink-600 rounded-xl font-bold text-xs uppercase tracking-wide hover:bg-pink-100 transition-colors flex items-center justify-center gap-2">Mark Holiday</button>
                                </div>
                            </div>
                        </div>
                        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {members.map(m => (
                                <div key={m.id} className="p-4 bg-white border border-slate-100 rounded-[24px] flex items-center justify-between group hover:shadow-lg transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center font-black text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors uppercase">{(m.name || 'U').charAt(0)}</div>
                                        <div><p className="font-black text-xs text-slate-700">{m.name}</p><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{m.role || 'Staff'}</p></div>
                                    </div>
                                    <div className="flex gap-1">
                                        {['present', 'absent', 'late', 'overtime'].map(st => (
                                            <button
                                                key={st}
                                                onClick={() => handleQuickMark(m.id, st)}
                                                title={st}
                                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${attendances.find(a => a.member_id === m.id && a.date.startsWith(currentPeriod))?.status === st ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-300 hover:bg-slate-100'}`}
                                            >
                                                {st === 'present' && <FaCheckCircle size={14} />}
                                                {st === 'absent' && <FaTimesCircle size={14} />}
                                                {st === 'late' && <FaClock size={14} />}
                                                {st === 'overtime' && <FaBusinessTime size={14} />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'summary' && (
                    <div className="bg-white rounded-[32px] p-8 shadow-xl border border-slate-100">
                        <div className="overflow-x-auto"><table className="w-full text-left border-separate border-spacing-y-3">
                            <thead><tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                <th className="pb-4 pl-4">Member</th>
                                <th className="pb-4 text-emerald-600">Present</th>
                                <th className="pb-4 text-red-600">Absent</th>
                                <th className="pb-4 text-blue-600">Hours</th>
                                <th className="pb-4 text-slate-600">Est. Pay</th>
                                <th className="pb-4 text-blue-600">Performance</th>
                            </tr></thead>
                            <tbody>{memberSummary.map(s => {
                                const pay = s.wage_type === 'monthly' ? parseFloat(s.daily_wage || 0) :
                                    s.wage_type === 'hourly' ? (parseFloat(s.total_hours_worked || 0) * parseFloat(s.daily_wage || 0)) :
                                        (s.present * parseFloat(s.daily_wage || 0));
                                return (
                                    <tr key={s.id} className="bg-slate-50/50 rounded-2xl">
                                        <td className="py-4 pl-4 font-black text-xs text-slate-700">
                                            {s.name} <span className="text-[9px] text-slate-400 font-bold uppercase">({s.role})</span>
                                        </td>
                                        <td className="py-4 font-black text-emerald-600 text-xs">{s.present}</td>
                                        <td className="py-4 font-black text-red-600 text-xs">{s.absent}</td>
                                        <td className="py-4 font-bold text-slate-600 text-xs">{s.total_hours_worked ? parseFloat(s.total_hours_worked).toFixed(1) : '-'}</td>
                                        <td className="py-4 font-black text-slate-700 text-xs">₹{pay.toLocaleString()} <span className="text-[8px] text-slate-400 uppercase font-bold">{s.wage_type}</span></td>
                                        <td className="py-4 pr-4"><div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-blue-500" style={{ width: `${(s.present / ((s.present + s.absent) || 1)) * 100}%` }}></div></div></td>
                                    </tr>
                                )
                            })}</tbody>
                        </table></div>
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

            <ConfirmModal
                show={confirmModal.show}
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
