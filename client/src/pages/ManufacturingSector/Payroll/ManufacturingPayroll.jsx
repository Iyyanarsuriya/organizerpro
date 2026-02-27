import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
    getMfgPayroll,
    generateMfgPayroll,
    approveMfgPayroll,
    deleteMfgPayroll
} from '../../../api/Payroll/mfgPayroll';
import {
    Banknote,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Search,
    CheckCircle,
    Clock,
    Loader2
} from 'lucide-react';
import ExportButtons from '../../../components/Common/ExportButtons';
import { generateCSV, generatePDF, generateTXT } from '../../../utils/exportUtils/base';

const ManufacturingPayroll = () => {
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [payrolls, setPayrolls] = useState([]);
    const [summary, setSummary] = useState({ total_amount: 0, status_counts: {} });
    const [searchTerm, setSearchTerm] = useState('');
    const lastFetchRef = React.useRef(0);

    useEffect(() => {
        fetchPayrolls();
    }, [selectedDate]);

    const fetchPayrolls = async (force = false) => {
        const now = Date.now();
        const month = selectedDate.getMonth() + 1;
        const year = selectedDate.getFullYear();

        // Throttle fetching (60s cache/throttle)
        if (!force && now - lastFetchRef.current < 60000 && !loading) {
            return;
        }

        // Request Deduplication
        const currentParamsKey = JSON.stringify({ month, year });

        if (!force && window._mfgPayrollFetchPromise && window._mfgPayrollParamsKey === currentParamsKey) {
            try {
                const res = await window._mfgPayrollFetchPromise;
                if (res.data.success) {
                    const records = Array.isArray(res.data.data) ? res.data.data : (res.data.data.records || []);
                    setPayrolls(records);
                    const total = records.reduce((acc, p) => acc + parseFloat(p.net_amount || 0), 0);
                    const approved = records.filter(p => p.status === 'approved' || p.status === 'paid').length;
                    const pending = records.filter(p => p.status === 'draft' || p.status === 'pending_approval').length;
                    setSummary({ total_amount: total, status_counts: { approved, pending } });
                }
                lastFetchRef.current = Date.now();
            } catch (error) {
                console.error("Error joining existing fetch:", error);
            } finally {
                setLoading(false);
            }
            return;
        }

        if (force) {
            window._mfgPayrollFetchPromise = null;
        }

        setLoading(true);
        const fetchPromise = getMfgPayroll({ month, year });

        if (!force) {
            window._mfgPayrollFetchPromise = fetchPromise;
            window._mfgPayrollParamsKey = currentParamsKey;
        }

        try {
            const res = await fetchPromise;

            if (res.data.success) {
                // Backend returns array for list, object for generate
                const records = Array.isArray(res.data.data) ? res.data.data : (res.data.data.records || []);
                setPayrolls(records);

                // Calculate summary locally since backend list endpoint doesn't return it
                const total = records.reduce((acc, p) => acc + parseFloat(p.net_amount || 0), 0);
                const approved = records.filter(p => p.status === 'approved' || p.status === 'paid').length;
                const pending = records.filter(p => p.status === 'draft' || p.status === 'pending_approval').length;

                setSummary({
                    total_amount: total,
                    status_counts: { approved, pending }
                });
                lastFetchRef.current = Date.now();
            }
        } catch (error) {
            toast.error('Failed to load payroll data');
        } finally {
            if (!force) {
                window._mfgPayrollFetchPromise = null;
            }
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const month = selectedDate.getMonth() + 1;
            const year = selectedDate.getFullYear();
            const res = await generateMfgPayroll({ month, year });

            if (res.data.success) {
                toast.success(`Payroll generated for ${res.data.data.records.length} members!`);
                fetchPayrolls(true); // force refresh
            }
        } catch (error) {
            const msg = error.response?.data?.message || 'Generation failed';
            if (msg.includes('already exists')) {
                toast.error(msg);
            } else {
                toast.error(msg);
            }
        } finally {
            setGenerating(false);
        }
    };

    const handleApprove = async (id) => {
        try {
            const res = await approveMfgPayroll(id);
            if (res.data.success) {
                toast.success('Payroll approved & expense created!');
                fetchPayrolls(true); // force refresh to immediately show Approved status
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Approval failed');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this payroll record?')) return;
        try {
            await deleteMfgPayroll(id);
            toast.success('Payroll deleted');
            fetchPayrolls(true); // force refresh
        } catch (error) {
            toast.error(error.response?.data?.message || 'Delete failed');
        }
    };

    const handleExportCSV = () => {
        const headers = ['Member Name', 'Role', 'Present', 'Half Day', 'Absent', 'Total Days', 'Calculated Wage', 'Net Amount', 'Status'];
        const rows = (Array.isArray(payrolls) ? payrolls : []).map(p => [
            p.member_name,
            p.member_role,
            p.days_present,
            p.days_half,
            p.days_absent,
            (p.days_present || 0) + (p.days_half || 0) + (p.days_absent || 0),
            p.base_amount,
            p.net_amount,
            p.status
        ]);
        const monthYear = selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        generateCSV(headers, rows, `Manufacturing_Payroll_${monthYear.replace(' ', '_')}`);
    };

    const handleExportPDF = () => {
        const headers = ['Member', 'Role', 'P/HD/A', 'Days', 'Wage', 'Net', 'Status'];
        const rows = (Array.isArray(payrolls) ? payrolls : []).map(p => [
            p.member_name,
            p.member_role,
            `${p.days_present}/${p.days_half}/${p.days_absent}`,
            (p.days_present || 0) + (p.days_half || 0) + (p.days_absent || 0),
            p.base_amount,
            p.net_amount,
            p.status
        ]);
        const monthYear = selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        generatePDF({
            title: `Manufacturing Payroll - ${monthYear}`,
            period: monthYear,
            stats: [
                { label: 'Total Amount', value: `₹${summary.total_amount?.toLocaleString() || 0}` },
                { label: 'Total Records', value: payrolls.length }
            ],
            tableHeaders: headers,
            tableRows: rows,
            filename: `Manufacturing_Payroll_${monthYear.replace(' ', '_')}`
        });
    };

    const handleExportTXT = () => {
        const headers = ['Member Name', 'Role', 'Net Amount', 'Status'];
        const rows = (Array.isArray(payrolls) ? payrolls : []).map(p => [
            p.member_name,
            p.member_role,
            p.net_amount,
            p.status
        ]);
        const monthYear = selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        generateTXT({
            title: `Manufacturing Payroll - ${monthYear}`,
            period: monthYear,
            stats: [{ label: 'Total Amount', value: `₹${summary.total_amount?.toLocaleString() || 0}` }],
            logHeaders: headers,
            logRows: rows,
            filename: `Manufacturing_Payroll_${monthYear.replace(' ', '_')}`
        });
    };

    const changeMonth = (delta) => {
        const newDate = new Date(selectedDate);
        newDate.setMonth(newDate.getMonth() + delta);
        setSelectedDate(newDate);
    };

    const filteredPayrolls = (Array.isArray(payrolls) ? payrolls : []).filter(p =>
        (p.member_name || '').toLowerCase().includes((searchTerm || '').toLowerCase())
    );

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];

    return (
        <div className="min-h-screen bg-[#f8fafc] p-[16px] sm:p-[28px] md:p-[40px] font-['Outfit'] pb-[80px] sm:pb-[100px]">
            <div className="max-w-[1280px] mx-auto w-full">

                <h1 className="text-[20px] sm:text-[24px] md:text-[30px] font-black text-slate-800 mb-[16px] sm:mb-[24px] uppercase tracking-widest text-center transition-all duration-300">
                    Manufacturing Payroll
                </h1>

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-[16px] sm:gap-[24px] mb-[24px] sm:mb-[40px]">
                    <div className="flex items-center gap-[12px] sm:gap-[16px]">
                        <Link to="/manufacturing" className="w-[40px] h-[40px] sm:w-[48px] sm:h-[48px] bg-white border border-slate-200 rounded-[16px] sm:rounded-[20px] flex items-center justify-center text-slate-500 hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm hover:shadow-md active:scale-95 shrink-0">
                            <ChevronLeft className="w-[18px] h-[18px] sm:w-[24px] sm:h-[24px]" />
                        </Link>
                        <div>
                            <h1 className="text-[20px] sm:text-[26px] md:text-[32px] font-black text-slate-800 tracking-tight flex items-center gap-[10px]">
                                <Banknote className="w-[20px] h-[20px] sm:w-[26px] sm:h-[26px] md:w-[32px] md:h-[32px] text-rose-500 shrink-0" />
                                Payroll Management
                            </h1>
                            <p className="text-[11px] sm:text-[14px] text-slate-500 font-medium mt-[2px]">Manage monthly wages and approvals</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-[10px] sm:gap-[16px]">
                        <ExportButtons
                            onExportCSV={handleExportCSV}
                            onExportPDF={handleExportPDF}
                            onExportTXT={handleExportTXT}
                        />

                        <div className="flex items-center gap-[6px] sm:gap-[16px] bg-white p-[6px] sm:p-[8px] rounded-[14px] sm:rounded-[16px] shadow-sm border border-slate-200">
                            <button onClick={() => changeMonth(-1)} className="p-[6px] sm:p-[8px] hover:bg-slate-50 rounded-[10px] sm:rounded-[12px] text-slate-600 transition-colors">
                                <ChevronLeft className="w-[16px] h-[16px] sm:w-[20px] sm:h-[20px]" />
                            </button>
                            <div className="flex items-center gap-[6px] sm:gap-[8px] px-[4px] sm:px-[8px] min-w-[110px] sm:min-w-[160px] justify-center text-slate-700 font-bold text-[12px] sm:text-[15px]">
                                <Calendar className="w-[14px] h-[14px] sm:w-[18px] sm:h-[18px] text-rose-500 shrink-0" />
                                {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
                            </div>
                            <button onClick={() => changeMonth(1)} className="p-[6px] sm:p-[8px] hover:bg-slate-50 rounded-[10px] sm:rounded-[12px] text-slate-600 transition-colors">
                                <ChevronRight className="w-[16px] h-[16px] sm:w-[20px] sm:h-[20px]" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[14px] sm:gap-[20px] md:gap-[24px] mb-[24px] sm:mb-[40px]">
                    <div className="bg-white p-[16px] sm:p-[24px] rounded-[20px] sm:rounded-[24px] shadow-sm border border-slate-100 flex items-center gap-[14px] sm:gap-[20px]">
                        <div className="w-[44px] h-[44px] sm:w-[56px] sm:h-[56px] rounded-[14px] sm:rounded-[16px] bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                            <Banknote className="w-[22px] h-[22px] sm:w-[28px] sm:h-[28px]" />
                        </div>
                        <div>
                            <p className="text-slate-400 text-[11px] sm:text-[14px] font-semibold uppercase tracking-wider">Total Payout</p>
                            <p className="text-[22px] sm:text-[28px] font-black text-emerald-600">₹{summary?.total_amount?.toLocaleString() || '0'}</p>
                        </div>
                    </div>

                    <div className="bg-white p-[16px] sm:p-[24px] rounded-[20px] sm:rounded-[24px] shadow-sm border border-slate-100 flex items-center gap-[14px] sm:gap-[20px]">
                        <div className="w-[44px] h-[44px] sm:w-[56px] sm:h-[56px] rounded-[14px] sm:rounded-[16px] bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                            <CheckCircle className="w-[22px] h-[22px] sm:w-[28px] sm:h-[28px]" />
                        </div>
                        <div>
                            <p className="text-slate-400 text-[11px] sm:text-[14px] font-semibold uppercase tracking-wider">Approved</p>
                            <p className="text-[22px] sm:text-[28px] font-black text-slate-800">{summary?.status_counts?.approved || 0} <span className="text-[12px] sm:text-[14px] text-slate-400 font-medium">Members</span></p>
                        </div>
                    </div>

                    <div className="bg-white p-[16px] sm:p-[24px] rounded-[20px] sm:rounded-[24px] shadow-sm border border-slate-100 flex items-center gap-[14px] sm:gap-[20px] sm:col-span-2 lg:col-span-1">
                        <div className="w-[44px] h-[44px] sm:w-[56px] sm:h-[56px] rounded-[14px] sm:rounded-[16px] bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                            <Clock className="w-[22px] h-[22px] sm:w-[28px] sm:h-[28px]" />
                        </div>
                        <div>
                            <p className="text-slate-400 text-[11px] sm:text-[14px] font-semibold uppercase tracking-wider">Pending</p>
                            <p className="text-[22px] sm:text-[28px] font-black text-slate-800">{summary?.status_counts?.pending || 0} <span className="text-[12px] sm:text-[14px] text-slate-400 font-medium">Review Needed</span></p>
                        </div>
                    </div>
                </div>

                {/* Actions Bar */}
                <div className="flex flex-col sm:flex-row gap-[12px] sm:gap-[16px] justify-between items-stretch sm:items-center mb-[16px] sm:mb-[24px]">
                    <div className="relative w-full sm:w-[260px] md:w-[300px]">
                        <Search className="absolute left-[14px] top-1/2 -translate-y-1/2 w-[16px] h-[16px] sm:w-[20px] sm:h-[20px] text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search details..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-[40px] sm:pl-[48px] pr-[14px] py-[10px] sm:py-[12px] bg-white rounded-[14px] sm:rounded-[16px] border border-slate-200 text-[13px] sm:text-[15px] text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all placeholder:text-slate-400"
                        />
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={generating || payrolls.length > 0}
                        className={`px-[18px] sm:px-[24px] py-[10px] sm:py-[12px] rounded-[14px] sm:rounded-[16px] font-bold text-[13px] sm:text-[15px] text-white shadow-lg shadow-rose-500/30 transition-all flex items-center justify-center gap-[8px] sm:gap-[10px] w-full sm:w-auto
                            ${generating || payrolls.length > 0
                                ? 'bg-slate-300 shadow-none cursor-not-allowed text-slate-500'
                                : 'bg-rose-500 hover:bg-rose-600 hover:-translate-y-[2px] active:scale-95'
                            }`}
                    >
                        {generating ? <Loader2 className="w-[16px] h-[16px] sm:w-[20px] sm:h-[20px] animate-spin" /> : <Banknote className="w-[16px] h-[16px] sm:w-[20px] sm:h-[20px]" />}
                        {(Array.isArray(payrolls) && payrolls.length > 0) ? 'Payroll Generated' : 'Generate Payroll'}
                    </button>
                </div>

                {/* Table */}
                <div className="bg-white rounded-[20px] sm:rounded-[24px] shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[480px]">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50">
                                    <th className="text-left py-[14px] sm:py-[20px] px-[14px] sm:px-[24px] text-[11px] sm:text-[13px] font-bold text-slate-500 uppercase tracking-wider">Member</th>
                                    <th className="text-left py-[14px] sm:py-[20px] px-[14px] sm:px-[24px] text-[11px] sm:text-[13px] font-bold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Role</th>
                                    <th className="hidden sm:table-cell text-left py-[14px] sm:py-[20px] px-[14px] sm:px-[24px] text-[11px] sm:text-[13px] font-bold text-slate-500 uppercase tracking-wider">Base Salary</th>
                                    <th className="text-left py-[14px] sm:py-[20px] px-[14px] sm:px-[24px] text-[11px] sm:text-[13px] font-bold text-slate-500 uppercase tracking-wider">Net Amount</th>
                                    <th className="text-left py-[14px] sm:py-[20px] px-[14px] sm:px-[24px] text-[11px] sm:text-[13px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="text-right py-[14px] sm:py-[20px] px-[14px] sm:px-[24px] text-[11px] sm:text-[13px] font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="py-[48px] sm:py-[60px] text-center text-slate-400 font-medium text-[13px] sm:text-[15px]">
                                            <div className="flex justify-center mb-[12px]"><Loader2 className="w-[28px] h-[28px] sm:w-[32px] sm:h-[32px] animate-spin text-rose-500" /></div>
                                            Loading payroll records...
                                        </td>
                                    </tr>
                                ) : (Array.isArray(filteredPayrolls) && filteredPayrolls.length === 0) ? (
                                    <tr>
                                        <td colSpan="6" className="py-[48px] sm:py-[60px] text-center text-slate-400 font-medium text-[13px] sm:text-[15px]">
                                            {(Array.isArray(payrolls) && payrolls.length === 0) ? "No payroll generated for this month." : "No members found matching your search."}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredPayrolls.map((payroll) => (
                                        <tr key={payroll.id} className="hover:bg-slate-50/50 transition-colors group">
                                            {/* Member */}
                                            <td className="py-[14px] sm:py-[20px] px-[14px] sm:px-[24px]">
                                                <div className="font-bold text-[13px] sm:text-[15px] text-slate-800">{payroll.member_name || 'Unknown Member'}</div>
                                                {/* Role shown inline on mobile */}
                                                <div className="text-[11px] text-slate-400 capitalize sm:hidden mt-[2px]">{payroll.member_role} · {payroll.wage_type}</div>
                                            </td>
                                            {/* Role — hidden on mobile */}
                                            <td className="py-[14px] sm:py-[20px] px-[14px] sm:px-[24px] hidden sm:table-cell">
                                                <div className="text-[13px] sm:text-[14px] text-slate-600 font-medium">{payroll.member_role}</div>
                                                <div className="text-[11px] sm:text-[12px] text-slate-400 capitalize">{payroll.wage_type}</div>
                                            </td>
                                            {/* Base Salary — hidden on mobile */}
                                            <td className="hidden sm:table-cell py-[14px] sm:py-[20px] px-[14px] sm:px-[24px]">
                                                <div className="text-[13px] sm:text-[14px] text-slate-600 font-medium">₹{payroll.base_amount?.toLocaleString()}</div>
                                            </td>
                                            {/* Net Amount */}
                                            <td className="py-[14px] sm:py-[20px] px-[14px] sm:px-[24px]">
                                                <div className="text-[15px] sm:text-[18px] font-bold text-slate-800">₹{payroll.net_amount?.toLocaleString()}</div>
                                            </td>
                                            {/* Status */}
                                            <td className="py-[14px] sm:py-[20px] px-[14px] sm:px-[24px]">
                                                <span className={`inline-flex items-center px-[8px] sm:px-[12px] py-[3px] sm:py-[6px] rounded-full text-[10px] sm:text-[12px] font-bold capitalize
                                                    ${payroll.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                                        payroll.status === 'paid' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-amber-100 text-amber-700'}`}>
                                                    {payroll.status}
                                                </span>
                                            </td>
                                            {/* Actions */}
                                            <td className="py-[14px] sm:py-[20px] px-[14px] sm:px-[24px] text-right">
                                                <div className="flex items-center justify-end gap-[6px] sm:gap-[12px]">
                                                    {payroll.status === 'draft' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleDelete(payroll.id)}
                                                                className="text-slate-400 hover:text-rose-500 font-medium text-[11px] sm:text-[14px] transition-colors"
                                                                title="Delete"
                                                            >
                                                                Delete
                                                            </button>
                                                            <button
                                                                onClick={() => handleApprove(payroll.id)}
                                                                className="px-[10px] sm:px-[16px] py-[5px] sm:py-[8px] bg-slate-900 hover:bg-slate-800 text-white rounded-[8px] sm:rounded-[10px] font-bold text-[11px] sm:text-[14px] transition-colors shadow-lg shadow-slate-900/20 active:scale-95"
                                                            >
                                                                Approve
                                                            </button>
                                                        </>
                                                    )}
                                                    {(payroll.status === 'approved' || payroll.status === 'paid') && (
                                                        <span className="text-emerald-600 font-medium text-[11px] sm:text-[14px] flex items-center gap-[4px] sm:gap-[6px]">
                                                            <CheckCircle className="w-[13px] h-[13px] sm:w-[16px] sm:h-[16px]" /> Approved
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ManufacturingPayroll;

