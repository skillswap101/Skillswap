import fs from 'fs';
import path from 'path';

const ignoreDirs = new Set(['node_modules', '.git', 'dist', '.vite']);

function walk(currentDir, prefix = '') {
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });
  
  // Sort entries: directories first, then files
  entries.sort((a, b) => {
    if (a.isDirectory() && !b.isDirectory()) return -1;
    if (!a.isDirectory() && b.isDirectory()) return 1;
    return a.name.localeCompare(b.name);
  });

  entries.forEach((entry, index) => {
    if (ignoreDirs.has(entry.name)) return;

    const isLast = index === entries.length - 1;
    const pointer = isLast ? '└── ' : '├── ';
    console.log(`${prefix}${pointer}${entry.name}`);

    if (entry.isDirectory()) {
      const extension = isLast ? '    ' : '│   ';
      walk(path.join(currentDir, entry.name), prefix + extension);
    }
  });
}

console.log('📂 Project File Tree: skillswap5.0');
walk(process.cwd());
