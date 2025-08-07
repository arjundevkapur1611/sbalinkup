import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { query } from '@/lib/database'

function calculateSkillMatch(userSkills: string[], requiredSkills: string[], preferredSkills: string[] = []): number {
  if (!userSkills || userSkills.length === 0) return 0
  
  let score = 0
  let totalPossibleScore = 0
  
  // Required skills matching (weighted heavily)
  for (const requiredSkill of requiredSkills) {
    totalPossibleScore += 10
    for (const userSkill of userSkills) {
      if (userSkill.toLowerCase().includes(requiredSkill.toLowerCase()) || 
          requiredSkill.toLowerCase().includes(userSkill.toLowerCase())) {
        score += 10
        break
      }
    }
  }
  
  // Preferred skills matching (weighted less)
  for (const preferredSkill of preferredSkills) {
    totalPossibleScore += 5
    for (const userSkill of userSkills) {
      if (userSkill.toLowerCase().includes(preferredSkill.toLowerCase()) || 
          preferredSkill.toLowerCase().includes(userSkill.toLowerCase())) {
        score += 5
        break
      }
    }
  }
  
  return totalPossibleScore > 0 ? (score / totalPossibleScore) * 100 : 0
}

function calculateLocationMatch(userLocation: string | null, jobLocation: string): number {
  if (!userLocation) return 50 // neutral score if no location specified
  
  const userLoc = userLocation.toLowerCase()
  const jobLoc = jobLocation.toLowerCase()
  
  if (userLoc === jobLoc) return 100
  
  // Check if same city/state
  const userParts = userLoc.split(',').map(p => p.trim())
  const jobParts = jobLoc.split(',').map(p => p.trim())
  
  if (userParts.length >= 2 && jobParts.length >= 2) {
    if (userParts[0] === jobParts[0]) return 80 // same city
    if (userParts[1] === jobParts[1]) return 60 // same state
  }
  
  return 30 // different location
}

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
    const jobId = searchParams.get('jobId')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (jobId) {
      // Match students for a specific job
      if (user.role !== 'professional' && user.role !== 'admin') {
        return NextResponse.json(
          { error: 'Only professionals can view student matches for jobs' },
          { status: 403 }
        )
      }

      // Get job details
      const jobResult = await query(
        `SELECT j.*, u.name as poster_name 
         FROM job_postings j 
         JOIN users u ON j.posted_by = u.id 
         WHERE j.id = $1 AND j.is_active = true`,
        [jobId]
      )

      if (jobResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        )
      }

      const job = jobResult.rows[0]

      // Only job poster or admin can see matches
      if (user.id !== job.posted_by && user.role !== 'admin') {
        return NextResponse.json(
          { error: 'You can only view matches for jobs you posted' },
          { status: 403 }
        )
      }

      // Get all students
      const studentsResult = await query(
        `SELECT id, name, bio, location, skills, interests, linkedin, profile_picture,
                education, experience, resume_file_name, resume_file_url
         FROM users 
         WHERE role = 'student' AND is_active = true
         AND id NOT IN (SELECT user_id FROM job_applications WHERE job_id = $1)`,
        [jobId]
      )

      const matches = studentsResult.rows
        .map(student => {
          const skillScore = calculateSkillMatch(
            student.skills || [],
            job.required_skills || [],
            job.preferred_skills || []
          )
          const locationScore = calculateLocationMatch(student.location, job.location)
          
          // Calculate overall match score
          const matchScore = Math.round((skillScore * 0.7) + (locationScore * 0.3))
          
          return {
            student: {
              id: student.id,
              name: student.name,
              bio: student.bio,
              location: student.location,
              skills: student.skills || [],
              interests: student.interests || [],
              linkedin: student.linkedin,
              profilePicture: student.profile_picture,
              education: student.education,
              experience: student.experience,
              resume: student.resume_file_name && student.resume_file_url ? {
                fileName: student.resume_file_name,
                fileUrl: student.resume_file_url,
              } : undefined,
            },
            matchScore,
            skillMatchScore: Math.round(skillScore),
            locationMatchScore: Math.round(locationScore),
          }
        })
        .filter(match => match.matchScore > 20) // Only show decent matches
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, limit)

      return NextResponse.json({
        job: {
          id: job.id,
          title: job.title,
          company: job.company,
          location: job.location,
          requiredSkills: job.required_skills || [],
          preferredSkills: job.preferred_skills || [],
        },
        matches,
        totalMatches: matches.length,
      })
    } else {
      // Match jobs for a specific student
      if (user.id !== userId && user.role !== 'admin') {
        return NextResponse.json(
          { error: 'You can only view your own job matches' },
          { status: 403 }
        )
      }

      // Get user details
      const userResult = await query(
        'SELECT skills, interests, location FROM users WHERE id = $1 AND is_active = true',
        [userId]
      )

      if (userResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      const userData = userResult.rows[0]

      // Get all active jobs that user hasn't applied to
      const jobsResult = await query(
        `SELECT j.id, j.title, j.company, j.location, j.type, j.description,
                j.required_skills, j.preferred_skills, j.salary_min, j.salary_max,
                j.deadline, j.created_at,
                u.name as poster_name, u.role as poster_role,
                (SELECT COUNT(*) FROM job_applications WHERE job_id = j.id) as application_count
         FROM job_postings j
         JOIN users u ON j.posted_by = u.id
         WHERE j.is_active = true
         AND j.id NOT IN (SELECT job_id FROM job_applications WHERE user_id = $1)
         AND (j.deadline IS NULL OR j.deadline > NOW())`,
        [userId]
      )

      const matches = jobsResult.rows
        .map(job => {
          const skillScore = calculateSkillMatch(
            userData.skills || [],
            job.required_skills || [],
            job.preferred_skills || []
          )
          const locationScore = calculateLocationMatch(userData.location, job.location)
          
          // Calculate overall match score
          const matchScore = Math.round((skillScore * 0.7) + (locationScore * 0.3))
          
          return {
            job: {
              id: job.id,
              title: job.title,
              company: job.company,
              location: job.location,
              type: job.type,
              description: job.description,
              requiredSkills: job.required_skills || [],
              preferredSkills: job.preferred_skills || [],
              salaryMin: job.salary_min,
              salaryMax: job.salary_max,
              deadline: job.deadline,
              postedAt: job.created_at,
              poster: {
                name: job.poster_name,
                role: job.poster_role,
              },
              applicationCount: parseInt(job.application_count),
            },
            matchScore,
            skillMatchScore: Math.round(skillScore),
            locationMatchScore: Math.round(locationScore),
          }
        })
        .filter(match => match.matchScore > 30) // Only show good matches
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, limit)

      return NextResponse.json({
        user: {
          id: userId,
          skills: userData.skills || [],
          interests: userData.interests || [],
          location: userData.location,
        },
        matches,
        totalMatches: matches.length,
      })
    }
  } catch (error) {
    console.error('Matching error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}