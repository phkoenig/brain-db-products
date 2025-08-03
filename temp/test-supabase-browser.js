// Browser Test für Supabase
console.log('🔧 Browser Test für Supabase...');

// Prüfe Environment-Variablen
console.log('🔧 NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('🔧 NEXT_PUBLIC_SUPABASE_ANON_KEY vorhanden:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// Teste Supabase-Client
import { supabase } from '../src/lib/supabase.js';

async function testBrowserSupabase() {
  try {
    console.log('🔧 Testing browser Supabase connection...');
    
    // Test 1: Simple select
    const { data, error } = await supabase
      .from('products')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Browser test failed:', error);
      return;
    }
    
    console.log('✅ Browser test successful!', data);
    
  } catch (error) {
    console.error('❌ Browser test exception:', error);
  }
}

// Führe Test aus wenn im Browser
if (typeof window !== 'undefined') {
  testBrowserSupabase();
} 