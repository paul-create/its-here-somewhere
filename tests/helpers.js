const http = require('http');
const https = require('https');
const fs = require('fs');
const FormData = require('form-data');
const { Pool } = require('pg');
require('dotenv').config();

// Create direct DB connection for cleanup
const dbPool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false }
});

let authToken = null;
let homeId = null;
let testUserId = null;
let testDataToClean = {
  homes: [],
  users: [],
  categories: [],
  items: [],
  locations: [],
  photos: []
};

function setToken(token) {
  authToken = token;
}

function setHomeId(id) {
  homeId = id;
}

function setTestUserId(id) {
  testUserId = id;
}

function getHomeId() {
  return homeId;
}

function trackItem(entityType, id) {
  if (testDataToClean[entityType]) {
    testDataToClean[entityType].push(id);
  }
}

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
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

async function createTestHome() {
  const homeName = `Test-Home-${Date.now()}`;
  const res = await request('POST', '/api/auth/create-home', {
    name: homeName
  });
  
  if (res.status !== 201) {
    throw new Error(`Failed to create home: ${res.status} - ${JSON.stringify(res.body)}`);
  }
  
  const createdHomeId = res.body.home_id;
  setHomeId(createdHomeId);
  trackItem('homes', createdHomeId);
  
  return createdHomeId;
}

async function cleanup() {
  const summary = {
    items: 0,
    categories: 0,
    locations: 0,
    photos: 0,
    homes: 0,
    users: 0,
    errors: []
  };

  console.log('\nCleaning up test data...');

  try {
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

    // Delete homes directly from database
    // Homes cascade delete user_homes entries via FK
    for (const homeId of testDataToClean.homes) {
      try {
        await dbPool.query('DELETE FROM homes WHERE id = $1', [homeId]);
        summary.homes++;
      } catch (err) {
        summary.errors.push(`Failed to delete home ${homeId}: ${err.message}`);
      }
    }

    // Delete test user from database
    // This cascades to user_homes, activity_log, etc. via FKs
    if (testUserId) {
      try {
        await dbPool.query('DELETE FROM users WHERE id = $1', [testUserId]);
        summary.users++;
      } catch (err) {
        summary.errors.push(`Failed to delete user ${testUserId}: ${err.message}`);
      }
    }

    // Print summary
    console.log(`\n✓ Cleaned up:`);
    console.log(`  - ${summary.items} items`);
    console.log(`  - ${summary.categories} categories`);
    console.log(`  - ${summary.locations} locations`);
    console.log(`  - ${summary.photos} photos`);
    console.log(`  - ${summary.homes} homes`);
    console.log(`  - ${summary.users} users`);

    if (summary.errors.length > 0) {
      console.error('\n⚠ Cleanup errors:');
      summary.errors.forEach(err => console.error(`  - ${err}`));
    }
  } catch (err) {
    console.error('Fatal error during cleanup:', err.message);
    summary.errors.push(`Fatal cleanup error: ${err.message}`);
  } finally {
    // Close DB connection
    await dbPool.end();
  }

  // Reset tracker
  testDataToClean = { homes: [], users: [], categories: [], items: [], locations: [], photos: [] };
  authToken = null;
  homeId = null;
  testUserId = null;
  
  return summary;
}

function resetTracker() {
  testDataToClean = { homes: [], users: [], categories: [], items: [], locations: [], photos: [] };
}

const assert = require('assert');

module.exports = { 
  request, 
  setToken, 
  setHomeId,
  setTestUserId,
  getHomeId,
  uploadFile, 
  trackItem, 
  createTestHome,
  cleanup, 
  resetTracker, 
  assert 
};