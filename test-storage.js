require('dotenv/config');
const { Storage } = require('@google-cloud/storage');

async function testStorage() {
  try {
    console.log('=== Testing Google Cloud Storage Connection ===\n');
    
    // Get credentials
    const credentialsJson = process.env.GOOGLE_CREDENTIALS_JSON;
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    
    if (!credentialsJson && !credentialsPath) {
      throw new Error('No credentials configured');
    }
    
    let credentials;
    if (credentialsJson) {
      console.log('Using GOOGLE_CREDENTIALS_JSON from environment');
      credentials = JSON.parse(credentialsJson);
    } else if (credentialsPath) {
      console.log('Using GOOGLE_APPLICATION_CREDENTIALS file path');
      const fs = require('fs');
      const content = fs.readFileSync(credentialsPath, 'utf8');
      credentials = JSON.parse(content);
    }
    
    console.log('Project ID:', credentials.project_id);
    console.log('Client Email:', credentials.client_email);
    console.log('Private Key (first 50 chars):', credentials.private_key.substring(0, 50));
    console.log('Has \\n in key?', credentials.private_key.includes('\\n'));
    console.log('\nFixing newlines...');
    
    // Fix newlines
    if (credentials.private_key && typeof credentials.private_key === 'string') {
      credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
    }
    
    console.log('After fix - Private Key (first 50 chars):', credentials.private_key.substring(0, 50));
    console.log('Has actual newlines?', credentials.private_key.includes('\n'));
    
    // Create storage client
    console.log('\nCreating Storage client...');
    const storage = new Storage({
      projectId: credentials.project_id,
      credentials: credentials,
    });
    
    // Test bucket access
    const bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET || 'gradeai-uploads';
    console.log('\nTesting bucket access:', bucketName);
    
    const bucket = storage.bucket(bucketName);
    const [exists] = await bucket.exists();
    
    if (!exists) {
      console.log('❌ Bucket does not exist or not accessible');
      console.log('\nTrying to list all buckets...');
      const [buckets] = await storage.getBuckets();
      console.log('Available buckets:');
      buckets.forEach(b => console.log('  -', b.name));
    } else {
      console.log('✅ Bucket exists and is accessible!');
      
      // Try to upload a test file
      console.log('\nTesting file upload...');
      const testFileName = `test-${Date.now()}.txt`;
      const testContent = Buffer.from('Hello from test!');
      
      const file = bucket.file(testFileName);
      await file.save(testContent, {
        metadata: {
          contentType: 'text/plain',
        },
      });
      
      console.log('✅ Test file uploaded successfully!');
      console.log('File URL:', `gs://${bucketName}/${testFileName}`);
      
      // Clean up
      console.log('\nCleaning up test file...');
      await file.delete();
      console.log('✅ Test file deleted');
    }
    
    console.log('\n=== All tests passed! ===');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nFull error:', error);
  }
}

testStorage();
