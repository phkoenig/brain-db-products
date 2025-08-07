// Umfassender Debug-Test für Perplexity-Integration auf Vercel
const PERPLEXITY_API_KEY = "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";

async function testPerplexityAPI() {
  console.log('🧪 === STARTE PERPLEXITY DEBUG-TEST ===');
  console.log('📅 Zeitstempel:', new Date().toISOString());
  console.log('🔑 API Key verfügbar:', !!PERPLEXITY_API_KEY);
  console.log('🔑 API Key Länge:', PERPLEXITY_API_KEY?.length);
  console.log('🔑 API Key Start:', PERPLEXITY_API_KEY?.substring(0, 10) + '...');
  
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
    
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(simplePayload)
    });

    console.log('📡 Response Status:', response.status);
    console.log('📡 Response Headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', errorText);
      return false;
    }

    const data = await response.json();
    console.log('✅ API Success!');
    console.log('📝 Response:', JSON.stringify(data, null, 2));
    
    const content = data.choices?.[0]?.message?.content;
    console.log('🎯 Answer:', content);
    
  } catch (error) {
    console.error('❌ Test 1 failed:', error);
    return false;
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
    
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productPayload)
    });

    console.log('📡 Response Status:', response.status);
    console.log('📡 Response Headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Produkt-Analyse Error:', errorText);
      return false;
    }

    const data = await response.json();
    console.log('✅ Produkt-Analyse Success!');
    console.log('📝 Response:', JSON.stringify(data, null, 2));
    
    const content = data.choices?.[0]?.message?.content;
    console.log('🎯 Produkt-Analyse Answer:', content);
    
  } catch (error) {
    console.error('❌ Test 2 failed:', error);
    return false;
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
  
  envVars.forEach(varName => {
    const value = process.env[varName];
    console.log(`${varName}: ${value ? '✅ Verfügbar' : '❌ Fehlt'} ${value ? `(${value.substring(0, 10)}...)` : ''}`);
  });

  // Test 4: Network Connectivity
  console.log('\n📡 TEST 4: Network Connectivity');
  try {
    console.log('🔍 Teste Verbindung zu Perplexity API...');
    const startTime = Date.now();
    
    const response = await fetch('https://api.perplexity.ai/health', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
      }
    });
    
    const endTime = Date.now();
    console.log(`⏱️ Response Time: ${endTime - startTime}ms`);
    console.log('📡 Health Check Status:', response.status);
    
  } catch (error) {
    console.error('❌ Network Test failed:', error);
  }

  console.log('\n✅ === PERPLEXITY DEBUG-TEST ABGESCHLOSSEN ===');
  return true;
}

// Test ausführen
testPerplexityAPI().then(success => {
  console.log(success ? '✅ Debug-Test erfolgreich!' : '❌ Debug-Test fehlgeschlagen!');
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ Debug-Test Exception:', error);
  process.exit(1);
}); 