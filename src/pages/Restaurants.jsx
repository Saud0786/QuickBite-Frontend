import React, { useState, useEffect } from 'react';
import { restaurantApi } from '../api/restaurant.api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Utensils, User, LogIn, ChevronRight, Star, Clock, ShoppingBag } from 'lucide-react';
import CartButton from '../components/CartButton';
import { formatINR } from '../utils/currency';

const Restaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const res = await restaurantApi.getActiveRestaurants();
      setRestaurants(res.data || []);
    } catch (err) {
      toast.error('Failed to load restaurants');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      return fetchRestaurants();
    }
    try {
      setLoading(true);
      const res = await restaurantApi.searchRestaurants(searchQuery);
      setRestaurants(res.data || []);
    } catch (err) {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header / Navbar */}
      <nav className="glass sticky top-0 z-50 border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <div className="bg-gradient-to-tr from-primary to-accent p-2 rounded-xl shadow-lg shadow-primary/20">
            <Utensils className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tight text-white">Quick<span className="text-primary hover:text-accent transition-colors">Bite</span></span>
        </Link>
        <div className="flex items-center space-x-4">
           {user ? (
             <div className="flex items-center space-x-3">
               <CartButton />
               <button onClick={() => navigate('/dashboard')} className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 text-white px-5 py-2.5 rounded-xl border border-white/10 transition-all font-medium text-sm">
                 <User className="w-4 h-4" /><span>Dashboard</span>
               </button>
             </div>
           ) : (
             <div className="flex space-x-3">
               <button onClick={() => navigate('/login')} className="hidden sm:flex items-center space-x-2 text-gray-300 hover:text-white px-4 py-2 rounded-xl transition-all font-medium text-sm">
                 <span>Sign In</span>
               </button>
               <button onClick={() => navigate('/register')} className="flex items-center space-x-2 bg-primary hover:bg-cyan-600 text-white shadow-lg shadow-primary/20 px-5 py-2.5 rounded-xl transition-all font-medium text-sm">
                 <LogIn className="w-4 h-4 inline" /><span>Join Now</span>
               </button>
             </div>
           )}
        </div>
      </nav>

      <div className="pt-16 pb-12 px-6 lg:px-8 max-w-7xl mx-auto w-full relative z-10 flex-grow">
        
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Discover Places to Eat
          </h1>
          <p className="text-gray-400 text-lg mb-8">
            Explore the best food and drinks from top-rated restaurants near you, delivered fast.
          </p>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative w-full max-w-2xl mx-auto">
            <div className="flex items-center glass border border-white/10 rounded-2xl shadow-xl px-2 py-2">
              <Search className="w-6 h-6 text-gray-400 ml-3" />
              <input 
                type="text" 
                placeholder="Search restaurant, cuisine, or city..." 
                className="w-full bg-transparent focus:outline-none ml-3 text-white placeholder-gray-500 py-3"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="hidden sm:flex items-center bg-primary hover:bg-cyan-600 text-white rounded-xl px-6 py-3 font-semibold transition-all">
                Search <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </form>
        </div>

        {/* Restaurant Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
             <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin"></div>
          </div>
        ) : restaurants.length === 0 ? (
          <div className="text-center py-20 glass rounded-3xl max-w-2xl mx-auto border border-white/5">
            <Utensils className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-xl font-bold text-gray-300">No restaurants found</p>
            <p className="text-gray-500 mt-2">Try a different search keyword or city!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {restaurants.map(restaurant => (
              <div 
                key={restaurant.restaurantId} 
                className="glass rounded-3xl overflow-hidden hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 group cursor-pointer flex flex-col border border-white/5"
                onClick={() => navigate(`/restaurant/${restaurant.restaurantId}`)}
              >
                <div className="h-56 relative overflow-hidden">
                  <img 
                    src={restaurant.imageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80'} 
                    alt={restaurant.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100"
                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80'; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent opacity-80" />
                  
                  {/* Floating Badges */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    {restaurant.isOpen ? (
                      <span className="px-3 py-1 text-xs font-bold bg-emerald-500/80 backdrop-blur-md text-white rounded-full border border-emerald-400/30">Open</span>
                    ) : (
                      <span className="px-3 py-1 text-xs font-bold bg-red-500/80 backdrop-blur-md text-white rounded-full border border-red-400/30">Closed</span>
                    )}
                  </div>
                  <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-sm font-bold text-yellow-400 shadow-sm flex items-center border border-white/10">
                    <Star className="w-3.5 h-3.5 mr-1 fill-yellow-400" /> {restaurant.avgRating?.toFixed(1) || 'NEW'}
                  </div>
                </div>
                
                <div className="p-6 flex flex-col flex-grow bg-white/5">
                  <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-primary transition-colors">{restaurant.name}</h3>
                  <p className="text-primary font-medium text-sm mb-4">{restaurant.cuisine} • {restaurant.city}</p>
                  <p className="text-gray-400 text-sm line-clamp-2 mb-6 flex-grow">{restaurant.description}</p>
                  
                  <div className="pt-4 border-t border-white/10 flex justify-between items-center text-sm">
                    <div className="flex items-center text-gray-300">
                      <Clock className="w-4 h-4 mr-1.5 text-gray-500" />
                      <span>{restaurant.estimatedDeliveryMin} min</span>
                    </div>
                    <div className="flex items-center text-gray-300">
                      <ShoppingBag className="w-4 h-4 mr-1.5 text-gray-500" />
                      <span>{restaurant.minOrderAmount > 0 ? `${formatINR(restaurant.minOrderAmount)} min` : 'Minimum not set'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Restaurants;
