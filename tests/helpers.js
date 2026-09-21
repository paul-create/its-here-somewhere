const http = require('http');
const https = require('https');
const fs = require('fs');
const FormData = require('form-data');

let authToken = null;
let testDataToClean = {
  userIds: [],
  categoryIds: [],
  itemIds: [],
  locationIds: []
};

function setToken(token) {
  authToken = token;
}

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, 'http://192.168.1.146:3000');
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (authToken) {
      options.headers['Authorization'] = `Bearer ${authToken}`;
    }

    const protocol = url.protocol === 'https:' ? https : http;
    const req = protocol.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

function uploadFile(path, file) {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    
    if (file.path) {
      form.append('file', fs.createReadStream(file.path));
    } else if (file.buffer) {
      form.append('file', file.buffer, { filename: file.filename || 'photo.jpg', contentType: file.mimeType || 'image/jpeg' });
    }

    const url = new URL(path, 'http://192.168.1.146:3000');
    
    const options = {
      method: 'POST',
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${authToken}`
      }
    };

    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    form.pipe(req);
  });
}

function trackItem(entityType, id) {
  if (testDataToClean[entityType + 'Ids']) {
    testDataToClean[entityType + 'Ids'].push(id);
  }
}

async function cleanup() {
  console.log('\nCleaning up test data...');
  
  try {
    // Delete items (cascade deletes photos and tags)
    for (const itemId of testDataToClean.itemIds) {
      await request('DELETE', `/api/items/${itemId}`);
    }
    
    // Delete categories
    for (const categoryId of testDataToClean.categoryIds) {
      await request('DELETE', `/api/categories/${categoryId}`);
    }
    
    // Delete locations
    for (const locationId of testDataToClean.locationIds) {
      await request('DELETE', `/api/locations/${locationId}`);
    }
    
    console.log(`✓ Cleaned up ${testDataToClean.itemIds.length} items, ${testDataToClean.categoryIds.length} categories, ${testDataToClean.locationIds.length} locations`);
    
    // Reset
    testDataToClean = { userIds: [], categoryIds: [], itemIds: [], locationIds: [] };
  } catch (err) {
    console.error('Cleanup error:', err.message);
  }
}

const assert = require('assert');

module.exports = { request, setToken, uploadFile, trackItem, cleanup, assert };