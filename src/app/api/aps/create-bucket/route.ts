import { NextRequest, NextResponse } from 'next/server';
import { getAPSCredentials, isAPSConfigured, APS } from '@/lib/aps-token-manager';

export async function POST(request: NextRequest) {
  try {
    // Check if APS is configured
    if (!isAPSConfigured()) {
      return NextResponse.json(
        { 
          error: 'APS not configured', 
          message: 'APS_CLIENT_ID and APS_CLIENT_SECRET environment variables are required for this feature',
          code: 'APS_NOT_CONFIGURED'
        },
        { status: 503 }
      );
    }

    console.log('Create Bucket API: Getting APS credentials...');
    const credentials = await getAPSCredentials();
    console.log('Create Bucket API: APS credentials obtained');
    
    const bucketKey = 'brain-db-products';
    const bucketApi = new APS.BucketsApi();
    
    console.log('Create Bucket API: Creating bucket:', bucketKey);
    const result = await bucketApi.createBucket(
      { bucketKey, policyKey: 'transient' },
      {},
      credentials
    );
    
    console.log('Create Bucket API: Bucket created successfully');
    return NextResponse.json({
      bucketKey,
      result: result.body
    });

  } catch (error: any) {
    console.error('Create Bucket API Error:', error);
    return NextResponse.json(
      { error: 'Failed to create bucket', details: error.message },
      { status: 500 }
    );
  }
} 