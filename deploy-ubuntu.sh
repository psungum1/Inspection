#!/bin/bash

# Deployment Script for Ubuntu Desktop 24
# Inspection System - PQMS Backend & React Frontend

set -e  # Exit on any error

echo "🚀 Starting deployment to Ubuntu Desktop 24..."
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root. Please run as a regular user with sudo privileges."
   exit 1
fi

# Check if git is installed
if ! command -v git &> /dev/null; then
    print_error "Git is not installed. Please install git first: sudo apt install git -y"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first:"
    echo "curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -"
    echo "sudo apt-get install -y nodejs"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_status "System requirements check passed ✓"

# Configuration
PROJECT_NAME="inspection"
PROJECT_DIR="/var/www/$PROJECT_NAME"
REPO_URL="https://github.com/psungum1/Inspection.git"
BRANCH="master"

print_status "Deploying to: $PROJECT_DIR"
print_status "Repository: $REPO_URL"
print_status "Branch: $BRANCH"

# Create project directory if it doesn't exist
if [ ! -d "$PROJECT_DIR" ]; then
    print_status "Creating project directory..."
    sudo mkdir -p "$PROJECT_DIR"
    sudo chown $USER:$USER "$PROJECT_DIR"
    print_success "Project directory created: $PROJECT_DIR"
else
    print_status "Project directory already exists: $PROJECT_DIR"
fi

# Navigate to project directory
cd "$PROJECT_DIR"

# Check if git repository exists
if [ ! -d ".git" ]; then
    print_status "Cloning repository..."
    git clone "$REPO_URL" .
    print_success "Repository cloned successfully"
else
    print_status "Repository already exists, pulling latest changes..."
    git fetch origin
    git reset --hard origin/$BRANCH
    print_success "Repository updated to latest version"
fi

# Install frontend dependencies
print_status "Installing frontend dependencies..."
npm install
print_success "Frontend dependencies installed"

# Build frontend
print_status "Building frontend..."
npm run build
print_success "Frontend built successfully"

# Install backend dependencies
print_status "Installing backend dependencies..."
cd server
npm install
cd ..
print_success "Backend dependencies installed"

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    print_status "Installing PM2 globally..."
    sudo npm install -g pm2
    print_success "PM2 installed"
fi

# Create PM2 log directory
sudo mkdir -p /var/log/pm2
sudo chown $USER:$USER /var/log/pm2

# Start/restart PM2 process
print_status "Starting PM2 process..."
if pm2 list | grep -q "pqms-backend"; then
    print_status "Restarting existing PM2 process..."
    pm2 restart pqms-backend
else
    print_status "Starting new PM2 process..."
    pm2 start ecosystem.config.js
fi

# Save PM2 configuration
pm2 save
pm2 startup

print_success "PM2 process started and configured"

# Check if Nginx is installed and running
if command -v nginx &> /dev/null; then
    print_status "Nginx detected, checking configuration..."
    
    # Create Nginx configuration
    NGINX_CONF="/etc/nginx/sites-available/$PROJECT_NAME"
    NGINX_ENABLED="/etc/nginx/sites-enabled/$PROJECT_NAME"
    
    if [ ! -f "$NGINX_CONF" ]; then
        print_status "Creating Nginx configuration..."
        sudo tee "$NGINX_CONF" > /dev/null <<EOF
server {
    listen 80;
    server_name localhost;
    
    # Frontend static files
    location / {
        root $PROJECT_DIR/dist;
        try_files \$uri \$uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
    
    # Backend API proxy
    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # WebSocket support
    location /ws {
        proxy_pass http://localhost:3001/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
    }
}
EOF
        print_success "Nginx configuration created"
    fi
    
    # Enable site if not already enabled
    if [ ! -L "$NGINX_ENABLED" ]; then
        print_status "Enabling Nginx site..."
        sudo ln -s "$NGINX_CONF" "$NGINX_ENABLED"
        print_success "Nginx site enabled"
    fi
    
    # Test Nginx configuration
    if sudo nginx -t; then
        print_status "Reloading Nginx..."
        sudo systemctl reload nginx
        print_success "Nginx reloaded successfully"
    else
        print_warning "Nginx configuration test failed, please check manually"
    fi
else
    print_warning "Nginx not detected. Please install and configure Nginx manually for production use."
fi

# Display deployment summary
echo ""
echo "================================================"
print_success "Deployment completed successfully! 🎉"
echo "================================================"
echo ""
echo "📋 Deployment Summary:"
echo "   • Project: $PROJECT_NAME"
echo "   • Directory: $PROJECT_DIR"
echo "   • Frontend: Built and ready"
echo "   • Backend: Running on port 3001"
echo "   • PM2: Process managed and auto-start enabled"
echo ""
echo "🌐 Access your application:"
echo "   • Frontend: http://localhost"
echo "   • Backend API: http://localhost:3001"
echo "   • WebSocket: ws://localhost/ws"
echo ""
echo "📊 PM2 Status:"
pm2 list
echo ""
echo "📝 Useful commands:"
echo "   • View logs: pm2 logs pqms-backend"
echo "   • Restart: pm2 restart pqms-backend"
echo "   • Stop: pm2 stop pqms-backend"
echo "   • Monitor: pm2 monit"
echo ""
print_success "Your Inspection system is now deployed and running! 🚀"
