import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(_request: NextRequest) {
  try {
    // Join wfs_layers with wfs_streams to include bundesland_oder_region
    const { data, error } = await supabase
      .from('wfs_layers')
      .select(`
        id,
        name,
        titel,
        abstract,
        schluesselwoerter,
        inspire_thema_codes,
        geometrietyp,
        feature_typ,
        inspire_konformitaet,
        wfs_streams: wfs_id ( bundesland_oder_region )
      `)
      .limit(500);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Normalize output to the shape expected by the page
    const rows = (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      title: row.titel ?? row.name,
      abstract: row.abstract ?? null,
      schluesselwoerter: row.schluesselwoerter ?? [],
      inspire_thema_codes: row.inspire_thema_codes ?? [],
      geometrietyp: row.geometrietyp ?? null,
      feature_typ: row.feature_typ ?? null,
      inspire_konform: row.inspire_konformitaet === 'konform',
      bundesland_oder_region: row.wfs_streams?.bundesland_oder_region ?? null,
    }));

    return NextResponse.json(rows);
  } catch (err: any) {
    console.error('GET /api/wfs-layers failed:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
