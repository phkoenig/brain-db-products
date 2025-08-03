const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = "https://jpmhwyjiuodsvjowddsm.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwbWh3eWppdW9kc3Zqb3dkZHNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2MjY0NDQsImV4cCI6MjA2NDIwMjQ0NH0.x0WGKEQfTmv5MSR3e7YGgg_bvec2niphg6ZSho-T-6E";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSimpleMigration() {
  console.log('🧪 Simple Migration Test...\n');

  try {
    // 1. Create ProductFiles bucket
    console.log('📦 Creating ProductFiles bucket...');
    const { error: bucketError } = await supabase.storage.createBucket('productfiles', {
      public: true,
      allowedMimeTypes: ['image/*'],
      fileSizeLimit: 52428800 // 50MB
    });

    if (bucketError && !bucketError.message.includes('already exists')) {
      console.error('❌ Error creating bucket:', bucketError);
      return;
    }
    console.log('✅ ProductFiles bucket ready');

    // 2. Get one capture with Base64 data
    console.log('\n📋 Getting capture with Base64 data...');
    const { data: captures, error: capturesError } = await supabase
      .from('captures')
      .select('id, screenshot_url, created_at')
      .like('screenshot_url', 'data:%')
      .limit(1);

    if (capturesError) {
      console.error('❌ Error fetching captures:', capturesError);
      return;
    }

    if (captures.length === 0) {
      console.log('❌ No captures with Base64 data found');
      return;
    }

    const capture = captures[0];
    console.log('✅ Found capture ID:', capture.id);

    // 3. Convert Base64 to file and upload
    console.log('\n🔄 Converting Base64 to file...');
    const base64Data = capture.screenshot_url;
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    
    if (!matches) {
      console.error('❌ Invalid Base64 format');
      return;
    }

    const mimeType = matches[1];
    const base64Content = matches[2];
    const buffer = Buffer.from(base64Content, 'base64');
    
    const filename = `product_${capture.id}_screenshot.png`;
    console.log('📁 Uploading as:', filename);

    // 4. Upload to ProductFiles bucket
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('productfiles')
      .upload(filename, buffer, {
        contentType: mimeType,
        upsert: true
      });

    if (uploadError) {
      console.error('❌ Upload error:', uploadError);
      return;
    }

    console.log('✅ File uploaded successfully:', uploadData.path);

    // 5. Get public URL
    const { data: urlData } = supabase.storage
      .from('productfiles')
      .getPublicUrl(filename);

    console.log('🔗 Public URL:', urlData.publicUrl);

    // 6. Create product record
    console.log('\n📝 Creating product record...');
    const { data: productData, error: productError } = await supabase
      .from('products')
      .insert({
        name: `Product from Capture ${capture.id}`,
        description: `Auto-generated product from capture ${capture.id}`,
        image_url: urlData.publicUrl,
        created_at: capture.created_at,
        updated_at: new Date().toISOString()
      })
      .select();

    if (productError) {
      console.error('❌ Error creating product:', productError);
      return;
    }

    console.log('✅ Product created:', productData[0].id);

    console.log('\n🎉 Migration test completed successfully!');
    console.log('📊 Summary:');
    console.log('- Capture ID:', capture.id);
    console.log('- File uploaded:', filename);
    console.log('- Product created:', productData[0].id);
    console.log('- Public URL:', urlData.publicUrl);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testSimpleMigration(); 