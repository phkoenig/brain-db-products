/**
 * Test für OAuth-Konfiguration
 * Überprüft, ob die Autodesk OAuth-Konfiguration korrekt ist
 */

const BASE_URL = 'http://localhost:3000';

async function testOAuthConfig() {
  console.log('🧪 Testing OAuth Configuration...\n');
  
  try {
    // 1. Test: OAuth URL generieren
    console.log('1️⃣ Testing: Generate OAuth URL');
    const oauthUrlResponse = await fetch(`${BASE_URL}/api/auth/acc-authorize-url`);
    
    if (!oauthUrlResponse.ok) {
      throw new Error(`OAuth URL generation failed: ${oauthUrlResponse.status}`);
    }
    
    const oauthData = await oauthUrlResponse.json();
    console.log('✅ OAuth URL generated successfully');
    console.log(`   OAuth URL: ${oauthData.url}`);
    
    // Parse die URL um die Parameter zu überprüfen
    const url = new URL(oauthData.url);
    const params = new URLSearchParams(url.search);
    
    console.log('   OAuth Parameters:');
    console.log(`     client_id: ${params.get('client_id')}`);
    console.log(`     redirect_uri: ${params.get('redirect_uri')}`);
    console.log(`     response_type: ${params.get('response_type')}`);
    console.log(`     scope: ${params.get('scope')}`);
    
    // 2. Test: Client-ID Validierung
    console.log('\n2️⃣ Testing: Client ID Validation');
    const expectedClientId = 'FFsDJFRGAFTPFGtQ9jcFjoKnQGvjllevpeg6DdaqvmwOno32';
    const actualClientId = params.get('client_id');
    
    if (actualClientId === expectedClientId) {
      console.log('✅ Client ID matches expected value');
    } else {
      console.log('❌ Client ID mismatch!');
      console.log(`   Expected: ${expectedClientId}`);
      console.log(`   Actual: ${actualClientId}`);
    }
    
    // 3. Test: Redirect URI Validierung
    console.log('\n3️⃣ Testing: Redirect URI Validation');
    const expectedRedirectUri = 'http://localhost:3000/auth/callback';
    const actualRedirectUri = params.get('redirect_uri');
    
    if (actualRedirectUri === expectedRedirectUri) {
      console.log('✅ Redirect URI matches expected value');
    } else {
      console.log('❌ Redirect URI mismatch!');
      console.log(`   Expected: ${expectedRedirectUri}`);
      console.log(`   Actual: ${actualRedirectUri}`);
    }
    
    // 4. Test: Scope Validierung
    console.log('\n4️⃣ Testing: Scope Validation');
    const expectedScopes = [
      'data:read',
      'data:write', 
      'bucket:read',
      'bucket:create',
      'bucket:delete',
      'viewables:read',
      'account:read'
    ];
    const actualScope = params.get('scope');
    const actualScopes = actualScope ? actualScope.split(' ') : [];
    
    console.log(`   Expected scopes: ${expectedScopes.join(', ')}`);
    console.log(`   Actual scopes: ${actualScopes.join(', ')}`);
    
    const missingScopes = expectedScopes.filter(scope => !actualScopes.includes(scope));
    const extraScopes = actualScopes.filter(scope => !expectedScopes.includes(scope));
    
    if (missingScopes.length === 0 && extraScopes.length === 0) {
      console.log('✅ All scopes match expected values');
    } else {
      if (missingScopes.length > 0) {
        console.log(`❌ Missing scopes: ${missingScopes.join(', ')}`);
      }
      if (extraScopes.length > 0) {
        console.log(`❌ Extra scopes: ${extraScopes.join(', ')}`);
      }
    }
    
    console.log('\n🎉 OAuth Configuration Test completed!');
    
  } catch (error) {
    console.error('❌ OAuth Configuration Test failed:', error);
    console.error('   Error details:', error.message);
  }
}

// Test ausführen
testOAuthConfig();
