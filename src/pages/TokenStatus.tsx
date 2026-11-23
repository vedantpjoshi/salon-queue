import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, XCircle, ArrowLeft, Users } from 'lucide-react';
import { getActiveOrders, getOrder, cancelOrder } from '../lib/api';
import { socket } from '../lib/socket';
import { Order } from '../lib/types';
import Navbar from '../components/Navbar';

const STATUS_STEPS = ['Placed', 'InProgress', 'Completed'];
const STATUS_LABELS: Record<string, string> = {
  Placed: 'Placed',
  InProgress: 'In Progress',
  Completed: 'Completed',
  CheckedOut: 'Checked Out',
  Cancelled: 'Cancelled',
};

export default function TokenStatus() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [queueOrders, setQueueOrders] = useState<Order[]>([]);
  const [queueReady, setQueueReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadOrder();
    loadQueue();

    const addToQueue = (incoming: Order) => {
      setQueueOrders((previous) => previous.some((item) => item.id === incoming.id)
        ? previous.map((item) => item.id === incoming.id ? incoming : item)
        : [...previous, incoming]);
    };
    const handler = (updated: Order) => {
      if (updated.id === Number(id)) {
        setOrder(updated);
        if (updated.status === 'Completed') {
          try { navigator?.vibrate?.(200); } catch { /* ignore */ }
        }
      }
      if (updated.status === 'CheckedOut' || updated.status === 'Cancelled') {
        setQueueOrders((previous) => previous.filter((item) => item.id !== updated.id));
      } else {
        addToQueue(updated);
      }
    };

    socket.on('order:new', addToQueue);
    socket.on('order:updated', handler);
    return () => {
      socket.off('order:new', addToQueue);
      socket.off('order:updated', handler);
    };
  }, [id]);

  async function loadOrder() {
    try {
      setOrder(await getOrder(Number(id)));
    } catch {
      setError('Order not found');
    } finally {
      setLoading(false);
    }
  }

  async function loadQueue() {
    try {
      setQueueOrders(await getActiveOrders());
    } catch (err) {
      console.error('Failed to load queue position:', err);
    } finally {
      setQueueReady(true);
    }
  }

  function savedCancelToken() {
    try {
      const saved = JSON.parse(localStorage.getItem('glamour-cancel-tokens') || '{}');
      return typeof saved[String(id)] === 'string' ? saved[String(id)] : '';
    } catch {
      return '';
    }
  }

  async function handleCancel() {
    if (!order) return;
    const cancelToken = savedCancelToken();
    if (!cancelToken) {
      setError('This booking can only be cancelled from the device that placed it.');
      return;
    }
    if (!window.confirm('Cancel this booking? Your token will leave the queue.')) return;
    setCancelling(true);
    try {
      setOrder(await cancelOrder(order.id, cancelToken));
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to cancel');
    } finally {
      setCancelling(false);
    }
  }

  function getEstimatedWait(): string {
    if (!order) return '';
    if (order.status === 'Completed' || order.status === 'CheckedOut') return 'Done!';
    if (order.status === 'Cancelled') return 'Cancelled';
    if (order.status === 'InProgress') return 'Currently being served';
    return 'Waiting in the live queue';
  }

  const currentStep = STATUS_STEPS.indexOf(order?.status || 'Placed');

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

  if (!order) {
    return (
      <div className="min-h-screen bg-[#fffdfb]">
        <Navbar />
        <div className="text-center py-16">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">{error || 'Order not found'}</p>
          <button onClick={() => navigate('/')} className="mt-4 text-violet-600 hover:underline">
            Go to Menu
          </button>
        </div>
      </div>
    );
  }

  const isCompleted = order.status === 'Completed';
  const isCancelled = order.status === 'Cancelled';
  const isCheckedOut = order.status === 'CheckedOut';
  const waitingAhead = queueOrders.filter((candidate) =>
    candidate.status === 'Placed' && candidate.token_number < order.token_number,
  );
  const inProgressAhead = queueOrders.filter((candidate) => candidate.status === 'InProgress');
  const queuePosition = waitingAhead.length + inProgressAhead.length + 1;
  const estimatedQueueWait = [...inProgressAhead, ...waitingAhead].reduce((total, candidate) => {
    const duration = candidate.items?.reduce((sum, item) => sum + item.duration * item.quantity, 0) || 15;
    if (candidate.status !== 'InProgress') return total + duration;
    const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(candidate.updated_at);
    const startedAt = new Date(hasTimezone ? candidate.updated_at : `${candidate.updated_at.replace(' ', 'T')}Z`).getTime();
    const elapsed = Number.isFinite(startedAt) ? Math.max(0, (Date.now() - startedAt) / 60000) : 0;
    return total + Math.max(0, Math.ceil(duration - elapsed));
  }, 0);

  return (
    <div
      className={`min-h-screen transition-colors duration-500 ${
        isCompleted ? 'bg-emerald-50' : 'bg-[#fffdfb]'
      }`}
    >
      <Navbar />

      <div className="max-w-lg mx-auto px-4 py-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1 text-violet-600 mb-4 hover:underline text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> New Booking
        </button>

        {/* Token */}
        <div className="text-center py-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#9879a3]">Your token</p>
          <div
            className={`font-serif text-8xl font-medium ${
              isCompleted
                ? 'text-green-600'
                : isCancelled
                ? 'text-red-400'
                : 'text-violet-600'
            }`}
          >
            #{order.token_number}
          </div>
          <p className="mt-2 text-lg font-medium text-gray-600">{order.customer_name}</p>
        </div>

        {/* Completed celebration */}
        {isCompleted && (
          <div className="bg-green-100 border border-green-300 rounded-2xl p-6 text-center mb-6">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
            <p className="text-green-800 text-xl font-bold">Your service is ready!</p>
            <p className="text-green-600 mt-1">Please collect at the counter</p>
          </div>
        )}

        {/* Cancelled */}
        {isCancelled && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center mb-6">
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-2" />
            <p className="text-red-600 text-lg font-bold">Booking Cancelled</p>
          </div>
        )}

        {/* Checked out */}
        {isCheckedOut && (
          <div className="bg-violet-50 border border-violet-200 rounded-2xl p-6 text-center mb-6">
            <CheckCircle className="w-12 h-12 text-violet-500 mx-auto mb-2" />
            <p className="text-violet-700 text-lg font-bold">Checked Out — Thank you!</p>
          </div>
        )}

        {/* Progress steps */}
        {!isCancelled && !isCheckedOut && (
          <>
          {order.status === 'Placed' && (
            <div className="mb-6 rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-violet-500">Your place in the queue</p>
                  <p className="mt-1 text-4xl font-black text-violet-700">{queueReady ? `#${queuePosition}` : '…'}</p>
                  <p className="mt-1 text-sm text-gray-600">
                    {queueReady
                      ? waitingAhead.length + inProgressAhead.length === 0
                        ? 'You’re next to be served'
                        : `${waitingAhead.length + inProgressAhead.length} customer${waitingAhead.length + inProgressAhead.length === 1 ? '' : 's'} ahead of you`
                      : 'Checking the live queue…'}
                  </p>
                </div>
                <div className="rounded-2xl bg-violet-100 p-3 text-violet-700"><Users className="h-6 w-6" /></div>
              </div>
              <div className="mt-4 flex items-center gap-2 border-t border-violet-100 pt-3 text-sm font-medium text-gray-600">
                <Clock className="h-4 w-4 text-violet-500" />
                {queueReady ? `Approx. wait: ${estimatedQueueWait === 0 ? 'Your turn soon' : `~${estimatedQueueWait} min`}` : 'Estimating wait time'}
              </div>
            </div>
          )}
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
            <div className="flex items-center justify-between">
              {STATUS_STEPS.map((step, i) => {
                const active = i <= currentStep;
                const current = i === currentStep;
                return (
                  <div key={step} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold
                          transition-all duration-500 ${
                            active
                              ? 'bg-violet-600 text-white scale-110'
                              : 'bg-gray-200 text-gray-500'
                          } ${current ? 'ring-4 ring-violet-200' : ''}`}
                      >
                        {i + 1}
                      </div>
                      <span
                        className={`text-xs mt-2 font-medium text-center ${
                          active ? 'text-violet-600' : 'text-gray-400'
                        }`}
                      >
                        {STATUS_LABELS[step]}
                      </span>
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div
                        className={`h-1 flex-1 mx-1 rounded transition-all duration-500 ${
                          i < currentStep ? 'bg-violet-600' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="text-center pt-4 border-t mt-4">
              <div className="flex items-center justify-center gap-2 text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{getEstimatedWait()}</span>
              </div>
            </div>
          </div>
          </>
        )}

        {/* Order details */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
          <h3 className="font-semibold text-gray-800 mb-3">Services Booked</h3>
          <div className="space-y-2">
            {order.items?.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {item.service_name} × {item.quantity}
                </span>
                <span className="font-medium">₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>
          <div className="border-t mt-3 pt-3 flex justify-between font-bold">
            <span>Total</span>
            <span className="text-violet-600">₹{order.total}</span>
          </div>
        </div>

        {/* Cancel */}
        {order.status === 'Placed' && (
          savedCancelToken() ? (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="w-full rounded-full border-2 border-rose-300 py-3 font-semibold text-rose-600
                         transition hover:bg-rose-50 disabled:opacity-50"
            >
              {cancelling ? 'Cancelling…' : 'Cancel booking'}
            </button>
          ) : (
            <p className="rounded-2xl bg-[#f5f0f6] px-4 py-3 text-center text-sm text-[#7f7383]">
              Open this page on the phone that booked the visit to cancel it.
            </p>
          )
        )}
        {error && order && (
          <p role="alert" className="mt-3 text-center text-sm text-rose-600">{error}</p>
        )}
      </div>
    </div>
  );
}
