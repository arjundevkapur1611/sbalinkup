"use client"

import type React from "react"
import { createContext, useState, useContext } from "react"

interface Interview {
  id: string
  studentId: string
  professionalId: string
  jobId?: string
  scheduledDate: Date
  duration: number
  status: "scheduled" | "completed" | "cancelled"
  type: "video" | "phone" | "in-person"
  meetingLink?: string
  location?: string
  notes?: string
  feedback?: string
  rating?: number
}

interface InterviewRequest {
  id: string
  studentId: string
  professionalId: string
  jobId: string
  requestedSlots: Array<{
    id: string
    date: Date
    startTime: string
    endTime: string
  }>
  message?: string
  status: "pending" | "accepted" | "declined"
  createdAt: Date
}

interface InterviewContextType {
  interviews: Interview[]
  interviewRequests: InterviewRequest[]
  scheduleInterview: (studentId: string, professionalId: string, scheduledDate: Date, jobId?: string) => void
  updateInterview: (interviewId: string, updates: Partial<Interview>) => void
  cancelInterview: (interviewId: string) => void
  getInterviewsForUser: (userId: string, userRole: string) => Interview[]
  getInterviewRequestsForUser: (userId: string, userRole: string) => InterviewRequest[]
  getUpcomingInterviews: (userId: string) => Interview[]
  sendInterviewRequest: (
    jobId: string,
    professionalId: string,
    studentId: string,
    slots: any[],
    message?: string,
  ) => void
  respondToInterviewRequest: (requestId: string, response: "accepted" | "declined", selectedSlot?: any) => void
  updateInterviewStatus: (interviewId: string, status: string) => void
}

const InterviewContext = createContext<InterviewContextType | undefined>(undefined)

export const InterviewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [interviews, setInterviews] = useState<Interview[]>([
    {
      id: "1",
      studentId: "1",
      professionalId: "2",
      jobId: "1",
      scheduledDate: new Date("2024-01-25T14:00:00"),
      duration: 30,
      status: "scheduled",
      type: "video",
      meetingLink: "https://zoom.us/j/123456789",
      notes: "Initial screening for Nike internship position",
    },
    {
      id: "2",
      studentId: "3",
      professionalId: "4",
      jobId: "2",
      scheduledDate: new Date("2024-01-23T10:00:00"),
      duration: 45,
      status: "scheduled",
      type: "video",
      meetingLink: "https://teams.microsoft.com/l/meetup-join/123",
      notes: "Technical interview for ESPN Data Analyst role",
    },
    {
      id: "3",
      studentId: "1",
      professionalId: "4",
      scheduledDate: new Date("2024-01-20T16:00:00"),
      duration: 30,
      status: "completed",
      type: "phone",
      notes: "Career guidance session",
      feedback: "Great potential, needs to work on technical skills",
      rating: 4,
    },
  ])

  const [interviewRequests, setInterviewRequests] = useState<InterviewRequest[]>([])

  const scheduleInterview = (studentId: string, professionalId: string, scheduledDate: Date, jobId?: string) => {
    const newInterview: Interview = {
      id: Date.now().toString(),
      studentId,
      professionalId,
      jobId,
      scheduledDate,
      duration: 30,
      status: "scheduled",
      type: "video",
    }

    setInterviews([...interviews, newInterview])
  }

  const updateInterview = (interviewId: string, updates: Partial<Interview>) => {
    setInterviews(
      interviews.map((interview) => (interview.id === interviewId ? { ...interview, ...updates } : interview)),
    )
  }

  const cancelInterview = (interviewId: string) => {
    setInterviews(
      interviews.map((interview) =>
        interview.id === interviewId ? { ...interview, status: "cancelled" as const } : interview,
      ),
    )
  }

  const getInterviewsForUser = (userId: string, userRole: string): Interview[] => {
    return interviews.filter((interview) => interview.studentId === userId || interview.professionalId === userId)
  }

  const getInterviewRequestsForUser = (userId: string, userRole: string): InterviewRequest[] => {
    return interviewRequests.filter((request) => request.studentId === userId || request.professionalId === userId)
  }

  const getUpcomingInterviews = (userId: string): Interview[] => {
    const now = new Date()
    return interviews.filter(
      (interview) =>
        (interview.studentId === userId || interview.professionalId === userId) &&
        interview.status === "scheduled" &&
        interview.scheduledDate > now,
    )
  }

  const sendInterviewRequest = (
    jobId: string,
    professionalId: string,
    studentId: string,
    slots: any[],
    message?: string,
  ) => {
    const newRequest: InterviewRequest = {
      id: Date.now().toString(),
      studentId,
      professionalId,
      jobId,
      requestedSlots: slots.map((slot, index) => ({
        id: `${Date.now()}-${index}`,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
      })),
      message,
      status: "pending",
      createdAt: new Date(),
    }
    setInterviewRequests([...interviewRequests, newRequest])
  }

  const respondToInterviewRequest = (requestId: string, response: "accepted" | "declined", selectedSlot?: any) => {
    setInterviewRequests((requests) =>
      requests.map((req) => (req.id === requestId ? { ...req, status: response } : req)),
    )
  }

  const updateInterviewStatus = (interviewId: string, status: string) => {
    setInterviews((interviews) =>
      interviews.map((interview) => (interview.id === interviewId ? { ...interview, status } : interview)),
    )
  }

  const value: InterviewContextType = {
    interviews,
    interviewRequests,
    scheduleInterview,
    updateInterview,
    cancelInterview,
    getInterviewsForUser,
    getInterviewRequestsForUser,
    getUpcomingInterviews,
    sendInterviewRequest,
    respondToInterviewRequest,
    updateInterviewStatus,
  }

  return <InterviewContext.Provider value={value}>{children}</InterviewContext.Provider>
}

export const useInterview = () => {
  const context = useContext(InterviewContext)
  if (!context) {
    throw new Error("useInterview must be used within an InterviewProvider")
  }
  return context
}
