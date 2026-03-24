import { generateCSV, generateTXT, generatePDF } from '../exportUtils/base.js';
import toast from 'react-hot-toast';

export const exportReminderToCSV = ({ data, period, filename }) => {
    if (!data || data.length === 0) return toast.error("No data available to export");
    // Add Summary
    const total = data.length;
    const completed = data.filter(r => r.is_completed).length;
    const pending = total - completed;

    const summaryRows = [
        ["REMINDER REPORT SUMMARY"],
        ["Period", period || 'All Time'],
        ["Total Tasks", total],
        ["Completed", completed],
        ["Pending", pending],
        [] // Empty row
    ];

    const headers = ["Created At", "Due Date", "Title", "Description", "Priority", "Category", "Status", "Completed At"];
    const rows = [
        ...summaryRows,
        headers,
        ...data.map(r => [
            r.created_at ? new Date(r.created_at).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase() : '-',
            r.due_date ? new Date(r.due_date).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase() : 'No Date',
            r.title,
            r.description || '',
            r.priority.toUpperCase(),
            r.category || 'General',
            r.is_completed ? 'COMPLETED' : 'PENDING',
            r.completed_at ? new Date(r.completed_at).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase() : '-'
        ])
    ];
    generateCSV("", rows, filename);
};

export const exportReminderToTXT = ({ data, period, filename }) => {
    if (!data || data.length === 0) return toast.error("No data available to export");
    const total = data.length;
    const completed = data.filter(r => r.is_completed).length;
    const pending = total - completed;

    const stats = [
        { label: 'Total Tasks', value: total },
        { label: 'Completed', value: completed },
        { label: 'Pending', value: pending }
    ];

    const logHeaders = ["Created At", "Due Date", "Title", "Description", "Priority", "Category", "Status", "Completed At"];
    const logRows = data.map(r => [
        r.created_at ? new Date(r.created_at).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase() : '-',
        r.due_date ? new Date(r.due_date).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase() : 'No Date',
        r.title,
        r.description || '',
        r.priority.toUpperCase(),
        r.category || 'General',
        r.is_completed ? 'COMPLETED' : 'PENDING',
        r.completed_at ? new Date(r.completed_at).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase() : '-'
    ]);

    generateTXT({ title: 'Reminder Report', period, stats, logHeaders, logRows, filename });
};

export const exportReminderToPDF = ({ data, period, subHeader, filename }) => {
    if (!data || data.length === 0) return toast.error("No data available to export");
    const total = data.length;
    const completed = data.filter(r => r.is_completed).length;
    const pending = total - completed;

    const stats = [
        { label: 'Total Tasks', value: total.toString() },
        { label: 'Completed', value: completed.toString() },
        { label: 'Pending', value: pending.toString() }
    ];

    const tableHeaders = ['Created At', 'Due Date', 'Title', 'Description', 'Category', 'Priority', 'Status', 'Completed At'];
    const tableRows = data.map(r => [
        r.created_at ? new Date(r.created_at).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase() : '-',
        r.due_date ? new Date(r.due_date).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase() : 'No Date',
        r.title,
        r.description || '',
        r.category || 'General',
        r.priority.toUpperCase(),
        r.is_completed ? 'COMPLETED' : 'PENDING',
        r.completed_at ? new Date(r.completed_at).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase() : '-'
    ]);

    generatePDF({ title: 'Reminder Report', period, subHeader, stats, tableHeaders, tableRows, filename, themeColor: [45, 91, 255] });
};
