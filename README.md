# Global AI System Setup

Portable repository for your global multi-agent AI runtime (`~/.ai-system`).

## What this repo contains

- Core runtime files (`system/`)
- Agent definitions (`agents/`)
- Shared memory template (`memory/`)
- Installer scripts (`scripts/`)

Large cloned dependency repositories (`skills/`, `tools/`) are intentionally **not committed** and are re-cloned during install.

## Install (Windows PowerShell)

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install-global.ps1
```

## After install

- `AI_SYSTEM_PATH` and `AI_SKILLS_PATH` are set at User level.
- `~/.ai-system` is created/updated.
- Skills/tools/agent repos are cloned automatically.
- Global system is initialized (`system/init.js`).

## Publishing to GitHub

After creating a new GitHub repo, run:

```powershell
cd C:\Users\Jeet\Documents\GitHub\ai-system-global-setup
git init
git add .
git commit -m "Initial global AI system setup"
git branch -M main
git remote add origin <YOUR_NEW_REPO_URL>
git push -u origin main
```
