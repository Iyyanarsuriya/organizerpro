import React, { useState } from 'react';
import { FaDownload, FaFilePdf, FaFileCsv, FaHotel, FaBed, FaWallet, FaChartBar, FaUserTie } from 'react-icons/fa';
import { formatAmount } from '../../../utils/formatUtils';
import { exportToCSV, exportToPDF } from '../../../utils/exportUtils';

const ReportCard = ({ title, icon: Icon, description, onClick, primaryActionLabel = "Export Report" }) => (
    <div className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between min-h-[280px]">
        <div>
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-800 mb-6 group-hover:bg-slate-900 group-hover:text-white transition-all duration-500">
                <Icon size={24} />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-3">{title}</h3>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-loose">{description}</p>
        </div>
        <div className="mt-8 flex gap-3">
            <button
                onClick={() => onClick('pdf')}
                className="flex-1 h-12 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-black/5"
            >
                <FaFilePdf size={12} /> PDF
            </button>
            <button
                onClick={() => onClick('csv')}
                className="flex-1 h-12 bg-white border border-slate-100 text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
            >
                <FaFileCsv size={12} /> CSV
            </button>
        </div>
    </div>
);

const HotelReports = ({ transactions, categories, stats, units }) => {
    const handleExport = (reportType, format) => {
        let exportData = [];
        let filename = `Hotel_${reportType}_${new Date().toISOString().slice(0, 10)}`;

        switch (reportType) {
            case 'Profit_Loss':
                exportData = transactions.map(t => ({
                    Date: new Date(t.date).toLocaleDateString(),
                    Title: t.title,
                    Type: t.type.toUpperCase(),
                    Category: t.category_name || t.category,
                    Amount: t.amount,
                    Mode: t.payment_mode
                }));
                break;
            case 'Revenue_By_Room':
                // Group by room
                const roomRevenue = {};
                transactions.filter(t => t.type === 'income' && t.unit_id).forEach(t => {
                    const key = t.room_number ? `Room ${t.room_number}` : 'Unknown';
                    roomRevenue[key] = (roomRevenue[key] || 0) + parseFloat(t.amount);
                });
                exportData = Object.keys(roomRevenue).map(room => ({ Room: room, Revenue: roomRevenue[room] }));
                break;
            case 'Expense_By_Category':
                const catExpenses = {};
                transactions.filter(t => t.type === 'expense').forEach(t => {
                    const key = t.category_name || t.category;
                    catExpenses[key] = (catExpenses[key] || 0) + parseFloat(t.amount);
                });
                exportData = Object.keys(catExpenses).map(cat => ({ Category: cat, TotalExpense: catExpenses[cat] }));
                break;
            case 'Salary_Summary':
                const salaryExpenses = transactions.filter(t => t.category === 'Staff Salary' || t.category_name === 'Staff Salary');
                exportData = salaryExpenses.map(t => ({
                    Date: new Date(t.date).toLocaleDateString(),
                    Member: t.member_name || 'Generic',
                    Amount: t.amount,
                    Status: t.payment_status
                }));
                break;
            default:
                exportData = transactions;
        }

        if (format === 'csv') exportToCSV(exportData, filename);
        else exportToPDF(exportData, filename, reportType.replace(/_/g, ' '));
    };

    return (
        <div className="animate-in fade-in duration-500 space-y-10">
            {/* Header Summary for Reports */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Net Flow</p>
                    <p className={`text-xl font-black ${(stats.summary?.total_income - stats.summary?.total_expense) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        ₹{formatAmount(stats.summary?.total_income - stats.summary?.total_expense)}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Total Rooms</p>
                    <p className="text-xl font-black text-slate-900">{units.length} Units</p>
                </div>
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Active Guests</p>
                    <p className="text-xl font-black text-slate-900">
                        {transactions.filter(t => t.type === 'income' && t.date.startsWith(new Date().toISOString().slice(0, 7))).length} Arrivals
                    </p>
                </div>
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Unpaid Bookings</p>
                    <p className="text-xl font-black text-amber-500">
                        {transactions.filter(t => t.payment_status === 'pending').length} Records
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <ReportCard
                    title="Profit & Loss Statement"
                    icon={FaWallet}
                    description="Comprehensive breakdown of hospitality revenue vs operational expenses."
                    onClick={(format) => handleExport('Profit_Loss', format)}
                />
                <ReportCard
                    title="Revenue by Room"
                    icon={FaBed}
                    description="Performance analysis per room unit. Identify your most profitable assets."
                    onClick={(format) => handleExport('Revenue_By_Room', format)}
                />
                <ReportCard
                    title="Expense by Category"
                    icon={FaChartBar}
                    description="Monitor where your money is going: Utilities, Maintenance, Food, or Marketing."
                    onClick={(format) => handleExport('Expense_By_Category', format)}
                />
                <ReportCard
                    title="Monthly Operation Report"
                    icon={FaHotel}
                    description="Summarized hospitality data for tax filings and monthly reviews."
                    onClick={(format) => handleExport('Monthly_Report', format)}
                />
                <ReportCard
                    title="Salary & Wages Summary"
                    icon={FaUserTie}
                    description="Track staff payroll history linked with hospitality operations."
                    onClick={(format) => handleExport('Salary_Summary', format)}
                />
            </div>
        </div>
    );
};

export default HotelReports;
