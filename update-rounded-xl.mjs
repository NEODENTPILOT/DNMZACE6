import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

// Find all .tsx and .ts files with rounded-xl (but not rounded-xl preceded by another word like "hover:rounded-xl")
const files = execSync(
  'grep -r "rounded-xl" /tmp/cc-agent/60262110/project/src --include="*.tsx" --include="*.ts" -l',
  { encoding: 'utf-8' }
)
  .trim()
  .split('\n')
  .filter(Boolean);

console.log(`Found ${files.length} files to check for rounded-xl`);

let totalReplacements = 0;
let updatedFiles = 0;

files.forEach((file) => {
  try {
    let content = readFileSync(file, 'utf-8');
    const originalContent = content;

    // Replace rounded-xl with rounded-lg (but not if it's part of rounded-3xl or rounded-2xl which are already done)
    // Use word boundary to avoid partial matches
    content = content.replace(/\brounded-xl\b/g, 'rounded-lg');

    if (content !== originalContent) {
      writeFileSync(file, content, 'utf-8');
      const replacements = (originalContent.match(/\brounded-xl\b/g) || []).length;
      totalReplacements += replacements;
      updatedFiles++;
      console.log(`Updated ${file} (${replacements} replacements)`);
    }
  } catch (error) {
    console.error(`Error updating ${file}:`, error.message);
  }
});

console.log(`\nUpdated ${updatedFiles} files`);
console.log(`Total replacements: ${totalReplacements}`);
console.log('Done!');
