import fs from 'fs';

let content = fs.readFileSync('src/components/TimeCreditsView.tsx', 'utf8');

// Update interface prop name
content = content.replace(
  'onOpenStripeCheckout?: () => void;',
  'onOpenUnifiedCheckout?: () => void;\n  onOpenStripeCheckout?: () => void;'
);

content = content.replace(
  'onOpenStripeCheckout,',
  'onOpenUnifiedCheckout,\n  onOpenStripeCheckout,'
);

// Replace button onClick handlers to use UnifiedCheckout if available
content = content.replace(
  /onClick=\{onOpenStripeCheckout\}/g,
  'onClick={onOpenUnifiedCheckout || onOpenStripeCheckout}'
);

content = content.replace(
  /<span>Buy Credits via Stripe<\/span>/g,
  '<span>Buy Time Credits (Stripe / M-Pesa / PayPal)</span>'
);

content = content.replace(
  /<span>Manage Purchases \/ Buy Points<\/span>/g,
  '<span>Manage Purchases / Buy Credits</span>'
);

fs.writeFileSync('src/components/TimeCreditsView.tsx', content, 'utf8');
console.log('✔ Updated TimeCreditsView.tsx with unified checkout hooks');
