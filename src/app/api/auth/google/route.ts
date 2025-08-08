import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // Redirect to client-side OAuth handling
  return NextResponse.redirect(`${req.nextUrl.origin}/auth/google`);
}
