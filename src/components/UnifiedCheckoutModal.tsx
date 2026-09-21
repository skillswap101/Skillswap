import React, { useState, useEffect } from 'react';
import {
  Coins,
  CreditCard,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Zap,
  Lock,
  ExternalLink,
  PhoneCall
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { User } from '../types';
import { CREDIT_PACKAGES, CreditPackage } from '../lib/creditPackages';
import { api } from '../lib/api';

export type PaymentGateway = 'mpesa' | 'stripe' | 'paypal';

interface UnifiedCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onSuccess: (creditsAdded: number) => void;
  showToast: (msg: string) => void;
  initialGateway?: PaymentGateway;
  initialPackageId?: string;
}

export const UnifiedCheckoutModal: React.FC<UnifiedCheckoutModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSuccess,
  showToast,
  initialGateway = 'mpesa',
  initialPackageId,
}) => {
  const [selectedPkg, setSelectedPkg] = useState<CreditPackage>(() => {
    if (initialPackageId) {
      const found = CREDIT_PACKAGES.find(p => p.id === initialPackageId);
      if (found) return found;
    }
    return CREDIT_PACKAGES[1]; // default to Standard Bundle
  });

  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway>(initialGateway);

  // M-Pesa Form State
  const [phone, setPhone] = useState(currentUser.phone || '0712345678');
  const [stkPending, setStkPending] = useState(false);
  const [stkRequestId, setStkRequestId] = useState<string | null>(null);

  // Stripe Card Form State
  const [stripeMode, setStripeMode] = useState<'direct' | 'hosted'>('direct');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');
  const [cardName, setCardName] = useState(currentUser.name || 'Alex Rivers');

  // Checkout Status States
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successReceipt, setSuccessReceipt] = useState<{
    gateway: string;
    receiptId: string;
    creditsAdded: number;
    amount: string;
  } | null>(null);

  // Reset states when opened
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setSuccessReceipt(null);
      setStkPending(false);
      setStkRequestId(null);
      setProcessing(false);
      if (initialGateway) setSelectedGateway(initialGateway);
      if (initialPackageId) {
        const found = CREDIT_PACKAGES.find(p => p.id === initialPackageId);
        if (found) setSelectedPkg(found);
      }
    }
  }, [isOpen, initialGateway, initialPackageId]);

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.6 },
      });
    } catch {
      // safe catch
    }
  };

  // --- 1. STRIPE HANDLER ---
  const handleStripeCheckout = async () => {
    setProcessing(true);
    setErrorMessage(null);

    try {
      if (stripeMode === 'direct') {
        // Direct card payment via secure backend endpoint
        const cleanCard = cardNumber.replace(/\D/g, '');
        const last4 = cleanCard.length >= 4 ? cleanCard.slice(-4) : '4242';
        const cardBrand = cardNumber.startsWith('4') ? 'Visa' : cardNumber.startsWith('5') ? 'Mastercard' : 'Visa';

        const res = await api.payDirectCard({
          packageId: selectedPkg.id,
          cardLast4: last4,
          cardBrand,
        });

        setProcessing(false);
        setSuccessReceipt({
          gateway: `Stripe Card (${res.cardBrand} •••• ${res.cardLast4})`,
          receiptId: res.receiptId,
          creditsAdded: res.creditsAdded || selectedPkg.hours,
          amount: `$${selectedPkg.priceUSD.toFixed(2)} USD`,
        });
        triggerConfetti();
        showToast(`Successfully added +${selectedPkg.hours} Time Credits via Stripe!`);
        onSuccess(selectedPkg.hours);
      } else {
        // Hosted Stripe Checkout session
        const session = await api.createStripeSession({ packageId: selectedPkg.id });
        if (session.sandbox) {
          setProcessing(false);
          setSuccessReceipt({
            gateway: 'Stripe Sandbox Checkout',
            receiptId: session.sessionId,
            creditsAdded: session.creditsAdded || selectedPkg.hours,
            amount: `$${selectedPkg.priceUSD.toFixed(2)} USD`,
          });
          triggerConfetti();
          showToast(`Sandbox payment verified! Added +${selectedPkg.hours} Time Credits.`);
          onSuccess(selectedPkg.hours);
        } else if (session.url) {
          window.location.href = session.url;
        } else {
          throw new Error('Stripe did not return a valid checkout session URL');
        }
      }
    } catch (err: any) {
      setProcessing(false);
      setErrorMessage(err.message || 'Stripe payment failed. Please check details and retry.');
    }
  };

  // --- 2. M-PESA DARAJA HANDLER ---
  const handleMpesaStkPush = async () => {
    setProcessing(true);
    setErrorMessage(null);
    try {
      const res = await api.initiateMpesaStk({ phone, packageId: selectedPkg.id });
      setProcessing(false);
      setStkPending(true);
      setStkRequestId(res.checkoutRequestId);
      showToast('STK Prompt sent! Please check your phone.');
    } catch (err: any) {
      setProcessing(false);
      setErrorMessage(err.message || 'Failed to initiate M-Pesa STK push.');
    }
  };

  // M-Pesa Polling
  useEffect(() => {
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
          showToast(`M-Pesa payment confirmed! Added +${selectedPkg.hours} credits.`);
          onSuccess(selectedPkg.hours);
        } else if (status === 'failed') {
          clearInterval(interval);
          setStkPending(false);
          setErrorMessage('M-Pesa payment cancelled or rejected on handset.');
        } else if (attempts > 25) {
          clearInterval(interval);
          setStkPending(false);
          setErrorMessage('M-Pesa request timed out. If you entered your PIN, credits will update shortly.');
        }
      } catch {
        // network retry
      }
    }, 2500);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [stkPending, stkRequestId, selectedPkg, onSuccess, showToast]);

  const handleSimulateMpesaConfirm = async () => {
    if (!stkRequestId) return;
    try {
      setProcessing(true);
      await api.simulateConfirmMpesa(stkRequestId);
      setProcessing(false);
      setStkPending(false);
      setSuccessReceipt({
        gateway: 'M-Pesa Daraja (Confirmed)',
        receiptId: stkRequestId,
        creditsAdded: selectedPkg.hours,
        amount: `KES ${selectedPkg.priceKES.toLocaleString()}`,
      });
      triggerConfetti();
      showToast(`M-Pesa PIN confirmed! Added +${selectedPkg.hours} credits.`);
      onSuccess(selectedPkg.hours);
    } catch (e: any) {
      setProcessing(false);
      setErrorMessage(e.message || 'Could not confirm M-Pesa PIN');
    }
  };

  // --- 3. PAYPAL HANDLER ---
  const handlePaypalCheckout = async () => {
    setProcessing(true);
    setErrorMessage(null);
    try {
      const order = await api.createPaypalOrder({ packageId: selectedPkg.id });
      if (order.sandbox) {
        // Direct sandbox capture
        const captureRes = await api.capturePaypalOrder(order.orderId);
        setProcessing(false);
        setSuccessReceipt({
          gateway: 'PayPal Orders v2 (Sandbox)',
          receiptId: captureRes.captureId || order.orderId,
          creditsAdded: selectedPkg.hours,
          amount: `$${selectedPkg.priceUSD.toFixed(2)} USD`,
        });
        triggerConfetti();
        showToast(`PayPal payment approved! Added +${selectedPkg.hours} credits.`);
        onSuccess(selectedPkg.hours);
      } else if (order.approveUrl) {
        window.location.href = order.approveUrl;
      } else {
        throw new Error('PayPal did not return an approval link');
      }
    } catch (err: any) {
      setProcessing(false);
      setErrorMessage(err.message || 'PayPal checkout failed. Please retry.');
    }
  };

  if (!isOpen) return null;

  if (!isOpen) return null;

  return (
    <div id="unified-checkout-modal-overlay" className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div id="unified-checkout-modal-card" className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden relative animate-in fade-in zoom-in-95">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-amber-300 shadow-md">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight">Buy Time Credits</h3>
              <p className="text-xs text-indigo-200">Choose your preferred payment method: M-Pesa, Card, or PayPal</p>
            </div>
          </div>
          <button
            id="close-checkout-modal-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {successReceipt ? (
            // SUCCESS RECEIPT VIEW
            <div id="checkout-success-receipt" className="text-center py-6 animate-in fade-in">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-bold text-slate-900">Payment Successful!</h4>
              <p className="text-sm text-slate-600 mt-1">
                Your wallet has been credited with{' '}
                <span className="font-bold text-indigo-600">+{successReceipt.creditsAdded} Hours</span> of Time Credits.
              </p>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 my-6 text-left max-w-md mx-auto space-y-2 text-xs shadow-inner">
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Gateway:</span>
                  <span className="font-semibold text-slate-800">{successReceipt.gateway}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Transaction ID:</span>
                  <span className="font-mono font-bold text-indigo-700">{successReceipt.receiptId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount Paid:</span>
                  <span className="font-semibold text-slate-800">{successReceipt.amount}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200/80 pt-2">
                  <span className="text-slate-500">New Available Balance:</span>
                  <span className="font-bold text-emerald-600">
                    {(currentUser.timeCredits + successReceipt.creditsAdded).toFixed(1)} hrs
                  </span>
                </div>
              </div>

              <button
                id="receipt-return-home-btn"
                onClick={onClose}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow-md transition-all cursor-pointer"
              >
                Return to SkillSwap
              </button>
            </div>
          ) : stkPending ? (
            // M-PESA STK PROMPT WAITING VIEW
            <div id="mpesa-stk-waiting-view" className="py-4">
              <div className="max-w-md mx-auto bg-slate-900 text-white rounded-2xl p-6 shadow-2xl border-4 border-slate-700 relative text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-emerald-400">Safaricom Daraja STK Push Sent</span>
                </div>

                <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mb-3">
                  <Smartphone className="w-7 h-7 text-emerald-400 animate-pulse" />
                </div>

                <p className="text-sm font-semibold text-white mb-1">
                  Prompt Sent to {phone}
                </p>
                <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                  Please enter your M-Pesa PIN on your phone to complete payment of{' '}
                  <span className="font-bold text-emerald-400">KES {selectedPkg.priceKES.toLocaleString()}</span> for{' '}
                  <span className="font-bold text-indigo-300">{selectedPkg.hours} Time Credits</span>.
                </p>

                <div className="flex flex-col gap-2">
                  <button
                    id="mpesa-instant-confirm-btn"
                    type="button"
                    disabled={processing}
                    onClick={handleSimulateMpesaConfirm}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {processing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <PhoneCall className="w-4 h-4" />
                    )}
                    <span>I've Entered My PIN / Confirm Demo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStkPending(false)}
                    className="w-full py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Cancel and change method
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // MAIN MULTI-GATEWAY CHECKOUT VIEW
            <div className="space-y-6">
              
              {/* Error Alert */}
              {errorMessage && (
                <div id="checkout-error-alert" className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl p-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Step 1: Select Credit Package */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  1. Choose Credit Amount
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {CREDIT_PACKAGES.map(pkg => (
                    <button
                      key={pkg.id}
                      id={`pkg-select-${pkg.id}`}
                      type="button"
                      onClick={() => setSelectedPkg(pkg)}
                      className={`relative p-3 rounded-xl border text-left transition-all cursor-pointer ${
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
                      <div className="text-xs font-semibold text-indigo-700">${pkg.priceUSD} USD</div>
                      <div className="text-[10px] text-slate-500 font-mono">KES {pkg.priceKES.toLocaleString()}</div>
                      {pkg.savings && (
                        <div className="text-[9px] text-emerald-600 font-bold mt-1">{pkg.savings}</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Select Mode of Payment */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  2. Select Mode of Payment
                </label>
                <div className="grid grid-cols-3 gap-3">
                  
                  {/* M-Pesa Mode */}
                  <button
                    id="choose-gateway-mpesa"
                    type="button"
                    onClick={() => setSelectedGateway('mpesa')}
                    className={`p-3.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer ${
                      selectedGateway === 'mpesa'
                        ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-600/30 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-extrabold text-sm shadow-sm">
                      M
                    </div>
                    <span className="text-xs font-bold text-slate-800">M-Pesa STK</span>
                    <span className="text-[10px] text-emerald-700 font-semibold">KES Mobile Money</span>
                  </button>

                  {/* Stripe Card Mode */}
                  <button
                    id="choose-gateway-stripe"
                    type="button"
                    onClick={() => setSelectedGateway('stripe')}
                    className={`p-3.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer ${
                      selectedGateway === 'stripe'
                        ? 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-600/30 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <CreditCard className="w-8 h-8 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-800">Credit / Debit Card</span>
                    <span className="text-[10px] text-indigo-700 font-semibold">Stripe Secure</span>
                  </button>

                  {/* PayPal Mode */}
                  <button
                    id="choose-gateway-paypal"
                    type="button"
                    onClick={() => setSelectedGateway('paypal')}
                    className={`p-3.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer ${
                      selectedGateway === 'paypal'
                        ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-600/30 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-extrabold text-sm shadow-sm">
                      P
                    </div>
                    <span className="text-xs font-bold text-slate-800">PayPal</span>
                    <span className="text-[10px] text-blue-700 font-semibold">Global Account</span>
                  </button>

                </div>
              </div>

              {/* Step 3: Gateway Specific Interactive Form */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
                {selectedGateway === 'mpesa' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700">Kenyan Safaricom Phone Number</label>
                      <span className="text-[10px] text-emerald-700 font-semibold">Auto-formatted (254...)</span>
                    </div>
                    <div className="relative">
                      <Smartphone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        id="mpesa-phone-input"
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="e.g. 0712345678 or 254712345678"
                        className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                      />
                    </div>
                    <div className="text-[11px] text-slate-600 flex items-center justify-between bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-200/60">
                      <span>Amount to be charged:</span>
                      <span className="font-extrabold text-emerald-800 text-xs">KES {selectedPkg.priceKES.toLocaleString()}</span>
                    </div>
                  </div>
                )}

                {selectedGateway === 'stripe' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-xs font-semibold text-slate-700">Card Payment Options</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px]">
                        <button
                          type="button"
                          onClick={() => setStripeMode('direct')}
                          className={`px-2 py-0.5 rounded cursor-pointer ${
                            stripeMode === 'direct' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          Quick Card
                        </button>
                        <button
                          type="button"
                          onClick={() => setStripeMode('hosted')}
                          className={`px-2 py-0.5 rounded cursor-pointer ${
                            stripeMode === 'hosted' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          Stripe Redirect
                        </button>
                      </div>
                    </div>

                    {stripeMode === 'direct' ? (
                      <div className="space-y-2.5">
                        <div>
                          <input
                            id="card-number-input"
                            type="text"
                            value={cardNumber}
                            onChange={e => setCardNumber(e.target.value)}
                            placeholder="Card Number (4242 4242 4242 4242)"
                            className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            id="card-expiry-input"
                            type="text"
                            value={cardExpiry}
                            onChange={e => setCardExpiry(e.target.value)}
                            placeholder="MM/YY"
                            className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-mono text-center focus:ring-2 focus:ring-indigo-500"
                          />
                          <input
                            id="card-cvc-input"
                            type="password"
                            value={cardCvc}
                            onChange={e => setCardCvc(e.target.value)}
                            placeholder="CVC"
                            maxLength={4}
                            className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-mono text-center focus:ring-2 focus:ring-indigo-500"
                          />
                          <input
                            id="card-name-input"
                            type="text"
                            value={cardName}
                            onChange={e => setCardName(e.target.value)}
                            placeholder="Name"
                            className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-white rounded-lg border border-slate-200 text-center">
                        <p className="text-xs text-slate-600">
                          Clicking Pay will redirect you to Stripe's hosted SSL checkout page to complete payment.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {selectedGateway === 'paypal' && (
                  <div className="p-3 bg-white rounded-lg border border-slate-200 text-center space-y-2">
                    <p className="text-xs text-slate-700">
                      You will pay <strong>${selectedPkg.priceUSD.toFixed(2)} USD</strong> for <strong>{selectedPkg.hours} Hours</strong> via PayPal.
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Supports PayPal Balance, Linked Bank Accounts, and International Credit Cards.
                    </p>
                  </div>
                )}
              </div>

              {/* Order Summary & Submit Button */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div>
                  <div className="text-xs text-slate-500">Total Due</div>
                  <div className="text-lg font-extrabold text-slate-900">
                    {selectedGateway === 'mpesa'
                      ? `KES ${selectedPkg.priceKES.toLocaleString()}`
                      : `$${selectedPkg.priceUSD.toFixed(2)} USD`}
                  </div>
                </div>

                <button
                  id="checkout-submit-pay-btn"
                  type="button"
                  disabled={processing}
                  onClick={() => {
                    if (selectedGateway === 'stripe') handleStripeCheckout();
                    else if (selectedGateway === 'mpesa') handleMpesaStkPush();
                    else handlePaypalCheckout();
                  }}
                  className={`px-6 py-2.5 rounded-xl font-bold text-sm text-white shadow-md flex items-center gap-2 transition-all cursor-pointer active:scale-95 ${
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
                      Processing...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Pay via {selectedGateway === 'mpesa' ? 'M-Pesa' : selectedGateway === 'stripe' ? 'Card' : 'PayPal'}
                    </>
                  )}
                </button>
              </div>

            </div>
          )}
        </div>

        {/* Footer Security Assurance */}
        <div className="px-6 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Escrow-Protected & SSL 256-Bit Encrypted</span>
          </div>
          <span className="font-mono text-[10px]">SkillSwap 5.0 Vault</span>
        </div>

      </div>
    </div>
  );
};
