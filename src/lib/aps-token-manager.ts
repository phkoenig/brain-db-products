// Conditional import of forge-apis to avoid build errors when APS is not configured
let APS: any = null;

const CLIENT_ID = process.env.APS_CLIENT_ID;
const CLIENT_SECRET = process.env.APS_CLIENT_SECRET;

// Only import forge-apis if APS is configured
if (CLIENT_ID && CLIENT_SECRET) {
  try {
    APS = require('forge-apis');
  } catch (error) {
    console.warn('forge-apis package not available - APS features will be disabled');
  }
}

// Graceful handling of missing APS credentials
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.warn('APS_CLIENT_ID and APS_CLIENT_SECRET not set - APS features will be disabled');
}

// APS OAuth2 Client (only if credentials are available)
let oAuth2Client: any = null;

if (CLIENT_ID && CLIENT_SECRET && APS) {
  oAuth2Client = new APS.AuthClientTwoLegged(CLIENT_ID, CLIENT_SECRET, [
    'data:read',
    'data:write',
    'data:create',
    'bucket:read',
    'bucket:create'
  ], true);
}

interface CachedToken {
  access_token: string;
  expires_in: number;
  timestamp: number;
}

let cachedToken: CachedToken | null = null;

export async function getAPSToken(): Promise<string> {
  if (!oAuth2Client) {
    throw new Error('APS credentials not configured. Please set APS_CLIENT_ID and APS_CLIENT_SECRET environment variables.');
  }

  // Prüfe ob Token noch gültig ist (mit 5 Minuten Puffer)
  if (cachedToken && (Date.now() - cachedToken.timestamp) < (cachedToken.expires_in - 300) * 1000) {
    console.log('Using cached APS token');
    return cachedToken.access_token;
  }

  // Neuen Token anfordern
  console.log('Requesting new APS token...');
  console.log('APS CLIENT_ID:', CLIENT_ID);
  console.log('APS CLIENT_SECRET length:', CLIENT_SECRET?.length);
  
  const credentials = await oAuth2Client.authenticate();
  
  cachedToken = {
    access_token: credentials.access_token,
    expires_in: credentials.expires_in,
    timestamp: Date.now()
  };

  console.log('New APS token cached');
  console.log('Token expires in:', credentials.expires_in, 'seconds');
  return cachedToken.access_token;
}

export async function getAPSCredentials() {
  const token = await getAPSToken();
  return {
    access_token: token,
    expires_in: cachedToken?.expires_in || 3600
  };
}

// Helper function to check if APS is configured
export function isAPSConfigured(): boolean {
  return !!(CLIENT_ID && CLIENT_SECRET && APS);
}

// Export APS for conditional use
export { APS }; 