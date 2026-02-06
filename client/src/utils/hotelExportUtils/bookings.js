import { generateCSV, generateTXT, generatePDF } from '../exportUtils/base.js';

export const exportBookingsToCSV = ({ data, filterDescription, filename }) => {
    const headers = ['Booking ID', 'Guest Name', 'Unit', 'Check-In', 'Check-Out', 'Total Amount', 'Advance Paid', 'Balance', 'Status', 'Booking Source', 'Notes'];
    const rows = data.map(b => [
        b.id,
        b.guest_name,
        `${b.unit_number} - ${b.category}`,
        new Date(b.check_in).toLocaleDateString(),
        new Date(b.check_out).toLocaleDateString(),
        parseFloat(b.total_amount).toFixed(2),
        parseFloat(b.advance_paid).toFixed(2),
        (parseFloat(b.total_amount) - parseFloat(b.advance_paid)).toFixed(2),
        b.status,
        b.booking_source,
        b.notes || ''
    ]);
    generateCSV(headers, rows, filename);
};

export const exportBookingsToTXT = ({ data, filterDescription, filename }) => {
    const logHeaders = ['ID', 'Guest Name', 'Unit', 'Check-In', 'Check-Out', 'Amount', 'Balance', 'Status'];
    const logRows = data.map(b => [
        b.id,
        b.guest_name.substring(0, 20),
        `${b.unit_number}`,
        new Date(b.check_in).toLocaleDateString(),
        new Date(b.check_out).toLocaleDateString(),
        parseFloat(b.total_amount).toFixed(0),
        (parseFloat(b.total_amount) - parseFloat(b.advance_paid)).toFixed(0),
        b.status.toUpperCase()
    ]);

    // Calculate simple stats
    const totalRevenue = data.reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0);
    const totalCollected = data.reduce((sum, b) => sum + parseFloat(b.advance_paid || 0), 0);

    generateTXT({
        title: 'Hotel Bookings Report',
        period: filterDescription,
        logHeaders,
        logRows,
        filename,
        stats: [
            { label: 'Total Records', value: data.length },
            { label: 'Total Revenue', value: `INR ${totalRevenue.toFixed(2)}` },
            { label: 'Total Collected', value: `INR ${totalCollected.toFixed(2)}` }
        ]
    });
};

export const exportBookingsToPDF = ({ data, filterDescription, filename }) => {
    const tableHeaders = ['ID', 'Guest', 'Unit', 'Check-In', 'Check-Out', 'Amount', 'Advance', 'Balance', 'Status'];
    const tableRows = data.map(b => [
        '#' + b.id,
        b.guest_name,
        `${b.unit_number}\n(${b.category})`,
        new Date(b.check_in).toLocaleDateString(),
        new Date(b.check_out).toLocaleDateString(),
        `Rs. ${parseFloat(b.total_amount).toFixed(2)}`,
        `Rs. ${parseFloat(b.advance_paid).toFixed(2)}`,
        `Rs. ${(parseFloat(b.total_amount) - parseFloat(b.advance_paid)).toFixed(2)}`,
        b.status.toUpperCase()
    ]);

    // Calculate stats
    const totalRevenue = data.reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0);
    const totalCollected = data.reduce((sum, b) => sum + parseFloat(b.advance_paid || 0), 0);
    const confirmedCount = data.filter(b => b.status === 'confirmed').length;
    const checkedInCount = data.filter(b => b.status === 'checked_in').length;

    generatePDF({
        title: 'Hotel Bookings Report',
        period: filterDescription,
        tableHeaders,
        tableRows,
        filename,
        themeColor: [79, 70, 229], // Indigo-600
        stats: [
            { label: 'Total Bookings', value: data.length },
            { label: 'Projected Revenue', value: `Rs. ${totalRevenue.toFixed(2)}` },
            { label: 'Active (Checked In)', value: checkedInCount },
            { label: 'Confirmed', value: confirmedCount }
        ],
        columnStyles: {
            0: { cellWidth: 15, halign: 'center' }, // ID
            1: { cellWidth: 35, halign: 'left' },   // Guest
            2: { cellWidth: 25, halign: 'left' },   // Unit
            3: { cellWidth: 25, halign: 'center' }, // CheckIn
            4: { cellWidth: 25, halign: 'center' }, // CheckOut
            5: { cellWidth: 25, halign: 'right' },  // Amount
            6: { cellWidth: 25, halign: 'right' },  // Advance
            7: { cellWidth: 25, halign: 'right' },  // Balance
            8: { cellWidth: 25, halign: 'center' }  // Status
        }
    });
};
