import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

function ReminderForm({ onAdd, categories = [] }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('low');
  const [category, setCategory] = useState('General');
  const [recurrenceType, setRecurrenceType] = useState('none');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title) return;

    onAdd({
      title,
      description,
      due_date: dueDate ? new Date(dueDate).toISOString() : '',
      priority,
      category,
      recurrence_type: recurrenceType,
    });

    setTitle('');
    setDescription('');
    setDueDate('');
    setPriority('low');
    setCategory(categories[0]?.name || 'General');
    setRecurrenceType('none');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-[10px] sm:space-y-[16px] md:space-y-[24px]">
      {/* Title */}
      <div>
        <label className="block text-[8px] sm:text-[9px] md:text-[10px] font-bold text-slate-400 mb-[4px] sm:mb-[6px] md:mb-[7px] uppercase tracking-widest">
          Title
        </label>
        <div className="relative">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-[8px] sm:rounded-[10px] md:rounded-[11px] px-[12px] sm:px-[14px] md:px-[15px] h-[32px] sm:h-[36px] md:h-[38px] text-slate-800 input-focus text-[11px] sm:text-[12px] md:text-[13px] placeholder:text-slate-400 font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
            placeholder="What needs to be done?"
            required
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-[8px] sm:text-[9px] md:text-[10px] font-bold text-slate-400 mb-[4px] sm:mb-[6px] md:mb-[7px] uppercase tracking-widest">
          Description (Optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-[8px] sm:rounded-[10px] md:rounded-[11px] px-[12px] sm:px-[14px] md:px-[15px] py-[8px] sm:py-[10px] md:py-[11px] text-slate-800 input-focus resize-none h-[64px] sm:h-[72px] md:h-[76px] text-[11px] sm:text-[12px] md:text-[13px] overflow-y-auto custom-scrollbar placeholder:text-slate-400 font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
          placeholder="Add more details..."
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px] sm:gap-[16px]">
        {/* Date & Time */}
        <div>
          <label className="block text-[8px] sm:text-[9px] md:text-[10px] font-bold text-slate-400 mb-[4px] sm:mb-[6px] md:mb-[7px] uppercase tracking-widest">
            Due Date & Time
          </label>
          <input
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
            className="w-full bg-slate-50 border border-slate-200 rounded-[8px] sm:rounded-[10px] md:rounded-[11px] px-[12px] sm:px-[14px] md:px-[15px] h-[32px] sm:h-[36px] md:h-[38px] text-slate-800 input-focus text-[11px] sm:text-[12px] md:text-[13px] placeholder:text-slate-400 font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
          />
        </div>

        {/* Priority */}
        <div>
          <label className="block text-[8px] sm:text-[9px] md:text-[10px] font-bold text-slate-400 mb-[4px] sm:mb-[6px] md:mb-[7px] uppercase tracking-widest">
            Priority
          </label>
          <div className="relative group/select">
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className={`w-full border-2 rounded-[8px] sm:rounded-[10px] md:rounded-[11px] px-[12px] sm:px-[14px] md:px-[15px] h-[32px] sm:h-[36px] md:h-[38px] focus:outline-none focus:ring-4 transition-all appearance-none cursor-pointer font-bold text-[11px] sm:text-[12px] md:text-[13px] ${priority === 'high'
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
            <ChevronDown className={`absolute right-[12px] top-1/2 -translate-y-1/2 w-[14px] h-[14px] sm:w-[15px] sm:h-[15px] md:w-[16px] md:h-[16px] pointer-events-none transition-colors ${priority === 'high' ? 'text-red-400' : priority === 'medium' ? 'text-amber-400' : 'text-blue-400'}`} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px] sm:gap-[16px]">
        {/* Category */}
        <div>
          <label className="block text-[8px] sm:text-[9px] md:text-[10px] font-bold text-slate-400 mb-[4px] sm:mb-[6px] md:mb-[7px] uppercase tracking-widest">
            Category
          </label>
          <div className="relative">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-[8px] sm:rounded-[10px] md:rounded-[11px] px-[12px] sm:px-[14px] md:px-[15px] h-[32px] sm:h-[36px] md:h-[38px] text-slate-800 input-focus text-[11px] sm:text-[12px] md:text-[13px] font-medium appearance-none cursor-pointer outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
            >
              {categories.map((cat) => (
                <option key={cat.id || cat.name} value={cat.name}>
                  {cat.name}
                </option>
              ))}
              {categories.length === 0 && <option value="General">General</option>}
            </select>
            <ChevronDown className="absolute right-[12px] top-1/2 -translate-y-1/2 w-[14px] h-[14px] sm:w-[15px] sm:h-[15px] md:w-[16px] md:h-[16px] text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Recurrence */}
        <div>
          <label className="block text-[8px] sm:text-[9px] md:text-[10px] font-bold text-slate-400 mb-[4px] sm:mb-[6px] md:mb-[7px] uppercase tracking-widest">
            Repeat
          </label>
          <div className="relative">
            <select
              value={recurrenceType}
              onChange={(e) => setRecurrenceType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-[8px] sm:rounded-[10px] md:rounded-[11px] px-[12px] sm:px-[14px] md:px-[15px] h-[32px] sm:h-[36px] md:h-[38px] text-slate-800 input-focus text-[11px] sm:text-[12px] md:text-[13px] font-medium appearance-none cursor-pointer outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
            >
              <option value="none">Does not repeat</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
            <ChevronDown className="absolute right-[12px] top-1/2 -translate-y-1/2 w-[14px] h-[14px] sm:w-[15px] sm:h-[15px] md:w-[16px] md:h-[16px] text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="w-full bg-[#1a1c21] hover:bg-slate-800 text-white font-black h-[36px] sm:h-[40px] md:h-[42px] px-[16px] sm:px-[20px] md:px-[22px] rounded-[8px] sm:rounded-[10px] md:rounded-[11px] transform active:scale-95 sm:hover:scale-[1.02] transition-all duration-300 shadow-lg text-[10px] sm:text-[11px] md:text-[12px] mt-[8px] cursor-pointer flex items-center justify-center uppercase tracking-widest"
      >
        Create Reminder
      </button>
    </form>
  );
}

export default ReminderForm;
