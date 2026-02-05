import { useState, useEffect } from 'react';
import { getGuests, createGuest } from '../../api/Hotel/hotelApi';
import toast from 'react-hot-toast';
import { FaUserCircle, FaPlus, FaSearch, FaIdCard, FaPhone } from 'react-icons/fa';

const HotelGuests = () => {
    const [guests, setGuests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ name: '', phone: '', email: '', id_proof_type: 'Aadhar', id_proof_number: '', address: '' });

    const fetchGuests = async () => {
        try {
            const res = await getGuests();
            setGuests(res.data.data);
        } catch (error) {
            toast.error("Failed to load guests");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchGuests(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await createGuest(form);
            toast.success("Guest added");
            setShowModal(false);
            setForm({ name: '', phone: '', email: '', id_proof_type: 'Aadhar', id_proof_number: '', address: '' });
            fetchGuests();
        } catch (error) {
            toast.error("Failed to add guest");
        }
    };

    const filteredGuests = guests.filter(g => g.name.toLowerCase().includes(search.toLowerCase()) || g.phone.includes(search));

    return (
        <div className="min-h-screen bg-[#f8fafc] p-6 md:p-12 font-['Outfit']">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3"><FaUserCircle className="text-emerald-600" /> Guest Directory</h1>
                    <button onClick={() => setShowModal(true)} className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg hover:bg-emerald-700 transition-all flex items-center gap-2"><FaPlus /> Add Guest</button>
                </div>

                <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 mb-8 flex items-center gap-4">
                    <FaSearch className="text-slate-400 ml-2" />
                    <input className="w-full outline-none font-bold text-slate-700" placeholder="Search guests..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>

                <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Name</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Contact</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">ID Proof</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest hidden md:table-cell">Address</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredGuests.map(g => (
                                <tr key={g.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-8 py-5 font-bold text-slate-800">{g.name}</td>
                                    <td className="px-8 py-5 text-sm text-slate-600"><div className="flex items-center gap-2"><FaPhone className="text-emerald-400" size={12} /> {g.phone}</div><div className="text-xs text-slate-400 mt-1">{g.email}</div></td>
                                    <td className="px-8 py-5 text-sm text-slate-600"><span className="px-2 py-1 bg-slate-100 rounded text-xs font-bold">{g.id_proof_type}</span> <span className="text-xs ml-1">{g.id_proof_number}</span></td>
                                    <td className="px-8 py-5 text-sm text-slate-500 hidden md:table-cell max-w-xs truncate">{g.address}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredGuests.length === 0 && <div className="p-8 text-center text-slate-400 font-bold">No guests found.</div>}
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-[32px] p-8 w-full max-w-md shadow-2xl">
                        <h2 className="text-2xl font-black text-slate-800 mb-6">New Guest</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input required placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none" />
                            <input required placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none" />
                            <input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none" />
                            <div className="grid grid-cols-2 gap-4">
                                <select value={form.id_proof_type} onChange={e => setForm({ ...form, id_proof_type: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none"><option>Aadhar</option><option>Passport</option><option>Driving License</option></select>
                                <input placeholder="ID Number" value={form.id_proof_number} onChange={e => setForm({ ...form, id_proof_number: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none" />
                            </div>
                            <textarea placeholder="Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none" rows="2" />
                            <div className="flex gap-4 mt-6">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-slate-100 rounded-2xl font-black text-slate-500 uppercase tracking-widest text-xs">Cancel</button>
                                <button type="submit" className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HotelGuests;
