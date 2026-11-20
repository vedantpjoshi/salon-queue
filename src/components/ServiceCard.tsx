import { Clock3, Minus, Plus, Sparkles } from 'lucide-react';
import { Service } from '../lib/types';
import { useCart } from '../context/CartContext';

const CATEGORY_STYLES: Record<string, { icon: string; wash: string; ink: string; label: string }> = {
  Hair: { icon: '✂️', wash: 'from-[#f5e8ef] to-[#f9f3f6]', ink: 'text-[#9e6684]', label: 'Hair studio' },
  Skin: { icon: '✨', wash: 'from-[#fbefd9] to-[#fcf7ec]', ink: 'text-[#a07d32]', label: 'Skin ritual' },
  Nails: { icon: '💅', wash: 'from-[#eee7f7] to-[#f7f4fa]', ink: 'text-[#80659e]', label: 'Nail bar' },
  Spa: { icon: '🧖', wash: 'from-[#e2f0ea] to-[#f0f7f3]', ink: 'text-[#5e8b75]', label: 'Spa & wellness' },
};

const TYPE_STYLE: Record<string, string> = {
  Quick: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  Standard: 'bg-sky-50 text-sky-700 ring-sky-100',
  Premium: 'bg-amber-50 text-amber-700 ring-amber-100',
};

export default function ServiceCard({ service }: { service: Service }) {
  const { items, addItem, removeItem, updateQuantity } = useCart();
  const cartItem = items.find((item) => item.service.id === service.id);
  const quantity = cartItem?.quantity || 0;
  const unavailable = !service.is_available;
  const visual = CATEGORY_STYLES[service.category] || CATEGORY_STYLES.Hair;

  return (
    <article className={`group relative flex min-h-[290px] flex-col overflow-hidden rounded-[1.6rem] border bg-white p-3.5 shadow-[0_4px_20px_rgba(73,49,87,0.045)] transition duration-300 sm:min-h-[310px] sm:p-4 ${unavailable ? 'border-[#eee9ee] opacity-60' : 'border-[#eee8f0] hover:-translate-y-1 hover:border-[#d8c4e0] hover:shadow-[0_16px_38px_rgba(73,49,87,0.12)]'}`}>
      <div className={`relative flex h-28 items-center justify-center overflow-hidden rounded-[1.2rem] bg-gradient-to-br ${visual.wash}`}>
        <span className="absolute -right-5 -top-9 h-24 w-24 rounded-full border border-white/70" />
        <span className="absolute -bottom-10 -left-4 h-24 w-24 rounded-full border border-white/70" />
        <span className="relative text-4xl drop-shadow-sm transition duration-300 group-hover:scale-110 group-hover:-rotate-6">{visual.icon}</span>
        <span className={`absolute bottom-2.5 left-3 text-[9px] font-black uppercase tracking-[0.16em] ${visual.ink}`}>{visual.label}</span>
        <span className={`absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-bold ring-1 ${TYPE_STYLE[service.type] || TYPE_STYLE.Standard}`}>
          {service.type === 'Premium' && <Sparkles className="h-2.5 w-2.5" />}{service.type}
        </span>
      </div>

      <div className="flex flex-1 flex-col px-0.5 pt-3">
        <h3 className="line-clamp-2 min-h-10 text-[13px] font-extrabold leading-5 text-[#45364b] sm:text-sm">{service.name}</h3>
        <p className="mt-1 line-clamp-2 min-h-8 text-[10px] leading-4 text-[#978a99] sm:text-[11px]">{service.description || `A ${service.type.toLowerCase()} ${service.category.toLowerCase()} service, tailored to you.`}</p>
        <div className="mt-2 flex items-center gap-1 text-[10px] font-medium text-[#928593] sm:text-xs"><Clock3 className="h-3 w-3" />{service.duration} min</div>
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div><span className="block text-[9px] font-semibold uppercase tracking-wider text-[#a698a9]">Starting at</span><span className="text-lg font-black tracking-tight text-[#65457f] sm:text-xl">₹{service.price}</span></div>
          {unavailable ? <span className="mb-1 rounded-full bg-rose-50 px-2.5 py-1.5 text-[10px] font-bold text-rose-600">Unavailable</span> : quantity === 0 ? (
            <button onClick={() => addItem(service)} aria-label={`Add ${service.name} to your bag`} className="mb-0.5 inline-flex min-h-9 items-center gap-1.5 rounded-full bg-[#f3edf5] px-3.5 text-xs font-extrabold text-[#6b4b8b] transition hover:bg-[#6b4b8b] hover:text-white active:scale-95"><Plus className="h-3.5 w-3.5" /> Add</button>
          ) : (
            <div className="mb-0.5 inline-flex h-9 items-center rounded-full bg-[#6b4b8b] text-white shadow-md shadow-violet-100">
              <button onClick={() => quantity === 1 ? removeItem(service.id) : updateQuantity(service.id, quantity - 1)} aria-label={`Remove one ${service.name}`} className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-black/10"><Minus className="h-3.5 w-3.5" /></button>
              <span aria-live="polite" className="min-w-4 text-center text-xs font-black">{quantity}</span>
              <button onClick={() => quantity < 5 && updateQuantity(service.id, quantity + 1)} aria-label={`Add one ${service.name}`} disabled={quantity >= 5} className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-black/10 disabled:opacity-40"><Plus className="h-3.5 w-3.5" /></button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
