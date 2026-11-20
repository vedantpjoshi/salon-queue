import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';
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
  const navigate = useNavigate();

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Name is required';
    if (!phone.trim()) e.phone = 'Phone number is required';
    else if (!/^\d{10}$/.test(phone.trim())) e.phone = 'Enter a valid 10-digit phone number';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handlePlaceOrder() {
    if (!validate() || items.length === 0) return;

    setSubmitting(true);
    setSubmitError('');
    try {
      const order = await createOrder({
        customer_name: name.trim(),
        customer_phone: phone.trim(),
        items: items.map((i) => ({ service_id: i.service.id, quantity: i.quantity })),
      });
      localStorage.setItem('glamour-last-order', String(order.id));
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-lg mx-auto px-4 py-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1 text-violet-600 mb-4 hover:underline text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to services
        </button>

        <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-violet-600" /> Your Cart
        </h1>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Your cart is empty</p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 bg-violet-600 text-white px-6 py-2 rounded-xl hover:bg-violet-700 transition"
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
                  className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 truncate">{item.service.name}</h3>
                    <p className="text-sm text-gray-500">
                      {item.service.duration} min · ₹{item.service.price} each
                    </p>
                    <p className="text-violet-600 font-bold mt-1">
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
            <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Services ({totalItems})</span>
                <span>₹{totalAmount}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Est. Duration</span>
                <span>~{estDuration} min</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-violet-600">₹{totalAmount}</span>
              </div>
            </div>

            {/* Customer details */}
            <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
              <h2 className="font-semibold text-gray-800 mb-3">Your Details</h2>
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

            <button
              onClick={handlePlaceOrder}
              disabled={submitting || items.length === 0}
              className="w-full bg-violet-600 text-white py-4 rounded-xl text-lg font-semibold
                         hover:bg-violet-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {submitting ? 'Booking…' : `Book Appointment · ₹${totalAmount}`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
