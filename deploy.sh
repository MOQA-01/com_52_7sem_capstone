#!/bin/bash

###############################################################################
# Jal Jeevan Mission - Deployment Script
# Automates deployment to various free hosting platforms
###############################################################################

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║   Jal Jeevan Mission - Deployment Assistant              ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}Initializing git repository...${NC}"
    git init
    git add .
    git commit -m "Initial commit: Jal Jeevan Mission Platform"
    echo -e "${GREEN}✓ Git repository initialized${NC}"
fi

# Deployment options
echo -e "\n${BLUE}Select deployment platform:${NC}"
echo "1. Render.com (Recommended - Full Stack)"
echo "2. Railway.app (Easy Setup)"
echo "3. Vercel (Frontend Only)"
echo "4. GitHub Pages (Static Only)"
echo "5. Create GitHub Repository Only"
echo ""
read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo -e "\n${BLUE}Deploying to Render.com...${NC}"
        echo -e "${YELLOW}Steps:${NC}"
        echo "1. Go to https://render.com and sign up"
        echo "2. Click 'New' → 'Blueprint'"
        echo "3. Connect your GitHub repository"
        echo "4. Render will auto-detect render.yaml"
        echo "5. Wait for deployment (5-10 minutes)"
        echo ""
        echo -e "${GREEN}render.yaml file is already configured!${NC}"
        ;;

    2)
        echo -e "\n${BLUE}Deploying to Railway.app...${NC}"
        echo -e "${YELLOW}Steps:${NC}"
        echo "1. Go to https://railway.app"
        echo "2. Sign up with GitHub"
        echo "3. Click 'New Project' → 'Deploy from GitHub'"
        echo "4. Select your repository"
        echo "5. Add PostgreSQL: New → Database → PostgreSQL"
        echo "6. Configure environment variables"
        ;;

    3)
        echo -e "\n${BLUE}Deploying to Vercel (Frontend)...${NC}"
        if command -v vercel &> /dev/null; then
            echo -e "${GREEN}Vercel CLI detected${NC}"
            vercel --prod
        else
            echo -e "${YELLOW}Install Vercel CLI:${NC}"
            echo "npm install -g vercel"
            echo ""
            echo -e "${YELLOW}Or deploy via web:${NC}"
            echo "1. Go to https://vercel.com"
            echo "2. Import GitHub repository"
            echo "3. Configure and deploy"
        fi
        ;;

    4)
        echo -e "\n${BLUE}Deploying to GitHub Pages...${NC}"
        echo -e "${YELLOW}Note: GitHub Pages only hosts static frontend${NC}"
        echo ""
        echo "1. Push to GitHub (see option 5)"
        echo "2. Go to repository Settings"
        echo "3. Pages → Source → main branch"
        echo "4. Save and wait for deployment"
        ;;

    5)
        echo -e "\n${BLUE}Creating GitHub Repository...${NC}"
        echo ""
        read -p "Enter your GitHub username: " username
        read -p "Enter repository name (default: jal-jeevan-platform): " reponame
        reponame=${reponame:-jal-jeevan-platform}

        echo ""
        echo -e "${YELLOW}Steps to create repository:${NC}"
        echo "1. Go to https://github.com/new"
        echo "2. Repository name: ${reponame}"
        echo "3. Keep it Public"
        echo "4. Don't initialize with README"
        echo "5. Create repository"
        echo ""
        echo -e "${YELLOW}Then run these commands:${NC}"
        echo -e "${GREEN}"
        echo "git remote add origin https://github.com/${username}/${reponame}.git"
        echo "git branch -M main"
        echo "git push -u origin main"
        echo -e "${NC}"

        read -p "Have you created the repository? (y/n): " created
        if [ "$created" = "y" ]; then
            git remote add origin "https://github.com/${username}/${reponame}.git" 2>/dev/null || git remote set-url origin "https://github.com/${username}/${reponame}.git"
            git branch -M main
            git push -u origin main
            echo -e "${GREEN}✓ Pushed to GitHub!${NC}"
        fi
        ;;

    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Deployment configuration complete!                     ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📚 For detailed instructions, see:${NC}"
echo -e "  ${GREEN}FREE_HOSTING_GUIDE.md${NC}"
echo ""
echo -e "${BLUE}🔗 Useful Links:${NC}"
echo "  Render: https://render.com"
echo "  Railway: https://railway.app"
echo "  Vercel: https://vercel.com"
echo "  Fly.io: https://fly.io"
echo ""
