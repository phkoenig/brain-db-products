import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import AuthService from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    if (!AuthService.checkAllowlist(email)) {
      return NextResponse.json({ error: "Email not allowed" }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ user: data.user }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}
