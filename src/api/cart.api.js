import api from './axios';

export const cartApi = {
  // GET /cart/{customerId}
  getCart: async (customerId) => {
    const res = await api.get(`/cart/${customerId}`);
    return res.data;
  },

  // POST /cart/{customerId}/items
  addItem: async (customerId, itemData) => {
    const res = await api.post(`/cart/${customerId}/items`, itemData);
    return res.data;
  },

  // DELETE /cart/{customerId}/items/{menuItemId}
  removeItem: async (customerId, menuItemId) => {
    const res = await api.delete(`/cart/${customerId}/items/${menuItemId}`);
    return res.data;
  },

  // PUT /cart/{customerId}/items  (updateQuantity)
  updateQuantity: async (customerId, menuItemId, quantity) => {
    const res = await api.put(`/cart/${customerId}/items`, { menuItemId, quantity });
    return res.data;
  },

  // DELETE /cart/{customerId}  (clearCart)
  clearCart: async (customerId) => {
    const res = await api.delete(`/cart/${customerId}`);
    return res.data;
  },

  // POST /cart/{customerId}/promo
  applyPromo: async (customerId, promoCode) => {
    const res = await api.post(`/cart/${customerId}/promo`, { promoCode });
    return res.data;
  },

  // PUT /cart/{customerId}/restaurant
  changeRestaurant: async (customerId, restaurantId) => {
    const res = await api.put(`/cart/${customerId}/restaurant`, { restaurantId });
    return res.data;
  },

  // GET /cart/{customerId}/total
  getTotal: async (customerId) => {
    const res = await api.get(`/cart/${customerId}/total`);
    return res.data;
  },
};
