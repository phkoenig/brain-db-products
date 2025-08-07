/**
 * Erweiterter Nextcloud REST API Test
 * 
 * Testet alternative REST-API-Endpoints und Performance-Vergleiche
 */

import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config({ path: '.env.local' });

class AdvancedNextcloudTester {
  constructor() {
    this.baseUrl = process.env.NEXTCLOUD_URL;
    this.username = process.env.NEXTCLOUD_USERNAME;
    this.password = process.env.NEXTCLOUD_PASSWORD;
    
    if (!this.baseUrl || !this.username || !this.password) {
      throw new Error('Nextcloud credentials not configured in .env.local');
    }
    
    console.log('🔧 Advanced Nextcloud REST API Tester initialized');
    console.log(`📡 Base URL: ${this.baseUrl}`);
    console.log(`👤 Username: ${this.username}`);
    console.log('');
  }

  createBasicAuthHeader(username, password) {
    const auth = Buffer.from(`${username}:${password}`).toString('base64');
    return `Basic ${auth}`;
  }

  /**
   * Test alternative OCS API endpoints
   */
  async testAlternativeOCS() {
    console.log('🔍 Testing Alternative OCS API endpoints...');
    
    const endpoints = [
      // Standard OCS endpoints
      '/ocs/v1.php/cloud/users/current',
      '/ocs/v1.php/cloud/capabilities',
      
      // Alternative user endpoints
      '/ocs/v1.php/cloud/user',
      '/ocs/v2.php/cloud/user',
      
      // Files API endpoints (newer)
      '/ocs/v1.php/apps/files/api/v1/files',
      '/ocs/v2.php/apps/files/api/v1/files',
      
      // Status endpoints
      '/status.php',
      '/ocs/v1.php/status',
      
      // Capabilities without user context
      '/ocs/v1.php/cloud/capabilities',
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
            'User-Agent': 'Advanced-Nextcloud-Tester/1.0',
          },
        });

        console.log(`   Status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          const data = await response.text();
          console.log(`   ✅ Success! Response preview:`, data.substring(0, 300) + '...');
        } else {
          console.log(`   ❌ Failed: ${response.statusText}`);
        }
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }
  }

  /**
   * Test Nextcloud Files API (newer than OCS)
   */
  async testFilesAPI() {
    console.log('\n🔍 Testing Nextcloud Files API...');
    
    const endpoints = [
      '/remote.php/dav/files/',
      '/remote.php/dav/files/' + this.username,
      '/remote.php/dav/files/' + this.username + '/',
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`\n📡 Testing Files API: ${endpoint}`);
        
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          method: 'PROPFIND',
          headers: {
            'Authorization': this.createBasicAuthHeader(this.username, this.password),
            'Depth': '1',
            'Content-Type': 'application/xml',
            'User-Agent': 'Advanced-Nextcloud-Tester/1.0',
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
          const itemMatches = data.match(/<d:response>/g);
          const itemCount = itemMatches ? itemMatches.length - 1 : 0;
          
          console.log(`   ✅ Success! Found ${itemCount} items`);
          console.log(`   Response preview:`, data.substring(0, 200) + '...');
        } else {
          console.log(`   ❌ Failed: ${response.statusText}`);
        }
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }
  }

  /**
   * Performance comparison test
   */
  async performanceTest() {
    console.log('\n🔍 Performance Comparison Test...');
    
    const testPath = '/ARCH';
    const iterations = 3;
    
    // Test WebDAV performance
    console.log(`\n📊 Testing WebDAV Performance (${iterations} iterations)...`);
    const webdavTimes = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      try {
        const response = await fetch(`${this.baseUrl}/remote.php/dav/files/${this.username}${testPath}`, {
          method: 'PROPFIND',
          headers: {
            'Authorization': this.createBasicAuthHeader(this.username, this.password),
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
        
        if (response.ok) {
          const data = await response.text();
          const duration = Date.now() - start;
          webdavTimes.push(duration);
          console.log(`   Iteration ${i + 1}: ${duration}ms`);
        }
      } catch (error) {
        console.log(`   Iteration ${i + 1}: Error - ${error.message}`);
      }
    }
    
    // Calculate averages
    const avgWebDAV = webdavTimes.reduce((a, b) => a + b, 0) / webdavTimes.length;
    console.log(`   📊 WebDAV Average: ${avgWebDAV.toFixed(2)}ms`);
    
    // Test OCS API performance (if it works)
    console.log(`\n📊 Testing OCS API Performance (${iterations} iterations)...`);
    const ocsTimes = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      try {
        const response = await fetch(`${this.baseUrl}/ocs/v1.php/cloud/users/current`, {
          method: 'GET',
          headers: {
            'Authorization': this.createBasicAuthHeader(this.username, this.password),
            'OCS-APIRequest': 'true',
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.text();
          const duration = Date.now() - start;
          ocsTimes.push(duration);
          console.log(`   Iteration ${i + 1}: ${duration}ms`);
        }
      } catch (error) {
        console.log(`   Iteration ${i + 1}: Error - ${error.message}`);
      }
    }
    
    if (ocsTimes.length > 0) {
      const avgOCS = ocsTimes.reduce((a, b) => a + b, 0) / ocsTimes.length;
      console.log(`   📊 OCS API Average: ${avgOCS.toFixed(2)}ms`);
      
      const improvement = ((avgWebDAV - avgOCS) / avgWebDAV * 100).toFixed(2);
      console.log(`   📊 Performance Difference: ${improvement}% ${avgOCS < avgWebDAV ? 'faster' : 'slower'} with OCS API`);
    }
  }

  /**
   * Test server capabilities and version
   */
  async testServerInfo() {
    console.log('\n🔍 Testing Server Information...');
    
    try {
      // Test status endpoint
      const response = await fetch(`${this.baseUrl}/status.php`, {
        method: 'GET',
        headers: {
          'User-Agent': 'Advanced-Nextcloud-Tester/1.0',
        },
      });
      
      console.log(`   Status Endpoint: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.text();
        console.log(`   ✅ Server Info:`, data.substring(0, 200) + '...');
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  /**
   * Run all advanced tests
   */
  async runAllTests() {
    console.log('🚀 Starting Advanced Nextcloud REST API Tests');
    console.log('=' .repeat(60));
    
    try {
      await this.testServerInfo();
      await this.testAlternativeOCS();
      await this.testFilesAPI();
      await this.performanceTest();
      
      console.log('\n✅ All advanced tests completed!');
      
    } catch (error) {
      console.error('\n❌ Test execution failed:', error);
    }
  }
}

// Run the tests
async function main() {
  try {
    const tester = new AdvancedNextcloudTester();
    await tester.runAllTests();
  } catch (error) {
    console.error('❌ Failed to initialize tester:', error.message);
  }
}

main(); 