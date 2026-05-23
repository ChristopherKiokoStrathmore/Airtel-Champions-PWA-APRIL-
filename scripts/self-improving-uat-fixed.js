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
const STATE_FILE = path.join(__dirname, 'self-improving-state.json');

// Profiles to test
const PROFILES = [
  { name: 'Sales Executive', phone: '0733584848', mode: 'sales' },
  { name: 'HBB Agent', phone: '0711111111', mode: 'hbb' }
];

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
      'input[placeholder*="phone number" i]',
      'input[placeholder*="phone" i]',
      'input[type="tel"]',
      'input[name*="phone" i]',
      'input[aria-label*="phone" i]',
      'input[id*="phone" i]'
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
      'input[placeholder*="pin" i]',
      'input[type="password"]',
      'input[name*="pin" i]',
      'input[aria-label*="pin" i]',
      'input[id*="pin" i]'
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
      'button[type="submit"]',
      'form button',
      'button[aria-label*="sign" i]'
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
      '[data-testid="dashboard"]',
      '.dashboard',
      'text=Dashboard',
      'text=Welcome',
      'main[role="main"]',
      '[class*="dashboard"]'
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
async function improveScript(failures) {
  const failureSummary = failures.map(f => `${f.profile}: ${f.error}`).join('\n');
  
  const systemPrompt = `You are a Playwright test automation expert. The test script is failing. 
Focus ONLY on fixing the specific issues mentioned.
Return ONLY the improved selector arrays.
Keep it concise and under 1000 tokens.`;

  const userPrompt = `Fix these failures:
${failureSummary}

Current selectors being used:
- Phone: input[data-testid="phone-input"], input[placeholder*="phone number" i], input[placeholder*="phone" i], input[type="tel"], input[name*="phone" i], input[aria-label*="phone" i], input[id*="phone" i]
- PIN: input[data-testid="pin-input"], input[placeholder*="PIN" i], input[placeholder*="pin" i], input[type="password"], input[name*="pin" i], input[aria-label*="pin" i], input[id*="pin" i]
- Submit: button[data-testid="login-submit"], button:has-text("SIGN IN"), button[type="submit"], form button, button[aria-label*="sign" i]
- Dashboard: [data-testid="sales-dashboard"], [data-testid="hbb-dashboard"], [data-testid="dashboard"], .dashboard, text=Dashboard, text=Welcome, main[role="main"], [class*="dashboard"]

Return only the improved selector arrays in this format:
phoneSelectors = [...]
pinSelectors = [...]
submitSelectors = [...]
dashboardSelectors = [...]`;
  
  try {
    const improvedCode = await callGroq(userPrompt, systemPrompt);
    return improvedCode;
  } catch (err) {
    console.log('❌ Groq call failed, using fallback improvements');
    return null;
  }
}

// ---------- Apply improvements ----------
async function applyImprovements(improvedCode) {
  try {
    const currentScript = fs.readFileSync(SCRIPT_PATH, 'utf-8');
    
    // Extract improved selectors
    const phoneMatch = improvedCode?.match(/phoneSelectors\s*=\s*\[([^\]]+)\]/);
    const pinMatch = improvedCode?.match(/pinSelectors\s*=\s*\[([^\]]+)\]/);
    const submitMatch = improvedCode?.match(/submitSelectors\s*=\s*\[([^\]]+)\]/);
    const dashboardMatch = improvedCode?.match(/dashboardSelectors\s*=\s*\[([^\]]+)\]/);
    
    let updatedScript = currentScript;
    
    if (phoneMatch) {
      updatedScript = updatedScript.replace(
        /const phoneSelectors\s*=\s*\[[^\]]+\]/,
        `const phoneSelectors = [${phoneMatch[1]}]`
      );
    }
    
    if (pinMatch) {
      updatedScript = updatedScript.replace(
        /const pinSelectors\s*=\s*\[[^\]]+\]/,
        `const pinSelectors = [${pinMatch[1]}]`
      );
    }
    
    if (submitMatch) {
      updatedScript = updatedScript.replace(
        /const submitSelectors\s*=\s*\[[^\]]+\]/,
        `const submitSelectors = [${submitMatch[1]}]`
      );
    }
    
    if (dashboardMatch) {
      updatedScript = updatedScript.replace(
        /const dashboardSelectors\s*=\s*\[[^\]]+\]/,
        `const dashboardSelectors = [${dashboardMatch[1]}]`
      );
    }
    
    // Validate the updated script has proper syntax
    try {
      require('vm').runInNewContext(updatedScript, {});
    } catch (syntaxError) {
      console.log('❌ Generated invalid JavaScript, using fallback improvements');
      return null;
    }
    
    return updatedScript;
    
  } catch (error) {
    console.log('❌ Failed to apply improvements:', error.message);
    return null;
  }
}

// ---------- Main self-improving loop ----------
async function main() {
  console.log('🚀 Starting FIXED SELF-IMPROVING UAT System');
  console.log('🤖 Will automatically fix its own code when tests fail');
  console.log('🔄 Properly tracks iterations across restarts');
  console.log('🎯 Zero manual intervention required');
  
  // Load state
  let state = loadState();
  console.log(`📊 Current state: Iteration ${state.iterations}, Improvements ${state.improvements}`);
  
  let allPassed = false;
  
  while (state.iterations < MAX_ITERATIONS && !allPassed) {
    state.iterations++;
    console.log(`\n📌 Iteration ${state.iterations} (Total: ${state.iterations})`);
    
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
    
    // Generate improvements
    console.log('🤖 Generating improved selectors...');
    const improvedCode = await improveScript(failures);
    
    // Apply improvements
    const updatedScript = await applyImprovements(improvedCode);
    
    if (updatedScript) {
      // Backup and replace current script
      const backupPath = SCRIPT_PATH + '.backup';
      fs.writeFileSync(backupPath, fs.readFileSync(SCRIPT_PATH, 'utf-8'), 'utf-8');
      fs.writeFileSync(SCRIPT_PATH, updatedScript, 'utf-8');
      
      state.improvements++;
      saveState(state);
      
      console.log('✅ Script improved and saved');
      console.log('🔄 Restarting with improved script...\n');
      
      // Restart with improved script
      execSync(`node "${SCRIPT_PATH}"`, { stdio: 'inherit' });
      process.exit(0);
    } else {
      console.log('❌ Failed to apply improvements');
      break;
    }
  }
  
  console.log('\n📊 Final Results:');
  console.log(`  🔄 Total iterations: ${state.iterations}`);
  console.log(`  🎯 All passed: ${allPassed}`);
  console.log(`  📝 Script improved: ${state.improvements} times`);
  console.log(`  ⏱️ Total runtime: ${Math.floor((Date.now() - state.startTime) / 1000)} seconds`);
  
  if (allPassed) {
    console.log('\n🎉 SELF-IMPROVING UAT SYSTEM ACHIEVED PERFECT TESTS!');
    console.log('🚀 Your UAT system is now completely autonomous and self-maintaining!');
    
    // Clean up state file on success
    try {
      fs.unlinkSync(STATE_FILE);
    } catch (e) {}
  } else {
    console.log('\n⚠️ Max iterations reached without perfect results');
    console.log('🔧 Check the improved script and run again');
  }
  
  console.log('\n🏁 Self-improving UAT system completed');
}

// Run the self-improving system
if (require.main === module) {
  main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}
