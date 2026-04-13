// Simple Browser Test - MCP UAT Debug Version
const { chromium } = require('playwright');

async function testBrowser() {
  console.log('🚀 Starting Browser Test...');
  console.log('🌐 This will definitely show a Chrome window');
  console.log('📍 Current directory:', process.cwd());
  
  try {
    console.log('🔧 Step 1: Launching browser...');
    const browser = await chromium.launch({ 
      headless: false,  // MUST be false to show browser
      slowMo: 2000,     // Slow down for visibility
      devtools: true    // Open dev tools
    });
    
    console.log('✅ Step 2: Browser launched successfully');
    
    console.log('🔧 Step 3: Creating new page...');
    const page = await browser.newPage();
    console.log('✅ Step 4: New page created');
    
    console.log('🔧 Step 5: Setting viewport...');
    await page.setViewportSize({ width: 1280, height: 720 });
    console.log('✅ Step 6: Viewport set to 1280x720');
    
    console.log('⏳ Step 7: Waiting 3 seconds - look for Chrome window...');
    await new Promise(r => setTimeout(r, 3000));
    console.log('✅ Step 8: Wait completed');
    
    console.log('🌐 Step 9: Navigating to your app...');
    await page.goto('https://airtel-champions-app-web-git-main-christopherkiokos-projects.vercel.app/');
    console.log('✅ Step 10: Navigation completed');
    
    console.log('⏳ Step 11: Waiting 5 seconds to see the app...');
    await new Promise(r => setTimeout(r, 5000));
    console.log('✅ Step 12: App viewing completed');
    
    console.log('🔍 Step 13: Taking screenshot for verification...');
    await page.screenshot({ path: 'uat-debug-screenshot.png' });
    console.log('✅ Step 14: Screenshot saved as uat-debug-screenshot.png');
    
    console.log('🏁 Step 15: Test completed successfully!');
    
    await browser.close();
    console.log('🔒 Step 16: Browser closed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('🔧 Try running: npx playwright install chromium');
  }
}

if (require.main === module) {
  testBrowser().catch(console.error);
}
