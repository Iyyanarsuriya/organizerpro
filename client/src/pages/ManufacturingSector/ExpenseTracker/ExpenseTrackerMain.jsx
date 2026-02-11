// Force reload
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ReactDOM from 'react-dom'; // Keep ReactDOM as it IS used for the portal
import {
    getTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    getTransactionStats,
    getExpenseCategories,
    createExpenseCategory,
    deleteExpenseCategory,
    // Vehicle Logs
    getVehicleLogs
} from '../../../api/Expense/mfgExpense';
// import { getVehicleLogs } from '../../../api/Expense/personalExpense'; // Removed
import { getProjects, createProject, deleteProject, getAttendanceStats } from '../../../api/Attendance/mfgAttendance';
import { getMembers, getActiveMembers, getGuests, getMemberRoles } from '../../../api/TeamManagement/mfgTeam';
import toast from 'react-hot-toast';
import {
    FaWallet, FaPlus, FaTrash, FaChartBar, FaExchangeAlt, FaFileAlt, FaEdit, FaTimes,
    FaPlusCircle, FaFolderPlus, FaBoxes, FaTruck,
    FaCheck, FaQuestionCircle, FaCalculator, FaTag, FaUsers, FaFilePdf, FaFileCsv, FaChevronLeft
} from 'react-icons/fa';
import { exportExpenseToCSV, exportExpenseToTXT, exportExpenseToPDF, exportMemberPayslipToPDF } from '../../../utils/exportUtils/index.js';
import { formatAmount } from '../../../utils/formatUtils';



import CategoryManager from '../../../components/Common/CategoryManager';
import ProjectManager from '../../../components/Manufacturing/ProjectManager';
import MemberManager from '../../../components/Manufacturing/MemberManager';
import DailyWorkLogManager from '../../../components/Manufacturing/DailyWorkLogManager';
import VehicleTrackerManager from '../../../components/Common/VehicleTrackerManager';
import ExportButtons from '../../../components/Common/ExportButtons';

// Sub-components
import Dashboard from './Dashboard';
import Transactions from './Transactions';
import Reports from './Reports';
import SalaryCalculator from './SalaryCalculator';

