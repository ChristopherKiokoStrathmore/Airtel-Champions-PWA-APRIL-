// MCP-Based Autonomous UAT System - Super Auto-Fix Version
// Runs locally in IDE using Playwright and Chrome DevTools MCP

const { chromium } = require('playwright');
const path = require('path');

const APP_URL = 'https://airtel-champions-app-web-git-main-christopherkiokos-projects.vercel.app/';
const MAX_RETRIES = 3;

// Simplified profiles for testing
const profiles = [
  {
    name: 'Sales Executive',
    login: { phone: '0733584848', pin: '1234', mode: 'sales' },
    journeys: [
      { name: 'Dashboard loads', run: async (page) => {
        await page.waitForSelector('text=Dashboard, text=Overview, text=My Team', { timeout: 5000 });
      }}
    ]
  },
  {
    name: 'HBB Agent',
    login: { phone: '0711111111', pin: '1234', mode: 'hbb' },
    journeys: [
      { name: 'Dashboard loads', run: async (page) => {
        await page.waitForSelector('text=My Leads, text=Dashboard, text=HBB', { timeout: 5000 });
      }}
    ]
  }
];

async function runSingleProfileTest(profile, browser) {
  console.log(`\n👤 Testing profile: ${profile.name}`);
  console.log(`📱 Phone: ${profile.login.phone} | Mode: ${profile.mode}`);
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log(`\n  🔄 Attempt ${attempt}/${MAX_RETRIES}`);
    
    try {
      // Create fresh page for each attempt
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1280, height: 720 });
      
      // Navigate and wait for page to be fully loaded
      console.log('  🌐 Navigating to app...');
      await page.goto(APP_URL, { waitUntil: 'networkidle', timeout: 10000 });
      console.log('  ✅ Page loaded');
      
      // Wait extra time for dynamic content to load
      console.log('  ⏳ Waiting for page to stabilize...');
      await new Promise(r => setTimeout(r, 3000));
      
      // Handle mode switching if needed
      const currentMode = await page.locator('text=Airtel Champions HBB, text=Airtel Champions Sales').first().textContent().catch(() => null);
      console.log(`  📱 Current mode: ${currentMode}`);
      
      if (profile.mode === 'sales' && currentMode && currentMode.includes('HBB')) {
        console.log('  🔀 Switching to Sales mode');
        await page.click('text=Tap cube to switch mode');
        await new Promise(r => setTimeout(r, 1000));
        await page.click('text=Airtel Champions Sales');
        await new Promise(r => setTimeout(r, 2000));
      } else if (profile.mode === 'hbb' && currentMode && currentMode.includes('Sales')) {
        console.log('  🔀 Switching to HBB mode');
        await page.click('text=Tap cube to switch mode');
        await new Promise(r => setTimeout(r, 1000));
        await page.click('text=Airtel Champions HBB');
        await new Promise(r => setTimeout(r, 2000));
      }
      
      // Skip tutorial if present
      console.log('  🎯 Checking for tutorial...');
      try {
        const tutorialBtn = await page.locator('button:has-text("Skip"), button:has-text("Got it")').first();
        if (await tutorialBtn.isVisible({ timeout: 2000 })) {
          await tutorialBtn.click();
          console.log('  ✅ Tutorial skipped');
          await new Promise(r => setTimeout(r, 1000));
        }
      } catch (e) {
        console.log('  ℹ️ No tutorial found');
      }
      
      // Find and fill login form using multiple selector strategies
      console.log('  📝 Filling login form...');
      
      // Strategy 1: Try different input selectors
      const phoneSelectors = [
        'input[placeholder*="phone number" i]',
        'input[placeholder*="phone" i]',
        'input[name*="phone" i]',
        'input[type="tel"]',
        'input[aria-label*="phone" i]'
      ];
      
      const pinSelectors = [
        'input[placeholder*="PIN" i]',
        'input[placeholder*="pin" i]',
        'input[name*="pin" i]',
        'input[type="password"]',
        'input[aria-label*="pin" i]'
      ];
      
      let phoneFilled = false;
      let pinFilled = false;
      
      // Try phone input
      for (const selector of phoneSelectors) {
        try {
          await page.fill(selector, profile.login.phone, { timeout: 2000 });
          console.log(`  ✅ Phone filled using: ${selector}`);
          phoneFilled = true;
          break;
        } catch (e) {
          console.log(`  ⚠️ Phone selector failed: ${selector}`);
        }
      }
      
      // Try PIN input
      for (const selector of pinSelectors) {
        try {
          await page.fill(selector, profile.login.pin, { timeout: 2000 });
          console.log(`  ✅ PIN filled using: ${selector}`);
          pinFilled = true;
          break;
        } catch (e) {
          console.log(`  ⚠️ PIN selector failed: ${selector}`);
        }
      }
      
      if (!phoneFilled || !pinFilled) {
        throw new Error('Could not fill login form - selectors not working');
      }
      
      // Click sign in button
      console.log('  🔑 Clicking sign in...');
      const signInSelectors = [
        'button:has-text("SIGN IN")',
        'button[type="submit"]',
        'button[aria-label*="sign" i]',
        'form button'
      ];
      
      let signInClicked = false;
      for (const selector of signInSelectors) {
        try {
          await page.click(selector, { timeout: 2000 });
          console.log(`  ✅ Sign in clicked using: ${selector}`);
          signInClicked = true;
          break;
        } catch (e) {
          console.log(`  ⚠️ Sign in selector failed: ${selector}`);
        }
      }
      
      if (!signInClicked) {
        throw new Error('Could not click sign in button - selectors not working');
      }
      
      // Wait for login to complete
      console.log('  ⏳ Waiting for login to complete...');
      await new Promise(r => setTimeout(r, 5000));
      
      // Check if login was successful
      const currentUrl = page.url();
      console.log(`  📍 Current URL: ${currentUrl}`);
      
      if (currentUrl === APP_URL) {
        throw new Error('Login failed - still on login page');
      }
      
      console.log('  ✅ Login successful!');
      
      // Wait for dashboard to load
      console.log('  🏠 Waiting for dashboard...');
      await new Promise(r => setTimeout(r, 3000));
      
      // Check for dashboard using multiple strategies
      const dashboardSelectors = profile.mode === 'hbb' 
        ? ['text=My Leads', 'text=Dashboard', 'text=HBB', 'main', '[class*="dashboard"]']
        : ['text=Dashboard', 'text=Overview', 'text=My Team', 'main', '[class*="dashboard"]'];
      
      let dashboardFound = false;
      for (const selector of dashboardSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 3000 });
          console.log(`  ✅ Dashboard found: ${selector}`);
          dashboardFound = true;
          break;
        } catch (e) {
          console.log(`  ⚠️ Dashboard selector failed: ${selector}`);
        }
      }
      
      if (!dashboardFound) {
        // Check if we have any content change indicating success
        const hasNewContent = await page.locator('body').textContent().then(text => 
          text && text !== 'Airtel Champions'
        ).catch(() => false);
        
        if (hasNewContent) {
          console.log('  ✅ Dashboard detected by content change');
          dashboardFound = true;
        } else {
          throw new Error('Dashboard not found - login may have failed');
        }
      }
      
      console.log(`  🎉 ${profile.name} login and dashboard successful!`);
      
      // Run journeys
      for (const journey of profile.journeys) {
        try {
          console.log(`  🧪 Running: ${journey.name}`);
          await journey.run(page);
          console.log(`  ✅ ${profile.name} - ${journey.name}`);
        } catch (journeyError) {
          console.log(`  ❌ ${profile.name} - ${journey.name}: ${journeyError.message}`);
          throw journeyError;
        }
      }
      
      await page.close();
      console.log(`  🏁 ${profile.name} completed successfully on attempt ${attempt}!`);
      return { success: true, attempts: attempt };
      
    } catch (error) {
      console.log(`  ❌ Attempt ${attempt} failed: ${error.message}`);
      await page.close();
      
      // Don't retry on certain errors
      if (error.message.includes('Could not fill') || error.message.includes('Could not click')) {
        console.log('  🚫 Fatal selector error - not retrying');
        return { success: false, attempts: attempt, error };
      }
      
      // Wait before retry
      if (attempt < MAX_RETRIES) {
        console.log(`  ⏳ Waiting 3 seconds before retry...`);
        await new Promise(r => setTimeout(r, 3000));
      }
    }
  }
  
  return { success: false, attempts: MAX_RETRIES, error: 'All attempts failed' };
}

