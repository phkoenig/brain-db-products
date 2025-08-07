import { NextRequest, NextResponse } from 'next/server';

// Node.js Runtime verwenden
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  console.log('🧪 === PERPLEXITY TEST API STARTED ===');
  
  const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
  console.log('🔑 API Key available:', !!PERPLEXITY_API_KEY);
  
  if (!PERPLEXITY_API_KEY) {
    return NextResponse.json({ error: 'Perplexity API key not found' }, { status: 500 });
  }

  try {
    // Test 1: Simple API call
    console.log('📡 Testing simple Perplexity API call...');
    
    const testPayload = {
      model: "sonar-pro",
      messages: [
        { role: "system", content: "Be precise and factual." },
        { role: "user", content: "What is 2+2?" }
      ]
    };

    const startTime = Date.now();
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    });
    const endTime = Date.now();

    console.log('📡 Response status:', response.status);
    console.log('📡 Response time:', endTime - startTime, 'ms');

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', errorText);
      return NextResponse.json({ 
        error: 'Perplexity API failed', 
        status: response.status,
        details: errorText 
      }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log('✅ Simple test successful!');
    console.log('🎯 Answer:', content);

    return NextResponse.json({
      success: true,
      test: 'simple',
      answer: content,
      responseTime: endTime - startTime,
      status: response.status
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
    return NextResponse.json({ 
      error: 'Test failed', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 