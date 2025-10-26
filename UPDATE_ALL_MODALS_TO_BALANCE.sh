#!/bin/bash

# This script updates all modal components to use the new balance consumption system

echo "🔄 Updating all modal components to use useBalanceConsumption..."

# List of files to update
FILES=(
  "src/components/editor/AIRewriterModal.jsx"
  "src/components/editor/AffilifyModal.jsx"
  "src/components/editor/AudioFromTextModal.jsx"
  "src/components/editor/BrandItModal.jsx"
  "src/components/editor/CtaTemplateFillModal.jsx"
  "src/components/editor/FaqGeneratorModal.jsx"
  "src/components/editor/HTMLCleanupModal.jsx"
  "src/components/editor/ImageLibraryModal.jsx"
  "src/components/editor/LocalizeModal.jsx"
  "src/components/editor/MediaLibraryModal.jsx"
  "src/components/editor/RunWorkflowModal.jsx"
  "src/components/editor/SEOSettingsModal.jsx"
  "src/components/editor/SitemapLinkerModal.jsx"
  "src/components/editor/TestimonialLibraryModal.jsx"
  "src/components/editor/TldrGeneratorModal.jsx"
  "src/components/editor/VideoLibraryModal.jsx"
  "src/components/editor/VoiceDictationModal.jsx"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✓ Updating $file..."
    
    # Replace import statement
    sed -i '' 's/useTokenConsumption/useBalanceConsumption/g' "$file"
    sed -i '' 's/@\/components\/hooks\/useTokenConsumption/@\/components\/hooks\/useBalanceConsumption/g' "$file"
    
    # Replace function calls
    sed -i '' 's/consumeTokensForFeature/consumeBalanceForFeature/g' "$file"
    sed -i '' 's/consumeTokensOptimistic/consumeBalanceOptimistic/g' "$file"
    sed -i '' 's/isCheckingTokens/isCheckingBalance/g' "$file"
    
  else
    echo "  ⚠️  File not found: $file"
  fi
done

echo "✅ All modal components updated!"
echo ""
echo "Next steps:"
echo "1. Review the changes with: git diff"
echo "2. Test each modal to ensure balance consumption works"
echo "3. Commit the changes: git commit -am 'fix: migrate all modals to useBalanceConsumption'"

