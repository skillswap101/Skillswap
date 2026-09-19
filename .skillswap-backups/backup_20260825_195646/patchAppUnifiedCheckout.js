import fs from 'fs';

let appContent = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add UnifiedCheckout import if missing
if (!appContent.includes("import UnifiedCheckout")) {
  // Insert after another component import, e.g., TimeCreditsView
  appContent = appContent.replace(
    /import.*TimeCreditsView.*;/,
    `import { TimeCreditsView } from './components/TimeCreditsView';\nimport UnifiedCheckout from './components/UnifiedCheckout';`
  );
}

// 2. Add state hook if missing
if (!appContent.includes("isUnifiedCheckoutOpen")) {
  // Find a good spot like near other state definitions (e.g., const [activeTab)
  appContent = appContent.replace(
    /(const \[activeTab.*)/,
    `$1\n  const [isUnifiedCheckoutOpen, setIsUnifiedCheckoutOpen] = useState(false);`
  );
}

// 3. Update TimeCreditsView props to include onOpenUnifiedCheckout
if (appContent.includes("<TimeCreditsView") && !appContent.includes("onOpenUnifiedCheckout")) {
  appContent = appContent.replace(
    /<TimeCreditsView([^>]*)\/>/,
    `<TimeCreditsView$1\n        onOpenUnifiedCheckout={() => setIsUnifiedCheckoutOpen(true)}\n      />`
  );
}

// 4. Inject UnifiedCheckout modal component near other modals or end of JSX
if (!appContent.includes("<UnifiedCheckout")) {
  // Look for closing main container or right before footer/nav
  appContent = appContent.replace(
    /(<\/div>\s*<\/div>\s*<\/div>\s*<\/main>|<\/div>\s*<\/div>\s*<\/div>\s*\);\s*\};)/,
    `      <UnifiedCheckout\n        isOpen={isUnifiedCheckoutOpen}\n        onClose={() => setIsUnifiedCheckoutOpen(false)}\n      />\n$1`
  );
}

fs.writeFileSync('src/App.tsx', appContent, 'utf8');
console.log('✔ Successfully patched App.tsx with UnifiedCheckout state and modal!');
