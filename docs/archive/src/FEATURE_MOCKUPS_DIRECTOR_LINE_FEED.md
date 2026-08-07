# 📱 TAI Feature Mockups: Director Line & Social Feed

**Visual Design Reference**  
**For Development Team**

---

## 🎨 **FEATURE 1: SWIPE LEFT FOR DIRECTOR LINE**

### **Before Swipe (Normal SE Dashboard)**

```
┌─────────────────────────────────────┐
│ ← ←              TAI         [JM] ● │  ← Visual hint: arrows suggest swipe
│ Swipe left for Director Line        │  ← Subtle prompt
├─────────────────────────────────────┤
│                                     │
│  Good morning, John! ☀️              │
│  Sales Executive • Nairobi West     │
│  Rank #23 • 1,250 pts              │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ 🎯 Today's Target              │  │
│  │ Progress: ████████░░ 80%       │  │
│  │ 20 / 25 activations            │  │
│  └───────────────────────────────┘  │
│                                     │
│  📊 Your Performance                │
│  Week: ⭐⭐⭐⭐☆ (4.2/5)            │
│  ZSM: Mary Johnson • 📞 Contact    │
│                                     │
│  🏆 Recent Achievements             │
│  ├─ First Sale Badge                │
│  ├─ 10 Day Streak                   │
│  └─ Top 25% in Zone                 │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ Quick Actions                  │  │
│  │ [📋 Submit] [📸 Photo] [📊]    │  │
│  └───────────────────────────────┘  │
│                                     │
├─────────────────────────────────────┤
│  [🏠 Home] [📊 Stats] [👥] [👤]     │
└─────────────────────────────────────┘
```

---

### **During Swipe (Transition Animation)**

```
┌─────────────────────────────────────┐
│                   [JM] ●            │
│           Swiping...                │
├─────────────────────────────────────┤
│                                     │
│        ╔═══════════════════╗        │
│        ║ 📞 Opening        ║        │
│        ║ Director Line...  ║        │
│        ║                   ║        │
│        ║      [● ● ●]      ║        │
│        ╚═══════════════════╝        │
│                                     │
│                                     │
│    ← Swipe back to return           │
│                                     │
└─────────────────────────────────────┘
```

---

### **After Swipe (Director Line Interface)**

```
┌─────────────────────────────────────┐
│ ← Back         Director Line        │
├─────────────────────────────────────┤
│                                     │
│  ┌───────────────────────────────┐  │
│  │  👔                            │  │
│  │  Ashish Azad                   │  │
│  │  Sales & Distribution Director │  │
│  │  Airtel Kenya                  │  │
│  └───────────────────────────────┘  │
│                                     │
│  "Your voice matters. Report issues,│
│   share ideas, or seek support      │
│   directly with me."                │
│                    - Ashish         │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ What would you like to report? │  │
│  │                                │  │
│  │  ┌─────────────────────────┐   │  │
│  │  │ 🚨 URGENT ISSUE         │   │  │
│  │  │ Needs immediate action  │   │  │
│  │  └─────────────────────────┘   │  │
│  │                                │  │
│  │  ┌─────────────────────────┐   │  │
│  │  │ 🕵️ REPORT MALPRACTICE    │   │  │
│  │  │ Confidential reporting  │   │  │
│  │  └─────────────────────────┘   │  │
│  │                                │  │
│  │  ┌─────────────────────────┐   │  │
│  │  │ 💡 SHARE IDEA/FEEDBACK  │   │  │
│  │  │ Your suggestions matter │   │  │
│  │  └─────────────────────────┘   │  │
│  │                                │  │
│  │  ┌─────────────────────────┐   │  │
│  │  │ 🆘 NEED SUPPORT         │   │  │
│  │  │ Request assistance      │   │  │
│  │  └─────────────────────────┘   │  │
│  │                                │  │
│  │  ┌─────────────────────────┐   │  │
│  │  │ 📊 MARKET INTELLIGENCE  │   │  │
│  │  │ Share ground insights   │   │  │
│  │  └─────────────────────────┘   │  │
│  │                                │  │
│  │  ┌─────────────────────────┐   │  │
│  │  │ 🙋 GENERAL QUESTION     │   │  │
│  │  │ Ask anything            │   │  │
│  │  └─────────────────────────┘   │  │
│  └───────────────────────────────┘  │
│                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                     │
│  📬 Previous Messages (3)           │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ You: "Network issue in..."    │  │
│  │ Ashish: "Thanks! Investigating"│  │
│  │ 2 days ago • ✅ Resolved       │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ You: "Great sales tip idea..." │  │
│  │ Ashish: "Love it! Will share"  │  │
│  │ 5 days ago • ✅ Actioned       │  │
│  └───────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

---

### **Message Composition Screen (After Selecting Category)**

```
┌─────────────────────────────────────┐
│ ← Cancel    📊 Market Intel    Send →│
├─────────────────────────────────────┤
│                                     │
│  ┌───────────────────────────────┐  │
│  │                                │  │
│  │  Write your message to Ashish  │  │
│  │                                │  │
│  │  [Cursor blinking here...]     │  │
│  │                                │  │
│  │                                │  │
│  │                                │  │
│  │                                │  │
│  │                                │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ ☑️ Make this anonymous         │  │
│  │   (Your name will be hidden)   │  │
│  └───────────────────────────────┘  │
│                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                     │
│  Attach Files:                      │
│  [📷 Photo] [🎥 Video] [📎 File]    │
│                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                     │
│  💡 Tips for better responses:      │
│  • Be specific about location       │
│  • Include dates/times if relevant  │
│  • Attach evidence when possible    │
│                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                     │
│  ⚠️ Please note:                    │
│  • Avg response time: 4-6 hours     │
│  • Urgent issues: < 2 hours         │
│  • All messages are logged          │
│  • False reports may have consequences│
│                                     │
│  ┌───────────────────────────────┐  │
│  │                                │  │
│  │    Send Message to Ashish      │  │
│  │                                │  │
│  └───────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

