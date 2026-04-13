#!/bin/bash

# Deployment script for Squidgy - Automatically uses shared email for deployment commits
# RESTRICTED: staging/main only for authorized users, dev branch open to all
# Usage: ./deploy-mac.sh "commit message" [branch]
# Example: ./deploy-mac.sh "fix: update user dashboard" dev

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DEPLOY_EMAIL="development@squidgy.ai"
DEPLOY_NAME="Squidgy-Development"

# Security: Authorized users for staging/main branches
AUTHORIZED_EMAILS=("farzin.mag@gmail.com" "sa@squidgy.ai")

# Check if commit message is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Commit message required${NC}"
    echo "Usage: ./deploy-mac.sh \"commit message\" [branch]"
    echo "Example: ./deploy-mac.sh \"fix: update dashboard\" dev"
    exit 1
fi

COMMIT_MESSAGE="$1"
BRANCH="${2:-$(git branch --show-current)}"  # Use provided branch or current branch

# Check current user
CURRENT_EMAIL=$(git config user.email || echo "")

# Check authorization based on branch
if [ "$BRANCH" = "staging" ] || [ "$BRANCH" = "main" ] || [ "$BRANCH" = "main_render" ]; then
    # For staging/main/main_render: Only authorized users
    AUTHORIZED=false
    for email in "${AUTHORIZED_EMAILS[@]}"; do
        if [ "$CURRENT_EMAIL" = "$email" ]; then
            AUTHORIZED=true
            break
        fi
    done

    if [ "$AUTHORIZED" = false ]; then
        echo -e "${RED}❌ Access Denied${NC}"
        echo ""
        echo "Deployment to '$BRANCH' branch is restricted to authorized team members only."
        echo "Your email: $CURRENT_EMAIL"
        echo "Allowed emails: ${AUTHORIZED_EMAILS[*]}"
        echo ""
        echo "Note: You can deploy to 'dev' branch without restrictions."
        exit 1
    fi
    echo -e "${GREEN}✅ User verified for $BRANCH: $CURRENT_EMAIL${NC}"
else
    # For dev and other branches: Anyone can deploy
    echo -e "${GREEN}✅ Deploying to $BRANCH branch: $CURRENT_EMAIL${NC}"
fi

echo ""

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

# Create or update LAST_UPDATED.txt for all branches
if [ ! -f "LAST_UPDATED.txt" ]; then
    echo -e "${YELLOW}📄 Creating LAST_UPDATED.txt...${NC}"
fi
echo -e "${YELLOW}📝 Updating deployment timestamp...${NC}"
echo "Last deployment: $(date '+%Y-%m-%d %H:%M:%S')" > LAST_UPDATED.txt

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
