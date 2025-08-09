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
  
  // Dynamic redirect URI based on origin
  private static getRedirectUri(origin?: string): string {
    // If origin is provided, use it to determine redirect URI
    if (origin) {
      if (origin.includes('localhost:3000')) {
        return 'http://localhost:3000/auth/callback';
      } else if (origin.includes('megabrain.cloud')) {
        return 'https://megabrain.cloud/auth/callback';
      }
    }
    
    // Fallback based on NODE_ENV
    return process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000/auth/callback' 
      : 'https://megabrain.cloud/auth/callback';
  }
  
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
  static getAuthorizationUrl(origin?: string): string {
    const redirectUri = this.getRedirectUri(origin);
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.CLIENT_ID,
      redirect_uri: redirectUri,
      scope: this.SCOPES,
      state: this.generateState()
    });

    const authUrl = `https://developer.api.autodesk.com/authentication/v2/authorize?${params.toString()}`;
    
    console.log('🔍 ACC OAuth: Authorization URL generated:');
    console.log('🔍 ACC OAuth: - Client ID:', this.CLIENT_ID.substring(0, 10) + '...');
    console.log('🔍 ACC OAuth: - Origin:', origin || 'not provided');
    console.log('🔍 ACC OAuth: - Redirect URI:', redirectUri);
    console.log('🔍 ACC OAuth: - Scopes:', this.SCOPES);
    console.log('🔍 ACC OAuth: - Full URL:', authUrl);

    return authUrl;
  }

  /**
   * Exchange authorization code for access tokens
   */
  static async exchangeCodeForTokens(code: string, origin?: string): Promise<OAuthTokens> {
    const redirectUri = this.getRedirectUri(origin);
    
    console.log('🔍 ACC OAuth: Exchanging code for tokens...');
    console.log('🔍 ACC OAuth: Client ID:', this.CLIENT_ID.substring(0, 10) + '...');
    console.log('🔍 ACC OAuth: Origin:', origin || 'not provided');
    console.log('🔍 ACC OAuth: Redirect URI:', redirectUri);
    console.log('🔍 ACC OAuth: Code length:', code.length);

    const requestBody = new URLSearchParams({
      client_id: this.CLIENT_ID,
      client_secret: this.CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri
    });

    const response = await fetch('https://developer.api.autodesk.com/authentication/v2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: requestBody.toString()
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔍 ACC OAuth: Token exchange failed:', response.status, errorText);
      throw new Error(`Token exchange failed: ${response.status} - ${errorText}`);
    }

    const tokens: OAuthTokens = await response.json();
    console.log('🔍 ACC OAuth: Tokens received successfully');
    
    this.storeTokens(tokens);
    return tokens;
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshTokens(refreshToken: string): Promise<OAuthTokens> {
    console.log('🔍 ACC OAuth: Refreshing tokens...');

    const requestBody = new URLSearchParams({
      client_id: this.CLIENT_ID,
      client_secret: this.CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    });

    const response = await fetch('https://developer.api.autodesk.com/authentication/v2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: requestBody.toString()
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔍 ACC OAuth: Token refresh failed:', response.status, errorText);
      throw new Error(`Token refresh failed: ${response.status} - ${errorText}`);
    }

    const tokens: OAuthTokens = await response.json();
    console.log('🔍 ACC OAuth: Tokens refreshed successfully');
    
    this.storeTokens(tokens);
    return tokens;
  }

  /**
   * Get valid access token (refresh if needed)
   */
  static async getAccessToken(): Promise<string> {
    const cached = this.loadTokens();
    
    if (cached && Date.now() < cached.expiresAt) {
      console.log('🔍 ACC OAuth: Using cached access token');
      return cached.tokens.access_token;
    }

    if (cached && cached.tokens.refresh_token) {
      console.log('🔍 ACC OAuth: Refreshing expired access token');
      try {
        const newTokens = await this.refreshTokens(cached.tokens.refresh_token);
        return newTokens.access_token;
      } catch (error) {
        console.error('🔍 ACC OAuth: Token refresh failed, clearing cache');
        this.clearTokens();
        throw error;
      }
    }

    throw new Error('No valid access token available. Please re-authenticate.');
  }

  /**
   * Generate random state parameter for OAuth security
   */
  private static generateState(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  /**
   * Clear stored tokens
   */
  static clearTokens(): void {
    this.tokenCache = null;
    (global as any).accOAuthTokens = null;
    console.log('🔍 ACC OAuth: Tokens cleared from cache and global storage');
  }
}
