#!/usr/bin/env pwsh

# GitHub Push Update Script with Version Control
# Features: Commit and push changes to GitHub with custom version number, support SSH authentication

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
Show-Info "Starting GitHub Push Script with Version Control..."
Show-Info "Project Directory: $PROJECT_DIR"

# Change to project directory
Set-Location -Path $PROJECT_DIR -ErrorAction Stop

# Check git status
Show-Info "Checking git status..."
git status

# Prompt for custom version number
$VersionNumber = Read-Host "Enter version number (e.g., v1.0.0 or 1.0.0, press Enter to skip versioning)"

# Validate version number format
$VersionPattern = '^v?\d+\.\d+\.\d+$'
$IsValidVersion = $false

if (-not [string]::IsNullOrEmpty($VersionNumber)) {
    if ($VersionNumber -match $VersionPattern) {
        $IsValidVersion = $true
        # Add 'v' prefix if not present
        if ($VersionNumber -notlike 'v*') {
            $VersionNumber = "v$VersionNumber"
        }
        Show-Info "Valid version number: $VersionNumber"
    } else {
        Show-Error "Invalid version number format. Please use format like 'v1.0.0' or '1.0.0'"
    }
}

# Prompt for commit message
$CommitMessage = Read-Host "Enter commit message (press Enter to use default message)"
if ([string]::IsNullOrEmpty($CommitMessage)) {
    if ($IsValidVersion) {
        $currentDate = Get-Date -Format 'yyyy-MM-dd'
        $CommitMessage = "Release version ${VersionNumber}: $currentDate"
    } else {
        $currentDateTime = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
        $CommitMessage = "Update: $currentDateTime"
    }
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

# Create and push tag if valid version number provided
if ($IsValidVersion) {
    Show-Info "Creating git tag for version $VersionNumber..."
    git tag $VersionNumber
    if ($LASTEXITCODE -ne 0) {
        Show-Error "Failed to create git tag"
    }
    
    Show-Info "Pushing git tag to GitHub..."
    git push origin $VersionNumber
    if ($LASTEXITCODE -ne 0) {
        Show-Error "Failed to push git tag"
    }
}

# Push changes with force to override remote changes
git push origin main --force
if ($LASTEXITCODE -ne 0) {
    Show-Error "Failed to push changes"
}

Show-Success "All changes have been pushed to GitHub successfully!"
Show-Success "Commit message: $CommitMessage"
if ($IsValidVersion) {
    Show-Success "Version tag created: $VersionNumber"
    Show-Success "Version tag pushed to GitHub"
}

# Pause to view results
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
