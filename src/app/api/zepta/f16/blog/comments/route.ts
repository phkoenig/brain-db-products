import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('post_id');

    if (!postId) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    const { data: comments, error } = await supabase
      .from('f16_blog_comments')
      .select('*')
      .eq('post_id', postId)
      .eq('status', 'approved')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
    }

    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Error in comments API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    
    const body = await request.json();
    const { post_id, author_name, author_email, author_avatar_url, content, parent_id } = body;

    const { data: comment, error } = await supabase
      .from('f16_blog_comments')
      .insert({
        post_id,
        author_name: author_name || 'Anonym',
        author_email: author_email || null,
        author_avatar_url: author_avatar_url || null,
        content,
        status: 'pending',
        parent_id: parent_id || null
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating comment:', error);
      return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
    }

    return NextResponse.json({ comment });
  } catch (error) {
    console.error('Error in comment creation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
