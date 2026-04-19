import api from './axios';

export const restaurantApi = {
  // Public
  getActiveRestaurants: async () => {
    const res = await api.get('/restaurants');
    return res.data;
  },
  getRestaurantById: async (id) => {
    const res = await api.get(`/restaurants/${id}`);
    return res.data;
  },
  searchRestaurants: async (query) => {
    const res = await api.get(`/restaurants/search?q=${query}`);
    return res.data;
  },
  getCuisines: async () => {
    const res = await api.get('/restaurants/cuisines');
    return res.data;
  },
  
  // Owner
  registerRestaurant: async (data) => {
    const res = await api.post('/restaurants', data);
    return res.data;
  },
  updateRestaurant: async (id, data) => {
    const res = await api.put(`/restaurants/${id}`, data);
    return res.data;
  },
  getMyRestaurants: async () => {
    const res = await api.get('/restaurants/my');
    return res.data;
  },
  toggleOpen: async (id) => {
    const res = await api.put(`/restaurants/${id}/toggle-open`);
    return res.data;
  },
  
  // Admin
  getPendingApproval: async () => {
    const res = await api.get('/restaurants/pending');
    return res.data;
  },
  approveRestaurant: async (id) => {
    const res = await api.put(`/restaurants/${id}/approve`);
    return res.data;
  },
  deleteRestaurant: async (id) => {
    const res = await api.delete(`/restaurants/${id}`);
    return res.data;
  }
};
