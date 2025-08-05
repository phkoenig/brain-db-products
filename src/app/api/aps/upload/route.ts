import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

// JWT Token Decoder
function decodeToken(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Upload API: Failed to decode token:', e);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== UPLOAD API START ===');
    
    // Check if APS is configured
    const client_id = process.env.APS_CLIENT_ID;
    const client_secret = process.env.APS_CLIENT_SECRET;
    
    if (!client_id || !client_secret) {
      return NextResponse.json(
        { 
          error: 'APS not configured', 
          message: 'APS_CLIENT_ID and APS_CLIENT_SECRET environment variables are required for this feature',
          code: 'APS_NOT_CONFIGURED'
        },
        { status: 503 }
      );
    }
    
    // 1. Datei vom Client bekommen
    const data = await request.formData();
    const file: File = data.get('file') as File;
    if (!file) return NextResponse.json({ error: 'No file uploaded'}, { status: 400 });

    console.log('Upload API: File received:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // 2. Buffer und Name extrahieren
    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = file.name.replace(/\s/g, "_"); // Leerzeichen ersetzen
    
    // 3. Access Token generieren
    console.log('Upload API: Getting token...');
    const access_token = await getApsToken();
    console.log('Upload API: Token obtained, length:', access_token.length);
    console.log('Upload API: Token preview:', access_token.substring(0, 50) + '...');

    // 4. TOKEN SCOPES DECODIEREN UND ANZEIGEN
    console.log('Upload API: Decoding token to check scopes...');
    const tokenPayload = decodeToken(access_token);
    if (tokenPayload) {
      console.log('Upload API: Token payload:', JSON.stringify(tokenPayload, null, 2));
      console.log('Upload API: Token scopes:', tokenPayload.scope);
      console.log('Upload API: Token client_id:', tokenPayload.client_id);
      console.log('Upload API: Token expires:', new Date(tokenPayload.exp * 1000).toISOString());
    }

    // 5. BUCKET ERSTELLEN (US-ONLY ACCOUNT - KEINE REGION VERIFIZIERUNG)
    const uniqueId = randomUUID().replace(/-/g, '').substring(0, 8);
    const bucketKey = `philipapsbucket202406${uniqueId}`; // Nur Kleinbuchstaben, Zahlen, Bindestrich
    
    console.log('Upload API: Creating bucket for US-only account:', bucketKey);
    console.log('Upload API: Bucket creation request:', {
      bucketKey: bucketKey,
      policyKey: "transient"
      // KEINE REGION - Account ist US-only
    });
    
    const bucketCreateResp = await fetch("https://developer.api.autodesk.com/oss/v2/buckets", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        bucketKey: bucketKey,
        policyKey: "transient"
        // KEINE REGION - Account ist US-only
      })
    });

    console.log('Upload API: Bucket creation status:', bucketCreateResp.status);
    console.log('Upload API: Bucket creation headers:', Object.fromEntries(bucketCreateResp.headers.entries()));

    if (!bucketCreateResp.ok) {
      const text = await bucketCreateResp.text();
      console.error('Upload API: Bucket creation failed:', bucketCreateResp.status, text);
      return NextResponse.json({ error: `Bucket creation failed: ${text}` }, { status: 500 });
    }

    const bucketCreateResult = await bucketCreateResp.json();
    console.log('Upload API: Bucket creation response:', JSON.stringify(bucketCreateResult, null, 2));

    // 6. BUCKET INFO ANZEIGEN (NUR ZUR INFO)
    console.log('Upload API: Getting bucket info...');
    const bucketListResp = await fetch("https://developer.api.autodesk.com/oss/v2/buckets", {
      headers: { "Authorization": `Bearer ${access_token}` }
    });
    
    if (bucketListResp.ok) {
      const bucketsJson = await bucketListResp.json();
      const ourBucket = bucketsJson.items?.find((b: any) => b.bucketKey === bucketKey);
      
      if (ourBucket) {
        console.log('Upload API: Our bucket info:', {
          bucketKey: ourBucket.bucketKey,
          region: ourBucket.region,
          policyKey: ourBucket.policyKey,
          createdDate: ourBucket.createdDate
        });
        
        if (!ourBucket.region) {
          console.log('Upload API: INFO - Bucket has no region field (US-only account)');
          console.log('Upload API: This is expected for US-only APS accounts');
        } else {
          console.log('Upload API: SUCCESS - Bucket has region field:', ourBucket.region);
        }
      }
    }

    console.log('Upload API: Bucket ready for upload (US-only account)');

    // 7. Datei hochladen
    console.log('Upload API: Uploading file:', filename, 'Size:', buffer.length);
    const uploadUrl = `https://developer.api.autodesk.com/oss/v2/buckets/${bucketKey}/objects/${filename}`;
    console.log('Upload API: Upload URL:', uploadUrl);
    
    const uploadResp = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${access_token}`,
        "Content-Type": "application/octet-stream",
        "Content-Length": buffer.length.toString()
      },
      body: buffer
    });

    console.log('Upload API: Upload response status:', uploadResp.status);
    console.log('Upload API: Upload response headers:', Object.fromEntries(uploadResp.headers.entries()));

    if (!uploadResp.ok) {
      const text = await uploadResp.text();
      console.error('Upload API: Upload failed:', uploadResp.status, text);
      return NextResponse.json({ error: `Upload failed: ${text}` }, { status: 500 });
    }

    const uploadResult = await uploadResp.json();
    console.log('Upload API: Upload successful:', JSON.stringify(uploadResult, null, 2));

    // 8. Translation Job starten
    console.log('Upload API: Starting translation job...');
    const urn = Buffer.from(uploadResult.objectId).toString('base64');
    const translationJob = {
      input: { urn: urn },
      output: {
        formats: [{ type: 'svf', views: ['2d', '3d'] }]
      }
    };

    console.log('Upload API: Translation job request:', JSON.stringify(translationJob, null, 2));

    const translationResp = await fetch('https://developer.api.autodesk.com/modelderivative/v2/designdata/job', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
        'x-ads-force': 'true'
      },
      body: JSON.stringify(translationJob)
    });

    console.log('Upload API: Translation response status:', translationResp.status);

    if (!translationResp.ok) {
      const text = await translationResp.text();
      console.error('Upload API: Translation failed:', translationResp.status, text);
      return NextResponse.json({ error: `Translation failed: ${text}` }, { status: 500 });
    }

    const translationResult = await translationResp.json();
    console.log('Upload API: Translation started:', JSON.stringify(translationResult, null, 2));

    console.log('=== UPLOAD API SUCCESS ===');

    return NextResponse.json({ 
      success: true, 
      urn: urn,
      bucketKey,
      fileName: filename,
      originalFileName: file.name,
      uploadResult, 
      translationJob: translationResult 
    }, { status: 200 });

  } catch (e: any) {
    console.error('=== UPLOAD API ERROR ===');
    console.error('Upload API Exception:', e);
    console.error('Upload API Exception stack:', e.stack);
    return NextResponse.json({ error: "Upload API Exception: " + e.message }, { status: 500 });
  }
}

// Direkte Token-Generierung (ohne Caching)
async function getApsToken() {
  const client_id = process.env.APS_CLIENT_ID;
  const client_secret = process.env.APS_CLIENT_SECRET;
  
  console.log('Upload API: Getting token directly...');
  console.log('Upload API: CLIENT_ID:', client_id);
  console.log('Upload API: CLIENT_SECRET length:', client_secret?.length);
  
  const tokenResp = await fetch("https://developer.api.autodesk.com/authentication/v2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=client_credentials&client_id=${client_id}&client_secret=${client_secret}&scope=data:write data:create bucket:create bucket:read`
  });
  
  console.log('Upload API: Token response status:', tokenResp.status);
  console.log('Upload API: Token response headers:', Object.fromEntries(tokenResp.headers.entries()));
  
  if (!tokenResp.ok) {
    const errorText = await tokenResp.text();
    console.error('Upload API: Token API Error:', tokenResp.status, errorText);
    throw new Error("Token API Error: " + errorText);
  }
  
  const authJson = await tokenResp.json();
  console.log('Upload API: Token response:', JSON.stringify(authJson, null, 2));
  console.log('Upload API: Token obtained successfully');
  return authJson.access_token;
} 