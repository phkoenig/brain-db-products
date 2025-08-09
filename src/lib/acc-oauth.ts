// 3-Legged OAuth Service for ACC Data Management API
// Based on APS Data Management API v2 requirements

export interface OAuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export class ACCOAuthService {
  private static tokenCache: { tokens: OAuthTokens; expiresAt: number } | null = null;
  
  // OAuth2 Configuration
  private static readonly CLIENT_ID = process.env.APS_WEB_APP_CLIENT_ID!;
  private static readonly CLIENT_SECRET = process.env.APS_WEB_APP_CLIENT_SECRET!;
  private static readonly REDIRECT_URI = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3000/auth/callback' 
    : 'https://megabrain.cloud/auth/callback';
  
  // Scopes for Data Management API
  private static readonly SCOPES = [
    'data:read',           // Read project files and folders
    'data:write',          // Write project files (if needed)
    'bucket:read',         // Read buckets
    'bucket:create',       // Create buckets
    'account:read',        // Read account info
    'user-profile:read'    // Read user profile
  ].join(' ');

  /**
   * Store tokens in session storage (for server-side persistence)
   */
  private static storeTokens(tokens: OAuthTokens): void {
    this.tokenCache = {
      tokens,
      expiresAt: Date.now() + (tokens.expires_in * 1000) - (5 * 60 * 1000) // 5 minutes buffer
    };
    
    // Also store in global variable for persistence across API calls
    (global as any).accOAuthTokens = this.tokenCache;
    console.log('🔍 ACC OAuth: Tokens stored in cache and global storage');
  }

  /**
   * Load tokens from global storage
   */
  private static loadTokens(): { tokens: OAuthTokens; expiresAt: number } | null {
    // First try local cache
    if (this.tokenCache && Date.now() < this.tokenCache.expiresAt) {
      return this.tokenCache;
    }
    
    // Then try global storage
    const globalTokens = (global as any).accOAuthTokens;
    if (globalTokens && Date.now() < globalTokens.expiresAt) {
      this.tokenCache = globalTokens;
      console.log('🔍 ACC OAuth: Tokens loaded from global storage');
      return globalTokens;
    }
    
    return null;
  }

  /**
   * Generate OAuth2 authorization URL for 3-legged flow
   */
  static getAuthorizationUrl(): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.CLIENT_ID,
      redirect_uri: this.REDIRECT_URI,
      scope: this.SCOPES,
      state: this.generateState()
    });

    const authUrl = `https://developer.api.autodesk.com/authentication/v2/authorize?${params.toString()}`;
    
    console.log('🔍 ACC OAuth: Authorization URL generated:');
    console.log('🔍 ACC OAuth: - Client ID:', this.CLIENT_ID.substring(0, 10) + '...');
    console.log('🔍 ACC OAuth: - Redirect URI:', this.REDIRECT_URI);
    console.log('🔍 ACC OAuth: - Scopes:', this.SCOPES);
    console.log('🔍 ACC OAuth: - Full URL:', authUrl);

    return authUrl;
  }

  /**
   * Exchange authorization code for access tokens
   */
  static async exchangeCodeForTokens(code: string): Promise<OAuthTokens> {
    console.log('🔍 ACC OAuth: Exchanging code for tokens...');
    console.log('🔍 ACC OAuth: Client ID:', this.CLIENT_ID.substring(0, 10) + '...');
    console.log('🔍 ACC OAuth: Redirect URI:', this.REDIRECT_URI);
    console.log('🔍 ACC OAuth: Code length:', code.length);

    const requestBody = new URLSearchParams({
      client_id: this.CLIENT_ID,
      client_secret: this.CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: this.REDIRECT_URI
    });

    console.log('🔍 ACC OAuth: Request body:', requestBody.toString());

    const response = await fetch('https://developer.api.autodesk.com/authentication/v2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'x-ads-region': 'EMEA'
      },
      body: requestBody
    });

    console.log('🔍 ACC OAuth: Response status:', response.status);
    console.log('🔍 ACC OAuth: Response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('🔍 ACC OAuth: Response body:', responseText);

    if (!response.ok) {
      console.error('🔍 ACC OAuth: Token exchange failed - Status:', response.status);
      console.error('🔍 ACC OAuth: Token exchange failed - Body:', responseText);
      throw new Error(`OAuth token exchange failed: ${response.status} - ${responseText}`);
    }

    let tokens;
    try {
      tokens = JSON.parse(responseText);
      console.log('🔍 ACC OAuth: Tokens parsed successfully');
    } catch (parseError) {
      console.error('🔍 ACC OAuth: Failed to parse response as JSON:', parseError);
      throw new Error(`OAuth response parsing failed: ${responseText}`);
    }

    console.log('🔍 ACC OAuth: Tokens received successfully');

    // Cache tokens
    this.storeTokens(tokens);

    return tokens;
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshTokens(refreshToken: string): Promise<OAuthTokens> {
    console.log('🔍 ACC OAuth: Refreshing tokens...');

    const response = await fetch('https://developer.api.autodesk.com/authentication/v2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'x-ads-region': 'EMEA'
      },
      body: new URLSearchParams({
        client_id: this.CLIENT_ID,
        client_secret: this.CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔍 ACC OAuth: Token refresh failed:', errorText);
      throw new Error(`OAuth token refresh failed: ${response.status} - ${errorText}`);
    }

    const tokens = await response.json();
    console.log('🔍 ACC OAuth: Tokens refreshed successfully');

    // Cache tokens
    this.storeTokens(tokens);

    return tokens;
  }

  /**
   * Get valid access token (cached or refreshed)
   */
  static async getAccessToken(): Promise<string> {
    // Check if we have valid cached tokens
    const cachedTokens = this.loadTokens();
    if (cachedTokens && Date.now() < cachedTokens.expiresAt) {
      return cachedTokens.tokens.access_token;
    }

    // If we have cached tokens but they're expired, try to refresh
    if (cachedTokens && cachedTokens.tokens.refresh_token) {
      try {
        const newTokens = await this.refreshTokens(cachedTokens.tokens.refresh_token);
        return newTokens.access_token;
      } catch (error) {
        console.error('🔍 ACC OAuth: Token refresh failed, need re-authorization');
        // Clear cache and require re-authorization
        this.tokenCache = null;
        (global as any).accOAuthTokens = null; // Clear global storage
      }
    }

    throw new Error('No valid OAuth tokens available. User needs to authorize the application.');
  }

  /**
   * Generate random state for OAuth security
   */
  private static generateState(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  /**
   * Clear cached tokens (for logout)
   */
  static clearTokens(): void {
    this.tokenCache = null;
    (global as any).accOAuthTokens = null; // Clear global storage
    console.log('🔍 ACC OAuth: Tokens cleared');
  }
}
