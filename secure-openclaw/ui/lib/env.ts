import { z } from "zod";

const optionalString = z.preprocess((val) => (val === "" ? undefined : val), z.string().min(1).optional());

const envSchema = z.object({
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url().optional(),
  // Add other required environment variables here
  OPENAI_API_KEY: optionalString,
  CLAUDE_API_KEY: optionalString,
  GATEWAY_URL: z.string().url().default("http://localhost:3000"),
});

const envParse = envSchema.safeParse(process.env);

if (!envParse.success) {
  console.error("❌ Invalid environment variables:", envParse.error.format());
  throw new Error("Invalid environment variables");
}

export const env = envParse.data;
