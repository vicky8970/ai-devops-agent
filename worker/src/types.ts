export interface Env {
  DB: D1Database;
  AI: Ai;
  GITHUB_TOKEN: string;
  GITHUB_REPO?: string;
  AI_MODEL?: string;
}

export interface GitHubContent {
  type: "file" | "dir";
  path: string;
  sha?: string;
  content?: string;
  encoding?: string;
}

export interface PullRequestResult {
  number?: number;
  url?: string;
  error?: string;
}

export interface FixAndPrPayload {
  directory: string;
  branch: string;
  pr_title: string;
  pr_body?: string;
}

export interface WorkersAiResponse {
  response?: string;
}
