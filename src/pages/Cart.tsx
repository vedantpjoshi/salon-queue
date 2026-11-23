import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, Clock3 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { createOrder } from '../lib/api';
import Navbar from '../components/Navbar';

export default function Cart() {
  const { items, totalAmount, totalItems, removeItem, updateQuantity, clearCart } = useCart();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [salonOpen, setSalonOpen] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/salon/status')
      .then((response) => response.json())
      .then((data) => setSalonOpen(Boolean(data.isOpen)))
      .catch(() => { /* the server still refuses a booking after close */ });
  }, []);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Name is required';
    if (!phone.trim()) e.phone = 'Phone number is required';
    else if (!/^\d{10}$/.test(phone.trim())) e.phone = 'Enter a valid 10-digit phone number';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handlePlaceOrder() {
    if (!validate() || items.length === 0 || !salonOpen) return;

    setSubmitting(true);
    setSubmitError('');
    try {
      const order = await createOrder({
        customer_name: name.trim(),
        customer_phone: phone.trim(),
        items: items.map((i) => ({ service_id: i.service.id, quantity: i.quantity })),
      });
      localStorage.setItem('glamour-last-order', String(order.id));
      if (order.cancel_token) {
        try {
          const saved = JSON.parse(localStorage.getItem('glamour-cancel-tokens') || '{}');
          saved[order.id] = order.cancel_token;
          localStorage.setItem('glamour-cancel-tokens', JSON.stringify(saved));
        } catch { /* the token page still opens if storage is unavailable */ }
      }
      clearCart();
      navigate(`/token/${order.id}`);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to place booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const estDuration = items.reduce((s, i) => s + i.service.duration * i.quantity, 0);

  return (
    <div className="min-h-screen bg-[#fffdfb] text-[#34263e]">
      <Navbar />

      <div className="max-w-lg mx-auto px-4 py-6">
        <button
          onClick={() => navigate('/')}
          className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-[#6b4b8b]"
        >
          <ArrowLeft className="w-4 h-4" /> Back to services
        </button>

        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9879a3]">Your visit</p>
        <h1 className="mt-1 mb-6 flex items-center gap-2 font-serif text-3xl font-semibold tracking-tight">
          <ShoppingBag className="w-6 h-6 text-[#6b4b8b]" /> Your bag
        </h1>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="font-serif text-2xl text-[#34263e]">Your bag is empty</p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 rounded-full bg-[#6b4b8b] px-6 py-3 text-sm font-bold text-white hover:bg-[#563872] transition"
            >
              Browse Services
            </button>
          </div>
        ) : (
          <>
            {/* Items */}
            <div className="space-y-3 mb-6">
              {items.map((item) => (
                <div
                  key={item.service.id}
                  className="flex items-center gap-4 rounded-3xl border border-[#eee6f0] bg-white p-4 shadow-sm"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{item.service.name}</h3>
                    <p className="text-sm text-[#887d8c]">
                      {item.service.duration} min · ₹{item.service.price} each
                    </p>
                    <p className="mt-1 font-bold text-[#6b4b8b]">
                      ₹{item.service.price * item.quantity}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center bg-gray-100 rounded-lg">
                      <button
                        onClick={() =>
                          item.quantity === 1
                            ? removeItem(item.service.id)
                            : updateQuantity(item.service.id, item.quantity - 1)
                        }
                        className="px-2 py-1 hover:bg-gray-200 rounded-l-lg transition"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="px-3 font-semibold text-sm">{item.quantity}</span>
                      <button
                        onClick={() =>
                          item.quantity < 5 && updateQuantity(item.service.id, item.quantity + 1)
                        }
                        className={`px-2 py-1 rounded-r-lg transition ${
                          item.quantity >= 5 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-200'
                        }`}
                        disabled={item.quantity >= 5}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.service.id)}
                      className="p-1 text-red-400 hover:text-red-600 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="mb-6 rounded-3xl border border-[#eee6f0] bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between text-sm text-[#6f6274]">
                <span className="inline-flex items-center gap-1"><Clock3 className="h-4 w-4" /> Est. duration</span>
                <span>~{estDuration} min</span>
              </div>
              <div className="mb-2 flex justify-between text-sm text-[#6f6274]">
                <span>Services ({totalItems})</span>
                <span>₹{totalAmount}</span>
              </div>
              <div className="flex justify-between border-t pt-2 text-lg font-bold">
                <span>Total</span>
                <span className="text-[#6b4b8b]">₹{totalAmount}</span>
              </div>
            </div>

            <div className="mb-6 rounded-3xl border border-[#eee6f0] bg-white p-4 shadow-sm">
              <h2 className="mb-1 font-semibold">Your details</h2>
              <p className="mb-3 text-xs text-[#887d8c]">We’ll call this name when your token is ready. Your phone stays off the waiting-room screen.</p>
              <div className="space-y-3">
                <div>
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setErrors((p) => ({ ...p, name: '' }));
                    }}
                    className={`w-full px-4 py-2.5 bg-gray-50 rounded-xl border ${
                      errors.name ? 'border-red-400' : 'border-gray-200'
                    } focus:ring-2 focus:ring-violet-500 focus:border-transparent transition`}
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>
                <div>
                  <input
                    type="tel"
                    placeholder="Phone Number (10 digits)"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                      setErrors((p) => ({ ...p, phone: '' }));
                    }}
                    className={`w-full px-4 py-2.5 bg-gray-50 rounded-xl border ${
                      errors.phone ? 'border-red-400' : 'border-gray-200'
                    } focus:ring-2 focus:ring-violet-500 focus:border-transparent transition`}
                  />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>
              </div>
            </div>

            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-red-600 text-sm">
                {submitError}
              </div>
            )}

            {!salonOpen && (
              <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                The salon is closed. New bookings open from 9:00 AM to 7:45 PM.
              </div>
            )}

            <button
              onClick={handlePlaceOrder}
              disabled={submitting || items.length === 0 || !salonOpen}
              className="w-full rounded-full bg-[#6b4b8b] py-4 text-lg font-semibold text-white
                         shadow-lg shadow-violet-200 transition hover:bg-[#563872] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Booking…' : !salonOpen ? 'Salon closed' : `Join the queue · ₹${totalAmount}`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
