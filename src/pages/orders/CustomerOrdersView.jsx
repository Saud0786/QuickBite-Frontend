import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ClipboardList, Clock3, Loader2, MapPin, RefreshCw, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { orderApi } from '../../api/order.api';
import { paymentApi } from '../../api/payment.api';
import { restaurantApi } from '../../api/restaurant.api';
import { formatINR } from '../../utils/currency';

const statusFilters = ['ALL', 'PLACED', 'CONFIRMED', 'PREPARING', 'PACKING', 'PICKED_UP', 'DELIVERED', 'CANCELLED'];

const statusMeta = {
  PLACED: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  CONFIRMED: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  PREPARING: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  PACKING: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  PICKED_UP: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  DELIVERED: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  CANCELLED: 'bg-red-500/15 text-red-300 border-red-500/30',
};

const customerCancellableStatuses = new Set(['PLACED']);

const orderDateFormatter = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const CustomerOrdersView = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [restaurantNames, setRestaurantNames] = useState({});
  const [paymentsByOrderId, setPaymentsByOrderId] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [actingOrderId, setActingOrderId] = useState(null);

  const loadOrders = async () => {
    if (!user?.userId) {
      setOrders([]);
      setRestaurantNames({});
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await orderApi.getOrdersByCustomer(user.userId);
      const nextOrders = response.data || [];
      setOrders(nextOrders);

      const paymentEntries = await Promise.all(
        nextOrders.map(async (order) => {
          try {
            const paymentResponse = await paymentApi.getPaymentByOrderId(order.orderId);
            return [order.orderId, paymentResponse?.data || null];
          } catch {
            return [order.orderId, null];
          }
        })
      );
      setPaymentsByOrderId(Object.fromEntries(paymentEntries));

      const uniqueRestaurantIds = [...new Set(nextOrders.map((order) => order.restaurantId).filter(Boolean))];
      const labelEntries = await Promise.all(
        uniqueRestaurantIds.map(async (restaurantId) => {
          try {
            const restaurantResponse = await restaurantApi.getRestaurantById(restaurantId);
            return [restaurantId, restaurantResponse.data?.name || `Restaurant #${restaurantId}`];
          } catch {
            return [restaurantId, `Restaurant #${restaurantId}`];
          }
        })
      );
      setRestaurantNames(Object.fromEntries(labelEntries));
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load orders.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [user?.userId]);

  const visibleOrders = useMemo(() => {
    if (selectedFilter === 'ALL') return orders;
    return orders.filter((order) => order.orderStatus === selectedFilter);
  }, [orders, selectedFilter]);

  const refreshOrders = async () => {
    setRefreshing(true);
    await loadOrders();
  };

  const cancelOrder = async (orderId) => {
    try {
      setActingOrderId(orderId);
      await orderApi.cancelOrder(orderId);
      toast.success(`Order #${orderId} cancelled.`);
      await loadOrders();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to cancel this order.');
    } finally {
      setActingOrderId(null);
    }
  };

  const reorderOrder = async (order) => {
    try {
      setActingOrderId(order.orderId);
      await orderApi.reorder(order.orderId, {
        customerId: user.userId,
        deliveryAddress: order.deliveryAddress,
        modeOfPayment: order.modeOfPayment || 'COD',
        specialInstructions: order.specialInstructions || '',
      });
      toast.success(`Reorder placed from order #${order.orderId}.`);
      await loadOrders();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to reorder this order.');
    } finally {
      setActingOrderId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="max-w-7xl mx-auto px-6 py-8 md:py-10">
        <div className="flex items-center justify-between gap-4 mb-8">
          <button
            onClick={() => navigate('/restaurants')}
            className="inline-flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Restaurants</span>
          </button>

          <button
            onClick={refreshOrders}
            className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl text-sm font-medium transition-all"
          >
            {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            <span>Refresh</span>
          </button>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass border border-white/10 rounded-3xl p-6 md:p-8 mb-8"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-primary font-bold mb-2">My Orders</p>
          <h1 className="text-3xl md:text-5xl font-black mb-3">Customer Order History</h1>
          <p className="text-gray-400 max-w-2xl">Track your orders and quickly cancel or reorder when eligible.</p>

          <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-white/10">
            {statusFilters.map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all border ${selectedFilter === filter
                  ? 'bg-primary/20 border-primary/40 text-primary'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {filter === 'ALL' ? 'All Orders' : filter.replace('_', ' ')}
              </button>
            ))}
          </div>
        </motion.section>

        {loading ? (
          <div className="flex justify-center items-center py-24">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
        ) : visibleOrders.length === 0 ? (
          <div className="glass border border-white/10 rounded-3xl p-10 text-center max-w-2xl mx-auto">
            <ClipboardList className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-black mb-2">No orders found</h2>
            <p className="text-gray-400">You have not placed any orders yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {visibleOrders.map((order) => {
              const restaurantLabel = restaurantNames[order.restaurantId] || `Restaurant #${order.restaurantId}`;
              const badgeClass = statusMeta[order.orderStatus] || 'bg-white/10 text-white border-white/10';
              const busy = actingOrderId === order.orderId;
              const canCancel = customerCancellableStatuses.has(order.orderStatus);
              const payment = paymentsByOrderId[order.orderId];

              return (
                <div key={order.orderId} className="glass border border-white/10 rounded-3xl overflow-hidden">
                  <div className="p-6 md:p-7 border-b border-white/10 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${badgeClass}`}>{order.orderStatus}</span>
                        <span className="text-xs uppercase tracking-[0.25em] text-gray-500 font-semibold">Order #{order.orderId}</span>
                      </div>
                      <h2 className="text-2xl font-black mb-2">{restaurantLabel}</h2>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                        <span className="inline-flex items-center gap-2"><Clock3 className="w-4 h-4" />{orderDateFormatter.format(new Date(order.orderDate))}</span>
                        <span className="inline-flex items-center gap-2"><MapPin className="w-4 h-4" />{order.deliveryAddress}</span>
                        <span className="inline-flex items-center gap-2"><ShoppingBag className="w-4 h-4" />{order.itemCount} item{order.itemCount !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-widest text-gray-500 font-semibold">Total</p>
                      <p className="font-black mt-1 text-primary">{formatINR(order.finalAmount ?? order.totalAmount)}</p>
                    </div>
                  </div>

                  <div className="p-6 md:p-7">
                    <div className="space-y-2">
                      {order.items?.map((item) => (
                        <div key={item.orderItemId} className="flex items-start justify-between gap-4 rounded-2xl bg-white/5 border border-white/5 px-4 py-3">
                          <div className="min-w-0">
                            <p className="font-semibold truncate">{item.name}</p>
                            <p className="text-xs text-gray-500 mt-1">Qty {item.quantity} • {formatINR(item.price)}</p>
                          </div>
                          <p className="font-bold text-primary whitespace-nowrap">{formatINR(item.subtotal)}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 text-sm text-gray-400">
                      Estimated delivery: {order.estimatedDelivery ? orderDateFormatter.format(new Date(order.estimatedDelivery)) : 'TBD'}
                    </div>
                    <div className="mt-2 text-sm text-gray-400">
                      Payment: <span className="text-gray-200">{payment?.mode || order.modeOfPayment}</span>
                      {' • '}
                      Status: <span className="text-gray-200">{payment?.status || 'PENDING'}</span>
                      {payment?.razorpayPaymentId && (
                        <>
                          {' • '}
                          Ref: <span className="text-gray-200">{payment.razorpayPaymentId}</span>
                        </>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        onClick={() => reorderOrder(order)}
                        disabled={busy}
                        className="px-4 py-2 rounded-xl bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary text-sm font-semibold transition-all disabled:opacity-60"
                      >
                        {busy ? 'Processing...' : 'Reorder Same Food'}
                      </button>

                      {canCancel && (
                        <button
                          onClick={() => cancelOrder(order.orderId)}
                          disabled={busy}
                          className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-300 text-sm font-semibold transition-all disabled:opacity-60"
                        >
                          {busy ? 'Processing...' : 'Cancel Order'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerOrdersView;
