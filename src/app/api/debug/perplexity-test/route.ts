import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('🧪 === STARTE PERPLEXITY DEBUG-TEST API ===');
  console.log('📅 Zeitstempel:', new Date().toISOString());
  
  const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
  console.log('🔑 API Key verfügbar:', !!PERPLEXITY_API_KEY);
  console.log('🔑 API Key Länge:', PERPLEXITY_API_KEY?.length);
  console.log('🔑 API Key Start:', PERPLEXITY_API_KEY?.substring(0, 10) + '...');
  
  const results = {
    timestamp: new Date().toISOString(),
    apiKeyAvailable: !!PERPLEXITY_API_KEY,
    apiKeyLength: PERPLEXITY_API_KEY?.length,
    tests: []
  };

  // Test 1: Einfacher API-Call
  console.log('\n📡 TEST 1: Einfacher API-Call');
  try {
    const simplePayload = {
      model: "sonar-pro",
      messages: [
        { role: "system", content: "Be precise and factual." },
        { role: "user", content: "What is 2+2?" }
      ]
    };

    console.log('📤 Sende Request an Perplexity...');
    console.log('📤 Payload:', JSON.stringify(simplePayload, null, 2));
    
    const startTime = Date.now();
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(simplePayload)
    });
    const endTime = Date.now();

    console.log('📡 Response Status:', response.status);
    console.log('📡 Response Time:', endTime - startTime, 'ms');
    console.log('📡 Response Headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', errorText);
      results.tests.push({
        name: 'Simple API Call',
        success: false,
        error: errorText,
        status: response.status,
        responseTime: endTime - startTime
      });
    } else {
      const data = await response.json();
      console.log('✅ API Success!');
      console.log('📝 Response:', JSON.stringify(data, null, 2));
      
      const content = data.choices?.[0]?.message?.content;
      console.log('🎯 Answer:', content);
      
      results.tests.push({
        name: 'Simple API Call',
        success: true,
        answer: content,
        status: response.status,
        responseTime: endTime - startTime
      });
    }
    
  } catch (error) {
    console.error('❌ Test 1 failed:', error);
    results.tests.push({
      name: 'Simple API Call',
      success: false,
      error: error.message
    });
  }

  // Test 2: Produkt-Analyse Simulation
  console.log('\n📡 TEST 2: Produkt-Analyse Simulation');
  try {
    const testUrl = "https://www.skybad.de/keuco-ixmo-pure-black-selection-2-wege-umstellventil-59556370201-unterputz-brausehalter-griff-pure-rund-schwarz-matt.html";
    
    const productPayload = {
      model: "sonar-pro",
      messages: [
        { 
          role: "system", 
          content: "Du bist ein Experte für Produktdaten-Extraktion. Analysiere die URL und extrahiere Produktinformationen in JSON-Format." 
        },
        { 
          role: "user", 
          content: `Analysiere diese Produkt-URL und extrahiere die wichtigsten Informationen: ${testUrl}`
        }
      ]
    };

    console.log('📤 Sende Produkt-Analyse Request...');
    console.log('📤 URL:', testUrl);
    console.log('📤 Payload:', JSON.stringify(productPayload, null, 2));
    
    const startTime = Date.now();
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productPayload)
    });
    const endTime = Date.now();

    console.log('📡 Response Status:', response.status);
    console.log('📡 Response Time:', endTime - startTime, 'ms');

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Produkt-Analyse Error:', errorText);
      results.tests.push({
        name: 'Product Analysis',
        success: false,
        error: errorText,
        status: response.status,
        responseTime: endTime - startTime
      });
    } else {
      const data = await response.json();
      console.log('✅ Produkt-Analyse Success!');
      console.log('📝 Response:', JSON.stringify(data, null, 2));
      
      const content = data.choices?.[0]?.message?.content;
      console.log('🎯 Produkt-Analyse Answer:', content);
      
      results.tests.push({
        name: 'Product Analysis',
        success: true,
        answer: content,
        status: response.status,
        responseTime: endTime - startTime
      });
    }
    
  } catch (error) {
    console.error('❌ Test 2 failed:', error);
    results.tests.push({
      name: 'Product Analysis',
      success: false,
      error: error.message
    });
  }

  // Test 3: Environment-Variablen Test
  console.log('\n📡 TEST 3: Environment-Variablen');
  console.log('🔍 Prüfe alle relevanten Environment-Variablen...');
  
  const envVars = [
    'PERPLEXITY_API_KEY',
    'OPENAI_API_KEY', 
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'NEXTCLOUD_URL',
    'NEXTCLOUD_USERNAME',
    'NEXTCLOUD_PASSWORD'
  ];
  
  const envResults = {};
  envVars.forEach(varName => {
    const value = process.env[varName];
    const available = !!value;
    console.log(`${varName}: ${available ? '✅ Verfügbar' : '❌ Fehlt'} ${available ? `(${value.substring(0, 10)}...)` : ''}`);
    envResults[varName] = {
      available,
      length: value?.length,
      preview: available ? value.substring(0, 10) + '...' : null
    };
  });

  results.tests.push({
    name: 'Environment Variables',
    success: true,
    envVars: envResults
  });

  console.log('\n✅ === PERPLEXITY DEBUG-TEST API ABGESCHLOSSEN ===');
  
  return NextResponse.json(results, { status: 200 });
} 