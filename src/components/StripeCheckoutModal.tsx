import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Clock, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  Lock, 
  X, 
  Zap, 
  Receipt, 
  Download, 
  History, 
  Search, 
  ArrowUpRight,
  Filter,
  Trash2
} from 'lucide-react';
import { User } from '../types';
import { api } from '../lib/api';
import { CREDIT_PACKAGES } from '../lib/creditPackages';

export interface StripeTransaction {
  id: string;
  packageName: string;
  credits: number;
  amount: number;
  cardName: string;
  cardLast4: string;
  cardBrand: 'Visa' | 'Mastercard' | 'Amex' | 'Card';
  status: 'succeeded' | 'processing' | 'failed';
  date: string;
}

interface StripeCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onAddCredits: (amount: number) => void;
  showToast: (msg: string) => void;
}

const STORAGE_KEY = 'skillswap_stripe_transactions';

const INITIAL_SAMPLE_TRANSACTIONS: StripeTransaction[] = [
  {
    id: 'ch_3M89F20A',
    packageName: 'Standard Bundle (Save $3)',
    credits: 3,
    amount: 12,
    cardName: 'Alex Rivers',
    cardLast4: '4242',
    cardBrand: 'Visa',
    status: 'succeeded',
    date: '2026-08-01, 14:30:15',
  },
  {
    id: 'ch_3M71K98B',
    packageName: 'Single Session',
    credits: 1,
    amount: 5,
    cardName: 'Alex Rivers',
    cardLast4: '8812',
    cardBrand: 'Mastercard',
    status: 'succeeded',
    date: '2026-07-20, 09:12:44',
  },
];

