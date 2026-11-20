import RepoConnect from "./components/RepoConnect";
import CodeCheck from "./components/CodeCheck";
import PRStatus from "./components/PRStatus";

export default function App() {
  return (
    <div className="app-container">
      <header className="header">
        <h1 className="title">Autonomous DevOps Intelligence</h1>
        <p className="subtitle">
          Intelligent automation for code cleanup, GitHub commits, and pull
          requests.
        </p>
      </header>

      <main className="grid">
        <div className="card glass">
          <RepoConnect />
        </div>
        <div className="card glass">
          <CodeCheck />
        </div>
        <div className="card glass">
          <PRStatus />
        </div>
      </main>
    </div>
  );
}
