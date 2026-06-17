import OpenAI from "openai";
import { MAPPING_SCHEMA } from "./schema";
import type { MappingResult } from "@/lib/types";

/**
 * Calls OpenAI with strict Structured Outputs and returns the parsed mapping.
 * The API key is read here, server-side only (§2, §15). Throws on any failure;
 * the route turns that into an in-voice error without logging the request body.
 */
export async function callMapping({
  system,
  user,
  model,
}: {
  system: string;
  user: string;
  model: string;
}): Promise<MappingResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured.");

  const client = new OpenAI({ apiKey });

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.3,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "mapping",
        strict: true,
        schema: MAPPING_SCHEMA,
      },
    },
  });

  const message = completion.choices[0]?.message;
  if (message?.refusal) throw new Error(`Model refused: ${message.refusal}`);

  const content = message?.content;
  if (!content) throw new Error("Empty response from model.");

  return JSON.parse(content) as MappingResult;
}
