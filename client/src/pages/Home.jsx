import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]); // Default to Today
    const [filterCategory, setFilterCategory] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [showFilters, setShowFilters] = useState(false);
    const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

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
                        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-[95%] xs:w-[90%] sm:w-full bg-slate-900 shadow-2xl rounded-2xl pointer-events-auto flex flex-col ring-1 ring-black ring-opacity-5 overflow-hidden border border-slate-700 mt-4`}>
                            <div className="flex-1 w-0 p-3 sm:p-4">
                                <div className="flex items-center">
                                    <div className="shrink-0">
                                        <div className="h-8 w-8 sm:h-10 sm:w-10 bg-linear-to-br from-[#2d5bff] to-[#6366f1] rounded-full flex items-center justify-center border border-white/10 shadow-lg shadow-blue-500/20">
                                            <FaBell className="h-4 w-4 sm:h-5 sm:w-5 text-white animate-bounce" />
                                        </div>
                                    </div>
                                    <div className="ml-3 sm:ml-4 flex-1">
                                        <p className="text-xs sm:text-sm font-black text-white">Reminder</p>
                                        <p className="mt-0.5 text-[10px] sm:text-[11px] font-bold text-slate-300 line-clamp-1">{reminder.title}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex border-t border-slate-700/50 divide-x divide-slate-700/50 bg-slate-800/50">
                                <button
                                    onClick={async () => {
                                        toast.remove(t.id);
                                        // Snooze for 10 minutes
                                        try {
                                            const newDate = new Date(Date.now() + 10 * 60000).toISOString();
                                            await updateReminder(reminder.id, { due_date: newDate });
                                            setReminders(prev => prev.map(r => r.id === reminder.id ? { ...r, due_date: newDate } : r));
                                            toast.success("Snoozed for 10 min", { icon: '💤' });
                                        } catch (e) {
                                            toast.error("Task not found or deleted");
                                            // Refresh data to sync UI if deleted
                                            const res = await getReminders().catch(() => ({ data: [] }));
                                            setReminders(res.data);
                                        }
                                    }}
                                    className="flex-1 py-3 text-[10px] sm:text-xs font-bold text-slate-300 hover:bg-slate-700 transition-colors uppercase tracking-wider cursor-pointer"
                                >
                                    Snooze 10m
                                </button>
                                <button
                                    onClick={async () => {
                                        toast.remove(t.id);
                                        // Snooze for 1 hour
                                        try {
                                            const newDate = new Date(Date.now() + 60 * 60000).toISOString();
                                            await updateReminder(reminder.id, { due_date: newDate });
                                            setReminders(prev => prev.map(r => r.id === reminder.id ? { ...r, due_date: newDate } : r));
                                            toast.success("Snoozed for 1 hour", { icon: '💤' });
                                        } catch (e) {
                                            toast.error("Task not found or deleted");
                                            const res = await getReminders().catch(() => ({ data: [] }));
                                            setReminders(res.data);
                                        }
                                    }}
                                    className="flex-1 py-3 text-[10px] sm:text-xs font-bold text-slate-300 hover:bg-slate-700 transition-colors uppercase tracking-wider cursor-pointer"
                                >
                                    1h
                                </button>
                                <button
                                    onClick={() => toast.remove(t.id)}
                                    className="flex-1 py-3 text-[10px] sm:text-xs font-black text-[#2d5bff] hover:bg-slate-700 transition-colors uppercase tracking-wider cursor-pointer"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    ), { duration: 8000, position: 'top-center' }); // Longer duration for snooze decision

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
    const notifications = useMemo(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        return reminders.filter(r => {
            if (r.is_completed) return false;
            return r.due_date && r.due_date.startsWith(todayStr);
        });
    }, [reminders]);

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

    // Memoize handlers to prevent unnecessary re-renders of child components
    const handleAdd = useCallback(async (reminderData) => {
        try {
            const res = await createReminder(reminderData);
            setReminders(prev => [res.data, ...prev]);
            toast.success("Reminder added!");
        } catch {
            toast.error("Failed to add reminder");
        }
    }, []);

    const handleToggle = useCallback(async (id, currentStatus) => {
        // If unchecking (marking as incomplete), update directly
        if (currentStatus) {
            try {
                await updateReminder(id, { is_completed: false });
                setReminders(prev => prev.map(r =>
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
    }, []);

    const confirmCompletion = useCallback(async () => {
        if (!confirmToggle) return;
        const { id } = confirmToggle;

        try {
            await updateReminder(id, { is_completed: true });
            setReminders(prev => prev.map(r =>
                r.id === id ? { ...r, is_completed: true } : r
            ));
            toast.success("Task completed! 🥳");
        } catch {
            toast.error("Update failed");
        } finally {
            setConfirmToggle(null);
        }
    }, [confirmToggle]);

    const handleDelete = useCallback(async (id) => {
        try {
            await deleteReminder(id);
            setReminders(prev => prev.filter(r => r.id !== id));
            toast.success("Reminder deleted");
        } catch {
            toast.error("Delete failed");
        }
    }, []);

    // Memoized derived state for reminders
    // This sorting/filtering can be expensive, so we memoize it.
    const processedReminders = useMemo(() => {
        const priorityWeight = { 'low': 1, 'medium': 2, 'high': 3 };

        return reminders
            .filter(r => {
                let matches = true;
                if (filterDate) {
                    if (!r.due_date) matches = false;
                    else if (!r.due_date.startsWith(filterDate)) matches = false;
                }
                if (filterCategory) {
                    if (r.category !== filterCategory) matches = false;
                }
                if (searchQuery) {
                    const query = searchQuery.toLowerCase();
                    if (!r.title.toLowerCase().includes(query) &&
                        !r.description?.toLowerCase().includes(query)) {
                        matches = false;
                    }
                }
                return matches;
            })
            .sort((a, b) => {
                if (sortBy === 'newest') return new Date(b.created_at || 0) - new Date(a.created_at || 0);
                if (sortBy === 'oldest') return new Date(a.created_at || 0) - new Date(b.created_at || 0);
                if (sortBy === 'due_date') {
                    const dateA = a.due_date ? new Date(a.due_date) : new Date(8640000000000000);
                    const dateB = b.due_date ? new Date(b.due_date) : new Date(8640000000000000);
                    return dateA.getTime() - dateB.getTime();
                }
                if (sortBy === 'priority') return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
                if (sortBy === 'status') return (a.is_completed ? 1 : 0) - (b.is_completed ? 1 : 0);
                return 0;
            });
    }, [reminders, filterDate, filterCategory, sortBy, searchQuery]);

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

                {/* BULK ACTION BAR */}
                {selectedIds.length > 0 && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-4 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300 border border-slate-700">
                        <span className="text-xs font-bold text-slate-300">
                            {selectedIds.length} selected
                        </span>
                        <div className="h-4 w-px bg-slate-700"></div>
                        <button
                            onClick={async () => {
                                try {
                                    await Promise.all(selectedIds.map(id => updateReminder(id, { is_completed: true })));
                                    setReminders(prev => prev.map(r => selectedIds.includes(r.id) ? { ...r, is_completed: true } : r));
                                    toast.success(`${selectedIds.length} tasks completed`);
                                    setSelectedIds([]);
                                    setIsSelectionMode(false);
                                } catch (e) { toast.error("Batch update failed"); }
                            }}
                            className="text-xs font-black text-white hover:text-blue-400 transition-colors uppercase tracking-wider"
                        >
                            Complete All
                        </button>
                        <button
                            onClick={() => setConfirmBulkDelete(true)}
                            className="text-xs font-black text-[#ff4d4d] hover:text-[#ff3333] transition-colors uppercase tracking-wider"
                        >
                            Delete All
                        </button>
                        <div className="h-4 w-px bg-slate-700"></div>
                        <button onClick={() => { setSelectedIds([]); setIsSelectionMode(false); }} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                            <FaTimes className="w-3 h-3" />
                        </button>
                    </div>
                )}

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
                                    <button
                                        onClick={() => setShowFilters(!showFilters)}
                                        className={`ml-2 flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${showFilters ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                        </svg>
                                        <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest">Filters</span>
                                    </button>

                                    <button
                                        onClick={() => setIsSelectionMode(!isSelectionMode)}
                                        className={`ml-1 text-[10px] sm:text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border transition-all ${isSelectionMode ? 'bg-[#2d5bff] text-white border-[#2d5bff] shadow-lg shadow-blue-500/30' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
                                    >
                                        {isSelectionMode ? 'Cancel' : 'Select'}
                                    </button>
                                </div>
                            </div>

                            {/* COLLAPSIBLE FILTERS */}
                            {showFilters && (
                                <div className="animate-in slide-in-from-top-2 fade-in duration-200 mb-6">
                                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-slate-50 rounded-xl border border-slate-200/60">

                                        {/* 🔍 Search Input */}
                                        <div className="relative shrink-0 group/search flex-1 min-w-[140px]">
                                            <div className={`flex items-center gap-2 bg-white border px-3 py-2 rounded-xl transition-all ${searchQuery ? 'border-[#2d5bff] ring-2 ring-[#2d5bff]/10' : 'border-slate-200 group-hover/search:border-slate-300'}`}>
                                                <svg className={`w-3.5 h-3.5 ${searchQuery ? 'text-[#2d5bff]' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                                <input
                                                    type="text"
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    placeholder="Search tasks..."
                                                    className="bg-transparent text-[11px] font-bold text-slate-700 outline-none w-full placeholder:text-slate-400 placeholder:font-medium"
                                                />
                                                {searchQuery && (
                                                    <button
                                                        onClick={() => setSearchQuery('')}
                                                        className="text-slate-400 hover:text-[#ff4d4d] transition-colors"
                                                    >
                                                        <FaTimes className="w-2.5 h-2.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* 📅 Date Search Filter */}
                                        <div className="relative shrink-0">
                                            <div className={`flex items-center gap-2 bg-white border px-3 py-2 rounded-xl transition-all cursor-pointer ${filterDate ? 'border-[#2d5bff] ring-2 ring-[#2d5bff]/10' : 'border-slate-200 hover:border-slate-300'}`}>
                                                <svg className={`w-3.5 h-3.5 ${filterDate ? 'text-[#2d5bff]' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Date:</span>
                                                <input
                                                    type="date"
                                                    value={filterDate}
                                                    onChange={(e) => setFilterDate(e.target.value)}
                                                    className="bg-transparent text-[11px] font-bold text-slate-700 outline-none cursor-pointer uppercase tracking-wider"
                                                />
                                                {filterDate && (
                                                    <button
                                                        onClick={() => setFilterDate('')}
                                                        className="text-slate-400 hover:text-[#ff4d4d] transition-colors"
                                                    >
                                                        <FaTimes className="w-2.5 h-2.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* 🏷️ Category Filter */}
                                        <div className="relative group/cat">
                                            <div className={`flex items-center gap-2 bg-white border px-3 py-2 rounded-xl transition-all cursor-pointer ${filterCategory ? 'border-[#2d5bff] ring-2 ring-[#2d5bff]/10' : 'border-slate-200 hover:border-slate-300'}`}>
                                                <div className={`w-2 h-2 rounded-full ${filterCategory ? 'bg-[#2d5bff]' : 'bg-slate-300'}`}></div>
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Category:</span>
                                                <select
                                                    value={filterCategory}
                                                    onChange={(e) => setFilterCategory(e.target.value)}
                                                    className="bg-transparent text-[11px] font-bold text-slate-700 outline-none cursor-pointer appearance-none min-w-[60px]"
                                                >
                                                    <option value="">All</option>
                                                    <option value="Work">Work</option>
                                                    <option value="Personal">Personal</option>
                                                    <option value="Health">Health</option>
                                                    <option value="Study">Study</option>
                                                    <option value="Finance">Finance</option>
                                                    <option value="General">General</option>
                                                </select>
                                                {filterCategory ? (
                                                    <button
                                                        onClick={() => setFilterCategory('')}
                                                        className="text-slate-400 hover:text-[#ff4d4d] transition-colors"
                                                    >
                                                        <FaTimes className="w-2.5 h-2.5" />
                                                    </button>
                                                ) : (
                                                    <svg className="w-3 h-3 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                )}
                                            </div>
                                        </div>

                                        {/* 🧪 Sort Control */}
                                        <div className="relative group/sort">
                                            <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-sm hover:border-[#2d5bff]/30 transition-all cursor-pointer relative">
                                                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                                                </svg>
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Sort:</span>
                                                <select
                                                    value={sortBy}
                                                    onChange={(e) => setSortBy(e.target.value)}
                                                    className="bg-transparent text-[11px] font-bold text-slate-700 outline-none cursor-pointer appearance-none pr-5 min-w-[80px]"
                                                >
                                                    <option value="due_date">Due Date</option>
                                                    <option value="newest">Newest</option>
                                                    <option value="oldest">Oldest</option>
                                                    <option value="priority">Priority</option>
                                                    <option value="status">Status</option>
                                                </select>
                                                <svg className="w-2.5 h-2.5 text-slate-400 absolute right-2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                <ReminderList
                                    reminders={processedReminders}
                                    onToggle={handleToggle}
                                    onDelete={handleDelete}
                                    isSelectionMode={isSelectionMode}
                                    selectedIds={selectedIds}
                                    onSelect={(id) => {
                                        setSelectedIds(prev => prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]);
                                    }}
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
            {/* Bulk Delete Confirmation Modal */}
            {confirmBulkDelete && (
                <div className="fixed inset-0 z-120 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-white rounded-[32px] p-6 sm:p-8 w-full max-w-[400px] shadow-2xl animate-in zoom-in-95 duration-200 border border-white">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6 border border-red-100 shadow-lg shadow-red-500/10">
                                <div className="w-8 h-8 bg-[#ff4d4d] rounded-full flex items-center justify-center animate-pulse">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </div>
                            </div>
                            <h3 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tighter">Delete {selectedIds.length} Tasks?</h3>
                            <p className="text-slate-500 text-sm font-medium mb-8">
                                Are you sure you want to delete these tasks? This action cannot be undone! 🗑️
                            </p>
                            <div className="flex w-full gap-3">
                                <button
                                    onClick={() => setConfirmBulkDelete(false)}
                                    className="flex-1 py-3 px-6 rounded-xl font-black text-[11px] tracking-widest uppercase border border-slate-200 text-slate-500 hover:bg-slate-50 transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={async () => {
                                        try {
                                            await Promise.all(selectedIds.map(id => deleteReminder(id)));
                                            setReminders(prev => prev.filter(r => !selectedIds.includes(r.id)));
                                            toast.success("Tasks deleted");
                                            setSelectedIds([]);
                                            setIsSelectionMode(false);
                                        } catch (e) { toast.error("Batch delete failed"); } finally {
                                            setConfirmBulkDelete(false);
                                        }
                                    }}
                                    className="flex-1 py-3 px-6 rounded-xl font-black text-[11px] tracking-widest uppercase bg-[#ff4d4d] text-white shadow-lg shadow-red-500/20 hover:bg-[#ff3333] hover:shadow-xl transition-all active:scale-95"
                                >
                                    Yes, Delete
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
