import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

// Replace the inline firebase init with the central import
const oldInitBlock = `// Initialize Firebase Admin SDK if not already initialized
const firebaseApp = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: cert(serviceAccount as ServiceAccount),
    });

const firebaseAuth = getAuth(firebaseApp);
const firestore = getFirestore(firebaseApp);`;

const newInitBlock = `import { firebaseAuth, firestore } from './firebaseAdmin.js';`;

if (content.includes('const firebaseApp = getApps().length')) {
  content = content.replace(oldInitBlock, newInitBlock);
  fs.writeFileSync('server.ts', content, 'utf8');
  console.log('✔ Updated server.ts to use central firebaseAdmin module');
} else {
  console.log('ℹ Firebase init block already updated or not found');
}
