import api from './axios';

export const orderApi = {
  placeOrder: async (payload) => {
    const res = await api.post('/orders/place', payload);
    return res.data;
  },
  getOrderById: async (orderId) => {
    const res = await api.get(`/orders/${orderId}`);
    return res.data;
  },
  getOrdersByCustomer: async (customerId) => {
    const res = await api.get(`/orders/customer/${customerId}`);
    return res.data;
  },
  getOrdersByRestaurant: async (restaurantId) => {
    const res = await api.get(`/orders/restaurant/${restaurantId}`);
    return res.data;
  },
  getActiveOrders: async (restaurantId) => {
    const res = await api.get(`/orders/restaurant/${restaurantId}/active`);
    return res.data;
  },
  updateStatus: async (orderId, status) => {
    const res = await api.put(`/orders/${orderId}/status`, { status });
    return res.data;
  },
  assignDeliveryAgent: async (orderId, deliveryAgentId) => {
    const res = await api.put(`/orders/${orderId}/assign-agent`, { deliveryAgentId });
    return res.data;
  },
  cancelOrder: async (orderId) => {
    const res = await api.put(`/orders/${orderId}/cancel`);
    return res.data;
  },
  reorder: async (orderId, payload) => {
    const res = await api.post(`/orders/${orderId}/reorder`, payload);
    return res.data;
  },
  getOrderCount: async () => {
    const res = await api.get('/orders/count');
    return res.data;
  },
};
