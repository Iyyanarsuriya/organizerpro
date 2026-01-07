import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatAmount } from './formatUtils';

/**
 * BASE GENERATORS (Internal)
 */

const generateCSV = (headers, rows, filename) => {
    const escapedRows = rows.map(row =>
        row.map(val => {
            if (val === null || val === undefined) return '';
            const str = String(val);
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        })
    );

    const csvContent = [headers, ...escapedRows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    link.click();
    URL.revokeObjectURL(url);
};

const generateTXT = ({ title, period, stats, logHeaders, logRows, filename }) => {
    let txt = `==================================================\n`;
    txt += `   ${title.toUpperCase()}\n`;
    txt += `==================================================\n\n`;

    const now = new Date();
    const nowFormatted = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${now.getHours() % 12 || 12}:${String(now.getMinutes()).padStart(2, '0')} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;

    txt += `Period       : ${period}\n`;
    txt += `Generated at : ${nowFormatted}\n`;
    txt += `--------------------------------------------------\n\n`;

    if (stats && stats.length > 0) {
        txt += `SUMMARY\n`;
        txt += `--------------------------------------------------\n`;
        stats.forEach(s => {
            const label = s.label.padEnd(20, ' ');
            txt += `${label}: ${s.value}\n`;
        });
        txt += `\n`;
    }

    txt += `DETAILED LOGS\n`;
    txt += `--------------------------------------------------\n`;

    const colWidths = logHeaders.map((h, i) => {
        let max = h.length;
        logRows.forEach(row => {
            if (row[i] && String(row[i]).length > max) max = String(row[i]).length;
        });
        return max + 2;
    });

    txt += logHeaders.map((h, i) => h.padEnd(colWidths[i], ' ')).join(' | ') + '\n';
    txt += colWidths.map(w => '-'.repeat(w)).join('-+-') + '\n';

    logRows.forEach(row => {
        txt += row.map((val, i) => String(val || '').padEnd(colWidths[i], ' ')).join(' | ') + '\n';
    });

    txt += `\n--------------------------------------------------\n`;
    txt += `End of Report\n`;

    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.txt`);
    link.click();
    URL.revokeObjectURL(url);
};

const generatePDF = ({ title, period, subHeader, stats, tableHeaders, tableRows, filename, themeColor = [45, 91, 255] }) => {
    const doc = new jsPDF('landscape'); // Landscape for better column visibility
    const pageWidth = doc.internal.pageSize.getWidth();

    // Blue Header Bar
    doc.setFillColor(themeColor[0], themeColor[1], themeColor[2]);
    doc.rect(0, 0, pageWidth, 40, 'F');

    // Title
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 15, 20);

    // Subheader/Period
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255, 0.8);
    doc.setFont('helvetica', 'normal');
    const now = new Date();
    const nowFormatted = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${now.getHours() % 12 || 12}:${String(now.getMinutes()).padStart(2, '0')} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;
    doc.text(`Period: ${period}  |  Generated on: ${nowFormatted}`, 15, 30);

    // Reset Text Color
    doc.setTextColor(40, 40, 40);

    if (subHeader) {
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(subHeader, 15, 48);
    }

    let startY = subHeader ? 55 : 48;
    if (stats && stats.length > 0) {
        const itemsPerRow = 4;
        const rowHeight = 10;
        const totalRows = Math.ceil(stats.length / itemsPerRow);
        const boxHeight = 10 + (totalRows * rowHeight);

        doc.setDrawColor(240);
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(15, startY, pageWidth - 30, boxHeight, 3, 3, 'F');

        doc.setFontSize(10);
        doc.setTextColor(themeColor[0], themeColor[1], themeColor[2]);

        stats.forEach((s, i) => {
            const col = i % itemsPerRow;
            const row = Math.floor(i / itemsPerRow);
            const x = 25 + (col * (pageWidth - 60) / itemsPerRow);
            const y = startY + 12 + (row * rowHeight);

            doc.setFont('helvetica', 'bold');
            doc.text(`${s.label}:`, x, y);

            const labelWidth = doc.getTextWidth(`${s.label}: `);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(60, 60, 60);
            doc.text(`${s.value}`, x + labelWidth, y);
            doc.setTextColor(themeColor[0], themeColor[1], themeColor[2]);
        });

        startY = startY + boxHeight + 10;
    }

    // Alignment logic - Centering everything as requested
    let columnStyles = {};
    if (title.toLowerCase().includes('attendance')) {
        columnStyles = {
            0: { halign: 'center', valign: 'middle', cellWidth: 25 },
            1: { halign: 'center', valign: 'middle' },
            2: { halign: 'center', valign: 'middle', cellWidth: 30 },
            3: { halign: 'center', valign: 'middle', cellWidth: 35 },
            4: { halign: 'center', valign: 'middle' },
            5: { halign: 'center', valign: 'middle' },
            6: { halign: 'center', valign: 'middle' }
        };
    } else {
        columnStyles = {
            0: { halign: 'center', valign: 'middle', cellWidth: 25 },
            1: { halign: 'center', valign: 'middle' },
            2: { halign: 'center', valign: 'middle', cellWidth: 30 },
            3: { halign: 'center', valign: 'middle', cellWidth: 20 },
            4: { halign: 'center', valign: 'middle' },
            5: { halign: 'center', valign: 'middle', cellWidth: 30 }
        };
    }

    autoTable(doc, {
        startY: startY,
        head: [tableHeaders],
        body: tableRows,
        theme: 'striped',
        headStyles: {
            fillColor: themeColor,
            fontSize: 9,
            fontStyle: 'bold',
            halign: 'center',
            valign: 'middle'
        },
        bodyStyles: {
            fontSize: 8,
            textColor: 60,
            halign: 'center',
            valign: 'middle',
            cellPadding: 4
        },
        columnStyles: columnStyles,
        styles: { overflow: 'linebreak' },
        margin: { left: 15, right: 15 },
        didDrawPage: (data) => {
            const str = 'Page ' + doc.internal.getNumberOfPages();
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(str, pageWidth - 25, doc.internal.pageSize.getHeight() - 10);
            doc.text(`organizerpro`, 15, doc.internal.pageSize.getHeight() - 10);
        }
    });

    doc.save(`${filename}.pdf`);
};

/**
 * UTILS
 */

const calculateAttendanceStats = (data) => {
    let summaryMap = {};
    let totalMinutes = 0;

    data.forEach(a => {
        summaryMap[a.status] = (summaryMap[a.status] || 0) + 1;
        if (a.status === 'permission' && a.permission_duration) {
            // Check if it's formatted as "HH:MM AM - HH:MM PM" or similar
            // If it's just "HH:MM", we sum it. 
            // Based on AttendanceTracker.jsx: "09:00 AM - 10:00 AM"
            const match = a.permission_duration.match(/(\d+):(\d+)\s*(AM|PM)\s*-\s*(\d+):(\d+)\s*(AM|PM)/i);
            if (match) {
                const h1 = parseInt(match[1]);
                const m1 = parseInt(match[2]);
                const p1 = match[3].toUpperCase();
                const h2 = parseInt(match[4]);
                const m2 = parseInt(match[5]);
                const p2 = match[6].toUpperCase();

                let mins1 = (h1 % 12) * 60 + m1;
                if (p1 === 'PM') mins1 += 12 * 60;
                let mins2 = (h2 % 12) * 60 + m2;
                if (p2 === 'PM') mins2 += 12 * 60;

                let diff = mins2 - mins1;
                if (diff < 0) diff += 24 * 60; // Over midnight
                totalMinutes += diff;
            }
        }
    });

    const formatDuration = (totalMins) => {
        const hrs = Math.floor(totalMins / 60);
        const mins = totalMins % 60;
        let str = "";
        if (hrs > 0) str += `${hrs}hrs`;
        if (mins > 0) str += hrs > 0 ? ` ${mins}mins` : `${mins}mins`;
        return str || "0hrs";
    };

    return Object.keys(summaryMap).map(status => ({
        label: status.toUpperCase(),
        value: status === 'permission' ? formatDuration(totalMinutes) : summaryMap[status]
    }));
};

/**
 * ATTENDANCE TRACKER EXPORTS
 */

export const exportAttendanceToCSV = (data, filename) => {
    const headers = ["Date", "Member", "Status", "Duration", "Subject", "Project", "Note", "Permission Details"];
    const rows = data.map(a => [
        new Date(a.date).toLocaleDateString('en-GB'),
        a.member_name || 'N/A',
        a.status.toUpperCase(),
        a.status === 'permission' ? (a.permission_duration || 'N/A') : '-',
        a.subject,
        a.project_name || 'N/A',
        a.note || '',
        a.status === 'permission' ? `${a.permission_start_time || ''} - ${a.permission_end_time || ''} (${a.permission_reason || ''})` : '-'
    ]);
    generateCSV(headers, rows, filename);
};

export const exportAttendanceToTXT = ({ data, period, filename }) => {
    const stats = calculateAttendanceStats(data);

    const logHeaders = ["Date", "Member", "Status", "Duration", "Subject", "Project"];
    const logRows = data.map(a => [
        new Date(a.date).toLocaleDateString('en-GB'),
        a.member_name || 'N/A',
        a.status.toUpperCase(),
        a.status === 'permission' ? (a.permission_duration || 'N/A') : '-',
        a.subject,
        a.project_name || 'N/A'
    ]);

    generateTXT({ title: 'Attendance Report', period, stats, logHeaders, logRows, filename });
};

export const exportAttendanceToPDF = ({ data, period, subHeader, filename }) => {
    const stats = calculateAttendanceStats(data);

    const tableHeaders = ['Date', 'Member', 'Status', 'Duration', 'Subject', 'Project', 'Note'];
    const tableRows = data.map(a => [
        new Date(a.date).toLocaleDateString('en-GB'),
        a.member_name || 'N/A',
        a.status.toUpperCase(),
        a.status === 'permission' ? (a.permission_duration || 'N/A') : '-',
        a.subject,
        a.project_name || 'N/A',
        a.note || ''
    ]);

    generatePDF({ title: 'Attendance Report', period, subHeader, stats, tableHeaders, tableRows, filename, themeColor: [37, 99, 235] });
};

/**
 * EXPENSE TRACKER EXPORTS
 */

export const exportExpenseToCSV = (data, filename) => {
    const headers = ["Date", "Description", "Amount", "Type", "Category", "Project", "Member"];
    const rows = data.map(t => [
        new Date(t.date).toLocaleDateString('en-GB'),
        t.title,
        t.amount,
        t.type.toUpperCase(),
        t.category,
        t.project_name || 'N/A',
        t.member_name || 'N/A'
    ]);
    generateCSV(headers, rows, filename);
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

    const logHeaders = ["Date", "Description", "Amount", "Type", "Category"];
    const logRows = data.map(t => [
        new Date(t.date).toLocaleDateString('en-GB'),
        t.title,
        `Rs. ${formatAmount(t.amount)}`,
        t.type.toUpperCase(),
        t.category
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
        { label: 'Net Profit/Loss', value: `Rs. ${formatAmount(summary.income - summary.expense)}` }
    ];

    const tableHeaders = ['Date', 'Description', 'Category', 'Type', 'Project', 'Amount'];
    const tableRows = data.map(t => [
        new Date(t.date).toLocaleDateString('en-GB'),
        t.title,
        t.category,
        t.type.toUpperCase(),
        t.project_name || 'N/A',
        `Rs. ${formatAmount(t.amount)}`
    ]);

    generatePDF({ title: 'Financial Report', period, subHeader, stats, tableHeaders, tableRows, filename, themeColor: [45, 91, 255] });
};

// Legacy support (Old names pointing to new generic generators if needed, but better to use specific ones)
export const exportToCSV = generateCSV;
export const exportToTXT = generateTXT;
export const exportToPDF = generatePDF;
