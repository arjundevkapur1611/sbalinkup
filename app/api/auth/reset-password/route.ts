import { NextRequest, NextResponse } from 'next/server'
import { validateResetToken, deleteResetToken, hashPassword } from '@/lib/auth'
import { query } from '@/lib/database'
import { z } from 'zod'

const resetPasswordSchema = z.object({
  token: z.string().min(6, 'Invalid token format'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, newPassword } = resetPasswordSchema.parse(body)

    // Validate reset token
    const email = await validateResetToken(token)
    if (!email) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    // Get user
    const userResult = await query(
      'SELECT id FROM users WHERE email = $1 AND is_active = true',
      [email]
    )

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const user = userResult.rows[0]

    // Hash new password
    const passwordHash = await hashPassword(newPassword)

    // Update password
    await query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [passwordHash, user.id]
    )

    // Delete used reset token
    await deleteResetToken(token)

    // Log activity
    await query(
      `INSERT INTO user_activity_logs (user_id, action, ip_address, user_agent) 
       VALUES ($1, $2, $3, $4)`,
      [
        user.id,
        'password_reset_completed',
        request.ip || 'unknown',
        request.headers.get('user-agent') || 'unknown',
      ]
    )

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully',
    })
  } catch (error) {
    console.error('Reset password error:', error)
    
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