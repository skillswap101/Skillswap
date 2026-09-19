import fs from 'fs';

let content = fs.readFileSync('src/components/TimeCreditsView.tsx', 'utf8');

// Update condition from {onOpenStripeCheckout &&} to {(onOpenUnifiedCheckout || onOpenStripeCheckout) &&}
content = content.replace(
  '{onOpenStripeCheckout && (\n              <button',
  '{(onOpenUnifiedCheckout || onOpenStripeCheckout) && (\n              <button'
);

content = content.replace(
  '{onOpenStripeCheckout && (\n            <button',
  '{(onOpenUnifiedCheckout || onOpenStripeCheckout) && (\n            <button'
);

fs.writeFileSync('src/components/TimeCreditsView.tsx', content, 'utf8');
console.log('✔ Fixed button rendering condition in TimeCreditsView.tsx');
