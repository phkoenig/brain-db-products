// Test-Skript für Perplexity API
const PERPLEXITY_API_KEY = "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";

async function testPerplexityAPI() {
  console.log('🧪 Teste Perplexity API...');
  
  const testPayload = {
    model: "sonar-pro",
    messages: [
      { 
        role: "system", 
        content: "Be precise and factual." 
      },
      { 
        role: "user", 
        content: "How many moons does Mars have?" 
      }
    ]
  };

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
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
    
    return true;
  } catch (error) {
    console.error('❌ Network Error:', error);
    return false;
  }
}

// Test ausführen
testPerplexityAPI().then(success => {
  console.log(success ? '✅ API Test erfolgreich!' : '❌ API Test fehlgeschlagen!');
  process.exit(success ? 0 : 1);
}); 