import { useState, useEffect } from 'react';
import { getUnits, createUnit, updateUnit } from '../../api/Hotel/hotelApi';
import toast from 'react-hot-toast';
import { FaHome, FaPlus, FaBed, FaBroom, FaTools, FaCheckCircle, FaDoorOpen } from 'react-icons/fa';

const HotelUnits = () => {
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Status filter
    const [filter, setFilter] = useState('all');

    const [form, setForm] = useState({
        id: null,
        unit_number: '',
        unit_type: 'room',
        category: 'Standard',
        base_price: '',
        capacity: 2,
        status: 'available',
        description: ''
    });

    const fetchUnits = async () => {
        setLoading(true);
        try {
            const res = await getUnits();
            setUnits(res.data.data);
        } catch (error) {
            toast.error("Failed to load units");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUnits();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await updateUnit(form.id, form);
                toast.success("Unit updated");
            } else {
                await createUnit(form);
                toast.success("Unit added");
            }
            setShowModal(false);
            fetchUnits();
            setForm({ id: null, unit_number: '', unit_type: 'room', category: 'Standard', base_price: '', capacity: 2, status: 'available', description: '' });
            setIsEditing(false);
        } catch (error) {
            toast.error("Operation failed");
        }
    };

    const handleEdit = (unit) => {
        setForm(unit);
        setIsEditing(true);
        setShowModal(true);
    };

    const handleQuickStatus = async (id, status) => {
        try {
            const unit = units.find(u => u.id === id);
            await updateUnit(id, { ...unit, status });
            toast.success(`Marked as ${status}`);
            fetchUnits();
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const filteredUnits = units.filter(u => filter === 'all' || u.status === filter);

    const getStatusColor = (status) => {
        switch (status) {
            case 'available': return 'bg-emerald-500 shadow-emerald-500/30';
            case 'occupied': return 'bg-rose-500 shadow-rose-500/30';
            case 'dirty': return 'bg-amber-500 shadow-amber-500/30';
            case 'maintenance': return 'bg-slate-500 shadow-slate-500/30';
            default: return 'bg-gray-500';
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] font-['Outfit'] p-6 md:p-12">
            <div className="max-w-7xl mx-auto">

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <FaHome className="text-blue-600" /> Units & Rooms
                        </h1>
                        <p className="text-slate-500 font-medium mt-1">Manage inventory, pricing, and housekeeping status.</p>
                    </div>
                    <button
                        onClick={() => { setIsEditing(false); setForm({ unit_number: '', unit_type: 'room', category: 'Standard', base_price: '', capacity: 2, status: 'available', description: '' }); setShowModal(true); }}
                        className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2"
                    >
                        <FaPlus /> Add Unit
                    </button>
                </div>

                {/* Status Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-4 mb-6 custom-scrollbar">
                    {['all', 'available', 'occupied', 'dirty', 'maintenance'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${filter === status ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'}`}
                        >
                            {status} <span className="opacity-60 ml-1">({status === 'all' ? units.length : units.filter(u => u.status === status).length})</span>
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-600"></div></div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {filteredUnits.length === 0 ? (
                            <div className="col-span-full py-20 text-center text-slate-400 font-bold bg-white rounded-[32px] border border-dashed border-slate-200">No units found matching this filter.</div>
                        ) : (
                            filteredUnits.map(unit => (
                                <div key={unit.id} className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 hover:shadow-lg transition-all group relative overflow-hidden">
                                    <div className={`absolute top-0 left-0 w-full h-1.5 ${getStatusColor(unit.status)}`}></div>

                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg shadow-lg ${getStatusColor(unit.status)}`}>
                                            {unit.status === 'available' && <FaCheckCircle />}
                                            {unit.status === 'occupied' && <FaBed />}
                                            {unit.status === 'dirty' && <FaBroom />}
                                            {unit.status === 'maintenance' && <FaTools />}
                                        </div>
                                        <div onClick={() => handleEdit(unit)} className="text-[10px] font-black uppercase tracking-widest text-slate-300 cursor-pointer hover:text-blue-600 transition-colors">Edit</div>
                                    </div>

                                    <h3 className="text-2xl font-black text-slate-800 mb-1">{unit.unit_number}</h3>
                                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">{unit.category} • {unit.unit_type}</p>

                                    <div className="flex items-center justify-between mb-6">
                                        <div className="text-slate-900 font-black text-lg">₹{unit.base_price}</div>
                                        <div className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">{unit.capacity} Guests</div>
                                    </div>

                                    {/* Action Buttons based on status */}
                                    <div className="grid grid-cols-2 gap-2">
                                        {unit.status === 'dirty' && (
                                            <button onClick={() => handleQuickStatus(unit.id, 'available')} className="col-span-2 py-2 rounded-xl bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-colors">Mark Clean</button>
                                        )}
                                        {unit.status === 'available' && (
                                            <>
                                                <button onClick={() => handleQuickStatus(unit.id, 'dirty')} className="py-2 rounded-xl bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-widest hover:bg-amber-100 transition-colors">Dirty</button>
                                                <button onClick={() => handleQuickStatus(unit.id, 'maintenance')} className="py-2 rounded-xl bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors">Fix</button>
                                            </>
                                        )}
                                        {unit.status === 'maintenance' && (
                                            <button onClick={() => handleQuickStatus(unit.id, 'available')} className="col-span-2 py-2 rounded-xl bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-widest hover:bg-green-100 transition-colors">Finish Repair</button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-[32px] p-8 w-full max-w-lg shadow-2xl">
                        <h2 className="text-2xl font-black text-slate-800 mb-6">{isEditing ? 'Edit Unit' : 'Add New Unit'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Number/Name</label>
                                    <input required value={form.unit_number} onChange={e => setForm({ ...form, unit_number: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none" placeholder="101 / Villa A" />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Type</label>
                                    <select value={form.unit_type} onChange={e => setForm({ ...form, unit_type: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none">
                                        <option value="room">Room</option>
                                        <option value="villa">Villa</option>
                                        <option value="apartment">Apartment</option>
                                        <option value="bed">Bed (Dorm)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Category</label>
                                    <input required value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none" placeholder="Standard, Deluxe..." />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Capacity</label>
                                    <input type="number" required value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none" placeholder="2" />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Base Price (₹)</label>
                                    <input type="number" required value={form.base_price} onChange={e => setForm({ ...form, base_price: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none" placeholder="0.00" />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Status</label>
                                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none">
                                        <option value="available">Available</option>
                                        <option value="occupied">Occupied</option>
                                        <option value="dirty">Dirty</option>
                                        <option value="maintenance">Maintenance</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Description</label>
                                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none" rows="2" />
                            </div>

                            <div className="flex gap-4 mt-6">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-slate-100 rounded-2xl font-black text-slate-500 uppercase tracking-widest text-xs hover:bg-slate-200 transition-colors">Cancel</button>
                                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20">Save Unit</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HotelUnits;
