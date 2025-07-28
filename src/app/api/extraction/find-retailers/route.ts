import { NextRequest, NextResponse } from 'next/server';
import { PerplexityService } from '@/lib/extraction/perplexityService';

export async function POST(request: NextRequest) {
    const { productName, manufacturerName, country } = await request.json();

    if (!productName || !manufacturerName || !country) {
        return NextResponse.json({ error: 'productName, manufacturerName, and country are required' }, { status: 400 });
    }

    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: 'Perplexity API key is not configured' }, { status: 500 });
    }

    try {
        const perplexityService = new PerplexityService(apiKey);
        const retailers = await perplexityService.findRetailers(productName, manufacturerName, country);
        
        return NextResponse.json({ retailers });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}