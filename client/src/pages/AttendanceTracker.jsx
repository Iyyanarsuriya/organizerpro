import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    getAttendances,
    createAttendance,
    updateAttendance,
    deleteAttendance,
    getAttendanceStats,
    getMemberSummary,
    quickMarkAttendance
} from '../api/attendanceApi';
import { getProjects, createProject, deleteProject } from '../api/projectApi';
import { getActiveMembers } from '../api/memberApi';
import toast from 'react-hot-toast';
import {
    FaCheckCircle, FaTimesCircle, FaClock, FaExclamationCircle,
    FaPlus, FaTrash, FaEdit, FaCalendarAlt, FaSearch,
    FaFilter, FaChartBar, FaUserCheck, FaChevronLeft, FaChevronRight,
    FaFolderPlus, FaTimes, FaInbox, FaUserEdit
} from 'react-icons/fa';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FaFileAlt } from 'react-icons/fa';
import ProjectManager from '../components/ProjectManager';
import MemberManager from '../components/MemberManager';

const AttendanceTracker = () => {
    const navigate = useNavigate();
    const [attendances, setAttendances] = useState([]);
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [projects, setProjects] = useState([]);
    const [members, setMembers] = useState([]);
    const [showProjectManager, setShowProjectManager] = useState(false);
    const [showMemberManager, setShowMemberManager] = useState(false);
    const [filterProject, setFilterProject] = useState('');
    const [filterMember, setFilterMember] = useState('');
    const [periodType, setPeriodType] = useState('day'); // 'month', 'year', 'day', 'range'
    const [currentPeriod, setCurrentPeriod] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
    const [customRange, setCustomRange] = useState({ start: '', end: '' });
    const [searchQuery, setSearchQuery] = useState('');
    const [memberSummary, setMemberSummary] = useState([]);
    const [activeTab, setActiveTab] = useState('records'); // 'records', 'summary', 'quick'
    const [showCustomReportModal, setShowCustomReportModal] = useState(false);
    const [customReportLoading, setCustomReportLoading] = useState(false);
    const [customReportForm, setCustomReportForm] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        projectId: '',
        memberId: '',
        status: 'all'
    });

    const [formData, setFormData] = useState({
        subject: '',
        status: 'present',
        date: new Date().toISOString().split('T')[0],
        note: '',
        project_id: '',
        member_id: ''
    });

    const statusOptions = [
        { id: 'present', label: 'Present', icon: FaCheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100' },
        { id: 'absent', label: 'Absent', icon: FaTimesCircle, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100' },
        { id: 'late', label: 'Late', icon: FaClock, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100' },
        { id: 'half-day', label: 'Half Day', icon: FaExclamationCircle, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100' }
    ];

    const fetchData = async () => {
        try {
            const isRange = periodType === 'range';
            const rangeStart = isRange ? customRange.start : null;
            const rangeEnd = isRange ? customRange.end : null;

            if (isRange && (!rangeStart || !rangeEnd)) return;

            const [attRes, statsRes, summaryRes, projRes, membersRes] = await Promise.all([
                getAttendances({
                    projectId: filterProject,
                    memberId: filterMember,
                    period: isRange ? null : currentPeriod,
                    startDate: rangeStart,
                    endDate: rangeEnd
                }),
                getAttendanceStats({
                    projectId: filterProject,
                    memberId: filterMember,
                    period: isRange ? null : currentPeriod,
                    startDate: rangeStart,
                    endDate: rangeEnd
                }),
                getMemberSummary({
                    projectId: filterProject,
                    period: isRange ? null : currentPeriod,
                    startDate: rangeStart,
                    endDate: rangeEnd
                }),
                getProjects(),
                getActiveMembers()
            ]);
            setAttendances(attRes.data.data);
            setStats(attRes.data.data.length > 0 ? statsRes.data.data : []);
            setMemberSummary(summaryRes.data.data);
            setProjects(projRes.data);
            setMembers(membersRes.data.data);
            setLoading(false);
        } catch (error) {
            toast.error("Failed to fetch attendance data");
            setLoading(false);
        }
    };

    useEffect(() => {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');

        if (periodType === 'year') {
            if (currentPeriod.length !== 4) setCurrentPeriod(`${yyyy}`);
        } else if (periodType === 'month') {
            if (currentPeriod.length !== 7) setCurrentPeriod(`${yyyy}-${mm}`);
        } else if (periodType === 'day') {
            if (currentPeriod.length !== 10) setCurrentPeriod(`${yyyy}-${mm}-${dd}`);
        } else if (periodType === 'range') {
            if (!customRange.start) setCustomRange({ start: `${yyyy}-${mm}-${dd}`, end: `${yyyy}-${mm}-${dd}` });
        }
    }, [periodType]);

    useEffect(() => {
        fetchData();
    }, [currentPeriod, filterProject, filterMember, periodType, customRange.start, customRange.end]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await updateAttendance(editingId, formData);
                toast.success("Attendance updated!");
            } else {
                await createAttendance(formData);
                toast.success("Attendance marked!");
            }
            setShowAddModal(false);
            setEditingId(null);
            resetForm();
            fetchData();
        } catch (error) {
            toast.error(editingId ? "Failed to update" : "Failed to mark attendance");
        }
    };

    const handleQuickMark = async (memberId, status) => {
        try {
            const date = periodType === 'day' ? currentPeriod : new Date().toISOString().split('T')[0];
            await quickMarkAttendance({
                member_id: memberId,
                status,
                date,
                project_id: filterProject || null,
                subject: `Daily Attendance`
            });
            toast.success("Marked successfully");
            fetchData();
        } catch (error) {
            toast.error("Failed to mark attendance");
        }
    };

    const resetForm = () => {
        setFormData({
            subject: '',
            status: 'present',
            date: new Date().toISOString().split('T')[0],
            note: '',
            project_id: filterProject || '',
            member_id: ''
        });
        setEditingId(null);
    };

    const handleEdit = (item) => {
        setFormData({
            subject: item.subject,
            status: item.status,
            date: new Date(item.date).toISOString().split('T')[0],
            note: item.note || '',
            project_id: item.project_id || '',
            member_id: item.member_id || ''
        });
        setEditingId(item.id);
        setShowAddModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this record?")) {
            try {
                await deleteAttendance(id);
                toast.success("Record deleted");
                fetchData();
            } catch (error) {
                toast.error("Failed to delete record");
            }
        }
    };

    // Export Functions
    const handleExportCSV = (data = attendances, filters = {}) => {
        const reportData = data;
        if (reportData.length === 0) {
            toast.error("No data to export");
            return;
        }

        const headers = ["Date", "Member", "Status", "Subject", "Project", "Note"];
        const rows = reportData.map(a => [
            new Date(a.date).toLocaleDateString('en-GB'),
            a.member_name || 'N/A',
            a.status.toUpperCase(),
            a.subject,
            a.project_name || 'N/A',
            a.note || ''
        ]);

        const periodStr = filters.startDate && filters.endDate
            ? `${filters.startDate}_to_${filters.endDate}`
            : currentPeriod;

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `attendance_report_${periodStr}.csv`);
        link.click();
    };

    const handleExportTXT = (data = attendances, reportStats = stats, filters = {}) => {
        const reportData = data;
        if (reportData.length === 0) {
            toast.error("No data to export");
            return;
        }

        let txt = `ATTENDANCE REPORT\n`;
        const now = new Date();
        const nowFormatted = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${now.getHours() % 12 || 12}:${String(now.getMinutes()).padStart(2, '0')} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;

        const periodStr = filters.startDate && filters.endDate
            ? `${filters.startDate} to ${filters.endDate}`
            : (periodType === 'range' ? `${customRange.start} to ${customRange.end}` : currentPeriod);

        txt += `Period: ${periodStr}\n`;
        txt += `Generated on: ${nowFormatted}\n\n`;

        txt += `SUMMARIZED STATS\n`;
        txt += `-------------------\n`;
        reportStats.forEach(s => {
            txt += `${s.status.toUpperCase()}: ${s.count}\n`;
        });
        txt += `\n`;

        txt += `ATTENDANCE LOG\n`;
        txt += `-------------------\n`;
        reportData.forEach(a => {
            const d = new Date(a.date);
            const dateFmt = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
            txt += `${dateFmt} | ${a.member_name?.padEnd(20) || 'N/A'.padEnd(20)} | ${a.status.toUpperCase().padEnd(10)} | ${a.subject}\n`;
        });

        const blob = new Blob([txt], { type: 'text/plain;charset=utf-8;' });
        const link = document.createElement("a");
        link.setAttribute("href", URL.createObjectURL(blob));
        link.setAttribute("download", `attendance_report_${periodStr}.txt`);
        link.click();
    };

    const handleExportPDF = (data = attendances, reportStats = stats, filters = {}) => {
        const reportData = data;
        if (reportData.length === 0) {
            toast.error("No data to export");
            return;
        }

        const doc = new jsPDF();
        const memberName = filters.memberId ? members.find(m => m.id == filters.memberId)?.name : (filterMember ? members.find(m => m.id == filterMember)?.name : 'Everyone');
        const projectName = filters.projectId ? projects.find(p => p.id == filters.projectId)?.name : (filterProject ? projects.find(p => p.id == filterProject)?.name : 'All Projects');

        doc.setFontSize(20);
        doc.text('Attendance Report', 14, 22);

        doc.setFontSize(10);
        doc.setTextColor(100);
        const now = new Date();
        const nowFormatted = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${now.getHours() % 12 || 12}:${String(now.getMinutes()).padStart(2, '0')} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;

        doc.text(`Generated on: ${nowFormatted}`, 14, 30);

        const periodStr = filters.startDate && filters.endDate
            ? `${filters.startDate} to ${filters.endDate}`
            : (periodType === 'range' ? `${customRange.start} to ${customRange.end}` : currentPeriod);

        doc.text(`Period: ${periodStr}`, 14, 35);
        doc.text(`Member: ${memberName} | Project: ${projectName}`, 14, 40);

        // Stats Summary
        doc.setDrawColor(230);
        doc.setFillColor(245, 247, 250);
        doc.rect(14, 45, 182, 20, 'F');
        doc.setFontSize(11);
        doc.setTextColor(40);

        let statsText = "";
        reportStats.forEach(s => {
            statsText += `${s.status.toUpperCase()}: ${s.count}  `;
        });
        doc.text(statsText, 20, 58);

        autoTable(doc, {
            startY: 70,
            head: [['Date', 'Member', 'Status', 'Subject', 'Project']],
            body: reportData.map(a => {
                const d = new Date(a.date);
                const dateFmt = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
                return [
                    dateFmt,
                    a.member_name || 'N/A',
                    a.status.toUpperCase(),
                    a.subject,
                    a.project_name || 'N/A'
                ];
            }),
            theme: 'striped',
            headStyles: { fillColor: [37, 99, 235] },
            alternateRowStyles: { fillColor: [250, 250, 250] },
        });

        doc.save(`attendance_report_${periodStr}.pdf`);
    };

    const handleGenerateCustomReport = async (format = 'PDF') => {
        if (!customReportForm.startDate || !customReportForm.endDate) {
            toast.error("Please select both start and end dates");
            return;
        }

        setCustomReportLoading(format);
        try {
            const [attRes, statsRes] = await Promise.all([
                getAttendances({
                    projectId: customReportForm.projectId,
                    memberId: customReportForm.memberId,
                    startDate: customReportForm.startDate,
                    endDate: customReportForm.endDate,
                    status: customReportForm.status === 'all' ? null : customReportForm.status
                }),
                getAttendanceStats({
                    projectId: customReportForm.projectId,
                    memberId: customReportForm.memberId,
                    startDate: customReportForm.startDate,
                    endDate: customReportForm.endDate,
                    status: customReportForm.status === 'all' ? null : customReportForm.status
                })
            ]);

            if (format === 'PDF') handleExportPDF(attRes.data.data, statsRes.data.data, customReportForm);
            else if (format === 'CSV') handleExportCSV(attRes.data.data, customReportForm);
            else if (format === 'TXT') handleExportTXT(attRes.data.data, statsRes.data.data, customReportForm);

            setShowCustomReportModal(false);
            toast.success("Attendance report generated!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate report");
        } finally {
            setCustomReportLoading(false);
        }
    };

    const filteredAttendances = useMemo(() => {
        return attendances.filter(a =>
            a.subject.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [attendances, searchQuery]);

    const activeMembersAttendanceMat = useMemo(() => {
        if (periodType !== 'day') return {};
        const map = {};
        attendances.forEach(a => {
            if (a.member_id) {
                map[a.member_id] = a.status;
            }
        });
        return map;
    }, [attendances, periodType]);

    const pieData = stats.map(s => {
        const option = statusOptions.find(o => o.id === s.status);
        return {
            name: option ? option.label : s.status,
            value: s.count,
            color: option ? getHexColor(s.status) : '#ccc'
        };
    });

    function getHexColor(status) {
        switch (status) {
            case 'present': return '#10b981';
            case 'absent': return '#ef4444';
            case 'late': return '#f59e0b';
            case 'half-day': return '#3b82f6';
            default: return '#94a3b8';
        }
    }

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-slate-50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f8fafc] font-['Outfit'] text-slate-900 overflow-x-hidden">
            {/* Glossy Header Background */}
            <div className="fixed top-0 left-0 w-full h-80 bg-linear-to-b from-blue-50/50 to-transparent pointer-events-none -z-10"></div>

            {/* Header */}
            <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-40 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-linear-to-br from-blue-500 to-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                                <FaUserCheck className="text-white text-lg sm:text-xl" />
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Attendance</h1>
                                <p className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest">Consistency is key</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 lg:flex lg:flex-wrap items-center gap-2 sm:gap-3">
                            <div className="col-span-2 sm:col-span-1 h-[40px] flex items-center p-1 bg-slate-50 border border-slate-200 rounded-[12px] shadow-sm overflow-x-auto custom-scrollbar">
                                {['day', 'month', 'year', 'range'].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setPeriodType(type)}
                                        className={`flex-1 px-3 py-1.5 rounded-[8px] text-[9px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${periodType === type ? 'bg-white text-blue-600 shadow-xs border border-blue-100 ring-2 ring-blue-500/5' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>

                            <div className="col-span-2 sm:col-span-1 h-[40px] flex items-center bg-white border border-slate-200 px-3 rounded-[12px] shadow-sm hover:border-blue-500 transition-colors">
                                {periodType === 'day' ? (
                                    <input
                                        type="date"
                                        value={currentPeriod.length === 10 ? currentPeriod : ''}
                                        onChange={(e) => setCurrentPeriod(e.target.value)}
                                        className="w-full text-[11px] sm:text-[12px] font-bold text-slate-700 outline-none bg-transparent cursor-pointer font-['Outfit']"
                                    />
                                ) : periodType === 'month' ? (
                                    <input
                                        type="month"
                                        value={currentPeriod.length === 7 ? currentPeriod : ''}
                                        onChange={(e) => setCurrentPeriod(e.target.value)}
                                        className="w-full text-[11px] sm:text-[12px] font-bold text-slate-700 outline-none bg-transparent cursor-pointer font-['Outfit']"
                                    />
                                ) : periodType === 'year' ? (
                                    <input
                                        type="number"
                                        min="2000"
                                        max="2100"
                                        value={currentPeriod.slice(0, 4)}
                                        onChange={(e) => setCurrentPeriod(e.target.value)}
                                        className="w-full text-[11px] sm:text-[12px] font-bold text-slate-700 outline-none bg-transparent cursor-pointer font-['Outfit']"
                                    />
                                ) : (
                                    <div className="flex items-center gap-1 sm:gap-2 w-full">
                                        <input
                                            type="date"
                                            value={customRange.start}
                                            onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })}
                                            className="text-[9px] sm:text-[11px] font-bold text-slate-700 outline-none bg-transparent cursor-pointer font-['Outfit'] w-full min-w-0"
                                        />
                                        <span className="text-[9px] text-slate-400">-</span>
                                        <input
                                            type="date"
                                            value={customRange.end}
                                            onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })}
                                            className="text-[9px] sm:text-[11px] font-bold text-slate-700 outline-none bg-transparent cursor-pointer font-['Outfit'] w-full min-w-0"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="col-span-1 flex items-center gap-1.5">
                                <select
                                    value={filterProject}
                                    onChange={(e) => setFilterProject(e.target.value)}
                                    className="flex-1 bg-white border border-slate-200 rounded-xl px-2 sm:px-4 h-[40px] text-[11px] sm:text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all cursor-pointer shadow-sm"
                                >
                                    <option value="">Projects</option>
                                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                                <button
                                    onClick={() => setShowProjectManager(true)}
                                    className="w-[40px] h-[40px] bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm border border-slate-200 shrink-0"
                                    title="Manage Projects"
                                >
                                    <FaFolderPlus />
                                </button>
                            </div>

                            <div className="col-span-1 flex items-center gap-1.5">
                                <select
                                    value={filterMember}
                                    onChange={(e) => setFilterMember(e.target.value)}
                                    className="flex-1 bg-white border border-slate-200 rounded-xl px-2 sm:px-4 h-[40px] text-[11px] sm:text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all cursor-pointer shadow-sm"
                                >
                                    <option value="">Everyone</option>
                                    {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                </select>
                                <button
                                    onClick={() => setShowMemberManager(true)}
                                    className="w-[40px] h-[40px] bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center hover:bg-orange-50 hover:text-orange-600 transition-all shadow-sm border border-slate-200 shrink-0"
                                    title="Manage Members"
                                >
                                    <FaUserEdit />
                                </button>
                            </div>

                            <button
                                onClick={() => setShowAddModal(true)}
                                className="col-span-2 lg:col-auto bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 rounded-xl text-[11px] sm:text-sm font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                            >
                                <FaPlus className="text-xs sm:text-sm" /> Mark
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* View Selector */}
                <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner border border-slate-200 w-full sm:w-fit mb-8 overflow-x-auto custom-scrollbar">
                    {[
                        { id: 'records', label: 'Records' },
                        { id: 'summary', label: 'Summary' },
                        { id: 'quick', label: 'Daily Sheet' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === 'records' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100">
                                <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2 font-['Outfit']">
                                    <FaChartBar className="text-blue-500" />
                                    {periodType.charAt(0).toUpperCase() + periodType.slice(1)} Stats
                                </h3>
                                <div className="h-64">
                                    {stats.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={pieData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {pieData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={{
                                                        borderRadius: '16px',
                                                        border: 'none',
                                                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                                                        padding: '12px'
                                                    }}
                                                />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                            <FaInbox className="text-4xl mb-4 opacity-20" />
                                            <p className="text-xs font-bold uppercase tracking-widest font-['Outfit']">No data available</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 min-h-[500px]">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                                    <h3 className="text-lg font-black text-slate-900 font-['Outfit']">Recent Records</h3>
                                    <div className="relative flex-1 max-w-xs">
                                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                        <input
                                            type="text"
                                            placeholder="Search subject..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-11 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-['Outfit']"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    {filteredAttendances.length > 0 ? filteredAttendances.map((item, idx) => {
                                        const option = statusOptions.find(o => o.id === item.status);
                                        return (
                                            <div
                                                key={item.id}
                                                className="group p-5 bg-white border border-slate-100 rounded-[24px] hover:shadow-xl hover:shadow-blue-500/5 hover:border-blue-500/20 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2"
                                                style={{ animationDelay: `${idx * 50}ms` }}
                                            >
                                                <div className="flex items-center justify-between gap-4">
                                                    <div className="flex items-center gap-4 min-w-0">
                                                        <div className={`w-12 h-12 sm:w-14 sm:h-14 ${option?.bg} rounded-2xl flex items-center justify-center text-xl sm:text-2xl ${option?.color} transition-transform group-hover:scale-110 duration-500 shrink-0`}>
                                                            {option && <option.icon />}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                                                <h4 className="font-black text-slate-900 leading-tight truncate max-w-[150px] sm:max-w-none font-['Outfit']">{item.subject}</h4>
                                                                <span className={`px-2.5 py-0.5 rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-widest ${option?.bg} ${option?.color} border ${option?.border} shadow-sm font-['Outfit']`}>
                                                                    {option?.label}
                                                                </span>
                                                            </div>
                                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">
                                                                <span className="flex items-center gap-1.5 font-['Outfit']">
                                                                    <FaCalendarAlt className="text-blue-400" />
                                                                    {(() => {
                                                                        const d = new Date(item.date);
                                                                        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
                                                                    })()}
                                                                </span>
                                                                {item.project_name && <span className="flex items-center gap-1.5 text-blue-500 bg-blue-50 px-2 py-0.5 rounded-md font-['Outfit']"><FaFilter className="text-[10px]" />{item.project_name}</span>}
                                                                {item.member_name && <span className="flex items-center gap-1.5 text-orange-500 bg-orange-50 px-2 py-0.5 rounded-md font-['Outfit']"><FaUserCheck className="text-[10px]" />{item.member_name}</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 sm:gap-2 sm:opacity-0 group-hover:opacity-100 transition-all duration-300">
                                                        <button onClick={() => handleEdit(item)} className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all active:scale-90"><FaEdit /></button>
                                                        <button onClick={() => handleDelete(item.id)} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-90"><FaTrash /></button>
                                                    </div>
                                                </div>
                                                {item.note && <div className="mt-4 pt-4 border-t border-slate-50 italic text-slate-500 text-xs line-clamp-2 font-['Outfit']">"{item.note}"</div>}
                                            </div>
                                        );
                                    }) : (
                                        <div className="py-20 flex flex-col items-center justify-center text-slate-300">
                                            <FaInbox className="text-6xl mb-4 opacity-10" />
                                            <p className="text-sm font-black uppercase tracking-widest font-['Outfit']">No records found</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : activeTab === 'summary' ? (
                    <div className="bg-white rounded-[32px] shadow-xl border border-slate-100 overflow-hidden animate-in fade-in duration-500">
                        <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 font-['Outfit']">Attendance Summary</h3>
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1 font-['Outfit']">Aggregated statistics for the selected period</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-4">
                                    <button
                                        onClick={() => {
                                            setCustomReportForm({
                                                ...customReportForm,
                                                projectId: filterProject,
                                                memberId: filterMember,
                                                startDate: periodType === 'range' ? customRange.start : (currentPeriod || new Date().toISOString().split('T')[0]),
                                                endDate: periodType === 'range' ? customRange.end : (currentPeriod || new Date().toISOString().split('T')[0])
                                            });
                                            setShowCustomReportModal(true);
                                        }}
                                        className="px-6 py-3 bg-blue-600 text-white rounded-[16px] text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 group order-last sm:order-0 w-full sm:w-auto font-['Outfit']"
                                    >
                                        <FaFileAlt className="group-hover:rotate-12 transition-transform" />
                                        Custom Report
                                    </button>
                                    <div className="flex bg-white p-1 rounded-xl border border-slate-200">
                                        <div className="px-4 py-2 text-center border-r border-slate-100">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-['Outfit']">Total</p>
                                            <p className="text-sm font-black text-slate-900 font-['Outfit']">{memberSummary.length}</p>
                                        </div>
                                        <div className="px-4 py-2 text-center">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-['Outfit']">Avg Rate</p>
                                            <p className="text-sm font-black text-blue-600 font-['Outfit']">
                                                {memberSummary.length > 0 ? (memberSummary.reduce((acc, w) => acc + (w.total > 0 ? (w.present + w.half_day * 0.5) / w.total : 0), 0) / memberSummary.length * 100).toFixed(0) + '%' : '0%'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 font-['Outfit']">Member</th>
                                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-emerald-500 text-center font-['Outfit']">P</th>
                                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-red-500 text-center font-['Outfit']">A</th>
                                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-amber-500 text-center font-['Outfit']">L</th>
                                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-blue-500 text-center font-['Outfit']">H</th>
                                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-900 text-center font-['Outfit']">Total</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right font-['Outfit']">Performance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {memberSummary.map((w) => {
                                        const rate = w.total > 0 ? ((w.present + w.half_day * 0.5) / w.total * 100) : 0;
                                        return (
                                            <tr key={w.id} className="hover:bg-slate-50/80 transition-colors group">
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-black text-xs group-hover:bg-blue-600 group-hover:text-white transition-colors font-['Outfit']">
                                                            {w.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-slate-900 leading-none font-['Outfit']">{w.name}</p>
                                                            <p className="text-[9px] font-black text-slate-400 uppercase mt-1 font-['Outfit']">ID: #{w.id}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <span className="inline-flex w-7 h-7 items-center justify-center bg-emerald-50 text-emerald-600 rounded-lg font-black text-[11px] border border-emerald-100 font-['Outfit']">{w.present}</span>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <span className="inline-flex w-7 h-7 items-center justify-center bg-red-50 text-red-600 rounded-lg font-black text-[11px] border border-red-100 font-['Outfit']">{w.absent}</span>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <span className="inline-flex w-7 h-7 items-center justify-center bg-amber-50 text-amber-600 rounded-lg font-black text-[11px] border border-amber-100 font-['Outfit']">{w.late}</span>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <span className="inline-flex w-7 h-7 items-center justify-center bg-blue-50 text-blue-600 rounded-lg font-black text-[11px] border border-blue-100 font-['Outfit']">{w.half_day}</span>
                                                </td>
                                                <td className="px-6 py-5 text-center font-black text-slate-900 text-[11px] font-['Outfit']">{w.total}</td>
                                                <td className="px-8 py-5 text-right">
                                                    <div className="flex items-center justify-end gap-3">
                                                        <div className="w-20 sm:w-28 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all duration-1000 ${rate >= 90 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]' : rate >= 75 ? 'bg-blue-500' : 'bg-amber-500'}`}
                                                                style={{ width: `${rate}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className={`text-[11px] font-black min-w-[32px] font-['Outfit'] ${rate >= 90 ? 'text-emerald-600' : rate >= 75 ? 'text-blue-600' : 'text-amber-600'}`}>{rate.toFixed(0)}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {memberSummary.length === 0 && (
                                        <tr>
                                            <td colSpan="7" className="px-8 py-20 text-center">
                                                <FaInbox className="text-5xl mx-auto mb-4 text-slate-200" />
                                                <p className="text-sm font-black text-slate-400 uppercase tracking-widest font-['Outfit']">No statistics available</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    /* Daily Quick Mark View */
                    <div className="bg-white rounded-[40px] shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="p-8 sm:p-12 border-b border-slate-100 bg-linear-to-br from-slate-900 to-slate-800 text-white">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                <div>
                                    <h3 className="text-2xl font-black mb-2 font-['Outfit']">Daily Attendance Sheet</h3>
                                    <div className="flex items-center gap-3">
                                        <FaCalendarAlt className="text-blue-400" />
                                        <span className="text-slate-400 font-bold uppercase tracking-widest text-xs font-['Outfit']">
                                            {periodType === 'day' ? new Date(currentPeriod).toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) : 'Please select a specific day to use the sheet'}
                                        </span>
                                    </div>
                                </div>
                                {periodType === 'day' && (
                                    <div className="bg-white/10 px-6 py-3 rounded-2xl border border-white/10 backdrop-blur-md">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-300 mb-1 font-['Outfit']">Marking Mode</p>
                                        <p className="text-sm font-black font-['Outfit']">Single Click Upsert</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {periodType === 'day' ? (
                            <div className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-50/50">
                                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 font-['Outfit']">Name</th>
                                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center font-['Outfit']">Attendance Status</th>
                                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right font-['Outfit']">Current</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {members.map(w => {
                                                const currentStatus = activeMembersAttendanceMat[w.id];
                                                const option = statusOptions.find(o => o.id === currentStatus);
                                                return (
                                                    <tr key={w.id} className="hover:bg-slate-50/50 transition-colors group">
                                                        <td className="px-4 sm:px-8 py-4 sm:py-6">
                                                            <div className="flex items-center gap-3 sm:gap-4">
                                                                <div className="hidden sm:flex w-10 h-10 bg-white rounded-xl border border-slate-100 items-center justify-center text-slate-400 group-hover:text-blue-500 shadow-sm transition-all shrink-0">
                                                                    <FaUserCheck />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <h4 className="font-black text-slate-900 leading-tight truncate text-sm sm:text-base font-['Outfit']">{w.name}</h4>
                                                                    <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-tighter text-slate-400 mt-0.5 font-['Outfit']">#{w.id}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 sm:px-8 py-4 sm:py-6">
                                                            <div className="flex items-center justify-center gap-2 sm:gap-4">
                                                                <button
                                                                    onClick={() => handleQuickMark(w.id, 'present')}
                                                                    className={`flex-1 sm:flex-none px-3 sm:px-8 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer font-['Outfit'] ${currentStatus === 'present' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-105' : 'bg-slate-100/50 text-slate-400 border border-slate-100 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/30'}`}
                                                                >
                                                                    P<span className="hidden sm:inline">resent</span>
                                                                </button>
                                                                <button
                                                                    onClick={() => handleQuickMark(w.id, 'absent')}
                                                                    className={`flex-1 sm:flex-none px-3 sm:px-8 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer font-['Outfit'] ${currentStatus === 'absent' ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 scale-105' : 'bg-slate-100/50 text-slate-400 border border-slate-100 hover:bg-red-500 hover:text-white hover:border-red-500 hover:shadow-lg hover:shadow-red-500/30'}`}
                                                                >
                                                                    A<span className="hidden sm:inline">bsent</span>
                                                                </button>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 sm:px-8 py-4 sm:py-6 text-right">
                                                            <div className="flex justify-end">
                                                                {option ? (
                                                                    <div className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-widest font-['Outfit'] ${option.bg} ${option.color} border ${option.border}`}>
                                                                        <option.icon className="text-[10px] sm:text-xs" />
                                                                        <span className="truncate max-w-[40px] sm:max-w-none">{option.label}</span>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-300 font-['Outfit']">Wait</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {members.length === 0 && (
                                                <tr>
                                                    <td colSpan="3" className="px-8 py-20 text-center">
                                                        <FaInbox className="text-6xl mx-auto mb-6 opacity-10" />
                                                        <h4 className="text-lg font-black text-slate-900 mb-2 font-['Outfit']">No Members Found</h4>
                                                        <p className="text-slate-500 text-sm font-medium font-['Outfit']">Add some people first to start using the Daily Sheet</p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="p-20 text-center">
                                <div className="w-24 h-24 bg-blue-50 rounded-[40px] flex items-center justify-center mx-auto mb-8">
                                    <FaCalendarAlt className="text-4xl text-blue-500 opacity-20" />
                                </div>
                                <h4 className="text-xl font-black text-slate-900 mb-4 font-['Outfit']">Select a Day to Begin</h4>
                                <p className="text-slate-500 max-w-sm mx-auto font-medium font-['Outfit']">The Daily Sheet works only when a specific day is selected from the filters above.</p>
                                <button
                                    onClick={() => setPeriodType('day')}
                                    className="mt-8 bg-slate-900 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-xl font-['Outfit']"
                                >
                                    Switch to Day View
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[40px] p-8 sm:p-10 w-full max-w-lg shadow-2xl relative animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <button onClick={() => { setShowAddModal(false); resetForm(); }} className="absolute top-8 right-8 text-slate-400 hover:text-slate-800 transition-colors"><FaTimes /></button>
                        <div className="mb-8"><h2 className="text-2xl font-black text-slate-900 flex items-center gap-3 font-['Outfit']"><div className="w-2 h-8 bg-blue-600 rounded-full"></div>{editingId ? 'Edit Record' : 'Mark Attendance'}</h2></div>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {statusOptions.map(opt => (
                                    <button key={opt.id} type="button" onClick={() => setFormData({ ...formData, status: opt.id })} className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${formData.status === opt.id ? 'border-blue-500 bg-blue-50 scale-105' : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'}`}><opt.icon className={`text-xl ${formData.status === opt.id ? 'text-blue-500' : 'text-slate-400'}`} /><span className={`text-[10px] font-black uppercase tracking-widest ${formData.status === opt.id ? 'text-blue-700' : 'text-slate-500'}`}>{opt.label}</span></button>
                                ))}
                            </div>
                            <div className="space-y-4">
                                <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Subject / Label</label><input required type="text" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} placeholder="E.g. Office, College, Gym..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-['Outfit']" /></div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Date</label><div className="relative"><FaCalendarAlt className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" /><input required type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-14 pr-6 py-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all font-['Outfit'] cursor-pointer" /></div></div>
                                    <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Project (Optional)</label><select value={formData.project_id} onChange={(e) => setFormData({ ...formData, project_id: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all cursor-pointer font-['Outfit']"><option value="">No Project</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                                    <div className="sm:col-span-2"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Member (Optional)</label><select value={formData.member_id} onChange={(e) => setFormData({ ...formData, member_id: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all cursor-pointer font-['Outfit']"><option value="">No Member</option>{members.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select></div>
                                </div>
                                <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Note (Optional)</label><textarea value={formData.note} onChange={(e) => setFormData({ ...formData, note: e.target.value })} placeholder="Add more details..." rows="3" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all resize-none font-['Outfit']"></textarea></div>
                            </div>
                            <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white py-5 rounded-2xl text-sm font-black uppercase tracking-widest shadow-2xl transition-all hover:scale-[1.02] active:scale-95 mt-4 font-['Outfit']">{editingId ? 'Update Record' : 'Mark Attendance'}</button>
                        </form>
                    </div>
                </div>
            )}

            {
                showProjectManager && (
                    <ProjectManager
                        projects={projects}
                        onCreate={createProject}
                        onDelete={deleteProject}
                        onClose={() => { setShowProjectManager(false); fetchData(); }}
                        onRefresh={() => getProjects().then(res => setProjects(res.data))}
                    />
                )
            }
            {showMemberManager && <MemberManager onClose={() => { setShowMemberManager(false); fetchData(); }} onUpdate={fetchData} />}

            {/* Custom Report Modal */}
            {
                showCustomReportModal && (
                    <div className="fixed inset-0 z-150 flex items-center justify-center p-[16px] bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                        <div className="bg-white rounded-[40px] p-[32px] sm:p-[40px] w-full max-w-[500px] shadow-2xl relative animate-in zoom-in-95 duration-300">
                            <button onClick={() => setShowCustomReportModal(false)} className="absolute top-[32px] right-[32px] text-slate-400 hover:text-slate-800 transition-colors">
                                <FaTimes />
                            </button>
                            <h2 className="text-[24px] font-black mb-[32px] flex items-center gap-[12px] font-['Outfit']">
                                <div className="w-[8px] h-[32px] bg-blue-600 rounded-full"></div>
                                Attendance Report
                            </h2>

                            <div className="space-y-[24px]">
                                <div className="grid grid-cols-2 gap-[16px]">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[8px] ml-[4px]">Start Date</label>
                                        <input
                                            type="date"
                                            value={customReportForm.startDate}
                                            onChange={(e) => setCustomReportForm({ ...customReportForm, startDate: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-[16px] px-[20px] py-[12px] text-[12px] font-bold text-slate-700 outline-none focus:border-blue-600 transition-all font-['Outfit']"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[8px] ml-[4px]">End Date</label>
                                        <input
                                            type="date"
                                            value={customReportForm.endDate}
                                            onChange={(e) => setCustomReportForm({ ...customReportForm, endDate: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-[16px] px-[20px] py-[12px] text-[12px] font-bold text-slate-700 outline-none focus:border-blue-600 transition-all font-['Outfit']"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-[16px]">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[8px] ml-[4px]">Project</label>
                                        <select
                                            value={customReportForm.projectId}
                                            onChange={(e) => setCustomReportForm({ ...customReportForm, projectId: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-[16px] px-[20px] py-[12px] text-[12px] font-bold text-slate-700 outline-none focus:border-blue-600 transition-all cursor-pointer font-['Outfit']"
                                        >
                                            <option value="">All Projects</option>
                                            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[8px] ml-[4px]">Member</label>
                                        <select
                                            value={customReportForm.memberId}
                                            onChange={(e) => setCustomReportForm({ ...customReportForm, memberId: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-[16px] px-[20px] py-[12px] text-[12px] font-bold text-slate-700 outline-none focus:border-blue-600 transition-all cursor-pointer font-['Outfit']"
                                        >
                                            <option value="">Everyone</option>
                                            {members.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[8px] ml-[4px]">Status Filter</label>
                                    <select
                                        value={customReportForm.status}
                                        onChange={(e) => setCustomReportForm({ ...customReportForm, status: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-[16px] px-[20px] py-[12px] text-[12px] font-bold text-slate-700 outline-none focus:border-blue-600 transition-all cursor-pointer font-['Outfit']"
                                    >
                                        <option value="all">All Statuses</option>
                                        {statusOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                                    </select>
                                </div>

                                <div className="flex flex-col gap-[12px]">
                                    <button
                                        onClick={() => handleGenerateCustomReport('PDF')}
                                        disabled={!!customReportLoading}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-[18px] rounded-[20px] transition-all active:scale-95 shadow-xl flex items-center justify-center gap-[12px] text-[14px] disabled:opacity-50 disabled:cursor-not-allowed font-['Outfit']"
                                    >
                                        {customReportLoading === 'PDF' ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        ) : (
                                            <FaFileAlt />
                                        )}
                                        {customReportLoading === 'PDF' ? 'Generating...' : 'Download PDF Report'}
                                    </button>

                                    <div className="grid grid-cols-2 gap-[12px]">
                                        <button
                                            onClick={() => handleGenerateCustomReport('CSV')}
                                            disabled={!!customReportLoading}
                                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-black py-[16px] rounded-[20px] transition-all active:scale-95 shadow-lg flex items-center justify-center gap-[8px] text-[12px] disabled:opacity-50 disabled:cursor-not-allowed font-['Outfit']"
                                        >
                                            {customReportLoading === 'CSV' ? (
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            ) : (
                                                <FaFileAlt />
                                            )}
                                            CSV (Excel)
                                        </button>
                                        <button
                                            onClick={() => handleGenerateCustomReport('TXT')}
                                            disabled={!!customReportLoading}
                                            className="bg-slate-700 hover:bg-slate-800 text-white font-black py-[16px] rounded-[20px] transition-all active:scale-95 shadow-lg flex items-center justify-center gap-[8px] text-[12px] disabled:opacity-50 disabled:cursor-not-allowed font-['Outfit']"
                                        >
                                            {customReportLoading === 'TXT' ? (
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            ) : (
                                                <FaFileAlt />
                                            )}
                                            Text Log
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default AttendanceTracker;
