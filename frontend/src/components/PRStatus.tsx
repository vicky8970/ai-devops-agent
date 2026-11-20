import { useState } from "react";
import { triggerFixAndPr } from "../services/api";
import type { FixAndPrResponse } from "../types";

export default function PRStatus() {
  const [directory, setDirectory] = useState("");
  const [branch, setBranch] = useState(
    `ai-fix-${Math.floor(Math.random() * 10000)}`,
  );
  const [title, setTitle] = useState("AI style fixes");
  const [body, setBody] = useState(
    "Automated AI refactoring and style fixes.",
  );
  const [result, setResult] = useState<FixAndPrResponse | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleFixAndPr = async () => {
    setBusy(true);
    setError("");
    setResult(null);
    try {
      setResult(
        await triggerFixAndPr({
          directory,
          branch,
          pr_title: title,
          pr_body: body,
        }),
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to create pull request.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <h2>AI Fix & Raise PR</h2>
      <input
        type="text"
        placeholder="repository directory (optional)"
        value={directory}
        onChange={(event) => setDirectory(event.target.value)}
      />
      <input
        type="text"
        placeholder="branch name"
        value={branch}
        onChange={(event) => setBranch(event.target.value)}
      />
      <input
        type="text"
        placeholder="PR title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />
      <textarea
        rows={3}
        placeholder="PR body"
        value={body}
        onChange={(event) => setBody(event.target.value)}
      />
      <button disabled={busy} onClick={handleFixAndPr}>
        {busy ? "Working..." : "Fix & Create PR"}
      </button>

      {error && <p role="alert">{error}</p>}
      {result && (
        <div style={{ marginTop: "1rem" }}>
          <p>Changed files: {result.changed_files}</p>
          <p>Validation: {result.validation.message}</p>
          {result.pr.url ? (
            <p>
              PR #{result.pr.number}:{" "}
              <a href={result.pr.url} target="_blank" rel="noreferrer">
                Open
              </a>
            </p>
          ) : (
            <p>No PR created.</p>
          )}
        </div>
      )}
    </>
  );
}
