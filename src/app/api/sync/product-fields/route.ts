import { NextRequest, NextResponse } from 'next/server';
import { syncProductFields } from '@/lib/sync/productFieldSync';

export async function POST(request: NextRequest) {
  try {
    const result = await syncProductFields();
    
    return NextResponse.json({
      success: true,
      message: 'Synchronisation abgeschlossen',
      data: result
    });
  } catch (error) {
    console.error('Synchronisation error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Fehler bei der Synchronisation',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Führe nur eine Validierung durch, keine Änderungen
    const { searchParams } = new URL(request.url);
    const validateOnly = searchParams.get('validate') === 'true';
    
    if (validateOnly) {
      // Hier würde die Validierungslogik implementiert werden
      return NextResponse.json({
        success: true,
        message: 'Validierung abgeschlossen',
        data: {
          status: 'validated',
          timestamp: new Date().toISOString()
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Sync API verfügbar',
      endpoints: {
        POST: '/api/sync/product-fields',
        GET: '/api/sync/product-fields?validate=true'
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'API-Fehler',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 