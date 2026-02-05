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
    deleteAttendance
} from '../../api/Attendance/hotelAttendance';
import { getMembers, getMemberRoles, createMemberRole, deleteMemberRole } from '../../api/TeamManagement/hotelTeam';
import toast from 'react-hot-toast';
import {
    FaCheckCircle, FaTimesCircle, FaClock, FaExclamationCircle,
    FaPlus, FaTrash, FaEdit, FaCalendarAlt, FaSearch,
    FaFilter, FaUserCheck, FaChevronLeft,
    FaFolderPlus, FaTimes, FaUserEdit,
    FaFileAlt, FaTag, FaBusinessTime, FaBriefcase,
    FaChartBar, FaInbox
} from 'react-icons/fa';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from 'recharts';
import { exportAttendanceToCSV, exportAttendanceToTXT, exportAttendanceToPDF, processAttendanceExportData } from '../../utils/exportUtils/index.js';
import ExportButtons from '../../components/Common/ExportButtons';
import ProjectManager from '../../components/Manufacturing/ProjectManager';
import MemberManager from '../../components/IT/MemberManager';
import RoleManager from '../../components/IT/RoleManager';

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
    const [activeTab, setActiveTab] = useState('records'); // 'records', 'summary', 'quick'
    const [showBulkStatusModal, setShowBulkStatusModal] = useState(false);
    const [bulkStatusData, setBulkStatusData] = useState({
        status: '',
        date: '',
        reason: '',
        isRange: false,
        endDate: ''
    });

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
        { id: 'permission', label: 'Permission', icon: FaBusinessTime, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-100' },
        { id: 'week_off', label: 'Week Off', icon: FaCalendarAlt, color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-100' },
        { id: 'holiday', label: 'Holiday', icon: FaCalendarAlt, color: 'text-pink-500', bg: 'bg-pink-50', border: 'border-pink-100' }
    ];

    const getHexColor = (status) => {
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
    };

    const fetchData = async () => {
        try {
            const isRange = periodType === 'range';
            const rangeStart = isRange ? customRange.start : null;
            const rangeEnd = isRange ? customRange.end : null;

            if (isRange && (!rangeStart || !rangeEnd)) return;

            const [attRes, statsRes, summaryRes, projRes, membersRes, roleRes] = await Promise.all([
                getAttendances({ projectId: filterProject, memberId: filterMember, period: isRange ? null : currentPeriod, startDate: rangeStart, endDate: rangeEnd, sector: SECTOR }),
                getAttendanceStats({ projectId: filterProject, memberId: filterMember, period: isRange ? null : currentPeriod, startDate: rangeStart, endDate: rangeEnd, sector: SECTOR }),
                getMemberSummary({ projectId: filterProject, period: isRange ? null : currentPeriod, startDate: rangeStart, endDate: rangeEnd, sector: SECTOR }),
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
            toast.error("Failed to fetch data");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [currentPeriod, filterProject, filterMember, periodType, customRange.start, customRange.end]);

    const handleQuickMark = async (memberId, status, check_in = null, check_out = null) => {
        try {
            const date = periodType === 'day' ? currentPeriod : new Date().toISOString().split('T')[0];
            await quickMarkAttendance({
                member_id: memberId,
                status,
                date,
                project_id: filterProject || null,
                sector: SECTOR,
                check_in,
                check_out
            });
            fetchData();
            toast.success("Updated");
        } catch (error) { toast.error("Failed"); }
    };

    const activeTargetDate = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        if (periodType === 'day') return currentPeriod;
        return today;
    }, [periodType, currentPeriod]);

    const filteredAttendances = useMemo(() => {
        return attendances.filter(a => {
            const matchesSearch = (a.member_name || '').toLowerCase().includes(searchQuery.toLowerCase());
            const matchesRole = !filterRole || memberIdToRoleMap[a.member_id] === filterRole;
            return matchesSearch && matchesRole;
        });
    }, [attendances, searchQuery, filterRole, memberIdToRoleMap]);

    const pieData = stats.map(s => ({
        name: statusOptions.find(o => o.id === s.status)?.label || s.status,
        value: s.count,
        color: getHexColor(s.status)
    }));

    if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div></div>;

    return (
        <div className="min-h-screen bg-[#f8fafc] font-['Outfit'] text-slate-900">
            <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-4">
                            <button onClick={() => navigate('/hotel-sector')} className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all shadow-sm"><FaChevronLeft /></button>
                            <div className="w-12 h-12 bg-linear-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 text-white"><FaUserCheck size={20} /></div>
                            <div>
                                <h1 className="text-2xl font-black tracking-tight">Hotel Attendance</h1>
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Efficiency through consistency</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <div className="flex bg-slate-50 border p-1 rounded-xl">
                                {['day', 'month', 'year', 'range'].map(type => (
                                    <button key={type} onClick={() => setPeriodType(type)} className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase ${periodType === type ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>{type}</button>
                                ))}
                            </div>
                            <input type="date" value={currentPeriod} onChange={e => setCurrentPeriod(e.target.value)} className="bg-white border rounded-xl px-3 py-2 text-xs font-bold" />
                            <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className="bg-white border rounded-xl px-3 py-2 text-xs font-bold appearance-none min-w-[120px]">
                                <option value="">All Departments</option>
                                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            <button onClick={() => setShowProjectManager(true)} className="w-[38px] h-[38px] bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20"><FaPlus /></button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex bg-slate-100 p-1 rounded-xl mb-8 w-fit">
                    {['records', 'summary', 'quick'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}>{tab === 'quick' ? 'Daily Sheet' : tab}</button>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                            <p className="text-blue-100 text-[10px] font-black uppercase tracking-widest mb-2">Total Managed</p>
                            <h4 className="text-4xl font-black mb-4">{members.length} Members</h4>
                            <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden mb-4"><div className="h-full bg-yellow-400" style={{ width: '70%' }}></div></div>
                            <p className="text-sm font-medium text-blue-100 opacity-80">Across {projects.length} Departments</p>
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-[32px] p-8 shadow-xl border border-slate-100 min-h-[600px]">
                            {activeTab === 'records' && (
                                <>
                                    <div className="flex justify-between items-center mb-8">
                                        <h3 className="text-lg font-black tracking-tight">{periodType.toUpperCase()} Records</h3>
                                        <div className="relative"><FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" /><input type="text" placeholder="Search members..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="bg-slate-50 border rounded-xl pl-9 pr-4 py-2 text-xs font-bold outline-none focus:border-blue-500 transition-all" /></div>
                                    </div>
                                    <div className="overflow-x-auto"><table className="w-full text-left border-separate border-spacing-y-3">
                                        <thead><tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest"><th className="pb-4 pl-4">Member</th><th className="pb-4">Date</th><th className="pb-4">Status</th><th className="pb-4 text-center">Actions</th></tr></thead>
                                        <tbody>{filteredAttendances.map(a => (
                                            <tr key={a.id} className="bg-slate-50/50 hover:bg-slate-50 transition-colors rounded-2xl">
                                                <td className="py-4 pl-4 font-black text-xs text-slate-700">{a.member_name}</td>
                                                <td className="py-4 font-bold text-[10px] text-slate-500">{new Date(a.date).toLocaleDateString()}</td>
                                                <td className="py-4">
                                                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${statusOptions.find(o => o.id === a.status)?.bg} ${statusOptions.find(o => o.id === a.status)?.color}`}>{a.status}</span>
                                                </td>
                                                <td className="py-4 text-center"><button onClick={() => deleteAttendance(a.id, { sector: SECTOR }).then(fetchData)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><FaTrash /></button></td>
                                            </tr>
                                        ))}</tbody>
                                    </table></div>
                                </>
                            )}
                            {activeTab === 'quick' && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center bg-blue-50/50 p-6 rounded-3xl border border-blue-100">
                                        <div><h4 className="text-lg font-black text-blue-900">Daily Sheet</h4><p className="text-blue-600/70 text-xs font-bold">Marking for {currentPeriod}</p></div>
                                        <button onClick={() => bulkMarkAttendance({ member_ids: members.map(m => m.id), date: currentPeriod, status: 'present', sector: SECTOR }).then(fetchData)} className="px-6 py-3 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all">Mark All Present</button>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {members.map(m => (
                                            <div key={m.id} className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between group hover:shadow-lg transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center font-black text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors uppercase">{(m.name || 'U').charAt(0)}</div>
                                                    <div><p className="font-black text-xs text-slate-700">{m.name}</p><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{m.role || 'Staff'}</p></div>
                                                </div>
                                                <div className="flex gap-1">
                                                    {['present', 'absent', 'late'].map(st => (
                                                        <button key={st} onClick={() => handleQuickMark(m.id, st)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${attendances.find(a => a.member_id === m.id && a.date.startsWith(currentPeriod))?.status === st ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-300 hover:bg-slate-100'}`}><FaCheckCircle size={14} /></button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {activeTab === 'summary' && (
                                <div className="overflow-x-auto"><table className="w-full text-left border-separate border-spacing-y-3">
                                    <thead><tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest"><th className="pb-4 pl-4">Member</th><th className="pb-4">Present</th><th className="pb-4">Absent</th><th className="pb-4">Performance</th></tr></thead>
                                    <tbody>{memberSummary.map(s => (
                                        <tr key={s.member_id} className="bg-slate-50/50 rounded-2xl">
                                            <td className="py-4 pl-4 font-black text-xs text-slate-700">{s.member_name}</td>
                                            <td className="py-4 font-black text-emerald-600 text-xs">{s.present_days}</td>
                                            <td className="py-4 font-black text-red-600 text-xs">{s.absent_days}</td>
                                            <td className="py-4"><div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500" style={{ width: `${(s.present_days / (s.present_days + s.absent_days || 1)) * 100}%` }}></div></div></td>
                                        </tr>
                                    ))}</tbody>
                                </table></div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {showProjectManager && (
                <ProjectManager
                    projects={projects}
                    onCreate={name => createProject({ name, sector: SECTOR }).then(fetchData)}
                    onDelete={id => deleteProject(id, { sector: SECTOR }).then(fetchData)}
                    onClose={() => setShowProjectManager(false)}
                />
            )}
        </div>
    );
};

export default HotelAttendance;
