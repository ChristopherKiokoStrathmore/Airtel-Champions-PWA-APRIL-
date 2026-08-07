# 📁 PROGRAM FOLDERS & ANALYTICS

## Quick Links
- **Setup Guide**: [`/APP_FOLDER_SETUP.md`](/APP_FOLDER_SETUP.md) ← Start here!
- **Complete Guide**: [`/FOLDERS_COMPLETE_APP_LEVEL.md`](/FOLDERS_COMPLETE_APP_LEVEL.md)
- **Config File**: [`/components/programs/folder-config.ts`](/components/programs/folder-config.ts)

---

## ✨ What Is This?

A **pure app-level folder system** that organizes your programs beautifully with powerful analytics. **No database changes needed!**

### Features
- 📁 **Folder Organization** - Programs auto-grouped by category
- 📊 **Analytics Dashboard** - Real-time performance metrics
- 🎯 **Dual Modes** - Submit or Analytics view
- 🎨 **Customizable** - Edit one config file
- ⚡ **Zero Setup** - Already integrated!

---

## 🚀 30-Second Start

### 1. It's Already Working!
Open your app → Navigate to **Programs** tab → See folders! ✨

### 2. Customize (Optional)
Edit `/components/programs/folder-config.ts`:

```typescript
export const FOLDER_CONFIG: FolderConfig[] = [
  {
    id: 'sales',
    name: 'Sales Programs',
    icon: '💰',
    color: 'green',
    category: 'Sales', // Programs with this category go here
    order: 1
  },
  // Add more folders...
];
```

### 3. Match Categories
Make sure your programs have categories that match:
```typescript
Program: { category: "Sales" }
  → Goes into 💰 Sales Programs folder
```

**That's it!** 🎉

---

## 📊 Pre-Configured Folders

| Folder | Icon | Color | Category |
|--------|------|-------|----------|
| Sales Programs | 💰 | Green | `"Sales"` |
| Customer Experience | 😊 | Blue | `"Customer Experience"` |
| Network Quality | 📡 | Purple | `"Network Experience"` |
| Training & Development | 📚 | Orange | `"Training"` |
| Data & Analytics | 📊 | Pink | `"Data"` |

---

## 🎯 How to Use

### For Sales Executives
1. Open Programs tab
2. See programs in folders
3. Click to expand folder
4. Click program to submit
5. Earn points!

### For HQ/Directors
1. Open Programs tab
2. Toggle to **Analytics** mode
3. Click any program
4. View detailed analytics:
   - Total submissions & users
   - Daily trends (30 days)
   - Top performers leaderboard
   - Status breakdown

---

## 📈 Analytics Dashboard

### What You See
- **Overview**: Total subs, users, points, status breakdown
- **Trends**: 30-day daily submission history
- **Top Performers**: Leaderboard with 🥇🥈🥉 medals

### Real-Time Calculation
Analytics are calculated live from your existing `submissions` table. No database views needed!

---

## 🎨 Customization

### Add a Folder
```typescript
{
  id: 'my-folder',
  name: 'My Folder',
  description: 'Description here',
  icon: '🚀',
  color: 'blue',
  category: 'MyCategory',
  order: 6
}
```

### Remove a Folder
Delete the folder object from the config array.

### Change Order
Modify the `order` property (lower = first).

### Available Icons
📁📚💰😊📡🎯⚡🏆📊🚀💼🎓🎧💝🎨🎭

### Available Colors
`blue` `green` `purple` `orange` `pink` `yellow` `red`

---

## ❓ FAQ

**Q: Do I need to run SQL scripts?**  
A: No! This is a pure app feature.

**Q: Where are folders stored?**  
A: In `/components/programs/folder-config.ts` (not database).

**Q: How do I assign programs to folders?**  
A: Set program's `category` field to match folder's `category`.

**Q: Can I have programs without folders?**  
A: Yes! They appear in "Other Programs" section.

**Q: Are analytics real-time?**  
A: Yes! Calculated from `submissions` table.

**Q: Can Sales Executives see analytics?**  
A: Yes! Toggle to Analytics mode.

---

## 🐛 Troubleshooting

### Programs not in folder?
Check: `Program.category === Folder.category` (case-sensitive)

### Analytics showing zero?
Need submissions first. Make a test submission.

### Folder not appearing?
Check syntax in `folder-config.ts` and reload app.

---

## 📚 Full Documentation

- **Setup Guide**: `/APP_FOLDER_SETUP.md` - How to set up and customize
- **Complete Guide**: `/FOLDERS_COMPLETE_APP_LEVEL.md` - All features explained
- **Config File**: `/components/programs/folder-config.ts` - Edit to customize

---

## ✅ Status

**✨ Complete and Working!**

- [x] Folder organization
- [x] Analytics dashboard
- [x] Dual view modes
- [x] Fully customizable
- [x] Zero database changes
- [x] Already integrated

---

## 🎉 Benefits

- ✅ **No Setup** - Already working
- ✅ **Easy to Customize** - Edit 1 file
- ✅ **No Database Changes** - Uses existing tables
- ✅ **Fast Performance** - In-memory grouping
- ✅ **Beautiful UI** - Professional design
- ✅ **Real-Time Analytics** - Always up-to-date

---

**🚀 Start using it now!**

Navigate to **Programs** tab in your Airtel Champions app.

---

*Feature: App-Level Program Folders with Analytics*  
*Status: Complete* ✅  
*Date: January 27, 2026*
