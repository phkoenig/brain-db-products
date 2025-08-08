import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

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

    // Check if user exists
    const { data: existingUser, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (userError) {
      return NextResponse.json({ error: "User check failed" }, { status: 500 });
    }

    const user = existingUser.users.find(u => u.email === email.toLowerCase().trim());
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Return success - actual signin should be done client-side
    return NextResponse.json({ 
      message: "User exists and is allowed to sign in",
      user: {
        id: user.id,
        email: user.email,
        email_confirmed_at: user.email_confirmed_at
      }
    }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}
