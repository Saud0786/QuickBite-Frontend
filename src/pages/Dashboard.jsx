import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Mail, Phone, Settings, Shield, Trash2, AlertTriangle, Key, Edit, Loader2, Store, CheckCircle, XCircle, PlusCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { restaurantApi } from '../api/restaurant.api';

const Dashboard = () => {
  const { user, logout, deactivateAccount, updateProfile, changePassword } = useAuth();
  const [showConfirm, setShowConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview, edit, security
  
  // Edit Profile State
  const [profileData, setProfileData] = useState({ fullName: '', email: '', phone: '' });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Change Password State
  const [passData, setPassData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Initialize edit fields
  React.useEffect(() => {
    if (user) setProfileData({ fullName: user.fullName || '', email: user.email || '', phone: user.phone || '' });
  }, [user]);

  // Restaurant Management State
  const [myRestaurants, setMyRestaurants] = useState([]);
  const [pendingRestaurants, setPendingRestaurants] = useState([]);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [newRestaurant, setNewRestaurant] = useState({
    name: '', description: '', cuisine: '', address: '', city: '',
    latitude: 0, longitude: 0, phone: '', deliveryRadius: 5.0,
    minOrderAmount: 0, estimatedDeliveryMin: 30
  });

  const loadMyRestaurants = async () => {
    try {
      const res = await restaurantApi.getMyRestaurants();
      setMyRestaurants(res.data || []);
    } catch (e) { toast.error("Failed to load your restaurants"); }
  };

  const loadPending = async () => {
    try {
      const res = await restaurantApi.getPendingApproval();
      setPendingRestaurants(res.data || []);
    } catch (e) { toast.error("Failed to load pending restaurants"); }
  };

  React.useEffect(() => {
    if (activeTab === 'manage_owner') loadMyRestaurants();
    if (activeTab === 'manage_admin') loadPending();
  }, [activeTab]);

  const handleRegisterRestaurant = async (e) => {
    e.preventDefault();
    setIsActionLoading(true);
    try {
      await restaurantApi.registerRestaurant(newRestaurant);
      toast.success("Restaurant registered! Awaiting admin approval.");
      setNewRestaurant({name: '', description: '', cuisine: '', address: '', city: '', latitude: 0, longitude: 0, phone: '', deliveryRadius: 5.0, minOrderAmount: 0, estimatedDeliveryMin: 30});
      loadMyRestaurants();
    } catch (e) {
      toast.error("Failed to register restaurant.");
    } finally { setIsActionLoading(false); }
  };

  const handleToggleOpen = async (id) => {
    try {
      await restaurantApi.toggleOpen(id);
      loadMyRestaurants();
      toast.success("Toggled open status!");
    } catch (e) { toast.error("Failed to toggle status"); }
  };

  const handleApprove = async (id) => {
    try {
      await restaurantApi.approveRestaurant(id);
      loadPending();
      toast.success("Approved restaurant!");
    } catch (e) { toast.error("Failed to approve"); }
  };

  const handleReject = async (id) => {
    try {
      await restaurantApi.deleteRestaurant(id);
      loadPending();
      toast.success("Rejected restaurant");
    } catch (e) { toast.error("Failed to reject"); }
  };

  if (!user) return null;

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await updateProfile(profileData);
      setActiveTab('overview');
    } catch (err) {
      toast.error(err.response?.data?.message || Object.values(err.response?.data?.data || {}).join(', ') || 'Failed to update user profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passData.newPassword !== passData.confirmPassword) return toast.error('New passwords do not match!');
    setIsChangingPass(true);
    try {
      await changePassword({ currentPassword: passData.currentPassword, newPassword: passData.newPassword });
      setPassData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setActiveTab('overview');
    } catch (err) {
      toast.error(err.response?.data?.message || Object.values(err.response?.data?.data || {}).join(', ') || 'Failed to change password');
    } finally {
      setIsChangingPass(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />
      
      <div className="max-w-5xl mx-auto relative z-10">
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center space-x-3 w-full md:w-auto">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="font-bold text-xl">{user.fullName?.charAt(0) || 'U'}</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <p className="text-gray-400 text-sm">Welcome back, {user.fullName}</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setShowConfirm(true)} className="flex items-center space-x-2 bg-white/5 hover:bg-orange-500/20 text-gray-300 hover:text-orange-400 px-4 py-2 rounded-xl border border-white/10 hover:border-orange-500/30 transition-all font-medium text-sm">
              <Trash2 className="w-4 h-4" /><span>Deactivate</span>
            </button>
            <button onClick={logout} className="flex items-center space-x-2 bg-white/5 hover:bg-red-500/20 text-gray-300 hover:text-red-400 px-4 py-2 rounded-xl border border-white/10 hover:border-red-500/30 transition-all font-medium text-sm">
              <LogOut className="w-4 h-4" /><span>Logout</span>
            </button>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="flex space-x-2 mb-6 border-b border-white/10 pb-2 overflow-x-auto">
          <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === 'overview' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            <User className="w-4 h-4 inline mr-2" />Overview
          </button>
          <button onClick={() => setActiveTab('edit')} className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === 'edit' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            <Edit className="w-4 h-4 inline mr-2" />Edit Profile
          </button>
          {user.provider === 'LOCAL' && (
            <button onClick={() => setActiveTab('security')} className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === 'security' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
              <Key className="w-4 h-4 inline mr-2" />Change Password
            </button>
          )}
          {user.role === 'OWNER' && (
            <button onClick={() => setActiveTab('manage_owner')} className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === 'manage_owner' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
              <Store className="w-4 h-4 inline mr-2" />My Restaurants
            </button>
          )}
          {user.role === 'ADMIN' && (
            <button onClick={() => setActiveTab('manage_admin')} className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === 'manage_admin' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
              <Shield className="w-4 h-4 inline mr-2" />Admin Actions
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass p-6 rounded-2xl md:col-span-2">
                <div className="flex items-center space-x-3 mb-6 pb-6 border-b border-white/10">
                  <User className="text-accent w-6 h-6" />
                  <h2 className="text-xl font-bold">Profile Details</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div><label className="text-sm text-gray-500 block mb-1">Full Name</label><p className="font-medium text-lg">{user.fullName}</p></div>
                    <div><label className="text-sm text-gray-500 block mb-1 flex items-center"><Mail className="w-4 h-4 inline mr-1"/> Email Address</label><p className="font-medium">{user.email}</p></div>
                  </div>
                  <div className="space-y-6">
                    <div><label className="text-sm text-gray-500 block mb-1 flex items-center"><Phone className="w-4 h-4 inline mr-1"/> Phone Number</label><p className="font-medium">{user.phone}</p></div>
                    <div>
                      <label className="text-sm text-gray-500 block mb-1 flex items-center"><Shield className="w-4 h-4 inline mr-1"/> Account Role</label>
                      <span className="inline-block bg-primary/20 text-primary border border-primary/30 px-3 py-1 rounded-full text-sm font-bold tracking-wider">{user.role}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass p-6 rounded-2xl flex flex-col">
                <div className="flex items-center space-x-3 mb-6 pb-6 border-b border-white/10">
                  <Settings className="text-primary w-6 h-6" />
                  <h2 className="text-xl font-bold">Status</h2>
                </div>
                <div className="flex-1 flex flex-col justify-center items-center text-center space-y-4">
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 ${user.isActive ? 'border-green-500/30 text-green-400 bg-green-500/10' : 'border-red-500/30 text-red-400 bg-red-500/10'}`}>
                    <Shield className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl">{user.isActive ? 'Active Account' : 'Inactive Account'}</h3>
                    <p className="text-sm text-gray-400 mt-1">Provider: {user.provider}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'edit' && (
            <motion.div key="edit" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="glass p-6 rounded-2xl max-w-2xl">
              <div className="flex items-center space-x-3 mb-6 pb-6 border-b border-white/10">
                <Edit className="text-accent w-6 h-6" />
                <h2 className="text-xl font-bold">Update Profile</h2>
              </div>
              <form onSubmit={handleProfileSubmit} className="space-y-5">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-300 ml-1">Full Name</label>
                  <input value={profileData.fullName} onChange={e => setProfileData({...profileData, fullName: e.target.value})} required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-accent/50" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-300 ml-1">Email <span className="text-gray-500">(Used for login)</span></label>
                  <input type="email" disabled={user.provider !== 'LOCAL'} value={profileData.email} onChange={e => setProfileData({...profileData, email: e.target.value})} required className={`w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-accent/50 ${user.provider !== 'LOCAL' ? 'opacity-50 cursor-not-allowed' : ''}`} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-300 ml-1">Phone Number</label>
                  <input value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})} required pattern="[0-9]{10}" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-accent/50" />
                </div>
                <button type="submit" disabled={isSavingProfile} className="w-full bg-accent hover:bg-cyan-600 text-white rounded-xl py-3 font-semibold transition-all disabled:opacity-70 flex items-center justify-center space-x-2">
                  {isSavingProfile ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Save Details</span>}
                </button>
              </form>
            </motion.div>
          )}

          {activeTab === 'security' && user.provider === 'LOCAL' && (
            <motion.div key="security" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="glass p-6 rounded-2xl max-w-xl">
              <div className="flex items-center space-x-3 mb-6 pb-6 border-b border-white/10">
                <Key className="text-primary w-6 h-6" />
                <h2 className="text-xl font-bold">Change Password</h2>
              </div>
              <form onSubmit={handlePasswordSubmit} className="space-y-5">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-300 ml-1">Current Password</label>
                  <input type="password" value={passData.currentPassword} onChange={e => setPassData({...passData, currentPassword: e.target.value})} required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-300 ml-1">New Password</label>
                  <input type="password" value={passData.newPassword} onChange={e => setPassData({...passData, newPassword: e.target.value})} required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  <p className="text-xs text-gray-500 mt-1 pl-1">Min 6 chars, containing 1 lowercase, 1 uppercase, 1 number, and 1 special character.</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-300 ml-1">Confirm New Password</label>
                  <input type="password" value={passData.confirmPassword} onChange={e => setPassData({...passData, confirmPassword: e.target.value})} required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <button type="submit" disabled={isChangingPass} className="w-full bg-primary hover:bg-primary-hover text-white rounded-xl py-3 font-semibold transition-all disabled:opacity-70 flex items-center justify-center space-x-2">
                  {isChangingPass ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Update Password</span>}
                </button>
              </form>
            </motion.div>
          )}

          {activeTab === 'manage_owner' && user.role === 'OWNER' && (
            <motion.div key="manage_owner" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
              
              {/* My Locations */}
              <div className="glass p-6 rounded-2xl">
                <div className="flex items-center space-x-3 mb-6 pb-6 border-b border-white/10">
                  <Store className="text-accent w-6 h-6" />
                  <h2 className="text-xl font-bold">My Registered Restaurants</h2>
                </div>
                {myRestaurants.length === 0 ? (
                  <p className="text-gray-400">You have not registered any restaurants yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {myRestaurants.map(r => (
                      <div key={r.restaurantId} className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-lg">{r.name}</h3>
                            <span className={`px-2 py-1 text-xs font-bold rounded-full ${r.isApproved ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-400'}`}>
                              {r.isApproved ? 'Approved' : 'Pending'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400 mb-4">{r.city} • {r.cuisine}</p>
                        </div>
                        {r.isApproved && (
                          <button onClick={() => handleToggleOpen(r.restaurantId)} className={`w-full py-2 rounded-lg font-semibold transition-colors ${r.isOpen ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'}`}>
                            {r.isOpen ? 'Close Restaurant' : 'Open Restaurant'}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Registration Form */}
              <div className="glass p-6 rounded-2xl max-w-2xl">
                <div className="flex items-center space-x-3 mb-6 pb-6 border-b border-white/10">
                  <PlusCircle className="text-primary w-6 h-6" />
                  <h2 className="text-xl font-bold">Register New Location</h2>
                </div>
                <form onSubmit={handleRegisterRestaurant} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="text-sm text-gray-400 mb-1 block">Name</label>
                       <input required value={newRestaurant.name} onChange={e=>setNewRestaurant({...newRestaurant, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white" />
                     </div>
                     <div>
                       <label className="text-sm text-gray-400 mb-1 block">Cuisine</label>
                       <input required value={newRestaurant.cuisine} onChange={e=>setNewRestaurant({...newRestaurant, cuisine: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white" />
                     </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Description</label>
                    <textarea required value={newRestaurant.description} onChange={e=>setNewRestaurant({...newRestaurant, description: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="text-sm text-gray-400 mb-1 block">City</label>
                       <input required value={newRestaurant.city} onChange={e=>setNewRestaurant({...newRestaurant, city: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white" />
                     </div>
                     <div>
                       <label className="text-sm text-gray-400 mb-1 block">Phone</label>
                       <input required value={newRestaurant.phone} onChange={e=>setNewRestaurant({...newRestaurant, phone: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white" />
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="text-sm text-gray-400 mb-1 block">Address</label>
                       <input required value={newRestaurant.address} onChange={e=>setNewRestaurant({...newRestaurant, address: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white" />
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="text-sm text-gray-400 mb-1 block">Latitude</label>
                       <input type="number" step="any" required value={newRestaurant.latitude} onChange={e=>setNewRestaurant({...newRestaurant, latitude: parseFloat(e.target.value) || 0})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white" />
                     </div>
                     <div>
                       <label className="text-sm text-gray-400 mb-1 block">Longitude</label>
                       <input type="number" step="any" required value={newRestaurant.longitude} onChange={e=>setNewRestaurant({...newRestaurant, longitude: parseFloat(e.target.value) || 0})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white" />
                     </div>
                  </div>
                  <button type="submit" disabled={isActionLoading} className="w-full bg-primary hover:bg-primary/80 py-3 rounded-xl font-bold transition-all disabled:opacity-50">
                    {isActionLoading ? 'Submitting...' : 'Submit for Approval'}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {activeTab === 'manage_admin' && user.role === 'ADMIN' && (
            <motion.div key="manage_admin" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="glass p-6 rounded-2xl">
                <div className="flex items-center space-x-3 mb-6 pb-6 border-b border-white/10">
                  <Shield className="text-orange-500 w-6 h-6" />
                  <h2 className="text-xl font-bold">Pending Approvals</h2>
                </div>
                {pendingRestaurants.length === 0 ? (
                  <p className="text-gray-400">No restaurants currently waiting for your approval.</p>
                ) : (
                  <div className="space-y-4">
                    {pendingRestaurants.map(r => (
                      <div key={r.restaurantId} className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <h3 className="font-bold text-lg">{r.name}</h3>
                          <p className="text-sm text-gray-400">{r.cuisine} • {r.city} • Phone: {r.phone}</p>
                          <p className="text-sm text-gray-500 mt-1">Owner ID: {r.ownerId}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleApprove(r.restaurantId)} className="flex items-center space-x-1 px-4 py-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-lg transition-colors font-medium">
                            <CheckCircle className="w-4 h-4"/> <span>Approve</span>
                          </button>
                          <button onClick={() => handleReject(r.restaurantId)} className="flex items-center space-x-1 px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors font-medium">
                            <XCircle className="w-4 h-4"/> <span>Reject</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </motion.div>
          )}
        </AnimatePresence>

        {showConfirm && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#111] border border-red-500/30 p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl shadow-red-500/10">
              <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Deactivate Account?</h3>
              <p className="text-gray-400 text-sm mb-8">This action is permanent and will deactivate your user access immediately. Are you sure you want to proceed?</p>
              <div className="flex space-x-4">
                <button onClick={() => setShowConfirm(false)} className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl transition-all font-medium">Cancel</button>
                <button onClick={deactivateAccount} className="flex-1 bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20 text-white py-3 rounded-xl transition-all font-medium">Yes, Deactivate</button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
