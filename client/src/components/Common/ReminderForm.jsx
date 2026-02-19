import { useState, useEffect } from 'react';
import { FaChevronDown, FaPlus } from 'react-icons/fa';

function ReminderForm({ onAdd, categories = [], onManageCategories, initialData }) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [dueDate, setDueDate] = useState(initialData?.due_date ? new Date(initialData.due_date).toISOString().slice(0, 16) : '');
  const [priority, setPriority] = useState(initialData?.priority || 'low');
  const [category, setCategory] = useState(initialData?.category || 'General');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setDueDate(initialData.due_date ? new Date(initialData.due_date).toISOString().slice(0, 16) : '');
      setPriority(initialData.priority || 'low');
      setCategory(initialData.category || 'General');
    }
  }, [initialData]);


  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !dueDate) return;

    onAdd({
      title,
      description,
      due_date: dueDate ? new Date(dueDate).toISOString() : '',
      priority,
      category,
    });

    if (!initialData) {
      setTitle('');
      setDescription('');
      setDueDate('');
      setPriority('low');
      setCategory(categories[0]?.name || 'General');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-[10px] sm:space-y-[16px] md:space-y-[24px]">
      {/* Title */}
      <div className="animate-in fade-in slide-in-from-left-2 duration-300">
        <label className="block text-[8.5px] sm:text-[9px] font-black text-slate-400 mb-[4px] uppercase tracking-widest ml-[2px]">
          What's on your mind?
        </label>
        <div className="relative group/input">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-50/50 border border-slate-200 rounded-[10px] px-[14px] h-[38px] sm:h-[42px] text-slate-800 text-[13px] sm:text-[14px] placeholder:text-slate-400 font-bold outline-none focus:border-[#2d5bff] focus:bg-white focus:ring-4 focus:ring-[#2d5bff]/5 transition-all duration-300 shadow-sm"
            placeholder="Enter task title..."
            required
          />
          <div className="absolute inset-x-[14px] bottom-0 h-[1.5px] bg-[#2d5bff] scale-x-0 group-focus-within/input:scale-x-100 transition-transform duration-500 rounded-full"></div>
        </div>
      </div>

      {/* Description */}
      <div className="animate-in fade-in slide-in-from-left-2 duration-300 [animation-delay:100ms]">
        <label className="block text-[8.5px] sm:text-[9px] font-black text-slate-400 mb-[4px] uppercase tracking-widest ml-[2px]">
          Add context (Optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-slate-50/50 border border-slate-200 rounded-[10px] px-[14px] py-[10px] text-slate-800 resize-none h-[70px] sm:h-[80px] text-[12px] sm:text-[13px] overflow-y-auto custom-scrollbar placeholder:text-slate-400 font-bold outline-none focus:border-[#2d5bff] focus:bg-white focus:ring-4 focus:ring-[#2d5bff]/5 transition-all duration-300 shadow-sm"
          placeholder="Detailed description goes here..."
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-[10px] sm:gap-[12px] animate-in fade-in slide-in-from-left-2 duration-300 [animation-delay:200ms]">
        {/* Date & Time */}
        <div>
          <label className="block text-[8.5px] sm:text-[9px] font-black text-slate-400 mb-[4px] uppercase tracking-widest ml-[2px]">
            When is it due?
          </label>
          <input
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
            className="w-full bg-slate-50/50 border border-slate-200 rounded-[10px] px-[14px] h-[38px] sm:h-[42px] text-slate-800 text-[12px] sm:text-[13px] font-bold outline-none focus:border-[#2d5bff] focus:bg-white focus:ring-4 focus:ring-[#2d5bff]/5 transition-all duration-300 shadow-sm cursor-pointer"
            required
          />
        </div>

        {/* Priority */}
        <div>
          <label className="block text-[8.5px] sm:text-[9px] font-black text-slate-400 mb-[4px] uppercase tracking-widest ml-[2px]">
            Importance level
          </label>
          <div className="relative group/select">
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className={`w-full border-2 rounded-[10px] px-[14px] h-[38px] sm:h-[42px] transition-all duration-300 appearance-none cursor-pointer font-black text-[11px] sm:text-[12px] tracking-wide ${priority === 'high'
                ? 'bg-red-50/50 border-red-200 text-red-600 focus:ring-red-500/10 focus:border-red-500'
                : priority === 'medium'
                  ? 'bg-amber-50/50 border-amber-200 text-amber-600 focus:ring-amber-500/10 focus:border-amber-500'
                  : 'bg-blue-50/50 border-blue-200 text-blue-600 focus:ring-blue-500/10 focus:border-blue-500'
                }`}
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
            <FaChevronDown className={`absolute right-[12px] top-1/2 -translate-y-1/2 w-[12px] h-[12px] pointer-events-none transition-transform duration-300 group-focus-within/select:rotate-180 ${priority === 'high' ? 'text-red-400' : priority === 'medium' ? 'text-amber-400' : 'text-blue-400'}`} />
          </div>
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-left-2 duration-300 [animation-delay:300ms]">
        {/* Category */}
        <div className="sm:col-span-2">
          <label className="block text-[8.5px] sm:text-[9px] font-black text-slate-400 mb-[4px] uppercase tracking-widest ml-[2px]">
            Organize under
          </label>
          <div className="flex gap-[8px]">
            <div className="relative flex-1 group/select">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50/50 border border-slate-200 rounded-[10px] px-[14px] h-[38px] sm:h-[42px] text-slate-800 text-[12px] sm:text-[13px] font-bold appearance-none cursor-pointer outline-none focus:border-[#2d5bff] focus:bg-white focus:ring-4 focus:ring-[#2d5bff]/5 transition-all duration-300 shadow-sm"
              >
                {Array.isArray(categories) && categories.map((cat) => (
                  <option key={cat.id || cat.name} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <FaChevronDown className="absolute right-[12px] top-1/2 -translate-y-1/2 w-[12px] h-[12px] text-slate-400 pointer-events-none transition-transform duration-300 group-focus-within/select:rotate-180" />
            </div>
            {onManageCategories && (
              <button
                type="button"
                onClick={onManageCategories}
                className="h-[38px] sm:h-[42px] w-[38px] sm:w-[42px] bg-slate-100 text-[#2d5bff] rounded-[10px] flex items-center justify-center hover:bg-[#2d5bff] hover:text-white transition-all duration-300 border border-slate-200 shadow-sm active:scale-95 group/plus"
                title="Manage Categories"
              >
                <FaPlus className="w-[16px] h-[16px] group-hover/plus:rotate-90 transition-transform duration-300" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="w-full bg-[#1a1c21] hover:bg-[#2d5bff] text-white font-black h-[42px] sm:h-[46px] rounded-[12px] active:scale-[0.98] sm:hover:scale-[1.01] transition-all duration-300 shadow-xl shadow-slate-900/10 text-[12px] sm:text-[13px] mt-[6px] cursor-pointer flex items-center justify-center uppercase tracking-[0.15em] group/btn animate-in fade-in slide-in-from-bottom-2"
      >
        <span className="group-hover/btn:translate-x-1 transition-transform duration-300">
          {initialData ? 'Update Task' : 'Create New Task'}
        </span>
      </button>
    </form>
  );
}

export default ReminderForm;
