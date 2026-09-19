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

interface UnifiedCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onSuccess: (creditsAdded: number) => void;
}

interface CreditPackage {
  id: string;
  hours: number;
  priceUSD: number;
  priceKES: number;
  popular?: boolean;
  badge?: string;
  savings?: string;
}

const CREDIT_PACKAGES: CreditPackage[] = [
  { id: 'pkg_starter', hours: 2.0, priceUSD: 10.0, priceKES: 1300, badge: 'Trial' },
  { id: 'pkg_standard', hours: 5.0, priceUSD: 24.0, priceKES: 3120, popular: true, badge: 'Most Popular', savings: 'Save 4%' },
  { id: 'pkg_pro', hours: 15.0, priceUSD: 65.0, priceKES: 8450, badge: 'Best Value', savings: 'Save 13%' },
  { id: 'pkg_master', hours: 30.0, priceUSD: 120.0, priceKES: 15600, badge: 'Power Learner', savings: 'Save 20%' },
];

export const UnifiedCheckoutModal: React.FC<UnifiedCheckoutModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSuccess,
}) => {
  const [selectedPkg, setSelectedPkg] = useState<CreditPackage>(CREDIT_PACKAGES[1]);
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway>('mpesa');
  
  // Form States
  const [phone, setPhone] = useState(currentUser.phone || '0712345678');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');

  // Checkout Flow States
  const [processing, setProcessing] = useState(false);
  const [stkPending, setStkPending] = useState(false);
  const [stkRequestId, setStkRequestId] = useState<string | null>(null);
  const [mpesaSimPin, setMpesaSimPin] = useState('');
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
  const handleStripeCheckout = async () => {
    setProcessing(true);
    setErrorMessage(null);
    try {
      const session = await api.createStripeSession({
        userId: currentUser.id,
        creditHours: selectedPkg.hours,
        amountUSD: selectedPkg.priceUSD,
      });

      // Verify and simulate instant fulfillment
      const fulfill = await api.verifyStripeSession(session.sessionId, currentUser.id);
      
      setProcessing(false);
      setSuccessReceipt({
        gateway: 'Stripe (Card / Apple Pay)',
        receiptId: fulfill.order?.gatewayReceipt || session.sessionId,
        creditsAdded: selectedPkg.hours,
        amount: `$${selectedPkg.priceUSD.toFixed(2)} USD`,
      });
      triggerConfetti();
      onSuccess(selectedPkg.hours);
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
      const res = await api.initiateMpesaStk({
        userId: currentUser.id,
        phone,
        creditHours: selectedPkg.hours,
        amountKES: selectedPkg.priceKES,
      });

      setProcessing(false);
      setStkPending(true);
      setStkRequestId(res.checkoutRequestId);
    } catch (err: any) {
      setProcessing(false);
      setErrorMessage(err.message || 'M-Pesa STK Push initialization failed');
    }
  };

  // Simulate PIN approval on the virtual handset
  const handleApproveSimulatedStk = async () => {
    if (!stkRequestId) return;
    setProcessing(true);
    try {
      const res = await api.simulateMpesaPin(stkRequestId);
      setProcessing(false);
      setStkPending(false);

      if (res.success) {
        setSuccessReceipt({
          gateway: 'M-Pesa Daraja 3.0',
          receiptId: res.receipt || 'NL8942799',
          creditsAdded: selectedPkg.hours,
          amount: `KES ${selectedPkg.priceKES.toLocaleString()}`,
        });
        triggerConfetti();
        onSuccess(selectedPkg.hours);
      } else {
        setErrorMessage(res.resultDesc || 'M-Pesa transaction was rejected');
      }
    } catch (err: any) {
      setProcessing(false);
      setErrorMessage(err.message || 'Failed to authorize M-Pesa PIN');
    }
  };

  // --- PAYPAL v2 HANDLER ---
  const handlePaypalCheckout = async () => {
    setProcessing(true);
    setErrorMessage(null);
    try {
      const order = await api.createPaypalOrder({
        userId: currentUser.id,
        creditHours: selectedPkg.hours,
        amountUSD: selectedPkg.priceUSD,
      });

      const capture = await api.capturePaypalOrder(order.id, currentUser.id);

      setProcessing(false);
      setSuccessReceipt({
        gateway: 'PayPal v2 Orders API',
        receiptId: capture.captureId || order.id,
        creditsAdded: selectedPkg.hours,
        amount: `$${selectedPkg.priceUSD.toFixed(2)} USD`,
      });
      triggerConfetti();
      onSuccess(selectedPkg.hours);
    } catch (err: any) {
      setProcessing(false);
      setErrorMessage(err.message || 'PayPal capture failed');
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
            // M-PESA LIVE PHONE HANDSET SIMULATOR
            <div className="py-4">
              <div className="max-w-md mx-auto bg-slate-900 text-white rounded-2xl p-6 shadow-2xl border-4 border-slate-700 relative">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-emerald-400">Daraja STK Push Active</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">SIM Handset</span>
                </div>

                <div className="bg-white text-slate-900 rounded-xl p-4 shadow-inner my-3 text-center">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 mb-1">
                    Safaricom M-Pesa Prompt
                  </div>
                  <p className="text-xs font-medium text-slate-800 mb-2">
                    Do you want to pay <span className="font-bold text-emerald-700">KES {selectedPkg.priceKES}</span> to <span className="font-bold">SkillSwap 5.0</span> for {selectedPkg.hours} Time Credits?
                  </p>
                  <p className="text-[11px] text-slate-500 mb-3">Phone: {phone}</p>

                  <div className="flex justify-center gap-2 mb-4">
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="••••"
                      value={mpesaSimPin}
                      onChange={e => setMpesaSimPin(e.target.value)}
                      className="w-32 text-center text-lg tracking-widest font-mono border-2 border-emerald-500 rounded-lg py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setStkPending(false)}
                      className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleApproveSimulatedStk}
                      disabled={processing}
                      className="flex-1 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center justify-center gap-1 shadow-md"
                    >
                      {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      Send PIN
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 text-center mt-2">
                  Enter any 4-digit PIN (e.g. 1234) to simulate prompt authorization.
                </p>
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
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 mb-1 block">Card Number</label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={e => setCardNumber(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 mb-1 block">Expiry</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={e => setCardExpiry(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 mb-1 block">CVC</label>
                        <input
                          type="text"
                          value={cardCvc}
                          onChange={e => setCardCvc(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                        />
                      </div>
                    </div>
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