const ExpenseTrackerMain = () => {
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState([]);
    const [vehicleLogs, setVehicleLogs] = useState([]);
    const [stats, setStats] = useState({ summary: { total_income: 0, total_expense: 0 }, categories: [] });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Dashboard');
    const [showAddModal, setShowAddModal] = useState(false);

    // Filters & Period
    const [periodType, setPeriodType] = useState('day'); // 'month', 'year', 'week', 'day', 'range'
    const [currentPeriod, setCurrentPeriod] = useState(new Date().toISOString().split('T')[0]);
    const [customRange, setCustomRange] = useState({ start: '', end: '' });

    // Active Filters
    const [filterProject, setFilterProject] = useState('');
    const [filterMember, setFilterMember] = useState('');
    const [filterRole, setFilterRole] = useState(''); // New Role Filter
    const [filterMemberType, setFilterMemberType] = useState('all'); // New Member Type Filter
    const [filterVehicle, setFilterVehicle] = useState(''); // Vehicle Filter
    const [deleteModalOuter, setDeleteModalOuter] = useState({ show: false, id: null });

    // Modals
    const [showCategoryManager, setShowCategoryManager] = useState(false);
    const [showProjectManager, setShowProjectManager] = useState(false);


    // Data Lists
    const [categories, setCategories] = useState([]);
    const [projects, setProjects] = useState([]);
    const [members, setMembers] = useState([]);
    const [roles, setRoles] = useState([]); // New Roles Data

    // Form Data
    const [formData, setFormData] = useState({
        title: '',
        amount: '',
        quantity: 1,
        unit_price: 0,
        type: 'expense',
        category: 'General',
        date: new Date().toISOString().split('T')[0],
        project_id: '',
        member_id: '',
        payment_status: 'completed'
    });
    const [editingId, setEditingId] = useState(null);

    // Transaction List Filters (These are for the Transactions tab)
    const [filterType, setFilterType] = useState('all');
    const [filterCat, setFilterCat] = useState('all');
    const [sortBy, setSortBy] = useState('date_desc');
    const [searchQuery, setSearchQuery] = useState('');

    // Transaction Detail Modal
    const [showModal, setShowModal] = useState(null);
    const [modalTransactions, setModalTransactions] = useState([]);

    // Custom Reports
    const [showCustomReportModal, setShowCustomReportModal] = useState(false);
    const [customReportLoading, setCustomReportLoading] = useState(false);
    const [customReportForm, setCustomReportForm] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        projectId: '',
        memberId: '',
        type: 'all',
        category: 'all',
        vehicle: '' // Added
    });
    const [confirmModal, setConfirmModal] = useState({ show: false, type: null, label: '' });

    // Salary Calculator States
    const [attendanceStats, setAttendanceStats] = useState(null);
    const [salaryMode, setSalaryMode] = useState('daily');
    const [dailyWage, setDailyWage] = useState(0);
    const [monthlySalary, setMonthlySalary] = useState(0);
    const [unitsProduced, setUnitsProduced] = useState(0);
    const [ratePerUnit, setRatePerUnit] = useState(0);
    const [bonus, setBonus] = useState(0);
    const [salaryLoading, setSalaryLoading] = useState(false);

    const COLORS = ['#2d5bff', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

    const fetchData = async () => {
        try {
            const isRange = periodType === 'range';
            const rangeStart = isRange ? customRange.start : null;
            const rangeEnd = isRange ? customRange.end : null;
            if (isRange && (!rangeStart || !rangeEnd)) return;

            const params = {
                projectId: filterProject,
                memberId: filterMember,
                memberType: filterMemberType, // NEW
                period: isRange ? null : currentPeriod,
                startDate: rangeStart,
                endDate: rangeEnd,
                sector: 'manufacturing' // Add sector
            };

            const [transRes, statsRes, catRes, projRes, membersRes, roleRes, guestRes, vehicleRes] = await Promise.all([
                getTransactions(params),
                getTransactionStats(params),
                getExpenseCategories({ sector: 'manufacturing' }),
                getProjects(),
                getMembers(),
                getMemberRoles(),
                getGuests(),
                getVehicleLogs()
            ]);
            setTransactions(Array.isArray(transRes.data) ? transRes.data : []);
            setVehicleLogs(vehicleRes?.data || []);

            // PROCESS VEHICLE LOGS
            const vLogsRaw = vehicleRes?.data || [];
            const filteredVehicleLogs = (Array.isArray(vLogsRaw) ? vLogsRaw : []).filter(log => {
                const logDate = (log.out_time || log.created_at || '').split('T')[0];
                if (!logDate) return false;

                if (periodType === 'range') return (!rangeStart || logDate >= rangeStart) && (!rangeEnd || logDate <= rangeEnd);
                if (periodType === 'day') return logDate === currentPeriod;
                if (periodType === 'month') return logDate.startsWith(currentPeriod);
                if (periodType === 'year') return logDate.startsWith(currentPeriod);
                return false; // Skip for 'week' or unknown types for now to avoid errors
            });

            const vehicleIncome = filteredVehicleLogs.reduce((acc, log) => acc + (parseFloat(log.income_amount) || 0), 0);
            const vehicleExpense = filteredVehicleLogs.reduce((acc, log) => acc + (parseFloat(log.expense_amount) || 0), 0);

            // Adjust Stats: Exclude 'Salary Pot' from total_expense for the main business summary
            const rawStats = statsRes?.data || { summary: { total_income: 0, total_expense: 0 }, categories: [] };
            const adjustedStats = {
                ...rawStats,
                summary: rawStats.summary || { total_income: 0, total_expense: 0 },
                categories: Array.isArray(rawStats.categories) ? rawStats.categories : []
            };

            // Add Vehicle Stats
            if (adjustedStats.summary) {
                adjustedStats.summary.total_income = (parseFloat(adjustedStats.summary.total_income || 0) + vehicleIncome);
                adjustedStats.summary.total_expense = (parseFloat(adjustedStats.summary.total_expense || 0) + vehicleExpense);
            }

            if (!filterMember) {
                const transArr = Array.isArray(transRes.data) ? transRes.data : [];
                const potsOnly = transArr.filter(t => t.category === 'Salary Pot' && t.type === 'expense');
                const potsTotal = potsOnly.reduce((acc, t) => acc + parseFloat(t.amount || 0), 0);
                adjustedStats.summary.total_expense = Math.max(0, parseFloat(adjustedStats.summary.total_expense) - potsTotal);
            }
            setStats(adjustedStats);

            setCategories(Array.isArray(catRes.data) ? catRes.data : []);
            setProjects(Array.isArray(projRes.data) ? projRes.data : []);
            const rawMembers = Array.isArray(membersRes.data?.data) ? membersRes.data.data : [];
            const guests = Array.isArray(guestRes.data?.data) ? guestRes.data.data.map(g => ({ ...g, isGuest: true })) : [];
            setMembers([...rawMembers, ...guests]);
            setRoles(Array.isArray(roleRes.data?.data) ? roleRes.data.data : []);

            if (filterMember) {
                setSalaryLoading(true);
                const attRes = await getAttendanceStats({
                    memberId: filterMember,
                    period: isRange ? null : currentPeriod,
                    startDate: rangeStart,
                    endDate: rangeEnd
                });

                const statsArray = attRes.data?.data || [];
                const summary = {
                    present: statsArray.filter(s => ['present', 'late', 'permission'].includes(s.status))
                        .reduce((acc, curr) => acc + curr.count, 0),
                    absent: statsArray.find(s => s.status === 'absent')?.count || 0,
                    late: statsArray.find(s => s.status === 'late')?.count || 0,
                    half_day: statsArray.find(s => s.status === 'half-day')?.count || 0,
                };

                setAttendanceStats({ summary, raw: statsArray });
                setSalaryLoading(false);
            } else {
                setAttendanceStats(null);
            }

            setLoading(false);
        } catch (error) {
            console.error("Fetch Data Error Details:", error.response || error);
            toast.error(`Failed to fetch data: ${error.response?.data?.message || error.message}`);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [currentPeriod, filterProject, filterMember, filterMemberType, customRange.start, customRange.end, periodType]);

    // Auto-fill Salary Calculator from Member Data
    useEffect(() => {
        if (filterMember && members.length > 0) {
            const member = members.find(m => m.id == filterMember);
            if (member) {
                // Map wage_type to salaryMode
                // If it's 'piece_rate' in DB, it maps to 'production' in SalaryCalculator logic
                const mode = member.wage_type === 'piece_rate' ? 'production' : member.wage_type;
                setSalaryMode(mode || 'daily');

                const amount = parseFloat(member.daily_wage) || 0;
                if (mode === 'daily') {
                    setDailyWage(amount);
                } else if (mode === 'monthly') {
                    setMonthlySalary(amount);
                } else if (mode === 'production') {
                    setRatePerUnit(amount);
                }
            }
        } else if (!filterMember) {
            // Reset to defaults if no member selected
            setSalaryMode('daily');
            setDailyWage(0);
            setMonthlySalary(0);
            setRatePerUnit(0);
        }
    }, [filterMember, members]);

    // Period formatting logic
    useEffect(() => {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');

        if (periodType === 'year') {
            if (currentPeriod.length !== 4) setCurrentPeriod(`${yyyy}`);
        } else if (periodType === 'month') {
            if (currentPeriod.length !== 7) setCurrentPeriod(`${yyyy}-${mm}`);
        } else if (periodType === 'week') {
            if (!currentPeriod.includes('W')) {
                const target = new Date();
                const dayNr = (target.getDay() + 6) % 7;
                target.setDate(target.getDate() - dayNr + 3);
                const firstThursday = target.getTime();
                const isoWeekYear = target.getFullYear(); // Use the year of the Thursday
                target.setMonth(0, 1);
                if (target.getDay() !== 4) {
                    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
                }
                const weekNum = 1 + Math.ceil((firstThursday - target) / 604800000);
                setCurrentPeriod(`${isoWeekYear}-W${String(weekNum).padStart(2, '0')}`);
            }
        } else if (periodType === 'day') {
            if (currentPeriod.length !== 10) setCurrentPeriod(`${yyyy}-${mm}-${dd}`);
        } else if (periodType === 'range') {
            if (!customRange.start) setCustomRange({ start: `${yyyy}-${mm}-${dd}`, end: `${yyyy}-${mm}-${dd}` });
        }
    }, [periodType]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                sector: 'manufacturing'
            };
            if (editingId) {
                await updateTransaction(editingId, payload);
                toast.success("Transaction updated!");
            } else {
                await createTransaction(payload);
                toast.success("Transaction added!");
            }
            setShowAddModal(false);
            setEditingId(null);
            setFormData({
                title: '',
                amount: '',
                quantity: 1,
                unit_price: 0,
                type: 'expense',
                category: 'Food',
                date: new Date().toISOString().split('T')[0],
                project_id: filterProject || '',
                member_id: filterMember || ''
            });
            fetchData();
        } catch (error) {
            toast.error(editingId ? "Failed to update transaction" : "Failed to add transaction");
        }
    };

    const handleEdit = (transaction) => {
        setFormData({
            title: transaction.title,
            amount: transaction.amount,
            quantity: transaction.quantity || 1,
            unit_price: transaction.unit_price || 0,
            type: transaction.type,
            category: transaction.category,
            date: new Date(transaction.date).toISOString().split('T')[0],
            project_id: transaction.project_id || '',
            member_id: transaction.member_id || ''
        });
        setEditingId(transaction.id);
        setShowAddModal(true);
    };

    const handleAddNewTransaction = () => {
        setFormData({
            title: '',
            amount: '',
            quantity: 1,
            unit_price: 0,
            type: 'expense',
            category: 'Food',
            date: new Date().toISOString().split('T')[0],
            project_id: filterProject || '',
            member_id: filterMember || ''
        });
        setEditingId(null);
        setShowAddModal(true);
    };

    const handleDelete = async (id) => {
        try {
            await deleteTransaction(id, 'manufacturing');
            toast.success("Transaction deleted");
            setDeleteModalOuter({ show: false, id: null });
            fetchData();
        } catch (error) {
            toast.error("Failed to delete transaction");
        }
    };

    const confirmDelete = (id) => {
        setDeleteModalOuter({ show: true, id });
    };

    const handleShowTransactions = (type) => {
        let filtered = [];
        const transArr = Array.isArray(transactions) ? transactions : [];
        if (type === 'income') {
            filtered = transArr.filter(t => t.type === 'income');
        } else if (type === 'expense') {
            filtered = transArr.filter(t => t.type === 'expense');
        }
        setModalTransactions(filtered);
        setShowModal(type);
    };

    // Helper for mapping member IDs to their roles
    const memberIdToRoleMap = useMemo(() => {
        const map = {};
        if (Array.isArray(members)) {
            members.forEach(m => {
                map[m.id] = m.role;
            });
        }
        return map;
    }, [members]);

    const combinedData = useMemo(() => {
        // 1. Filter Vehicle Logs
        const filteredVLogs = (Array.isArray(vehicleLogs) ? vehicleLogs : []).filter(log => {
            const logDate = (log.out_time || log.created_at || '').split('T')[0];
            if (!logDate) return false;

            let dateMatch = false;
            const isRange = periodType === 'range';
            const rangeStart = isRange ? customRange.start : null;
            const rangeEnd = isRange ? customRange.end : null;

            if (periodType === 'range') dateMatch = (!rangeStart || logDate >= rangeStart) && (!rangeEnd || logDate <= rangeEnd);
            else if (periodType === 'day') dateMatch = logDate === currentPeriod;
            else if (periodType === 'month') dateMatch = logDate.startsWith(currentPeriod);
            else if (periodType === 'year') dateMatch = logDate.startsWith(currentPeriod);
            else dateMatch = true;

            if (!dateMatch) return false;

            if (filterMember && Array.isArray(members)) {
                const memberName = members.find(m => m.id == filterMember)?.name;
                if (!memberName || (log.driver_name !== memberName)) return false;
            }

            if (filterVehicle && log.vehicle_name !== filterVehicle) return false;

            return true;
        }).flatMap(log => {
            const items = [];
            if (parseFloat(log.expense_amount) > 0) items.push({
                id: `v-exp-${log.id}`,
                date: log.out_time || log.created_at,
                title: `Vehicle: ${log.vehicle_name} (${log.vehicle_number})`,
                amount: log.expense_amount,
                type: 'expense',
                category: 'Vehicle Log',
                project_name: 'Fleet',
                member_name: log.driver_name,
                payment_status: 'completed'
            });
            if (parseFloat(log.income_amount) > 0) items.push({
                id: `v-inc-${log.id}`,
                date: log.out_time || log.created_at,
                title: `Vehicle: ${log.vehicle_name} (${log.vehicle_number})`,
                amount: log.income_amount,
                type: 'income',
                category: 'Vehicle Log',
                project_name: 'Fleet',
                member_name: log.driver_name,
                payment_status: 'completed'
            });
            return items;
        });

        const relevantTransactions = filterVehicle ? [] : (Array.isArray(transactions) ? transactions : []);

        return [...relevantTransactions, ...filteredVLogs].sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [transactions, vehicleLogs, periodType, currentPeriod, customRange, filterMember, members, filterVehicle]);

    const filteredTransactions = useMemo(() => {
        return combinedData
            .filter(t => {
                const matchesType = filterType === 'all' || t.type === filterType;
                const matchesCat = filterCat === 'all' || t.category === filterCat;
                const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());

                // Check Project if set (Hide vehicle logs if specific project selected, unless we want them everywhere)
                // Vehicle Logs don't have project_id usually.
                if (filterProject && t.category === 'Vehicle Log') return false;

                // Check Role
                const matchesRole = !filterRole || (t.member_id && memberIdToRoleMap[t.member_id] === filterRole);

                return matchesType && matchesCat && matchesSearch && matchesRole;
            })
            .sort((a, b) => {
                if (sortBy === 'date_desc') return new Date(b.date) - new Date(a.date);
                if (sortBy === 'date_asc') return new Date(a.date) - new Date(b.date);
                if (sortBy === 'amount_desc') return b.amount - a.amount;
                if (sortBy === 'amount_asc') return a.amount - b.amount;
                return 0;
            });
    }, [combinedData, filterType, filterCat, sortBy, searchQuery, filterProject, filterRole, memberIdToRoleMap]);

    const vehicleNames = useMemo(() => [...new Set((Array.isArray(vehicleLogs) ? vehicleLogs : []).map(l => l.vehicle_name))].filter(Boolean).sort(), [vehicleLogs]);

    const formatCurrency = (val) => {
        const absVal = Math.abs(val || 0);
        return '₹' + formatAmount(absVal);
    };

    const memberStats = useMemo(() => {
        if (!filterMember) return null;
        const transArr = Array.isArray(transactions) ? transactions : [];
        const totalSalary = transArr
            .filter(t => t.category && t.category.toLowerCase().includes('salary'))
            .reduce((acc, t) => acc + parseFloat(t.amount || 0), 0);
        const totalAdvances = transArr
            .filter(t => t.category && t.category.toLowerCase().includes('advance'))
            .reduce((acc, t) => acc + parseFloat(t.amount || 0), 0);
        return { totalSalary, totalAdvances };
    }, [transactions, filterMember]);



    // Export Functions (Reused)
    const handleExportCSV = (data = transactions, filters = {}) => {
        // Allow empty export
        const periodStr = filters.startDate && filters.endDate ? `${filters.startDate}_to_${filters.endDate}` : currentPeriod;
        const memberStr = filters.memberId ? `_${members.find(m => m.id == filters.memberId)?.name}` : (filterMember ? `_${members.find(m => m.id == filterMember)?.name}` : '');
        const roleStr = filters.role ? `_${filters.role}` : (filterRole ? `_${filterRole}` : '');
        exportExpenseToCSV(data, `expense_report_${periodStr}${memberStr}${roleStr}`);
    };

    const handleExportTXT = (data = transactions, reportStats = stats, filters = {}) => {
        // Allow empty export
        const periodStr = filters.startDate && filters.endDate ? `${filters.startDate} to ${filters.endDate}` : currentPeriod;
        const memberStr = filters.memberId ? `_${members.find(m => m.id == filters.memberId)?.name}` : (filterMember ? `_${members.find(m => m.id == filterMember)?.name}` : '');
        const roleStr = filters.role ? `_${filters.role}` : (filterRole ? `_${filterRole}` : '');
        exportExpenseToTXT({ data, period: periodStr, filename: `expense_report_${periodStr}${memberStr}${roleStr}` });
    };

    const handleExportPayslip = ({ memberId, transactions, attendanceStats, period, calculatedSalary, bonus }) => {
        const memberObj = members.find(m => m.id == memberId);
        if (!memberObj) return;

        exportMemberPayslipToPDF({
            member: memberObj,
            transactions,
            attendanceStats,
            period,
            filename: `payslip_${memberObj.name}_${period}`,
            calculatedSalary,
            bonus
        });
    };

    const handleExportPDF = (data = transactions, reportStats = stats, filters = {}) => {
        // Allow empty export
        const memberName = filters.memberId ? members.find(m => m.id == filters.memberId)?.name : (filterMember ? members.find(m => m.id == filterMember)?.name : 'Everyone');
        const projectName = filters.projectId ? projects.find(p => p.id == filters.projectId)?.name : (filterProject ? projects.find(p => p.id == filterProject)?.name : 'All Projects');
        const roleName = filters.role || (filterRole || 'All Categories');
        const periodStr = filters.startDate && filters.endDate ? `${filters.startDate} to ${filters.endDate}` : currentPeriod;

        const memberShort = memberName !== 'Everyone' ? `_${memberName}` : '';
        const roleShort = roleName !== 'All Categories' ? `_${roleName}` : '';

        exportExpenseToPDF({
            data,
            period: periodStr,
            subHeader: `Member: ${memberName}  |  Project: ${projectName}  |  Category: ${roleName}`,
            filename: `expense_report_${periodStr}${memberShort}${roleShort}`
        });
    };

    const handleGenerateCustomReport = async (format = 'PDF') => {
        if (!customReportForm.startDate || !customReportForm.endDate) { toast.error("Please select both start and end dates"); return; }
        setCustomReportLoading(format);
        try {
            const selectedMember = members.find(m => m.id == customReportForm.memberId);
            const isGuestSelection = selectedMember?.isGuest || (customReportForm.memberId === 'guest') || (customReportForm.memberId && String(customReportForm.memberId).startsWith('guest_'));

            const guestName = isGuestSelection ? (selectedMember?.name || customReportForm.memberId.replace('guest_', '')) : null;
            const filterMemberId = isGuestSelection ? null : (customReportForm.memberId === 'guest' ? 'guest' : customReportForm.memberId);

            // Ensure endDate covers the full day
            const endDateInclusive = customReportForm.endDate.includes('T') ? customReportForm.endDate : `${customReportForm.endDate}T23:59:59.999Z`;

            const params = {
                projectId: customReportForm.projectId,
                memberId: filterMemberId,
                guestName: guestName,
                startDate: customReportForm.startDate,
                endDate: endDateInclusive,
                category: customReportForm.category === 'all' ? null : customReportForm.category,
                type: customReportForm.type === 'all' ? null : customReportForm.type
            };

            const fetchPromises = [getTransactions(params), getTransactionStats(params), getVehicleLogs()];

            // If a specific real member is selected, fetch their attendance too
            const isRealMember = filterMemberId && filterMemberId !== 'guest' && !isGuestSelection;
            if (isRealMember) {
                fetchPromises.push(getAttendanceStats({
                    memberId: filterMemberId,
                    startDate: customReportForm.startDate,
                    endDate: endDateInclusive
                }));
            }

            const results = await Promise.all(fetchPromises);
            const transRes = results[0];
            const statsRes = results[1];
            const vehicleRes = results[2]; // Vehicle Logs

            // Process Vehicle Logs for Report
            let combinedTransactions = [...transRes.data];
            if (customReportForm.vehicle) { combinedTransactions = []; }

            if (vehicleRes && Array.isArray(vehicleRes)) {
                const vLogs = vehicleRes.filter(log => {
                    const d = (log.out_time || log.created_at).split('T')[0];
                    if (d < customReportForm.startDate || d > customReportForm.endDate.split('T')[0]) return false;

                    if (customReportForm.vehicle && log.vehicle_name !== customReportForm.vehicle) return false;

                    if (!customReportForm.vehicle && (customReportForm.memberId || customReportForm.projectId)) return false;

                    return true;
                }).flatMap(log => {
                    const items = [];
                    // Check type filter
                    const showExpense = customReportForm.type === 'all' || customReportForm.type === 'expense';
                    const showIncome = customReportForm.type === 'all' || customReportForm.type === 'income';

                    if (showExpense && parseFloat(log.expense_amount) > 0) {
                        items.push({
                            id: `v-exp-${log.id}`,
                            date: log.out_time || log.created_at,
                            title: `Vehicle: ${log.vehicle_name} (${log.vehicle_number})`,
                            amount: log.expense_amount,
                            type: 'expense',
                            category: 'Vehicle Log',
                            project_name: 'Fleet',
                            member_name: log.driver_name
                        });
                    }
                    if (showIncome && parseFloat(log.income_amount) > 0) {
                        items.push({
                            id: `v-inc-${log.id}`,
                            date: log.out_time || log.created_at,
                            title: `Vehicle: ${log.vehicle_name} (${log.vehicle_number})`,
                            amount: log.income_amount,
                            type: 'income',
                            category: 'Vehicle Log',
                            project_name: 'Fleet',
                            member_name: log.driver_name
                        });
                    }
                    return items;
                });
                combinedTransactions = [...combinedTransactions, ...vLogs];
            }

            // --- CALCULATE SALARY LOGIC ---
            let calculatedSalary = 0;
            let summary = null;

            if (isRealMember) {
                const attRes = results[3];
                const statsArray = attRes?.data?.data || [];

                // Logic matching SalaryCalculator.jsx
                // Present count includes: present, late, permission
                const presentCount = statsArray.filter(s => ['present', 'late', 'permission'].includes(s.status)).reduce((acc, curr) => acc + curr.count, 0);
                const halfDayCount = statsArray.find(s => s.status === 'half-day')?.count || 0;

                summary = {
                    present: presentCount, // Aggregated for salary calcs
                    absent: statsArray.find(s => s.status === 'absent')?.count || 0,
                    late: statsArray.find(s => s.status === 'late')?.count || 0,
                    half_day: halfDayCount,
                    permission: statsArray.find(s => s.status === 'permission')?.count || 0
                };

                const memberObj = members.find(m => m.id == filterMemberId);
                if (memberObj) {
                    const mode = memberObj.wage_type === 'piece_rate' ? 'production' : (memberObj.wage_type || 'daily');
                    const amount = parseFloat(memberObj.daily_wage) || 0;

                    if (mode === 'daily') {
                        calculatedSalary = (presentCount * amount) + (halfDayCount * (amount / 2));
                    } else if (mode === 'monthly') {
                        let daysInMonth = 30;
                        if (customReportForm.startDate) {
                            const [y, m] = customReportForm.startDate.split('-');
                            daysInMonth = new Date(y, m, 0).getDate();
                        }
                        calculatedSalary = (presentCount + (halfDayCount * 0.5)) * (amount / daysInMonth);
                    }
                }

                // Add projected salary to transaction list for CSV/TXT if it's not effectively in there
                // (Simple approach: Just add it as a 'Projected' entry)
                if (calculatedSalary > 0) {
                    combinedTransactions.push({
                        id: 'calculated-salary',
                        date: customReportForm.endDate,
                        title: `Projected Salary (${customReportForm.startDate} to ${customReportForm.endDate})`,
                        amount: calculatedSalary,
                        type: 'expense',
                        category: 'Salary Pot', // Matches Export Logic
                        project_name: '-',
                        member_name: memberObj?.name || '-',
                        payment_status: 'projected'
                    });
                }
            }
            // ------------------------------

            if (format === 'PDF') {
                // Generate Payslip if it's a specific member or a specific guest
                if (isRealMember || (isGuestSelection && customReportForm.memberId !== 'guest')) {
                    const memberObj = members.find(m => m.id == customReportForm.memberId);

                    exportMemberPayslipToPDF({
                        member: memberObj || { name: guestName, id: 'GUEST', member_type: 'guest' },
                        transactions: transRes.data,
                        attendanceStats: summary ? { summary } : null,
                        period: `${customReportForm.startDate} to ${customReportForm.endDate}`,
                        filename: `payslip_${guestName || memberObj?.name}_${customReportForm.startDate}`,
                        calculatedSalary: calculatedSalary,
                        bonus: 0 // Bonus not captured in custom report form
                    });
                } else {
                    handleExportPDF(combinedTransactions, statsRes.data, customReportForm);
                }
            } else if (format === 'CSV') {
                handleExportCSV(combinedTransactions, customReportForm);
            } else if (format === 'TXT') {
                handleExportTXT(combinedTransactions, statsRes.data, customReportForm);
            }

            setShowCustomReportModal(false);
            toast.success((isRealMember || isGuestSelection) ? "Payslip generated!" : "Report generated!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate report");
        } finally {
            setCustomReportLoading(false);
        }
    };

    // Chart Data
    const pieData = (Array.isArray(stats?.categories) ? stats.categories : []).filter(c => c.type === 'expense').map(c => ({ name: c.category, value: parseFloat(c.total || 0) }));
    const barData = [{ name: 'This Period', Income: parseFloat(stats?.summary?.total_income || 0), Expenses: parseFloat(stats?.summary?.total_expense || 0) }];

    const SidebarItem = ({ icon: Icon, label, onClick }) => (
        <button
            onClick={() => {
                if (onClick) {
                    onClick();
                    return;
                }
                if (label === 'Attendance') navigate('/attendance');
                else setActiveTab(label);
            }}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group ${activeTab === label ? 'bg-[#2d5bff] text-white shadow-lg shadow-blue-500/30' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
        >
            <Icon className={`text-lg transition-transform group-hover:scale-110 ${activeTab === label ? 'text-white' : 'text-slate-400'}`} />
            <span className="font-black text-xs uppercase tracking-widest">{label}</span>
        </button>
    );

    if (loading) return <div className="h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#2d5bff]"></div></div>;

    return (
        <div className="flex bg-slate-50 min-h-screen text-slate-800 font-['Outfit']">
            {/* Sidebar */}
            <aside className="w-72 bg-white border-r border-slate-200 p-8 hidden lg:flex flex-col">
                <div className="flex items-center gap-3 mb-12">
                    <div className="w-10 h-10 rounded-xl bg-linear-to-br from-[#2d5bff] to-[#6366f1] flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <FaWallet className="text-white text-lg" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black tracking-tight">Financial Hub</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Management</p>
                    </div>
                </div>
                <nav className="flex-1 space-y-2">
                    <SidebarItem icon={FaChartBar} label="Dashboard" />
                    <SidebarItem icon={FaUsers} label="Members" onClick={() => setActiveTab('Members')} />
                    <SidebarItem icon={FaExchangeAlt} label="Transactions" />
                    <SidebarItem icon={FaFileAlt} label="Reports" />
                    <SidebarItem icon={FaCalculator} label="Salary" />
                    <SidebarItem icon={FaBoxes} label="Work Log" />
                    <SidebarItem icon={FaTruck} label="Vehicle Log" />

                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-[16px] lg:p-[48px] h-screen overflow-y-auto custom-scrollbar">
                {activeTab === 'Dashboard' && (
                    <div className="flex flex-col gap-6 mb-8 lg:mb-12">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Link
                                    to="/manufacturing"
                                    className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:text-[#2d5bff] hover:border-[#2d5bff] transition-all shadow-sm hover:shadow-md active:scale-95 shrink-0"
                                >
                                    <FaChevronLeft className="w-4 h-4" />
                                </Link>

                                <div>
                                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">Expense Tracker</h1>
                                    <div className="h-[8px] mt-0.5 flex gap-1">
                                        <div className="px-1 bg-emerald-50 text-[6px] font-black text-emerald-600 rounded-full flex items-center uppercase tracking-tighter">FINANCE HUB</div>
                                        <div className="px-1 bg-blue-50 text-[6px] font-black text-blue-500 rounded-full flex items-center uppercase tracking-tighter">REAL-TIME STATS</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Filter Grid */}
                        <div className="flex flex-wrap items-end gap-3 p-6 bg-white rounded-[32px] border border-slate-100 shadow-sm transition-all hover:shadow-md">
                            {/* Period Type - Full Width Row */}
                            <div className="w-full">
                                <label className="block text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Period Type</label>
                                <div className="flex p-1 bg-slate-50 rounded-xl border border-slate-100">
                                    {['day', 'week', 'month', 'year', 'range'].map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => setPeriodType(type)}
                                            className={`flex-1 h-9 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${periodType === type ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Date Selector */}
                            <div className={`transition-all duration-300 w-full ${periodType === 'range' ? 'sm:w-[300px]' : 'sm:w-[180px]'}`}>
                                <label className="block text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Select {periodType}</label>
                                <div className="h-10 bg-slate-50 border border-slate-100 rounded-xl px-3 flex items-center">
                                    {periodType === 'day' ? <input type="date" value={currentPeriod.length === 10 ? currentPeriod : ''} onChange={(e) => setCurrentPeriod(e.target.value)} className="w-full text-xs font-bold text-slate-700 outline-none bg-transparent" /> :
                                        periodType === 'week' ? <input type="week" value={currentPeriod.includes('W') ? currentPeriod : ''} onChange={(e) => setCurrentPeriod(e.target.value)} className="w-full text-xs font-bold text-slate-700 outline-none bg-transparent" /> :
                                            periodType === 'month' ? <input type="month" value={currentPeriod.length === 7 ? currentPeriod : ''} onChange={(e) => setCurrentPeriod(e.target.value)} className="w-full text-xs font-bold text-slate-700 outline-none bg-transparent" /> :
                                                periodType === 'year' ? <input type="number" min="2000" max="2100" value={currentPeriod.slice(0, 4)} onChange={(e) => setCurrentPeriod(e.target.value)} className="w-full text-xs font-bold text-slate-700 outline-none bg-transparent" /> :
                                                    <div className="flex items-center gap-2 w-full">
                                                        <input type="date" value={customRange.start} onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })} className="text-[10px] font-bold text-slate-700 w-full bg-transparent" />
                                                        <span className="text-slate-400 text-xs">—</span>
                                                        <input type="date" value={customRange.end} onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })} className="text-[10px] font-bold text-slate-700 w-full bg-transparent" />
                                                    </div>}
                                </div>
                            </div>

                            {/* Project Filter */}
                            <div className="w-full sm:w-[140px]">
                                <label className="block text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Project</label>
                                <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)} className="h-10 w-full bg-slate-50 border border-slate-100 rounded-xl px-3 text-xs font-bold text-slate-700 outline-none cursor-pointer">
                                    <option value="">All Projects</option>
                                    {Array.isArray(projects) && projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>

                            {/* Vehicle Filter */}
                            <div className="w-full sm:w-[140px]">
                                <label className="block text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Vehicle</label>
                                <select value={filterVehicle} onChange={(e) => setFilterVehicle(e.target.value)} className="h-10 w-full bg-slate-50 border border-slate-100 rounded-xl px-3 text-xs font-bold text-slate-700 outline-none cursor-pointer">
                                    <option value="">All Vehicles</option>
                                    {[...new Set((Array.isArray(vehicleLogs) ? vehicleLogs : []).map(l => l.vehicle_name))].filter(Boolean).sort().map(v => <option key={v} value={v}>{v}</option>)}
                                </select>
                            </div>

                            {/* Role Filter */}
                            <div className="w-full sm:w-[130px]">
                                <label className="block text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Role</label>
                                <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="h-10 w-full bg-slate-50 border border-slate-100 rounded-xl px-3 text-xs font-bold text-slate-700 outline-none cursor-pointer">
                                    <option value="">All Roles</option>
                                    {[...new Set([...(Array.isArray(roles) ? roles.map(r => r.name) : []), ...(Array.isArray(members) ? members.map(m => m.role).filter(Boolean) : [])])].sort().map(role => (
                                        <option key={role} value={role}>{role}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Type Filter */}
                            <div className="w-full sm:w-[130px]">
                                <label className="block text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Type</label>
                                <select value={filterMemberType} onChange={(e) => setFilterMemberType(e.target.value)} className="h-10 w-full bg-slate-50 border border-slate-100 rounded-xl px-3 text-xs font-bold text-slate-700 outline-none cursor-pointer">
                                    <option value="all">Everyone</option>
                                    <option value="worker">Workers</option>
                                    <option value="employee">Employees</option>
                                </select>
                            </div>

                            {/* Member Filter */}
                            <div className="w-full sm:w-[180px]">
                                <label className="block text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Member / Guest</label>
                                <select value={filterMember} onChange={(e) => setFilterMember(e.target.value)} className="h-10 w-full bg-slate-50 border border-slate-100 rounded-xl px-3 text-xs font-bold text-slate-700 outline-none cursor-pointer">
                                    <option value="">Everyone</option>
                                    <option value="guest">All Guests (Non-Members)</option>
                                    <optgroup label="Registered Members">
                                        {members.filter(m => !m.isGuest && (!filterRole || m.role === filterRole) && (filterMemberType === 'all' || m.member_type === filterMemberType)).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                    </optgroup>
                                    <optgroup label="Frequent Guests">
                                        {members.filter(m => m.isGuest).map(m => <option key={m.id} value={m.id}>[GUEST] {m.name}</option>)}
                                    </optgroup>
                                </select>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 ml-auto">
                                <ExportButtons onExportCSV={() => setConfirmModal({ show: true, type: 'CSV', label: 'CSV Report' })} onExportPDF={() => setConfirmModal({ show: true, type: 'PDF', label: 'PDF Report' })} onExportTXT={() => setConfirmModal({ show: true, type: 'TXT', label: 'Plain Text Report' })} />
                                <button onClick={() => setShowProjectManager(true)} className="h-10 bg-blue-600 text-white px-4 rounded-xl shadow-lg shadow-blue-500/20 hover:scale-105 transition-all flex items-center gap-2" title="New Project">
                                    <FaFolderPlus />
                                    <span className="text-[9px] font-black uppercase tracking-widest hidden lg:inline">Project</span>
                                </button>
                                <button onClick={() => setActiveTab('Work Log')} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm lg:hidden ${activeTab === 'Work Log' ? 'bg-[#2d5bff] text-white' : 'bg-slate-800 text-white hover:bg-slate-900'}`} title="Daily Work Logs"><FaBoxes /></button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Mobile Tabs */}
                <div className="lg:hidden flex overflow-x-auto gap-3 mb-8 pb-2 custom-scrollbar">
                    {['Dashboard', 'Members', 'Transactions', 'Reports', 'Salary', 'Work Log', 'Vehicle Log'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`whitespace-nowrap px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-[#2d5bff] text-white' : 'bg-white text-slate-500 border'}`}>{tab}</button>
                    ))}
                </div>

                {/* Components */}
                {activeTab === 'Dashboard' ? (
                    <Dashboard
                        periodType={periodType} customRange={customRange} currentPeriod={currentPeriod} stats={stats}
                        pieData={pieData} barData={barData} COLORS={COLORS} transactions={combinedData}
                        handleShowTransactions={handleShowTransactions} handleAddNewTransaction={handleAddNewTransaction}
                        setActiveTab={setActiveTab} formatCurrency={formatCurrency}
                    />
                ) : activeTab === 'Members' ? (
                    <MemberManager onUpdate={fetchData} />
                ) : activeTab === 'Transactions' ? (
                    <Transactions
                        filteredTransactions={filteredTransactions} searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                        filterType={filterType} setFilterType={setFilterType} sortBy={sortBy} setSortBy={setSortBy}
                        handleAddNewTransaction={handleAddNewTransaction} handleEdit={handleEdit} confirmDelete={confirmDelete}
                        // New Filter Props
                        projects={projects} members={members} roles={roles}
                        filterProject={filterProject} setFilterProject={setFilterProject}
                        filterMember={filterMember} setFilterMember={setFilterMember}
                        filterRole={filterRole} setFilterRole={setFilterRole}
                        periodType={periodType} setPeriodType={setPeriodType}
                        currentPeriod={currentPeriod} setCurrentPeriod={setCurrentPeriod}
                        customRange={customRange} setCustomRange={setCustomRange}
                        filterVehicle={filterVehicle} setFilterVehicle={setFilterVehicle} vehicleNames={vehicleNames}
                        onExportCSV={() => setConfirmModal({ show: true, type: 'CSV', label: 'CSV Report' })}
                        onExportPDF={() => setConfirmModal({ show: true, type: 'PDF', label: 'PDF Report' })}
                        onExportTXT={() => setConfirmModal({ show: true, type: 'TXT', label: 'Plain Text Report' })}
                    />
                ) : activeTab === 'Reports' ? (
                    <Reports
                        transactions={transactions} filteredTransactions={filteredTransactions}
                        handleExportPDF={handleExportPDF} handleExportCSV={handleExportCSV} handleExportTXT={handleExportTXT}
                        filterMember={filterMember} filterProject={filterProject} members={members} projects={projects}
                        periodType={periodType} customRange={customRange} currentPeriod={currentPeriod}
                        memberStats={memberStats} stats={stats} setShowCustomReportModal={setShowCustomReportModal}
                        setCustomReportForm={setCustomReportForm} customReportForm={customReportForm}
                    />
                ) : activeTab === 'Salary' ? (
                    <SalaryCalculator
                        periodType={periodType} filterMember={filterMember} setFilterMember={setFilterMember}
                        filterMemberType={filterMemberType} currentPeriod={currentPeriod}
                        members={members} roles={roles} filteredTransactions={filteredTransactions}
                        handleExportPDF={handleExportPDF} handleExportCSV={handleExportCSV} handleExportTXT={handleExportTXT}
                        handleExportPayslip={handleExportPayslip}
                        salaryLoading={salaryLoading} attendanceStats={attendanceStats} salaryMode={salaryMode} setSalaryMode={setSalaryMode}
                        dailyWage={dailyWage} setDailyWage={setDailyWage} monthlySalary={monthlySalary} setMonthlySalary={setMonthlySalary}
                        unitsProduced={unitsProduced} setUnitsProduced={setUnitsProduced} ratePerUnit={ratePerUnit} setRatePerUnit={setRatePerUnit}
                        bonus={bonus} setBonus={setBonus} stats={stats} setFormData={setFormData} formData={formData}
                        setShowAddModal={setShowAddModal} transactions={transactions}
                    />
                ) : activeTab === 'Vehicle Log' ? (
                    <VehicleTrackerManager />
                ) : (
                    <DailyWorkLogManager />
                )}
            </main>

            {/* Global Modals */}
            {showAddModal && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[40px] p-8 sm:p-10 w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-300 border border-white">
                        <button onClick={() => { setShowAddModal(false); setEditingId(null); }} className="absolute top-8 right-8 text-slate-400 hover:text-slate-800 transition-colors">
                            <FaTimes size={18} />
                        </button>

                        <div className="mb-8">
                            <h2 className="text-2xl font-black text-slate-900 leading-tight">
                                {editingId ? 'Edit Record' : `New ${formData.type === 'income' ? 'Income' : 'Expense'}`}
                            </h2>
                            <div className="h-[8px] mt-1 flex gap-1">
                                <div className="px-1 bg-blue-50 text-[6px] font-black text-blue-500 rounded-full flex items-center uppercase tracking-tighter">FINANCIAL RECORD</div>
                                <div className="px-1 bg-slate-100 text-[6px] font-black text-slate-400 rounded-full flex items-center uppercase tracking-tighter">{formData.type.toUpperCase()}</div>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="flex p-1 bg-slate-100 rounded-2xl">
                                <button type="button" onClick={() => setFormData({ ...formData, type: 'expense', category: 'General' })} className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.type === 'expense' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>Expense</button>
                                <button type="button" onClick={() => setFormData({ ...formData, type: 'income', category: 'General' })} className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.type === 'income' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>Income</button>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Title / Description</label>
                                        <input required type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-xs" placeholder="What is this for?" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">
                                            {formData.type === 'income' ? 'Qty Sold' : 'Qty / Count'}
                                        </label>
                                        <input required type="number" step="0.01" value={formData.quantity} onChange={(e) => {
                                            const qty = parseFloat(e.target.value) || 0;
                                            setFormData({ ...formData, quantity: qty, amount: (qty * formData.unit_price).toFixed(2) });
                                        }} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-black text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-xs" placeholder="1" />
                                    </div>
                                    <div>
                                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">
                                            {formData.type === 'income' ? 'Rate / Price' : 'Unit Cost'}
                                        </label>
                                        <input required type="number" step="0.01" value={formData.unit_price} onChange={(e) => {
                                            const rate = parseFloat(e.target.value) || 0;
                                            setFormData({ ...formData, unit_price: rate, amount: (formData.quantity * rate).toFixed(2) });
                                        }} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-black text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-xs" placeholder="0.00" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Total Amount (₹)</label>
                                        <input required type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="w-full bg-blue-50 border border-blue-200 rounded-2xl px-5 py-3 text-sm font-black text-blue-700 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-xs" placeholder="0.00" />
                                    </div>
                                    <div>
                                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Category</label>
                                        <div className="flex gap-2">
                                            <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-xs cursor-pointer">
                                                <option value="General">General</option>
                                                {Array.isArray(categories) && categories.filter(c => c.type === formData.type && c.name !== 'General').map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                            </select>
                                            <button
                                                type="button"
                                                onClick={() => setShowCategoryManager(true)}
                                                className="w-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center hover:bg-purple-100 transition-all border border-purple-100 shrink-0"
                                                title="Add New Category"
                                            >
                                                <FaPlus />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div>
                                        <label className="block text-[7px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5 ml-1">Project (Optional)</label>
                                        <select value={formData.project_id} onChange={(e) => setFormData({ ...formData, project_id: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-700 outline-none focus:border-blue-500 transition-all shadow-xs cursor-pointer">
                                            <option value="">No Project</option>
                                            {Array.isArray(projects) && projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-center mb-1.5 px-1">
                                            <label className="block text-[7px] font-black text-slate-400 uppercase tracking-[0.2em]">Member / Guest</label>
                                            <div className="flex bg-slate-200 p-0.5 rounded-md">
                                                <button type="button" onClick={() => setFormData(prev => ({ ...prev, member_id: '', guest_name: '' }))} className={`px-1 rounded text-[6px] font-black transition-all ${!formData.guest_name ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}>M</button>
                                                <button type="button" onClick={() => setFormData(prev => ({ ...prev, member_id: '', guest_name: 'Guest' }))} className={`px-1 rounded text-[6px] font-black transition-all ${formData.guest_name ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}>G</button>
                                            </div>
                                        </div>
                                        {formData.guest_name !== undefined && formData.guest_name !== null && typeof formData.guest_name === 'string' && formData.guest_name.length >= 0 && (formData.member_id === '' || formData.member_id === null) && formData.guest_name !== '' ? (
                                            <input type="text" value={formData.guest_name === 'Guest' ? '' : formData.guest_name} onChange={(e) => setFormData({ ...formData, guest_name: e.target.value, member_id: '' })} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-700 outline-none focus:border-blue-500 transition-all shadow-xs" placeholder="Guest Name..." />
                                        ) : (
                                            <select value={formData.member_id} onChange={(e) => setFormData({ ...formData, member_id: e.target.value, guest_name: '' })} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-700 outline-none focus:border-blue-500 transition-all shadow-xs cursor-pointer">
                                                <option value="">No Member</option>
                                                {Array.isArray(members) && members.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                            </select>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Date</label>
                                        <input required type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-xs" />
                                    </div>
                                    <div>
                                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Status</label>
                                        <select value={formData.payment_status || 'completed'} onChange={(e) => setFormData({ ...formData, payment_status: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-xs cursor-pointer">
                                            <option value="completed">Paid</option>
                                            <option value="pending">Pending</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-5 rounded-[24px] transition-all active:scale-95 shadow-xl shadow-slate-900/10 flex items-center justify-center gap-3 text-sm mt-4">
                                {editingId ? <FaEdit /> : <FaPlus />}
                                {editingId ? 'Update Record' : 'Save Record'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(null)}></div>
                    <div className="relative bg-white rounded-[32px] shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden z-10">
                        <div className="sticky top-0 bg-white border-b border-slate-100 p-6 flex items-center justify-between z-10">
                            <h3 className="text-xl font-black text-slate-800">{showModal === 'income' ? 'Income Transactions' : 'Expense Transactions'}</h3>
                            <button onClick={() => setShowModal(null)} className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"><FaTimes className="w-5 h-5 text-slate-600" /></button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
                            {modalTransactions.length > 0 ? (
                                <div className="space-y-3">
                                    {modalTransactions.map((transaction) => (
                                        <div key={transaction.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-100 hover:border-blue-200 transition-all">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1"><h4 className="font-bold text-slate-800 mb-1">{transaction.title}</h4><div className="flex flex-wrap gap-2 text-xs"><span className={`px-2 py-1 rounded-full font-bold ${transaction.type === 'income' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>{transaction.type}</span></div></div>
                                                <div className={`text-lg font-black ${transaction.type === 'income' ? 'text-blue-600' : 'text-red-600'}`}>₹{formatAmount(transaction.amount)}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (<div className="text-center py-12"><div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4"><FaWallet className="w-8 h-8 text-slate-400" /></div><p className="text-slate-500 font-bold">No {showModal} transactions found</p></div>)}
                        </div>
                    </div>
                </div>
            )}

            {deleteModalOuter.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-[16px] bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] p-[32px] w-full max-w-[400px] shadow-2xl animate-in zoom-in-95 duration-300 border border-white">
                        <div className="w-[64px] h-[64px] bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-[24px] mx-auto"><FaTrash className="text-[24px]" /></div>
                        <h3 className="text-[20px] font-black text-center text-slate-800 mb-[12px]">Delete Transaction?</h3>
                        <p className="text-center text-slate-500 text-[14px] font-medium mb-[32px]">Are you sure you want to delete this transaction? This action cannot be undone.</p>
                        <div className="flex gap-[16px]"><button onClick={() => setDeleteModalOuter({ show: false, id: null })} className="flex-1 py-[16px] rounded-[16px] font-black text-[14px] bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all uppercase tracking-widest">Cancel</button><button onClick={() => handleDelete(deleteModalOuter.id)} className="flex-1 py-[16px] rounded-[16px] font-black text-[14px] bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all uppercase tracking-widest">Delete</button></div>
                    </div>
                </div>
            )}

            {showCategoryManager && <CategoryManager categories={categories} onUpdate={() => getExpenseCategories({ sector: 'manufacturing' }).then(res => setCategories(res.data))} onCreate={(data) => createExpenseCategory({ ...data, sector: 'manufacturing' })} onDelete={(id) => deleteExpenseCategory(id, 'manufacturing')} onClose={() => setShowCategoryManager(false)} />}
            {showProjectManager && <ProjectManager projects={projects} onCreate={createProject} onDelete={deleteProject} onRefresh={fetchData} onClose={() => setShowProjectManager(false)} />}

            {showCustomReportModal && (
                <div className="fixed inset-0 z-150 flex items-center justify-center p-[16px] bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[40px] p-[32px] sm:p-[40px] w-full max-w-[500px] shadow-2xl relative animate-in zoom-in-95 duration-300">
                        <button onClick={() => setShowCustomReportModal(false)} className="absolute top-[32px] right-[32px] text-slate-400 hover:text-slate-800 transition-colors"><FaTimes /></button>
                        <h2 className="text-[24px] font-black mb-[32px] flex items-center gap-[12px]"><div className="w-[8px] h-[32px] bg-indigo-500 rounded-full"></div>Custom Report</h2>
                        <div className="space-y-[24px]">
                            <div className="grid grid-cols-2 gap-[16px]">
                                <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[8px] ml-[4px]">Start Date</label><input type="date" value={customReportForm.startDate} onChange={(e) => setCustomReportForm({ ...customReportForm, startDate: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-[16px] px-[20px] py-[12px] text-[12px] font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all" /></div>
                                <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[8px] ml-[4px]">End Date</label><input type="date" value={customReportForm.endDate} onChange={(e) => setCustomReportForm({ ...customReportForm, endDate: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-[16px] px-[20px] py-[12px] text-[12px] font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all" /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-[16px]">
                                <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[8px] ml-[4px]">Project</label><select value={customReportForm.projectId} onChange={(e) => setCustomReportForm({ ...customReportForm, projectId: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-[16px] px-[20px] py-[12px] text-[12px] font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all cursor-pointer"><option value="">All Projects</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[8px] ml-[4px]">Member / Guest</label>
                                    <select
                                        value={customReportForm.memberId}
                                        onChange={(e) => setCustomReportForm({ ...customReportForm, memberId: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-[16px] px-[20px] py-[12px] text-[12px] font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all cursor-pointer"
                                    >
                                        <option value="">Everyone (Summary)</option>
                                        <option value="guest">All Guests (Grouped)</option>
                                        <optgroup label="Registered Members">
                                            {members.filter(m => !m.isGuest).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                        </optgroup>
                                        <optgroup label="Frequent Guests">
                                            {members.filter(m => m.isGuest).map(w => <option key={w.id} value={w.id}>[GUEST] {w.name}</option>)}
                                        </optgroup>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-[16px]">
                                <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[8px] ml-[4px]">Type</label><select value={customReportForm.type} onChange={(e) => setCustomReportForm({ ...customReportForm, type: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-[16px] px-[20px] py-[12px] text-[12px] font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all cursor-pointer"><option value="all">All Transactions</option><option value="income">Income Only</option><option value="expense">Expenses Only</option></select></div>
                                <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[8px] ml-[4px]">Category</label><select value={customReportForm.category} onChange={(e) => setCustomReportForm({ ...customReportForm, category: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-[16px] px-[20px] py-[12px] text-[12px] font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all cursor-pointer"><option value="all">All Categories</option>{[...new Set(categories.map(c => c.name))].map(cat => (<option key={cat} value={cat}>{cat}</option>))}</select></div>
                            </div>
                            <div className="grid grid-cols-2 gap-[16px]">
                                <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[8px] ml-[4px]">Vehicle (Fleet)</label><select value={customReportForm.vehicle} onChange={(e) => setCustomReportForm({ ...customReportForm, vehicle: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-[16px] px-[20px] py-[12px] text-[12px] font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all cursor-pointer">{vehicleNames.map(v => <option key={v} value={v}>{v}</option>)}<option value="">All Vehicles</option></select></div>
                            </div>
                            <div className="flex flex-col gap-[12px]">
                                <button onClick={() => handleGenerateCustomReport('PDF')} disabled={!!customReportLoading} className="w-full bg-[#2d5bff] hover:bg-blue-600 text-white font-black py-[18px] rounded-[20px] transition-all active:scale-95 shadow-xl flex items-center justify-center gap-[12px] text-[14px] disabled:opacity-50 disabled:cursor-not-allowed">{customReportLoading === 'PDF' ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <FaFileAlt />} {customReportLoading === 'PDF' ? 'Generating...' : 'Download PDF Report'}</button>
                                <div className="grid grid-cols-2 gap-[12px]">
                                    <button onClick={() => handleGenerateCustomReport('CSV')} disabled={!!customReportLoading} className="bg-emerald-500 hover:bg-emerald-600 text-white font-black py-[16px] rounded-[20px] transition-all active:scale-95 shadow-lg flex items-center justify-center gap-[8px] text-[12px] disabled:opacity-50 disabled:cursor-not-allowed">{customReportLoading === 'CSV' ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <FaFileAlt />} CSV</button>
                                    <button onClick={() => handleGenerateCustomReport('TXT')} disabled={!!customReportLoading} className="bg-slate-700 hover:bg-slate-800 text-white font-black py-[16px] rounded-[20px] transition-all active:scale-95 shadow-lg flex items-center justify-center gap-[8px] text-[12px] disabled:opacity-50 disabled:cursor-not-allowed">{customReportLoading === 'TXT' ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <FaFileAlt />} Text</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {confirmModal.show && ReactDOM.createPortal(
                <div className="fixed inset-0 z-9999 flex items-center justify-center p-[16px] w-full h-full">
                    <div className="absolute inset-0 bg-[#0f172a]/70 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setConfirmModal({ show: false, type: null, label: '' })}></div>
                    <div className="relative bg-white rounded-[32px] p-[32px] w-full max-w-[400px] shadow-2xl animate-in zoom-in duration-300 text-center border border-white">
                        <div className="w-[80px] h-[80px] bg-blue-50 rounded-[28px] flex items-center justify-center mx-auto mb-[24px] text-blue-500 transform -rotate-6"><FaQuestionCircle size={40} /></div>
                        <h3 className="text-[24px] font-black text-slate-800 mb-[12px] tracking-tight">Export {confirmModal.label}?</h3>
                        <p className="text-slate-500 text-[15px] font-medium mb-[32px] leading-relaxed">Are you sure you want to download this <span className="text-slate-900 font-bold">{confirmModal.type}</span> report?</p>
                        <div className="grid grid-cols-2 gap-[16px]">
                            <button onClick={() => setConfirmModal({ show: false, type: null, label: '' })} className="py-[16px] rounded-[20px] bg-slate-100 text-slate-600 text-[13px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
                            <button onClick={() => { if (confirmModal.type === 'CSV') handleExportCSV(combinedData); if (confirmModal.type === 'PDF') handleExportPDF(combinedData); if (confirmModal.type === 'TXT') handleExportTXT(combinedData); setConfirmModal({ show: false, type: null, label: '' }); }} className="py-[16px] rounded-[20px] bg-slate-900 text-white text-[13px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 flex items-center justify-center gap-[10px]"><FaCheck /> Confirm</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default ExpenseTrackerMain;