---

### **Message Sent Confirmation**

```
┌─────────────────────────────────────┐
│          Message Sent! ✅            │
├─────────────────────────────────────┤
│                                     │
│         ╔═════════════════╗         │
│         ║                 ║         │
│         ║       ✓         ║         │
│         ║                 ║         │
│         ╚═════════════════╝         │
│                                     │
│  Your message has been sent to      │
│  Ashish Azad                        │
│                                     │
│  Expected response time:            │
│  📊 Market Intel: 6-8 hours         │
│                                     │
│  Reference #: DL-2026-001234        │
│                                     │
│  You'll receive a notification when │
│  Ashish responds.                   │
│                                     │
│  ┌───────────────────────────────┐  │
│  │                                │  │
│  │     Back to Dashboard          │  │
│  │                                │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │                                │  │
│  │     View My Messages           │  │
│  │                                │  │
│  └───────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

---

## 🌟 **FEATURE 2: TAI SOCIAL FEED**

### **Feed Main View (New Tab)**

```
┌─────────────────────────────────────┐
│          TAI Feed           [+ Post]│
│                                [JM]●│
├─────────────────────────────────────┤
│  [🔥 Trending] [💡 Tips] [🏆 Top]   │  ← Filter tabs
├─────────────────────────────────────┤
│                                     │
│  ┌───────────────────────────────┐  │
│  │ 👤 John Mwangi • SE           │  │
│  │    Nairobi West • 2h ago      │  │
│  │ ─────────────────────────────  │  │
│  │                               │  │
│  │  ╔═══════════════════════╗    │  │
│  │  ║                       ║    │  │
│  │  ║  [Photo: Group of     ║    │  │
│  │  ║   happy customers]    ║    │  │
│  │  ║                       ║    │  │
│  │  ╚═══════════════════════╝    │  │
│  │                               │  │
│  │  "Just activated 15 Airtel    │  │
│  │  Money accounts at Gikomba    │  │
│  │  Market! 🔥                   │  │
│  │                               │  │
│  │  Secret: Targeted traders     │  │
│  │  during slow afternoon hours. │  │
│  │  They had time to listen!"    │  │
│  │                               │  │
│  │  #AirtelMoney #NairobiWest    │  │
│  │  #TradersWin                  │  │
│  │                               │  │
│  │ ─────────────────────────────  │  │
│  │  💚 47    💬 12    ⤴️ Share    │  │
│  │ ─────────────────────────────  │  │
│  │                               │  │
│  │  👑 Ashish Azad:              │  │
│  │  "Excellent targeting! This   │  │
│  │   is exactly the kind of      │  │
│  │   thinking we need. 💯"       │  │
│  │   3 likes • 1h ago            │  │
│  │                               │  │
│  │  👤 Mary K (ZSM):             │  │
│  │  "What pitch did you use?"    │  │
│  │   2 likes • 1h ago            │  │
│  │                               │  │
│  │  👤 Peter L (SE):             │  │
│  │  "Tried this today, got 8!    │  │
│  │   Thanks for the tip 🙏"      │  │
│  │   5 likes • 45m ago           │  │
│  │                               │  │
│  │  View all 12 comments →       │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ 👤 Sarah Njeri • SE           │  │
│  │    Mombasa • 5h ago           │  │
│  │ ─────────────────────────────  │  │
│  │                               │  │
│  │  ╔═══════════════════════╗    │  │
│  │  ║     ▶️ VIDEO           ║    │  │
│  │  ║                       ║    │  │
│  │  ║  "My Closing           ║    │  │
│  │  ║   Technique"           ║    │  │
│  │  ║                       ║    │  │
│  │  ║     [0:45 / 0:58]     ║    │  │
│  │  ╚═══════════════════════╝    │  │
│  │                               │  │
│  │  "My closing technique for    │  │
│  │  hesitant customers. Works    │  │
│  │  every time! 💡               │  │
│  │                               │  │
│  │  Watch how I handle the       │  │
│  │  'I'll think about it'        │  │
│  │  objection."                  │  │
│  │                               │  │
│  │  #SalesTips #ClosingTechnique │  │
│  │                               │  │
│  │ ─────────────────────────────  │  │
│  │  💚 89    💬 23    ⤴️ Share    │  │
│  │ ─────────────────────────────  │  │
│  │                               │  │
│  │  👑 Ashish Azad:              │  │
│  │  "⭐ VERIFIED TIP              │  │
│  │   Adding this to training!"   │  │
│  │   12 likes • 4h ago           │  │
│  │                               │  │
│  │  View all 23 comments →       │  │
│  └───────────────────────────────┘  │
│                                     │
│  [Load more posts...]               │
│                                     │
├─────────────────────────────────────┤
│  [🏠] [📊] [➕] [🌟 Feed] [👤]      │  ← New tab!
└─────────────────────────────────────┘
```

---

### **Create Post Screen**

```
┌─────────────────────────────────────┐
│ ← Cancel      New Post        Post →│
├─────────────────────────────────────┤
│                                     │
│  ┌───────────────────────────────┐  │
│  │ 👤 John Mwangi                 │  │
│  │    Sales Executive • Nairobi W │  │
│  └───────────────────────────────┘  │
│                                     │
│  Choose Post Type:                  │
│  ┌────────┬────────┬────────┐       │
│  │   📸   │   🎥   │   📝   │       │
│  │ Photo  │ Video  │  Text  │       │
│  └────────┴────────┴────────┘       │
│                                     │
│  ┌───────────────────────────────┐  │
│  │                                │  │
│  │  What's your win today?        │  │
│  │                                │  │
│  │  [Cursor blinking...]          │  │
│  │                                │  │
│  │                                │  │
│  │                                │  │
│  │                                │  │
│  └───────────────────────────────┘  │
│                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                     │
│  Add Photos/Videos:                 │
│  ┌─────┬─────┬─────┬─────┐         │
│  │ [+] │     │     │     │         │
│  │     │     │     │     │         │
│  └─────┴─────┴─────┴─────┘         │
│  Tap to add (max 4)                 │
│                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                     │
│  Add Hashtags:                      │
│  [#AirtelMoney] [#MiFi] [#Tips]     │
│  [#NairobiWest] [+Custom]           │
│                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                     │
│  Privacy:                           │
│  ○ Everyone (All TAI users)         │
│  ○ My Zone only                     │
│  ○ SEs only (no managers)           │
│                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                     │
│  ☑️ Customer consented to photo     │
│  ☑️ Auto-blur faces for privacy     │
│                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                     │
│  💡 Post Tips:                      │
│  • Share specific techniques        │
│  • Include context (where, when)    │
│  • Be positive & helpful            │
│  • Respect customer privacy         │
│                                     │
└─────────────────────────────────────┘
```

---

### **Post Detail View (After Clicking a Post)**

```
┌─────────────────────────────────────┐
│ ← Back           Post          ⋯    │
├─────────────────────────────────────┤
│                                     │
│  ┌───────────────────────────────┐  │
│  │ 👤 John Mwangi                 │  │
│  │    Sales Executive              │  │
│  │    Nairobi West                 │  │
│  │    2 hours ago                  │  │
│  └───────────────────────────────┘  │
│                                     │
│  ╔═══════════════════════════════╗  │
│  ║                               ║  │
│  ║  [Full size photo]            ║  │
│  ║                               ║  │
│  ║                               ║  │
│  ╚═══════════════════════════════╝  │
│                                     │
│  "Just activated 15 Airtel Money    │
│  accounts at Gikomba Market! 🔥     │
│                                     │
│  Secret: Targeted traders during    │
│  slow afternoon hours. They had     │
│  time to listen!                    │
│                                     │
│  My approach:                       │
│  1. Showed instant cash-in demo     │
│  2. Explained transaction savings   │
│  3. Offered to activate on spot     │
│  4. Followed up with stickers       │
│                                     │
│  Result: 15 activations + 8         │
│  promised to tell friends!"         │
│                                     │
│  #AirtelMoney #NairobiWest          │
│  #TradersWin #SalesWin              │
│                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│                                     │
│  💚 47    💬 12    ⤴️ Share    🔖   │
│                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│                                     │
│  👑 Ashish Azad                     │
│  "Excellent targeting! This is      │
│   exactly the kind of thinking we   │
│   need. I'm sharing this with all   │
│   ZSMs as a best practice. 💯"      │
│  💚 3    💬 Reply    1h ago         │
│                                     │
│  ──────────────────────────────────│
│                                     │
│  👤 Mary K (ZSM - Nairobi)          │
│  "What pitch did you use exactly?   │
│   Can you share the exact words?"   │
│  💚 2    💬 Reply    1h ago         │
│                                     │
│    └─ 👤 John M (Author)            │
│       "Sure! I said: 'You're losing │
│        500 shillings per month in   │
│        transaction fees. Airtel     │
│        Money is FREE...'"           │
│       💚 5    💬 Reply    50m ago   │
│                                     │
│  ──────────────────────────────────│
│                                     │
│  👤 Peter L (SE - Nairobi East)     │
│  "Tried this today in my market,    │
│   got 8 activations! Thanks for     │
│   the tip brother 🙏"               │
│  💚 5    💬 Reply    45m ago        │
│                                     │
│  ──────────────────────────────────│
│                                     │
│  👤 Sarah N (SE - Mombasa)          │
│  "Love the step-by-step approach!   │
│   Can I adapt this for MiFi sales?" │
│  💚 1    💬 Reply    30m ago        │
│                                     │
│  ──────────────────────────────────│
│                                     │
│  [View 8 more comments...]          │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ Add a comment...               │  │
│  │ [Type here...]           [📷]  │  │
│  └───────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

---

### **Director's Feed Intelligence Dashboard**

```
┌─────────────────────────────────────┐
│   Director Feed Dashboard    [AA]●  │
├─────────────────────────────────────┤
│                                     │
│  📊 FEED OVERVIEW                   │
│                                     │
│  ┌─────┬─────┬─────┬─────┐         │
│  │ 47  │ 234 │ 1.2K│ 412 │         │
│  │Posts│Likes│Cmts │Users│         │
│  │today│     │     │activ│         │
│  └─────┴─────┴─────┴─────┘         │
│                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│                                     │
│  🔥 TRENDING TOPICS TODAY           │
│                                     │
│  1. 📱 MiFi demonstrations (23)     │
│     ↑ 45% from yesterday            │
│     Zones: Nairobi, Mombasa         │
│                                     │
│  2. 💰 Airtel Money challenges (18) │
│     ↑ 23% from yesterday            │
│     Issue: "Safaricom competition"  │
│                                     │
│  3. 🎯 Closing techniques (12)      │
│     ↓ 5% from yesterday             │
│     Mostly video tips               │
│                                     │
│  [View All Trends →]                │
│                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│                                     │
│  🏆 TOP POSTS THIS WEEK             │
│                                     │
│  1. 👤 John M - 247 💚              │
│     "15 activations at Gikomba"     │
│     [View Post →]                   │
│                                     │
│  2. 👤 Sarah N - 189 💚             │
│     "My closing technique video"    │
│     [View Post →]                   │
│                                     │
│  3. 👤 Peter K - 156 💚             │
│     "Overcoming Safaricom obj..."   │
│     [View Post →]                   │
│                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│                                     │
│  ⚠️ NEEDS YOUR ATTENTION            │
│                                     │
│  • 5 posts flagged for review       │
│  • 3 posts mention customer issues  │
│  • Network complaints in Kisumu (4) │
│  • ZSM response rate: 78% (↓)      │
│                                     │
│  [Review Flagged →]                 │
│                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│                                     │
│  💡 AI INSIGHTS                     │
│                                     │
│  • "Afternoon market targeting"     │
│    mentioned in 8 winning posts     │
│    → Consider updating training?    │
│                                     │
│  • Video posts get 2.3x engagement  │
│    → Encourage more video content?  │
│                                     │
│  • Top performers post 3x/week      │
│    → Correlation with sales? 📊     │
│                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│                                     │
│  ✨ QUICK ACTIONS                   │
│                                     │
│  [💬 Post Update] [🏆 Award Badge]  │
│  [📊 Full Report] [⚙️ Settings]     │
│                                     │
└─────────────────────────────────────┘
```

---

## 🎨 **COLOR SCHEME & BRANDING**

### **Director Line**
- Primary: **Orange/Red** (#FF5722)
- Accent: **Deep Orange** (#F44336)
- Background: **Warm Gray** (#FFF3E0)
- Icon: 📞 or 🔥
- Feel: **Urgent, Official, Direct**

### **Social Feed**
- Primary: **Airtel Green** (#00A859)
- Secondary: **Bright Red** (#E20613)
- Background: **White** (#FFFFFF)
- Icon: 🌟 or 💚
- Feel: **Community, Celebratory, Engaging**

---

## 📱 **INTERACTION PATTERNS**

### **Swipe Gestures:**
- **Swipe Left** on dashboard → Director Line
- **Swipe Right** on Director Line → Back to dashboard
- **Swipe Up** on feed → Refresh posts
- **Swipe Down** on post image → Close fullscreen

### **Tap Gestures:**
- **Single Tap** on post → View details
- **Double Tap** on post → Like (💚)
- **Long Press** on post → Options menu (Save, Report, Share)
- **Tap on user avatar** → View their profile

### **Animations:**
- Like button → Heart pop animation
- New post → Slide in from top
- Comment posted → Fade in
- Director response → Special golden glow effect

---

## 🏆 **GAMIFICATION ELEMENTS**

### **Badges:**
- 🌟 **First Post** - Posted your first win
- 🔥 **On Fire** - 3 posts in one week
- 💯 **Century Club** - 100+ likes total
- 👑 **Director's Choice** - Ashish featured your post
- ⭐ **Verified Tip** - Your technique added to training
- 🏆 **Top Contributor** - Most liked post this month

### **Leaderboard Integration:**
- Feed activity counts toward overall points
- Likes = 2 points each
- Verified tip = 50 points
- Director comment = 100 points
- Top weekly post = 500 points

---

## 📊 **METRICS TO TRACK**

### **Director Line:**
- Messages sent per day
- Response time (avg, by category)
- Resolution rate
- Urgent vs non-urgent ratio
- Anonymous vs named messages
- SE satisfaction score

### **Social Feed:**
- Daily active users (DAU)
- Posts per day
- Engagement rate (likes + comments / views)
- Director engagement (% of posts commented)
- Video vs photo performance
- Hashtag usage
- Shares per post
- Time to first engagement

---

## 🎯 **SUCCESS LOOKS LIKE**

**Director Line - Week 4:**
- 50-100 messages/week
- < 6 hour avg response time
- 90% SE satisfaction
- 5+ actionable insights for Ashish
- 2+ malpractice cases caught

**Social Feed - Week 4:**
- 100+ posts/week
- 400+ DAU (60% of 662 SEs)
- 50+ likes/post average
- Ashish comments 10+ times/week
- 20+ verified tips created

---

**Ready for Development?** ✅  
**Design Approved?** ✅  
**Board Excited?** 💯  

**Let's build this!** 🚀
