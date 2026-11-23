import { useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { CheckCircle, Clock3, Monitor, Scissors, Users } from 'lucide-react';
import { getActiveOrders } from '../lib/api';
import { socket } from '../lib/socket';
import { Order } from '../lib/types';
import Navbar from '../components/Navbar';

function QueueCard({
  order,
  borderStyle,
  tokenColor,
  badge,
  badgeStyle,
}: {
  order: Order;
  borderStyle: string;
  tokenColor: string;
  badge?: string;
  badgeStyle?: string;
}) {
  return (
    <article
      className={`relative overflow-hidden rounded-2xl border bg-white p-4 sm:p-5 shadow-sm transition duration-200 hover:shadow-md ${borderStyle}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9879a3]">Queue token</p>
          <p className={`font-serif text-4xl sm:text-5xl font-black tracking-tight ${tokenColor}`}>
            #{order.token_number}
          </p>
        </div>
        {badge && (
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-black tracking-wider uppercase ${badgeStyle || 'bg-[#f4eef6] text-[#765b80]'}`}>
            {badge}
          </span>
        )}
      </div>

      <p className="mt-2.5 truncate font-bold text-sm sm:text-base text-[#34263e]">{order.customer_name}</p>
      <p className="mt-1 line-clamp-1 text-xs text-[#8c7892]">
        {order.items?.map((item) => `${item.service_name} × ${item.quantity}`).join(' · ') || 'Salon service'}
      </p>
    </article>
  );
}

