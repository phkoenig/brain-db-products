import { NextRequest, NextResponse } from 'next/server';
import { PerplexityService } from '@/lib/extraction/perplexityService';

export async function POST(request: NextRequest) {
    const { productName, retailerName } = await request.json();

    if (!productName || !retailerName) {
        return NextResponse.json({ error: 'productName and retailerName are required' }, { status: 400 });
    }

    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: 'Perplexity API key is not configured' }, { status: 500 });
    }

    try {
        const perplexityService = new PerplexityService(apiKey);
        const manufacturerInfo = await perplexityService.findManufacturerInfo(productName, retailerName);
        
        return NextResponse.json(manufacturerInfo);

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}