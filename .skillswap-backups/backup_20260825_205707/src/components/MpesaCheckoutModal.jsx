import React, { useState } from 'react';
import { triggerMpesaStkPush } from '../services/api';

export default function MpesaCheckoutModal({ 
  isOpen, 
  onClose, 
  amount, 
  escrowId, 
  accountReference, 
  transactionDesc, 
  onSuccess 
}) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await triggerMpesaStkPush({
        phoneNumber,
        amount,
        accountReference: accountReference || 'SkillSwap',
        transactionDesc: transactionDesc || 'Escrow Fund Deposit',
        escrowId
      });

      setSuccessMsg('STK Push sent successfully! Please check your phone and enter your M-Pesa PIN.');
      if (onSuccess) onSuccess(res);
    } catch (err) {
      setError(err.message || 'Payment initiation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
        >
          &times;
        </button>

        <div className="text-center mb-6">
          <div className="bg-green-100 text-green-700 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 font-black text-xl shadow-inner">
            M
          </div>
          <h3 className="text-xl font-bold text-gray-900">M-Pesa Secure Checkout</h3>
          <p className="text-sm text-gray-500 mt-1">
            Amount to Pay: <span className="font-semibold text-gray-800">KES {amount}</span>
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">
            {error}
          </div>
        )}

        {successMsg ? (
          <div className="text-center py-2">
            <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl text-sm mb-5 leading-relaxed">
              {successMsg}
            </div>
            <button
              onClick={onClose}
              className="w-full bg-green-600 text-white py-3 rounded-xl font-medium hover:bg-green-700 transition shadow-lg shadow-green-600/20"
            >
              Close & Wait for Confirmation
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                M-Pesa Phone Number
              </label>
              <input
                type="tel"
                placeholder="e.g. 0712345678"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition text-sm font-medium text-gray-800"
              />
              <p className="text-xs text-gray-400 mt-1.5">A payment prompt will be sent directly to this number.</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-3.5 rounded-xl font-semibold hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center space-x-2 shadow-lg shadow-green-600/20"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0h4v2H6v-2z"></path>
                  </svg>
                  <span>Triggering STK Push...</span>
                </>
              ) : (
                <span>Pay KES {amount}</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
