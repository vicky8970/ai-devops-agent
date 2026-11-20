import type { Env, WorkersAiResponse } from "./types";

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

export async function refactorWithWorkersAi(
  env: Env,
  source: string,
  feedback?: string,
): Promise<string> {
  const prompt = feedback
    ? `Fix this source file based on the test feedback below. Return only valid source code, without markdown or explanations.

Test feedback:
${feedback}

Code:
${source}`
    : `Refactor and fix bugs in this source file. Return only valid source code, without markdown or explanations.

Code:
${source}`;

  const response = (await env.AI.run(env.AI_MODEL ?? "@cf/meta/llama-3.1-8b-instruct", {
    prompt,
    max_tokens: 4096,
  })) as WorkersAiResponse;
  const result = sanitizeOutput(response.response ?? "");
  if (!result) {
    throw new Error("Workers AI returned empty code.");
  }
  return result;
}
