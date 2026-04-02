import { auth } from "@/auth"
import { NextRequest } from "next/server"

/**
 * Next.js 16 proxy (formerly middleware)
 */
export default async function proxy(req: NextRequest) {
  // @ts-expect-error - NextAuth v5 types might not perfectly match Next.js 16 proxy req
  return auth(req)
}

export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
