import { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '../../api/Hotel/hotelApi';
import toast from 'react-hot-toast';
import { FaCog, FaSave } from 'react-icons/fa';

const HotelSettings = () => {
    const [form, setForm] = useState({
        property_name: '',
        property_type: 'hotel',
        currency: 'INR',
        tax_percentage: 0,
        check_in_time: '12:00:00',
        check_out_time: '11:00:00'
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await getSettings();
                if (res.data.data && Object.keys(res.data.data).length > 0) {
                    setForm(res.data.data);
                }
            } catch (error) {
                toast.error("Failed to load settings");
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await updateSettings(form);
            toast.success("Settings saved successfully");
        } catch (error) {
            toast.error("Failed to save settings");
        }
    };

    if (loading) return <div className="p-10 text-center">Loading configuration...</div>;

    return (
        <div className="min-h-screen bg-[#f8fafc] p-6 md:p-12 font-['Outfit']">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3 mb-2">
                    <FaCog className="text-slate-400" /> Configuration
                </h1>
                <p className="text-slate-500 font-medium mb-10">Configure your property rules and defaults.</p>

                <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Property Name</label>
                                <input required value={form.property_name} onChange={e => setForm({ ...form, property_name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none" />
                            </div>

                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Property Type</label>
                                <select value={form.property_type} onChange={e => setForm({ ...form, property_type: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none">
                                    <option value="hotel">Hotel</option>
                                    <option value="homestay">Homestay</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Tax Percentage (%)</label>
                                <input type="number" value={form.tax_percentage} onChange={e => setForm({ ...form, tax_percentage: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none" />
                            </div>

                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Check-in Time</label>
                                <input type="time" value={form.check_in_time} onChange={e => setForm({ ...form, check_in_time: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none" />
                            </div>

                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Check-out Time</label>
                                <input type="time" value={form.check_out_time} onChange={e => setForm({ ...form, check_out_time: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none" />
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-50">
                            <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-colors shadow-xl flex items-center justify-center gap-2">
                                <FaSave /> Save Configuration
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default HotelSettings;
