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

const generateTXT = ({ title, period, stats, additionalContent, logHeaders, logRows, filename }) => {
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

    if (additionalContent) {
        txt += additionalContent + "\n";
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
            0: { halign: 'center', valign: 'middle', cellWidth: 22 },
            1: { halign: 'center', valign: 'middle' },
            2: { halign: 'center', valign: 'middle', cellWidth: 15 },
            3: { halign: 'center', valign: 'middle', cellWidth: 25 },
            4: { halign: 'center', valign: 'middle', cellWidth: 25 },
            5: { halign: 'center', valign: 'middle' },
            6: { halign: 'center', valign: 'middle' },
            7: { halign: 'center', valign: 'middle' }
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

const calculateAttendanceSummary = (data) => {
    const memberSummary = {};
    let globalMinutes = 0;
    let globalStatusMap = {};

    data.forEach(a => {
        const mId = a.member_id || 'unknown';
        const mName = a.member_name || 'Unknown Member';

        if (!memberSummary[mId]) {
            memberSummary[mId] = {
                name: mName,
                present: 0,
                absent: 0,
                late: 0,
                halfDay: 0,
                permission: 0,
                minutes: 0,
                total: 0
            };
        }

        memberSummary[mId].total++;
        globalStatusMap[a.status] = (globalStatusMap[a.status] || 0) + 1;

        if (['present', 'late', 'permission', 'half-day'].includes(a.status)) {
            memberSummary[mId].present++;
        } else if (a.status === 'absent') {
            memberSummary[mId].absent++;
        }

        if (a.status === 'late') memberSummary[mId].late++;
        if (a.status === 'half-day') memberSummary[mId].halfDay++;
        if (a.status === 'permission') memberSummary[mId].permission++;

        if (a.status === 'permission' && a.permission_duration) {
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
                if (diff < 0) diff += 24 * 60;
                memberSummary[mId].minutes += diff;
                globalMinutes += diff;
            }
        }
    });

    const formatMins = (totalMins) => {
        const hrs = Math.floor(totalMins / 60);
        const mins = totalMins % 60;
        let str = "";
        if (hrs > 0) str += `${hrs}hrs`;
        if (mins > 0) str += hrs > 0 ? ` ${mins}mins` : `${mins}mins`;
        return str || "0hrs";
    };

    const globalStats = Object.keys(globalStatusMap).map(status => ({
        label: status.toUpperCase(),
        value: status === 'permission' ? formatMins(globalMinutes) : globalStatusMap[status]
    }));

    const memberStatsRows = Object.values(memberSummary).map(m => [
        m.name,
        m.present,
        m.absent,
        m.permission,
        formatMins(m.minutes),
        m.total
    ]);

    return { globalStats, memberStatsRows };
};

const getPAStatus = (status) => {
    const presentStatuses = ['present', 'late', 'permission', 'half-day'];
    return presentStatuses.includes(status) ? 'P' : 'A';
};

const getRowPermHrs = (a) => {
    if (a.status !== 'permission') return '-';
    if (!a.permission_duration) return '-';

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
        if (diff < 0) diff += 24 * 60;
        const hrs = Math.floor(diff / 60);
        const mins = diff % 60;
        let str = "";
        if (hrs > 0) str += `${hrs}hrs`;
        if (mins > 0) str += hrs > 0 ? ` ${mins}mins` : `${mins}mins`;
        return str || "0hrs";
    }
    return a.permission_duration;
};

/**
 * ATTENDANCE TRACKER EXPORTS
 */

export const exportAttendanceToCSV = (data, filename) => {
    const { memberStatsRows } = calculateAttendanceSummary(data);

    const summaryHeaders = ["Member Summary", "Present Total", "Absent", "Permissions", "Total Perm. Hrs", "Total Records"];
    const detailHeaders = ["Date", "Member", "Attd. (P/A)", "Status", "Perm. Duration", "Perm. Hrs", "Subject", "Project", "Note"];

    const rows = [
        ...memberStatsRows,
        [], // spacing
        detailHeaders,
        ...data.map(a => [
            new Date(a.date).toLocaleDateString('en-GB'),
            a.member_name || 'N/A',
            getPAStatus(a.status),
            a.status.toUpperCase(),
            a.status === 'permission' ? (a.permission_duration || 'N/A') : '-',
            getRowPermHrs(a),
            a.subject,
            a.project_name || 'N/A',
            a.note || ''
        ])
    ];

    generateCSV(summaryHeaders, rows, filename);
};

