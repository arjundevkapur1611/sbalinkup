"use client"

import type React from "react"
import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Lock, CheckCircle, AlertTriangle } from 'lucide-react'

export function ChangePassword() {
  const { changePassword } = useAuth()
  const [isChanging, setIsChanging] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)

    // Validation
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      setError("Please fill in all fields")
      return
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("New passwords do not match")
      return
    }

    if (formData.newPassword.length < 6) {
      setError("New password must be at least 6 characters long")
      return
    }

    if (formData.currentPassword === formData.newPassword) {
      setError("New password must be different from current password")
      return
    }

    setIsChanging(true)

    try {
      const success = await changePassword(formData.currentPassword, formData.newPassword)
      if (success) {
        setSuccess(true)
        setFormData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
      } else {
        setError("Current password is incorrect")
      }
    } catch (error) {
      setError("Failed to change password. Please try again.")
    } finally {
      setIsChanging(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-[#002145] flex items-center">
          <Lock className="h-5 w-5 mr-2" />
          Change Password
        </CardTitle>
      </CardHeader>
      <CardContent>
        {success && (
          <Alert className="mb-4 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Password changed successfully! Your new password is now active.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="mb-4 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <Input
              id="current-password"
              type="password"
              value={formData.currentPassword}
              onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
              placeholder="Enter your current password"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              placeholder="Enter your new password"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="Confirm your new password"
              required
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">Password Requirements</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• At least 6 characters long</li>
              <li>• Different from your current password</li>
              <li>• Should be unique and secure</li>
            </ul>
          </div>

          <Button type="submit" className="w-full bg-[#002145] hover:bg-[#003366]" disabled={isChanging}>
            {isChanging ? "Changing Password..." : "Change Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
