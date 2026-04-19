import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';

const CartButton = ({ className = '' }) => {
  const { itemCount, setCartOpen } = useCart();

  return (
    <button
      onClick={() => setCartOpen(true)}
      className={`relative flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-2.5 rounded-xl transition-all font-medium text-sm ${className}`}
    >
      <ShoppingBag className="w-4 h-4" />
      <span className="hidden sm:inline">Cart</span>

      <AnimatePresence>
        {itemCount > 0 && (
          <motion.span
            key="badge"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary text-[#050505] text-xs font-black rounded-full flex items-center justify-center shadow-md shadow-primary/30"
          >
            {itemCount > 9 ? '9+' : itemCount}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
};

export default CartButton;
