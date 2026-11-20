import type { Env } from "./types";

export async function saveRepoConnection(
  env: Env,
  repoFullName: string,
): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO repo_connections (repo_full_name)
     VALUES (?)
     ON CONFLICT(repo_full_name) DO NOTHING`,
  )
    .bind(repoFullName)
    .run();
}

export async function getLatestRepo(env: Env): Promise<string | undefined> {
  const row = await env.DB.prepare(
    "SELECT repo_full_name FROM repo_connections ORDER BY id DESC LIMIT 1",
  ).first<{ repo_full_name: string }>();
  return row?.repo_full_name;
}

export async function logAction(
  env: Env,
  action: string,
  details: unknown,
): Promise<void> {
  await env.DB.prepare(
    "INSERT INTO action_logs (action, details) VALUES (?, ?)",
  )
    .bind(action, JSON.stringify(details))
    .run();
}
