"use client"

import type React from "react"
import { createContext, useState, useContext } from "react"

interface User {
  id: string
  email: string
  name: string
  role: "student" | "professional" | "admin"
  bio: string
  location?: string
  education?: string
  experience?: string
  interests?: string[]
  skills?: string[]
  linkedIn?: string
  joinedAt: Date
  resume?: {
    fileName: string
    fileUrl: string
    uploadedAt: Date
  }
}

interface JobPosting {
  id: string
  postedBy: string
  title: string
  company: string
  location: string
  type: "full-time" | "part-time" | "internship" | "volunteer"
  description: string
  requiredSkills: string[]
  preferredSkills?: string[]
  deadline?: Date
  postedAt: Date
  isActive: boolean
  applications: string[]
}

interface AuthContextType {
  user: User | null
  users: User[]
  jobPostings: JobPosting[]
  login: (email: string, password: string) => Promise<boolean>
  register: (userData: Partial<User> & { email: string; password: string }) => Promise<boolean>
  logout: () => void
  updateProfile: (userData: Partial<User>) => void
  addUser: (userData: Omit<User, "id" | "joinedAt">) => void
  createJobPosting: (jobData: Omit<JobPosting, "id" | "postedAt" | "applications" | "isActive">) => void
  applyToJob: (jobId: string, userId: string) => void
  getMatchingJobs: (userId: string) => Array<JobPosting & { matchScore: number }>
  getMatchingStudents: (jobId: string) => Array<User & { matchScore: number }>
  deleteUser: (userId: string) => void
  updateJobPosting: (jobId: string, jobData: Partial<JobPosting>) => void
  deleteJobPosting: (jobId: string) => void
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>
  requestPasswordReset: (email: string) => Promise<boolean>
  resetPassword: (token: string, newPassword: string) => Promise<boolean>
  validateResetToken: (token: string) => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Sample data for the app
const sampleUsers: User[] = [
  {
    id: "admin",
    email: "arjundevkapur@gmail.com",
    name: "Arjun Kapur",
    role: "admin",
    bio: "Platform Administrator and System Manager",
    location: "New York, NY",
    education: "Computer Science",
    experience: "Platform Development and Management",
    interests: ["Technology", "Sports Business", "Platform Management"],
    skills: ["System Administration", "Platform Management", "User Experience"],
    linkedIn: "arjundevkapur",
    joinedAt: new Date("2024-01-01"),
  },
  {
    id: "1",
    email: "sarah@example.com",
    name: "Sarah Johnson",
    role: "student",
    bio: "Sports management student passionate about analytics and team operations.",
    location: "Boston, MA",
    education: "Boston University - Sport Management",
    experience: "",
    interests: ["Analytics", "Team Operations", "Marketing"],
    skills: ["Data Analysis", "Excel", "Communication"],
    linkedIn: "sarah-johnson",
    joinedAt: new Date("2024-01-15"),
  },
  {
    id: "2",
    email: "mike@example.com",
    name: "Mike Chen",
    role: "professional",
    bio: "Sports marketing professional with 8 years of experience in digital campaigns.",
    location: "Los Angeles, CA",
    education: "UCLA - Marketing",
    experience: "8 years in sports marketing",
    interests: ["Digital Marketing", "Brand Strategy", "Social Media"],
    skills: ["Marketing Strategy", "Social Media", "Campaign Management"],
    linkedIn: "mike-chen",
    joinedAt: new Date("2024-01-10"),
  },
  {
    id: "3",
    email: "jessica@example.com",
    name: "Jessica Williams",
    role: "student",
    bio: "Business student interested in sports finance and operations.",
    location: "Chicago, IL",
    education: "Northwestern University - Business",
    experience: "Internship at Chicago Bulls",
    interests: ["Finance", "Operations", "Analytics"],
    skills: ["Financial Analysis", "Excel", "Project Management"],
    linkedIn: "jessica-williams",
    joinedAt: new Date("2024-01-12"),
  },
  {
    id: "4",
    email: "david@example.com",
    name: "David Rodriguez",
    role: "professional",
    bio: "Former athlete turned sports agent with focus on contract negotiations.",
    location: "Miami, FL",
    education: "University of Miami - Sports Management",
    experience: "10 years as sports agent",
    interests: ["Contract Negotiation", "Player Development", "Legal"],
    skills: ["Negotiation", "Legal Knowledge", "Relationship Building"],
    linkedIn: "david-rodriguez",
    joinedAt: new Date("2024-01-08"),
  },
]

const sampleJobs: JobPosting[] = [
  {
    id: "1",
    postedBy: "2",
    title: "Sports Marketing Intern",
    company: "Nike",
    location: "Portland, OR",
    type: "internship",
    description:
      "Join our sports marketing team to help develop campaigns for our athlete partnerships. You'll work on social media content, event planning, and brand activations.",
    requiredSkills: ["Marketing", "Social Media", "Communication"],
    preferredSkills: ["Adobe Creative Suite", "Sports Knowledge", "Event Planning"],
    postedAt: new Date("2024-01-20"),
    isActive: true,
    applications: ["1"],
  },
  {
    id: "2",
    postedBy: "4",
    title: "Data Analyst",
    company: "ESPN",
    location: "Bristol, CT",
    type: "full-time",
    description:
      "Analyze sports data to provide insights for our broadcasting team. Create visualizations and reports that help tell compelling sports stories.",
    requiredSkills: ["Data Analysis", "SQL", "Statistics"],
    preferredSkills: ["Python", "R", "Tableau", "Sports Knowledge"],
    postedAt: new Date("2024-01-18"),
    isActive: true,
    applications: ["3"],
  },
  {
    id: "3",
    postedBy: "4",
    title: "Sports Finance Analyst",
    company: "Miami Heat",
    location: "Miami, FL",
    type: "full-time",
    description:
      "Support the finance team with salary cap management, contract analysis, and financial planning for the organization.",
    requiredSkills: ["Finance", "Excel", "Analysis"],
    preferredSkills: ["CPA", "Sports Business Knowledge", "SQL"],
    deadline: new Date("2024-02-15"),
    postedAt: new Date("2024-01-16"),
    isActive: true,
    applications: [],
  },
  {
    id: "4",
    postedBy: "2",
    title: "Community Outreach Volunteer",
    company: "Los Angeles Lakers Foundation",
    location: "Los Angeles, CA",
    type: "volunteer",
    description:
      "Help organize and execute community events that bring basketball and education together for underserved youth.",
    requiredSkills: ["Communication", "Event Planning", "Community Service"],
    preferredSkills: ["Spanish", "Youth Development", "Sports Background"],
    postedAt: new Date("2024-01-14"),
    isActive: true,
    applications: ["1", "3"],
  },
]

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>(sampleUsers)
  const [jobPostings, setJobPostings] = useState<JobPosting[]>(sampleJobs)

