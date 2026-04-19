import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, oauthLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectPath = location.state?.from || '/restaurants';

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      await login(formData.email, formData.password);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.join(', ') || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      await oauthLogin(decoded.email, decoded.name || 'User', 'GOOGLE', decoded.sub);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError('Google login failed. Please try again.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen relative overflow-hidden bg-[#050505] py-12">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent/20 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass p-8 md:p-10 rounded-3xl w-full max-w-md z-10 mx-4"
      >
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-400">Sign in to QuickBite</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-300 ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5 pointer-events-none" />
              <input 
                type="email" name="email" value={formData.email} onChange={handleChange} required
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center ml-1">
              <label className="text-sm font-medium text-gray-300">Password</label>
              <Link to="/forgot-password" className="text-xs text-primary hover:text-white transition-colors">Forgot?</Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5 pointer-events-none" />
              <input 
                type="password" name="password" value={formData.password} onChange={handleChange} required
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full mt-2 bg-primary hover:bg-primary/80 text-white rounded-xl py-3 font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 flex items-center justify-center space-x-2"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Sign In</span>}
          </button>
        </form>

        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#111111] text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="animate-fade-in-up mt-6 flex justify-center">
            <GoogleLogin
               onSuccess={handleGoogleSuccess}
               onError={() => setError('Google Login Failed')}
               theme="filled_black"
               shape="pill"
               size="large"
            />
          </div>
        </div>

        <p className="text-center mt-8 text-gray-400 text-sm">
          Don't have an account? {' '}
          <Link to="/register" className="text-primary hover:text-white transition-colors font-medium">
            Register
          </Link>
        </p>

        {/* Public Browsing Link */}
        <div className="mt-6 pt-6 border-t border-white/10 text-center">
          <Link to="/restaurants" className="group flex flex-col items-center justify-center text-gray-400 hover:text-white transition-colors">
            <span className="text-sm font-medium mb-1">Just want to browse?</span>
            <span className="text-xs bg-white/5 group-hover:bg-primary/20 group-hover:text-primary border border-white/10 px-4 py-1.5 rounded-full transition-all">
              View All Restaurants
            </span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
