import React, { useState, useEffect } from 'react';
import { FaSync, FaCheckCircle, FaMoneyBillWave, FaLock, FaCalendarAlt, FaUserTie, FaExclamationTriangle } from 'react-icons/fa';
import { getPayrolls, generatePayroll, approvePayroll, payPayroll } from '../../api/Expense/eduPayroll';
import { getMembers } from '../../api/TeamManagement/eduTeam';
import { formatAmount } from '../../utils/formatUtils';
import toast from 'react-hot-toast';

const EducationPayrollManager = () => {
    const [payrolls, setPayrolls] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [generating, setGenerating] = useState(false);

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [payrollRes, membersRes] = await Promise.all([
                getPayrolls({ month, year }),
                getMembers({ sector: 'education' })
            ]);
            setPayrolls(payrollRes.data.data);
            setMembers(membersRes.data.data);
            setLoading(false);
        } catch (error) {
            toast.error("Failed to fetch payroll data");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [month, year]);

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            await generatePayroll({ month, year });
            toast.success("Payroll generated successfully");
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Generation failed");
        } finally {
            setGenerating(false);
        }
    };

    const handleApprove = async (id) => {
        try {
            await approvePayroll(id);
            toast.success("Payroll approved");
            fetchData();
        } catch (error) {
            toast.error("Approval failed");
        }
    };

    const handlePay = async (payroll) => {
        const paymentMode = window.prompt("Enter payment mode (Cash/Bank Transfer/UPI):", "Bank Transfer");
        if (!paymentMode) return;

        try {
            await payPayroll(payroll.id, { payment_mode: paymentMode });
            toast.success("Payment recorded");
            fetchData();
        } catch (error) {
            toast.error("Payment failed");
        }
    };

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    if (loading && payrolls.length === 0) return <div className="p-8 text-center">Loading payroll...</div>;

    return (
        <div className="animate-in slide-in-from-right-10 duration-500 pb-20">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
                <div>
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white px-6 py-2 bg-slate-900 rounded-2xl shadow-xl inline-block -rotate-1">Monthly Payroll</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 ml-1">Attendance-driven accurate salary disbursement</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
                        <select value={month} onChange={e => setMonth(parseInt(e.target.value))} className="bg-transparent text-xs font-black uppercase px-4 py-2 outline-none cursor-pointer">
                            {months.map((m, idx) => <option key={m} value={idx + 1}>{m}</option>)}
                        </select>
                        <div className="w-px h-6 bg-slate-200 my-auto"></div>
                        <input type="number" value={year} onChange={e => setYear(parseInt(e.target.value))} className="bg-transparent text-xs font-black w-20 px-4 py-2 outline-none text-center" />
                    </div>

                    {currentUser.role === 'owner' && (
                        <button
                            onClick={handleGenerate}
                            disabled={generating}
                            className="bg-slate-900 hover:bg-slate-800 text-white py-3 px-6 rounded-2xl shadow-lg flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                        >
                            <FaSync className={`${generating ? 'animate-spin' : ''}`} />
                            <span className="text-xs font-black uppercase tracking-widest">{generating ? 'Generating...' : 'Regenerate'}</span>
                        </button>
                    )}
                </div>
            </div>

            {payrolls.length === 0 ? (
                <div className="bg-white rounded-[40px] p-12 text-center border border-slate-100 shadow-sm">
                    <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
                        <FaMoneyBillWave />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 mb-2">No Payroll Data</h3>
                    <p className="text-slate-400 text-sm max-w-sm mx-auto mb-8">No payroll records found for the selected month and year. Click Generate to process attendance and calculate salaries.</p>
                    {currentUser.role === 'owner' && (
                        <button onClick={handleGenerate} disabled={generating} className="bg-blue-600 text-white font-black py-4 px-10 rounded-2xl shadow-xl shadow-blue-500/20 hover:scale-105 transition-all">Generate Payroll</button>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="py-6 px-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Staff Member</th>
                                    <th className="py-6 px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Attendance (P/A/H)</th>
                                    <th className="py-6 px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Leaves (CL/SL/EL)</th>
                                    <th className="py-6 px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Base Salary</th>
                                    <th className="py-6 px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Net Payable</th>
                                    <th className="py-6 px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Status</th>
                                    <th className="py-6 px-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {payrolls.map(p => {
                                    const member = members.find(m => m.id === p.member_id);
                                    return (
                                        <tr key={p.id} className="group hover:bg-slate-50/30 transition-colors">
                                            <td className="py-5 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-500 text-xs shadow-xs border border-white">
                                                        {member?.name?.charAt(0) || 'U'}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-900 text-sm tracking-tight">{member?.name || 'Unknown'}</p>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase">{member?.role || 'Staff'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-5 px-4 text-center">
                                                <div className="flex items-center justify-center gap-1.5 font-black text-[11px]">
                                                    <span className="text-emerald-500">{parseFloat(p.present_days)}</span>
                                                    <span className="text-slate-200">/</span>
                                                    <span className="text-rose-500">{parseFloat(p.absent_days)}</span>
                                                    <span className="text-slate-200">/</span>
                                                    <span className="text-blue-500">{p.half_days}</span>
                                                </div>
                                            </td>
                                            <td className="py-5 px-4 text-center">
                                                <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 bg-cyan-50 text-cyan-600 rounded-lg font-black text-[10px]">
                                                    {parseFloat(p.cl_used)} CL <span className="opacity-30">|</span> {parseFloat(p.sl_used)} SL <span className="opacity-30">|</span> {parseFloat(p.el_used)} EL
                                                </div>
                                            </td>
                                            <td className="py-5 px-4 text-right">
                                                <p className="font-bold text-slate-400 text-[10px]">₹{formatAmount(p.base_salary)}</p>
                                            </td>
                                            <td className="py-5 px-4 text-right">
                                                <div className="flex flex-col items-end">
                                                    <p className="font-black text-slate-900 text-sm tracking-tight">₹{formatAmount(p.net_salary)}</p>
                                                    {p.bonus > 0 && <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">+₹{formatAmount(p.bonus)} Bonus</span>}
                                                    {p.deductions > 0 && <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest">-₹{formatAmount(p.deductions)} Deductions</span>}
                                                </div>
                                            </td>
                                            <td className="py-5 px-4 text-center">
                                                <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${p.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                    p.status === 'approved' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                        p.status === 'pending_approval' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                            'bg-slate-50 text-slate-400 border-slate-100'
                                                    }`}>
                                                    {p.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="py-5 px-6 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    {currentUser.role === 'owner' && p.status === 'pending_approval' && (
                                                        <button onClick={() => handleApprove(p.id)} className="w-8 h-8 flex items-center justify-center bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm" title="Approve"><FaCheckCircle /></button>
                                                    )}
                                                    {currentUser.role === 'owner' && p.status === 'approved' && (
                                                        <button onClick={() => handlePay(p)} className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20" title="Pay Now">Make Payment</button>
                                                    )}
                                                    {p.status === 'paid' && (
                                                        <span className="text-slate-300"><FaLock /></span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="mt-8 bg-amber-50 border border-amber-100 p-6 rounded-[32px] flex items-start gap-4 shadow-sm">
                <FaExclamationTriangle className="text-amber-500 mt-1 shrink-0" />
                <div>
                    <h4 className="text-amber-800 font-black text-xs uppercase tracking-widest mb-1">Important Note</h4>
                    <p className="text-amber-700/70 text-[11px] font-bold leading-relaxed">Payroll generation requires attendance to be finalized for the entire month. Once a payroll is marked as "Paid", it becomes immutable and creates a corresponding expense transaction automatically. Ensure bonuses and deductions are finalized before approval.</p>
                </div>
            </div>
        </div>
    );
};

export default EducationPayrollManager;
