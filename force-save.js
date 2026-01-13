// Force Bolt.new save - Run in browser console
// Druk F12, plak dit in de console en druk Enter

console.log('🔧 Forcing Bolt.new save conflict resolution...');

// Option 1: Try to click the save button programmatically
const saveButton = document.querySelector('button[data-testid="save-overwrite"]')
  || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Save and overwrite'));

if (saveButton) {
  console.log('✅ Found save button, clicking...');
  saveButton.click();
} else {
  console.log('❌ Save button not found');
}

// Option 2: Try to close the dialog and force save
const dialog = document.querySelector('[role="dialog"]');
if (dialog) {
  console.log('🚫 Closing dialog...');
  const closeButton = dialog.querySelector('button[aria-label="Close"]');
  if (closeButton) closeButton.click();
}

// Option 3: Trigger save via keyboard shortcut
console.log('⌨️ Triggering Ctrl+S...');
document.dispatchEvent(new KeyboardEvent('keydown', {
  key: 's',
  code: 'KeyS',
  ctrlKey: true,
  bubbles: true
}));

console.log('✅ Done! Check if save worked.');
