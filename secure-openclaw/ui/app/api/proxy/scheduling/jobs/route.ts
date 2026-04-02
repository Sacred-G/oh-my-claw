import { auth } from "@/auth"
import { env } from "@/lib/env"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const response = await fetch(`${env.GATEWAY_URL}/scheduling/jobs`, {
      cache: 'no-store'
    })

    if (!response.ok) {
      throw new Error(`Gateway returned ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Failed to fetch scheduled jobs:", error)
    return NextResponse.json(
      { error: "Gateway unreachable" },
      { status: 503 }
    )
  }
}
