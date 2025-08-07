import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { query } from '@/lib/database'
import { z } from 'zod'

const createJobSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  company: z.string().min(1, 'Company is required'),
  location: z.string().min(1, 'Location is required'),
  type: z.enum(['full-time', 'part-time', 'internship', 'volunteer']),
  description: z.string().min(1, 'Description is required'),
  requiredSkills: z.array(z.string()).min(1, 'At least one required skill is needed'),
  preferredSkills: z.array(z.string()).optional(),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  deadline: z.string().optional().transform((str) => str ? new Date(str) : undefined),
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

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const location = searchParams.get('location')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search')
    const postedBy = searchParams.get('postedBy')
    
    const offset = (page - 1) * limit

    let queryText = `
      SELECT j.id, j.title, j.company, j.location, j.type, j.description, 
             j.required_skills, j.preferred_skills, j.salary_min, j.salary_max,
             j.deadline, j.created_at, j.updated_at,
             u.name as poster_name, u.role as poster_role,
             (SELECT COUNT(*) FROM job_applications WHERE job_id = j.id) as application_count
      FROM job_postings j
      JOIN users u ON j.posted_by = u.id
      WHERE j.is_active = true
    `
    const queryParams: any[] = []
    let paramCount = 0

    // Filter by type
    if (type && ['full-time', 'part-time', 'internship', 'volunteer'].includes(type)) {
      paramCount++
      queryText += ` AND j.type = $${paramCount}`
      queryParams.push(type)
    }

    // Filter by location
    if (location) {
      paramCount++
      queryText += ` AND j.location ILIKE $${paramCount}`
      queryParams.push(`%${location}%`)
    }

    // Filter by poster
    if (postedBy) {
      paramCount++
      queryText += ` AND j.posted_by = $${paramCount}`
      queryParams.push(postedBy)
    }

    // Search in title, company, description, or skills
    if (search) {
      paramCount++
      queryText += ` AND (
        j.title ILIKE $${paramCount} OR 
        j.company ILIKE $${paramCount} OR 
        j.description ILIKE $${paramCount} OR
        EXISTS (
          SELECT 1 FROM unnest(j.required_skills) AS skill 
          WHERE skill ILIKE $${paramCount}
        ) OR
        EXISTS (
          SELECT 1 FROM unnest(j.preferred_skills) AS skill 
          WHERE skill ILIKE $${paramCount}
        )
      )`
      queryParams.push(`%${search}%`)
    }

    // Add ordering and pagination
    queryText += ` ORDER BY j.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`
    queryParams.push(limit, offset)

    const result = await query(queryText, queryParams)

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM job_postings j WHERE j.is_active = true'
    const countParams: any[] = []
    let countParamCount = 0

    if (type && ['full-time', 'part-time', 'internship', 'volunteer'].includes(type)) {
      countParamCount++
      countQuery += ` AND j.type = $${countParamCount}`
      countParams.push(type)
    }

    if (location) {
      countParamCount++
      countQuery += ` AND j.location ILIKE $${countParamCount}`
      countParams.push(`%${location}%`)
    }

    if (postedBy) {
      countParamCount++
      countQuery += ` AND j.posted_by = $${countParamCount}`
      countParams.push(postedBy)
    }

    if (search) {
      countParamCount++
      countQuery += ` AND (
        j.title ILIKE $${countParamCount} OR 
        j.company ILIKE $${countParamCount} OR 
        j.description ILIKE $${countParamCount} OR
        EXISTS (
          SELECT 1 FROM unnest(j.required_skills) AS skill 
          WHERE skill ILIKE $${countParamCount}
        ) OR
        EXISTS (
          SELECT 1 FROM unnest(j.preferred_skills) AS skill 
          WHERE skill ILIKE $${countParamCount}
        )
      )`
      countParams.push(`%${search}%`)
    }

    const countResult = await query(countQuery, countParams)
    const total = parseInt(countResult.rows[0].count)

    const jobs = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      company: row.company,
      location: row.location,
      type: row.type,
      description: row.description,
      requiredSkills: row.required_skills || [],
      preferredSkills: row.preferred_skills || [],
      salaryMin: row.salary_min,
      salaryMax: row.salary_max,
      deadline: row.deadline,
      postedAt: row.created_at,
      updatedAt: row.updated_at,
      poster: {
        name: row.poster_name,
        role: row.poster_role,
      },
      applicationCount: parseInt(row.application_count),
    }))

    return NextResponse.json({
      jobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get jobs error:', error)
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

    // Only professionals and admins can post jobs
    if (user.role !== 'professional' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only professionals can post jobs' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createJobSchema.parse(body)

    const result = await query(
      `INSERT INTO job_postings (
        posted_by, title, company, location, type, description, 
        required_skills, preferred_skills, salary_min, salary_max, deadline
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, title, company, location, type, description, 
                required_skills, preferred_skills, salary_min, salary_max, 
                deadline, created_at`,
      [
        user.id,
        validatedData.title,
        validatedData.company,
        validatedData.location,
        validatedData.type,
        validatedData.description,
        validatedData.requiredSkills,
        validatedData.preferredSkills || [],
        validatedData.salaryMin || null,
        validatedData.salaryMax || null,
        validatedData.deadline || null,
      ]
    )

    const newJob = result.rows[0]

    // Log activity
    await query(
      `INSERT INTO user_activity_logs (user_id, action, resource_type, resource_id) 
       VALUES ($1, $2, $3, $4)`,
      [user.id, 'job_created', 'job', newJob.id]
    )

    return NextResponse.json({
      id: newJob.id,
      title: newJob.title,
      company: newJob.company,
      location: newJob.location,
      type: newJob.type,
      description: newJob.description,
      requiredSkills: newJob.required_skills || [],
      preferredSkills: newJob.preferred_skills || [],
      salaryMin: newJob.salary_min,
      salaryMax: newJob.salary_max,
      deadline: newJob.deadline,
      postedAt: newJob.created_at,
      applicationCount: 0,
    }, { status: 201 })
  } catch (error) {
    console.error('Create job error:', error)
    
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