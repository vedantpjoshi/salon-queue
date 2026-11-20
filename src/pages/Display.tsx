import { useState, useEffect, useRef } from 'react';
import { getActiveOrders } from '../lib/api';
import { socket } from '../lib/socket';
import { Order } from '../lib/types';

export default function Display() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [blinking, setBlinking] = useState<Set<number>>(new Set());
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    load();

    const onNew = (o: Order) => setOrders((p) => [...p, o]);
    const onUpdated = (u: Order) => {
      if (u.status === 'CheckedOut' || u.status === 'Cancelled') {
        setOrders((p) => p.filter((o) => o.id !== u.id));
        setBlinking((p) => { const n = new Set(p); n.delete(u.id); return n; });
      } else {
        setOrders((p) => p.map((o) => (o.id === u.id ? u : o)));
        if (u.status === 'Completed') {
          setBlinking((p) => new Set(p).add(u.id));
          const t = setTimeout(() => {
            setBlinking((p) => { const n = new Set(p); n.delete(u.id); return n; });
            timers.current.delete(u.id);
          }, 5000);
          timers.current.set(u.id, t);
        }
      }
    };

    socket.on('order:new', onNew);
    socket.on('order:updated', onUpdated);
    return () => {
      socket.off('order:new', onNew);
      socket.off('order:updated', onUpdated);
      timers.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  async function load() {
    try {
      setOrders(await getActiveOrders());
    } catch (err) {
      console.error(err);
    }
  }

  const inProgress = orders.filter((o) => o.status === 'InProgress');
  const completed = orders.filter((o) => o.status === 'Completed');

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col md:flex-row">
      {/* In Progress */}
      <div className="flex-1 p-6 md:p-10 md:border-r border-gray-700">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-400 mb-6 md:mb-10 text-center uppercase tracking-wider">
          🔄 In Progress
        </h2>
        <div className="flex flex-wrap gap-4 md:gap-6 justify-center">
          {inProgress.length === 0 && (
            <p className="text-gray-600 text-lg md:text-xl">No services in progress</p>
          )}
          {inProgress.map((o) => (
            <div
              key={o.id}
              className="bg-gray-800 rounded-2xl px-6 md:px-10 py-4 md:py-6 text-center"
            >
              <div className="text-5xl md:text-7xl font-black text-gray-300">
                #{o.token_number}
              </div>
              <p className="text-gray-500 mt-2 text-xs md:text-sm">{o.customer_name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Ready */}
      <div className="flex-1 p-6 md:p-10">
        <h2 className="text-2xl md:text-3xl font-bold text-green-400 mb-6 md:mb-10 text-center uppercase tracking-wider">
          ✅ Ready to Collect
        </h2>
        <div className="flex flex-wrap gap-4 md:gap-6 justify-center">
          {completed.length === 0 && (
            <p className="text-gray-600 text-lg md:text-xl">No tokens ready</p>
          )}
          {completed.map((o) => (
            <div
              key={o.id}
              className={`bg-green-900/50 border-2 border-green-500 rounded-2xl px-6 md:px-10 py-4 md:py-6 text-center ${
                blinking.has(o.id) ? 'animate-blink' : ''
              }`}
            >
              <div className="text-5xl md:text-7xl font-black text-green-400">
                #{o.token_number}
              </div>
              <p className="text-green-300/70 mt-2 text-xs md:text-sm">{o.customer_name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-3 right-4 text-gray-600 text-xs">
        Glamour Queue · Now Serving Display
      </div>
    </div>
  );
}
