import { auth } from "@/auth"
import { env } from "@/lib/env"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q")

  if (!query) {
    return NextResponse.json({ error: "Missing query parameter q" }, { status: 400 })
  }

  try {
    const response = await fetch(`${env.GATEWAY_URL}/memory/search?q=${encodeURIComponent(query)}`, {
      cache: 'no-store'
    })

    if (!response.ok) {
      throw new Error(`Gateway returned ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Failed to search memory:", error)
    return NextResponse.json(
      { error: "Gateway unreachable" },
      { status: 503 }
    )
  }
}
