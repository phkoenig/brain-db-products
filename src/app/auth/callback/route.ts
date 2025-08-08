import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              request.cookies.set(name, value, options)
            );
          },
        },
      }
    );
    
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
