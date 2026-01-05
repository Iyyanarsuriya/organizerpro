import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    getAttendances,
    createAttendance,
    updateAttendance,
    deleteAttendance,
    getAttendanceStats,
    getWorkerSummary,
    quickMarkAttendance
} from '../api/attendanceApi';
import { getProjects } from '../api/projectApi';
import { getActiveWorkers } from '../api/workerApi';
import toast from 'react-hot-toast';
import {
    FaCheckCircle, FaTimesCircle, FaClock, FaExclamationCircle,
    FaPlus, FaTrash, FaEdit, FaCalendarAlt, FaSearch,
    FaFilter, FaChartBar, FaUserCheck, FaChevronLeft, FaChevronRight,
    FaFolderPlus, FaTimes, FaInbox, FaUserEdit
} from 'react-icons/fa';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from 'recharts';
import ProjectManager from '../components/ProjectManager';
import WorkerManager from '../components/WorkerManager';

const AttendanceTracker = () => {
    const navigate = useNavigate();
    const [attendances, setAttendances] = useState([]);
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [projects, setProjects] = useState([]);
    const [workers, setWorkers] = useState([]);
    const [showProjectManager, setShowProjectManager] = useState(false);
    const [showWorkerManager, setShowWorkerManager] = useState(false);
    const [filterProject, setFilterProject] = useState('');
    const [filterWorker, setFilterWorker] = useState('');
    const [periodType, setPeriodType] = useState('month'); // 'month', 'year', 'day', 'range'
    const [currentPeriod, setCurrentPeriod] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [customRange, setCustomRange] = useState({ start: '', end: '' });
    const [searchQuery, setSearchQuery] = useState('');
    const [workerSummary, setWorkerSummary] = useState([]);
    const [activeTab, setActiveTab] = useState('records'); // 'records', 'summary', 'quick'

    const [formData, setFormData] = useState({
        subject: '',
        status: 'present',
        date: new Date().toISOString().split('T')[0],
        note: '',
        project_id: '',
        worker_id: ''
    });

    const statusOptions = [
        { id: 'present', label: 'Present', icon: FaCheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100' },
        { id: 'absent', label: 'Absent', icon: FaTimesCircle, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100' },
        { id: 'late', label: 'Late', icon: FaClock, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100' },
        { id: 'half-day', label: 'Half Day', icon: FaExclamationCircle, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100' }
    ];

    const fetchData = async () => {
        try {
            const isRange = periodType === 'range';
            const rangeStart = isRange ? customRange.start : null;
            const rangeEnd = isRange ? customRange.end : null;

            if (isRange && (!rangeStart || !rangeEnd)) return;

            const [attRes, statsRes, summaryRes, projRes, workersRes] = await Promise.all([
                getAttendances({
                    projectId: filterProject,
                    workerId: filterWorker,
                    period: isRange ? null : currentPeriod,
                    startDate: rangeStart,
                    endDate: rangeEnd
                }),
                getAttendanceStats({
                    projectId: filterProject,
                    workerId: filterWorker,
                    period: isRange ? null : currentPeriod,
                    startDate: rangeStart,
                    endDate: rangeEnd
                }),
                getWorkerSummary({
                    projectId: filterProject,
                    period: isRange ? null : currentPeriod,
                    startDate: rangeStart,
                    endDate: rangeEnd
                }),
                getProjects(),
                getActiveWorkers()
            ]);
            setAttendances(attRes.data.data);
            setStats(attRes.data.data.length > 0 ? statsRes.data.data : []);
            setWorkerSummary(summaryRes.data.data);
            setProjects(projRes.data);
            setWorkers(workersRes.data.data);
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
            if (currentPeriod.length !== 4) setCurrentPeriod(`${yyyy}`);
        } else if (periodType === 'month') {
            if (currentPeriod.length !== 7) setCurrentPeriod(`${yyyy}-${mm}`);
        } else if (periodType === 'day') {
            if (currentPeriod.length !== 10) setCurrentPeriod(`${yyyy}-${mm}-${dd}`);
        } else if (periodType === 'range') {
            if (!customRange.start) setCustomRange({ start: `${yyyy}-${mm}-${dd}`, end: `${yyyy}-${mm}-${dd}` });
        }
    }, [periodType]);

    useEffect(() => {
        fetchData();
    }, [currentPeriod, filterProject, filterWorker, periodType, customRange.start, customRange.end]);

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

    const handleQuickMark = async (workerId, status) => {
        try {
            const date = periodType === 'day' ? currentPeriod : new Date().toISOString().split('T')[0];
            await quickMarkAttendance({
                worker_id: workerId,
                status,
                date,
                project_id: filterProject || null,
                subject: `Daily Attendance`
            });
            toast.success("Marked successfully");
            fetchData();
        } catch (error) {
            toast.error("Failed to mark attendance");
        }
    };

    const resetForm = () => {
        setFormData({
            subject: '',
            status: 'present',
            date: new Date().toISOString().split('T')[0],
            note: '',
            project_id: filterProject || '',
            worker_id: ''
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
            worker_id: item.worker_id || ''
        });
        setEditingId(item.id);
        setShowAddModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this record?")) {
            try {
                await deleteAttendance(id);
                toast.success("Record deleted");
                fetchData();
            } catch (error) {
                toast.error("Failed to delete record");
            }
        }
    };

    const filteredAttendances = useMemo(() => {
        return attendances.filter(a =>
            a.subject.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [attendances, searchQuery]);

    const activeWorkersAttendanceMat = useMemo(() => {
        if (periodType !== 'day') return {};
        const map = {};
        attendances.forEach(a => {
            if (a.worker_id) {
                map[a.worker_id] = a.status;
            }
        });
        return map;
    }, [attendances, periodType]);

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
            default: return '#94a3b8';
        }
    }

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-slate-50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 font-['Outfit']">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-linear-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <FaUserCheck className="text-white text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Attendance Tracker</h1>
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Consistency is key</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <div className="h-[40px] flex items-center p-1 bg-white border border-slate-200 rounded-[12px] shadow-sm overflow-x-auto custom-scrollbar">
                                {['day', 'month', 'year', 'range'].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setPeriodType(type)}
                                        className={`h-full px-4 rounded-[8px] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center ${periodType === type ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>

                            <div className="h-[40px] flex items-center bg-white border border-slate-200 px-3 rounded-[12px] shadow-sm hover:border-blue-500 transition-colors">
                                {periodType === 'day' ? (
                                    <input
                                        type="date"
                                        value={currentPeriod.length === 10 ? currentPeriod : ''}
                                        onChange={(e) => setCurrentPeriod(e.target.value)}
                                        className="text-[12px] font-bold text-slate-700 outline-none bg-transparent cursor-pointer font-['Outfit']"
                                    />
                                ) : periodType === 'month' ? (
                                    <input
                                        type="month"
                                        value={currentPeriod.length === 7 ? currentPeriod : ''}
                                        onChange={(e) => setCurrentPeriod(e.target.value)}
                                        className="text-[12px] font-bold text-slate-700 outline-none bg-transparent cursor-pointer font-['Outfit']"
                                    />
                                ) : periodType === 'year' ? (
                                    <input
                                        type="number"
                                        min="2000"
                                        max="2100"
                                        value={currentPeriod.slice(0, 4)}
                                        onChange={(e) => setCurrentPeriod(e.target.value)}
                                        className="text-[12px] font-bold text-slate-700 outline-none bg-transparent cursor-pointer font-['Outfit'] w-[60px]"
                                    />
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="date"
                                            value={customRange.start}
                                            onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })}
                                            className="text-[10px] sm:text-[12px] font-bold text-slate-700 outline-none bg-transparent cursor-pointer font-['Outfit'] w-[85px] sm:w-[100px]"
                                        />
                                        <span className="text-xs text-slate-400">-</span>
                                        <input
                                            type="date"
                                            value={customRange.end}
                                            onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })}
                                            className="text-[10px] sm:text-[12px] font-bold text-slate-700 outline-none bg-transparent cursor-pointer font-['Outfit'] w-[85px] sm:w-[100px]"
                                        />
                                    </div>
                                )}
                            </div>

                            <select
                                value={filterProject}
                                onChange={(e) => setFilterProject(e.target.value)}
                                className="bg-white border border-slate-200 rounded-xl px-4 h-[40px] py-1 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all cursor-pointer shadow-sm"
                            >
                                <option value="">All Projects</option>
                                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>

                            <select
                                value={filterWorker}
                                onChange={(e) => setFilterWorker(e.target.value)}
                                className="bg-white border border-slate-200 rounded-xl px-4 h-[40px] py-1 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all cursor-pointer shadow-sm"
                            >
                                <option value="">All Workers</option>
                                {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                            </select>

                            <button
                                onClick={() => setShowAddModal(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl text-sm font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                            >
                                <FaPlus /> Mark
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* View Selector */}
                <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200 w-fit mb-8 overflow-hidden">
                    {[
                        { id: 'records', label: 'Attendance Records' },
                        { id: 'summary', label: 'Worker Summary' },
                        { id: 'quick', label: 'Daily Sheet' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === 'records' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100">
                                <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
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
                                            <p className="text-xs font-bold uppercase tracking-widest">No data available</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100">
                                <h3 className="text-lg font-black text-slate-900 mb-6">Management</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <button onClick={() => setShowProjectManager(true)} className="p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all group flex flex-col items-center gap-2">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-blue-500 shadow-sm transition-colors">
                                            <FaFolderPlus />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Projects</span>
                                    </button>
                                    <button onClick={() => setShowWorkerManager(true)} className="p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all group flex flex-col items-center gap-2">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-orange-500 shadow-sm transition-colors">
                                            <FaUserCheck />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Workers</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 min-h-[500px]">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                                    <h3 className="text-lg font-black text-slate-900">Recent Records</h3>
                                    <div className="relative flex-1 max-w-xs">
                                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                        <input
                                            type="text"
                                            placeholder="Search subject..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-11 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-['Outfit']"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    {filteredAttendances.length > 0 ? filteredAttendances.map((item) => {
                                        const option = statusOptions.find(o => o.id === item.status);
                                        return (
                                            <div key={item.id} className="group p-4 bg-white border border-slate-100 rounded-2xl hover:shadow-lg hover:border-blue-500/20 transition-all">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-12 h-12 ${option?.bg} rounded-xl flex items-center justify-center text-xl ${option?.color}`}>
                                                            {option && <option.icon />}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h4 className="font-black text-slate-900 leading-tight">{item.subject}</h4>
                                                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter ${option?.bg} ${option?.color} border ${option?.border}`}>
                                                                    {option?.label}
                                                                </span>
                                                            </div>
                                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 font-bold uppercase tracking-wider">
                                                                <span className="flex items-center gap-1.5">
                                                                    <FaCalendarAlt className="text-[10px]" />
                                                                    {new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                                </span>
                                                                {item.project_name && <span className="flex items-center gap-1.5 text-blue-500"><FaFilter className="text-[10px]" />{item.project_name}</span>}
                                                                {item.worker_name && <span className="flex items-center gap-1.5 text-orange-500 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100"><FaUserCheck className="text-[10px]" />{item.worker_name}</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => handleEdit(item)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"><FaEdit /></button>
                                                        <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><FaTrash /></button>
                                                    </div>
                                                </div>
                                                {item.note && <div className="mt-4 pt-4 border-t border-slate-50 italic text-slate-500 text-xs text-left">"{item.note}"</div>}
                                            </div>
                                        );
                                    }) : (
                                        <div className="py-20 flex flex-col items-center justify-center text-slate-300">
                                            <FaInbox className="text-6xl mb-4 opacity-10" />
                                            <p className="text-sm font-black uppercase tracking-widest">No records found</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : activeTab === 'summary' ? (
                    <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in duration-500">
                        <div className="p-8 border-b border-slate-100">
                            <h3 className="text-lg font-black text-slate-900">Worker Attendance Summary</h3>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Aggregate statistics for the selected period</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Worker Name</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-emerald-500 text-center">Present</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-red-500 text-center">Absent</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-amber-500 text-center">Late</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-blue-500 text-center">Half Day</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-900 text-center">Total</th>
                                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Attendance %</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {workerSummary.map((w) => {
                                        const attendanceRate = w.total > 0 ? ((w.present + w.half_day * 0.5) / w.total * 100).toFixed(1) : '0.0';
                                        return (
                                            <tr key={w.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-8 py-5"><span className="font-black text-slate-700">{w.name}</span></td>
                                                <td className="px-6 py-5 text-center"><span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full font-black text-xs">{w.present}</span></td>
                                                <td className="px-6 py-5 text-center"><span className="px-3 py-1 bg-red-50 text-red-600 rounded-full font-black text-xs">{w.absent}</span></td>
                                                <td className="px-6 py-5 text-center"><span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full font-black text-xs">{w.late}</span></td>
                                                <td className="px-6 py-5 text-center"><span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full font-black text-xs">{w.half_day}</span></td>
                                                <td className="px-6 py-5 text-center"><span className="font-black text-slate-900">{w.total}</span></td>
                                                <td className="px-8 py-5 text-right">
                                                    <div className="flex items-center justify-end gap-3">
                                                        <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                            <div className={`h-full rounded-full transition-all duration-1000 ${parseFloat(attendanceRate) >= 90 ? 'bg-emerald-500' : parseFloat(attendanceRate) >= 75 ? 'bg-blue-500' : parseFloat(attendanceRate) >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${attendanceRate}%` }}></div>
                                                        </div>
                                                        <span className="font-black text-slate-700 text-xs min-w-12 text-right">{attendanceRate}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {workerSummary.length === 0 && (
                                        <tr><td colSpan="7" className="px-8 py-20 text-center text-slate-400"><FaInbox className="text-4xl mx-auto mb-4 opacity-20" /><p className="font-black uppercase tracking-widest text-xs">No workers found</p></td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    /* Daily Quick Mark View */
                    <div className="bg-white rounded-[40px] shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="p-8 sm:p-12 border-b border-slate-100 bg-linear-to-br from-slate-900 to-slate-800 text-white">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                <div>
                                    <h3 className="text-2xl font-black mb-2">Daily Attendance Sheet</h3>
                                    <div className="flex items-center gap-3">
                                        <FaCalendarAlt className="text-blue-400" />
                                        <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">
                                            {periodType === 'day' ? new Date(currentPeriod).toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) : 'Please select a specific day to use the sheet'}
                                        </span>
                                    </div>
                                </div>
                                {periodType === 'day' && (
                                    <div className="bg-white/10 px-6 py-3 rounded-2xl border border-white/10 backdrop-blur-md">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-300 mb-1">Marking Mode</p>
                                        <p className="text-sm font-black">Single Click Upsert</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {periodType === 'day' ? (
                            <div className="p-8 sm:p-12">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {workers.map(w => {
                                        const currentStatus = activeWorkersAttendanceMat[w.id];
                                        return (
                                            <div key={w.id} className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 hover:border-blue-500/20 hover:bg-white hover:shadow-2xl transition-all group">
                                                <div className="flex items-center gap-4 mb-6">
                                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-500 group-hover:text-white shadow-sm transition-all">
                                                        <FaUserEdit />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-slate-900 leading-tight">{w.name}</h4>
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-0.5">Active Worker</p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2">
                                                    {statusOptions.map(opt => (
                                                        <button
                                                            key={opt.id}
                                                            onClick={() => handleQuickMark(w.id, opt.id)}
                                                            className={`flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${currentStatus === opt.id
                                                                ? `${opt.bg} ${opt.color} ${opt.border} scale-105 shadow-md`
                                                                : 'bg-white border-transparent text-slate-400 hover:border-slate-200'
                                                                }`}
                                                        >
                                                            <opt.icon className="text-xs" />
                                                            {opt.id === 'present' ? 'P' : opt.id === 'absent' ? 'A' : opt.id === 'late' ? 'L' : 'H'}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {workers.length === 0 && (
                                        <div className="col-span-full py-20 text-center">
                                            <FaInbox className="text-6xl mx-auto mb-6 opacity-10" />
                                            <h4 className="text-lg font-black text-slate-900 mb-2">No Workers Found</h4>
                                            <p className="text-slate-500 text-sm font-medium">Add some workers first to start using the Daily Sheet</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="p-20 text-center">
                                <div className="w-24 h-24 bg-blue-50 rounded-[40px] flex items-center justify-center mx-auto mb-8">
                                    <FaCalendarAlt className="text-4xl text-blue-500 opacity-20" />
                                </div>
                                <h4 className="text-xl font-black text-slate-900 mb-4">Select a Day to Begin</h4>
                                <p className="text-slate-500 max-w-sm mx-auto font-medium">The Daily Sheet works only when a specific day is selected from the filters above.</p>
                                <button
                                    onClick={() => setPeriodType('day')}
                                    className="mt-8 bg-slate-900 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-xl"
                                >
                                    Switch to Day View
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Modal & Managers (Unchanged) */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[40px] p-8 sm:p-10 w-full max-w-lg shadow-2xl relative animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <button onClick={() => { setShowAddModal(false); resetForm(); }} className="absolute top-8 right-8 text-slate-400 hover:text-slate-800 transition-colors"><FaTimes /></button>
                        <div className="mb-8"><h2 className="text-2xl font-black text-slate-900 flex items-center gap-3"><div className="w-2 h-8 bg-blue-600 rounded-full"></div>{editingId ? 'Edit Record' : 'Mark Attendance'}</h2></div>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {statusOptions.map(opt => (
                                    <button key={opt.id} type="button" onClick={() => setFormData({ ...formData, status: opt.id })} className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${formData.status === opt.id ? 'border-blue-500 bg-blue-50 scale-105' : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'}`}><opt.icon className={`text-xl ${formData.status === opt.id ? 'text-blue-500' : 'text-slate-400'}`} /><span className={`text-[10px] font-black uppercase tracking-widest ${formData.status === opt.id ? 'text-blue-700' : 'text-slate-500'}`}>{opt.label}</span></button>
                                ))}
                            </div>
                            <div className="space-y-4">
                                <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Subject / Label</label><input required type="text" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} placeholder="E.g. Office, College, Gym..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-['Outfit']" /></div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Date</label><div className="relative"><FaCalendarAlt className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" /><input required type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-14 pr-6 py-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all font-['Outfit'] cursor-pointer" /></div></div>
                                    <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Project (Optional)</label><select value={formData.project_id} onChange={(e) => setFormData({ ...formData, project_id: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all cursor-pointer font-['Outfit']"><option value="">No Project</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                                    <div className="sm:col-span-2"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Worker (Optional)</label><select value={formData.worker_id} onChange={(e) => setFormData({ ...formData, worker_id: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all cursor-pointer font-['Outfit']"><option value="">No Worker</option>{workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select></div>
                                </div>
                                <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Note (Optional)</label><textarea value={formData.note} onChange={(e) => setFormData({ ...formData, note: e.target.value })} placeholder="Add more details..." rows="3" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all resize-none font-['Outfit']"></textarea></div>
                            </div>
                            <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white py-5 rounded-2xl text-sm font-black uppercase tracking-widest shadow-2xl transition-all hover:scale-[1.02] active:scale-95 mt-4 font-['Outfit']">{editingId ? 'Update Record' : 'Mark Attendance'}</button>
                        </form>
                    </div>
                </div>
            )}
            {showProjectManager && <ProjectManager onClose={() => { setShowProjectManager(false); fetchData(); }} />}
            {showWorkerManager && <WorkerManager onClose={() => { setShowWorkerManager(false); fetchData(); }} />}
        </div>
    );
};

export default AttendanceTracker;
