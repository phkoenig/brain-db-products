import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    // Use the correct callback URL that matches our Next.js routing
    const redirectTo = `${req.nextUrl.origin}/auth/callback`;
    
    console.log("Starting Google OAuth flow with redirectTo:", redirectTo);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      console.error("Google OAuth error:", error);
      return NextResponse.json({ 
        error: error.message,
        details: "OAuth initialization failed"
      }, { status: 400 });
    }

    if (!data?.url) {
      console.error("No OAuth URL returned");
      return NextResponse.json({ 
        error: "No OAuth URL returned",
        details: "Supabase did not return a valid OAuth URL"
      }, { status: 500 });
    }

    console.log("Redirecting to Google OAuth URL:", data.url);
    return NextResponse.redirect(data.url);
  } catch (err: any) {
    console.error("Unexpected error in Google OAuth:", err);
    return NextResponse.json({ 
      error: err?.message ?? "Unknown error",
      details: "Unexpected error during OAuth flow"
    }, { status: 500 });
  }
}
