import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Trash2, Plus, Minus, Tag, ChevronRight, Loader2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatINR } from '../utils/currency';

const CartDrawer = () => {
  const {
    cart,
    cartOpen,
    setCartOpen,
    loading,
    itemCount,
    total,
    removeItem,
    updateQuantity,
    clearCart,
    applyPromo,
  } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  const [promoCode, setPromoCode] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoApplied, setPromoApplied] = useState(false);

  useEffect(() => {
    setCartOpen(false);
  }, [location.pathname, setCartOpen]);

  const handlePromo = async (e) => {
    e.preventDefault();
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    const success = await applyPromo(promoCode.trim());
    if (success) setPromoApplied(true);
    setPromoLoading(false);
  };

  const handleQtyChange = (menuItemId, currentQty, delta) => {
    const next = currentQty + delta;
    if (next <= 0) {
      const item = cart?.items?.find(i => i.menuItemId === menuItemId);
      removeItem(menuItemId, item?.name);
    } else {
      updateQuantity(menuItemId, next);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {cartOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCartOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Drawer */}
      <AnimatePresence>
        {cartOpen && (
          <motion.div
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="fixed top-0 right-0 h-full w-full max-w-md z-50 flex flex-col bg-[#0d0d0d] border-l border-white/10 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-black tracking-tight text-white">Your Cart</h2>
                {itemCount > 0 && (
                  <span className="bg-primary/20 text-primary border border-primary/30 text-xs font-bold px-2 py-0.5 rounded-full">
                    {itemCount} item{itemCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : !cart || cart.items?.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                    <ShoppingBag className="w-9 h-9 text-gray-600" />
                  </div>
                  <p className="text-lg font-bold text-gray-300">Your cart is empty</p>
                  <p className="text-sm text-gray-500 mt-1">Add items from a restaurant to get started</p>
                  <button
                    onClick={() => setCartOpen(false)}
                    className="mt-6 px-6 py-2.5 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary rounded-xl font-semibold text-sm transition-all"
                  >
                    Browse Restaurants
                  </button>
                </div>
              ) : (
                <>
                  {/* Restaurant label */}
                  {cart.restaurantId && (
                    <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold pb-1">
                      Restaurant #{cart.restaurantId}
                    </p>
                  )}

                  {/* Items */}
                  {cart.items.map((item) => (
                    <motion.div
                      key={item.menuItemId}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 40 }}
                      className="flex items-center gap-4 bg-white/5 border border-white/5 rounded-2xl p-4 group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm truncate">{item.name}</p>
                        {item.customization && (
                          <p className="text-xs text-gray-500 truncate mt-0.5">{item.customization}</p>
                        )}
                        <p className="text-primary font-bold text-sm mt-1">
                          {formatINR(item.price * item.quantity)}
                        </p>
                      </div>

                      {/* Qty controls */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleQtyChange(item.menuItemId, item.quantity, -1)}
                          className="w-7 h-7 rounded-lg bg-white/10 hover:bg-red-500/20 hover:border-red-500/30 border border-white/10 flex items-center justify-center transition-all"
                        >
                          <Minus className="w-3 h-3 text-gray-300" />
                        </button>
                        <span className="w-5 text-center text-white font-bold text-sm">{item.quantity}</span>
                        <button
                          onClick={() => handleQtyChange(item.menuItemId, item.quantity, 1)}
                          className="w-7 h-7 rounded-lg bg-white/10 hover:bg-primary/20 hover:border-primary/30 border border-white/10 flex items-center justify-center transition-all"
                        >
                          <Plus className="w-3 h-3 text-gray-300" />
                        </button>
                      </div>

                      {/* Delete */}
                      <button
                        onClick={() => removeItem(item.menuItemId, item.name)}
                        className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </motion.div>
                  ))}

                  {/* Clear cart */}
                  <button
                    onClick={clearCart}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/3 hover:bg-red-500/10 border border-white/5 hover:border-red-500/20 text-gray-500 hover:text-red-400 text-sm transition-all mt-2"
                  >
                    <Trash2 className="w-4 h-4" /> Clear cart
                  </button>
                </>
              )}
            </div>

            {/* Footer — only if cart has items */}
            {cart?.items?.length > 0 && (
              <div className="border-t border-white/10 px-6 py-5 space-y-4">
                {/* Promo code */}
                {!promoApplied ? (
                  <form onSubmit={handlePromo} className="flex gap-2">
                    <div className="flex-1 flex items-center bg-white/5 border border-white/10 rounded-xl px-3 gap-2">
                      <Tag className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <input
                        type="text"
                        placeholder="Promo code"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                        className="w-full bg-transparent text-sm text-white placeholder-gray-600 py-2.5 focus:outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={promoLoading || !promoCode.trim()}
                      className="px-4 py-2.5 bg-white/10 hover:bg-primary/20 border border-white/10 hover:border-primary/30 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {promoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <Tag className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400 text-sm font-semibold">{promoCode} applied!</span>
                  </div>
                )}

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>Subtotal ({itemCount} items)</span>
                    <span>{formatINR(total)}</span>
                  </div>
                  {promoApplied && (
                    <div className="flex justify-between text-sm text-emerald-400">
                      <span>Promo discount</span>
                      <span>Applied ✓</span>
                    </div>
                  )}
                  <div className="flex justify-between text-white font-black text-lg pt-2 border-t border-white/10">
                    <span>Total</span>
                    <span>{formatINR(total)}</span>
                  </div>
                </div>

                {/* Checkout CTA */}
                <button
                  onClick={() => navigate('/checkout')}
                  className="w-full flex items-center justify-between bg-primary hover:bg-cyan-500 text-[#050505] font-black py-4 px-6 rounded-2xl transition-all shadow-lg shadow-primary/20 group"
                >
                  <span>Proceed to Checkout</span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CartDrawer;
