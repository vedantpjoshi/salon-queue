import { useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { CheckCircle, Clock3, Monitor, Scissors, Users } from 'lucide-react';
import { getActiveOrders } from '../lib/api';
import { socket } from '../lib/socket';
import { Order } from '../lib/types';

function QueueCard({ order, tone, badge }: { order: Order; tone: string; badge?: string }) {
  return (
    <article className={`relative overflow-hidden rounded-2xl border ${tone} p-5 md:p-6`}>
      {badge && (
        <span className="absolute right-4 top-4 rounded-full bg-white/15 px-3 py-1 text-xs font-bold tracking-wider">
          {badge}
        </span>
      )}
      <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-70">Queue token</p>
      <p className="mt-1 text-5xl font-black tracking-tight md:text-6xl">#{order.token_number}</p>
      <p className="mt-2 truncate text-lg font-semibold">{order.customer_name}</p>
      <p className="mt-1 line-clamp-2 text-sm opacity-70">
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
  accent,
  children,
  empty,
}: {
  title: string;
  subtitle: string;
  count: number;
  icon: ReactNode;
  accent: string;
  children: ReactNode;
  empty: string;
}) {
  return (
    <section className="flex min-h-[320px] flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80">
      <header className="flex items-center justify-between border-b border-white/10 px-5 py-4 md:px-6">
        <div className="flex items-center gap-3">
          <div className={`rounded-xl p-2.5 ${accent}`}>{icon}</div>
          <div>
            <h2 className="text-lg font-black uppercase tracking-wide md:text-xl">{title}</h2>
            <p className="text-xs text-slate-400 md:text-sm">{subtitle}</p>
          </div>
        </div>
        <span className="min-w-10 rounded-full bg-white/10 px-3 py-1 text-center text-lg font-black">{count}</span>
      </header>
      <div className="grid flex-1 content-start gap-3 p-4 md:p-5">
        {count === 0 ? (
          <div className="flex min-h-40 items-center justify-center rounded-2xl border border-dashed border-white/10 text-center text-slate-500">
            {empty}
          </div>
        ) : children}
      </div>
    </section>
  );
}

export default function Display() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [blinking, setBlinking] = useState<Set<number>>(new Set());
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    getActiveOrders().then(setOrders).catch((err) => console.error('Failed to load queue:', err));

    const onNew = (order: Order) => {
      setOrders((previous) => previous.some((item) => item.id === order.id)
        ? previous.map((item) => item.id === order.id ? order : item)
        : [...previous, order]);
    };

    const onUpdated = (updated: Order) => {
      if (updated.status === 'CheckedOut' || updated.status === 'Cancelled') {
        setOrders((previous) => previous.filter((item) => item.id !== updated.id));
        setBlinking((previous) => { const next = new Set(previous); next.delete(updated.id); return next; });
        return;
      }

      setOrders((previous) => previous.some((item) => item.id === updated.id)
        ? previous.map((item) => item.id === updated.id ? updated : item)
        : [...previous, updated]);
      if (updated.status === 'Completed') {
        setBlinking((previous) => new Set(previous).add(updated.id));
        const timer = setTimeout(() => {
          setBlinking((previous) => { const next = new Set(previous); next.delete(updated.id); return next; });
          timers.current.delete(updated.id);
        }, 5000);
        timers.current.set(updated.id, timer);
      }
    };

    socket.on('order:new', onNew);
    socket.on('order:updated', onUpdated);
    return () => {
      socket.off('order:new', onNew);
      socket.off('order:updated', onUpdated);
      timers.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const waiting = orders.filter((order) => order.status === 'Placed').sort((a, b) => a.token_number - b.token_number);
  const inProgress = orders.filter((order) => order.status === 'InProgress').sort((a, b) => a.token_number - b.token_number);
  const ready = orders.filter((order) => order.status === 'Completed').sort((a, b) => a.token_number - b.token_number);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-5 text-white md:px-8 md:py-7">
      <div className="mx-auto max-w-[1800px]">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4 md:mb-8">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-violet-300">
              <Scissors className="h-4 w-4" /> Glamour Queue
            </div>
            <h1 className="text-3xl font-black tracking-tight md:text-5xl">Live salon queue</h1>
            <p className="mt-1 text-sm text-slate-400 md:text-base">Follow your token from waiting to service to collection.</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-300">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" /> Live updates
          </div>
        </header>

        <div className="mb-5 grid grid-cols-3 gap-2 md:mb-7 md:gap-4">
          <div className="rounded-2xl border border-blue-400/20 bg-blue-400/10 p-3 md:p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-200/70 md:text-xs">Waiting</p>
            <p className="mt-1 text-2xl font-black text-blue-200 md:text-4xl">{waiting.length}</p>
          </div>
          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-3 md:p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-200/70 md:text-xs">In service</p>
            <p className="mt-1 text-2xl font-black text-amber-200 md:text-4xl">{inProgress.length}</p>
          </div>
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-3 md:p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-200/70 md:text-xs">Ready</p>
            <p className="mt-1 text-2xl font-black text-emerald-200 md:text-4xl">{ready.length}</p>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-3 md:gap-5">
          <QueueColumn title="Waiting" subtitle="First token is next up" count={waiting.length} icon={<Users className="h-5 w-5" />} accent="bg-blue-500/20 text-blue-300" empty="No customers waiting">
            {waiting.slice(0, 8).map((order, index) => (
              <QueueCard key={order.id} order={order} tone={index === 0 ? 'border-blue-400/50 bg-blue-500/15 text-blue-50' : 'border-white/10 bg-slate-800 text-white'} badge={index === 0 ? 'NEXT UP' : undefined} />
            ))}
            {waiting.length > 8 && <p className="text-center text-sm font-medium text-slate-400">+ {waiting.length - 8} more in line</p>}
          </QueueColumn>

          <QueueColumn title="In Progress" subtitle="Currently being served" count={inProgress.length} icon={<Clock3 className="h-5 w-5" />} accent="bg-amber-500/20 text-amber-300" empty="No services in progress">
            {inProgress.map((order) => <QueueCard key={order.id} order={order} tone="border-amber-400/40 bg-amber-500/10 text-amber-50" badge="IN SERVICE" />)}
          </QueueColumn>

          <QueueColumn title="Ready to Collect" subtitle="Please visit the front desk" count={ready.length} icon={<CheckCircle className="h-5 w-5" />} accent="bg-emerald-500/20 text-emerald-300" empty="No tokens ready">
            {ready.map((order) => <div key={order.id} className={blinking.has(order.id) ? 'animate-blink' : ''}><QueueCard order={order} tone="border-emerald-400/50 bg-emerald-500/15 text-emerald-50" badge="READY" /></div>)}
          </QueueColumn>
        </div>

        <footer className="mt-6 flex items-center justify-center gap-2 text-xs font-medium uppercase tracking-[0.22em] text-slate-500 md:mt-8 md:text-sm">
          <Monitor className="h-4 w-4" /> Glamour Queue · Live Now Serving Board
        </footer>
      </div>
    </main>
  );
}
