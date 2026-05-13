import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/lib/config/env";
import { AppError } from "@/lib/errors/app-error";

let cached: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!env.ANTHROPIC_API_KEY) {
    throw new AppError(
      "INTERNAL_ERROR",
      "ANTHROPIC_API_KEY não configurada. Defina no .env.local para usar os agentes de IA.",
    );
  }
  if (!cached) {
    cached = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }
  return cached;
}

export const SONNET_4_6 = "claude-sonnet-4-6" as const;
