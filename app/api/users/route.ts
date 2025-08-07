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
    const role = searchParams.get('role')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search')
    
    const offset = (page - 1) * limit

    let queryText = `
      SELECT id, email, name, role, bio, location, education, experience, 
             interests, skills, linkedin, profile_picture, created_at
      FROM users 
      WHERE is_active = true
    `
    const queryParams: any[] = []
    let paramCount = 0

    // Filter by role
    if (role && ['student', 'professional', 'admin'].includes(role)) {
      paramCount++
      queryText += ` AND role = $${paramCount}`
      queryParams.push(role)
    }

    // Search by name, bio, or skills
    if (search) {
      paramCount++
      queryText += ` AND (
        name ILIKE $${paramCount} OR 
        bio ILIKE $${paramCount} OR 
        EXISTS (
          SELECT 1 FROM unnest(skills) AS skill 
          WHERE skill ILIKE $${paramCount}
        )
      )`
      queryParams.push(`%${search}%`)
    }

    // Add ordering and pagination
    queryText += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`
    queryParams.push(limit, offset)

    const result = await query(queryText, queryParams)

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM users WHERE is_active = true'
    const countParams: any[] = []
    let countParamCount = 0

    if (role && ['student', 'professional', 'admin'].includes(role)) {
      countParamCount++
      countQuery += ` AND role = $${countParamCount}`
      countParams.push(role)
    }

    if (search) {
      countParamCount++
      countQuery += ` AND (
        name ILIKE $${countParamCount} OR 
        bio ILIKE $${countParamCount} OR 
        EXISTS (
          SELECT 1 FROM unnest(skills) AS skill 
          WHERE skill ILIKE $${countParamCount}
        )
      )`
      countParams.push(`%${search}%`)
    }

    const countResult = await query(countQuery, countParams)
    const total = parseInt(countResult.rows[0].count)

    const users = result.rows.map(row => ({
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      bio: row.bio,
      location: row.location,
      education: row.education,
      experience: row.experience,
      interests: row.interests || [],
      skills: row.skills || [],
      linkedin: row.linkedin,
      profilePicture: row.profile_picture,
      joinedAt: row.created_at,
    }))

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}