import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { getReminders, createReminder, updateReminder, deleteReminder, triggerMissedAlert, getCategories, createCategory, deleteCategory } from '../../api/Reminder/hotelReminder';
import { getMe } from '../../api/authApi';
import ReminderForm from '../../components/Common/ReminderForm';
import ReminderList from '../../components/Common/ReminderList';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaBell, FaTimes, FaChevronLeft } from 'react-icons/fa';
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

    // Email Modal State
    const [showMailModal, setShowMailModal] = useState(false);
    const [mailConfig, setMailConfig] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        customMessage: '',
        status: 'pending'
    });

    const lastFetchRef = useRef(0);

    const fetchData = async (force = false) => {
        const now = Date.now();
        if (!force && now - lastFetchRef.current < 60000 && !loading) {
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
            setCategories(categoriesRes.data.data || []);
            localStorage.setItem('user', JSON.stringify(userRes.data));
            lastFetchRef.current = Date.now();
        } catch (error) {
            console.error("Error fetching data", error);
        } finally {
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
                                    onClick={async () => {
                                        toast.remove(t.id);
                                        delete activeToastsRef.current[reminder.id];
                                        if (!remindersRef.current.find(r => r.id === reminder.id)) {
                                            toast.error("Task no longer exists");
                                            return;
                                        }
                                        try {
                                            const newDate = new Date(Date.now() + 10 * 60000).toISOString();
                                            await updateReminder(reminder.id, { due_date: newDate, sector: SECTOR });
                                            setReminders(prev => prev.map(r => r.id === reminder.id ? { ...r, due_date: newDate } : r));
                                            toast.success("Snoozed for 10 min", { icon: '💤' });
                                        } catch (e) {
                                            toast.error("Failed to snooze");
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
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex border-l border-slate-50">
                        <button onClick={() => { toast.dismiss(t.id); setHasShownAgenda(true); }} className="w-full border border-transparent rounded-none rounded-r-[24px] sm:rounded-r-[32px] p-4 sm:p-6 flex items-center justify-center text-xs sm:text-sm font-black text-[#2d5bff] hover:bg-slate-50 transition-all uppercase tracking-widest cursor-pointer">Got it</button>
                    </div>
                </div>
            ), { duration: 4000, position: 'top-center' });
            setHasShownAgenda(true);
        }
    }, [notifications.length, loading, hasShownAgenda]);

    const handleAdd = useCallback(async (reminderData) => {
        try {
            const res = await createReminder({ ...reminderData, sector: SECTOR });
            setReminders(prev => [res.data, ...prev]);
            toast.success("Reminder added!");
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
                        <button onClick={() => setShowMailModal(true)} className="bg-white/10 hover:bg-white/20 text-white p-[8px] rounded-[8px] transition-all"><svg className="w-[20px] h-[20px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg></button>
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
                            <div className="glass rounded-[16px] sm:rounded-[24px] md:rounded-[32px] p-[16px] sm:p-[20px] md:p-[24px] shadow-2xl flex flex-col h-auto sm:min-h-[516px]">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-[12px] sm:gap-[16px] mb-[16px] sm:mb-[24px]">
                                    <div className="flex flex-wrap items-center gap-[8px] sm:gap-[16px]">
                                        <h2 className="text-[14px] sm:text-[16px] md:text-[18px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-[8px]"><div className="w-[4px] h-[16px] bg-[#2d5bff] rounded-full"></div>Timeline</h2>
                                        <span className="text-[9px] sm:text-[10px] md:text-[12px] font-black px-[8px] sm:px-[12px] py-[2px] sm:py-[4px] rounded-full bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-widest">{processedReminders.length} Tasks</span>
                                        <div className="flex flex-wrap items-center gap-[4px] sm:gap-[8px]">
                                            <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-[6px] px-[10px] py-[4px] rounded-[8px] border transition-all ${showFilters ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 hover:border-slate-300'}`}><span className="text-[9px] sm:text-[10px] md:text-[12px] font-black uppercase tracking-widest">Filters</span></button>
                                            <ExportButtons
                                                onExportCSV={() => exportReminderToCSV({ data: processedReminders, period: exportPeriod, filename: 'hotel_reminders' })}
                                                onExportPDF={() => exportReminderToPDF({ data: processedReminders, period: exportPeriod, filename: 'hotel_reminders' })}
                                                onExportTXT={() => exportReminderToTXT({ data: processedReminders, period: exportPeriod, filename: 'hotel_reminders' })}
                                            />
                                        </div>
                                    </div>
                                </div>
                                {showFilters && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search..." className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold" />
                                        <select value={periodType} onChange={(e) => setPeriodType(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold">
                                            <option value="today">Today</option>
                                            <option value="all">All</option>
                                            <option value="range">Range</option>
                                        </select>
                                        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold">
                                            <option value="">All Categories</option>
                                            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                        </select>
                                    </div>
                                )}
                                <ReminderList reminders={processedReminders} onToggle={handleToggle} onDelete={handleDelete} isSelectionMode={isSelectionMode} selectedIds={selectedIds} setSelectedIds={setSelectedIds} />
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
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
                    onCreate={(data) => createCategory({ name: data, sector: SECTOR }).then(() => fetchData(true))}
                    onDelete={(id) => deleteCategory(id, { sector: SECTOR }).then(() => fetchData(true))}
                />
            )}

            {showMailModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">Send Task Report</h3>
                            <button onClick={() => setShowMailModal(false)} className="text-slate-400 hover:text-red-500"><FaTimes /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <input type="date" value={mailConfig.startDate} onChange={e => setMailConfig({ ...mailConfig, startDate: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold" />
                            <textarea placeholder="Custom message (optional)" value={mailConfig.customMessage} onChange={e => setMailConfig({ ...mailConfig, customMessage: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold h-32 resize-none" />
                            <button onClick={async () => {
                                try {
                                    await triggerMissedAlert({ date: mailConfig.startDate, customMessage: mailConfig.customMessage, sector: SECTOR });
                                    toast.success("Report email sent!");
                                    setShowMailModal(false);
                                } catch (e) { toast.error("Failed to send"); }
                            }} className="w-full bg-blue-600 text-white font-black py-4 rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all text-sm uppercase tracking-widest">Send Now</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HotelReminders;
