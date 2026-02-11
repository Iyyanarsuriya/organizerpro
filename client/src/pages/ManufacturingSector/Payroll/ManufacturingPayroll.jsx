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
    Download,
    CheckCircle,
    Clock,
    AlertCircle,
    Loader2,
    ArrowLeft,
    FileText
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

    useEffect(() => {
        fetchPayrolls();
    }, [selectedDate]);

    const fetchPayrolls = async () => {
        setLoading(true);
        try {
            const month = selectedDate.getMonth() + 1;
            const year = selectedDate.getFullYear();
            const res = await getMfgPayroll({ month, year });

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
            }
        } catch (error) {
            toast.error('Failed to load payroll data');
        } finally {
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
                fetchPayrolls();
            }
        } catch (error) {
            const msg = error.response?.data?.message || 'Generation failed';
            if (msg.includes('already exists')) {
                toast.error(msg); // Duplicate warning
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
                fetchPayrolls();
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
            fetchPayrolls();
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
        <div className="min-h-screen bg-[#f8fafc] p-[20px] sm:p-[40px] font-['Outfit'] pb-[100px]">
            <div className="max-w-[1280px] mx-auto w-full">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-[24px] mb-[40px]">
                    <div className="flex items-center gap-4">
                        <Link to="/manufacturing" className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-500 hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm hover:shadow-md active:scale-95 shrink-0">
                            <ChevronLeft className="w-6 h-6" />
                        </Link>
                        <div>
                            <h1 className="text-[32px] font-black text-slate-800 tracking-tight flex items-center gap-[12px]">
                                <Banknote className="w-[32px] h-[32px] text-rose-500" />
                                Payroll Management
                            </h1>
                            <p className="text-slate-500 font-medium mt-[4px]">Manage monthly wages and approvals</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-[16px]">
                        <ExportButtons
                            onExportCSV={handleExportCSV}
                            onExportPDF={handleExportPDF}
                            onExportTXT={handleExportTXT}
                        />

                        <div className="flex items-center gap-[16px] bg-white p-[8px] rounded-[16px] shadow-sm border border-slate-200">
                            <button onClick={() => changeMonth(-1)} className="p-[8px] hover:bg-slate-50 rounded-[12px] text-slate-600 transition-colors">
                                <ChevronLeft className="w-[20px] h-[20px]" />
                            </button>
                            <div className="flex items-center gap-[8px] px-[8px] min-w-[160px] justify-center text-slate-700 font-bold">
                                <Calendar className="w-[18px] h-[18px] text-rose-500" />
                                {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
                            </div>
                            <button onClick={() => changeMonth(1)} className="p-[8px] hover:bg-slate-50 rounded-[12px] text-slate-600 transition-colors">
                                <ChevronRight className="w-[20px] h-[20px]" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-[24px] mb-[40px]">
                    <div className="bg-white p-[24px] rounded-[24px] shadow-sm border border-slate-100 flex items-center gap-[20px]">
                        <div className="w-[56px] h-[56px] rounded-[16px] bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <Banknote className="w-[28px] h-[28px]" />
                        </div>
                        <div>
                            <p className="text-slate-400 text-[14px] font-semibold uppercase tracking-wider">Total Payout</p>
                            <p className="text-[28px] font-black text-emerald-600">₹{summary?.total_amount?.toLocaleString() || '0'}</p>
                        </div>
                    </div>

                    <div className="bg-white p-[24px] rounded-[24px] shadow-sm border border-slate-100 flex items-center gap-[20px]">
                        <div className="w-[56px] h-[56px] rounded-[16px] bg-blue-50 flex items-center justify-center text-blue-600">
                            <CheckCircle className="w-[28px] h-[28px]" />
                        </div>
                        <div>
                            <p className="text-slate-400 text-[14px] font-semibold uppercase tracking-wider">Approved</p>
                            <p className="text-[28px] font-black text-slate-800">{summary?.status_counts?.approved || 0} <span className="text-[14px] text-slate-400 font-medium">Members</span></p>
                        </div>
                    </div>

                    <div className="bg-white p-[24px] rounded-[24px] shadow-sm border border-slate-100 flex items-center gap-[20px]">
                        <div className="w-[56px] h-[56px] rounded-[16px] bg-amber-50 flex items-center justify-center text-amber-600">
                            <Clock className="w-[28px] h-[28px]" />
                        </div>
                        <div>
                            <p className="text-slate-400 text-[14px] font-semibold uppercase tracking-wider">Pending</p>
                            <p className="text-[28px] font-black text-slate-800">{summary?.status_counts?.pending || 0} <span className="text-[14px] text-slate-400 font-medium">Review Needed</span></p>
                        </div>
                    </div>
                </div>

                {/* Actions Bar */}
                <div className="flex flex-col sm:flex-row gap-[16px] justify-between items-center mb-[24px]">
                    <div className="relative w-full sm:w-[300px]">
                        <Search className="absolute left-[16px] top-1/2 -translate-y-1/2 w-[20px] h-[20px] text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search details..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-[48px] pr-[16px] py-[12px] bg-white rounded-[16px] border border-slate-200 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all placeholder:text-slate-400"
                        />
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={generating || payrolls.length > 0}
                        className={`px-[24px] py-[12px] rounded-[16px] font-bold text-white shadow-lg shadow-rose-500/30 transition-all flex items-center gap-[10px]
                            ${generating || payrolls.length > 0
                                ? 'bg-slate-300 shadow-none cursor-not-allowed text-slate-500'
                                : 'bg-rose-500 hover:bg-rose-600 hover:-translate-y-[2px] active:scale-95'
                            }`}
                    >
                        {generating ? <Loader2 className="w-[20px] h-[20px] animate-spin" /> : <Banknote className="w-[20px] h-[20px]" />}
                        {(Array.isArray(payrolls) && payrolls.length > 0) ? 'Payroll Generated' : 'Generate Payroll'}
                    </button>
                </div>

                {/* Table */}
                <div className="bg-white rounded-[24px] shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50">
                                    <th className="text-left py-[20px] px-[24px] text-[14px] font-bold text-slate-500 uppercase tracking-wider">Member</th>
                                    <th className="text-left py-[20px] px-[24px] text-[14px] font-bold text-slate-500 uppercase tracking-wider">Role</th>
                                    <th className="text-left py-[20px] px-[24px] text-[14px] font-bold text-slate-500 uppercase tracking-wider">Base Salary</th>
                                    <th className="text-left py-[20px] px-[24px] text-[14px] font-bold text-slate-500 uppercase tracking-wider">Net Amount</th>
                                    <th className="text-left py-[20px] px-[24px] text-[14px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="text-right py-[20px] px-[24px] text-[14px] font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="py-[60px] text-center text-slate-400 font-medium">
                                            <div className="flex justify-center mb-[12px]"><Loader2 className="w-[32px] h-[32px] animate-spin text-rose-500" /></div>
                                            Loading payroll records...
                                        </td>
                                    </tr>
                                ) : (Array.isArray(filteredPayrolls) && filteredPayrolls.length === 0) ? (
                                    <tr>
                                        <td colSpan="6" className="py-[60px] text-center text-slate-400 font-medium">
                                            {(Array.isArray(payrolls) && payrolls.length === 0) ? "No payroll generated for this month." : "No members found matching your search."}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredPayrolls.map((payroll) => (
                                        <tr key={payroll.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="py-[20px] px-[24px]">
                                                <div className="font-bold text-slate-800">{payroll.member_name || 'Unknown Member'}</div>
                                            </td>
                                            <td className="py-[20px] px-[24px]">
                                                <div className="text-slate-600 font-medium">{payroll.member_role}</div>
                                                <div className="text-[12px] text-slate-400 capitalize">{payroll.wage_type}</div>
                                            </td>
                                            <td className="py-[20px] px-[24px]">
                                                <div className="text-slate-600 font-medium">₹{payroll.base_amount?.toLocaleString()}</div>
                                            </td>
                                            <td className="py-[20px] px-[24px]">
                                                <div className="text-[18px] font-bold text-slate-800">₹{payroll.net_amount?.toLocaleString()}</div>
                                            </td>
                                            <td className="py-[20px] px-[24px]">
                                                <span className={`inline-flex items-center px-[12px] py-[6px] rounded-full text-[12px] font-bold capitalize
                                                    ${payroll.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                                        payroll.status === 'paid' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-amber-100 text-amber-700'}`}>
                                                    {payroll.status}
                                                </span>
                                            </td>
                                            <td className="py-[20px] px-[24px] text-right">
                                                <div className="flex items-center justify-end gap-[12px]">
                                                    {payroll.status === 'draft' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleDelete(payroll.id)}
                                                                className="text-slate-400 hover:text-rose-500 font-medium text-[14px] transition-colors"
                                                                title="Delete"
                                                            >
                                                                Delete
                                                            </button>
                                                            <button
                                                                onClick={() => handleApprove(payroll.id)}
                                                                className="px-[16px] py-[8px] bg-slate-900 hover:bg-slate-800 text-white rounded-[10px] font-bold text-[14px] transition-colors shadow-lg shadow-slate-900/20 active:scale-95"
                                                            >
                                                                Approve
                                                            </button>
                                                        </>
                                                    )}
                                                    {payroll.status === 'approved' && (
                                                        <span className="text-emerald-600 font-medium text-[14px] flex items-center gap-[6px]">
                                                            <CheckCircle className="w-[16px] h-[16px]" /> Approved
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
