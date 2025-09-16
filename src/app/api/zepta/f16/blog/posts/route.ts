import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search') || '';

    let query = supabase
      .from('f16_blog_posts')
      .select('*')
      .eq('status', 'published')
      .eq('project_id', 'F16')
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    const { data: posts, error } = await query;

    if (error) {
      console.error('Error fetching blog posts:', error);
      return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
    }

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Error in blog posts API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 F16 Blog API: POST request received');
    
    const body = await request.json();
    console.log('🔧 F16 Blog API: Request body:', body);
    
    const { title, content, excerpt, featured_image_url, tags } = body;

    // Validate required fields
    if (!title || !content) {
      console.log('🔧 F16 Blog API: Validation failed - missing title or content');
      return NextResponse.json({ 
        error: 'Title and content are required' 
      }, { status: 400 });
    }

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    console.log('🔧 F16 Blog API: Generated slug:', slug);

    const { author_id, author_name, author_email } = body;

    const insertData = {
      title,
      content,
      excerpt: excerpt || content.substring(0, 150) + '...',
      featured_image_url: featured_image_url || null,
      tags: tags || [],
      project_id: 'F16',
      status: 'published',
      slug,
      published_at: new Date().toISOString(),
      author_id: author_id || null,
      author_name: author_name || 'Anonym',
      author_email: author_email || null
    };

    console.log('🔧 F16 Blog API: Insert data:', insertData);

    const { data: post, error } = await supabase
      .from('f16_blog_posts')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('🔧 F16 Blog API: Supabase error:', error);
      return NextResponse.json({ 
        error: 'Failed to create post', 
        details: error.message,
        code: error.code,
        hint: error.hint
      }, { status: 500 });
    }

    console.log('🔧 F16 Blog API: Post created successfully:', post);
    return NextResponse.json({ post });
  } catch (error) {
    console.error('🔧 F16 Blog API: Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
