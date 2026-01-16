#!/usr/bin/env pwsh

# GitHub Consistency Check Script
# Features: Check consistency between local files and GitHub repository

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

function Show-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Show-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

# Main script
Show-Info "Starting GitHub Consistency Check..."
Show-Info "Project Directory: $PROJECT_DIR"

# Change to project directory
Set-Location -Path $PROJECT_DIR -ErrorAction Stop

# Update local repository with latest changes from GitHub
Show-Info "Fetching latest changes from GitHub..."
git fetch origin
if ($LASTEXITCODE -ne 0) {
    Show-Error "Failed to fetch changes from GitHub. Please check your SSH connection."
}

# Check if local branch is ahead, behind, or diverged
Show-Info "Checking branch status..."
$localHash = git rev-parse main
$remoteHash = git rev-parse origin/main

if ($localHash -eq $remoteHash) {
    Show-Success "Local and remote main branches are identical!"
} else {
    # Find common ancestor
    $commonAncestor = git merge-base main origin/main
    
    if ($localHash -eq $commonAncestor) {
        Show-Warning "Local main branch is behind remote by $((git rev-list --count $localHash..$remoteHash)) commits."
    } elseif ($remoteHash -eq $commonAncestor) {
        Show-Warning "Local main branch is ahead of remote by $((git rev-list --count $remoteHash..$localHash)) commits."
    } else {
        Show-Warning "Local and remote main branches have diverged."
        Show-Warning "Local has $((git rev-list --count $commonAncestor..$localHash)) unique commits."
        Show-Warning "Remote has $((git rev-list --count $commonAncestor..$remoteHash)) unique commits."
    }
}

# List files that are different between local and remote
Show-Info "Listing files with differences between local and remote..."
$diffFiles = git diff --name-only origin/main main

if ($diffFiles) {
    Show-Warning "Found $($diffFiles.Count) files with differences:"
    foreach ($file in $diffFiles) {
        Write-Host "  - $file" -ForegroundColor Yellow
    }
    
    # Show detailed diff for each file (optional)
    $showDetails = Read-Host "Do you want to see detailed diff for each file? (y/n)"
    if ($showDetails -eq "y" -or $showDetails -eq "Y") {
        foreach ($file in $diffFiles) {
            Write-Host "`n=== Detailed diff for $file ===" -ForegroundColor White
            git diff origin/main main -- $file
        }
    }
} else {
    Show-Success "No file differences found between local and remote!"
}

# Check for untracked files
Show-Info "Checking for untracked files..."
$untrackedFiles = git ls-files --others --exclude-standard

if ($untrackedFiles) {
    Show-Warning "Found $($untrackedFiles.Count) untracked files:"
    foreach ($file in $untrackedFiles) {
        Write-Host "  - $file" -ForegroundColor Yellow
    }
} else {
    Show-Success "No untracked files found!"
}

# Check for local files that are not in remote (using a different approach)
Show-Info "Checking for local files not in remote..."
$localFiles = git ls-files --cached --others --exclude-standard | Sort-Object

# Get remote files by using git show to list files in remote branch
$remoteFiles = git ls-tree -r --name-only origin/main | Sort-Object

if ($remoteFiles) {
    $localOnlyFiles = Compare-Object -ReferenceObject $localFiles -DifferenceObject $remoteFiles -PassThru | Where-Object {$_.SideIndicator -eq "<="}
    
    if ($localOnlyFiles) {
        Show-Warning "Found $($localOnlyFiles.Count) files that exist locally but not in remote:"
        foreach ($file in $localOnlyFiles) {
            Write-Host "  - $file" -ForegroundColor Yellow
        }
    } else {
        Show-Success "All local files are also in remote!"
    }
    
    # Check for remote files that are not in local
    $remoteOnlyFiles = Compare-Object -ReferenceObject $localFiles -DifferenceObject $remoteFiles -PassThru | Where-Object {$_.SideIndicator -eq "=>="}
    
    if ($remoteOnlyFiles) {
        Show-Warning "Found $($remoteOnlyFiles.Count) files that exist in remote but not locally:"
        foreach ($file in $remoteOnlyFiles) {
            Write-Host "  - $file" -ForegroundColor Yellow
        }
    } else {
        Show-Success "All remote files are also locally!"
    }
} else {
    Show-Warning "Could not retrieve remote files list. Skipping this check."
    Show-Success "All local files are assumed to be in remote!"
    Show-Success "All remote files are assumed to be locally!"
}

Show-Info "Consistency check completed!"
Show-Info "Summary:";
$branchStatus = if ($localHash -eq $remoteHash) { "Identical" } else { "Different" }
Show-Info "- Local and remote branches: $branchStatus"
Show-Info "- Files with differences: $($diffFiles.Count)"
Show-Info "- Untracked files: $($untrackedFiles.Count)"
Show-Info "- Local-only files: $($localOnlyFiles.Count)"
Show-Info "- Remote-only files: $($remoteOnlyFiles.Count)"

# Pause to view results
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')