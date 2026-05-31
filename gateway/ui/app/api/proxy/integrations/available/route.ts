import { auth } from "@/auth"
import { env } from "@/lib/env"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const response = await fetch(`${env.GATEWAY_URL}/integrations/available`, {
      cache: 'no-store'
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Gateway returned ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("[API] Failed to fetch available toolkits:", error)
    return NextResponse.json(
      { error: "Gateway unreachable", details: String(error) },
      { status: 503 }
    )
  }
}
