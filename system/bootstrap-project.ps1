$ErrorActionPreference = 'Stop'

$aiRoot = if ($env:AI_SYSTEM_PATH) { $env:AI_SYSTEM_PATH } else { Join-Path $HOME '.ai-system' }
$projectPath = (Get-Location).Path
$localAi = Join-Path $projectPath '.ai'

if (Test-Path $localAi) {
  Write-Output ".ai already exists at $localAi"
} else {
  try {
    New-Item -ItemType SymbolicLink -Path $localAi -Target $aiRoot -ErrorAction Stop | Out-Null
    Write-Output "Created symlink: $localAi -> $aiRoot"
  } catch {
    New-Item -ItemType Junction -Path $localAi -Target $aiRoot -ErrorAction Stop | Out-Null
    Write-Output "Created junction: $localAi -> $aiRoot"
  }
}

$projectGithub = Join-Path $projectPath '.github'
if (!(Test-Path $projectGithub)) {
  New-Item -ItemType Directory -Path $projectGithub | Out-Null
}

$projectCopilot = Join-Path $projectGithub 'copilot-instructions.md'
$content = @"
# Global AI System Injection

This project uses global AI system context and skills from:

- $aiRoot
- Context: $aiRoot/system/context.md
- Registry: $aiRoot/system/skill-registry.json

Execution policy:
- Use semantic skill selection by tags, not manual skill naming.
- Use planner -> researcher -> executor -> reviewer -> optimizer flow.
"@

if (!(Test-Path $projectCopilot)) {
  Set-Content -Path $projectCopilot -Value $content -Encoding UTF8
  Write-Output "Created $projectCopilot"
} else {
  Write-Output "copilot instructions already exist: $projectCopilot"
}