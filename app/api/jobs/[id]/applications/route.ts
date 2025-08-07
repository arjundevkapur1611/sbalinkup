import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { query } from '@/lib/database'

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

    // Check if user is the job poster or admin
    const jobResult = await query(
      'SELECT posted_by, title, company FROM job_postings WHERE id = $1 AND is_active = true',
      [params.id]
    )

    if (jobResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    const job = jobResult.rows[0]

    if (user.id !== job.posted_by && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'You can only view applications for jobs you posted' },
        { status: 403 }
      )
    }

    // Get applications with applicant details
    const result = await query(
      `SELECT ja.id, ja.cover_letter, ja.status, ja.applied_at,
              u.id as applicant_id, u.name, u.email, u.bio, u.location, 
              u.education, u.experience, u.skills, u.linkedin, u.profile_picture,
              u.resume_file_name, u.resume_file_url, u.resume_uploaded_at
       FROM job_applications ja
       JOIN users u ON ja.user_id = u.id
       WHERE ja.job_id = $1
       ORDER BY ja.applied_at DESC`,
      [params.id]
    )

    const applications = result.rows.map(row => ({
      id: row.id,
      coverLetter: row.cover_letter,
      status: row.status,
      appliedAt: row.applied_at,
      applicant: {
        id: row.applicant_id,
        name: row.name,
        email: row.email,
        bio: row.bio,
        location: row.location,
        education: row.education,
        experience: row.experience,
        skills: row.skills || [],
        linkedin: row.linkedin,
        profilePicture: row.profile_picture,
        resume: row.resume_file_name && row.resume_file_url ? {
          fileName: row.resume_file_name,
          fileUrl: row.resume_file_url,
          uploadedAt: row.resume_uploaded_at,
        } : undefined,
      },
    }))

    return NextResponse.json({
      job: {
        id: params.id,
        title: job.title,
        company: job.company,
      },
      applications,
      totalApplications: applications.length,
    })
  } catch (error) {
    console.error('Get job applications error:', error)
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

    const body = await request.json()
    const { applicationId, status } = body

    if (!applicationId || !status) {
      return NextResponse.json(
        { error: 'Application ID and status are required' },
        { status: 400 }
      )
    }

    if (!['pending', 'reviewed', 'shortlisted', 'rejected', 'hired'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    // Check if user is the job poster or admin
    const jobResult = await query(
      'SELECT posted_by FROM job_postings WHERE id = $1 AND is_active = true',
      [params.id]
    )

    if (jobResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    const job = jobResult.rows[0]

    if (user.id !== job.posted_by && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'You can only update applications for jobs you posted' },
        { status: 403 }
      )
    }

    // Update application status
    const result = await query(
      `UPDATE job_applications 
       SET status = $1 
       WHERE id = $2 AND job_id = $3
       RETURNING user_id`,
      [status, applicationId, params.id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    const applicantId = result.rows[0].user_id

    // Create notification for applicant
    const statusMessages = {
      reviewed: 'Your application has been reviewed',
      shortlisted: 'Congratulations! You have been shortlisted',
      rejected: 'Unfortunately, your application was not selected',
      hired: 'Congratulations! You have been hired',
    }

    if (statusMessages[status as keyof typeof statusMessages]) {
      await query(
        `INSERT INTO notifications (user_id, type, title, message, data) 
         VALUES ($1, $2, $3, $4, $5)`,
        [
          applicantId,
          'application_status',
          'Application Status Update',
          statusMessages[status as keyof typeof statusMessages],
          JSON.stringify({
            jobId: params.id,
            applicationId,
            status,
          }),
        ]
      )
    }

    // Log activity
    await query(
      `INSERT INTO user_activity_logs (user_id, action, resource_type, resource_id, metadata) 
       VALUES ($1, $2, $3, $4, $5)`,
      [
        user.id,
        'application_status_updated',
        'application',
        applicationId,
        JSON.stringify({ status, jobId: params.id }),
      ]
    )

    return NextResponse.json({
      success: true,
      message: 'Application status updated successfully',
    })
  } catch (error) {
    console.error('Update application status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}