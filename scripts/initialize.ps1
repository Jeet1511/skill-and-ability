$ErrorActionPreference = 'Stop'

$aiRoot = if ($env:AI_SYSTEM_PATH) { $env:AI_SYSTEM_PATH } else { Join-Path $HOME '.ai-system' }
Set-Location (Join-Path $aiRoot 'system')
node .\init.js --force-refresh