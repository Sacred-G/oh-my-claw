import { auth } from "@/auth"
import { env } from "@/lib/env"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ appName: string }> }
) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { appName } = await params

  try {
    const gatewayUrl = `${env.GATEWAY_URL}/integrations/connect/${appName}`
    console.log(`[API] Connecting to gateway:`, gatewayUrl)
    
    const response = await fetch(gatewayUrl, {
      cache: 'no-store'
    })

    console.log(`[API] Gateway response status:`, response.status)
    console.log(`[API] Gateway response headers:`, response.headers)

    if (!response.ok) {
      try {
        const errorText = await response.text()
        console.error(`[API] Gateway error response:`, errorText)
        throw new Error(`Gateway returned ${response.status}: ${errorText}`)
      } catch (error) {
        console.error(`[API] Failed to read gateway error response:`, error)
        throw new Error(`Gateway returned ${response.status}`)
      }
    }

    const data = await response.json()
    console.log(`[API] Gateway response data:`, data)
    return NextResponse.json(data)
  } catch (error) {
    console.error(`[API] Failed to initiate connection for ${appName}:`, error)
    return NextResponse.json(
      { error: "Gateway unreachable", details: String(error) },
      { status: 503 }
    )
  }
}
