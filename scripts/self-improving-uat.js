#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

// ---------- CONFIGURATION ----------
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const APP_URL = 'https://airtel-champions-app-web-git-main-christopherkiokos-projects.vercel.app/';
const MAX_ITERATIONS = 10;
const SCRIPT_PATH = __filename;

// Profiles to test
const PROFILES = [
  { name: 'Sales Executive', phone: '0733584848', mode: 'sales' },
  { name: 'HBB Agent', phone: '0711111111', mode: 'hbb' }
];

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
      max_tokens: 4000,
    }),
  });
  if (!res.ok) throw new Error(`Groq error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

// ---------- Test a single profile ----------
async function testProfile(page, profile) {
  try {
    console.log(`👤 Testing ${profile.name}...`);
    await page.goto(APP_URL);
    await page.waitForTimeout(2000);
    
    // Handle mode switching
    const currentMode = await page.locator('text=Airtel Champions HBB, text=Airtel Champions Sales').first().textContent().catch(() => null);
    if (currentMode && currentMode.includes('HBB') && profile.mode === 'sales') {
      await page.click('text=Tap cube to switch mode');
      await page.waitForTimeout(1000);
      await page.click('text=Airtel Champions Sales');
      await page.waitForTimeout(2000);
    }
    
    // Skip tutorial
    const tutorialSelectors = ['button:has-text("Skip")', 'button:has-text("Got it")', 'button:has-text("Start")'];
    for (const selector of tutorialSelectors) {
      try {
        if (await page.$(selector)) {
          await page.click(selector);
          await page.waitForTimeout(1000);
          break;
        }
      } catch (e) {}
    }
    
    // Fill phone with multiple selectors
    const phoneSelectors = [
      'input[data-testid="phone-input"]',
      'input[placeholder*="phone" i]',
      'input[type="tel"]',
      'input[name*="phone" i]'
    ];
    let phoneFilled = false;
    for (const selector of phoneSelectors) {
      if (await page.$(selector)) {
        await page.fill(selector, profile.phone);
        phoneFilled = true;
        break;
      }
    }
    if (!phoneFilled) throw new Error('Phone input not found');
    
    // Fill PIN with multiple selectors
    const pinSelectors = [
      'input[data-testid="pin-input"]',
      'input[placeholder*="PIN" i]',
      'input[type="password"]',
      'input[name*="pin" i]'
    ];
    let pinFilled = false;
    for (const selector of pinSelectors) {
      if (await page.$(selector)) {
        await page.fill(selector, '1234');
        pinFilled = true;
        break;
      }
    }
    if (!pinFilled) throw new Error('PIN input not found');
    
    // Click submit with multiple selectors
    const submitSelectors = [
      'button[data-testid="login-submit"]',
      'button:has-text("SIGN IN")',
      'button[type="submit"]'
    ];
    let submitClicked = false;
    for (const selector of submitSelectors) {
      if (await page.$(selector)) {
        await page.click(selector);
        submitClicked = true;
        break;
      }
    }
    if (!submitClicked) throw new Error('Submit button not found');
    
    // Wait for login completion
    await page.waitForTimeout(5000);
    
    // Check for dashboard
    const dashboardSelectors = [
      '[data-testid="sales-dashboard"]',
      '[data-testid="hbb-dashboard"]',
      '.dashboard',
      'text=Welcome',
      'text=Dashboard'
    ];
    let dashboardFound = false;
    for (const selector of dashboardSelectors) {
      if (await page.$(selector)) {
        dashboardFound = true;
        break;
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
async function runAllTests() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  const results = [];
  
  for (const profile of PROFILES) {
    const result = await testProfile(page, profile);
    results.push({ profile: profile.name, ...result });
  }
  
  await browser.close();
  return results;
}

// ---------- Generate improved script ----------
async function improveScript(failures, currentScript) {
  const systemPrompt = `You are an expert in Playwright test automation. The current test script is failing. Analyze these failures and the current script, then output a COMPLETE, self-contained JavaScript file that fixes all issues.

FAILURES:
${JSON.stringify(failures, null, 2)}

CURRENT SCRIPT:
${currentScript}

REQUIREMENTS:
- Fix all selector issues
- Add proper error handling
- Ensure all functions are defined
- Make script self-contained
- Use robust selectors with fallbacks
- Add proper page object handling
- Include mode switching logic
- Add tutorial skipping
- Add dashboard detection

Output ONLY the complete JavaScript code, no explanations.`;

  const userPrompt = `Fix the failing test script. Current failures: ${failures.length} profiles failing.`;
  
  const improvedCode = await callGroq(userPrompt, systemPrompt);
  
  // Extract code from response
  const codeMatch = improvedCode.match(/```(?:javascript|js)?\n([\s\S]*?)\n```/);
  return codeMatch ? codeMatch[1] : improvedCode;
}

// ---------- Main self-improving loop ----------
async function main() {
  console.log('🚀 Starting SELF-IMPROVING UAT System');
  console.log('🤖 Will automatically fix its own code when tests fail');
  console.log('🔄 Runs until all profiles pass or max iterations reached');
  console.log('🎯 Zero manual intervention required');
  
  let iteration = 0;
  let allPassed = false;
  
  while (iteration < MAX_ITERATIONS && !allPassed) {
    iteration++;
    console.log(`\n📌 Iteration ${iteration}`);
    
    const results = await runAllTests();
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
    
    // Read current script
    const currentScript = fs.readFileSync(SCRIPT_PATH, 'utf-8');
    
    // Generate improved version
    console.log('🤖 Generating improved script...');
    let improvedScript;
    try {
      improvedScript = await improveScript(failures, currentScript);
    } catch (err) {
      console.error('❌ Failed to improve script:', err.message);
      break;
    }
    
    // Validate improved script
    if (!improvedScript || improvedScript.length < 100) {
      console.error('❌ Improved script is invalid - aborting');
      break;
    }
    
    // Backup and replace current script
    const backupPath = SCRIPT_PATH + '.backup';
    fs.writeFileSync(backupPath, currentScript, 'utf-8');
    fs.writeFileSync(SCRIPT_PATH, improvedScript, 'utf-8');
    console.log('✅ Script improved and saved');
    
    // Restart with improved script
    console.log('🔄 Restarting with improved script...\n');
    execSync(`node "${SCRIPT_PATH}"`, { stdio: 'inherit' });
    process.exit(0);
  }
  
  console.log('\n📊 Final Results:');
  console.log(`  🔄 Total iterations: ${iteration}`);
  console.log(`  🎯 All passed: ${allPassed}`);
  console.log(`  📝 Script improved: ${!allPassed ? 'Yes' : 'No'}`);
  
  if (allPassed) {
    console.log('\n🎉 SELF-IMPROVING UAT SYSTEM ACHIEVED PERFECT TESTS!');
    console.log('🚀 Your UAT system is now completely autonomous and self-maintaining!');
  } else {
    console.log('\n⚠️ Max iterations reached without perfect results');
    console.log('🔧 Check the improved script and run again');
  }
}

// Run the self-improving system
if (require.main === module) {
  main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}
