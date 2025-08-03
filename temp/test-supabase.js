// Test Supabase Connection
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://jpmhwyjiuodsvjowddsm.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwbWh3eWppdW9kc3Zqb3dkZHNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2MjY0NDQsImV4cCI6MjA2NDIwMjQ0NH0.x0WGKEQfTmv5MSR3e7YGgg_bvec2niphg6ZSho-T-6E";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSupabase() {
  console.log('🔧 Testing Supabase connection...');
  
  try {
    // Test 1: Check if we can connect
    console.log('📡 Testing connection...');
    const { data, error } = await supabase
      .from('products')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Connection failed:', error);
      return;
    }
    
    console.log('✅ Connection successful!');
    
    // Test 2: Try to insert a test record
    console.log('📝 Testing insert...');
    const testData = {
      produkt_hersteller: 'Test Hersteller',
      produkt_name_modell: 'Test Produkt',
      erfassung_quell_url: 'https://test.com',
      erfassung_erfassungsdatum: new Date().toISOString(),
      erfassung_erfassung_fuer: 'Deutschland'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('products')
      .insert([testData])
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Insert failed:', insertError);
      return;
    }
    
    console.log('✅ Insert successful!', insertData);
    
    // Test 3: Clean up test data
    console.log('🧹 Cleaning up test data...');
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', insertData.id);
    
    if (deleteError) {
      console.error('❌ Cleanup failed:', deleteError);
      return;
    }
    
    console.log('✅ Cleanup successful!');
    console.log('🎉 All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSupabase(); 