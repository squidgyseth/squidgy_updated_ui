# Deployment script for Squidgy - Windows PowerShell version
# RESTRICTED: Only for authorized team members
# Usage: .\deploy-windows.ps1 "commit message" [branch]
# Example: .\deploy-windows.ps1 "fix: update user dashboard" dev

param(
    [Parameter(Mandatory=$true)]
    [string]$CommitMessage,

    [Parameter(Mandatory=$false)]
    [string]$Branch
)

# Configuration
$DEPLOY_EMAIL = "development@squidgy.ai"
$DEPLOY_NAME = "Squidgy-Development"

# Security: Only allow authorized users to use this script
$ALLOWED_EMAILS = @("farzin.mag@gmail.com", "sa@squidgy.ai")

# Check current user
$CURRENT_EMAIL = git config user.email 2>$null

if ($CURRENT_EMAIL -notin $ALLOWED_EMAILS) {
    Write-Host "[X] Access Denied" -ForegroundColor Red
    Write-Host ""
    Write-Host "This deployment script is restricted to authorized team members only."
    Write-Host "Your email: $CURRENT_EMAIL"
    Write-Host "Allowed emails: $($ALLOWED_EMAILS -join ', ')"
    Write-Host ""
    Write-Host "Please set your git email to one of the allowed emails:"
    Write-Host "  git config user.email `"your-authorized-email`""
    exit 1
}

Write-Host "[OK] User verified: $CURRENT_EMAIL" -ForegroundColor Green
Write-Host ""

# Get current branch if not specified
if (-not $Branch) {
    $Branch = git branch --show-current
}

Write-Host "[>>] Starting deployment process..." -ForegroundColor Yellow
Write-Host "Branch: $Branch"
Write-Host "Commit: $CommitMessage"
Write-Host ""

# Save current git config
Write-Host "[*] Saving current git configuration..." -ForegroundColor Yellow
$ORIGINAL_EMAIL = git config user.email 2>$null
$ORIGINAL_NAME = git config user.name 2>$null

# Function to restore original config
function Restore-GitConfig {
    Write-Host "[*] Restoring original git configuration..." -ForegroundColor Yellow
    if ($ORIGINAL_EMAIL) {
        git config user.email "$ORIGINAL_EMAIL"
    } else {
        git config --unset user.email 2>$null
    }
    if ($ORIGINAL_NAME) {
        git config user.name "$ORIGINAL_NAME"
    } else {
        git config --unset user.name 2>$null
    }
}

try {
    # Set deployment email
    Write-Host "[*] Setting deployment credentials..." -ForegroundColor Yellow
    git config user.email "$DEPLOY_EMAIL"
    git config user.name "$DEPLOY_NAME"

    # Check for uncommitted changes
    git diff-index --quiet HEAD -- 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[*] Staging changes..." -ForegroundColor Yellow
        git add .

        Write-Host "[*] Committing changes..." -ForegroundColor Yellow
        $fullCommitMessage = "$CommitMessage`n`nCo-Authored-By: $DEPLOY_NAME <$DEPLOY_EMAIL>"
        git commit -m $fullCommitMessage
    } else {
        Write-Host "[!] No changes detected - creating dummy commit to trigger build..." -ForegroundColor Yellow
        
        # Create or update LAST_UPDATED.txt with current timestamp
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        Set-Content -Path "LAST_UPDATED.txt" -Value "Last deployment: $timestamp"
        
        git add LAST_UPDATED.txt
        $fullCommitMessage = "$CommitMessage`n`nCo-Authored-By: $DEPLOY_NAME <$DEPLOY_EMAIL>"
        git commit -m $fullCommitMessage
        
        Write-Host "[OK] Dummy commit created" -ForegroundColor Green
    }

    # Pull latest changes
    Write-Host "[*] Pulling latest changes from remote..." -ForegroundColor Yellow
    git pull origin $Branch --rebase
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[X] Pull failed - please resolve conflicts manually" -ForegroundColor Red
        exit 1
    }

    # Push to remote
    Write-Host "[*] Pushing to remote..." -ForegroundColor Yellow
    git push origin $Branch
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[X] Push failed" -ForegroundColor Red
        exit 1
    }

    Write-Host ""
    Write-Host "[OK] Deployment successful!" -ForegroundColor Green
    Write-Host "[>>] Changes pushed to $Branch - Vercel will auto-deploy" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your original git config has been restored:"
    Write-Host "  Email: $ORIGINAL_EMAIL"
    Write-Host "  Name: $ORIGINAL_NAME"
}
finally {
    # Always restore config, even on error
    Restore-GitConfig
}
