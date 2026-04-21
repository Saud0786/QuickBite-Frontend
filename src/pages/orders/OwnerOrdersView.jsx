import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ChevronDown, ChevronLeft, ClipboardList, Clock3, Loader2, MapPin, RefreshCw, ShoppingBag, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { orderApi } from '../../api/order.api';
import { paymentApi } from '../../api/payment.api';
import { restaurantApi } from '../../api/restaurant.api';
import { menuApi } from '../../api/menu.api';
import { deliveryApi } from '../../api/delivery.api';
import api from '../../api/axios';
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

const transitionsByStatus = {
  PLACED: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['PACKING', 'CANCELLED'],
  PACKING: ['PICKED_UP', 'CANCELLED'],
  PICKED_UP: ['DELIVERED'],
};

const orderDateFormatter = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const toStatusLabel = (status) => status.replace('_', ' ');

const extractList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const extractItem = (payload) => {
  if (!payload) return null;
  if (payload?.data && !Array.isArray(payload.data)) return payload.data;
  if (!Array.isArray(payload)) return payload;
  return null;
};

const toNumberOrNull = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const OwnerOrdersView = () => {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [restaurantNames, setRestaurantNames] = useState({});
  const [restaurantsById, setRestaurantsById] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [actingOrderId, setActingOrderId] = useState(null);
  const [pendingStatusByOrder, setPendingStatusByOrder] = useState({});
  const [openStatusMenuOrderId, setOpenStatusMenuOrderId] = useState(null);
  const [itemImagesById, setItemImagesById] = useState({});
  const [paymentsByOrderId, setPaymentsByOrderId] = useState({});
  const [customerProfilesById, setCustomerProfilesById] = useState({});
  const [nearbyAgentsByOrderId, setNearbyAgentsByOrderId] = useState({});
  const [selectedAgentByOrderId, setSelectedAgentByOrderId] = useState({});
  const [loadingAgentsOrderId, setLoadingAgentsOrderId] = useState(null);
  const [assigningAgentOrderId, setAssigningAgentOrderId] = useState(null);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const restaurantResponse = await restaurantApi.getMyRestaurants();
      const ownedRestaurants = extractList(restaurantResponse);

      if (ownedRestaurants.length === 0) {
        setOrders([]);
        setRestaurantNames({});
        return;
      }

      const labelEntries = ownedRestaurants.map((restaurant) => [
        restaurant.restaurantId,
        restaurant.name || `Restaurant #${restaurant.restaurantId}`,
      ]);
      setRestaurantNames(Object.fromEntries(labelEntries));
      setRestaurantsById(Object.fromEntries(
        ownedRestaurants.map((restaurant) => [restaurant.restaurantId, restaurant])
      ));

      const ordersByRestaurant = await Promise.all(
        ownedRestaurants.map(async (restaurant) => {
          try {
            const response = await orderApi.getOrdersByRestaurant(restaurant.restaurantId);
            return extractList(response);
          } catch {
            return [];
          }
        })
      );

      const merged = ordersByRestaurant
        .flat()
        .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
      setOrders(merged);

      const uniqueCustomerIds = [...new Set(
        merged
          .map((order) => order.customerId || order.customerID || order.userId)
          .filter(Boolean)
      )];

      if (uniqueCustomerIds.length === 0) {
        setCustomerProfilesById({});
      } else {
        const customerEntries = await Promise.all(
          uniqueCustomerIds.map(async (customerId) => {
            try {
              const response = await api.get(`/auth/user/${customerId}`);
              const profile = extractItem(response?.data);
              return [customerId, profile];
            } catch {
              return [customerId, null];
            }
          })
        );
        setCustomerProfilesById(Object.fromEntries(customerEntries));
      }

      const paymentEntries = await Promise.all(
        merged.map(async (order) => {
          try {
            const paymentResponse = await paymentApi.getPaymentByOrderId(order.orderId);
            return [order.orderId, extractItem(paymentResponse)];
          } catch {
            return [order.orderId, null];
          }
        })
      );
      setPaymentsByOrderId(Object.fromEntries(paymentEntries));

      const uniqueMenuItemIds = [...new Set(
        merged
          .flatMap((order) => (order.items || []).map((item) => item.menuItemId))
          .filter(Boolean)
      )];

      if (uniqueMenuItemIds.length === 0) {
        setItemImagesById({});
      } else {
        const imageEntries = await Promise.all(
          uniqueMenuItemIds.map(async (menuItemId) => {
            try {
              const itemResponse = await menuApi.getItemById(menuItemId);
              const imageUrl = itemResponse?.data?.imageUrl || null;
              return [menuItemId, imageUrl];
            } catch {
              return [menuItemId, null];
            }
          })
        );
        setItemImagesById(Object.fromEntries(imageEntries));
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load owner orders.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const visibleOrders = useMemo(() => {
    if (selectedFilter === 'ALL') return orders;
    return orders.filter((order) => order.orderStatus === selectedFilter);
  }, [orders, selectedFilter]);

  const summary = useMemo(() => {
    const active = orders.filter((order) => !['DELIVERED', 'CANCELLED'].includes(order.orderStatus)).length;
    const delivered = orders.filter((order) => order.orderStatus === 'DELIVERED').length;
    const todaysRevenue = orders
      .filter((order) => new Date(order.orderDate).toDateString() === new Date().toDateString())
      .reduce((sum, order) => sum + (order.finalAmount ?? order.totalAmount ?? 0), 0);

    return {
      total: orders.length,
      active,
      delivered,
      todaysRevenue,
    };
  }, [orders]);

  const refreshOrders = async () => {
    setRefreshing(true);
    await loadOrders();
  };

  const updateOrderStatus = async (orderId, nextStatus) => {
    try {
      setActingOrderId(orderId);
      await orderApi.updateStatus(orderId, nextStatus);
      toast.success(`Order #${orderId} moved to ${nextStatus}.`);
      setPendingStatusByOrder((prev) => ({ ...prev, [orderId]: '' }));
      setOpenStatusMenuOrderId(null);
      await loadOrders();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update order status.');
    } finally {
      setActingOrderId(null);
    }
  };

  const cancelOrder = async (orderId) => {
    try {
      setActingOrderId(orderId);
      await orderApi.cancelOrder(orderId);
      toast.success(`Order #${orderId} cancelled.`);
      await loadOrders();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to cancel order.');
    } finally {
      setActingOrderId(null);
    }
  };

  const loadAgentsForOrder = async (order) => {
    try {
      setLoadingAgentsOrderId(order.orderId);
      const restaurant = restaurantsById[order.restaurantId];
      const lat = toNumberOrNull(restaurant?.latitude);
      const lon = toNumberOrNull(restaurant?.longitude);

      let agents = [];
      const restaurantAgentsResponse = await deliveryApi.getRestaurantAgents(order.restaurantId);
      const restaurantAgents = extractList(restaurantAgentsResponse)
        .filter((agent) => agent?.isAvailable && agent?.isVerified && !agent?.currentOrderId);

      if (restaurantAgents.length > 0) {
        agents = restaurantAgents;
      } else if (lat !== null && lon !== null) {
        const nearbyResponse = await deliveryApi.getNearbyAgents(lat, lon, 10);
        agents = extractList(nearbyResponse)
          .filter((agent) => agent?.isAvailable && agent?.isVerified && !agent?.currentOrderId);
      } else {
        const allResponse = await deliveryApi.getAllAgents();
        agents = extractList(allResponse)
          .filter((agent) => agent?.isAvailable && agent?.isVerified && !agent?.currentOrderId);
      }

      setNearbyAgentsByOrderId((prev) => ({ ...prev, [order.orderId]: agents }));
      if (agents.length === 0) {
        toast('No available delivery agents found right now.');
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to fetch delivery agents.');
    } finally {
      setLoadingAgentsOrderId(null);
    }
  };

  const assignAgentToOrder = async (orderId) => {
    const selectedAgentId = selectedAgentByOrderId[orderId];
    if (!selectedAgentId) {
      toast.error('Select a delivery agent first.');
      return;
    }

    try {
      setAssigningAgentOrderId(orderId);
      await orderApi.assignDeliveryAgent(orderId, Number(selectedAgentId));
      toast.success(`Agent ${selectedAgentId} assigned to order #${orderId}.`);
      setSelectedAgentByOrderId((prev) => ({ ...prev, [orderId]: '' }));
      await loadOrders();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to assign delivery agent.');
    } finally {
      setAssigningAgentOrderId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="max-w-7xl mx-auto px-6 py-8 md:py-10">
        <div className="flex items-center justify-between gap-4 mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
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
          <p className="text-xs uppercase tracking-[0.3em] text-primary font-bold mb-2">Owner Panel</p>
          <h1 className="text-3xl md:text-5xl font-black mb-3">Orders Management</h1>
          <p className="text-gray-400 max-w-2xl">Manage incoming restaurant orders and update lifecycle status from placed to delivered.</p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <p className="text-[11px] uppercase tracking-wider text-gray-500">Total Orders</p>
              <p className="text-xl font-black mt-1">{summary.total}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <p className="text-[11px] uppercase tracking-wider text-gray-500">Active Queue</p>
              <p className="text-xl font-black mt-1 text-amber-300">{summary.active}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <p className="text-[11px] uppercase tracking-wider text-gray-500">Delivered</p>
              <p className="text-xl font-black mt-1 text-emerald-300">{summary.delivered}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <p className="text-[11px] uppercase tracking-wider text-gray-500">Today Revenue</p>
              <p className="text-xl font-black mt-1 text-primary">{formatINR(summary.todaysRevenue)}</p>
            </div>
          </div>

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
                {filter === 'ALL' ? 'All Orders' : toStatusLabel(filter)}
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
            <p className="text-gray-400">No restaurant orders are available for the selected filter.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {visibleOrders.map((order) => {
              const restaurantLabel = restaurantNames[order.restaurantId] || `Restaurant #${order.restaurantId}`;
              const badgeClass = statusMeta[order.orderStatus] || 'bg-white/10 text-white border-white/10';
              const allowedTransitions = transitionsByStatus[order.orderStatus] || [];
              const busy = actingOrderId === order.orderId;
              const pendingStatus = pendingStatusByOrder[order.orderId] || '';
              const payment = paymentsByOrderId[order.orderId];
              const customerId = order.customerId || order.customerID || order.userId;
              const customerProfile = customerId ? customerProfilesById[customerId] : null;
              const displayCustomer = order.customerName || customerProfile?.fullName || (customerId ? `ID ${customerId}` : 'N/A');
              const displayPhone = order.customerPhone || customerProfile?.phone || 'N/A';
              const allowAssignAgent = ['CONFIRMED', 'PREPARING', 'PACKING'].includes(order.orderStatus) && !order.deliveryAgentId;
              const agents = nearbyAgentsByOrderId[order.orderId] || [];
              const selectedAgent = selectedAgentByOrderId[order.orderId] || '';
              const loadingAgents = loadingAgentsOrderId === order.orderId;
              const assigningAgent = assigningAgentOrderId === order.orderId;

              return (
                <div
                  key={order.orderId}
                  className={`glass border border-white/10 rounded-3xl relative ${openStatusMenuOrderId === order.orderId ? 'z-20 overflow-visible' : 'z-0 overflow-hidden'}`}
                >
                  <div className="p-6 md:p-7 border-b border-white/10 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${badgeClass}`}>{order.orderStatus}</span>
                        <span className="text-xs uppercase tracking-[0.25em] text-gray-500 font-semibold">Order #{order.orderId}</span>
                      </div>
                      <h2 className="text-2xl font-black mb-2">{restaurantLabel}</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-gray-300">
                        <span className="inline-flex items-center gap-2"><Clock3 className="w-4 h-4" />{orderDateFormatter.format(new Date(order.orderDate))}</span>
                        <span className="inline-flex items-center gap-2"><MapPin className="w-4 h-4" />{order.deliveryAddress}</span>
                        <span className="inline-flex items-center gap-2"><ShoppingBag className="w-4 h-4" />{order.itemCount} item{order.itemCount !== 1 ? 's' : ''}</span>
                        <span className="text-gray-400">Customer: <span className="text-gray-200">{displayCustomer}</span></span>
                        <span className="text-gray-400">Mobile: <span className="text-gray-200">{displayPhone}</span></span>
                        <span className="text-gray-400">Payment: <span className="text-gray-200">{payment?.mode || order.modeOfPayment}</span></span>
                        <span className="text-gray-400">Payment Status: <span className="text-gray-200">{payment?.status || 'PENDING'}</span></span>
                        <span className="text-gray-400">Payment Ref: <span className="text-gray-200">{payment?.razorpayPaymentId || payment?.razorpayOrderId || 'N/A'}</span></span>
                        <span className="text-gray-400">Delivery Agent: <span className="text-gray-200">{order.deliveryAgentId ? `#${order.deliveryAgentId}` : 'Not assigned'}</span></span>
                        <span className="text-gray-400">Total: <span className="text-primary font-bold">{formatINR(order.finalAmount ?? order.totalAmount)}</span></span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 md:p-7">
                    <div className="space-y-2 mb-5">
                      {order.items?.map((item) => (
                        <div key={item.orderItemId} className="flex items-start justify-between gap-4 rounded-2xl bg-white/5 border border-white/5 px-4 py-3">
                          <div className="flex items-start gap-3 min-w-0">
                            {itemImagesById[item.menuItemId] ? (
                              <img
                                src={itemImagesById[item.menuItemId]}
                                alt={item.name}
                                className="w-12 h-12 rounded-lg object-cover border border-white/10 shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg border border-dashed border-white/15 bg-white/5 shrink-0 flex items-center justify-center text-[10px] text-gray-500">
                                No img
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-semibold truncate">{item.name}</p>
                              <p className="text-xs text-gray-500 mt-1">Qty {item.quantity} • {formatINR(item.price)}</p>
                            </div>
                          </div>
                          <p className="font-bold text-primary whitespace-nowrap">{formatINR(item.subtotal)}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-3 relative z-30">
                      {allowAssignAgent && (
                        <>
                          <button
                            onClick={() => loadAgentsForOrder(order)}
                            disabled={loadingAgents || assigningAgent || busy}
                            className="px-4 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-300 text-sm font-semibold transition-all disabled:opacity-60 inline-flex items-center gap-2"
                          >
                            {loadingAgents ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                            {loadingAgents ? 'Finding Agents...' : 'Find Agents'}
                          </button>

                          {agents.length > 0 && (
                            <>
                              <select
                                value={selectedAgent}
                                onChange={(event) => setSelectedAgentByOrderId((prev) => ({
                                  ...prev,
                                  [order.orderId]: event.target.value,
                                }))}
                                className="min-w-[240px] px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none"
                                disabled={assigningAgent || busy}
                              >
                                <option value="">Select delivery agent</option>
                                {agents.map((agent) => (
                                  <option key={agent.agentId} value={agent.agentId}>
                                    #{agent.agentId} {agent.fullName} ({agent.vehicleType})
                                  </option>
                                ))}
                              </select>

                              <button
                                onClick={() => assignAgentToOrder(order.orderId)}
                                disabled={!selectedAgent || assigningAgent || busy}
                                className="px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-300 text-sm font-semibold transition-all disabled:opacity-60"
                              >
                                {assigningAgent ? 'Assigning...' : 'Assign Agent'}
                              </button>
                            </>
                          )}
                        </>
                      )}

                      {allowedTransitions.length > 0 && (
                        <>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setOpenStatusMenuOrderId((prev) => (prev === order.orderId ? null : order.orderId))}
                              disabled={busy}
                              className="min-w-[210px] px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white inline-flex items-center justify-between gap-2 hover:bg-white/10 transition-all disabled:opacity-60"
                            >
                              <span>{pendingStatus ? toStatusLabel(pendingStatus) : 'Select new status'}</span>
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            </button>

                            {openStatusMenuOrderId === order.orderId && (
                              <div className="absolute z-50 mt-2 w-full rounded-xl border border-white/10 bg-[#0c0c0f] shadow-2xl overflow-hidden max-h-56 overflow-y-auto">
                                {allowedTransitions.map((status) => {
                                  const active = pendingStatus === status;
                                  return (
                                    <button
                                      key={status}
                                      type="button"
                                      onClick={() => {
                                        setPendingStatusByOrder((prev) => ({ ...prev, [order.orderId]: status }));
                                        setOpenStatusMenuOrderId(null);
                                      }}
                                      className={`w-full px-4 py-2.5 text-left text-sm inline-flex items-center justify-between transition-colors ${active ? 'bg-primary/15 text-primary' : 'text-gray-200 hover:bg-white/5'}`}
                                    >
                                      <span>{toStatusLabel(status)}</span>
                                      {active && <Check className="w-4 h-4" />}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => pendingStatus && updateOrderStatus(order.orderId, pendingStatus)}
                            disabled={busy || !pendingStatus}
                            className="px-4 py-2 rounded-xl bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary text-sm font-semibold transition-all disabled:opacity-60"
                          >
                            {busy ? 'Updating...' : 'Update Status'}
                          </button>
                        </>
                      )}

                      {(allowedTransitions.includes('CANCELLED')) && (
                        <button
                          onClick={() => cancelOrder(order.orderId)}
                          disabled={busy}
                          className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-300 text-sm font-semibold transition-all disabled:opacity-60"
                        >
                          {busy ? 'Updating...' : 'Cancel Order'}
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

export default OwnerOrdersView;
