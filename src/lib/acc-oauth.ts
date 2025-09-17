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
  
  // Static redirect URI as per documentation
  private static readonly REDIRECT_URI = 'http://localhost:3000/auth/callback';
  
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
    const expiresAt = Date.now() + (tokens.expires_in * 1000) - (5 * 60 * 1000); // 5 minutes buffer
    
    this.tokenCache = {
      tokens,
      expiresAt
    };
    
    // Also store in global variable for persistence across API calls
    (global as any).accOAuthTokens = this.tokenCache;
    
    // Store in localStorage for client-side persistence
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('accOAuthTokens', JSON.stringify(this.tokenCache));
        console.log('🔍 ACC OAuth: Tokens stored in localStorage');
        console.log('🔍 ACC OAuth: localStorage content length:', localStorage.getItem('accOAuthTokens')?.length || 0);
      } catch (error) {
        console.warn('🔍 ACC OAuth: Could not store tokens in localStorage:', error);
      }
    }
    
    console.log('🔍 ACC OAuth: Tokens stored in cache and global storage');
    console.log('🔍 ACC OAuth: Token expires at:', new Date(expiresAt).toISOString());
    console.log('🔍 ACC OAuth: Access token length:', tokens.access_token?.length || 0);
    console.log('🔍 ACC OAuth: Refresh token length:', tokens.refresh_token?.length || 0);
  }

  /**
   * Load tokens from global storage
   */
  private static loadTokens(): { tokens: OAuthTokens; expiresAt: number } | null {
    console.log('🔍 ACC OAuth: Loading tokens...');
    
    // First try local cache
    if (this.tokenCache && Date.now() < this.tokenCache.expiresAt) {
      console.log('🔍 ACC OAuth: Using memory cache');
      return this.tokenCache;
    }
    
    // Then try global storage
    const globalTokens = (global as any).accOAuthTokens;
    if (globalTokens && Date.now() < globalTokens.expiresAt) {
      this.tokenCache = globalTokens;
      console.log('🔍 ACC OAuth: Tokens loaded from global storage');
      return globalTokens;
    }
    
    // Finally try localStorage (client-side)
    if (typeof window !== 'undefined') {
      try {
        const storedTokens = localStorage.getItem('accOAuthTokens');
        if (storedTokens) {
          const parsedTokens = JSON.parse(storedTokens);
          if (parsedTokens && Date.now() < parsedTokens.expiresAt) {
            this.tokenCache = parsedTokens;
            console.log('🔍 ACC OAuth: Tokens loaded from localStorage');
            return parsedTokens;
          } else {
            console.log('🔍 ACC OAuth: localStorage tokens expired');
          }
        } else {
          console.log('🔍 ACC OAuth: No tokens in localStorage');
        }
      } catch (error) {
        console.warn('🔍 ACC OAuth: Could not load tokens from localStorage:', error);
      }
    } else {
      console.log('🔍 ACC OAuth: Not in browser environment, cannot access localStorage');
    }
    
    console.log('🔍 ACC OAuth: No valid tokens found');
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
    console.log('🔍 ACC OAuth: Getting access token...');
    
    const cached = this.loadTokens();
    console.log('🔍 ACC OAuth: Cached tokens:', cached ? 'found' : 'not found');
    
    if (cached) {
      console.log('🔍 ACC OAuth: Token expires at:', new Date(cached.expiresAt).toISOString());
      console.log('🔍 ACC OAuth: Current time:', new Date().toISOString());
      console.log('🔍 ACC OAuth: Time until expiry:', (cached.expiresAt - Date.now()) / 1000, 'seconds');
    }
    
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

    console.log('🔍 ACC OAuth: No valid tokens found, need to authenticate');
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
