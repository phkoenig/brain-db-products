import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(request: NextRequest) {
  try {
    const errorData = await request.json();

    console.log('🚨 API: Logging error:', {
      type: errorData.type,
      message: errorData.message,
      url: errorData.url,
      timestamp: errorData.timestamp
    });

    // Log to Supabase (optional - create error_logs table if needed)
    try {
      const { error } = await supabase
        .from('error_logs')
        .insert([{
          type: errorData.type,
          message: errorData.message,
          stack: errorData.stack,
          component_stack: errorData.componentStack,
          url: errorData.url,
          user_agent: errorData.userAgent,
          timestamp: errorData.timestamp,
          additional_data: errorData.additionalData
        }]);

      if (error) {
        console.error('❌ Failed to log error to Supabase:', error);
        // Don't fail the request if Supabase logging fails
      } else {
        console.log('✅ Error logged to Supabase');
      }
    } catch (supabaseError) {
      console.error('❌ Supabase logging error:', supabaseError);
      // Don't fail the request if Supabase logging fails
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Log Details');
      console.error('Type:', errorData.type);
      console.error('Message:', errorData.message);
      console.error('URL:', errorData.url);
      console.error('Timestamp:', errorData.timestamp);
      if (errorData.stack) {
        console.error('Stack:', errorData.stack);
      }
      if (errorData.componentStack) {
        console.error('Component Stack:', errorData.componentStack);
      }
      if (errorData.additionalData) {
        console.error('Additional Data:', errorData.additionalData);
      }
      console.groupEnd();
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Error logged successfully' 
    });

  } catch (error) {
    console.error('❌ Error logging API failed:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to log error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 