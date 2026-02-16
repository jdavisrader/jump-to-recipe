#!/bin/bash
# Script to add position: 0 to test fixtures
# Part of explicit-position-persistence spec implementation (Task 3)

# Find all test files and add position to ingredient/instruction objects
find src -name "*.test.ts" -o -name "*.test.tsx" | while read file; do
  # Create backup
  cp "$file" "$file.bak"
  
  # Add position to ingredients (simple pattern)
  # This is a basic sed replacement - may need manual review
  sed -i '' 's/notes: '\'''\'' }/notes: '\''\'', position: 0 }/g' "$file"
  sed -i '' 's/notes: "" }/notes: "", position: 0 }/g' "$file"
  sed -i '' 's/notes: '\''[^'\'']*'\'' }/&/g' "$file" # Skip already processed
  
  # Add position to instructions
  sed -i '' 's/duration: [0-9]* }/&/g' "$file"
  
  echo "Processed: $file"
done

echo "Done! Backups created with .bak extension"
echo "Please review changes and remove .bak files if satisfied"
