import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { query } from '@/lib/database'

export async function GET(request: NextRequest) {
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
    const limit = parseInt(searchParams.get('limit') || '20')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const offset = (page - 1) * limit

    let queryText = `
      SELECT id, type, title, message, data, is_read, created_at
      FROM notifications
      WHERE user_id = $1
    `
    const queryParams = [user.id]
    let paramCount = 1

    if (unreadOnly) {
      queryText += ` AND is_read = false`
    }

    queryText += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`
    queryParams.push(limit, offset)

    const result = await query(queryText, queryParams)

    // Get unread count
    const unreadResult = await query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
      [user.id]
    )

    const notifications = result.rows.map(row => ({
      id: row.id,
      type: row.type,
      title: row.title,
      message: row.message,
      data: row.data,
      isRead: row.is_read,
      createdAt: row.created_at,
    }))

    return NextResponse.json({
      notifications,
      unreadCount: parseInt(unreadResult.rows[0].count),
      pagination: {
        page,
        limit,
        total: notifications.length,
      },
    })
  } catch (error) {
    console.error('Get notifications error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { notificationIds, markAsRead } = body

    if (!Array.isArray(notificationIds) || typeof markAsRead !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid input. Expected notificationIds array and markAsRead boolean' },
        { status: 400 }
      )
    }

    // Update notifications
    const result = await query(
      `UPDATE notifications 
       SET is_read = $1 
       WHERE id = ANY($2) AND user_id = $3
       RETURNING id`,
      [markAsRead, notificationIds, user.id]
    )

    const updatedCount = result.rows.length

    return NextResponse.json({
      success: true,
      updatedCount,
      message: `${updatedCount} notifications marked as ${markAsRead ? 'read' : 'unread'}`,
    })
  } catch (error) {
    console.error('Update notifications error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { notificationIds } = body

    if (!Array.isArray(notificationIds)) {
      return NextResponse.json(
        { error: 'Invalid input. Expected notificationIds array' },
        { status: 400 }
      )
    }

    // Delete notifications
    const result = await query(
      `DELETE FROM notifications 
       WHERE id = ANY($1) AND user_id = $2
       RETURNING id`,
      [notificationIds, user.id]
    )

    const deletedCount = result.rows.length

    return NextResponse.json({
      success: true,
      deletedCount,
      message: `${deletedCount} notifications deleted`,
    })
  } catch (error) {
    console.error('Delete notifications error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}