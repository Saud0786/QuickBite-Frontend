import api from './axios';

export const menuApi = {
  getMenuByRestaurant: async (restaurantId) => {
    const res = await api.get(`/menu/restaurant/${restaurantId}/items`);
    return res.data;
  },
  getCategoriesByRestaurant: async (restaurantId) => {
    const res = await api.get(`/menu/restaurant/${restaurantId}/categories`);
    return res.data;
  },
  addCategory: async (categoryData) => {
    const res = await api.post('/menu/category', categoryData);
    return res.data;
  },
  updateCategory: async (categoryId, categoryData) => {
    const res = await api.put(`/menu/category/${categoryId}`, categoryData);
    return res.data;
  },
  addMenuItem: async (itemData) => {
    const res = await api.post('/menu/item', itemData);
    return res.data;
  },
  updateMenuItem: async (itemId, itemData) => {
    const res = await api.put(`/menu/item/${itemId}`, itemData);
    return res.data;
  },
  toggleAvailability: async (itemId) => {
    const res = await api.put(`/menu/item/${itemId}/toggle`);
    return res.data;
  },
  deleteMenuItem: async (itemId) => {
    const res = await api.delete(`/menu/item/${itemId}`);
    return res.data;
  },
  deleteCategory: async (categoryId) => {
    const res = await api.delete(`/menu/category/${categoryId}`);
    return res.data;
  },
  searchMenuItems: async (keyword) => {
    const res = await api.get(`/menu/search?keyword=${encodeURIComponent(keyword)}`);
    return res.data;
  },
  getVegItems: async (restaurantId) => {
    const res = await api.get(`/menu/restaurant/${restaurantId}/veg`);
    return res.data;
  }
};
