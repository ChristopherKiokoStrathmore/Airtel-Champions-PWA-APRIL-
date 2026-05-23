// Dependency Audit Script
const fs = require('fs');
const path = require('path');

// Read package.json
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
const dependencies = Object.keys(packageJson.dependencies);

// Files to search
const srcDir = './src';
const usedDependencies = new Set();

function searchInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    dependencies.forEach(dep => {
      // Check for various import patterns
      const patterns = [
        `from '${dep}'`,
        `from "${dep}"`,
        `from '${dep}/`,
        `from "${dep}/`,
        `require('${dep}')`,
        `require("${dep}")`,
        `require('${dep}/`,
        `require("${dep}/`,
      ];
      
      patterns.forEach(pattern => {
        if (content.includes(pattern)) {
          usedDependencies.add(dep);
        }
      });
    });
  } catch (error) {
    // Skip files that can't be read
  }
}

function searchDirectory(dir) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      searchDirectory(fullPath);
    } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx') || item.endsWith('.js') || item.endsWith('.jsx'))) {
      searchInFile(fullPath);
    }
  }
}

// Search all source files
searchDirectory(srcDir);

// Find unused dependencies
const unusedDependencies = dependencies.filter(dep => !usedDependencies.has(dep));

console.log('=== DEPENDENCY AUDIT RESULTS ===');
console.log('\n✅ Used dependencies:', usedDependencies.size);
console.log('\n❌ Unused dependencies:', unusedDependencies.length);

if (unusedDependencies.length > 0) {
  console.log('\nUnused dependencies that can be removed:');
  unusedDependencies.forEach(dep => {
    console.log(`  - ${dep}`);
  });
  
  console.log('\nTo remove unused dependencies, run:');
  console.log(`npm uninstall ${unusedDependencies.join(' ')}`);
} else {
  console.log('\n🎉 All dependencies are being used!');
}

console.log('\n=== POTENTIALLY UNUSED DEPENDENCIES ===');
// Check for dependencies that might be used but not directly imported
const potentiallyUnused = dependencies.filter(dep => {
  const used = usedDependencies.has(dep);
  // Skip core dependencies
  if (['react', 'react-dom', 'typescript'].includes(dep)) return false;
  return !used;
});

if (potentiallyUnused.length > 0) {
  console.log('\nPotentially unused (check manually):');
  potentiallyUnused.forEach(dep => {
    console.log(`  - ${dep}`);
  });
}
