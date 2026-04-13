#!/usr/bin/env node

/**
 * AUTOMATED FIX SCRIPT
 * 
 * This script fixes the double rendering issue in program-submit-modal.tsx
 * Run with: node fix-double-rendering.js
 */

const fs = require('fs');
const filePath = './components/programs/program-submit-modal.tsx';

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Pattern to find and replace
const oldPattern = `const isSiteField = /^(monday|tuesday|wednesday|thursday|friday|saturday)_site_\\d+$/.test(field.field_name);
            const useProgressiveDisclosure = program.progressive_disclosure_enabled !== false; // Default true
            if (isSiteField && useProgressiveDisclosure) {
              return null; // Skip rendering - handled separately below with progressive UI
            }`;

const newPattern = `if (shouldSkipField(field)) {
              return null;
            }`;

// Check if pattern exists
if (content.includes('const isSiteField = /^(monday')) {
  console.log('✅ Found old pattern!');
  
  // Replace with flexible regex matching
  content = content.replace(
    /const isSiteField = \/\^.*?_site_.*?\.test\(field\.field_name\);[\s\S]*?const useProgressiveDisclosure = program\.progressive_disclosure_enabled.*?;.*?\n.*?if \(isSiteField && useProgressiveDisclosure\) \{[\s\S]*?return null;.*?\n.*?\}/,
    `if (shouldSkipField(field)) {
              return null;
            }`
  );
  
  // Write back
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ File updated successfully!');
  console.log('🔄 Please refresh your browser');
} else if (content.includes('shouldSkipField(field)')) {
  console.log('✅ Already fixed! Nothing to do.');
} else {
  console.log('❌ Pattern not found. Manual fix required.');
  console.log('\nManual instructions:');
  console.log('1. Open /components/programs/program-submit-modal.tsx');
  console.log('2. Go to line ~1296');
  console.log('3. Find these 5 lines:');
  console.log('   const isSiteField = /^(monday|...');
  console.log('   const useProgressiveDisclosure = ...');
  console.log('   if (isSiteField && useProgressiveDisclosure) {');
  console.log('     return null;');
  console.log('   }');
  console.log('4. Replace with:');
  console.log('   if (shouldSkipField(field)) {');
  console.log('     return null;');
  console.log('   }');
}
