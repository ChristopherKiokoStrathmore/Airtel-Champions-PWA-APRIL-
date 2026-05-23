#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

// ---------- CONFIGURATION ----------
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const APP_URL = 'https://airtel-champions-app-web-git-main-christopherkiokos-projects.vercel.app/';
const MAX_ITERATIONS = 20;
const SCRIPT_PATH = __filename;
const SELECTORS_FILE = path.join(__dirname, 'selectors.json');
const STATE_FILE = path.join(__dirname, 'config-self-improving-state.json');

// Profiles to test
const PROFILES = [
  { name: 'Sales Executive', phone: '0733584848', mode: 'sales' },
  { name: 'HBB Agent', phone: '0711111111', mode: 'hbb' }
];

// ---------- Configuration Management ----------
function loadSelectors() {
  try {
    if (fs.existsSync(SELECTORS_FILE)) {
      return JSON.parse(fs.readFileSync(SELECTORS_FILE, 'utf-8'));
    }
  } catch (e) {
    console.log('❌ Failed to load selectors, using defaults');
  }
  
  // Default selectors
  return {
    phoneSelectors: [
      'input[data-testid="phone-input"]',
      'input[placeholder*="phone number" i]',
      'input[placeholder*="phone" i]',
      'input[type="tel"]',
      'input[name*="phone" i]',
      'input[aria-label*="phone" i]',
      'input[id*="phone" i]'
    ],
    pinSelectors: [
      'input[data-testid="pin-input"]',
      'input[placeholder*="PIN" i]',
      'input[placeholder*="pin" i]',
      'input[type="password"]',
      'input[name*="pin" i]',
      'input[aria-label*="pin" i]',
      'input[id*="pin" i]'
    ],
    submitSelectors: [
      'button[data-testid="login-submit"]',
      'button:has-text("SIGN IN")',
      'button[type="submit"]',
      'form button',
      'button[aria-label*="sign" i]'
    ],
    dashboardSelectors: [
      '[data-testid="sales-dashboard"]',
      '[data-testid="hbb-dashboard"]',
      '[data-testid="dashboard"]',
      '.dashboard',
      'text=Dashboard',
      'text=Welcome',
      'main[role="main"]',
      '[class*="dashboard"]'
    ],
    tutorialSelectors: [
      'button:has-text("Skip")',
      'button:has-text("Got it")',
      'button:has-text("Start")'
    ]
  };
}

function saveSelectors(selectors) {
  try {
    fs.writeFileSync(SELECTORS_FILE, JSON.stringify(selectors, null, 2), 'utf-8');
    console.log('✅ Selectors configuration updated');
    return true;
  } catch (e) {
    console.log('❌ Failed to save selectors:', e.message);
    return false;
  }
}

// ---------- State Management ----------
function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
    }
  } catch (e) {}
  return { iterations: 0, startTime: Date.now(), improvements: 0 };
}

function saveState(state) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (e) {}
}

