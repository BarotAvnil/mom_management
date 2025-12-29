import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET as string

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}
