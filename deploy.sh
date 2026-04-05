#!/bin/bash

# Deployment script for Squidgy - Automatically uses shared email for deployment commits
# RESTRICTED: Only for Farzin's use
# Usage: ./deploy.sh "commit message" [branch]
# Example: ./deploy.sh "fix: update user dashboard" dev

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DEPLOY_EMAIL="development@squidgy.ai"
DEPLOY_NAME="Squidgy-Development"

# Security: Only allow Farzin to use this script
ALLOWED_EMAIL="farzin.mag@gmail.com"
ALLOWED_GITHUB_USER="Farzinkh"

# Check current user
CURRENT_EMAIL=$(git config user.email || echo "")

if [ "$CURRENT_EMAIL" != "$ALLOWED_EMAIL" ]; then
    echo -e "${RED}❌ Access Denied${NC}"
    echo ""
    echo "This deployment script is restricted to Farzin only."
    echo "Expected email: $ALLOWED_EMAIL"
    echo "Your email: $CURRENT_EMAIL"
    echo ""
    echo "If you're Farzin, please set your git email:"
    echo "  git config user.email \"$ALLOWED_EMAIL\""
    exit 1
fi

echo -e "${GREEN}✅ User verified: $ALLOWED_GITHUB_USER${NC}"
echo ""

# Check if commit message is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Commit message required${NC}"
    echo "Usage: ./deploy.sh \"commit message\" [branch]"
    echo "Example: ./deploy.sh \"fix: update dashboard\" dev"
    exit 1
fi

COMMIT_MESSAGE="$1"
BRANCH="${2:-$(git branch --show-current)}"  # Use provided branch or current branch

echo -e "${YELLOW}🚀 Starting deployment process...${NC}"
echo "Branch: $BRANCH"
echo "Commit: $COMMIT_MESSAGE"
echo ""

# Save current git config
echo -e "${YELLOW}📝 Saving current git configuration...${NC}"
ORIGINAL_EMAIL=$(git config user.email || echo "")
ORIGINAL_NAME=$(git config user.name || echo "")

# Function to restore original config
restore_config() {
    echo -e "${YELLOW}🔄 Restoring original git configuration...${NC}"
    if [ -n "$ORIGINAL_EMAIL" ]; then
        git config user.email "$ORIGINAL_EMAIL"
    else
        git config --unset user.email || true
    fi
    if [ -n "$ORIGINAL_NAME" ]; then
        git config user.name "$ORIGINAL_NAME"
    else
        git config --unset user.name || true
    fi
}

# Trap to ensure config is restored even on error
trap restore_config EXIT

# Set deployment email
echo -e "${YELLOW}🔧 Setting deployment credentials...${NC}"
git config user.email "$DEPLOY_EMAIL"
git config user.name "$DEPLOY_NAME"

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo -e "${YELLOW}📦 Staging changes...${NC}"
    git add .

    echo -e "${YELLOW}💾 Committing changes...${NC}"
    git commit -m "$COMMIT_MESSAGE

Co-Authored-By: $DEPLOY_NAME <$DEPLOY_EMAIL>"
else
    echo -e "${YELLOW}⚠️  No changes to commit${NC}"
fi

# Pull latest changes
echo -e "${YELLOW}⬇️  Pulling latest changes from remote...${NC}"
git pull origin "$BRANCH" --rebase || {
    echo -e "${RED}❌ Pull failed - please resolve conflicts manually${NC}"
    exit 1
}

# Push to remote
echo -e "${YELLOW}⬆️  Pushing to remote...${NC}"
git push origin "$BRANCH" || {
    echo -e "${RED}❌ Push failed${NC}"
    exit 1
}

echo ""
echo -e "${GREEN}✅ Deployment successful!${NC}"
echo -e "${GREEN}🎉 Changes pushed to $BRANCH - Vercel will auto-deploy${NC}"
echo ""
echo "Your original git config has been restored:"
echo "  Email: $ORIGINAL_EMAIL"
echo "  Name: $ORIGINAL_NAME"
