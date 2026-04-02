import { auth } from "@/auth"
import { env } from "@/lib/env"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    console.log('[API] Fetching available toolkits from:', `${env.GATEWAY_URL}/integrations/available`)
    const response = await fetch(`${env.GATEWAY_URL}/integrations/available`, {
      cache: 'no-store'
    })

    console.log('[API] Gateway response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] Gateway error response:', errorText)
      throw new Error(`Gateway returned ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    console.log('[API] Received', Array.isArray(data) ? data.length : 'unknown', 'toolkits')
    return NextResponse.json(data)
  } catch (error) {
    console.error("[API] Failed to fetch available toolkits:", error)
    return NextResponse.json(
      { error: "Gateway unreachable", details: String(error) },
      { status: 503 }
    )
  }
}
