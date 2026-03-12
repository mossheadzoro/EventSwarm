
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"

export async function getUserFromToken() {
    const cookieStore = cookies()
    const token = (await cookieStore).get("token")?.value

    if (!token) return null

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET!
        ) as { id: string }

        return { id: decoded.id }
    } catch {
        return null
    }
}