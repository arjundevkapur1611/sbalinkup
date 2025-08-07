import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'
import { query } from './database'

export interface User {
  id: string
  email: string
  name: string
  role: 'student' | 'professional' | 'admin'
  bio: string
  location?: string
  education?: string
  experience?: string
  interests?: string[]
  skills?: string[]
  linkedIn?: string
  joinedAt: Date
  profilePicture?: string
  resume?: {
    fileName: string
    fileUrl: string
    uploadedAt: Date
  }
}

export interface JWTPayload {
  userId: string
  email: string
  role: string
  iat?: number
  exp?: number
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch (error) {
    return null
  }
}

export async function getUserFromToken(token: string): Promise<User | null> {
  const payload = verifyToken(token)
  if (!payload) return null

  const result = await query(
    'SELECT * FROM users WHERE id = $1',
    [payload.userId]
  )

  if (result.rows.length === 0) return null

  const user = result.rows[0]
  return {
    ...user,
    interests: user.interests || [],
    skills: user.skills || [],
    resume: user.resume_file_name && user.resume_file_url 
      ? {
          fileName: user.resume_file_name,
          fileUrl: user.resume_file_url,
          uploadedAt: user.resume_uploaded_at
        }
      : undefined
  }
}

export async function getAuthUser(request: NextRequest): Promise<User | null> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  return getUserFromToken(token)
}

export function generateResetToken(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function createPasswordResetToken(email: string): Promise<string> {
  const token = generateResetToken()
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

  await query(
    `INSERT INTO password_reset_tokens (email, token, expires_at, created_at) 
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (email) 
     DO UPDATE SET token = $2, expires_at = $3, created_at = NOW()`,
    [email, token, expiresAt]
  )

  return token
}

export async function validateResetToken(token: string): Promise<string | null> {
  const result = await query(
    'SELECT email FROM password_reset_tokens WHERE token = $1 AND expires_at > NOW()',
    [token]
  )

  if (result.rows.length === 0) return null
  return result.rows[0].email
}

export async function deleteResetToken(token: string): Promise<void> {
  await query('DELETE FROM password_reset_tokens WHERE token = $1', [token])
}