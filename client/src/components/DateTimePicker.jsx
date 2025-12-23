import { useState, useRef, useEffect } from 'react';
import { format, isSameDay } from 'date-fns';

function DateTimePicker({ value, onChange, placeholder = "Pick date & time" }) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(value || new Date());
    const [currentMonth, setCurrentMonth] = useState(value ? new Date(value) : new Date());
    const [hour, setHour] = useState(value ? new Date(value).getHours() % 12 || 12 : 12);
    const [minute, setMinute] = useState(value ? new Date(value).getMinutes() : 0);
    const [period, setPeriod] = useState(value ? (new Date(value).getHours() >= 12 ? 'PM' : 'AM') : 'AM');
    const [dropdownPosition, setDropdownPosition] = useState('bottom');
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && dropdownRef.current) {
            const rect = dropdownRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;

            // If not enough space below (need ~450px for dropdown), show above
            if (spaceBelow < 450 && spaceAbove > spaceBelow) {
                setDropdownPosition('top');
            } else {
                setDropdownPosition('bottom');
            }
        }
    }, [isOpen]);

    const formatDisplayDate = (date) => {
        if (!date) return '';
        const dateStr = format(date, 'MMM d, yyyy');
        const h = date.getHours() % 12 || 12;
        const m = date.getMinutes().toString().padStart(2, '0');
        const p = date.getHours() >= 12 ? 'PM' : 'AM';
        return `${dateStr}, ${h}:${m} ${p}`;
    };

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days = [];
        // Add empty cells for days before month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }
        // Add all days in month
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(i);
        }
        return days;
    };

    const handleDateClick = (day) => {
        if (!day) return;
        const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        setSelectedDate(newDate);
    };

    const handleApply = () => {
        const finalDate = new Date(selectedDate);
        let hours = hour;
        if (period === 'PM' && hour !== 12) hours += 12;
        if (period === 'AM' && hour === 12) hours = 0;

        finalDate.setHours(hours);
        finalDate.setMinutes(minute);
        finalDate.setSeconds(0);

        onChange(finalDate);
        setIsOpen(false);
    };

    const handleCancel = () => {
        setIsOpen(false);
    };

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    };

    const days = getDaysInMonth(currentMonth);
    const monthYear = format(currentMonth, 'MMMM yyyy');
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="relative w-full" ref={dropdownRef}>
            {/* Input Field */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-slate-800 input-focus text-xs sm:text-sm md:text-base placeholder:text-slate-400 font-medium text-left flex items-center justify-between"
            >
                <span className={value ? 'text-slate-800' : 'text-slate-400'}>
                    {value ? formatDisplayDate(value) : placeholder}
                </span>
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className={`absolute z-50 ${dropdownPosition === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} bg-white rounded-xl shadow-2xl border border-slate-200 w-full sm:w-auto sm:min-w-[320px] max-w-[95vw] sm:max-w-md`}>
                    <div className="p-4">
                        {/* Calendar Header */}
                        <div className="flex items-center justify-between mb-4">
                            <button
                                type="button"
                                onClick={prevMonth}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <h3 className="text-sm sm:text-base font-bold text-slate-800">{monthYear}</h3>
                            <button
                                type="button"
                                onClick={nextMonth}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>

                        {/* Week Days */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {weekDays.map(day => (
                                <div key={day} className="text-center text-xs font-semibold text-slate-500 py-2">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Days */}
                        <div className="grid grid-cols-7 gap-1 mb-4">
                            {days.map((day, index) => {
                                const dayDate = day ? new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day) : null;
                                const isSelected = dayDate && isSameDay(dayDate, selectedDate);
                                const isToday = dayDate && isSameDay(dayDate, new Date());

                                return (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => handleDateClick(day)}
                                        disabled={!day}
                                        className={`
                      p-2 text-sm rounded-lg transition-all relative
                      ${!day ? 'invisible' : ''}
                      ${isSelected
                                                ? 'bg-[#2d5bff] text-white font-bold shadow-lg'
                                                : isToday
                                                    ? 'bg-blue-50 text-[#2d5bff] font-semibold border border-[#2d5bff]'
                                                    : 'hover:bg-slate-100 text-slate-700'
                                            }
                    `}
                                    >
                                        {day}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Time Picker */}
                        <div className="border-t border-slate-200 pt-4 mb-4">
                            <h4 className="text-xs font-semibold text-slate-500 mb-3">TIME</h4>
                            <div className="flex items-center justify-center gap-2">
                                {/* Hour */}
                                <select
                                    value={hour}
                                    onChange={(e) => setHour(parseInt(e.target.value))}
                                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2d5bff] focus:border-transparent"
                                >
                                    {[...Array(12)].map((_, i) => (
                                        <option key={i + 1} value={i + 1}>{(i + 1).toString().padStart(2, '0')}</option>
                                    ))}
                                </select>

                                <span className="text-lg font-bold text-slate-400">:</span>

                                {/* Minute */}
                                <select
                                    value={minute}
                                    onChange={(e) => setMinute(parseInt(e.target.value))}
                                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2d5bff] focus:border-transparent"
                                >
                                    {[...Array(60)].map((_, i) => (
                                        <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>
                                    ))}
                                </select>

                                {/* AM/PM */}
                                <select
                                    value={period}
                                    onChange={(e) => setPeriod(e.target.value)}
                                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2d5bff] focus:border-transparent"
                                >
                                    <option value="AM">AM</option>
                                    <option value="PM">PM</option>
                                </select>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-semibold text-sm hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleApply}
                                className="flex-1 px-4 py-2 bg-[#2d5bff] text-white rounded-lg font-semibold text-sm hover:bg-[#1e4bd8] transition-colors shadow-lg shadow-blue-500/30"
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DateTimePicker;
