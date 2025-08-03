const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration from test files
const supabaseUrl = "https://jpmhwyjiuodsvjowddsm.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwbWh3eWppdW9kc3Zqb3dkZHNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2MjY0NDQsImV4cCI6MjA2NDIwMjQ0NH0.x0WGKEQfTmv5MSR3e7YGgg_bvec2niphg6ZSho-T-6E";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function migrateScreenshotsToProductFiles() {
  console.log('🚀 Starting screenshot migration to ProductFiles bucket...\n');

  try {
    // 1. Get all captures with screenshots
    console.log('📋 Fetching captures with screenshots...');
    const { data: captures, error: capturesError } = await supabase
      .from('captures')
      .select('id, screenshot_url, thumbnail_url, created_at')
      .not('screenshot_url', 'is', null);

    if (capturesError) {
      throw new Error(`Failed to fetch captures: ${capturesError.message}`);
    }

    console.log(`✅ Found ${captures.length} captures with screenshots\n`);

    // 2. Create ProductFiles bucket if it doesn't exist
    console.log('🪣 Checking/creating ProductFiles bucket...');
    const { data: buckets } = await supabase.storage.listBuckets();
    const productFilesBucket = buckets.find(bucket => bucket.name === 'productfiles');
    
    if (!productFilesBucket) {
      console.log('Creating ProductFiles bucket...');
      const { error: bucketError } = await supabase.storage.createBucket('productfiles', {
        public: false,
        allowedMimeTypes: ['image/*'],
        fileSizeLimit: 52428800 // 50MB
      });
      
      if (bucketError) {
        throw new Error(`Failed to create bucket: ${bucketError.message}`);
      }
      console.log('✅ ProductFiles bucket created');
    } else {
      console.log('✅ ProductFiles bucket already exists');
    }

    // 3. Process each capture
    let successCount = 0;
    let errorCount = 0;

    for (const capture of captures) {
      try {
        console.log(`\n📸 Processing capture ${capture.id}...`);
        
        // Extract filename from URL
        const urlParts = capture.screenshot_url.split('/');
        const originalFilename = urlParts[urlParts.length - 1];
        const fileExtension = path.extname(originalFilename) || '.jpg';
        const newFilename = `capture_${capture.id}_${Date.now()}${fileExtension}`;
        
        console.log(`  Original: ${originalFilename}`);
        console.log(`  New: ${newFilename}`);

        // Download the image from current URL
        console.log('  📥 Downloading image...');
        const response = await fetch(capture.screenshot_url);
        if (!response.ok) {
          throw new Error(`Failed to download image: ${response.status}`);
        }
        
        const imageBuffer = await response.arrayBuffer();
        const uint8Array = new Uint8Array(imageBuffer);

        // Upload to ProductFiles bucket
        console.log('  📤 Uploading to ProductFiles bucket...');
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('productfiles')
          .upload(newFilename, uint8Array, {
            contentType: response.headers.get('content-type') || 'image/jpeg',
            cacheControl: '3600'
          });

        if (uploadError) {
          throw new Error(`Upload failed: ${uploadError.message}`);
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('productfiles')
          .getPublicUrl(newFilename);

        console.log(`  ✅ Uploaded: ${publicUrl}`);

        // 4. Create or update product record
        console.log('  🔗 Linking to products table...');
        
        // Check if product already exists for this capture
        const { data: existingProduct } = await supabase
          .from('products')
          .select('id')
          .eq('capture_id', capture.id)
          .single();

        const productData = {
          name: `Product from Capture ${capture.id}`,
          description: `Auto-generated from capture ${capture.id}`,
          image_url: publicUrl,
          capture_id: capture.id,
          created_at: capture.created_at,
          updated_at: new Date().toISOString()
        };

        let productResult;
        if (existingProduct) {
          // Update existing product
          productResult = await supabase
            .from('products')
            .update(productData)
            .eq('id', existingProduct.id)
            .select();
        } else {
          // Create new product
          productResult = await supabase
            .from('products')
            .insert(productData)
            .select();
        }

        if (productResult.error) {
          throw new Error(`Product operation failed: ${productResult.error.message}`);
        }

        console.log(`  ✅ Product ${existingProduct ? 'updated' : 'created'}: ${productResult.data[0].id}`);
        successCount++;

      } catch (error) {
        console.error(`  ❌ Error processing capture ${capture.id}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n🎉 Migration completed!`);
    console.log(`✅ Successfully processed: ${successCount} captures`);
    console.log(`❌ Errors: ${errorCount} captures`);
    console.log(`📊 Total captures: ${captures.length}`);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run the migration
migrateScreenshotsToProductFiles(); 