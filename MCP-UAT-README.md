# 🚀 MCP-Based UAT System

## 📋 Overview
Local autonomous UAT testing system that runs directly in your IDE using MCP (Model Context Protocol) - **no GitHub Actions required!**

## 🎯 Benefits
- ✅ **No API rate limits** - runs locally
- ✅ **Real-time feedback** - see tests live
- ✅ **Instant debugging** - browser visible
- ✅ **No token consumption** - saves Groq API costs
- ✅ **Full control** - start/stop anytime

## 🚀 Quick Start

### Option 1: Double-click the batch file
```
run-uat-mcp.bat
```

### Option 2: Terminal command
```bash
npm run uat:mcp
```

### Option 3: Direct Node
```bash
node scripts/mcp-uat.js
```

## 📊 What It Tests

### 6 User Profiles with Real Credentials:

**Sales Side:**
- 🏢 **Sales Executive** (0733584848)
- 📊 **Zonal Sales Manager** (0788549867)  
- 💼 **Zonal Business Manager** (0739174525)
- 🏛️ **HQ Profile** (0738084947)

**HBB Side:**
- 📱 **HBB Agent** (0711111111)
- 🔧 **HBB Installer** (0712222222)

**Default Password:** `1234` for all profiles

## 🧪 Test Coverage

### Each Profile Tests:
- ✅ **Dashboard Loading** - Correct UI elements
- ✅ **Navigation** - Key tabs and buttons
- ✅ **Role Switching** - HBB ↔ Sales mode transitions
- ✅ **Core Actions** - Profile-specific workflows

### Example Journeys:
- **Sales Executive**: Dashboard → Team → Leaderboard → Submissions
- **HBB Agent**: Dashboard → Create Lead → View Leads → Activity Log
- **HBB Installer**: Dashboard → Jobs → Requests

## 🔧 How It Works

### MCP Integration:
- Uses **Playwright** for browser automation
- **Chrome DevTools MCP** for real-time debugging
- **Local analysis** - no external API calls
- **Smart error detection** with IDE integration

### Test Flow:
1. **Launch browser** (visible for debugging)
2. **Login** with real credentials
3. **Switch modes** (HBB/Sales) as needed
4. **Run journeys** for each profile
5. **Report results** in real-time
6. **Repeat** every 4 minutes (6-hour loop)

## 📈 Output Examples

### Success:
```
👤 Testing profile: Sales Executive
  ✅ Sales Dashboard loaded
  ✅ Sales Executive - Dashboard loads
  ✅ Sales Executive - View team tab
  ✅ Sales Executive - View leaderboard
  ✅ Sales Executive - View submissions
```

### Issues:
```
❌ Sales Executive - View team tab: Timeout 10000ms exceeded
🔧 MCP Fix Proposals:
  1. selector_fix: Check if View team tab selector exists in the component
  2. selector_fix: Add missing data-testid attribute
```

## 🛠️ Customization

### Add New Profiles:
Edit `scripts/mcp-uat.js`:
```javascript
{
  name: 'New Profile',
  login: { phone: '0712345678', pin: '1234', mode: 'sales' },
  journeys: [
    { name: 'Custom test', run: async (page) => {
      await page.click('[data-testid="custom-btn"]');
    }}
  ]
}
```

### Modify Intervals:
```javascript
const INTERVAL_MS = 120000; // 2 minutes instead of 4
const MAX_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours instead of 6
```

## 🚨 Troubleshooting

### Browser Not Launching:
```bash
npx playwright install chromium
```

### Selector Issues:
- Check `data-testid` attributes exist
- Verify element visibility
- Use browser dev tools to inspect

### Login Failures:
- Verify credentials are correct
- Check app URL is accessible
- Ensure phone/PIN format matches

## 📝 Logs & Results

### Real-time Output:
- **Profile progress** per user
- **Journey results** with pass/fail
- **Error details** for debugging
- **Fix suggestions** from MCP

### Stop Anytime:
- Press **Ctrl+C** in terminal
- Close browser window
- Tests pause gracefully

## 🔄 vs GitHub Actions

| Feature | MCP (Local) | GitHub Actions |
|---------|-------------|----------------|
| **API Limits** | ❌ None | ⚠️ 100K tokens/day |
| **Cost** | ✅ Free | 💰 $99+ for Dev Tier |
| **Speed** | ⚡ Instant | 🐢 5-10 min deploys |
| **Debugging** | 🔍 Live browser | 📋 Logs only |
| **Control** | 🎛️ Start/stop anytime | ⏰ Scheduled runs |

## 🎉 Start Testing!

1. **Double-click** `run-uat-mcp.bat`
2. **Watch** the tests run live
3. **Monitor** results in real-time
4. **Stop** anytime with Ctrl+C

**No GitHub Actions, no rate limits, just pure local testing power!** 🚀
