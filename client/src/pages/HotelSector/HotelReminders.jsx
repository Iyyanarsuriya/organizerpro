import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { getReminders, createReminder, updateReminder, deleteReminder, getCategories, createCategory, deleteCategory } from '../../api/Reminder/hotelReminder';
import { getMe } from '../../api/authApi';
import ReminderForm from '../../components/Common/ReminderForm';
import ReminderList from '../../components/Common/ReminderList';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaBell, FaChevronLeft, FaCalendarAlt, FaArrowLeft } from 'react-icons/fa';
import { LayoutDashboard } from 'lucide-react';

import CategoryManager from '../../components/Common/CategoryManager';
import ExportButtons from '../../components/Common/ExportButtons';
import { exportReminderToCSV, exportReminderToTXT, exportReminderToPDF } from '../../utils/exportUtils/index.js';
import Notes from '../Notes/Notes'; // Helper Import

const HotelReminders = () => {
    const SECTOR = 'hotel';
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



    const lastFetchRef = useRef(0);

    const fetchData = async (force = false) => {
        const now = Date.now();
        if (!force && now - lastFetchRef.current < 60000 && !loading) {
            return;
        }

        // If forced, clear existing promise to allow a fresh one
        if (force) {
            window._hotelFetchPromise = null;
        }

        // Request Deduplication
        if (!force && window._hotelFetchPromise) {
            try {
                const [remindersRes, categoriesRes] = await window._hotelFetchPromise;
                setReminders(Array.isArray(remindersRes.data) ? remindersRes.data : []);
                const fetchedCategories = categoriesRes.data?.data || categoriesRes.data || [];
                setCategories(Array.isArray(fetchedCategories) ? fetchedCategories : []);
                lastFetchRef.current = Date.now();
            } catch (error) {
                console.error("Error joining existing fetch:", error);
            } finally {
                setLoading(false);
            }
            return;
        }

        const fetchPromise = Promise.all([
            getReminders({ sector: SECTOR }),
            getCategories({ sector: SECTOR })
        ]);

        if (!force) {
            window._hotelFetchPromise = fetchPromise;
        }

        try {
            const [remindersRes, categoriesRes] = await fetchPromise;
            setReminders(Array.isArray(remindersRes.data) ? remindersRes.data : []);
            const fetchedCategories = categoriesRes.data?.data || categoriesRes.data || [];
            setCategories(Array.isArray(fetchedCategories) ? fetchedCategories : []);
            lastFetchRef.current = Date.now();
        } catch (error) {
            console.error("Error fetching data", error);
        } finally {
            if (!force) window._hotelFetchPromise = null;
            setLoading(false);
        }
    };

    const [hasShownAgenda, setHasShownAgenda] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                fetchData();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    const activeToastsRef = useRef({});

    const [lastNotifiedTimes, setLastNotifiedTimes] = useState(() => {
        const saved = localStorage.getItem('lastNotifiedTimes_hotel');
        return saved ? JSON.parse(saved) : {};
    });

    useEffect(() => {
        localStorage.setItem('lastNotifiedTimes_hotel', JSON.stringify(lastNotifiedTimes));
    }, [lastNotifiedTimes]);

    const remindersRef = useRef(reminders);
    useEffect(() => {
        remindersRef.current = reminders;
        const currentIds = new Set(reminders.map(r => r.id));
        Object.keys(activeToastsRef.current).forEach(id => {
            if (!currentIds.has(parseInt(id))) {
                toast.dismiss(activeToastsRef.current[id]);
                delete activeToastsRef.current[id];
            }
        });
    }, [reminders]);

    useEffect(() => {
        const checkReminders = () => {
            const now = new Date();
            const nowMs = now.getTime();

            remindersRef.current.forEach(reminder => {
                if (reminder.is_completed || !reminder.due_date) return;

                const dueDate = new Date(reminder.due_date);
                const dueDateMs = dueDate.getTime();
                const lastNotifyTime = lastNotifiedTimes[reminder.id] || 0;

                const isDueToday = reminder.due_date.startsWith(new Date().toISOString().split('T')[0]);

                if (isDueToday && nowMs >= dueDateMs - 30000 && (nowMs - lastNotifyTime >= 300000)) {
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
                                    onClick={() => {
                                        toast.remove(t.id);
                                        delete activeToastsRef.current[reminder.id];

                                        // Snooze for 10 minutes (Local suppression only)
                                        setLastNotifiedTimes(prev => ({
                                            ...prev,
                                            [reminder.id]: Date.now() + (10 * 60000) - 300000
                                        }));
                                        toast.success("Snoozed for 10 min", { icon: '💤' });
                                    }}
                                    className="flex-1 py-3 text-[10px] sm:text-xs font-bold text-slate-300 hover:bg-slate-700 transition-colors uppercase tracking-wider cursor-pointer"
                                >
                                    Snooze 10m
                                </button>
                                <button
                                    onClick={() => {
                                        toast.remove(t.id);
                                        delete activeToastsRef.current[reminder.id];

                                        // Snooze for 1 hour (Local suppression only)
                                        setLastNotifiedTimes(prev => ({
                                            ...prev,
                                            [reminder.id]: Date.now() + (60 * 60000) - 300000
                                        }));
                                        toast.success("Snoozed for 1 hour", { icon: '💤' });
                                    }}
                                    className="flex-1 py-3 text-[10px] sm:text-xs font-bold text-slate-300 hover:bg-slate-700 transition-colors uppercase tracking-wider cursor-pointer"
                                >
                                    1h
                                </button>
                                <button
                                    onClick={() => {
                                        toast.remove(t.id);
                                        delete activeToastsRef.current[reminder.id];
                                        setLastNotifiedTimes(prev => ({
                                            ...prev,
                                            [reminder.id]: Date.now() + 3600000 - 300000
                                        }));
                                    }}
                                    className="flex-1 py-3 text-[10px] sm:text-xs font-black text-[#2d5bff] hover:bg-slate-700 transition-colors uppercase tracking-wider cursor-pointer"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    ), { duration: 8000, position: 'top-center' });

                    activeToastsRef.current[reminder.id] = tId;
                    setLastNotifiedTimes(prev => ({ ...prev, [reminder.id]: nowMs }));
                }
            });
        };

        const interval = setInterval(checkReminders, 30000);
        return () => clearInterval(interval);
    }, [lastNotifiedTimes]);

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
            toast.custom((t) => (
                <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-[448px] w-[95%] sm:w-full bg-white shadow-2xl rounded-[24px] sm:rounded-[32px] pointer-events-auto flex ring-[1px] ring-black ring-opacity-5 overflow-hidden border border-slate-100 mt-[24px]`}>
                    <div className="flex-1 w-0 p-[16px] sm:p-[24px]">
                        <div className="flex items-start gap-[12px] sm:gap-[16px]">
                            <div className="shrink-0">
                                <div className="h-[40px] w-[40px] sm:h-[56px] sm:w-[56px] bg-linear-to-br from-[#2d5bff] to-[#4a69ff] rounded-[12px] sm:rounded-[16px] flex items-center justify-center shadow-xl shadow-blue-500/20">
                                    <FaBell className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
                                </div>
                            </div>
                            <div className="flex-1">
                                <p className="text-lg sm:text-xl font-black text-slate-800 tracking-tight">Your Hotel Brief</p>
                                <p className="text-[11px] sm:text-[14px] font-bold text-slate-500">You have <span className="text-[#2d5bff] font-black">{notifications.length} priorities</span> today.</p>
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
                        <button onClick={() => { toast.dismiss(t.id); setHasShownAgenda(true); }} className="w-full border border-transparent rounded-none rounded-r-[24px] sm:rounded-r-[32px] p-4 sm:p-6 flex items-center justify-center text-xs sm:text-sm font-black text-[#2d5bff] hover:bg-slate-50 transition-all uppercase tracking-widest cursor-pointer">Got it</button>
                    </div>
                </div>
            ), { duration: 5000, position: 'top-center' });
            setHasShownAgenda(true);
        }
    }, [notifications.length, loading, hasShownAgenda]);

    const handleAdd = useCallback(async (reminderData) => {
        try {
            const res = await createReminder({ ...reminderData, sector: SECTOR });
            setReminders(prev => [res.data, ...prev]);
            toast.success("Reminder added!");
            window.dispatchEvent(new Event('refresh-reminders'));
        } catch {
            toast.error("Failed to add reminder");
        }
    }, []);

    const handleToggle = useCallback(async (id, currentStatus) => {
        if (currentStatus) {
            const previousReminders = [...reminders];
            setReminders(prev => prev.map(r => r.id === id ? { ...r, is_completed: false, completed_at: null } : r));
            try {
                await updateReminder(id, { is_completed: false, sector: SECTOR });
                toast.success("Task marked as incomplete");
                window.dispatchEvent(new Event('refresh-reminders'));
            } catch {
                setReminders(previousReminders);
                toast.error("Update failed");
            }
            return;
        }
        setConfirmToggle({ id, currentStatus });
    }, [reminders]);

    const confirmCompletion = useCallback(async () => {
        if (!confirmToggle) return;
        const { id } = confirmToggle;
        const previousReminders = [...reminders];
        const now = new Date().toISOString();
        setReminders(prev => prev.map(r => r.id === id ? { ...r, is_completed: true, completed_at: now } : r));
        setConfirmToggle(null);
        try {
            await updateReminder(id, { is_completed: true, sector: SECTOR });
            toast.success("Task completed! 🥳");
            window.dispatchEvent(new Event('refresh-reminders'));
        } catch {
            setReminders(previousReminders);
            toast.error("Update failed");
        }
    }, [confirmToggle, reminders]);

    const handleDelete = useCallback(async (id) => {
        try {
            await deleteReminder(id, { sector: SECTOR });
            setReminders(prev => prev.filter(r => r.id !== id));
            toast.success("Reminder deleted");
            window.dispatchEvent(new Event('refresh-reminders'));
        } catch {
            toast.error("Delete failed");
        }
    }, []);

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
                if (filterCategory && r.category !== filterCategory) matches = false;
                if (filterPriority && r.priority !== filterPriority) matches = false;
                if (searchQuery) {
                    const query = searchQuery.toLowerCase();
                    if (!r.title.toLowerCase().includes(query) && !r.description?.toLowerCase().includes(query)) matches = false;
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
                return 0;
            });
    }, [reminders, filterDate, periodType, customRange, filterCategory, filterPriority, sortBy, searchQuery]);

    const exportPeriod = useMemo(() => {
        if (periodType === 'today') return filterDate;
        if (periodType === 'range') return `${customRange.start} to ${customRange.end}`;
        return 'All Time';
    }, [periodType, filterDate, customRange]);

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#2d5bff]"></div></div>;

    return (
        <div className="flex flex-col items-center h-full px-[8px] sm:px-[16px] relative lg:overflow-hidden">
            <div className="w-full max-w-[1280px] flex flex-col h-full pt-[16px] pb-[8px] sm:py-[16px] md:py-[32px]">
                <h1 className="text-[20px] sm:text-[24px] md:text-[30px] font-black text-slate-800 mb-[16px] sm:mb-[24px] uppercase tracking-widest text-center transition-all duration-300">
                    Hotel Reminders
                </h1>
                <div className="flex justify-between items-center mb-[16px] sm:mb-[24px] shrink-0 bg-linear-to-r from-[#2d5bff] via-[#4a69ff] to-[#6366f1] p-[10px] sm:p-[16px] rounded-[12px] sm:rounded-[16px] border border-blue-400/30 shadow-xl shadow-blue-500/20 relative z-20">
                    <div className="flex items-center gap-[12px] sm:gap-[16px]">
                        <button onClick={() => navigate('/hotel-sector')} className="w-8 h-8 md:w-10 md:h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-white transition-all cursor-pointer"><FaChevronLeft className="w-5 h-5" /></button>
                        <div className="flex bg-blue-700/30 rounded-xl p-1 border border-blue-400/30 backdrop-blur-sm">
                            <button onClick={() => setActiveTab('tasks')} className={`px-4 py-2 rounded-lg text-[10px] sm:text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'tasks' ? 'bg-white text-[#2d5bff] shadow-lg' : 'text-blue-100 hover:bg-white/10'}`}>Tasks</button>
                            <button onClick={() => setActiveTab('notes')} className={`px-4 py-2 rounded-lg text-[10px] sm:text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'notes' ? 'bg-white text-[#2d5bff] shadow-lg' : 'text-blue-100 hover:bg-white/10'}`}>Notes</button>
                        </div>
                    </div>
                    <div className="flex items-center gap-[8px] sm:gap-[16px]">
                        <div className="relative">
                            <FaBell className={`text-[18px] sm:text-[24px] md:text-[30px] cursor-pointer transition-colors ${showNotifications ? 'text-yellow-300' : 'text-white/80 hover:text-white'}`} onClick={() => setShowNotifications(!showNotifications)} />
                            {notifications.length > 0 && <span className="absolute -top-[4px] sm:-top-[8px] -right-[4px] sm:-right-[8px] bg-[#ff4d4d] w-[14px] h-[14px] sm:w-[20px] sm:h-[20px] text-[7px] sm:text-[10px] flex items-center justify-center rounded-full font-bold text-white shadow-lg animate-pulse">{notifications.length}</span>}
                        </div>

                        <Link to="/hotel-sector/reminder-dashboard" className="bg-white/10 hover:bg-white/20 text-white p-[8px] rounded-[8px] transition-all"><LayoutDashboard className="w-[20px] h-[20px]" /></Link>
                    </div>
                </div>

                {activeTab === 'tasks' && (
                    <div className="flex flex-col lg:flex-row gap-[16px] sm:gap-[24px] md:gap-[32px] h-full min-h-0 items-start overflow-y-auto lg:overflow-visible custom-scrollbar pb-[40px] lg:pb-0">
                        <div className="w-full lg:w-[400px] xl:w-[448px] shrink-0">
                            <div className="glass rounded-[16px] sm:rounded-[24px] md:rounded-[32px] p-[16px] sm:p-[20px] md:p-[24px] shadow-2xl h-auto">
                                <h2 className="text-[14px] sm:text-[16px] md:text-[18px] font-black mb-[16px] sm:mb-[24px] text-slate-800 uppercase tracking-widest flex items-center gap-[8px]"><div className="w-[4px] h-[16px] bg-blue-500 rounded-full"></div>New Task</h2>
                                <ReminderForm onAdd={handleAdd} categories={categories} onManageCategories={() => setShowCategoryManager(true)} />
                            </div>
                        </div>
                        <div className="flex-1 min-h-0 w-full mb-[40px] lg:mb-0">
                            <div className="glass rounded-[16px] sm:rounded-[24px] md:rounded-[32px] p-[16px] sm:p-[20px] md:p-[24px] shadow-2xl flex flex-col h-auto lg:h-[600px] border border-white/20">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-[12px] sm:gap-[16px] mb-[16px] sm:mb-[24px]">
                                    <div className="flex flex-wrap items-center gap-[8px] sm:gap-[16px]">
                                        <h2 className="text-[14px] sm:text-[16px] md:text-[18px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-[8px]"><div className="w-[4px] h-[16px] bg-[#2d5bff] rounded-full"></div>Your Timeline</h2>
                                        <span className="text-[9px] sm:text-[10px] md:text-[12px] font-black px-[8px] sm:px-[12px] py-[2px] sm:py-[4px] rounded-full bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-widest">{processedReminders.length} Tasks</span>
                                        <div className="flex flex-wrap items-center gap-[4px] sm:gap-[8px]">
                                            <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-[6px] px-[10px] py-[6px] rounded-[10px] border transition-all ${showFilters ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 hover:border-slate-300'}`}>
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                                                <span className="text-[9px] sm:text-[10px] md:text-[12px] font-black uppercase tracking-widest">Filters</span>
                                            </button>

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
                                                    <div className="relative flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                                                        <input
                                                            type="date"
                                                            value={filterDate}
                                                            onChange={(e) => setFilterDate(e.target.value)}
                                                            className="bg-transparent text-[10px] font-black text-slate-600 outline-none cursor-pointer"
                                                        />
                                                        <FaCalendarAlt className="text-slate-300 w-3 h-3" />
                                                    </div>
                                                )}

                                                {periodType === 'range' && (
                                                    <div className="flex items-center gap-1">
                                                        <input
                                                            type="date"
                                                            value={customRange.start}
                                                            onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })}
                                                            className="bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-600 outline-none w-[90px]"
                                                        />
                                                        <span className="text-slate-400 font-bold">-</span>
                                                        <input
                                                            type="date"
                                                            value={customRange.end}
                                                            onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })}
                                                            className="bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-600 outline-none w-[90px]"
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            <button
                                                onClick={() => setIsSelectionMode(!isSelectionMode)}
                                                className={`text-[9px] sm:text-[10px] md:text-[12px] font-black uppercase tracking-widest px-[12px] py-[6px] rounded-[10px] border transition-all cursor-pointer ${isSelectionMode ? 'bg-[#2d5bff] text-white border-[#2d5bff]' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
                                            >
                                                {isSelectionMode ? 'Cancel' : 'Select'}
                                            </button>

                                            <div className="h-6 w-px bg-slate-200 mx-1"></div>

                                            <ExportButtons
                                                onExportCSV={() => exportReminderToCSV({ data: processedReminders, period: exportPeriod, filename: 'hotel_reminders' })}
                                                onExportPDF={() => exportReminderToPDF({ data: processedReminders, period: exportPeriod, filename: 'hotel_reminders' })}
                                                onExportTXT={() => exportReminderToTXT({ data: processedReminders, period: exportPeriod, filename: 'hotel_reminders' })}
                                            />
                                        </div>
                                    </div>
                                </div>
                                {showFilters && (
                                    <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-slate-50/50 rounded-2xl border border-slate-100 animate-in slide-in-from-top-2 duration-200">
                                        <div className="relative flex-1 min-w-[200px]">
                                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search tasks..." className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs font-bold placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all" />
                                        </div>
                                        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all cursor-pointer">
                                            <option value="">All Categories</option>
                                            <option value="General">General</option>
                                            {categories.filter(c => c.name !== 'General').map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                        </select>
                                        <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all cursor-pointer">
                                            <option value="">All Priorities</option>
                                            <option value="high">High</option>
                                            <option value="medium">Medium</option>
                                            <option value="low">Low</option>
                                        </select>
                                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all cursor-pointer ml-auto">
                                            <option value="due_date">Sort: Due Date</option>
                                            <option value="newest">Sort: Newest First</option>
                                            <option value="oldest">Sort: Oldest First</option>
                                            <option value="priority">Sort: High Priority First</option>
                                        </select>
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
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'notes' && (
                    <div className="glass rounded-[32px] p-8 shadow-2xl min-h-[600px] mt-4">
                        <Notes isEmbedded={true} sector="hotel" />
                    </div>
                )}
            </div>

            {confirmToggle && (
                <div className="fixed inset-0 z-1100 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-[32px] p-8 max-w-sm w-full text-center shadow-2xl border border-white/20 animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">🎉</div>
                        <h3 className="text-xl font-black text-slate-800 mb-2">Mark as Complete?</h3>
                        <p className="text-slate-500 text-sm mb-6">Great job on finishing this task! Ready to celebrate?</p>
                        <div className="flex gap-3">
                            <button onClick={() => setConfirmToggle(null)} className="flex-1 py-3 text-slate-400 font-black uppercase tracking-wider hover:bg-slate-50 rounded-xl transition-all h-[48px]">Not yet</button>
                            <button onClick={confirmCompletion} className="flex-1 py-3 bg-[#2d5bff] text-white font-black uppercase tracking-wider rounded-xl shadow-lg shadow-blue-500/30 hover:-translate-y-1 transition-all h-[48px]">Yes, Done!</button>
                        </div>
                    </div>
                </div>
            )}

            {showCategoryManager && (
                <CategoryManager
                    categories={categories}
                    onUpdate={() => fetchData(true)}
                    onClose={() => setShowCategoryManager(false)}
                    onCreate={createCategory}
                    onDelete={deleteCategory}
                />
            )}


        </div>
    );
};

export default HotelReminders;
