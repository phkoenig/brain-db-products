import { NextRequest, NextResponse } from "next/server";
import { APSService } from "@/lib/aps";

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 APS Upload: Starting file upload...");
    console.log("🔍 APS Upload: Request headers:", Object.fromEntries(request.headers.entries()));
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileName = formData.get('fileName') as string;

    if (!file) {
      console.error("🔍 APS Upload: No file provided in request");
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    console.log("🔍 APS Upload: File received:", { 
      name: fileName, 
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    });

    // Create bucket and upload file
    const bucketKey = `test-upload-${Date.now()}`;
    const objectKey = `${Date.now()}-${file.name}`; // Use actual filename instead of null
    
    console.log('🔍 APS Upload: Creating bucket:', bucketKey);
    console.log('🔍 APS Upload: Object key:', objectKey);

    // Create bucket
    try {
      await APSService.createBucket(bucketKey, 'transient');
      console.log("🔍 APS Upload: Bucket created successfully");
    } catch (bucketError) {
      console.error("🔍 APS Upload: Bucket creation failed:", bucketError);
      throw bucketError;
    }

    console.log("🔍 APS Upload: Uploading file to APS...");

    // Upload file to APS
    let uploadResult;
    try {
      uploadResult = await APSService.uploadObject(bucketKey, objectKey, file);
      console.log("🔍 APS Upload: File uploaded successfully:", uploadResult);
    } catch (uploadError) {
      console.error("🔍 APS Upload: File upload failed:", uploadError);
      throw uploadError;
    }

    // Generate URN for viewer
    const urn = Buffer.from(uploadResult.objectId).toString('base64').replace(/=/g, '');
    console.log("🔍 APS Upload: Generated URN:", urn);

    const response = {
      success: true,
      urn: urn,
      objectId: uploadResult.objectId, // Add objectId for translation
      bucketKey: uploadResult.bucketKey,
      objectKey: uploadResult.objectKey
    };
    
    console.log("🔍 APS Upload: Returning success response:", response);
    return NextResponse.json(response);

  } catch (error: any) {
    console.error("🔍 APS Upload: Error:", error);
    console.error("🔍 APS Upload: Error stack:", error.stack);
    return NextResponse.json({ 
      error: "Upload failed",
      details: error.message
    }, { status: 500 });
  }
}
