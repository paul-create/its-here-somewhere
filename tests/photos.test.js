require('dotenv').config();

const { request, setToken, assert } = require('./helpers');
const dataset = require('./fixtures/photo-golden-dataset');

function calculatePrecision(predicted, expected) {
  if (predicted.length === 0) return 0;
  const correct = predicted.filter(t => 
    expected.some(e => e.includes(t) || t.includes(e))
  ).length;
  return correct / predicted.length;
}

function calculateRecall(predicted, expected) {
  if (expected.length === 0) return 1;
  const correct = expected.filter(e =>
    predicted.some(p => e.includes(p) || p.includes(e))
  ).length;
  return correct / expected.length;
}

async function runPhotoTests(token) {
  console.log('Starting photo tagging tests...\n');
  
  setToken(token);
  const timestamp = Date.now();
  let results = [];

  try {
    // Setup: create category and items for testing
    const catRes = await request('POST', '/api/categories', {
      name: `PhotoTestCat-${timestamp}`,
      is_private: false
    });
    const categoryId = catRes.body.id;

    console.log('Testing photo tagging on golden dataset:\n');

    for (const testItem of dataset.items) {
      console.log(`Testing: ${testItem.name}`);

      // Create test item
      const itemRes = await request('POST', '/api/items', {
        name: `${testItem.name}-${timestamp}`,
        category_id: categoryId
      });
      const itemId = itemRes.body.id;

      // Tag from local image
      const { tagPhoto } = require('../src/utils/claude');
      const imageData = dataset.getImageDataUrl(testItem.imageFile);
      
      // Handle both object and string returns
      const dataUrl = typeof imageData === 'string' ? imageData : imageData.dataUrl;
      const mimeType = typeof imageData === 'string' ? 'image/jpeg' : imageData.mimeType;

      const predictedTags = await tagPhoto(dataUrl, mimeType);

      // Calculate metrics
      const precision = calculatePrecision(predictedTags, testItem.expectedTags);
      const recall = calculateRecall(predictedTags, testItem.expectedTags);
      const f1 = 2 * (precision * recall) / (precision + recall || 1);

      results.push({
        item: testItem.name,
        predicted: predictedTags,
        expected: testItem.expectedTags,
        precision: precision.toFixed(2),
        recall: recall.toFixed(2),
        f1: f1.toFixed(2)
      });

      console.log(`  Predicted: ${predictedTags.join(', ')}`);
      console.log(`  Expected: ${testItem.expectedTags.join(', ')}`);
      console.log(`  Precision: ${(precision * 100).toFixed(1)}%, Recall: ${(recall * 100).toFixed(1)}%, F1: ${(f1).toFixed(2)}\n`);
    }

    // Summary
    const avgPrecision = (results.reduce((sum, r) => sum + parseFloat(r.precision), 0) / results.length).toFixed(2);
    const avgRecall = (results.reduce((sum, r) => sum + parseFloat(r.recall), 0) / results.length).toFixed(2);
    const avgF1 = (results.reduce((sum, r) => sum + parseFloat(r.f1), 0) / results.length).toFixed(2);

    console.log('=== Photo Tagging Summary ===');
    console.log(`Items tested: ${results.length}`);
    console.log(`Average Precision: ${avgPrecision}`);
    console.log(`Average Recall: ${avgRecall}`);
    console.log(`Average F1: ${avgF1}\n`);

    console.log('Photo tagging tests passed!');
  } catch (err) {
    console.error('Test failed:', err.message);
    process.exit(1);
  }
}

async function runPhotoUploadTest(token) {
  console.log('\nStarting photo upload endpoint test...\n');
  
  setToken(token);
  const timestamp = Date.now();

  try {
    // Setup: create category and item
    const catRes = await request('POST', '/api/categories', {
      name: `PhotoUploadCat-${timestamp}`,
      is_private: false
    });
    const categoryId = catRes.body.id;

    const itemRes = await request('POST', '/api/items', {
      name: `Upload Test Item-${timestamp}`,
      category_id: categoryId
    });
    const itemId = itemRes.body.id;

    // Read a test image from fixtures
    const fs = require('fs');
    const path = require('path');
    const imagePath = path.join(__dirname, 'fixtures', 'images', 'hammer.jpeg');
    const imageBuffer = fs.readFileSync(imagePath);

    // Upload photo (multipart/form-data)
    console.log('1. Testing POST /api/photos (multipart upload)');
    
    const uploadRes = await new Promise((resolve, reject) => {
      const url = new URL(`/api/photos?itemId=${itemId}`, 'http://localhost:3000');
      const options = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data; boundary=----boundary'
        }
      };

      const boundary = '----boundary';
      const body = [
        `--${boundary}`,
        'Content-Disposition: form-data; name="file"; filename="hammer.jpg"',
        'Content-Type: image/jpeg',
        '',
        imageBuffer.toString('binary'),
        `--${boundary}--`
      ].join('\r\n');

      const req = require('http').request(url, options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, body: data });
          }
        });
      });

      req.on('error', reject);
      req.write(body, 'binary');
      req.end();
    });

    if (uploadRes.status !== 201) {
      console.error('Upload failed - Status:', uploadRes.status, 'Body:', uploadRes.body);
    }
    assert.strictEqual(uploadRes.status, 201, `Upload failed with status ${uploadRes.status}`);
    assert(uploadRes.body.photoId, 'Should return photoId');
    assert(uploadRes.body.s3Url, 'Should return s3Url');
    assert(Array.isArray(uploadRes.body.tags), 'Should return tags array');
    assert(uploadRes.body.tags.length > 0, 'Should have at least one tag');
    console.log(`✓ Photo uploaded successfully`);
    console.log(`  Photo ID: ${uploadRes.body.photoId}`);
    console.log(`  Tags: ${uploadRes.body.tags.join(', ')}\n`);

    console.log('Photo upload endpoint test passed!');
  } catch (err) {
    console.error('Test failed:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  console.error('Run via test suite');
  process.exit(1);
}

module.exports = { runPhotoTests, runPhotoUploadTest };