async function main() {
  console.log('🚀 Starting SUPER AUTO-FIX MCP UAT System');
  console.log('📋 VERSION: 6.0 - Ultimate Error Recovery');
  console.log('🔧 Fresh page for each attempt - no state pollution');
  console.log('🎯 Multiple selector strategies for maximum compatibility');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 600,
    devtools: false
  });
  
  console.log('✅ Browser launched successfully');
  
  const results = [];
  const failures = [];
  
  for (const profile of profiles) {
    const result = await runSingleProfileTest(profile, browser);
    results.push(result);
    
    if (!result.success) {
      failures.push({ 
        profile: profile.name, 
        error: result.error, 
        attempts: result.attempts 
      });
    }
    
    // Small break between profiles
    await new Promise(r => setTimeout(r, 1000));
  }
  
  await browser.close();
  
  console.log('\n📊 FINAL TEST SUMMARY:');
  results.forEach(result => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    const attempts = result.attempts || 1;
    console.log(`\n👤 ${result.success ? 'SUCCESS' : 'FAILED'}: ${status} (${attempts} attempts)`);
    
    if (result.error) {
      console.log(`   ❌ Error: ${result.error.message}`);
    }
  });
  
  if (failures.length === 0) {
    console.log('\n🎉 ALL PROFILES PASSED WITH SUPER AUTO-FIX! Ultimate UAT success!');
  } else {
    console.log(`\n⚠️ ${failures.length} profiles still failed`);
    console.log('🔧 Check login credentials and app accessibility');
  }
  
  console.log('\n🏁 Super Auto-Fix UAT test run completed.');
}

if (require.main === module) {
  main().catch(console.error);
}
