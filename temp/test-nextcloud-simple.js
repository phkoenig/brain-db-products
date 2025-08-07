/**
 * Einfaches Nextcloud REST API Test-Script
 * 
 * Schneller Test der Authentifizierung und API-Zugriffe
 */

import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testNextcloudAuth() {
  console.log('🔍 Testing Nextcloud REST API Authentication...\n');
  
  const baseUrl = process.env.NEXTCLOUD_URL;
  const username = process.env.NEXTCLOUD_USERNAME;
  const password = process.env.NEXTCLOUD_PASSWORD;
  
  if (!baseUrl || !username || !password) {
    console.error('❌ Missing credentials in .env.local');
    console.log('Required: NEXTCLOUD_URL, NEXTCLOUD_USERNAME, NEXTCLOUD_PASSWORD');
    return;
  }
  
  console.log(`📡 Base URL: ${baseUrl}`);
  console.log(`👤 Username: ${username}`);
  console.log(`🔑 Password: ${password ? '***configured***' : 'NOT CONFIGURED'}\n`);
  
  // Create Basic Auth header
  const auth = Buffer.from(`${username}:${password}`).toString('base64');
  
  // Test 1: OCS API - User Info
  console.log('1️⃣ Testing OCS API - User Info...');
  try {
    const response = await fetch(`${baseUrl}/ocs/v1.php/cloud/users/current`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'OCS-APIRequest': 'true',
        'Content-Type': 'application/json',
      },
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.text();
      console.log(`   ✅ Success! User info retrieved`);
      console.log(`   Response: ${data.substring(0, 200)}...`);
    } else {
      console.log(`   ❌ Failed: ${response.statusText}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  console.log('');
  
  // Test 2: WebDAV - Root Folder
  console.log('2️⃣ Testing WebDAV - Root Folder...');
  try {
    const response = await fetch(`${baseUrl}/remote.php/dav/files/${username}/`, {
      method: 'PROPFIND',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Depth': '1',
        'Content-Type': 'application/xml',
      },
      body: `<?xml version="1.0" encoding="utf-8" ?>
<propfind xmlns="DAV:">
  <prop>
    <resourcetype/>
    <getcontentlength/>
    <getlastmodified/>
  </prop>
</propfind>`,
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.text();
      const itemMatches = data.match(/<d:response>/g);
      const itemCount = itemMatches ? itemMatches.length - 1 : 0;
      
      console.log(`   ✅ Success! Found ${itemCount} items in root folder`);
      console.log(`   Response preview: ${data.substring(0, 200)}...`);
    } else {
      console.log(`   ❌ Failed: ${response.statusText}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  console.log('');
  
  // Test 3: Specific Folder (ARCH)
  console.log('3️⃣ Testing Specific Folder (ARCH)...');
  try {
    const response = await fetch(`${baseUrl}/remote.php/dav/files/${username}/ARCH`, {
      method: 'PROPFIND',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Depth': '1',
        'Content-Type': 'application/xml',
      },
      body: `<?xml version="1.0" encoding="utf-8" ?>
<propfind xmlns="DAV:">
  <prop>
    <resourcetype/>
    <getcontentlength/>
    <getlastmodified/>
  </prop>
</propfind>`,
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.text();
      const itemMatches = data.match(/<d:response>/g);
      const itemCount = itemMatches ? itemMatches.length - 1 : 0;
      
      console.log(`   ✅ Success! Found ${itemCount} items in ARCH folder`);
      console.log(`   Response preview: ${data.substring(0, 200)}...`);
    } else {
      console.log(`   ❌ Failed: ${response.statusText}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  console.log('\n✅ Test completed!');
}

// Run the test
testNextcloudAuth().catch(console.error); 