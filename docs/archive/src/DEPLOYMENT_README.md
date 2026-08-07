# 🚀 TAI Edge Function Deployment - Quick Start

## ⚡ **FASTEST OPTION: Copy & Paste (1 minute)**

### Step 1: Copy the File
1. Open: `/supabase/functions/rapid-responder/index.ts`
2. Copy ALL the contents (Ctrl+A, Ctrl+C)

### Step 2: Paste to Supabase Dashboard
1. Go to: https://supabase.com/dashboard/project/xspogpfohjmkykfjadhk/functions
2. Click on `rapid-responder` function
3. Click "Deploy new version" or "Edit"
4. **Delete all existing code**
5. **Paste the copied code**
6. Click "Deploy"

### Step 3: Test
Open this URL in your browser:
```
https://xspogpfohjmkykfjadhk.supabase.co/functions/v1/rapid-responder/make-server-28f2f653/health
```

✅ Should see:
```json
{
  "status": "ok",
  "timestamp": "...",
  "service": "TAI - Sales Intelligence Network API"
}
```

### Step 4: Test in TAI App
1. Login as **Ashish (Director)**
2. Click **"Create Program"**
3. Fill in details and submit
4. ✅ Should work without errors!

---

## 🛠️ **RECOMMENDED OPTION: CLI Deployment (3 minutes)**

### Prerequisites
```bash
# Install Supabase CLI
npm install -g supabase

# OR with Homebrew (macOS)
brew install supabase/tap/supabase
```

### Quick Deploy
```bash
# 1. Make the script executable
chmod +x deploy-tai-function.sh

# 2. Run it!
./deploy-tai-function.sh
```

The script will:
- ✅ Check if Supabase CLI is installed
- ✅ Verify you're logged in
- ✅ Deploy the function
- ✅ Test the health endpoint
- ✅ Show next steps

### Manual CLI Deploy (if script doesn't work)
```bash
# 1. Login
supabase login

# 2. Deploy
supabase functions deploy rapid-responder --project-ref xspogpfohjmkykfjadhk

# 3. Test
curl https://xspogpfohjmkykfjadhk.supabase.co/functions/v1/rapid-responder/make-server-28f2f653/health
```

---

## 📋 **What's Included in the Function?**

The consolidated `index.ts` file includes:

### ✅ Core Routes:
- `GET /make-server-28f2f653/health` - Health check
- `GET /make-server-28f2f653/programs` - List programs
- `POST /make-server-28f2f653/programs` - Create program
- `GET /make-server-28f2f653/programs/:id` - Get program details
- `DELETE /make-server-28f2f653/programs/:id` - Delete program
- `POST /make-server-28f2f653/programs/:id/submit` - Submit response
- `GET /make-server-28f2f653/programs/:id/submissions` - Get submissions
- `PUT /make-server-28f2f653/submissions/:id/approve` - Approve submission
- `PUT /make-server-28f2f653/submissions/:id/reject` - Reject submission
- `GET /make-server-28f2f653/programs/:id/analytics` - Get analytics

### ✅ Features:
- Full CORS support
- Request logging
- Error handling
- TAI custom authentication (query params)
- Supabase auth support (JWT tokens)
- Role-based permissions

---

## 🧪 **Testing Checklist**

After deployment, test these in order:

### 1. Health Check
```bash
curl https://xspogpfohjmkykfjadhk.supabase.co/functions/v1/rapid-responder/make-server-28f2f653/health
```
✅ Should return: `{"status":"ok",...}`

### 2. List Programs (from TAI App)
- Login as Director
- Should see programs dashboard
- No errors in console

### 3. Create Program
- Click "Create Program"
- Fill in form
- Submit
- ✅ Should see success message

### 4. View Submissions
- Click on a program
- Click "Submissions" tab
- Should see list (or empty state)

---

## 🐛 **Troubleshooting**

### Issue: "NOT_FOUND" Error
**Cause:** Function not deployed or wrong URL

**Fix:** 
1. Redeploy using Option 1 (Copy & Paste)
2. Verify URL includes `/rapid-responder/make-server-28f2f653/`

### Issue: "401 Unauthorized" on health check
**Cause:** Health endpoint shouldn't require auth

**Fix:**
1. Check the function code has: `app.get("/make-server-28f2f653/health", ...)`
2. No auth middleware on health route

### Issue: Create program fails
**Cause:** Database permissions or missing fields

**Fix:**
1. Check browser console for error details
2. Verify you're logged in as Director
3. Check Supabase function logs

### View Function Logs:
```bash
supabase functions logs rapid-responder --project-ref xspogpfohjmkykfjadhk --follow
```

Or in dashboard:
```
https://supabase.com/dashboard/project/xspogpfohjmkykfjadhk/logs/edge-functions
```

---

## 📊 **Function Logs Location**

### CLI:
```bash
supabase functions logs rapid-responder --project-ref xspogpfohjmkykfjadhk
```

### Dashboard:
```
https://supabase.com/dashboard/project/xspogpfohjmkykfjadhk/logs/edge-functions
```

Look for:
- `[Programs POST] === CREATE PROGRAM REQUEST ===`
- `[Programs GET] === NEW REQUEST ===`
- Any error messages

---

## ✅ **Success Indicators**

You'll know it's working when:

1. ✅ Health endpoint returns 200 OK
2. ✅ TAI app loads without errors
3. ✅ Create program button works
4. ✅ Programs appear in dashboard
5. ✅ Function logs show successful requests

---

## 🎯 **Quick Links**

- **Function Dashboard:** https://supabase.com/dashboard/project/xspogpfohjmkykfjadhk/functions
- **Function Logs:** https://supabase.com/dashboard/project/xspogpfohjmkykfjadhk/logs/edge-functions
- **Health Check:** https://xspogpfohjmkykfjadhk.supabase.co/functions/v1/rapid-responder/make-server-28f2f653/health

---

## 📚 **Additional Resources**

- Full deployment guide: `/DEPLOY_INSTRUCTIONS.md`
- Deploy script: `/deploy-tai-function.sh`
- Function code: `/supabase/functions/rapid-responder/index.ts`

---

## 💡 **Pro Tips**

1. **Always check logs first** when debugging
2. **Test health endpoint** before testing app
3. **Use curl** to isolate frontend vs backend issues
4. **Monitor function invocations** in Supabase dashboard
5. **Deploy incrementally** - test after each change

---

## 🆘 **Need Help?**

1. Check function logs (see above)
2. Test health endpoint
3. Verify database tables exist
4. Check RLS policies
5. Review error messages in browser console

---

**Ready to deploy?** Start with Option 1 (Copy & Paste) - it's the fastest! 🚀
