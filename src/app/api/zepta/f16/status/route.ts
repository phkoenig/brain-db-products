import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'active',
    project: 'F16',
    portal: 'ZEPTA',
    version: '1.0.0',
    features: [
      'ACC Integration',
      'Blog & Logbuch', 
      'Bemusterungs-Tool',
      'APS Viewer'
    ]
  });
}
