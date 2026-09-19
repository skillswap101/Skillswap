import fs from 'fs';
import path from 'path';

const serverPath = path.resolve('server.js');

if (!fs.existsSync(serverPath)) {
  console.error('Error: server.js not found in current directory!');
  process.exit(1);
}

let content = fs.readFileSync(serverPath, 'utf8');

let modified = false;

// 1. Inject import statement if missing
const importTarget = "import paypalRouter from './paypal.js';"; // or similar existing import
const importSnippet = "import stripeRouter from './stripe.js';";

if (!content.includes('stripeRouter')) {
  if (content.includes(importTarget)) {
    content = content.replace(importTarget, `${importTarget}\n${importSnippet}`);
  } else {
    // Fallback: inject near top after dotenv config
    content = content.replace("dotenv.config();", `dotenv.config();\n${importSnippet}`);
  }
  modified = true;
  console.log('✔ Added stripeRouter import.');
} else {
  console.log('ℹ stripeRouter import already exists.');
}

// 2. Inject app.use(stripeRouter) before express.json() or routes
const mountTarget = "app.use(express.json());";
const mountSnippet = "// Mount Stripe routes\napp.use(stripeRouter);";

if (!content.includes('app.use(stripeRouter)')) {
  if (content.includes(mountTarget)) {
    content = content.replace(mountTarget, `${mountSnippet}\n\n${mountTarget}`);
  } else {
    content += `\n\n${mountSnippet}\n`;
  }
  modified = true;
  console.log('✔ Added app.use(stripeRouter).');
} else {
  console.log('ℹ app.use(stripeRouter) already exists.');
}

if (modified) {
  fs.writeFileSync(serverPath, content, 'utf8');
  console.log('🚀 Successfully updated server.js!');
} else {
  console.log('ℹ server.js was already up to date.');
}
