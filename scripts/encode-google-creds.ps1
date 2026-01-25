<#
.SYNOPSIS
  Base64-encode a Google service-account JSON and copy to clipboard.

.DESCRIPTION
  Reads a JSON key file, encodes it as a single-line base64 string,
  and copies it to the Windows clipboard. Use the -NoClip switch to
  print the base64 to stdout instead (useful for CI or piping).

.EXAMPLE
  ./scripts/encode-google-creds.ps1 -File gradeai-credentials.json

.EXAMPLE (no clipboard)
  ./scripts/encode-google-creds.ps1 -File gradeai-credentials.json -NoClip

#>

param(
  [string]$File = "gradeai-credentials.json",
  [switch]$NoClip
)

# Detect CI environments and refuse to print secrets in CI logs
$isCI = $false
if ($env:CI -or $env:GITHUB_ACTIONS -or $env:VERCEL -or $env:GITLAB_CI) {
  $isCI = $true
}

if (-not (Test-Path $File)) {
  Write-Error "File '$File' not found."
  exit 1
}

try {
  $content = Get-Content -Raw -Encoding UTF8 -Path $File
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($content)
  $b64 = [Convert]::ToBase64String($bytes)

  if ($NoClip) {
    if ($isCI) {
      Write-Error "Refusing to print secrets in CI. Use secure environment variables instead."
      exit 1
    }
    Write-Output $b64
  } else {
    try {
      Set-Clipboard -Value $b64
      Write-Output "Base64-encoded credentials copied to clipboard."
    } catch {
      if ($isCI) {
        Write-Error "No clipboard available in CI; refusing to emit secrets to logs."
        exit 1
      }
      # Fallback to printing only when not in CI
      Write-Warning "No clipboard available; printing base64 to stdout."
      Write-Output $b64
    }
  }
} catch {
  Write-Error "Failed to encode/copy credentials: $_"
  exit 1
}
