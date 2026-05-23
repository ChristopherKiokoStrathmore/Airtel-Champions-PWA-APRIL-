# Clean up unnecessary files for deployment
Write-Host "Cleaning up project for deployment..."

# Files to keep (essential files only)
$keepFiles = @(
    "package.json",
    "package-lock.json", 
    "vite.config.ts",
    "index.html",
    "tsconfig.json",
    "vercel.json",
    ".vercelignore",
    ".env.example",
    "README.md",
    "src/",
    "public/",
    ".gitignore"
)

# Files/folders to remove
$removeItems = @(
    ".claude/",
    ".windsurf/",
    "_avast_/",
    "build/",
    "dist/",
    "node_modules/",
    "AGENTS.md",
    "CODESPACES.md",
    "DEPLOYMENT_GUIDE.md",
    "EVALUATOR_INSTRUCTIONS_UPDATED.md",
    "GITHUB_EDU_SETUP.md",
    "MCP-UAT-README.md",
    "VERCEL_DEPLOYMENT_CHECKLIST.md",
    "add-cube.js",
    "ai-edit.js",
    "analyze-code.js",
    "audit-dependencies.js",
    "check_installers.sql",
    "check_supabase_cors.bat",
    "complete-deployment-copy.ps1",
    "copy-deployment-files.ps1",
    "cors_configuration.sql",
    "curl",
    "debug-Sales-Executive.png",
    "deploy_and_launch.bat",
    "deploy_cors.bat",
    "deploy_cors_cli_commands.txt",
    "edit-login.js",
    "fix_remote_database.sql",
    "fix_uuid_bigint_mismatch.sql",
    "fix_webgl.js",
    "git",
    "hbb-dashboard-screenshot.png",
    "hbb-header-test.png",
    "hbb-my-leads-screenshot.png",
    "hbb-new-lead-screenshot.png",
    "hbb-ui-fix-verification.png",
    "infinite-uat-log.json",
    "launch_app.bat",
    "migrate_to_port_3001.bat",
    "run-uat-*.bat",
    "scripts/",
    "supabase/",
    "swe-integration-log.json",
    "test_dump.sql",
    "truncate*.js",
    "truncate*.py",
    "uat-*.json",
    "uat-debug-screenshot.png",
    "vercel-deployment/",
    "verification_checklist.md",
    "windsurf/",
    "*.png",
    "*.sql",
    "*.bat",
    "*.js",
    "*.json",
    "*.md"
)

# Remove unnecessary files
foreach ($item in $removeItems) {
    if (Test-Path $item) {
        Write-Host "Removing: $item"
        Remove-Item -Recurse -Force $item -ErrorAction SilentlyContinue
    }
}

# Keep only essential files
Write-Host "Project cleaned successfully!"
Write-Host "Essential files retained for deployment:"
