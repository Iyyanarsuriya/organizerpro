import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { generateCSV, generateTXT, generatePDF } from '../exportUtils/base.js';
import { formatAmount } from '../formatUtils.js';

export const exportExpenseToCSV = (data, filename) => {
    // Add Summary at the top of CSV for better readability in Excel
    let summary = { income: 0, expense: 0 };
    data.forEach(t => {
        if (t.type === 'income') summary.income += parseFloat(t.amount);
        else summary.expense += parseFloat(t.amount);
    });

    const summaryRows = [
        ["FINANCIAL REPORT SUMMARY"],
        ["Total Income", summary.income],
        ["Total Expense", summary.expense],
        ["Net Balance", summary.income - summary.expense],
        [] // Empty row
    ];

    const headers = ["Date", "Description", "Amount", "Type", "Category", "Project", "Member", "Room", "Vendor"];
    const rows = [
        ...summaryRows,
        headers,
        ...data.map(t => [
            new Date(t.date).toLocaleDateString('en-GB'),
            t.title,
            t.amount,
            t.type.toUpperCase(),
            t.category || t.category_name || 'N/A',
            t.project_name || 'N/A',
            t.member_name || 'N/A',
            t.room_number ? `Room ${t.room_number}` : 'N/A',
            t.vendor_name || 'N/A'
        ])
    ];

    generateCSV("", rows, filename);
};

export const exportExpenseToTXT = ({ data, period, filename }) => {
    let summary = { income: 0, expense: 0 };
    data.forEach(t => {
        if (t.type === 'income') summary.income += parseFloat(t.amount);
        else summary.expense += parseFloat(t.amount);
    });

    const stats = [
        { label: 'Total Income', value: `Rs. ${formatAmount(summary.income)}` },
        { label: 'Total Expense', value: `Rs. ${formatAmount(summary.expense)}` },
        { label: 'Net Balance', value: `Rs. ${formatAmount(summary.income - summary.expense)}` }
    ];

    const logHeaders = ["Date", "Description", "Amount", "Type", "Category", "Member"];
    const logRows = data.map(t => [
        new Date(t.date).toLocaleDateString('en-GB'),
        t.title,
        `Rs. ${formatAmount(t.amount)}`,
        t.type.toUpperCase(),
        t.category || t.category_name || 'N/A',
        t.member_name || '-'
    ]);

    generateTXT({ title: 'Financial Report', period, stats, logHeaders, logRows, filename });
};

export const exportExpenseToPDF = ({ data, period, subHeader, filename }) => {
    let summary = { income: 0, expense: 0 };
    data.forEach(t => {
        if (t.type === 'income') summary.income += parseFloat(t.amount);
        else summary.expense += parseFloat(t.amount);
    });

    const stats = [
        { label: 'Total Income', value: `Rs. ${formatAmount(summary.income)}` },
        { label: 'Total Expense', value: `Rs. ${formatAmount(summary.expense)}` },
        { label: 'Net Profit/Loss', value: `Rs. ${formatAmount(summary.income - summary.expense)}` },
        { label: 'Total Records', value: data.length.toString() }
    ];

    const tableHeaders = ['Date', 'Description', 'Category', 'Type', 'Project', 'Member', 'Amount'];
    const tableRows = data.map(t => [
        new Date(t.date).toLocaleDateString('en-GB'),
        t.title,
        t.category || t.category_name || 'N/A',
        t.type.toUpperCase(),
        t.project_name || '-',
        t.member_name || '-',
        `Rs. ${formatAmount(t.amount)}`
    ]);

    generatePDF({ title: 'Financial Report', period, subHeader, stats, tableHeaders, tableRows, filename, themeColor: [45, 91, 255] });
};

