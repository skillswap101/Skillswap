import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filesToInspect = [
  path.join(__dirname, 'src', 'App.tsx'),
  path.join(__dirname, 'src', 'components', 'PostSkillModal.tsx')
];

console.log('--- Inspecting Codebase for isOffered Usage ---');

filesToInspect.forEach((filePath) => {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    console.log(`\nFile: ${path.basename(filePath)}`);
    lines.forEach((line, index) => {
      if (line.includes('isOffered')) {
        console.log(`Line ${index + 1}: ${line.trim()}`);
      }
    });
  } else {
    console.log(`\nFile not found: ${filePath}`);
  }
});
