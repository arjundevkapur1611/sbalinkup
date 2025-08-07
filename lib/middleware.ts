import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from './auth'

export interface AuthenticatedRequest extends NextRequest {
  user: {
    id: string
    email: string
    role: string
  }
}

export function withAuth(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const user = await getAuthUser(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Add user to request object
    const authenticatedRequest = request as AuthenticatedRequest
    authenticatedRequest.user = user

    return handler(authenticatedRequest)
  }
}

export function withRole(roles: string[]) {
  return function (handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
    return withAuth(async (request: AuthenticatedRequest) => {
      if (!roles.includes(request.user.role)) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        )
      }

      return handler(request)
    })
  }
}

export function withRateLimit(maxRequests: number, windowMs: number) {
  const requests = new Map<string, { count: number; resetTime: number }>()

  return function (handler: (req: NextRequest) => Promise<NextResponse>) {
    return async (request: NextRequest) => {
      const ip = request.ip || 'unknown'
      const now = Date.now()
      const windowStart = now - windowMs

      // Clean up old entries
      for (const [key, value] of requests.entries()) {
        if (value.resetTime < windowStart) {
          requests.delete(key)
        }
      }

      const requestInfo = requests.get(ip) || { count: 0, resetTime: now + windowMs }

      if (requestInfo.count >= maxRequests && requestInfo.resetTime > now) {
        return NextResponse.json(
          { error: 'Rate limit exceeded' },
          { status: 429 }
        )
      }

      requestInfo.count++
      requests.set(ip, requestInfo)

      return handler(request)
    }
  }
}

export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': process.env.NODE_ENV === 'development' ? '*' : process.env.ALLOWED_ORIGINS || '',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

export function withCors(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: corsHeaders(),
      })
    }

    const response = await handler(request)
    
    // Add CORS headers to response
    Object.entries(corsHeaders()).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
  }
}

export function handleApiError(error: any) {
  console.error('API Error:', error)
  
  if (error.code === '23505') { // PostgreSQL unique violation
    return NextResponse.json(
      { error: 'Resource already exists' },
      { status: 409 }
    )
  }
  
  if (error.code === '23503') { // PostgreSQL foreign key violation
    return NextResponse.json(
      { error: 'Referenced resource not found' },
      { status: 400 }
    )
  }
  
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  )
}