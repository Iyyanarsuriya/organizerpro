import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getReminders } from '../../../api/homeApi';
import { disconnectGoogle, getGoogleAuthUrl, getMe } from '../../../api/authApi';
import { API_URL } from '../../../api/axiosInstance';
import toast from 'react-hot-toast';
import { FaGoogle } from 'react-icons/fa';
import { Settings, LogOut, Calendar, LayoutDashboard, ArrowLeft } from 'lucide-react';
import ConfirmModal from '../../../components/modals/ConfirmModal';

const ReminderDashboard = () => {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('user');
        return saved ? JSON.parse(saved) : { username: '', email: '' };
    });
    const [reminders, setReminders] = useState([]);
    const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0 });
    const [loading, setLoading] = useState(true);
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
    const [showModal, setShowModal] = useState(null); // 'all', 'completed', 'pending', or null
    const [modalTasks, setModalTasks] = useState([]);
    const [showDisconnectModal, setShowDisconnectModal] = useState(false);
    const navigate = useNavigate();

    const fetchProfileData = async () => {
        try {
            const [userRes, remindersRes] = await Promise.all([
                getMe(),
                getReminders()
            ]);

            setUser(userRes.data);
            localStorage.setItem('user', JSON.stringify(userRes.data));
            const fetchedReminders = remindersRes.data;
            setReminders(fetchedReminders);

            // Filter reminders for the selected date
            const filteredReminders = fetchedReminders.filter(r => {
                if (!filterDate) return true;
                if (!r.due_date) return false;
                return r.due_date.startsWith(filterDate);
            });

            const completed = filteredReminders.filter(r => r.is_completed).length;
            setStats({
                total: filteredReminders.length,
                completed: completed,
                pending: filteredReminders.length - completed
            });
        } catch (error) {
            console.error("Error fetching profile", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfileData();
    }, [filterDate]);

    const handleGoogleConnect = async () => {
        try {
            const response = await getGoogleAuthUrl();
            if (response.data.url) {
                window.location.href = response.data.url;
            }
        } catch (error) {
            toast.error("Could not initiate Google connection");
        }
    };

    const handleGoogleDisconnectClick = () => {
        setShowDisconnectModal(true);
    };

    const confirmDisconnect = async () => {
        try {
            await disconnectGoogle();
            toast.success("Disconnected from Google Calendar");
            fetchProfileData();
        } catch (error) {
            toast.error("Failed to disconnect");
        } finally {
            setShowDisconnectModal(false);
        }
    };

    const logout = () => {
        localStorage.clear();
        sessionStorage.clear();
        window.dispatchEvent(new Event('storage'));
        toast.success("Logged out successfully");
        navigate('/');
    };

    const handleShowTasks = (type) => {
        const filteredReminders = reminders.filter(r => {
            if (!filterDate) return true;
            if (!r.due_date) return false;
            return r.due_date.startsWith(filterDate);
        });

        let tasks = [];
        if (type === 'all') {
            tasks = filteredReminders;
        } else if (type === 'completed') {
            tasks = filteredReminders.filter(r => r.is_completed);
        } else if (type === 'pending') {
            tasks = filteredReminders.filter(r => !r.is_completed);
        }

        setModalTasks(tasks);
        setShowModal(type);
    };


    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
            <div className="animate-spin rounded-full w-[48px] h-[48px] border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f8fafc] p-[16px] sm:p-[32px] md:p-[48px]">
            <div className="max-w-[1024px] mx-auto">

                {/* Header Row with Date Picker */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-[24px] sm:mb-[32px] relative z-60">
                    {/* Back Button */}
                    <button
                        onClick={() => navigate('/reminders')}
                        className="group flex items-center gap-2 h-[40px] sm:h-[48px] px-[16px] sm:px-[20px] bg-white border border-slate-200 rounded-[12px] sm:rounded-[16px] hover:border-blue-500 transition-all shadow-sm hover:shadow-md cursor-pointer w-full sm:w-auto justify-center sm:justify-start"
                    >
                        <div className="w-[24px] h-[24px] sm:w-[28px] sm:h-[28px] rounded-full bg-slate-50 group-hover:bg-blue-50 flex items-center justify-center transition-colors">
                            <ArrowLeft className="w-[12px] h-[12px] sm:w-[14px] sm:h-[14px] text-slate-500 group-hover:text-blue-500 transition-colors" />
                        </div>
                        <span className="font-black text-[10px] sm:text-[12px] text-slate-600 group-hover:text-blue-600 uppercase tracking-widest">Back to Reminders</span>
                    </button>

                    <div className="relative group self-center sm:self-auto w-full sm:w-auto">
                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="bg-white border border-slate-200 text-slate-700 font-bold h-[40px] sm:h-[48px] px-[16px] sm:px-[20px] rounded-[12px] sm:rounded-[16px] outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm cursor-pointer appearance-none w-full sm:w-auto text-[12px] sm:text-[14px]"
                        />
                        <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-[14px] h-[14px] sm:w-[16px] sm:h-[16px] text-slate-400 pointer-events-none" />
                    </div>
                </div>

                {/* Stat Cards Container */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-[16px] sm:gap-[24px] mb-[32px] sm:mb-[48px]">
                    {/* Total Tasks */}
                    <button
                        onClick={() => handleShowTasks('all')}
                        className="bg-white rounded-[24px] sm:rounded-[40px] p-[20px] sm:p-[32px] shadow-sm border border-slate-100 flex flex-col items-center text-center group hover:shadow-md transition-all cursor-pointer h-[120px] sm:h-[160px] justify-center"
                    >
                        <span className="text-slate-400 text-[10px] sm:text-[12px] font-black uppercase tracking-widest mb-1 sm:mb-2 group-hover:text-blue-500 transition-colors">Total Tasks</span>
                        <h2 className="text-[40px] sm:text-[64px] font-black text-[#2d5bff] leading-none">{stats.total}</h2>
                    </button>

                    {/* Completed */}
                    <button
                        onClick={() => handleShowTasks('completed')}
                        className="bg-white rounded-[24px] sm:rounded-[40px] p-[20px] sm:p-[32px] shadow-sm border border-slate-100 flex flex-col items-center text-center group hover:shadow-md transition-all cursor-pointer h-[120px] sm:h-[160px] justify-center"
                    >
                        <span className="text-[#00d1a0] text-[10px] sm:text-[12px] font-black uppercase tracking-widest mb-1 sm:mb-2">Completed</span>
                        <h2 className="text-[40px] sm:text-[64px] font-black text-[#00d1a0] leading-none">{stats.completed}</h2>
                    </button>

                    {/* Remaining */}
                    <button
                        onClick={() => handleShowTasks('pending')}
                        className="bg-white rounded-[24px] sm:rounded-[40px] p-[20px] sm:p-[32px] shadow-sm border border-slate-100 flex flex-col items-center text-center group hover:shadow-md transition-all cursor-pointer h-[120px] sm:h-[160px] justify-center"
                    >
                        <span className="text-amber-500 text-[10px] sm:text-[12px] font-black uppercase tracking-widest mb-1 sm:mb-2">Remaining</span>
                        <h2 className="text-[40px] sm:text-[64px] font-black text-amber-500 leading-none">{stats.pending}</h2>
                    </button>
                </div>

                {/* Google Calendar Section */}
                <div className="bg-white rounded-[24px] sm:rounded-[40px] p-[20px] sm:p-[32px] shadow-sm border border-white mb-[24px] sm:mb-[32px] flex flex-col sm:flex-row items-center justify-between gap-[20px] sm:gap-[24px]">
                    <div className="flex items-center gap-[16px] sm:gap-[20px]">
                        <div className="w-[48px] h-[48px] sm:w-[64px] sm:h-[64px] rounded-full bg-white shadow-xl flex items-center justify-center border border-slate-50 shrink-0">
                            <FaGoogle className="text-[20px] sm:text-[28px] text-[#4285F4]" />
                        </div>
                        <div className="text-center sm:text-left">
                            <h3 className="text-[16px] sm:text-[20px] font-black text-slate-800 tracking-tight">Google Calendar</h3>
                            <p className="text-[10px] sm:text-[12px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                {user?.google_refresh_token ? 'Connected' : 'Not Connected'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={user?.google_refresh_token ? handleGoogleDisconnectClick : handleGoogleConnect}
                        className="w-full sm:w-auto flex items-center justify-center gap-[12px] bg-[#2d5bff] hover:bg-blue-600 text-white h-[48px] sm:h-[56px] px-[24px] sm:px-[32px] rounded-[16px] sm:rounded-[24px] font-black text-[12px] sm:text-[14px] tracking-widest uppercase transition-all shadow-lg active:scale-95 cursor-pointer shrink-0"
                    >
                        <Calendar className="w-[16px] h-[16px] sm:w-[20px] sm:h-[20px]" />
                        {user?.google_refresh_token ? 'Disconnect' : 'Connect Calendar'}
                    </button>
                </div>
                <p className="text-center text-[10px] sm:text-[12px] text-slate-400 font-bold uppercase tracking-widest mb-[48px] sm:mb-[64px]">
                    Link your calendar to get automatic notifications & event sync
                </p>

                {/* Account Settings Section */}
                <div className="mb-[24px]">
                    <div className="flex items-center gap-[12px] mb-[16px] sm:mb-[24px]">
                        <div className="w-[32px] h-[32px] sm:w-[40px] sm:h-[40px] bg-slate-100 rounded-[12px] flex items-center justify-center">
                            <Settings className="w-[16px] h-[16px] sm:w-[20px] sm:h-[20px] text-slate-500" />
                        </div>
                        <h2 className="text-[16px] sm:text-[18px] font-black text-slate-800 uppercase tracking-tighter">Account Settings</h2>
                    </div>

                    <div className="bg-white rounded-[24px] sm:rounded-[40px] border border-[#ff4d4d20] p-[20px] sm:p-[32px] flex flex-col sm:flex-row items-center justify-between gap-[20px] shadow-sm hover:border-[#ff4d4d40] transition-all">
                        <div className="text-center sm:text-left">
                            <h3 className="font-black text-slate-800 text-[14px] sm:text-[16px]">Session</h3>
                            <p className="text-[12px] sm:text-[14px] text-slate-500 font-medium">Log out of your current session</p>
                        </div>
                        <button
                            onClick={logout}
                            className="w-full sm:w-auto h-[44px] sm:h-auto px-[32px] py-[10px] sm:py-[14px] rounded-[14px] sm:rounded-[18px] font-black text-[10px] sm:text-[12px] tracking-widest uppercase bg-white border border-slate-200 text-[#ff4d4d] hover:bg-red-50 hover:border-red-100 transition-all shadow-sm active:scale-95 cursor-pointer flex items-center justify-center"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                {/* Task Details Modal */}
                {showModal && (
                    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <div
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                            onClick={() => setShowModal(null)}
                        ></div>

                        {/* Modal Content */}
                        <div className="relative bg-white rounded-[32px] shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden z-10">
                            {/* Modal Header */}
                            <div className="sticky top-0 bg-white border-b border-slate-100 p-6 flex items-center justify-between z-10">
                                <h3 className="text-xl font-black text-slate-800">
                                    {showModal === 'all' && 'All Tasks'}
                                    {showModal === 'completed' && 'Completed Tasks'}
                                    {showModal === 'pending' && 'Remaining Tasks'}
                                </h3>
                                <button
                                    onClick={() => setShowModal(null)}
                                    className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                                >
                                    <LogOut className="w-5 h-5 text-slate-600 rotate-180" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
                                {modalTasks.length > 0 ? (
                                    <div className="space-y-3">
                                        {modalTasks.map((task) => (
                                            <div
                                                key={task.id}
                                                className="bg-slate-50 rounded-2xl p-4 border border-slate-100 hover:border-blue-200 transition-all"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-slate-800 mb-1">{task.title}</h4>
                                                        {task.description && (
                                                            <p className="text-sm text-slate-500 mb-2">{task.description}</p>
                                                        )}
                                                        <div className="flex flex-wrap gap-2 text-xs">
                                                            {task.priority && (
                                                                <span className={`px-2 py-1 rounded-full font-bold ${task.priority === 'high' ? 'bg-red-100 text-red-600' :
                                                                    task.priority === 'medium' ? 'bg-amber-100 text-amber-600' :
                                                                        'bg-blue-100 text-blue-600'
                                                                    }`}>
                                                                    {task.priority}
                                                                </span>
                                                            )}
                                                            {task.category && (
                                                                <span className="px-2 py-1 rounded-full bg-slate-200 text-slate-700 font-bold">
                                                                    {task.category}
                                                                </span>
                                                            )}
                                                            {task.due_date && (
                                                                <span className="px-2 py-1 rounded-full bg-slate-200 text-slate-700 font-bold">
                                                                    {(() => {
                                                                        const d = new Date(task.due_date);
                                                                        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
                                                                    })()}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {task.is_completed && (
                                                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <LayoutDashboard className="w-8 h-8 text-slate-400" />
                                        </div>
                                        <p className="text-slate-500 font-bold">No tasks found for this date</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <ConfirmModal
                    isOpen={showDisconnectModal}
                    title="Disconnect Google?"
                    message="Are you sure you want to disconnect your Google Calendar? Events will no longer sync."
                    onConfirm={confirmDisconnect}
                    onCancel={() => setShowDisconnectModal(false)}
                    confirmText="Disconnect"
                    cancelText="Cancel"
                    type="danger"
                />

            </div>
        </div>
    );
};

export default ReminderDashboard;

