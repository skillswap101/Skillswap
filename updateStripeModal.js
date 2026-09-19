import fs from 'fs';
import path from 'path';

const modalPath = path.resolve('src/components/StripeCheckoutModal.tsx');

if (!fs.existsSync(modalPath)) {
  console.error('Error: src/components/StripeCheckoutModal.tsx not found!');
  process.exit(1);
}

let content = fs.readFileSync(modalPath, 'utf8');

const oldCodeSnippet = `  const handlePayWithStripe = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);

      const cleanNum = cardNumber.replace(/\\D/g, '');
      const last4 = cleanNum.length >= 4 ? cleanNum.slice(-4) : '4242';
      const brand = detectCardBrand(cardNumber);

      const newTx: StripeTransaction = {
        id: \`ch_3M\${Math.random().toString(36).substring(2, 10).toUpperCase()}\`,
        packageName: selectedPackage.label,
        credits: selectedPackage.credits,
        amount: selectedPackage.price,
        cardName: cardName || currentUser.name,
        cardLast4: last4,
        cardBrand: brand,
        status: 'succeeded',
        date: new Date().toLocaleString(),
      };

      // Add credits to user state
      onAddCredits(selectedPackage.credits);

      // Update transaction log
      setTransactions((prev) => [newTx, ...prev]);

      // Show digital receipt
      setCompletedReceipt(newTx);
      showToast(\`⚡ Payment successful! Added +\${selectedPackage.credits} Time Credit(s) via Stripe.\`);
    }, 1250);
  };`;

const newFunctionSnippet = `  const handlePayWithStripe = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const response = await fetch('http://localhost:5000/api/v1/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credits: selectedPackage.credits,
          price: selectedPackage.price,
          packageName: selectedPackage.label,
          userId: currentUser?.uid || 'anonymous'
        })
      });

      const data = await response.json();
      if (data.success && data.url) {
        window.location.href = data.url; // Redirect user to secure Stripe hosted payment page
      } else {
        throw new Error(data.error || 'Failed to initialize Stripe checkout');
      }
    } catch (err: any) {
      console.error('Stripe payment error:', err);
      showToast(\`Error: \${err.message}\`);
      setIsProcessing(false);
    }
  };`;

if (content.includes('const handlePayWithStripe =')) {
  content = content.replace(oldCodeSnippet, newFunctionSnippet);
  fs.writeFileSync(modalPath, content, 'utf8');
  console.log('✔ Successfully updated handlePayWithStripe in StripeCheckoutModal.tsx!');
} else {
  console.error('Could not find exact handlePayWithStripe block. Please check the function content.');
}
