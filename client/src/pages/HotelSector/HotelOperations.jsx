import { useState, useEffect } from 'react';
import { getMaintenance } from '../../api/Hotel/hotelApi';
import toast from 'react-hot-toast';
import { FaClipboardList, FaCheck, FaExclamationCircle } from 'react-icons/fa';

const HotelOperations = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

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
                <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3 mb-2"><FaClipboardList className="text-orange-600" /> Operations & Maintenance</h1>
                <p className="text-slate-500 font-medium mb-10">Track housekeeping and repair tasks.</p>

                {loading ? <div className="text-center">Loading...</div> : (
                    <div className="space-y-4">
                        {tasks.length === 0 ? <div className="p-8 bg-white rounded-3xl text-center text-slate-400 font-bold border border-dashed">No active tasks.</div> : tasks.map(task => (
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
