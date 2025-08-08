import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    try {
      console.log("Exchanging code for session...");
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error("Session exchange error:", error);
        return NextResponse.redirect(`${requestUrl.origin}/auth/auth-code-error?reason=exchange_failed&error=${error.message}`);
      }
      
      console.log("Session exchanged successfully, redirecting to home");
      return NextResponse.redirect(requestUrl.origin);
      
    } catch (error) {
      console.error("Unexpected error in callback:", error);
      return NextResponse.redirect(`${requestUrl.origin}/auth/auth-code-error?reason=unexpected_error&error=${error}`);
    }
  }

  // No code provided
  console.error("No OAuth code received");
  return NextResponse.redirect(`${requestUrl.origin}/auth/auth-code-error?reason=no_code`);
}
