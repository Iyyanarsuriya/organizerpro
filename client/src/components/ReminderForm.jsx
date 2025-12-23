import { useState } from 'react';

function ReminderForm({ onAdd }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('low');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title) return;

    onAdd({
      title,
      description,
      due_date: dueDate ? new Date(dueDate).toISOString() : '',
      priority,
    });

    setTitle('');
    setDescription('');
    setDueDate('');
    setPriority('low');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 md:space-y-6">
      {/* Title */}
      <div>
        <label className="block text-xs sm:text-sm font-semibold text-slate-500 mb-1.5 sm:mb-2">
          Title
        </label>
        <div className="relative">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-slate-800 input-focus text-xs sm:text-sm md:text-base placeholder:text-slate-400 font-medium"
            placeholder="What needs to be done?"
            required
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs sm:text-sm font-semibold text-slate-500 mb-1.5 sm:mb-2">
          Description (Optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-slate-800 input-focus resize-none h-16 sm:h-20 md:h-24 text-xs sm:text-sm md:text-base overflow-y-auto custom-scrollbar placeholder:text-slate-400 font-medium"
          placeholder="Add more details..."
        />
      </div>

      {/* Date & Time Picker */}
      <div>
        <label className="block text-xs sm:text-sm font-semibold text-slate-500 mb-1.5 sm:mb-2">
          Due Date & Time
        </label>
        <input
          type="datetime-local"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          min={new Date().toISOString().slice(0, 16)}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-slate-800 input-focus text-xs sm:text-sm md:text-base placeholder:text-slate-400 font-medium"
        />
      </div>

      {/* Priority */}
      <div>
        <label className="block text-xs sm:text-sm font-semibold text-slate-500 mb-1.5 sm:mb-2">
          Priority
        </label>
        <div className="relative group/select">
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className={`w-full border-2 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 focus:outline-none focus:ring-4 transition-all appearance-none cursor-pointer font-bold text-xs sm:text-sm ${priority === 'high'
              ? 'bg-red-50 border-red-300 text-red-700 focus:border-red-500 focus:ring-red-500/20'
              : priority === 'medium'
                ? 'bg-amber-50 border-amber-300 text-amber-700 focus:border-amber-500 focus:ring-amber-500/20'
                : 'bg-blue-50 border-blue-300 text-blue-700 focus:border-blue-500 focus:ring-blue-500/20'
              }`}
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
          <div className={`absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${priority === 'high'
            ? 'text-red-600'
            : priority === 'medium'
              ? 'text-amber-600'
              : 'text-blue-600'
            }`}>
            <svg className="w-3 sm:w-4 h-3 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="w-full bg-[#1a1c21] hover:bg-slate-800 text-white font-black py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl transform active:scale-95 sm:hover:scale-[1.02] transition-all duration-300 shadow-lg text-xs sm:text-sm md:text-base mt-2"
      >
        Create Reminder
      </button>
    </form>
  );
}

export default ReminderForm;
