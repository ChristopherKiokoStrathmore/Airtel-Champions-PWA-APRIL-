# Complete deployment copy script
Write-Host "Creating complete Vercel deployment folder..."

# Remove existing deployment folder if it exists
if (Test-Path "vercel-deployment") {
    Remove-Item -Recurse -Force "vercel-deployment"
}

# Create directories
New-Item -ItemType Directory -Force -Path "vercel-deployment\src" | Out-Null
New-Item -ItemType Directory -Force -Path "vercel-deployment\public" | Out-Null
New-Item -ItemType Directory -Force -Path "vercel-deployment\src\components" | Out-Null
New-Item -ItemType Directory -Force -Path "vercel-deployment\src\components\hbb" | Out-Null
New-Item -ItemType Directory -Force -Path "vercel-deployment\src\components\app" | Out-Null
New-Item -ItemType Directory -Force -Path "vercel-deployment\src\components\calling" | Out-Null
New-Item -ItemType Directory -Force -Path "vercel-deployment\src\utils" | Out-Null
New-Item -ItemType Directory -Force -Path "vercel-deployment\src\assets" | Out-Null
New-Item -ItemType Directory -Force -Path "vercel-deployment\src\database" | Out-Null

# Copy essential config files
Copy-Item "package.json" "vercel-deployment\" -Force
Copy-Item "package-lock.json" "vercel-deployment\" -Force
Copy-Item "vite.config.ts" "vercel-deployment\" -Force
Copy-Item "index.html" "vercel-deployment\" -Force
Copy-Item "tsconfig.json" "vercel-deployment\" -Force
Copy-Item "vercel.json" "vercel-deployment\" -Force
Copy-Item ".vercelignore" "vercel-deployment\" -Force
Copy-Item ".env.example" "vercel-deployment\" -Force

# Copy public folder
if (Test-Path "public") {
    Copy-Item "public\*" "vercel-deployment\public\" -Recurse -Force
}

# Copy source files
Copy-Item "src\*.ts" "vercel-deployment\src\" -Force -ErrorAction SilentlyContinue
Copy-Item "src\*.tsx" "vercel-deployment\src\" -Force -ErrorAction SilentlyContinue
Copy-Item "src\*.js" "vercel-deployment\src\" -Force -ErrorAction SilentlyContinue
Copy-Item "src\*.jsx" "vercel-deployment\src\" -Force -ErrorAction SilentlyContinue

# Copy components
Copy-Item "src\components\*" "vercel-deployment\src\components\" -Recurse -Force -ErrorAction SilentlyContinue

# Copy utils
Copy-Item "src\utils\*" "vercel-deployment\src\utils\" -Recurse -Force -ErrorAction SilentlyContinue

# Copy assets
Copy-Item "src\assets\*" "vercel-deployment\src\assets\" -Recurse -Force -ErrorAction SilentlyContinue

# Copy database
Copy-Item "src\database\*" "vercel-deployment\src\database\" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Complete deployment folder created!"
Write-Host "Ready for Vercel deployment with all source files!"
