import React, { useEffect, useState } from 'react';

export default function PaypalPayment({ amountUSD = 10, onSuccesfulPayment }) {
    const [sdkLoaded, setSdkLoaded] = useState(false);
    const [status, setStatus] = useState('');

    useEffect(() => {
        // Load PayPal SDK dynamically
        if (window.paypal) {
            setSdkLoaded(true);
            return;
        }
        const script = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=${import.meta.env.VITE_PAYPAL_CLIENT_ID || 'your_client_id'}&currency=USD`;
        script.async = true;
        script.onload = () => setSdkLoaded(true);
        document.body.appendChild(script);
    }, []);

    useEffect(() => {
        if (sdkLoaded && window.paypal) {
            window.paypal.Buttons({
                createOrder: async () => {
                    const res = await fetch('http://localhost:5000/api/v1/paypal/create-order', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ amount: amountUSD })
                    });
                    const data = await res.json();
                    return data.orderId;
                },
                onApprove: async (data) => {
                    setStatus('Processing payment...');
                    const res = await fetch('http://localhost:5000/api/v1/paypal/capture-order', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ orderID: data.orderID })
                    });
                    const result = await res.json();
                    if (result.success) {
                        setStatus('Payment successful!');
                        if (onSuccesfulPayment) onSuccesfulPayment(result);
                    } else {
                        setStatus('Payment capture failed.');
                    }
                },
                onError: (err) => {
                    console.error('PayPal checkout error:', err);
                    setStatus('An error occurred during PayPal checkout.');
                }
            }).render('#paypal-button-container');
        }
    }, [sdkLoaded, amountUSD]);

    return (
        <div style={{ padding: '20px', background: '#fff', borderRadius: '12px', maxWidth: '400px', margin: '20px auto' }}>
            <h3>Pay with PayPal</h3>
            <p>Amount: <strong>${amountUSD} USD</strong></p>
            <div id="paypal-button-container"></div>
            {status && <p style={{ marginTop: '10px', textAlign: 'center', fontSize: '14px' }}>{status}</p>}
        </div>
    );
}
