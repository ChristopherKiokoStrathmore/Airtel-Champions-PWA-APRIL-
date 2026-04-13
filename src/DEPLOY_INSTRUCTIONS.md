# 🚀 TAI Edge Function Deployment Guide

## 📦 **OPTION 1: Deploy Consolidated Single-File (FASTEST)**

### What is it?
A single `index.ts` file that contains all the essential programs routes in one place - no dependencies, no imports.

### Steps:

1. **Navigate to Supabase Dashboard:**
   ```
   https://supabase.com/dashboard/project/xspogpfohjmkykfjadhk/functions
   ```

2. **Click on** `rapid-responder` **function**

3. **Click "Deploy new version"**

4. **Copy the file:**
   - Source: `/supabase/functions/rapid-responder/index.ts`
   - Paste the entire contents into the Supabase editor

5. **Click "Deploy"**

6. **Test the health endpoint:**
   ```bash
   curl https://xspogpfohjmkykfjadhk.supabase.co/functions/v1/rapid-responder/make-server-28f2f653/health
   ```

   Should return:
   ```json
   {
     "status": "ok",
     "timestamp": "2026-01-03T...",
     "service": "TAI - Sales Intelligence Network API"
   }
   ```

---

## 🛠️ **OPTION 2: Deploy via Supabase CLI (RECOMMENDED)**

### Prerequisites:
```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Or with Homebrew (macOS)
brew install supabase/tap/supabase
```

### Steps:

1. **Login to Supabase:**
   ```bash
   supabase login
   ```

2. **Link to your project:**
   ```bash
   supabase link --project-ref xspogpfohjmkykfjadhk
   ```

3. **Deploy the function:**
   ```bash
   # From your project root directory
   supabase functions deploy rapid-responder --project-ref xspogpfohjmkykfjadhk
   ```

4. **Verify deployment:**
   ```bash
   # Check function logs
   supabase functions logs rapid-responder --project-ref xspogpfohjmkykfjadhk
   ```

5. **Test the health endpoint:**
   ```bash
   curl https://xspogpfohjmkykfjadhk.supabase.co/functions/v1/rapid-responder/make-server-28f2f653/health
   ```

---

## 🧪 **Testing After Deployment**

### 1. Test Health Check:
```bash
curl https://xspogpfohjmkykfjadhk.supabase.co/functions/v1/rapid-responder/make-server-28f2f653/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-03T15:30:00.000Z",
  "service": "TAI - Sales Intelligence Network API"
}
```

### 2. Test Programs Endpoint (List):
```bash
curl "https://xspogpfohjmkykfjadhk.supabase.co/functions/v1/rapid-responder/make-server-28f2f653/programs?role=director&user_id=YOUR_USER_ID" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

**Expected Response:**
```json
{
  "success": true,
  "programs": [...]
}
```

### 3. Test Create Program:
```bash
curl -X POST "https://xspogpfohjmkykfjadhk.supabase.co/functions/v1/rapid-responder/make-server-28f2f653/programs?user_id=YOUR_USER_ID&role=director" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Program",
    "description": "A test program",
    "category": "Network Experience",
    "icon": "📊",
    "color": "#EF4444",
    "points_value": 50,
    "target_roles": ["sales_executive"],
    "fields": [
      {
        "field_name": "site_name",
        "field_label": "Site Name",
        "field_type": "text",
        "is_required": true,
        "order_index": 0
      }
    ]
  }'
```

---

## 🔑 **Environment Variables**

Make sure these are set in your Supabase project:

```
SUPABASE_URL=https://xspogpfohjmkykfjadhk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

These should already be configured automatically in Supabase Edge Functions.

---

## 📊 **Function Logs**

### View real-time logs:
```bash
supabase functions logs rapid-responder --project-ref xspogpfohjmkykfjadhk --follow
```

### Or view in Supabase Dashboard:
```
https://supabase.com/dashboard/project/xspogpfohjmkykfjadhk/logs/edge-functions
```

---

## ⚡ **Quick Deploy Script**

Save this as `deploy.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Deploying TAI Edge Function..."

# Deploy function
supabase functions deploy rapid-responder --project-ref xspogpfohjmkykfjadhk

echo "✅ Deployment complete!"

echo "🧪 Testing health endpoint..."
curl https://xspogpfohjmkykfjadhk.supabase.co/functions/v1/rapid-responder/make-server-28f2f653/health

echo ""
echo "✅ All done! Your function is live."
```

Make it executable:
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## 🐛 **Troubleshooting**

### Issue: "NOT_FOUND" error
**Solution:** Function not deployed correctly. Redeploy using Option 1 or 2.

### Issue: "401 Unauthorized" on health endpoint
**Solution:** The health endpoint should NOT require auth. Check that the route is defined correctly.

### Issue: "Could not find the table 'public.programs'"
**Solution:** 
1. Verify database tables exist in Supabase
2. Check RLS policies
3. Verify SUPABASE_SERVICE_ROLE_KEY is set correctly

### Issue: Function deploys but routes don't work
**Solution:**
1. Check function logs for errors
2. Verify route prefixes match (`/make-server-28f2f653/`)
3. Test with curl commands above

---

## 📝 **Notes**

- The consolidated single-file (`/supabase/functions/rapid-responder/index.ts`) contains all essential routes
- No external dependencies or imports needed
- All routes are prefixed with `/make-server-28f2f653/`
- CORS is enabled for all routes
- Logging is enabled for debugging

---

## ✅ **Success Checklist**

- [ ] Function deployed successfully
- [ ] Health endpoint returns 200 OK
- [ ] Programs endpoint returns data (or empty array if no programs)
- [ ] Create program works from TAI app
- [ ] Logs show requests coming through
- [ ] No errors in function logs

---

## 🎯 **Next Steps After Deployment**

1. Test creating a program from TAI app as Director
2. Monitor function logs for any errors
3. Test all program routes (list, create, submit, etc.)
4. Verify submissions are being stored correctly
5. Check analytics endpoints

---

## 💡 **Pro Tips**

1. **Always check logs first** when debugging issues
2. **Use the health endpoint** to verify function is running
3. **Test with curl** before testing from the app
4. **Monitor function invocations** in Supabase Dashboard
5. **Keep the function simple** - add features incrementally

---

**Need Help?** Check the function logs or test endpoints with curl!
