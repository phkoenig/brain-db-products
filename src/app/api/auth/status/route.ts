import { NextRequest, NextResponse } from "next/server";
import AuthService from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const email = url.searchParams.get("email") || undefined;

    const allowlist = AuthService.getAllowlistConfig();

    // Do NOT expose actual keys; only presence booleans and counts
    const result = {
      supabaseUrlPresent: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      supabaseAnonKeyPresent: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      supabaseSecretKeyPresent: Boolean(process.env.SUPABASE_SECRET_KEY),
      allowlistEmailsCount: allowlist.emails.length,
      allowlistDomainsCount: allowlist.domains.length,
      emailChecked: email ?? null,
      emailAllowed: email ? AuthService.checkAllowlist(email) : null,
    };

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
