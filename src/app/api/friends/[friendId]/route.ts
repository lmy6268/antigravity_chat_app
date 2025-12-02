import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { HTTP_STATUS } from '@/lib/constants';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ friendId: string }> }
) {
  try {
    const { friendId } = await params; // friendship ID (row ID in friends table)
    const { status } = await request.json();

    if (!['accepted', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: HTTP_STATUS.BAD_REQUEST });
    }

    if (status === 'rejected') {
      // Rejecting means deleting the request
      const { error } = await supabase
        .from('friends')
        .delete()
        .eq('id', friendId);
        
      if (error) throw error;
      return NextResponse.json({ message: 'Friend request rejected' });
    }

    // Accepting
    const { error } = await supabase
      .from('friends')
      .update({ status: 'accepted' })
      .eq('id', friendId);

    if (error) throw error;

    return NextResponse.json({ message: 'Friend request accepted' });
  } catch (error) {
    console.error('Error updating friend request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ friendId: string }> }
) {
  try {
    const { friendId } = await params;

    const { error } = await supabase
      .from('friends')
      .delete()
      .eq('id', friendId);

    if (error) throw error;

    return NextResponse.json({ message: 'Friend removed' });
  } catch (error) {
    console.error('Error removing friend:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
  }
}
