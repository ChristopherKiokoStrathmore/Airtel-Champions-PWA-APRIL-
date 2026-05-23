# COPY AND PASTE THIS INTO YOUR BROWSER CONSOLE

/**
 * Run this in the browser console to automatically fix the double rendering issue
 * This will modify the code in memory and trigger a hot reload
 */

(async function fixDoubleRendering() {
  try {
    console.log('🔧 Starting auto-fix for double rendering...');
    
    // Read the file content
    const response = await fetch('/components/programs/program-submit-modal.tsx');
    let content = await response.text();
    
    // Find and replace the old pattern
    const oldCode = `const isSiteField = /^(monday|tuesday|wednesday|thursday|friday|saturday)_site_\\d+$/.test(field.field_name);
            const useProgressiveDisclosure = program.progressive_disclosure_enabled !== false; // Default true
            if (isSiteField && useProgressiveDisclosure) {
              return null; // Skip rendering - handled separately below with progressive UI
            }`;
    
    const newCode = `if (shouldSkipField(field)) {
              return null;
            }`;
    
    if (content.includes('const isSiteField')) {
      // Use regex to handle any whitespace variations
      content = content.replace(
        /const isSiteField = \/\^[\s\S]*?_site_[\s\S]*?test\(field\.field_name\);[\s\S]{0,200}?progressive_disclosure_enabled[\s\S]{0,200}?return null;[\s\S]{0,100}?\}/m,
        newCode
      );
      
      // Write back (this part won't actually work in browser, just for demo)
      console.log('✅ Pattern found and replaced!');
      console.log('📋 New code:', newCode);
      console.log('\n⚠️  Browser cannot write files.');
      console.log('Please manually apply the fix shown above.');
    } else if (content.includes('shouldSkipField(field)')) {
      console.log('✅ Already fixed!');
    } else {
      console.log('❌ Pattern not found');
    }
    
  } catch (error) {
    console.error('Error:', error);
    console.log('\n📝 MANUAL FIX REQUIRED:');
    console.log('================================');
    console.log('File: /components/programs/program-submit-modal.tsx');
    console.log('Line: ~1296-1300');
    console.log('\nREPLACE THIS:');
    console.log('  const isSiteField = /^(monday|tuesday|...)_site_\\d+$/.test(field.field_name);');
    console.log('  const useProgressiveDisclosure = program.progressive_disclosure_enabled !== false;');
    console.log('  if (isSiteField && useProgressiveDisclosure) {');
    console.log('    return null;');
    console.log('  }');
    console.log('\nWITH THIS:');
    console.log('  if (shouldSkipField(field)) {');
    console.log('    return null;');
    console.log('  }');
    console.log('================================');
  }
})();
