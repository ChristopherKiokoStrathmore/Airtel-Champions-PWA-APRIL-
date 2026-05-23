# 🐛 Debugging 401 "Missing authorization header" Error

## ❌ **Current Error**
```json
{"code":401,"message":"Missing authorization header"}
```

This error means Supabase is returning a default 401 before your function code even runs.

---

## 🔍 **Root Cause**

The 401 error is likely caused by **ONE** of these:

1. ❌ Function not deployed at all
2. ❌ Function deployed to wrong slug
3. ❌ Function code has syntax error and won't start
4. ❌ Wrong URL being accessed

---

## ✅ **Step-by-Step Fix**

### **STEP 1: Check Which Functions Exist**

1. Go to: https://supabase.com/dashboard/project/xspogpfohjmkykfjadhk/functions

2. Look for a function named **`rapid-responder`**

3. **Is it there?**
   - ✅ **YES** → Continue to Step 2
   - ❌ **NO** → You need to create it first! Skip to "Create Function" section below

---

### **STEP 2: Test the Root Endpoint First**

Instead of testing the health endpoint, test the **ROOT** of the function:

```bash
curl https://xspogpfohjmkykfjadhk.supabase.co/functions/v1/rapid-responder/
```

**✅ Expected Response:**
```json
{
  "status": "online",
  "service": "TAI - Sales Intelligence Network API",
  "version": "1.0.0",
  "endpoints": {
    "health": "/make-server-28f2f653/health",
    "programs": "/make-server-28f2f653/programs"
  },
  "message": "Function is running! Use /make-server-28f2f653/health for health check"
}
```

**❌ If you still get 401:**
- Function isn't deployed correctly
- Go to Step 3

**✅ If you get the JSON above:**
- Function IS running!
- Now test health: 
  ```bash
  curl https://xspogpfohjmkykfjadhk.supabase.co/functions/v1/rapid-responder/make-server-28f2f653/health
  ```

---

### **STEP 3: Redeploy the Function**

The function exists but isn't working. Let's redeploy:

#### **Option A: Via Dashboard (FASTEST)**

1. **Go to:** https://supabase.com/dashboard/project/xspogpfohjmkykfjadhk/functions

2. **Click on** `rapid-responder`

3. **Click "Deploy new version"** or **"Edit"**

4. **Delete ALL existing code** in the editor

5. **Open this file:** `/supabase/functions/rapid-responder/index.ts`

6. **Copy EVERYTHING** (Ctrl+A, Ctrl+C)

7. **Paste into Supabase editor** (Ctrl+V)

8. **Click "Deploy"**

9. **Wait 30 seconds** for deployment

10. **Test again:**
    ```bash
    curl https://xspogpfohjmkykfjadhk.supabase.co/functions/v1/rapid-responder/
    ```

#### **Option B: Via CLI**

```bash
# Deploy the function
supabase functions deploy rapid-responder --project-ref xspogpfohjmkykfjadhk

# Test
curl https://xspogpfohjmkykfjadhk.supabase.co/functions/v1/rapid-responder/
```

---

### **STEP 4: Check Function Logs**

After deploying, check the logs to see if the function started:

#### **Via Dashboard:**
1. Go to: https://supabase.com/dashboard/project/xspogpfohjmkykfjadhk/logs/edge-functions
2. Look for `rapid-responder` logs
3. Look for errors or startup messages

#### **Via CLI:**
```bash
supabase functions logs rapid-responder --project-ref xspogpfohjmkykfjadhk
```

**Look for:**
- ✅ `[Root] Root endpoint called` → Function is working!
- ❌ `Error:` → Function has a bug
- ❌ Nothing → Function isn't running

---

## 🆕 **Create Function (If It Doesn't Exist)**

If `rapid-responder` doesn't exist in your functions list:

### **Via Dashboard:**

1. Go to: https://supabase.com/dashboard/project/xspogpfohjmkykfjadhk/functions

2. Click **"Create a new function"**

