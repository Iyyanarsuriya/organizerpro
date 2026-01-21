import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateCSV = (headers, rows, filename) => {
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

    const allRows = (Array.isArray(headers) && headers.length > 0) ? [headers, ...escapedRows] : escapedRows;
    const csvContent = allRows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link); // Required for Firefox
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

export const generateTXT = ({ title, period, stats, additionalContent, logHeaders, logRows, filename }) => {
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
    document.body.appendChild(link); // Required for Firefox
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

export const generatePDF = ({ title, period, subHeader, stats, tableHeaders, tableRows, filename, themeColor = [45, 91, 255], columnStyles = {} }) => {
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

    // Default Alignment logic
    let defaultColumnStyles = {
        0: { halign: 'center', valign: 'middle', cellWidth: 25 },
        1: { halign: 'center', valign: 'middle' },
        2: { halign: 'center', valign: 'middle', cellWidth: 30 },
        3: { halign: 'center', valign: 'middle', cellWidth: 20 },
        4: { halign: 'center', valign: 'middle' },
        5: { halign: 'center', valign: 'middle', cellWidth: 30 }
    };

    const finalColumnStyles = { ...defaultColumnStyles, ...columnStyles };

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
        columnStyles: finalColumnStyles,
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
