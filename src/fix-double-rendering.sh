#!/bin/bash

# Quick fix script for double rendering issue
# This replaces the OLD skipping logic with the NEW helper function

echo "Fixing double rendering in program-submit-modal.tsx..."

# Backup the file first
cp /components/programs/program-submit-modal.tsx /components/programs/program-submit-modal.tsx.backup

# The fix: Find the old pattern checking code and replace with shouldSkipField()
# Line ~1291-1295 needs to be replaced

echo ""
echo "MANUAL STEPS REQUIRED:"
echo "======================================"
echo "1. Open /components/programs/program-submit-modal.tsx"
echo "2. Go to line ~1291 (search for 'SKIP Van Calendar site fields')"
echo "3. You'll see this OLD code:"
echo ""
echo "    const isSiteField = /^(monday|tuesday|..._site_\\d+\$/.test(field.field_name);"
echo "    const useProgressiveDisclosure = program.progressive_disclosure_enabled !== false;"
echo "    if (isSiteField && useProgressiveDisclosure) {"
echo "      return null;"
echo "    }"
echo ""
echo "4. Replace it with this NEW code:"
echo ""
echo "    if (shouldSkipField(field)) {"
echo "      return null;"
echo "    }"
echo ""
echo "5. Save and refresh browser"
echo "======================================"
echo ""
echo "This will fix the double rendering issue!"
