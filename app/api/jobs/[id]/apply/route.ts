import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { query } from '@/lib/database'
import { z } from 'zod'

const applyJobSchema = z.object({
  coverLetter: z.string().optional(),
})

export async function POST(
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

    // Only students can apply for jobs
    if (user.role !== 'student') {
      return NextResponse.json(
        { error: 'Only students can apply for jobs' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { coverLetter } = applyJobSchema.parse(body)

    // Check if job exists and is active
    const jobResult = await query(
      'SELECT id, title, company, posted_by FROM job_postings WHERE id = $1 AND is_active = true',
      [params.id]
    )

    if (jobResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Job not found or no longer active' },
        { status: 404 }
      )
    }

    const job = jobResult.rows[0]

    // Check if user already applied
    const existingApplication = await query(
      'SELECT id FROM job_applications WHERE job_id = $1 AND user_id = $2',
      [params.id, user.id]
    )

    if (existingApplication.rows.length > 0) {
      return NextResponse.json(
        { error: 'You have already applied for this job' },
        { status: 409 }
      )
    }

    // Create application
    const result = await query(
      `INSERT INTO job_applications (job_id, user_id, cover_letter) 
       VALUES ($1, $2, $3)
       RETURNING id, applied_at`,
      [params.id, user.id, coverLetter || null]
    )

    const application = result.rows[0]

    // Create notification for job poster
    await query(
      `INSERT INTO notifications (user_id, type, title, message, data) 
       VALUES ($1, $2, $3, $4, $5)`,
      [
        job.posted_by,
        'job_application',
        'New Job Application',
        `${user.name} applied for your ${job.title} position at ${job.company}`,
        JSON.stringify({
          jobId: job.id,
          applicantId: user.id,
          applicantName: user.name,
        }),
      ]
    )

    // Log activity
    await query(
      `INSERT INTO user_activity_logs (user_id, action, resource_type, resource_id) 
       VALUES ($1, $2, $3, $4)`,
      [user.id, 'job_applied', 'job', params.id]
    )

    return NextResponse.json({
      success: true,
      applicationId: application.id,
      appliedAt: application.applied_at,
      message: 'Application submitted successfully',
    }, { status: 201 })
  } catch (error) {
    console.error('Apply job error:', error)
    
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