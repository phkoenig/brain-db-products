import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const email = url.searchParams.get("email");
  
  if (!email) {
    return NextResponse.json({ error: "Email parameter required" }, { status: 400 });
  }

  try {
    // Test 1: Check allowlist
    const { data: allowlistData, error: allowlistError } = await supabaseAdmin
      .from("auth_allowlist")
      .select("*")
      .eq("email", email.toLowerCase().trim())
      .limit(1)
      .maybeSingle();

    // Test 2: Check if user already exists
    const { data: existingUser, error: userError } = await supabaseAdmin.auth.admin.listUsers();

    const existingUserData = existingUser.users.find(u => u.email === email.toLowerCase().trim());

    return NextResponse.json({
      email: email.toLowerCase().trim(),
      allowlist: {
        found: !!allowlistData,
        data: allowlistData,
        error: allowlistError?.message
      },
      existingUser: {
        found: !!existingUserData,
        data: existingUserData ? {
          id: existingUserData.id,
          email: existingUserData.email,
          email_confirmed_at: existingUserData.email_confirmed_at,
          created_at: existingUserData.created_at
        } : null,
        error: userError?.message
      },
      allAllowlistUsers: await supabaseAdmin
        .from("auth_allowlist")
        .select("email, is_active, role")
        .order("created_at", { ascending: false })
        .limit(10)
    });

  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}
