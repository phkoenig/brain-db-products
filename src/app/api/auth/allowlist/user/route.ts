import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('auth_allowlist')
      .select('name, role, is_active')
      .eq('email', email.toLowerCase().trim())
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Allowlist lookup error:', error);
      return NextResponse.json({ error: 'User not found in allowlist' }, { status: 404 });
    }

    if (!data) {
      return NextResponse.json({ error: 'User not found in allowlist' }, { status: 404 });
    }

    return NextResponse.json({
      name: data.name,
      role: data.role,
      is_active: data.is_active
    });

  } catch (error) {
    console.error('Allowlist API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
