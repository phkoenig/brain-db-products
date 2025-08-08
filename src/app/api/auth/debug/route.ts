import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: NextRequest) {
  try {
    // Get current session
    const { data: sessionData } = await supabase.auth.getSession();
    
    // Get all users from allowlist
    const { data: allowlistData, error: allowlistError } = await supabaseAdmin
      .from("auth_allowlist")
      .select("*")
      .eq("is_active", true);

    // Get all auth users
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    const result = {
      currentSession: sessionData.session ? {
        user: {
          id: sessionData.session.user.id,
          email: sessionData.session.user.email,
          email_confirmed_at: sessionData.session.user.email_confirmed_at
        },
        expires_at: sessionData.session.expires_at
      } : null,
      allowlistUsers: allowlistData || [],
      allowlistError: allowlistError?.message,
      authUsers: authUsers?.users.map(u => ({
        id: u.id,
        email: u.email,
        email_confirmed_at: u.email_confirmed_at,
        created_at: u.created_at
      })) || [],
      authError: authError?.message,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
