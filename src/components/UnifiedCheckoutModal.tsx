import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Coins,
  ShieldCheck,
  Zap,
  ArrowRight,
  Clock,
  Check,
  Send,
  Loader2,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../lib/api';
import { UserProfile, PaymentGateway } from '../types';
import { CREDIT_PACKAGES } from '../lib/creditPackages';
import type { CreditPackage } from '../lib/creditPackages';

interface UnifiedCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onSuccess: (creditsAdded: number) => void;
  showToast?: (msg: string) => void;
}

export const UnifiedCheckoutModal: React.FC<UnifiedCheckoutModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSuccess,
  showToast,
}) => {
  const [selectedPkg, setSelectedPkg] = useState<CreditPackage>(CREDIT_PACKAGES[1]);
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway>('mpesa');
  
  // Form States
  const [phone, setPhone] = useState(currentUser.phone || '0712345678');

  // Checkout Flow States
  const [processing, setProcessing] = useState(false);
  const [stkPending, setStkPending] = useState(false);
  const [stkRequestId, setStkRequestId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successReceipt, setSuccessReceipt] = useState<{
    gateway: string;
    receiptId: string;
    creditsAdded: number;
    amount: string;
  } | null>(null);

  if (!isOpen) return null;

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {
      // safe catch
    }
  };

  // --- STRIPE HANDLER ---
  // Redirects to Stripe's own hosted checkout page. Credits are only ever
  // added by the signed Stripe webhook after a real payment - never here.
  // Previously this called a "verify session" endpoint immediately after
  // creating the session and credited the user on the spot, with no
  // payment having actually happened.
  const handleStripeCheckout = async () => {
    setProcessing(true);
    setErrorMessage(null);
    try {
      const session = await api.createStripeSession({ packageId: selectedPkg.id });
      window.location.href = session.url;
    } catch (err: any) {
      setProcessing(false);
      setErrorMessage(err.message || 'Stripe payment failed');
    }
  };

  // --- M-PESA DARAJA HANDLER ---
  const handleMpesaStkPush = async () => {
    setProcessing(true);
    setErrorMessage(null);
    try {
      const res = await api.initiateMpesaStk({ phone, packageId: selectedPkg.id });

      setProcessing(false);
      setStkPending(true);
      setStkRequestId(res.checkoutRequestId);
    } catch (err: any) {
      setProcessing(false);
      setErrorMessage(err.message || 'M-Pesa STK Push initialization failed');
    }
  };

  // Polls our own read-only status endpoint while waiting for the real
  // Safaricom callback to land server-side. This replaces what used to be
  // a "simulate PIN approval" button that credited the user on a client
  // click with no phone confirmation ever happening.
  React.useEffect(() => {
    if (!stkPending || !stkRequestId) return;
    let cancelled = false;
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts += 1;
      try {
        const { status } = await api.getMpesaStatus(stkRequestId);
        if (cancelled) return;
        if (status === 'completed') {
          clearInterval(interval);
          setStkPending(false);
          setSuccessReceipt({
            gateway: 'M-Pesa Daraja 3.0',
            receiptId: stkRequestId,
            creditsAdded: selectedPkg.hours,
            amount: `KES ${selectedPkg.priceKES.toLocaleString()}`,
          });
          triggerConfetti();
          onSuccess(selectedPkg.hours);
        } else if (status === 'failed') {
          clearInterval(interval);
          setStkPending(false);
          setErrorMessage('M-Pesa payment was not completed or was cancelled on your phone.');
        } else if (attempts > 20) {
          // ~60s of polling at 3s intervals
          clearInterval(interval);
          setStkPending(false);
          setErrorMessage('Still waiting on confirmation from M-Pesa. If you completed the payment, your credits will appear shortly - you can close this window.');
        }
      } catch {
        // transient network error - keep polling until attempts run out
      }
    }, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [stkPending, stkRequestId, selectedPkg, onSuccess]);

  // --- PAYPAL v2 HANDLER ---
  // Sends the buyer to PayPal's own approval page instead of capturing
  // immediately - a real PayPal payment requires the buyer to actually
  // approve it there first. Capture (and crediting) happens server-side
  // only after that approval, triggered from the return redirect in
  // App.tsx.
  const handlePaypalCheckout = async () => {
    setProcessing(true);
    setErrorMessage(null);
    try {
      const order = await api.createPaypalOrder({ packageId: selectedPkg.id });
      if (!order.approveUrl) {
        throw new Error('PayPal did not return an approval link');
      }
      window.location.href = order.approveUrl;
    } catch (err: any) {
      setProcessing(false);
      setErrorMessage(err.message || 'PayPal checkout failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden relative animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-amber-300 shadow-md">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight">Top Up Time Banking Wallet</h3>
              <p className="text-xs text-indigo-200">Instant Escrow-Ready Credits via Stripe, M-Pesa & PayPal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {successReceipt ? (
            // SUCCESS RECEIPT VIEW
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-bold text-slate-900">Payment Successful!</h4>
              <p className="text-sm text-slate-600 mt-1">
                Your Time Banking wallet has been credited with{' '}
                <span className="font-bold text-indigo-600">+{successReceipt.creditsAdded} Hours</span>.
              </p>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 my-6 text-left max-w-md mx-auto space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Gateway:</span>
                  <span className="font-semibold text-slate-800">{successReceipt.gateway}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Transaction Receipt:</span>
                  <span className="font-mono font-bold text-indigo-700">{successReceipt.receiptId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount Paid:</span>
                  <span className="font-semibold text-slate-800">{successReceipt.amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">New Available Balance:</span>
                  <span className="font-bold text-emerald-600">
                    {(currentUser.timeCredits + successReceipt.creditsAdded).toFixed(1)} hrs
                  </span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow-md transition-all"
              >
                Return to SkillSwap
              </button>
            </div>
          ) : stkPending ? (
            // Waiting for the real Safaricom callback - this used to be a
            // "virtual handset" where typing any 4-digit PIN and clicking
            // a button credited the account instantly, with no actual
            // phone confirmation involved. Now it just reflects what our
            // server actually knows, polled from a read-only status check.
            <div className="py-4">
              <div className="max-w-md mx-auto bg-slate-900 text-white rounded-2xl p-6 shadow-2xl border-4 border-slate-700 relative text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-emerald-400">Daraja STK Push Sent</span>
                </div>

                <Loader2 className="w-8 h-8 mx-auto text-emerald-400 animate-spin mb-3" />

                <p className="text-sm font-medium text-white mb-1">
                  Check your phone ({phone})
                </p>
                <p className="text-xs text-slate-400 mb-4">
                  Enter your M-Pesa PIN on the prompt to pay{' '}
                  <span className="font-bold text-emerald-400">KES {selectedPkg.priceKES}</span> for{' '}
                  {selectedPkg.hours} Time Credits. This will update automatically once confirmed.
                </p>

                <button
                  onClick={() => setStkPending(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg"
                >
                  Cancel and close
                </button>
              </div>
            </div>
          ) : (
            // MAIN CHECKOUT CHOOSER
            <div className="space-y-6">
              
              {/* Error Alert */}
              {errorMessage && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl p-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Step 1: Select Credit Package */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  1. Select Time Credit Package
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {CREDIT_PACKAGES.map(pkg => (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => setSelectedPkg(pkg)}
                      className={`relative p-3 rounded-xl border text-left transition-all ${
                        selectedPkg.id === pkg.id
                          ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-600/30'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      {pkg.badge && (
                        <span className={`absolute -top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                          pkg.popular ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-amber-300'
                        }`}>
                          {pkg.badge}
                        </span>
                      )}
                      <div className="text-base font-extrabold text-slate-900">{pkg.hours} hrs</div>
                      <div className="text-xs font-semibold text-indigo-700">${pkg.priceUSD}</div>
                      <div className="text-[10px] text-slate-500 font-mono">KES {pkg.priceKES.toLocaleString()}</div>
                      {pkg.savings && (
                        <div className="text-[9px] text-emerald-600 font-bold mt-1">{pkg.savings}</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Select Gateway */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  2. Choose Payment Method
                </label>
                <div className="grid grid-cols-3 gap-3">
                  
                  {/* M-Pesa */}
                  <button
                    type="button"
                    onClick={() => setSelectedGateway('mpesa')}
                    className={`p-3.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-center ${
                      selectedGateway === 'mpesa'
                        ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-600/30'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                      M
                    </div>
                    <span className="text-xs font-bold text-slate-800">M-Pesa STK</span>
                    <span className="text-[10px] text-emerald-700 font-semibold">Daraja 3.0 API</span>
                  </button>

                  {/* Stripe */}
                  <button
                    type="button"
                    onClick={() => setSelectedGateway('stripe')}
                    className={`p-3.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-center ${
                      selectedGateway === 'stripe'
                        ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-600/30'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <CreditCard className="w-7 h-7 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-800">Credit Card</span>
                    <span className="text-[10px] text-indigo-700 font-semibold">Stripe Secure</span>
                  </button>

                  {/* PayPal */}
                  <button
                    type="button"
                    onClick={() => setSelectedGateway('paypal')}
                    className={`p-3.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-center ${
                      selectedGateway === 'paypal'
                        ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-600/30'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                      PP
                    </div>
                    <span className="text-xs font-bold text-slate-800">PayPal v2</span>
                    <span className="text-[10px] text-blue-700 font-semibold">Orders API</span>
                  </button>

                </div>
              </div>

              {/* Step 3: Gateway Specific Inputs */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
                {selectedGateway === 'mpesa' && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-slate-700">M-Pesa Mobile Number</label>
                      <span className="text-[10px] text-emerald-700 font-semibold">Auto-formatted (254...)</span>
                    </div>
                    <div className="relative">
                      <Smartphone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="e.g. 0712345678 or 254712345678"
                        className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1.5">
                      You will receive an instant STK prompt on your phone for <strong>KES {selectedPkg.priceKES.toLocaleString()}</strong>.
                    </p>
                  </div>
                )}

                {selectedGateway === 'stripe' && (
                  <div className="text-center py-2">
                    <p className="text-xs text-slate-600">
                      You'll enter your card details securely on Stripe's own checkout page -
                      SkillSwap never sees or stores your card number.
                    </p>
                  </div>
                )}

                {selectedGateway === 'paypal' && (
                  <div className="text-center py-2">
                    <p className="text-xs text-slate-600">
                      You will authorize <strong>${selectedPkg.priceUSD.toFixed(2)} USD</strong> via PayPal Sandbox / Orders v2 API.
                    </p>
                  </div>
                )}
              </div>

              {/* Order Summary & Submit Button */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div>
                  <div className="text-xs text-slate-500">Total Purchase</div>
                  <div className="text-lg font-bold text-slate-900">
                    {selectedGateway === 'mpesa'
                      ? `KES ${selectedPkg.priceKES.toLocaleString()}`
                      : `$${selectedPkg.priceUSD.toFixed(2)} USD`}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={processing}
                  onClick={() => {
                    if (selectedGateway === 'stripe') handleStripeCheckout();
                    else if (selectedGateway === 'mpesa') handleMpesaStkPush();
                    else handlePaypalCheckout();
                  }}
                  className={`px-6 py-2.5 rounded-xl font-bold text-sm text-white shadow-md flex items-center gap-2 transition-all ${
                    selectedGateway === 'mpesa'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : selectedGateway === 'stripe'
                      ? 'bg-indigo-600 hover:bg-indigo-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Connecting Gateway...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Pay & Get {selectedPkg.hours} Credits
                    </>
                  )}
                </button>
              </div>

            </div>
          )}
        </div>

        {/* Footer Security Badge */}
        <div className="px-6 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Escrow-Protected & SSL 256-Bit Encrypted</span>
          </div>
          <span className="font-mono">SkillSwap 5.0 Vault</span>
        </div>

      </div>
    </div>
  );
};
