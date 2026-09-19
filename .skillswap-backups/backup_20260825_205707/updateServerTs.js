import fs from 'fs';
import path from 'path';

const serverPath = path.resolve('server.ts');

if (!fs.existsSync(serverPath)) {
  console.error('Error: server.ts not found in current directory!');
  process.exit(1);
}

let content = fs.readFileSync(serverPath, 'utf8');
let modified = false;

// 1. Inject import statement
const importTarget = "import paypalRouter from './paypal.js';";
const importSnippet = "import stripeRouter from './stripe.js';";

if (!content.includes('stripeRouter')) {
  if (content.includes(importTarget)) {
    content = content.replace(importTarget, `${importTarget}\n${importSnippet}`);
    modified = true;
    console.log('✔ Added stripeRouter import to server.ts');
  } else {
    console.error('Could not find PayPal import target in server.ts');
  }
} else {
  console.log('ℹ stripeRouter import already exists in server.ts');
}

// 2. Inject app.use(stripeRouter) right before app.use(express.json())
const mountTarget = "app.use(express.json());";
const mountSnippet = "// Mount Stripe routes\napp.use(stripeRouter);";

if (!content.includes('app.use(stripeRouter)')) {
  if (content.includes(mountTarget)) {
    content = content.replace(mountTarget, `${mountSnippet}\n\n${mountTarget}`);
    modified = true;
    console.log('✔ Added app.use(stripeRouter) to server.ts');
  } else {
    console.error('Could not find app.use(express.json()) target in server.ts');
  }
} else {
  console.log('ℹ app.use(stripeRouter) already exists in server.ts');
}

if (modified) {
  fs.writeFileSync(serverPath, content, 'utf8');
  console.log('🚀 Successfully updated server.ts!');
} else {
  console.log('ℹ server.ts was already up to date.');
}
