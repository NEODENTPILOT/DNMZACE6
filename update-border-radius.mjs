import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

// Find all .tsx and .ts files with rounded-2xl or rounded-3xl
const files = execSync(
  'grep -r "rounded-2xl\\|rounded-3xl" /tmp/cc-agent/60262110/project/src --include="*.tsx" --include="*.ts" -l',
  { encoding: 'utf-8' }
)
  .trim()
  .split('\n')
  .filter(Boolean);

console.log(`Found ${files.length} files to update`);

let totalReplacements = 0;

files.forEach((file) => {
  try {
    let content = readFileSync(file, 'utf-8');
    const originalContent = content;

    // Replace rounded-3xl with rounded-lg
    content = content.replace(/rounded-3xl/g, 'rounded-lg');

    // Replace rounded-2xl with rounded-lg
    content = content.replace(/rounded-2xl/g, 'rounded-lg');

    if (content !== originalContent) {
      writeFileSync(file, content, 'utf-8');
      const replacements = (originalContent.match(/rounded-3xl|rounded-2xl/g) || []).length;
      totalReplacements += replacements;
      console.log(`Updated ${file} (${replacements} replacements)`);
    }
  } catch (error) {
    console.error(`Error updating ${file}:`, error.message);
  }
});

console.log(`\nTotal replacements: ${totalReplacements}`);
console.log('Done!');
