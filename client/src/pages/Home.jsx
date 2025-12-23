import { useState, useEffect } from 'react';
import { getReminders, createReminder, updateReminder, deleteReminder } from '../api/homeApi';
import { getMe } from '../api/authApi';
import ReminderForm from '../components/ReminderForm';
import ReminderList from '../components/ReminderList';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaBell, FaTimes } from 'react-icons/fa';

const Home = () => {
    const [reminders, setReminders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [showNotifications, setShowNotifications] = useState(false);
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
        } catch (error) {
            console.error("Error fetching data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    // Track which reminders have been notified
    const [notifiedReminders, setNotifiedReminders] = useState(new Set());

    // Check for due reminders every minute
    useEffect(() => {
        const checkReminders = () => {
            const now = new Date();

            reminders.forEach(reminder => {
                if (reminder.is_completed || !reminder.due_date) return;
                if (notifiedReminders.has(reminder.id)) return;

                const dueDate = new Date(reminder.due_date);
                const timeDiff = dueDate - now;

                // Notify if reminder is due (within 1 minute)
                if (timeDiff <= 60000 && timeDiff > -60000) {
                    // Show browser notification
                    if ('Notification' in window && Notification.permission === 'granted') {
                        const notification = new Notification('⏰ Reminder Due!', {
                            body: reminder.title,
                            icon: '/favicon.ico',
                            badge: '/favicon.ico',
                            tag: `reminder-${reminder.id}`,
                            requireInteraction: true,
                        });

                        notification.onclick = () => {
                            window.focus();
                            notification.close();
                        };
                    }

                    // Show toast notification as 
                    toast.error(`⏰ Reminder Due: ${reminder.title}`, {
                        duration: 6000,
                        position: 'top-center',
                    });

                    // Mark as notified
                    setNotifiedReminders(prev => new Set([...prev, reminder.id]));
                }
            });
        };

        // Check immediately
        checkReminders();

        // Then check every minute
        const interval = setInterval(checkReminders, 60000);

        return () => clearInterval(interval);
    }, [reminders, notifiedReminders]);

    // 🔔 Notification logic for today's tasks
    const todayStr = new Date().toISOString().split('T')[0];
    const notifications = reminders.filter(r => {
        if (r.is_completed) return false;
        return r.due_date && r.due_date.startsWith(todayStr);
    });

    useEffect(() => {
        if (notifications.length > 0) {
            toast(`You have ${notifications.length} tasks due today!`, { icon: '🔔', duration: 4000 });
        }
    }, [notifications.length]);

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
        try {
            await updateReminder(id, { is_completed: !currentStatus });
            setReminders(reminders.map(r =>
                r.id === id ? { ...r, is_completed: !currentStatus } : r
            ));
            toast.success("Status updated");
        } catch {
            toast.error("Update failed");
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

                <div className="flex justify-between items-center mb-4 sm:mb-6 flex-shrink-0 bg-gradient-to-r from-[#2d5bff] via-[#4a69ff] to-[#6366f1] p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-blue-400/30 shadow-xl shadow-blue-500/20 relative z-20">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white drop-shadow-lg">
                        Dashboard
                    </h1>

                    <div className="flex items-center gap-2 sm:gap-3 md:gap-6">
                        {/* 🔔 Notification Icon */}
                        <div className="relative">
                            <FaBell
                                className={`text-xl sm:text-2xl md:text-3xl cursor-pointer transition-colors ${showNotifications ? 'text-yellow-300' : 'text-white/80 hover:text-white'}`}
                                onClick={() => setShowNotifications(!showNotifications)}
                            />
                            {notifications.length > 0 && (
                                <span className="absolute -top-1 sm:-top-2 -right-1 sm:-right-2 bg-[#ff4d4d] w-4 h-4 sm:w-5 sm:h-5 text-[8px] sm:text-[10px] flex items-center justify-center rounded-full font-bold text-white shadow-lg animate-pulse">
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
                                        src={`http://192.168.0.169:5000${user.profile_image}`}
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
                    <div className="w-full lg:w-[450px] flex-shrink-0">
                        <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-2xl h-auto">
                            <h2 className="text-base sm:text-lg font-bold mb-4 sm:mb-6 text-slate-800">
                                New task
                            </h2>
                            <ReminderForm onAdd={handleAdd} />
                        </div>
                    </div>

                    {/* RIGHT SIDE: LIST - SCROLLABLE SECTION */}
                    <div className="flex-1 min-h-0 w-full mb-10 lg:mb-0">
                        <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-2xl flex flex-col h-auto sm:h-[516px]">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6 flex-shrink-0">
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
                                    <div className="relative">
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
        </div>
    );
};

export default Home;
