import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 F16 Settings API: Fetching settings...");
    
    // Hardcoded values for now - replace with your actual Supabase URL and Service Key
    const supabaseUrl = "https://your-project.supabase.co"; // Replace with your actual URL
    const supabaseServiceKey = "your-service-role-key"; // Replace with your actual key
    
    console.log("🔍 F16 Settings API: Using hardcoded values for testing");
    
    // For now, return the hardcoded model path that we know exists
    return NextResponse.json({
      project_id: 'f16',
      model_path: 'b.e4a2d0c3-1ca2-4a10-b381-f184c303a1c1/items/urn:adsk.wipemea:dm.lineage:-iaOMC-4R_qP3q9hAfX54g'
    });
    
  } catch (error) {
    console.error("🔍 F16 Settings API: Error fetching settings:", error);
    
    return NextResponse.json({
      project_id: 'f16',
      model_path: null
    });
  }
}
