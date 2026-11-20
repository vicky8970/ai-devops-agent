import { useState } from "react";
import { connectRepo, normalizeRepoName } from "../services/api";

export default function RepoConnect() {
  const [repo, setRepo] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const handleConnect = async () => {
    setBusy(true);
    setMessage("");
    try {
      const result = await connectRepo(normalizeRepoName(repo));
      setMessage(`Connected: ${result.repo}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Connection failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <h2>Connect GitHub Repo</h2>
      <input
        type="text"
        placeholder="owner/repository"
        value={repo}
        onChange={(event) => setRepo(event.target.value)}
      />
      <button disabled={busy} onClick={handleConnect}>
        {busy ? "Connecting..." : "Connect"}
      </button>
      {message && <p role="status">{message}</p>}
    </>
  );
}
