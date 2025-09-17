// Test script to check ACC token storage
console.log('🔍 Testing ACC Token Storage...');

// Check if we can access localStorage
if (typeof window !== 'undefined') {
  console.log('🔍 Window object available');
  
  // Check localStorage
  const storedTokens = localStorage.getItem('accOAuthTokens');
  console.log('🔍 Stored tokens in localStorage:', storedTokens ? 'Found' : 'Not found');
  
  if (storedTokens) {
    try {
      const parsed = JSON.parse(storedTokens);
      console.log('🔍 Parsed tokens:', {
        hasAccessToken: !!parsed.tokens?.access_token,
        hasRefreshToken: !!parsed.tokens?.refresh_token,
        expiresAt: new Date(parsed.expiresAt),
        isExpired: Date.now() > parsed.expiresAt
      });
    } catch (error) {
      console.error('🔍 Error parsing stored tokens:', error);
    }
  }
} else {
  console.log('🔍 Window object not available (server-side)');
}

// Check global storage
if (typeof global !== 'undefined') {
  const globalTokens = global.accOAuthTokens;
  console.log('🔍 Global tokens:', globalTokens ? 'Found' : 'Not found');
  
  if (globalTokens) {
    console.log('🔍 Global tokens details:', {
      hasAccessToken: !!globalTokens.tokens?.access_token,
      hasRefreshToken: !!globalTokens.tokens?.refresh_token,
      expiresAt: new Date(globalTokens.expiresAt),
      isExpired: Date.now() > globalTokens.expiresAt
    });
  }
}

console.log('🔍 Test completed');
