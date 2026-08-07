# 📸 Supabase Storage Setup for TAI Program Photos

## Overview

This document explains the secure storage setup for program photo submissions in the TAI app. Photos are stored in a **private Supabase Storage bucket** with **Row Level Security (RLS) policies** to ensure data security and proper access control.

**IMPORTANT:** Since TAI uses **localStorage authentication** (not Supabase Auth), all storage operations are proxied through the backend server. This provides centralized authorization and better security.

---

## 🏗️ Architecture

### Storage Bucket
- **Name:** `make-28f2f653-program-photos`
- **Type:** Private (requires RLS policies)
- **File Size Limit:** 10MB
- **Allowed Types:** JPEG, PNG, JPG, WEBP

### Folder Structure
```
make-28f2f653-program-photos/
├── {programId}/
│   ├── {userId}/
│   │   ├── {timestamp}_{filename}.jpg
│   │   ├── {timestamp}_{filename}.jpg
│   │   └── ...
```

**Example:**
```
make-28f2f653-program-photos/
├── program-1736000000-abc123/
│   ├── user-12345/
│   │   ├── 1736500000000_photo1.jpg
│   │   ├── 1736500001000_photo2.jpg
```

---

## 🔒 Security: RLS Policy (Simplified)

Since TAI uses localStorage authentication instead of Supabase Auth, the security model is streamlined:

### Single RLS Policy: Service Role Full Access
- **Action:** ALL (SELECT, INSERT, UPDATE, DELETE)
- **Who:** Backend server only (using SERVICE_ROLE_KEY)
- **Rule:** Only the backend can access storage directly

### Authorization Flow
All user authorization happens in the **backend server**:

1. **Uploads:** Frontend → Server validates user → Server uploads to storage
2. **Viewing:** Frontend → Server validates user role → Server generates signed URL
3. **Deletion:** Admin request → Server validates admin role → Server deletes from storage

This architecture is **MORE SECURE** because:
- ✅ All auth logic is centralized in one place
- ✅ No direct client access to storage
- ✅ Server controls who gets signed URLs
- ✅ Easier to audit and modify permissions
- ✅ Works seamlessly with localStorage auth

---

## 🚀 Setup Instructions

### Step 1: The bucket is automatically created
The backend server automatically creates the bucket on startup. No manual action needed!

### Step 2: Apply RLS Policy (MANUAL - One Time Only)

1. **Go to Supabase SQL Editor:**
   ```
   https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new
   ```

2. **Copy the UPDATED SQL from:**
   ```
   /database/STORAGE-RLS-POLICIES.sql
   ```

3. **Paste and Run** the SQL in the Supabase dashboard

4. **Verify:**
   Run the verification queries at the bottom of the SQL file to confirm the policy is active.

---

## 🔄 How It Works

### Photo Upload Flow

1. **User fills out program form** and selects photos
2. **Frontend calls server endpoint:** 
   ```
   POST /make-server-28f2f653/programs/upload-photo
   FormData: { photo, user_id, program_id }
   ```
3. **Server validates user** from request data
4. **Server uploads using SERVICE_ROLE** (bypasses RLS)
5. **Server returns photo path:** `{programId}/{userId}/{timestamp}_{filename}.jpg`
6. **Frontend submits form** with photo paths included
7. **Submission stored in KV** with references to photo paths

### Photo Viewing Flow

1. **User/Admin views submissions**
2. **Frontend requests signed URLs:**
   ```
   POST /make-server-28f2f653/programs/get-signed-urls
   Body: { paths: [...] }
   ```
3. **Server generates signed URLs** (expires in 1 hour)
4. **Frontend displays photos** using signed URLs

### Authorization in Backend

The server checks user permissions before operations:
```typescript
// Example: Generate signed URLs only for authorized users
- SE can view their own photos
- ZSM/ZBM/HQ/Director can view all photos in their region/programs
- Server validates before generating URLs
```

---

## 📊 Access Control Matrix

| Role | Upload Own | View Own | View All | Delete |
|------|------------|----------|----------|--------|
| Sales Executive (SE) | ✅ (via server) | ✅ (via signed URL) | ❌ | ❌ |
| Zonal Sales Manager (ZSM) | ✅ (via server) | ✅ (via signed URL) | ✅ (via signed URL) | ✅ (via server) |
| Zonal Business Manager (ZBM) | ✅ (via server) | ✅ (via signed URL) | ✅ (via signed URL) | ✅ (via server) |
| HQ Command Center | ✅ (via server) | ✅ (via signed URL) | ✅ (via signed URL) | ✅ (via server) |
| Director | ✅ (via server) | ✅ (via signed URL) | ✅ (via signed URL) | ✅ (via server) |

**Note:** All operations go through the backend server, which enforces these permissions.

---

## 🛠️ API Endpoints

### Upload Photo
```typescript
POST /make-server-28f2f653/programs/upload-photo
Content-Type: multipart/form-data

FormData:
  - photo: File
  - user_id: string
  - program_id: string

Response:
{
  "success": true,
  "path": "program-123/user-456/1736500000000_photo.jpg",
  "url": "storage/make-28f2f653-program-photos/program-123/user-456/1736500000000_photo.jpg"
}
```

### Submit Program Response
```typescript
POST /make-server-28f2f653/programs/:id/submit
Content-Type: application/json

Body:
{
  "user_id": "user-123",
  "responses": { ... },
  "photos": ["program-123/user-456/1736500000000_photo.jpg"],
  "gps_location": { "latitude": -1.286389, "longitude": 36.817223 }
}

Response:
{
  "success": true,
  "submission": { ... },
  "points_pending": 100
}
```

---

## 🔍 Troubleshooting

### Issue: "new row violates row-level security policy"
**Solution:** RLS policies haven't been applied. Run `/database/STORAGE-RLS-POLICIES.sql`

### Issue: "Bucket not found"
**Solution:** Restart the backend server. The bucket is created on startup.

### Issue: "Failed to upload photo"
**Solution:** Check file size (max 10MB) and file type (JPEG, PNG, JPG, WEBP only)

### Issue: "Permission denied when viewing photo"
**Solution:** 
- For SE: Can only view own photos
- For Admins: Check role is correctly set in KV store under `user:{userId}`

---

## 📝 Notes

- **Private Bucket:** Photos are NOT publicly accessible. Signed URLs are required.
- **Auto-deletion:** Consider implementing a cleanup job for old photos (future enhancement)
- **EXIF Data:** Photo EXIF data is preserved (includes GPS from camera if available)
- **Compression:** Consider adding image compression in the future to save storage

---

## 🎯 Next Steps

1. ✅ Apply RLS policies (one-time setup)
2. ✅ Test photo upload from frontend
3. ✅ Test admin can view all photos
4. ✅ Test SE can only view own photos
5. 🔜 Build admin dashboard to review submissions with photos
6. 🔜 Add analytics dashboard showing photo submissions by program

---

**Last Updated:** January 5, 2026  
**Maintained By:** TAI Development Team