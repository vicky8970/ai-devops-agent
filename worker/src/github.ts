import type { Env, GitHubContent, PullRequestResult } from "./types";

const GITHUB_API = "https://api.github.com";

function headers(env: Env): HeadersInit {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${env.GITHUB_TOKEN}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "ai-devops-agent",
  };
}

async function githubRequest<T>(
  env: Env,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${GITHUB_API}${path}`, {
    ...init,
    headers: {
      ...headers(env),
      ...init?.headers,
    },
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`GitHub API ${response.status}: ${detail}`);
  }
  return (await response.json()) as T;
}

export function repositoryName(env: Env): string {
  if (!env.GITHUB_REPO) {
    throw new Error("GITHUB_REPO is not configured.");
  }
  return env.GITHUB_REPO;
}

export async function listRepositoryFiles(
  env: Env,
  directory = "",
  ref?: string,
): Promise<GitHubContent[]> {
  const repo = repositoryName(env);
  const root = directory.replace(/^\/+|\/+$/g, "");
  const queue = [root];
  const files: GitHubContent[] = [];

  while (queue.length > 0) {
    const current = queue.pop() ?? "";
    const suffix = current ? `/${current}` : "";
    const refQuery = ref ? `?ref=${encodeURIComponent(ref)}` : "";
    const contents = await githubRequest<GitHubContent[]>(
      env,
      `/repos/${repo}/contents${suffix}${refQuery}`,
    );
    for (const content of contents) {
      if (content.type === "dir") {
        queue.push(content.path);
      } else if (content.type === "file") {
        files.push(content);
      }
    }
  }
  return files;
}

function decodeBase64(value: string): string {
  const binary = atob(value.replace(/\s/g, ""));
  const bytes = Uint8Array.from(binary, (character) =>
    character.charCodeAt(0),
  );
  return new TextDecoder().decode(bytes);
}

function encodeBase64(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }
  return btoa(binary);
}

export async function fetchFile(
  env: Env,
  path: string,
  ref?: string,
): Promise<{ text: string; sha: string }> {
  const repo = repositoryName(env);
  const refQuery = ref ? `?ref=${encodeURIComponent(ref)}` : "";
  const content = await githubRequest<GitHubContent>(
    env,
    `/repos/${repo}/contents/${path}${refQuery}`,
  );
  if (!content.content || !content.sha) {
    throw new Error(`GitHub did not return file content for ${path}.`);
  }
  return { text: decodeBase64(content.content), sha: content.sha };
}

export async function createBranch(
  env: Env,
  branch: string,
): Promise<void> {
  const repo = repositoryName(env);
  const repository = await githubRequest<{
    default_branch: string;
  }>(env, `/repos/${repo}`);
  const base = await githubRequest<{ object: { sha: string } }>(
    env,
    `/repos/${repo}/git/ref/heads/${repository.default_branch}`,
  );
  const response = await fetch(`${GITHUB_API}/repos/${repo}/git/refs`, {
    method: "POST",
    headers: { ...headers(env), "Content-Type": "application/json" },
    body: JSON.stringify({
      ref: `refs/heads/${branch}`,
      sha: base.object.sha,
    }),
  });
  if (!response.ok && response.status !== 422) {
    throw new Error(`Unable to create branch: ${await response.text()}`);
  }
}

export async function updateFile(
  env: Env,
  path: string,
  content: string,
  branch: string,
  sha: string,
  message: string,
): Promise<void> {
  const repo = repositoryName(env);
  await githubRequest(env, `/repos/${repo}/contents/${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      content: encodeBase64(content),
      branch,
      sha,
    }),
  });
}

export async function createPullRequest(
  env: Env,
  branch: string,
  title: string,
  body: string,
): Promise<PullRequestResult> {
  const repo = repositoryName(env);
  const repository = await githubRequest<{ default_branch: string }>(
    env,
    `/repos/${repo}`,
  );
  try {
    const pullRequest = await githubRequest<{
      number: number;
      html_url: string;
    }>(env, `/repos/${repo}/pulls`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        body,
        head: branch,
        base: repository.default_branch,
      }),
    });
    return { number: pullRequest.number, url: pullRequest.html_url };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}
