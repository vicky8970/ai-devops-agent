# 🚀 AI DevOps Agent – Autonomous DevOps Agent
> ⚡ **AI DevOps Agent** – Automating code fixes, testing and pull requests with intelligent backend + AI reasoning.

## 🛠️ Tech Stack

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare_Workers-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)
![Cloudflare D1](https://img.shields.io/badge/Cloudflare_D1-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-F55036?style=for-the-badge&logo=groq&logoColor=white)
![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB) 
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white) 
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white) 
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)

AI DevOps Agent is a TypeScript application that integrates with GitHub and Groq to refactor source repositories and create pull requests.

---

## About Project
- **Connects to GitHub**: Securely links to your repository using a personal access token.
- **Fetches source files**: Reads supported source code directly from your repo.
- **AI Refactoring & Bug Fixing**: Uses Groq to:
  - Refactor messy code
  - Fix broken logic when tests fail
  - Ensure valid source output (sanitized before saving)
- **Validation**: Reports that repository checks should run through GitHub Actions.
- **Pull Requests**: Automatically commits changes and raises a PR back to your repo.
- **Frontend Dashboard**: React UI to connect repos, trigger checks and view PR status.

---

## 🛠️ How the Code Works

### Cloudflare Worker API
- **`worker/src/github.ts`** handles GitHub REST API calls.
- **`worker/src/ai.ts`** calls Groq and sanitizes generated code.
- **`worker/src/index.ts`** exposes repository connection, file listing, and fix-and-PR routes.
- **`worker/src/db.ts`** stores connections and action logs in D1.

### AI Integration
- **Groq API**
  - Input: raw code + optional test failure feedback  
  - Output: corrected/refactored source code only
  - Sanitization ensures only valid code is saved  

### Frontend (React + Vite)
- **Components**:  
  - `RepoConnect` → Connect GitHub repo  
  - `CodeCheck` → Trigger AI refactor + tests  
  - `PRStatus` → Show PR creation status  

---

## ✨ Features
- 🔗 GitHub Integration
- 🤖 AI-Powered Code Fixes
- ☁️ Serverless Cloudflare deployment
- 📦 Pull Request Creation
- 🎨 Futuristic Dashboard UI

---

## ⚙️ Installation

# Clone the repository
git clone https://github.com/sakshisemalti/ai-devops-agent.git
cd ai-devops-agent

# Frontend
cd frontend
npm install
npm run dev

# Worker API (in another terminal)
cd ../worker
npm install
npm run dev
---

## Usage
- Connect your GitHub repo in the UI.

- Trigger Code Check to refactor, format and fix broken code.

- The Worker uses Groq to refactor supported source files through GitHub.

- Repository tests and formatting should run in GitHub Actions.

- Review and merge the auto-generated PR.

---

## Contributing
Contributions are welcome! This project is open for changes.

- Fork the repository

- Create a feature branch (git checkout -b feature-name)

- Commit your changes (git commit -m "Add feature")

- Push to your branch (git push origin feature-name)

- Open a Pull Request
  
Please ensure your code passes Black formatting and pytest before submitting.

⚠️ Note: Only high-quality PRs that follow project standards and improve functionality will be accepted. Low-effort or untested contributions will be rejected.

---

## License
MIT License – free to use, modify and distribute.

## TypeScript and Cloudflare deployment

The production architecture uses React/TypeScript on Cloudflare Pages and a
TypeScript Cloudflare Worker API backed by D1 and Groq.

### Local development

cd frontend
npm install
npm run typecheck
npm run build

cd ../worker
npm install
npm run typecheck
npm run dev

Set `VITE_API_URL` in `frontend/.env.local` to the local Worker URL, usually
`http://localhost:8787`.

### Cloudflare setup

1. Create a D1 database named `ai-devops-agent` and replace the placeholder
   `database_id` in `worker/wrangler.toml`.
2. Apply the schema with
   `npx wrangler d1 migrations apply ai-devops-agent --remote`.
3. Configure the Worker secrets:

   npx wrangler secret put GITHUB_TOKEN
   npx wrangler secret put GITHUB_REPO

4. Configure the Groq API key and deploy the API:

   npx wrangler secret put GROQ_API_KEY
   cd worker
   npx wrangler deploy

5. Configure the Pages project to use `frontend` as its root directory,
   `npm run build` as its build command, `dist` as its output directory, and
   `VITE_API_URL` as the deployed Worker URL.

The Worker uses GitHub’s REST API and Groq directly. It does not run
local `pytest`, Black, Flake8, or Ollama processes. Add a GitHub Actions
workflow to run those repository-specific checks before merging generated
pull requests.