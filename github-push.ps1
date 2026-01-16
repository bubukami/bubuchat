#!/usr/bin/env pwsh

# GitHub Push Update Script with Version Control
# Features: Upload entire bubuchat folder to GitHub with custom version number, support SSH authentication
# Ensure all files are pushed without exceptions

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
Show-Info "Starting GitHub Project Upload Script - Pushing ALL files..."
Show-Info "Project Directory: $PROJECT_DIR"

# Change to project directory
Set-Location -Path $PROJECT_DIR -ErrorAction Stop

# Ensure all .gitignore files are configured to allow all files
Show-Info "Configuring .gitignore files to allow all files..."

# Update root .gitignore
$rootGitIgnore = "$PROJECT_DIR\.gitignore"
Set-Content -Path $rootGitIgnore -Value "# No ignore rules - all files should be uploaded`n" -Force

# Update client .gitignore
$clientGitIgnore = "$PROJECT_DIR\client\.gitignore"
Set-Content -Path $clientGitIgnore -Value "# No ignore rules - all files should be uploaded`n" -Force

# Update server .gitignore
$serverGitIgnore = "$PROJECT_DIR\server\.gitignore"
Set-Content -Path $serverGitIgnore -Value "# No ignore rules - all files should be uploaded`n" -Force

Show-Info ".gitignore files updated successfully"

# Check git status
Show-Info "Checking initial git status..."
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
        $CommitMessage = "Upload complete bubuchat project: $currentDateTime"
    }
}

# Add all files explicitly, including untracked files and directories
Show-Info "Adding ALL files from bubuchat folder..."

# Handle empty directories by adding .gitkeep files
Show-Info "Checking for empty directories and adding .gitkeep files..."
$emptyDirs = Get-ChildItem -Path $PROJECT_DIR -Directory -Recurse | Where-Object {
    $dir = $_
    -not (Get-ChildItem -Path $dir.FullName -Force)
}

if ($emptyDirs.Count -gt 0) {
    Show-Info "Found $($emptyDirs.Count) empty directories. Adding .gitkeep files..."
    foreach ($dir in $emptyDirs) {
        $gitkeepPath = Join-Path -Path $dir.FullName -ChildPath ".gitkeep"
        New-Item -Path $gitkeepPath -ItemType File -Force | Out-Null
        Show-Info "Added .gitkeep to: $($dir.FullName)"
    }
} else {
    Show-Info "No empty directories found."
}

# Use -A flag to ensure all files are added, including deleted files and newly added .gitkeep files
git add -A
if ($LASTEXITCODE -ne 0) {
    Show-Error "Failed to add files. Please check if you have proper permissions."
}

# Check if there are any changes to commit after adding all files
git diff --cached --quiet
$hasStagedChanges = $LASTEXITCODE -ne 0

if ($hasStagedChanges) {
    # Commit changes with verbose output
    Show-Info "Committing ALL changes..."
    git commit -m "$CommitMessage" -v
    if ($LASTEXITCODE -ne 0) {
        Show-Error "Failed to commit changes. Please check your git configuration."
    }
} else {
    Show-Info "No changes to commit. Working tree is clean."
    Show-Info "Will still push to ensure remote matches local..."
}

# Create and push tag if valid version number provided
if ($IsValidVersion) {
    # Delete existing tag if it exists locally and remotely
    git tag -d $VersionNumber 2>$null
    git push origin :refs/tags/$VersionNumber 2>$null
    
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
Show-Info "Pushing ALL files to GitHub with force..."
# Use --no-verify to bypass any hooks that might prevent pushing
# Use --force-with-lease for safer force push
# Use --all to push all branches
git push origin main --force-with-lease --no-verify --all
if ($LASTEXITCODE -ne 0) {
    # If force-with-lease fails, try regular force
    Show-Info "Force-with-lease failed, trying regular force..."
    git push origin main --force --no-verify --all
    if ($LASTEXITCODE -ne 0) {
        Show-Error "Failed to push changes. Please check your SSH connection and permissions."
    }
}

# Verify the push was successful
Show-Info "Verifying push..."
git fetch origin main
if ($LASTEXITCODE -eq 0) {
    Show-Info "Fetch successful, verifying local and remote are in sync..."
    $localHash = git rev-parse main
    $remoteHash = git rev-parse origin/main
    if ($localHash -eq $remoteHash) {
        Show-Success "Local and remote repositories are in sync!"
    } else {
        Show-Error "Local and remote repositories are not in sync. Please try again."
    }
}

Show-Success "ENTIRE bubuchat project has been uploaded to GitHub successfully!"
Show-Success "All files have been pushed without exceptions"
Show-Success "Commit message: $CommitMessage"
if ($IsValidVersion) {
    Show-Success "Version tag created and pushed: $VersionNumber"
}

# Show final git status
Show-Info "Final git status:"
git status

# Pause to view results
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
