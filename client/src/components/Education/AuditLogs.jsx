import React, { useState, useEffect } from 'react';
import { getAuditLogs } from '../../api/Education/eduAudit';
import { FaHistory, FaUser, FaClock, FaTag, FaInfoCircle } from 'react-icons/fa';
import { formatDateTime } from '../../utils/formatUtils';
import toast from 'react-hot-toast';

const EducationAuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterModule, setFilterModule] = useState('');

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await getAuditLogs({ module: filterModule });
            setLogs(res.data.data);
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch audit logs", error);
            // toast.error("Failed to load audit trail"); // Suppress to avoid annoyance on load if empty
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [filterModule]);

    const moduleColors = {
        'attendance': 'bg-blue-100 text-blue-700',
        'finance': 'bg-emerald-100 text-emerald-700',
        'payroll': 'bg-purple-100 text-purple-700',
        'member': 'bg-amber-100 text-amber-700',
        'vendor': 'bg-rose-100 text-rose-700',
        'default': 'bg-slate-100 text-slate-700'
    };

    if (loading && logs.length === 0) return <div className="p-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">Loading audit trail...</div>;

    return (
        <div className="animate-in slide-in-from-right-10 duration-500 pb-20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <FaHistory className="text-slate-400" /> Audit Log
                    </h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Track system activities & changes</p>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase mr-2">Filter By:</span>
                    <select
                        value={filterModule}
                        onChange={(e) => setFilterModule(e.target.value)}
                        className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:border-blue-500 transition-all uppercase"
                    >
                        <option value="">All Modules</option>
                        <option value="attendance">Attendance</option>
                        <option value="finance">Finance</option>
                        <option value="payroll">Payroll</option>
                        <option value="member">Staff Managment</option>
                        <option value="vendor">Vendors</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                                <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">User</th>
                                <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                                <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {logs.length > 0 ? (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <FaClock className="text-slate-300" size={12} />
                                                <span className="text-xs font-bold text-slate-600 font-mono">
                                                    {formatDateTime(log.timestamp)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500">
                                                    <FaUser size={8} />
                                                </div>
                                                <span className="text-xs font-bold text-slate-700">{log.performed_by_name || 'System'}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${moduleColors[log.module] || moduleColors['default']}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-start gap-2">
                                                <FaInfoCircle className="text-slate-300 mt-0.5" size={12} />
                                                <p className="text-xs font-medium text-slate-600 max-w-md leading-relaxed">{log.details}</p>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="py-12 text-center">
                                        <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-3 text-xl">
                                            <FaTag />
                                        </div>
                                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No detailed logs found</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default EducationAuditLogs;
