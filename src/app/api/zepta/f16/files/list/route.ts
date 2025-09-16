import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client with service role for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function GET(request: NextRequest) {
  try {
    // Get user ID from request headers (set by client)
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const fileType = searchParams.get('type'); // 'image' or 'pdf'

    // List files from the user's folder
    const { data: files, error } = await supabase.storage
      .from('f16-files')
      .list(userId, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) {
      console.error('Error listing files:', error);
      return NextResponse.json({ error: 'Failed to list files' }, { status: 500 });
    }

    // Filter by file type if specified
    let filteredFiles = files || [];
    if (fileType === 'image') {
      filteredFiles = files?.filter(file => 
        file.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)
      ) || [];
    } else if (fileType === 'pdf') {
      filteredFiles = files?.filter(file => 
        file.name.match(/\.pdf$/i)
      ) || [];
    }

    // Get public URLs for each file
    const filesWithUrls = await Promise.all(
      filteredFiles.map(async (file) => {
        const { data: urlData } = supabase.storage
          .from('f16-files')
          .getPublicUrl(`${userId}/${file.name}`);

        return {
          name: file.name,
          size: file.metadata?.size || 0,
          type: file.metadata?.mimetype || 'unknown',
          url: urlData.publicUrl,
          uploadedAt: file.created_at,
          isImage: file.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) !== null,
          isPdf: file.name.match(/\.pdf$/i) !== null
        };
      })
    );

    return NextResponse.json({ files: filesWithUrls });

  } catch (error) {
    console.error('Error in files list API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
