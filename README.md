# Customer Onboarding

Customer onboarding system with a .NET API and a React dashboard.

| Folder | What it is | Tech |
|---|---|---|
| `Onboarding.Api/` | REST API + database | .NET 10, EF Core, SQLite |
| `employee-dashboard/` | Web UI for employees | React 19, TypeScript, Vite |

## Getting started

### Prerequisites
- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js 22+](https://nodejs.org/)
- EF Core CLI: `dotnet tool install --global dotnet-ef`

### Run the API
```bash
cd Onboarding.Api
dotnet ef database update   # creates onboarding.db from the migrations
dotnet run
```

### Run the dashboard
```bash
cd employee-dashboard
npm install
npm run dev
```

## How we work

1. Never commit directly to `main`.
2. Create a branch: `git checkout -b feature/short-description`
   - Prefixes: `feature/`, `fix/`, `chore/`, `docs/`
3. Commit using [Conventional Commits](https://www.conventionalcommits.org/):
   `feat: add customer search`, `fix: handle empty email`
4. Push and open a Pull Request into `main`.
5. CI must pass and the PR needs a review before merging.
6. Use **Squash and merge**, then delete the branch.

## Security
- Never commit secrets. Use environment variables, `dotnet user-secrets`, or GitHub Secrets.
- `*.db` files are git-ignored because they may contain real customer data.
