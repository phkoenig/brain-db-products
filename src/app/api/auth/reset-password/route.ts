import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const { email, newPassword } = await req.json();

    if (typeof email !== "string" || typeof newPassword !== "string") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Check if user exists
    const { data: user, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (userError) {
      return NextResponse.json({ error: "User check failed" }, { status: 500 });
    }

    const targetUser = user.users.find(u => u.email === email.toLowerCase().trim());
    
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update user password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      targetUser.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error("Password update error:", updateError);
      return NextResponse.json({ error: "Password update failed" }, { status: 500 });
    }

    return NextResponse.json({ 
      message: "Password updated successfully",
      user: {
        id: targetUser.id,
        email: targetUser.email
      }
    }, { status: 200 });
  } catch (err: any) {
    console.error("Reset password error:", err);
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}
