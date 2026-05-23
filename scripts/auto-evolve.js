#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const APP_URL = process.env.APP_URL || 'https://airtel-champions-app-web-git-main-christopherkiokos-projects.vercel.app/';
const MAX_DURATION_MS = 6 * 60 * 60 * 1000;
const INTERVAL_MS = 4 * 60 * 1000;

const ALLOWED_PATHS = ['src/components/hbb/', 'src/pages/hbb/', 'src/hooks/', 'src/utils/', 'src/App.tsx', 'src/main.tsx'];
const FORBIDDEN_PATTERNS = [/\bDROP\b/i, /\bDELETE\b/i, /\bTRUNCATE\b/i];

async function callGroq(prompt, system) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }],
      max_tokens: 4000,
    }),
  });
  const data = await res.json();
  return data.choices[0].message.content;
}

async function runE2ETests() {
  console.log('🧪 Running UAT tests via Chrome DevTools (Playwright)...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const failures = [];

  const profiles = [
    {
      name: 'Sales Executive',
      login: { phone: '0733584848', pin: '1234', roleSelector: '[data-testid="mode-selector"]', mode: 'sales' },
      journeys: [
        { name: 'Dashboard loads', run: async (page) => {
          await page.waitForSelector('[data-testid="sales-dashboard"]', { timeout: 10000 });
        }},
        { name: 'View team tab', run: async (page) => {
          await page.click('[data-testid="sales-team-btn"]');
          await page.waitForSelector('text=My Team');
        }},
        { name: 'View leaderboard', run: async (page) => {
          await page.click('[data-testid="sales-leaderboard-btn"]');
          await page.waitForSelector('text=Leaderboard');
        }},
        { name: 'View submissions', run: async (page) => {
          await page.click('[data-testid="sales-submissions-btn"]');
          await page.waitForSelector('text=Submissions');
        }}
      ]
    },
    {
      name: 'Zonal Sales Manager',
      login: { phone: '0788549867', pin: '1234', roleSelector: '[data-testid="mode-selector"]', mode: 'sales' },
      journeys: [
        { name: 'Dashboard loads', run: async (page) => {
          await page.waitForSelector('[data-testid="sales-dashboard"]', { timeout: 10000 });
        }},
        { name: 'View team performance', run: async (page) => {
          await page.click('[data-testid="sales-team-btn"]');
          await page.waitForSelector('text=My Team');
        }},
        { name: 'Access analytics', run: async (page) => {
          await page.click('[data-testid="sales-analytics-btn"]');
          await page.waitForSelector('text=Analytics');
        }}
      ]
    },
    {
      name: 'Zonal Business Manager',
      login: { phone: '0739174525', pin: '1234', roleSelector: '[data-testid="mode-selector"]', mode: 'sales' },
      journeys: [
        { name: 'Dashboard loads', run: async (page) => {
          await page.waitForSelector('[data-testid="sales-dashboard"]', { timeout: 10000 });
        }},
        { name: 'View zone performance', run: async (page) => {
          await page.click('[data-testid="sales-team-btn"]');
          await page.waitForSelector('text=My Team');
        }},
        { name: 'Check programs', run: async (page) => {
          await page.click('[data-testid="sales-programs-btn"]');
          await page.waitForSelector('text=Programs');
        }}
      ]
    },
    {
      name: 'HQ Profile',
      login: { phone: '0738084947', pin: '1234', roleSelector: '[data-testid="mode-selector"]', mode: 'sales' },
      journeys: [
        { name: 'Dashboard loads', run: async (page) => {
          await page.waitForSelector('[data-testid="sales-dashboard"]', { timeout: 10000 });
        }},
        { name: 'View command center', run: async (page) => {
          await page.click('[data-testid="sales-home-btn"]');
          await page.waitForSelector('text=Overview');
        }},
        { name: 'Access user management', run: async (page) => {
          await page.click('[data-testid="sales-users-btn"]');
          await page.waitForSelector('text=Users');
        }}
      ]
    },
    {
      name: 'HBB Agent',
      login: { phone: '0711111111', pin: '1234', roleSelector: '[data-testid="mode-selector"]', mode: 'hbb' },
      journeys: [
        { name: 'Dashboard loads', run: async (page) => {
          await page.waitForSelector('[data-testid="hbb-agent-dashboard"]', { timeout: 10000 });
        }},
        { name: 'Create lead', run: async (page) => {
          await page.click('[data-testid="new-lead-btn"]');
          await page.fill('[data-testid="customer-name"]', 'Auto Test Lead');
          await page.fill('[data-testid="customer-phone"]', '0712345678');
          await page.click('[data-testid="submit-lead"]');
          await page.waitForSelector('text=Lead created successfully');
        }},
        { name: 'View my leads', run: async (page) => {
          await page.click('[data-testid="my-leads-tab"]');
          await page.waitForSelector('text=My Leads');
        }},
        { name: 'Check activity log', run: async (page) => {
          await page.click('[data-testid="activity-log-tab"]');
          await page.waitForSelector('[data-testid="activity-table"]');
        }}
      ]
    },
    {
      name: 'HBB Installer',
      login: { phone: '0712222222', pin: '1234', roleSelector: '[data-testid="mode-selector"]', mode: 'hbb' },
      journeys: [
        { name: 'Dashboard loads', run: async (page) => {
          await page.waitForSelector('[data-testid="hbb-installer-dashboard"]', { timeout: 10000 });
        }},
        { name: 'View jobs', run: async (page) => {
          await page.click('text=My Jobs');
          await page.waitForSelector('text=Jobs');
        }},
        { name: 'Check requests', run: async (page) => {
          await page.click('text=Requests');
          await page.waitForSelector('text=New Requests');
        }}
      ]
    }
  ];

  for (const profile of profiles) {
    console.log(`\n👤 Testing profile: ${profile.name}`);
    
    // Login
    try {
      await page.goto(APP_URL);
      
      // Handle role selection - check current mode and switch if needed
      const modeSelectorVisible = await page.locator('[data-testid="mode-selector"]').isVisible();
      if (modeSelectorVisible) {
        // Check current mode text
        const hbbModeVisible = await page.locator('text=Airtel Champions HBB').isVisible({ timeout: 2000 });
        const salesModeVisible = await page.locator('text=Airtel Champions Sales').isVisible({ timeout: 2000 });
        
        if (profile.mode === 'hbb' && !hbbModeVisible) {
          console.log('  🔀 Switching to HBB mode');
          await page.click('[data-testid="mode-selector"]');
          await page.waitForSelector('text=Airtel Champions HBB', { timeout: 5000 });
        } else if (profile.mode === 'sales' && !salesModeVisible) {
          console.log('  🔀 Switching to Sales mode');
          await page.click('[data-testid="mode-selector"]');
          await page.waitForSelector('text=Airtel Champions Sales', { timeout: 5000 });
        }
      }
      
      await page.fill('[data-testid="phone-input"]', profile.login.phone);
      await page.fill('[data-testid="pin-input"]', profile.login.pin);
      await page.click('[data-testid="login-submit"]');
      
      // Wait for profile-specific dashboard
      if (profile.mode === 'hbb') {
        if (profile.name === 'HBB Agent') {
          await page.waitForSelector('[data-testid="hbb-agent-dashboard"]', { timeout: 10000 });
          console.log('  ✅ HBB Agent Dashboard loaded');
        } else if (profile.name === 'HBB Installer') {
          await page.waitForSelector('[data-testid="hbb-installer-dashboard"]', { timeout: 10000 });
          console.log('  ✅ HBB Installer Dashboard loaded');
        } else {
          await page.waitForSelector('[data-testid="hbb-dashboard"]', { timeout: 10000 });
          console.log('  ✅ HBB Dashboard loaded');
        }
      } else {
        await page.waitForSelector('[data-testid="sales-dashboard"]', { timeout: 10000 });
        console.log('  ✅ Sales Dashboard loaded');
      }
    } catch (err) {
      console.log(`  ❌ Login failed for ${profile.name}: ${err.message}`);
      failures.push({ profile: profile.name, step: 'login', error: err.message });
      continue; // skip this profile if login fails
    }

    // Run journeys for this profile
    for (const journey of profile.journeys) {
      try {
        await journey.run(page);
        console.log(`  ✅ ${profile.name} - ${journey.name}`);
      } catch (err) {
        console.log(`  ❌ ${profile.name} - ${journey.name}: ${err.message}`);
        failures.push({ profile: profile.name, journey: journey.name, error: err.message });
      }
    }

    // Logout - navigate back to login for next profile
    try {
      // Try to find logout button or navigate back to login
      const logoutBtn = page.locator('button:has-text("Sign Out"), button:has-text("Logout"), [data-testid="logout-btn"]');
      if (await logoutBtn.isVisible({ timeout: 3000 })) {
        await logoutBtn.click();
      } else {
        // Navigate back to login page
        await page.goto(APP_URL);
      }
      await page.waitForSelector('[data-testid="phone-input"]', { timeout: 5000 });
    } catch (err) {
      console.log(`  ⚠️ Logout transition issue: ${err.message}`);
      // Continue anyway, next profile will navigate fresh
    }
  }

  await browser.close();
  return failures;
}

async function proposeFix(failures, currentFiles) {
  if (!failures.length) return null;
  
  // Check if it's a rate limit error
  const isRateLimit = failures.some(f => f.error.includes('rate_limit_exceeded'));
  if (isRateLimit) {
    console.log('⏳ Groq API rate limit reached - waiting 30 minutes before retrying...');
    await new Promise(r => setTimeout(r, 30 * 60 * 1000)); // 30 minutes
    return null; // Skip this iteration
  }
  
  const system = `You are a React/Tailwind expert. Output JSON: {"filePath":"...","newContent":"...","description":"..."}`;
  const prompt = `Failures: ${JSON.stringify(failures)}\nCurrent files:\n${currentFiles}`;
  const response = await callGroq(prompt, system);
  const match = response.match(/\{[\s\S]*\}/);
  if (!match) {
    console.log('⚠️ No valid JSON in Groq response');
    return null;
  }
  try {
    return JSON.parse(match[0]);
  } catch (e) {
    console.log('⚠️ Failed to parse Groq JSON:', e.message);
    return null;
  }
}

function applyAndCommit(filePath, newContent, description, iteration) {
  const full = path.join(__dirname, '..', filePath);
  if (!ALLOWED_PATHS.some(p => filePath.startsWith(p))) throw new Error('File not allowed');
  for (const p of FORBIDDEN_PATTERNS) if (p.test(newContent)) throw new Error('Forbidden pattern');
  fs.writeFileSync(full, newContent, 'utf-8');
  execSync('git add .', { stdio: 'ignore' });
  execSync(`git commit -m "🤖 auto-uat: ${description}"`, { stdio: 'ignore' });
  execSync(`git tag auto-uat-iter-${iteration}-${Date.now()}`, { stdio: 'ignore' });
  execSync('git push origin main --tags', { stdio: 'ignore' });
  console.log(`✅ Committed and tagged`);
}

async function main() {
  console.log(`🚀 Starting 6‑hour UAT evolution loop (every ${INTERVAL_MS/1000}s)`);
  console.log('📋 SCRIPT VERSION: 2.1 - Multi-Profile UAT with Rate Limit Handling');
  
  const endTime = Date.now() + MAX_DURATION_MS;
  let iteration = 0;

  while (Date.now() < endTime) {
    iteration++;
    console.log(`\n🔄 Iteration ${iteration} – ${new Date().toISOString()}`);
    const failures = await runE2ETests();
    if (failures.length === 0) {
      console.log('🎉 All UAT journeys pass – perfection achieved! Stopping loop.');
      break;
    }
    console.log(`❌ ${failures.length} failing journeys`);

    const filesToRead = [
  'src/components/hbb/hbb-dse-dashboard.tsx',
  'src/components/hbb/hbb-new-lead-form.tsx',
  'src/components/hbb/hbb-agent-dashboard.tsx',
  'src/components/hbb/hbb-installer-dashboard.tsx',
  'src/components/role-dashboards.tsx',
  'src/components/AdminDashboard.tsx',
  'src/components/Sidebar.tsx',
  'src/components/LoginPage.tsx',
  'src/components/RubiksCube.tsx'
];
    let currentFiles = '';
    for (const f of filesToRead) {
      const full = path.join(__dirname, '..', f);
      if (fs.existsSync(full)) currentFiles += `\n${f}:\n${fs.readFileSync(full, 'utf-8')}\n`;
    }

    const proposal = await proposeFix(failures, currentFiles);
    if (!proposal) {
      console.log('⚠️ No valid fix proposal, waiting for next iteration...');
      await new Promise(r => setTimeout(r, INTERVAL_MS));
      continue;
    }

    try {
      applyAndCommit(proposal.filePath, proposal.newContent, proposal.description, iteration);
    } catch (err) {
      console.error('❌ Apply/commit failed:', err.message);
      await new Promise(r => setTimeout(r, INTERVAL_MS));
      continue;
    }

    console.log('⏳ Waiting 90s for Vercel to redeploy...');
    await new Promise(r => setTimeout(r, 90000));
  }
  console.log('🏁 Loop finished.');
}

main().catch(console.error);
