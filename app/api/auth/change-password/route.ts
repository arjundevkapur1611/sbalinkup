import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, verifyPassword, hashPassword } from '@/lib/auth'
import { query } from '@/lib/database'
import { z } from 'zod'

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
})

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
    const { currentPassword, newPassword } = changePasswordSchema.parse(body)

    // Get current password hash
    const result = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [user.id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const currentPasswordHash = result.rows[0].password_hash

    // Verify current password
    const isValidPassword = await verifyPassword(currentPassword, currentPasswordHash)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      )
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword)

    // Update password
    await query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newPasswordHash, user.id]
    )

    // Log activity
    await query(
      `INSERT INTO user_activity_logs (user_id, action, ip_address, user_agent) 
       VALUES ($1, $2, $3, $4)`,
      [
        user.id,
        'password_changed',
        request.ip || 'unknown',
        request.headers.get('user-agent') || 'unknown',
      ]
    )

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully',
    })
  } catch (error) {
    console.error('Change password error:', error)
    
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