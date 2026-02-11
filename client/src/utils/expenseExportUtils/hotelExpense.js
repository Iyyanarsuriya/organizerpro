import { generateCSV, generateTXT, generatePDF } from '../exportUtils/base.js';
import { formatAmount } from '../formatUtils.js';

export const exportHotelTransactionsToCSV = (data, filename) => {
    let summary = { income: 0, expense: 0 };
    data.forEach(t => {
        if (t.type === 'income') summary.income += parseFloat(t.amount);
        else summary.expense += parseFloat(t.amount);
    });

    const summaryRows = [
        ["HOSPITALITY FINANCIAL REPORT"],
        ["Total Revenue", summary.income],
        ["Total Expenses", summary.expense],
        ["Net Cash Flow", summary.income - summary.expense],
        [] // Empty row
    ];

    const headers = ["Date", "Description", "Amount", "Type", "Category", "Property", "Room/Unit", "Payment Mode"];
    const rows = [
        ...summaryRows,
        headers,
        ...data.map(t => [
            new Date(t.date).toLocaleDateString('en-GB'),
            t.title,
            t.amount,
            t.type.toUpperCase(),
            t.category_name || t.category,
            t.property_type || 'Hotel',
            t.unit_number || t.unit_id || 'N/A',
            t.payment_mode || 'N/A'
        ])
    ];

    generateCSV("", rows, filename);
};

export const exportHotelTransactionsToTXT = (data, filename, { type, value, range }) => {
    const period = type === 'range' ? `${range.start} to ${range.end}` : value;
    let summary = { income: 0, expense: 0 };
    data.forEach(t => {
        if (t.type === 'income') summary.income += parseFloat(t.amount);
        else summary.expense += parseFloat(t.amount);
    });

    const stats = [
        { label: 'Total Revenue', value: `Rs. ${formatAmount(summary.income)}` },
        { label: 'Total Expenses', value: `Rs. ${formatAmount(summary.expense)}` },
        { label: 'Net Cash Flow', value: `Rs. ${formatAmount(summary.income - summary.expense)}` }
    ];

    const logHeaders = ["Date", "Description", "Amount", "Type", "Category", "Unit"];
    const logRows = data.map(t => [
        new Date(t.date).toLocaleDateString('en-GB'),
        t.title,
        `Rs. ${formatAmount(t.amount)}`,
        t.type.toUpperCase(),
        t.category_name || t.category,
        t.unit_number || 'N/A'
    ]);

    generateTXT({ title: 'Hospitality Financial Report', period, stats, logHeaders, logRows, filename });
};

export const exportHotelTransactionsToPDF = (data, stats, { type, value, range }) => {
    const period = type === 'range' ? `${range.start} to ${range.end}` : value;

    let summary = { income: 0, expense: 0 };
    data.forEach(t => {
        if (t.type === 'income') summary.income += parseFloat(t.amount);
        else summary.expense += parseFloat(t.amount);
    });

    const pdfStats = [
        { label: 'Total Revenue', value: `Rs. ${formatAmount(summary.income)}` },
        { label: 'Total Expenses', value: `Rs. ${formatAmount(summary.expense)}` },
        { label: 'Net Flow', value: `Rs. ${formatAmount(summary.income - summary.expense)}` },
        { label: 'Total Logs', value: data.length.toString() }
    ];

    const tableHeaders = ['Date', 'Description', 'Category', 'Type', 'Room', 'Amount'];
    const tableRows = data.map(t => [
        new Date(t.date).toLocaleDateString('en-GB'),
        t.title,
        t.category_name || t.category,
        t.type.toUpperCase(),
        t.unit_number || '-',
        `Rs. ${formatAmount(t.amount)}`
    ]);

    generatePDF({
        title: 'Hospitality Financial Report',
        period,
        stats: pdfStats,
        tableHeaders,
        tableRows,
        filename: `hotel_report_${value || 'range'}`,
        themeColor: [15, 23, 42] // Slate 900
    });
};
