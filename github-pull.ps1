#!/usr/bin/env pwsh

# GitHub Pull Update Script
# Features: Pull latest code from GitHub, support SSH authentication

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

# Info output
function Show-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Show-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

# Check Git availability
function Check-Git {
    Show-Info "Checking Git environment..."
    try {
        $gitVersion = git --version
        Show-Success "Git found: $gitVersion"
    } catch {
        Show-Error "Git not installed or not in PATH"
    }
}

# Pull latest code from GitHub
function Pull-From-GitHub {
    Show-Info "Starting to pull updates from GitHub..."
    
    # Change to project directory
    Set-Location -Path $PROJECT_DIR
    
    # Check if current directory is a Git repo
    if (-not (Test-Path ".git")) {
        Show-Error "Current directory is not a Git repository"
    }
    
    # Check Git status before pull
    Show-Info "Checking current Git status..."
    $gitStatus = git status
    Show-Info "Git status: $gitStatus"
    
    # Fetch latest changes
    Show-Info "Fetching latest changes..."
    git fetch origin
    
    # Check if local has changes that might cause conflicts
    $hasChanges = git status --porcelain | Where-Object { $_ -match '^(M|A|D|R|C|U)' }
    if ($hasChanges) {
        Show-Info "Local changes detected, trying to stash..."
        git stash push -m "Auto-stash before pull"
        Show-Success "Changes stashed successfully"
    }
    
    # Pull latest code
    Show-Info "Pulling latest code from origin/main..."
    $pullResult = git pull origin main
    
    # Check if pull was successful
    if ($LASTEXITCODE -eq 0) {
        Show-Success "Successfully pulled latest updates!"
        Show-Info "Pull result: $pullResult"
        
        # If we stashed changes, show a message about it
        if ($hasChanges) {
            Show-Info "Note: You have stashed changes. Use 'git stash pop' to restore them."
        }
        
        return $true
    } else {
        Show-Error "Failed to pull updates: $pullResult"
        return $false
    }
}

# Main function
function Main {
    Clear-Host
    Show-Info "=== GitHub Pull Update Script ==="
    Show-Info "Project: bubuchat"
    Show-Info "Repo: $GITHUB_REPO"
    Show-Info "Directory: $PROJECT_DIR"
    Show-Info ""
    
    # Check Git
    Check-Git
    
    # Pull updates
    Pull-From-GitHub
    
    Show-Info ""
    Show-Success "Pull update process completed!"
}

# Execute main function
Main