3. **Function name:** `rapid-responder`

4. **Delete** any template code

5. **Copy & Paste** the content from `/supabase/functions/rapid-responder/index.ts`

6. Click **"Deploy"**

### **Via CLI:**

```bash
# Create and deploy in one command
supabase functions deploy rapid-responder \
  --project-ref xspogpfohjmkykfjadhk \
  --source /supabase/functions/rapid-responder/index.ts
```

---

## 🧪 **Complete Test Sequence**

After deployment, test in this order:

### 1. Test Root (No auth needed)
```bash
curl https://xspogpfohjmkykfjadhk.supabase.co/functions/v1/rapid-responder/
```

**✅ Should return:** Info about the function

---

### 2. Test Health (No auth needed)
```bash
curl https://xspogpfohjmkykfjadhk.supabase.co/functions/v1/rapid-responder/make-server-28f2f653/health
```

**✅ Should return:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-03T...",
  "service": "TAI - Sales Intelligence Network API"
}
```

---

### 3. Test Programs List (No auth needed for empty list)
```bash
curl "https://xspogpfohjmkykfjadhk.supabase.co/functions/v1/rapid-responder/make-server-28f2f653/programs?role=director&user_id=test"
```

**✅ Should return:**
```json
{
  "success": true,
  "programs": []
}
```

---

### 4. Test in Browser

Open this URL in your browser:
```
https://xspogpfohjmkykfjadhk.supabase.co/functions/v1/rapid-responder/
```

You should see the JSON response directly in your browser.

---

## 🔧 **Alternative: Check Your Script**

You mentioned you "updated the script and run the test". Let's make sure the script is correct.

**Show me:**
1. What script did you run?
2. What was the exact command?
3. What was the full output?

This will help me identify if the issue is with deployment or URL.

---

## 💡 **Common Mistakes**

### ❌ Mistake 1: Wrong URL
```bash
# WRONG - missing function name
curl https://xspogpfohjmkykfjadhk.supabase.co/functions/v1/make-server-28f2f653/health

# CORRECT - includes function name
curl https://xspogpfohjmkykfjadhk.supabase.co/functions/v1/rapid-responder/make-server-28f2f653/health
```

### ❌ Mistake 2: Function Not Deployed
- Check functions list in dashboard
- Redeploy if missing

### ❌ Mistake 3: Old Code Still Running
- Delete old code completely
- Paste new code
- Deploy again

---

## 🎯 **Quick Fix Checklist**

```
□ Function 'rapid-responder' exists in dashboard
□ Function shows as "Active" or "Deployed"
□ Copied latest code from /supabase/functions/rapid-responder/index.ts
□ Deleted ALL old code before pasting
□ Waited 30 seconds after deployment
□ Tested root endpoint first (/)
□ Then tested health endpoint
□ Checked function logs for errors
```

---

## 📞 **Next Steps**

1. **Try the tests above** in order
2. **Share the results** with me:
   - What did the root endpoint return?
   - What did the health endpoint return?
   - Any errors in function logs?

3. **If still failing:**
   - Take a screenshot of your functions dashboard
   - Share the exact curl command you're using
   - Share the function logs

---

## ✅ **Expected Working State**

When everything is working:

```bash
# Test 1: Root
$ curl https://xspogpfohjmkykfjadhk.supabase.co/functions/v1/rapid-responder/
{"status":"online","service":"TAI - Sales Intelligence Network API"...}

# Test 2: Health
$ curl https://xspogpfohjmkykfjadhk.supabase.co/functions/v1/rapid-responder/make-server-28f2f653/health
{"status":"ok","timestamp":"2026-01-03T...","service":"TAI - Sales Intelligence Network API"}

# Test 3: Programs
$ curl "https://xspogpfohjmkykfjadhk.supabase.co/functions/v1/rapid-responder/make-server-28f2f653/programs?role=director&user_id=test"
{"success":true,"programs":[]}
```

---

**Try these tests and let me know the results!** 🚀
