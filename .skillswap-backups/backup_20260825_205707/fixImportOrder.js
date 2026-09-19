import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

// Remove old imports/inits if present
content = content.replace(/import { firebaseAuth, firestore } from '.\/firebaseAdmin.js';\n/g, '');

// Ensure firebaseAdmin is the very first import
const topImport = `import './firebaseAdmin.js';\nimport express from 'express';`;

if (!content.includes("import './firebaseAdmin.js';")) {
  content = content.replace("import express from 'express';", topImport);
}

fs.writeFileSync('server.ts', content, 'utf8');
console.log('✔ Fixed import order in server.ts');
