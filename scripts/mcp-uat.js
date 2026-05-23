// MCP-Based Autonomous UAT System
// Runs locally in IDE using Playwright and Chrome DevTools MCP

import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';

const APP_URL = 'https://airtel-champions-app-web-git-main-christopherkiokos-projects.vercel.app/';
const INTERVAL_MS = 240000; // 4 minutes
const MAX_DURATION_MS = 6 * 60 * 60 * 1000; // 6 hours

// User profiles with real credentials
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

async function runE2ETests() {
  console.log('🧪 Running UAT tests via MCP + Playwright...');
  console.log('🌐 Launching visible browser with confirmed working settings...');
  
  const browser = await chromium.launch({ 
    headless: false,  // Show browser window
    slowMo: 1000,     // Slow down for visibility
    devtools: false   // Don't show dev tools for cleaner view
  });
  
  console.log('✅ Browser launched successfully');
  const page = await browser.newPage();
  
  // Set viewport for better visibility
  await page.setViewportSize({ width: 1280, height: 720 });
  console.log('✅ Page created and viewport set');
  
  const failures = [];

  for (const profile of profiles) {
    console.log(`\n👤 Testing profile: ${profile.name}`);
    
    // Login
    try {
      await page.goto(APP_URL);
      
      // Handle role selection
      const modeSelectorVisible = await page.locator('[data-testid="mode-selector"]').isVisible();
      if (modeSelectorVisible) {
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
        }
      } else {
        await page.waitForSelector('[data-testid="sales-dashboard"]', { timeout: 10000 });
        console.log('  ✅ Sales Dashboard loaded');
      }
    } catch (err) {
      console.log(`  ❌ Login failed for ${profile.name}: ${err.message}`);
      failures.push({ profile: profile.name, step: 'login', error: err.message });
      continue;
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

    // Logout
    try {
      const logoutBtn = page.locator('button:has-text("Sign Out"), button:has-text("Logout"), [data-testid="logout-btn"]');
      if (await logoutBtn.isVisible({ timeout: 3000 })) {
        await logoutBtn.click();
      } else {
        await page.goto(APP_URL);
      }
      await page.waitForSelector('[data-testid="phone-input"]', { timeout: 5000 });
    } catch (err) {
      console.log(`  ⚠️ Logout transition issue: ${err.message}`);
    }
  }

  await browser.close();
  return failures;
}

// MCP Integration - Auto-fix using IDE capabilities
async function proposeFix(failures) {
  if (!failures.length) return null;
  
  console.log('🔧 MCP: Analyzing failures and proposing fixes...');
  
  // For MCP, we'll use the IDE's built-in analysis
  // This would integrate with your IDE's code understanding
  
  const fixProposals = failures.map(failure => ({
    type: 'selector_fix',
    issue: failure.error,
    suggestion: `Check if ${failure.journey || 'login'} selector exists in the component`,
    action: 'Add missing data-testid attribute'
  }));
  
  return fixProposals;
}

async function main() {
  console.log('🚀 Starting MCP-Based UAT System (6-hour loop)');
  console.log('📋 VERSION: 3.0 - Local MCP Integration');
  console.log('🔧 NO GITHUB ACTIONS - Runs directly in IDE');
  
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
    
    // MCP-based fix analysis (no API limits!)
    const proposals = await proposeFix(failures);
    if (proposals) {
      console.log('🔧 MCP Fix Proposals:');
      proposals.forEach((proposal, i) => {
        console.log(`  ${i + 1}. ${proposal.type}: ${proposal.suggestion}`);
      });
    }
    
    console.log(`⏳ Waiting ${INTERVAL_MS/1000}s before next iteration...`);
    await new Promise(r => setTimeout(r, INTERVAL_MS));
  }
  
  console.log('🏁 MCP UAT loop finished.');
}

// Export for MCP integration
export { main, runE2ETests, proposeFix };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
