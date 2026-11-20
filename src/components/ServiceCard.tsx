import { Plus, Minus, Clock } from 'lucide-react';
import { Service } from '../lib/types';
import { useCart } from '../context/CartContext';

const TYPE_COLORS: Record<string, string> = {
  Quick: 'bg-green-100 text-green-700',
  Standard: 'bg-blue-100 text-blue-700',
  Premium: 'bg-amber-100 text-amber-700',
};

const CATEGORY_EMOJIS: Record<string, string> = {
  Hair: '✂️',
  Skin: '✨',
  Nails: '💅',
  Spa: '🧖',
};

export default function ServiceCard({ service }: { service: Service }) {
  const { items, addItem, removeItem, updateQuantity } = useCart();
  const cartItem = items.find((i) => i.service.id === service.id);
  const quantity = cartItem?.quantity || 0;
  const isUnavailable = !service.is_available;

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border p-3 flex flex-col transition ${
        isUnavailable ? 'opacity-50 grayscale' : 'hover:shadow-md'
      }`}
    >
      {/* Emoji */}
      <div className="text-2xl mb-1">{CATEGORY_EMOJIS[service.category] || '💈'}</div>

      {/* Name */}
      <h3 className="font-semibold text-sm text-gray-800 leading-tight line-clamp-2">
        {service.name}
      </h3>

      {/* Type badge */}
      <span
        className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-xs font-medium w-fit ${
          TYPE_COLORS[service.type] || TYPE_COLORS.Standard
        }`}
      >
        {service.type}
      </span>

      {/* Duration */}
      <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
        <Clock className="w-3 h-3" />
        <span>{service.duration} min</span>
      </div>

      {/* Price */}
      <p className="text-violet-600 font-bold mt-1.5 text-base">₹{service.price}</p>

      {/* Unavailable */}
      {isUnavailable && (
        <span className="mt-2 text-xs text-red-500 font-semibold">Unavailable</span>
      )}

      {/* Add / quantity controls */}
      {!isUnavailable && (
        <div className="mt-auto pt-2">
          {quantity === 0 ? (
            <button
              onClick={() => addItem(service)}
              className="w-full bg-violet-50 text-violet-600 py-1.5 rounded-lg text-sm font-medium
                         hover:bg-violet-100 active:scale-95 transition flex items-center justify-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          ) : (
            <div className="flex items-center justify-between bg-violet-600 rounded-lg">
              <button
                onClick={() =>
                  quantity === 1
                    ? removeItem(service.id)
                    : updateQuantity(service.id, quantity - 1)
                }
                className="px-3 py-1.5 text-white hover:bg-violet-700 rounded-l-lg transition"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-white font-semibold text-sm">{quantity}</span>
              <button
                onClick={() => quantity < 5 && updateQuantity(service.id, quantity + 1)}
                className={`px-3 py-1.5 text-white rounded-r-lg transition ${
                  quantity >= 5 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-violet-700'
                }`}
                disabled={quantity >= 5}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
