#!/usr/bin/env pwsh

# GitHub Push Update Script
# Features: Commit and push changes to GitHub, support SSH authentication

# Configuration
$GITHUB_REPO = "git@github.com:bubukami/bubuchat.git"
$PROJECT_DIR = "$PSScriptRoot"

# Set execution policy
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force -ErrorAction SilentlyContinue

# Error handling
function Show-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
    exit 1
}

function Show-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Show-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

# Main script
Show-Info "Starting GitHub Push Script..."
Show-Info "Project Directory: $PROJECT_DIR"

# Change to project directory
Set-Location -Path $PROJECT_DIR -ErrorAction Stop

# Check git status
Show-Info "Checking git status..."
git status

# Prompt for commit message
$CommitMessage = Read-Host "Enter commit message (press Enter to use default message)"
if ([string]::IsNullOrEmpty($CommitMessage)) {
    $CommitMessage = "Update: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
}

# Add all changes
git add .
if ($LASTEXITCODE -ne 0) {
    Show-Error "Failed to add changes"
}

# Commit changes
git commit -m "$CommitMessage"
if ($LASTEXITCODE -ne 0) {
    Show-Error "Failed to commit changes"
}

# Push changes
git push origin main
if ($LASTEXITCODE -ne 0) {
    Show-Error "Failed to push changes"
}

Show-Success "All changes have been pushed to GitHub successfully!"
Show-Success "Commit message: $CommitMessage"

# Pause to view results
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
