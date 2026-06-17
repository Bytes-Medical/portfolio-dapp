// Structured Outputs schema (§10.3). Strict mode requires every property in
// `required` and `additionalProperties: false` on every object — both hold here.
// `minItems`/`maxItems` and numeric ranges are intentionally omitted (not reliably
// supported under strict mode); the 1–3 candidate count and [0,1] confidence are
// enforced in the prompt and clamped server-side (see route.ts).

export const ENTRY_TYPES = [
  "reflection",
  "mini-CEX",
  "CbD",
  "DOPS",
  "leader",
  "HAT",
  "other",
] as const;

export const MAPPING_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: [
    "summary",
    "suggested_entry_type",
    "mapping_candidates",
    "draft_entry",
    "pid_flags",
  ],
  properties: {
    summary: { type: "string" },
    suggested_entry_type: { type: "string", enum: [...ENTRY_TYPES] },
    mapping_candidates: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "domain_id",
          "domain_name",
          "learning_outcome_id",
          "key_capability_id",
          "confidence",
          "rationale",
        ],
        properties: {
          domain_id: { type: "integer" },
          domain_name: { type: "string" },
          learning_outcome_id: { type: "string" },
          key_capability_id: { type: "string" },
          confidence: { type: "number" },
          rationale: { type: "string" },
        },
      },
    },
    draft_entry: {
      type: "object",
      additionalProperties: false,
      required: [
        "what_happened",
        "what_i_learned",
        "what_i_will_do_differently",
      ],
      properties: {
        what_happened: { type: "string" },
        what_i_learned: { type: "string" },
        what_i_will_do_differently: { type: "string" },
      },
    },
    pid_flags: { type: "array", items: { type: "string" } },
  },
};
