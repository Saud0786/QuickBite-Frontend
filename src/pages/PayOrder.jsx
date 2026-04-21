import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, CreditCard, Loader2, ShieldCheck } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { paymentApi } from '../api/payment.api';
import { useCart } from '../context/CartContext';
import { formatINR } from '../utils/currency';

const loadRazorpayScript = async () => {
  if (window.Razorpay) {
    return true;
  }

  return new Promise((resolve) => {
    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true), { once: true });
      existingScript.addEventListener('error', () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const PayOrder = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { fetchCart, setCartOpen } = useCart();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const paymentContext = location.state || {};
  const order = paymentContext.order;
  const paymentMode = paymentContext.paymentMode;
  const customerId = paymentContext.customerId;
  const customerName = paymentContext.customerName;
  const customerEmail = paymentContext.customerEmail;
  const customerPhone = paymentContext.customerPhone;
  const selectedPaymentMode = String(paymentMode || '').toUpperCase();

  const payableAmount = useMemo(
    () => paymentContext.amount ?? order?.finalAmount ?? order?.totalAmount ?? 0,
    [paymentContext.amount, order?.finalAmount, order?.totalAmount]
  );

  const normalizedContact = useMemo(() => {
    const rawContact = String(customerPhone || '').replace(/\D/g, '');
    if (!rawContact) return undefined;
    if (rawContact.length >= 10) {
      return rawContact.slice(-10);
    }
    return undefined;
  }, [customerPhone]);

  useEffect(() => {
    if (!order?.orderId || !customerId || !['CARD', 'UPI'].includes(selectedPaymentMode)) {
      toast.error('Invalid payment session. Please place the order again.');
      navigate('/checkout', { replace: true });
    }
  }, [order?.orderId, customerId, selectedPaymentMode, navigate]);

  const onPaymentSuccess = async (orderId) => {
    await fetchCart();
    setCartOpen(false);
    toast.success(`Payment successful for order #${orderId}.`);
    navigate('/orders', { replace: true, state: { placedOrderId: orderId } });
  };

  const launchRazorpay = async () => {
    if (!order?.orderId || !customerId) {
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Unable to load Razorpay checkout script. Check your internet and try again.');
      }

      const createOrderResponse = await paymentApi.createOrder({
        orderId: order.orderId,
        customerId,
        amount: payableAmount,
        mode: selectedPaymentMode,
        currency: 'INR',
      });

      const razorpayOrder = createOrderResponse?.data;
      if (!razorpayOrder?.razorpayOrderId || !razorpayOrder?.keyId) {
        throw new Error('Unable to initialize Razorpay order.');
      }

      const razorpay = new window.Razorpay({
        key: razorpayOrder.keyId,
        amount: Math.round((razorpayOrder.amount || payableAmount || 0) * 100),
        currency: razorpayOrder.currency || 'INR',
        name: 'QuickBite',
        description: `Order #${order.orderId}`,
        order_id: razorpayOrder.razorpayOrderId,
        prefill: {
          name: customerName || 'QuickBite Customer',
          email: customerEmail || undefined,
          contact: normalizedContact,
        },
        theme: {
          color: '#22d3ee',
        },
        modal: {
          ondismiss: () => {
            setErrorMessage('Payment was cancelled. You can retry now.');
            setIsLoading(false);
          },
        },
        handler: async (response) => {
          try {
            await paymentApi.verifyPayment({
              internalOrderId: order.orderId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            await onPaymentSuccess(order.orderId);
          } catch (error) {
            const message = error?.response?.data?.message || 'Payment verification failed.';
            setErrorMessage(message);
            toast.error(message);
            setIsLoading(false);
          }
        },
      });

      razorpay.on('payment.failed', (response) => {
        const code = response?.error?.code;
        const reason = response?.error?.description || response?.error?.reason || 'Payment failed. Please retry.';
        const isUnsupportedMethod = /not supported|no option of this service|international cards/i.test(reason);
        const message = code ? `${reason} (${code})` : reason;
        setErrorMessage(
          isUnsupportedMethod && selectedPaymentMode === 'UPI'
            ? 'UPI is not enabled for this Razorpay account/test setup. Use a supported method or enable UPI in Razorpay dashboard.'
            : reason
        );
        toast.error(message);
        setIsLoading(false);
      });

      razorpay.open();
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || 'Failed to start Razorpay payment.';
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[680px] h-[680px] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[520px] h-[520px] bg-accent/10 rounded-full blur-[130px] pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto px-6 py-10">
        <button
          onClick={() => navigate('/checkout')}
          className="inline-flex items-center gap-2 text-gray-300 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Checkout</span>
        </button>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass border border-white/10 rounded-3xl p-7 md:p-9"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-primary font-bold mb-2">Payment</p>
          <h1 className="text-3xl md:text-4xl font-black">Complete Razorpay Payment</h1>
          <p className="text-gray-400 mt-3">
            Click the button below to open the Razorpay window and pay for your order.
          </p>

          <div className="mt-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Order ID</p>
              <p className="font-bold mt-1">#{order?.orderId || '-'}</p>
            </div>
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Mode</p>
              <p className="font-bold mt-1">{String(paymentMode || '-')}</p>
            </div>
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Amount</p>
              <p className="font-bold mt-1 text-primary">{formatINR(payableAmount || 0)}</p>
            </div>
          </div>

          {errorMessage && (
            <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="mt-7 rounded-2xl border border-primary/25 bg-primary/10 p-4 text-sm text-gray-200 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 mt-0.5 text-primary" />
            <div>
              <p className="font-semibold text-primary">Razorpay Test Mode Tip</p>
              <p className="text-gray-300 mt-1">
                For CARD, use 4111 1111 1111 1111 with any future expiry and any CVV. For UPI, Razorpay must have UPI enabled for your account; if it does not appear, that is a Razorpay setup issue rather than a checkout bug.
              </p>
            </div>
          </div>

          <button
            onClick={launchRazorpay}
            disabled={isLoading}
            className="mt-7 w-full flex items-center justify-center gap-3 bg-primary hover:bg-cyan-500 text-[#050505] font-black py-4 px-6 rounded-2xl transition-all shadow-lg shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
            <span>{isLoading ? 'Opening Razorpay...' : `Pay ${formatINR(payableAmount || 0)}`}</span>
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default PayOrder;
