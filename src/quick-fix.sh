#!/bin/bash

# Quick fix script - run this to apply the changes automatically
# Usage: bash quick-fix.sh

FILE="./components/programs/program-submit-modal.tsx"

echo "🔧 Applying fixes to program-submit-modal.tsx..."

# Fix #1: Update line 36 (shouldSkipField helper)
sed -i '36s/program.progressive_disclosure_enabled === true/program.progressive_disclosure_enabled !== false/' "$FILE"

# Fix #2: Replace lines 1296-1300 with the helper function call
# This is more complex, so we'll use perl for multi-line replacement
perl -i -p0e 's/const isSiteField = \/\^.*?_site_.*?test\(field\.field_name\);.*?const useProgressiveDisclosure = program\.progressive_disclosure_enabled.*?;.*?if \(isSiteField && useProgressiveDisclosure\) \{.*?return null;.*?\}/if (shouldSkipField(field)) {\n              return null;\n            }/s' "$FILE"

echo "✅ Fixes applied!"
echo "🔄 Now refresh your browser with Ctrl+Shift+R"
