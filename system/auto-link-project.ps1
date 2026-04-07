param(
  [string]$Path = (Get-Location).Path
)

$aiRoot = if ($env:AI_SYSTEM_PATH) { $env:AI_SYSTEM_PATH } else { Join-Path $HOME '.ai-system' }
$target = Join-Path $Path '.ai'

if (Test-Path $target) {
  return
}

try {
  New-Item -ItemType SymbolicLink -Path $target -Target $aiRoot -ErrorAction Stop | Out-Null
} catch {
  try {
    New-Item -ItemType Junction -Path $target -Target $aiRoot -ErrorAction Stop | Out-Null
  } catch {
    Write-Verbose "Unable to link $target"
  }
}