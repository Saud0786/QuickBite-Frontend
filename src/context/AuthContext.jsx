import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const normalizeUser = (rawUser) => {
    if (!rawUser) return null;
    return {
      ...rawUser,
      isActive: rawUser.isActive ?? rawUser.active ?? true,
      profilePicUrl: rawUser.profilePicUrl ?? rawUser.profilePicURL ?? null,
      provider: rawUser.provider || 'LOCAL'
    };
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(normalizeUser(res.data.data));
        } catch (err) {
          console.error('Failed to fetch user', err);
          setUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { accessToken, refreshToken, user: userData } = res.data.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    setUser(normalizeUser(userData));
    toast.success('Successfully logged in!');
    return res.data;
  };

  const registerUser = async (userData) => {
    const res = await api.post('/auth/register', userData);
    toast.success('Registration successful. Please login.');
    return res.data;
  };

  const oauthLogin = async (email, name, provider, providerId) => {
    const res = await api.post(`/auth/oauth/${provider}?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}&providerId=${encodeURIComponent(providerId)}`);
    const { accessToken, refreshToken, user: userData } = res.data.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    setUser(normalizeUser(userData));
    toast.success(`Successfully logged in with ${provider}!`);
    return res.data;
  };

  const deactivateAccount = async () => {
    try {
      await api.delete('/auth/deactivate');
      toast.success('Your account has been deactivated.');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
      window.location.href = '/login';
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to deactivate account.';
      toast.error(message);
      throw err;
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const res = await api.put('/auth/profile', profileData);
      setUser(normalizeUser(res.data.data));
      toast.success('Profile updated successfully!');
      return res.data;
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to update profile.';
      toast.error(message);
      throw err;
    }
  };

  const changePassword = async (passwordData) => {
    const res = await api.post('/auth/change-password', passwordData);
    toast.success('Password changed successfully!');
    return res.data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch(err) { console.error('Logout err', err); }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    toast.success('You have been logged out.');
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register: registerUser, oauthLogin, logout, deactivateAccount, updateProfile, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
