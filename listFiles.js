import fs from 'fs';
import path from 'path';

// Directories and files to ignore
const ignoreList = ['node_modules', '.git', 'dist', '.env', 'package-lock.json'];

function walkDir(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    if (ignoreList.includes(file)) return;
    
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      walkDir(filePath, fileList);
    } else {
      fileList.push(path.relative(process.cwd(), filePath));
    }
  });
  
  return fileList;
}

const allFiles = walkDir(process.cwd());
console.log("=== SkillSwap Project Files ===");
allFiles.forEach(f => console.log(f));
