// Lokaler Debug-Test für Perplexity-Integration
const PERPLEXITY_API_KEY = "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";

async function testPerplexityLocal() {
  console.log('🧪 === LOKALER PERPLEXITY DEBUG-TEST ===');
  
  const testUrl = "https://www.skybad.de/keuco-ixmo-pure-black-selection-2-wege-umstellventil-59556370201-unterputz-brausehalter-griff-pure-rund-schwarz-matt.html";
  
  // Test 1: Einfacher API-Call (wie in der App)
  console.log('\n📡 TEST 1: Einfacher API-Call');
  try {
    const simplePayload = {
      model: "sonar-pro",
      messages: [
        { role: "system", content: "Be precise and factual." },
        { role: "user", content: "What is 2+2?" }
      ]
    };

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(simplePayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', errorText);
      return false;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    console.log('✅ Simple test successful!');
    console.log('🎯 Answer:', content);
    
  } catch (error) {
    console.error('❌ Test 1 failed:', error);
    return false;
  }

  // Test 2: Produkt-Analyse mit dem gleichen Prompt wie in der App
  console.log('\n📡 TEST 2: Produkt-Analyse mit App-Prompt');
  try {
    const productPrompt = `Analysiere die Webseite ${testUrl} und extrahiere relevante Produktinformationen als JSON.`;
    
    const productPayload = {
      model: "sonar-pro",
      messages: [
        { 
          role: "system", 
          content: `URL: ${testUrl}`
        },
        { 
          role: "user", 
          content: productPrompt
        }
      ],
      temperature: 0.1,
      max_tokens: 4000
    };

    console.log('📤 Sende Produkt-Analyse Request...');
    console.log('📤 URL:', testUrl);
    console.log('📤 Prompt:', productPrompt);
    
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Produkt-Analyse Error:', errorText);
      return false;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log('✅ Produkt-Analyse successful!');
    console.log('🎯 Raw content:', content);
    
    // Teste JSON-Parsing wie in der App
    console.log('\n📡 TEST 3: JSON-Parsing Test');
    try {
      let cleanedContent = content.trim();
      
      // Extrahiere JSON aus Markdown-Code-Blöcken
      const jsonMatch = cleanedContent.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        cleanedContent = jsonMatch[1].trim();
        console.log('✅ Extracted JSON from markdown block');
      } else if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```[\s\S]*$/, '');
      } else if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```[\s\S]*$/, '');
      } else {
        // Versuche JSON-Array oder -Objekt zu finden
        // PRIORITÄT: Erst nach dem äußersten Objekt suchen, dann nach Arrays
        // Verwende non-greedy matching für das äußerste Objekt
        const objectMatch = cleanedContent.match(/(\{[\s\S]*\})/);
        const arrayMatch = cleanedContent.match(/(\[[\s\S]*?\])/);
        
        if (objectMatch) {
          cleanedContent = objectMatch[1];
          console.log('✅ Extracted JSON object from text');
        } else if (arrayMatch) {
          cleanedContent = arrayMatch[1];
          console.log('✅ Extracted JSON array from text');
        }
      }
      
      console.log('🧹 Cleaned content:', cleanedContent);
      
      const parsedData = JSON.parse(cleanedContent);
      console.log('✅ JSON parsing successful!');
      console.log('📊 Parsed data:', JSON.stringify(parsedData, null, 2));
      
      // Zähle die extrahierten Felder
      const fieldCount = Object.keys(parsedData).length;
      console.log(`📈 Extracted ${fieldCount} fields`);
      
    } catch (parseError) {
      console.error('❌ JSON parsing failed:', parseError);
      console.log('🔍 Raw content that failed to parse:', content);
    }
    
  } catch (error) {
    console.error('❌ Test 2 failed:', error);
    return false;
  }

  console.log('\n✅ === LOKALER PERPLEXITY DEBUG-TEST ABGESCHLOSSEN ===');
  return true;
}

// Test ausführen
testPerplexityLocal().then(success => {
  console.log(success ? '✅ Debug-Test erfolgreich!' : '❌ Debug-Test fehlgeschlagen!');
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ Debug-Test Exception:', error);
  process.exit(1);
}); 