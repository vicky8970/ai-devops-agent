import { refactorWithWorkersAi } from "./ai";
import { getLatestRepo, logAction, saveRepoConnection } from "./db";
import {
  createBranch,
  createPullRequest,
  fetchFile,
  listRepositoryFiles,
  updateFile,
} from "./github";
import type { Env, FixAndPrPayload } from "./types";

const corsHeaders = {
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Origin": "*",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function repoEnv(env: Env, repo: string): Env {
  return { ...env, GITHUB_REPO: repo };
}

async function activeRepo(env: Env): Promise<string> {
  const repo = await getLatestRepo(env);
  if (!repo && !env.GITHUB_REPO) {
    throw new Error("Connect a repository or configure GITHUB_REPO first.");
  }
  return repo ?? env.GITHUB_REPO!;
}

function parseJson<T>(request: Request): Promise<T> {
  return request.json() as Promise<T>;
}

function normalizeRepoName(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, "");
  const withoutPrefix = trimmed.replace(/^https?:\/\/github\.com\//i, "");
  const repo = withoutPrefix.replace(/\.git$/i, "");
  if (!/^[^/\s]+\/[^/\s]+$/.test(repo)) {
    throw new Error(
      "Enter a valid GitHub repository as owner/repository or a GitHub URL.",
    );
  }
  return repo;
}

function isSupportedSourceFile(path: string): boolean {
  return /\.(ts|tsx|js|jsx|json|css|html|md)$/i.test(path);
}

async function handleRequest(request: Request, env: Env): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(request.url);
  try {
    if (url.pathname === "/repo/connect" && request.method === "POST") {
      const payload = await parseJson<{ repo_full_name: string }>(request);
      const repo = normalizeRepoName(payload.repo_full_name ?? "");
      await saveRepoConnection(env, repo);
      return json({ status: "connected", repo });
    }

    if (url.pathname === "/repo/files" && request.method === "GET") {
      const repo = await activeRepo(env);
      const files = await listRepositoryFiles(
        repoEnv(env, repo),
        url.searchParams.get("directory") ?? "",
        url.searchParams.get("ref") ?? undefined,
      );
      return json({
        count: files.length,
        files: files.map((file) => ({ path: file.path })),
      });
    }

    if (url.pathname === "/code/fix-and-pr" && request.method === "POST") {
      const payload = await parseJson<FixAndPrPayload>(request);
      if (!payload.branch || !payload.pr_title) {
        return json({ detail: "branch and pr_title are required." }, 400);
      }
      const repo = await activeRepo(env);
      const githubEnv = repoEnv(env, repo);
      await createBranch(githubEnv, payload.branch);
      const files = (await listRepositoryFiles(githubEnv, payload.directory))
        .filter((file) => isSupportedSourceFile(file.path));
      let changed = 0;

      for (const file of files) {
        const current = await fetchFile(githubEnv, file.path);
        const updated = await refactorWithWorkersAi(env, current.text);
        if (updated.trim() === current.text.trim()) {
          continue;
        }
        await updateFile(
          githubEnv,
          file.path,
          updated,
          payload.branch,
          current.sha,
          `AI refactor on ${file.path}`,
        );
        changed += 1;
      }

      const pr =
        changed > 0
          ? await createPullRequest(
              githubEnv,
              payload.branch,
              payload.pr_title,
              payload.pr_body ?? "",
            )
          : { error: "No changes detected, PR not created" };
      const response = {
        changed_files: changed,
        pr,
        validation: {
          status: "not_run" as const,
          message:
            "Cloudflare Workers cannot run repository-local pytest or Black. Use GitHub Actions for validation.",
        },
      };
      await logAction(env, "pr", response);
      return json(response);
    }

    return json({ detail: "Not found" }, 404);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return json({ detail: message }, 400);
  }
}

export default {
  fetch(request: Request, env: Env): Promise<Response> {
    return handleRequest(request, env);
  },
};