function QueueColumn({
  title,
  subtitle,
  count,
  icon,
  headerBg,
  countBadge,
  children,
  empty,
}: {
  title: string;
  subtitle: string;
  count: number;
  icon: ReactNode;
  headerBg: string;
  countBadge: string;
  children: ReactNode;
  empty: string;
}) {
  return (
    <section className="flex min-h-[360px] flex-col overflow-hidden rounded-3xl border border-[#eee6f0] bg-white shadow-[0_4px_24px_rgba(73,49,87,0.04)]">
      <header className={`flex items-center justify-between px-5 py-4 text-white ${headerBg}`}>
        <div className="flex items-center gap-2.5">
          <div className="opacity-95">{icon}</div>
          <div>
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider">{title}</h2>
            <p className="text-[11px] text-white/80">{subtitle}</p>
          </div>
        </div>
        <span className={`min-w-8 rounded-full px-2.5 py-0.5 text-center text-xs font-black shadow-inner ${countBadge}`}>
          {count}
        </span>
      </header>

      <div className="grid flex-1 content-start gap-3 p-4 sm:p-5 bg-[#fbf9fc]/50">
        {count === 0 ? (
          <div className="flex min-h-48 items-center justify-center rounded-2xl border border-dashed border-[#e6dce8] text-center text-sm font-medium text-[#a394a8]">
            {empty}
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}

export default function Display() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [blinking, setBlinking] = useState<Set<number>>(new Set());
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    let disposed = false;
    const refreshQueue = async () => {
      try {
        const activeOrders = await getActiveOrders();
        if (!disposed) setOrders(activeOrders);
      } catch (err) {
        console.error('Failed to load queue:', err);
      }
    };

    void refreshQueue();
    const refreshTimer = window.setInterval(refreshQueue, 10_000);
    const refreshOnFocus = () => {
      if (document.visibilityState === 'visible') void refreshQueue();
    };
    window.addEventListener('focus', refreshOnFocus);

    const onNew = (order: Order) => {
      setOrders((previous) =>
        previous.some((item) => item.id === order.id)
          ? previous.map((item) => (item.id === order.id ? order : item))
          : [...previous, order]
      );
    };

    const onUpdated = (updated: Order) => {
      if (updated.status === 'CheckedOut' || updated.status === 'Cancelled') {
        setOrders((previous) => previous.filter((item) => item.id !== updated.id));
        setBlinking((previous) => {
          const next = new Set(previous);
          next.delete(updated.id);
          return next;
        });
        return;
      }

      setOrders((previous) =>
        previous.some((item) => item.id === updated.id)
          ? previous.map((item) => (item.id === updated.id ? updated : item))
          : [...previous, updated]
      );

      if (updated.status === 'Completed') {
        setBlinking((previous) => new Set(previous).add(updated.id));
        const timer = setTimeout(() => {
          setBlinking((previous) => {
            const next = new Set(previous);
            next.delete(updated.id);
            return next;
          });
          timers.current.delete(updated.id);
        }, 5000);
        timers.current.set(updated.id, timer);
      }
    };

    socket.on('order:new', onNew);
    socket.on('order:updated', onUpdated);
    return () => {
      disposed = true;
      window.clearInterval(refreshTimer);
      window.removeEventListener('focus', refreshOnFocus);
      socket.off('order:new', onNew);
      socket.off('order:updated', onUpdated);
      timers.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const waiting = orders.filter((order) => order.status === 'Placed').sort((a, b) => a.token_number - b.token_number);
  const inProgress = orders.filter((order) => order.status === 'InProgress').sort((a, b) => a.token_number - b.token_number);
  const ready = orders.filter((order) => order.status === 'Completed').sort((a, b) => a.token_number - b.token_number);

  return (
    <div className="min-h-screen bg-[#fffdfb] text-[#34263e]">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-100 bg-[#f4eef6] px-3.5 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[#765b80]">
              <Scissors className="h-3.5 w-3.5 text-[#6b4b8b]" /> Glamour Queue · Now Serving
            </div>
            <h1 className="mt-2 font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#34263e]">
              Live Salon Queue
            </h1>
            <p className="mt-1 text-sm sm:text-base text-[#786b7b]">
              Follow your token as it advances from waiting to consultation to collection.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-800 shadow-sm">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500" />
            Live sync active ({orders.length} guests in salon)
          </div>
        </header>

        {/* Status Metrics Bar */}
        <div className="mb-8 grid grid-cols-3 gap-3 sm:gap-5">
          <div className="rounded-3xl border border-[#eee6f0] bg-white p-4 sm:p-5 shadow-[0_4px_20px_rgba(73,49,87,0.04)]">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#6b4b8b]" />
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#8c7892]">Waiting</p>
            </div>
            <p className="mt-2 font-serif text-2xl sm:text-4xl font-black text-[#6b4b8b]">{waiting.length}</p>
          </div>

          <div className="rounded-3xl border border-[#eee6f0] bg-white p-4 sm:p-5 shadow-[0_4px_20px_rgba(73,49,87,0.04)]">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#b87333]" />
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#8c7892]">In Service</p>
            </div>
            <p className="mt-2 font-serif text-2xl sm:text-4xl font-black text-[#b87333]">{inProgress.length}</p>
          </div>

          <div className="rounded-3xl border border-[#eee6f0] bg-white p-4 sm:p-5 shadow-[0_4px_20px_rgba(73,49,87,0.04)]">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#4d826a]" />
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#8c7892]">Ready</p>
            </div>
            <p className="mt-2 font-serif text-2xl sm:text-4xl font-black text-[#4d826a]">{ready.length}</p>
          </div>
        </div>

        {/* 3 Columns */}
        <div className="grid gap-6 xl:grid-cols-3">
          {/* Waiting Column */}
          <QueueColumn
            title="Waiting Queue"
            subtitle="Next client in line"
            count={waiting.length}
            icon={<Users className="h-5 w-5" />}
            headerBg="bg-[#6b4b8b]"
            countBadge="bg-[#563872]"
            empty="No guests waiting"
          >
            {waiting.slice(0, 10).map((order, index) => (
              <QueueCard
                key={order.id}
                order={order}
                borderStyle={index === 0 ? 'border-[#6b4b8b] ring-2 ring-violet-200 bg-violet-50/20' : 'border-[#ede5ef]'}
                tokenColor="text-[#6b4b8b]"
                badge={index === 0 ? 'NEXT UP' : undefined}
                badgeStyle="bg-[#6b4b8b] text-white"
              />
            ))}
            {waiting.length > 10 && (
              <p className="text-center text-xs font-bold text-[#8c7892] py-2">
                + {waiting.length - 10} more guests in queue
              </p>
            )}
          </QueueColumn>

          {/* In Service Column */}
          <QueueColumn
            title="In Service"
            subtitle="Currently at salon stations"
            count={inProgress.length}
            icon={<Clock3 className="h-5 w-5" />}
            headerBg="bg-[#b87333]"
            countBadge="bg-[#9c6128]"
            empty="No services currently in progress"
          >
            {inProgress.map((order) => (
              <QueueCard
                key={order.id}
                order={order}
                borderStyle="border-amber-200 bg-amber-50/20"
                tokenColor="text-[#b87333]"
                badge="IN SERVICE"
                badgeStyle="bg-amber-100 text-amber-800"
              />
            ))}
          </QueueColumn>

          {/* Ready to Collect Column */}
          <QueueColumn
            title="Ready to Collect"
            subtitle="Please visit the front desk"
            count={ready.length}
            icon={<CheckCircle className="h-5 w-5" />}
            headerBg="bg-[#4d826a]"
            countBadge="bg-[#3b6b55]"
            empty="No tokens currently ready"
          >
            {ready.map((order) => (
              <div key={order.id} className={blinking.has(order.id) ? 'animate-blink' : ''}>
                <QueueCard
                  order={order}
                  borderStyle="border-emerald-300 ring-2 ring-emerald-200 bg-emerald-50/30"
                  tokenColor="text-[#4d826a]"
                  badge="READY"
                  badgeStyle="bg-emerald-600 text-white"
                />
              </div>
            ))}
          </QueueColumn>
        </div>

        <footer className="mt-12 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#a394a8]">
          <Monitor className="h-4 w-4 text-[#6b4b8b]" /> Glamour Queue · Now Serving Floor
        </footer>
      </main>
    </div>
  );
}
