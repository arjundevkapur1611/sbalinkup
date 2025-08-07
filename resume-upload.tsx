"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Upload, FileText, Download, Trash2, CheckCircle } from 'lucide-react'
import { useAuth } from "@/lib/auth-context"

interface ResumeUploadProps {
  onUploadComplete?: (resume: { fileName: string; fileUrl: string; uploadedAt: Date }) => void
}

export function ResumeUpload({ onUploadComplete }: ResumeUploadProps) {
  const { user, updateProfile } = useAuth()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (file: File) => {
    if (file.type !== "application/pdf" && !file.type.includes("document")) {
      alert("Please upload a PDF or Word document")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      alert("File size must be less than 5MB")
      return
    }

    uploadFile(file)
  }

  const uploadFile = async (file: File) => {
    setIsUploading(true)
    setUploadProgress(0)

    // Simulate file upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 200)

    try {
      // Simulate upload delay
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // In a real app, you would upload to a cloud storage service
      // For demo purposes, we'll create a mock URL
      const mockFileUrl = `https://example.com/resumes/${user?.id}/${file.name}`

      const resumeData = {
        fileName: file.name,
        fileUrl: mockFileUrl,
        uploadedAt: new Date(),
      }

      // Update user profile with resume
      updateProfile({ resume: resumeData })

      setUploadProgress(100)
      onUploadComplete?.(resumeData)

      setTimeout(() => {
        setIsUploading(false)
        setUploadProgress(0)
      }, 1000)
    } catch (error) {
      console.error("Upload failed:", error)
      alert("Upload failed. Please try again.")
      setIsUploading(false)
      setUploadProgress(0)
    }

    clearInterval(progressInterval)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleRemoveResume = () => {
    if (confirm("Are you sure you want to remove your resume?")) {
      updateProfile({ resume: undefined })
    }
  }

  const handleDownloadResume = () => {
    if (user?.resume) {
      // In a real app, this would download the actual file
      alert(`Downloading: ${user.resume.fileName}`)
    }
  }

  if (user?.role !== "student") {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-[#002145] flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          Resume
        </CardTitle>
      </CardHeader>
      <CardContent>
        {user?.resume ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">{user.resume.fileName}</p>
                  <p className="text-sm text-green-600">
                    Uploaded{" "}
                    {user.resume.uploadedAt instanceof Date
                      ? user.resume.uploadedAt.toLocaleDateString()
                      : new Date(user.resume.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" onClick={handleDownloadResume}>
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
                <Button size="sm" variant="outline" onClick={handleRemoveResume} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Your resume is visible to professionals in the network. Keep it updated to make the best impression!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? "border-[#002145] bg-blue-50"
                  : isUploading
                    ? "border-gray-300 bg-gray-50"
                    : "border-gray-300 hover:border-[#002145] hover:bg-gray-50"
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              {isUploading ? (
                <div className="space-y-4">
                  <Upload className="h-12 w-12 mx-auto text-[#002145] animate-bounce" />
                  <div>
                    <p className="text-lg font-medium text-[#002145] mb-2">Uploading Resume...</p>
                    <Progress value={uploadProgress} className="w-full max-w-xs mx-auto" />
                    <p className="text-sm text-gray-600 mt-2">{uploadProgress}% complete</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="h-12 w-12 mx-auto text-gray-400" />
                  <div>
                    <p className="text-lg font-medium text-gray-900 mb-2">Upload Your Resume</p>
                    <p className="text-gray-600 mb-4">Drag and drop your resume here, or click to browse</p>
                    <Button onClick={() => fileInputRef.current?.click()} className="bg-[#002145] hover:bg-[#003366]">
                      Choose File
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileInputChange}
              className="hidden"
            />

            <div className="text-sm text-gray-600 space-y-1">
              <p>• Accepted formats: PDF, DOC, DOCX</p>
              <p>• Maximum file size: 5MB</p>
              <p>• Your resume will be visible to professionals in the network</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
