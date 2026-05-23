const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const UPDATE_MANAGER_PATH = path.join(__dirname, '../components/update-manager.tsx');
const DIST_PATH = path.join(__dirname, '../dist');
const OUTPUT_DIR = path.join(__dirname, '../updates');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR);
}

// 1. Read current version from UpdateManager
console.log('🔍 Reading current version...');
const updateManagerContent = fs.readFileSync(UPDATE_MANAGER_PATH, 'utf8');
const versionMatch = updateManagerContent.match(/const CURRENT_VERSION = '([^']+)';/);

if (!versionMatch) {
  console.error('❌ Could not find CURRENT_VERSION in components/update-manager.tsx');
  process.exit(1);
}

const currentVersion = versionMatch[1];
console.log(`✅ Current version is: ${currentVersion}`);

// 2. Ask for new version
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

readline.question(`Enter new version (current is ${currentVersion}): `, (newVersion) => {
  if (!newVersion) {
    console.log('❌ Version is required');
    readline.close();
    return;
  }

  // 3. Update version in file
  console.log(`📝 Updating version to ${newVersion}...`);
  const newContent = updateManagerContent.replace(
    `const CURRENT_VERSION = '${currentVersion}';`,
    `const CURRENT_VERSION = '${newVersion}';`
  );
  fs.writeFileSync(UPDATE_MANAGER_PATH, newContent);

  // 4. Build project
  console.log('🏗️  Building project (this may take a minute)...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Build failed');
    // Revert version change
    fs.writeFileSync(UPDATE_MANAGER_PATH, updateManagerContent);
    readline.close();
    return;
  }

  // 5. Create Zip
  console.log('📦 Creating update bundle...');
  const zipFileName = `v${newVersion}.zip`;
  const zipPath = path.join(OUTPUT_DIR, zipFileName);

  try {
    // Check if zip is available
    execSync('zip --version', { stdio: 'ignore' });
    
    // Create zip from dist folder content
    // We need to cd into dist so the zip doesn't contain the dist folder itself
    execSync(`cd "${DIST_PATH}" && zip -r "${zipPath}" .`, { stdio: 'inherit' });
    
    console.log(`\n✅ Success! Update bundle created at: ${zipPath}`);
    console.log(`\n🚀 NEXT STEPS:`);
    console.log(`1. Upload ${zipFileName} to your 'app-updates' storage bucket in Supabase`);
    console.log(`2. Get the public URL of the uploaded file`);
    console.log(`3. Insert a row in 'app_versions' table:`);
    console.log(`   - version: ${newVersion}`);
    console.log(`   - bundle_url: <your-public-url>`);
    console.log(`   - release_notes: "Description of your changes"`);
    
  } catch (error) {
    console.error('❌ Failed to create zip. Make sure "zip" is installed on your system.');
    console.error('   You can manually zip the contents of the "dist" folder.');
  }

  readline.close();
});
