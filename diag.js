
import { db } from './lib/db.js';

async function test() {
  try {
    console.log('Attempting to count schoolDocuments...');
    const count = await db.schoolDocument.count();
    console.log('Success! Count:', count);
  } catch (err) {
    console.error('DIAGNOSTIC_ERROR_START');
    console.error(err);
    console.error('DIAGNOSTIC_ERROR_END');
  } finally {
    process.exit(0);
  }
}

test();
