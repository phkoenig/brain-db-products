const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = "https://jpmhwyjiuodsvjowddsm.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwbWh3eWppdW9kc3Zqb3dkZHNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2MjY0NDQsImV4cCI6MjA2NDIwMjQ0NH0.x0WGKEQfTmv5MSR3e7YGgg_bvec2niphg6ZSho-T-6E";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testScreenshotMigration() {
  console.log('🧪 Testing screenshot migration...\n');

  try {
    // 1. Check if ProductFiles bucket exists
    console.log('📦 Checking ProductFiles bucket...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError);
      return;
    }

    const productFilesBucket = buckets.find(bucket => bucket.name === 'productfiles');
    console.log('✅ Buckets found:', buckets.map(b => b.name));
    console.log('📦 ProductFiles bucket exists:', !!productFilesBucket);

    // 2. Get a sample capture
    console.log('\n📋 Getting sample capture...');
    const { data: captures, error: capturesError } = await supabase
      .from('captures')
      .select('id, screenshot_url, created_at')
      .not('screenshot_url', 'is', null)
      .limit(1);

    if (capturesError) {
      console.error('❌ Error fetching captures:', capturesError);
      return;
    }

    if (captures.length === 0) {
      console.log('❌ No captures with screenshots found');
      return;
    }

    const capture = captures[0];
    console.log('✅ Sample capture:', {
      id: capture.id,
      screenshot_url: capture.screenshot_url,
      created_at: capture.created_at
    });

    // 3. Test copying file to ProductFiles bucket
    console.log('\n🔄 Testing file copy to ProductFiles...');
    
    // Extract filename from URL
    const urlParts = capture.screenshot_url.split('/');
    const originalFilename = urlParts[urlParts.length - 1];
    const newFilename = `product_${capture.id}_${originalFilename}`;
    
    console.log('📁 Original filename:', originalFilename);
    console.log('📁 New filename:', newFilename);

    // 4. Create ProductFiles bucket if it doesn't exist
    if (!productFilesBucket) {
      console.log('📦 Creating ProductFiles bucket...');
      const { error: createError } = await supabase.storage.createBucket('productfiles', {
        public: true,
        allowedMimeTypes: ['image/*'],
        fileSizeLimit: 52428800 // 50MB
      });

      if (createError) {
        console.error('❌ Error creating bucket:', createError);
        return;
      }
      console.log('✅ ProductFiles bucket created');
    }

    console.log('\n🎉 Test completed successfully!');
    console.log('📝 Next steps:');
    console.log('1. Download screenshot from:', capture.screenshot_url);
    console.log('2. Upload to ProductFiles bucket as:', newFilename);
    console.log('3. Create product record linking to the new file');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testScreenshotMigration(); 