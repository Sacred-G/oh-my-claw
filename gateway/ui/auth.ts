import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ password: z.string().min(1) })
          .safeParse(credentials)

        if (parsedCredentials.success) {
          const { password } = parsedCredentials.data
          
          // In a real app, this would check against a hashed password in a DB
          // For now, we'll use an environment variable for the "admin" password
          const adminPassword = process.env.ADMIN_PASSWORD || "admin123"
          
          if (password === adminPassword) {
            return { id: "1", name: "Admin User", email: "admin@example.com" }
          }
        }

        return null
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard")
      
      if (isOnDashboard) {
        if (isLoggedIn) return true
        return false // Redirect unauthenticated users to login page
      } else if (isLoggedIn && nextUrl.pathname === "/login") {
        return Response.redirect(new URL("/dashboard", nextUrl))
      }
      return true
    },
  },
})
