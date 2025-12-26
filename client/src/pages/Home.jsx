import { useState, useEffect, useRef } from 'react';
import { getReminders, createReminder, updateReminder, deleteReminder } from '../api/homeApi';
import { getMe } from '../api/authApi';
import { API_URL } from '../api/axiosInstance';
import ReminderForm from '../components/ReminderForm';
import ReminderList from '../components/ReminderList';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaBell, FaTimes } from 'react-icons/fa';

const Home = () => {
    const [reminders, setReminders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('user');
        return saved ? JSON.parse(saved) : null;
    });
    const [showNotifications, setShowNotifications] = useState(false);
    const [confirmToggle, setConfirmToggle] = useState(null); // { id, currentStatus }
    const [sortBy, setSortBy] = useState('due_date'); // Default to date wise
    const [filterDate, setFilterDate] = useState(''); // Search by date

    const fetchData = async () => {
        try {
            const [remindersRes, userRes] = await Promise.all([
                getReminders(),
                getMe()
            ]);
            setReminders(remindersRes.data);
            setUser(userRes.data);
            localStorage.setItem('user', JSON.stringify(userRes.data));
        } catch (error) {
            console.error("Error fetching data", error);
        } finally {
            setLoading(false);
        }
    };

    // Track if today's agenda has been shown for this session
    const [hasShownAgenda, setHasShownAgenda] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    // Refresh data when user returns to the tab
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                fetchData();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    // Track last notification time for each reminder - Persist to localStorage for reliability
    const [lastNotifiedTimes, setLastNotifiedTimes] = useState(() => {
        const saved = localStorage.getItem('lastNotifiedTimes');
        return saved ? JSON.parse(saved) : {};
    });

    useEffect(() => {
        localStorage.setItem('lastNotifiedTimes', JSON.stringify(lastNotifiedTimes));
    }, [lastNotifiedTimes]);

    // Keep a ref of reminders for the background interval to avoid restarting it
    const remindersRef = useRef(reminders);
    useEffect(() => {
        remindersRef.current = reminders;
    }, [reminders]);

    // Stable background check for due reminders
    useEffect(() => {
        const checkReminders = () => {
            const now = new Date();
            const nowMs = now.getTime();

            remindersRef.current.forEach(reminder => {
                if (reminder.is_completed || !reminder.due_date) return;

                const dueDate = new Date(reminder.due_date);
                const dueDateMs = dueDate.getTime();
                const lastNotifyTime = JSON.parse(localStorage.getItem('lastNotifiedTimes') || '{}')[reminder.id] || 0;

                if (nowMs >= dueDateMs - 30000 && (nowMs - lastNotifyTime >= 300000)) {
                    // Show In-App Toast
                    toast.custom((t) => (
                        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-[95%] xs:w-[90%] sm:w-full bg-red-600 shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 overflow-hidden border border-red-500/50 mt-4`}>
                            <div className="flex-1 w-0 p-3 sm:p-4">
                                <div className="flex items-center">
                                    <div className="shrink-0">
                                        <div className="h-8 w-8 sm:h-10 sm:w-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                                            <FaBell className="h-4 w-4 sm:h-5 sm:w-5 text-white animate-bounce" />
                                        </div>
                                    </div>
                                    <div className="ml-3 sm:ml-4 flex-1">
                                        <p className="text-xs sm:text-sm font-black text-white">Task Milestone Reached!</p>
                                        <p className="mt-0.5 text-[9px] sm:text-[11px] font-bold text-white/80 uppercase tracking-widest line-clamp-1">{reminder.title}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex border-l border-white/10">
                                <button onClick={() => toast.dismiss(t.id)} className="w-full border border-transparent rounded-none rounded-r-2xl px-3 sm:px-4 flex items-center justify-center text-[10px] sm:text-xs font-black text-white hover:bg-white/10 transition-colors uppercase tracking-widest">Done</button>
                            </div>
                        </div>
                    ), { duration: 4000, position: 'top-center' });

                    setLastNotifiedTimes(prev => ({
                        ...prev,
                        [reminder.id]: nowMs
                    }));
                }
            });
        };

        const interval = setInterval(checkReminders, 30000);
        return () => clearInterval(interval);
    }, []); // Heartbeat interval starts once and stays alive

    // 🔔 Notification logic for today's tasks
    const todayStr = new Date().toISOString().split('T')[0];
    const notifications = reminders.filter(r => {
        if (r.is_completed) return false;
        return r.due_date && r.due_date.startsWith(todayStr);
    });

    // 🔔 Modern Agenda Alert for Today's Tasks
    useEffect(() => {
        if (!loading && notifications.length > 0 && !hasShownAgenda) {
            // Show a custom, beautiful agenda toast
            toast.custom((t) => (
                <div
                    className={`${t.visible ? 'animate-enter' : 'animate-leave'
                        } max-w-md w-[95%] sm:w-full bg-white shadow-2xl rounded-[24px] sm:rounded-[32px] pointer-events-auto flex ring-1 ring-black ring-opacity-5 overflow-hidden border border-slate-100 mt-6`}
                >
                    <div className="flex-1 w-0 p-4 sm:p-6">
                        <div className="flex items-start gap-3 sm:gap-4">
                            <div className="shrink-0">
                                <div className="h-10 w-10 sm:h-14 sm:w-14 bg-linear-to-br from-[#2d5bff] to-[#4a69ff] rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/20">
                                    <FaBell className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
                                </div>
                            </div>
                            <div className="flex-1">
                                <p className="text-lg sm:text-xl font-black text-slate-800 tracking-tight">
                                    Your Daily Brief
                                </p>
                                <p className="mt-1 text-[11px] sm:text-sm font-bold text-slate-500">
                                    You have <span className="text-[#2d5bff] font-black">{notifications.length} priorities</span> today.
                                </p>
                                <div className="mt-4 flex flex-col gap-2">
                                    {notifications.slice(0, 3).map(n => (
                                        <div key={n.id} className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                                            <span className="truncate">{n.title}</span>
                                        </div>
                                    ))}
                                    {notifications.length > 3 && (
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">+ {notifications.length - 3} more tasks</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex border-l border-slate-50">
                        <button
                            onClick={() => {
                                toast.dismiss(t.id);
                                setHasShownAgenda(true);
                            }}
                            className="w-full border border-transparent rounded-none rounded-r-[24px] sm:rounded-r-[32px] p-4 sm:p-6 flex items-center justify-center text-xs sm:text-sm font-black text-[#2d5bff] hover:bg-slate-50 transition-all uppercase tracking-widest"
                        >
                            Got it
                        </button>
                    </div>
                </div>
            ), {
                duration: 4000,
                position: 'top-center'
            });
            setHasShownAgenda(true);
        }
    }, [notifications.length, loading, hasShownAgenda]);

    const handleAdd = async (newReminder) => {
        try {
            const response = await createReminder(newReminder);
            setReminders([response.data, ...reminders]);
            toast.success("Reminder added!");
        } catch {
            toast.error("Failed to add reminder");
        }
    };

    const handleToggle = async (id, currentStatus) => {
        // If unchecking (marking as incomplete), update directly
        if (currentStatus) {
            try {
                await updateReminder(id, { is_completed: false });
                setReminders(reminders.map(r =>
                    r.id === id ? { ...r, is_completed: false } : r
                ));
                toast.success("Task marked as incomplete");
            } catch {
                toast.error("Update failed");
            }
            return;
        }

        // If checking (marking as complete), show confirmation modal
        setConfirmToggle({ id, currentStatus });
    };

    const confirmCompletion = async () => {
        if (!confirmToggle) return;
        const { id } = confirmToggle;

        try {
            await updateReminder(id, { is_completed: true });
            setReminders(reminders.map(r =>
                r.id === id ? { ...r, is_completed: true } : r
            ));
            toast.success("Task completed! 🥳");
        } catch {
            toast.error("Update failed");
        } finally {
            setConfirmToggle(null);
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteReminder(id);
            setReminders(reminders.filter(r => r.id !== id));
            toast.success("Reminder deleted");
        } catch {
            toast.error("Delete failed");
        }
    };

    const priorityWeight = {
        'low': 1,
        'medium': 2,
        'high': 3
    };

    const processedReminders = reminders
        .filter(r => {
            if (!filterDate) return true;
            if (!r.due_date) return false;
            return r.due_date.startsWith(filterDate);
        })
        .sort((a, b) => {
            if (sortBy === 'newest') return new Date(b.created_at || 0) - new Date(a.created_at || 0);
            if (sortBy === 'oldest') return new Date(a.created_at || 0) - new Date(b.created_at || 0);
            if (sortBy === 'due_date') {
                const dateA = a.due_date ? new Date(a.due_date) : new Date(8640000000000000); // Max date for nulls
                const dateB = b.due_date ? new Date(b.due_date) : new Date(8640000000000000); // Max date for nulls
                return dateA.getTime() - dateB.getTime();
            }
            if (sortBy === 'priority') return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
            if (sortBy === 'status') return (a.is_completed ? 1 : 0) - (b.is_completed ? 1 : 0);
            return 0;
        });

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#2d5bff]"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center h-full px-2 sm:px-4 relative lg:overflow-hidden">
            <div className="w-full max-w-7xl flex flex-col h-full py-2 sm:py-4 md:py-8">

                <div className="flex justify-between items-center mb-4 sm:mb-6 shrink-0 bg-linear-to-r from-[#2d5bff] via-[#4a69ff] to-[#6366f1] p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-blue-400/30 shadow-xl shadow-blue-500/20 relative z-20">
                    <h1 className="text-lg sm:text-2xl md:text-3xl font-black text-white drop-shadow-lg tracking-tight">
                        Dashboard
                    </h1>

                    <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
                        {/* 🔔 Notification Icon */}
                        <div className="relative">
                            <FaBell
                                className={`text-lg sm:text-2xl md:text-3xl cursor-pointer transition-colors ${showNotifications ? 'text-yellow-300' : 'text-white/80 hover:text-white'}`}
                                onClick={() => setShowNotifications(!showNotifications)}
                            />
                            {notifications.length > 0 && (
                                <span className="absolute -top-1 sm:-top-2 -right-1 sm:-right-2 bg-[#ff4d4d] w-3.5 h-3.5 sm:w-5 sm:h-5 text-[7px] sm:text-[10px] flex items-center justify-center rounded-full font-bold text-white shadow-lg animate-pulse">
                                    {notifications.length}
                                </span>
                            )}

                            {/* Notification Dropdown - Ensure highest Z-index */}
                            {showNotifications && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div>
                                    <div className="absolute right-0 mt-4 w-64 sm:w-72 md:w-80 bg-white border border-slate-200 rounded-xl sm:rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                        <div className="p-3 sm:p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                            <h3 className="font-bold text-xs sm:text-sm text-slate-800">Tasks Due Today</h3>
                                            <FaTimes className="text-slate-400 hover:text-[#ff4d4d] cursor-pointer transition-colors text-sm" onClick={() => setShowNotifications(false)} />
                                        </div>
                                        <div className="max-h-64 overflow-y-auto text-slate-700">
                                            {notifications.length > 0 ? (
                                                notifications.map(notif => (
                                                    <div key={notif.id} className="p-3 sm:p-4 border-b border-slate-100 hover:bg-[#f97066]/5 transition-colors">
                                                        <p className="text-xs sm:text-sm font-semibold text-slate-800 mb-1 whitespace-normal">{notif.title}</p>
                                                        <p className="text-[10px] sm:text-xs text-slate-500 flex justify-between items-center">
                                                            <span className="font-medium text-slate-400">Due Today</span>
                                                            <span className="bg-orange-100 text-orange-600 uppercase font-bold text-[7px] sm:text-[8px] tracking-widest px-1.5 sm:px-2 py-0.5 rounded-full">
                                                                Today
                                                            </span>
                                                        </p>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-6 sm:p-8 text-center text-slate-400 text-xs sm:text-sm">
                                                    No tasks due today! 🚀
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* User Info */}
                        <div className="flex items-center gap-2 sm:gap-4">
                            <div className="text-right hidden sm:block">
                                <p className="text-[10px] sm:text-xs text-white">Welcome,</p>
                                <p className="text-xs sm:text-sm font-bold text-black truncate max-w-[80px] sm:max-w-[120px]">
                                    {user?.username}
                                </p>
                            </div>

                            <Link
                                to="/profile"
                                className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-white text-[#2d5bff] flex items-center justify-center hover:bg-white/90 transition-all active:scale-95 group shadow-lg shadow-white/20 overflow-hidden"
                            >
                                {user?.profile_image ? (
                                    <img
                                        src={`${API_URL}${user.profile_image}`}
                                        alt="User"
                                        className="w-full h-full object-cover"
                                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
                                    />
                                ) : null}
                                <span
                                    className="text-[#2d5bff] font-black text-xs sm:text-sm group-hover:scale-110 transition-transform"
                                    style={{ display: user?.profile_image ? 'none' : 'block' }}
                                >
                                    {user?.username?.charAt(0).toUpperCase()}
                                </span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* MAIN CONTENT GRID */}
                <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 h-full min-h-0 items-start overflow-y-auto lg:overflow-visible custom-scrollbar pb-10 lg:pb-0">

                    {/* LEFT SIDE: ADD REMINDER */}
                    <div className="w-full lg:w-[450px] shrink-0">
                        <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-2xl h-auto">
                            <h2 className="text-base sm:text-lg font-bold mb-4 sm:mb-6 text-slate-800">
                                New task
                            </h2>
                            <ReminderForm onAdd={handleAdd} />
                        </div>
                    </div>

                    {/* RIGHT SIDE: LIST - SCROLLABLE SECTION */}
                    <div className="flex-1 min-h-0 w-full mb-10 lg:mb-0">
                        <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-2xl flex flex-col h-auto sm:min-h-[516px]">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6 shrink-0">
                                <div className="flex items-center gap-2 sm:gap-4">
                                    <h2 className="text-base sm:text-lg font-bold text-slate-800">
                                        Your Timeline
                                    </h2>
                                    <span className="text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                        {processedReminders.length} Tasks
                                    </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                    {/* 📅 Date Search Filter */}
                                    <div className="relative shrink-0">
                                        <div className={`flex items-center gap-1.5 sm:gap-2 bg-white border px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl transition-all ${filterDate ? 'border-[#2d5bff] bg-blue-50' : 'border-slate-200'}`}>
                                            <svg className={`w-3 sm:w-3.5 h-3 sm:h-3.5 ${filterDate ? 'text-[#2d5bff]' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                            <input
                                                type="date"
                                                value={filterDate}
                                                onChange={(e) => setFilterDate(e.target.value)}
                                                className="bg-transparent text-[10px] sm:text-[11px] font-black text-slate-700 outline-none cursor-pointer"
                                            />
                                            {filterDate && (
                                                <button
                                                    onClick={() => setFilterDate('')}
                                                    className="text-slate-400 hover:text-[#ff4d4d] transition-colors"
                                                >
                                                    <FaTimes className="w-2 h-2" />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* 🧪 Sort Control - Modern UI */}
                                    <div className="relative group/sort">
                                        <div className="flex items-center gap-1.5 sm:gap-2 bg-white border border-slate-200 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl shadow-sm hover:border-[#2d5bff]/30 transition-all cursor-pointer relative">
                                            <svg className="w-3 sm:w-4 h-3 sm:h-4 text-[#2d5bff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                                            </svg>
                                            <select
                                                value={sortBy}
                                                onChange={(e) => setSortBy(e.target.value)}
                                                className="bg-transparent text-[10px] sm:text-xs md:text-sm font-black text-slate-700 outline-none cursor-pointer appearance-none pr-4 sm:pr-6 min-w-[100px] sm:min-w-[120px]"
                                            >
                                                <option value="due_date">Due Date</option>
                                                <option value="newest">Newest First</option>
                                                <option value="oldest">Oldest First</option>
                                                <option value="priority">By Priority</option>
                                                <option value="status">By Progress</option>
                                            </select>
                                            <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-400 absolute right-2 sm:right-3 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                <ReminderList
                                    reminders={processedReminders}
                                    onToggle={handleToggle}
                                    onDelete={handleDelete}
                                />
                                {processedReminders.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center p-12 text-center opacity-60">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                                            <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <p className="text-slate-600 font-black text-sm uppercase tracking-widest">No matching tasks</p>
                                        <p className="text-slate-400 text-[11px] mt-1 font-medium">Try selecting another date or clearing the filter</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>

            </div>
            {/* Completion Confirmation Modal */}
            {confirmToggle && (
                <div className="fixed inset-0 z-120 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-white rounded-[32px] p-6 sm:p-8 w-full max-w-[400px] shadow-2xl animate-in zoom-in-95 duration-200 border border-white">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6 border border-blue-100 shadow-lg shadow-blue-500/10">
                                <div className="w-8 h-8 bg-[#2d5bff] rounded-full flex items-center justify-center animate-pulse">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            </div>
                            <h3 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tighter">Mark as Complete?</h3>
                            <p className="text-slate-500 text-sm font-medium mb-8">
                                High five! 👋 Shall we mark this task as finished and save your progress?
                            </p>
                            <div className="flex w-full gap-3">
                                <button
                                    onClick={() => setConfirmToggle(null)}
                                    className="flex-1 py-3 px-6 rounded-xl font-black text-[11px] tracking-widest uppercase border border-slate-200 text-slate-500 hover:bg-slate-50 transition-all active:scale-95"
                                >
                                    Not yet
                                </button>
                                <button
                                    onClick={confirmCompletion}
                                    className="flex-1 py-3 px-6 rounded-xl font-black text-[11px] tracking-widest uppercase bg-[#2d5bff] text-white shadow-lg shadow-blue-500/20 hover:bg-blue-600 hover:shadow-xl transition-all active:scale-95"
                                >
                                    Yes, Done!
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;
