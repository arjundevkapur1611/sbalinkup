import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { query } from '@/lib/database'
import { z } from 'zod'

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
  education: z.string().optional(),
  experience: z.string().optional(),
  interests: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  linkedin: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const result = await query(
      `SELECT id, email, name, role, bio, location, education, experience, 
              interests, skills, linkedin, profile_picture, resume_file_name, 
              resume_file_url, resume_uploaded_at, created_at
       FROM users WHERE id = $1 AND is_active = true`,
      [params.id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const userData = result.rows[0]
    
    return NextResponse.json({
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      bio: userData.bio,
      location: userData.location,
      education: userData.education,
      experience: userData.experience,
      interests: userData.interests || [],
      skills: userData.skills || [],
      linkedin: userData.linkedin,
      profilePicture: userData.profile_picture,
      resume: userData.resume_file_name && userData.resume_file_url ? {
        fileName: userData.resume_file_name,
        fileUrl: userData.resume_file_url,
        uploadedAt: userData.resume_uploaded_at,
      } : undefined,
      joinedAt: userData.created_at,
    })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Users can only update their own profile, or admins can update anyone
    if (user.id !== params.id && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = updateUserSchema.parse(body)

    // Build dynamic update query
    const updates = []
    const values = []
    let paramCount = 0

    Object.entries(validatedData).forEach(([key, value]) => {
      if (value !== undefined) {
        paramCount++
        updates.push(`${key} = $${paramCount}`)
        values.push(value)
      }
    })

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    // Add updated_at
    paramCount++
    updates.push(`updated_at = $${paramCount}`)
    values.push(new Date())

    // Add user ID for WHERE clause
    paramCount++
    values.push(params.id)

    const updateQuery = `
      UPDATE users 
      SET ${updates.join(', ')} 
      WHERE id = $${paramCount} AND is_active = true
      RETURNING id, email, name, role, bio, location, education, experience, 
                interests, skills, linkedin, profile_picture, created_at
    `

    const result = await query(updateQuery, values)

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const updatedUser = result.rows[0]

    // Log activity
    await query(
      `INSERT INTO user_activity_logs (user_id, action, resource_type, resource_id) 
       VALUES ($1, $2, $3, $4)`,
      [user.id, 'profile_updated', 'user', params.id]
    )

    return NextResponse.json({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      bio: updatedUser.bio,
      location: updatedUser.location,
      education: updatedUser.education,
      experience: updatedUser.experience,
      interests: updatedUser.interests || [],
      skills: updatedUser.skills || [],
      linkedin: updatedUser.linkedin,
      profilePicture: updatedUser.profile_picture,
      joinedAt: updatedUser.created_at,
    })
  } catch (error) {
    console.error('Update user error:', error)
    
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only admins can delete users, or users can delete themselves
    if (user.role !== 'admin' && user.id !== params.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Soft delete by setting is_active to false
    const result = await query(
      'UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1 AND is_active = true RETURNING id',
      [params.id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Log activity
    await query(
      `INSERT INTO user_activity_logs (user_id, action, resource_type, resource_id) 
       VALUES ($1, $2, $3, $4)`,
      [user.id, 'user_deleted', 'user', params.id]
    )

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}