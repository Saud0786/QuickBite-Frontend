import React from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import CustomerOrdersView from './orders/CustomerOrdersView';
import OwnerOrdersView from './orders/OwnerOrdersView';

const Orders = () => {
  const { user } = useAuth();
  const isOwnerView = String(user?.role || '').toUpperCase() === 'OWNER';
  if (!user) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return isOwnerView ? <OwnerOrdersView /> : <CustomerOrdersView />;
};

export default Orders;
