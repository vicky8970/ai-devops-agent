export interface Env {
  DB: D1Database;
  GITHUB_TOKEN: string;
  GITHUB_REPO?: string;
  GROQ_API_KEY?: string;
  GROQ_MODEL?: string;
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

export interface GroqResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}
