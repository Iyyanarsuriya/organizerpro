import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    getAttendances,
    createAttendance,
    updateAttendance,
    deleteAttendance,
    getAttendanceStats
} from '../api/attendanceApi';
import { getProjects } from '../api/projectApi';
import { getActiveWorkers } from '../api/workerApi';
import toast from 'react-hot-toast';
import {
    FaCheckCircle, FaTimesCircle, FaClock, FaExclamationCircle,
    FaPlus, FaTrash, FaEdit, FaCalendarAlt, FaSearch,
    FaFilter, FaChartBar, FaUserCheck, FaChevronLeft, FaChevronRight,
    FaFolderPlus, FaTimes, FaInbox
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
    const [searchQuery, setSearchQuery] = useState('');
    const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

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
            const [attRes, statsRes, projRes, workersRes] = await Promise.all([
                getAttendances({ projectId: filterProject, workerId: filterWorker, month: currentMonth }),
                getAttendanceStats({ month: currentMonth, projectId: filterProject, workerId: filterWorker }),
                getProjects(),
                getActiveWorkers()
            ]);
            setAttendances(attRes.data.data);
            setStats(statsRes.data.data);
            setProjects(projRes.data);
            setWorkers(workersRes.data.data);
            setLoading(false);
        } catch (error) {
            toast.error("Failed to fetch attendance data");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [currentMonth, filterProject, filterWorker]);

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

    const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6'];

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
                            <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-1">
                                <input
                                    type="month"
                                    value={currentMonth}
                                    onChange={(e) => setCurrentMonth(e.target.value)}
                                    className="bg-transparent border-none text-sm font-bold text-slate-700 focus:ring-0 cursor-pointer px-3 py-1"
                                />
                            </div>

                            <select
                                value={filterProject}
                                onChange={(e) => setFilterProject(e.target.value)}
                                className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all cursor-pointer shadow-sm"
                            >
                                <option value="">All Projects</option>
                                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>

                            <select
                                value={filterWorker}
                                onChange={(e) => setFilterWorker(e.target.value)}
                                className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all cursor-pointer shadow-sm"
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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Stats & Charts */}
                    <div className="lg:col-span-1 space-y-8">
                        {/* Summary Card */}
                        <div className="bg-white rounded-[32px] p-8 shadow-xl border border-slate-100 overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                            <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-3">
                                <FaChartBar className="text-blue-500" />
                                Monthly Stats
                            </h3>

                            <div className="h-[250px] w-full">
                                {stats.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={8}
                                                dataKey="value"
                                            >
                                                {pieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Legend verticalAlign="bottom" height={36} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                        <FaInbox className="text-4xl mb-2 opacity-20" />
                                        <p className="text-xs font-bold uppercase tracking-widest">No data for this month</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 grid grid-cols-2 gap-4">
                                {statusOptions.map(opt => {
                                    const count = stats.find(s => s.status === opt.id)?.count || 0;
                                    return (
                                        <div key={opt.id} className={`${opt.bg} p-4 rounded-2xl border ${opt.border}`}>
                                            <p className={`text-[10px] font-black uppercase tracking-widest ${opt.color}`}>{opt.label}</p>
                                            <p className="text-2xl font-black text-slate-900">{count}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Project Quick View */}
                        <div className="bg-slate-900 rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                            <h3 className="text-lg font-black mb-6 flex items-center gap-3">
                                <FaFolderPlus className="text-blue-400" />
                                Projects
                            </h3>
                            <button
                                onClick={() => setShowProjectManager(true)}
                                className="w-full bg-white/10 hover:bg-white/20 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border border-white/10"
                            >
                                Manage Projects
                            </button>
                        </div>

                        {/* Worker Management */}
                        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                            <h3 className="text-lg font-black mb-6 flex items-center gap-3">
                                <FaUserCheck className="text-white" />
                                Workers
                            </h3>
                            <button
                                onClick={() => setShowWorkerManager(true)}
                                className="w-full bg-white/10 hover:bg-white/20 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border border-white/10"
                            >
                                Manage Workers
                            </button>
                        </div>
                    </div>

                    {/* Attendance List */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-[40px] shadow-xl border border-slate-100 min-h-[600px] flex flex-col overflow-hidden">
                            <div className="p-8 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                <h3 className="text-xl font-black text-slate-900">Attendance Records</h3>
                                <div className="relative">
                                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search records..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-6 py-3 text-sm font-bold text-slate-700 focus:border-blue-500 focus:bg-white transition-all outline-none w-full sm:w-64"
                                    />
                                </div>
                            </div>

                            <div className="flex-1 p-8 space-y-4">
                                {filteredAttendances.length > 0 ? (
                                    filteredAttendances.map(item => {
                                        const status = statusOptions.find(o => o.id === item.status) || statusOptions[0];
                                        return (
                                            <div key={item.id} className="group bg-slate-50 hover:bg-white border border-transparent hover:border-slate-200 p-6 rounded-[28px] transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:shadow-lg hover:-translate-y-1">
                                                <div className="flex items-center gap-6">
                                                    <div className={`w-14 h-14 rounded-2xl ${status.bg} border ${status.border} flex items-center justify-center text-2xl ${status.color} shadow-sm group-hover:scale-110 transition-transform`}>
                                                        <status.icon />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-lg font-black text-slate-900 leading-tight">{item.subject}</h4>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                                                                <FaCalendarAlt className="text-[8px]" />
                                                                {new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                            </span>
                                                            {item.project_name && (
                                                                <>
                                                                    <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                                                                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 bg-blue-50 px-2 py-0.5 rounded-md">
                                                                        {item.project_name}
                                                                    </span>
                                                                </>
                                                            )}
                                                            {item.worker_name && (
                                                                <>
                                                                    <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                                                                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 bg-orange-50 px-2 py-0.5 rounded-md">
                                                                        {item.worker_name}
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                        {item.note && (
                                                            <p className="text-xs text-slate-500 mt-2 font-medium italic">"{item.note}"</p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleEdit(item)}
                                                        className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                                    >
                                                        <FaEdit />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400 py-32">
                                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                                            <FaUserCheck className="text-3xl opacity-20" />
                                        </div>
                                        <p className="text-sm font-black uppercase tracking-widest">No records found</p>
                                        <p className="text-xs font-medium mt-2">Try adjusting your filters or search</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Add/Edit Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[40px] p-8 sm:p-10 w-full max-w-lg shadow-2xl relative animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <button
                            onClick={() => { setShowAddModal(false); resetForm(); }}
                            className="absolute top-8 right-8 text-slate-400 hover:text-slate-800 transition-colors"
                        >
                            <FaTimes />
                        </button>

                        <div className="mb-8">
                            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
                                {editingId ? 'Edit Record' : 'Mark Attendance'}
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Status Selector */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {statusOptions.map(opt => (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, status: opt.id })}
                                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${formData.status === opt.id
                                            ? 'border-blue-500 bg-blue-50 scale-105'
                                            : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'
                                            }`}
                                    >
                                        <opt.icon className={`text-xl ${formData.status === opt.id ? 'text-blue-500' : 'text-slate-400'}`} />
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${formData.status === opt.id ? 'text-blue-700' : 'text-slate-500'}`}>
                                            {opt.label}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Subject / Label</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        placeholder="E.g. Office, College, Gym..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Date</label>
                                        <div className="relative">
                                            <FaCalendarAlt className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                required
                                                type="date"
                                                value={formData.date}
                                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-14 pr-6 py-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all font-['Outfit'] cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Project (Optional)</label>
                                        <select
                                            value={formData.project_id}
                                            onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all cursor-pointer"
                                        >
                                            <option value="">No Project</option>
                                            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Worker (Optional)</label>
                                        <select
                                            value={formData.worker_id}
                                            onChange={(e) => setFormData({ ...formData, worker_id: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all cursor-pointer"
                                        >
                                            <option value="">No Worker</option>
                                            {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Note (Optional)</label>
                                    <textarea
                                        value={formData.note}
                                        onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                        placeholder="Add more details..."
                                        rows="3"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all resize-none"
                                    ></textarea>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-5 rounded-2xl text-sm font-black uppercase tracking-widest shadow-2xl transition-all hover:scale-[1.02] active:scale-95 mt-4"
                            >
                                {editingId ? 'Update Record' : 'Mark Attendance'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Project Manager Modal */}
            {showProjectManager && (
                <ProjectManager
                    onClose={() => setShowProjectManager(false)}
                    onUpdate={fetchData}
                />
            )}

            {/* Worker Manager Modal */}
            {showWorkerManager && (
                <WorkerManager
                    onClose={() => setShowWorkerManager(false)}
                    onUpdate={fetchData}
                />
            )}
        </div>
    );
};

export default AttendanceTracker;
