"use client"

import { useAuth } from "@/lib/auth-context"
import { useMessaging } from "@/lib/messaging-context"
import { useInterview } from "@/lib/interview-context"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Home, Users, MessageCircle, User, LogOut, Briefcase, Plus, Calendar, Settings } from 'lucide-react'
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

export function Navbar() {
  const { user, logout } = useAuth()
  const { getUnreadCount } = useMessaging()
  const { getUpcomingInterviews } = useInterview()
  const pathname = usePathname()
  const router = useRouter()

  const unreadCount = user ? getUnreadCount(user.id) : 0
  const upcomingInterviews = user ? getUpcomingInterviews(user.id).length : 0

  if (!user) return null

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/directory", label: "Directory", icon: Users },
    { href: "/jobs", label: "Jobs", icon: Briefcase },
    {
      href: "/interviews",
      label: "Interviews",
      icon: Calendar,
      badge: upcomingInterviews > 0 ? upcomingInterviews : undefined,
    },
    { href: "/messages", label: "Messages", icon: MessageCircle, badge: unreadCount > 0 ? unreadCount : undefined },
  ]

  // Add admin link if user is an admin
  if (user.role === "admin") {
    navItems.push({ href: "/admin", label: "Admin", icon: Settings })
  }

  const handleLogout = () => {
    logout()
    // The logout function in auth context will handle the redirect
  }

  return (
    <nav className="bg-[#002145] text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold text-[#FDB913]">
            SBA Link Up
          </Link>

          <div className="flex items-center space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-1 px-3 py-2 rounded-md transition-colors relative ${
                  pathname === item.href ? "bg-[#FDB913] text-[#002145]" : "hover:bg-white/10"
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
                {item.badge && <Badge className="ml-1 bg-red-500 text-white text-xs">{item.badge}</Badge>}
              </Link>
            ))}

            {user.role === "professional" && (
              <Link
                href="/create-job"
                className="flex items-center space-x-1 px-3 py-2 bg-[#FDB913] text-[#002145] rounded-md hover:bg-[#e6a50a] transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Post Job</span>
              </Link>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-[#FDB913] text-[#002145]">
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                {user.role === "professional" && (
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center">
                      <Briefcase className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                )}
                {user.role === "admin" && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      Admin Dashboard
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  )
}
