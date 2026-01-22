import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { getReminders, createReminder, updateReminder, deleteReminder, triggerMissedAlert } from '../../api/homeApi';
import { getMe } from '../../api/authApi';
import { API_URL } from '../../api/axiosInstance';
import ReminderForm from '../../components/Common/ReminderForm';
import ReminderList from '../../components/Common/ReminderList';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaBell, FaTimes } from 'react-icons/fa';
import { LayoutDashboard } from 'lucide-react';
import { getCategories, createCategory, deleteCategory } from '../../api/categoryApi';

import CategoryManager from '../../components/Common/CategoryManager';
import ExportButtons from '../../components/Common/ExportButtons';
import { exportReminderToCSV, exportReminderToTXT, exportReminderToPDF } from '../../utils/exportUtils/index.js';
import Notes from '../Notes/Notes'; // Helper Import

const ITReminders = () => {
    const SECTOR = 'it';
    const navigate = useNavigate();
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
    const [periodType, setPeriodType] = useState('today'); // 'all', 'today', 'range'
    const [customRange, setCustomRange] = useState({ start: '', end: '' });
    const [filterCategory, setFilterCategory] = useState('');
    const [filterPriority, setFilterPriority] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [showFilters, setShowFilters] = useState(false);
    const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
    const [categories, setCategories] = useState([]);
    const [showCategoryManager, setShowCategoryManager] = useState(false);
    const [activeTab, setActiveTab] = useState('tasks'); // 'tasks' | 'notes'

    // Email Modal State
    const [showMailModal, setShowMailModal] = useState(false);
    const [mailConfig, setMailConfig] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        customMessage: '',
        status: 'pending'
    });

    const lastFetchRef = useRef(0);

    const fetchData = async () => {
        // Throttle fetching: don't fetch if last fetch was less than 60s ago
        const now = Date.now();
        if (now - lastFetchRef.current < 60000 && !loading) {
            return;
        }

        try {
            const [remindersRes, userRes, categoriesRes] = await Promise.all([
                getReminders({ sector: SECTOR }),
                getMe(),
                getCategories({ sector: SECTOR })
            ]);
            setReminders(remindersRes.data);
            setUser(userRes.data);
            setCategories(categoriesRes.data);
            localStorage.setItem('user', JSON.stringify(userRes.data));
            lastFetchRef.current = Date.now();
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

    // 🔔 Notification state tracking
    const activeToastsRef = useRef({}); // { reminderId: toastId }

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

        // Auto-dismiss notifications for deleted tasks
        const currentIds = new Set(reminders.map(r => r.id));
        Object.keys(activeToastsRef.current).forEach(id => {
            if (!currentIds.has(parseInt(id))) {
                toast.dismiss(activeToastsRef.current[id]);
                delete activeToastsRef.current[id];
            }
        });
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

                // Only notify if it's due today (to avoid confusion with filtered lists)
                const isDueToday = reminder.due_date.startsWith(new Date().toISOString().split('T')[0]);

                if (isDueToday && nowMs >= dueDateMs - 30000 && (nowMs - lastNotifyTime >= 300000)) {
                    // Show In-App Toast
                    const tId = toast.custom((t) => (
                        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-[448px] w-[95%] xs:w-[90%] sm:w-full bg-slate-900 shadow-2xl rounded-[16px] pointer-events-auto flex flex-col ring-[1px] ring-black ring-opacity-5 overflow-hidden border border-slate-700 mt-[16px]`}>
                            <div className="flex-1 w-0 p-[12px] sm:p-[16px]">
                                <div className="flex items-center">
                                    <div className="shrink-0">
                                        <div className="h-[32px] w-[32px] sm:h-[40px] sm:w-[40px] bg-linear-to-br from-[#2d5bff] to-[#6366f1] rounded-full flex items-center justify-center border border-white/10 shadow-lg shadow-blue-500/20">
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
                                        delete activeToastsRef.current[reminder.id];

                                        // Pre-check existence
                                        if (!remindersRef.current.find(r => r.id === reminder.id)) {
                                            toast.error("Task no longer exists");
                                            return;
                                        }

                                        // Snooze for 10 minutes
                                        try {
                                            const newDate = new Date(Date.now() + 10 * 60000).toISOString();
                                            await updateReminder(reminder.id, { due_date: newDate, sector: SECTOR });
                                            setReminders(prev => prev.map(r => r.id === reminder.id ? { ...r, due_date: newDate } : r));
                                            toast.success("Snoozed for 10 min", { icon: '💤' });
                                        } catch (e) {
                                            const res = await getReminders().catch(() => ({ data: [] }));
                                            setReminders(res.data);
                                            if (!res.data.find(r => r.id === reminder.id)) {
                                                toast.error("Task no longer exists");
                                            } else {
                                                toast.error("Failed to snooze");
                                            }
                                        }
                                    }}
                                    className="flex-1 py-3 text-[10px] sm:text-xs font-bold text-slate-300 hover:bg-slate-700 transition-colors uppercase tracking-wider cursor-pointer"
                                >
                                    Snooze 10m
                                </button>
                                <button
                                    onClick={async () => {
                                        toast.remove(t.id);
                                        delete activeToastsRef.current[reminder.id];

                                        // Pre-check existence
                                        if (!remindersRef.current.find(r => r.id === reminder.id)) {
                                            toast.error("Task no longer exists");
                                            return;
                                        }

                                        // Snooze for 1 hour
                                        try {
                                            const newDate = new Date(Date.now() + 60 * 60000).toISOString();
                                            await updateReminder(reminder.id, { due_date: newDate, sector: SECTOR });
                                            setReminders(prev => prev.map(r => r.id === reminder.id ? { ...r, due_date: newDate } : r));
                                            toast.success("Snoozed for 1 hour", { icon: '💤' });
                                        } catch (e) {
                                            const res = await getReminders().catch(() => ({ data: [] }));
                                            setReminders(res.data);
                                            if (!res.data.find(r => r.id === reminder.id)) {
                                                toast.error("Task no longer exists");
                                            } else {
                                                toast.error("Failed to snooze");
                                            }
                                        }
                                    }}
                                    className="flex-1 py-3 text-[10px] sm:text-xs font-bold text-slate-300 hover:bg-slate-700 transition-colors uppercase tracking-wider cursor-pointer"
                                >
                                    1h
                                </button>
                                <button
                                    onClick={async () => {
                                        toast.remove(t.id);
                                        delete activeToastsRef.current[reminder.id];
                                        try {
                                            await updateReminder(reminder.id, { is_completed: true, sector: SECTOR });
                                            setReminders(prev => prev.map(r => r.id === reminder.id ? { ...r, is_completed: true, completed_at: new Date().toISOString() } : r));
                                            toast.success("Task completed!", { icon: '✅' });
                                        } catch {
                                            toast.error("Failed to complete task");
                                        }
                                    }}
                                    className="flex-1 py-3 text-[10px] sm:text-xs font-black text-emerald-400 hover:bg-slate-700 transition-colors uppercase tracking-wider cursor-pointer"
                                >
                                    Done
                                </button>
                                <button
                                    onClick={() => {
                                        toast.remove(t.id);
                                        delete activeToastsRef.current[reminder.id];
                                        // Dismiss = Suppress for 1 hour locally
                                        setLastNotifiedTimes(prev => ({
                                            ...prev,
                                            [reminder.id]: Date.now() + 3600000 - 300000 // Offset so it triggers in 1 hour
                                        }));
                                    }}
                                    className="flex-1 py-3 text-[10px] sm:text-xs font-black text-[#2d5bff] hover:bg-slate-700 transition-colors uppercase tracking-wider cursor-pointer"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    ), { duration: 8000, position: 'top-center' }); // Longer duration for snooze decision

                    activeToastsRef.current[reminder.id] = tId;

                    setLastNotifiedTimes(prev => ({
                        ...prev,
                        [reminder.id]: nowMs
                    }));
                }
            });
        };

        const interval = setInterval(checkReminders, 30000);
        return () => clearInterval(interval);
    }, []);

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
                        } max-w-[448px] w-[95%] sm:w-full bg-white shadow-2xl rounded-[24px] sm:rounded-[32px] pointer-events-auto flex ring-[1px] ring-black ring-opacity-5 overflow-hidden border border-slate-100 mt-[24px]`}
                >
                    <div className="flex-1 w-0 p-[16px] sm:p-[24px]">
                        <div className="flex items-start gap-[12px] sm:gap-[16px]">
                            <div className="shrink-0">
                                <div className="h-[40px] w-[40px] sm:h-[56px] sm:w-[56px] bg-linear-to-br from-[#2d5bff] to-[#4a69ff] rounded-[12px] sm:rounded-[16px] flex items-center justify-center shadow-xl shadow-blue-500/20">
                                    <FaBell className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
                                </div>
                            </div>
                            <div className="flex-1">
                                <p className="text-lg sm:text-xl font-black text-slate-800 tracking-tight">
                                    Your Daily Brief
                                </p>
                                <p className="text-[11px] sm:text-[14px] font-bold text-slate-500">
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
                            className="w-full border border-transparent rounded-none rounded-r-[24px] sm:rounded-r-[32px] p-4 sm:p-6 flex items-center justify-center text-xs sm:text-sm font-black text-[#2d5bff] hover:bg-slate-50 transition-all uppercase tracking-widest cursor-pointer"
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

    const handleTriggerMissedAlert = async () => {
        // Legacy direct trigger, now replaced by modal usually, but kept for Fallback
        try {
            await triggerMissedAlert({ date: filterDate });
            toast.success(`Checking missed tasks for ${filterDate || 'today'}...`);
        } catch (error) {
            toast.error("Failed to trigger missed task check");
        }
    };

    const handleSendMail = async () => {
        try {
            await triggerMissedAlert({
                date: mailConfig.startDate,
                endDate: mailConfig.endDate,
                customMessage: mailConfig.customMessage,
                status: mailConfig.status
            });
            toast.success("Email report sent successfully!");
            setShowMailModal(false);
        } catch (error) {
            toast.error("Failed to send email report");
        }
    };
    const handleAdd = useCallback(async (reminderData) => {
        try {
            const res = await createReminder({ ...reminderData, sector: SECTOR });
            setReminders(prev => [res.data, ...prev]);
            window.dispatchEvent(new Event('refresh-reminders'));
            toast.success("Reminder added!");
        } catch {
            toast.error("Failed to add reminder");
        }
    }, []);

    const handleToggle = useCallback(async (id, currentStatus) => {
        // If unchecking (marking as incomplete)
        if (currentStatus) {
            // Optimistic Update
            const previousReminders = [...reminders];
            setReminders(prev => prev.map(r =>
                r.id === id ? { ...r, is_completed: false, completed_at: null } : r
            ));

            try {
                await updateReminder(id, { is_completed: false, sector: SECTOR });
                window.dispatchEvent(new Event('refresh-reminders'));
                toast.success("Task marked as incomplete");
            } catch {
                setReminders(previousReminders); // Revert
                toast.error("Update failed");
            }
            return;
        }

        // If checking (marking as complete), show confirmation modal
        setConfirmToggle({ id, currentStatus });
    }, [reminders]);

    const confirmCompletion = useCallback(async () => {
        if (!confirmToggle) return;
        const { id } = confirmToggle;

        // Optimistic Update
        const previousReminders = [...reminders];
        const now = new Date().toISOString();
        setReminders(prev => prev.map(r =>
            r.id === id ? { ...r, is_completed: true, completed_at: now } : r
        ));
        setConfirmToggle(null);

        try {
            await updateReminder(id, { is_completed: true, sector: SECTOR });
            window.dispatchEvent(new Event('refresh-reminders'));
            toast.success("Task completed! 🥳");
        } catch {
            setReminders(previousReminders); // Revert
            toast.error("Update failed");
        }
    }, [confirmToggle, reminders]);

    const handleDelete = useCallback(async (id) => {
        try {
            await deleteReminder(id, { sector: SECTOR });
            setReminders(prev => prev.filter(r => r.id !== id));
            window.dispatchEvent(new Event('refresh-reminders'));
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
                if (periodType === 'today') {
                    if (!r.due_date) matches = false;
                    else if (!r.due_date.startsWith(filterDate)) matches = false;
                } else if (periodType === 'range') {
                    if (!r.due_date) matches = false;
                    else {
                        const rDate = r.due_date.split('T')[0];
                        if (customRange.start && rDate < customRange.start) matches = false;
                        if (customRange.end && rDate > customRange.end) matches = false;
                    }
                }
                if (filterCategory) {
                    if (r.category !== filterCategory) matches = false;
                }
                if (filterPriority) {
                    if (r.priority !== filterPriority) matches = false;
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
    }, [reminders, filterDate, periodType, customRange, filterCategory, filterPriority, sortBy, searchQuery]);

    const exportPeriod = useMemo(() => {
        if (periodType === 'today') return filterDate;
        if (periodType === 'range') {
            if (customRange.start && customRange.end) return `${customRange.start} to ${customRange.end}`;
            return 'Custom Range';
        }
        return 'All Time';
    }, [periodType, filterDate, customRange]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#2d5bff]"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center h-full px-[8px] sm:px-[16px] relative lg:overflow-hidden">
            <div className="w-full max-w-[1280px] flex flex-col h-full pt-[16px] pb-[8px] sm:py-[16px] md:py-[32px]">

                <div className="flex justify-between items-center mb-[16px] sm:mb-[24px] shrink-0 bg-linear-to-r from-[#2d5bff] via-[#4a69ff] to-[#6366f1] p-[10px] sm:p-[16px] rounded-[12px] sm:rounded-[16px] border border-blue-400/30 shadow-xl shadow-blue-500/20 relative z-20">
                    <div className="flex items-center gap-[12px] sm:gap-[16px]">
                        <button
                            onClick={() => navigate('/it')}
                            className="w-8 h-8 md:w-10 md:h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-white transition-all cursor-pointer"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <div className="flex bg-blue-700/30 rounded-xl p-1 border border-blue-400/30 backdrop-blur-sm">
                            <button
                                onClick={() => setActiveTab('tasks')}
                                className={`px-4 py-2 rounded-lg text-[10px] sm:text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'tasks' ? 'bg-white text-[#2d5bff] shadow-lg' : 'text-blue-100 hover:bg-white/10'}`}
                            >
                                Tasks
                            </button>
                            <button
                                onClick={() => setActiveTab('notes')}
                                className={`px-4 py-2 rounded-lg text-[10px] sm:text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'notes' ? 'bg-white text-[#2d5bff] shadow-lg' : 'text-blue-100 hover:bg-white/10'}`}
                            >
                                Notes
                            </button>
                        </div>
                    </div>


                    <div className="flex items-center gap-[8px] sm:gap-[16px]">
                        {/* 🔔 Notification Icon */}
                        <div className="relative">
                            <FaBell
                                className={`text-[18px] sm:text-[24px] md:text-[30px] cursor-pointer transition-colors ${showNotifications ? 'text-yellow-300' : 'text-white/80 hover:text-white'}`}
                                onClick={() => setShowNotifications(!showNotifications)}
                            />
                            {notifications.length > 0 && (
                                <span className="absolute -top-[4px] sm:-top-[8px] -right-[4px] sm:-right-[8px] bg-[#ff4d4d] w-[14px] h-[14px] sm:w-[20px] sm:h-[20px] text-[7px] sm:text-[10px] flex items-center justify-center rounded-full font-bold text-white shadow-lg animate-pulse">
                                    {notifications.length}
                                </span>
                            )}

                            {/* Notification Dropdown - Ensure highest Z-index */}
                            {showNotifications && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div>
                                    <div className="absolute right-0 mt-[16px] w-[256px] sm:w-[288px] md:w-[320px] bg-white border border-slate-200 rounded-[12px] sm:rounded-[16px] shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                        <div className="p-[12px] sm:p-[16px] border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                            <h3 className="font-bold text-[12px] sm:text-[14px] text-slate-800">Tasks Due Today</h3>
                                            <FaTimes className="text-slate-400 hover:text-[#ff4d4d] cursor-pointer transition-colors text-[14px]" onClick={() => setShowNotifications(false)} />
                                        </div>
                                        <div className="max-h-[256px] overflow-y-auto text-slate-700">
                                            {notifications.length > 0 ? (
                                                notifications.map(notif => (
                                                    <div key={notif.id} className="p-[12px] sm:p-[16px] border-b border-slate-100 hover:bg-[#f97066]/5 transition-colors">
                                                        <p className="text-[12px] sm:text-[14px] font-semibold text-slate-800 mb-[4px] whitespace-normal">{notif.title}</p>
                                                        <p className="text-[10px] sm:text-[12px] text-slate-500 flex justify-between items-center">
                                                            <span className="font-medium text-slate-400">Due Today</span>
                                                            <span className="bg-orange-100 text-orange-600 uppercase font-bold text-[7px] sm:text-[8px] tracking-widest px-[6px] sm:px-[8px] py-[2px] rounded-full">
                                                                Today
                                                            </span>
                                                        </p>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-[24px] sm:p-[32px] text-center text-slate-400 text-[12px] sm:text-[14px]">
                                                    No tasks due today! 🚀
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* ✉️ Trigger Missed Alert Button (Mobile/Dev) */}
                        <button
                            onClick={() => setShowMailModal(true)}
                            title="Test Missed Task Notifications"
                            className="bg-white/10 hover:bg-white/20 text-white p-[8px] rounded-[8px] transition-all active:scale-95 flex items-center justify-center shrink-0"
                        >
                            <svg className="w-[20px] h-[20px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </button>

                        {/* 📊 Dashboard Shortcut Button */}
                        <Link
                            to="/profile"
                            title="Go to Dashboard"
                            className="bg-white/10 hover:bg-white/20 text-white p-[8px] rounded-[8px] transition-all active:scale-95 flex items-center justify-center shrink-0"
                        >
                            <LayoutDashboard className="w-[20px] h-[20px]" />
                        </Link>
                    </div>
                </div>

                {/* TASKS VIEW */}
                {activeTab === 'tasks' && (
                    <>
                        {/* BULK ACTION BAR */}
                        {selectedIds.length > 0 && (
                            <div className="fixed bottom-[24px] left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md text-white px-[16px] py-[12px] rounded-[16px] shadow-2xl flex items-center gap-[16px] z-50 animate-in slide-in-from-bottom-10 fade-in duration-300 border border-slate-700">
                                <span className="text-[12px] font-bold text-slate-300">
                                    {selectedIds.length} selected
                                </span>
                                <div className="h-[16px] w-px bg-slate-700"></div>
                                <button
                                    onClick={async () => {
                                        try {
                                            await Promise.all(selectedIds.map(id => updateReminder(id, { is_completed: true, sector: SECTOR })));
                                            setReminders(prev => prev.map(r => selectedIds.includes(r.id) ? { ...r, is_completed: true, completed_at: new Date().toISOString() } : r));
                                            window.dispatchEvent(new Event('refresh-reminders'));
                                            toast.success(`${selectedIds.length} tasks completed`);
                                            setSelectedIds([]);
                                            setIsSelectionMode(false);
                                        } catch (e) { toast.error("Batch update failed"); }
                                    }}
                                    className="text-[12px] font-black text-white hover:text-blue-400 transition-colors uppercase tracking-wider cursor-pointer"
                                >
                                    Complete All
                                </button>
                                <button
                                    onClick={() => setConfirmBulkDelete(true)}
                                    className="text-[12px] font-black text-[#ff4d4d] hover:text-[#ff3333] transition-colors uppercase tracking-wider cursor-pointer"
                                >
                                    Delete All
                                </button>
                                <div className="h-[16px] w-px bg-slate-700"></div>
                                <button onClick={() => { setSelectedIds([]); setIsSelectionMode(false); }} className="p-[4px] hover:bg-white/10 rounded-full transition-colors cursor-pointer">
                                    <FaTimes className="w-[12px] h-[12px]" />
                                </button>
                            </div>
                        )}

                        {/* MAIN CONTENT GRID */}
                        <div className="flex flex-col lg:flex-row gap-[16px] sm:gap-[24px] md:gap-[32px] h-full min-h-0 items-start overflow-y-auto lg:overflow-visible custom-scrollbar pb-[40px] lg:pb-0">

                            {/* LEFT SIDE: ADD REMINDER */}
                            <div className="w-full lg:w-[400px] xl:w-[448px] shrink-0">
                                <div className="glass rounded-[16px] sm:rounded-[24px] md:rounded-[32px] p-[16px] sm:p-[20px] md:p-[24px] shadow-2xl h-auto transition-all">
                                    <h2 className="text-[14px] sm:text-[16px] md:text-[18px] font-black mb-[16px] sm:mb-[24px] text-slate-800 uppercase tracking-widest flex items-center gap-[8px]">
                                        <div className="w-[4px] h-[16px] bg-blue-500 rounded-full"></div>
                                        New task
                                    </h2>
                                    <ReminderForm onAdd={handleAdd} categories={categories} onManageCategories={() => setShowCategoryManager(true)} />
                                </div>
                            </div>

                            {/* RIGHT SIDE: LIST - SCROLLABLE SECTION */}
                            <div className="flex-1 min-h-0 w-full mb-[40px] lg:mb-0">
                                <div className="glass rounded-[16px] sm:rounded-[24px] md:rounded-[32px] p-[16px] sm:p-[20px] md:p-[24px] shadow-2xl flex flex-col h-auto sm:min-h-[516px]">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-[12px] sm:gap-[16px] mb-[16px] sm:mb-[24px] shrink-0">
                                        <div className="flex flex-wrap items-center gap-[8px] sm:gap-[16px]">
                                            <h2 className="text-[14px] sm:text-[16px] md:text-[18px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-[8px]">
                                                <div className="w-[4px] h-[16px] bg-[#2d5bff] rounded-full"></div>
                                                Your Timeline
                                            </h2>
                                            <span className="text-[9px] sm:text-[10px] md:text-[12px] font-black px-[8px] sm:px-[12px] py-[2px] sm:py-[4px] rounded-full bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-widest shrink-0">
                                                {processedReminders.length} Tasks
                                            </span>
                                            <div className="flex flex-wrap items-center gap-[4px] sm:gap-[8px]">
                                                <button
                                                    onClick={() => setShowFilters(!showFilters)}
                                                    className={`flex items-center gap-[6px] sm:gap-[8px] px-[10px] sm:px-[12px] py-[4px] sm:py-[6px] rounded-[8px] border transition-all cursor-pointer ${showFilters ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
                                                >
                                                    <svg className="w-[12px] h-[12px] sm:w-[14px] sm:h-[14px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                                    </svg>
                                                    <span className="hidden sm:inline text-[9px] sm:text-[10px] md:text-[12px] font-black uppercase tracking-widest">Filters</span>
                                                </button>

                                                {/* 📅 Date Search Filter */}
                                                {/* 📅 Period Filter */}
                                                <div className="relative shrink-0">
                                                    <div className="flex items-center gap-2 bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
                                                        <span className="hidden sm:inline text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-wide ml-2">Period:</span>
                                                        <select
                                                            value={periodType}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                setPeriodType(val);
                                                                if (val === 'today') setFilterDate(new Date().toISOString().split('T')[0]);
                                                                else setFilterDate('');
                                                            }}
                                                            className="bg-transparent text-[10px] sm:text-xs font-bold text-slate-700 outline-none cursor-pointer uppercase tracking-wider px-2"
                                                        >
                                                            <option value="today">Today</option>
                                                            <option value="all">All Time</option>
                                                            <option value="range">Range</option>
                                                        </select>

                                                        {periodType === 'today' && (
                                                            <input
                                                                type="date"
                                                                value={filterDate}
                                                                onChange={(e) => setFilterDate(e.target.value)}
                                                                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-600 outline-none"
                                                            />
                                                        )}

                                                        {periodType === 'range' && (
                                                            <div className="flex items-center gap-1">
                                                                <input
                                                                    type="date"
                                                                    value={customRange.start}
                                                                    onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })}
                                                                    className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-600 outline-none w-[90px]"
                                                                />
                                                                <span className="text-slate-400 font-bold">-</span>
                                                                <input
                                                                    type="date"
                                                                    value={customRange.end}
                                                                    onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })}
                                                                    className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-600 outline-none w-[90px]"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => setIsSelectionMode(!isSelectionMode)}
                                                    className={`text-[9px] sm:text-[10px] md:text-[12px] font-black uppercase tracking-widest px-[10px] sm:px-[12px] py-[4px] sm:py-[6px] rounded-[8px] border transition-all cursor-pointer ${isSelectionMode ? 'bg-[#2d5bff] text-white border-[#2d5bff] shadow-lg shadow-blue-500/30' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
                                                >
                                                    {isSelectionMode ? 'Cancel' : 'Select'}
                                                </button>

                                                <div className="h-[24px] w-px bg-slate-200 mx-[4px]"></div>

                                                <ExportButtons
                                                    onExportCSV={() => exportReminderToCSV({ data: processedReminders, period: exportPeriod, filename: `reminders_${new Date().toISOString().split('T')[0]}` })}
                                                    onExportPDF={() => exportReminderToPDF({ data: processedReminders, period: exportPeriod, filename: `reminders_${new Date().toISOString().split('T')[0]}` })}
                                                    onExportTXT={() => exportReminderToTXT({ data: processedReminders, period: exportPeriod, filename: `reminders_${new Date().toISOString().split('T')[0]}` })}
                                                    className="scale-90 sm:scale-100"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* COLLAPSIBLE FILTERS */}
                                    {showFilters && (
                                        <div className="animate-in slide-in-from-top-2 fade-in duration-200 mb-[24px]">
                                            <div className="flex flex-wrap items-center gap-[8px] sm:gap-[12px] p-[12px] sm:p-[16px] bg-slate-50 rounded-[12px] border border-slate-200/60">

                                                {/* 🔍 Search Input */}
                                                <div className="relative shrink-0 group/search flex-1 min-w-[140px]">
                                                    <div className={`flex items-center gap-[8px] bg-white border px-[12px] py-[8px] rounded-[12px] transition-all ${searchQuery ? 'border-[#2d5bff] ring-2 ring-[#2d5bff]/10' : 'border-slate-200 group-hover/search:border-slate-300'}`}>
                                                        <svg className={`w-[14px] h-[14px] ${searchQuery ? 'text-[#2d5bff]' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                                                className="text-slate-400 hover:text-[#ff4d4d] transition-colors cursor-pointer"
                                                            >
                                                                <FaTimes className="w-2.5 h-2.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>



                                                {/* 🏷️ Category Filter */}
                                                <div className="relative group/cat flex items-center gap-[8px]">
                                                    <div className={`flex items-center gap-[8px] bg-white border px-[12px] py-[8px] rounded-[12px] transition-all cursor-pointer ${filterCategory ? 'border-[#2d5bff] ring-2 ring-[#2d5bff]/10' : 'border-slate-200 hover:border-slate-300'}`}>
                                                        <div className={`w-[8px] h-[8px] rounded-full ${filterCategory ? 'bg-[#2d5bff]' : 'bg-slate-300'}`}></div>
                                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Category:</span>
                                                        <select
                                                            value={filterCategory}
                                                            onChange={(e) => setFilterCategory(e.target.value)}
                                                            className="bg-transparent text-[11px] font-bold text-slate-700 outline-none cursor-pointer appearance-none min-w-[60px]"
                                                        >
                                                            <option value="">All</option>
                                                            {categories.map(cat => (
                                                                <option key={cat.id} value={cat.name}>{cat.name}</option>
                                                            ))}
                                                            {categories.length === 0 && <option value="General">General</option>}
                                                        </select>
                                                        {filterCategory ? (
                                                            <button
                                                                onClick={() => setFilterCategory('')}
                                                                className="text-slate-400 hover:text-[#ff4d4d] transition-colors cursor-pointer"
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
                                                {/* 🎯 Priority Filter */}
                                                <div className="relative group/prio flex items-center gap-[8px]">
                                                    <div className={`flex items-center gap-[8px] bg-white border px-[12px] py-[8px] rounded-[12px] transition-all cursor-pointer ${filterPriority ? 'border-[#2d5bff] ring-2 ring-[#2d5bff]/10' : 'border-slate-200 hover:border-slate-300'}`}>
                                                        <div className={`w-[8px] h-[8px] rounded-full ${filterPriority === 'high' ? 'bg-red-500' : filterPriority === 'medium' ? 'bg-orange-500' : filterPriority === 'low' ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Priority:</span>
                                                        <select
                                                            value={filterPriority}
                                                            onChange={(e) => setFilterPriority(e.target.value)}
                                                            className="bg-transparent text-[11px] font-bold text-slate-700 outline-none cursor-pointer appearance-none min-w-[60px] uppercase"
                                                        >
                                                            <option value="">All</option>
                                                            <option value="low">Low</option>
                                                            <option value="medium">Medium</option>
                                                            <option value="high">High</option>
                                                        </select>
                                                        {filterPriority ? (
                                                            <button
                                                                onClick={() => setFilterPriority('')}
                                                                className="text-slate-400 hover:text-[#ff4d4d] transition-colors cursor-pointer"
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
                                                    <div className="flex items-center gap-[8px] bg-white border border-slate-200 px-[12px] py-[8px] rounded-[12px] shadow-sm hover:border-[#2d5bff]/30 transition-all cursor-pointer relative">
                                                        <svg className="w-[14px] h-[14px] text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                                                        </svg>
                                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Sort:</span>
                                                        <select
                                                            value={sortBy}
                                                            onChange={(e) => setSortBy(e.target.value)}
                                                            className="bg-transparent text-[11px] font-bold text-slate-700 outline-none cursor-pointer appearance-none pr-[20px] min-w-[80px]"
                                                        >
                                                            <option value="due_date">Due Date</option>
                                                            <option value="newest">Newest</option>
                                                            <option value="oldest">Oldest</option>
                                                            <option value="priority">Priority</option>
                                                            <option value="status">Status</option>
                                                        </select>
                                                        <svg className="w-[10px] h-[10px] text-slate-400 absolute right-[8px] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

                    </>
                )}

                {/* NOTES VIEW */}
                {activeTab === 'notes' && (
                    <div className="flex-1 h-full overflow-hidden">
                        <Notes isEmbedded={true} />
                    </div>
                )}
                {/* Completion Confirmation Modal */}
                {
                    confirmToggle && (
                        <div className="fixed inset-0 z-120 flex items-center justify-center p-[16px] bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
                            <div className="bg-white rounded-[32px] p-[24px] sm:p-[32px] w-full max-w-[400px] shadow-2xl animate-in zoom-in-95 duration-200 border border-white">
                                <div className="flex flex-col items-center text-center">
                                    <div className="w-[64px] h-[64px] bg-blue-50 rounded-full flex items-center justify-center mb-[24px] border border-blue-100 shadow-lg shadow-blue-500/10">
                                        <div className="w-[32px] h-[32px] bg-[#2d5bff] rounded-full flex items-center justify-center animate-pulse">
                                            <svg className="w-[20px] h-[20px] text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    </div>
                                    <h3 className="text-[20px] font-black text-slate-800 mb-[8px] uppercase tracking-tighter">Mark as Complete?</h3>
                                    <p className="text-slate-500 text-[14px] font-medium mb-[32px]">
                                        High five! 👋 Shall we mark this task as finished and save your progress?
                                    </p>
                                    <div className="flex w-full gap-[12px]">
                                        <button
                                            onClick={() => setConfirmToggle(null)}
                                            className="flex-1 py-[12px] px-[24px] rounded-[12px] font-black text-[11px] tracking-widest uppercase border border-slate-200 text-slate-500 hover:bg-slate-50 transition-all active:scale-95 cursor-pointer"
                                        >
                                            Not yet
                                        </button>
                                        <button
                                            onClick={confirmCompletion}
                                            className="flex-1 py-[12px] px-[24px] rounded-[12px] font-black text-[11px] tracking-widest uppercase bg-[#2d5bff] text-white shadow-lg shadow-blue-500/20 hover:bg-blue-600 hover:shadow-xl transition-all active:scale-95 cursor-pointer"
                                        >
                                            Yes, Done!
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }
                {/* Bulk Delete Confirmation Modal */}
                {
                    confirmBulkDelete && (
                        <div className="fixed inset-0 z-120 flex items-center justify-center p-[16px] bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
                            <div className="bg-white rounded-[32px] p-[24px] sm:p-[32px] w-full max-w-[400px] shadow-2xl animate-in zoom-in-95 duration-200 border border-white">
                                <div className="flex flex-col items-center text-center">
                                    <div className="w-[64px] h-[64px] bg-red-50 rounded-full flex items-center justify-center mb-[24px] border border-red-100 shadow-lg shadow-red-500/10">
                                        <div className="w-[32px] h-[32px] bg-[#ff4d4d] rounded-full flex items-center justify-center animate-pulse">
                                            <svg className="w-[20px] h-[20px] text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </div>
                                    </div>
                                    <h3 className="text-[20px] font-black text-slate-800 mb-[8px] uppercase tracking-tighter">Delete {selectedIds.length} Tasks?</h3>
                                    <p className="text-slate-500 text-[14px] font-medium mb-[32px]">
                                        Are you sure you want to delete these tasks? This action cannot be undone! 🗑️
                                    </p>
                                    <div className="flex w-full gap-[12px]">
                                        <button
                                            onClick={() => setConfirmBulkDelete(false)}
                                            className="flex-1 py-[12px] px-[24px] rounded-[12px] font-black text-[11px] tracking-widest uppercase border border-slate-200 text-slate-500 hover:bg-slate-50 transition-all active:scale-95 cursor-pointer"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    await Promise.all(selectedIds.map(id => deleteReminder(id, { sector: SECTOR })));
                                                    setReminders(prev => prev.filter(r => !selectedIds.includes(r.id)));
                                                    window.dispatchEvent(new Event('refresh-reminders'));
                                                    toast.success("Tasks deleted");
                                                    setSelectedIds([]);
                                                    setIsSelectionMode(false);
                                                } catch (e) { toast.error("Delete failed"); }
                                                finally { setConfirmBulkDelete(false); }
                                            }}
                                            className="flex-1 py-[12px] px-[24px] rounded-[12px] font-black text-[11px] tracking-widest uppercase bg-[#ff4d4d] text-white shadow-lg shadow-red-500/20 hover:bg-red-600 hover:shadow-xl transition-all active:scale-95 cursor-pointer"
                                        >
                                            Yes, Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }
                {/* Email Report Modal */}
                {
                    showMailModal && (
                        <div className="fixed inset-0 z-120 flex items-center justify-center p-[16px] bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
                            <div className="bg-white rounded-[32px] p-[24px] sm:p-[32px] w-full max-w-[450px] shadow-2xl animate-in zoom-in-95 duration-200 border border-white">
                                <div className="flex justify-between items-center mb-[24px]">
                                    <h3 className="text-[20px] font-black text-slate-800 uppercase tracking-tighter flex items-center gap-[12px]">
                                        <div className="w-[4px] h-[24px] bg-[#2d5bff] rounded-full"></div>
                                        Send Email Report
                                    </h3>
                                    <button onClick={() => setShowMailModal(false)} className="text-slate-400 hover:text-slate-800 transition-colors">
                                        <FaTimes className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="space-y-[20px]">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[8px] ml-[4px]">Date Range</label>
                                        <div className="flex flex-col sm:flex-row gap-[8px] sm:gap-[12px]">
                                            <div className="flex-1">
                                                <input
                                                    type="date"
                                                    value={mailConfig.startDate}
                                                    onChange={(e) => setMailConfig({ ...mailConfig, startDate: e.target.value })}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-[12px] px-[16px] py-[12px] text-[12px] font-bold text-slate-700 outline-none focus:border-blue-500 transition-all font-['Outfit']"
                                                />
                                            </div>
                                            <div className="hidden sm:flex items-center text-slate-400 font-bold">-</div>
                                            <div className="flex-1">
                                                <input
                                                    type="date"
                                                    value={mailConfig.endDate}
                                                    onChange={(e) => setMailConfig({ ...mailConfig, endDate: e.target.value })}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-[12px] px-[16px] py-[12px] text-[12px] font-bold text-slate-700 outline-none focus:border-blue-500 transition-all font-['Outfit']"
                                                    placeholder="End Date"
                                                />
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-[6px] ml-[4px]">Leave end date empty for single day.</p>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[8px] ml-[4px]">Filter Status</label>
                                        <div className="relative">
                                            <select
                                                value={mailConfig.status}
                                                onChange={(e) => setMailConfig({ ...mailConfig, status: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-[12px] px-[16px] py-[12px] text-[12px] font-bold text-slate-700 outline-none focus:border-blue-500 transition-all font-['Outfit'] appearance-none cursor-pointer"
                                            >
                                                <option value="pending">Pending Only</option>
                                                <option value="completed">Completed Only</option>
                                                <option value="all">All Tasks</option>
                                            </select>
                                            <svg className="w-[12px] h-[12px] text-slate-400 absolute right-[16px] top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[8px] ml-[4px]">Custom Message / Note</label>
                                        <textarea
                                            value={mailConfig.customMessage}
                                            onChange={(e) => setMailConfig({ ...mailConfig, customMessage: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-[16px] px-[16px] py-[12px] text-[12px] font-bold text-slate-700 outline-none focus:border-blue-500 transition-all font-['Outfit'] h-[100px] resize-none"
                                            placeholder="Add a personal note or instructions..."
                                        ></textarea>
                                    </div>

                                    <button
                                        onClick={handleSendMail}
                                        className="w-full py-[16px] rounded-[16px] font-black text-[14px] bg-[#2d5bff] text-white shadow-lg shadow-blue-500/20 hover:bg-blue-600 hover:shadow-xl transition-all active:scale-95 uppercase tracking-widest flex items-center justify-center gap-[12px]"
                                    >
                                        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        Send Email
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Category Manager Modal */}
                {
                    showCategoryManager && (
                        <CategoryManager
                            categories={categories}
                            onUpdate={() => {
                                getCategories({ sector: SECTOR }).then(res => setCategories(res.data));
                                // No need to refresh reminders, but good practice
                            }}
                            onCreate={(data) => createCategory({ ...data, sector: SECTOR })}
                            onDelete={(id) => deleteCategory(id, { sector: SECTOR })}
                            onClose={() => setShowCategoryManager(false)}
                        />
                    )
                }
            </div>
        </div>
    );
};

export default ITReminders;