export const exportAttendanceToTXT = ({ data, period, filename }) => {
    const { globalStats, memberStatsRows } = calculateAttendanceSummary(data);

    let titleSuffix = "\nMEMBER SUMMARY\n" + "--------------------------------------------------\n";
    titleSuffix += ["Member", "Pres", "Abs", "Perm", "Hrs", "Total"].map(h => h.padEnd(8, ' ')).join(' | ') + "\n";
    memberStatsRows.forEach(row => {
        titleSuffix += row.map((v, i) => String(v).padEnd(8, ' ')).join(' | ') + "\n";
    });

    const logHeaders = ["Date", "Member", "P/A", "Status", "Perm. Hrs", "Subject"];
    const logRows = data.map(a => [
        new Date(a.date).toLocaleDateString('en-GB'),
        a.member_name || 'N/A',
        getPAStatus(a.status),
        a.status.toUpperCase(),
        getRowPermHrs(a),
        a.subject
    ]);

    generateTXT({
        title: 'Attendance Report',
        period,
        stats: globalStats,
        additionalContent: titleSuffix,
        logHeaders,
        logRows,
        filename
    });
};

export const exportAttendanceToPDF = ({ data, period, subHeader, filename }) => {
    const { globalStats, memberStatsRows } = calculateAttendanceSummary(data);

    const doc = new jsPDF('landscape');
    const pageWidth = doc.internal.pageSize.getWidth();

    // Re-use core elements of generatePDF manually here for multi-table support
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('Attendance Report', 15, 20);

    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255, 0.8);
    const nowFormatted = new Date().toLocaleString('en-GB');
    doc.text(`Period: ${period}  |  Generated on: ${nowFormatted}`, 15, 30);

    doc.setTextColor(100, 100, 100);
    doc.setFontSize(9);
    doc.text(subHeader || '', 15, 48);

    // Member Summary Table First
    doc.setTextColor(37, 99, 235);
    doc.setFontSize(11);
    doc.text('MEMBER PERFORMANCE SUMMARY', 15, 60);

    autoTable(doc, {
        startY: 65,
        head: [['Member Name', 'Total Presents', 'Total Absents', 'No. of permissions', 'Total Perm. Hours', 'Total Records']],
        body: memberStatsRows,
        theme: 'grid',
        headStyles: { fillColor: [248, 250, 252], textColor: [37, 99, 235], fontSize: 9, halign: 'center' },
        bodyStyles: { fontSize: 8, halign: 'center' },
        margin: { left: 15, right: 15 }
    });

    // Detailed Log Table
    doc.setTextColor(37, 99, 235);
    doc.setFontSize(11);
    doc.text('DETAILED ATTENDANCE LOGS', 15, doc.lastAutoTable.finalY + 15);

    const tableHeaders = ['Date', 'Member', 'P/A', 'Status', 'Perm. Hrs', 'Subject', 'Project', 'Note'];
    const tableRows = data.map(a => [
        new Date(a.date).toLocaleDateString('en-GB'),
        a.member_name || 'N/A',
        getPAStatus(a.status),
        a.status.toUpperCase(),
        getRowPermHrs(a),
        a.subject,
        a.project_name || 'N/A',
        a.note || ''
    ]);

    autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 20,
        head: [tableHeaders],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235], fontSize: 9, halign: 'center' },
        bodyStyles: { fontSize: 8, halign: 'center' },
        columnStyles: {
            0: { cellWidth: 22 }, 2: { cellWidth: 15 }, 3: { cellWidth: 25 }, 4: { cellWidth: 25 }
        },
        margin: { left: 15, right: 15 }
    });

    doc.save(`${filename}.pdf`);
};

/**
 * EXPENSE TRACKER EXPORTS
 */

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

    const headers = ["Date", "Description", "Amount", "Type", "Category", "Project", "Member"];
    const rows = [
        ...summaryRows,
        headers,
        ...data.map(t => [
            new Date(t.date).toLocaleDateString('en-GB'),
            t.title,
            t.amount,
            t.type.toUpperCase(),
            t.category,
            t.project_name || 'N/A',
            t.member_name || 'N/A'
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
        t.category,
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
        t.category,
        t.type.toUpperCase(),
        t.project_name || '-',
        t.member_name || '-',
        `Rs. ${formatAmount(t.amount)}`
    ]);

    generatePDF({ title: 'Financial Report', period, subHeader, stats, tableHeaders, tableRows, filename, themeColor: [45, 91, 255] });
};

// Legacy support (Old names pointing to new generic generators if needed, but better to use specific ones)
export const exportToCSV = generateCSV;
export const exportToTXT = generateTXT;
export const exportToPDF = generatePDF;
