#!/usr/bin/env pwsh

# GitHub Push Update Script with Version Control
# Features: Upload entire project to GitHub with custom version number, support SSH authentication

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
Show-Info "Starting GitHub Project Upload Script with Version Control..."
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
        $CommitMessage = "Upload complete project: $currentDateTime"
    }
}

# Always add all files (including new/untracked files)
Show-Info "Adding all files (including new/untracked files)..."
git add .
if ($LASTEXITCODE -ne 0) {
    Show-Error "Failed to add files"
}

# Check if there are any changes to commit after adding all files
git diff --cached --quiet
$hasStagedChanges = $LASTEXITCODE -ne 0

if ($hasStagedChanges) {
    # Commit changes
    Show-Info "Committing changes..."
    git commit -m "$CommitMessage"
    if ($LASTEXITCODE -ne 0) {
        Show-Error "Failed to commit changes"
    }
} else {
    Show-Info "No changes to commit. Working tree is clean."
    Show-Info "Will still push to ensure remote matches local..."
}

# Create and push tag if valid version number provided
if ($IsValidVersion) {
    # Delete existing tag if it exists locally
    git tag -d $VersionNumber 2>$null
    
    Show-Info "Creating git tag for version $VersionNumber..."
    git tag $VersionNumber
    if ($LASTEXITCODE -ne 0) {
        Show-Error "Failed to create git tag"
    }
    
    Show-Info "Pushing git tag to GitHub..."
    git push origin $VersionNumber --force
    if ($LASTEXITCODE -ne 0) {
        Show-Error "Failed to push git tag"
    }
}

# Push changes with force to override remote changes
Show-Info "Pushing entire project to GitHub with force..."
git push origin main --force
if ($LASTEXITCODE -ne 0) {
    Show-Error "Failed to push changes"
}

Show-Success "Entire project has been uploaded to GitHub successfully!"
Show-Success "Commit message: $CommitMessage"
if ($IsValidVersion) {
    Show-Success "Version tag created and pushed: $VersionNumber"
}

# Pause to view results
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
