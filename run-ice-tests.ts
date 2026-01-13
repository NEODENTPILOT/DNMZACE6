import { runAllTestCases } from './src/utils/iceCommunicationTestCases.js';

async function main() {
  console.log('\n🚀 Starting ICE v1.0 AI Communication Generator Tests...\n');

  try {
    await runAllTestCases();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test execution failed:', error);
    process.exit(1);
  }
}

main();
