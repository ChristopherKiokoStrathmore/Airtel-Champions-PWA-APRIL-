# PowerShell script to copy deployment files
Write-Host "Creating Vercel deployment folder..."

# Create directories if they don't exist
New-Item -ItemType Directory -Force -Path "vercel-deployment\src" | Out-Null
New-Item -ItemType Directory -Force -Path "vercel-deployment\public" | Out-Null

# Copy essential files
Copy-Item "package.json" "vercel-deployment\" -Force
Copy-Item "package-lock.json" "vercel-deployment\" -Force
Copy-Item "vite.config.ts" "vercel-deployment\" -Force
Copy-Item "index.html" "vercel-deployment\" -Force
Copy-Item "tsconfig.json" "vercel-deployment\" -Force
Copy-Item "vercel.json" "vercel-deployment\" -Force
Copy-Item ".vercelignore" "vercel-deployment\" -Force

# Copy source code
Copy-Item "src\*" "vercel-deployment\src\" -Recurse -Force

# Copy public folder
Copy-Item "public\*" "vercel-deployment\public\" -Recurse -Force

# Copy .env.example
if (Test-Path ".env.example") {
    Copy-Item ".env.example" "vercel-deployment\" -Force
}

Write-Host "Deployment files copied successfully!"
Write-Host "Ready for Vercel deployment!"
