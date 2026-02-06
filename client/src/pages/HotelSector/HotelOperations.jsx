import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getMaintenance } from '../../api/Hotel/hotelApi';
import toast from 'react-hot-toast';
import { FaClipboardList, FaCheck, FaExclamationCircle, FaChevronLeft, FaPlus, FaFilter } from 'react-icons/fa';
import ExportButtons from '../../components/Common/ExportButtons';
import { exportToCSV, exportToPDF, exportToTXT } from '../../utils/exportUtils/index.js';

const HotelOperations = () => {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');

    const filteredTasks = tasks.filter(t => filterStatus === 'all' || t.status === filterStatus);

    const handleExportCSV = () => {
        const headers = ['Task ID', 'Unit', 'Type', 'Priority', 'Status', 'Scheduled Date', 'Assigned To'];
        const rows = filteredTasks.map(t => [t.id, t.unit_number, t.task_type, t.priority, t.status, new Date(t.scheduled_date).toLocaleDateString(), t.assigned_to || 'Unassigned']);
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

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const res = await getMaintenance();
                setTasks(res.data.data);
            } catch (error) {
                toast.error("Failed to load operations");
            } finally {
                setLoading(false);
            }
        };
        fetchTasks();
    }, []);

    const getPriorityColor = (p) => {
        switch (p) {
            case 'high': return 'text-red-500 bg-red-50 border-red-100';
            case 'medium': return 'text-orange-500 bg-orange-50 border-orange-100';
            default: return 'text-blue-500 bg-blue-50 border-blue-100';
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] p-6 md:p-12 font-['Outfit']">
            <div className="max-w-5xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                    <div className="flex items-center gap-4">
                        <Link to="/hotel-sector" className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all shadow-sm">
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
                            className="bg-orange-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-orange-500/30 hover:bg-orange-700 transition-all active:scale-95 flex items-center gap-2"
                        >
                            <FaPlus /> New Task
                        </button>
                    </div>
                </div>

                {/* Status Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-4 mb-6 custom-scrollbar">
                    {['all', 'pending', 'in_progress', 'completed'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${filterStatus === status ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'}`}
                        >
                            {status.replace('_', ' ')} <span className="opacity-60 ml-1">({status === 'all' ? tasks.length : tasks.filter(t => t.status === status).length})</span>
                        </button>
                    ))}
                </div>

                {loading ? <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-orange-600"></div></div> : (
                    <div className="space-y-4">
                        {filteredTasks.length === 0 ? <div className="p-12 bg-white rounded-3xl text-center text-slate-400 font-bold border border-dashed border-slate-200">No {filterStatus !== 'all' ? filterStatus.replace('_', ' ') : ''} tasks found.</div> : filteredTasks.map(task => (
                            <div key={task.id} className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100 flex justify-between items-center">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getPriorityColor(task.priority)}`}>{task.priority} Priority</span>
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{task.task_type}</span>
                                    </div>
                                    <h3 className="text-lg font-black text-slate-800">Unit {task.unit_number} ({task.unit_type})</h3>
                                    <p className="text-sm text-slate-500 font-medium mt-1">Scheduled: {new Date(task.scheduled_date).toLocaleDateString()}</p>
                                </div>
                                <div className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${task.status === 'pending' ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-600'}`}>
                                    {task.status}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default HotelOperations;
