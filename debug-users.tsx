"use client"

import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function DebugUsers() {
  const { users } = useAuth()

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Debug: All Users</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {users.map((user) => (
            <div key={user.id} className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{user.name}</h3>
                <Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role}</Badge>
              </div>
              <p className="text-sm text-gray-600">Email: {user.email}</p>
              <p className="text-sm text-gray-600">ID: {user.id}</p>
              <p className="text-sm text-gray-600">Bio: {user.bio}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
