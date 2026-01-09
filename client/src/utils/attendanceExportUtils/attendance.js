import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { generateCSV, generateTXT } from '../exportUtils/base.js';

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

export const processAttendanceExportData = (attendances, members, { periodType, currentPeriod, filterRole, filterMember, searchQuery }) => {
    let data = Array.isArray(attendances) ? attendances : [];

    // If Day View, ensure strict member list (filling absents)
    if (periodType === 'day' && members && members.length > 0) {
        let targetMembers = members;
        if (filterMember) targetMembers = targetMembers.filter(m => m.id == filterMember);
        if (filterRole) targetMembers = targetMembers.filter(m => m.role === filterRole);
        if (searchQuery) targetMembers = targetMembers.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()));

        data = targetMembers.map(m => {
            const rec = attendances.find(a => a.member_id == m.id);
            return rec || {
                id: `temp_${m.id}`,
                member_id: m.id,
                member_name: m.name,
                date: currentPeriod,
                status: 'absent',
                subject: '-',
                project_name: '-',
                note: '',
                role: m.role
            };
        });
    } else {
        // Respect filters for other views
        if (filterRole && members) {
            // Create a quick lookup for member roles if members list provided
            const memberRoleMap = {};
            members.forEach(m => memberRoleMap[m.id] = m.role);
            data = data.filter(a => memberRoleMap[a.member_id] === filterRole);
        }

        // Search query filtering for non-day views
        if (searchQuery) {
            data = data.filter(a =>
                (a.member_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (a.subject || '').toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
    }
    return data;
};

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
    console.log("inside");
    const doc = new jsPDF('landscape');
    const pageWidth = doc.internal.pageSize.getWidth();

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
