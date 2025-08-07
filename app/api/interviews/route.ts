import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { query } from '@/lib/database'
import { z } from 'zod'

const createInterviewSchema = z.object({
  studentId: z.string().uuid('Invalid student ID'),
  professionalId: z.string().uuid('Invalid professional ID'),
  jobId: z.string().uuid('Invalid job ID').optional(),
  scheduledDate: z.string().transform((str) => new Date(str)),
  duration: z.number().min(15).max(180).default(30),
  type: z.enum(['video', 'phone', 'in-person']).default('video'),
  meetingLink: z.string().url().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
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
    const userId = searchParams.get('userId') || user.id
    const status = searchParams.get('status')
    const upcoming = searchParams.get('upcoming') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Users can only view their own interviews or admins can view all
    if (user.id !== userId && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'You can only view your own interviews' },
        { status: 403 }
      )
    }

    let queryText = `
      SELECT i.id, i.student_id, i.professional_id, i.job_id, i.scheduled_date,
             i.duration, i.status, i.type, i.meeting_link, i.location, i.notes,
             i.feedback, i.rating, i.created_at,
             s.name as student_name, s.email as student_email, s.profile_picture as student_picture,
             p.name as professional_name, p.email as professional_email, p.profile_picture as professional_picture,
             j.title as job_title, j.company as job_company
      FROM interviews i
      JOIN users s ON i.student_id = s.id
      JOIN users p ON i.professional_id = p.id
      LEFT JOIN job_postings j ON i.job_id = j.id
      WHERE (i.student_id = $1 OR i.professional_id = $1)
    `
    const queryParams = [userId]
    let paramCount = 1

    // Filter by status
    if (status && ['scheduled', 'completed', 'cancelled', 'no-show'].includes(status)) {
      paramCount++
      queryText += ` AND i.status = $${paramCount}`
      queryParams.push(status)
    }

    // Filter upcoming interviews
    if (upcoming) {
      queryText += ` AND i.scheduled_date > NOW() AND i.status = 'scheduled'`
    }

    // Add ordering and pagination
    queryText += ` ORDER BY i.scheduled_date ASC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`
    queryParams.push(limit, offset)

    const result = await query(queryText, queryParams)

    const interviews = result.rows.map(row => ({
      id: row.id,
      student: {
        id: row.student_id,
        name: row.student_name,
        email: row.student_email,
        profilePicture: row.student_picture,
      },
      professional: {
        id: row.professional_id,
        name: row.professional_name,
        email: row.professional_email,
        profilePicture: row.professional_picture,
      },
      job: row.job_id ? {
        id: row.job_id,
        title: row.job_title,
        company: row.job_company,
      } : null,
      scheduledDate: row.scheduled_date,
      duration: row.duration,
      status: row.status,
      type: row.type,
      meetingLink: row.meeting_link,
      location: row.location,
      notes: row.notes,
      feedback: row.feedback,
      rating: row.rating,
      createdAt: row.created_at,
    }))

    return NextResponse.json({
      interviews,
      pagination: {
        page,
        limit,
        total: interviews.length,
      },
    })
  } catch (error) {
    console.error('Get interviews error:', error)
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
    const validatedData = createInterviewSchema.parse(body)

    // Verify the user can schedule this interview
    if (user.role !== 'admin') {
      if (user.id !== validatedData.studentId && user.id !== validatedData.professionalId) {
        return NextResponse.json(
          { error: 'You can only schedule interviews you are part of' },
          { status: 403 }
        )
      }
    }

    // Verify users exist
    const studentResult = await query(
      'SELECT id, name FROM users WHERE id = $1 AND role = $2 AND is_active = true',
      [validatedData.studentId, 'student']
    )

    const professionalResult = await query(
      'SELECT id, name FROM users WHERE id = $1 AND role IN ($2, $3) AND is_active = true',
      [validatedData.professionalId, 'professional', 'admin']
    )

    if (studentResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    if (professionalResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Professional not found' },
        { status: 404 }
      )
    }

    // Verify job exists if provided
    if (validatedData.jobId) {
      const jobResult = await query(
        'SELECT id FROM job_postings WHERE id = $1 AND is_active = true',
        [validatedData.jobId]
      )

      if (jobResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        )
      }
    }

    // Check for scheduling conflicts
    const conflictResult = await query(
      `SELECT id FROM interviews 
       WHERE (student_id = $1 OR professional_id = $2) 
       AND status = 'scheduled'
       AND ABS(EXTRACT(EPOCH FROM (scheduled_date - $3))) < $4 * 60`,
      [
        validatedData.studentId,
        validatedData.professionalId,
        validatedData.scheduledDate,
        validatedData.duration,
      ]
    )

    if (conflictResult.rows.length > 0) {
      return NextResponse.json(
        { error: 'Time slot conflicts with existing interview' },
        { status: 409 }
      )
    }

    // Create interview
    const result = await query(
      `INSERT INTO interviews (
        student_id, professional_id, job_id, scheduled_date, duration, 
        type, meeting_link, location, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, scheduled_date, created_at`,
      [
        validatedData.studentId,
        validatedData.professionalId,
        validatedData.jobId || null,
        validatedData.scheduledDate,
        validatedData.duration,
        validatedData.type,
        validatedData.meetingLink || null,
        validatedData.location || null,
        validatedData.notes || null,
      ]
    )

    const interview = result.rows[0]

    // Create notifications
    const student = studentResult.rows[0]
    const professional = professionalResult.rows[0]

    await Promise.all([
      // Notify student
      query(
        `INSERT INTO notifications (user_id, type, title, message, data) 
         VALUES ($1, $2, $3, $4, $5)`,
        [
          validatedData.studentId,
          'interview_scheduled',
          'Interview Scheduled',
          `Your interview with ${professional.name} has been scheduled`,
          JSON.stringify({
            interviewId: interview.id,
            professionalName: professional.name,
            scheduledDate: interview.scheduled_date,
          }),
        ]
      ),
      // Notify professional
      query(
        `INSERT INTO notifications (user_id, type, title, message, data) 
         VALUES ($1, $2, $3, $4, $5)`,
        [
          validatedData.professionalId,
          'interview_scheduled',
          'Interview Scheduled',
          `Your interview with ${student.name} has been scheduled`,
          JSON.stringify({
            interviewId: interview.id,
            studentName: student.name,
            scheduledDate: interview.scheduled_date,
          }),
        ]
      ),
    ])

    // Log activity
    await query(
      `INSERT INTO user_activity_logs (user_id, action, resource_type, resource_id) 
       VALUES ($1, $2, $3, $4)`,
      [user.id, 'interview_scheduled', 'interview', interview.id]
    )

    return NextResponse.json({
      success: true,
      interviewId: interview.id,
      scheduledDate: interview.scheduled_date,
      message: 'Interview scheduled successfully',
    }, { status: 201 })
  } catch (error) {
    console.error('Create interview error:', error)
    
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