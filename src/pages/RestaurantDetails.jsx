import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { restaurantApi } from '../api/restaurant.api';
import { menuApi } from '../api/menu.api';
import toast from 'react-hot-toast';
import { ChevronLeft, Star, Clock, ShoppingBag, Info, Plus, Minus, ClipboardList } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import CartButton from '../components/CartButton';
import { formatINR } from '../utils/currency';

const RestaurantDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { addItem, getItemQuantity, updateQuantity, removeItem, setCartOpen } = useCart();

  const [restaurant, setRestaurant] = useState(null);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addingItemId, setAddingItemId] = useState(null);

  useEffect(() => {
    fetchRestaurantData();
  }, [id]);

  const fetchRestaurantData = async () => {
    try {
      setLoading(true);
      // Fetch concurrently
      const [restRes, catRes, menuRes] = await Promise.all([
        restaurantApi.getRestaurantById(id),
        menuApi.getCategoriesByRestaurant(id),
        menuApi.getMenuByRestaurant(id)
      ]);

      setRestaurant(restRes.data);
      setCategories(catRes.data || []);
      setMenuItems(menuRes.data || []);

      if (catRes.data && catRes.data.length > 0) {
        setActiveCategoryId(catRes.data[0].categoryId);
      }
    } catch (err) {
      toast.error('Failed to load restaurant details');
      navigate('/restaurants');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (item) => {
    if (!user) {
      toast.error('Please sign in to order.');
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    const role = String(user?.role || '').toUpperCase();
    if (role && role !== 'CUSTOMER' && role !== 'ROLE_CUSTOMER') {
      toast.error('Only customers can add items to cart.');
      return;
    }

    setAddingItemId(item.itemId);
    await addItem(Number(id), item);
    setAddingItemId(null);
  };

  const handleQtyChange = (item, delta) => {
    const current = getItemQuantity(item.itemId);
    const next = current + delta;
    if (next <= 0) {
      removeItem(item.itemId, item.name);
    } else {
      updateQuantity(item.itemId, next);
    }
  };

  const categoriesByDisplayOrder = useMemo(() => {
    return [...categories].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }, [categories]);

  const itemsByCategory = useMemo(() => {
    return categoriesByDisplayOrder.reduce((acc, category) => {
      acc[category.categoryId] = menuItems.filter(item => item.categoryId === category.categoryId && item.isAvailable);
      return acc;
    }, {});
  }, [categoriesByDisplayOrder, menuItems]);

  const minimumAvailableItemPrice = useMemo(() => {
    const availablePrices = menuItems
      .filter(item => item.isAvailable && Number(item.price) > 0)
      .map(item => Number(item.price));

    if (availablePrices.length === 0) {
      return 0;
    }

    return Math.min(...availablePrices);
  }, [menuItems]);

  const displayMinimumPrice = restaurant?.minOrderAmount > 0
    ? restaurant.minOrderAmount
    : minimumAvailableItemPrice;

  if (loading || !restaurant) {
    return (
      <div className="min-h-screen bg-[#050505] flex justify-center items-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Dynamic Hero Section */}
      <div className="relative h-80 sm:h-96 w-full">
        <div className="absolute inset-0 bg-black">
          <img
            src={restaurant.imageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80'}
            alt={restaurant.name}
            className="w-full h-full object-cover opacity-60"
            onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80'; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent" />
        </div>

        {/* Top Navbar overlapping banner */}
        <div className="absolute top-0 left-0 right-0 p-6 z-10 flex justify-between items-center max-w-7xl mx-auto">
          <button
            onClick={() => navigate('/restaurants')}
            className="w-10 h-10 rounded-full glass border border-white/10 flex justify-center items-center hover:bg-white/10 hover:-translate-x-1 transition-all"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <div className="flex items-center gap-3">
            {user && (
              <button onClick={() => navigate('/orders')} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-4 py-2.5 rounded-xl border border-white/10 transition-all font-medium text-sm">
                <ClipboardList className="w-4 h-4" />
                <span className="hidden sm:inline">Orders</span>
              </button>
            )}
            <CartButton />
          </div>
        </div>

        {/* Restaurant Header Info */}
        <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-12 max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-end pb-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className={`px-3 py-1 text-xs font-bold rounded-full border ${restaurant.isOpen ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                {restaurant.isOpen ? 'Open Now' : 'Closed'}
              </span>
              <span className="px-3 py-1 text-xs font-bold bg-white/10 backdrop-blur-md rounded-full border border-white/5 flex items-center">
                <Star className="w-3.5 h-3.5 mr-1 text-yellow-400 fill-yellow-400" />
                {restaurant.avgRating?.toFixed(1) || '0.0'} ({restaurant.totalRatings || 0} Ratings)
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2 text-white">
              {restaurant.name}
            </h1>
            <p className="text-gray-300 text-lg flex items-center">
              {restaurant.cuisine} • {restaurant.city}
            </p>
            <p className="text-gray-400 text-sm mt-2 max-w-2xl hidden md:block">
              {restaurant.description}
            </p>
          </div>

          <div className="hidden md:flex gap-6 glass px-6 py-4 rounded-2xl border border-white/5">
            <div className="text-center">
              <p className="text-gray-400 text-xs mb-1 uppercase tracking-widest font-semibold flex justify-center items-center"><Clock className="w-3 h-3 mr-1" /> Delivery</p>
              <p className="text-white font-bold text-lg">{restaurant.estimatedDeliveryMin} min</p>
            </div>
            <div className="w-px bg-white/10"></div>
            <div className="text-center">
              <p className="text-gray-400 text-xs mb-1 uppercase tracking-widest font-semibold flex justify-center items-center"><ShoppingBag className="w-3 h-3 mr-1" /> Minimum Price</p>
              <p className="text-white font-bold text-lg">{displayMinimumPrice > 0 ? formatINR(displayMinimumPrice) : 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 md:py-12 flex flex-col md:flex-row gap-10 relative z-10">

        {/* Categories Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="sticky top-24 border border-white/5 rounded-3xl p-4 glass bg-black/20">
            <h3 className="text-xl font-bold mb-4 flex items-center text-gray-200">
              Menu Categories
            </h3>
            {categories.length === 0 ? (
              <p className="text-gray-500 text-sm">No menu categories available.</p>
            ) : (
              <div className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-4 md:pb-0 hide-scrollbar">
                {categoriesByDisplayOrder.map(category => (
                  <button
                    key={category.categoryId}
                    onClick={() => setActiveCategoryId(category.categoryId)}
                    className={`flex items-center text-left px-4 py-3 rounded-xl transition-all whitespace-nowrap md:whitespace-normal border ${activeCategoryId === category.categoryId
                        ? 'bg-primary/20 border-primary/50 text-white shadow-[0_0_15px_rgba(34,211,238,0.15)]'
                        : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200'
                      }`}
                  >
                    {category.imageUrl && (
                      <img src={category.imageUrl} alt={category.name} className="w-8 h-8 rounded-full object-cover mr-3 hidden sm:block border-2 border-white/10" />
                    )}
                    <div>
                      <div className={`font-semibold ${activeCategoryId === category.categoryId ? 'text-primary' : ''}`}>{category.name}</div>
                      {category.description && <div className="text-xs opacity-70 hidden md:block line-clamp-1">{category.description}</div>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Menu Items List */}
        <div className="flex-grow">
          {categoriesByDisplayOrder.length > 0 ? (
            <div className="space-y-12">
              {categoriesByDisplayOrder.map(category => {
                const categoryItems = itemsByCategory[category.categoryId] || [];

                return (
                  <section key={category.categoryId} id={`category-${category.categoryId}`} className="scroll-mt-28">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
                      <div className="flex items-center gap-4">
                        {category.imageUrl ? (
                          <img
                            src={category.imageUrl}
                            alt={category.name}
                            className="w-16 h-16 rounded-2xl object-cover border border-white/10 shadow-lg"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xs text-gray-500">Menu</div>
                        )}
                        <div>
                          <h2 className="text-3xl font-bold text-white mb-2">
                            {category.name}
                          </h2>
                          <p className="text-gray-400">
                            {category.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    {categoryItems.length === 0 ? (
                      <div className="text-center py-10 glass rounded-2xl border border-white/5">
                        <Info className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                        <p className="text-lg font-bold text-gray-300">No items available</p>
                        <p className="text-gray-500 mt-1">Try another category.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {categoryItems.map(item => (
                          <div key={item.itemId} className="glass border border-white/5 rounded-2xl p-4 flex gap-4 hover:bg-white/5 transition-colors group">
                            <div className="flex-grow flex flex-col justify-between min-w-0">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  {item.isVeg ? (
                                    <div className="w-4 h-4 border border-green-500 flex justify-center items-center rounded-sm">
                                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    </div>
                                  ) : (
                                    <div className="w-4 h-4 border border-red-500 flex justify-center items-center rounded-sm">
                                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                    </div>
                                  )}
                                  <h3 className="text-lg font-bold text-gray-100 group-hover:text-primary transition-colors line-clamp-1">{item.name}</h3>
                                </div>

                                <div className="text-xl font-black text-white mb-2">{formatINR(item.price)}</div>
                                <p className="text-sm text-gray-400 line-clamp-2 pr-4">{item.description}</p>
                              </div>

                              <div className="mt-4 pt-4 border-t border-white/5 flex gap-2">
                                {getItemQuantity(item.itemId) > 0 ? (
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => handleQtyChange(item, -1)}
                                      className="w-8 h-8 rounded-xl bg-white/10 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 flex items-center justify-center transition-all"
                                    >
                                      <Minus className="w-3.5 h-3.5 text-white" />
                                    </button>
                                    <span className="w-6 text-center text-white font-black text-sm">
                                      {getItemQuantity(item.itemId)}
                                    </span>
                                    <button
                                      onClick={() => handleQtyChange(item, 1)}
                                      className="w-8 h-8 rounded-xl bg-primary/20 hover:bg-primary/40 border border-primary/30 flex items-center justify-center transition-all"
                                    >
                                      <Plus className="w-3.5 h-3.5 text-primary" />
                                    </button>
                                    <button
                                      onClick={() => setCartOpen(true)}
                                      className="ml-2 px-4 py-1.5 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary rounded-xl font-bold text-xs transition-all"
                                    >
                                      View Cart
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleAddToCart(item)}
                                    disabled={addingItemId === item.itemId}
                                    className="px-5 py-2 bg-white/10 hover:bg-primary hover:text-[#111] border border-white/10 hover:border-primary rounded-xl font-bold transition-all text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {addingItemId === item.itemId ? (
                                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                      <Plus className="w-4 h-4" />
                                    )}
                                    Add to Order
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="w-28 h-28 sm:w-32 sm:h-32 flex-shrink-0 rounded-xl overflow-hidden shadow-lg relative border border-white/10 bg-white/5">
                              <img
                                src={item.imageUrl || 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=800&q=80'}
                                alt={item.name}
                                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=800&q=80'; }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          ) : (
            <div className="flex justify-center items-center h-40 glass rounded-3xl border border-white/5">
              <p className="text-gray-500">Select a category to view menu items.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RestaurantDetails;
