$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path $PSScriptRoot -Parent
$targetRoot = Join-Path $HOME '.ai-system'

Write-Output "Installing global AI system to: $targetRoot"

New-Item -ItemType Directory -Force -Path $targetRoot,$targetRoot\agents,$targetRoot\system,$targetRoot\memory,$targetRoot\scripts,$targetRoot\skills,$targetRoot\tools,$targetRoot\cache | Out-Null

Copy-Item -Path "$repoRoot\agents\*" -Destination "$targetRoot\agents" -Recurse -Force
Copy-Item -Path "$repoRoot\system\*" -Destination "$targetRoot\system" -Recurse -Force
Copy-Item -Path "$repoRoot\memory\shared-memory.json" -Destination "$targetRoot\memory\shared-memory.json" -Force
Copy-Item -Path "$repoRoot\scripts\initialize.ps1" -Destination "$targetRoot\scripts\initialize.ps1" -Force

[Environment]::SetEnvironmentVariable('AI_SYSTEM_PATH', $targetRoot, 'User')
[Environment]::SetEnvironmentVariable('AI_SKILLS_PATH', (Join-Path $targetRoot 'skills'), 'User')

$repos = @(
  @{ group='skills'; url='https://github.com/github/awesome-copilot' },
  @{ group='skills'; url='https://github.com/VoltAgent/awesome-agent-skills' },
  @{ group='skills'; url='https://github.com/sickn33/antigravity-awesome-skills' },
  @{ group='skills'; url='https://github.com/planetscale/database-skills' },
  @{ group='skills'; url='https://github.com/nextlevelbuilder/ui-ux-pro-max-skill' },
  @{ group='tools';  url='https://github.com/browser-use/browser-use' },
  @{ group='tools';  url='https://github.com/remotion-dev/remotion' },
  @{ group='system'; url='https://github.com/groupzer0/vs-code-agents' },
  @{ group='system'; url='https://github.com/anthropics/claude-code' }
)

foreach ($repo in $repos) {
  $name = ($repo.url.Split('/')[-1])
  $base = Join-Path $targetRoot $repo.group
  $dest = Join-Path $base $name
  if (!(Test-Path $dest)) {
    try {
      git clone --depth 1 $repo.url $dest | Out-Null
      Write-Output "cloned: $($repo.url)"
    } catch {
      Write-Output "failed: $($repo.url)"
    }
  }
}

Set-Location (Join-Path $targetRoot 'system')
npm install
node .\init.js --force-refresh

Write-Output "Global AI system installation complete. Restart terminal to pick up env vars."
