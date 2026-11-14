# Publish a website release: pack the Estella web export and create a GitHub release with it.
# The release triggers .github/workflows/release-image.yml, which builds and publishes the Docker image.
#
#   1. In Estella: Build -> Package Project -> Web, output dist/web
#   2. .\scripts\release.ps1 v1.0.0 "What changed"
param(
    [Parameter(Mandatory = $true)][string]$Version,
    [string]$Notes = "Website release $Version",
    [string]$Repo = "Shadowpasha/MSP-Martian-Space-Program"
)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$web = Join-Path $root "dist/web"
if (-not (Test-Path (Join-Path $web "index.html"))) {
    throw "No web export in dist/web. In Estella: Build -> Package Project -> Web, output dist/web."
}
$archive = Join-Path $root "dist/msp-web.tar.gz"
if (Test-Path $archive) { Remove-Item $archive }
# Windows' own tar (bsdtar, Windows 10 and later), not Git's: Git's tar reads "C:\..." as a remote host.
# It keeps forward slashes, so Linux unpacks the archive cleanly.
& (Join-Path $env:SystemRoot "System32/tar.exe") -czf $archive -C $web .
if ($LASTEXITCODE -ne 0) { throw "tar failed" }

$commit = (git -C $root rev-parse HEAD).Trim()
# The release is tagged on this commit, so it must already be on the team repo's main branch.
git -C $root fetch origin main --quiet
git -C $root merge-base --is-ancestor $commit origin/main
if ($LASTEXITCODE -ne 0) { throw "This commit is not on main yet. Check out main and pull: git checkout main; git pull origin main" }
gh release create $Version $archive --repo $Repo --target $commit --title "MSP $Version" --notes $Notes
if ($LASTEXITCODE -ne 0) { throw "gh release create failed" }
Write-Host "Released $Version. The image builds in GitHub Actions: https://github.com/$Repo/actions"
