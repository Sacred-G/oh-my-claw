import { LoginForm } from "@/components/features/auth/login-form"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Secure OpenClaw</h1>
          <p className="text-sm text-muted-foreground">
            Professional AI Agent Dashboard
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
