import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { query, transaction } from '@/lib/database'
import { z } from 'zod'

const sendMessageSchema = z.object({
  receiverId: z.string().uuid('Invalid receiver ID'),
  content: z.string().min(1, 'Message content is required').max(1000, 'Message too long'),
})

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get all conversations for the user
    const result = await query(
      `SELECT DISTINCT c.id as conversation_id,
              CASE 
                WHEN c.participant1_id = $1 THEN c.participant2_id
                ELSE c.participant1_id
              END as other_user_id,
              u.name as other_user_name,
              u.profile_picture as other_user_picture,
              u.role as other_user_role,
              c.last_activity,
              lm.content as last_message_content,
              lm.sender_id as last_message_sender_id,
              lm.created_at as last_message_time,
              (SELECT COUNT(*) 
               FROM messages m 
               WHERE (
                 (m.sender_id = c.participant1_id AND m.receiver_id = c.participant2_id) OR
                 (m.sender_id = c.participant2_id AND m.receiver_id = c.participant1_id)
               ) AND m.receiver_id = $1 AND m.is_read = false
              ) as unread_count
       FROM conversations c
       LEFT JOIN messages lm ON c.last_message_id = lm.id
       LEFT JOIN users u ON (
         CASE 
           WHEN c.participant1_id = $1 THEN c.participant2_id
           ELSE c.participant1_id
         END
       ) = u.id
       WHERE (c.participant1_id = $1 OR c.participant2_id = $1)
       AND u.is_active = true
       ORDER BY c.last_activity DESC`,
      [user.id]
    )

    const conversations = result.rows.map(row => ({
      id: row.conversation_id,
      otherUser: {
        id: row.other_user_id,
        name: row.other_user_name,
        profilePicture: row.other_user_picture,
        role: row.other_user_role,
      },
      lastMessage: row.last_message_content ? {
        content: row.last_message_content,
        senderId: row.last_message_sender_id,
        timestamp: row.last_message_time,
      } : null,
      lastActivity: row.last_activity,
      unreadCount: parseInt(row.unread_count || '0'),
    }))

    return NextResponse.json({
      conversations,
      totalUnread: conversations.reduce((sum, conv) => sum + conv.unreadCount, 0),
    })
  } catch (error) {
    console.error('Get conversations error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { receiverId, content } = sendMessageSchema.parse(body)

    // Validate receiver exists and is active
    const receiverResult = await query(
      'SELECT id, name FROM users WHERE id = $1 AND is_active = true',
      [receiverId]
    )

    if (receiverResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Receiver not found' },
        { status: 404 }
      )
    }

    const receiver = receiverResult.rows[0]

    // Can't message yourself
    if (user.id === receiverId) {
      return NextResponse.json(
        { error: 'Cannot send message to yourself' },
        { status: 400 }
      )
    }

    // Use transaction to ensure consistency
    const result = await transaction(async (client) => {
      // Insert the message
      const messageResult = await client.query(
        `INSERT INTO messages (sender_id, receiver_id, content) 
         VALUES ($1, $2, $3)
         RETURNING id, created_at`,
        [user.id, receiverId, content]
      )

      const message = messageResult.rows[0]

      // Find or create conversation
      const participant1 = user.id < receiverId ? user.id : receiverId
      const participant2 = user.id < receiverId ? receiverId : user.id

      let conversationResult = await client.query(
        'SELECT id FROM conversations WHERE participant1_id = $1 AND participant2_id = $2',
        [participant1, participant2]
      )

      let conversationId

      if (conversationResult.rows.length === 0) {
        // Create new conversation
        const newConvResult = await client.query(
          `INSERT INTO conversations (participant1_id, participant2_id, last_message_id, last_activity) 
           VALUES ($1, $2, $3, NOW())
           RETURNING id`,
          [participant1, participant2, message.id]
        )
        conversationId = newConvResult.rows[0].id
      } else {
        // Update existing conversation
        conversationId = conversationResult.rows[0].id
        await client.query(
          `UPDATE conversations 
           SET last_message_id = $1, last_activity = NOW() 
           WHERE id = $2`,
          [message.id, conversationId]
        )
      }

      return { message, conversationId }
    })

    // Create notification for receiver
    await query(
      `INSERT INTO notifications (user_id, type, title, message, data) 
       VALUES ($1, $2, $3, $4, $5)`,
      [
        receiverId,
        'message',
        'New Message',
        `You have a new message from ${user.name}`,
        JSON.stringify({
          senderId: user.id,
          senderName: user.name,
          conversationId: result.conversationId,
        }),
      ]
    )

    // Log activity
    await query(
      `INSERT INTO user_activity_logs (user_id, action, resource_type, resource_id) 
       VALUES ($1, $2, $3, $4)`,
      [user.id, 'message_sent', 'message', result.message.id]
    )

    return NextResponse.json({
      success: true,
      messageId: result.message.id,
      conversationId: result.conversationId,
      sentAt: result.message.created_at,
      message: 'Message sent successfully',
    }, { status: 201 })
  } catch (error) {
    console.error('Send message error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}