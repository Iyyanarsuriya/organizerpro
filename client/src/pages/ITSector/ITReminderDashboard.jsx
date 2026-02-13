import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCalendarAlt, FaGoogle } from 'react-icons/fa';
import { IoArrowBack } from "react-icons/io5";
import { getReminders } from '../../api/Reminder/itReminder'; // IT sector context
import toast from 'react-hot-toast';
import { exportReminderToCSV, exportReminderToTXT, exportReminderToPDF } from '../../utils/exportUtils/index.js';
import ExportButtons from '../../components/Common/ExportButtons';

const ITReminderDashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [reminders, setReminders] = useState([]);

    // Filter State
    const [periodType, setPeriodType] = useState('all'); // 'all', 'today', 'range'
    const [customRange, setCustomRange] = useState({ start: '', end: '' });
    const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'completed', 'pending'

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await getReminders({ sector: 'it' });
            setReminders(res.data || []);
        } catch (error) {
            console.error("Error fetching reminders", error);
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    // Filter Logic
    const processedReminders = useMemo(() => {
        return reminders.filter(r => {
            let matches = true;

            // Period Filter
            if (periodType === 'today') {
                const today = new Date().toISOString().split('T')[0];
                if (!r.due_date || !r.due_date.startsWith(today)) matches = false;
            } else if (periodType === 'range') {
                if (!r.due_date) matches = false;
                else {
                    const rDate = r.due_date.split('T')[0];
                    if (customRange.start && rDate < customRange.start) matches = false;
                    if (customRange.end && rDate > customRange.end) matches = false;
                }
            }

            // Status Filter
            if (filterStatus !== 'all') {
                const isCompleted = filterStatus === 'completed';
                if (r.is_completed !== isCompleted) matches = false;
            }

            return matches;
        });
    }, [reminders, periodType, customRange, filterStatus]);

    // Derived Stats
    const stats = useMemo(() => {
        const total = processedReminders.length;
        const completed = processedReminders.filter(r => r.is_completed).length;
        const remaining = total - completed;
        return { total, completed, remaining };
    }, [processedReminders]);

    const exportPeriod = useMemo(() => {
        if (periodType === 'today') return new Date().toLocaleDateString('en-GB');
        if (periodType === 'range') {
            if (customRange.start && customRange.end) return `${customRange.start} to ${customRange.end}`;
            return 'Custom Range';
        }
        return 'All Time';
    }, [periodType, customRange]);

    const handleLogout = () => {
        localStorage.clear();
        sessionStorage.clear();
        navigate('/');
        window.dispatchEvent(new Event('storage'));
        toast.success("Logged out successfully");
    };

    const handleConnectCalendar = () => {
        toast('Google Calendar integration coming soon!', { icon: '📅' });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#6366f1]"></div>
            </div>
        );
    }

    const currentDate = new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });

    return (
        <div className="min-h-screen bg-[#f8fafc] p-4 sm:p-8 font-['Outfit']">
            <div className="max-w-5xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => navigate('/it-sector/reminders')}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <IoArrowBack className="text-sm" />
                        Back to Reminders
                    </button>

                    <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-black text-xs shadow-sm">
                        <span>{currentDate}</span>
                        <FaCalendarAlt className="text-slate-400" />
                    </div>
                </div>

                {/* Filters & Export Bar */}
                <div className="bg-white rounded-[24px] p-4 sm:p-6 shadow-lg shadow-slate-200/50 border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">

                        {/* Period Filter */}
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Period:</span>
                            <select
                                value={periodType}
                                onChange={(e) => setPeriodType(e.target.value)}
                                className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer uppercase tracking-wider"
                            >
                                <option value="all">All Time</option>
                                <option value="today">Today</option>
                                <option value="range">Range</option>
                            </select>
                        </div>

                        {/* Date Range Inputs */}
                        {periodType === 'range' && (
                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl animate-in fade-in zoom-in-95 duration-200">
                                <input
                                    type="date"
                                    value={customRange.start}
                                    onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })}
                                    className="bg-transparent text-[10px] font-bold text-slate-600 outline-none w-[90px]"
                                />
                                <span className="text-slate-400 font-bold">-</span>
                                <input
                                    type="date"
                                    value={customRange.end}
                                    onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })}
                                    className="bg-transparent text-[10px] font-bold text-slate-600 outline-none w-[90px]"
                                />
                            </div>
                        )}

                        {/* Status Filter */}
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Status:</span>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer uppercase tracking-wider"
                            >
                                <option value="all">All</option>
                                <option value="completed">Completed</option>
                                <option value="pending">Pending</option>
                            </select>
                        </div>
                    </div>

                    {/* Export Actions */}
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest hidden sm:inline">Export Report</span>
                        <div className="h-8 w-px bg-slate-100 hidden sm:block"></div>
                        <ExportButtons
                            onExportCSV={() => exportReminderToCSV({ data: processedReminders, period: exportPeriod, filename: `it_reminders_report_${new Date().toISOString().split('T')[0]}` })}
                            onExportPDF={() => exportReminderToPDF({ data: processedReminders, period: exportPeriod, filename: `it_reminders_report_${new Date().toISOString().split('T')[0]}` })}
                            onExportTXT={() => exportReminderToTXT({ data: processedReminders, period: exportPeriod, filename: `it_reminders_report_${new Date().toISOString().split('T')[0]}` })}
                        />
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Total Tasks */}
                    <div className="bg-white rounded-[32px] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center justify-center text-center transition-all hover:scale-105 duration-300">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Total Tasks</h3>
                        <div className="text-6xl font-black text-[#6366f1] drop-shadow-sm">{stats.total}</div>
                        {periodType !== 'all' && <span className="text-[10px] font-bold text-slate-300 mt-2 uppercase tracking-wide">Filtered</span>}
                    </div>

                    {/* Completed */}
                    <div className="bg-white rounded-[32px] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center justify-center text-center transition-all hover:scale-105 duration-300">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 text-[#00d1a0]/80">Completed</h3>
                        <div className="text-6xl font-black text-[#00d1a0] drop-shadow-sm">{stats.completed}</div>
                    </div>

                    {/* Remaining */}
                    <div className="bg-white rounded-[32px] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center justify-center text-center transition-all hover:scale-105 duration-300">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 text-orange-400">Remaining</h3>
                        <div className="text-6xl font-black text-orange-400 drop-shadow-sm">{stats.remaining}</div>
                    </div>
                </div>

                {/* Google Calendar Section */}
                <div className="bg-white rounded-[32px] p-4 sm:p-6 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-full bg-white shadow-lg border border-slate-100 flex items-center justify-center shrink-0">
                            <FaGoogle className="text-3xl text-blue-500" />
                        </div>
                        <div className="text-center sm:text-left">
                            <h3 className="text-lg font-black text-slate-800">Google Calendar</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Not Connected</p>
                        </div>
                    </div>
                    <button
                        onClick={handleConnectCalendar}
                        className="px-8 py-4 bg-[#6366f1] hover:bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/30 transition-all active:scale-95 flex items-center gap-2"
                    >
                        <FaCalendarAlt />
                        Connect Calendar
                    </button>
                </div>

                <div className="text-center pt-8 pb-4">
                    <p className="text-[10px] font-black text-slate-400/50 uppercase tracking-[0.2em]">Link your calendar to get automatic notifications & event sync</p>
                </div>


                {/* Account Settings Header */}
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-slate-100 rounded-lg text-slate-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    </div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Account Settings</h3>
                </div>

                {/* Session / Logout */}
                <div className="bg-white rounded-[32px] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="text-center sm:text-left">
                        <h3 className="text-lg font-black text-slate-800">Session</h3>
                        <p className="text-xs font-medium text-slate-500">Log out of your current session</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="px-8 py-3 bg-white text-red-500 border border-slate-200 hover:border-red-200 hover:bg-red-50 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95"
                    >
                        Logout
                    </button>
                </div>

            </div>
        </div>
    );
};

export default ITReminderDashboard;
