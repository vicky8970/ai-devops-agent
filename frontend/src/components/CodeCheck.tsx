import { useState } from "react";
import { listRepoFiles } from "../services/api";

export default function CodeCheck() {
  const [directory, setDirectory] = useState("");
  const [result, setResult] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const handleListFiles = async () => {
    setBusy(true);
    setResult("");
    try {
      const response = await listRepoFiles(directory);
      setResult(`${response.count} repository file(s) available for analysis.`);
    } catch (error) {
      setResult(error instanceof Error ? error.message : "Unable to list files.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <h2>Repository Analysis</h2>
      <input
        type="text"
        placeholder="directory (optional)"
        value={directory}
        onChange={(event) => setDirectory(event.target.value)}
      />
      <button disabled={busy} onClick={handleListFiles}>
        {busy ? "Loading..." : "List Repository Files"}
      </button>
      {result && <p role="status">{result}</p>}
    </>
  );
}
