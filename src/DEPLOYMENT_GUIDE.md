# 🚀 TAI Edge Function Deployment Guide

## ✅ Prerequisites Checklist
- [ ] You have access to Supabase Dashboard
- [ ] Project ID: `xspogpfohjmkykfjadhk`
- [ ] You have the `programs` table created in this project
- [ ] You have updated `/utils/supabase/info.tsx` with correct credentials

---

## 📋 STEP-BY-STEP DEPLOYMENT

### **Step 1: Go to Supabase Dashboard**

1. Open your browser
2. Navigate to: **https://supabase.com/dashboard/project/xspogpfohjmkykfjadhk**
3. Login if needed

### **Step 2: Navigate to Edge Functions**

1. In the left sidebar, click **"Edge Functions"**
2. You should see a list of existing functions (or empty if none exist)

### **Step 3: Create New Function**

1. Click the **"Create a new function"** button (usually top-right)
2. Or click **"New Function"** if that's what you see

### **Step 4: Function Configuration**

**Function Name:** `make-server-28f2f653`

⚠️ **CRITICAL**: The function name MUST be exactly `make-server-28f2f653` (no spaces, exact match)

### **Step 5: Copy the Code**

1. Open the file `/EDGE_FUNCTION_CONSOLIDATED.ts` in Figma Make
2. Copy **ALL** the code (Ctrl+A, then Ctrl+C)
3. Paste it into the Supabase function editor

### **Step 6: Deploy**

1. Click the **"Deploy"** or **"Create Function"** button
2. Wait for deployment to complete (usually 30-60 seconds)
3. Look for a success message

### **Step 7: Verify Deployment**

Test the health endpoint by visiting this URL in your browser:

```
https://xspogpfohjmkykfjadhk.supabase.co/functions/v1/make-server-28f2f653/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-03T...",
  "service": "Sales Intelligence Network API",
  "project": "xspogpfohjmkykfjadhk"
}
```

---

## 🎯 Testing the Programs Endpoint

After successful deployment, test creating a program:

1. **Refresh your TAI dashboard** (Ctrl+Shift+R or Cmd+Shift+R)
2. **Click "Create Program"** as Ashish (Director)
3. **Fill in the form** and click "Create Program"

### Expected Result:
✅ Program created successfully!

---

## 🐛 Troubleshooting

### Issue: "Function not found" (404 Error)

**Solution:**
- Wait 60 seconds and try again
- Clear browser cache (Ctrl+Shift+Delete)
- Verify function name is exactly: `make-server-28f2f653`

### Issue: "CORS Error"

**Solution:**
- The function includes CORS headers - this shouldn't happen
- Try redeploying the function
- Check that you copied ALL the code including the CORS middleware

### Issue: "Could not find the table 'programs'"

**Solution:**
- The `programs` table doesn't exist in project `xspogpfohjmkykfjadhk`
- You need to create the table first
- Check the SQL schema you ran earlier

### Issue: "Unauthorized" or "Invalid token"

**Solution:**
- Verify `/utils/supabase/info.tsx` has the correct `publicAnonKey` for project `xspogpfohjmkykfjadhk`
- The key should start with: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzcG9ncGZvaGpta3lrZmphZGhrIi...`

---

## 📊 What This Function Does

✅ **Programs Management**
- GET /make-server-28f2f653/programs - List all programs
- POST /make-server-28f2f653/programs - Create new program
- DELETE /make-server-28f2f653/programs/:id - Delete program

✅ **Submissions Management**
- POST /make-server-28f2f653/submissions/approve - Approve submission

✅ **Leaderboard**
- GET /make-server-28f2f653/leaderboard - Get leaderboard

✅ **Analytics**
- GET /make-server-28f2f653/analytics/generate - Generate analytics report

✅ **Health Check**
- GET /make-server-28f2f653/health - Verify function is running

---

## 🎉 Success Indicators

After deployment, you should see:

1. ✅ Function deployed successfully in Supabase Dashboard
2. ✅ Health endpoint returns `{"status":"ok"}`
3. ✅ No CORS errors in browser console
4. ✅ Program creation works in TAI dashboard
5. ✅ No "Failed to fetch" errors

---

## 📞 Need Help?

If deployment fails:
1. Check Supabase function logs (in Supabase Dashboard → Edge Functions → Logs)
2. Copy any error messages
3. Share the error messages so I can help debug

---

## 🔐 Environment Variables

The function automatically uses these environment variables from Supabase:
- `SUPABASE_URL` - Automatically injected
- `SUPABASE_SERVICE_ROLE_KEY` - Automatically injected

You don't need to configure these manually!

---

Good luck! 🚀