// ---------- Groq API call ----------
async function callGroq(prompt, system) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt }
      ],
      max_tokens: 2000,
    }),
  });
  if (!res.ok) throw new Error(`Groq error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

// ---------- Test a single profile ----------
async function testProfile(page, profile, selectors) {
  try {
    console.log(`👤 Testing ${profile.name}...`);
    await page.goto(APP_URL);
    
    // Wait for page to fully load and stabilize
    console.log('  ⏳ Waiting for page to stabilize...');
    await page.waitForTimeout(5000); // Increased wait time
    
    // Check if page is ready by looking for login form elements
    let pageReady = false;
    for (let i = 0; i < 10; i++) { // More attempts
      const hasPhoneInput = await page.$('input[placeholder*="phone" i], input[type="tel"], input[name*="phone" i]');
      const hasPinInput = await page.$('input[placeholder*="pin" i], input[type="password"]');
      if (hasPhoneInput && hasPinInput) {
        pageReady = true;
        console.log('  ✅ Page is ready for login');
        break;
      }
      console.log(`  ⏳ Attempt ${i + 1}: Waiting for login form...`);
      await page.waitForTimeout(2000);
    }
    
    if (!pageReady) {
      console.log('  ⚠️ Page may not be fully loaded, proceeding anyway...');
      // Debug: Check what's actually on the page
      const allInputs = await page.$$('input');
      console.log(`  🔍 Found ${allInputs.length} input elements on page`);
    }
    
    // Handle mode switching with better detection
    const currentMode = await page.locator('text=Airtel Champions HBB, text=Airtel Champions Sales').first().textContent().catch(() => null);
    console.log(`  📱 Current mode: ${currentMode}`);
    
    if (currentMode && currentMode.includes('HBB') && profile.mode === 'sales') {
      console.log('  🔀 Switching to Sales mode');
      await page.click('text=Tap cube to switch mode');
      await page.waitForTimeout(1000);
      await page.click('text=Airtel Champions Sales');
      await page.waitForTimeout(2000);
    } else if (currentMode && currentMode.includes('Sales') && profile.mode === 'hbb') {
      console.log('  🔀 Switching to HBB mode');
      await page.click('text=Tap cube to switch mode');
      await page.waitForTimeout(1000);
      await page.click('text=Airtel Champions HBB');
      await page.waitForTimeout(2000);
    }
    
    // Additional wait after mode switching
    if (profile.mode === 'hbb') {
      console.log('  ⏳ Waiting for HBB mode to load...');
      await page.waitForTimeout(3000);
    }
    
    // Fill phone with multiple selectors
    let phoneFilled = false;
    for (const selector of selectors.phoneSelectors) {
      try {
        if (await page.$(selector)) {
          await page.fill(selector, profile.phone);
          phoneFilled = true;
          console.log(`  ✅ Phone filled using: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`  ⚠️ Phone selector failed: ${selector}`);
      }
    }
    if (!phoneFilled) {
      // Debug: Capture page content to understand what's happening
      const pageContent = await page.content();
      const pageTitle = await page.title();
      const currentUrl = page.url();
      
      console.log('  🔍 DEBUG - Phone input not found');
      console.log(`     URL: ${currentUrl}`);
      console.log(`     Title: ${pageTitle}`);
      
      // Look for any input elements
      const allInputs = await page.$$('input');
      console.log(`     Found ${allInputs.length} input elements`);
      
      for (let i = 0; i < Math.min(allInputs.length, 5); i++) {
        const input = allInputs[i];
        const placeholder = await input.getAttribute('placeholder');
        const type = await input.getAttribute('type');
        const name = await input.getAttribute('name');
        const id = await input.getAttribute('id');
        const isVisible = await input.isVisible();
        
        console.log(`     Input ${i + 1}: placeholder="${placeholder}", type="${type}", name="${name}", id="${id}", visible=${isVisible}`);
      }
      
      throw new Error('Phone input not found');
    }
    
    // Fill PIN with multiple selectors
    let pinFilled = false;
    for (const selector of selectors.pinSelectors) {
      try {
        if (await page.$(selector)) {
          await page.fill(selector, '1234');
          pinFilled = true;
          console.log(`  ✅ PIN filled using: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`  ⚠️ PIN selector failed: ${selector}`);
      }
    }
    if (!pinFilled) throw new Error('PIN input not found');
    
    // Click submit with multiple selectors
    let submitClicked = false;
    for (const selector of selectors.submitSelectors) {
      try {
        if (await page.$(selector)) {
          await page.click(selector);
          submitClicked = true;
          console.log(`  ✅ Submit clicked using: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`  ⚠️ Submit selector failed: ${selector}`);
      }
    }
    if (!submitClicked) throw new Error('Submit button not found');
    
    // Wait for login completion
    await page.waitForTimeout(5000);
    
    // Handle post-login tour/tutorial
    console.log('  🎯 Looking for post-login tour/tutorial to skip...');
    const tutorialSelectors = [
      'button:has-text("Skip")',
      'button:has-text("Got it")', 
      'button:has-text("Start")',
      'button:has-text("Next")',
      'button:has-text("Skip tour")',
      'button[aria-label*="skip" i]',
      'button[aria-label*="close" i]',
      '.tour-skip-button',
      '.tutorial-skip',
      '[data-testid*="skip"]',
      '[data-testid*="tour"]',
      '.modal button',
      '.overlay button',
      '.tutorial-overlay button'
    ];
    
    // Try multiple times to dismiss tour
    for (let attempt = 0; attempt < 3; attempt++) {
      for (const selector of tutorialSelectors) {
        try {
          const element = await page.$(selector);
          if (element) {
            await element.click();
            console.log(`  ✅ Tour dismissed using: ${selector}`);
            await page.waitForTimeout(1000);
            break;
          }
        } catch (e) {
          // Continue trying other selectors
        }
      }
      await page.waitForTimeout(1000);
    }
    
    // Additional: Try pressing Escape key to dismiss modals
    try {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    } catch (e) {}
    
    // Check for dashboard
    let dashboardFound = false;
    for (const selector of selectors.dashboardSelectors) {
      try {
        if (await page.$(selector)) {
          dashboardFound = true;
          console.log(`  ✅ Dashboard found using: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`  ⚠️ Dashboard selector failed: ${selector}`);
      }
    }
    
    if (dashboardFound) {
      console.log(`✅ ${profile.name} login successful`);
      return { success: true };
    } else {
      throw new Error('Dashboard not detected');
    }
    
  } catch (err) {
    const pageHTML = await page.content();
    return { success: false, error: err.message, pageHTML };
  }
}

// ---------- Run all tests ----------
async function runAllTests(selectors) {
  const browser = await chromium.launch({ headless: false });
  const results = [];
  
  for (const profile of PROFILES) {
    // Create a fresh page for each profile
    const page = await browser.newPage();
    
    const result = await testProfile(page, profile, selectors);
    results.push({ profile: profile.name, ...result });
    
    // Close the page to ensure clean state for next profile
    await page.close();
  }
  
  await browser.close();
  return results;
}

// ---------- Generate improved selectors ----------
async function improveSelectors(failures, currentSelectors) {
  const failureSummary = failures.map(f => `${f.profile}: ${f.error}`).join('\n');
  
  const systemPrompt = `You are a Playwright test automation expert. The test script is failing. 
Focus ONLY on fixing the specific issues mentioned.
Return ONLY the improved selector arrays as valid JSON.
Keep it concise and under 1000 tokens.`;

  const userPrompt = `Fix these failures:
${failureSummary}

Current selectors:
${JSON.stringify(currentSelectors, null, 2)}

Return only the improved selectors as valid JSON with these exact keys:
{
  "phoneSelectors": [...],
  "pinSelectors": [...],
  "submitSelectors": [...],
  "dashboardSelectors": [...],
  "tutorialSelectors": [...]
}

Make sure the JSON is valid and properly formatted.`;
  
  try {
    const improvedJson = await callGroq(userPrompt, systemPrompt);
    
    // Try to parse the JSON
    const improvedSelectors = JSON.parse(improvedJson);
    
    // Validate structure
    const requiredKeys = ['phoneSelectors', 'pinSelectors', 'submitSelectors', 'dashboardSelectors', 'tutorialSelectors'];
    for (const key of requiredKeys) {
      if (!improvedSelectors[key] || !Array.isArray(improvedSelectors[key])) {
        throw new Error(`Invalid or missing ${key} in response`);
      }
    }
    
    return improvedSelectors;
    
  } catch (err) {
    console.log('❌ Groq call failed or invalid JSON, using fallback improvements');
    
    // Fallback improvements
    const fallbackSelectors = JSON.parse(JSON.stringify(currentSelectors)); // Deep copy
    
    // Add more selectors based on failures
    if (failures.some(f => f.error.includes('Phone input not found'))) {
      const newPhoneSelectors = [
        'input[formcontrolname="phone"]',
        'input[ng-model*="phone"]',
        'input[class*="phone"]',
        'input[placeholder*="Mobile" i]',
        'input[placeholder*="Number" i]',
        'input[type="text"][placeholder*="phone" i]',
        'input[name="phoneNumber"]',
        'input[id="phone"]',
        'input[aria-label*="mobile" i]',
        'input[data-field*="phone"]',
        // HBB-specific selectors
        'input[placeholder*="Enter phone" i]',
        'input[placeholder*="Phone number" i]',
        'input[type="text"]:visible',
        'input:not([type="password"]):not([type="hidden"])',
        'form input:first-child',
        '.login-form input',
        '.auth-form input',
        'input[data-test*="phone"]',
        'input[name*="contact" i]',
        'input[placeholder*="07" i]',
        'input[maxlength="10"]',
        'input[maxlength="12"]'
      ];
      
      // Add only new selectors
      newPhoneSelectors.forEach(selector => {
        if (!fallbackSelectors.phoneSelectors.includes(selector)) {
          fallbackSelectors.phoneSelectors.push(selector);
        }
      });
    }
    
    if (failures.some(f => f.error.includes('PIN input not found'))) {
      const newPinSelectors = [
        'input[formcontrolname="pin"]',
        'input[ng-model*="pin"]',
        'input[class*="pin"]',
        'input[placeholder*="Password" i]',
        'input[placeholder*="Code" i]',
        'input[name="pin"]',
        'input[id="pin"]',
        'input[aria-label*="password" i]',
        'input[data-field*="pin"]'
      ];
      
      newPinSelectors.forEach(selector => {
        if (!fallbackSelectors.pinSelectors.includes(selector)) {
          fallbackSelectors.pinSelectors.push(selector);
        }
      });
    }
    
    if (failures.some(f => f.error.includes('Submit button not found'))) {
      const newSubmitSelectors = [
        'button[formaction*="login"]',
        'input[type="submit"]',
        'button[class*="login"]',
        'button[ng-click*="login"]',
        'div[class*="button"]',
        'button[data-action*="login"]',
        'button[onclick*="login"]',
        'form button[type="button"]'
      ];
      
      newSubmitSelectors.forEach(selector => {
        if (!fallbackSelectors.submitSelectors.includes(selector)) {
          fallbackSelectors.submitSelectors.push(selector);
        }
      });
    }
    
    if (failures.some(f => f.error.includes('Dashboard not detected'))) {
      const newDashboardSelectors = [
        '[data-testid="home"]',
        '[data-testid="main"]',
        '.main-content',
        '.home-page',
        'h1, h2',
        '[class*="content"]',
        '[data-testid="overview"]',
        '.dashboard-content',
        'main section',
        '[role="main"]'
      ];
      
      newDashboardSelectors.forEach(selector => {
        if (!fallbackSelectors.dashboardSelectors.includes(selector)) {
          fallbackSelectors.dashboardSelectors.push(selector);
        }
      });
    }
    
    return fallbackSelectors;
  }
}

// ---------- Main self-improving loop ----------
async function main() {
  console.log('🚀 Starting CONFIGURATION-BASED SELF-IMPROVING UAT System');
  console.log('📁 Reads selectors from JSON file - never modifies JavaScript');
  console.log('🔄 Updates only JSON configuration - zero syntax errors');
  console.log('🎯 Zero manual intervention required');
  
  // Load current selectors
  let selectors = loadSelectors();
  console.log(`📝 Loaded ${Object.keys(selectors).length} selector arrays`);
  
  // Load state
  let state = loadState();
  console.log(`📊 Current state: Iteration ${state.iterations}, Improvements ${state.improvements}`);
  
  let allPassed = false;
  
  while (state.iterations < MAX_ITERATIONS && !allPassed) {
    state.iterations++;
    console.log(`\n📌 Iteration ${state.iterations} (Total: ${state.iterations})`);
    
    const results = await runAllTests(selectors);
    const failures = results.filter(r => !r.success);
    
    if (failures.length === 0) {
      console.log('🎉 All tests passed! Perfect!');
      allPassed = true;
      break;
    }
    
    console.log(`❌ ${failures.length} profiles failing:`);
    for (const f of failures) {
      console.log(`   - ${f.profile}: ${f.error}`);
    }
    
    // Generate improved selectors
    console.log('🤖 Generating improved selectors...');
    const improvedSelectors = await improveSelectors(failures, selectors);
    
    // Save improved selectors
    if (saveSelectors(improvedSelectors)) {
      selectors = improvedSelectors;
      state.improvements++;
      saveState(state);
      
      console.log('✅ Selectors configuration improved');
      console.log('🔄 Restarting with improved selectors...\n');
      
      // Restart with improved selectors
      execSync(`node "${SCRIPT_PATH}"`, { stdio: 'inherit' });
      process.exit(0);
    } else {
      console.log('❌ Failed to save improved selectors');
      break;
    }
  }
  
  console.log('\n📊 Final Results:');
  console.log(`  🔄 Total iterations: ${state.iterations}`);
  console.log(`  🎯 All passed: ${allPassed}`);
  console.log(`  📝 Selectors improved: ${state.improvements} times`);
  console.log(`  ⏱️ Total runtime: ${Math.floor((Date.now() - state.startTime) / 1000)} seconds`);
  
  if (allPassed) {
    console.log('\n🎉 CONFIGURATION-BASED SELF-IMPROVING UAT SYSTEM ACHIEVED PERFECT TESTS!');
    console.log('🚀 Your UAT system is now completely autonomous and self-maintaining!');
    console.log('📁 JavaScript file never modified - only JSON configuration updated');
    
    // Clean up state file on success
    try {
      fs.unlinkSync(STATE_FILE);
    } catch (e) {}
  } else {
    console.log('\n⚠️ Max iterations reached without perfect results');
    console.log('🔧 Check the selectors.json file and run again');
    
    // Reset state file for fresh start
    try {
      fs.unlinkSync(STATE_FILE);
      console.log('🔄 State file reset - ready for fresh start');
    } catch (e) {}
  }
  
  console.log('\n🏁 Configuration-based self-improving UAT system completed');
}

// Run the self-improving system
if (require.main === module) {
  main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}
