import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { generateCSV, generateTXT, generatePDF } from '../exportUtils/base.js';
import { formatAmount } from '../formatUtils.js';

export const exportPersonalExpenseToCSV = (data, filename) => {
    // Add Summary at the top of CSV for better readability in Excel
    let summary = { income: 0, expense: 0 };
    data.forEach(t => {
        if (t.type === 'income') summary.income += parseFloat(t.amount);
        else summary.expense += parseFloat(t.amount);
    });

    const summaryRows = [
        ["PERSONAL FINANCIAL REPORT SUMMARY"],
        ["Total Income", summary.income],
        ["Total Expense", summary.expense],
        ["Net Balance", summary.income - summary.expense],
        [] // Empty row
    ];

    const headers = ["Date", "Description", "Amount", "Type", "Category"];
    const rows = [
        ...summaryRows,
        headers,
        ...data.map(t => [
            new Date(t.date).toLocaleDateString('en-GB'),
            t.title,
            t.amount,
            t.type.toUpperCase(),
            t.category
        ])
    ];

    generateCSV("", rows, filename);
};

export const exportPersonalExpenseToTXT = ({ data, period, filename }) => {
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

    generateTXT({ title: 'Personal Financial Report', period, stats, logHeaders, logRows, filename });
};

export const exportPersonalExpenseToPDF = ({ data, period, subHeader, filename }) => {
    let summary = { income: 0, expense: 0 };
    data.forEach(t => {
        if (t.type === 'income') summary.income += parseFloat(t.amount);
        else summary.expense += parseFloat(t.amount);
    });

    const stats = [
        { label: 'Total Income', value: `Rs. ${formatAmount(summary.income)}` },
        { label: 'Total Expense', value: `Rs. ${formatAmount(summary.expense)}` },
        { label: 'Net Balance', value: `Rs. ${formatAmount(summary.income - summary.expense)}` },
        { label: 'Total Records', value: data.length.toString() }
    ];

    const tableHeaders = ['Date', 'Description', 'Category', 'Type', 'Amount'];
    const tableRows = data.map(t => [
        new Date(t.date).toLocaleDateString('en-GB'),
        t.title,
        t.category,
        t.type.toUpperCase(),
        `Rs. ${formatAmount(t.amount)}`
    ]);

    generatePDF({ title: 'Personal Financial Report', period, subHeader, stats, tableHeaders, tableRows, filename, themeColor: [45, 91, 255] });
};
