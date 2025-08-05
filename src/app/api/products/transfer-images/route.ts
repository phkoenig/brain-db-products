import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { productId, captureId, url } = await request.json();

    if (!productId || !captureId) {
      return NextResponse.json(
        { error: 'Product ID und Capture ID sind erforderlich' },
        { status: 400 }
      );
    }

    // Supabase-Client mit Secret Key für Server-Side-Operationen - moved inside function
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;
    
    if (!supabaseUrl || !supabaseSecretKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseSecretKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    console.log(`🔄 Starte Bildübertragung für Product ${productId} von Capture ${captureId}`);
    console.log('API-Request:', { productId, captureId, url });

    // 1. Hole Capture-Daten aus der Datenbank
    const { data: capture, error: captureError } = await supabase
      .from('captures')
      .select('id, screenshot_url, thumbnail_url, created_at')
      .eq('id', captureId)
      .single();
    console.log('Geladene Capture-Daten:', {
      id: capture?.id,
      screenshot_url: capture?.screenshot_url?.substring(0, 100),
      thumbnail_url: capture?.thumbnail_url?.substring(0, 100),
      created_at: capture?.created_at,
    });

    if (captureError || !capture) {
      console.error('❌ Fehler beim Laden der Capture-Daten:', captureError);
      return NextResponse.json(
        { error: 'Capture nicht gefunden', details: captureError?.message },
        { status: 404 }
      );
    }

    console.log(`✅ Capture ${captureId} geladen`);

    const uploadedImages: { [key: string]: string | null } = {
      screenshot_path: null,
      thumbnail_path: null
    };

    // 2. Erstelle ProductFiles Bucket falls nicht vorhanden
    const { error: bucketError } = await supabase.storage.createBucket('productfiles', {
      public: true,
      allowedMimeTypes: ['image/*'],
      fileSizeLimit: 52428800 // 50MB
    });

    if (bucketError && !bucketError.message.includes('already exists')) {
      console.error('❌ Bucket-Erstellungsfehler:', bucketError);
      return NextResponse.json(
        { error: 'Fehler beim Erstellen des Storage Buckets', details: bucketError.message },
        { status: 500 }
      );
    }

    console.log('✅ ProductFiles Bucket bereit');

    // 3. Übertrage Screenshot (falls vorhanden)
    if (capture.screenshot_url && capture.screenshot_url.startsWith('data:')) {
      try {
        console.log('🔄 Übertrage Screenshot...');
        
        // Base64 zu Buffer konvertieren
        const base64Data = capture.screenshot_url;
        const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        
        if (matches) {
          const mimeType = matches[1];
          const base64Content = matches[2];
          const buffer = Buffer.from(base64Content, 'base64');
          const filename = `product_${productId}_screenshot.png`;

          // Upload in ProductFiles Bucket
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('productfiles')
            .upload(filename, buffer, {
              contentType: mimeType,
              upsert: true
            });

          if (uploadError) {
            console.error('❌ Screenshot Upload-Fehler:', uploadError);
          } else {
            // Hole Public URL
            const { data: urlData } = supabase.storage
              .from('productfiles')
              .getPublicUrl(filename);

            uploadedImages.screenshot_path = urlData.publicUrl;
            console.log('✅ Screenshot erfolgreich übertragen:', urlData.publicUrl);
          }
        }
      } catch (screenshotError) {
        console.error('❌ Screenshot-Übertragungsfehler:', screenshotError);
      }
    } else {
      console.log('ℹ️ Kein Base64-Screenshot verfügbar');
    }

    // 4. Übertrage Thumbnail (falls vorhanden)
    if (capture.thumbnail_url && capture.thumbnail_url.startsWith('data:')) {
      try {
        console.log('🔄 Übertrage Thumbnail...');
        
        // Base64 zu Buffer konvertieren
        const base64Data = capture.thumbnail_url;
        const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        
        if (matches) {
          const mimeType = matches[1];
          const base64Content = matches[2];
          const buffer = Buffer.from(base64Content, 'base64');
          const filename = `product_${productId}_thumbnail.png`;

          // Upload in ProductFiles Bucket
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('productfiles')
            .upload(filename, buffer, {
              contentType: mimeType,
              upsert: true
            });

          if (uploadError) {
            console.error('❌ Thumbnail Upload-Fehler:', uploadError);
          } else {
            // Hole Public URL
            const { data: urlData } = supabase.storage
              .from('productfiles')
              .getPublicUrl(filename);

            uploadedImages.thumbnail_path = urlData.publicUrl;
            console.log('✅ Thumbnail erfolgreich übertragen:', urlData.publicUrl);
          }
        }
      } catch (thumbnailError) {
        console.error('❌ Thumbnail-Übertragungsfehler:', thumbnailError);
      }
    } else {
      console.log('ℹ️ Kein Base64-Thumbnail verfügbar');
    }

    // 5. Aktualisiere Produkt-Eintrag mit den neuen Bild-URLs
    const updateData: any = {};
    if (uploadedImages.screenshot_path) {
      updateData.screenshot_path = uploadedImages.screenshot_path;
    }
    if (uploadedImages.thumbnail_path) {
      updateData.thumbnail_path = uploadedImages.thumbnail_path;
    }

    // Debug-Info für die Response
    const debugInfo = {
      requestedCaptureId: captureId,
      loadedCaptureId: capture?.id,
      screenshotUrlStart: capture?.screenshot_url?.substring(0, 100),
      thumbnailUrlStart: capture?.thumbnail_url?.substring(0, 100),
      createdAt: capture?.created_at,
    };

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', productId);

      if (updateError) {
        console.error('❌ Fehler beim Aktualisieren des Produkts:', updateError);
        return NextResponse.json(
          { error: 'Fehler beim Aktualisieren des Produkts', details: updateError.message, debug: debugInfo },
          { status: 500 }
        );
      }

      console.log('✅ Produkt mit neuen Bild-URLs aktualisiert');
    }

    console.log('🎉 Bildübertragung erfolgreich abgeschlossen');

    return NextResponse.json({
      success: true,
      uploadedImages,
      message: 'Bilder erfolgreich übertragen',
      debug: debugInfo
    });

  } catch (error) {
    console.error('❌ Unerwarteter Fehler bei der Bildübertragung:', error);
    return NextResponse.json(
      { 
        error: 'Interner Server-Fehler', 
        details: error instanceof Error ? error.message : 'Unbekannter Fehler'
      },
      { status: 500 }
    );
  }
} 