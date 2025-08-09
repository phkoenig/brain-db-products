import { NextRequest, NextResponse } from "next/server";
import { APSService } from "@/lib/aps";

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 APS Translate: Starting translation...");
    
    const { urn } = await request.json();
    console.log("🔍 APS Translate: URN received:", urn);

    // Step 1: Always check manifest first (Best Practice)
    console.log("🔍 APS Translate: Checking manifest first...");
    try {
      const existingStatus = await APSService.getTranslationStatus(urn);
      console.log("🔍 APS Translate: Existing manifest status:", existingStatus);
      
      if (existingStatus.status === 'success') {
        console.log("🔍 APS Translate: Translation already exists and is successful");
        return NextResponse.json({ 
          success: true, 
          urn: urn,
          status: 'success',
          manifest: existingStatus.manifest
        });
      } else if (existingStatus.status === 'inprogress' || existingStatus.status === 'pending') {
        console.log("🔍 APS Translate: Translation already in progress/pending - forcing restart");
        // Force restart any pending/inprogress translation that might be stuck
        const translationResult = await APSService.startTranslation(urn, true);
        console.log("🔍 APS Translate: Translation job restarted with force flag:", translationResult);
        
        return NextResponse.json({ 
          success: true, 
          urn: urn,
          status: 'inprogress',
          jobId: translationResult.urn
        });
      } else if (existingStatus.status === 'failed') {
        console.log("🔍 APS Translate: Previous translation failed, starting new one with force flag");
        // Use x-ads-force: true to overwrite failed translation
        const translationResult = await APSService.startTranslation(urn, true);
        console.log("🔍 APS Translate: Translation job started with force flag:", translationResult);
        
        return NextResponse.json({ 
          success: true, 
          urn: urn,
          status: 'inprogress',
          jobId: translationResult.urn
        });
      }
    } catch (statusError) {
      console.log("🔍 APS Translate: No existing manifest found, starting new translation");
    }

    // Step 2: Start new translation only if no manifest exists
    console.log("🔍 APS Translate: Starting new translation for URN:", urn);
    
    const translationResult = await APSService.startTranslation(urn, false);
    console.log("🔍 APS Translate: Translation job started:", translationResult);
    
    return NextResponse.json({ 
      success: true, 
      urn: urn,
      status: 'inprogress',
      jobId: translationResult.urn
    });

  } catch (error: any) {
    console.error("🔍 APS Translate: Error:", error);
    return NextResponse.json({ 
      error: "Translation failed",
      details: error.message
    }, { status: 500 });
  }
}

// New endpoint to check translation status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const urn = searchParams.get('urn');
    
    if (!urn) {
      return NextResponse.json({ error: "URN parameter required" }, { status: 400 });
    }

    console.log("🔍 APS Translate: Checking status for URN:", urn);

    // Get translation status from APS
    const status = await APSService.getTranslationStatus(urn);
    
    console.log("🔍 APS Translate: Status result:", status);
    
    return NextResponse.json(status);

  } catch (error: any) {
    console.error("🔍 APS Translate: Status check error:", error);
    return NextResponse.json({ 
      error: "Status check failed",
      details: error.message
    }, { status: 500 });
  }
}
