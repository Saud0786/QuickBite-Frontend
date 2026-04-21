import api from './axios';

export const deliveryApi = {
  registerAgent: async (payload) => {
    const res = await api.post('/agents/register', payload);
    return res.data;
  },
  getNearbyAgents: async (lat, lon, radius = 10) => {
    const res = await api.get('/agents/nearby', {
      params: { lat, lon, radius },
    });
    return res.data;
  },
  getRestaurantAgents: async (restaurantId) => {
    const res = await api.get(`/agents/restaurant/${restaurantId}`);
    return res.data;
  },
  getAllAgents: async () => {
    const res = await api.get('/agents');
    return res.data;
  },
  verifyAgent: async (agentId) => {
    const res = await api.put(`/agents/${agentId}/verify`);
    return res.data;
  },
  toggleAvailability: async (agentId, available) => {
    const res = await api.put(`/agents/${agentId}/availability`, { available });
    return res.data;
  },
  completeDelivery: async (agentId) => {
    const res = await api.post(`/agents/${agentId}/complete-delivery`);
    return res.data;
  },
};
