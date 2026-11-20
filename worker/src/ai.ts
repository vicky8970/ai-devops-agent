import type { Env, GroqResponse } from "./types";

function sanitizeOutput(raw: string): string {
  const lines = raw.split(/\r?\n/);
  const code = lines.filter((line) => {
    const trimmed = line.trim().toLowerCase();
    return (
      !trimmed.startsWith("```") &&
      !trimmed.startsWith("here is") &&
      !trimmed.startsWith("here's") &&
      !trimmed.startsWith("corrected code")
    );
  });
  return code.join("\n").trim();
}

export async function refactorWithGroq(
  env: Env,
  source: string,
  feedback?: string,
): Promise<string> {
  if (!env.GROQ_API_KEY) {
    throw new Error(
      "GROQ_API_KEY is not configured. Add it with `npx wrangler secret put GROQ_API_KEY`.",
    );
  }

  const prompt = feedback
    ? `Fix this source file based on the test feedback below. Return only valid source code, without markdown or explanations.

Test feedback:
${feedback}

Code:
${source}`
    : `Refactor and fix bugs in this source file. Return only valid source code, without markdown or explanations.

Code:
${source}`;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are a careful code refactoring agent. Return only the complete updated source file.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.1,
      max_tokens: 8192,
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq API ${response.status}: ${await response.text()}`);
  }

  const data = (await response.json()) as GroqResponse;
  const result = sanitizeOutput(data.choices?.[0]?.message?.content ?? "");
  if (!result) {
    throw new Error("Groq returned empty source code.");
  }
  return result;
}
