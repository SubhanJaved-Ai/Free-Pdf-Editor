const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.next')) {
        results = results.concat(walk(file));
      }
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./src');
let foundError = false;

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf-8');
  const importRegex = /import\s+.*?\s+from\s+['"](.*?)['"]/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    let importPath = match[1];
    let isLocal = false;
    let targetPath = '';

    if (importPath.startsWith('.')) {
      const resolvedDir = path.dirname(file);
      targetPath = path.resolve(resolvedDir, importPath);
      isLocal = true;
    } else if (importPath.startsWith('@/')) {
      targetPath = path.resolve(__dirname, 'src', importPath.slice(2));
      isLocal = true;
    }

    if (isLocal) {
      const targetDir = path.dirname(targetPath);
      const targetBase = path.basename(targetPath);
      
      if (fs.existsSync(targetDir)) {
        const dirFiles = fs.readdirSync(targetDir);
        
        const exactMatches = dirFiles.filter(f => f === targetBase || f.replace(/\.[^/.]+$/, '') === targetBase || f === targetBase + '.tsx' || f === targetBase + '.ts');
        if (exactMatches.length === 0) {
          const actualName = dirFiles.find(f => f.toLowerCase() === targetBase.toLowerCase() || f.replace(/\.[^/.]+$/, '').toLowerCase() === targetBase.toLowerCase());
          if (actualName) {
            console.log(`Case mismatch in ${file}: import "${importPath}" should be matching case of "${actualName}"`);
            foundError = true;
          }
        }
      } else {
        // The directory itself might be wrong case!
        // We should check directory case recursively if possible, but let's just log it.
        const parentDir = path.dirname(targetDir);
        if (fs.existsSync(parentDir)) {
           const dirName = path.basename(targetDir);
           const pFiles = fs.readdirSync(parentDir);
           const pActual = pFiles.find(f => f.toLowerCase() === dirName.toLowerCase() && f !== dirName);
           if (pActual) {
             console.log(`Case mismatch in ${file}: Directory in import "${importPath}" should be "${pActual}"`);
             foundError = true;
           }
        }
      }
    }
  }
});
if (!foundError) console.log('No case mismatch found in @/ or relative imports');
