import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Clock, ShoppingBag } from 'lucide-react';
import { fetchServices } from '../lib/api';
import { socket } from '../lib/socket';
import { useCart } from '../context/CartContext';
import { Service } from '../lib/types';
import Navbar from '../components/Navbar';
import ServiceCard from '../components/ServiceCard';

const CATEGORIES = ['All', 'Hair', 'Skin', 'Nails', 'Spa'];

export default function Menu() {
  const [services, setServices] = useState<Service[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [salonOpen, setSalonOpen] = useState(true);
  const { totalAmount, totalItems } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    loadServices();
    checkStatus();

    const onUpdated = (s: Service) =>
      setServices((prev) => prev.map((x) => (x.id === s.id ? s : x)));
    const onCreated = (s: Service) => setServices((prev) => [...prev, s]);
    const onDeleted = ({ id }: { id: number }) =>
      setServices((prev) => prev.filter((x) => x.id !== id));

    socket.on('service:updated', onUpdated);
    socket.on('service:created', onCreated);
    socket.on('service:deleted', onDeleted);

    return () => {
      socket.off('service:updated', onUpdated);
      socket.off('service:created', onCreated);
      socket.off('service:deleted', onDeleted);
    };
  }, []);

  async function loadServices() {
    try {
      setServices(await fetchServices());
    } catch (err) {
      console.error('Failed to load services:', err);
    } finally {
      setLoading(false);
    }
  }

  async function checkStatus() {
    try {
      const res = await fetch('/api/salon/status');
      const data = await res.json();
      setSalonOpen(data.isOpen);
    } catch { /* ignore */ }
  }

  const filtered = services.filter((s) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q);
    const matchCat = activeCategory === 'All' || s.category === activeCategory;
    return matchSearch && matchCat;
  });

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
    <div className="min-h-screen bg-gray-50 pb-24">
      <Navbar />

      {/* Hero header */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-700 text-white px-4 py-6">
        <h1 className="text-2xl font-bold">Glamour Queue</h1>
        <div className="flex items-center gap-2 mt-1">
          <Clock className="w-4 h-4" />
          <span className={`text-sm ${salonOpen ? 'text-green-200' : 'text-red-200'}`}>
            {salonOpen ? 'Open till 8 PM' : 'Closed — Opens at 9 AM'}
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-3 bg-white shadow-sm">
        <div className="relative max-w-xl mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search services…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-xl border-0
                       focus:ring-2 focus:ring-violet-500 focus:bg-white transition"
          />
        </div>
      </div>

      {/* Category tabs */}
      <div className="sticky top-14 z-10 bg-white shadow-sm px-4 py-2 flex gap-2 overflow-x-auto scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
              activeCategory === cat
                ? 'bg-violet-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="px-4 py-4 max-w-6xl mx-auto">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-lg">No services found</p>
            <p className="text-sm mt-1">Try a different search or category</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map((s) => (
              <ServiceCard key={s.id} service={s} />
            ))}
          </div>
        )}
      </div>

      {/* Sticky cart bar */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-violet-600 text-white px-4 py-3 shadow-lg z-20">
          <button
            onClick={() => navigate('/cart')}
            className="w-full flex items-center justify-between max-w-xl mx-auto"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              <span className="font-medium">
                {totalItems} service{totalItems > 1 ? 's' : ''} · ₹{totalAmount}
              </span>
            </div>
            <span className="bg-white text-violet-600 px-4 py-1.5 rounded-full text-sm font-semibold">
              View Cart →
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
