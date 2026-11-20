import type {
  FixAndPrResponse,
  RepoConnection,
  RepositoryFilesResponse,
} from "../types";

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(
  /\/$/,
  "",
) ?? "http://localhost:8787";

export function normalizeRepoName(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, "");
  const withoutPrefix = trimmed.replace(/^https?:\/\/github\.com\//i, "");
  const withoutGitSuffix = withoutPrefix.replace(/\.git$/i, "");
  if (!/^[^/\s]+\/[^/\s]+$/.test(withoutGitSuffix)) {
    throw new Error(
      "Enter a valid GitHub repository as owner/repository or a GitHub URL.",
    );
  }
  return withoutGitSuffix;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const body = (await response.json()) as { detail?: string };
      message = body.detail ?? message;
    } catch {
      // Keep the status-based message when the response is not JSON.
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}

export function connectRepo(repoFullName: string): Promise<RepoConnection> {
  return request<RepoConnection>("/repo/connect", {
    method: "POST",
    body: JSON.stringify({ repo_full_name: repoFullName }),
  });
}

export function listRepoFiles(
  directory = "",
): Promise<RepositoryFilesResponse> {
  const query = directory
    ? `?directory=${encodeURIComponent(directory)}`
    : "";
  return request<RepositoryFilesResponse>(`/repo/files${query}`);
}

export function triggerFixAndPr(payload: {
  directory: string;
  branch: string;
  pr_title: string;
  pr_body: string;
}): Promise<FixAndPrResponse> {
  return request<FixAndPrResponse>("/code/fix-and-pr", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