export const StripeCheckoutModal: React.FC<StripeCheckoutModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onAddCredits,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'checkout' | 'history'>('checkout');
  const [selectedPackage, setSelectedPackage] = useState(CREDIT_PACKAGES[1]);
  const [cardName, setCardName] = useState(currentUser.name || 'Alex Rivers');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [expiry, setExpiry] = useState('12/28');
  const [cvc, setCvc] = useState('123');
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [transactions, setTransactions] = useState<StripeTransaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse stripe transactions', e);
    }
    return INITIAL_SAMPLE_TRANSACTIONS;
  });

  const [completedReceipt, setCompletedReceipt] = useState<StripeTransaction | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    } catch (e) {
      console.error('Failed to save stripe transactions', e);
    }
  }, [transactions]);

  if (!isOpen) return null;

  const detectCardBrand = (num: string): 'Visa' | 'Mastercard' | 'Amex' | 'Card' => {
    const clean = num.replace(/\s+/g, '');
    if (clean.startsWith('4')) return 'Visa';
    if (clean.startsWith('5') || clean.startsWith('2')) return 'Mastercard';
    if (clean.startsWith('3')) return 'Amex';
    return 'Card';
  };

  const handlePayWithStripe = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    // Previously this never made a real network call at all - it just
    // waited 1.25s and then called onAddCredits() directly, self-awarding
    // credits with zero payment ever happening, and fabricated a fake
    // receipt from whatever card number was typed into a local form
    // (which was also collecting raw card numbers in our own app - a card
    // number should only ever be typed into Stripe's own hosted page).
    // Now it creates a real Stripe Checkout Session and redirects there;
    // crediting only ever happens via Stripe's signed webhook afterward.
    try {
      const session = await api.createStripeSession({ packageId: selectedPackage.id });
      window.location.href = session.url;
    } catch (err: any) {
      setIsProcessing(false);
      showToast(err.message || 'Could not start Stripe checkout.');
    }
  };

  const handleCloseAll = () => {
    setCompletedReceipt(null);
    onClose();
  };

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear your Stripe transaction history log?')) {
      setTransactions([]);
      localStorage.removeItem(STORAGE_KEY);
      showToast('Cleared transaction history log.');
    }
  };

  const filteredTransactions = transactions.filter((tx) => 
    tx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tx.packageName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tx.cardName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tx.date.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalCreditsPurchased = transactions.reduce((acc, tx) => acc + tx.credits, 0);
  const totalSpentUSD = transactions.reduce((acc, tx) => acc + tx.amount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-1.5">
                <span>{completedReceipt ? 'Stripe Digital Invoice' : 'Stripe Payment Gateway'}</span>
                <span className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded text-[9px] font-mono">
                  Verified
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                {completedReceipt ? 'Transaction completed successfully' : `Current Balance: ${currentUser.timeCredits} Credits`}
              </p>
            </div>
          </div>

          <button
            onClick={handleCloseAll}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector (When not in digital receipt view) */}
        {!completedReceipt && (
          <div className="flex border-b border-slate-800 bg-slate-950/60 px-5 pt-3 gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('checkout')}
              className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'checkout'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Buy Time Credits</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'history'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Transaction History ({transactions.length})</span>
            </button>
          </div>
        )}

        {/* Modal Body Container */}
        <div className="overflow-y-auto p-6 space-y-5 flex-1">
          
          {/* Completed Receipt View */}
          {completedReceipt ? (
            <div className="space-y-5 text-center my-auto">
              <div className="w-14 h-14 mx-auto bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full flex items-center justify-center animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-black text-white">Payment Confirmed!</h3>
                <p className="text-xs text-slate-400 mt-1">Receipt #{completedReceipt.id}</p>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2.5 text-left text-xs text-slate-300">
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Cardholder:</span>
                  <span className="font-bold text-white">{completedReceipt.cardName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Payment Card:</span>
                  <span className="font-mono text-slate-200">{completedReceipt.cardBrand} •••• {completedReceipt.cardLast4}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Credits Acquired:</span>
                  <span className="font-bold text-amber-300">+{completedReceipt.credits} Time Credit(s)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Amount Charged:</span>
                  <span className="font-bold text-emerald-400">${completedReceipt.amount}.00 USD</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Date & Time:</span>
                  <span className="font-mono text-slate-300 text-[11px]">{completedReceipt.date}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setCompletedReceipt(null);
                    setActiveTab('history');
                  }}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <History className="w-4 h-4 text-indigo-400" />
                  <span>View History Log</span>
                </button>

                <button
                  type="button"
                  onClick={handleCloseAll}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          ) : activeTab === 'checkout' ? (
            /* Checkout Tab Form */
            <form onSubmit={handlePayWithStripe} className="space-y-5">
              
              {/* Packages selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  1. Select Credit Package
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {CREDIT_PACKAGES.map((pkg) => (
                    <div
                      key={pkg.id}
                      onClick={() => setSelectedPackage(pkg)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer text-center relative ${
                        selectedPackage.id === pkg.id
                          ? 'bg-indigo-950/80 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {pkg.popular && (
                        <span className="absolute -top-2 left-1/2 transform -translate-x-1/2 px-2 py-0.2 bg-amber-500 text-slate-950 text-[9px] font-black rounded-full uppercase">
                          Best Value
                        </span>
                      )}
                      <p className="text-lg font-black text-amber-300 flex items-center justify-center gap-1">
                        <Clock className="w-4 h-4 text-amber-400" />
                        +{pkg.hours}
                      </p>
                      <p className="text-xs font-bold text-white mt-1">${pkg.priceUSD}</p>
                      <p className="text-[9px] text-slate-400 mt-0.5 truncate">{pkg.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Information */}
              <div className="space-y-3 pt-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  2. Payment Information
                </label>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-center">
                  <p className="text-xs text-slate-400">
                    You'll be redirected to Stripe's own secure checkout page to enter your
                    card details. SkillSwap never sees or stores your card number.
                  </p>
                </div>
              </div>

              {/* Guarantee & Pay Button */}
              <div className="pt-2 space-y-3">
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>256-Bit SSL Encrypted Payment powered by Stripe API</span>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin" />
                      <span>Processing Stripe Payment...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>Pay ${selectedPackage.priceUSD}.00 for +{selectedPackage.hours} Credit(s)</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          ) : (
            /* Transaction History Log Tab */
            <div className="space-y-4">
              
              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Total Credits Bought</p>
                  <p className="text-xl font-black text-amber-300 mt-0.5 flex items-center gap-1">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>+{totalCreditsPurchased}</span>
                  </p>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Total Paid (USD)</p>
                  <p className="text-xl font-black text-emerald-400 mt-0.5">${totalSpentUSD}.00</p>
                </div>
              </div>

              {/* Search & Actions Bar */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search receipt ID, card, date..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {transactions.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearHistory}
                    className="p-2 bg-slate-800 hover:bg-rose-950/80 text-slate-400 hover:text-rose-300 border border-slate-700 rounded-xl text-xs transition-colors cursor-pointer"
                    title="Clear Log"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Transaction Logs List */}
              <div className="space-y-2">
                {filteredTransactions.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-xs">
                    No transactions found in log.
                  </div>
                ) : (
                  filteredTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-3.5 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-2xl flex items-center justify-between text-xs transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-white font-bold">{tx.id}</span>
                          <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold rounded-full uppercase">
                            {tx.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {tx.packageName} • {tx.cardBrand} •••• {tx.cardLast4}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono">{tx.date}</p>
                      </div>

                      <div className="text-right space-y-1">
                        <p className="text-sm font-black text-amber-300">+{tx.credits} Credits</p>
                        <p className="text-xs font-bold text-slate-300">${tx.amount}.00 USD</p>
                        <button
                          type="button"
                          onClick={() => setCompletedReceipt(tx)}
                          className="text-[10px] text-indigo-400 hover:underline flex items-center gap-0.5 justify-end"
                        >
                          <span>Receipt</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
