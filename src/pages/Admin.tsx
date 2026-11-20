import { useState, useEffect } from 'react';
import {
  Plus, Edit2, Trash2, TrendingUp, Users, DollarSign, Star, X,
} from 'lucide-react';
import {
  fetchServices, getAdminStats,
  createService, updateService, deleteService as deleteServiceAPI,
} from '../lib/api';
import { socket } from '../lib/socket';
import { Service, AdminStats } from '../lib/types';
import Navbar from '../components/Navbar';

const CATEGORIES = ['Hair', 'Skin', 'Nails', 'Spa'];
const TYPES = ['Quick', 'Standard', 'Premium'];

const empty = { name: '', category: 'Hair', price: '', duration: '', description: '', type: 'Standard' };

export default function Admin() {
  const [services, setServices] = useState<Service[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(empty);
  const [formErr, setFormErr] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAll();

    const onC = (s: Service) => setServices((p) => [...p, s]);
    const onU = (s: Service) => setServices((p) => p.map((x) => (x.id === s.id ? s : x)));
    const onD = ({ id }: { id: number }) => setServices((p) => p.filter((x) => x.id !== id));
    const refresh = () => loadStats();

    socket.on('service:created', onC);
    socket.on('service:updated', onU);
    socket.on('service:deleted', onD);
    socket.on('order:new', refresh);
    socket.on('order:updated', refresh);

    return () => {
      socket.off('service:created', onC);
      socket.off('service:updated', onU);
      socket.off('service:deleted', onD);
      socket.off('order:new', refresh);
      socket.off('order:updated', refresh);
    };
  }, []);

  async function loadAll() {
    try {
      const [s, st] = await Promise.all([fetchServices(), getAdminStats()]);
      setServices(s);
      setStats(st);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadStats() {
    try { setStats(await getAdminStats()); } catch { /* ignore */ }
  }

  function openAdd() {
    setForm(empty); setEditId(null); setShowForm(true); setFormErr('');
  }

  function openEdit(s: Service) {
    setForm({
      name: s.name, category: s.category, price: String(s.price),
      duration: String(s.duration), description: s.description, type: s.type,
    });
    setEditId(s.id); setShowForm(true); setFormErr('');
  }

  async function handleSave() {
    if (!form.name.trim() || !form.price || !form.duration) {
      setFormErr('Name, price, and duration are required'); return;
    }
    if (Number(form.price) <= 0 || Number(form.duration) <= 0) {
      setFormErr('Price and duration must be positive'); return;
    }

    setSaving(true); setFormErr('');
    try {
      const data = {
        name: form.name.trim(), category: form.category,
        price: Number(form.price), duration: Number(form.duration),
        description: form.description.trim(), type: form.type,
      };
      if (editId) await updateService(editId, data);
      else await createService(data);
      setShowForm(false); setForm(empty); setEditId(null);
    } catch (err: any) {
      setFormErr(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this service?')) return;
    try { await deleteServiceAPI(id); } catch (err) { console.error(err); }
  }

  async function toggleAvail(s: Service) {
    try { await updateService(s.id, { is_available: s.is_available ? 0 : 1 }); }
    catch (err) { console.error(err); }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">⚙️ Admin Dashboard</h1>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <Stat icon={<Users className="w-5 h-5" />} color="text-blue-600" label="Today's Bookings" value={stats.totalOrders} />
            <Stat icon={<DollarSign className="w-5 h-5" />} color="text-green-600" label="Revenue" value={`₹${stats.totalRevenue}`} />
            <Stat icon={<TrendingUp className="w-5 h-5" />} color="text-amber-600" label="Completed" value={stats.servicesCompleted} />
            <Stat icon={<Star className="w-5 h-5" />} color="text-violet-600" label="Top Service" value={stats.topService || '—'} small />
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Services ({services.length})</h2>
            <button
              onClick={openAdd}
              className="bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-medium
                         hover:bg-violet-700 transition flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add Service
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Category</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Price</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Duration</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Type</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-500">Available</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {services.map((s) => (
                  <tr key={s.id} className={!s.is_available ? 'bg-red-50/50' : ''}>
                    <td className="px-4 py-3 font-medium">{s.name}</td>
                    <td className="px-4 py-3 text-gray-600">{s.category}</td>
                    <td className="px-4 py-3 text-gray-600">₹{s.price}</td>
                    <td className="px-4 py-3 text-gray-600">{s.duration} min</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        s.type === 'Quick' ? 'bg-green-100 text-green-700' :
                        s.type === 'Premium' ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>{s.type}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleAvail(s)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                          s.is_available ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 rounded-full bg-white transition transform ${
                          s.is_available ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button onClick={() => openEdit(s)} className="text-blue-500 hover:text-blue-700 mr-3">
                        <Edit2 className="w-4 h-4 inline" />
                      </button>
                      <button onClick={() => handleDelete(s.id)} className="text-red-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{editId ? 'Edit Service' : 'Add New Service'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="Service Name" value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-violet-500" />
              <select value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-violet-500">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="Price (₹)" value={form.price}
                  onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-violet-500" />
                <input type="number" placeholder="Duration (min)" value={form.duration}
                  onChange={(e) => setForm((p) => ({ ...p, duration: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-violet-500" />
              </div>
              <select value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-violet-500">
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <textarea placeholder="Description (optional)" value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                rows={2}
                className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-violet-500" />
            </div>
            {formErr && <p className="text-red-500 text-sm mt-3">{formErr}</p>}
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)}
                className="flex-1 border border-gray-200 py-2.5 rounded-xl font-medium hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 bg-violet-600 text-white py-2.5 rounded-xl font-medium hover:bg-violet-700 disabled:opacity-50">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ icon, color, label, value, small }: {
  icon: React.ReactNode; color: string; label: string;
  value: string | number; small?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className={`flex items-center gap-2 ${color} mb-2`}>
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className={`font-bold ${small ? 'text-lg truncate' : 'text-3xl'}`}>{value}</p>
    </div>
  );
}
