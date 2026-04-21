import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Loader2, MapPin, ReceiptText, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { restaurantApi } from '../api/restaurant.api';
import { orderApi } from '../api/order.api';
import { paymentApi } from '../api/payment.api';
import { formatINR } from '../utils/currency';

const paymentOptions = [
  { value: 'COD', label: 'Cash on Delivery', description: 'Pay when the order arrives.' },
  { value: 'CARD', label: 'Card', description: 'Use a debit or credit card.' },
  { value: 'UPI', label: 'UPI', description: 'Pay instantly with any UPI app.' },
  { value: 'WALLET', label: 'Wallet', description: 'Use your saved wallet balance.' },
];

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, total, loading, fetchCart, setCartOpen } = useCart();

  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantLoading, setRestaurantLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [walletBalance, setWalletBalance] = useState(null);
  const [walletBalanceLoading, setWalletBalanceLoading] = useState(false);
  const [form, setForm] = useState({
    deliveryAddress: '',
    modeOfPayment: 'COD',
    specialInstructions: '',
  });

  const processPaymentForOrder = async (order, mode) => {
    const payload = {
      orderId: order.orderId,
      customerId: user.userId,
      amount: order.finalAmount ?? order.totalAmount ?? total,
    };

    if (mode === 'COD') {
      return paymentApi.processCOD(payload);
    }

    if (mode === 'WALLET') {
      return paymentApi.payFromWallet(payload);
    }

    return null;
  };

  useEffect(() => {
    const loadRestaurant = async () => {
      if (!cart?.restaurantId) {
        setRestaurantName('');
        return;
      }

      try {
        setRestaurantLoading(true);
        const response = await restaurantApi.getRestaurantById(cart.restaurantId);
        setRestaurantName(response.data?.name || `Restaurant #${cart.restaurantId}`);
      } catch {
        setRestaurantName(`Restaurant #${cart.restaurantId}`);
      } finally {
        setRestaurantLoading(false);
      }
    };

    loadRestaurant();
  }, [cart?.restaurantId]);

  useEffect(() => {
    const loadWalletBalance = async () => {
      if (form.modeOfPayment !== 'WALLET' || !user?.userId) {
        return;
      }

      try {
        setWalletBalanceLoading(true);
        const response = await paymentApi.getWalletBalance(user.userId);
        setWalletBalance(response?.data?.balance ?? 0);
      } catch {
        setWalletBalance(null);
      } finally {
        setWalletBalanceLoading(false);
      }
    };

    loadWalletBalance();
  }, [form.modeOfPayment, user?.userId]);

  const handlePlaceOrder = async (event) => {
    event.preventDefault();

    if (!user?.userId) {
      toast.error('Please sign in to place an order.');
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }

    if (!cart?.items?.length) {
      toast.error('Your cart is empty.');
      navigate('/restaurants');
      return;
    }

    if (!form.deliveryAddress.trim()) {
      toast.error('Delivery address is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (form.modeOfPayment === 'WALLET' && walletBalance != null && total > walletBalance) {
        toast.error('Insufficient wallet balance. Please choose another payment mode or top up wallet.');
        setIsSubmitting(false);
        return;
      }

      const response = await orderApi.placeOrder({
        customerId: user.userId,
        deliveryAddress: form.deliveryAddress.trim(),
        modeOfPayment: form.modeOfPayment,
        specialInstructions: form.specialInstructions.trim() || undefined,
      });

      const placedOrder = response.data;

      if (form.modeOfPayment === 'CARD' || form.modeOfPayment === 'UPI') {
        navigate('/pay', {
          replace: true,
          state: {
            order: placedOrder,
            paymentMode: form.modeOfPayment,
            amount: placedOrder?.finalAmount ?? placedOrder?.totalAmount ?? total,
            customerId: user.userId,
            customerName: user.fullName,
            customerEmail: user.email,
            customerPhone: user.phoneNumber || user.phone || user.mobileNumber,
          },
        });
        return;
      }

      await processPaymentForOrder(placedOrder, form.modeOfPayment);

      await fetchCart();
      setCartOpen(false);
      toast.success(`Order #${placedOrder?.orderId || ''} placed successfully.`.trim());
      navigate('/orders', { replace: true, state: { placedOrderId: placedOrder?.orderId } });
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to place order.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!loading && (!cart || !cart.items?.length)) {
    return (
      <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 py-10">
          <button
            onClick={() => navigate('/restaurants')}
            className="inline-flex items-center gap-2 text-gray-300 hover:text-white transition-colors mb-8"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Restaurants</span>
          </button>

          <div className="glass border border-white/10 rounded-3xl p-8 md:p-10 text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-5">
              <ShoppingBag className="w-9 h-9 text-gray-500" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black mb-3">Your cart is empty</h1>
            <p className="text-gray-400 max-w-xl mx-auto mb-8">
              Add a few items from a restaurant, then come back here to confirm the delivery address and payment method.
            </p>
            <button
              onClick={() => navigate('/restaurants')}
              className="px-6 py-3 rounded-xl bg-primary text-[#050505] font-black hover:bg-cyan-500 transition-colors"
            >
              Browse Restaurants
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-primary/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[520px] h-[520px] bg-accent/10 rounded-full blur-[130px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 md:py-10">
        <div className="flex items-center justify-between gap-4 mb-8">
          <button
            onClick={() => navigate('/restaurants')}
            className="inline-flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Continue Browsing</span>
          </button>
          <button
            onClick={() => navigate('/orders')}
            className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl text-sm font-medium transition-all"
          >
            <ReceiptText className="w-4 h-4" />
            <span>View Orders</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 glass border border-white/10 rounded-3xl p-6 md:p-8"
          >
            <div className="flex items-center justify-between gap-4 pb-6 border-b border-white/10 mb-6">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-primary font-bold mb-2">Checkout</p>
                <h1 className="text-3xl md:text-4xl font-black">Confirm your order</h1>
              </div>
              <div className="hidden md:flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-3 rounded-2xl">
                <MapPin className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Restaurant</p>
                  <p className="font-semibold">
                    {restaurantLoading ? 'Loading...' : (restaurantName || `Restaurant #${cart.restaurantId}`)}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handlePlaceOrder} className="space-y-6">
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300">Delivery Address</label>
                <textarea
                  required
                  rows={4}
                  value={form.deliveryAddress}
                  onChange={(event) => setForm((current) => ({ ...current, deliveryAddress: event.target.value }))}
                  placeholder="House number, street, landmark, city"
                  className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300">Payment Method</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {paymentOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setForm((current) => ({ ...current, modeOfPayment: option.value }))}
                      className={`text-left rounded-2xl border px-4 py-4 transition-all ${form.modeOfPayment === option.value
                          ? 'border-primary bg-primary/15 shadow-[0_0_0_1px_rgba(34,211,238,0.15)]'
                          : 'border-white/10 bg-white/5 hover:bg-white/8'
                        }`}
                    >
                      <div className="font-semibold">{option.label}</div>
                      <div className="text-xs text-gray-400 mt-1">{option.description}</div>
                    </button>
                  ))}
                </div>
                {form.modeOfPayment === 'WALLET' && (
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
                    <p className="text-gray-400">Wallet Balance</p>
                    <p className="font-bold text-primary mt-1">
                      {walletBalanceLoading ? 'Loading...' : (walletBalance != null ? formatINR(walletBalance) : 'Not available')}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300">Special Instructions</label>
                <textarea
                  rows={3}
                  value={form.specialInstructions}
                  onChange={(event) => setForm((current) => ({ ...current, specialInstructions: event.target.value }))}
                  placeholder="No onions, call on arrival, ring the bell..."
                  className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-3 bg-primary hover:bg-cyan-500 text-[#050505] font-black py-4 px-6 rounded-2xl transition-all shadow-lg shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShoppingBag className="w-5 h-5" />}
                <span>{isSubmitting ? 'Placing Order...' : `Place Order • ${formatINR(total)}`}</span>
              </button>
            </form>
          </motion.div>

          <motion.aside
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="glass border border-white/10 rounded-3xl p-6 md:p-8 h-fit sticky top-6"
          >
            <div className="flex items-center gap-3 mb-5 pb-5 border-b border-white/10">
              <ShoppingBag className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-gray-500 font-bold">Summary</p>
                <h2 className="text-xl font-black">Your cart</h2>
              </div>
            </div>

            <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
              {cart.items.map((item) => (
                <div key={item.menuItemId} className="flex gap-3 items-start bg-white/5 border border-white/5 rounded-2xl p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white truncate">{item.name}</p>
                        <p className="text-xs text-gray-500 mt-1">Qty {item.quantity}</p>
                      </div>
                      <p className="font-bold text-primary">{formatINR(item.price * item.quantity)}</p>
                    </div>
                    {item.customization && <p className="text-xs text-gray-400 mt-2 truncate">{item.customization}</p>}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-white/10 space-y-2 text-sm">
              <div className="flex items-center justify-between text-gray-400">
                <span>Items</span>
                <span>{cart.items.length}</span>
              </div>
              <div className="flex items-center justify-between text-gray-400">
                <span>Subtotal</span>
                <span>{formatINR(total)}</span>
              </div>
              <div className="flex items-center justify-between text-white font-black text-lg pt-2 border-t border-white/10 mt-2">
                <span>Total</span>
                <span>{formatINR(total)}</span>
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-primary/10 border border-primary/20 p-4 text-sm text-gray-200">
              <p className="font-semibold text-primary mb-1">What happens next</p>
              <p>
                Once you place the order, the cart is cleared and the order appears in your order history with live status updates.
              </p>
            </div>
          </motion.aside>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
