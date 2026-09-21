const http = require('http');
const https = require('https');
const fs = require('fs');
const FormData = require('form-data');

let authToken = null;
let testDataToClean = {
  users: [],
  categories: [],
  items: [],
  locations: [],
  photos: []
};

function setToken(token) {
  authToken = token;
}

function trackItem(entityType, id) {
  if (testDataToClean[entityType]) {
    testDataToClean[entityType].push(id);
  }
}

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    // Use environment variable or default to local dev
    const backendUrl = process.env.BACKEND_URL || 'http://192.168.1.146:3000';
    const url = new URL(path, backendUrl);
    
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

    const backendUrl = process.env.BACKEND_URL || 'http://192.168.1.146:3000';
    const url = new URL(path, backendUrl);
    
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

async function cleanup() {
  const summary = {
    items: 0,
    categories: 0,
    locations: 0,
    photos: 0,
    errors: []
  };

  console.log('\nCleaning up test data...');

  // Delete items (cascade deletes photos and tags)
  for (const itemId of testDataToClean.items) {
    try {
      await request('DELETE', `/api/items/${itemId}`);
      summary.items++;
    } catch (err) {
      summary.errors.push(`Failed to delete item ${itemId}: ${err.message}`);
    }
  }

  // Delete photos (if any weren't cascade deleted)
  for (const photoId of testDataToClean.photos) {
    try {
      await request('DELETE', `/api/photos/${photoId}`);
      summary.photos++;
    } catch (err) {
      summary.errors.push(`Failed to delete photo ${photoId}: ${err.message}`);
    }
  }

  // Delete categories
  for (const categoryId of testDataToClean.categories) {
    try {
      await request('DELETE', `/api/categories/${categoryId}`);
      summary.categories++;
    } catch (err) {
      summary.errors.push(`Failed to delete category ${categoryId}: ${err.message}`);
    }
  }

  // Delete locations
  for (const locationId of testDataToClean.locations) {
    try {
      await request('DELETE', `/api/locations/${locationId}`);
      summary.locations++;
    } catch (err) {
      summary.errors.push(`Failed to delete location ${locationId}: ${err.message}`);
    }
  }

  // Print summary
  console.log(`✓ Cleaned: ${summary.items} items, ${summary.categories} categories, ${summary.locations} locations, ${summary.photos} photos`);
  if (summary.errors.length > 0) {
    console.error('⚠ Cleanup errors:');
    summary.errors.forEach(err => console.error(`  - ${err}`));
  }

  // Reset tracker
  testDataToClean = { users: [], categories: [], items: [], locations: [], photos: [] };
  return summary;
}

function resetTracker() {
  testDataToClean = { users: [], categories: [], items: [], locations: [], photos: [] };
}

const assert = require('assert');

module.exports = { request, setToken, uploadFile, trackItem, cleanup, resetTracker, assert };