  const login = async (email: string, password: string): Promise<boolean> => {
    const foundUser = users.find((u) => u.email.toLowerCase() === email.toLowerCase())
    if (!foundUser) return false
    if (password !== "password") return false

    setUser(foundUser)
    return true
  }

  const register = async (userData: Partial<User> & { email: string; password: string }): Promise<boolean> => {
    const existingUser = users.find((u) => u.email.toLowerCase() === userData.email.toLowerCase())
    if (existingUser) return false

    const newUser: User = {
      id: Date.now().toString(),
      email: userData.email,
      name: userData.name || "",
      role: userData.role || "student",
      bio: userData.bio || "",
      location: userData.location || "",
      education: userData.education || "",
      experience: userData.experience || "",
      interests: userData.interests || [],
      skills: userData.skills || [],
      linkedIn: userData.linkedIn || "",
      joinedAt: new Date(),
    }

    setUsers([...users, newUser])
    setUser(newUser)
    return true
  }

  const logout = () => {
    setUser(null)
    // Force redirect to home page (which will show login form)
    if (typeof window !== "undefined") {
      window.location.href = "/"
    }
  }

  const updateProfile = (userData: Partial<User>) => {
    if (!user) return
    const updatedUser = { ...user, ...userData }
    setUsers(users.map((u) => (u.id === user.id ? updatedUser : u)))
    setUser(updatedUser)
  }

  const addUser = (userData: Omit<User, "id" | "joinedAt">) => {
    const newUser: User = {
      id: Date.now().toString(),
      ...userData,
      joinedAt: new Date(),
    }
    setUsers([...users, newUser])
  }

