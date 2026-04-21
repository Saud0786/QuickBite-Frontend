import api from './axios';

export const paymentApi = {
  createOrder: async (payload) => {
    const res = await api.post('/payments/create-order', payload);
    return res.data;
  },
  verifyPayment: async (payload) => {
    const res = await api.post('/payments/verify', payload);
    return res.data;
  },
  processCOD: async (payload) => {
    const res = await api.post('/payments/cod', payload);
    return res.data;
  },
  payFromWallet: async (payload) => {
    const res = await api.post('/payments/wallet/pay', payload);
    return res.data;
  },
  refundPayment: async (payload) => {
    const res = await api.post('/payments/refund', payload);
    return res.data;
  },
  getPaymentByOrderId: async (orderId) => {
    const res = await api.get(`/payments/order/${orderId}`);
    return res.data;
  },
  getPaymentsByCustomer: async (customerId) => {
    const res = await api.get(`/payments/customer/${customerId}`);
    return res.data;
  },
  getWallet: async (customerId) => {
    const res = await api.get(`/wallet/${customerId}`);
    return res.data;
  },
  getWalletBalance: async (customerId) => {
    const res = await api.get(`/wallet/${customerId}/balance`);
    return res.data;
  },
  initiateWalletTopUp: async (payload) => {
    const res = await api.post('/wallet/topup/initiate', payload);
    return res.data;
  },
  confirmWalletTopUp: async (payload) => {
    const res = await api.post('/wallet/topup/confirm', payload);
    return res.data;
  },
  getWalletStatements: async (customerId) => {
    const res = await api.get(`/wallet/${customerId}/statements`);
    return res.data;
  },
};
