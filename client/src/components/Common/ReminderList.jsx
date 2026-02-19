import { useState } from 'react';
import toast from 'react-hot-toast';
import { Trash2, X, Calendar, Clock, AlertCircle, Repeat, Tag, CheckSquare, Square, Edit } from 'lucide-react';

function ReminderList({ reminders, onToggle, onDelete, isSelectionMode, selectedIds, onSelect, onEdit, readOnly = false }) {
  const [selectedReminder, setSelectedReminder] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const isOverdue = (date, completed) => {
    if (!date || completed) return false;
    return new Date(date) < new Date();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    return `${day}/${month}/${year} ${formattedHours}:${minutes} ${ampm}`;
  };

  const priorityStyles = {
    high: 'bg-red-50 text-[#ff4d4d] border-red-100',
    medium: 'bg-amber-50 text-[#ffb800] border-amber-100',
    low: 'bg-slate-100 text-slate-500 border-slate-200',
  };

  const categoryColors = {
    Work: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    Personal: 'bg-pink-50 text-pink-600 border-pink-100',
    Health: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    Study: 'bg-violet-50 text-violet-600 border-violet-100',
    Finance: 'bg-cyan-50 text-cyan-600 border-cyan-100',
    General: 'bg-gray-50 text-gray-600 border-gray-100'
  };

  return (
    <div className="space-y-[16px]">
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
            onClick={() => isSelectionMode && onSelect && onSelect(reminder.id)}
            className={`group relative flex flex-col gap-[8px] sm:gap-[16px] p-[4px] rounded-[16px] sm:rounded-[24px] transition-all duration-300 bg-white border shadow-sm hover:shadow-xl sm:hover:scale-[1.01] ${isSelectionMode && selectedIds?.includes(reminder.id) ? 'border-[#2d5bff] ring-2 ring-[#2d5bff]/20' : 'border-slate-200'
              } ${isSelectionMode ? 'cursor-pointer' : ''}`}
          >
            <div className={`flex flex-col gap-[12px] sm:gap-[20px] p-[14px] sm:p-[20px] rounded-[14px] sm:rounded-[22px] ${contentStyle}`}>
              {/* Priority Pulse Indicator (Side) */}
              {!reminder.is_completed && (
                <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-[4px] sm:w-[6px] h-1/2 rounded-r-full ${priorityColors[reminder.priority]?.bg || 'bg-slate-200'}`} />
              )}

              <div className="flex items-start justify-between gap-[8px] sm:gap-[16px]">
                <div className="flex items-start gap-[8px] sm:gap-[16px] flex-1 min-w-0">

                  {/* Status Toggle OR Selection Checkbox */}
                  {isSelectionMode ? (
                    <div className={`mt-[2px] sm:mt-[4px] shrink-0 w-[20px] h-[20px] sm:w-[24px] sm:h-[24px] flex items-center justify-center transition-colors cursor-pointer ${selectedIds?.includes(reminder.id) ? 'text-[#2d5bff]' : 'text-slate-300'}`}>
                      {selectedIds?.includes(reminder.id) ? <CheckSquare className="w-[20px] h-[20px] sm:w-[24px] sm:h-[24px]" /> : <Square className="w-[20px] h-[20px] sm:w-[24px] sm:h-[24px]" />}
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!readOnly) onToggle(reminder.id, reminder.is_completed);
                      }}
                      className={`mt-[2px] sm:mt-[4px] shrink-0 w-[20px] h-[20px] sm:w-[24px] sm:h-[24px] rounded-full border-2 transition-all flex items-center justify-center shadow-sm z-10 ${readOnly ? 'cursor-default' : 'cursor-pointer'} ${reminder.is_completed
                        ? 'bg-[#2d5bff] border-[#2d5bff] shadow-blue-500/30'
                        : 'border-slate-300 hover:border-[#2d5bff] bg-white'
                        }`}
                      disabled={readOnly}
                    >
                      {!!reminder.is_completed && (
                        <div className="w-[8px] h-[8px] sm:w-[10px] sm:h-[10px] bg-white rounded-full"></div>
                      )}
                    </button>
                  )}

                  <div
                    className="flex-1 min-w-0"
                    onClick={() => {
                      if (!isSelectionMode && !readOnly) setSelectedReminder(reminder);
                    }}
                  >
                    <div className="flex items-center gap-[6px] sm:gap-[10px] mb-[4px] sm:mb-[6px]">
                      <h3 className={`text-[15px] sm:text-[18px] md:text-[20px] font-black tracking-tight truncate ${reminder.is_completed ? 'text-slate-400 line-through' : 'text-slate-800'
                        }`}>
                        {reminder.title}
                      </h3>
                      {/* Recurrence Icon */}
                      {reminder.recurrence_type && reminder.recurrence_type !== 'none' && (
                        <Repeat className="w-[14px] h-[14px] text-slate-400" />
                      )}
                    </div>

                    {reminder.description && (
                      <p className={`text-[12px] sm:text-[13px] font-medium leading-[1.6] mb-[12px] sm:mb-[20px] line-clamp-2 ${reminder.is_completed ? 'text-slate-300' : 'text-slate-500'
                        }`}>
                        {reminder.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-[8px] sm:gap-[12px]">
                      {/* Date Badge */}
                      {reminder.due_date && (
                        <div className={`flex items-center gap-[6px] sm:gap-[8px] px-[10px] sm:px-[14px] py-[5px] sm:py-[7px] rounded-[10px] sm:rounded-[14px] border text-[10px] sm:text-[11px] font-black uppercase tracking-wider ${overdue ? 'bg-red-50 border-red-100 text-[#ff4d4d]' : 'bg-white/80 border-slate-100 text-slate-500'
                          }`}>
                          <Calendar className="w-[12px] h-[12px] sm:w-[15px] sm:h-[15px] shrink-0" />
                          <span className="truncate">{formatDate(reminder.due_date)}</span>
                        </div>
                      )}

                      {/* Priority Badge */}
                      <span className={`px-[10px] sm:px-[14px] py-[5px] sm:py-[7px] rounded-[10px] sm:rounded-[14px] border text-[9px] sm:text-[11px] font-black uppercase tracking-widest shadow-sm ${reminder.priority === 'high' ? 'bg-red-50 text-[#ff4d4d] border-red-100' :
                        reminder.priority === 'medium' ? 'bg-amber-50 text-[#ffb800] border-amber-100' :
                          'bg-blue-50 text-[#2d5bff] border-blue-100'
                        }`}>
                        {reminder.priority}
                      </span>

                      {/* Category Badge */}
                      {reminder.category && (
                        <span className={`px-[10px] sm:px-[14px] py-[5px] sm:py-[7px] rounded-[10px] sm:rounded-[14px] border text-[9px] sm:text-[11px] font-black uppercase tracking-widest shadow-sm ${categoryColors[reminder.category] || categoryColors.General}`}>
                          {reminder.category}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Menu (Delete) - Highlighted Red */}
                {!readOnly && (
                  <button
                    onClick={() => reminder.is_completed && setDeleteId(reminder.id)}
                    disabled={!reminder.is_completed}
                    className={`p-[6px] sm:p-[10px] rounded-[8px] sm:rounded-[12px] transition-all duration-200 ${reminder.is_completed
                      ? 'text-white bg-[#ff4d4d] opacity-100 cursor-pointer shadow-lg shadow-red-500/30 hover:bg-[#ff3333] hover:shadow-xl hover:shadow-red-500/40 sm:hover:scale-110'
                      : 'text-slate-300 opacity-40 pointer-events-none cursor-default'
                      }`}
                    title={reminder.is_completed ? "Delete" : "Complete task to delete"}
                  >
                    <Trash2 className="w-[16px] h-[16px] sm:w-[20px] sm:h-[20px]" />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Modal for Reminder Details */}
      {
        selectedReminder && (
          <div
            className="fixed inset-0 z-1000 flex items-center justify-center p-[12px] sm:p-[24px] bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setSelectedReminder(null)}
          >
            <div
              className="bg-white rounded-[24px] sm:rounded-[32px] shadow-2xl max-w-[580px] w-full max-h-[88vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header - Premium Blue Theme */}
              <div className="relative p-[24px] sm:p-[32px] shrink-0 bg-linear-to-r from-[#2d5bff] via-[#4a69ff] to-[#6366f1] overflow-hidden">
                {/* Decorative background circle */}
                <div className="absolute top-0 right-0 w-[120px] h-[120px] bg-white/10 rounded-full -mr-[60px] -mt-[60px] blur-[80px] pointer-events-none"></div>

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedReminder(null);
                  }}
                  className="absolute top-[12px] right-[12px] sm:top-[20px] sm:right-[20px] w-[32px] h-[32px] sm:w-[40px] sm:h-[40px] rounded-full bg-white/10 hover:bg-white/30 active:scale-95 transition-all text-white flex items-center justify-center cursor-pointer z-100 border border-white/20"
                  aria-label="Close modal"
                >
                  <X className="w-[18px] h-[18px] sm:w-[22px] sm:h-[22px]" />
                </button>

                <div className="relative z-10">
                  <div className="flex flex-wrap items-center gap-[6px] mb-[12px]">
                    <span className={`px-[10px] py-[3px] rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-[0.1em] ${selectedReminder.priority === 'high'
                      ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                      : selectedReminder.priority === 'medium'
                        ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                        : 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                      }`}>
                      {selectedReminder.priority}
                    </span>
                    {!!selectedReminder.is_completed && (
                      <span className="px-[10px] py-[3px] rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-[0.1em] bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                        Done
                      </span>
                    )}
                    {selectedReminder.category && (
                      <span className="px-[10px] py-[3px] rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-[0.1em] bg-white/20 text-white border border-white/10 backdrop-blur-md">
                        {selectedReminder.category}
                      </span>
                    )}
                  </div>
                  <div className="h-[2px] w-[32px] bg-white/40 rounded-full mb-[12px]"></div>
                  <h2 className={`text-[22px] sm:text-[28px] font-black text-white leading-[1.1] wrap-break-word ${selectedReminder.is_completed ? 'line-through opacity-80' : ''}`}>
                    {selectedReminder.title}
                  </h2>
                </div>
              </div>

              {/* Modal Body - Scrollable */}
              <div className="p-[20px] sm:p-[28px] overflow-y-auto custom-scrollbar flex-1 bg-slate-50/30">
                <div className="space-y-[24px]">
                  {/* Description Section */}
                  {selectedReminder.description && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-[8px] flex items-center gap-[6px]">
                        <AlertCircle className="w-[14px] h-[14px] text-[#2d5bff]" />
                        Description
                      </h3>
                      <div className="bg-white rounded-[16px] p-[16px] sm:p-[20px] border border-slate-100 max-h-[220px] overflow-y-auto custom-scrollbar shadow-sm">
                        <p className="text-[13px] sm:text-[15px] text-slate-600 leading-relaxed whitespace-pre-wrap font-medium wrap-break-word">
                          {selectedReminder.description}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px] sm:gap-[16px]">
                    {/* Due Date */}
                    {selectedReminder.due_date && (
                      <div className="bg-white rounded-[16px] p-[16px] border border-slate-100 shadow-sm hover:border-[#2d5bff]/20 transition-colors group/meta">
                        <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-[6px] flex items-center gap-[8px]">
                          <Calendar className="w-[12px] h-[12px] text-[#ff4d4d] group-hover/meta:scale-110 transition-transform" />
                          Due Date
                        </h3>
                        <div className={`text-[13px] sm:text-[15px] font-black flex items-center flex-wrap gap-[8px] ${isOverdue(selectedReminder.due_date, selectedReminder.is_completed)
                          ? 'text-[#ff4d4d]'
                          : 'text-slate-800'
                          }`}>
                          {formatDate(selectedReminder.due_date)}
                          {isOverdue(selectedReminder.due_date, selectedReminder.is_completed) && (
                            <span className="px-[6px] py-[1.5px] bg-red-50 text-red-500 text-[9px] font-black rounded-[4px] uppercase tracking-wider border border-red-100">
                              Overdue
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Recurrence */}
                    {selectedReminder.recurrence_type && selectedReminder.recurrence_type !== 'none' && (
                      <div className="bg-white rounded-[16px] p-[16px] border border-slate-100 shadow-sm hover:border-[#2d5bff]/20 transition-colors group/meta">
                        <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-[6px] flex items-center gap-[8px]">
                          <Repeat className="w-[12px] h-[12px] text-[#2d5bff] group-hover/meta:scale-110 transition-transform" />
                          Repeats
                        </h3>
                        <div className="text-[13px] sm:text-[15px] font-black text-slate-800 capitalize">
                          {selectedReminder.recurrence_type}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer - Fixed Actions */}
              <div className="p-[20px] sm:p-[24px] shrink-0 bg-white border-t border-slate-100">
                {!readOnly && (
                  <div className="flex items-center gap-[10px]">
                    <button
                      onClick={() => {
                        onToggle(selectedReminder.id, selectedReminder.is_completed);
                        setSelectedReminder(null);
                      }}
                      className={`flex-1 py-[12px] px-[16px] rounded-[14px] font-black text-[11px] sm:text-[12px] transition-all shadow-lg active:scale-[0.97] cursor-pointer tracking-wider flex items-center justify-center gap-[8px] ${selectedReminder.is_completed
                        ? 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        : 'bg-linear-to-r from-[#2d5bff] to-[#4a69ff] text-white hover:shadow-blue-500/25'
                        }`}
                    >
                      {selectedReminder.is_completed ? (
                        <>MARK AS ACTIVE</>
                      ) : (
                        <>MARK AS COMPLETE</>
                      )}
                    </button>

                    {!selectedReminder.is_completed && onEdit && (
                      <button
                        onClick={() => {
                          onEdit(selectedReminder);
                          setSelectedReminder(null);
                        }}
                        className="flex-1 py-[12px] px-[16px] rounded-[14px] font-black text-[11px] sm:text-[12px] bg-white text-[#2d5bff] border border-[#2d5bff]/20 hover:border-[#2d5bff] hover:bg-blue-50 transition-all flex items-center justify-center gap-[6px] shadow-sm active:scale-[0.97] cursor-pointer uppercase tracking-wider"
                      >
                        <Edit className="w-[14px] h-[14px]" />
                        EDIT
                      </button>
                    )}

                    {!!selectedReminder.is_completed && (
                      <button
                        onClick={() => {
                          setDeleteId(selectedReminder.id);
                          setSelectedReminder(null);
                        }}
                        className="py-[12px] px-[20px] rounded-[14px] font-black text-[11px] sm:text-[12px] bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-[6px] shadow-sm active:scale-[0.97] cursor-pointer"
                      >
                        <Trash2 className="w-[14px] h-[14px]" />
                        DELETE
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      }
      {/* Delete Confirmation Modal */}
      {
        deleteId && (
          <div className="fixed inset-0 z-1100 flex items-center justify-center p-[16px] bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white rounded-[32px] p-[24px] sm:p-[32px] w-full max-w-[380px] shadow-2xl animate-in zoom-in-95 duration-200 border border-white">
              <div className="flex flex-col items-center text-center">
                <div className="w-[64px] h-[64px] bg-red-50 rounded-full flex items-center justify-center mb-[24px] border border-red-100 shadow-lg shadow-red-500/10">
                  <Trash2 className="w-[32px] h-[32px] text-[#ff4d4d] animate-bounce" />
                </div>
                <h3 className="text-[20px] font-black text-slate-800 mb-[8px] uppercase tracking-tighter">Are you sure?</h3>
                <p className="text-slate-500 text-[13px] font-medium mb-[32px]">
                  This action cannot be undone. This reminder will be permanently deleted from your timeline.
                </p>
                <div className="flex w-full gap-[12px]">
                  <button
                    onClick={() => setDeleteId(null)}
                    className="flex-1 py-[12px] px-[20px] rounded-[16px] font-black text-[12px] tracking-widest uppercase border border-slate-200 text-slate-500 hover:bg-slate-50 transition-all active:scale-95 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      onDelete(deleteId);
                      setDeleteId(null);
                    }}
                    className="flex-1 py-[12px] px-[20px] rounded-[16px] font-black text-[12px] tracking-widest uppercase bg-[#ff4d4d] text-white shadow-lg shadow-red-500/20 hover:bg-[#ff3333] hover:shadow-xl transition-all active:scale-95 cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}

export default ReminderList;
