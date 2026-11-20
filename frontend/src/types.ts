export interface RepoConnection {
  status: "connected";
  repo: string;
}

export interface RepositoryFile {
  path: string;
}

export interface RepositoryFilesResponse {
  count: number;
  files: RepositoryFile[];
}

export interface PullRequest {
  number?: number;
  url?: string;
  error?: string;
}

export interface FixAndPrResponse {
  changed_files: number;
  pr: PullRequest;
  validation: {
    status: "not_run" | "passed" | "failed";
    message: string;
  };
}

export interface ApiError {
  detail?: string;
  message?: string;
}
