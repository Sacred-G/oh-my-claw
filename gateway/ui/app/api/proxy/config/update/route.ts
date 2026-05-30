import { auth } from "@/auth"
import { env } from "@/lib/env"
import { configUpdateSchema } from "@/types/api"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const result = configUpdateSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: result.error.format() },
        { status: 400 }
      )
    }

    const response = await fetch(`${env.GATEWAY_URL}/config/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result.data),
    })

    if (!response.ok) {
      throw new Error(`Gateway returned ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Failed to update gateway config:", error)
    return NextResponse.json(
      { error: "Gateway unreachable" },
      { status: 503 }
    )
  }
}
