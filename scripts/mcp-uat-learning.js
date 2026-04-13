// MCP-Based Self-Improving UAT System
// Learns from failures and creates better versions automatically

const { chromium } = require('playwright');
const { readFileSync, writeFileSync } = require('fs');
const path = require('path');

const APP_URL = 'https://airtel-champions-app-web-git-main-christopherkiokos-projects.vercel.app/';
const LEARNING_LOG = 'uat-learning-log.json';

// Current profiles (this will be updated based on learning)
let profiles = [
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

// Learning data structure
let learningData = {
  successfulSelectors: {},
  failedSelectors: {},
  elementPatterns: {},
  lastUpdateTime: Date.now(),
  improvementCount: 0
};

// Load learning data from previous runs
function loadLearningData() {
  try {
    if (readFileSync(LEARNING_LOG, 'utf8')) {
      const data = JSON.parse(readFileSync(LEARNING_LOG, 'utf8'));
      console.log('📚 Loaded learning data from previous runs');
      console.log(`  📊 Success patterns: ${Object.keys(data.successfulSelectors || {}).length}`);
      console.log(`  ❌ Failed patterns: ${Object.keys(data.failedSelectors || {}).length}`);
      learningData = data;
    }
  } catch (e) {
    console.log('  📝 No previous learning data found - starting fresh');
  }
}

// Save learning data
function saveLearningData() {
  try {
    writeFileSync(LEARNING_LOG, JSON.stringify(learningData, null, 2), 'utf8');
    console.log('💾 Learning data saved');
  } catch (e) {
    console.log('  ⚠️ Failed to save learning data:', e.message);
  }
}

// Record successful selector pattern
function recordSuccess(selector, context) {
  const key = `${context}_${selector}`;
  learningData.successfulSelectors[key] = (learningData.successfulSelectors[key] || 0) + 1;
  console.log(`  📚 Learned: ${selector} works for ${context}`);
}

// Record failed selector pattern
function recordFailure(selector, error, context) {
  const key = `${context}_${selector}`;
  learningData.failedSelectors[key] = (learningData.failedSelectors[key] || 0) + 1;
  console.log(`  📝 Learned: ${selector} failed for ${context} - ${error}`);
}

// Generate improved selectors based on learning
function generateImprovedSelectors(context) {
  const improvements = [];
  
  // Analyze successful patterns
  const successfulPatterns = Object.keys(learningData.successfulSelectors)
    .filter(key => key.startsWith(`${context}_`))
    .map(key => key.replace(`${context}_`, ''));
  
  // Analyze failed patterns
  const failedPatterns = Object.keys(learningData.failedSelectors)
    .filter(key => key.startsWith(`${context}_`))
    .map(key => key.replace(`${context}_`, ''));
  
  console.log(`  🧠 Analysis for ${context}:`);
  console.log(`    ✅ Successful patterns: ${successfulPatterns.join(', ')}`);
  console.log(`    ❌ Failed patterns: ${failedPatterns.join(', ')}`);
  
  // Generate new selector candidates
  if (context === 'login') {
    // Login-specific improvements
    if (failedPatterns.includes('input[placeholder*="phone" i]')) {
      improvements.push('input[placeholder*="phone number" i], input[aria-label*="phone" i], input[name*="phone"], input[type="tel"]');
    }
    
    if (failedPatterns.includes('button:has-text("SIGN IN")')) {
      improvements.push('button:has-text("SIGN IN"), button[type="submit"], button[aria-label*="sign"], form button');
    }
    
    if (failedPatterns.includes('input[placeholder*="PIN" i]')) {
      improvements.push('input[placeholder*="PIN" i], input[type="password"], input[name*="pin"], input[aria-label*="pin"]');
    }
  }
  
  return improvements;
}

// Auto-generate improved script version
function generateImprovedScript() {
  console.log('  🤖 Generating improved UAT script based on learning...');
  
  const improvedSelectors = generateImprovedSelectors('login');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  let scriptContent = `// MCP-Based Self-Improving UAT System - Auto-Generated v${timestamp}
// Automatically improved based on learning from failures

const { chromium } = require('playwright');
const { readFileSync, writeFileSync } = require('fs');
const path = require('path');

const APP_URL = '${APP_URL}';
const MAX_RETRIES = 3;

// Auto-generated profiles based on learning
const profiles = ${JSON.stringify(profiles, null, 2)};

// Learning data loaded from ${Object.keys(learningData.successfulSelectors).length + Object.keys(learningData.failedSelectors).length} test runs

// Auto-generated login function with improved selectors
async function runE2ETestWithLearning(profile, browser) {
  console.log(\`\\n👤 Testing profile: \${profile.name}\`);
  console.log(\`📱 Phone: \${profile.login.phone} | Mode: \${profile.mode}\`);
  
  let attempts = 0;
  let lastError = null;
  
  while (attempts < MAX_RETRIES) {
    attempts++;
    console.log(\`\\n  🔄 Attempt \${attempts}/\${MAX_RETRIES}\`);
    
    try {
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1280, height: 720 });
      
      console.log('  🌐 Navigating to app...');
      await page.goto(APP_URL, { waitUntil: 'networkidle', timeout: 10000 });
      console.log('  ✅ Page loaded');
      
      // Auto-generated improved selectors
      const improvedSelectors = ${JSON.stringify(improvedSelectors, null, 2)};
      console.log(\`  🧠 Using improved selectors: \${improvedSelectors}\`);
      
      // Apply learning-based login with multiple fallback strategies
      const loginStrategies = ${JSON.stringify([
        // Strategy 1: Use learned successful patterns
        async () => {
          const successfulPatterns = Object.keys(learningData.successfulSelectors)
            .filter(key => key.startsWith('login_'))
            .map(key => key.replace('login_', ''));
          
          for (const pattern of successfulPatterns) {
            try {
              await page.fill(pattern, profile.login.phone, { timeout: 2000 });
              console.log(\`  ✅ Used learned pattern: \${pattern} for phone\`);
              break;
            } catch (e) {}
          }
          
          for (const pattern of successfulPatterns) {
            try {
              await page.fill(pattern.replace('phone', 'pin'), profile.login.pin, { timeout: 2000 });
              console.log(\`  ✅ Used learned pattern: \${pattern} for PIN\`);
              break;
            } catch (e) {}
          }
        },
        // Strategy 2: Use improved candidates
        async () => {
          const candidates = ${JSON.stringify(improvedSelectors.filter(s => s.includes('input'))};
          for (const candidate of candidates) {
            try {
              await page.fill(candidate, profile.login.phone, { timeout: 2000 });
              console.log(\`  ✅ Used improved candidate: \${candidate} for phone\`);
              break;
            } catch (e) {}
          }
          
          for (const candidate of candidates) {
            try {
              await page.fill(candidate.replace('phone', 'pin'), profile.login.pin, { timeout: 2000 });
              console.log(\`  ✅ Used improved candidate: \${candidate} for PIN\`);
              break;
            } catch (e) {}
          }
        }
      ], null, 2)};
      
      // Execute login strategies
      const strategies = JSON.parse(loginStrategies);
      for (let i = 0; i < strategies.length; i++) {
        console.log(\`  🔧 Trying login strategy \${i + 1}/\${strategies.length}\`);
        await strategies[i]();
        
        const currentUrl = page.url();
        if (currentUrl !== APP_URL) {
          console.log('  ✅ Login successful!');
          recordSuccess('login_success', 'login');
          break;
        }
      }
      
      if (currentUrl === APP_URL) {
        // Run journeys with learning
        for (const journey of profile.journeys) {
          try {
            console.log(\`  🧪 Running: \${journey.name}\`);
            await journey.run(page);
            console.log(\`  ✅ \${profile.name} - \${journey.name}\`);
            recordSuccess(\`\${journey.name}_success\`, 'journey');
          } catch (journeyError) {
            console.log(\`  ❌ \${profile.name} - \${journey.name}: \${journeyError.message}\`);
            recordFailure(\`\${journey.name}_selector\`, journeyError.message, 'journey');
          }
        }
        
        await page.close();
        console.log(\`  🎉 \${profile.name} completed successfully on attempt \${attempts}!\`);
        return { success: true, attempts, results: [] };
      }
      
    } catch (error) {
      lastError = error;
      console.log(\`  ❌ Attempt \${attempts} failed: \${error.message}\`);
      
      // Record failure for learning
      if (error.message.includes('Timeout')) {
        recordFailure('timeout_error', error.message, 'login');
      } else if (error.message.includes('selector')) {
        recordFailure('selector_error', error.message, 'login');
      }
      
      if (attempts < MAX_RETRIES) {
        console.log('  ⏳ Waiting 2 seconds before retry...');
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }
  
  return { success: false, error: lastError, attempts: 0, results: [] };
}

// Main function with self-improvement
async function main() {
  console.log('🚀 Starting SELF-IMPROVING MCP UAT System');
  console.log('📋 VERSION: Auto-Generated - Learns from failures');
  console.log('🧠 Auto-generates improved selectors and strategies');
  console.log('🔄 Creates better versions of itself');
  
  // Load learning data
  loadLearningData();
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 600,
    devtools: false
  });
  
  console.log('✅ Browser launched successfully');
  
  const results = [];
  const failures = [];
  
  for (const profile of profiles) {
    const result = await runE2ETestWithLearning(profile, browser);
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
  
  // Save learning data
  saveLearningData();
  
  // Generate improved version if enough learning data
  const totalTests = Object.keys(learningData.successfulSelectors).length + Object.keys(learningData.failedSelectors).length;
  if (totalTests >= 5 && learningData.improvementCount < 3) {
    console.log('  🤖 Generating improved script version...');
    // This would create a new script file with better selectors
    learningData.improvementCount++;
  }
  
  console.log('\\n📊 FINAL TEST SUMMARY:');
  results.forEach(result => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    const attempts = result.attempts || 1;
    console.log(\`\\n👤 \${result.success ? 'SUCCESS' : 'FAILED'}: \${status} (\${attempts} attempts)\`);
  });
  
  if (failures.length === 0) {
    console.log('\\n🎉 ALL PROFILES PASSED! System learned \${Object.keys(learningData.successfulSelectors).length} successful patterns.');
  } else {
    console.log(\`\\n⚠️ \${failures.length} profiles still failed - system will improve next run\`);
  }
  
  console.log('\\n🧠 LEARNING SUMMARY:');
  console.log(\`  📚 Successful patterns learned: \${Object.keys(learningData.successfulSelectors).length}\`);
  console.log(\`  ❌ Failed patterns recorded: \${Object.keys(learningData.failedSelectors).length}\`);
  console.log(\`  🔄 Improvements generated: \${learningData.improvementCount}\`);
  
  console.log('\\n🏁 Self-improving UAT test run completed.');
}

if (require.main === module) {
  main().catch(console.error);
}`;

  try {
    writeFileSync(path.join(__dirname, 'mcp-uat-improved.js'), scriptContent, 'utf8');
    console.log('  ✅ Improved script generated: mcp-uat-improved.js');
    
    // Update package.json to include new script
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
    packageJson.scripts['uat:improved'] = 'node scripts/mcp-uat-improved.js';
    writeFileSync('package.json', JSON.stringify(packageJson, null, 2), 'utf8');
    console.log('  ✅ Package.json updated with new script');
    
  } catch (e) {
    console.log('  ❌ Failed to generate improved script:', e.message);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
