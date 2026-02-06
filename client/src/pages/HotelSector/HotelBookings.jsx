import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getBookings, createBooking, updateBookingStatus, getUnits, getGuests, createGuest } from '../../api/Hotel/hotelApi';
import { exportBookingsToCSV, exportBookingsToTXT, exportBookingsToPDF } from '../../utils/exportUtils';
import toast from 'react-hot-toast';
import { FaCalendarAlt, FaPlus, FaSearch, FaCheck, FaTimes, FaBed, FaUser, FaMoneyBillWave, FaClock, FaCalendarCheck, FaFilter, FaFileDownload, FaFileCsv, FaFileAlt, FaFilePdf, FaChevronLeft } from 'react-icons/fa';

const HotelBookings = () => {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [units, setUnits] = useState([]);
    const [guests, setGuests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showExportMenu, setShowExportMenu] = useState(false);

    // Date filter states
    const [dateFilterType, setDateFilterType] = useState('day'); // 'day', 'month', 'year', 'range'
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        guest_id: '',
        unit_id: '',
        check_in: '',
        check_out: '',
        total_amount: '',
        advance_paid: '0',
        booking_source: 'direct',
        notes: ''
    });

    const [showGuestModal, setShowGuestModal] = useState(false);
    const [guestForm, setGuestForm] = useState({ name: '', phone: '', email: '', id_proof_type: 'Aadhar', id_proof_number: '', address: '' });

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [bRes, uRes, gRes] = await Promise.all([getBookings(), getUnits(), getGuests()]);
            setBookings(bRes.data.data);
            setUnits(uRes.data.data);
            setGuests(gRes.data.data);
        } catch (error) {
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
    }, []);

    // Close export menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showExportMenu && !event.target.closest('.export-menu-container')) {
                setShowExportMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showExportMenu]);

    const handleCreateBooking = async (e) => {
        e.preventDefault();
        try {
            const unit = units.find(u => u.id == formData.unit_id);
            if (!unit) return toast.error("Invalid unit");

            // Basic amount calculation check (can be overridden by user input if we allowed it, but here we trust the input or should calc it)
            // For MVP, user enters total amount manually or we could auto-calc: 
            // const days = (new Date(formData.check_out) - new Date(formData.check_in)) / (1000 * 60 * 60 * 24);
            // const calcAmount = days * unit.base_price;

            await createBooking(formData);
            toast.success("Booking created successfully!");
            setShowModal(false);
            setFormData({ guest_id: '', unit_id: '', check_in: '', check_out: '', total_amount: '', advance_paid: '0', booking_source: 'direct', notes: '' });
            fetchAll();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to create booking");
        }
    };

    const handleCreateGuest = async (e) => {
        e.preventDefault();
        try {
            const res = await createGuest(guestForm);
            toast.success("Guest added!");
            // Refresh guests and select this new guest
            const gRes = await getGuests();
            setGuests(gRes.data.data);
            setFormData({ ...formData, guest_id: res.data.id });
            setShowGuestModal(false);
            setGuestForm({ name: '', phone: '', email: '', id_proof_type: 'Aadhar', id_proof_number: '', address: '' });
        } catch (error) {
            toast.error("Failed to add guest");
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            await updateBookingStatus(id, status);
            toast.success(`Booking ${status}`);
            fetchAll();
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const calculateTotal = () => {
        if (formData.unit_id && formData.check_in && formData.check_out) {
            const unit = units.find(u => u.id == formData.unit_id);
            if (unit) {
                const start = new Date(formData.check_in);
                const end = new Date(formData.check_out);
                const diffTime = Math.abs(end - start);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays > 0) {
                    setFormData(prev => ({ ...prev, total_amount: (diffDays * unit.base_price).toFixed(2) }));
                }
            }
        }
    };

    const filteredBookings = bookings.filter(b => {
        const matchesStatus = filterStatus === 'all' || b.status === filterStatus;
        const matchesSearch = b.guest_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.unit_number.toLowerCase().includes(searchQuery.toLowerCase());

        // Date filtering
        let matchesDate = true;
        const checkInDate = new Date(b.check_in);

        if (dateFilterType === 'day' && selectedDate) {
            const selected = new Date(selectedDate);
            matchesDate = checkInDate.toDateString() === selected.toDateString();
        } else if (dateFilterType === 'month' && selectedDate) {
            const selected = new Date(selectedDate);
            matchesDate = checkInDate.getMonth() === selected.getMonth() &&
                checkInDate.getFullYear() === selected.getFullYear();
        } else if (dateFilterType === 'year' && selectedDate) {
            const selected = new Date(selectedDate);
            matchesDate = checkInDate.getFullYear() === selected.getFullYear();
        } else if (dateFilterType === 'range' && dateRange.start && dateRange.end) {
            const start = new Date(dateRange.start);
            const end = new Date(dateRange.end);
            matchesDate = checkInDate >= start && checkInDate <= end;
        }

        return matchesStatus && matchesSearch && matchesDate;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'confirmed': return 'bg-blue-100 text-blue-700';
            case 'checked_in': return 'bg-emerald-100 text-emerald-700';
            case 'checked_out': return 'bg-slate-100 text-slate-700';
            case 'cancelled': return 'bg-red-100 text-red-700';
            default: return 'bg-yellow-100 text-yellow-700';
        }
    };

    // Export Functions
    const getFilterDescription = () => {
        const statusStr = filterStatus === 'all' ? 'ALL STATUSES' : filterStatus.toUpperCase().replace('_', ' ');
        let dateStr = '';

        if (dateFilterType === 'day') dateStr = `Date: ${selectedDate}`;
        else if (dateFilterType === 'month') dateStr = `Month: ${selectedDate.substring(0, 7)}`;
        else if (dateFilterType === 'year') dateStr = `Year: ${selectedDate.substring(0, 4)}`;
        else if (dateFilterType === 'range' && dateRange.start && dateRange.end) {
            dateStr = `Range: ${dateRange.start} to ${dateRange.end}`;
        }

        return `${statusStr} | ${dateStr}`;
    };

    const getExportFilename = () => {
        let datePart = '';
        if (dateFilterType === 'day') datePart = selectedDate;
        else if (dateFilterType === 'month') datePart = selectedDate.substring(0, 7);
        else if (dateFilterType === 'year') datePart = selectedDate.substring(0, 4);
        else if (dateFilterType === 'range') datePart = `${dateRange.start}_to_${dateRange.end}`;
        else datePart = new Date().toISOString().split('T')[0];

        return `hotel_bookings_${filterStatus}_${datePart}`;
    };

    const exportToCSV = () => {
        exportBookingsToCSV({
            data: filteredBookings,
            filterDescription: getFilterDescription(),
            filename: getExportFilename()
        });
        toast.success('Exported to CSV!');
        setShowExportMenu(false);
    };

    const exportToTXT = () => {
        exportBookingsToTXT({
            data: filteredBookings,
            filterDescription: getFilterDescription(),
            filename: getExportFilename()
        });
        toast.success('Exported to TXT!');
        setShowExportMenu(false);
    };

    const exportToPDF = () => {
        exportBookingsToPDF({
            data: filteredBookings,
            filterDescription: getFilterDescription(),
            filename: getExportFilename()
        });
        toast.success('PDF Generated!');
        setShowExportMenu(false);
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] font-['Outfit'] p-6 md:p-12">
            <div className="max-w-7xl mx-auto">

                {/* Header with Filters */}
                <div className="flex flex-col gap-4 mb-8">
                    {/* Title */}
                    <div className="flex items-center gap-4">
                        <Link to="/hotel-sector" className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all shadow-sm">
                            <FaChevronLeft />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                <FaCalendarAlt className="text-indigo-600" /> Bookings
                            </h1>
                            <p className="text-slate-500 font-medium mt-1">Manage reservations, check-ins, and check-outs.</p>
                        </div>
                    </div>

                    {/* Filters & Actions Row */}
                    <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
                        {/* Date Filter Tabs */}
                        <div className="flex gap-2 overflow-x-auto w-full xl:w-auto">
                            {['day', 'month', 'year', 'range'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => {
                                        setDateFilterType(type);
                                        if (type !== 'range') {
                                            setDateRange({ start: '', end: '' });
                                        }
                                    }}
                                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${dateFilterType === type
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                                        }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>

                        {/* Date Input */}
                        <div className="flex gap-2 items-center w-full xl:flex-1">
                            {dateFilterType === 'range' ? (
                                <>
                                    <input
                                        type="date"
                                        value={dateRange.start}
                                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                        className="flex-1 xl:w-36 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100"
                                    />
                                    <span className="text-slate-400 font-bold text-xs">to</span>
                                    <input
                                        type="date"
                                        value={dateRange.end}
                                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                        className="flex-1 xl:w-36 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100"
                                    />
                                </>
                            ) : (
                                <input
                                    type={dateFilterType === 'day' ? 'date' : dateFilterType === 'month' ? 'month' : dateFilterType === 'year' ? 'number' : 'date'}
                                    value={dateFilterType === 'year' ? (selectedDate ? new Date(selectedDate).getFullYear() : new Date().getFullYear()) : selectedDate}
                                    onChange={(e) => {
                                        if (dateFilterType === 'year') {
                                            setSelectedDate(`${e.target.value}-01-01`);
                                        } else {
                                            setSelectedDate(e.target.value);
                                        }
                                    }}
                                    placeholder={dateFilterType === 'year' ? 'YYYY' : ''}
                                    min={dateFilterType === 'year' ? '2020' : undefined}
                                    max={dateFilterType === 'year' ? '2030' : undefined}
                                    className="flex-1 xl:w-48 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100"
                                />
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 w-full xl:w-auto">
                            <button
                                onClick={() => setShowModal(true)}
                                className="flex-1 xl:flex-none bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2 text-sm whitespace-nowrap"
                            >
                                <FaPlus /> New Booking
                            </button>

                            {/* Export Button */}
                            <div className="relative export-menu-container flex-1 xl:flex-none">
                                <button
                                    onClick={() => setShowExportMenu(!showExportMenu)}
                                    className="w-full bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-500/30 hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-2 text-sm whitespace-nowrap"
                                >
                                    <FaFileDownload /> Export
                                </button>

                                {/* Export Dropdown */}
                                {showExportMenu && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50">
                                        <button
                                            onClick={exportToCSV}
                                            className="w-full px-4 py-3 text-left hover:bg-emerald-50 transition-colors flex items-center gap-3 text-slate-700 font-semibold"
                                        >
                                            <FaFileCsv className="text-emerald-600" /> Export as CSV
                                        </button>
                                        <button
                                            onClick={exportToTXT}
                                            className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors flex items-center gap-3 text-slate-700 font-semibold"
                                        >
                                            <FaFileAlt className="text-blue-600" /> Export as TXT
                                        </button>
                                        <button
                                            onClick={exportToPDF}
                                            className="w-full px-4 py-3 text-left hover:bg-red-50 transition-colors flex items-center gap-3 text-slate-700 font-semibold"
                                        >
                                            <FaFilePdf className="text-red-600" /> Export as PDF
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 custom-scrollbar">
                        {['all', 'pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${filterStatus === status ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                            >
                                {status.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                    <div className="relative w-full md:w-64">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search guest or unit..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 placeholder:font-medium"
                        />
                    </div>
                </div>



                {/* Bookings List */}
                {loading ? (
                    <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-600"></div></div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {filteredBookings.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-[32px] border border-dashed border-slate-200">
                                <FaCalendarCheck className="mx-auto text-4xl text-slate-200 mb-4" />
                                <h3 className="text-lg font-black text-slate-400">No bookings found</h3>
                            </div>
                        ) : (
                            filteredBookings.map(booking => (
                                <div key={booking.id} className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-6 md:items-center">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${getStatusColor(booking.status)}`}>
                                                {booking.status.replace('_', ' ')}
                                            </span>
                                            <span className="text-xs font-bold text-slate-400">#{booking.id} via {booking.booking_source}</span>
                                        </div>
                                        <h3 className="text-xl font-black text-slate-800 mb-1">{booking.guest_name}</h3>
                                        <div className="flex flex-wrap gap-4 text-sm text-slate-500 font-medium">
                                            <span className="flex items-center gap-1.5"><FaBed className="text-indigo-400" /> Unit {booking.unit_number} ({booking.unit_type})</span>
                                            <span className="flex items-center gap-1.5"><FaClock className="text-indigo-400" /> {new Date(booking.check_in).toLocaleDateString()} - {new Date(booking.check_out).toLocaleDateString()}</span>
                                            <span className="flex items-center gap-1.5"><FaMoneyBillWave className="text-emerald-500" /> ₹{booking.total_amount}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-slate-50">
                                        {booking.status === 'confirmed' && (
                                            <button onClick={() => handleStatusUpdate(booking.id, 'checked_in')} className="px-5 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-emerald-100 transition-colors">
                                                Check In
                                            </button>
                                        )}
                                        {booking.status === 'checked_in' && (
                                            <button onClick={() => handleStatusUpdate(booking.id, 'checked_out')} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-800 transition-colors">
                                                Check Out
                                            </button>
                                        )}
                                        {(booking.status === 'confirmed' || booking.status === 'pending') && (
                                            <button onClick={() => handleStatusUpdate(booking.id, 'cancelled')} className="px-5 py-2.5 bg-red-50 text-red-600 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-red-100 transition-colors">
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

            </div>

            {/* Booking Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-[32px] p-8 w-full max-w-2xl shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black text-slate-800">New Reservation</h2>
                            <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100"><FaTimes /></button>
                        </div>

                        <form onSubmit={handleCreateBooking} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Guest Selection */}
                                <div className="col-span-1 md:col-span-2">
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Guest</label>
                                    <div className="flex gap-2">
                                        <select
                                            required
                                            value={formData.guest_id}
                                            onChange={e => setFormData({ ...formData, guest_id: e.target.value })}
                                            className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500"
                                        >
                                            <option value="">Select Existing Guest</option>
                                            {guests.map(g => <option key={g.id} value={g.id}>{g.name} ({g.phone})</option>)}
                                        </select>
                                        <button type="button" onClick={() => setShowGuestModal(true)} className="px-4 py-3 bg-indigo-50 text-indigo-600 rounded-2xl font-black text-xl hover:bg-indigo-100 transition-colors"><FaPlus /></button>
                                    </div>
                                </div>

                                {/* Unit Selection */}
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Unit / Room</label>
                                    <select
                                        required
                                        value={formData.unit_id}
                                        onChange={e => {
                                            setFormData({ ...formData, unit_id: e.target.value });
                                            // Trigger total recalc if dates are set
                                            setTimeout(calculateTotal, 0);
                                        }}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500"
                                    >
                                        <option value="">Select Unit</option>
                                        {units.filter(u => u.status === 'available').map(u => (
                                            <option key={u.id} value={u.id}>Unit {u.unit_number} ({u.category}) - ₹{u.base_price}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Source */}
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Source</label>
                                    <select
                                        value={formData.booking_source}
                                        onChange={e => setFormData({ ...formData, booking_source: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500"
                                    >
                                        <option value="direct">Direct Walk-in</option>
                                        <option value="phone">Phone</option>
                                        <option value="website">Website</option>
                                        <option value="booking.com">Booking.com</option>
                                        <option value="airbnb">Airbnb</option>
                                        <option value="mmt">MakeMyTrip</option>
                                    </select>
                                </div>

                                {/* Dates */}
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Check-in Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.check_in}
                                        onChange={e => {
                                            setFormData({ ...formData, check_in: e.target.value });
                                            setTimeout(calculateTotal, 0);
                                        }}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Check-out Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.check_out}
                                        onChange={e => {
                                            setFormData({ ...formData, check_out: e.target.value });
                                            setTimeout(calculateTotal, 0);
                                        }}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500"
                                    />
                                </div>

                                {/* Financials */}
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Total Amount (₹)</label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.total_amount}
                                        onChange={e => setFormData({ ...formData, total_amount: e.target.value })}
                                        className="w-full bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl px-4 py-3 text-lg font-black outline-none focus:border-emerald-500"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Advance Paid (₹)</label>
                                    <input
                                        type="number"
                                        value={formData.advance_paid}
                                        onChange={e => setFormData({ ...formData, advance_paid: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-lg font-bold text-slate-700 outline-none focus:border-indigo-500"
                                        placeholder="0.00"
                                    />
                                </div>

                                <div className="col-span-1 md:col-span-2">
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Notes</label>
                                    <textarea
                                        rows="2"
                                        value={formData.notes}
                                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500"
                                        placeholder="Special requests..."
                                    />
                                </div>
                            </div>

                            <button type="submit" className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-slate-800 transition-all active:scale-95 text-sm uppercase tracking-widest">
                                Confirm Booking
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Guest Modal */}
            {showGuestModal && (
                <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-[32px] p-8 w-full max-w-md shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black text-slate-800">Add Guest</h2>
                            <button onClick={() => setShowGuestModal(false)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100"><FaTimes /></button>
                        </div>
                        <form onSubmit={handleCreateGuest} className="space-y-4">
                            <input required placeholder="Full Name" value={guestForm.name} onChange={e => setGuestForm({ ...guestForm, name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none" />
                            <input required placeholder="Phone" value={guestForm.phone} onChange={e => setGuestForm({ ...guestForm, phone: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none" />
                            <input placeholder="Email" value={guestForm.email} onChange={e => setGuestForm({ ...guestForm, email: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none" />
                            <div className="grid grid-cols-2 gap-4">
                                <select value={guestForm.id_proof_type} onChange={e => setGuestForm({ ...guestForm, id_proof_type: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none">
                                    <option>Aadhar</option><option>Passport</option><option>Driving License</option>
                                </select>
                                <input placeholder="ID Number" value={guestForm.id_proof_number} onChange={e => setGuestForm({ ...guestForm, id_proof_number: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none" />
                            </div>
                            <textarea placeholder="Address" value={guestForm.address} onChange={e => setGuestForm({ ...guestForm, address: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none" rows="2" />
                            <button type="submit" className="w-full bg-indigo-600 text-white font-black py-3 rounded-2xl shadow-lg hover:bg-indigo-700 transition-all">Save Guest</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HotelBookings;