  const createJobPosting = (jobData: Omit<JobPosting, "id" | "postedAt" | "applications" | "isActive">) => {
    const newJob: JobPosting = {
      id: Date.now().toString(),
      ...jobData,
      postedAt: new Date(),
      applications: [],
      isActive: true,
    }
    setJobPostings([...jobPostings, newJob])
  }

  const applyToJob = (jobId: string, userId: string) => {
    setJobPostings(
      jobPostings.map((job) => {
        if (job.id === jobId && !job.applications.includes(userId)) {
          return { ...job, applications: [...job.applications, userId] }
        }
        return job
      }),
    )
  }

  const getMatchingJobs = (userId: string): Array<JobPosting & { matchScore: number }> => {
    const userProfile = users.find((u) => u.id === userId)
    if (!userProfile) return []

    return jobPostings
      .filter((job) => job.isActive)
      .map((job) => {
        let matchScore = 60
        if (userProfile.skills && userProfile.skills.length > 0) {
          const matchingSkills = job.requiredSkills.filter((skill) =>
            userProfile.skills!.some(
              (userSkill) =>
                userSkill.toLowerCase().includes(skill.toLowerCase()) ||
                skill.toLowerCase().includes(userSkill.toLowerCase()),
            ),
          )
          matchScore += (matchingSkills.length / job.requiredSkills.length) * 30
        }
        matchScore += Math.random() * 10
        return { ...job, matchScore: Math.min(100, Math.floor(matchScore)) }
      })
      .sort((a, b) => b.matchScore - a.matchScore)
  }

  const getMatchingStudents = (jobId: string): Array<User & { matchScore: number }> => {
    const job = jobPostings.find((j) => j.id === jobId)
    if (!job) return []

    return users
      .filter((user) => user.role === "student")
      .map((user) => {
        let matchScore = 60
        if (user.skills && user.skills.length > 0) {
          const matchingSkills = job.requiredSkills.filter((skill) =>
            user.skills!.some(
              (userSkill) =>
                userSkill.toLowerCase().includes(skill.toLowerCase()) ||
                skill.toLowerCase().includes(userSkill.toLowerCase()),
            ),
          )
          matchScore += (matchingSkills.length / job.requiredSkills.length) * 30
        }
        matchScore += Math.random() * 10
        return { ...user, matchScore: Math.min(100, Math.floor(matchScore)) }
      })
      .sort((a, b) => b.matchScore - a.matchScore)
  }

  const deleteUser = (userId: string) => {
    setUsers(users.filter((u) => u.id !== userId))
    if (user?.id === userId) {
      setUser(null)
      // Redirect to login if current user is deleted
      if (typeof window !== "undefined") {
        window.location.href = "/"
      }
    }
  }

  const updateJobPosting = (jobId: string, jobData: Partial<JobPosting>) => {
    setJobPostings(jobPostings.map((job) => (job.id === jobId ? { ...job, ...jobData } : job)))
  }

  const deleteJobPosting = (jobId: string) => {
    setJobPostings(jobPostings.filter((job) => job.id !== jobId))
  }

  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    // Simulate password change - in real app, this would validate current password
    if (currentPassword === "password") {
      // Simulate successful password change
      return true
    }
    return false
  }

  const requestPasswordReset = async (email: string): Promise<boolean> => {
    // Simulate password reset request
    const foundUser = users.find((u) => u.email.toLowerCase() === email.toLowerCase())
    if (foundUser) {
      // In real app, this would send an email with reset token
      const resetToken = Math.floor(100000 + Math.random() * 900000).toString()
      alert(`Password reset token: ${resetToken}`)
      return true
    }
    return false
  }

  const resetPassword = async (token: string, newPassword: string): Promise<boolean> => {
    // Simulate password reset - in real app, this would validate token
    if (token.length === 6) {
      return true
    }
    return false
  }

  const validateResetToken = async (token: string): Promise<boolean> => {
    // Simulate token validation
    return token.length === 6
  }

  const value: AuthContextType = {
    user,
    users,
    jobPostings,
    login,
    register,
    logout,
    updateProfile,
    addUser,
    createJobPosting,
    applyToJob,
    getMatchingJobs,
    getMatchingStudents,
    deleteUser,
    updateJobPosting,
    deleteJobPosting,
    changePassword,
    requestPasswordReset,
    resetPassword,
    validateResetToken,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
