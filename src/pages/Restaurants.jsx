import React, { useState, useEffect } from 'react';
import { restaurantApi } from '../api/restaurant.api';
import toast from 'react-hot-toast';

const Restaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header Spacer */}
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl mb-8">
          Discover Places to Eat
        </h1>
        
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative w-full max-w-2xl mb-12">
          <div className="flex items-center border border-gray-300 rounded-full bg-white shadow-sm hover:shadow-md transition-shadow px-4 py-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            <input 
              type="text" 
              placeholder="Search by restaurant name, cuisine, or city..." 
              className="w-full bg-transparent focus:outline-none ml-3 text-gray-700 placeholder-gray-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="hidden sm:block ml-2 px-6 py-2 bg-indigo-600 text-white rounded-full font-medium hover:bg-indigo-700 transition-colors">
              Search
            </button>
          </div>
        </form>

        {/* Restaurant Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : restaurants.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-gray-500">No restaurants found. Try a different search!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {restaurants.map(restaurant => (
              <div key={restaurant.restaurantId} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-300 group cursor-pointer flex flex-col">
                <div className="h-48 bg-gray-200 relative overflow-hidden">
                  <img 
                    src={`https://source.unsplash.com/800x600/?restaurant,${encodeURIComponent(restaurant.cuisine)}`} 
                    alt={restaurant.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://source.unsplash.com/800x600/?food,dining'; }}
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold text-gray-800 shadow-sm flex items-center">
                    ★ {restaurant.avgRating?.toFixed(1) || 'New'}
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-gray-900 leading-tight">{restaurant.name}</h3>
                    {restaurant.isOpen ? (
                      <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-emerald-700 bg-emerald-100 rounded-full">Open</span>
                    ) : (
                      <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-700 bg-red-100 rounded-full">Closed</span>
                    )}
                  </div>
                  <p className="text-indigo-600 font-medium text-sm mb-4">{restaurant.cuisine} • {restaurant.city}</p>
                  <p className="text-gray-600 text-sm line-clamp-2 mb-4 flex-grow">{restaurant.description}</p>
                  
                  <div className="pt-4 border-t border-gray-100 flex justify-between items-center text-sm text-gray-500">
                    <div className="flex flex-col">
                      <span className="text-xs uppercase tracking-wide text-gray-400">Delivery</span>
                      <span className="font-medium text-gray-900">{restaurant.estimatedDeliveryMin} min</span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-xs uppercase tracking-wide text-gray-400">Min Order</span>
                      <span className="font-medium text-gray-900">${restaurant.minOrderAmount?.toFixed(2)}</span>
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
