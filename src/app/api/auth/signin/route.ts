import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Check allowlist via database
    const { data: allowlistData, error: allowlistError } = await supabaseAdmin
      .from("auth_allowlist")
      .select("id, is_active")
      .eq("email", email.toLowerCase().trim())
      .limit(1)
      .maybeSingle();

    if (allowlistError) {
      console.error("Allowlist check error:", allowlistError);
      return NextResponse.json({ error: "Allowlist check failed" }, { status: 500 });
    }

    if (!allowlistData || !allowlistData.is_active) {
      return NextResponse.json({ error: "Email not allowed" }, { status: 403 });
    }

    // Actually verify the password using Supabase auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password: password
    });

    if (authError) {
      console.error("Authentication error:", authError);
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
    }

    // Create response with user data
    const response = NextResponse.json({ 
      message: "Authentication successful",
      user: {
        id: authData.user.id,
        email: authData.user.email,
        email_confirmed_at: authData.user.email_confirmed_at
      }
    }, { status: 200 });

    // Set session cookies if available
    if (authData.session) {
      // Set the session cookie
      response.cookies.set('sb-access-token', authData.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: authData.session.expires_in
      });
      
      response.cookies.set('sb-refresh-token', authData.session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30 // 30 days
      });
    }

    return response;
  } catch (err: any) {
    console.error("Signin error:", err);
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}
