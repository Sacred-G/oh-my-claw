import { z } from "zod";

export const messageSchema = z.object({
  sessionKey: z.string().min(1),
  text: z.string().min(1),
});

export const memoryUpdateSchema = z.object({
  type: z.enum(["long-term", "daily"]),
  date: z.string().optional(),
  content: z.string(),
});

export const configUpdateSchema = z.record(z.string(), z.any()); // Flexible for partial updates

export type MessageRequest = z.infer<typeof messageSchema>;
export type MemoryUpdateRequest = z.infer<typeof memoryUpdateSchema>;
