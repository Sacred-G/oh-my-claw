import { auth } from "@/auth"
import { env } from "@/lib/env"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { key } = await params

  try {
    const response = await fetch(`${env.GATEWAY_URL}/sessions/${key}`, {
      cache: 'no-store'
    })

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 })
      }
      throw new Error(`Gateway returned ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error(`Failed to fetch session ${key}:`, error)
    return NextResponse.json(
      { error: "Gateway unreachable" },
      { status: 503 }
    )
  }
}
