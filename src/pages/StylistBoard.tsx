import { useState, useEffect } from 'react';
import { Clock, Play, CheckCircle, Package, Scissors } from 'lucide-react';
import { getActiveOrders, updateOrderStatus } from '../lib/api';
import { socket } from '../lib/socket';
import { Order } from '../lib/types';
import Navbar from '../components/Navbar';

const COLUMNS = [
  { status: 'Placed', label: 'NEW REQUESTS', badge: 'bg-[#5b3d75]', header: 'bg-[#6b4b8b]', icon: Package },
  { status: 'InProgress', label: 'IN PROGRESS', badge: 'bg-[#9c6128]', header: 'bg-[#b87333]', icon: Play },
  { status: 'Completed', label: 'READY / COMPLETED', badge: 'bg-[#3b6b55]', header: 'bg-[#4d826a]', icon: CheckCircle },
];

const ACTIONS: Record<string, { label: string; next: string; style: string }> = {
  Placed: { label: 'Start Service', next: 'InProgress', style: 'bg-[#b87333] hover:bg-[#9c6128] text-white shadow-sm' },
  InProgress: { label: 'Mark Ready', next: 'Completed', style: 'bg-[#4d826a] hover:bg-[#3b6b55] text-white shadow-sm' },
  Completed: { label: 'Check Out Guest', next: 'CheckedOut', style: 'bg-[#34263e] hover:bg-[#513c60] text-white shadow-sm' },
};

export default function StylistBoard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    load();

    const onNew = (o: Order) => setOrders((p) => p.some((item) => item.id === o.id)
      ? p.map((item) => item.id === o.id ? o : item)
      : [...p, o]);
    const onUpdated = (u: Order) => {
      if (u.status === 'CheckedOut' || u.status === 'Cancelled') {
        setOrders((p) => p.filter((o) => o.id !== u.id));
      } else {
        setOrders((p) => p.some((o) => o.id === u.id) ? p.map((o) => (o.id === u.id ? u : o)) : [...p, u]);
      }
    };

    socket.on('order:new', onNew);
    socket.on('order:updated', onUpdated);
    return () => {
      socket.off('order:new', onNew);
      socket.off('order:updated', onUpdated);
    };
  }, []);

  async function load() {
    try {
      setOrders(await getActiveOrders());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(orderId: number, nextStatus: string) {
    setUpdating(orderId);
    setActionError('');
    try {
      await updateOrderStatus(orderId, nextStatus);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not update that token');
    } finally {
      setUpdating(null);
    }
  }

  function bookedAt(created: string) {
    const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(created);
    return new Date(hasTimezone ? created : `${created.replace(' ', 'T')}Z`).getTime();
  }

  function elapsed(created: string): string {
    const diff = Date.now() - bookedAt(created);
    const m = Math.floor(diff / 60000);
    if (!Number.isFinite(m) || m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    return `${Math.floor(m / 60)}h ${m % 60}m`;
  }

  const isOld = (created: string) => Date.now() - bookedAt(created) > 20 * 60000;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fffdfb]">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6b4b8b]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fffdfb] text-[#34263e]">
      <Navbar />

      <main className="px-4 py-8 max-w-7xl mx-auto sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-100 bg-[#f4eef6] px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[#765b80]">
              <Scissors className="h-3.5 w-3.5 text-[#6b4b8b]" /> Stylist Board · Active Queue
            </div>
            <h1 className="mt-2 font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#34263e]">
              Salon Floor & Stations
            </h1>
            <p className="mt-1 text-sm text-[#786b7b]">
              Drag forward or advance each guest through consultation, service, and checkout.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#8c7892]">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            Live sync active ({orders.length} in queue)
          </div>
        </div>

        {actionError && (
          <p role="alert" className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {actionError}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {COLUMNS.map((col) => {
            const colOrders = orders.filter((o) => o.status === col.status);
            const Icon = col.icon;

            return (
              <div
                key={col.status}
                className="bg-white rounded-3xl border border-[#eee6f0] shadow-[0_4px_24px_rgba(73,49,87,0.04)] overflow-hidden flex flex-col"
              >
                {/* Column Header */}
                <div className={`${col.header} text-white px-5 py-4 flex items-center justify-between`}>
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-5 h-5 opacity-90" />
                    <span className="font-extrabold text-xs tracking-wider uppercase">{col.label}</span>
                  </div>
                  <span className={`${col.badge} px-2.5 py-0.5 rounded-full text-xs font-black shadow-inner`}>
                    {colOrders.length}
                  </span>
                </div>

                {/* Orders List */}
                <div className="p-4 space-y-3.5 flex-1 min-h-[300px] bg-[#fbf9fc]/40">
                  {colOrders.length === 0 && (
                    <div className="h-48 flex flex-col items-center justify-center text-center p-4 border border-dashed border-[#e6dce8] rounded-2xl text-[#a394a8]">
                      <Icon className="w-8 h-8 mb-2 opacity-30" />
                      <p className="text-sm font-semibold">No clients in this queue</p>
                      <p className="text-xs text-[#b8abbd] mt-0.5">New bookings appear here instantly</p>
                    </div>
                  )}

                  {colOrders.map((order) => {
                    const action = ACTIONS[order.status];
                    const aged = isOld(order.created_at);

                    return (
                      <div
                        key={order.id}
                        className={`rounded-2xl p-4 bg-white transition duration-200 border ${
                          aged
                            ? 'border-rose-300 bg-rose-50/40 shadow-sm ring-1 ring-rose-200'
                            : 'border-[#ede5ef] hover:border-[#d9cadc] hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <span className="font-serif text-3xl font-extrabold text-[#6b4b8b] tracking-tight">
                              #{order.token_number}
                            </span>
                            <h3 className="font-bold text-sm text-[#34263e] mt-0.5 leading-snug">
                              {order.customer_name}
                            </h3>
                          </div>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                              aged ? 'bg-rose-100 text-rose-700' : 'bg-[#f4eef6] text-[#765b80]'
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            {elapsed(order.created_at)}
                          </span>
                        </div>

                        {/* Service items */}
                        <div className="my-3 space-y-1 rounded-xl bg-[#faf6fc] p-2.5 border border-[#f0e8f2]">
                          {order.items?.map((item, i) => (
                            <div key={i} className="flex justify-between items-center text-xs">
                              <span className="text-[#59475f] font-medium truncate">
                                {item.service_name}
                              </span>
                              <span className="text-[#8c7892] font-bold ml-2 shrink-0">
                                × {item.quantity}
                              </span>
                            </div>
                          ))}
                          <div className="pt-1.5 mt-1 border-t border-[#e8dbe9] flex justify-between text-xs font-bold text-[#6b4b8b]">
                            <span>Total</span>
                            <span>₹{order.total}</span>
                          </div>
                        </div>

                        {/* Action button */}
                        {action && (
                          <button
                            onClick={() => handleAction(order.id, action.next)}
                            disabled={updating === order.id}
                            className={`w-full py-2.5 rounded-full text-xs font-black tracking-wide uppercase transition active:scale-[0.98] ${action.style} disabled:opacity-50`}
                          >
                            {updating === order.id ? 'Updating…' : action.label}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
