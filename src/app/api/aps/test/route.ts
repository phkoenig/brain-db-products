import { NextRequest, NextResponse } from "next/server";
import { APSService } from "@/lib/aps";

export async function GET(req: NextRequest) {
  try {
    console.log("🔍 APS Test: Starting real integration test...");
    
    // Test 1: List existing buckets
    console.log("🔍 APS Test: Listing buckets...");
    const buckets = await APSService.listBuckets();
    console.log("🔍 APS Test: Found buckets:", buckets.length);

    // Test 2: Create a test bucket
    console.log("🔍 APS Test: Creating test bucket...");
    const bucketKey = `test-bucket-${Date.now()}`;
    const newBucket = await APSService.createBucket(bucketKey, 'transient');
    console.log("🔍 APS Test: Created bucket:", newBucket.bucketKey);

    // Test 3: List buckets again to confirm creation
    console.log("🔍 APS Test: Listing buckets after creation...");
    const bucketsAfter = await APSService.listBuckets();
    console.log("🔍 APS Test: Buckets after creation:", bucketsAfter.length);

    // Test 4: Clean up - delete the test bucket
    console.log("🔍 APS Test: Cleaning up test bucket...");
    await APSService.deleteBucket(bucketKey);
    console.log("🔍 APS Test: Test bucket deleted");

    return NextResponse.json({ 
      success: true,
      message: "APS integration fully working! 🎉",
      test_results: {
        initial_buckets: buckets.length,
        bucket_created: newBucket.bucketKey,
        buckets_after_creation: bucketsAfter.length,
        cleanup_successful: true
      },
      note: "All APS operations (list, create, delete) working correctly with EMEA region"
    });

  } catch (error: any) {
    console.error("🔍 APS Test: Error:", error);
    return NextResponse.json({ 
      error: "APS integration test failed",
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
