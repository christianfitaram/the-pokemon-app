import { z } from "zod";

const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(4000),
});

export const assistanceRequestSchema = z.object({
  chatHistory: z.array(chatMessageSchema).max(30).optional().default([]),
});

export const roleplayRequestSchema = z.object({
  message: z.string().trim().min(1).max(4000),
  pokemon: z.string().trim().max(100).optional().default(""),
  chatHistory: z.array(chatMessageSchema).max(30).optional().default([]),
});

export const roleplayToolArgsSchema = z.object({
  name: z.string().trim().min(1).max(100),
});

export function normalizePokemonName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "-");
}
