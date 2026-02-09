import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getMaintenance, createMaintenance, updateMaintenance, deleteMaintenance, getUnits } from '../../api/Hotel/hotelApi';
import toast from 'react-hot-toast';
import { FaClipboardList, FaCheck, FaExclamationCircle, FaChevronLeft, FaPlus, FaTrash, FaTimes, FaCalendarAlt, FaUser, FaToolbox } from 'react-icons/fa';
import ExportButtons from '../../components/Common/ExportButtons';
import { exportToCSV, exportToPDF, exportToTXT } from '../../utils/exportUtils/index.js';
import ConfirmModal from '../../components/modals/ConfirmModal';

const HotelOperations = () => {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState({ show: false, id: null });

    const [form, setForm] = useState({
        unit_id: '',
        task_type: 'cleaning',
        priority: 'medium',
        scheduled_date: new Date().toISOString().split('T')[0],
        assigned_to: ''
    });

    const fetchTasks = async () => {
        try {
            const res = await getMaintenance();
            setTasks(res.data.data);
        } catch (error) {
            toast.error("Failed to load operations");
        }
    };

    const fetchUnits = async () => {
        try {
            const res = await getUnits();
            setUnits(res.data.data);
        } catch (error) {
            console.error("Failed to load units");
        }
    };

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await Promise.all([fetchTasks(), fetchUnits()]);
            setLoading(false);
        };
        init();
    }, []);

    const filteredTasks = tasks.filter(t => filterStatus === 'all' || (filterStatus === 'ongoing' ? t.status === 'ongoing' : t.status === filterStatus));

    const handleExportCSV = () => {
        const headers = ['Task ID', 'Unit', 'Type', 'Priority', 'Status', 'Scheduled Date'];
        const rows = filteredTasks.map(t => [t.id, t.unit_number, t.task_type, t.priority, t.status, new Date(t.scheduled_date).toLocaleDateString()]);
        exportToCSV(headers, rows, `Hotel_Operations_${filterStatus}_Report`);
    };

    const handleExportPDF = () => {
        const tableHeaders = ['Unit', 'Type', 'Priority', 'Status', 'Scheduled'];
        const tableRows = filteredTasks.map(t => [t.unit_number, t.task_type, t.priority.toUpperCase(), t.status.toUpperCase(), new Date(t.scheduled_date).toLocaleDateString()]);
        exportToPDF({ title: `Hotel Operations & Maintenance (${filterStatus.toUpperCase()}) Report`, tableHeaders, tableRows, filename: `Hotel_Operations_${filterStatus}_Report` });
    };

    const handleExportTXT = () => {
        const logHeaders = ['Unit', 'Type', 'Priority', 'Status', 'Date'];
        const logRows = filteredTasks.map(t => [t.unit_number, t.task_type, t.priority, t.status, new Date(t.scheduled_date).toLocaleDateString()]);
        exportToTXT({ title: `Hotel Operations & Maintenance (${filterStatus.toUpperCase()}) Report`, logHeaders, logRows, filename: `Hotel_Operations_${filterStatus}_Report` });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await createMaintenance(form);
            toast.success("Task created");
            setShowModal(false);
            fetchTasks();
            setForm({ unit_id: '', task_type: 'cleaning', priority: 'medium', scheduled_date: new Date().toISOString().split('T')[0], assigned_to: '' });
        } catch (error) {
            toast.error("Failed to create task");
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            await updateMaintenance(id, { status });
            toast.success(`Task marked as ${status}`);
            fetchTasks();
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const handleDelete = async () => {
        try {
            await deleteMaintenance(deleteModal.id);
            toast.success("Task deleted");
            setDeleteModal({ show: false, id: null });
            fetchTasks();
        } catch (error) {
            toast.error("Failed to delete task");
        }
    };

    const getPriorityColor = (p) => {
        switch (p?.toLowerCase()) {
            case 'high': return 'text-red-500 bg-red-50 border-red-100';
            case 'medium': return 'text-orange-500 bg-orange-50 border-orange-100';
            default: return 'text-blue-500 bg-blue-50 border-blue-100';
        }
    };

    const getStatusStyle = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'ongoing': return 'bg-blue-50 text-blue-600 border-blue-100';
            default: return 'bg-slate-50 text-slate-500 border-slate-100';
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] p-6 md:p-12 font-['Outfit']">
            <div className="max-w-5xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                    <div className="flex items-center gap-4">
                        <Link to="/hotel-sector" className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all shadow-sm active:scale-95">
                            <FaChevronLeft />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                <FaClipboardList className="text-orange-600" /> Operations
                            </h1>
                            <p className="text-slate-500 font-medium mt-1">Track housekeeping and repair tasks.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <ExportButtons
                            onExportCSV={handleExportCSV}
                            onExportPDF={handleExportPDF}
                            onExportTXT={handleExportTXT}
                        />
                        <button
                            onClick={() => setShowModal(true)}
                            className="bg-orange-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-orange-500/30 hover:bg-orange-700 transition-all active:scale-95 flex items-center gap-2"
                        >
                            <FaPlus /> New Task
                        </button>
                    </div>
                </div>

                {/* Status Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-4 mb-6 custom-scrollbar">
                    {['all', 'pending', 'ongoing', 'completed'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all active:scale-95 ${filterStatus === status ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20' : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'}`}
                        >
                            {status === 'ongoing' ? 'In Progress' : status.replace('_', ' ')}
                            <span className="opacity-60 ml-2">({status === 'all' ? tasks.length : tasks.filter(t => t.status === status).length})</span>
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-orange-600"></div></div>
                ) : (
                    <div className="space-y-4">
                        {filteredTasks.length === 0 ? (
                            <div className="p-20 bg-white rounded-[40px] text-center border border-dashed border-slate-200 shadow-sm">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                    <FaClipboardList size={24} />
                                </div>
                                <h3 className="text-lg font-black text-slate-600">No {filterStatus !== 'all' ? filterStatus.replace('_', ' ') : ''} tasks found</h3>
                                <p className="text-slate-400 text-sm mt-1">Scheduled tasks will appear here.</p>
                            </div>
                        ) : (
                            filteredTasks.map(task => (
                                <div key={task.id} className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 hover:shadow-md transition-all group flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getPriorityColor(task.priority)}`}>
                                                {task.priority} Priority
                                            </span>
                                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-lg">
                                                {task.task_type}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-black text-slate-800">Unit {task.unit_number} <span className="text-sm font-bold text-slate-400">({task.unit_type})</span></h3>
                                        <div className="flex items-center gap-4 mt-2">
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                                <FaCalendarAlt className="text-slate-300" /> {new Date(task.scheduled_date).toLocaleDateString()}
                                            </div>
                                            {task.assigned_to && (
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                                    <FaUser className="text-slate-300" /> Staff #{task.assigned_to}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 w-full sm:w-auto">
                                        <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(task.status)} flex-1 sm:flex-none text-center`}>
                                            {task.status === 'ongoing' ? 'In Progress' : task.status}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {task.status === 'pending' && (
                                                <button
                                                    onClick={() => handleStatusUpdate(task.id, 'ongoing')}
                                                    className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all active:scale-90"
                                                    title="Start Task"
                                                >
                                                    <FaToolbox />
                                                </button>
                                            )}
                                            {task.status !== 'completed' && (
                                                <button
                                                    onClick={() => handleStatusUpdate(task.id, 'completed')}
                                                    className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all active:scale-90"
                                                    title="Complete Task"
                                                >
                                                    <FaCheck />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setDeleteModal({ show: true, id: task.id })}
                                                className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all active:scale-90 opacity-0 group-hover:opacity-100"
                                                title="Delete Task"
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* New Task Modal */}
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                        <div className="bg-white rounded-[40px] p-8 w-full max-w-lg shadow-2xl relative">
                            <button
                                onClick={() => setShowModal(false)}
                                className="absolute top-6 right-6 w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"
                            >
                                <FaTimes />
                            </button>

                            <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3">
                                <FaClipboardList className="text-orange-500" /> New Operation Task
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Select Unit</label>
                                    <select
                                        required
                                        value={form.unit_id}
                                        onChange={e => setForm({ ...form, unit_id: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-orange-500 transition-all"
                                    >
                                        <option value="">Choose a room/unit...</option>
                                        {units.map(u => (
                                            <option key={u.id} value={u.id}>{u.unit_number} ({u.unit_type} - {u.status})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Task Type</label>
                                        <select
                                            value={form.task_type}
                                            onChange={e => setForm({ ...form, task_type: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-orange-500 transition-all"
                                        >
                                            <option value="cleaning">Housekeeping</option>
                                            <option value="repair">Maintenance / Repair</option>
                                            <option value="inspection">Room Inspection</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Priority</label>
                                        <select
                                            value={form.priority}
                                            onChange={e => setForm({ ...form, priority: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-orange-500 transition-all"
                                        >
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Schedule Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={form.scheduled_date}
                                        onChange={e => setForm({ ...form, scheduled_date: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-orange-500 transition-all"
                                    />
                                </div>

                                <div className="flex gap-4 mt-8">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 py-4 bg-slate-100 rounded-[20px] font-black text-slate-500 uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-4 bg-orange-600 text-white rounded-[20px] font-black uppercase tracking-widest text-[10px] hover:bg-orange-700 transition-all shadow-lg shadow-orange-500/20 active:scale-95"
                                    >
                                        Schedule Task
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <ConfirmModal
                    isOpen={deleteModal.show}
                    title="Delete Operation Task?"
                    message="Are you sure you want to remove this task? This cannot be undone."
                    confirmText="Delete Task"
                    onConfirm={handleDelete}
                    onCancel={() => setDeleteModal({ show: false, id: null })}
                    type="danger"
                />
            </div>
        </div>
    );
};

export default HotelOperations;
