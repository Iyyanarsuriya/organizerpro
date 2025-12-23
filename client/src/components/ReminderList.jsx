import { useState } from 'react';
import toast from 'react-hot-toast';
import { Trash2, X, Calendar, Clock, AlertCircle } from 'lucide-react';

function ReminderList({ reminders, onToggle, onDelete }) {
  const [selectedReminder, setSelectedReminder] = useState(null);

  const isOverdue = (date, completed) => {
    if (!date || completed) return false;
    return new Date(date) < new Date();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const priorityStyles = {
    high: 'bg-red-50 text-[#ff4d4d] border-red-100',
    medium: 'bg-amber-50 text-[#ffb800] border-amber-100',
    low: 'bg-slate-100 text-slate-500 border-slate-200',
  };

  return (
    <div className="space-y-4">
      {reminders.map((reminder) => {
        const overdue = isOverdue(reminder.due_date, reminder.is_completed);
        const priorityColors = {
          high: { bg: 'bg-[#ff4d4d]', shadow: 'shadow-red-500/20' },
          medium: { bg: 'bg-[#ffb800]', shadow: 'shadow-amber-500/20' },
          low: { bg: 'bg-[#2d5bff]', shadow: 'shadow-blue-500/20' }
        };

        const backgroundColors = {
          high: 'bg-gradient-to-br from-rose-50 to-red-100/50',
          medium: 'bg-gradient-to-br from-amber-50 to-orange-100/50',
          low: 'bg-gradient-to-br from-blue-50 to-indigo-100/50',
          default: 'bg-slate-50'
        };

        const contentStyle = reminder.is_completed
          ? 'bg-slate-50'
          : (backgroundColors[reminder.priority] || backgroundColors.default);

        return (
          <div
            key={reminder.id}
            className={`group relative flex flex-col gap-2 sm:gap-4 p-1 rounded-[16px] sm:rounded-[24px] transition-all duration-300 bg-white border border-slate-200 shadow-sm hover:shadow-xl sm:hover:scale-[1.01]`}
          >
            <div className={`flex flex-col gap-2 sm:gap-4 p-3 sm:p-4 rounded-[14px] sm:rounded-[20px] ${contentStyle}`}>
              {/* Priority Pulse Indicator (Side) */}
              {!reminder.is_completed && (
                <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 sm:w-1.5 h-1/2 rounded-r-full ${priorityColors[reminder.priority]?.bg || 'bg-slate-200'}`} />
              )}

              <div className="flex items-start justify-between gap-2 sm:gap-4">
                <div className="flex items-start gap-2 sm:gap-4 flex-1 min-w-0">
                  {/* Status Toggle - Radio Button Style */}
                  <button
                    onClick={() => onToggle(reminder.id, reminder.is_completed)}
                    className={`mt-0.5 sm:mt-1 flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 transition-all flex items-center justify-center shadow-sm ${reminder.is_completed
                      ? 'bg-[#2d5bff] border-[#2d5bff] shadow-blue-500/30'
                      : 'border-slate-300 hover:border-[#2d5bff] bg-white'
                      }`}
                  >
                    {!!reminder.is_completed && (
                      <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-white rounded-full"></div>
                    )}
                  </button>

                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => setSelectedReminder(reminder)}
                  >
                    <div className="flex items-center gap-1 sm:gap-2 mb-0.5 sm:mb-1">
                      <h3 className={`text-sm sm:text-base md:text-lg font-black tracking-tight truncate ${reminder.is_completed ? 'text-slate-400 line-through' : 'text-slate-800'
                        }`}>
                        {reminder.title}
                      </h3>
                    </div>

                    {reminder.description && (
                      <p className={`text-[10px] sm:text-xs font-medium leading-relaxed mb-2 sm:mb-4 line-clamp-2 ${reminder.is_completed ? 'text-slate-300' : 'text-slate-500'
                        }`}>
                        {reminder.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-3">
                      {/* Date Badge */}
                      {reminder.due_date && (
                        <div className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl border text-[9px] sm:text-[11px] font-black uppercase tracking-wider ${overdue ? 'bg-red-50 border-red-100 text-[#ff4d4d]' : 'bg-slate-50 border-slate-100 text-slate-500'
                          }`}>
                          <svg className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="hidden sm:inline">{formatDate(reminder.due_date)}</span>
                          <span className="sm:hidden">{formatDate(reminder.due_date).split(',')[0]}</span>
                          {overdue && <span className="ml-0.5 sm:ml-1 opacity-70 hidden sm:inline">(Overdue)</span>}
                        </div>
                      )}

                      {/* Priority Badge */}
                      <span className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl border text-[8px] sm:text-[10px] font-black uppercase tracking-widest ${reminder.priority === 'high' ? 'bg-red-50 text-[#ff4d4d] border-red-100' :
                        reminder.priority === 'medium' ? 'bg-amber-50 text-[#ffb800] border-amber-100' :
                          'bg-blue-50 text-[#2d5bff] border-blue-100'
                        }`}>
                        {reminder.priority}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Menu (Delete) - Highlighted Red */}
                <button
                  onClick={() => reminder.is_completed && onDelete(reminder.id)}
                  disabled={!reminder.is_completed}
                  className={`p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl transition-all duration-200 ${reminder.is_completed
                    ? 'text-white bg-[#ff4d4d] opacity-100 cursor-pointer shadow-lg shadow-red-500/30 hover:bg-[#ff3333] hover:shadow-xl hover:shadow-red-500/40 sm:hover:scale-110'
                    : 'text-slate-300 opacity-40 pointer-events-none cursor-default'
                    }`}
                  title={reminder.is_completed ? "Delete" : "Complete task to delete"}
                >
                  <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {/* Modal for Reminder Details */}
      {selectedReminder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedReminder(null)}
        >
          <div
            className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header - Blue Theme */}
            <div className="relative p-4 sm:p-6 md:p-8 rounded-t-xl sm:rounded-t-2xl bg-gradient-to-r from-[#2d5bff] via-[#4a69ff] to-[#6366f1]">
              <button
                onClick={() => setSelectedReminder(null)}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1.5 sm:p-2 rounded-full bg-white/20 hover:bg-white/30 transition-all text-white"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <div className="flex items-start gap-3 sm:gap-4 pr-8 sm:pr-10">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2 sm:mb-3">
                    <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider ${selectedReminder.priority === 'high'
                      ? 'bg-red-100 text-red-700'
                      : selectedReminder.priority === 'medium'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-blue-100 text-blue-700'
                      }`}>
                      {selectedReminder.priority} Priority
                    </span>
                    {!!selectedReminder.is_completed && (
                      <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-green-100 text-green-700">
                        Completed
                      </span>
                    )}
                  </div>
                  <h2 className={`text-xl sm:text-2xl md:text-3xl font-black text-white mb-1 ${selectedReminder.is_completed ? 'line-through ' : ''}`}>
                    {selectedReminder.title}
                  </h2>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
              {/* Description */}
              {selectedReminder.description && (
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                    Description
                  </h3>
                  <p className="text-sm sm:text-base md:text-lg text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {selectedReminder.description}
                  </p>
                </div>
              )}

              {/* Due Date */}
              {selectedReminder.due_date && (
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                    Due Date
                  </h3>
                  <div className={`flex flex-wrap items-center gap-2 text-sm sm:text-base md:text-lg font-semibold ${isOverdue(selectedReminder.due_date, selectedReminder.is_completed)
                    ? 'text-red-600'
                    : 'text-slate-700'
                    }`}>
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>{formatDate(selectedReminder.due_date)}</span>
                    {isOverdue(selectedReminder.due_date, selectedReminder.is_completed) && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] sm:text-xs font-bold rounded-full">
                        OVERDUE
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-slate-200">
                <button
                  onClick={() => {
                    onToggle(selectedReminder.id, selectedReminder.is_completed);
                    setSelectedReminder(null);
                  }}
                  className={`flex-1 py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm transition-all ${selectedReminder.is_completed
                    ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    : 'bg-[#2d5bff] text-white hover:bg-[#1e4bd8]'
                    }`}
                >
                  {selectedReminder.is_completed ? 'Mark as Incomplete' : 'Mark as Complete'}
                </button>

                {!!selectedReminder.is_completed && (
                  <button
                    onClick={() => {
                      onDelete(selectedReminder.id);
                      setSelectedReminder(null);
                    }}
                    className="flex-1 sm:flex-none py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm bg-[#ff4d4d] text-white hover:bg-[#ff3333] transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReminderList;
