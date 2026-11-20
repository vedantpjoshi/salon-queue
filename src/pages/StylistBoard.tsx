import { useState, useEffect } from 'react';
import { Clock, Play, CheckCircle, Package } from 'lucide-react';
import { getActiveOrders, updateOrderStatus } from '../lib/api';
import { socket } from '../lib/socket';
import { Order } from '../lib/types';
import Navbar from '../components/Navbar';

const COLUMNS = [
  { status: 'Placed', label: 'NEW', color: 'bg-blue-500', icon: Package },
  { status: 'InProgress', label: 'IN PROGRESS', color: 'bg-amber-500', icon: Play },
  { status: 'Completed', label: 'COMPLETED', color: 'bg-green-500', icon: CheckCircle },
];

const ACTIONS: Record<string, { label: string; next: string; color: string }> = {
  Placed: { label: 'Start', next: 'InProgress', color: 'bg-amber-500 hover:bg-amber-600' },
  InProgress: { label: 'Complete', next: 'Completed', color: 'bg-green-500 hover:bg-green-600' },
  Completed: { label: 'Check Out', next: 'CheckedOut', color: 'bg-violet-600 hover:bg-violet-700' },
};

export default function StylistBoard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    load();

    const onNew = (o: Order) => setOrders((p) => [...p, o]);
    const onUpdated = (u: Order) => {
      if (u.status === 'CheckedOut' || u.status === 'Cancelled') {
        setOrders((p) => p.filter((o) => o.id !== u.id));
      } else {
        setOrders((p) => p.map((o) => (o.id === u.id ? u : o)));
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
    try {
      await updateOrderStatus(orderId, nextStatus);
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(null);
    }
  }

  function elapsed(created: string): string {
    // Local SQLite has no timezone suffix; Postgres sends ISO timestamps in UTC.
    const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(created);
    const timestamp = new Date(hasTimezone ? created : `${created.replace(' ', 'T')}Z`).getTime();
    const diff = Date.now() - timestamp;
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    return `${Math.floor(m / 60)}h ${m % 60}m`;
  }

  const isOld = (created: string) => Date.now() - new Date(created).getTime() > 20 * 60000;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="px-4 py-4 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">💇 Stylist Board</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map((col) => {
            const colOrders = orders.filter((o) => o.status === col.status);
            const Icon = col.icon;

            return (
              <div key={col.status} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div
                  className={`${col.color} text-white px-4 py-3 flex items-center justify-between`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5" />
                    <span className="font-bold text-sm">{col.label}</span>
                  </div>
                  <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
                    {colOrders.length}
                  </span>
                </div>

                <div className="p-3 space-y-3 min-h-[200px]">
                  {colOrders.length === 0 && (
                    <p className="text-center text-gray-400 text-sm py-8">No orders</p>
                  )}

                  {colOrders.map((order) => {
                    const action = ACTIONS[order.status];
                    return (
                      <div
                        key={order.id}
                        className={`border rounded-lg p-3 transition-all ${
                          isOld(order.created_at)
                            ? 'border-red-400 bg-red-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl font-black text-violet-600">
                            #{order.token_number}
                          </span>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {elapsed(order.created_at)}
                          </span>
                        </div>

                        <p className="font-medium text-gray-700 text-sm">{order.customer_name}</p>

                        <div className="mt-2 space-y-0.5">
                          {order.items?.map((item, i) => (
                            <p key={i} className="text-xs text-gray-500">
                              {item.service_name} × {item.quantity}
                            </p>
                          ))}
                        </div>

                        {action && (
                          <button
                            onClick={() => handleAction(order.id, action.next)}
                            disabled={updating === order.id}
                            className={`mt-3 w-full ${action.color} text-white py-2 rounded-lg text-sm
                                        font-semibold transition disabled:opacity-50`}
                          >
                            {updating === order.id ? '…' : action.label}
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
      </div>
    </div>
  );
}
