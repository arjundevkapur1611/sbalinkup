import { NextRequest, NextResponse } from 'next/server'
import { createPasswordResetToken } from '@/lib/auth'
import { query } from '@/lib/database'
import { z } from 'zod'

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = forgotPasswordSchema.parse(body)

    // Check if user exists
    const result = await query(
      'SELECT id, name FROM users WHERE email = $1 AND is_active = true',
      [email.toLowerCase()]
    )

    if (result.rows.length === 0) {
      // Return success even if user doesn't exist (security best practice)
      return NextResponse.json({
        success: true,
        message: 'If an account with this email exists, you will receive a password reset token.',
      })
    }

    const user = result.rows[0]

    // Generate reset token
    const resetToken = await createPasswordResetToken(email.toLowerCase())

    // In a real application, you would send an email here
    // For now, we'll return the token in the response (development only)
    console.log(`Password reset token for ${email}: ${resetToken}`)

    // Log activity
    await query(
      `INSERT INTO user_activity_logs (user_id, action, ip_address, user_agent) 
       VALUES ($1, $2, $3, $4)`,
      [
        user.id,
        'password_reset_requested',
        request.ip || 'unknown',
        request.headers.get('user-agent') || 'unknown',
      ]
    )

    return NextResponse.json({
      success: true,
      message: 'If an account with this email exists, you will receive a password reset token.',
      // Remove this in production - only for development
      ...(process.env.NODE_ENV === 'development' && { resetToken }),
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    
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