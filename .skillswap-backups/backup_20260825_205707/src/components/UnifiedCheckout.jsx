import React, { useState } from 'react';
import StripeCheckoutModal from './StripeCheckoutModal';
import MpesaCheckoutModal from './MpesaCheckoutModal';
import PaypalPayment from './PaypalPayment';

export default function UnifiedCheckout({ isOpen, onClose, selectedPackage }) {
  const [activeGateway, setActiveGateway] = useState('stripe'); // 'stripe' | 'mpesa' | 'paypal'

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div>
            <h3 className="text-lg font-extrabold text-white">Choose Payment Method</h3>
            <p className="text-xs text-slate-400">Select how you'd like to fund your time credits</p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition cursor-pointer font-bold"
          >
            ✕
          </button>
        </div>

        {/* Gateway Tabs */}
        <div className="grid grid-cols-3 gap-2 p-4 bg-slate-950/80 border-b border-slate-800">
          <button
            onClick={() => setActiveGateway('stripe')}
            className={`py-2.5 px-3 rounded-2xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeGateway === 'stripe' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span>💳 Stripe</span>
          </button>

          <button
            onClick={() => setActiveGateway('mpesa')}
            className={`py-2.5 px-3 rounded-2xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeGateway === 'mpesa' 
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' 
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span>📱 M-Pesa</span>
          </button>

          <button
            onClick={() => setActiveGateway('paypal')}
            className={`py-2.5 px-3 rounded-2xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeGateway === 'paypal' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span>🅿️ PayPal</span>
          </button>
        </div>

        {/* Active Gateway Content */}
        <div className="p-6">
          {activeGateway === 'stripe' && (
            <StripeCheckoutModal selectedPackage={selectedPackage} onClose={onClose} embedded={true} />
          )}
          {activeGateway === 'mpesa' && (
            <MpesaCheckoutModal selectedPackage={selectedPackage} onClose={onClose} embedded={true} />
          )}
          {activeGateway === 'paypal' && (
            <PaypalPayment selectedPackage={selectedPackage} onClose={onClose} embedded={true} />
          )}
        </div>

      </div>
    </div>
  );
}
