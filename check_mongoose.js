import fs from 'fs';
import path from 'path';

function checkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules') checkDir(fullPath);
    } else if (file.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('mongoose') && !content.includes('import mongoose') && !content.includes("require('mongoose')")) {
        console.log(`POTENTIAL MISSING IMPORT: ${fullPath}`);
        // Print lines with mongoose
        const lines = content.split('\n');
        lines.forEach((line, i) => {
          if (line.includes('mongoose')) {
            console.log(`  L${i + 1}: ${line.trim()}`);
          }
        });
      }
    }
  }
}

checkDir('./backend');
