import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { query } from '@/lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const user = await getAuthUser(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Verify user is part of the conversation
    const conversationResult = await query(
      `SELECT participant1_id, participant2_id 
       FROM conversations 
       WHERE id = $1 AND (participant1_id = $2 OR participant2_id = $2)`,
      [params.conversationId, user.id]
    )

    if (conversationResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      )
    }

    const conversation = conversationResult.rows[0]
    const otherUserId = conversation.participant1_id === user.id 
      ? conversation.participant2_id 
      : conversation.participant1_id

    // Get other user info
    const otherUserResult = await query(
      'SELECT id, name, profile_picture, role FROM users WHERE id = $1',
      [otherUserId]
    )

    const otherUser = otherUserResult.rows[0]

    // Get messages
    const messagesResult = await query(
      `SELECT m.id, m.sender_id, m.receiver_id, m.content, m.is_read, m.created_at,
              u.name as sender_name, u.profile_picture as sender_picture
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE (
         (m.sender_id = $1 AND m.receiver_id = $2) OR
         (m.sender_id = $2 AND m.receiver_id = $1)
       )
       ORDER BY m.created_at DESC
       LIMIT $3 OFFSET $4`,
      [user.id, otherUserId, limit, offset]
    )

    // Get total message count
    const countResult = await query(
      `SELECT COUNT(*) as total
       FROM messages
       WHERE (
         (sender_id = $1 AND receiver_id = $2) OR
         (sender_id = $2 AND receiver_id = $1)
       )`,
      [user.id, otherUserId]
    )

    const total = parseInt(countResult.rows[0].total)

    const messages = messagesResult.rows.reverse().map(row => ({
      id: row.id,
      senderId: row.sender_id,
      receiverId: row.receiver_id,
      content: row.content,
      isRead: row.is_read,
      timestamp: row.created_at,
      sender: {
        name: row.sender_name,
        profilePicture: row.sender_picture,
      },
    }))

    return NextResponse.json({
      conversationId: params.conversationId,
      otherUser: {
        id: otherUser.id,
        name: otherUser.name,
        profilePicture: otherUser.profile_picture,
        role: otherUser.role,
      },
      messages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get messages error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const user = await getAuthUser(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user is part of the conversation
    const conversationResult = await query(
      `SELECT participant1_id, participant2_id 
       FROM conversations 
       WHERE id = $1 AND (participant1_id = $2 OR participant2_id = $2)`,
      [params.conversationId, user.id]
    )

    if (conversationResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      )
    }

    const conversation = conversationResult.rows[0]
    const otherUserId = conversation.participant1_id === user.id 
      ? conversation.participant2_id 
      : conversation.participant1_id

    // Mark all messages from the other user as read
    const result = await query(
      `UPDATE messages 
       SET is_read = true 
       WHERE sender_id = $1 AND receiver_id = $2 AND is_read = false
       RETURNING id`,
      [otherUserId, user.id]
    )

    const markedAsReadCount = result.rows.length

    // Log activity if any messages were marked as read
    if (markedAsReadCount > 0) {
      await query(
        `INSERT INTO user_activity_logs (user_id, action, resource_type, resource_id, metadata) 
         VALUES ($1, $2, $3, $4, $5)`,
        [
          user.id,
          'messages_read',
          'conversation',
          params.conversationId,
          JSON.stringify({ markedAsReadCount }),
        ]
      )
    }

    return NextResponse.json({
      success: true,
      markedAsReadCount,
      message: `${markedAsReadCount} messages marked as read`,
    })
  } catch (error) {
    console.error('Mark messages as read error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}