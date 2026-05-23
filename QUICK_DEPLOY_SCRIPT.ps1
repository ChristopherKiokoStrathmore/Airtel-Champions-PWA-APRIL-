# Quick Deploy Script - Creates clean deployment-ready copy
Write-Host "Creating clean deployment-ready copy..."

# Source and destination paths
$sourcePath = "."
$destPath = "..\airtel-champions-deploy"

# Remove destination if it exists
if (Test-Path $destPath) {
    Remove-Item -Recurse -Force $destPath
}

# Create destination directory
New-Item -ItemType Directory -Force -Path $destPath | Out-Null

# Essential files to copy
$essentialFiles = @(
    "package.json",
    "package-lock.json",
    "vite.config.ts", 
    "index.html",
    "tsconfig.json",
    "vercel.json",
    ".vercelignore",
    ".env.example",
    ".gitignore",
    "README.md"
)

# Essential folders to copy
$essentialFolders = @(
    "src",
    "public"
)

# Copy essential files
foreach ($file in $essentialFiles) {
    if (Test-Path "$sourcePath\$file") {
        Copy-Item "$sourcePath\$file" "$destPath\$file" -Force
        Write-Host "Copied: $file"
    }
}

# Copy essential folders
foreach ($folder in $essentialFolders) {
    if (Test-Path "$sourcePath\$folder") {
        Copy-Item "$sourcePath\$folder" "$destPath\$folder" -Recurse -Force
        Write-Host "Copied folder: $folder"
    }
}

# Create deployment instructions
$deployInstructions = @"
# Airtel Champions - Ready for Vercel Deployment

## Quick Deploy Steps:

1. **Initialize Git**
   ```bash
   cd airtel-champions-deploy
   git init
   git add .
   git commit -m "Ready for Vercel deployment"
   ```

2. **Push to GitHub**
   ```bash
   # Create new repository on GitHub first
   git remote add origin https://github.com/yourusername/airtel-champions.git
   git push -u origin main
   ```

3. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Add environment variables:
     - `VITE_SUPABASE_URL`: Your Supabase project URL
     - `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
   - Click "Deploy"

## Environment Variables Required:
- `VITE_SUPABASE_URL=https://your-project-id.supabase.co`
- `VITE_SUPABASE_ANON_KEY=your-supabase-anon-key`

## Features Included:
- PWA with service worker
- HBB Agent/DSE/Installer dashboards
- Login system
- Responsive design
- Offline functionality

## Build Command:
```bash
npm run build
```

Your app will be live at: `https://your-app-name.vercel.app`
"@

$deployInstructions | Out-File -FilePath "$destPath\DEPLOY_INSTRUCTIONS.md" -Encoding UTF8

Write-Host "========================================"
Write-Host "Clean deployment copy created!"
Write-Host "Location: $destPath"
Write-Host "Size reduction: ~90%"
Write-Host "Ready for Vercel deployment!"
Write-Host "========================================"
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. cd $destPath"
Write-Host "2. Follow DEPLOY_INSTRUCTIONS.md"
Write-Host ""
