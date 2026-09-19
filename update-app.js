const fs = require('fs');
const filePath = './src/App.tsx';

fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    console.error('❌ Error reading App.tsx:', err.message);
    return;
  }

  const importToAdd = "import UnifiedCheckout from './components/UnifiedCheckout';";

  if (data.includes(importToAdd)) {
    console.log('⚠️ UnifiedCheckout import already exists in App.tsx.');
    return;
  }

  const targetPattern = "import {\n  StripeCheckoutModal\n} from './components/StripeCheckoutModal';";

  let updatedData;
  if (data.includes('StripeCheckoutModal')) {
    updatedData = data.replace(
      targetPattern,
      `${targetPattern}\n${importToAdd}`
    );
  } else {
    updatedData = `${importToAdd}\n${data}`;
  }

  fs.writeFile(filePath, updatedData, 'utf8', (err) => {
    if (err) {
      console.error('❌ Error writing App.tsx:', err.message);
      return;
    }
    console.log('✅ Successfully added UnifiedCheckout import to App.tsx!');
  });
});
