import { NextResponse } from 'next/server';
import { HTTP_STATUS } from '@/lib/api-constants';
import { dao } from '@/dao/supabase';

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
      await dao.friend.delete(friendId);
      return NextResponse.json({ message: 'Friend request rejected' });
    }

    // Accepting
    await dao.friend.updateStatus(friendId, 'accepted');

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

    await dao.friend.delete(friendId);

    return NextResponse.json({ message: 'Friend removed' });
  } catch (error) {
    console.error('Error removing friend:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
  }
}
