import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import AuthService from "@/lib/auth";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const email = (url.searchParams.get("email") || "").trim().toLowerCase();
  if (!email) return NextResponse.json({ allowed: false, reason: "missing_email" }, { status: 400 });
  try {
    // 1) DB-based allowlist (email exact + active)
    const { data, error } = await supabaseAdmin
      .from("auth_allowlist")
      .select("id, is_active")
      .eq("email", email)
      .limit(1)
      .maybeSingle();
    if (error) {
      // do not fail open; log later
    }
    if (data && data.is_active) {
      return NextResponse.json({ allowed: true, source: "db" });
    }
    // 2) Fallback to env-based allowlist (emails/domains)
    const envAllowed = AuthService.checkAllowlist(email);
    return NextResponse.json({ allowed: envAllowed, source: "env" });
  } catch (e: any) {
    return NextResponse.json({ allowed: false, reason: e?.message ?? "error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { email } = await req.json().catch(() => ({ email: "" }));
  const url = new URL(req.url);
  url.searchParams.set("email", email || "");
  return GET(new NextRequest(url));
}
