"use client"

import type React from "react"
import { useState } from "react"
import { useInterview } from "@/lib/interview-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, X } from 'lucide-react'

interface InterviewSchedulerProps {
  jobId: string
  professionalId: string
  studentId: string
  studentName: string
  onClose: () => void
}

export function InterviewScheduler({
  jobId,
  professionalId,
  studentId,
  studentName,
  onClose,
}: InterviewSchedulerProps) {
  const { sendInterviewRequest } = useInterview()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState("")
  const [timeSlots, setTimeSlots] = useState([{ date: "", startTime: "", endTime: "" }])

  const addTimeSlot = () => {
    setTimeSlots([...timeSlots, { date: "", startTime: "", endTime: "" }])
  }

  const removeTimeSlot = (index: number) => {
    if (timeSlots.length > 1) {
      setTimeSlots(timeSlots.filter((_, i) => i !== index))
    }
  }

  const updateTimeSlot = (index: number, field: string, value: string) => {
    const updated = timeSlots.map((slot, i) => (i === index ? { ...slot, [field]: value } : slot))
    setTimeSlots(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate that all slots are filled
    const validSlots = timeSlots.filter((slot) => slot.date && slot.startTime && slot.endTime)

    if (validSlots.length === 0) {
      alert("Please add at least one complete time slot")
      return
    }

    setIsSubmitting(true)

    try {
      const slots = validSlots.map((slot) => ({
        date: new Date(slot.date),
        startTime: slot.startTime,
        endTime: slot.endTime,
      }))

      sendInterviewRequest(jobId, professionalId, studentId, slots, message)
      onClose()
    } catch (error) {
      console.error("Failed to send interview request:", error)
      alert("Failed to send interview request. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get today's date for min date input
  const today = new Date().toISOString().split("T")[0]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-[#002145]">Schedule Interview with {studentName}</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="message">Message (Optional)</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a personal message about the interview..."
                rows={3}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Available Time Slots</Label>
                <Button type="button" onClick={addTimeSlot} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Slot
                </Button>
              </div>

              {timeSlots.map((slot, index) => (
                <Card key={index} className="p-4 border-2 border-dashed border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`date-${index}`}>Date</Label>
                      <Input
                        id={`date-${index}`}
                        type="date"
                        min={today}
                        value={slot.date}
                        onChange={(e) => updateTimeSlot(index, "date", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`start-${index}`}>Start Time</Label>
                      <Input
                        id={`start-${index}`}
                        type="time"
                        value={slot.startTime}
                        onChange={(e) => updateTimeSlot(index, "startTime", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`end-${index}`}>End Time</Label>
                      <div className="flex gap-2">
                        <Input
                          id={`end-${index}`}
                          type="time"
                          value={slot.endTime}
                          onChange={(e) => updateTimeSlot(index, "endTime", e.target.value)}
                          required
                          className="flex-1"
                        />
                        {timeSlots.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeTimeSlot(index)}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">How it works:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Provide multiple time slot options for the candidate</li>
                <li>• The student will choose their preferred time slot</li>
                <li>• You'll receive a notification when they respond</li>
                <li>• Interview details will be automatically scheduled</li>
              </ul>
            </div>

            <div className="flex space-x-3">
              <Button type="submit" className="flex-1 bg-[#002145] hover:bg-[#003366]" disabled={isSubmitting}>
                {isSubmitting ? "Sending Request..." : "Send Interview Request"}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
