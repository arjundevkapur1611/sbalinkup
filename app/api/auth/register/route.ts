import { NextRequest, NextResponse } from 'next/server'
import { hashPassword, generateToken } from '@/lib/auth'
import { query } from '@/lib/database'
import { z } from 'zod'

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['student', 'professional'], {
    errorMap: () => ({ message: 'Role must be either student or professional' }),
  }),
  bio: z.string().min(1, 'Bio is required'),
  location: z.string().optional(),
  education: z.string().optional(),
  experience: z.string().optional(),
  interests: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  linkedin: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = registerSchema.parse(body)

    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [validatedData.email.toLowerCase()]
    )

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const passwordHash = await hashPassword(validatedData.password)

    // Create user
    const result = await query(
      `INSERT INTO users (
        email, password_hash, name, role, bio, location, education, 
        experience, interests, skills, linkedin, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      RETURNING id, email, name, role, bio, location, education, experience, 
                interests, skills, linkedin, created_at`,
      [
        validatedData.email.toLowerCase(),
        passwordHash,
        validatedData.name,
        validatedData.role,
        validatedData.bio,
        validatedData.location || null,
        validatedData.education || null,
        validatedData.experience || null,
        validatedData.interests || [],
        validatedData.skills || [],
        validatedData.linkedin || null,
      ]
    )

    const newUser = result.rows[0]

    // Generate JWT token
    const token = generateToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
    })

    // Log user activity
    await query(
      `INSERT INTO user_activity_logs (user_id, action, ip_address, user_agent) 
       VALUES ($1, $2, $3, $4)`,
      [
        newUser.id,
        'register',
        request.ip || 'unknown',
        request.headers.get('user-agent') || 'unknown',
      ]
    )

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        bio: newUser.bio,
        location: newUser.location,
        education: newUser.education,
        experience: newUser.experience,
        interests: newUser.interests || [],
        skills: newUser.skills || [],
        linkedin: newUser.linkedin,
        joinedAt: newUser.created_at,
      },
    })
  } catch (error) {
    console.error('Registration error:', error)
    
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