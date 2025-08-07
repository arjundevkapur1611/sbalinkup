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

    // Get full user data from database
    const result = await query(
      `SELECT id, email, name, role, bio, location, education, experience, 
              interests, skills, linkedin, profile_picture, resume_file_name, 
              resume_file_url, resume_uploaded_at, created_at
       FROM users WHERE id = $1`,
      [user.id]
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