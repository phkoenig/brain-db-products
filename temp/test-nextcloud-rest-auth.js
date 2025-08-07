/**
 * Nextcloud REST API Authentifizierung Test-Script
 * 
 * Testet verschiedene Authentifizierungsmethoden für Nextcloud REST-API:
 * 1. HTTP Basic Auth mit normalem Passwort
 * 2. HTTP Basic Auth mit App-spezifischem Passwort
 * 3. OCS API Endpoints
 * 4. WebDAV Endpoints
 */

import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config({ path: '.env.local' });

class NextcloudAuthTester {
  constructor() {
    this.baseUrl = process.env.NEXTCLOUD_URL;
    this.username = process.env.NEXTCLOUD_USERNAME;
    this.password = process.env.NEXTCLOUD_PASSWORD;
    
    if (!this.baseUrl || !this.username || !this.password) {
      throw new Error('Nextcloud credentials not configured in .env.local');
    }
    
    console.log('🔧 Nextcloud Auth Tester initialized');
    console.log(`📡 Base URL: ${this.baseUrl}`);
    console.log(`👤 Username: ${this.username}`);
    console.log(`🔑 Password: ${this.password ? '***configured***' : 'NOT CONFIGURED'}`);
    console.log('');
  }

  /**
   * Create Basic Auth header
   */
  createBasicAuthHeader(username, password) {
    const auth = Buffer.from(`${username}:${password}`).toString('base64');
    return `Basic ${auth}`;
  }

  /**
   * Test OCS API endpoints
   */
  async testOCSAPI() {
    console.log('🔍 Testing OCS API endpoints...');
    
    const endpoints = [
      '/ocs/v1.php/cloud/users/current',
      '/ocs/v1.php/cloud/capabilities',
      '/ocs/v2.php/cloud/users/current',
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`\n📡 Testing: ${endpoint}`);
        
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          method: 'GET',
          headers: {
            'Authorization': this.createBasicAuthHeader(this.username, this.password),
            'OCS-APIRequest': 'true',
            'Content-Type': 'application/json',
            'User-Agent': 'Nextcloud-Auth-Tester/1.0',
          },
        });

        console.log(`   Status: ${response.status} ${response.statusText}`);
        console.log(`   Headers:`, Object.fromEntries(response.headers.entries()));
        
        if (response.ok) {
          const data = await response.text();
          console.log(`   ✅ Success! Response preview:`, data.substring(0, 200) + '...');
        } else {
          console.log(`   ❌ Failed: ${response.statusText}`);
        }
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }
  }

  /**
   * Test WebDAV endpoints
   */
  async testWebDAV() {
    console.log('\n🔍 Testing WebDAV endpoints...');
    
    const endpoints = [
      '/remote.php/dav/files/',
      '/remote.php/dav/files/' + this.username,
      '/remote.php/dav/files/' + this.username + '/',
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`\n📡 Testing: ${endpoint}`);
        
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          method: 'PROPFIND',
          headers: {
            'Authorization': this.createBasicAuthHeader(this.username, this.password),
            'Depth': '0',
            'Content-Type': 'application/xml',
            'User-Agent': 'Nextcloud-Auth-Tester/1.0',
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
        console.log(`   Headers:`, Object.fromEntries(response.headers.entries()));
        
        if (response.ok) {
          const data = await response.text();
          console.log(`   ✅ Success! Response preview:`, data.substring(0, 200) + '...');
        } else {
          console.log(`   ❌ Failed: ${response.statusText}`);
        }
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }
  }

  /**
   * Test specific folder access
   */
  async testFolderAccess() {
    console.log('\n🔍 Testing folder access...');
    
    const testPaths = [
      '/',
      '/ARCH',
      '/ARCH/F16 - Fontaneallee 16 - Zeuthen',
    ];

    for (const path of testPaths) {
      try {
        console.log(`\n📡 Testing folder: ${path}`);
        
        const endpoint = `/remote.php/dav/files/${this.username}${path}`;
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          method: 'PROPFIND',
          headers: {
            'Authorization': this.createBasicAuthHeader(this.username, this.password),
            'Depth': '1',
            'Content-Type': 'application/xml',
            'User-Agent': 'Nextcloud-Auth-Tester/1.0',
          },
          body: `<?xml version="1.0" encoding="utf-8" ?>
<propfind xmlns="DAV:">
  <prop>
    <resourcetype/>
    <getcontentlength/>
    <getlastmodified/>
    <getcontenttype/>
    <getetag/>
  </prop>
</propfind>`,
        });

        console.log(`   Status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          const data = await response.text();
          
          // Parse XML response to count items
          const itemMatches = data.match(/<d:response>/g);
          const itemCount = itemMatches ? itemMatches.length - 1 : 0; // -1 for the folder itself
          
          console.log(`   ✅ Success! Found ${itemCount} items`);
          console.log(`   Response preview:`, data.substring(0, 300) + '...');
        } else {
          console.log(`   ❌ Failed: ${response.statusText}`);
        }
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }
  }

  /**
   * Test with different authentication methods
   */
  async testDifferentAuthMethods() {
    console.log('\n🔍 Testing different authentication methods...');
    
    const authMethods = [
      {
        name: 'Basic Auth (normal)',
        headers: {
          'Authorization': this.createBasicAuthHeader(this.username, this.password),
          'OCS-APIRequest': 'true',
        }
      },
      {
        name: 'Basic Auth (no OCS header)',
        headers: {
          'Authorization': this.createBasicAuthHeader(this.username, this.password),
        }
      },
      {
        name: 'Basic Auth (with User-Agent)',
        headers: {
          'Authorization': this.createBasicAuthHeader(this.username, this.password),
          'OCS-APIRequest': 'true',
          'User-Agent': 'Nextcloud-Auth-Tester/1.0',
        }
      }
    ];

    const testEndpoint = '/ocs/v1.php/cloud/users/current';

    for (const method of authMethods) {
      try {
        console.log(`\n📡 Testing: ${method.name}`);
        
        const response = await fetch(`${this.baseUrl}${testEndpoint}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...method.headers,
          },
        });

        console.log(`   Status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          const data = await response.text();
          console.log(`   ✅ Success! Response preview:`, data.substring(0, 200) + '...');
        } else {
          console.log(`   ❌ Failed: ${response.statusText}`);
        }
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🚀 Starting Nextcloud REST API Authentication Tests');
    console.log('=' .repeat(60));
    
    try {
      await this.testOCSAPI();
      await this.testWebDAV();
      await this.testFolderAccess();
      await this.testDifferentAuthMethods();
      
      console.log('\n✅ All tests completed!');
      
    } catch (error) {
      console.error('\n❌ Test execution failed:', error);
    }
  }
}

// Run the tests
async function main() {
  try {
    const tester = new NextcloudAuthTester();
    await tester.runAllTests();
  } catch (error) {
    console.error('❌ Failed to initialize tester:', error.message);
    console.log('\n💡 Make sure your .env.local file contains:');
    console.log('   NEXTCLOUD_URL=https://your-nextcloud.com');
    console.log('   NEXTCLOUD_USERNAME=your-username');
    console.log('   NEXTCLOUD_PASSWORD=your-password');
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

// Also run if called directly
main();

export default NextcloudAuthTester; 