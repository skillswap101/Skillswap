import React, { useState } from 'react';

export default function MpesaPayment({ serviceTitle = 'Skill Swap Service', defaultAmount = 100, onPaymentSuccess }) {
    const [phone, setPhone] = useState('');
    const [amount, setAmount] = useState(defaultAmount);
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState({ type: '', text: '' });

    const handlePayment = async (e) => {
        e.preventDefault();
        setLoading(true);
        setFeedback({ type: '', text: '' });

        // Basic phone formatting validation for Kenya
        let formattedPhone = phone.trim();
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '254' + formattedPhone.slice(1);
        }

        try {
            const response = await fetch('/api/v1/mpesa/pay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: formattedPhone,
                    amount: Number(amount),
                    accountReference: 'SkillSwap5',
                    description: `Payment for ${serviceTitle}`
                })
            });

            const data = await response.json();

            if (data.success) {
                setFeedback({ 
                    type: 'success', 
                    text: 'STK Push sent successfully! Check your phone and enter your M-Pesa PIN.' 
                });
                if (onPaymentSuccess) onPaymentSuccess(data);
            } else {
                setFeedback({ 
                    type: 'error', 
                    text: data.error || 'Failed to initiate payment. Please try again.' 
                });
            }
        } catch (err) {
            console.error('Payment request error:', err);
            setFeedback({ 
                type: 'error', 
                text: 'Network error. Make sure your backend server is running.' 
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.card}>
            <h3>Lipa na M-Pesa</h3>
            <p style={styles.subtitle}>Secure payment for: <strong>{serviceTitle}</strong></p>
            
            <form onSubmit={handlePayment} style={styles.form}>
                <div style={styles.inputGroup}>
                    <label>M-Pesa Phone Number:</label>
                    <input 
                        type="tel" 
                        placeholder="e.g. 0712345678 or 254712..." 
                        value={phone} 
                        onChange={(e) => setPhone(e.target.value)} 
                        required 
                        style={styles.input}
                    />
                </div>

                <div style={styles.inputGroup}>
                    <label>Amount (KES):</label>
                    <input 
                        type="number" 
                        value={amount} 
                        onChange={(e) => setAmount(e.target.value)} 
                        required 
                        style={styles.input}
                    />
                </div>

                <button type="submit" disabled={loading} style={styles.button}>
                    {loading ? 'Sending STK Push...' : `Pay KES ${amount}`}
                </button>
            </form>

            {feedback.text && (
                <div style={{ ...styles.alert, backgroundColor: feedback.type === 'success' ? '#e6f4ea' : '#fce8e6', color: feedback.type === 'success' ? '#137333' : '#c5221f' }}>
                    {feedback.text}
                </div>
            )}
        </div>
    );
}

const styles = {
    card: {
        maxWidth: '400px',
        margin: '20px auto',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        backgroundColor: '#fff',
        fontFamily: 'sans-serif'
    },
    subtitle: {
        fontSize: '14px',
        color: '#666',
        marginBottom: '15px'
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
        textAlign: 'left',
        fontSize: '13px',
        fontWeight: 'bold',
        color: '#333'
    },
    input: {
        padding: '10px',
        borderRadius: '6px',
        border: '1px solid #ccc',
        fontSize: '14px'
    },
    button: {
        padding: '12px',
        borderRadius: '6px',
        border: 'none',
        backgroundColor: '#008751',
        color: '#fff',
        fontSize: '16px',
        fontWeight: 'bold',
        cursor: 'pointer',
        marginTop: '10px'
    },
    alert: {
        marginTop: '15px',
        padding: '10px',
        borderRadius: '6px',
        fontSize: '13px',
        textAlign: 'center'
    }
};