export const exportMemberPayslipToPDF = ({
    member,
    transactions,
    attendanceStats,
    period,
    filename,
    calculatedSalary = 0,
    bonus = 0
}) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Color Palette
    const primaryColor = [45, 91, 255]; // Blue
    const secondaryColor = [241, 245, 249]; // Slate 50
    const accentColor = [16, 185, 129]; // Emerald 500

    // Header - Business Identity
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, pageWidth, 50, 'F');

    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYSLIP', 20, 30);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(255, 255, 255, 0.8);
    doc.text(`Period: ${period}`, 20, 40);

    const now = new Date().toLocaleDateString('en-GB');
    doc.text(`Generated on: ${now}`, pageWidth - 20, 40, { align: 'right' });

    // Section 1: Employee Details
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('EMPLOYEE DETAILS', 20, 65);
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(1);
    doc.line(20, 68, 40, 68);

    autoTable(doc, {
        startY: 75,
        body: [
            ['Name', member.name, 'Employee ID', `#${member.id}`],
            ['Role', member.role || 'N/A', 'Member Type', member.member_type?.toUpperCase() || 'N/A'],
            ['Phone', member.phone || '-', 'Email', member.email || '-'],
            ['Wage Type', member.wage_type?.toUpperCase() || 'Daily', 'Base Rate', `Rs. ${formatAmount(member.daily_wage || 0)}`]
        ],
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
            0: { fontStyle: 'bold', textColor: [100, 100, 100], cellWidth: 30 },
            1: { cellWidth: 60 },
            2: { fontStyle: 'bold', textColor: [100, 100, 100], cellWidth: 30 },
            3: { cellWidth: 60 }
        }
    });

    let currentY = doc.lastAutoTable.finalY + 15;

    // Section 2: Attendance Summary (If available)
    if (attendanceStats && attendanceStats.summary) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('ATTENDANCE SUMMARY', 20, currentY);
        doc.line(20, currentY + 3, 40, currentY + 3);

        const s = attendanceStats.summary;
        autoTable(doc, {
            startY: currentY + 8,
            head: [['Present', 'Absent', 'Half Day', 'Late', 'Permission']],
            body: [[s.present, s.absent, s.half_day, s.late, s.permission || 0]],
            theme: 'grid',
            headStyles: { fillColor: secondaryColor, textColor: [100, 100, 100], halign: 'center' },
            bodyStyles: { halign: 'center', fontSize: 11, fontStyle: 'bold' }
        });
        currentY = doc.lastAutoTable.finalY + 15;
    }

    // Section 3: Earnings & Deductions Breakdown
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('FINANCIAL BREAKDOWN', 20, currentY);
    doc.line(20, currentY + 3, 40, currentY + 3);

    let earned = transactions.filter(t => t.category === 'Salary Pot').reduce((acc, t) => acc + parseFloat(t.amount || 0), 0);
    // Fallback to calculated salary if no ledger entry exists
    if (earned === 0 && calculatedSalary > 0) {
        earned = calculatedSalary;
    }

    const advance = transactions.filter(t => t.category === 'Advance').reduce((acc, t) => acc + parseFloat(t.amount || 0), 0);
    const paid = transactions.filter(t => t.category === 'Salary').reduce((acc, t) => acc + parseFloat(t.amount || 0), 0);
    const totalEarnings = earned + parseFloat(bonus || 0);

    const breakdownBody = [
        [`Rs. ${formatAmount(earned)}`, `Rs. ${formatAmount(advance)}`, `Rs. ${formatAmount(paid)}`]
    ];

    if (bonus > 0) {
        // If bonus exists, we might want to show it. For simplicity in this grid, let's keep it simple or add a note.
        // Actually, let's modify the headers to include Bonus or just sum it up.
        // Let's add it to Earnings for display in column 1 but maybe denote it?
        // Or better: Just use Total Earnings including bonus.
        breakdownBody[0][0] = `Rs. ${formatAmount(totalEarnings)} ${bonus > 0 ? '(Inc. Bonus)' : ''}`;
    }

    autoTable(doc, {
        startY: currentY + 8,
        head: [['Total Earnings', 'Advances Taken', 'Salary Paid']],
        body: breakdownBody,
        theme: 'grid',
        headStyles: { fillColor: secondaryColor, textColor: [100, 100, 100], halign: 'center' },
        bodyStyles: { halign: 'center', fontSize: 11 },
        columnStyles: {
            0: { textColor: accentColor },
            1: { textColor: [239, 68, 68] }, // Rose 500
            2: { textColor: primaryColor }
        }
    });

    currentY = doc.lastAutoTable.finalY + 10;

    // Net Settlement Box
    const net = totalEarnings - (advance + paid);
    doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.roundedRect(120, currentY, 70, 25, 3, 3, 'F');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('NET SETTLEMENT DUE', 125, currentY + 8);
    doc.setFontSize(16);
    doc.setTextColor(net >= 0 ? primaryColor[0] : 239, net >= 0 ? primaryColor[1] : 68, net >= 0 ? primaryColor[2] : 68);
    doc.setFont('helvetica', 'bold');
    doc.text(`Rs. ${formatAmount(net)}`, 125, currentY + 20);

    currentY += 35;

    // Section 4: Transaction Logs
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text('DETAILED TRANSACTION LOGS', 20, currentY);
    doc.line(20, currentY + 3, 40, currentY + 3);

    const tableHeaders = ['Date', 'Description', 'Category', 'Status', 'Amount'];
    const tableRows = transactions.map(t => [
        new Date(t.date).toLocaleDateString('en-GB'),
        t.title,
        t.category,
        t.payment_status?.toUpperCase() || 'COMPLETED',
        `Rs. ${formatAmount(t.amount)}`
    ]);

    autoTable(doc, {
        startY: currentY + 8,
        head: [tableHeaders],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: primaryColor, fontSize: 9 },
        bodyStyles: { fontSize: 8 }
    });

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 20;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('This is a computer generated document. No signature required.', pageWidth / 2, footerY, { align: 'center' });
    doc.text('ORGANIZER PRO - Financial Management System', pageWidth / 2, footerY + 5, { align: 'center' });

    doc.save(`${filename}.pdf`);
};
