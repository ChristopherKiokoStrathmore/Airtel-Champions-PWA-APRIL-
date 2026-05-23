# Over-The-Air (OTA) Updates Guide for Airtel Champions

This guide explains how to push updates to your app instantly without deploying a new APK, using the newly implemented OTA system.

## Prerequisite: One-Time Setup

Before you can send your first OTA update, you need to "provision" your app to receive them.

### 1. Database Setup
Run the SQL script provided in `database/SETUP_OTA_UPDATES.sql` in your Supabase SQL Editor. This will:
- Create the `app_versions` table to track releases.
- Create the `app-updates` storage bucket to store your update bundles.
- Set up security policies.

### 2. Install the Plugin
In your local development environment (where you build the APK), run:

```bash
npm install @capgo/capacitor-updater
npx cap sync
```

### 3. Configure Capacitor
Add the following to your `capacitor.config.ts` (inside the `plugins` object):

```typescript
const config: CapacitorConfig = {
  // ... existing config
  plugins: {
    CapacitorUpdater: {
      autoUpdate: false, // We handle updates manually in UpdateManager.tsx
    }
  }
};
```

### 4. Build and Deploy the Base APK
Build your app and deploy the APK **one last time**. This version will have the `UpdateManager` code capable of receiving future updates.

---

## How to Release an OTA Update (Easy Way)

I have created a helper script to automate the process of updating the version and building the bundle.

1. Run the script:
   ```bash
   node scripts/prepare-update.js
   ```

2. Follow the prompts:
   - Enter the new version number (e.g., `1.0.2`).
   - Wait for the build to complete.
   - The script will generate a zip file in the `updates` folder.

3. Upload the zip file:
   - Go to Supabase Dashboard -> Storage -> `app-updates`.
   - Upload the generated zip file.
   - Click "Get URL" for the uploaded file.

4. Create Release Record:
   - Go to Supabase Dashboard -> Table Editor -> `app_versions`.
   - Insert a new row with the version number and the URL you just got.
   - **Important:** Make sure the version matches exactly what you entered in the script.

---

## How to Release an OTA Update (Manual Way)

If you prefer to do it manually:

### 1. Update Version Number
Open `components/update-manager.tsx` and increment the `CURRENT_VERSION` constant.

### 2. Build the Web Assets
Run the build command:
```bash
npm run build
```

### 3. Create the Zip Bundle
Zip the **contents** of the `dist` folder (not the folder itself).
- **Mac/Linux:** `cd dist && zip -r ../v1.0.1.zip . && cd ..`
- **Windows:** Select all files inside `dist`, right-click -> Send to -> Compressed (zipped) folder. Name it `v1.0.1.zip`.

### 4. Upload to Supabase Storage
1. Go to Supabase Dashboard -> Storage -> `app-updates`.
2. Upload your `v1.0.1.zip` file.
3. Click "Get URL" for the uploaded file.

### 5. Create Release Record
1. Go to Supabase Dashboard -> Table Editor -> `app_versions`.
2. Insert a new row:
   - **version:** `1.0.1` (Must match what you put in update-manager.tsx)
   - **bundle_url:** Paste the URL from Storage.
   - **release_notes:** "Added new feature X, fixed bug Y."
   - **is_mandatory:** `false` (or `true` if you want to force update).
   - **platform:** `android` (default).

### 6. Done!
Users will see the "New Update Available" prompt the next time they open the app.

## Troubleshooting

- **"Update Available" not showing?**
  - Check browser console logs for `[UpdateManager]`.
  - Ensure `CURRENT_VERSION` in the app is *lower* than the version in the database.
  - Ensure the `bundle_url` is publicly accessible.

- **Download fails?**
  - Ensure the user has internet connection.
  - Check CORS settings on the Storage bucket (usually configured correctly by default).

- **App crashes after update?**
  - Use the "Reset to Factory" feature (if implemented) or reinstall the APK.
  - Ensure your zip file contains `index.html` at the root, not inside a subfolder.
