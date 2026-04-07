# AI System Core

Global runtime for skills, agents, memory, context injection, and project integration.

## Commands

- `npm run normalize` → create/refresh manifests + `skill-registry.json`
- `npm run context` → generate `context.md`
- `npm run build` → run both normalize and context

## Runtime Files

- `skill-registry.json` - normalized skills metadata
- `context.md` - prompt injection context
- `../memory/shared-memory.json` - cross-agent memory log

## Project Integration

From any project root:

- `powershell -ExecutionPolicy Bypass -File ~/.ai-system/system/bootstrap-project.ps1`

This creates `./.ai` link and injects baseline `.github/copilot-instructions.md`.