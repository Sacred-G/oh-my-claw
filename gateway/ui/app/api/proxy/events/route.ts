import { auth } from "@/auth"
import { env } from "@/lib/env"

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth()
  if (!session) {
    return new Response("Unauthorized", { status: 401 })
  }

  const response = await fetch(`${env.GATEWAY_URL}/events`, {
    headers: {
      'Accept': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })

  if (!response.ok) {
    return new Response("Gateway unreachable", { status: 503 })
  }

  return new Response(response.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
